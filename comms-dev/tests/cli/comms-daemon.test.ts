// (*CD:Kerckhoffs*)
// RED tests for comms-daemon CLI tool.
// Spec: #17 §2, #18 Phase 5.3
//
// comms-daemon connects to the running daemon via UDS and exposes:
//   comms-daemon status     — is daemon alive, uptime, version
//   comms-daemon reload     — trigger ACL hot-reload via daemon
//   comms-daemon peers      — list connected peer teams + connection state
//
// Tests exercise the logic layer directly (not the CLI binary).
// A real DaemonV2 is started in a temp dir for integration-level tests.
// Pure unit tests (error paths, validation) use a non-existent socketDir.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  daemonStatus,
  daemonReload,
  daemonPeers,
  type DaemonStatusResult,
  type DaemonReloadResult,
  type DaemonPeersResult,
} from '../../src/cli/comms-daemon.js';
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
let socketDir: string;

beforeAll(() => {
  cdDir     = join(tmpdir(), `kerckhoffs-daemon-cd-${Date.now()}`);
  frDir     = join(tmpdir(), `kerckhoffs-daemon-fr-${Date.now()}`);
  socketDir = join(tmpdir(), `kerckhoffs-daemon-sockets-${Date.now()}`);

  mkdirSync(join(cdDir, 'peers'), { recursive: true });
  mkdirSync(join(frDir, 'peers'), { recursive: true });
  mkdirSync(socketDir, { recursive: true });

  genCert(cdDir, 'comms-dev', 'daemon');
  genCert(frDir, 'framework-research', 'daemon');

  execSync(`cp "${join(frDir, 'daemon.crt')}" "${join(cdDir, 'peers', 'framework-research.crt')}"`);
  execSync(`cp "${join(cdDir, 'daemon.crt')}" "${join(frDir, 'peers', 'comms-dev.crt')}"`);

  writeFileSync(join(cdDir, 'acl.json'), JSON.stringify(CD_ACL));
  writeFileSync(join(frDir, 'acl.json'), JSON.stringify(FR_ACL));
});

afterAll(() => {
  [cdDir, frDir, socketDir].forEach(d =>
    rmSync(d, { recursive: true, force: true }),
  );
});

// ── Helper: start a two-daemon setup ──────────────────────────────────────────

async function setupDaemons(): Promise<{
  cdDaemon: DaemonV2;
  frDaemon: DaemonV2;
  localSocketDir: string;
  cdInbox: string;
  frInbox: string;
  cleanup: () => Promise<void>;
}> {
  const suffix = Math.random().toString(36).slice(2);
  const localSocketDir = join(tmpdir(), `cd-sockets-${suffix}`);
  const cdInbox        = join(tmpdir(), `cd-inbox-${suffix}`);
  const frInbox        = join(tmpdir(), `fr-inbox-${suffix}`);
  mkdirSync(localSocketDir, { recursive: true });
  mkdirSync(cdInbox,        { recursive: true });
  mkdirSync(frInbox,        { recursive: true });

  const frDaemon = new DaemonV2({
    teamName: 'framework-research',
    keysDir:  frDir,
    inboxDir: frInbox,
    listenPort: 0,
    reconnectBaseMs: 50,
  });
  await frDaemon.start();

  const cdDaemon = new DaemonV2({
    teamName: 'comms-dev',
    keysDir:  cdDir,
    inboxDir: cdInbox,
    listenPort: 0,
    socketDir: localSocketDir,
    peers: { 'framework-research': { host: '127.0.0.1', port: frDaemon.port } },
    reconnectBaseMs: 50,
  });
  await cdDaemon.start();
  await new Promise(r => setTimeout(r, 300));

  const cleanup = async () => {
    await cdDaemon.stop();
    await frDaemon.stop();
    rmSync(localSocketDir, { recursive: true, force: true });
    rmSync(cdInbox,        { recursive: true, force: true });
    rmSync(frInbox,        { recursive: true, force: true });
  };

  return { cdDaemon, frDaemon, localSocketDir, cdInbox, frInbox, cleanup };
}

