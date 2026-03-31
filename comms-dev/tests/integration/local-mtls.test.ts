// (*CD:Kerckhoffs*)
// Local two-daemon mTLS integration test.
//
// Local analogue of cross-container acceptance test matrix:
//   TC-01 — daemon starts, registers, is reachable (proves listen/bind)
//   TC-03 — comms-dev sends to framework-research, inbox file verified
//   TC-04 — framework-research sends to comms-dev, inbox file verified
//
// No Docker, no shared volume. Two DaemonV2 instances in-process, different
// localhost ports, different team names, different mTLS keypairs.
// Entry point: daemon.sendMessage() — direct mTLS/TCP path, no MCP layer.
//
// Spec: #16 §5–§7, #18 Phase 3, cross-container-test-matrix.md TC-01/TC-03/TC-04

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import {
  mkdirSync, rmSync, writeFileSync, readFileSync, existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { DaemonV2, type DaemonV2Options } from '../../src/broker/daemon-v2.js';
import type { Message } from '../../src/types.js';

/** Reserve a free TCP port then release it. */
function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = (srv.address() as { port: number }).port;
      srv.close(err => err ? reject(err) : resolve(port));
    });
  });
}

// ── Fixture helpers ───────────────────────────────────────────────────────────

function genCert(dir: string, cn: string): void {
  execSync(
    `openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${join(dir, 'daemon.key')}" \
     -out "${join(dir, 'daemon.crt')}" \
     -days 1 -nodes \
     -subj "/CN=${cn}" \
     -addext "subjectAltName=DNS:${cn}" 2>/dev/null`,
  );
}

/** Poll until inbox file appears, or timeout. Returns the parsed Message. */
async function waitForInboxFile(
  inboxDir: string,
  messageId: string,
  timeoutMs = 3000,
): Promise<Message> {
  const filePath = join(inboxDir, `${messageId}.json`);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf8')) as Message;
    }
    await new Promise(r => setTimeout(r, 30));
  }
  throw new Error(`Inbox delivery timeout: ${filePath} not found after ${timeoutMs}ms`);
}

// ── Shared fixture ────────────────────────────────────────────────────────────

// comms-dev ACL: babbage can send to / receive from herald@framework-research
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

// framework-research ACL: herald can send to / receive from babbage@comms-dev
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
let cdDaemon: DaemonV2;
let frDaemon: DaemonV2;

beforeAll(async () => {
  const ts = Date.now();
  cdDir   = join(tmpdir(), `mtls-cd-keys-${ts}`);
  frDir   = join(tmpdir(), `mtls-fr-keys-${ts}`);
  cdInbox = join(tmpdir(), `mtls-cd-inbox-${ts}`);
  frInbox = join(tmpdir(), `mtls-fr-inbox-${ts}`);

  mkdirSync(join(cdDir, 'peers'), { recursive: true });
  mkdirSync(join(frDir, 'peers'), { recursive: true });
  mkdirSync(cdInbox, { recursive: true });
  mkdirSync(frInbox, { recursive: true });

  // Generate separate keypairs for each team
  genCert(cdDir, 'comms-dev');
  genCert(frDir, 'framework-research');

  // Cross-pin: each team trusts the other's certificate
  execSync(`cp "${join(frDir, 'daemon.crt')}" "${join(cdDir, 'peers', 'framework-research.crt')}"`);
  execSync(`cp "${join(cdDir, 'daemon.crt')}" "${join(frDir, 'peers', 'comms-dev.crt')}"`);

  writeFileSync(join(cdDir, 'acl.json'), JSON.stringify(CD_ACL));
  writeFileSync(join(frDir, 'acl.json'), JSON.stringify(FR_ACL));

  // Pre-assign ports so both daemons can reference each other from the start.
  // Both tunnels (CD→FR and FR→CD) establish concurrently.
  const [cdPort, frPort] = await Promise.all([getFreePort(), getFreePort()]);

  cdDaemon = new DaemonV2({
    teamName:            'comms-dev',
    keysDir:             cdDir,
    inboxDir:            cdInbox,
    listenPort:          cdPort,
    peers: { 'framework-research': { host: '127.0.0.1', port: frPort } },
    reconnectBaseMs:     50,
    heartbeatIntervalMs: 60_000,
    deadConnectionMs:    120_000,
  });

  frDaemon = new DaemonV2({
    teamName:            'framework-research',
    keysDir:             frDir,
    inboxDir:            frInbox,
    listenPort:          frPort,
    peers: { 'comms-dev': { host: '127.0.0.1', port: cdPort } },
    reconnectBaseMs:     50,
    heartbeatIntervalMs: 60_000,
    deadConnectionMs:    120_000,
  });

  // Start both concurrently — tunnels establish in both directions
  await Promise.all([cdDaemon.start(), frDaemon.start()]);

  // Allow mTLS tunnels to fully establish in both directions
  await new Promise(r => setTimeout(r, 500));
});

afterAll(async () => {
  await cdDaemon?.stop();
  await frDaemon?.stop();
  for (const d of [cdDir, frDir, cdInbox, frInbox]) {
    rmSync(d, { recursive: true, force: true });
  }
});

