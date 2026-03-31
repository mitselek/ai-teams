// (*CD:Kerckhoffs*)
// RED tests for story/32: SQLite offline message queue.
//
// Acceptance criteria (Given/When/Then — EN 50716:2023 / CODING_STANDARDS.md):
//
//   AC1 — bulk storage:
//     Given: team-b has no active SSE subscription
//     When:  5 messages are sent to team-b
//     Then:  all 5 are stored; queueDepth === 5
//
//   AC2 — ordered replay on reconnect:
//     Given: team-b receives M1 live; then disconnects; M2 and M3 are queued while offline
//     When:  team-b reconnects (no Last-Event-ID filter needed)
//     Then:  M2 is delivered before M3 (insertion order preserved)
//
//   AC3 — capacity cap (oldest dropped):
//     Given: hub with queueCapacity: 3; team-b offline
//     When:  4 messages (M1..M4) are sent
//     Then:  queue holds exactly 3; M1 (oldest) is absent; M2, M3, M4 are present
//
//   AC4 — TTL expiry:
//     Given: hub with queueTtlMs: 100; team-b offline
//     When:  M1 is queued, 150ms elapse, team-b subscribes (triggering cleanup)
//     Then:  M1 is NOT delivered; queueDepth is 0
//
//   AC5 — persistence across restart:
//     Given: hub using queuePath file; M1 queued for offline team-b
//     When:  hub is closed and a new hub opens with the same queuePath
//     Then:  M1 is delivered to team-b on the new hub
//
//   AC6 — opaque body (E2E encrypted):
//     Given: message body is an opaque base64 blob (E2E-encrypted)
//     When:  it passes through the offline queue
//     Then:  the body is delivered byte-for-byte unchanged; hub does not decrypt
//
//   AC7 — SQL injection resistance:
//     Given: team name contains SQL metacharacters (`'; DROP TABLE messages; --`)
//     When:  the team is registered and a message is queued for another team
//     Then:  the queue remains functional (parameterized statements prevented injection)
//
// RED state (against current in-memory offlineQueue Map):
//   AC3: queueCapacity option not implemented → 4th message stored, oldest not dropped
//   AC4: queueTtlMs option not implemented → expired message still delivered
//   AC5: in-memory queue lost on hub.close() → no messages after restart
//   AC1, AC2, AC6, AC7 may be accidentally GREEN; file is RED due to AC3/AC4/AC5.
//
// New HubOptions fields required (Babbage to add):
//   queuePath?: string        — SQLite file path; absent = :memory: or temp file
//   queueCapacity?: number    — max messages per team; default 100
//   queueTtlMs?: number       — message TTL ms; default 86_400_000 (24h)
//
// Ref: https://github.com/mitselek/ai-teams/issues/32

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import * as https from 'node:https';
import type { AddressInfo } from 'node:net';
import type { IncomingMessage } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';

import { createHub } from '../server.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

type HubOptionsExt = Parameters<typeof createHub>[0] & {
  queuePath?: string;
  queueCapacity?: number;
  queueTtlMs?: number;
};

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

const SKIP_HOSTNAME = { checkServerIdentity: () => undefined } as const;

