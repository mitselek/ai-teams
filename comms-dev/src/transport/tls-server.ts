// (*CD:Babbage*)
// TLS server — accepts inbound mTLS connections from peer daemons.
// Verifies peer cert fingerprint against pinned certs, enforces from.team === peerCertCN.
// Spec: #16 §3, #15 §3, #18 Phase 2.1

import { createServer, type Server, type TLSSocket } from 'node:tls';
import { FrameDecoder } from './framing.js';
import { validateSenderIdentity } from '../crypto/tls-config.js';
import type { DaemonCryptoConfig } from '../crypto/tls-config.js';
import type { Message } from '../types.js';

export interface TlsServerOptions {
  config: DaemonCryptoConfig;
  teamName: string;
  /** Max frame size in bytes. Default: 1MB */
  maxFrameSize?: number;
}

export class TlsServer {
  private readonly config: DaemonCryptoConfig;
  private readonly teamName: string;
  private readonly maxFrameSize: number;
  private server: Server | null = null;
  private _port = 0;

  private connectionHandlers: Array<(team: string) => void> = [];
  private messageHandlers: Array<(msg: Message) => void> = [];
  private forgeryHandlers: Array<() => void> = [];

  constructor(opts: TlsServerOptions) {
    this.config = opts.config;
    this.teamName = opts.teamName;
    this.maxFrameSize = opts.maxFrameSize ?? 1_048_576;
  }

  get port(): number {
    return this._port;
  }

  onConnection(handler: (team: string) => void): void {
    this.connectionHandlers.push(handler);
  }

  onMessage(handler: (msg: Message) => void): void {
    this.messageHandlers.push(handler);
  }

  onForgeryDetected(handler: () => void): void {
    this.forgeryHandlers.push(handler);
  }

  async start(port = 0): Promise<void> {
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

      server.listen(port, '127.0.0.1', () => {
        const addr = server.address();
        this._port = typeof addr === 'object' && addr ? addr.port : 0;
        this.server = server;
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) { resolve(); return; }
      this.server.close(() => resolve());
      this.server = null;
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
    // Hard invariant: from.team must match mTLS peer cert CN
    const check = validateSenderIdentity(message, authenticatedTeam);
    if (!check.valid) {
      console.warn(`[tls-server] FORGERY DETECTED from ${authenticatedTeam}: ${check.reason}`);
      for (const h of this.forgeryHandlers) h();
      socket.destroy();
      return;
    }

    for (const h of this.messageHandlers) h(message);
  }

  private extractCN(subject: string): string {
    // subject may be "CN=team-name" or just "team-name" depending on Node version
    if (subject.startsWith('CN=')) return subject.slice(3);
    return subject;
  }
}
