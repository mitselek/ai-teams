// (*CD:Kerckhoffs*)
// RED tests for CrossTeamSend MCP tool.
// Spec: #16 §4, §6, #18 Phase 4
//
// CrossTeamSend connects to the local daemon via UDS and sends a message
// to a remote agent. It blocks until the remote daemon ACKs.
// Tests exercise the tool's logic layer directly (not the MCP binary).

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crossTeamSend, type CrossTeamSendParams, type CrossTeamSendResult } from '../../src/mcp/cross-team-send.js';
import { DaemonV2 } from '../../src/broker/daemon-v2.js';

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

const CD_ACL = {
  version: 1,
  agents: {
    babbage: {
      allowed_to:   ['herald@framework-research'],
      allowed_from: ['herald@framework-research'],
    },
  },
  default: 'deny',
};

const FR_ACL = {
  version: 1,
  agents: {
    herald: {
      allowed_to:   ['babbage@comms-dev'],
      allowed_from: ['babbage@comms-dev'],
    },
  },
  default: 'deny',
};

let cdDir: string;
let frDir: string;
let cdInbox: string;
let frInbox: string;
let socketDir: string;

beforeAll(() => {
  cdDir     = join(tmpdir(), `kerckhoffs-mcp-cd-${Date.now()}`);
  frDir     = join(tmpdir(), `kerckhoffs-mcp-fr-${Date.now()}`);
  cdInbox   = join(tmpdir(), `kerckhoffs-mcp-cd-inbox-${Date.now()}`);
  frInbox   = join(tmpdir(), `kerckhoffs-mcp-fr-inbox-${Date.now()}`);
  socketDir = join(tmpdir(), `kerckhoffs-mcp-sockets-${Date.now()}`);

  mkdirSync(join(cdDir, 'peers'), { recursive: true });
  mkdirSync(join(frDir, 'peers'), { recursive: true });
  mkdirSync(cdInbox, { recursive: true });
  mkdirSync(frInbox, { recursive: true });
  mkdirSync(socketDir, { recursive: true });

  genCert(cdDir, 'comms-dev', 'daemon');
  genCert(frDir, 'framework-research', 'daemon');

  execSync(`cp "${join(frDir, 'daemon.crt')}" "${join(cdDir, 'peers', 'framework-research.crt')}"`);
  execSync(`cp "${join(cdDir, 'daemon.crt')}" "${join(frDir, 'peers', 'comms-dev.crt')}"`);

  writeFileSync(join(cdDir, 'acl.json'), JSON.stringify(CD_ACL));
  writeFileSync(join(frDir, 'acl.json'), JSON.stringify(FR_ACL));
});

