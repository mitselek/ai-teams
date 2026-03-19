// (*CD:Babbage*)
// TunnelManager — manages persistent mTLS tunnels to peer daemons.
// One TlsClient per peer, exponential backoff reconnect, per-peer outbound queue,
// heartbeat sender, dead-connection detection, ACK-based at-least-once delivery.
// Spec: #16 §3.4, #18 Phase 2.2

import { connect as tlsConnect, type TLSSocket } from 'node:tls';
import { FrameDecoder, encodeFrame } from './framing.js';
import { buildMessage } from '../broker/message-builder.js';
import type { DaemonCryptoConfig } from '../crypto/tls-config.js';
import type { Message } from '../types.js';

export type SendResult = 'OK' | 'QUEUED' | 'PEER_UNAVAILABLE' | 'PEER_UNKNOWN';

export interface PeerEndpoint {
  host: string;
  port: number;
}

export interface TunnelManagerOptions {
  config: DaemonCryptoConfig;
  teamName: string;
  /** Max outbound queue size per peer. Default: 100 */
  maxQueueSize?: number;
  /** Heartbeat interval in ms. Default: 30_000 */
  heartbeatIntervalMs?: number;
  /** Dead connection threshold in ms. Default: 90_000 */
  deadConnectionMs?: number;
  /** Base reconnect delay in ms. Default: 1000 */
  reconnectBaseMs?: number;
  /** ACK timeout in ms. Default: 10_000 */
  ackTimeoutMs?: number;
}

interface PendingAck {
  resolve: (result: SendResult) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface PeerState {
  socket: TLSSocket | null;
  host: string;
  port: number;
  queue: Array<{ msg: Message; resolve: (r: SendResult) => void }>;
  pendingAcks: Map<string, PendingAck>;  // messageId → pending
  reconnectAttempt: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  heartbeatTimer: ReturnType<typeof setInterval> | null;
  deadTimer: ReturnType<typeof setInterval> | null;
  lastDataAt: number;
  connected: boolean;
  connecting: boolean;  // true while initial/reconnect handshake is in progress
  connectWaiters: Array<() => void>;  // notified when connected becomes true
  decoder: FrameDecoder;
}

export class TunnelManager {
  private readonly config: DaemonCryptoConfig;
  private readonly teamName: string;
  private readonly maxQueueSize: number;
  private readonly heartbeatIntervalMs: number;
  private readonly deadConnectionMs: number;
  private readonly reconnectBaseMs: number;
  private readonly ackTimeoutMs: number;

  private peers = new Map<string, PeerState>();
  private tunnelDownHandlers: Array<(team: string) => void> = [];
  private stopped = false;

  constructor(opts: TunnelManagerOptions) {
    this.config = opts.config;
    this.teamName = opts.teamName;
    this.maxQueueSize = opts.maxQueueSize ?? 100;
    this.heartbeatIntervalMs = opts.heartbeatIntervalMs ?? 30_000;
    this.deadConnectionMs = opts.deadConnectionMs ?? 90_000;
    this.reconnectBaseMs = opts.reconnectBaseMs ?? 1000;
    this.ackTimeoutMs = opts.ackTimeoutMs ?? 10_000;
  }

  onTunnelDown(handler: (team: string) => void): void {
    this.tunnelDownHandlers.push(handler);
  }

  async start(endpoints: Record<string, PeerEndpoint>): Promise<void> {
    for (const [team, endpoint] of Object.entries(endpoints)) {
      this.initPeer(team, endpoint);
    }
  }

  async stop(): Promise<void> {
    this.stopped = true;
    for (const [, state] of this.peers) {
      this.clearTimers(state);
      // Unblock any send() calls waiting for connection
      state.connecting = false;
      this.notifyConnectWaiters(state);
      // Reject all pending ACKs
      for (const [, pending] of state.pendingAcks) {
        clearTimeout(pending.timer);
        pending.resolve('PEER_UNAVAILABLE');
      }
      state.pendingAcks.clear();
      // Reject all queued messages
      for (const { resolve } of state.queue) resolve('PEER_UNAVAILABLE');
      state.queue = [];
      state.socket?.destroy();
    }
    this.peers.clear();
  }

