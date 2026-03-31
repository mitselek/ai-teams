// (*CD:Kerckhoffs*)
// RED tests for story/28: Fastify hub with mTLS authentication.
//
// Acceptance criteria (Given/When/Then — EN 50716:2023 / CODING_STANDARDS.md):
//
//   AC1 — valid cert:
//     Given: hub running with 'team-a' cert pre-registered
//     When:  client connects presenting 'team-a' cert
//     Then:  HTTP 200; response body contains peerTeam: 'team-a'
//
//   AC2 — unregistered cert:
//     Given: hub running; 'team-b' cert is CA-signed but NOT in registry
//     When:  client connects presenting 'team-b' cert
//     Then:  HTTP 403
//
//   AC3 — no client cert:
//     Given: hub running with requestCert: true, rejectUnauthorized: true
//     When:  client connects without any client certificate
//     Then:  TLS handshake rejected (connection error, no HTTP response)
//
//   AC4 — hot-reload via POST /api/register:
//     Given: hub running with only 'team-a' registered; 'team-c' NOT registered
//     When:  team-a POSTs { team: 'team-c', cert: <PEM> } to POST /api/register
//     Then:  next connection from 'team-c' returns 200 (no hub restart)
//
//   AC5 — per-peer rate limiting:
//     Given: hub running with rate limit { max: 10, timeWindow: 60_000 }
//     When:  'team-a' sends 15 rapid requests
//     Then:  first 10 return 200; remaining 5 return 429
//
//   AC6 — Pino structured logging includes peerTeam:
//     Given: hub with Pino logger writing to captured stream
//     When:  'team-a' makes a request
//     Then:  at least one log line is valid JSON with field peerTeam: 'team-a'
//
// RED state: createHub is not exported from server.ts → runtime TypeError.
// Ref: https://github.com/mitselek/ai-teams/issues/28
//
// Cert generation: real CA-signed EC/P-256 certs (CA → hub cert + peer certs).
// Anti-mocking: real HTTPS TLS connections with real client certificates.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import * as https from 'node:https';
import type { AddressInfo } from 'node:net';

// RED: createHub is not yet exported from server.ts → undefined at runtime → TypeError in beforeAll
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createHub } = (await import('./server.js')) as any;

// ── Types (define the API contract Babbage must implement) ─────────────────────

