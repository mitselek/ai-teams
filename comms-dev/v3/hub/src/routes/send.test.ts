// (*CD:Kerckhoffs*)
// RED tests for story/29: POST /api/send — message routing + offline queue.
//
// Acceptance criteria (Given/When/Then — EN 50716:2023 / CODING_STANDARDS.md):
//
//   AC1 — push to active SSE subscriber:
//     Given: hub running; team-a registered; team-b has active SSE subscription
//     When:  team-a POSTs valid envelope { from: team-a, to: team-b, ... }
//     Then:  HTTP 200, body { ok: true, id }; SSE event delivered to team-b
//
//   AC2 — offline queue:
//     Given: hub running; team-a registered; team-c has NO active SSE subscription
//     When:  team-a POSTs valid envelope { from: team-a, to: team-c, ... }
//     Then:  HTTP 200, body { ok: true, id, queued: true }
//
//   AC3 — invalid envelope → 400:
//     Given: hub running; team-a registered
//     When:  team-a POSTs envelope missing required fields
//     Then:  HTTP 400
//
//   AC4 — duplicate message ID → 409:
//     Given: hub running; team-a registered; message with id 'dup-001' already accepted
//     When:  team-a POSTs envelope with same id 'dup-001'
//     Then:  HTTP 409
//
//   AC5 — valid Ed25519 signature verified:
//     Given: hub configured with team-a Ed25519 sign_pub; message signed with team-a sign_priv
//     When:  team-a POSTs envelope with valid signature + body_hash
//     Then:  HTTP 200 (signature accepted, routed normally)
//
//   AC6 — invalid signature → 403:
//     Given: hub configured with team-a Ed25519 sign_pub; message signed with WRONG key
//     When:  team-a POSTs envelope with invalid signature
//     Then:  HTTP 403
//
//   AC7 — hub forwards body verbatim:
//     Given: team-b has active SSE subscription
//     When:  team-a sends message with body 'VERBATIM-BODY-CHECK'
//     Then:  SSE event at team-b has body field === 'VERBATIM-BODY-CHECK' (no modification)
//
// RED state: POST /api/send and GET /api/subscribe do not exist → tests fail.
// Ref: https://github.com/mitselek/ai-teams/issues/29
//
// Cert generation: same CA + signed cert pattern as server.test.ts.
// Anti-mocking: real HTTPS + real SSE connections, real Ed25519 signing.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import * as https from 'node:https';
import { createHash, generateKeyPairSync, sign as cryptoSign } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { IncomingMessage } from 'node:http';

import { createHub } from '../server.js';

// ── API contract extension (Babbage must add to HubOptions) ───────────────────

declare module '../server.js' {
  interface HubOptions {
    signPubKeys?: Record<string, string>; // teamName → Ed25519 PEM public key
  }
}

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
     -keyout "${join(dir, 'ca.key')}" \
     -out    "${join(dir, 'ca.crt')}" \
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

// Deterministic JSON for sign-input construction (mirrors crypto-v2.ts stableStringify)
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

function computeBodyHash(body: string): string {
  return 'sha256:' + createHash('sha256').update(body, 'utf-8').digest('hex');
}

interface TestMessage {
  version: '1';
  id: string;
  timestamp: string;
  from: { team: string; agent: string };
  to: { team: string; agent: string };
  type: 'query';
  priority: 'normal';
  reply_to: null;
  body: string;
  checksum: string;
  signature?: string;
  body_hash?: string;
}

function makeMsg(fromTeam: string, toTeam: string, body: string, idSuffix = ''): TestMessage {
  const id = `test-send-${idSuffix || Math.random().toString(36).slice(2)}`;
  return {
    version: '1',
    id,
    timestamp: new Date().toISOString(),
    from: { team: fromTeam, agent: 'agent-a' },
    to: { team: toTeam, agent: 'agent-b' },
    type: 'query',
    priority: 'normal',
    reply_to: null,
    body,
    checksum: computeBodyHash(body),
  };
}

/**
 * Sign a message with an Ed25519 private key (same canonical form as crypto-v2.ts).
 * Returns message with signature and body_hash added.
 */
function signMessage(msg: TestMessage, privateKeyPem: string): TestMessage {
  const bodyHash = computeBodyHash(msg.body);
  const signData = {
    version: msg.version,
    id: msg.id,
    timestamp: msg.timestamp,
    from: msg.from,
    to: msg.to,
    type: msg.type,
    priority: msg.priority,
    reply_to: msg.reply_to,
    body_hash: bodyHash,
  };
  const signInput = Buffer.from(stableStringify(signData), 'utf-8');
  const sig = cryptoSign(null, signInput, privateKeyPem);
  return { ...msg, signature: sig.toString('base64'), body_hash: bodyHash };
}

const COMMON_HTTPS_OPTS = {
  hostname: '127.0.0.1',
  checkServerIdentity: () => undefined, // hub cert has no SAN for 127.0.0.1
} as const;

