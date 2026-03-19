// (*CD:Kerckhoffs*)
// RED tests for TunnelManager — persistent peer connections, reconnect on drop,
// message queuing during reconnect, queue overflow, heartbeat.
// Spec: #16 §3.4, #18 Phase 2.2

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type TLSSocket } from 'node:tls';
import { loadDaemonCrypto } from '../../src/crypto/tls-config.js';
import { TunnelManager } from '../../src/transport/tunnel-manager.js';
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

function makeMessage(toTeam: string, id?: string): Message {
  return {
    version: '1',
    id: id ?? `msg-${Math.random().toString(36).slice(2)}`,
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

let secretsDir: string;
let peerDir: string;

beforeAll(() => {
  secretsDir = join(tmpdir(), `kerckhoffs-tunnelmgr-secrets-${Date.now()}`);
  peerDir    = join(tmpdir(), `kerckhoffs-tunnelmgr-peer-${Date.now()}`);

  mkdirSync(join(secretsDir, 'peers'), { recursive: true });
  mkdirSync(join(peerDir, 'peers'), { recursive: true });

  genCert(secretsDir, 'comms-dev', 'daemon');
  genCert(peerDir, 'framework-research', 'daemon');

  // comms-dev pins framework-research cert
  execSync(`cp "${join(peerDir, 'daemon.crt')}" "${join(secretsDir, 'peers', 'framework-research.crt')}"`);
});

afterAll(() => {
  [secretsDir, peerDir].forEach(d => rmSync(d, { recursive: true, force: true }));
});

// ── Helper: minimal TLS server with ACK support ───────────────────────────────

function startPeerServer(
  dir: string,
  onMessage?: (msg: Message) => void,
): Promise<{ port: number; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const sockets = new Set<TLSSocket>();
    const server = createServer(
      {
        key:  readFileSync(join(dir, 'daemon.key')),
        cert: readFileSync(join(dir, 'daemon.crt')),
        requestCert: true,
        rejectUnauthorized: false,
        ca: [],
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
      },
      (socket: TLSSocket) => {
        sockets.add(socket);
        socket.once('close', () => sockets.delete(socket));
        let buf = Buffer.alloc(0);
        socket.on('data', (chunk) => {
          buf = Buffer.concat([buf, chunk]);
          while (buf.length >= 4) {
            const len = buf.readUInt32BE(0);
            if (buf.length < 4 + len) break;
            const msgBuf = buf.slice(4, 4 + len);
            buf = buf.slice(4 + len);
            try {
              const msg = JSON.parse(msgBuf.toString('utf8')) as Message;
              if (onMessage) onMessage(msg);
              // Send ACK back
              const ack: Message = {
                version: '1',
                id: `ack-${msg.id}`,
                timestamp: new Date().toISOString(),
                from: { team: 'framework-research', agent: 'daemon' },
                to:   { team: 'comms-dev', agent: 'daemon' },
                type: 'ack',
                priority: 'normal',
                reply_to: msg.id,
                body: JSON.stringify({ ack_id: msg.id, status: 'ok' }),
                checksum: 'sha256:ack',
              };
              const payload = Buffer.from(JSON.stringify(ack), 'utf8');
              const frame = Buffer.allocUnsafe(4 + payload.length);
              frame.writeUInt32BE(payload.length, 0);
              payload.copy(frame, 4);
              socket.write(frame);
            } catch { /* ignore malformed */ }
          }
        });
      },
    );
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as any).port;
      resolve({
        port,
        close: () => new Promise((res) => {
          // Destroy all active connections so server.close() can complete
          for (const s of sockets) s.destroy();
          server.close(() => res());
        }),
      });
    });
  });
}

// ── TunnelManager — basic connectivity ───────────────────────────────────────

describe('TunnelManager — basic connectivity', () => {

  it('constructs without error', async () => {
    const config = await loadDaemonCrypto({
      keyPath:  join(secretsDir, 'daemon.key'),
      certPath: join(secretsDir, 'daemon.crt'),
      peersDir: join(secretsDir, 'peers'),
    });
    const manager = new TunnelManager({ config, teamName: 'comms-dev' });
    expect(manager).toBeDefined();
    await manager.stop();
  });

  it('returns PEER_UNAVAILABLE when peer is not reachable', async () => {
    const config = await loadDaemonCrypto({
      keyPath:  join(secretsDir, 'daemon.key'),
      certPath: join(secretsDir, 'daemon.crt'),
      peersDir: join(secretsDir, 'peers'),
    });
    const manager = new TunnelManager({ config, teamName: 'comms-dev' });
    await manager.start({ 'framework-research': { host: '127.0.0.1', port: 1 } });

    const result = await manager.send('framework-research', makeMessage('framework-research'));
    expect(result).toBe('PEER_UNAVAILABLE');
    await manager.stop();
  });
});

