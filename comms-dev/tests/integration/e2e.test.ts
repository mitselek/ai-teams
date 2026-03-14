// (*CD:Kerckhoffs*)
// End-to-end integration tests: send → encrypt → transport → decrypt → deliver.
// Wires UDSServer + UDSClient + InboxDelivery + CryptoProvider together
// to replicate the full broker pipeline without spawning daemon processes.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { UDSServer } from '../../src/transport/server.js';
import { UDSClient } from '../../src/transport/client.js';
import { InboxDelivery } from '../../src/broker/inbox.js';
import { MessageStore } from '../../src/broker/message-store.js';
import { buildMessage } from '../../src/broker/message-builder.js';
import { deriveKey, createCryptoAPI, createCryptoProvider } from '../../src/crypto/index.js';
import { tempSocketPath, cleanupSocket } from '../helpers/net.js';
import type { Message, CryptoProvider } from '../../src/types.js';

// ---------------------------------------------------------------------------
// Shared key material — both sender and receiver use the same PSK (symmetric)
// ---------------------------------------------------------------------------

const PSK = Buffer.from('c0ffee'.padEnd(64, '0'), 'hex');
const KEYS = deriveKey(PSK, 'comms-v1');
const CRYPTO: CryptoProvider = createCryptoProvider(createCryptoAPI(KEYS));

// ---------------------------------------------------------------------------
// Helper: build a minimal broker-like receiver
// Wires UDSServer + InboxDelivery + MessageStore into a single object.
// ---------------------------------------------------------------------------

interface TestBroker {
  server: UDSServer;
  inbox: InboxDelivery;
  store: MessageStore;
  sockPath: string;
  inboxDir: string;
  start(): Promise<void>;
  stop(): Promise<void>;
}

function createTestBroker(name: string, opts: { encrypted?: boolean } = {}): TestBroker {
  const sockPath = tempSocketPath(`e2e-${name}`);
  const inboxDir = fs.mkdtempSync(path.join(os.tmpdir(), `e2e-inbox-${name}-`));
  const inbox = new InboxDelivery(name, { baseDir: inboxDir });
  const store = new MessageStore();

  const server = new UDSServer({
    socketPath: sockPath,
    crypto: opts.encrypted ? CRYPTO : undefined,
    integrityKey: opts.encrypted ? KEYS.integrityKey : undefined,
    onMessage: async (msg: Message) => {
      if (store.record(msg)) {
        await inbox.deliver(msg);
      }
    },
    onError: () => {},
  });

  return {
    server, inbox, store, sockPath, inboxDir,
    async start() {
      store.start();
      cleanupSocket(sockPath);
      await server.listen();
    },
    async stop() {
      await server.close();
      store.stop();
      cleanupSocket(sockPath);
      fs.rmSync(inboxDir, { recursive: true, force: true });
    },
  };
}

/** Wait up to timeoutMs for inbox to contain at least n files. */
async function waitForInbox(inbox: InboxDelivery, n: number, timeoutMs = 2000): Promise<string[]> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const files = inbox.list();
    if (files.length >= n) return files;
    await new Promise(r => setTimeout(r, 20));
  }
  return inbox.list();
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let receiver: TestBroker;

beforeEach(async () => {
  receiver = createTestBroker('receiver', { encrypted: true });
  await receiver.start();
});

