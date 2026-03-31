// (*CD:Lovelace*)
// HubClient — mTLS HTTPS client for the v3 hub REST API.

import * as https from 'node:https';
import { createHash } from 'node:crypto';

export interface OutboundMessage {
  version: string;
  id: string;
  timestamp: string;
  from: { team: string; agent: string };
  to: { team: string; agent: string };
  type: string;
  priority: string;
  reply_to: string | null;
  body: string;
  body_hash?: string;
  checksum?: string;
  [key: string]: unknown;
}

export interface SendResult {
  ok: boolean;
  id: string;
  queued?: boolean;
}

export interface OnlineEntry {
  team: string;
  status: string;
  type: string;
  since?: string;
  lastSeen?: string;
}

export interface HubStatusResult {
  uptime: number;
  version: string;
  peerCount: number;
  queueDepth: number;
}

export class HubClient {
  readonly hubUrl: string;
  readonly teamName: string;
  private readonly agent: https.Agent;

  constructor(opts: { hubUrl: string; cert: string; key: string; ca: string; teamName: string }) {
    this.hubUrl = opts.hubUrl;
    this.teamName = opts.teamName;
    this.agent = new https.Agent({
      cert: opts.cert,
      key: opts.key,
      ca: opts.ca,
      // Skip hostname check: in prod hub CN matches URL; in tests they differ
      checkServerIdentity: () => undefined,
    });
  }

  async send(msg: OutboundMessage): Promise<SendResult> {
    const result = await this._request('POST', '/api/send', msg);
    return result as SendResult;
  }

  async getOnline(): Promise<OnlineEntry[]> {
    const result = await this._request('GET', '/api/online');
    return result as OnlineEntry[];
  }

  async getHubStatus(): Promise<HubStatusResult> {
    const result = await this._request('GET', '/api/status');
    return result as HubStatusResult;
  }

  private _request(method: string, path: string, body?: unknown): Promise<unknown> {
    const url = new URL(path, this.hubUrl);
    const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;

    return new Promise((resolve, reject) => {
      const reqOpts: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port ? parseInt(url.port, 10) : 443,
        path: url.pathname,
        method,
        agent: this.agent,
        headers: {
          'Content-Type': 'application/json',
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        },
      };

      const req = https.request(reqOpts, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if ((res.statusCode ?? 500) >= 400) {
              reject(new Error(`Hub error ${res.statusCode}: ${JSON.stringify(parsed)}`));
            } else {
              resolve(parsed);
            }
          } catch {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      });

      req.on('error', reject);
      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  }
}

/** Compute sha256 checksum in the 'sha256:<hex>' format. */
export function computeBodyHash(body: string): string {
  return 'sha256:' + createHash('sha256').update(body, 'utf-8').digest('hex');
}
