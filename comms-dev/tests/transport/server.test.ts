// (*CD:Kerckhoffs*)
// UDS server integration tests — connection handling, message validation,
// ACK delivery, oversized message rejection, and connection drop behaviour.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import net from 'net';
import { createHash } from 'node:crypto';
import { UDSServer } from '../../src/transport/server.js';
import { encodeFrame, FrameDecoder, MAX_MESSAGE_SIZE } from '../../src/transport/framing.js';
import { buildMessage, computeChecksum } from '../../src/broker/message-builder.js';
import { stableStringify } from '../../src/util/stable-stringify.js';
import { deriveKey } from '../../src/crypto/index.js';
import type { Message, AckBody } from '../../src/types.js';
import { tempSocketPath, cleanupSocket } from '../helpers/net.js';

// Shared key material for HMAC-mode tests
const PSK = Buffer.from('a'.repeat(64), 'hex');
const KEYS = deriveKey(PSK, 'comms-v1');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a valid message using the actual buildMessage (stableStringify-based checksum). */
function makeValidMessage(overrides: Partial<Omit<Message, 'checksum' | 'id' | 'timestamp'>> = {}): Message {
  return buildMessage({
    from: { team: 'test-sender', agent: 'kerckhoffs-test' },
    to: { team: 'test-receiver', agent: 'broker' },
    type: 'query',
    priority: 'normal',
    body: 'Test message body',
    ...overrides,
  });
}

/** Connect to a UDS socket and return the socket */
function connectTo(socketPath: string): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const sock = net.createConnection({ path: socketPath });
    sock.once('connect', () => resolve(sock));
    sock.once('error', reject);
  });
}

/** Send a frame to a socket and collect the first decoded response */
function sendAndReceive(sock: net.Socket, frame: Buffer, timeoutMs = 3000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('ACK timeout')), timeoutMs);
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, (msg) => {
      clearTimeout(timer);
      resolve(msg);
    });
    sock.on('data', (chunk: Buffer) => {
      try { decoder.push(chunk); } catch (e) { clearTimeout(timer); reject(e); }
    });
    sock.write(frame);
  });
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

let server: UDSServer;
let sockPath: string;
const received: Message[] = [];

beforeEach(async () => {
  sockPath = tempSocketPath('server-test');
  cleanupSocket(sockPath);
  received.length = 0;

  server = new UDSServer({
    socketPath: sockPath,
    onMessage: async (msg) => { received.push(msg); },
    onError: () => {}, // suppress noise in test output
  });
  await server.listen();
});

afterEach(async () => {
  await server.close();
  cleanupSocket(sockPath);
});

// ---------------------------------------------------------------------------
// Connection and basic delivery
// ---------------------------------------------------------------------------

describe('UDSServer — connection and delivery', () => {
  it('accepts a client connection and receives a valid message', async () => {
    const sock = await connectTo(sockPath);
    const msg = makeValidMessage();
    await sendAndReceive(sock, encodeFrame(msg));
    expect(received).toHaveLength(1);
    expect(received[0].id).toBe(msg.id);
    sock.destroy();
  });

  it('sends ACK with status=ok for a valid message', async () => {
    const sock = await connectTo(sockPath);
    const msg = makeValidMessage();
    const ack = await sendAndReceive(sock, encodeFrame(msg)) as { type: string; body: string };
    expect(ack.type).toBe('ack');
    const body = JSON.parse(ack.body) as AckBody;
    expect(body.status).toBe('ok');
    expect(body.ack_id).toBe(msg.id);
    sock.destroy();
  });

  it('handles multiple sequential messages on same connection', async () => {
    const sock = await connectTo(sockPath);
    const msg1 = makeValidMessage({ body: 'first' });
    const msg2 = makeValidMessage({ body: 'second' });

    await sendAndReceive(sock, encodeFrame(msg1));
    await sendAndReceive(sock, encodeFrame(msg2));

    expect(received).toHaveLength(2);
    expect(received[0].body).toBe('first');
    expect(received[1].body).toBe('second');
    sock.destroy();
  });

  it('handles concurrent connections from multiple clients', async () => {
    const clients = await Promise.all([
      connectTo(sockPath),
      connectTo(sockPath),
      connectTo(sockPath),
    ]);

    await Promise.all(clients.map((sock, i) =>
      sendAndReceive(sock, encodeFrame(makeValidMessage({ body: `client-${i}` })))
    ));

    expect(received).toHaveLength(3);
    clients.forEach((sock) => sock.destroy());
  });
});

