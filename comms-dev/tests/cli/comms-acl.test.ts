// (*CD:Kerckhoffs*)
// RED tests for comms-acl CLI tool.
// Spec: #17 §1
//
// comms-acl reads /run/secrets/comms/acl.json (overridable via COMMS_KEYS_DIR).
// It is read-only — never writes. Supports JSON output (default) and human output.
//
// Commands under test (logic layer, not CLI binary):
//   comms-acl list [--agent <name>]
//   comms-acl check --from <agent@team> --to <agent@team>
//   comms-acl show --agent <name>

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  listAcl,
  checkAcl,
  showAgentAcl,
  type ListAclResult,
  type CheckAclResult,
  type ShowAgentAclResult,
} from '../../src/cli/comms-acl.js';
import type { ACLConfig } from '../../src/crypto/acl.js';

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
      allowed_from: ['herald@framework-research'],
    },
  },
  default: 'deny',
};

let aclDir: string;
let aclPath: string;

beforeAll(() => {
  aclDir  = join(tmpdir(), `kerckhoffs-comms-acl-${Date.now()}`);
  mkdirSync(aclDir, { recursive: true });
  aclPath = join(aclDir, 'acl.json');
  writeFileSync(aclPath, JSON.stringify(SAMPLE_ACL));
});

afterAll(() => {
  rmSync(aclDir, { recursive: true, force: true });
});

// ── listAcl — no filter ────────────────────────────────────────────────────────

describe('listAcl — list all agents', () => {

  it('returns all agents from acl.json', async () => {
    const result = await listAcl({ aclPath });
    expect(result.agents).toHaveLength(3);
    const names = result.agents.map(a => a.agent).sort();
    expect(names).toEqual(['babbage', 'kerckhoffs', 'vigenere']);
  });

  it('each agent entry has agent, allowed_to, allowed_from fields', async () => {
    const result = await listAcl({ aclPath });
    for (const entry of result.agents) {
      expect(entry).toMatchObject({
        agent:        expect.any(String),
        allowed_to:   expect.any(Array),
        allowed_from: expect.any(Array),
      });
    }
  });

  it('babbage entry has correct allowed_to list', async () => {
    const result = await listAcl({ aclPath });
    const babbage = result.agents.find(a => a.agent === 'babbage');
    expect(babbage).toBeDefined();
    expect(babbage!.allowed_to).toContain('herald@framework-research');
    expect(babbage!.allowed_to).toContain('*@entu-research');
  });

  it('vigenere entry has empty allowed_to', async () => {
    const result = await listAcl({ aclPath });
    const vigenere = result.agents.find(a => a.agent === 'vigenere');
    expect(vigenere!.allowed_to).toHaveLength(0);
  });

  it('throws with code ACL_NOT_FOUND when acl.json is missing', async () => {
    await expect(listAcl({ aclPath: join(aclDir, 'nonexistent.json') }))
      .rejects.toMatchObject({ code: 'ACL_NOT_FOUND' });
  });

  it('throws with code ACL_INVALID_JSON when acl.json is malformed', async () => {
    const badPath = join(aclDir, 'bad-acl.json');
    writeFileSync(badPath, '{ invalid json }');
    await expect(listAcl({ aclPath: badPath }))
      .rejects.toMatchObject({ code: 'ACL_INVALID_JSON' });
  });
});

// ── listAcl — with --agent filter ────────────────────────────────────────────

describe('listAcl — filtered by agent', () => {

  it('returns only the specified agent when --agent filter is set', async () => {
    const result = await listAcl({ aclPath, agentFilter: 'babbage' });
    expect(result.agents).toHaveLength(1);
    expect(result.agents[0].agent).toBe('babbage');
  });

  it('returns correct allowed_to for filtered agent', async () => {
    const result = await listAcl({ aclPath, agentFilter: 'kerckhoffs' });
    expect(result.agents[0].allowed_to).toEqual(['*@framework-research']);
    expect(result.agents[0].allowed_from).toEqual([]);
  });

  it('throws with code AGENT_NOT_FOUND when specified agent does not exist', async () => {
    await expect(listAcl({ aclPath, agentFilter: 'nonexistent-agent' }))
      .rejects.toMatchObject({ code: 'AGENT_NOT_FOUND', agent: 'nonexistent-agent' });
  });
});

