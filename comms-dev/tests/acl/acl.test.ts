// (*CD:Kerckhoffs*)
// RED tests for ACL evaluation — allow/deny, wildcards, default-deny, hot-reload.
// Spec: #15 §4, #16 §4

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  loadAcl,
  isAllowed,
  matchesPattern,
  createAclManager,
  type ACLConfig,
} from '../../src/crypto/acl.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SAMPLE_ACL: ACLConfig = {
  version: 1,
  agents: {
    babbage: {
      allowed_to:   ['herald@framework-research', '*@entu-research'],
      allowed_from: ['herald@framework-research'],
    },
    kerckhoffs: {
      allowed_to:   ['*@framework-research'],
      allowed_from: [],
    },
    vigenere: {
      allowed_to:   [],
      allowed_from: [],
    },
  },
  default: 'deny',
};

// ── matchesPattern — unit ─────────────────────────────────────────────────────

describe('matchesPattern', () => {

  it('matches exact address', () => {
    expect(matchesPattern('herald@framework-research', 'herald@framework-research')).toBe(true);
  });

  it('does not match different agent, same team', () => {
    expect(matchesPattern('other@framework-research', 'herald@framework-research')).toBe(false);
  });

  it('does not match same agent, different team', () => {
    expect(matchesPattern('herald@entu-research', 'herald@framework-research')).toBe(false);
  });

  it('matches wildcard team pattern (*@team) against any agent on that team', () => {
    expect(matchesPattern('herald@framework-research', '*@framework-research')).toBe(true);
    expect(matchesPattern('lovelace@framework-research', '*@framework-research')).toBe(true);
  });

  it('does not match wildcard pattern against different team', () => {
    expect(matchesPattern('herald@entu-research', '*@framework-research')).toBe(false);
  });

  it('does not match full wildcard *@* (not supported in v1)', () => {
    expect(matchesPattern('herald@framework-research', '*@*')).toBe(false);
    expect(matchesPattern('anyone@anyteam', '*@*')).toBe(false);
  });

  it('does not match bare * wildcard', () => {
    expect(matchesPattern('herald@framework-research', '*')).toBe(false);
  });

  it('does not match address without @ against wildcard pattern', () => {
    expect(matchesPattern('herald', '*@framework-research')).toBe(false);
  });

  it('exact match takes precedence — exact pattern matches correctly', () => {
    expect(matchesPattern('herald@framework-research', 'herald@framework-research')).toBe(true);
  });
});

// ── isAllowed — unit ──────────────────────────────────────────────────────────

describe('isAllowed — send direction', () => {

  it('allows send when remote address is in allowed_to (exact)', () => {
    expect(isAllowed(SAMPLE_ACL, 'send', 'babbage', 'herald@framework-research')).toBe(true);
  });

  it('allows send when remote address matches wildcard in allowed_to', () => {
    expect(isAllowed(SAMPLE_ACL, 'send', 'babbage', 'anyone@entu-research')).toBe(true);
  });

  it('denies send when remote address not in allowed_to', () => {
    // babbage has *@entu-research in allowed_to, but other-team is not listed
    expect(isAllowed(SAMPLE_ACL, 'send', 'babbage', 'herald@other-team')).toBe(false);
  });

  it('allows send via wildcard for kerckhoffs to any agent on framework-research', () => {
    expect(isAllowed(SAMPLE_ACL, 'send', 'kerckhoffs', 'herald@framework-research')).toBe(true);
    expect(isAllowed(SAMPLE_ACL, 'send', 'kerckhoffs', 'lovelace@framework-research')).toBe(true);
  });

  it('denies send when agent has empty allowed_to', () => {
    expect(isAllowed(SAMPLE_ACL, 'send', 'vigenere', 'herald@framework-research')).toBe(false);
  });

  it('denies send when agent is not in ACL (default deny)', () => {
    expect(isAllowed(SAMPLE_ACL, 'send', 'nonexistent-agent', 'herald@framework-research')).toBe(false);
  });
});

describe('isAllowed — receive direction', () => {

  it('allows receive when sender is in allowed_from (exact)', () => {
    expect(isAllowed(SAMPLE_ACL, 'receive', 'babbage', 'herald@framework-research')).toBe(true);
  });

  it('denies receive when sender not in allowed_from', () => {
    expect(isAllowed(SAMPLE_ACL, 'receive', 'babbage', 'lovelace@framework-research')).toBe(false);
  });

  it('denies receive when recipient has empty allowed_from', () => {
    expect(isAllowed(SAMPLE_ACL, 'receive', 'kerckhoffs', 'herald@framework-research')).toBe(false);
  });

  it('denies receive when agent is not in ACL (default deny)', () => {
    expect(isAllowed(SAMPLE_ACL, 'receive', 'nonexistent-agent', 'herald@framework-research')).toBe(false);
  });
});

describe('isAllowed — one-directional ACL', () => {

  it('A→B allowed does not imply B→A allowed', () => {
    // babbage can send to herald@framework-research
    expect(isAllowed(SAMPLE_ACL, 'send', 'babbage', 'herald@framework-research')).toBe(true);
    // but herald cannot necessarily send to babbage — that's controlled by herald's team ACL
    // (separate daemon; we test local agent: kerckhoffs has no allowed_from for framework-research)
    expect(isAllowed(SAMPLE_ACL, 'receive', 'kerckhoffs', 'herald@framework-research')).toBe(false);
  });
});

