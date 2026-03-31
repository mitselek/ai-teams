// (*CD:Kerckhoffs*)
// RED tests for story/31: GET /api/online, GET /api/status (enhanced), POST /api/register (admin + dedup).
//
// Acceptance criteria (Given/When/Then — EN 50716:2023 / CODING_STANDARDS.md):
//
//   AC1 — online list: connected teams:
//     Given: hub with team-a, team-b, team-c all with active SSE subscriptions
//     When:  GET /api/online (authenticated as team-a)
//     Then:  response lists all 3 with { team, type, status: "connected", since }
//
//   AC2 — online list: offline team:
//     Given: team-b opened an SSE subscription then disconnected
//     When:  GET /api/online
//     Then:  team-b entry has status: "offline" and lastSeen timestamp
//
//   AC3 — /api/status metrics:
//     Given: running hub with 2 registered peers; 1 message queued for offline team-b
//     When:  GET /api/status
//     Then:  response includes { uptime, version, peerCount, queueDepth }
//
//   AC4 — /api/register: admin can register:
//     Given: hub with adminTeams: ['team-a']; team-d not yet registered
//     When:  team-a POSTs { team: 'team-d', cert: <PEM> } to /api/register
//     Then:  HTTP 201; team-d can subsequently authenticate
//
//   AC5 — /api/register: non-admin blocked:
//     Given: hub with adminTeams: ['team-a']; team-b is NOT in adminTeams
//     When:  team-b POSTs { team: 'team-e', cert: <PEM> } to /api/register
//     Then:  HTTP 403
//
//   AC6 — /api/register: duplicate CN rejected:
//     Given: team-a is already in the hub registry
//     When:  POST /api/register { team: 'team-a', cert: <any PEM> }
//     Then:  HTTP 409
//
//   AC7 — /api/online: rate limited per peer:
//     Given: hub with rateLimit { max: 5, timeWindow: 60_000 }
//     When:  team-a sends 10 rapid GET /api/online requests
//     Then:  first 5 return 200; remaining 5 return 429
//
// RED state (against current server.ts):
//   AC1: GET /api/online → 404 (endpoint not implemented)
//   AC2: GET /api/online → 404
//   AC3: GET /api/status returns { peerTeam }, missing { uptime, version, peerCount, queueDepth }
//   AC5: non-admin register → 201 (adminTeams not implemented)
//   AC6: duplicate CN → 201 (no dedup check)
//   AC7: GET /api/online → 404 (all 10 responses fail; expects 5×200 + 5×429)
//
// Ref: https://github.com/mitselek/ai-teams/issues/31

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

/** Open a persistent SSE connection to /api/subscribe. Returns a closer. */
function openSSEConn(
  port: number,
  ca: string,
  clientCert: { cert: string; key: string },
): { close(): void } {
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
  req.on('error', () => {});
  req.end();
  return { close: () => req.destroy() };
}