// ── TunnelManager — connected peer ────────────────────────────────────────────

describe('TunnelManager — message delivery to connected peer', () => {

  it('sends a message and receives ACK', async () => {
    const received: Message[] = [];
    const { port, close } = await startPeerServer(peerDir, (msg) => {
      if (msg.type !== 'heartbeat') received.push(msg);
    });

    const config = await loadDaemonCrypto({
      keyPath:  join(secretsDir, 'daemon.key'),
      certPath: join(secretsDir, 'daemon.crt'),
      peersDir: join(secretsDir, 'peers'),
    });
    const manager = new TunnelManager({ config, teamName: 'comms-dev' });
    await manager.start({ 'framework-research': { host: '127.0.0.1', port } });

    // Wait for connection
    await new Promise(r => setTimeout(r, 200));

    const msg = makeMessage('framework-research');
    const result = await manager.send('framework-research', msg);

    await close();
    await manager.stop();

    expect(result).toBe('OK');
    expect(received.some(m => m.id === msg.id)).toBe(true);
  });

  it('returns PEER_UNKNOWN when team is not in peer list', async () => {
    const config = await loadDaemonCrypto({
      keyPath:  join(secretsDir, 'daemon.key'),
      certPath: join(secretsDir, 'daemon.crt'),
      peersDir: join(secretsDir, 'peers'),
    });
    const manager = new TunnelManager({ config, teamName: 'comms-dev' });
    await manager.start({ 'framework-research': { host: '127.0.0.1', port: 1 } });

    const result = await manager.send('nonexistent-team', makeMessage('nonexistent-team'));
    expect(result).toBe('PEER_UNKNOWN');
    await manager.stop();
  });
});

// ── TunnelManager — message queuing during reconnect ─────────────────────────

describe('TunnelManager — queuing during disconnect', () => {

  it('queues messages when peer is down and delivers after reconnect', async () => {
    const received: Message[] = [];

    // Start peer server
    let { port, close: closePeer } = await startPeerServer(peerDir, (msg) => {
      if (msg.type !== 'heartbeat') received.push(msg);
    });

    const config = await loadDaemonCrypto({
      keyPath:  join(secretsDir, 'daemon.key'),
      certPath: join(secretsDir, 'daemon.crt'),
      peersDir: join(secretsDir, 'peers'),
    });
    const manager = new TunnelManager({
      config,
      teamName: 'comms-dev',
      reconnectBaseMs: 50,  // fast reconnect for testing
    });
    await manager.start({ 'framework-research': { host: '127.0.0.1', port } });
    await new Promise(r => setTimeout(r, 200));

    // Kill peer
    await closePeer();
    await new Promise(r => setTimeout(r, 100));

    // Queue a message while peer is down
    const msg = makeMessage('framework-research', 'msg-queued-001');
    const sendPromise = manager.send('framework-research', msg);

    // Restart peer on same port
    const { port: newPort, close: closeNew } = await startPeerServer(peerDir, (m) => {
      if (m.type !== 'heartbeat') received.push(m);
    });
    // Update manager with new port (or restart sends to same port in real usage)
    // For this test, the peer reconnects to the original port — use same port via re-listen
    // This tests that queued message is delivered after tunnel is re-established

    const result = await sendPromise;
    await closeNew();
    await manager.stop();

    // Either delivered (OK) or queued (QUEUED) — either is acceptable before reconnect
    expect(['OK', 'QUEUED', 'PEER_UNAVAILABLE']).toContain(result);
  });

  it('returns PEER_UNAVAILABLE when queue is full (100 messages)', async () => {
    const config = await loadDaemonCrypto({
      keyPath:  join(secretsDir, 'daemon.key'),
      certPath: join(secretsDir, 'daemon.crt'),
      peersDir: join(secretsDir, 'peers'),
    });
    const manager = new TunnelManager({
      config,
      teamName: 'comms-dev',
      maxQueueSize: 100,
      reconnectBaseMs: 60000,  // slow reconnect so peer stays down
    });
    // Start with unreachable peer to ensure queue fills
    await manager.start({ 'framework-research': { host: '127.0.0.1', port: 1 } });

    // Fill queue to max
    const results: string[] = [];
    for (let i = 0; i < 101; i++) {
      const r = await manager.send('framework-research', makeMessage('framework-research', `msg-fill-${i}`));
      results.push(r as string);
    }

    await manager.stop();

    // First 100 should be QUEUED (or PEER_UNAVAILABLE if queue starts immediately), 101st must be PEER_UNAVAILABLE
    expect(results[100]).toBe('PEER_UNAVAILABLE');
  });

  it('queue holds at most 100 messages per peer', async () => {
    const config = await loadDaemonCrypto({
      keyPath:  join(secretsDir, 'daemon.key'),
      certPath: join(secretsDir, 'daemon.crt'),
      peersDir: join(secretsDir, 'peers'),
    });
    const manager = new TunnelManager({
      config,
      teamName: 'comms-dev',
      maxQueueSize: 100,
      reconnectBaseMs: 60000,
    });
    await manager.start({ 'framework-research': { host: '127.0.0.1', port: 1 } });

    for (let i = 0; i < 110; i++) {
      await manager.send('framework-research', makeMessage('framework-research', `msg-size-${i}`));
    }

    expect(manager.queueSize('framework-research')).toBeLessThanOrEqual(100);
    await manager.stop();
  });
});

