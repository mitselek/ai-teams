// (*CD:Kerckhoffs*)
// RED tests for story/30: GET /api/subscribe — SSE message delivery.
//
// Acceptance criteria (Given/When/Then — EN 50716:2023 / CODING_STANDARDS.md):
//
//   AC1 — correct SSE headers + event id field:
//     Given: team-b subscribes via GET /api/subscribe
//     When:  hub sends a message to team-b
//     Then:  response has Content-Type: text/event-stream, Cache-Control: no-cache;
//            each SSE event includes an `id:` field
//
//   AC2 — delivery within 100ms:
//     Given: team-b has active SSE subscription
//     When:  team-a POSTs a message to team-b (t0)
//     Then:  SSE event arrives at team-b within 100ms of t0
//
//   AC3 — fan-out to two concurrent subscribers:
//     Given: team-b has TWO concurrent SSE connections
//     When:  team-a sends one message
//     Then:  BOTH connections receive the event
//
//   AC4 — Last-Event-ID replay on reconnect:
//     Given: team-b subscribed, received events (noted last SSE id), then disconnected;
//            team-a sends M2 while team-b is offline
//     When:  team-b reconnects with `Last-Event-ID: <lastId>` header
//     Then:  M2 replayed; M1 (already seen) NOT re-delivered
//
//   AC5 — offline queue drained on subscribe:
//     Given: team-c has no active subscription;
//            team-a sends a message to team-c (queued)
//     When:  team-c opens SSE subscription
//     Then:  queued message arrives on the new SSE connection
//
//   AC6 — disconnect unregisters subscriber:
//     Given: team-b has active SSE subscription
//     When:  team-b disconnects, then team-a sends another message
//     Then:  no event received (subscriber is gone); hub returns queued: true
//
// RED state:
//   - AC1 (id: field): current impl sends `data:` only — no `id:` line → RED
//   - AC4 (Last-Event-ID): not implemented — hub has no per-team event buffer → RED
//   AC2, AC3, AC5, AC6 may already be GREEN from story/29 implementation.
//
// Ref: https://github.com/mitselek/ai-teams/issues/30
//
// Anti-mocking: real HTTPS + real SSE connections, real mTLS certs.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import * as https from 'node:https';
import type { AddressInfo } from 'node:net';
import type { IncomingMessage } from 'node:http';
import { createHash } from 'node:crypto';

import { createHub } from '../server.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = (srv.address() as AddressInfo).port;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function genCa(dir: string): void {
  execSync(
    `openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${join(dir, 'ca.key')}" -out "${join(dir, 'ca.crt')}" \
     -days 1 -nodes -subj "/CN=test-ca" 2>/dev/null`,
  );
}

function genSignedCert(dir: string, cn: string, caDir: string): void {
  const csrPath = join(dir, `${cn}.csr`);
  execSync(
    `openssl req -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${join(dir, `${cn}.key`)}" -out "${csrPath}" -nodes \
     -subj "/CN=${cn}" 2>/dev/null`,
  );
  execSync(
    `openssl x509 -req -in "${csrPath}" \
     -CA "${join(caDir, 'ca.crt')}" -CAkey "${join(caDir, 'ca.key')}" \
     -CAcreateserial -out "${join(dir, `${cn}.crt`)}" -days 1 2>/dev/null`,
  );
}

function computeBodyHash(body: string): string {
  return 'sha256:' + createHash('sha256').update(body, 'utf-8').digest('hex');
}

