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
  /** Max reconnect backoff cap in ms. Default: 30_000 (was 60s, reduced for hub failover) */
  reconnectMaxMs?: number;
  /** ACK timeout in ms. Default: 10_000 */
  ackTimeoutMs?: number;
  /**
   * Fallback peer name for destinations not in the peers map.
   * When set, send('unknown-team', msg) routes through this peer (the hub)
   * instead of returning PEER_UNKNOWN. Used by team daemons to reach other
   * teams via the relay without needing a direct entry per destination.
   */
  defaultPeer?: string;
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
  everConnected: boolean;  // true once first successful connection established
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
  private readonly reconnectMaxMs: number;
  private readonly ackTimeoutMs: number;
  private readonly defaultPeer: string | undefined;

  private peers = new Map<string, PeerState>();
  private inboundSockets = new Map<string, TLSSocket>();
  private tunnelDownHandlers: Array<(team: string) => void> = [];
  private tunnelUpHandlers: Array<(team: string) => void> = [];
  private inboundMessageHandlers: Array<(msg: Message) => void> = [];
  private stopped = false;

  constructor(opts: TunnelManagerOptions) {
    this.config = opts.config;
    this.teamName = opts.teamName;
    this.maxQueueSize = opts.maxQueueSize ?? 100;
    this.heartbeatIntervalMs = opts.heartbeatIntervalMs ?? 30_000;
    this.deadConnectionMs = opts.deadConnectionMs ?? 90_000;
    this.reconnectBaseMs = opts.reconnectBaseMs ?? 1000;
    this.reconnectMaxMs = opts.reconnectMaxMs ?? 30_000;
    this.ackTimeoutMs = opts.ackTimeoutMs ?? 10_000;
    this.defaultPeer = opts.defaultPeer;
  }

  onTunnelDown(handler: (team: string) => void): void {
    this.tunnelDownHandlers.push(handler);
  }

  onTunnelUp(handler: (team: string) => void): void {
    this.tunnelUpHandlers.push(handler);
  }

  /**
   * Called with non-ACK frames received on outbound sockets — i.e. the hub
   * wrote a message back down the connection we initiated to it.
   * DaemonV2 wires this to handleInbound() so messages arriving this way
   * are processed identically to messages received via TlsServer.
   */
  onMessage(handler: (msg: Message) => void): void {
    this.inboundMessageHandlers.push(handler);
  }

  /**
   * Register an inbound TLS socket (accepted by TlsServer) as a usable
   * send-path for a peer. Used by hub mode: when team-a connects inbound,
   * hub registers the socket so forwardMessage() can write back down it.
   *
   * The hub does NOT set up a data handler here — TlsServer already owns
   * the read side of this socket. We only write to it.
   *
   * If the peer already has an outbound tunnel, the inbound socket is used
   * as a fallback only when the outbound is not connected.
   */
  registerInboundSocket(team: string, socket: TLSSocket): void {
    // Clean up stale entry if present
    const old = this.inboundSockets.get(team);
    if (old && old !== socket) old.destroy();

    this.inboundSockets.set(team, socket);
    for (const h of this.tunnelUpHandlers) h(team);

    socket.once('close', () => {
      if (this.inboundSockets.get(team) === socket) {
        this.inboundSockets.delete(team);
        for (const h of this.tunnelDownHandlers) h(team);
      }
    });
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
    // 1. Try outbound tunnel: direct peer or defaultPeer fallback.
    const state = this.peers.get(team)
      ?? (this.defaultPeer ? this.peers.get(this.defaultPeer) : undefined);

    if (state) {
      // Wait for in-progress connection attempt before deciding
      if (!state.connected && state.connecting) {
        await new Promise<void>((resolve) => state.connectWaiters.push(resolve));
      }

      if (state.connected && state.socket && !state.socket.destroyed) {
        return this.sendAndWaitAck(state, message);
      }

      // Outbound is down — try inbound socket before queuing
      if (this.inboundSockets.has(team)) {
        return this.sendViaInbound(team, message);
      }

      // Only queue if this peer was previously reachable.
      if (!state.everConnected) return 'PEER_UNAVAILABLE';
      if (state.queue.length >= this.maxQueueSize) return 'PEER_UNAVAILABLE';
      state.queue.push({ msg: message, resolve: () => {} });
      return 'QUEUED';
    }

    // 2. No outbound tunnel — try inbound socket registered by TlsServer.
    if (this.inboundSockets.has(team)) {
      return this.sendViaInbound(team, message);
    }

    return 'PEER_UNKNOWN';
  }

  // No outbound tunnel — try inbound socket registered by hub's TlsServer.
  // Write directly and return OK: hub already ACKed the original sender,
  // so delivery here is best-effort (per architecture §ACK semantics).
  private sendViaInbound(team: string, message: Message): SendResult {
    const socket = this.inboundSockets.get(team);
    if (!socket || socket.destroyed) return 'PEER_UNAVAILABLE';
    const frame = encodeFrame(message);
    socket.write(frame, (err) => {
      if (err) console.warn(`[tunnel-manager] inbound write error to ${team}:`, err.message);
    });
    return 'OK';
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
      everConnected: false,
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

      if (msg.type === 'ack' && msg.reply_to) {
        // Resolve pending ACK for a message we sent outbound
        const pending = state.pendingAcks.get(msg.reply_to);
        if (pending) {
          clearTimeout(pending.timer);
          state.pendingAcks.delete(msg.reply_to);
          pending.resolve('OK');
        }
      } else {
        // Non-ACK frame received on our outbound socket — hub is sending us
        // a message back down the connection we initiated.
        for (const h of this.inboundMessageHandlers) h(msg);
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
      state.everConnected = true;
      state.connecting = false;
      state.reconnectAttempt = 0;
      state.lastDataAt = Date.now();
      // Notify any send() calls waiting for connection
      this.notifyConnectWaiters(state);
      // Notify tunnel-up listeners
      for (const h of this.tunnelUpHandlers) h(team);
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
        // Resolve any pending ACKs immediately so callers don't wait for ackTimeoutMs
        for (const [, pending] of state.pendingAcks) {
          clearTimeout(pending.timer);
          pending.resolve('PEER_UNAVAILABLE');
        }
        state.pendingAcks.clear();
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
      this.reconnectMaxMs,
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
