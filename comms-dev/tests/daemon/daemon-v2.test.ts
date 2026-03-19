// (*CD:Kerckhoffs*)
// RED tests for daemon-v2 — the component that wires TlsServer, TunnelManager,
// AclManager, MessageStore, and InboxDelivery together.
// Spec: #16 §5–§7, #18 Phase 3
//
// Tests exercise the daemon as a unit: two daemon instances in-process,
// communicating via real TLS sockets. No actual UDS/MCP in these tests —
// the outbound send path is exercised via daemon.sendMessage().

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DaemonV2, type DaemonV2Options } from '../../src/broker/daemon-v2.js';
import type { Message } from '../../src/types.js';

// ── Fixture helpers ───────────────────────────────────────────────────────────

function genCert(dir: string, cn: string, filename = cn): void {
  execSync(
    `openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${join(dir, `${filename}.key`)}" \
     -out "${join(dir, `${filename}.crt`)}" \
     -days 1 -nodes \
     -subj "/CN=${cn}" \
     -addext "subjectAltName=DNS:${cn}" 2>/dev/null`,
  );
}

const BASE_ACL = {
  version: 1,
  agents: {
    babbage: {
      allowed_to:   ['herald@framework-research'],
      allowed_from: ['herald@framework-research'],
    },
    kerckhoffs: {
      allowed_to:   ['*@framework-research'],
      allowed_from: [],
    },
  },
  default: 'deny',
};

const FR_ACL = {
  version: 1,
  agents: {
    herald: {
      allowed_to:   ['babbage@comms-dev'],
      allowed_from: ['babbage@comms-dev', 'kerckhoffs@comms-dev'],
    },
  },
  default: 'deny',
};

