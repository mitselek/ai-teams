// (*CD:Kerckhoffs*)
// Broker component tests — message builder, message store (dedup), inbox delivery.
// Tests individual broker modules that don't require a running daemon.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { buildMessage, computeChecksum } from '../../src/broker/message-builder.js';
import { MessageStore } from '../../src/broker/message-store.js';
import { InboxDelivery } from '../../src/broker/inbox.js';
import { stableStringify } from '../../src/util/stable-stringify.js';
import { deriveKey } from '../../src/crypto/index.js';
import type { MessageEndpoint } from '../../src/types.js';

// Shared HMAC integrity key for production-mode tests
const PSK = Buffer.from('a'.repeat(64), 'hex');
const INTEGRITY_KEY = deriveKey(PSK, 'comms-v1').integrityKey;

// ---------------------------------------------------------------------------
// Shared endpoints
// ---------------------------------------------------------------------------

const FROM: MessageEndpoint = { team: 'comms-dev', agent: 'kerckhoffs' };
const TO: MessageEndpoint = { team: 'framework-research', agent: 'herald' };

// ---------------------------------------------------------------------------
// buildMessage / computeChecksum
// ---------------------------------------------------------------------------

describe('buildMessage', () => {
  it('builds a message with all required fields', () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'hello' });
    expect(msg.version).toBe('1');
    expect(msg.id).toMatch(/^msg-/);
    expect(msg.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(msg.from).toEqual(FROM);
    expect(msg.to).toEqual(TO);
    expect(msg.type).toBe('query');
    expect(msg.priority).toBe('normal'); // default
    expect(msg.reply_to).toBeNull();
    expect(msg.body).toBe('hello');
    expect(msg.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('uses provided priority', () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'handoff', priority: 'blocking', body: 'urgent' });
    expect(msg.priority).toBe('blocking');
  });

  it('uses provided reply_to', () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'response', body: 'ok', reply_to: 'msg-original' });
    expect(msg.reply_to).toBe('msg-original');
  });

  it('each call produces a unique message ID', () => {
    const ids = new Set(Array.from({ length: 20 }, () =>
      buildMessage({ from: FROM, to: TO, type: 'query', body: 'x' }).id
    ));
    expect(ids.size).toBe(20);
  });
});

describe('computeChecksum', () => {
  it('returns sha256:<hex> format', () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'test' });
    const { checksum: _, ...draft } = msg;
    expect(computeChecksum(draft)).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('is deterministic for same draft', () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'test' });
    const { checksum: _, ...draft } = msg;
    expect(computeChecksum(draft)).toBe(computeChecksum(draft));
  });

  it('changes when body changes', () => {
    const msg1 = buildMessage({ from: FROM, to: TO, type: 'query', body: 'aaa' });
    const msg2 = buildMessage({ from: FROM, to: TO, type: 'query', body: 'bbb' });
    const { checksum: _1, id: _id1, timestamp: _ts1, ...draft1 } = msg1;
    const { checksum: _2, id: _id2, timestamp: _ts2, ...draft2 } = msg2;
    expect(computeChecksum({ ...draft1, id: 'same', timestamp: 'same' }))
      .not.toBe(computeChecksum({ ...draft2, id: 'same', timestamp: 'same' }));
  });

  it('checksum changes when from field changes (fix for GitHub Issue #2)', () => {
    // Previously broken: JSON.stringify with sorted top-level keys dropped nested
    // object contents. Now fixed: stableStringify recursively sorts all levels.
    const d1 = { version: '1' as const, id: 'fixed', timestamp: 'fixed',
      from: { team: 'team-a', agent: 'x' }, to: TO,
      type: 'query' as const, priority: 'normal' as const, reply_to: null, body: 'hi' };
    const d2 = { ...d1, from: { team: 'team-b', agent: 'y' } };
    expect(computeChecksum(d1)).not.toBe(computeChecksum(d2));
  });

  it('checksum changes when to field changes', () => {
    const d1 = { version: '1' as const, id: 'fixed', timestamp: 'fixed',
      from: FROM, to: { team: 'team-x', agent: 'agent-x' },
      type: 'query' as const, priority: 'normal' as const, reply_to: null, body: 'hi' };
    const d2 = { ...d1, to: { team: 'team-z', agent: 'agent-z' } };
    expect(computeChecksum(d1)).not.toBe(computeChecksum(d2));
  });

  it('buildMessage checksum is verified by server validateMessage logic (stableStringify)', async () => {
    // Both buildMessage and server now use stableStringify — they should agree.
    const { createHash } = await import('node:crypto');
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'integration check' });
    const { checksum, ...rest } = msg;
    const serverComputed = 'sha256:' + createHash('sha256')
      .update(stableStringify(rest))
      .digest('hex');
    expect(checksum).toBe(serverComputed);
  });
});