function makeMsg(fromTeam: string, toTeam: string, body = 'test-body') {
  return {
    version: '1' as const,
    id: `sub-test-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    from: { team: fromTeam, agent: 'sender' },
    to: { team: toTeam, agent: 'receiver' },
    type: 'query' as const,
    priority: 'normal' as const,
    reply_to: null,
    body,
    checksum: computeBodyHash(body),
  };
}

const SKIP_HOSTNAME = { checkServerIdentity: () => undefined } as const;

function httpsPost(
  port: number,
  ca: string,
  clientCert: { cert: string; key: string },
  body: object,
): Promise<{ status: number; body: string }> {
  const bodyStr = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: '127.0.0.1',
        ...SKIP_HOSTNAME,
        port,
        path: '/api/send',
        method: 'POST',
        ca,
        ...clientCert,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      },
      (res: IncomingMessage) => {
        let data = '';
        res.on('data', (chunk: string) => {
          data += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
      },
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

/** A parsed SSE event: the SSE id line (if present) + the data payload. */
interface SSEEvent {
  /** Value of the `id:` line in the SSE event (undefined if absent). */
  sseId?: string;
  /** Parsed JSON from the `data:` line. */
  data: unknown;
}

interface SSEConnection {
  events: SSEEvent[];
  responseHeaders: Record<string, string | string[] | undefined>;
  /** Resolves once the HTTP response headers have been received. */
  ready: Promise<void>;
  close(): void;
  waitFor(predicate: (e: SSEEvent) => boolean, timeoutMs?: number): Promise<SSEEvent>;
}

/**
 * Open an SSE connection to GET /api/subscribe.
 * Captures response headers when the HTTP response arrives (`.ready` resolves).
 * Pass lastEventId to send the `Last-Event-ID` header (AC4 reconnect test).
 */
function openSSE(
  port: number,
  ca: string,
  clientCert: { cert: string; key: string },
  lastEventId?: string,
): SSEConnection {
  const events: SSEEvent[] = [];
  const responseHeaders: Record<string, string | string[] | undefined> = {};
  let resolveReady!: () => void;
  const ready = new Promise<void>((r) => {
    resolveReady = r;
  });
  let buffer = '';
  let currentSseId: string | undefined;

  const extraHeaders: Record<string, string> = {
    Accept: 'text/event-stream',
  };
  if (lastEventId !== undefined) {
    extraHeaders['Last-Event-ID'] = lastEventId;
  }

  const req = https.request({
    hostname: '127.0.0.1',
    ...SKIP_HOSTNAME,
    port,
    path: '/api/subscribe',
    method: 'GET',
    ca,
    ...clientCert,
    headers: extraHeaders,
  });

  req.on('response', (res: IncomingMessage) => {
    // Capture response headers for AC1 and resolve ready
    Object.assign(responseHeaders, res.headers);
    resolveReady();

    res.setEncoding('utf8');
    res.on('data', (chunk: string) => {
      buffer += chunk;
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        if (!part.trim()) continue;
        let sseId: string | undefined;
        let dataPayload: unknown;

        for (const line of part.split('\n')) {
          if (line.startsWith('id:')) {
            sseId = line.slice('id:'.length).trim();
          } else if (line.startsWith('data:')) {
            const raw = line.slice('data:'.length).trim();
            try {
              dataPayload = JSON.parse(raw);
            } catch {
              dataPayload = raw;
            }
          }
        }

        if (dataPayload !== undefined) {
          currentSseId = sseId ?? currentSseId;
          events.push({ sseId: sseId ?? currentSseId, data: dataPayload });
        }
      }
    });
  });

  req.on('error', () => {});
  req.end();

  function close() {
    req.destroy();
  }

  function waitFor(predicate: (e: SSEEvent) => boolean, timeoutMs = 3000): Promise<SSEEvent> {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeoutMs;
      const poll = () => {
        const match = events.find(predicate);
        if (match) {
          resolve(match);
          return;
        }
        if (Date.now() >= deadline) {
          reject(
            new Error(`SSE event not received within ${timeoutMs}ms. Got ${events.length} events.`),
          );
          return;
        }
        setTimeout(poll, 10);
      };
      poll();
    });
  }

  return { events, responseHeaders, ready, close, waitFor };
}

function settle(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Shared fixture ────────────────────────────────────────────────────────────

let tmpDir: string;
let hubPort: number;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let hub: any;

let caCrt: string;
let teamACert: { cert: string; key: string };
let teamBCert: { cert: string; key: string };
let teamCCert: { cert: string; key: string };

beforeAll(async () => {
  tmpDir = join(tmpdir(), `sub-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tmpDir, { recursive: true });

  genCa(tmpDir);
  caCrt = read(join(tmpDir, 'ca.crt'));
  genSignedCert(tmpDir, 'hub', tmpDir);
  genSignedCert(tmpDir, 'team-a', tmpDir);
  genSignedCert(tmpDir, 'team-b', tmpDir);
  genSignedCert(tmpDir, 'team-c', tmpDir);

  teamACert = { cert: read(join(tmpDir, 'team-a.crt')), key: read(join(tmpDir, 'team-a.key')) };
  teamBCert = { cert: read(join(tmpDir, 'team-b.crt')), key: read(join(tmpDir, 'team-b.key')) };
  teamCCert = { cert: read(join(tmpDir, 'team-c.crt')), key: read(join(tmpDir, 'team-c.key')) };

  hubPort = await getFreePort();
  hub = createHub({
    tls: {
      ca: caCrt,
      cert: read(join(tmpDir, 'hub.crt')),
      key: read(join(tmpDir, 'hub.key')),
    },
    peers: {
      'team-a': teamACert.cert,
      'team-b': teamBCert.cert,
      'team-c': teamCCert.cert,
    },
    logger: false,
  });
  await hub.listen({ port: hubPort, host: '127.0.0.1' });
});