// ── daemonStatus — success path ───────────────────────────────────────────────

describe('daemonStatus — daemon running', () => {

  it('returns status: running when daemon is up', async () => {
    const { localSocketDir, cleanup } = await setupDaemons();
    try {
      const result = await daemonStatus({ socketDir: localSocketDir, teamName: 'comms-dev' });
      expect(result.status).toBe('running');
    } finally {
      await cleanup();
    }
  });

  it('returns uptime_seconds as a non-negative number', async () => {
    const { localSocketDir, cleanup } = await setupDaemons();
    try {
      const result = await daemonStatus({ socketDir: localSocketDir, teamName: 'comms-dev' });
      expect(typeof result.uptime_seconds).toBe('number');
      expect(result.uptime_seconds).toBeGreaterThanOrEqual(0);
    } finally {
      await cleanup();
    }
  });

  it('returns version string', async () => {
    const { localSocketDir, cleanup } = await setupDaemons();
    try {
      const result = await daemonStatus({ socketDir: localSocketDir, teamName: 'comms-dev' });
      expect(typeof result.version).toBe('string');
      expect(result.version.length).toBeGreaterThan(0);
    } finally {
      await cleanup();
    }
  });

  it('returns team_name matching the connected daemon', async () => {
    const { localSocketDir, cleanup } = await setupDaemons();
    try {
      const result = await daemonStatus({ socketDir: localSocketDir, teamName: 'comms-dev' });
      expect(result.team_name).toBe('comms-dev');
    } finally {
      await cleanup();
    }
  });

});

// ── daemonStatus — no daemon ──────────────────────────────────────────────────

