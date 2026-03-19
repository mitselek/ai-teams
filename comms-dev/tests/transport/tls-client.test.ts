// (*CD:Kerckhoffs*)
// RED tests for TLS client — outbound mTLS connection, fingerprint verification,
// reconnect with exponential backoff.
// Spec: #16 §3, #18 Phase 2.2

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type TLSSocket } from 'node:tls';
import { loadDaemonCrypto } from '../../src/crypto/tls-config.js';
import { TlsClient } from '../../src/transport/tls-client.js';
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

function makeMessage(toTeam: string): Message {
  return {
    version: '1',
    id: `msg-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    from: { team: 'comms-dev', agent: 'babbage' },
    to:   { team: toTeam, agent: 'herald' },
    type: 'query',
    priority: 'normal',
    reply_to: null,
    body: 'test',
    checksum: 'sha256:test',
  };
}

let clientSecretsDir: string;  // comms-dev (the connecting daemon)
let serverDir: string;          // framework-research (the listening peer)
let rogueServerDir: string;     // untrusted server (wrong cert)

beforeAll(() => {
  clientSecretsDir = join(tmpdir(), `kerckhoffs-tlsclient-client-${Date.now()}`);
  serverDir        = join(tmpdir(), `kerckhoffs-tlsclient-server-${Date.now()}`);
  rogueServerDir   = join(tmpdir(), `kerckhoffs-tlsclient-rogue-${Date.now()}`);

  mkdirSync(join(clientSecretsDir, 'peers'), { recursive: true });
  mkdirSync(join(serverDir, 'peers'), { recursive: true });
  mkdirSync(join(rogueServerDir, 'peers'), { recursive: true });

  genCert(clientSecretsDir, 'comms-dev', 'daemon');
  genCert(serverDir, 'framework-research', 'daemon');
  genCert(rogueServerDir, 'rogue-server', 'daemon');

  // Client pins the real framework-research cert
  execSync(`cp "${join(serverDir, 'daemon.crt')}" "${join(clientSecretsDir, 'peers', 'framework-research.crt')}"`);
  // Client does NOT pin rogue-server
});

afterAll(() => {
  [clientSecretsDir, serverDir, rogueServerDir].forEach(d =>
    rmSync(d, { recursive: true, force: true }),
  );
});

// ── Helper: start a minimal TLS server for testing ────────────────────────────

function startTestTlsServer(
  keyDir: string,
  cn: string,
  onConnection?: (socket: TLSSocket) => void,
): Promise<{ port: number; close: () => void }> {
  return new Promise((resolve) => {
    const sockets = new Set<TLSSocket>();
    const server = createServer(
      {
        key:  readFileSync(join(keyDir, 'daemon.key')),
        cert: readFileSync(join(keyDir, 'daemon.crt')),
        requestCert: true,
        rejectUnauthorized: false,
        ca: [],
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
      },
      (socket) => {
        if (onConnection) onConnection(socket as TLSSocket);
      },
    );
    // Track sockets from the TCP connection event (fires before secureConnection in TLS 1.3)
    server.on('connection', (socket) => {
      sockets.add(socket as TLSSocket);
      socket.once('close', () => sockets.delete(socket as TLSSocket));
    });
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as any).port;
      resolve({ port, close: () => {
        for (const s of sockets) s.destroy();
        server.close();
      }});
    });
  });
}

// ── TlsClient — successful connection ────────────────────────────────────────

describe('TlsClient — connect to known peer', () => {

  it('connects successfully to a peer with a pinned cert', async () => {
    const { port, close } = await startTestTlsServer(serverDir, 'framework-research');
    try {
      const config = await loadDaemonCrypto({
        keyPath:  join(clientSecretsDir, 'daemon.key'),
        certPath: join(clientSecretsDir, 'daemon.crt'),
        peersDir: join(clientSecretsDir, 'peers'),
      });

      const client = new TlsClient({
        config,
        peerTeam: 'framework-research',
        host: '127.0.0.1',
        port,
      });

      await expect(client.connect()).resolves.toBeUndefined();
      expect(client.isConnected()).toBe(true);
      await client.disconnect();
    } finally {
      close();
    }
  });

  it('isConnected() returns false before connect()', async () => {
    const config = await loadDaemonCrypto({
      keyPath:  join(clientSecretsDir, 'daemon.key'),
      certPath: join(clientSecretsDir, 'daemon.crt'),
      peersDir: join(clientSecretsDir, 'peers'),
    });
    const client = new TlsClient({
      config,
      peerTeam: 'framework-research',
      host: '127.0.0.1',
      port: 9999, // unused
    });
    expect(client.isConnected()).toBe(false);
  });

  it('isConnected() returns false after disconnect()', async () => {
    const { port, close } = await startTestTlsServer(serverDir, 'framework-research');
    try {
      const config = await loadDaemonCrypto({
        keyPath:  join(clientSecretsDir, 'daemon.key'),
        certPath: join(clientSecretsDir, 'daemon.crt'),
        peersDir: join(clientSecretsDir, 'peers'),
      });
      const client = new TlsClient({
        config,
        peerTeam: 'framework-research',
        host: '127.0.0.1',
        port,
      });
      await client.connect();
      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    } finally {
      close();
    }
  });
});

// ── TlsClient — cert fingerprint verification ─────────────────────────────────

describe('TlsClient — fingerprint verification (server cert mismatch)', () => {

  it('rejects connection to server with unknown cert (not in peers/)', async () => {
    // Rogue server presents cert not pinned by client
    const { port, close } = await startTestTlsServer(rogueServerDir, 'rogue-server');
    try {
      const config = await loadDaemonCrypto({
        keyPath:  join(clientSecretsDir, 'daemon.key'),
        certPath: join(clientSecretsDir, 'daemon.crt'),
        peersDir: join(clientSecretsDir, 'peers'),
      });
      const client = new TlsClient({
        config,
        peerTeam: 'framework-research',  // client expects framework-research
        host: '127.0.0.1',
        port,  // but server is rogue-server
      });
      await expect(client.connect()).rejects.toThrow();
      expect(client.isConnected()).toBe(false);
    } finally {
      close();
    }
  });

  it('rejects connection to server with mismatched team name vs cert CN', async () => {
    // Server presents framework-research cert but client dials it as 'entu-research'
    const { port, close } = await startTestTlsServer(serverDir, 'framework-research');
    try {
      const config = await loadDaemonCrypto({
        keyPath:  join(clientSecretsDir, 'daemon.key'),
        certPath: join(clientSecretsDir, 'daemon.crt'),
        peersDir: join(clientSecretsDir, 'peers'),
      });
      const client = new TlsClient({
        config,
        peerTeam: 'entu-research',  // wrong expected team
        host: '127.0.0.1',
        port,
      });
      await expect(client.connect()).rejects.toThrow();
      expect(client.isConnected()).toBe(false);
    } finally {
      close();
    }
  });
});

// ── TlsClient — message sending ───────────────────────────────────────────────

describe('TlsClient — sending framed messages', () => {

  it('sends a framed message over the tunnel', async () => {
    const received: unknown[] = [];
    const { port, close } = await startTestTlsServer(
      serverDir,
      'framework-research',
      (socket) => {
        let buf = Buffer.alloc(0);
        socket.on('data', (chunk) => {
          buf = Buffer.concat([buf, chunk]);
          if (buf.length >= 4) {
            const len = buf.readUInt32BE(0);
            if (buf.length >= 4 + len) {
              received.push(JSON.parse(buf.slice(4, 4 + len).toString('utf8')));
            }
          }
        });
      },
    );

    try {
      const config = await loadDaemonCrypto({
        keyPath:  join(clientSecretsDir, 'daemon.key'),
        certPath: join(clientSecretsDir, 'daemon.crt'),
        peersDir: join(clientSecretsDir, 'peers'),
      });
      const client = new TlsClient({
        config,
        peerTeam: 'framework-research',
        host: '127.0.0.1',
        port,
      });

      await client.connect();
      const msg = makeMessage('framework-research');
      await client.send(msg);
      await client.disconnect();

      await new Promise(r => setTimeout(r, 100));
      expect(received).toHaveLength(1);
      expect((received[0] as Message).id).toBe(msg.id);
    } finally {
      close();
    }
  });

  it('rejects send() when not connected', async () => {
    const config = await loadDaemonCrypto({
      keyPath:  join(clientSecretsDir, 'daemon.key'),
      certPath: join(clientSecretsDir, 'daemon.crt'),
      peersDir: join(clientSecretsDir, 'peers'),
    });
    const client = new TlsClient({
      config,
      peerTeam: 'framework-research',
      host: '127.0.0.1',
      port: 9999,
    });
    await expect(client.send(makeMessage('framework-research'))).rejects.toThrow(/not connected/i);
  });
});

// ── TlsClient — reconnect with backoff ────────────────────────────────────────

describe('TlsClient — reconnect on connection drop', () => {

  it('emits disconnect event when server closes connection', async () => {
    const { port, close } = await startTestTlsServer(serverDir, 'framework-research');

    const config = await loadDaemonCrypto({
      keyPath:  join(clientSecretsDir, 'daemon.key'),
      certPath: join(clientSecretsDir, 'daemon.crt'),
      peersDir: join(clientSecretsDir, 'peers'),
    });
    const client = new TlsClient({
      config,
      peerTeam: 'framework-research',
      host: '127.0.0.1',
      port,
    });

    let disconnected = false;
    client.onDisconnect(() => { disconnected = true; });

    await client.connect();
    close(); // Kill the server
    await new Promise(r => setTimeout(r, 200));
    expect(disconnected).toBe(true);
    expect(client.isConnected()).toBe(false);
  });

  it('backoff starts at 1s and doubles on each retry (capped at 60s)', () => {
    // Test the backoff calculation directly — no actual network needed
    const config = { key: Buffer.alloc(0), cert: Buffer.alloc(0), peerCerts: new Map(), peerFingerprints: new Map() };
    const client = new TlsClient({
      config: config as any,
      peerTeam: 'framework-research',
      host: '127.0.0.1',
      port: 9999,
    });

    expect(client.backoffDelay(0)).toBe(1000);   // attempt 0: 1s
    expect(client.backoffDelay(1)).toBe(2000);   // attempt 1: 2s
    expect(client.backoffDelay(2)).toBe(4000);   // attempt 2: 4s
    expect(client.backoffDelay(3)).toBe(8000);   // attempt 3: 8s
    expect(client.backoffDelay(4)).toBe(16000);  // attempt 4: 16s
    expect(client.backoffDelay(5)).toBe(32000);  // attempt 5: 32s
    expect(client.backoffDelay(6)).toBe(60000);  // attempt 6: capped at 60s
    expect(client.backoffDelay(10)).toBe(60000); // attempt 10: still 60s
  });
});