function httpsPost(
  port: number,
  ca: string,
  clientCert: { cert: string; key: string },
  path: string,
  body: object,
): Promise<{ status: number; body: string }> {
  const bodyStr = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        ...COMMON_HTTPS_OPTS,
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

// ── SSE client ────────────────────────────────────────────────────────────────

interface SSEConnection {
  /** All complete SSE data payloads received so far (parsed JSON if valid). */
  events: unknown[];
  /** Close the SSE connection. */
  close(): void;
  /** Wait for an event where predicate returns true, or throw on timeout. */
  waitFor(predicate: (e: unknown) => boolean, timeoutMs?: number): Promise<unknown>;
}

/**
 * Open an SSE connection to GET /api/subscribe on the hub.
 * Returns immediately; events accumulate in .events as they arrive.
 */
function openSSE(
  port: number,
  ca: string,
  clientCert: { cert: string; key: string },
): SSEConnection {
  const events: unknown[] = [];
  let buffer = '';

  const req = https.request({
    ...COMMON_HTTPS_OPTS,
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
      // Split on double-newline (SSE event boundary)
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        const dataLine = part.split('\n').find((l) => l.startsWith('data: '));
        if (dataLine) {
          const raw = dataLine.slice('data: '.length);
          try {
            events.push(JSON.parse(raw));
          } catch {
            events.push(raw);
          }
        }
      }
    });
  });

  req.end();

  function close() {
    req.destroy();
  }

  function waitFor(predicate: (e: unknown) => boolean, timeoutMs = 3000): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeoutMs;
      const poll = () => {
        const match = events.find(predicate);
        if (match) {
          resolve(match);
          return;
        }
        if (Date.now() >= deadline) {
          reject(new Error(`SSE event not received within ${timeoutMs}ms`));
          return;
        }
        setTimeout(poll, 30);
      };
      poll();
    });
  }

  return { events, close, waitFor };
}

// ── Shared fixture ────────────────────────────────────────────────────────────

let tmpDir: string;
let hubPort: number;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let hub: any;

let caCrt: string;
let teamACert: { cert: string; key: string };
let teamBCert: { cert: string; key: string };

// Ed25519 keys for team-a (for signature tests)
let teamASignPrivPem: string;
let teamASignPubPem: string;
// Ed25519 keys for an attacker (wrong key → invalid signature)
let attackerSignPrivPem: string;

