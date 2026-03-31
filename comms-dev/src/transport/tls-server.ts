// (*CD:Babbage*)
// TLS server — accepts inbound mTLS connections from peer daemons.
// v1 (peer-to-peer): enforces from.team === peerCertCN.
// v2 (hub mode): peer is hub (CN=comms-hub); skips from.team check for hubPeers;
//   sender identity is proven by Ed25519 signature verified in the application layer.
// Spec: #16 §3, #15 §3, #18 Phase 2.1, crypto-spec.md §Hub-Mode

import { createServer, type Server, type TLSSocket } from 'node:tls';
import { FrameDecoder, encodeFrame } from './framing.js';
import { validateSenderIdentity } from '../crypto/tls-config.js';
import { buildMessage } from '../broker/message-builder.js';
import type { DaemonCryptoConfig } from '../crypto/tls-config.js';
import type { Message } from '../types.js';

export interface TlsServerOptions {
  config: DaemonCryptoConfig;
  teamName: string;
  /** Max frame size in bytes. Default: 1MB */
  maxFrameSize?: number;
  /**
   * Cert CNs of trusted hub peers (e.g. ["comms-hub"]).
   * When a message arrives from one of these peers, the from.team === peerCertCN
   * check is skipped — sender identity is proven by Ed25519 signature instead
   * (verified at the application layer by DaemonV2). This is the v1 stepping stone
   * to the full v2 two-layer auth model described in crypto-spec.md §Hub-Mode.
   */
  hubPeers?: string[];
}

export class TlsServer {
  private readonly config: DaemonCryptoConfig;
  private readonly teamName: string;
  private readonly maxFrameSize: number;
  private readonly hubPeers: ReadonlySet<string>;
  private server: Server | null = null;
  private _port = 0;
  private _host = '';
  private activeSockets = new Set<TLSSocket>();

  private connectionHandlers: Array<(team: string) => void> = [];
  private peerSocketHandlers: Array<(team: string, socket: TLSSocket) => void> = [];
  private messageHandlers: Array<(msg: Message) => void> = [];
  private forgeryHandlers: Array<() => void> = [];

  constructor(opts: TlsServerOptions) {
    this.config = opts.config;
    this.teamName = opts.teamName;
    this.maxFrameSize = opts.maxFrameSize ?? 1_048_576;
    this.hubPeers = new Set(opts.hubPeers ?? []);
  }

  get port(): number {
    return this._port;
  }

  get host(): string {
    return this._host;
  }

  onConnection(handler: (team: string) => void): void {
    this.connectionHandlers.push(handler);
  }

  /**
   * Called with (team, socket) after a peer successfully authenticates.
   * Hub uses this to register the inbound socket in TunnelManager so it
   * can write messages back down the same connection.
   */
  onPeerSocket(handler: (team: string, socket: TLSSocket) => void): void {
    this.peerSocketHandlers.push(handler);
  }

  onMessage(handler: (msg: Message) => void): void {
    this.messageHandlers.push(handler);
  }

  onForgeryDetected(handler: () => void): void {
    this.forgeryHandlers.push(handler);
  }

  async start(port = 0, host = '0.0.0.0'): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = createServer({
        key: this.config.key,
        cert: this.config.cert,
        requestCert: true,
        rejectUnauthorized: false,
        ca: [],
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
      });

      // Track sockets from TCP connection event (before TLS handshake)
      // so stop() can destroy them even if handshake hasn't completed.
      server.on('connection', (socket) => {
        const tlsSocket = socket as TLSSocket;
        this.activeSockets.add(tlsSocket);
        tlsSocket.once('close', () => this.activeSockets.delete(tlsSocket));
      });

      // Absorb per-socket TLS errors so they don't crash the process
      server.on('tlsClientError', (_err, socket) => {
        socket.destroy();
      });

      server.on('secureConnection', (socket: TLSSocket) => {
        // Absorb socket-level errors — they are expected for rejected connections
        socket.on('error', () => {});
        this.handleConnection(socket);
      });

      server.once('error', reject);

      server.listen(port, host, () => {
        const addr = server.address();
        this._port = typeof addr === 'object' && addr ? addr.port : 0;
        this._host = host;
        this.server = server;
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) { resolve(); return; }
      const server = this.server;
      this.server = null;
      for (const s of this.activeSockets) s.destroy();
      this.activeSockets.clear();
      server.close(() => resolve());
    });
  }

  private handleConnection(socket: TLSSocket): void {
    const peerCert = socket.getPeerCertificate();

    // Reject if no client cert
    if (!peerCert || !peerCert.subject || !peerCert.fingerprint256) {
      socket.destroy();
      return;
    }

    const peerTeam = this.extractCN(peerCert.subject.CN ?? '');

    // Reject if team is unknown (not in peers/)
    const expectedFingerprint = this.config.peerFingerprints.get(peerTeam);
    if (!expectedFingerprint) {
      socket.destroy();
      return;
    }

    // Reject if fingerprint does not match pinned cert
    if (peerCert.fingerprint256 !== expectedFingerprint) {
      socket.destroy();
      return;
    }

    // Peer authenticated — store team on socket and notify handlers
    (socket as any)._authenticatedTeam = peerTeam;
    for (const h of this.connectionHandlers) h(peerTeam);
    for (const h of this.peerSocketHandlers) h(peerTeam, socket);

    // Set up frame decoder for this connection
    const decoder = new FrameDecoder(this.maxFrameSize, (raw: unknown) => {
      this.handleFrame(socket, peerTeam, raw as Message);
    });

    socket.on('data', (chunk: Buffer) => {
      try {
        decoder.push(chunk);
      } catch (err) {
        console.error(`[tls-server] Frame decode error from ${peerTeam}:`, err);
        socket.destroy();
      }
    });
  }

  private handleFrame(socket: TLSSocket, authenticatedTeam: string, message: Message): void {
    // v1 invariant: from.team must match mTLS peer cert CN.
    // v2 hub mode: peer is the hub (in hubPeers) — skip this check; sender identity
    // is proven by Ed25519 signature verified by DaemonV2's handleInbound().
    if (!this.hubPeers.has(authenticatedTeam)) {
      const check = validateSenderIdentity(message, authenticatedTeam);
      if (!check.valid) {
        console.warn(`[tls-server] FORGERY DETECTED from ${authenticatedTeam}: ${check.reason}`);
        for (const h of this.forgeryHandlers) h();
        socket.destroy();
        return;
      }
    }

    // Send ACK back — but never ACK an ACK (avoids ACK storms when hub
    // forwards ACK frames back down inbound sockets).
    if (message.type !== 'ack') {
      const ack = buildMessage({
        from: { team: this.teamName, agent: 'daemon' },
        to:   message.from,
        type: 'ack',
        body: 'ok',
        reply_to: message.id,
        priority: 'normal',
      });
      if (!socket.destroyed) {
        socket.write(encodeFrame(ack), () => { /* ignore write errors */ });
      }
    }

    for (const h of this.messageHandlers) h(message);
  }

  private extractCN(subject: string): string {
    // subject may be "CN=team-name" or just "team-name" depending on Node version
    if (subject.startsWith('CN=')) return subject.slice(3);
    return subject;
  }
}