function settle(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function makeMsg(fromTeam: string, toTeam: string, body = 'test-body') {
  const hash = 'sha256:' + createHash('sha256').update(body, 'utf-8').digest('hex');
  return {
    version: '1' as const,
    id: `util-test-${Math.random().toString(36).slice(2)}`,
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
let teamCCert: { cert: string; key: string };
let teamDCert: { cert: string; key: string };
let teamDCertPem: string;

beforeAll(() => {
  tmpDir = join(tmpdir(), `util-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tmpDir, { recursive: true });

  genCa(tmpDir);
  caCrt = read(join(tmpDir, 'ca.crt'));

  for (const cn of ['hub', 'team-a', 'team-b', 'team-c', 'team-d']) {
    genSignedCert(tmpDir, cn, tmpDir);
  }

  hubCrt = read(join(tmpDir, 'hub.crt'));
  hubKey = read(join(tmpDir, 'hub.key'));
  teamACert = { cert: read(join(tmpDir, 'team-a.crt')), key: read(join(tmpDir, 'team-a.key')) };
  teamBCert = { cert: read(join(tmpDir, 'team-b.crt')), key: read(join(tmpDir, 'team-b.key')) };
  teamCCert = { cert: read(join(tmpDir, 'team-c.crt')), key: read(join(tmpDir, 'team-c.key')) };
  teamDCert = { cert: read(join(tmpDir, 'team-d.crt')), key: read(join(tmpDir, 'team-d.key')) };
  teamDCertPem = read(join(tmpDir, 'team-d.crt'));
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// ── AC1 — GET /api/online: connected teams ────────────────────────────────────

describe('AC1 — GET /api/online: all connected teams listed', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hub: any;
  let hubPort: number;
  let sseA: { close(): void };
  let sseB: { close(): void };
  let sseC: { close(): void };

  beforeAll(async () => {
    hubPort = await getFreePort();
    hub = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: {
        'team-a': teamACert.cert,
        'team-b': teamBCert.cert,
        'team-c': teamCCert.cert,
      },
      logger: false,
    });
    await hub.listen({ port: hubPort, host: '127.0.0.1' });

    sseA = openSSEConn(hubPort, caCrt, teamACert);
    sseB = openSSEConn(hubPort, caCrt, teamBCert);
    sseC = openSSEConn(hubPort, caCrt, teamCCert);
    await settle(100); // allow SSE registrations to complete
  });

  afterAll(async () => {
    sseA.close();
    sseB.close();
    sseC.close();
    await hub?.close?.();
  });

  it('given 3 SSE-connected teams, GET /api/online returns HTTP 200', async () => {
    // RED: endpoint not implemented → 404
    const res = await httpsGet(hubPort, '/api/online', caCrt, teamACert);
    expect(res.status).toBe(200);
  });

  it('response lists all 3 connected teams', async () => {
    // RED: endpoint not implemented → 404 → JSON.parse fails
    const res = await httpsGet(hubPort, '/api/online', caCrt, teamACert);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body) as Array<{ team: string }>;
    const teams = body.map((e) => e.team);
    expect(teams).toContain('team-a');
    expect(teams).toContain('team-b');
    expect(teams).toContain('team-c');
  });

  it('each entry has { team, type, status: "connected", since }', async () => {
    // RED: endpoint not implemented
    const res = await httpsGet(hubPort, '/api/online', caCrt, teamACert);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body) as Array<{
      team: string;
      type: string;
      status: string;
      since: string;
    }>;
    for (const entry of body) {
      expect(entry.status).toBe('connected');
      expect(typeof entry.type).toBe('string');
      expect(typeof entry.since).toBe('string');
    }
  });
});

// ── AC2 — GET /api/online: disconnected team shows offline ────────────────────

describe('AC2 — GET /api/online: disconnected team shows offline', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hub: any;
  let hubPort: number;

  beforeAll(async () => {
    hubPort = await getFreePort();
    hub = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: {
        'team-a': teamACert.cert,
        'team-b': teamBCert.cert,
      },
      logger: false,
    });
    await hub.listen({ port: hubPort, host: '127.0.0.1' });

    // team-b connects then immediately disconnects
    const sseB = openSSEConn(hubPort, caCrt, teamBCert);
    await settle(50);
    sseB.close();
    await settle(80); // allow close event to propagate through hub
  });

  afterAll(async () => {
    await hub?.close?.();
  });

  it('team-b entry has status: "offline" after disconnect', async () => {
    // RED: /api/online → 404
    const res = await httpsGet(hubPort, '/api/online', caCrt, teamACert);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body) as Array<{ team: string; status: string }>;
    const teamB = body.find((e) => e.team === 'team-b');
    expect(teamB).toBeDefined();
    expect(teamB!.status).toBe('offline');
  });

  it('offline entry includes lastSeen timestamp', async () => {
    // RED: /api/online → 404
    const res = await httpsGet(hubPort, '/api/online', caCrt, teamACert);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body) as Array<{
      team: string;
      status: string;
      lastSeen?: string;
    }>;
    const teamB = body.find((e) => e.team === 'team-b');
    expect(teamB?.lastSeen).toBeDefined();
    expect(typeof teamB!.lastSeen).toBe('string');
  });
});

// ── AC3 — GET /api/status: hub metrics ───────────────────────────────────────

describe('AC3 — GET /api/status: response includes uptime, version, peerCount, queueDepth', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hub: any;
  let hubPort: number;

  beforeAll(async () => {
    hubPort = await getFreePort();
    hub = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: {
        'team-a': teamACert.cert,
        'team-b': teamBCert.cert,
      },
      logger: false,
    });
    await hub.listen({ port: hubPort, host: '127.0.0.1' });

    // Queue a message to team-b (no SSE subscriber) so queueDepth > 0
    await httpsPost(
      hubPort,
      '/api/send',
      caCrt,
      teamACert,
      makeMsg('team-a', 'team-b', 'ac3-queue'),
    );
  });

  afterAll(async () => {
    await hub?.close?.();
  });

  it('response includes uptime as a non-negative number', async () => {
    // RED: current /api/status returns { peerTeam } only
    const res = await httpsGet(hubPort, '/api/status', caCrt, teamACert);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime as number).toBeGreaterThanOrEqual(0);
  });

  it('response includes version as a non-empty string', async () => {
    // RED: current /api/status returns { peerTeam } only
    const res = await httpsGet(hubPort, '/api/status', caCrt, teamACert);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(typeof body.version).toBe('string');
    expect((body.version as string).length).toBeGreaterThan(0);
  });

  it('response includes peerCount >= 2 (team-a and team-b registered)', async () => {
    // RED: current /api/status returns { peerTeam } only
    const res = await httpsGet(hubPort, '/api/status', caCrt, teamACert);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(typeof body.peerCount).toBe('number');
    expect(body.peerCount as number).toBeGreaterThanOrEqual(2);
  });

  it('response includes queueDepth >= 1 (one message queued for offline team-b)', async () => {
    // RED: current /api/status returns { peerTeam } only
    const res = await httpsGet(hubPort, '/api/status', caCrt, teamACert);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(typeof body.queueDepth).toBe('number');
    expect(body.queueDepth as number).toBeGreaterThanOrEqual(1);
  });
});

// ── AC4 + AC5 — POST /api/register: admin check ───────────────────────────────

describe('AC4 — POST /api/register: admin team can register new peer', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hub: any;
  let hubPort: number;

  beforeAll(async () => {
    hubPort = await getFreePort();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hub = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: {
        'team-a': teamACert.cert,
        'team-b': teamBCert.cert,
      },
      adminTeams: ['team-a'],
      logger: false,
    } as Parameters<typeof createHub>[0] & { adminTeams?: string[] });
    await hub.listen({ port: hubPort, host: '127.0.0.1' });
  });

  afterAll(async () => {
    await hub?.close?.();
  });

  it('admin team-a POSTs /api/register with new team → HTTP 201', async () => {
    // AC4: if adminTeams not implemented, any auth peer gets 201 → may be GREEN accidentally
    // but AC5 below (non-admin → 403) will be RED; together they confirm adminTeams works
    const res = await httpsPost(hubPort, '/api/register', caCrt, teamACert, {
      team: 'team-d',
      cert: teamDCertPem,
    });
    expect(res.status).toBe(201);
  });

  it('after admin registration, team-d can authenticate → HTTP 200', async () => {
    const res = await httpsGet(hubPort, '/api/status', caCrt, teamDCert);
    expect(res.status).toBe(200);
  });
});

describe('AC5 — POST /api/register: non-admin team gets HTTP 403', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hub: any;
  let hubPort: number;

  beforeAll(async () => {
    hubPort = await getFreePort();
    hub = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: {
        'team-a': teamACert.cert,
        'team-b': teamBCert.cert,
      },
      adminTeams: ['team-a'],
      logger: false,
    } as Parameters<typeof createHub>[0] & { adminTeams?: string[] });
    await hub.listen({ port: hubPort, host: '127.0.0.1' });
  });

  afterAll(async () => {
    await hub?.close?.();
  });

  it('non-admin team-b POSTs /api/register → HTTP 403', async () => {
    // RED: current impl has no adminTeams check → returns 201 not 403
    const res = await httpsPost(hubPort, '/api/register', caCrt, teamBCert, {
      team: 'team-e',
      cert: teamDCertPem, // cert PEM doesn't matter for this test
    });
    expect(res.status).toBe(403);
  });
});

// ── AC6 — POST /api/register: duplicate CN rejected ──────────────────────────

describe('AC6 — POST /api/register: duplicate CN → HTTP 409', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hub: any;
  let hubPort: number;

  beforeAll(async () => {
    hubPort = await getFreePort();
    hub = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: { 'team-a': teamACert.cert },
      logger: false,
    });
    await hub.listen({ port: hubPort, host: '127.0.0.1' });
  });

  afterAll(async () => {
    await hub?.close?.();
  });

  it('registering an already-registered team name → HTTP 409', async () => {
    // RED: current impl overwrites silently → 201 not 409
    const res = await httpsPost(hubPort, '/api/register', caCrt, teamACert, {
      team: 'team-a',
      cert: teamACert.cert,
    });
    expect(res.status).toBe(409);
  });
});

// ── AC7 — GET /api/online: rate limited per peer ──────────────────────────────

describe('AC7 — GET /api/online: rate limited per peer (max 5 / 60s)', () => {
  it('given max=5, when team-a sends 10 rapid requests, exactly 5 return 200 and 5 return 429', async () => {
    const rlPort = await getFreePort();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rlHub = createHub({
      tls: { ca: caCrt, cert: hubCrt, key: hubKey },
      peers: { 'team-a': teamACert.cert },
      rateLimit: { max: 5, timeWindow: 60_000 },
      logger: false,
    });
    await rlHub.listen({ port: rlPort, host: '127.0.0.1' });

    // 10 concurrent requests inside the same rate-limit window
    const results = await Promise.all(
      Array.from({ length: 10 }, () => httpsGet(rlPort, '/api/online', caCrt, teamACert)),
    );

    await rlHub.close();

    // RED: /api/online returns 404 → ok === 0, not 5
    const ok = results.filter((r) => r.status === 200).length;
    const limited = results.filter((r) => r.status === 429).length;
    expect(ok).toBe(5);
    expect(limited).toBe(5);
  });
});