afterAll(async () => {
  await hub?.close?.();
  rmSync(tmpDir, { recursive: true, force: true });
});

// ── AC1 — SSE response headers ────────────────────────────────────────────────
//
// Headers are verified after receiving the first SSE event — Fastify flushes
// response headers on first stream write, so awaiting an event guarantees
// headers have arrived at the client.

describe('AC1 — SSE response headers', () => {
  it('response has Content-Type: text/event-stream', async () => {
    const sub = openSSE(hubPort, caCrt, teamBCert);
    await settle(100);
    const msg = makeMsg('team-a', 'team-b', 'ac1-content-type-probe');
    await httpsPost(hubPort, caCrt, teamACert, msg);
    await sub.waitFor((e) => (e.data as { id?: string })?.id === msg.id, 500);
    sub.close();
    expect(sub.responseHeaders['content-type']).toMatch(/text\/event-stream/);
  });

  it('response has Cache-Control: no-cache', async () => {
    const sub = openSSE(hubPort, caCrt, teamBCert);
    await settle(100);
    const msg = makeMsg('team-a', 'team-b', 'ac1-cache-control-probe');
    await httpsPost(hubPort, caCrt, teamACert, msg);
    await sub.waitFor((e) => (e.data as { id?: string })?.id === msg.id, 500);
    sub.close();
    expect(sub.responseHeaders['cache-control']).toMatch(/no-cache/);
  });
});

// ── AC2 — Delivery within 100ms ───────────────────────────────────────────────

describe('AC2 — delivery within 100ms', () => {
  it('SSE event arrives within 100ms of POST /api/send', async () => {
    const sub = openSSE(hubPort, caCrt, teamBCert);
    await settle(100); // allow TLS + subscribe registration before timing

    const msg = makeMsg('team-a', 'team-b', 'ac2-timing');
    const t0 = Date.now();
    await httpsPost(hubPort, caCrt, teamACert, msg);

    await sub.waitFor((e) => (e.data as { id?: string })?.id === msg.id, 200);
    const elapsed = Date.now() - t0;
    sub.close();

    expect(elapsed).toBeLessThan(100);
  });
});

// ── AC3 — Fan-out to two concurrent subscribers ───────────────────────────────

describe('AC3 — fan-out to two concurrent SSE connections', () => {
  it('both connections for team-b receive the same message', async () => {
    const sub1 = openSSE(hubPort, caCrt, teamBCert);
    const sub2 = openSSE(hubPort, caCrt, teamBCert);
    await settle(100); // allow both SSE connections to register

    const msg = makeMsg('team-a', 'team-b', 'ac3-fanout');
    await httpsPost(hubPort, caCrt, teamACert, msg);

    const [e1, e2] = await Promise.all([
      sub1.waitFor((e) => (e.data as { id?: string })?.id === msg.id),
      sub2.waitFor((e) => (e.data as { id?: string })?.id === msg.id),
    ]);
    sub1.close();
    sub2.close();

    expect((e1.data as { id: string }).id).toBe(msg.id);
    expect((e2.data as { id: string }).id).toBe(msg.id);
  });
});

// ── AC4 — Last-Event-ID replay on reconnect ───────────────────────────────────