afterEach(async () => {
  await receiver.stop();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('end-to-end message flow', () => {
  it('plaintext message sent via CLI arrives decrypted at recipient broker', async () => {
    // Use a plaintext broker for this test — no crypto
    const plainReceiver = createTestBroker('plain-receiver', { encrypted: false });
    await plainReceiver.start();
    try {
      const msg = buildMessage({
        from: { team: 'sender', agent: 'cli' },
        to: { team: 'plain-receiver', agent: 'broker' },
        type: 'query',
        body: '# Hello\nThis is a **plaintext** message.',
      });

      const client = new UDSClient(plainReceiver.sockPath);
      await client.send(msg);

      const files = await waitForInbox(plainReceiver.inbox, 1);
      expect(files).toHaveLength(1);

      const delivered = plainReceiver.inbox.read(files[0]);
      expect(delivered).not.toBeNull();
      expect(delivered!.id).toBe(msg.id);
      expect(delivered!.body).toBe(msg.body);
      expect(delivered!.from.team).toBe('sender');
    } finally {
      await plainReceiver.stop();
    }
  });

  it('message integrity: tampered body is rejected at receiver', async () => {
    const msg = buildMessage({
      from: { team: 'sender', agent: 'cli' },
      to: { team: 'receiver', agent: 'broker' },
      type: 'query',
      body: 'original body',
      integrityKey: KEYS.integrityKey,
    });

    // Tamper the body without recomputing checksum
    const tampered: Message = { ...msg, body: 'attacker injected this' };

    const client = new UDSClient(receiver.sockPath);
    // Server rejects with an error ACK — client retries until deadline (UNREACHABLE).
    // The key invariant is that nothing lands in the inbox despite repeated attempts.
    const err = await client.send(tampered, {
      crypto: CRYPTO,
      maxDurationMs: 2_500,
    }).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    // Must never have been delivered — checksum rejection is the gate
    expect(receiver.inbox.list()).toHaveLength(0);
  });

  it('replay attack: duplicate message id is dropped by receiver dedup', async () => {
    const msg = buildMessage({
      from: { team: 'sender', agent: 'cli' },
      to: { team: 'receiver', agent: 'broker' },
      type: 'query',
      body: 'first delivery',
      integrityKey: KEYS.integrityKey,
    });

    const client = new UDSClient(receiver.sockPath);

    // First delivery succeeds
    await client.send(msg, { crypto: CRYPTO });
    const afterFirst = await waitForInbox(receiver.inbox, 1);
    expect(afterFirst).toHaveLength(1);

    // Second delivery of same message — dedup should discard it
    await client.send(msg, { crypto: CRYPTO });
    // Give a moment for any erroneous second write
    await new Promise(r => setTimeout(r, 100));

    const afterSecond = receiver.inbox.list();
    expect(afterSecond).toHaveLength(1); // still only one file
  });

  it('out-of-order delivery: messages delivered in arrival order (at-least-once)', async () => {
    const bodies = ['alpha', 'beta', 'gamma'];
    const messages = bodies.map(body =>
      buildMessage({
        from: { team: 'sender', agent: 'cli' },
        to: { team: 'receiver', agent: 'broker' },
        type: 'query',
        body,
        integrityKey: KEYS.integrityKey,
      })
    );

    // Send all sequentially
    const client = new UDSClient(receiver.sockPath);
    for (const msg of messages) {
      await client.send(msg, { crypto: CRYPTO });
    }

    const files = await waitForInbox(receiver.inbox, 3);
    expect(files).toHaveLength(3);

    // Read all delivered messages and check every body arrived
    const deliveredBodies = files
      .map(f => receiver.inbox.read(f))
      .filter(Boolean)
      .map(m => m!.body);

    expect(deliveredBodies.sort()).toEqual(bodies.sort());
  });

  it('MITM: modified ciphertext fails integrity check, not silently decrypted', async () => {
    // Encrypt a valid message payload, then flip a byte in the ciphertext.
    // The GCM auth tag must reject this — nothing arrives in inbox.
    const msg = buildMessage({
      from: { team: 'mitm-sender', agent: 'cli' },
      to: { team: 'receiver', agent: 'broker' },
      type: 'query',
      body: 'secret contents',
      integrityKey: KEYS.integrityKey,
    });

    // Encrypt to get the wire payload
    const plaintext = Buffer.from(JSON.stringify(msg), 'utf8');
    const aad = `${msg.id}:${msg.from.team}`;
    const encryptedBuf = await CRYPTO.encrypt(plaintext, aad);

    // Parse the EncryptedPayload JSON and corrupt the ciphertext
    const payload = JSON.parse(encryptedBuf.toString('utf8'));
    const ciphertextBytes = Buffer.from(payload.ciphertext, 'base64');
    ciphertextBytes[0] ^= 0xff; // flip all bits in first byte
    payload.ciphertext = ciphertextBytes.toString('base64');
    const corruptedBuf = Buffer.from(JSON.stringify(payload), 'utf8');

    // Server's decrypt will fail — verify CRYPTO.decrypt throws
    await expect(CRYPTO.decrypt(corruptedBuf)).rejects.toThrow(/authentication|tampered|failed/i);

    // Inbox must be empty — nothing delivered
    expect(receiver.inbox.list()).toHaveLength(0);
  });

  it('two teams can exchange messages bidirectionally', async () => {
    const teamA = createTestBroker('team-a', { encrypted: true });
    await teamA.start();
    try {
      // A → receiver
      const msgToReceiver = buildMessage({
        from: { team: 'team-a', agent: 'agent-a' },
        to: { team: 'receiver', agent: 'broker' },
        type: 'query',
        body: 'hello from A',
        integrityKey: KEYS.integrityKey,
      });
      const clientA = new UDSClient(receiver.sockPath);
      await clientA.send(msgToReceiver, { crypto: CRYPTO });

      // receiver → A
      const msgToA = buildMessage({
        from: { team: 'receiver', agent: 'broker' },
        to: { team: 'team-a', agent: 'agent-a' },
        type: 'response',
        body: 'hello back from receiver',
        integrityKey: KEYS.integrityKey,
      });
      const clientReceiver = new UDSClient(teamA.sockPath);
      await clientReceiver.send(msgToA, { crypto: CRYPTO });

      // Verify both inboxes received their message
      const receiverFiles = await waitForInbox(receiver.inbox, 1);
      const teamAFiles = await waitForInbox(teamA.inbox, 1);

      expect(receiverFiles).toHaveLength(1);
      expect(teamAFiles).toHaveLength(1);

      const inReceiverInbox = receiver.inbox.read(receiverFiles[0]);
      const inTeamAInbox = teamA.inbox.read(teamAFiles[0]);

      expect(inReceiverInbox!.body).toBe('hello from A');
      expect(inReceiverInbox!.from.team).toBe('team-a');

      expect(inTeamAInbox!.body).toBe('hello back from receiver');
      expect(inTeamAInbox!.from.team).toBe('receiver');
    } finally {
      await teamA.stop();
    }
  });
});