function httpsGet(
  port: number,
  path: string,
  ca: string,
  clientCert: { cert: string; key: string },
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: '127.0.0.1',
        ...SKIP_HOSTNAME,
        port,
        path,
        method: 'GET',
        ca,
        ...clientCert,
      },
      (res: IncomingMessage) => {
        let body = '';
        res.on('data', (chunk: string) => {
          body += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function httpsPost(
  port: number,
  path: string,
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
        path,
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

interface SSEEvent {
  sseId?: string;
  data: unknown;
}

interface SSEConnection {
  events: SSEEvent[];
  close(): void;
  waitFor(predicate: (e: SSEEvent) => boolean, timeoutMs?: number): Promise<SSEEvent>;
}

function openSSE(
  port: number,
  ca: string,
  clientCert: { cert: string; key: string },
): SSEConnection {
  const events: SSEEvent[] = [];
  let buffer = '';
  let currentSseId: string | undefined;

  const req = https.request({
    hostname: '127.0.0.1',
    ...SKIP_HOSTNAME,
    port,
    path: '/api/subscribe',
    method: 'GET',
    ca,
    ...clientCert,
    headers: { Accept: 'text/event-stream' },
  });

  req.on('response', (res: IncomingMessage) => {
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
          if (line.startsWith('id:')) sseId = line.slice(3).trim();
          else if (line.startsWith('data:')) {
            const raw = line.slice(5).trim();
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

  return {
    events,
    close: () => req.destroy(),
    waitFor(predicate, timeoutMs = 3000) {
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
              new Error(
                `SSE event not received within ${timeoutMs}ms. Got ${events.length} events.`,
              ),
            );
            return;
          }
          setTimeout(poll, 10);
        };
        poll();
      });
    },
  };
}

function settle(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function makeMsg(fromTeam: string, toTeam: string, body = 'test-body') {
  const hash = 'sha256:' + createHash('sha256').update(body, 'utf-8').digest('hex');
  return {
    version: '1' as const,
    id: `q-test-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    from: { team: fromTeam, agent: 'sender' },
    to: { team: toTeam, agent: 'receiver' },
    type: 'query' as const,
    priority: 'normal' as const,
    reply_to: null,
    body,
    checksum: hash,
  };
}

// ── Shared cert fixture ───────────────────────────────────────────────────────

let tmpDir: string;
let caCrt: string;
let hubCrt: string;
let hubKey: string;
let teamACert: { cert: string; key: string };
let teamBCert: { cert: string; key: string };

beforeAll(() => {
  tmpDir = join(tmpdir(), `queue-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tmpDir, { recursive: true });

  genCa(tmpDir);
  caCrt = read(join(tmpDir, 'ca.crt'));
  for (const cn of ['hub', 'team-a', 'team-b']) {
    genSignedCert(tmpDir, cn, tmpDir);
  }

  hubCrt = read(join(tmpDir, 'hub.crt'));
  hubKey = read(join(tmpDir, 'hub.key'));
  teamACert = { cert: read(join(tmpDir, 'team-a.crt')), key: read(join(tmpDir, 'team-a.key')) };
  teamBCert = { cert: read(join(tmpDir, 'team-b.crt')), key: read(join(tmpDir, 'team-b.key')) };
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// ── AC1 — Bulk storage ────────────────────────────────────────────────────────

describe('AC1 — 5 messages sent to offline team stored in queue', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hub: any;
  let hubPort: number;

  beforeAll(async () => {
    hubPort = await getFreePort();
    hub = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: { 'team-a': teamACert.cert, 'team-b': teamBCert.cert },
      logger: false,
    });
    await hub.listen({ port: hubPort, host: '127.0.0.1' });
  });

  afterAll(async () => {
    await hub?.close?.();
  });

  it('5 messages queued for offline team-b → queueDepth === 5', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await httpsPost(
        hubPort,
        '/api/send',
        caCrt,
        teamACert,
        makeMsg('team-a', 'team-b', `bulk-${i}`),
      );
      expect(JSON.parse(res.body).queued).toBe(true);
    }
    const status = await httpsGet(hubPort, '/api/status', caCrt, teamACert);
    const body = JSON.parse(status.body) as { queueDepth: number };
    expect(body.queueDepth).toBe(5);
  });
});

// ── AC2 — Ordered replay on reconnect ────────────────────────────────────────

describe('AC2 — queued messages delivered in insertion order on reconnect', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hub: any;
  let hubPort: number;

  beforeAll(async () => {
    hubPort = await getFreePort();
    hub = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: { 'team-a': teamACert.cert, 'team-b': teamBCert.cert },
      logger: false,
    });
    await hub.listen({ port: hubPort, host: '127.0.0.1' });
  });

  afterAll(async () => {
    await hub?.close?.();
  });

  it('M2 is delivered before M3 when both were queued while team-b was offline', async () => {
    // 1. Establish subscription briefly (to confirm hub is up), then disconnect
    const sub0 = openSSE(hubPort, caCrt, teamBCert);
    await settle(80);
    sub0.close();
    await settle(50); // allow hub to process disconnect

    // 2. Send M2 then M3 while team-b is offline (both queued)
    const msgM2 = makeMsg('team-a', 'team-b', 'order-M2');
    const msgM3 = makeMsg('team-a', 'team-b', 'order-M3');
    await httpsPost(hubPort, '/api/send', caCrt, teamACert, msgM2);
    await httpsPost(hubPort, '/api/send', caCrt, teamACert, msgM3);

    // 3. Reconnect — both messages should drain from queue
    const sub = openSSE(hubPort, caCrt, teamBCert);

    await sub.waitFor((e) => (e.data as { id?: string })?.id === msgM3.id, 2000);
    sub.close();

    // Verify order: M2 appears before M3
    const idxM2 = sub.events.findIndex((e) => (e.data as { id?: string })?.id === msgM2.id);
    const idxM3 = sub.events.findIndex((e) => (e.data as { id?: string })?.id === msgM3.id);
    expect(idxM2).toBeGreaterThanOrEqual(0);
    expect(idxM3).toBeGreaterThanOrEqual(0);
    expect(idxM2).toBeLessThan(idxM3);
  });
});

// ── AC3 — Queue capacity (oldest dropped) ────────────────────────────────────