export interface HubOptions {
  tls: {
    ca: string; // CA cert PEM — used to verify client certs
    cert: string; // Hub's TLS cert PEM
    key: string; // Hub's TLS key PEM
  };
  peers?: Record<string, string>; // teamName → cert PEM (pre-registered)
  rateLimit?: { max: number; timeWindow: number }; // per-peer sliding window
  logger?: boolean | { stream: NodeJS.WritableStream }; // Pino config
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

/**
 * Generate a CA keypair in dir/ca.{key,crt}, then sign a named cert.
 * Returns paths to all generated files.
 */
function genCa(dir: string): void {
  execSync(
    `openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${join(dir, 'ca.key')}" \
     -out    "${join(dir, 'ca.crt')}" \
     -days 1 -nodes \
     -subj "/CN=test-ca" 2>/dev/null`,
  );
}

function genSignedCert(dir: string, cn: string, caDir: string): void {
  const csrPath = join(dir, `${cn}.csr`);
  const keyPath = join(dir, `${cn}.key`);
  const crtPath = join(dir, `${cn}.crt`);
  execSync(
    `openssl req -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${keyPath}" -out "${csrPath}" -nodes \
     -subj "/CN=${cn}" 2>/dev/null`,
  );
  execSync(
    `openssl x509 -req -in "${csrPath}" \
     -CA  "${join(caDir, 'ca.crt')}" \
     -CAkey "${join(caDir, 'ca.key')}" \
     -CAcreateserial -out "${crtPath}" \
     -days 1 2>/dev/null`,
  );
}

/**
 * Make an HTTPS GET to the hub on /api/status.
 * clientCert: { cert, key } if presenting a client cert; omit for no-cert test.
 * Returns { status } on success, or throws on connection error.
 */
function httpsGet(
  port: number,
  path: string,
  ca: string,
  clientCert?: { cert: string; key: string },
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'GET',
        ca,
        // Hub cert CN=hub has no SAN for 127.0.0.1; CA verification (above) is
        // the meaningful check here — skip hostname validation.
        checkServerIdentity: () => undefined,
        ...(clientCert ?? {}),
      },
      (res) => {
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

/**
 * POST JSON to the hub on /api/register using team-a's client cert.
 */
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
        port,
        path,
        method: 'POST',
        ca,
        checkServerIdentity: () => undefined,
        ...clientCert,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      },
      (res) => {
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

// ── Shared fixture ────────────────────────────────────────────────────────────

let tmpDir: string;
let hubPort: number;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let hub: any; // FastifyInstance — typed as any until server.ts exports the type

let caCrt: string;
let hubTeamACert: { cert: string; key: string };
let teamBCert: { cert: string; key: string };
let teamCCert: { cert: string; key: string };
let teamCCertPem: string;

beforeAll(async () => {
  tmpDir = join(tmpdir(), `hub-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tmpDir, { recursive: true });

  // 1. CA
  genCa(tmpDir);
  caCrt = read(join(tmpDir, 'ca.crt'));

  // 2. Hub cert (signed by CA)
  genSignedCert(tmpDir, 'hub', tmpDir);

  // 3. Peer certs (all signed by the same CA)
  genSignedCert(tmpDir, 'team-a', tmpDir);
  genSignedCert(tmpDir, 'team-b', tmpDir);
  genSignedCert(tmpDir, 'team-c', tmpDir);

  hubTeamACert = {
    cert: read(join(tmpDir, 'team-a.crt')),
    key: read(join(tmpDir, 'team-a.key')),
  };
  teamBCert = {
    cert: read(join(tmpDir, 'team-b.crt')),
    key: read(join(tmpDir, 'team-b.key')),
  };
  teamCCert = {
    cert: read(join(tmpDir, 'team-c.crt')),
    key: read(join(tmpDir, 'team-c.key')),
  };
  teamCCertPem = read(join(tmpDir, 'team-c.crt'));

  hubPort = await getFreePort();

  // RED: createHub is not implemented — this will throw "createHub is not a function"
  hub = createHub({
    tls: {
      ca: caCrt,
      cert: read(join(tmpDir, 'hub.crt')),
      key: read(join(tmpDir, 'hub.key')),
    },
    peers: {
      'team-a': hubTeamACert.cert,
      // team-b is intentionally NOT pre-registered (AC2)
      // team-c is intentionally NOT pre-registered (AC4 — registered at runtime)
    },
    rateLimit: { max: 10, timeWindow: 60_000 },
  });

  await hub.listen({ port: hubPort, host: '127.0.0.1' });
});

afterAll(async () => {
  await hub?.close?.();
  rmSync(tmpDir, { recursive: true, force: true });
});

// ── AC1 — Valid registered cert ────────────────────────────────────────────────

describe('AC1 — valid registered cert', () => {
  it('given team-a registered, when team-a connects, then HTTP 200', async () => {
    const res = await httpsGet(hubPort, '/api/status', caCrt, hubTeamACert);
    expect(res.status).toBe(200);
  });

  it('given team-a registered, when team-a connects, then response peerTeam = team-a', async () => {
    const res = await httpsGet(hubPort, '/api/status', caCrt, hubTeamACert);
    const body = JSON.parse(res.body) as { peerTeam: string };
    expect(body.peerTeam).toBe('team-a');
  });
});

// ── AC2 — Unregistered cert ────────────────────────────────────────────────────

describe('AC2 — unregistered CA-signed cert', () => {
  it('given team-b cert not in registry, when team-b connects, then HTTP 403', async () => {
    const res = await httpsGet(hubPort, '/api/status', caCrt, teamBCert);
    expect(res.status).toBe(403);
  });
});

// ── AC3 — No client cert ───────────────────────────────────────────────────────

describe('AC3 — no client certificate', () => {
  it('given hub requires client cert, when client presents no cert, then connection rejected', async () => {
    // Hub uses requestCert: true, rejectUnauthorized: true → TLS handshake fails.
    // httpsGet rejects the returned Promise → expect it to throw.
    await expect(httpsGet(hubPort, '/api/status', caCrt, undefined)).rejects.toThrow();
  });
});

// ── AC4 — Hot-reload via POST /api/register ────────────────────────────────────

describe('AC4 — hot-reload: POST /api/register', () => {
  it('given team-c not registered, when team-c connects, then 403 (baseline)', async () => {
    const res = await httpsGet(hubPort, '/api/status', caCrt, teamCCert);
    expect(res.status).toBe(403);
  });

  it('when team-a POSTs team-c cert to /api/register, then 201', async () => {
    const res = await httpsPost(hubPort, '/api/register', caCrt, hubTeamACert, {
      team: 'team-c',
      cert: teamCCertPem,
    });
    expect(res.status).toBe(201);
  });

  it('after registration, team-c connects and gets 200 (no restart)', async () => {
    const res = await httpsGet(hubPort, '/api/status', caCrt, teamCCert);
    expect(res.status).toBe(200);
  });

  it('after registration, response peerTeam = team-c', async () => {
    const res = await httpsGet(hubPort, '/api/status', caCrt, teamCCert);
    const body = JSON.parse(res.body) as { peerTeam: string };
    expect(body.peerTeam).toBe('team-c');
  });
});

// ── AC5 — Per-peer rate limiting ───────────────────────────────────────────────

describe('AC5 — per-peer rate limiting (max 10 / 60s window)', () => {
  it(
    'given rate limit max=10, when team-a sends 15 rapid requests in the same window, ' +
      'then exactly 10 return 200 and exactly 5 return 429',
    async () => {
      // Use a fresh hub instance for this test to guarantee a clean counter.
      const rlPort = await getFreePort();
      const rlHub = createHub({
        tls: {
          ca: caCrt,
          cert: read(join(tmpDir, 'hub.crt')),
          key: read(join(tmpDir, 'hub.key')),
        },
        peers: { 'team-a': hubTeamACert.cert },
        rateLimit: { max: 10, timeWindow: 60_000 },
        logger: false,
      });
      await rlHub.listen({ port: rlPort, host: '127.0.0.1' });

      // 15 concurrent requests — all land inside the same rate-limit window.
      const results = await Promise.all(
        Array.from({ length: 15 }, () => httpsGet(rlPort, '/api/status', caCrt, hubTeamACert)),
      );

      await rlHub.close();

      const ok = results.filter((r) => r.status === 200).length;
      const limited = results.filter((r) => r.status === 429).length;
      expect(ok).toBe(10);
      expect(limited).toBe(5);
    },
  );
});

// ── AC6 — Pino structured logging includes peerTeam ───────────────────────────

describe('AC6 — Pino structured logging', () => {
  it('log lines are valid JSON with peerTeam field when team-a makes a request', async () => {
    // Restart hub with a captured log stream.
    // This sub-suite starts its own hub instance with logger pointing to a buffer.
    const logLines: string[] = [];
    const logStream: NodeJS.WritableStream = {
      write(line: string | Uint8Array): boolean {
        logLines.push(typeof line === 'string' ? line : Buffer.from(line).toString('utf8'));
        return true;
      },
    } as NodeJS.WritableStream;

    const logPort = await getFreePort();
    const logHub = createHub({
      tls: {
        ca: caCrt,
        cert: read(join(tmpDir, 'hub.crt')),
        key: read(join(tmpDir, 'hub.key')),
      },
      peers: { 'team-a': hubTeamACert.cert },
      logger: { stream: logStream },
    });
    await logHub.listen({ port: logPort, host: '127.0.0.1' });

    await httpsGet(logPort, '/api/status', caCrt, hubTeamACert);
    await logHub.close();

    // At least one log line must be valid JSON containing peerTeam: 'team-a'
    const parsed = logLines
      .map((l) => {
        try {
          return JSON.parse(l) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const withPeer = parsed.filter((l) => l && l['peerTeam'] === 'team-a');
    expect(withPeer.length).toBeGreaterThan(0);
  });
});
