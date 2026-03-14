// (*CD:Babbage*)
// UDS server — the listening side of a team's broker socket.
// Accepts incoming connections, decodes length-prefixed frames,
// optionally decrypts, validates messages (including HMAC checksum), sends ACKs,
// and hands messages to the broker via callback.
//
// Wire format: [4-byte length][encrypted-or-plaintext JSON bytes]
// ACK frames are always sent as plaintext (no encryption on control messages).
//
// Checksum verification:
//   - With integrityKey: HMAC-SHA256 via Vigenere's verifyIntegrity()
//   - Without integrityKey: plain SHA-256 (dev/plaintext mode)

import net from 'net';
import fs from 'fs';
import { createHash } from 'crypto';
import { encodeFrame, MAX_MESSAGE_SIZE } from './framing.js';
import { stableStringify } from '../util/stable-stringify.js';
import { verifyIntegrity } from '../crypto/index.js';
import type { Message, AckBody, CryptoProvider } from '../types.js';

const FRAME_HEADER_SIZE = 4;

export interface ServerOptions {
  socketPath: string;
  maxSize?: number;
  crypto?: CryptoProvider;
  /** HMAC-SHA256 integrity key from deriveKey(). Required in production. */
  integrityKey?: Buffer;
  onMessage: (message: Message) => Promise<void>;
  onError?: (err: Error) => void;
}

export class UDSServer {
  private server: net.Server;
  private readonly socketPath: string;
  private readonly maxSize: number;
  private readonly crypto: CryptoProvider | undefined;
  private readonly integrityKey: Buffer | undefined;
  private readonly onMessage: (msg: Message) => Promise<void>;
  private readonly onError: (err: Error) => void;

  constructor(opts: ServerOptions) {
    this.socketPath = opts.socketPath;
    this.maxSize = opts.maxSize ?? MAX_MESSAGE_SIZE;
    this.crypto = opts.crypto;
    this.integrityKey = opts.integrityKey;
    this.onMessage = opts.onMessage;
    this.onError = opts.onError ?? ((err) => console.error('[uds-server]', err));

    this.server = net.createServer((socket) => this.handleConnection(socket));
    this.server.on('error', this.onError);
  }

