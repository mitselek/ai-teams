// (*CD:Kerckhoffs*)
// RED tests for the from.team === peerCertCN hard invariant.
// Spec: #16 §6 step 6, #15 §5
// Decision: mismatch = close connection, no NACK, no response. Log WARNING.
//
// These tests verify that validateSenderIdentity() correctly enforces the
// invariant and that the error handling matches the agreed behaviour.

import { describe, it, expect } from 'vitest';
import { validateSenderIdentity } from '../../src/crypto/tls-config.js';
import type { Message } from '../../src/types.js';

function makeMessage(overrides: Partial<Message['from']> = {}): Message {
  return {
    version: '1',
    id: 'msg-test-001',
    timestamp: new Date().toISOString(),
    from: { team: 'comms-dev', agent: 'kerckhoffs', ...overrides },
    to:   { team: 'framework-research', agent: 'herald' },
    type: 'query',
    priority: 'normal',
    reply_to: null,
    body: 'test body',
    checksum: 'sha256:abc123',
  };
}

describe('validateSenderIdentity — from.team === peerCertCN invariant', () => {

  // ── ACCEPT cases ──────────────────────────────────────────────────────────

  it('accepts message when from.team exactly matches authenticated team', () => {
    const result = validateSenderIdentity(makeMessage(), 'comms-dev');
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  // ── REJECT: team name mismatch ────────────────────────────────────────────

  it('rejects message when from.team claims a different team than the cert CN', () => {
    const msg = makeMessage({ team: 'framework-research' });
    const result = validateSenderIdentity(msg, 'comms-dev');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
    // Reason must include both claimed and authenticated team names for log forensics
    expect(result.reason).toContain('framework-research');
    expect(result.reason).toContain('comms-dev');
  });

  // ── REJECT: empty / missing from.team ────────────────────────────────────

  it('rejects message with empty from.team', () => {
    const msg = makeMessage({ team: '' });
    const result = validateSenderIdentity(msg, 'comms-dev');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('rejects message with missing from.team (undefined)', () => {
    const msg = makeMessage();
    // Simulate missing field by deleting it
    const rawMsg = msg as any;
    delete rawMsg.from.team;
    const result = validateSenderIdentity(rawMsg, 'comms-dev');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('rejects message with null from.team', () => {
    const msg = makeMessage({ team: null as any });
    const result = validateSenderIdentity(msg, 'comms-dev');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  // ── REJECT: case sensitivity ──────────────────────────────────────────────

  it('rejects message with wrong-case from.team (case-sensitive comparison)', () => {
    const msg = makeMessage({ team: 'Comms-Dev' });
    const result = validateSenderIdentity(msg, 'comms-dev');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('rejects message with all-uppercase from.team', () => {
    const msg = makeMessage({ team: 'COMMS-DEV' });
    const result = validateSenderIdentity(msg, 'comms-dev');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  // ── REJECT: wildcard / injection attempts ─────────────────────────────────

  it('rejects message where from.team is a wildcard', () => {
    const msg = makeMessage({ team: '*' });
    const result = validateSenderIdentity(msg, 'comms-dev');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('rejects message where from.team is wildcard team pattern', () => {
    const msg = makeMessage({ team: '*@comms-dev' });
    const result = validateSenderIdentity(msg, 'comms-dev');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  // ── REJECT: unicode lookalike (homograph attack) ─────────────────────────

  it('rejects unicode lookalike team name (en-dash instead of hyphen)', () => {
    // 'comms‑dev' uses U+2011 NON-BREAKING HYPHEN, not U+002D HYPHEN-MINUS
    const msg = makeMessage({ team: 'comms\u2011dev' });
    const result = validateSenderIdentity(msg, 'comms-dev');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('rejects unicode lookalike team name (em-dash)', () => {
    const msg = makeMessage({ team: 'comms\u2014dev' });
    const result = validateSenderIdentity(msg, 'comms-dev');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  // ── Missing authenticated team (should never happen post-handshake) ───────

  it('rejects when authenticatedTeam is null (cert verification skipped)', () => {
    const result = validateSenderIdentity(makeMessage(), null as any);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('rejects when authenticatedTeam is empty string', () => {
    const result = validateSenderIdentity(makeMessage(), '');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });
});