// ---------------------------------------------------------------------------
// HMAC-SHA256 checksum (production mode)
// ---------------------------------------------------------------------------

describe('computeChecksum — HMAC mode (integrityKey provided)', () => {
  it('returns HMAC-SHA256 format (sha256:<hex>) when integrityKey provided', () => {
    const draft = { version: '1' as const, id: 'msg-x', timestamp: 'ts',
      from: FROM, to: TO, type: 'query' as const, priority: 'normal' as const,
      reply_to: null, body: 'hmac test' };
    const checksum = computeChecksum(draft, INTEGRITY_KEY);
    expect(checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('HMAC checksum differs from plain SHA-256 checksum for same draft', () => {
    const draft = { version: '1' as const, id: 'msg-y', timestamp: 'ts',
      from: FROM, to: TO, type: 'query' as const, priority: 'normal' as const,
      reply_to: null, body: 'mode diff' };
    const hmac = computeChecksum(draft, INTEGRITY_KEY);
    const plain = computeChecksum(draft);
    expect(hmac).not.toBe(plain);
  });

  it('HMAC checksum is deterministic for same key + draft', () => {
    const draft = { version: '1' as const, id: 'msg-z', timestamp: 'ts',
      from: FROM, to: TO, type: 'query' as const, priority: 'normal' as const,
      reply_to: null, body: 'deterministic' };
    expect(computeChecksum(draft, INTEGRITY_KEY)).toBe(computeChecksum(draft, INTEGRITY_KEY));
  });

  it('HMAC checksum changes when from field changes', () => {
    const base = { version: '1' as const, id: 'fixed', timestamp: 'ts',
      to: TO, type: 'query' as const, priority: 'normal' as const,
      reply_to: null, body: 'from test' };
    const d1 = { ...base, from: { team: 'team-a', agent: 'x' } };
    const d2 = { ...base, from: { team: 'team-b', agent: 'y' } };
    expect(computeChecksum(d1, INTEGRITY_KEY)).not.toBe(computeChecksum(d2, INTEGRITY_KEY));
  });

  it('different integrityKey produces different HMAC', () => {
    const draft = { version: '1' as const, id: 'msg-k', timestamp: 'ts',
      from: FROM, to: TO, type: 'query' as const, priority: 'normal' as const,
      reply_to: null, body: 'key diff' };
    const key2 = deriveKey(Buffer.from('b'.repeat(64), 'hex'), 'comms-v1').integrityKey;
    expect(computeChecksum(draft, INTEGRITY_KEY)).not.toBe(computeChecksum(draft, key2));
  });

  it('buildMessage with integrityKey produces HMAC checksum', () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'prod msg', integrityKey: INTEGRITY_KEY });
    expect(msg.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
    // Recompute and compare
    const { checksum, ...draft } = msg;
    expect(computeChecksum(draft, INTEGRITY_KEY)).toBe(checksum);
  });
});

// ---------------------------------------------------------------------------
// MessageStore — deduplication
// ---------------------------------------------------------------------------

describe('MessageStore — deduplication', () => {
  let store: MessageStore;

  beforeEach(() => {
    store = new MessageStore(5 * 60 * 1000);
    store.start();
  });

  afterEach(() => {
    store.stop();
  });

  it('record() returns true for a new message', () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'new' });
    expect(store.record(msg)).toBe(true);
  });

  it('record() returns false for a duplicate message ID', () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'dup' });
    store.record(msg);
    expect(store.record(msg)).toBe(false);
  });

  it('record() returns false even if message body changes but ID is the same', () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'original' });
    store.record(msg);
    // Simulate a tampered retry with same ID
    const tampered = { ...msg, body: 'modified' };
    expect(store.record(tampered)).toBe(false);
  });

  it('has() returns true after recording', () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'test' });
    store.record(msg);
    expect(store.has(msg.id)).toBe(true);
  });

  it('has() returns false before recording', () => {
    expect(store.has('msg-nonexistent')).toBe(false);
  });

  it('get() returns the stored message', () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'get-test' });
    store.record(msg);
    expect(store.get(msg.id)).toEqual(msg);
  });

  it('get() returns undefined for unknown ID', () => {
    expect(store.get('msg-unknown')).toBeUndefined();
  });

  it('size() increments only for new messages', () => {
    const msg1 = buildMessage({ from: FROM, to: TO, type: 'query', body: '1' });
    const msg2 = buildMessage({ from: FROM, to: TO, type: 'query', body: '2' });
    store.record(msg1);
    store.record(msg1); // duplicate
    store.record(msg2);
    expect(store.size()).toBe(2);
  });

  it('10 unique messages are all recorded and deduplicated correctly', () => {
    const msgs = Array.from({ length: 10 }, (_, i) =>
      buildMessage({ from: FROM, to: TO, type: 'query', body: `msg-${i}` })
    );
    msgs.forEach((m) => expect(store.record(m)).toBe(true));
    msgs.forEach((m) => expect(store.record(m)).toBe(false)); // all dupes now
    expect(store.size()).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// InboxDelivery
// ---------------------------------------------------------------------------

describe('InboxDelivery', () => {
  let tmpDir: string;
  let inbox: InboxDelivery;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'comms-inbox-test-'));
    inbox = new InboxDelivery('test-team', { baseDir: tmpDir });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates inbox directory if it does not exist', () => {
    expect(fs.existsSync(inbox.inboxPath)).toBe(false);
    inbox.list(); // triggers ensureInboxDir
    expect(fs.existsSync(inbox.inboxPath)).toBe(true);
  });

  it('delivers a message as a JSON file named by message ID', async () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'deliver me' });
    const filePath = await inbox.deliver(msg);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(path.basename(filePath)).toBe(`${msg.id}.json`);
  });

  it('delivered file contains valid JSON matching the original message', async () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'json content' });
    const filePath = await inbox.deliver(msg);
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed).toEqual(msg);
  });

  it('atomic write: no .tmp file remains after delivery', async () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'atomic' });
    const filePath = await inbox.deliver(msg);
    expect(fs.existsSync(filePath + '.tmp')).toBe(false);
  });

  it('list() returns paths of all delivered messages', async () => {
    const msgs = Array.from({ length: 3 }, (_, i) =>
      buildMessage({ from: FROM, to: TO, type: 'query', body: `msg-${i}` })
    );
    await Promise.all(msgs.map((m) => inbox.deliver(m)));
    const files = inbox.list();
    expect(files).toHaveLength(3);
    files.forEach((f) => expect(f.endsWith('.json')).toBe(true));
  });

  it('list() returns empty array when inbox is empty', () => {
    expect(inbox.list()).toEqual([]);
  });

  it('read() parses a delivered message file correctly', async () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'read me' });
    const filePath = await inbox.deliver(msg);
    const parsed = inbox.read(filePath);
    expect(parsed).toEqual(msg);
  });

  it('read() returns null for a nonexistent file', () => {
    expect(inbox.read('/nonexistent/path/msg-fake.json')).toBeNull();
  });

  it('read() returns null for a malformed JSON file', () => {
    const badPath = path.join(inbox.inboxPath, 'bad.json');
    fs.mkdirSync(inbox.inboxPath, { recursive: true });
    fs.writeFileSync(badPath, 'not json', 'utf8');
    expect(inbox.read(badPath)).toBeNull();
  });

  it('consume() removes the message file', async () => {
    const msg = buildMessage({ from: FROM, to: TO, type: 'query', body: 'consume me' });
    const filePath = await inbox.deliver(msg);
    inbox.consume(filePath);
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('consume() does not throw when file already removed', () => {
    expect(() => inbox.consume('/nonexistent/msg-ghost.json')).not.toThrow();
  });

  it('list() excludes .tmp files', async () => {
    fs.mkdirSync(inbox.inboxPath, { recursive: true });
    fs.writeFileSync(path.join(inbox.inboxPath, 'msg-123.json.tmp'), '{}', 'utf8');
    expect(inbox.list()).toHaveLength(0);
  });

  it('multiple deliveries and consume loop clears all messages', async () => {
    const msgs = Array.from({ length: 5 }, (_, i) =>
      buildMessage({ from: FROM, to: TO, type: 'query', body: `item-${i}` })
    );
    await Promise.all(msgs.map((m) => inbox.deliver(m)));
    const files = inbox.list();
    files.forEach((f) => inbox.consume(f));
    expect(inbox.list()).toHaveLength(0);
  });
});