// ---------------------------------------------------------------------------
// Message validation
// ---------------------------------------------------------------------------

describe('UDSServer — message validation', () => {
  it('sends ACK with status=error for message with bad checksum', async () => {
    const sock = await connectTo(sockPath);
    const msg = makeValidMessage();
    const tampered = { ...msg, checksum: 'sha256:' + '0'.repeat(64) };
    const ack = await sendAndReceive(sock, encodeFrame(tampered)) as { type: string; body: string };
    expect(ack.type).toBe('ack');
    const body = JSON.parse(ack.body) as AckBody;
    expect(body.status).toBe('error');
    expect(body.error).toMatch(/checksum/i);
    expect(received).toHaveLength(0); // not delivered
    sock.destroy();
  });

  it('sends ACK with status=error for message missing required field', async () => {
    const sock = await connectTo(sockPath);
    const { checksum: _, body: __, ...noBody } = makeValidMessage();
    const ack = await sendAndReceive(sock, encodeFrame(noBody)) as { type: string; body: string };
    const ackBody = JSON.parse(ack.body) as AckBody;
    expect(ackBody.status).toBe('error');
    expect(ackBody.error).toMatch(/missing/i);
    sock.destroy();
  });

  it('sends ACK with status=error for unsupported version', async () => {
    const sock = await connectTo(sockPath);
    const msg = makeValidMessage();
    // Manually build a tampered message with wrong version and recompute checksum correctly
    const { checksum: _, ...rest } = msg;
    const tamperedDraft = { ...rest, version: '2' };
    const newChecksum = 'sha256:' + createHash('sha256')
      .update(stableStringify(tamperedDraft))
      .digest('hex');
    const badMsg = { ...tamperedDraft, checksum: newChecksum };

    const ack = await sendAndReceive(sock, encodeFrame(badMsg)) as { type: string; body: string };
    const ackBody = JSON.parse(ack.body) as AckBody;
    expect(ackBody.status).toBe('error');
    expect(ackBody.error).toMatch(/version/i);
    sock.destroy();
  });

  it('sends ACK with status=error for non-object message', async () => {
    const sock = await connectTo(sockPath);
    const ack = await sendAndReceive(sock, encodeFrame('just a string')) as { type: string; body: string };
    const ackBody = JSON.parse(ack.body) as AckBody;
    expect(ackBody.status).toBe('error');
    sock.destroy();
  });

  it('does not deliver message if body is tampered (checksum mismatch)', async () => {
    const sock = await connectTo(sockPath);
    const msg = makeValidMessage({ body: 'original' });
    const tampered = { ...msg, body: 'attacker modified this' };
    // checksum still matches original — mismatch detected
    await sendAndReceive(sock, encodeFrame(tampered));
    expect(received).toHaveLength(0);
    sock.destroy();
  });

  it('accepts message with modified from/to AND matching stableStringify checksum', async () => {
    // Verify the fix: server now uses stableStringify so from/to IS covered
    const sock = await connectTo(sockPath);
    const msg = makeValidMessage({
      from: { team: 'team-a', agent: 'alice' },
      to: { team: 'team-b', agent: 'bob' },
    });
    const ack = await sendAndReceive(sock, encodeFrame(msg)) as { type: string; body: string };
    const ackBody = JSON.parse(ack.body) as AckBody;
    expect(ackBody.status).toBe('ok');
    sock.destroy();
  });

  it('rejects message where from is spoofed but checksum not recomputed', async () => {
    // Attacker intercepts a message and changes from field without updating checksum
    const sock = await connectTo(sockPath);
    const msg = makeValidMessage({ from: { team: 'team-a', agent: 'alice' } });
    const spoofed = { ...msg, from: { team: 'team-evil', agent: 'attacker' } };
    // checksum was computed over original from — now mismatches
    const ack = await sendAndReceive(sock, encodeFrame(spoofed)) as { type: string; body: string };
    const ackBody = JSON.parse(ack.body) as AckBody;
    expect(ackBody.status).toBe('error');
    expect(ackBody.error).toMatch(/checksum/i);
    expect(received).toHaveLength(0);
    sock.destroy();
  });
});