// ── checkAcl ──────────────────────────────────────────────────────────────────

describe('checkAcl — dry-run ACL evaluation', () => {

  it('returns allowed=true for permitted send (exact match)', async () => {
    const result = await checkAcl({
      aclPath,
      from: 'babbage@comms-dev',
      to:   'herald@framework-research',
      localTeam: 'comms-dev',
    });
    expect(result.allowed).toBe(true);
    expect(result.rule).toBeDefined();
    expect(result.rule).toContain('babbage');
  });

  it('returns allowed=true for wildcard match', async () => {
    const result = await checkAcl({
      aclPath,
      from: 'babbage@comms-dev',
      to:   'anyone@entu-research',
      localTeam: 'comms-dev',
    });
    expect(result.allowed).toBe(true);
    expect(result.rule).toContain('*@entu-research');
  });

  it('returns allowed=false when sender not in ACL (default deny)', async () => {
    const result = await checkAcl({
      aclPath,
      from: 'unknown-agent@comms-dev',
      to:   'herald@framework-research',
      localTeam: 'comms-dev',
    });
    expect(result.allowed).toBe(false);
    expect(result.rule).toBeUndefined();
  });

  it('returns allowed=false when target not in allowed_to', async () => {
    const result = await checkAcl({
      aclPath,
      from: 'babbage@comms-dev',
      to:   'lovelace@framework-research',
      localTeam: 'comms-dev',
    });
    expect(result.allowed).toBe(false);
  });

  it('returns allowed=false when vigenere has empty allowed_to', async () => {
    const result = await checkAcl({
      aclPath,
      from: 'vigenere@comms-dev',
      to:   'herald@framework-research',
      localTeam: 'comms-dev',
    });
    expect(result.allowed).toBe(false);
  });

  it('evaluates receive direction when from is external and to is local', async () => {
    // herald@framework-research → babbage@comms-dev: check babbage's allowed_from
    const result = await checkAcl({
      aclPath,
      from: 'herald@framework-research',
      to:   'babbage@comms-dev',
      localTeam: 'comms-dev',
    });
    expect(result.allowed).toBe(true);
    expect(result.rule).toBeDefined();
  });

  it('returns allowed=false when sender not in recipient allowed_from', async () => {
    const result = await checkAcl({
      aclPath,
      from: 'unknown@framework-research',
      to:   'babbage@comms-dev',
      localTeam: 'comms-dev',
    });
    expect(result.allowed).toBe(false);
  });

  it('throws with code INVALID_ADDRESS when from address is malformed', async () => {
    await expect(checkAcl({
      aclPath,
      from: 'not-an-address',
      to:   'herald@framework-research',
      localTeam: 'comms-dev',
    })).rejects.toMatchObject({ code: 'INVALID_ADDRESS' });
  });

  it('throws with code INVALID_ADDRESS when to address is malformed', async () => {
    await expect(checkAcl({
      aclPath,
      from: 'babbage@comms-dev',
      to:   'also-not-an-address',
      localTeam: 'comms-dev',
    })).rejects.toMatchObject({ code: 'INVALID_ADDRESS' });
  });

  it('throws with code ACL_NOT_FOUND when acl.json is missing', async () => {
    await expect(checkAcl({
      aclPath: join(aclDir, 'nonexistent.json'),
      from: 'babbage@comms-dev',
      to:   'herald@framework-research',
      localTeam: 'comms-dev',
    })).rejects.toMatchObject({ code: 'ACL_NOT_FOUND' });
  });

  it('rule string references the specific ACL entry that matched', async () => {
    // Exact match: rule should mention the exact pattern
    const result = await checkAcl({
      aclPath,
      from: 'babbage@comms-dev',
      to:   'herald@framework-research',
      localTeam: 'comms-dev',
    });
    expect(result.rule).toContain('herald@framework-research');
  });
});

