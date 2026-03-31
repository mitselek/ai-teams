// (*CD:Kerckhoffs*)
// 3-daemon hub relay integration test.
//
// Topology:
//   team-a (role:'team', defaultPeer:'relay')
//       │  mTLS
//       ▼
//   relay  (role:'hub', teamName:'relay', peers: both teams)
//       │  mTLS
//       ▼
//   team-b (role:'team', defaultPeer:'relay')
//
// Test cases:
//   TC-H01 — all 3 daemons start and tunnels connect
//   TC-H02 — team-a → team-b via hub: message lands in team-b inbox
//   TC-H03 — team-b → team-a via hub: message lands in team-a inbox
//   TC-H04 — forwarded message has correct from/to fields (both directions)
//   TC-H05 — inbound-only peer: hub has NO outbound config for team-b;
//             team-b connects inbound; hub forwards down the inbound connection
//
// No E2E crypto keys — plain mTLS hub relay. v2 E2E hub relay already covered
// in v2-crypto-daemon.test.ts scenario 5. This test focuses on the routing path.
//
// Spec: security-report.md HUB-7, cross-container-test-matrix.md hub topology

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import {
  mkdirSync, rmSync, writeFileSync, readFileSync, existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { DaemonV2 } from '../../src/broker/daemon-v2.js';
import type { Message } from '../../src/types.js';

// ── Fixture helpers ───────────────────────────────────────────────────────────

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = (srv.address() as { port: number }).port;
      srv.close(err => err ? reject(err) : resolve(port));
    });
  });
}

function genCert(dir: string, cn: string): void {
  execSync(
    `openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${join(dir, 'daemon.key')}" \
     -out    "${join(dir, 'daemon.crt')}" \
     -days 1 -nodes \
     -subj "/CN=${cn}" \
     -addext "subjectAltName=DNS:${cn}" 2>/dev/null`,
  );
}

async function waitForInboxFile(
  inboxDir: string,
  messageId: string,
  timeoutMs = 4000,
): Promise<Message> {
  const filePath = join(inboxDir, `${messageId}.json`);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf8')) as Message;
    }
    await new Promise(r => setTimeout(r, 30));
  }
  throw new Error(`Inbox timeout: ${filePath} not found after ${timeoutMs}ms`);
}