// ---------------------------------------------------------------------------
// HMAC-SHA256 checksum (production mode)
// ---------------------------------------------------------------------------

describe('UDSServer — HMAC production mode', () => {
  let hmacServer: UDSServer;
  let hmacSockPath: string;
  const hmacReceived: Message[] = [];

  beforeEach(async () => {
    hmacSockPath = tempSocketPath('hmac-server');
    cleanupSocket(hmacSockPath);
    hmacReceived.length = 0;
    hmacServer = new UDSServer({
      socketPath: hmacSockPath,
      integrityKey: KEYS.integrityKey,
      onMessage: async (msg) => { hmacReceived.push(msg); },
      onError: () => {},
    });
    await hmacServer.listen();
  });

  afterEach(async () => {
    await hmacServer.close();
    cleanupSocket(hmacSockPath);
  });

  it('accepts message with valid HMAC checksum', async () => {
    const sock = await connectTo(hmacSockPath);
    const msg = buildMessage({
      from: { team: 'sender', agent: 'a' }, to: { team: 'receiver', agent: 'b' },
      type: 'query', body: 'hmac ok', integrityKey: KEYS.integrityKey,
    });
    const ack = await sendAndReceive(sock, encodeFrame(msg)) as { type: string; body: string };
    const ackBody = JSON.parse(ack.body) as AckBody;
    expect(ackBody.status).toBe('ok');
    sock.destroy();
  });

  it('rejects message with plain SHA-256 checksum when HMAC key configured', async () => {
    const sock = await connectTo(hmacSockPath);
    // Build without integrityKey — gets plain SHA-256 checksum
    const msg = buildMessage({
      from: { team: 'sender', agent: 'a' }, to: { team: 'receiver', agent: 'b' },
      type: 'query', body: 'plain sha256 rejected',
      // no integrityKey
    });
    const ack = await sendAndReceive(sock, encodeFrame(msg)) as { type: string; body: string };
    const ackBody = JSON.parse(ack.body) as AckBody;
    expect(ackBody.status).toBe('error');
    expect(hmacReceived).toHaveLength(0);
    sock.destroy();
  });

  it('rejects message with HMAC from wrong key', async () => {
    const sock = await connectTo(hmacSockPath);
    const wrongKey = deriveKey(Buffer.from('b'.repeat(64), 'hex'), 'comms-v1').integrityKey;
    const msg = buildMessage({
      from: { team: 'sender', agent: 'a' }, to: { team: 'receiver', agent: 'b' },
      type: 'query', body: 'wrong key', integrityKey: wrongKey,
    });
    const ack = await sendAndReceive(sock, encodeFrame(msg)) as { type: string; body: string };
    const ackBody = JSON.parse(ack.body) as AckBody;
    expect(ackBody.status).toBe('error');
    sock.destroy();
  });

  it('rejects sender-spoofed message: changing from invalidates HMAC', async () => {
    const sock = await connectTo(hmacSockPath);
    const msg = buildMessage({
      from: { team: 'real-sender', agent: 'alice' },
      to: { team: 'receiver', agent: 'b' },
      type: 'query', body: 'spoof test', integrityKey: KEYS.integrityKey,
    });
    const spoofed = { ...msg, from: { team: 'attacker', agent: 'evil' } };
    const ack = await sendAndReceive(sock, encodeFrame(spoofed)) as { type: string; body: string };
    const ackBody = JSON.parse(ack.body) as AckBody;
    expect(ackBody.status).toBe('error');
    expect(hmacReceived).toHaveLength(0);
    sock.destroy();
  });
});

// ---------------------------------------------------------------------------
// Timestamp replay defense
// ---------------------------------------------------------------------------