  async send(team: string, message: Message): Promise<SendResult> {
    const state = this.peers.get(team);
    if (!state) return 'PEER_UNKNOWN';

    // If connection attempt is still in progress, wait for it to resolve
    if (!state.connected && state.connecting) {
      await new Promise<void>((resolve) => state.connectWaiters.push(resolve));
    }

    if (state.connected && state.socket && !state.socket.destroyed) {
      // Try to send directly and wait for ACK
      return this.sendAndWaitAck(state, message);
    }

    // Peer is down — return immediately
    return 'PEER_UNAVAILABLE';
  }

  queueSize(team: string): number {
    return this.peers.get(team)?.queue.length ?? 0;
  }

  private initPeer(team: string, endpoint: PeerEndpoint): void {
    const state: PeerState = {
      socket: null,
      host: endpoint.host,
      port: endpoint.port,
      queue: [],
      pendingAcks: new Map(),
      reconnectAttempt: 0,
      reconnectTimer: null,
      heartbeatTimer: null,
      deadTimer: null,
      lastDataAt: Date.now(),
      connected: false,
      connecting: true,
      connectWaiters: [],
      decoder: this.makeDecoder(team),
    };

    this.peers.set(team, state);
    this.attemptConnect(team, state);
  }

  private makeDecoder(team: string): FrameDecoder {
    return new FrameDecoder(1_048_576, (raw: unknown) => {
      const msg = raw as Message;
      const state = this.peers.get(team);
      if (!state) return;
      state.lastDataAt = Date.now();

      // Handle ACK frames
      if (msg.type === 'ack' && msg.reply_to) {
        const pending = state.pendingAcks.get(msg.reply_to);
        if (pending) {
          clearTimeout(pending.timer);
          state.pendingAcks.delete(msg.reply_to);
          pending.resolve('OK');
        }
      }
    });
  }

  private async attemptConnect(team: string, state: PeerState): Promise<void> {
    if (this.stopped) return;

    state.connecting = true;

    const expectedFingerprint = this.config.peerFingerprints.get(team);
    if (!expectedFingerprint) {
      // No cert for this peer — don't retry
      state.connecting = false;
      this.notifyConnectWaiters(state);
      return;
    }

    try {
      const socket = await this.connectSocket(team, state.host, state.port, expectedFingerprint);
      state.socket = socket;
      state.connected = true;
      state.connecting = false;
      state.reconnectAttempt = 0;
      state.lastDataAt = Date.now();
      // Notify any send() calls waiting for connection
      this.notifyConnectWaiters(state);
      // Reassign decoder to new socket
      state.decoder = this.makeDecoder(team);
      socket.on('data', (chunk: Buffer) => {
        try { state.decoder.push(chunk); } catch { /* ignore */ }
      });
      socket.once('close', () => {
        if (this.stopped) return;
        state.connected = false;
        state.socket = null;
        this.clearTimers(state);
        for (const h of this.tunnelDownHandlers) h(team);
        this.scheduleReconnect(team, state);
      });
      socket.on('error', () => { /* close event will handle it */ });

      this.startHeartbeat(team, state);
      this.startDeadTimer(team, state);
      await this.drainQueue(team, state);
    } catch {
      state.connecting = false;
      this.notifyConnectWaiters(state);
      if (!this.stopped) {
        this.scheduleReconnect(team, state);
      }
    }
  }