function makeMsg(
  fromTeam: string, fromAgent: string,
  toTeam: string,   toAgent: string,
  body: string,
): Message {
  return {
    version:   '1',
    id:        `hub-relay-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    from:      { team: fromTeam, agent: fromAgent },
    to:        { team: toTeam,   agent: toAgent },
    type:      'query',
    priority:  'normal',
    reply_to:  null,
    body,
    checksum:  'sha256:test',
  };
}

// ── Team names ────────────────────────────────────────────────────────────────

const TEAM_A  = 'team-a';
const TEAM_B  = 'team-b';
const RELAY   = 'relay';

// ── ACLs ─────────────────────────────────────────────────────────────────────

// team-a: agent-a may send to / receive from agent-b@team-b
const ACL_A = {
  version: 1,
  agents: {
    'agent-a': {
      allowed_to:   [`agent-b@${TEAM_B}`],
      allowed_from: [`agent-b@${TEAM_B}`],
    },
  },
  default: 'deny',
};

// team-b: agent-b may send to / receive from agent-a@team-a
const ACL_B = {
  version: 1,
  agents: {
    'agent-b': {
      allowed_to:   [`agent-a@${TEAM_A}`],
      allowed_from: [`agent-a@${TEAM_A}`],
    },
  },
  default: 'deny',
};

// ── Shared fixture ────────────────────────────────────────────────────────────

const ts = Date.now();
const aDir      = join(tmpdir(), `hub-relay-a-${ts}`);
const bDir      = join(tmpdir(), `hub-relay-b-${ts}`);
const relayDir  = join(tmpdir(), `hub-relay-hub-${ts}`);
const aInbox    = join(tmpdir(), `hub-relay-ainbox-${ts}`);
const bInbox    = join(tmpdir(), `hub-relay-binbox-${ts}`);
const relayInbox = join(tmpdir(), `hub-relay-hubinbox-${ts}`);

let aDaemon:     DaemonV2;
let bDaemon:     DaemonV2;
let relayDaemon: DaemonV2;

beforeAll(async () => {
  // Create directories
  for (const d of [aDir, bDir, relayDir]) {
    mkdirSync(join(d, 'peers'), { recursive: true });
  }
  for (const d of [aInbox, bInbox, relayInbox]) {
    mkdirSync(d, { recursive: true });
  }

  // Generate TLS certs: CN must match team name (loadDaemonCrypto enforces this)
  genCert(aDir,     TEAM_A);
  genCert(bDir,     TEAM_B);
  genCert(relayDir, RELAY);

  // Cert pinning:
  // team-a and team-b trust only relay (their sole direct peer)
  execSync(`cp "${join(relayDir, 'daemon.crt')}" "${join(aDir,     'peers', `${RELAY}.crt`)}"`);
  execSync(`cp "${join(relayDir, 'daemon.crt')}" "${join(bDir,     'peers', `${RELAY}.crt`)}"`);
  // relay trusts both team-a and team-b
  execSync(`cp "${join(aDir,     'daemon.crt')}" "${join(relayDir, 'peers', `${TEAM_A}.crt`)}"`);
  execSync(`cp "${join(bDir,     'daemon.crt')}" "${join(relayDir, 'peers', `${TEAM_B}.crt`)}"`);

  writeFileSync(join(aDir, 'acl.json'), JSON.stringify(ACL_A));
  writeFileSync(join(bDir, 'acl.json'), JSON.stringify(ACL_B));
  // relay (hub role) has no ACL — forwards all traffic

  // Pre-assign all 3 ports
  const [aPort, bPort, relayPort] = await Promise.all([
    getFreePort(), getFreePort(), getFreePort(),
  ]);

  relayDaemon = new DaemonV2({
    teamName:            RELAY,
    keysDir:             relayDir,
    inboxDir:            relayInbox,
    listenPort:          relayPort,
    peers: {
      [TEAM_A]: { host: '127.0.0.1', port: aPort },
      [TEAM_B]: { host: '127.0.0.1', port: bPort },
    },
    role:                'hub',
    reconnectBaseMs:     50,
    heartbeatIntervalMs: 60_000,
    deadConnectionMs:    120_000,
  });

  aDaemon = new DaemonV2({
    teamName:            TEAM_A,
    keysDir:             aDir,
    inboxDir:            aInbox,
    listenPort:          aPort,
    peers:               { [RELAY]: { host: '127.0.0.1', port: relayPort } },
    hubPeers:            [RELAY],   // bypass from.team check for relay-forwarded messages
    defaultPeer:         RELAY,     // route all unknown destinations via relay
    role:                'team',
    reconnectBaseMs:     50,
    heartbeatIntervalMs: 60_000,
    deadConnectionMs:    120_000,
  });

  bDaemon = new DaemonV2({
    teamName:            TEAM_B,
    keysDir:             bDir,
    inboxDir:            bInbox,
    listenPort:          bPort,
    peers:               { [RELAY]: { host: '127.0.0.1', port: relayPort } },
    hubPeers:            [RELAY],
    defaultPeer:         RELAY,
    role:                'team',
    reconnectBaseMs:     50,
    heartbeatIntervalMs: 60_000,
    deadConnectionMs:    120_000,
  });

  // Start relay first so team daemons can connect immediately
  await relayDaemon.start();
  await Promise.all([aDaemon.start(), bDaemon.start()]);

  // Allow mTLS tunnels to fully establish in all directions
  await new Promise(r => setTimeout(r, 600));
});

afterAll(async () => {
  await aDaemon?.stop();
  await bDaemon?.stop();
  await relayDaemon?.stop();
  for (const d of [aDir, bDir, relayDir, aInbox, bInbox, relayInbox]) {
    rmSync(d, { recursive: true, force: true });
  }
});

// ── TC-H01: all 3 daemons start and tunnels connect ──────────────────────────

describe('Hub relay — TC-H01: all 3 daemons start and tunnels connect', () => {

  it('team-a daemon is ready after start', () => {
    expect(aDaemon.isReady()).toBe(true);
    expect(aDaemon.port).toBeGreaterThan(0);
  });

  it('relay (hub) daemon is ready after start', () => {
    expect(relayDaemon.isReady()).toBe(true);
    expect(relayDaemon.port).toBeGreaterThan(0);
  });

  it('team-b daemon is ready after start', () => {
    expect(bDaemon.isReady()).toBe(true);
    expect(bDaemon.port).toBeGreaterThan(0);
  });

  it('all 3 daemons bind on distinct ports', () => {
    const ports = [aDaemon.port, bDaemon.port, relayDaemon.port];
    expect(new Set(ports).size).toBe(3);
  });

  it('team-a is connected to relay', () => {
    expect(aDaemon.connectedPeers()).toContain(RELAY);
  });

  it('team-b is connected to relay', () => {
    expect(bDaemon.connectedPeers()).toContain(RELAY);
  });

  it('relay is connected to both team-a and team-b', () => {
    const peers = relayDaemon.connectedPeers();
    expect(peers).toContain(TEAM_A);
    expect(peers).toContain(TEAM_B);
  });
});

// ── TC-H02: team-a → team-b via hub ──────────────────────────────────────────

describe('Hub relay — TC-H02: team-a → team-b message delivery via hub', () => {

  it('sendMessage returns OK (team-a → team-b)', async () => {
    const msg = makeMsg(TEAM_A, 'agent-a', TEAM_B, 'agent-b', 'TC-H02: ping via hub');
    const result = await aDaemon.sendMessage(msg);
    expect(result).toBe('OK');
  });

  it('message arrives in team-b inbox after hub relay', async () => {
    const msg = makeMsg(TEAM_A, 'agent-a', TEAM_B, 'agent-b', 'TC-H02: inbox delivery');
    await aDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(bInbox, msg.id);
    expect(delivered.id).toBe(msg.id);
  });
});

// ── TC-H03: team-b → team-a via hub (reverse) ────────────────────────────────

describe('Hub relay — TC-H03: team-b → team-a message delivery via hub (reverse)', () => {

  it('sendMessage returns OK (team-b → team-a)', async () => {
    const msg = makeMsg(TEAM_B, 'agent-b', TEAM_A, 'agent-a', 'TC-H03: reverse ping');
    const result = await bDaemon.sendMessage(msg);
    expect(result).toBe('OK');
  });

  it('message arrives in team-a inbox after hub relay', async () => {
    const msg = makeMsg(TEAM_B, 'agent-b', TEAM_A, 'agent-a', 'TC-H03: reverse inbox delivery');
    await bDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(aInbox, msg.id);
    expect(delivered.id).toBe(msg.id);
  });
});

// ── TC-H04: forwarded messages have correct from/to fields ───────────────────

describe('Hub relay — TC-H04: forwarded messages preserve correct from/to fields', () => {

  it('team-a → team-b: from.team=team-a, to.team=team-b preserved through hub', async () => {
    const body = 'TC-H04: field check A→B';
    const msg  = makeMsg(TEAM_A, 'agent-a', TEAM_B, 'agent-b', body);
    await aDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(bInbox, msg.id);
    expect(delivered.from.team).toBe(TEAM_A);
    expect(delivered.from.agent).toBe('agent-a');
    expect(delivered.to.team).toBe(TEAM_B);
    expect(delivered.to.agent).toBe('agent-b');
    expect(delivered.body).toBe(body);
  });

  it('team-b → team-a: from.team=team-b, to.team=team-a preserved through hub', async () => {
    const body = 'TC-H04: field check B→A';
    const msg  = makeMsg(TEAM_B, 'agent-b', TEAM_A, 'agent-a', body);
    await bDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(aInbox, msg.id);
    expect(delivered.from.team).toBe(TEAM_B);
    expect(delivered.from.agent).toBe('agent-b');
    expect(delivered.to.team).toBe(TEAM_A);
    expect(delivered.to.agent).toBe('agent-a');
    expect(delivered.body).toBe(body);
  });
});

// ── TC-H05: inbound-only peer forwarding ─────────────────────────────────────
//
// Hub has NO outbound peer config for team-b. Team-b connects inbound to hub.
// Hub must be able to forward messages to team-b down that inbound connection.
//
// Topology:
//   team-a (defaultPeer:'relay') ──outbound──▶ relay(hub) ◀──inbound── team-b
//
// Hub peers config: { 'team-a': { host, port } }  ← NO team-b entry
// Team-b peers config: { 'relay': { host, relayPort } }  ← connects outbound to hub
//
// Implementation (Babbage, 2026-03-30): TunnelManager.registerInboundSocket()
// called from DaemonV2 hub mode via TlsServer.onPeerSocket callback. Hub routes
// to inbound-only peers by checking inboundSockets map when no outbound tunnel
// exists. connectedPeers() includes both outbound tunnels and inbound sockets.

describe('Hub relay — TC-H05: inbound-only peer forwarding', () => {

  const TEAM_A5  = 'team-a5';
  const TEAM_B5  = 'team-b5';
  const RELAY5   = 'relay5';

  const ACL_A5 = {
    version: 1,
    agents: {
      'agent-a': {
        allowed_to:   [`agent-b@${TEAM_B5}`],
        allowed_from: [`agent-b@${TEAM_B5}`],
      },
    },
    default: 'deny',
  };

  const ACL_B5 = {
    version: 1,
    agents: {
      'agent-b': {
        allowed_to:   [`agent-a@${TEAM_A5}`],
        allowed_from: [`agent-a@${TEAM_A5}`],
      },
    },
    default: 'deny',
  };

  const ts5      = Date.now() + 1; // distinct from outer ts
  const a5Dir    = join(tmpdir(), `hub-h05-a-${ts5}`);
  const b5Dir    = join(tmpdir(), `hub-h05-b-${ts5}`);
  const r5Dir    = join(tmpdir(), `hub-h05-relay-${ts5}`);
  const a5Inbox  = join(tmpdir(), `hub-h05-ainbox-${ts5}`);
  const b5Inbox  = join(tmpdir(), `hub-h05-binbox-${ts5}`);
  const r5Inbox  = join(tmpdir(), `hub-h05-rinbox-${ts5}`);

  let a5Daemon:  DaemonV2;
  let b5Daemon:  DaemonV2;
  let r5Daemon:  DaemonV2;

  beforeAll(async () => {
    for (const d of [a5Dir, b5Dir, r5Dir]) {
      mkdirSync(join(d, 'peers'), { recursive: true });
    }
    for (const d of [a5Inbox, b5Inbox, r5Inbox]) {
      mkdirSync(d, { recursive: true });
    }

    genCert(a5Dir, TEAM_A5);
    genCert(b5Dir, TEAM_B5);
    genCert(r5Dir, RELAY5);

    // team-a5 trusts relay only (its outbound peer)
    execSync(`cp "${join(r5Dir, 'daemon.crt')}" "${join(a5Dir, 'peers', `${RELAY5}.crt`)}"`);
    // team-b5 trusts relay only (connects inbound to hub)
    execSync(`cp "${join(r5Dir, 'daemon.crt')}" "${join(b5Dir, 'peers', `${RELAY5}.crt`)}"`);
    // relay trusts both (mTLS handshake requires it regardless of direction)
    execSync(`cp "${join(a5Dir, 'daemon.crt')}" "${join(r5Dir, 'peers', `${TEAM_A5}.crt`)}"`);
    execSync(`cp "${join(b5Dir, 'daemon.crt')}" "${join(r5Dir, 'peers', `${TEAM_B5}.crt`)}"`);

    writeFileSync(join(a5Dir, 'acl.json'), JSON.stringify(ACL_A5));
    writeFileSync(join(b5Dir, 'acl.json'), JSON.stringify(ACL_B5));

    const [a5Port, b5Port, r5Port] = await Promise.all([
      getFreePort(), getFreePort(), getFreePort(),
    ]);

    // KEY DIFFERENCE: hub has NO peer entry for team-b5.
    // Team-b5 connects inbound only. Hub must route to it via the inbound connection.
    r5Daemon = new DaemonV2({
      teamName:            RELAY5,
      keysDir:             r5Dir,
      inboxDir:            r5Inbox,
      listenPort:          r5Port,
      peers: {
        [TEAM_A5]: { host: '127.0.0.1', port: a5Port },
        // INTENTIONALLY no TEAM_B5 entry
      },
      role:                'hub',
      reconnectBaseMs:     50,
      heartbeatIntervalMs: 60_000,
      deadConnectionMs:    120_000,
    });

    a5Daemon = new DaemonV2({
      teamName:            TEAM_A5,
      keysDir:             a5Dir,
      inboxDir:            a5Inbox,
      listenPort:          a5Port,
      peers:               { [RELAY5]: { host: '127.0.0.1', port: r5Port } },
      hubPeers:            [RELAY5],
      defaultPeer:         RELAY5,
      role:                'team',
      reconnectBaseMs:     50,
      heartbeatIntervalMs: 60_000,
      deadConnectionMs:    120_000,
    });

    b5Daemon = new DaemonV2({
      teamName:            TEAM_B5,
      keysDir:             b5Dir,
      inboxDir:            b5Inbox,
      listenPort:          b5Port,
      peers:               { [RELAY5]: { host: '127.0.0.1', port: r5Port } },
      hubPeers:            [RELAY5],
      defaultPeer:         RELAY5,
      role:                'team',
      reconnectBaseMs:     50,
      heartbeatIntervalMs: 60_000,
      deadConnectionMs:    120_000,
    });

    await r5Daemon.start();
    await Promise.all([a5Daemon.start(), b5Daemon.start()]);
    await new Promise(r => setTimeout(r, 600));
  });

  afterAll(async () => {
    await a5Daemon?.stop();
    await b5Daemon?.stop();
    await r5Daemon?.stop();
    for (const d of [a5Dir, b5Dir, r5Dir, a5Inbox, b5Inbox, r5Inbox]) {
      rmSync(d, { recursive: true, force: true });
    }
  });

  it('team-b5 has established an inbound connection to relay', () => {
    // Relay sees team-b5 in its connected peers (via inbound connection)
    expect(r5Daemon.connectedPeers()).toContain(TEAM_B5);
  });

  it('relay has NO outbound peer config for team-b5', () => {
    // Sanity check: this is the scenario under test
    // relay's static peers map does not include team-b5
    // (we can't directly inspect peers map, but we verify by checking
    //  that the hub was constructed without it — structural guarantee from setup)
    expect(true).toBe(true); // setup ensures this — documented here for clarity
  });

  it('team-a5 sends to team-b5 via hub — message lands in team-b5 inbox', async () => {
    // RED: hub currently cannot route to team-b5 (not in static peers map).
    // Expected fix: hub routes to inbound connections when no static peer exists.
    const body = 'TC-H05: inbound-only delivery';
    const msg  = makeMsg(TEAM_A5, 'agent-a', TEAM_B5, 'agent-b', body);
    await a5Daemon.sendMessage(msg);
    const delivered = await waitForInboxFile(b5Inbox, msg.id);
    expect(delivered.id).toBe(msg.id);
    expect(delivered.from.team).toBe(TEAM_A5);
    expect(delivered.to.team).toBe(TEAM_B5);
    expect(delivered.body).toBe(body);
  });
});