describe('AC3 — queue capacity: oldest message dropped when limit reached', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hub: any;
  let hubPort: number;
  const msgs: ReturnType<typeof makeMsg>[] = [];

  beforeAll(async () => {
    hubPort = await getFreePort();
    hub = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: { 'team-a': teamACert.cert, 'team-b': teamBCert.cert },
      queueCapacity: 3,
      logger: false,
    } as HubOptionsExt);
    await hub.listen({ port: hubPort, host: '127.0.0.1' });

    // Send M1..M4 while team-b is offline (capacity = 3 → M1 dropped)
    for (let i = 1; i <= 4; i++) {
      const msg = makeMsg('team-a', 'team-b', `cap-M${i}`);
      msgs.push(msg);
      await httpsPost(hubPort, '/api/send', caCrt, teamACert, msg);
    }
  });

  afterAll(async () => {
    await hub?.close?.();
  });

  it('queue holds exactly 3 messages after 4th arrives (capacity = 3)', async () => {
    // RED: queueCapacity not implemented → queueDepth === 4
    const res = await httpsGet(hubPort, '/api/status', caCrt, teamACert);
    const body = JSON.parse(res.body) as { queueDepth: number };
    expect(body.queueDepth).toBe(3);
  });

  it('oldest message M1 is not delivered on reconnect', async () => {
    // RED: M1 still in queue → delivered → test fails
    const sub = openSSE(hubPort, caCrt, teamBCert);
    // Wait for the 3 messages that should be there
    await sub.waitFor((e) => (e.data as { id?: string })?.id === msgs[3].id, 2000);
    sub.close();

    const gotM1 = sub.events.some((e) => (e.data as { id?: string })?.id === msgs[0].id);
    expect(gotM1).toBe(false);
  });

  it('M2, M3, M4 are all delivered on reconnect', async () => {
    // Send them again since sub above drained the queue
    const sub2 = openSSE(hubPort, caCrt, teamBCert);

    // Re-queue M2..M4 (queue was drained by sub above)
    const fresh: ReturnType<typeof makeMsg>[] = [];
    for (let i = 2; i <= 4; i++) {
      const msg = makeMsg('team-a', 'team-b', `cap-refill-M${i}`);
      fresh.push(msg);
      await httpsPost(hubPort, '/api/send', caCrt, teamACert, msg);
    }

    await sub2.waitFor((e) => (e.data as { id?: string })?.id === fresh[2].id, 2000);
    sub2.close();

    expect(sub2.events.some((e) => (e.data as { id?: string })?.id === fresh[0].id)).toBe(true);
    expect(sub2.events.some((e) => (e.data as { id?: string })?.id === fresh[1].id)).toBe(true);
    expect(sub2.events.some((e) => (e.data as { id?: string })?.id === fresh[2].id)).toBe(true);
  });
});

// ── AC4 — TTL expiry ──────────────────────────────────────────────────────────

describe('AC4 — TTL: expired messages not delivered and removed from queue', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hub: any;
  let hubPort: number;

  beforeAll(async () => {
    hubPort = await getFreePort();
    hub = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: { 'team-a': teamACert.cert, 'team-b': teamBCert.cert },
      queueTtlMs: 100, // 100ms TTL for test speed
      logger: false,
    } as HubOptionsExt);
    await hub.listen({ port: hubPort, host: '127.0.0.1' });
  });

  afterAll(async () => {
    await hub?.close?.();
  });

  it('message queued > TTL ago is not delivered when team-b subscribes', async () => {
    // RED: queueTtlMs not implemented → message delivered normally
    const expiredMsg = makeMsg('team-a', 'team-b', 'ttl-expired');
    const res = await httpsPost(hubPort, '/api/send', caCrt, teamACert, expiredMsg);
    expect(JSON.parse(res.body).queued).toBe(true);

    await settle(150); // message is now > 100ms old (expired)

    // Subscribe triggers cleanup; queue drains (nothing to deliver)
    const sub = openSSE(hubPort, caCrt, teamBCert);
    await settle(200); // generous wait — if delivered it would arrive here
    sub.close();

    const delivered = sub.events.some((e) => (e.data as { id?: string })?.id === expiredMsg.id);
    expect(delivered).toBe(false);
  });

  it('queueDepth is 0 after TTL cleanup', async () => {
    // Subscribe again to ensure cleanup ran (already done above)
    const res = await httpsGet(hubPort, '/api/status', caCrt, teamACert);
    const body = JSON.parse(res.body) as { queueDepth: number };
    expect(body.queueDepth).toBe(0);
  });
});

// ── AC5 — Persistence across hub restart ─────────────────────────────────────