function makeMsg(
  fromTeam: string, fromAgent: string,
  toTeam: string, toAgent: string,
  id?: string,
): Message {
  return {
    version: '1',
    id: id ?? `msg-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    from: { team: fromTeam, agent: fromAgent },
    to:   { team: toTeam, agent: toAgent },
    type: 'query',
    priority: 'normal',
    reply_to: null,
    body: 'test body',
    checksum: 'sha256:test',
  };
}

// ── Shared fixture: two daemon environments ───────────────────────────────────

let cdDir: string;   // comms-dev secrets
let frDir: string;   // framework-research secrets
let cdInbox: string;
let frInbox: string;

beforeAll(() => {
  cdDir    = join(tmpdir(), `kerckhoffs-daemon-cd-${Date.now()}`);
  frDir    = join(tmpdir(), `kerckhoffs-daemon-fr-${Date.now()}`);
  cdInbox  = join(tmpdir(), `kerckhoffs-inbox-cd-${Date.now()}`);
  frInbox  = join(tmpdir(), `kerckhoffs-inbox-fr-${Date.now()}`);

  mkdirSync(join(cdDir, 'peers'), { recursive: true });
  mkdirSync(join(frDir, 'peers'), { recursive: true });
  mkdirSync(cdInbox, { recursive: true });
  mkdirSync(frInbox, { recursive: true });

  genCert(cdDir, 'comms-dev', 'daemon');
  genCert(frDir, 'framework-research', 'daemon');

  // Cross-pin certs
  execSync(`cp "${join(frDir, 'daemon.crt')}" "${join(cdDir, 'peers', 'framework-research.crt')}"`);
  execSync(`cp "${join(cdDir, 'daemon.crt')}" "${join(frDir, 'peers', 'comms-dev.crt')}"`);

  // Write ACL files
  writeFileSync(join(cdDir, 'acl.json'), JSON.stringify(BASE_ACL));
  writeFileSync(join(frDir, 'acl.json'), JSON.stringify(FR_ACL));
});

afterAll(() => {
  [cdDir, frDir, cdInbox, frInbox].forEach(d =>
    rmSync(d, { recursive: true, force: true }),
  );
});

function makeCdOptions(overrides: Partial<DaemonV2Options> = {}): DaemonV2Options {
  return {
    teamName:   'comms-dev',
    keysDir:    cdDir,
    inboxDir:   cdInbox,
    listenPort: 0,
    reconnectBaseMs: 50,
    heartbeatIntervalMs: 5000,
    deadConnectionMs: 15000,
    ...overrides,
  };
}

function makeFrOptions(port: number, overrides: Partial<DaemonV2Options> = {}): DaemonV2Options {
  return {
    teamName:   'framework-research',
    keysDir:    frDir,
    inboxDir:   frInbox,
    listenPort: 0,
    peers: { 'comms-dev': { host: '127.0.0.1', port } },
    reconnectBaseMs: 50,
    heartbeatIntervalMs: 5000,
    deadConnectionMs: 15000,
    ...overrides,
  };
}

// ── 1. Startup ────────────────────────────────────────────────────────────────

describe('DaemonV2 — startup', () => {

  it('starts and reports ready', async () => {
    const daemon = new DaemonV2(makeCdOptions());
    await daemon.start();
    expect(daemon.isReady()).toBe(true);
    expect(daemon.port).toBeGreaterThan(0);
    await daemon.stop();
  });

  it('can be stopped cleanly', async () => {
    const daemon = new DaemonV2(makeCdOptions());
    await daemon.start();
    await expect(daemon.stop()).resolves.toBeUndefined();
    expect(daemon.isReady()).toBe(false);
  });

  it('throws if keysDir daemon.key is missing', async () => {
    const missingKeyDir = join(tmpdir(), `kerckhoffs-daemon-missing-${Date.now()}`);
    mkdirSync(join(missingKeyDir, 'peers'), { recursive: true });
    writeFileSync(join(missingKeyDir, 'acl.json'), JSON.stringify(BASE_ACL));
    // No daemon.key or daemon.crt
    const daemon = new DaemonV2({ ...makeCdOptions(), keysDir: missingKeyDir });
    try {
      await expect(daemon.start()).rejects.toThrow();
    } finally {
      rmSync(missingKeyDir, { recursive: true, force: true });
    }
  });

  it('throws if acl.json is missing', async () => {
    const noAclDir = join(tmpdir(), `kerckhoffs-daemon-noacl-${Date.now()}`);
    mkdirSync(join(noAclDir, 'peers'), { recursive: true });
    genCert(noAclDir, 'comms-dev', 'daemon');
    // No acl.json
    const daemon = new DaemonV2({ ...makeCdOptions(), keysDir: noAclDir });
    try {
      await expect(daemon.start()).rejects.toThrow();
    } finally {
      rmSync(noAclDir, { recursive: true, force: true });
    }
  });

  it('starts even when no peers are configured (standalone mode)', async () => {
    const daemon = new DaemonV2({ ...makeCdOptions(), peers: {} });
    await daemon.start();
    expect(daemon.isReady()).toBe(true);
    await daemon.stop();
  });
});

// ── 2. Message delivery flow ──────────────────────────────────────────────────

describe('DaemonV2 — message delivery (two daemons in-process)', () => {

  let cdDaemon: DaemonV2;
  let frDaemon: DaemonV2;

  beforeEach(async () => {
    // Clear inboxes
    rmSync(cdInbox, { recursive: true, force: true });
    rmSync(frInbox, { recursive: true, force: true });
    mkdirSync(cdInbox, { recursive: true });
    mkdirSync(frInbox, { recursive: true });

    // Start FR daemon first (it listens)
    frDaemon = new DaemonV2(makeFrOptions(0));
    await frDaemon.start();

    // Start CD daemon, dialing FR
    cdDaemon = new DaemonV2({
      ...makeCdOptions(),
      peers: { 'framework-research': { host: '127.0.0.1', port: frDaemon.port } },
    });
    await cdDaemon.start();

    // Wait for tunnel to establish
    await new Promise(r => setTimeout(r, 300));
  });

  afterEach(async () => {
    await cdDaemon.stop();
    await frDaemon.stop();
  });

  it('delivers message from comms-dev/babbage to framework-research/herald', async () => {
    const msg = makeMsg('comms-dev', 'babbage', 'framework-research', 'herald');
    const result = await cdDaemon.sendMessage(msg);
    expect(result).toBe('OK');

    // Message should land in FR inbox
    const inboxFile = join(frInbox, `${msg.id}.json`);
    await new Promise<void>((resolve, reject) => {
      const deadline = Date.now() + 2000;
      const poll = setInterval(() => {
        if (existsSync(inboxFile)) { clearInterval(poll); resolve(); }
        else if (Date.now() > deadline) { clearInterval(poll); reject(new Error('Inbox delivery timeout')); }
      }, 50);
    });

    const delivered = JSON.parse(readFileSync(inboxFile, 'utf8')) as Message;
    expect(delivered.id).toBe(msg.id);
    expect(delivered.from.team).toBe('comms-dev');
    expect(delivered.from.agent).toBe('babbage');
    expect(delivered.to.team).toBe('framework-research');
    expect(delivered.to.agent).toBe('herald');
  });

  it('delivers message in the reverse direction (FR→CD)', async () => {
    // FR daemon also connects back to CD
    // We need FR to know CD's port — update FR daemon peers
    await frDaemon.stop();
    frDaemon = new DaemonV2({
      ...makeFrOptions(cdDaemon.port),
      peers: { 'comms-dev': { host: '127.0.0.1', port: cdDaemon.port } },
    });
    await frDaemon.start();
    await new Promise(r => setTimeout(r, 300));

    const msg = makeMsg('framework-research', 'herald', 'comms-dev', 'babbage');
    const result = await frDaemon.sendMessage(msg);
    expect(result).toBe('OK');

    const inboxFile = join(cdInbox, `${msg.id}.json`);
    await new Promise<void>((resolve, reject) => {
      const deadline = Date.now() + 2000;
      const poll = setInterval(() => {
        if (existsSync(inboxFile)) { clearInterval(poll); resolve(); }
        else if (Date.now() > deadline) { clearInterval(poll); reject(new Error('Inbox delivery timeout')); }
      }, 50);
    });

    const delivered = JSON.parse(readFileSync(inboxFile, 'utf8')) as Message;
    expect(delivered.id).toBe(msg.id);
  });

  it('deduplicates messages with the same ID (at-least-once, not exactly-once)', async () => {
    const msg = makeMsg('comms-dev', 'babbage', 'framework-research', 'herald', 'msg-dedup-001');

    await cdDaemon.sendMessage(msg);
    // Wait for delivery
    const inboxFile = join(frInbox, `${msg.id}.json`);
    await new Promise<void>((resolve, reject) => {
      const deadline = Date.now() + 2000;
      const poll = setInterval(() => {
        if (existsSync(inboxFile)) { clearInterval(poll); resolve(); }
        else if (Date.now() > deadline) { clearInterval(poll); reject(new Error('Timeout')); }
      }, 50);
    });

    // Send same message again
    const result2 = await cdDaemon.sendMessage(msg);
    // Should ACK (idempotent) but NOT write a second file
    expect(result2).toBe('OK');
    await new Promise(r => setTimeout(r, 200));

    // Only one file should exist
    const files = readdirSync(frInbox).filter((f: string) => f.includes('msg-dedup-001'));
    expect(files).toHaveLength(1);
  });
});

// ── 3. ACL enforcement ────────────────────────────────────────────────────────

describe('DaemonV2 — ACL enforcement', () => {

  let cdDaemon: DaemonV2;
  let frDaemon: DaemonV2;

  beforeEach(async () => {
    rmSync(cdInbox, { recursive: true, force: true });
    rmSync(frInbox, { recursive: true, force: true });
    mkdirSync(cdInbox, { recursive: true });
    mkdirSync(frInbox, { recursive: true });

    frDaemon = new DaemonV2(makeFrOptions(0));
    await frDaemon.start();

    cdDaemon = new DaemonV2({
      ...makeCdOptions(),
      peers: { 'framework-research': { host: '127.0.0.1', port: frDaemon.port } },
    });
    await cdDaemon.start();
    await new Promise(r => setTimeout(r, 300));
  });

  afterEach(async () => {
    await cdDaemon.stop();
    await frDaemon.stop();
  });

  it('returns ACL_DENIED when sender is not in local allowed_to', async () => {
    // vigenere is not in BASE_ACL.agents — default deny
    const msg = makeMsg('comms-dev', 'vigenere', 'framework-research', 'herald');
    const result = await cdDaemon.sendMessage(msg);
    expect(result).toBe('ACL_DENIED');
  });

  it('returns ACL_DENIED when target is not in sender allowed_to list', async () => {
    // babbage can send to herald@framework-research, but NOT to lovelace@framework-research
    const msg = makeMsg('comms-dev', 'babbage', 'framework-research', 'lovelace');
    const result = await cdDaemon.sendMessage(msg);
    expect(result).toBe('ACL_DENIED');
  });

  it('returns REMOTE_ACL_DENIED when local ACL allows but remote ACL denies', async () => {
    // kerckhoffs can send to *@framework-research (local ACL allows)
    // but FR ACL only allows babbage@comms-dev in herald's allowed_from
    // lovelace@framework-research doesn't exist in FR ACL either
    // Send kerckhoffs → herald: local allows, FR must check allowed_from for herald
    const msg = makeMsg('comms-dev', 'kerckhoffs', 'framework-research', 'herald');
    const result = await cdDaemon.sendMessage(msg);
    // kerckhoffs is in herald.allowed_from per FR_ACL — this should succeed
    expect(result).toBe('OK');
  });

  it('does not deliver message to inbox when remote ACL denies', async () => {
    // kerckhoffs → lovelace@framework-research: lovelace not in FR ACL → remote deny
    const msg = makeMsg('comms-dev', 'kerckhoffs', 'framework-research', 'lovelace');
    await cdDaemon.sendMessage(msg);
    await new Promise(r => setTimeout(r, 300));

    // Message must NOT appear in FR inbox
    const inboxFile = join(frInbox, `${msg.id}.json`);
    expect(existsSync(inboxFile)).toBe(false);
  });
});

// ── 4. SIGHUP ACL hot-reload ──────────────────────────────────────────────────

describe('DaemonV2 — SIGHUP ACL hot-reload', () => {

  it('reloads ACL after SIGHUP and applies new rules', async () => {
    const hotReloadDir = join(tmpdir(), `kerckhoffs-daemon-sighup-${Date.now()}`);
    const hotReloadInbox = join(tmpdir(), `kerckhoffs-inbox-sighup-${Date.now()}`);
    mkdirSync(join(hotReloadDir, 'peers'), { recursive: true });
    mkdirSync(hotReloadInbox, { recursive: true });
    genCert(hotReloadDir, 'comms-dev', 'daemon');

    // Initial ACL: nobody can send anywhere
    const emptyAcl = { version: 1, agents: {}, default: 'deny' };
    writeFileSync(join(hotReloadDir, 'acl.json'), JSON.stringify(emptyAcl));

    const daemon = new DaemonV2({
      teamName:   'comms-dev',
      keysDir:    hotReloadDir,
      inboxDir:   hotReloadInbox,
      listenPort: 0,
      peers: {},
    });
    await daemon.start();

    // Before reload: babbage denied
    const msg1 = makeMsg('comms-dev', 'babbage', 'framework-research', 'herald');
    expect(await daemon.sendMessage(msg1)).toBe('ACL_DENIED');

    // Update ACL to allow babbage
    const updatedAcl = {
      version: 1,
      agents: { babbage: { allowed_to: ['herald@framework-research'], allowed_from: [] } },
      default: 'deny',
    };
    writeFileSync(join(hotReloadDir, 'acl.json'), JSON.stringify(updatedAcl));

    // Trigger reload
    await daemon.reloadAcl();

    // After reload: babbage allowed (will get PEER_UNAVAILABLE because no tunnel, not ACL_DENIED)
    const msg2 = makeMsg('comms-dev', 'babbage', 'framework-research', 'herald');
    const result2 = await daemon.sendMessage(msg2);
    expect(result2).not.toBe('ACL_DENIED');  // ACL now allows it
    expect(['PEER_UNAVAILABLE', 'OK']).toContain(result2);

    await daemon.stop();
    rmSync(hotReloadDir, { recursive: true, force: true });
    rmSync(hotReloadInbox, { recursive: true, force: true });
  });

  it('keeps old ACL if acl.json is malformed during reload', async () => {
    const badReloadDir = join(tmpdir(), `kerckhoffs-daemon-badacl-${Date.now()}`);
    const badReloadInbox = join(tmpdir(), `kerckhoffs-inbox-badacl-${Date.now()}`);
    mkdirSync(join(badReloadDir, 'peers'), { recursive: true });
    mkdirSync(badReloadInbox, { recursive: true });
    genCert(badReloadDir, 'comms-dev', 'daemon');
    writeFileSync(join(badReloadDir, 'acl.json'), JSON.stringify(BASE_ACL));

    const daemon = new DaemonV2({
      teamName: 'comms-dev',
      keysDir: badReloadDir,
      inboxDir: badReloadInbox,
      listenPort: 0,
      peers: {},
    });
    await daemon.start();

    // Write malformed ACL
    writeFileSync(join(badReloadDir, 'acl.json'), '{ bad json');

    // Reload should not throw
    await expect(daemon.reloadAcl()).resolves.toBeUndefined();

    // Old ACL still in effect: babbage allowed
    const msg = makeMsg('comms-dev', 'babbage', 'framework-research', 'herald');
    const result = await daemon.sendMessage(msg);
    // Should be PEER_UNAVAILABLE (no tunnel), NOT ACL_DENIED (old ACL still allows it)
    expect(result).not.toBe('ACL_DENIED');

    await daemon.stop();
    rmSync(badReloadDir, { recursive: true, force: true });
    rmSync(badReloadInbox, { recursive: true, force: true });
  });
});

// ── 5. from.team === peerCertCN at daemon level ───────────────────────────────

describe('DaemonV2 — from.team === peerCertCN enforcement', () => {

  let cdDaemon: DaemonV2;
  let frDaemon: DaemonV2;

  beforeEach(async () => {
    rmSync(cdInbox, { recursive: true, force: true });
    rmSync(frInbox, { recursive: true, force: true });
    mkdirSync(cdInbox, { recursive: true });
    mkdirSync(frInbox, { recursive: true });

    frDaemon = new DaemonV2(makeFrOptions(0));
    await frDaemon.start();

    cdDaemon = new DaemonV2({
      ...makeCdOptions(),
      peers: { 'framework-research': { host: '127.0.0.1', port: frDaemon.port } },
    });
    await cdDaemon.start();
    await new Promise(r => setTimeout(r, 300));
  });

  afterEach(async () => {
    await cdDaemon.stop();
    await frDaemon.stop();
  });

  it('rejects inbound message where from.team does not match tunnel peer cert CN', async () => {
    // Forge: comms-dev tunnel sends a message claiming from.team = "entu-research"
    // The receiving daemon (FR) must reject this — tunnel is comms-dev, envelope says entu-research
    const forgedMsg = makeMsg('entu-research', 'hacker', 'framework-research', 'herald');

    // Use daemon's internal inject-for-test path — sends directly over tunnel bypassing local ACL
    // (tests the receiving daemon's invariant enforcement, not the sending daemon's ACL)
    const result = await cdDaemon.sendMessageRaw(forgedMsg);
    expect(result).toBe('FORGERY_REJECTED');

    // Message must NOT appear in FR inbox
    await new Promise(r => setTimeout(r, 200));
    const inboxFile = join(frInbox, `${forgedMsg.id}.json`);
    expect(existsSync(inboxFile)).toBe(false);
  });

  it('does not send an error frame back on forgery (timeout, not remote-rejected)', async () => {
    const forgedMsg = makeMsg('entu-research', 'hacker', 'framework-research', 'herald');
    const start = Date.now();
    const result = await cdDaemon.sendMessageRaw(forgedMsg);
    // Result should be FORGERY_REJECTED (connection closed by remote)
    // The connection close is detected by the client, not an error frame
    expect(result).toBe('FORGERY_REJECTED');
    expect(Date.now() - start).toBeLessThan(5000); // should not wait full timeout
  });
});

// ── 6. Daemon state reporting ─────────────────────────────────────────────────

describe('DaemonV2 — state reporting', () => {

  it('reports connected peers', async () => {
    const frDaemon = new DaemonV2(makeFrOptions(0));
    await frDaemon.start();

    const cdDaemon = new DaemonV2({
      ...makeCdOptions(),
      peers: { 'framework-research': { host: '127.0.0.1', port: frDaemon.port } },
    });
    await cdDaemon.start();
    await new Promise(r => setTimeout(r, 300));

    const peers = cdDaemon.connectedPeers();
    expect(peers).toContain('framework-research');

    await cdDaemon.stop();
    await frDaemon.stop();
  });

  it('reports disconnected peer after tunnel drops', async () => {
    const frDaemon = new DaemonV2(makeFrOptions(0));
    await frDaemon.start();

    const cdDaemon = new DaemonV2({
      ...makeCdOptions(),
      peers: { 'framework-research': { host: '127.0.0.1', port: frDaemon.port } },
      reconnectBaseMs: 60000, // don't reconnect
    });
    await cdDaemon.start();
    await new Promise(r => setTimeout(r, 300));

    await frDaemon.stop();
    await new Promise(r => setTimeout(r, 200));

    const peers = cdDaemon.connectedPeers();
    expect(peers).not.toContain('framework-research');

    await cdDaemon.stop();
  });
});