// ── TC-01 analogue: daemon ready ──────────────────────────────────────────────

describe('Local mTLS — TC-01 analogue: daemon starts and is reachable', () => {

  it('comms-dev daemon is ready after start', () => {
    expect(cdDaemon.isReady()).toBe(true);
    expect(cdDaemon.port).toBeGreaterThan(0);
  });

  it('framework-research daemon is ready after start', () => {
    expect(frDaemon.isReady()).toBe(true);
    expect(frDaemon.port).toBeGreaterThan(0);
  });

  it('both daemons bind on distinct ports', () => {
    expect(cdDaemon.port).not.toBe(frDaemon.port);
  });

  it('comms-dev tunnel to framework-research is connected', () => {
    expect(cdDaemon.connectedPeers()).toContain('framework-research');
  });

  it('framework-research tunnel to comms-dev is connected', () => {
    expect(frDaemon.connectedPeers()).toContain('comms-dev');
  });
});

// ── TC-03 analogue: comms-dev → framework-research ───────────────────────────

describe('Local mTLS — TC-03 analogue: comms-dev → framework-research delivery', () => {

  it('sendMessage returns OK', async () => {
    const msg: Message = {
      version:   '1',
      id:        'tc03-' + Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      from:      { team: 'comms-dev', agent: 'babbage' },
      to:        { team: 'framework-research', agent: 'herald' },
      type:      'query',
      priority:  'normal',
      reply_to:  null,
      body:      'TC-03: ping from comms-dev',
      checksum:  'sha256:test',
    };
    const result = await cdDaemon.sendMessage(msg);
    expect(result).toBe('OK');
  });

  it('inbox file appears in framework-research inbox after delivery', async () => {
    const msg: Message = {
      version:   '1',
      id:        'tc03-inbox-' + Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      from:      { team: 'comms-dev', agent: 'babbage' },
      to:        { team: 'framework-research', agent: 'herald' },
      type:      'query',
      priority:  'normal',
      reply_to:  null,
      body:      'TC-03: inbox delivery check',
      checksum:  'sha256:test',
    };
    await cdDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(frInbox, msg.id);
    expect(delivered.id).toBe(msg.id);
  });

  it('delivered message has correct from/to fields', async () => {
    const msg: Message = {
      version:   '1',
      id:        'tc03-fields-' + Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      from:      { team: 'comms-dev', agent: 'babbage' },
      to:        { team: 'framework-research', agent: 'herald' },
      type:      'query',
      priority:  'normal',
      reply_to:  null,
      body:      'TC-03: field validation',
      checksum:  'sha256:test',
    };
    await cdDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(frInbox, msg.id);

    // TC-03 assertions from test matrix
    expect(delivered.from.team).toBe('comms-dev');
    expect(delivered.to.team).toBe('framework-research');
    expect(delivered.to.agent).toBe('herald');
    expect(delivered.body).toBe('TC-03: field validation');
    expect(delivered.type).toBe('query');
  });
});

// ── TC-04 analogue: framework-research → comms-dev ───────────────────────────

describe('Local mTLS — TC-04 analogue: framework-research → comms-dev delivery', () => {

  it('sendMessage returns OK in reverse direction', async () => {
    const msg: Message = {
      version:   '1',
      id:        'tc04-' + Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      from:      { team: 'framework-research', agent: 'herald' },
      to:        { team: 'comms-dev', agent: 'babbage' },
      type:      'query',
      priority:  'normal',
      reply_to:  null,
      body:      'TC-04: ping from framework-research',
      checksum:  'sha256:test',
    };
    const result = await frDaemon.sendMessage(msg);
    expect(result).toBe('OK');
  });

  it('inbox file appears in comms-dev inbox after reverse delivery', async () => {
    const msg: Message = {
      version:   '1',
      id:        'tc04-inbox-' + Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      from:      { team: 'framework-research', agent: 'herald' },
      to:        { team: 'comms-dev', agent: 'babbage' },
      type:      'query',
      priority:  'normal',
      reply_to:  null,
      body:      'TC-04: inbox delivery check',
      checksum:  'sha256:test',
    };
    await frDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(cdInbox, msg.id);
    expect(delivered.id).toBe(msg.id);
  });

  it('delivered message has correct from/to fields', async () => {
    const msg: Message = {
      version:   '1',
      id:        'tc04-fields-' + Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      from:      { team: 'framework-research', agent: 'herald' },
      to:        { team: 'comms-dev', agent: 'babbage' },
      type:      'query',
      priority:  'normal',
      reply_to:  null,
      body:      'TC-04: field validation',
      checksum:  'sha256:test',
    };
    await frDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(cdInbox, msg.id);

    // TC-04 assertions from test matrix (teams swapped vs TC-03)
    expect(delivered.from.team).toBe('framework-research');
    expect(delivered.to.team).toBe('comms-dev');
    expect(delivered.to.agent).toBe('babbage');
    expect(delivered.body).toBe('TC-04: field validation');
    expect(delivered.type).toBe('query');
  });
});