describe('AC4 — Last-Event-ID replay on reconnect', () => {
  it('each SSE event carries an id: field (prerequisite for Last-Event-ID)', async () => {
    // RED: current impl sends `data: <JSON>\n\n` — no `id:` line
    const sub = openSSE(hubPort, caCrt, teamBCert);
    await settle(100);
    const msg = makeMsg('team-a', 'team-b', 'ac4-id-field-check');
    await httpsPost(hubPort, caCrt, teamACert, msg);
    const event = await sub.waitFor((e) => (e.data as { id?: string })?.id === msg.id);
    sub.close();
    expect(event.sseId).toBeDefined();
    expect(typeof event.sseId).toBe('string');
    expect(event.sseId!.length).toBeGreaterThan(0);
  });

  it('missed messages are replayed; already-seen messages are not re-sent', async () => {
    // RED: hub does not yet assign SSE id: fields or buffer events per-team.

    // 1. Connect sub1, send M1, receive it, note SSE id
    const sub1 = openSSE(hubPort, caCrt, teamBCert);
    await settle(100);

    const msgM1 = makeMsg('team-a', 'team-b', 'last-event-id-M1');
    await httpsPost(hubPort, caCrt, teamACert, msgM1);

    const eventM1 = await sub1.waitFor((e) => (e.data as { id?: string })?.id === msgM1.id);
    const lastSeenId = eventM1.sseId;
    expect(lastSeenId).toBeDefined(); // fails if hub sends no id: field

    // 2. Disconnect
    sub1.close();
    await settle(50);

    // 3. Send M2 while team-b is offline — goes to queue
    const msgM2 = makeMsg('team-a', 'team-b', 'last-event-id-M2');
    const sendRes = await httpsPost(hubPort, caCrt, teamACert, msgM2);
    expect(JSON.parse(sendRes.body).queued).toBe(true);

    // 4. Reconnect with Last-Event-ID: lastSeenId
    const sub2 = openSSE(hubPort, caCrt, teamBCert, lastSeenId);

    // 5. M2 must be replayed
    const replayedM2 = await sub2.waitFor((e) => (e.data as { id?: string })?.id === msgM2.id);
    sub2.close();

    expect((replayedM2.data as { id: string }).id).toBe(msgM2.id);

    // 6. M1 must NOT be re-delivered (already seen before lastSeenId)
    const duplicateM1 = sub2.events.filter((e) => (e.data as { id?: string })?.id === msgM1.id);
    expect(duplicateM1.length).toBe(0);
  });
});

// ── AC5 — Offline queue drained on subscribe ──────────────────────────────────

describe('AC5 — offline queue drained when subscriber connects', () => {
  it('queued message is delivered to team-c once it subscribes', async () => {
    // Send to team-c while it has no subscriber
    const msg = makeMsg('team-a', 'team-c', 'ac5-offline-drain');
    const res = await httpsPost(hubPort, caCrt, teamACert, msg);
    expect(JSON.parse(res.body).queued).toBe(true);

    // Now team-c subscribes — should receive the queued message
    const sub = openSSE(hubPort, caCrt, teamCCert);

    const event = await sub.waitFor((e) => (e.data as { id?: string })?.id === msg.id);
    sub.close();

    expect((event.data as { id: string }).id).toBe(msg.id);
  });
});

// ── AC6 — Disconnect unregisters subscriber ───────────────────────────────────

describe('AC6 — disconnect unregisters subscriber', () => {
  it('message sent after subscriber disconnects is queued, not pushed to closed stream', async () => {
    // Use team-c (no other active connections in this test suite)
    const sub = openSSE(hubPort, caCrt, teamCCert);
    await settle(100); // allow SSE registration

    // Disconnect
    sub.close();
    await settle(80); // allow close event to propagate through hub

    // Send a message — team-c is now offline, should be queued
    const msg = makeMsg('team-a', 'team-c', 'ac6-post-disconnect');
    const res = await httpsPost(hubPort, caCrt, teamACert, msg);

    expect(JSON.parse(res.body).queued).toBe(true);
    // No SSE events were received on the closed connection after disconnect
    const received = sub.events.filter((e) => (e.data as { id?: string })?.id === msg.id);
    expect(received.length).toBe(0);
  });
});