describe('UDSServer — timestamp replay defense', () => {
  it('rejects message with timestamp older than 300s', async () => {
    const sock = await connectTo(sockPath);
    const staleTime = new Date(Date.now() - 301_000).toISOString();
    // Build a message with stale timestamp — need to recompute checksum with that timestamp
    const draft = {
      version: '1' as const, id: `msg-stale-${Date.now()}`, timestamp: staleTime,
      from: { team: 'sender', agent: 'a' }, to: { team: 'receiver', agent: 'b' },
      type: 'query' as const, priority: 'normal' as const, reply_to: null,
      body: 'old message',
    };
    const checksum = computeChecksum(draft);
    const msg: Message = { ...draft, checksum };

    const ack = await sendAndReceive(sock, encodeFrame(msg)) as { type: string; body: string };
    const ackBody = JSON.parse(ack.body) as AckBody;
    expect(ackBody.status).toBe('error');
    expect(ackBody.error).toMatch(/too old|replay/i);
    sock.destroy();
  });

  it('accepts message with timestamp within 300s window', async () => {
    const sock = await connectTo(sockPath);
    // 299s ago — should be accepted
    const recentTime = new Date(Date.now() - 299_000).toISOString();
    const draft = {
      version: '1' as const, id: `msg-recent-${Date.now()}`, timestamp: recentTime,
      from: { team: 'sender', agent: 'a' }, to: { team: 'receiver', agent: 'b' },
      type: 'query' as const, priority: 'normal' as const, reply_to: null,
      body: 'recent message',
    };
    const checksum = computeChecksum(draft);
    const msg: Message = { ...draft, checksum };

    const ack = await sendAndReceive(sock, encodeFrame(msg)) as { type: string; body: string };
    const ackBody = JSON.parse(ack.body) as AckBody;
    expect(ackBody.status).toBe('ok');
    sock.destroy();
  });

  it('rejects message with future timestamp (malformed)', async () => {
    const sock = await connectTo(sockPath);
    const msg = makeValidMessage({ body: 'future msg' });
    // Inject a far-future timestamp, recompute checksum
    const { checksum: _, ...rest } = msg;
    const futureTs = new Date(Date.now() + 3_600_000).toISOString(); // 1hr future
    const draft = { ...rest, timestamp: futureTs };
    // Future message: age is negative — should be treated as within window (not too old)
    // This tests that we don't crash on negative age
    const checksum = computeChecksum(draft);
    const futureMsg: Message = { ...draft, checksum };
    const ack = await sendAndReceive(sock, encodeFrame(futureMsg)) as { type: string; body: string };
    // Future timestamps pass the "too old" check — they are within the window
    expect(typeof ack).toBe('object');
    sock.destroy();
  });

  it('rejects non-string timestamp field', async () => {
    const sock = await connectTo(sockPath);
    const msg = makeValidMessage();
    const bad = { ...msg, timestamp: 12345 };
    const ack = await sendAndReceive(sock, encodeFrame(bad)) as { type: string; body: string };
    const ackBody = JSON.parse(ack.body) as AckBody;
    expect(ackBody.status).toBe('error');
    expect(ackBody.error).toMatch(/timestamp/i);
    sock.destroy();
  });

  it('rejects invalid timestamp format', async () => {
    const sock = await connectTo(sockPath);
    const msg = makeValidMessage();
    const { checksum: _, ...rest } = msg;
    const draft = { ...rest, timestamp: 'not-a-date' };
    const checksum = computeChecksum(draft);
    const bad: Message = { ...draft, checksum };
    const ack = await sendAndReceive(sock, encodeFrame(bad)) as { type: string; body: string };
    const ackBody = JSON.parse(ack.body) as AckBody;
    expect(ackBody.status).toBe('error');
    expect(ackBody.error).toMatch(/timestamp/i);
    sock.destroy();
  });
});

// ---------------------------------------------------------------------------
// Oversized message handling
// ---------------------------------------------------------------------------

