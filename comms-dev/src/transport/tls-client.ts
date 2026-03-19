// (*CD:Babbage*)
// TLS client — outbound mTLS connection to a peer daemon.
// Verifies server cert fingerprint, sends framed messages, emits disconnect events.
// Spec: #16 §3, #15 §1, #18 Phase 2.2

import { connect, type TLSSocket } from 'node:tls';
import { encodeFrame } from './framing.js';
import type { DaemonCryptoConfig } from '../crypto/tls-config.js';
import type { Message } from '../types.js';

export interface TlsClientOptions {
  config: DaemonCryptoConfig;
  peerTeam: string;
  host: string;
  port: number;
}

export class TlsClient {
  private readonly config: DaemonCryptoConfig;
  private readonly peerTeam: string;
  private readonly host: string;
  private readonly port: number;
  private socket: TLSSocket | null = null;
  private disconnectHandlers: Array<() => void> = [];

  constructor(opts: TlsClientOptions) {
    this.config = opts.config;
    this.peerTeam = opts.peerTeam;
    this.host = opts.host;
    this.port = opts.port;
  }

  isConnected(): boolean {
    return this.socket !== null && !this.socket.destroyed;
  }

  onDisconnect(handler: () => void): void {
    this.disconnectHandlers.push(handler);
  }

  /**
   * Compute the exponential backoff delay for a given retry attempt.
   * attempt 0 = 1s, doubles each time, cap at 60s.
   */
  backoffDelay(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 60_000);
  }

  async connect(): Promise<void> {
    // Reject immediately if no fingerprint for this peer — unknown peer
    const expectedFingerprint = this.config.peerFingerprints.get(this.peerTeam);
    if (!expectedFingerprint) {
      throw new Error(`No pinned cert for peer team: ${this.peerTeam}`);
    }

    return new Promise((resolve, reject) => {
      let settled = false;

      const socket = connect({
        host: this.host,
        port: this.port,
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
          reject(new Error(
            `TLS fingerprint mismatch for ${this.peerTeam}: ` +
            `got ${fp ?? 'none'}, expected ${expectedFingerprint}`,
          ));
          return;
        }

        settled = true;
        this.socket = socket;

        const onClose = () => {
          if (this.socket === socket) this.socket = null;
          for (const h of this.disconnectHandlers) h();
        };

        socket.once('close', onClose);

        resolve();
      });

      socket.once('error', (err) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        reject(err);
      });
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.socket || this.socket.destroyed) {
        this.socket = null;
        resolve();
        return;
      }
      this.socket.once('close', () => resolve());
      this.socket.destroy();
    });
  }

  async send(message: Message): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('TlsClient: not connected');
    }
    const frame = encodeFrame(message);
    return new Promise((resolve, reject) => {
      this.socket!.write(frame, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