describe('daemonStatus — no daemon running', () => {

  it('throws DAEMON_NOT_RUNNING when socket does not exist', async () => {
    const emptyDir = join(tmpdir(), `kerckhoffs-empty-${Date.now()}`);
    mkdirSync(emptyDir, { recursive: true });
    try {
      await expect(
        daemonStatus({ socketDir: emptyDir, teamName: 'comms-dev' })
      ).rejects.toMatchObject({ code: 'DAEMON_NOT_RUNNING' });
    } finally {
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('throws TIMEOUT when daemon socket exists but does not respond within timeoutMs', async () => {
    // Create a UDS server that accepts connections but never writes a response
    const hangDir = join(tmpdir(), `kerckhoffs-hang-${Date.now()}`);
    mkdirSync(hangDir, { recursive: true });
    const sockPath = join(hangDir, 'comms-dev.sock');
    const openSockets: import('node:net').Socket[] = [];
    const hangServer = createServer((socket) => {
      openSockets.push(socket);
      socket.on('close', () => {
        const idx = openSockets.indexOf(socket);
        if (idx !== -1) openSockets.splice(idx, 1);
      });
      // Intentionally never write — client must time out
    });
    await new Promise<void>(resolve => hangServer.listen(sockPath, resolve));
    try {
      await expect(
        daemonStatus({ socketDir: hangDir, teamName: 'comms-dev', timeoutMs: 200 })
      ).rejects.toMatchObject({ code: 'TIMEOUT' });
    } finally {
      for (const s of openSockets) s.destroy();
      await new Promise<void>(resolve => hangServer.close(() => resolve()));
      rmSync(hangDir, { recursive: true, force: true });
    }
  }, 3000);

});

// ── daemonReload — success path ───────────────────────────────────────────────

describe('daemonReload — daemon running', () => {

  it('returns success: true when reload is accepted', async () => {
    const { localSocketDir, cleanup } = await setupDaemons();
    try {
      const result = await daemonReload({ socketDir: localSocketDir, teamName: 'comms-dev' });
      expect(result.success).toBe(true);
    } finally {
      await cleanup();
    }
  });

  it('returns reloaded_at ISO timestamp', async () => {
    const { localSocketDir, cleanup } = await setupDaemons();
    try {
      const result = await daemonReload({ socketDir: localSocketDir, teamName: 'comms-dev' });
      expect(result.reloaded_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    } finally {
      await cleanup();
    }
  });

  it('returns acl_agents_count reflecting current ACL', async () => {
    const { localSocketDir, cleanup } = await setupDaemons();
    try {
      const result = await daemonReload({ socketDir: localSocketDir, teamName: 'comms-dev' });
      // CD_ACL has 1 agent (babbage)
      expect(result.acl_agents_count).toBe(1);
    } finally {
      await cleanup();
    }
  });

  it('ACL is actually hot-reloaded: new rules take effect after reload', async () => {
    const { localSocketDir, cdInbox, cdDaemon, cleanup } = await setupDaemons();
    try {
      // Write a new ACL that adds 'vigenere' to allowed agents
      const expandedAcl = {
        ...CD_ACL,
        agents: {
          ...CD_ACL.agents,
          vigenere: {
            allowed_to:   ['herald@framework-research'],
            allowed_from: ['herald@framework-research'],
          },
        },
      };
      writeFileSync(join(cdDir, 'acl.json'), JSON.stringify(expandedAcl));
      const result = await daemonReload({ socketDir: localSocketDir, teamName: 'comms-dev' });
      expect(result.acl_agents_count).toBe(2);
    } finally {
      // Restore original ACL
      writeFileSync(join(cdDir, 'acl.json'), JSON.stringify(CD_ACL));
      await cleanup();
    }
  });

});

// ── daemonReload — no daemon ──────────────────────────────────────────────────

describe('daemonReload — no daemon running', () => {

  it('throws DAEMON_NOT_RUNNING when socket does not exist', async () => {
    const emptyDir = join(tmpdir(), `kerckhoffs-empty-reload-${Date.now()}`);
    mkdirSync(emptyDir, { recursive: true });
    try {
      await expect(
        daemonReload({ socketDir: emptyDir, teamName: 'comms-dev' })
      ).rejects.toMatchObject({ code: 'DAEMON_NOT_RUNNING' });
    } finally {
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });

});

// ── daemonPeers — success path ────────────────────────────────────────────────

describe('daemonPeers — daemon running with connected peer', () => {

  it('returns array of peer entries', async () => {
    const { localSocketDir, cleanup } = await setupDaemons();
    try {
      const result = await daemonPeers({ socketDir: localSocketDir, teamName: 'comms-dev' });
      expect(Array.isArray(result.peers)).toBe(true);
    } finally {
      await cleanup();
    }
  });

  it('lists framework-research as connected peer', async () => {
    const { localSocketDir, cleanup } = await setupDaemons();
    try {
      const result = await daemonPeers({ socketDir: localSocketDir, teamName: 'comms-dev' });
      const fr = result.peers.find(p => p.team === 'framework-research');
      expect(fr).toBeDefined();
      expect(fr?.status).toBe('connected');
    } finally {
      await cleanup();
    }
  });

  it('peer entry contains host and port', async () => {
    const { localSocketDir, frDaemon, cleanup } = await setupDaemons();
    try {
      const result = await daemonPeers({ socketDir: localSocketDir, teamName: 'comms-dev' });
      const fr = result.peers.find(p => p.team === 'framework-research');
      expect(fr?.host).toBeDefined();
      expect(typeof fr?.port).toBe('number');
      expect(fr?.port).toBe(frDaemon.port);
    } finally {
      await cleanup();
    }
  });

  it('peer entry contains connected_at ISO timestamp when connected', async () => {
    const { localSocketDir, cleanup } = await setupDaemons();
    try {
      const result = await daemonPeers({ socketDir: localSocketDir, teamName: 'comms-dev' });
      const fr = result.peers.find(p => p.team === 'framework-research');
      expect(fr?.connected_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    } finally {
      await cleanup();
    }
  });

});

describe('daemonPeers — daemon running with no peers', () => {

  it('returns empty peers array when no peers configured', async () => {
    const suffix    = Math.random().toString(36).slice(2);
    const aloneSock = join(tmpdir(), `alone-sockets-${suffix}`);
    const aloneInbox = join(tmpdir(), `alone-inbox-${suffix}`);
    mkdirSync(aloneSock,  { recursive: true });
    mkdirSync(aloneInbox, { recursive: true });

    const daemon = new DaemonV2({
      teamName:  'comms-dev',
      keysDir:   cdDir,
      inboxDir:  aloneInbox,
      listenPort: 0,
      socketDir:  aloneSock,
      // no peers
    });
    await daemon.start();
    try {
      const result = await daemonPeers({ socketDir: aloneSock, teamName: 'comms-dev' });
      expect(result.peers).toHaveLength(0);
    } finally {
      await daemon.stop();
      rmSync(aloneSock,  { recursive: true, force: true });
      rmSync(aloneInbox, { recursive: true, force: true });
    }
  });

});

describe('daemonPeers — peer disconnected', () => {

  it('shows status: disconnected for a peer that went down', async () => {
    const { cdDaemon, frDaemon, localSocketDir, cleanup } = await setupDaemons();
    try {
      // Stop the FR daemon to simulate peer going offline
      await frDaemon.stop();
      // Give reconnect logic a moment to mark it as disconnected
      await new Promise(r => setTimeout(r, 400));

      const result = await daemonPeers({ socketDir: localSocketDir, teamName: 'comms-dev' });
      const fr = result.peers.find(p => p.team === 'framework-research');
      expect(fr?.status).toBe('disconnected');
    } finally {
      // cdDaemon still needs cleanup; frDaemon already stopped
      await cdDaemon.stop();
    }
  });

  it('disconnected peer entry has no connected_at', async () => {
    const suffix    = Math.random().toString(36).slice(2);
    const sockDir   = join(tmpdir(), `disc-sockets-${suffix}`);
    const cdInbox   = join(tmpdir(), `disc-inbox-${suffix}`);
    mkdirSync(sockDir,  { recursive: true });
    mkdirSync(cdInbox,  { recursive: true });

    // Point at a port that will never respond
    const daemon = new DaemonV2({
      teamName: 'comms-dev',
      keysDir:  cdDir,
      inboxDir: cdInbox,
      listenPort: 0,
      socketDir: sockDir,
      peers: { 'framework-research': { host: '127.0.0.1', port: 1 } },  // unreachable
      reconnectBaseMs: 60000,
    });
    await daemon.start();
    await new Promise(r => setTimeout(r, 200));
    try {
      const result = await daemonPeers({ socketDir: sockDir, teamName: 'comms-dev' });
      const fr = result.peers.find(p => p.team === 'framework-research');
      expect(fr?.status).toBe('disconnected');
      // connected_at should be absent or null when never connected
      expect(fr?.connected_at == null).toBe(true);
    } finally {
      await daemon.stop();
      rmSync(sockDir,  { recursive: true, force: true });
      rmSync(cdInbox,  { recursive: true, force: true });
    }
  });

});

// ── daemonPeers — no daemon ───────────────────────────────────────────────────

describe('daemonPeers — no daemon running', () => {

  it('throws DAEMON_NOT_RUNNING when socket does not exist', async () => {
    const emptyDir = join(tmpdir(), `kerckhoffs-empty-peers-${Date.now()}`);
    mkdirSync(emptyDir, { recursive: true });
    try {
      await expect(
        daemonPeers({ socketDir: emptyDir, teamName: 'comms-dev' })
      ).rejects.toMatchObject({ code: 'DAEMON_NOT_RUNNING' });
    } finally {
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });

});
