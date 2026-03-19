// (*CD:Kerckhoffs*)
// RED tests for TLS server — mTLS handshake, peer authentication,
// from.team === peerCertCN enforcement at tunnel level.
// Spec: #16 §3, #15 §3, #18 Phase 2.1

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connect } from 'node:tls';
import { loadDaemonCrypto } from '../../src/crypto/tls-config.js';
import { TlsServer } from '../../src/transport/tls-server.js';
import { encodeFrame } from '../../src/transport/framing.js';
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

function makeMessage(fromTeam: string, fromAgent = 'babbage'): Message {
  return {
    version: '1',
    id: `msg-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    from: { team: fromTeam, agent: fromAgent },
    to:   { team: 'comms-dev', agent: 'kerckhoffs' },
    type: 'query',
    priority: 'normal',
    reply_to: null,
    body: 'test',
    checksum: 'sha256:test',
  };
}

let serverDir: string;
let clientDir: string;   // framework-research daemon
let rogueDir: string;    // unknown team (not in server's peers/)
let expiredDir: string;  // expired cert

beforeAll(() => {
  serverDir  = join(tmpdir(), `kerckhoffs-tls-server-${Date.now()}`);
  clientDir  = join(tmpdir(), `kerckhoffs-tls-client-${Date.now()}`);
  rogueDir   = join(tmpdir(), `kerckhoffs-tls-rogue-${Date.now()}`);
  expiredDir = join(tmpdir(), `kerckhoffs-tls-expired-${Date.now()}`);

  mkdirSync(join(serverDir, 'peers'), { recursive: true });
  mkdirSync(join(clientDir, 'peers'), { recursive: true });
  mkdirSync(join(rogueDir, 'peers'),  { recursive: true });
  mkdirSync(join(expiredDir, 'peers'), { recursive: true });

  // Server = comms-dev daemon
  genCert(serverDir, 'comms-dev', 'daemon');
  // Client = framework-research daemon
  genCert(clientDir, 'framework-research', 'daemon');
  // Rogue = unknown team (not pinned by server)
  genCert(rogueDir, 'rogue-team', 'daemon');
  // Expired cert (validity -1 day to yesterday)
  execSync(
    `openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${join(expiredDir, 'daemon.key')}" \
     -out "${join(expiredDir, 'daemon.crt')}" \
     -days 1 -nodes \
     -subj "/CN=expired-team" \
     -addext "subjectAltName=DNS:expired-team" \
     -set_serial 1 2>/dev/null`,
  );

  // Server knows framework-research (pins their cert)
  execSync(`cp "${join(clientDir, 'daemon.crt')}" "${join(serverDir, 'peers', 'framework-research.crt')}"`);
  // Server does NOT know rogue-team or expired-team

  // Client (framework-research) knows comms-dev server
  execSync(`cp "${join(serverDir, 'daemon.crt')}" "${join(clientDir, 'peers', 'comms-dev.crt')}"`);
});

afterAll(() => {
  [serverDir, clientDir, rogueDir, expiredDir].forEach(d =>
    rmSync(d, { recursive: true, force: true }),
  );
});

// ── TlsServer — construction and lifecycle ───────────────────────────────────

describe('TlsServer — construction', () => {

  it('starts listening on a port when started', async () => {
    const config = await loadDaemonCrypto({
      keyPath:  join(serverDir, 'daemon.key'),
      certPath: join(serverDir, 'daemon.crt'),
      peersDir: join(serverDir, 'peers'),
    });
    const server = new TlsServer({ config, teamName: 'comms-dev' });
    await server.start();
    expect(server.port).toBeGreaterThan(0);
    await server.stop();
  });

  it('can be stopped cleanly', async () => {
    const config = await loadDaemonCrypto({
      keyPath:  join(serverDir, 'daemon.key'),
      certPath: join(serverDir, 'daemon.crt'),
      peersDir: join(serverDir, 'peers'),
    });
    const server = new TlsServer({ config, teamName: 'comms-dev' });
    await server.start();
    await expect(server.stop()).resolves.toBeUndefined();
  });
});

// ── TlsServer — peer authentication ──────────────────────────────────────────