beforeAll(async () => {
  tmpDir = join(tmpdir(), `send-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tmpDir, { recursive: true });

  genCa(tmpDir);
  caCrt = read(join(tmpDir, 'ca.crt'));
  genSignedCert(tmpDir, 'hub', tmpDir);
  genSignedCert(tmpDir, 'team-a', tmpDir);
  genSignedCert(tmpDir, 'team-b', tmpDir);
  // team-c: registered for mTLS but will not open SSE (offline queue target)
  genSignedCert(tmpDir, 'team-c', tmpDir);

  teamACert = { cert: read(join(tmpDir, 'team-a.crt')), key: read(join(tmpDir, 'team-a.key')) };
  teamBCert = { cert: read(join(tmpDir, 'team-b.crt')), key: read(join(tmpDir, 'team-b.key')) };

  // Ed25519 keypair for team-a (signing)
  const teamAKeys = generateKeyPairSync('ed25519');
  teamASignPrivPem = teamAKeys.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
  teamASignPubPem = teamAKeys.publicKey.export({ type: 'spki', format: 'pem' }) as string;

  // Attacker keypair — wrong key, not registered with hub
  const attackerKeys = generateKeyPairSync('ed25519');
  attackerSignPrivPem = attackerKeys.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

  hubPort = await getFreePort();

  // RED: POST /api/send and GET /api/subscribe not yet implemented in server.ts
  hub = createHub({
    tls: {
      ca: caCrt,
      cert: read(join(tmpDir, 'hub.crt')),
      key: read(join(tmpDir, 'hub.key')),
    },
    peers: {
      'team-a': teamACert.cert,
      'team-b': teamBCert.cert,
      'team-c': read(join(tmpDir, 'team-c.crt')),
    },
    signPubKeys: {
      'team-a': teamASignPubPem,
    },
    logger: false,
  });

  await hub.listen({ port: hubPort, host: '127.0.0.1' });
});

afterAll(async () => {
  await hub?.close?.();
  rmSync(tmpDir, { recursive: true, force: true });
});

// ── AC1 — Valid envelope + active SSE subscriber ──────────────────────────────

describe('AC1 — push to active SSE subscriber', () => {
  it('given team-b subscribed via SSE, when team-a sends to team-b, then HTTP 200 { ok, id }', async () => {
    const sub = openSSE(hubPort, caCrt, teamBCert);

    const msg = makeMsg('team-a', 'team-b', 'hello team-b via SSE');
    const res = await httpsPost(hubPort, caCrt, teamACert, '/api/send', msg);
    sub.close();

    expect(res.status).toBe(200);
    const body = JSON.parse(res.body) as { ok: boolean; id: string; queued?: boolean };
    expect(body.ok).toBe(true);
    expect(body.id).toBe(msg.id);
    expect(body.queued).toBeFalsy();
  });

  it('given team-b subscribed via SSE, when team-a sends, then SSE event delivered to team-b', async () => {
    const sub = openSSE(hubPort, caCrt, teamBCert);
    // Allow SSE connection to establish before sending
    await new Promise((r) => setTimeout(r, 100));

    const msg = makeMsg('team-a', 'team-b', 'sse-delivery-check');
    await httpsPost(hubPort, caCrt, teamACert, '/api/send', msg);

    const event = await sub.waitFor(
      (e) => typeof e === 'object' && e !== null && (e as { id?: string }).id === msg.id,
    );
    sub.close();

    expect(event).toBeDefined();
  });
});

// ── AC2 — Offline destination → queued ────────────────────────────────────────

describe('AC2 — offline destination queued', () => {
  it('given team-c has no SSE subscription, when team-a sends to team-c, then { ok, id, queued: true }', async () => {
    const msg = makeMsg('team-a', 'team-c', 'offline-queued-message');
    const res = await httpsPost(hubPort, caCrt, teamACert, '/api/send', msg);

    expect(res.status).toBe(200);
    const body = JSON.parse(res.body) as { ok: boolean; id: string; queued: boolean };
    expect(body.ok).toBe(true);
    expect(body.id).toBe(msg.id);
    expect(body.queued).toBe(true);
  });
});

// ── AC3 — Invalid envelope → 400 ──────────────────────────────────────────────

describe('AC3 — invalid envelope', () => {
  it('given missing "to" field, when team-a POSTs, then HTTP 400', async () => {
    const { to: _, ...noTo } = makeMsg('team-a', 'team-b', 'bad-msg');
    const res = await httpsPost(hubPort, caCrt, teamACert, '/api/send', noTo);
    expect(res.status).toBe(400);
  });

  it('given missing "id" field, when team-a POSTs, then HTTP 400', async () => {
    const { id: _, ...noId } = makeMsg('team-a', 'team-b', 'bad-msg');
    const res = await httpsPost(hubPort, caCrt, teamACert, '/api/send', noId);
    expect(res.status).toBe(400);
  });

  it('given missing "body" field, when team-a POSTs, then HTTP 400', async () => {
    const { body: _, ...noBody } = makeMsg('team-a', 'team-b', 'bad-msg');
    const res = await httpsPost(hubPort, caCrt, teamACert, '/api/send', noBody);
    expect(res.status).toBe(400);
  });
});

// ── AC4 — Duplicate message ID → 409 ─────────────────────────────────────────

describe('AC4 — duplicate message ID', () => {
  it('given first send accepted, when same message ID re-sent, then HTTP 409', async () => {
    const msg = makeMsg('team-a', 'team-c', 'dup-test', 'dup-001');

    const first = await httpsPost(hubPort, caCrt, teamACert, '/api/send', msg);
    expect(first.status).toBe(200);

    const second = await httpsPost(hubPort, caCrt, teamACert, '/api/send', msg);
    expect(second.status).toBe(409);
  });
});

// ── AC5 — Valid Ed25519 signature accepted ────────────────────────────────────

describe('AC5 — valid Ed25519 signature', () => {
  it('given team-a sign_pub configured, when message has valid signature, then HTTP 200', async () => {
    const msg = signMessage(makeMsg('team-a', 'team-c', 'signed-message'), teamASignPrivPem);
    const res = await httpsPost(hubPort, caCrt, teamACert, '/api/send', msg);
    expect(res.status).toBe(200);
  });
});

// ── AC6 — Invalid signature → 403 ────────────────────────────────────────────

describe('AC6 — invalid Ed25519 signature', () => {
  it('given team-a sign_pub configured, when message has wrong-key signature, then HTTP 403', async () => {
    // Sign with attacker key (not team-a's registered key)
    const msg = signMessage(makeMsg('team-a', 'team-c', 'bad-sig-message'), attackerSignPrivPem);
    const res = await httpsPost(hubPort, caCrt, teamACert, '/api/send', msg);
    expect(res.status).toBe(403);
  });
});

// ── AC7 — Hub forwards body verbatim ─────────────────────────────────────────

describe('AC7 — body forwarded verbatim', () => {
  it('given team-b subscribed via SSE, when team-a sends with specific body, then SSE event body is unchanged', async () => {
    const VERBATIM_BODY = 'VERBATIM-BODY-CHECK-' + Math.random().toString(36).slice(2);
    const sub = openSSE(hubPort, caCrt, teamBCert);
    await new Promise((r) => setTimeout(r, 100));

    const msg = makeMsg('team-a', 'team-b', VERBATIM_BODY);
    await httpsPost(hubPort, caCrt, teamACert, '/api/send', msg);

    const event = (await sub.waitFor(
      (e) => typeof e === 'object' && e !== null && (e as { id?: string }).id === msg.id,
    )) as { body: string };
    sub.close();

    expect(event.body).toBe(VERBATIM_BODY);
  });
});