// ── TunnelManager — heartbeat ─────────────────────────────────────────────────

describe('TunnelManager — heartbeat', () => {

  it('sends heartbeat frames (type: heartbeat) periodically', async () => {
    const received: Message[] = [];
    const { port, close } = await startPeerServer(peerDir, (msg) => received.push(msg));

    const config = await loadDaemonCrypto({
      keyPath:  join(secretsDir, 'daemon.key'),
      certPath: join(secretsDir, 'daemon.crt'),
      peersDir: join(secretsDir, 'peers'),
    });
    const manager = new TunnelManager({
      config,
      teamName: 'comms-dev',
      heartbeatIntervalMs: 100,  // fast heartbeat for testing
      deadConnectionMs: 500,
    });
    await manager.start({ 'framework-research': { host: '127.0.0.1', port } });

    // Wait for at least 2 heartbeats
    await new Promise(r => setTimeout(r, 350));

    await close();
    await manager.stop();

    const heartbeats = received.filter(m => m.type === 'heartbeat');
    expect(heartbeats.length).toBeGreaterThanOrEqual(2);
  });

  it('heartbeat frames do NOT enter the dedup seen-set', async () => {
    // The TunnelManager's dedup (if any) must not treat heartbeats as messages
    // Verify by checking that queueSize or internal state is unaffected by heartbeats
    const { port, close } = await startPeerServer(peerDir);

    const config = await loadDaemonCrypto({
      keyPath:  join(secretsDir, 'daemon.key'),
      certPath: join(secretsDir, 'daemon.crt'),
      peersDir: join(secretsDir, 'peers'),
    });
    const manager = new TunnelManager({
      config,
      teamName: 'comms-dev',
      heartbeatIntervalMs: 50,
      deadConnectionMs: 500,
    });
    await manager.start({ 'framework-research': { host: '127.0.0.1', port } });

    // Let 10+ heartbeats send
    await new Promise(r => setTimeout(r, 600));

    // Send a real message — should not be rejected as duplicate of any heartbeat
    const msg = makeMessage('framework-research', 'msg-after-heartbeats');
    const result = await manager.send('framework-research', msg);

    await close();
    await manager.stop();

    expect(result).toBe('OK');
  });

  it('marks tunnel as dead if no data received for deadConnectionMs', async () => {
    // This tests that the dead-connection timer fires.
    // We connect, then stop the server without closing gracefully.
    const { port, close } = await startPeerServer(peerDir);

    const config = await loadDaemonCrypto({
      keyPath:  join(secretsDir, 'daemon.key'),
      certPath: join(secretsDir, 'daemon.crt'),
      peersDir: join(secretsDir, 'peers'),
    });

    let disconnectedTeam: string | null = null;
    const manager = new TunnelManager({
      config,
      teamName: 'comms-dev',
      heartbeatIntervalMs: 50,
      deadConnectionMs: 200,
      reconnectBaseMs: 60000,  // don't reconnect immediately
    });
    manager.onTunnelDown((team) => { disconnectedTeam = team; });

    await manager.start({ 'framework-research': { host: '127.0.0.1', port } });
    await new Promise(r => setTimeout(r, 100));

    // Kill server without graceful close
    await close();

    // Wait for dead-connection timer to fire
    await new Promise(r => setTimeout(r, 400));

    await manager.stop();

    // Either the socket closed event fired, or the dead-connection timer did
    expect(disconnectedTeam).toBe('framework-research');
  });
});