  private connectSocket(
    team: string,
    host: string,
    port: number,
    expectedFingerprint: string,
  ): Promise<TLSSocket> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const socket = tlsConnect({
        host,
        port,
        key: this.config.key.length > 0 ? this.config.key : undefined,
        cert: this.config.cert.length > 0 ? this.config.cert : undefined,
        rejectUnauthorized: false,
        ca: [],
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
      });
      socket.once('secureConnect', () => {
        if (settled) return;
        // Manually verify server cert fingerprint (checkServerIdentity is skipped when rejectUnauthorized: false)
        const peerCert = socket.getPeerCertificate();
        const fp = peerCert?.fingerprint256;
        if (!fp || fp !== expectedFingerprint) {
          settled = true;
          socket.destroy();
          reject(new Error(`Fingerprint mismatch for ${team}: got ${fp ?? 'none'}, expected ${expectedFingerprint}`));
          return;
        }
        settled = true;
        resolve(socket);
      });
      socket.once('error', (err) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        reject(err);
      });
    });
  }

  private sendAndWaitAck(state: PeerState, message: Message): Promise<SendResult> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        state.pendingAcks.delete(message.id);
        resolve('PEER_UNAVAILABLE');
      }, this.ackTimeoutMs);

      state.pendingAcks.set(message.id, { resolve, timer });

      const frame = encodeFrame(message);
      state.socket!.write(frame, (err) => {
        if (err) {
          clearTimeout(timer);
          state.pendingAcks.delete(message.id);
          resolve('PEER_UNAVAILABLE');
        }
      });
    });
  }

  private scheduleReconnect(team: string, state: PeerState): void {
    if (this.stopped) return;
    const delay = Math.min(
      this.reconnectBaseMs * Math.pow(2, state.reconnectAttempt),
      60_000,
    );
    state.reconnectAttempt++;
    state.reconnectTimer = setTimeout(() => {
      if (!this.stopped) {
        this.attemptConnect(team, state);
      }
    }, delay);
  }

  private startHeartbeat(team: string, state: PeerState): void {
    state.heartbeatTimer = setInterval(() => {
      if (!state.connected || !state.socket || state.socket.destroyed) return;
      const hb = buildMessage({
        from: { team: this.teamName, agent: 'daemon' },
        to: { team, agent: 'daemon' },
        type: 'heartbeat',
        body: '',
        priority: 'low',
      });
      const frame = encodeFrame(hb);
      state.socket.write(frame, (err) => {
        if (!err) state.lastDataAt = Date.now();
      });
    }, this.heartbeatIntervalMs);
    state.heartbeatTimer.unref?.();
  }

  private startDeadTimer(team: string, state: PeerState): void {
    const checkInterval = Math.floor(this.deadConnectionMs / 3);
    state.deadTimer = setInterval(() => {
      if (!state.connected) return;
      const elapsed = Date.now() - state.lastDataAt;
      if (elapsed >= this.deadConnectionMs) {
        console.warn(
          `[tunnel-manager] Dead connection to ${team} (${elapsed}ms since last data) — closing`,
        );
        state.socket?.destroy();
        // The close event handler will call scheduleReconnect
      }
    }, checkInterval);
    state.deadTimer.unref?.();
  }

  private async drainQueue(team: string, state: PeerState): Promise<void> {
    while (state.queue.length > 0 && state.connected && state.socket && !state.socket.destroyed) {
      const entry = state.queue.shift()!;
      const result = await this.sendAndWaitAck(state, entry.msg);
      entry.resolve(result);
      if (result !== 'OK') {
        state.connected = false;
        break;
      }
    }
  }

  private notifyConnectWaiters(state: PeerState): void {
    const waiters = state.connectWaiters.splice(0);
    for (const w of waiters) w();
  }

  private clearTimers(state: PeerState): void {
    if (state.heartbeatTimer) { clearInterval(state.heartbeatTimer); state.heartbeatTimer = null; }
    if (state.deadTimer) { clearInterval(state.deadTimer); state.deadTimer = null; }
    if (state.reconnectTimer) { clearTimeout(state.reconnectTimer); state.reconnectTimer = null; }
  }
}