  async listen(): Promise<void> {
    // Clean up stale socket file from previous crash
    try {
      fs.unlinkSync(this.socketPath);
    } catch {
      // File didn't exist — that's fine
    }

    return new Promise((resolve, reject) => {
      this.server.listen(this.socketPath, () => {
        // Ensure the socket is accessible by all containers (chmod 0666)
        try {
          fs.chmodSync(this.socketPath, 0o666);
        } catch {
          // Non-fatal — may already have correct permissions
        }
        console.log(`[uds-server] Listening on ${this.socketPath}`);
        resolve();
      });
      this.server.once('error', reject);
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  private handleConnection(socket: net.Socket): void {
    // Raw byte accumulator — we decode frames manually so we can decrypt
    // the payload before JSON parsing (FrameDecoder assumes plaintext JSON).
    //
    // Race condition fix (Volta review): pause the socket while drainBuffer is
    // running so no new 'data' events fire mid-drain. Resume only after drain
    // completes and buffer is updated. This serialises all processing per connection.
    let buffer: Buffer<ArrayBuffer> = Buffer.alloc(0);

    socket.on('data', (chunk: Buffer) => {
      buffer = Buffer.from(Buffer.concat([buffer, chunk]));
      socket.pause();
      void this.drainBuffer(socket, buffer).then(remaining => {
        buffer = Buffer.from(remaining);
        socket.resume();
      }).catch(err => {
        this.onError(err as Error);
        socket.destroy();
      });
    });

    // TODO(T7): add per-server connection limit to defend against socket flooding
    socket.on('error', (err) => this.onError(err));
  }

  private async drainBuffer(socket: net.Socket, buffer: Buffer): Promise<Buffer> {
    while (buffer.byteLength >= FRAME_HEADER_SIZE) {
      const payloadLength = buffer.readUInt32BE(0);

      if (payloadLength > this.maxSize) {
        this.onError(new Error(`Incoming frame too large: ${payloadLength} bytes`));
        socket.destroy();
        return Buffer.alloc(0);
      }

      const totalLength = FRAME_HEADER_SIZE + payloadLength;
      if (buffer.byteLength < totalLength) break; // incomplete frame — wait for more data

      const rawPayload = buffer.slice(FRAME_HEADER_SIZE, totalLength);
      buffer = buffer.slice(totalLength);

      await this.processPayload(socket, rawPayload);
    }
    return buffer;
  }

  private async processPayload(socket: net.Socket, rawPayload: Buffer): Promise<void> {
    // Step 1: decrypt if crypto is configured
    let jsonBytes: Buffer;
    try {
      jsonBytes = this.crypto ? await this.crypto.decrypt(rawPayload) : rawPayload;
    } catch (err) {
      const decryptErr = new Error(`Decryption failed: ${(err as Error).message}`);
      this.onError(decryptErr);
      await this.sendAck(socket, 'unknown', 'error', decryptErr.message);
      return;
    }

    // Step 2: parse JSON
    let raw: unknown;
    try {
      raw = JSON.parse(jsonBytes.toString('utf8'));
    } catch {
      await this.sendAck(socket, 'unknown', 'error', 'Invalid JSON payload');
      return;
    }

    // Step 3: validate message structure and checksum
    let message: Message;
    try {
      message = this.validateMessage(raw);
    } catch (err) {
      await this.sendAck(socket, 'unknown', 'error', (err as Error).message);
      return;
    }

    // Step 4: deliver to broker
    try {
      await this.onMessage(message);
      await this.sendAck(socket, message.id, 'ok');
    } catch (err) {
      await this.sendAck(socket, message.id, 'error', (err as Error).message);
      this.onError(err as Error);
    }
  }

  private validateMessage(raw: unknown): Message {
    if (typeof raw !== 'object' || raw === null) {
      throw new Error('Message must be a JSON object');
    }
    const msg = raw as Record<string, unknown>;

    // Required field checks
    for (const field of ['version', 'id', 'timestamp', 'from', 'to', 'type', 'priority', 'body', 'checksum']) {
      if (!(field in msg)) throw new Error(`Missing required field: ${field}`);
    }

    if (msg['version'] !== '1') throw new Error(`Unsupported version: ${msg['version']}`);

    // Reject messages with timestamps older than 300s — defense-in-depth against replay attacks.
    // The dedup store (MessageStore) is the primary replay defense; this is secondary.
    // Threat model spec: messages > 300s old are rejected regardless of valid checksum.
    const timestamp = msg['timestamp'];
    if (typeof timestamp !== 'string') throw new Error('timestamp must be a string');
    const msgAge = Date.now() - Date.parse(timestamp);
    if (isNaN(msgAge)) throw new Error(`Invalid timestamp format: ${timestamp}`);
    if (msgAge > 300_000) {
      throw new Error(`Message too old: ${Math.round(msgAge / 1000)}s (max 300s) — possible replay`);
    }

    // Verify checksum over stableStringify(rest) — recursive key sorting ensures
    // nested objects (from, to) are fully included. See Issue #2.
    const { checksum, ...rest } = msg;
    const canonical = Buffer.from(stableStringify(rest), 'utf8');

    let valid: boolean;
    if (this.integrityKey) {
      // Production: HMAC-SHA256 — authenticated, prevents forgery by parties without the key
      valid = verifyIntegrity(this.integrityKey, canonical, checksum as string);
    } else {
      // Dev/plaintext mode: plain SHA-256 — integrity only, no authentication
      const expected = 'sha256:' + createHash('sha256').update(canonical).digest('hex');
      valid = checksum === expected;
    }

    if (!valid) {
      throw new Error(`Checksum verification failed`);
    }

    return raw as Message;
  }

  private async sendAck(
    socket: net.Socket,
    ackId: string,
    status: 'ok' | 'error',
    error?: string
  ): Promise<void> {
    const ackBody: AckBody = { ack_id: ackId, status, error };
    const ack = {
      version: '1',
      id: `ack-${ackId}`,
      type: 'ack',
      body: JSON.stringify(ackBody),
    };
    return new Promise((resolve) => {
      const frame = encodeFrame(ack);
      socket.write(frame, () => resolve());
    });
  }
}