describe('isAllowed — *@* wildcard rejection', () => {

  it('treats *@* in allowed_to as no-match (not a blanket allow)', () => {
    const aclWithFullWildcard: ACLConfig = {
      version: 1,
      agents: {
        testAgent: {
          allowed_to:   ['*@*'],
          allowed_from: ['*@*'],
        },
      },
      default: 'deny',
    };
    // *@* should NOT match — returns false
    expect(isAllowed(aclWithFullWildcard, 'send', 'testAgent', 'herald@framework-research')).toBe(false);
    expect(isAllowed(aclWithFullWildcard, 'receive', 'testAgent', 'herald@framework-research')).toBe(false);
  });
});

// ── loadAcl — parsing and validation ─────────────────────────────────────────

let aclDir: string;

beforeAll(() => {
  aclDir = join(tmpdir(), `kerckhoffs-acl-test-${Date.now()}`);
  mkdirSync(aclDir, { recursive: true });
});

afterAll(() => {
  rmSync(aclDir, { recursive: true, force: true });
});

describe('loadAcl — parsing', () => {

  it('loads a valid ACL JSON file', () => {
    const path = join(aclDir, 'valid-acl.json');
    writeFileSync(path, JSON.stringify(SAMPLE_ACL));
    const acl = loadAcl(path);
    expect(acl.default).toBe('deny');
    expect(Object.keys(acl.agents)).toHaveLength(3);
  });

  it('throws on malformed JSON', () => {
    const path = join(aclDir, 'bad-acl.json');
    writeFileSync(path, '{ this is not json }');
    expect(() => loadAcl(path)).toThrow();
  });

  it('throws on missing agents field', () => {
    const path = join(aclDir, 'no-agents.json');
    writeFileSync(path, JSON.stringify({ version: 1, default: 'deny' }));
    expect(() => loadAcl(path)).toThrow();
  });

  it('throws on missing file', () => {
    expect(() => loadAcl(join(aclDir, 'nonexistent.json'))).toThrow();
  });
});

// ── createAclManager — SIGHUP hot-reload ──────────────────────────────────────

describe('createAclManager — hot-reload via SIGHUP', () => {

  it('initially loads the ACL and evaluates correctly', () => {
    const path = join(aclDir, 'hot-reload.json');
    writeFileSync(path, JSON.stringify(SAMPLE_ACL));
    const manager = createAclManager(path);
    expect(manager.isAllowed('send', 'babbage', 'herald@framework-research')).toBe(true);
  });

  it('reloads ACL when reload() is called with updated file', () => {
    const path = join(aclDir, 'hot-reload-update.json');
    writeFileSync(path, JSON.stringify(SAMPLE_ACL));
    const manager = createAclManager(path);

    // Initially babbage can send to herald@framework-research
    expect(manager.isAllowed('send', 'babbage', 'herald@framework-research')).toBe(true);

    // Update ACL — remove babbage's allowed_to
    const updatedAcl: ACLConfig = {
      ...SAMPLE_ACL,
      agents: {
        ...SAMPLE_ACL.agents,
        babbage: { allowed_to: [], allowed_from: [] },
      },
    };
    writeFileSync(path, JSON.stringify(updatedAcl));
    manager.reload();

    // Now babbage cannot send
    expect(manager.isAllowed('send', 'babbage', 'herald@framework-research')).toBe(false);
  });

  it('keeps old ACL when reload() is called with malformed file', () => {
    const path = join(aclDir, 'hot-reload-bad.json');
    writeFileSync(path, JSON.stringify(SAMPLE_ACL));
    const manager = createAclManager(path);

    // Initially allowed
    expect(manager.isAllowed('send', 'babbage', 'herald@framework-research')).toBe(true);

    // Write malformed JSON
    writeFileSync(path, '{ bad json');
    // reload() should not throw — just log and keep old ACL
    expect(() => manager.reload()).not.toThrow();

    // Still using old ACL
    expect(manager.isAllowed('send', 'babbage', 'herald@framework-research')).toBe(true);
  });

  it('adds newly allowed agent after reload', () => {
    const path = join(aclDir, 'hot-reload-add.json');
    writeFileSync(path, JSON.stringify(SAMPLE_ACL));
    const manager = createAclManager(path);

    // new-agent doesn't exist initially
    expect(manager.isAllowed('send', 'new-agent', 'herald@framework-research')).toBe(false);

    const expanded: ACLConfig = {
      ...SAMPLE_ACL,
      agents: {
        ...SAMPLE_ACL.agents,
        'new-agent': {
          allowed_to:   ['herald@framework-research'],
          allowed_from: [],
        },
      },
    };
    writeFileSync(path, JSON.stringify(expanded));
    manager.reload();

    expect(manager.isAllowed('send', 'new-agent', 'herald@framework-research')).toBe(true);
  });

  it('removes previously allowed agent after reload', () => {
    const path = join(aclDir, 'hot-reload-remove.json');
    writeFileSync(path, JSON.stringify(SAMPLE_ACL));
    const manager = createAclManager(path);

    expect(manager.isAllowed('send', 'babbage', 'herald@framework-research')).toBe(true);

    const { babbage: _removed, ...remainingAgents } = SAMPLE_ACL.agents;
    const reduced: ACLConfig = { ...SAMPLE_ACL, agents: remainingAgents };
    writeFileSync(path, JSON.stringify(reduced));
    manager.reload();

    expect(manager.isAllowed('send', 'babbage', 'herald@framework-research')).toBe(false);
  });
});