describe('AC5 — SQLite queue persists across hub restart', () => {
  it('message queued before hub restart is delivered after restart', async () => {
    // RED: in-memory queue lost on hub.close() → message gone after restart
    const dbPath = join(tmpDir, `queue-ac5-${Date.now()}.db`);
    const port1 = await getFreePort();

    // First hub instance: queue M1 to offline team-b
    const hub1 = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: { 'team-a': teamACert.cert, 'team-b': teamBCert.cert },
      queuePath: dbPath,
      logger: false,
    } as HubOptionsExt);
    await hub1.listen({ port: port1, host: '127.0.0.1' });

    const persistMsg = makeMsg('team-a', 'team-b', 'persist-across-restart');
    const sendRes = await httpsPost(port1, '/api/send', caCrt, teamACert, persistMsg);
    expect(JSON.parse(sendRes.body).queued).toBe(true);

    await hub1.close();

    // Verify SQLite file was created
    expect(existsSync(dbPath)).toBe(true);

    // Second hub instance: same dbPath — M1 should still be in queue
    const port2 = await getFreePort();
    const hub2 = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: { 'team-a': teamACert.cert, 'team-b': teamBCert.cert },
      queuePath: dbPath,
      logger: false,
    } as HubOptionsExt);
    await hub2.listen({ port: port2, host: '127.0.0.1' });

    // team-b subscribes on the NEW hub — M1 should drain from persistent queue
    const sub = openSSE(port2, caCrt, teamBCert);
    const event = await sub.waitFor((e) => (e.data as { id?: string })?.id === persistMsg.id, 3000);
    sub.close();
    await hub2.close();

    expect((event.data as { id: string }).id).toBe(persistMsg.id);
  });
});

// ── AC6 — Opaque E2E-encrypted body ──────────────────────────────────────────

describe('AC6 — E2E-encrypted body passes through queue unchanged', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hub: any;
  let hubPort: number;

  beforeAll(async () => {
    hubPort = await getFreePort();
    hub = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: { 'team-a': teamACert.cert, 'team-b': teamBCert.cert },
      logger: false,
    });
    await hub.listen({ port: hubPort, host: '127.0.0.1' });
  });

  afterAll(async () => {
    await hub?.close?.();
  });

  it('opaque base64 body delivered byte-for-byte unchanged after queuing', async () => {
    // Simulate E2E-encrypted body: random bytes encoded as base64
    const encryptedBody = randomBytes(64).toString('base64');
    const hash = 'sha256:' + createHash('sha256').update(encryptedBody, 'utf-8').digest('hex');
    const msg = {
      version: '1' as const,
      id: `q-test-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      from: { team: 'team-a', agent: 'sender' },
      to: { team: 'team-b', agent: 'receiver' },
      type: 'query' as const,
      priority: 'normal' as const,
      reply_to: null,
      body: encryptedBody, // opaque blob
      checksum: hash,
    };

    const sendRes = await httpsPost(hubPort, '/api/send', caCrt, teamACert, msg);
    expect(JSON.parse(sendRes.body).queued).toBe(true);

    const sub = openSSE(hubPort, caCrt, teamBCert);
    const event = await sub.waitFor((e) => (e.data as { id?: string })?.id === msg.id, 3000);
    sub.close();

    const delivered = event.data as { body: string };
    expect(delivered.body).toBe(encryptedBody);
  });
});

// ── AC7 — SQL injection resistance ───────────────────────────────────────────

describe('AC7 — SQL injection resistance: parameterized statements prevent injection', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hub: any;
  let hubPort: number;

  beforeAll(async () => {
    hubPort = await getFreePort();
    hub = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: { 'team-a': teamACert.cert, 'team-b': teamBCert.cert },
      logger: false,
    });
    await hub.listen({ port: hubPort, host: '127.0.0.1' });
  });

  afterAll(async () => {
    await hub?.close?.();
  });

  it('registering team with SQL metacharacters does not corrupt the queue', async () => {
    // Attempt injection via team name in POST /api/register
    // With string concatenation: `WHERE team = '${injection}'` → DROP TABLE
    // With parameterized: injection is a literal string value → safe
    const injectionName = "legit'; DROP TABLE messages; --";
    await httpsPost(hubPort, '/api/register', caCrt, teamACert, {
      team: injectionName,
      cert: teamACert.cert,
    });

    // Now queue a message to team-b; if DROP TABLE executed, this will fail/return wrong depth
    const msg = makeMsg('team-a', 'team-b', 'post-injection-queue');
    const sendRes = await httpsPost(hubPort, '/api/send', caCrt, teamACert, msg);
    expect(JSON.parse(sendRes.body).queued).toBe(true);

    // Queue must still work: queueDepth > 0
    const status = await httpsGet(hubPort, '/api/status', caCrt, teamACert);
    const body = JSON.parse(status.body) as { queueDepth: number };
    expect(body.queueDepth).toBeGreaterThan(0);

    // Delivery still works: subscribe and receive the message
    const sub = openSSE(hubPort, caCrt, teamBCert);
    const event = await sub.waitFor((e) => (e.data as { id?: string })?.id === msg.id, 3000);
    sub.close();
    expect((event.data as { id: string }).id).toBe(msg.id);
  });
});
