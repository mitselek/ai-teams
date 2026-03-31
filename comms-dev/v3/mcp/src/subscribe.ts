// (*CD:Vigenere+Lovelace*)
// SSESubscriber — background SSE subscription to the hub's /api/subscribe endpoint.
// InboxBuffer — in-memory store for received messages.
// E2E crypto: verifySignature → e2eDecrypt before inbox delivery.

import * as https from 'node:https';
import type { CryptoAPIv2, E2EPayload, SignedMessage } from '../../../src/crypto/index.js';

// ── InboxBuffer ────────────────────────────────────────────────────────────────

export class InboxBuffer {
  private readonly _messages: unknown[] = [];
  private _readIndex = 0;

  push(msg: unknown): void {
    this._messages.push(msg);
  }

  get messages(): unknown[] {
    return [...this._messages];
  }

  get unread(): unknown[] {
    return this._messages.slice(this._readIndex);
  }

  markAllRead(): void {
    this._readIndex = this._messages.length;
  }

  get unreadCount(): number {
    return this._messages.length - this._readIndex;
  }
}

// ── SSESubscriber ──────────────────────────────────────────────────────────────

export class SSESubscriber {
  private _connected = false;
  private _stopped = false;
  private _backoff = 1000;
  private readonly _maxBackoff = 60000;
  private _lastEventId: string | null = null;
  private _currentReq: ReturnType<typeof https.request> | null = null;
  private _sseBuffer = '';
  private readonly _crypto?: CryptoAPIv2;

  constructor(
    private readonly hubUrl: string,
    private readonly opts: { cert: string; key: string; ca: string },
    private readonly inbox: InboxBuffer,
    crypto?: CryptoAPIv2,
  ) {
    this._crypto = crypto;
  }

  start(): void {
    this._stopped = false;
    this._backoff = 1000;
    this._loop().catch(() => {});
  }

  stop(): void {
    this._stopped = true;
    this._connected = false;
    this._currentReq?.destroy();
    this._currentReq = null;
  }

  get connected(): boolean {
    return this._connected;
  }

  private async _loop(): Promise<void> {
    while (!this._stopped) {
      await this._connect();
      if (this._stopped) break;
      await new Promise<void>((resolve) => setTimeout(resolve, this._backoff));
      this._backoff = Math.min(this._backoff * 2, this._maxBackoff);
    }
  }

  private _processChunk(chunk: string): void {
    this._sseBuffer += chunk;
    const parts = this._sseBuffer.split('\n\n');
    this._sseBuffer = parts.pop() ?? '';
    for (const part of parts) {
      if (!part.trim()) continue;
      const lines = part.split('\n');
      const idLine = lines.find((l) => l.startsWith('id:'));
      const dataLine = lines.find((l) => l.startsWith('data:'));
      if (idLine) this._lastEventId = idLine.slice(3).trim();
      if (dataLine) {
        try {
          const msg = JSON.parse(dataLine.slice(5).trim()) as Record<string, unknown>;
          this._processMessage(msg);
        } catch {
          /* ignore malformed events */
        }
      }
    }
  }

  private _processMessage(msg: Record<string, unknown>): void {
    if (!this._crypto) {
      // No crypto configured — pass through raw (backward compat / tests like AC3)
      this.inbox.push(msg);
      return;
    }

    // Verify signature first — drop unsigned or tampered messages
    if (!this._crypto.verifySignature(msg as unknown as SignedMessage)) {
      return; // silently drop
    }

    // Decrypt E2E body
    const msgId = msg.id as string;
    const e2ePayload = JSON.parse(msg.body as string) as E2EPayload;
    this._crypto.e2eDecrypt(e2ePayload, msgId).then(
      (plaintext) => {
        this.inbox.push({ ...msg, body: plaintext.toString('utf-8') });
      },
      () => {
        // Decryption failed — drop silently (wrong pairwise key, tampered, etc.)
      },
    );
  }

  private _connect(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this._stopped) {
        resolve();
        return;
      }

      const url = new URL('/api/subscribe', this.hubUrl);
      const headers: Record<string, string> = { Accept: 'text/event-stream' };
      if (this._lastEventId !== null) headers['Last-Event-Id'] = this._lastEventId;

      const req = https.request(
        {
          hostname: url.hostname,
          port: url.port ? parseInt(url.port, 10) : 443,
          path: url.pathname,
          method: 'GET',
          agent: false,
          cert: this.opts.cert,
          key: this.opts.key,
          ca: this.opts.ca,
          checkServerIdentity: () => undefined,
          headers,
        },
        (res) => {
          if ((res.statusCode ?? 0) !== 200) {
            res.resume();
            this._connected = false;
            resolve();
            return;
          }

          this._connected = true;
          this._backoff = 1000;
          this._sseBuffer = '';

          res.setEncoding('utf8');
          res.on('data', (chunk: string) => this._processChunk(chunk));

          res.on('end', () => {
            this._connected = false;
            resolve();
          });

          res.on('error', () => {
            this._connected = false;
            resolve();
          });
        },
      );

      req.on('error', () => {
        this._connected = false;
        resolve();
      });

      this._currentReq = req;
      req.end();
    });
  }
}
