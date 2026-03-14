// (*CD:Babbage*)
// UDS client — connects to a peer team's broker socket and sends a single message,
// then waits for an ACK. Implements at-least-once delivery with exponential backoff.
//
// Encryption: if a CryptoProvider is supplied, the JSON payload is encrypted before
// framing. The receiver must use the same PSK-derived key to decrypt.
// Wire format: [4-byte length][encrypted-or-plaintext JSON bytes]

import net from 'net';
import { encodeFrame, FrameDecoder, MAX_MESSAGE_SIZE } from './framing.js';
import type { Message, AckBody, CryptoProvider } from '../types.js';

const ACK_TIMEOUT_MS = 5_000;
const BACKOFF_INITIAL_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;
const MAX_DURATION_MS = 5 * 60 * 1_000; // 5 minutes before UNREACHABLE

export interface SendOptions {
  maxSize?: number;
  crypto?: CryptoProvider;
  /** Override the 5-minute UNREACHABLE deadline. Useful for tests. */
  maxDurationMs?: number;
}

export class UDSClient {
  constructor(private readonly socketPath: string) {}

  /**
   * Send a message and await an ACK. Retries with exponential backoff
   * until ACK is received or maxDurationMs has elapsed (default 5 minutes).
   *
   * Resolves with the number of attempts on success.
   * Rejects with an Error tagged UNREACHABLE after the deadline.
   */
  async send(message: Message, opts: SendOptions = {}): Promise<number> {
    const deadline = Date.now() + (opts.maxDurationMs ?? MAX_DURATION_MS);
    let delay = BACKOFF_INITIAL_MS;
    let attempts = 0;

    while (Date.now() < deadline) {
      attempts++;
      try {
        await this.trySend(message, opts);
        return attempts;
      } catch (err) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) break;

        const waitMs = Math.min(delay, remaining);
        console.warn(
          `[uds-client] Attempt ${attempts} failed (${(err as Error).message}). ` +
          `Retrying in ${waitMs}ms…`
        );
        await sleep(waitMs);
        delay = Math.min(delay * 2, BACKOFF_MAX_MS);
      }
    }

    const err = new Error(
      `UNREACHABLE: ${this.socketPath} — failed after ${attempts} attempt(s) ` +
      `over ${MAX_DURATION_MS / 1000}s`
    );
    (err as NodeJS.ErrnoException).code = 'UNREACHABLE';
    throw err;
  }

  private async trySend(message: Message, opts: SendOptions): Promise<void> {
    const maxSize = opts.maxSize ?? MAX_MESSAGE_SIZE;

    // Serialize the message to JSON bytes
    let payload = Buffer.from(JSON.stringify(message), 'utf8');
    if (payload.byteLength > maxSize) {
      throw new Error(`Message too large: ${payload.byteLength} bytes exceeds limit of ${maxSize}`);
    }

    // Encrypt if crypto provider is available.
    // AAD binds message ID + sender team to the ciphertext — prevents ciphertext transplant attacks.
    if (opts.crypto) {
      const aad = `${message.id}:${message.from.team}`;
      payload = Buffer.from(await opts.crypto.encrypt(payload, aad));
    }

    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ path: this.socketPath });
      let settled = false;

      const finish = (err?: Error) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        if (err) reject(err);
        else resolve();
      };

      const ackTimeout = setTimeout(() => {
        finish(new Error('ACK timeout'));
      }, ACK_TIMEOUT_MS);

      socket.once('connect', () => {
        try {
          // Frame the (possibly encrypted) payload directly
          const lengthHeader = Buffer.allocUnsafe(4);
          lengthHeader.writeUInt32BE(payload.byteLength, 0);
          socket.write(Buffer.concat([lengthHeader, payload]));
        } catch (err) {
          clearTimeout(ackTimeout);
          finish(err as Error);
          return;
        }

        // Wait for ACK — ACK frames are always plaintext (no encryption on control messages)
        const decoder = new FrameDecoder(
          maxSize,
          (raw) => {
            clearTimeout(ackTimeout);
            const ack = raw as { type: string; body: string };
            if (ack.type !== 'ack') {
              finish(new Error(`Expected ACK, got: ${ack.type}`));
              return;
            }
            let ackBody: AckBody;
            try {
              ackBody = JSON.parse(ack.body) as AckBody;
            } catch {
              finish(new Error('Invalid ACK body JSON'));
              return;
            }
            if (ackBody.status === 'error') {
              finish(new Error(`Remote error: ${ackBody.error ?? 'unknown'}`));
            } else {
              finish();
            }
          }
        );
        socket.on('data', (chunk: Buffer) => {
          try {
            decoder.push(chunk);
          } catch (e) {
            clearTimeout(ackTimeout);
            finish(e as Error);
          }
        });
      });

      socket.once('error', (err) => {
        clearTimeout(ackTimeout);
        finish(err);
      });

      socket.once('close', () => {
        clearTimeout(ackTimeout);
        finish(new Error('Connection closed before ACK'));
      });
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