// ── showAgentAcl ──────────────────────────────────────────────────────────────

describe('showAgentAcl — show one agent\'s full ACL entry', () => {

  it('returns agent name, allowed_to, and allowed_from', async () => {
    const result = await showAgentAcl({ aclPath, agentName: 'babbage' });
    expect(result.agent).toBe('babbage');
    expect(result.allowed_to).toEqual(['herald@framework-research', '*@entu-research']);
    expect(result.allowed_from).toEqual(['herald@framework-research']);
  });

  it('returns empty arrays for agent with no permissions (vigenere allowed_to)', async () => {
    const result = await showAgentAcl({ aclPath, agentName: 'vigenere' });
    expect(result.allowed_to).toHaveLength(0);
    expect(result.allowed_from).toHaveLength(1);  // has herald@framework-research in allowed_from
  });

  it('throws with code AGENT_NOT_FOUND when agent does not exist', async () => {
    await expect(showAgentAcl({ aclPath, agentName: 'nonexistent' }))
      .rejects.toMatchObject({ code: 'AGENT_NOT_FOUND', agent: 'nonexistent' });
  });

  it('throws with code ACL_NOT_FOUND when acl.json is missing', async () => {
    await expect(showAgentAcl({ aclPath: join(aclDir, 'missing.json'), agentName: 'babbage' }))
      .rejects.toMatchObject({ code: 'ACL_NOT_FOUND' });
  });
});

// ── JSON output shape (spec #17 §1) ──────────────────────────────────────────

describe('output shapes match spec #17', () => {

  it('listAcl output with agentFilter matches spec single-agent JSON shape', async () => {
    // Spec: { "agent": "vigenere", "allowed_to": [...], "allowed_from": [...] }
    const result = await listAcl({ aclPath, agentFilter: 'babbage' });
    expect(result.agents[0]).toMatchObject({
      agent:        'babbage',
      allowed_to:   expect.any(Array),
      allowed_from: expect.any(Array),
    });
  });

  it('checkAcl output matches spec JSON shape (allowed)', async () => {
    // Spec: { "allowed": true, "rule": "babbage.allowed_to[\"herald@framework-research\"]" }
    const result = await checkAcl({
      aclPath,
      from: 'babbage@comms-dev',
      to:   'herald@framework-research',
      localTeam: 'comms-dev',
    });
    expect(result).toMatchObject({
      allowed: true,
      rule:    expect.any(String),
    });
  });

  it('checkAcl output matches spec JSON shape (denied)', async () => {
    // Spec: { "allowed": false } — no rule field when denied
    const result = await checkAcl({
      aclPath,
      from: 'vigenere@comms-dev',
      to:   'herald@framework-research',
      localTeam: 'comms-dev',
    });
    expect(result.allowed).toBe(false);
    // rule should be absent or undefined when denied
    expect(result.rule).toBeUndefined();
  });

  it('checkAcl exits 0 when allowed (contract for CLI exit code)', async () => {
    const result = await checkAcl({
      aclPath,
      from: 'babbage@comms-dev',
      to:   'herald@framework-research',
      localTeam: 'comms-dev',
    });
    // allowed=true → CLI exits 0
    expect(result.allowed).toBe(true);
    expect(result.exitCode).toBe(0);
  });

  it('checkAcl exits 1 when denied (contract for CLI exit code)', async () => {
    const result = await checkAcl({
      aclPath,
      from: 'vigenere@comms-dev',
      to:   'herald@framework-research',
      localTeam: 'comms-dev',
    });
    // allowed=false → CLI exits 1
    expect(result.allowed).toBe(false);
    expect(result.exitCode).toBe(1);
  });
});
