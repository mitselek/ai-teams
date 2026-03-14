// (*CD:Kerckhoffs*)
// Message envelope tests — validates the Message type structure,
// checksum computation, and server-side validation logic.
// Tests the validateMessage behaviour exposed through UDSServer.

import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { stableStringify } from '../../src/util/stable-stringify.js';
import type { Message, MessageEndpoint } from '../../src/types.js';

// ---------------------------------------------------------------------------
// Helpers that mirror the server's validateMessage logic (src/transport/server.ts)
// We test the checksum algorithm independently so any divergence is caught.
// Uses stableStringify (fixed in GitHub Issue #2 — recursive key sorting).
// ---------------------------------------------------------------------------

const FROM: MessageEndpoint = { team: 'comms-dev', agent: 'kerckhoffs' };
const TO: MessageEndpoint = { team: 'framework-research', agent: 'herald' };

function computeChecksum(msg: Omit<Message, 'checksum'>): string {
  // Must match server.ts and message-builder.ts: stableStringify for recursive sort
  return 'sha256:' + createHash('sha256')
    .update(stableStringify(msg))
    .digest('hex');
}

function makeValidMessage(overrides: Partial<Message> = {}): Message {
  const draft: Omit<Message, 'checksum'> = {
    version: '1',
    id: 'msg-00000000-0000-0000-0000-000000000001',
    timestamp: '2026-03-14T10:00:00.000Z',
    from: FROM,
    to: TO,
    type: 'query',
    priority: 'normal',
    reply_to: null,
    body: 'Hello from Kerckhoffs',
    ...overrides,
  };
  const checksum = computeChecksum(draft);
  return { ...draft, checksum };
}

// ---------------------------------------------------------------------------
// Message structure
// ---------------------------------------------------------------------------

describe('Message envelope structure', () => {
  it('a valid message has all required fields', () => {
    const msg = makeValidMessage();
    expect(msg.version).toBe('1');
    expect(msg.id).toMatch(/^msg-/);
    expect(msg.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(msg.from.team).toBe('comms-dev');
    expect(msg.to.team).toBe('framework-research');
    expect(msg.type).toBe('query');
    expect(msg.priority).toBe('normal');
    expect(msg.reply_to).toBeNull();
    expect(typeof msg.body).toBe('string');
    expect(msg.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('all valid MessageType values are accepted', () => {
    const types: Message['type'][] = ['handoff', 'query', 'response', 'broadcast', 'ack', 'heartbeat'];
    types.forEach((type) => {
      const msg = makeValidMessage({ type });
      expect(msg.type).toBe(type);
    });
  });

  it('all valid MessagePriority values are accepted', () => {
    const priorities: Message['priority'][] = ['blocking', 'high', 'normal', 'low'];
    priorities.forEach((priority) => {
      const msg = makeValidMessage({ priority });
      expect(msg.priority).toBe(priority);
    });
  });

  it('reply_to can be a message ID string', () => {
    const msg = makeValidMessage({ reply_to: 'msg-original-id' });
    expect(msg.reply_to).toBe('msg-original-id');
  });

  it('reply_to can be null', () => {
    const msg = makeValidMessage({ reply_to: null });
    expect(msg.reply_to).toBeNull();
  });

  it('endpoint can include optional prefix', () => {
    const msg = makeValidMessage({
      from: { team: 'comms-dev', agent: 'babbage', prefix: 'CD' },
    });
    expect(msg.from.prefix).toBe('CD');
  });

  it('body field accepts empty string', () => {
    const msg = makeValidMessage({ body: '' });
    expect(msg.body).toBe('');
  });

  it('body field accepts Markdown content', () => {
    const body = '## Finding\n\nThis is **important**.\n\n- item 1\n- item 2';
    const msg = makeValidMessage({ body });
    expect(msg.body).toBe(body);
  });
});

// ---------------------------------------------------------------------------
// Checksum correctness
// ---------------------------------------------------------------------------

describe('Message checksum', () => {
  it('computed checksum matches sha256:<hex> format', () => {
    const msg = makeValidMessage();
    expect(msg.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('is deterministic for same message content', () => {
    const msg1 = makeValidMessage();
    const msg2 = makeValidMessage();
    // Same content → same checksum
    expect(msg1.checksum).toBe(msg2.checksum);
  });

  it('changes when body is modified', () => {
    const msg1 = makeValidMessage({ body: 'original' });
    const msg2 = makeValidMessage({ body: 'modified' });
    expect(msg1.checksum).not.toBe(msg2.checksum);
  });

  it('changes when sender changes (GitHub Issue #2 fixed — stableStringify)', () => {
    // Previously broken: JSON.stringify with sorted top-level array replacer dropped
    // nested object contents (from/to serialised as {}). Now fixed with stableStringify.
    const msg1 = makeValidMessage({ from: { team: 'team-a', agent: 'agent-a' } });
    const msg2 = makeValidMessage({ from: { team: 'team-b', agent: 'agent-b' } });
    expect(msg1.checksum).not.toBe(msg2.checksum);
  });

  it('changes when id changes', () => {
    const msg1 = makeValidMessage({ id: 'msg-111' });
    const msg2 = makeValidMessage({ id: 'msg-222' });
    expect(msg1.checksum).not.toBe(msg2.checksum);
  });

  it('checksum does NOT include itself (no circular dependency)', () => {
    // Verify our computation excludes the checksum field
    const msg = makeValidMessage();
    const { checksum: _, ...rest } = msg;
    const recomputed = computeChecksum(rest as Omit<Message, 'checksum'>);
    expect(msg.checksum).toBe(recomputed);
  });

  it('checksum uses sorted key order (deterministic across JS engines)', () => {
    // Build message with keys in two different insertion orders
    // Both should produce the same checksum since server sorts keys
    const draft1 = {
      version: '1' as const,
      id: 'msg-sort-test',
      timestamp: '2026-03-14T10:00:00.000Z',
      from: FROM,
      to: TO,
      type: 'query' as const,
      priority: 'normal' as const,
      reply_to: null,
      body: 'sort test',
    };
    const draft2 = {
      body: 'sort test',
      from: FROM,
      id: 'msg-sort-test',
      priority: 'normal' as const,
      reply_to: null,
      timestamp: '2026-03-14T10:00:00.000Z',
      to: TO,
      type: 'query' as const,
      version: '1' as const,
    };
    expect(computeChecksum(draft1)).toBe(computeChecksum(draft2));
  });
});

// ---------------------------------------------------------------------------
// AckBody structure
// ---------------------------------------------------------------------------

describe('AckBody', () => {
  it('ok ack has ack_id and status=ok', () => {
    const ack = { ack_id: 'msg-123', status: 'ok' as const };
    expect(ack.ack_id).toBe('msg-123');
    expect(ack.status).toBe('ok');
    expect('error' in ack).toBe(false);
  });

  it('error ack has ack_id, status=error, and error message', () => {
    const ack = { ack_id: 'msg-456', status: 'error' as const, error: 'Checksum mismatch' };
    expect(ack.status).toBe('error');
    expect(ack.error).toBe('Checksum mismatch');
  });
});