afterAll(() => {
  [cdDir, frDir, cdInbox, frInbox, socketDir].forEach(d =>
    rmSync(d, { recursive: true, force: true }),
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function setupDaemons(): Promise<{ cdDaemon: DaemonV2; frDaemon: DaemonV2; cleanup: () => Promise<void> }> {
  const inboxSuffix = Math.random().toString(36).slice(2);
  const localCdInbox = join(tmpdir(), `cd-inbox-${inboxSuffix}`);
  const localFrInbox = join(tmpdir(), `fr-inbox-${inboxSuffix}`);
  mkdirSync(localCdInbox, { recursive: true });
  mkdirSync(localFrInbox, { recursive: true });

  const frDaemon = new DaemonV2({
    teamName: 'framework-research',
    keysDir:  frDir,
    inboxDir: localFrInbox,
    listenPort: 0,
    reconnectBaseMs: 50,
  });
  await frDaemon.start();

  const cdDaemon = new DaemonV2({
    teamName: 'comms-dev',
    keysDir:  cdDir,
    inboxDir: localCdInbox,
    listenPort: 0,
    socketDir,
    peers: { 'framework-research': { host: '127.0.0.1', port: frDaemon.port } },
    reconnectBaseMs: 50,
  });
  await cdDaemon.start();
  await new Promise(r => setTimeout(r, 300));

  const cleanup = async () => {
    await cdDaemon.stop();
    await frDaemon.stop();
    rmSync(localCdInbox, { recursive: true, force: true });
    rmSync(localFrInbox, { recursive: true, force: true });
  };

  return { cdDaemon, frDaemon, cleanup };
}

// ── CrossTeamSend — success path ──────────────────────────────────────────────

describe('crossTeamSend — successful delivery', () => {

  it('returns message_id and delivered_at on success', async () => {
    const { cdDaemon, frDaemon, cleanup } = await setupDaemons();
    try {
      const result = await crossTeamSend(
        {
          to:       'herald@framework-research',
          body:     'hello from babbage',
          fromAgent: 'babbage',
        },
        { socketDir, teamName: 'comms-dev', timeoutMs: 5000 },
      );
      expect(result.message_id).toMatch(/^msg-/);
      expect(result.delivered_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    } finally {
      await cleanup();
    }
  });

  it('blocks until remote daemon ACKs (not until agent reads inbox)', async () => {
    const { cdDaemon, frDaemon, cleanup } = await setupDaemons();
    try {
      const before = Date.now();
      const result = await crossTeamSend(
        { to: 'herald@framework-research', body: 'timing test', fromAgent: 'babbage' },
        { socketDir, teamName: 'comms-dev', timeoutMs: 5000 },
      );
      const elapsed = Date.now() - before;
      // Should complete well within 5 seconds (ACK is fast over local TLS)
      expect(elapsed).toBeLessThan(3000);
      expect(result.message_id).toBeDefined();
    } finally {
      await cleanup();
    }
  });

  it('assigns unique message_ids to successive calls', async () => {
    const { cleanup } = await setupDaemons();
    try {
      const r1 = await crossTeamSend(
        { to: 'herald@framework-research', body: 'first', fromAgent: 'babbage' },
        { socketDir, teamName: 'comms-dev', timeoutMs: 5000 },
      );
      const r2 = await crossTeamSend(
        { to: 'herald@framework-research', body: 'second', fromAgent: 'babbage' },
        { socketDir, teamName: 'comms-dev', timeoutMs: 5000 },
      );
      expect(r1.message_id).not.toBe(r2.message_id);
    } finally {
      await cleanup();
    }
  });
});

// ── CrossTeamSend — parameter validation ─────────────────────────────────────

describe('crossTeamSend — parameter validation', () => {

  it('throws INVALID_ADDRESS for malformed to address (no @)', async () => {
    await expect(crossTeamSend(
      { to: 'not-an-address', body: 'test', fromAgent: 'babbage' },
      { socketDir, teamName: 'comms-dev', timeoutMs: 5000 },
    )).rejects.toMatchObject({ code: 'INVALID_ADDRESS' });
  });

  it('throws INVALID_ADDRESS for empty to address', async () => {
    await expect(crossTeamSend(
      { to: '', body: 'test', fromAgent: 'babbage' },
      { socketDir, teamName: 'comms-dev', timeoutMs: 5000 },
    )).rejects.toMatchObject({ code: 'INVALID_ADDRESS' });
  });

  it('throws INVALID_ADDRESS for wildcard to address (*@team)', async () => {
    await expect(crossTeamSend(
      { to: '*@framework-research', body: 'test', fromAgent: 'babbage' },
      { socketDir, teamName: 'comms-dev', timeoutMs: 5000 },
    )).rejects.toMatchObject({ code: 'INVALID_ADDRESS' });
  });

  it('throws INVALID_ADDRESS for address with invalid characters', async () => {
    await expect(crossTeamSend(
      { to: 'agent name@team name', body: 'test', fromAgent: 'babbage' },
      { socketDir, teamName: 'comms-dev', timeoutMs: 5000 },
    )).rejects.toMatchObject({ code: 'INVALID_ADDRESS' });
  });

  it('throws with meaningful error when fromAgent is missing', async () => {
    await expect(crossTeamSend(
      { to: 'herald@framework-research', body: 'test', fromAgent: '' },
      { socketDir, teamName: 'comms-dev', timeoutMs: 5000 },
    )).rejects.toThrow();
  });

  // Validation happens BEFORE daemon connection — no daemon needed
  it('validates address before attempting daemon connection', async () => {
    // Use a socketDir where no daemon is running
    const emptySocketDir = join(tmpdir(), `kerckhoffs-empty-sockets-${Date.now()}`);
    mkdirSync(emptySocketDir, { recursive: true });
    try {
      await expect(crossTeamSend(
        { to: 'not-valid', body: 'test', fromAgent: 'babbage' },
        { socketDir: emptySocketDir, teamName: 'comms-dev', timeoutMs: 5000 },
      )).rejects.toMatchObject({ code: 'INVALID_ADDRESS' });
      // Should fail immediately with INVALID_ADDRESS, not wait for daemon connection
    } finally {
      rmSync(emptySocketDir, { recursive: true, force: true });
    }
  });
});

// ── CrossTeamSend — error codes ───────────────────────────────────────────────

describe('crossTeamSend — error codes from daemon', () => {

  it('throws ACL_DENIED when local ACL blocks the send', async () => {
    const { cleanup } = await setupDaemons();
    try {
      // vigenere is not in CD_ACL → default deny
      await expect(crossTeamSend(
        { to: 'herald@framework-research', body: 'test', fromAgent: 'vigenere' },
        { socketDir, teamName: 'comms-dev', timeoutMs: 5000 },
      )).rejects.toMatchObject({ code: 'ACL_DENIED' });
    } finally {
      await cleanup();
    }
  });

  it('throws PEER_UNAVAILABLE when peer daemon is unreachable and queue is full', async () => {
    // Use a daemon with no peer connection (peer port 1 = unreachable)
    const isolatedDir = join(tmpdir(), `kerckhoffs-isolated-${Date.now()}`);
    const isolatedInbox = join(tmpdir(), `kerckhoffs-isolated-inbox-${Date.now()}`);
    const isolatedSocketDir = join(tmpdir(), `kerckhoffs-isolated-sockets-${Date.now()}`);
    mkdirSync(join(isolatedDir, 'peers'), { recursive: true });
    mkdirSync(isolatedInbox, { recursive: true });
    mkdirSync(isolatedSocketDir, { recursive: true });
    genCert(isolatedDir, 'comms-dev', 'daemon');
    // Pin FR cert so ACL passes but peer is unreachable
    execSync(`cp "${join(frDir, 'daemon.crt')}" "${join(isolatedDir, 'peers', 'framework-research.crt')}"`);
    writeFileSync(join(isolatedDir, 'acl.json'), JSON.stringify(CD_ACL));

    const daemon = new DaemonV2({
      teamName: 'comms-dev',
      keysDir: isolatedDir,
      inboxDir: isolatedInbox,
      listenPort: 0,
      socketDir: isolatedSocketDir,
      peers: { 'framework-research': { host: '127.0.0.1', port: 1 } },  // unreachable
      maxQueueSize: 1,  // tiny queue so it fills immediately
      reconnectBaseMs: 60000,
    });
    await daemon.start();

    try {
      // First message fills the queue
      crossTeamSend(
        { to: 'herald@framework-research', body: 'fill queue', fromAgent: 'babbage' },
        { socketDir: isolatedSocketDir, teamName: 'comms-dev', timeoutMs: 5000 },
      ).catch(() => {});

      // Second message should get PEER_UNAVAILABLE
      await expect(crossTeamSend(
        { to: 'herald@framework-research', body: 'overflow', fromAgent: 'babbage' },
        { socketDir: isolatedSocketDir, teamName: 'comms-dev', timeoutMs: 5000 },
      )).rejects.toMatchObject({ code: 'PEER_UNAVAILABLE' });
    } finally {
      await daemon.stop();
      rmSync(isolatedDir, { recursive: true, force: true });
      rmSync(isolatedInbox, { recursive: true, force: true });
      rmSync(isolatedSocketDir, { recursive: true, force: true });
    }
  });

  it('throws TIMEOUT when daemon does not respond within timeoutMs', async () => {
    // Connect to a socket that exists but hangs (no daemon reading)
    // Use a very short timeout
    await expect(crossTeamSend(
      { to: 'herald@framework-research', body: 'test', fromAgent: 'babbage' },
      { socketDir, teamName: 'comms-dev', timeoutMs: 100 },  // 100ms — daemon not running
    )).rejects.toMatchObject({ code: 'TIMEOUT' });
  });
});

// ── CrossTeamSend — optional parameters ──────────────────────────────────────

describe('crossTeamSend — optional parameters', () => {

  it('accepts type parameter (defaults to query)', async () => {
    const { cleanup } = await setupDaemons();
    try {
      const result = await crossTeamSend(
        { to: 'herald@framework-research', body: 'test', fromAgent: 'babbage', type: 'response' },
        { socketDir, teamName: 'comms-dev', timeoutMs: 5000 },
      );
      expect(result.message_id).toBeDefined();
    } finally {
      await cleanup();
    }
  });

  it('accepts priority parameter (defaults to normal)', async () => {
    const { cleanup } = await setupDaemons();
    try {
      const result = await crossTeamSend(
        { to: 'herald@framework-research', body: 'test', fromAgent: 'babbage', priority: 'high' },
        { socketDir, teamName: 'comms-dev', timeoutMs: 5000 },
      );
      expect(result.message_id).toBeDefined();
    } finally {
      await cleanup();
    }
  });

  it('accepts reply_to parameter', async () => {
    const { cleanup } = await setupDaemons();
    try {
      const result = await crossTeamSend(
        { to: 'herald@framework-research', body: 'test', fromAgent: 'babbage', reply_to: 'msg-original-001' },
        { socketDir, teamName: 'comms-dev', timeoutMs: 5000 },
      );
      expect(result.message_id).toBeDefined();
    } finally {
      await cleanup();
    }
  });
});