describe('TlsServer — mTLS peer authentication', () => {

  let server: TlsServer;
  let serverConfig: Awaited<ReturnType<typeof loadDaemonCrypto>>;

  beforeAll(async () => {
    serverConfig = await loadDaemonCrypto({
      keyPath:  join(serverDir, 'daemon.key'),
      certPath: join(serverDir, 'daemon.crt'),
      peersDir: join(serverDir, 'peers'),
    });
    server = new TlsServer({ config: serverConfig, teamName: 'comms-dev' });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('accepts connection from a known peer (framework-research)', async () => {
    const received: string[] = [];
    server.onConnection((team) => received.push(team));

    const socket = connect({
      host: '127.0.0.1',
      port: server.port,
      key:  readFileSync(join(clientDir, 'daemon.key')),
      cert: readFileSync(join(clientDir, 'daemon.crt')),
      rejectUnauthorized: false,
      ca: [],
      minVersion: 'TLSv1.3',
      maxVersion: 'TLSv1.3',
    });

    await new Promise<void>((resolve, reject) => {
      socket.once('secureConnect', () => { socket.end(); resolve(); });
      socket.once('error', reject);
    });

    // Give server time to process connection event
    await new Promise(r => setTimeout(r, 50));
    expect(received).toContain('framework-research');
  });

  it('closes connection from unknown peer (not in peers/ directory)', async () => {
    const closed = await new Promise<boolean>((resolve) => {
      const socket = connect({
        host: '127.0.0.1',
        port: server.port,
        key:  readFileSync(join(rogueDir, 'daemon.key')),
        cert: readFileSync(join(rogueDir, 'daemon.crt')),
        rejectUnauthorized: false,
        ca: [],
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
      });
      socket.once('close', () => resolve(true));
      socket.once('error', () => resolve(true));
      // If secureConnect succeeds but no close within 500ms, consider it a failure
      socket.once('secureConnect', () => {
        setTimeout(() => {
          if (!socket.destroyed) { socket.destroy(); resolve(false); }
        }, 500);
      });
    });
    expect(closed).toBe(true);
  });

  it('rejects connection with no client certificate', async () => {
    const closed = await new Promise<boolean>((resolve) => {
      const socket = connect({
        host: '127.0.0.1',
        port: server.port,
        // No key/cert — anonymous client
        rejectUnauthorized: false,
        ca: [],
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
      });
      socket.once('close', () => resolve(true));
      socket.once('error', () => resolve(true));
      socket.once('secureConnect', () => setTimeout(() => {
        if (!socket.destroyed) { socket.destroy(); resolve(false); }
      }, 500));
    });
    expect(closed).toBe(true);
  });
});

// ── TlsServer — from.team === peerCertCN enforcement ─────────────────────────

describe('TlsServer — from.team invariant enforcement at tunnel level', () => {

  let server: TlsServer;
  let deliveredMessages: Message[];
  let rejectedCount: number;

  beforeAll(async () => {
    const config = await loadDaemonCrypto({
      keyPath:  join(serverDir, 'daemon.key'),
      certPath: join(serverDir, 'daemon.crt'),
      peersDir: join(serverDir, 'peers'),
    });
    server = new TlsServer({ config, teamName: 'comms-dev' });
    deliveredMessages = [];
    rejectedCount = 0;
    server.onMessage((msg) => deliveredMessages.push(msg));
    server.onForgeryDetected(() => rejectedCount++);
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('delivers message when from.team matches mTLS peer cert CN', async () => {
    const msg = makeMessage('framework-research');

    await new Promise<void>((resolve, reject) => {
      const socket = connect({
        host: '127.0.0.1',
        port: server.port,
        key:  readFileSync(join(clientDir, 'daemon.key')),
        cert: readFileSync(join(clientDir, 'daemon.crt')),
        rejectUnauthorized: false,
        ca: [],
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
      });
      socket.once('secureConnect', () => {
        socket.write(encodeFrame(msg));
        setTimeout(() => { socket.destroy(); resolve(); }, 100);
      });
      socket.once('error', reject);
    });

    await new Promise(r => setTimeout(r, 100));
    expect(deliveredMessages.some(m => m.id === msg.id)).toBe(true);
  });

  it('closes connection when from.team does not match peer cert CN (forgery)', async () => {
    const before = rejectedCount;
    // Client is framework-research but claims to be comms-dev in from.team
    const forgedMsg = makeMessage('comms-dev');  // wrong team in envelope

    const connectionClosed = await new Promise<boolean>((resolve) => {
      const socket = connect({
        host: '127.0.0.1',
        port: server.port,
        key:  readFileSync(join(clientDir, 'daemon.key')),
        cert: readFileSync(join(clientDir, 'daemon.crt')),
        rejectUnauthorized: false,
        ca: [],
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
      });
      socket.once('secureConnect', () => {
        socket.write(encodeFrame(forgedMsg));
      });
      socket.once('close', () => resolve(true));
      socket.once('error', () => resolve(true));
    });

    await new Promise(r => setTimeout(r, 100));
    expect(connectionClosed).toBe(true);
    expect(rejectedCount).toBeGreaterThan(before);
  });

  it('does NOT send an error frame back on forgery (silent close)', async () => {
    const receivedData: Buffer[] = [];
    const forgedMsg = makeMessage('other-team');

    await new Promise<void>((resolve) => {
      const socket = connect({
        host: '127.0.0.1',
        port: server.port,
        key:  readFileSync(join(clientDir, 'daemon.key')),
        cert: readFileSync(join(clientDir, 'daemon.crt')),
        rejectUnauthorized: false,
        ca: [],
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
      });
      socket.once('secureConnect', () => {
        socket.on('data', (chunk) => receivedData.push(chunk));
        socket.write(encodeFrame(forgedMsg));
      });
      socket.once('close', () => resolve());
      socket.once('error', () => resolve());
    });

    // No data should have been sent back before close
    expect(receivedData).toHaveLength(0);
  });
});