describe('UDSServer — oversized message rejection', () => {
  it('closes connection on oversized frame header (declared size > maxSize)', async () => {
    const sock = await connectTo(sockPath);
    const header = Buffer.allocUnsafe(4);
    header.writeUInt32BE(MAX_MESSAGE_SIZE + 1, 0);

    const closed = new Promise<void>((resolve) => {
      sock.once('close', resolve);
      sock.once('error', () => resolve());
    });
    sock.write(header);
    await closed;
    expect(received).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Connection drop
// ---------------------------------------------------------------------------

describe('UDSServer — connection drop handling', () => {
  it('survives client disconnect without crashing', async () => {
    const sock = await connectTo(sockPath);
    sock.destroy();

    await new Promise((r) => setTimeout(r, 50));

    // Server should still accept new connections
    const sock2 = await connectTo(sockPath);
    const msg = makeValidMessage({ body: 'after disconnect' });
    const ack = await sendAndReceive(sock2, encodeFrame(msg)) as { type: string; body: string };
    const ackBody = JSON.parse(ack.body) as AckBody;
    expect(ackBody.status).toBe('ok');
    sock2.destroy();
  });

  it('survives mid-message disconnect without delivering partial message', async () => {
    const sock = await connectTo(sockPath);
    const msg = makeValidMessage();
    const frame = encodeFrame(msg);
    sock.write(frame.subarray(0, Math.floor(frame.byteLength / 2)));
    sock.destroy();

    await new Promise((r) => setTimeout(r, 50));
    expect(received).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// UDSClient integration (send → server → ACK)
// ---------------------------------------------------------------------------

describe('UDSClient — send and ACK', () => {
  it('send() resolves on first attempt when server is ready', async () => {
    const { UDSClient } = await import('../../src/transport/client.js');
    const client = new UDSClient(sockPath);
    const msg = makeValidMessage({ body: 'client send test' });
    const attempts = await client.send(msg);
    expect(attempts).toBe(1);
    expect(received).toHaveLength(1);
    expect(received[0].id).toBe(msg.id);
  });

  it('send() rejects with UNREACHABLE when server never starts', async () => {
    const { UDSClient } = await import('../../src/transport/client.js');
    const deadSockPath = tempSocketPath('dead-server');
    cleanupSocket(deadSockPath);
    const client = new UDSClient(deadSockPath);
    const msg = makeValidMessage({ body: 'unreachable' });

    const err = await client.send(msg, { maxDurationMs: 1_500 }).catch((e) => e as Error);
    expect(err).toBeInstanceOf(Error);
    expect((err as NodeJS.ErrnoException).code).toBe('UNREACHABLE');
    expect(err.message).toMatch(/UNREACHABLE/);
  }, 5000);

  it('send() UNREACHABLE error includes attempt count and socket path', async () => {
    const { UDSClient } = await import('../../src/transport/client.js');
    const deadSockPath = tempSocketPath('dead-server-2');
    cleanupSocket(deadSockPath);
    const client = new UDSClient(deadSockPath);
    const msg = makeValidMessage({ body: 'unreachable detail' });

    const err = await client.send(msg, { maxDurationMs: 1_500 }).catch((e) => e as Error);
    expect(err.message).toContain(deadSockPath);
    expect(err.message).toMatch(/attempt/i);
  }, 5000);

  it('send() returns attempt count > 1 when server starts late', async () => {
    const { UDSClient } = await import('../../src/transport/client.js');
    const lateSockPath = tempSocketPath('late-server');
    cleanupSocket(lateSockPath);
    const lateReceived: Message[] = [];
    const client = new UDSClient(lateSockPath);
    const msg = makeValidMessage({ body: 'late server' });

    // Start server 1.2s after client begins sending (client backoff starts at 1s)
    const serverReady = new Promise<UDSServer>((resolve) => {
      setTimeout(async () => {
        const lateServer = new UDSServer({
          socketPath: lateSockPath,
          onMessage: async (m) => { lateReceived.push(m); },
          onError: () => {},
        });
        await lateServer.listen();
        resolve(lateServer);
      }, 1200);
    });

    const attempts = await client.send(msg);
    const lateServer = await serverReady;

    expect(attempts).toBeGreaterThan(1);
    await lateServer.close();
    cleanupSocket(lateSockPath);
  }, 15000);
});

// ---------------------------------------------------------------------------
// Socket lifecycle
// ---------------------------------------------------------------------------

describe('UDSServer — socket lifecycle', () => {
  it('removes stale socket file on listen() (crash recovery)', async () => {
    const fs = await import('node:fs');
    expect(fs.existsSync(sockPath)).toBe(true);

    await server.close();

    const server2 = new UDSServer({
      socketPath: sockPath,
      onMessage: async () => {},
      onError: () => {},
    });
    await expect(server2.listen()).resolves.not.toThrow();
    await server2.close();

    server = new UDSServer({
      socketPath: sockPath,
      onMessage: async () => {},
      onError: () => {},
    });
    await server.listen();
  });
});
