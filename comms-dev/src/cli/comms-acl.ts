// (*CD:Lovelace*)
// comms-acl — ACL inspection CLI for the cross-team relay daemon.
// Spec: #17 §1
//
// Commands:
//   comms-acl list [--agent <name>] [--format json|human]
//   comms-acl check --from <agent@team> --to <agent@team>
//   comms-acl show --agent <name>
//
// Read-only — never writes. ACL is pre-provisioned.
//
// Environment:
//   COMMS_KEYS_DIR   — default /run/secrets/comms
//   COMMS_TEAM_NAME  — required for check command (determines local side)

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { matchesPattern } from '../crypto/acl.js';
import type { ACLConfig, AgentACL } from '../crypto/acl.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentAclEntry {
  agent: string;
  allowed_to: string[];
  allowed_from: string[];
}

export interface ListAclResult {
  agents: AgentAclEntry[];
}

export interface CheckAclResult {
  allowed: boolean;
  rule?: string;
  exitCode: 0 | 1;
}

export interface ShowAgentAclResult {
  agent: string;
  allowed_to: string[];
  allowed_from: string[];
}

// ── ACL file loading with coded errors ───────────────────────────────────────

function loadAclFile(aclPath: string): ACLConfig {
  if (!existsSync(aclPath)) {
    const e = new Error(`ACL file not found: ${aclPath}`);
    (e as NodeJS.ErrnoException).code = 'ACL_NOT_FOUND';
    throw e;
  }

  let raw: string;
  try {
    raw = readFileSync(aclPath, 'utf-8');
  } catch (err) {
    const e = new Error(`Cannot read ACL file: ${(err as Error).message}`);
    (e as NodeJS.ErrnoException).code = 'ACL_NOT_FOUND';
    throw e;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const e = new Error(`ACL file invalid JSON: ${(err as Error).message}`);
    (e as NodeJS.ErrnoException).code = 'ACL_INVALID_JSON';
    throw e;
  }

  const config = parsed as ACLConfig;
  if (!config.agents || typeof config.agents !== 'object') {
    const e = new Error('ACL file missing required "agents" field');
    (e as NodeJS.ErrnoException).code = 'ACL_INVALID_JSON';
    throw e;
  }

  return config;
}

function parseAddress(addr: string): { agent: string; team: string } | null {
  const match = addr.match(/^([a-zA-Z0-9_-]+)@([a-zA-Z0-9_-]+)$/);
  if (!match) return null;
  return { agent: match[1], team: match[2] };
}

// ── listAcl ───────────────────────────────────────────────────────────────────

export async function listAcl(opts: {
  aclPath: string;
  agentFilter?: string;
}): Promise<ListAclResult> {
  const { aclPath, agentFilter } = opts;
  const config = loadAclFile(aclPath);

  if (agentFilter !== undefined) {
    const agentAcl: AgentACL | undefined = config.agents[agentFilter];
    if (!agentAcl) {
      const e = new Error(`Agent not found in ACL: ${agentFilter}`);
      (e as NodeJS.ErrnoException & { agent: string }).code = 'AGENT_NOT_FOUND';
      (e as NodeJS.ErrnoException & { agent: string }).agent = agentFilter;
      throw e;
    }
    return {
      agents: [{
        agent: agentFilter,
        allowed_to: agentAcl.allowed_to,
        allowed_from: agentAcl.allowed_from,
      }],
    };
  }

  const agents: AgentAclEntry[] = Object.entries(config.agents).map(([name, acl]) => ({
    agent: name,
    allowed_to: acl.allowed_to,
    allowed_from: acl.allowed_from,
  }));

  return { agents };
}

// ── checkAcl ──────────────────────────────────────────────────────────────────

export async function checkAcl(opts: {
  aclPath: string;
  from: string;
  to: string;
  localTeam: string;
}): Promise<CheckAclResult> {
  const { aclPath, from, to, localTeam } = opts;

  // Validate address format
  const fromParsed = parseAddress(from);
  if (!fromParsed) {
    const e = new Error(`Invalid address format: ${from}`);
    (e as NodeJS.ErrnoException).code = 'INVALID_ADDRESS';
    throw e;
  }
  const toParsed = parseAddress(to);
  if (!toParsed) {
    const e = new Error(`Invalid address format: ${to}`);
    (e as NodeJS.ErrnoException).code = 'INVALID_ADDRESS';
    throw e;
  }

  const config = loadAclFile(aclPath);

  // Determine direction: if from.team === localTeam → send check (check sender's allowed_to)
  // if to.team === localTeam → receive check (check recipient's allowed_from)
  const isSend = fromParsed.team === localTeam;

  if (isSend) {
    const localAgent = fromParsed.agent;
    const remoteAddress = to;
    const agentAcl = config.agents[localAgent];
    if (!agentAcl) {
      return { allowed: false, exitCode: 1 };
    }
    const matchingPattern = agentAcl.allowed_to.find(p => matchesPattern(remoteAddress, p));
    if (matchingPattern) {
      return {
        allowed: true,
        rule: `${localAgent}.allowed_to["${matchingPattern}"]`,
        exitCode: 0,
      };
    }
    return { allowed: false, exitCode: 1 };
  } else {
    // receive direction: check recipient's allowed_from
    const localAgent = toParsed.agent;
    const remoteAddress = from;
    const agentAcl = config.agents[localAgent];
    if (!agentAcl) {
      return { allowed: false, exitCode: 1 };
    }
    const matchingPattern = agentAcl.allowed_from.find(p => matchesPattern(remoteAddress, p));
    if (matchingPattern) {
      return {
        allowed: true,
        rule: `${localAgent}.allowed_from["${matchingPattern}"]`,
        exitCode: 0,
      };
    }
    return { allowed: false, exitCode: 1 };
  }
}

// ── showAgentAcl ──────────────────────────────────────────────────────────────

export async function showAgentAcl(opts: {
  aclPath: string;
  agentName: string;
}): Promise<ShowAgentAclResult> {
  const { aclPath, agentName } = opts;
  const config = loadAclFile(aclPath);
  const agentAcl = config.agents[agentName];

  if (!agentAcl) {
    const e = Object.assign(new Error(`Agent not found in ACL: ${agentName}`), {
      code: 'AGENT_NOT_FOUND',
      agent: agentName,
    });
    throw e;
  }

  return {
    agent: agentName,
    allowed_to: agentAcl.allowed_to,
    allowed_from: agentAcl.allowed_from,
  };
}

// ── CLI entry point ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const keysDir = process.env['COMMS_KEYS_DIR'] ?? '/run/secrets/comms';
  const aclPath = join(keysDir, 'acl.json');
  const localTeam = process.env['COMMS_TEAM_NAME'] ?? '';

  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) fatal('Command required: list, check, show');

  if (command === 'list') {
    const { values } = parseArgs({
      args: args.slice(1),
      options: {
        agent: { type: 'string' },
        format: { type: 'string', default: 'json' },
      },
    });
    const result = await listAcl({ aclPath, agentFilter: values.agent });
    if (values.format === 'human') {
      for (const entry of result.agents) {
        console.log(`${entry.agent}:`);
        console.log(`  allowed_to:   ${entry.allowed_to.join(', ') || '(none)'}`);
        console.log(`  allowed_from: ${entry.allowed_from.join(', ') || '(none)'}`);
      }
    } else {
      const out = result.agents.length === 1 ? result.agents[0] : result;
      console.log(JSON.stringify(out, null, 2));
    }
    return;
  }

  if (command === 'check') {
    const { values } = parseArgs({
      args: args.slice(1),
      options: {
        from: { type: 'string' },
        to: { type: 'string' },
        format: { type: 'string', default: 'json' },
      },
    });
    if (!values.from) fatal('--from <agent@team> is required');
    if (!values.to) fatal('--to <agent@team> is required');
    if (!localTeam) fatal('COMMS_TEAM_NAME env var is required for check command');
    const result = await checkAcl({ aclPath, from: values.from!, to: values.to!, localTeam });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.exitCode);
  }

  if (command === 'show') {
    const { values } = parseArgs({
      args: args.slice(1),
      options: {
        agent: { type: 'string' },
        format: { type: 'string', default: 'json' },
      },
    });
    if (!values.agent) fatal('--agent <name> is required');
    const result = await showAgentAcl({ aclPath, agentName: values.agent! });
    if (values.format === 'human') {
      console.log(`Agent: ${result.agent}`);
      console.log(`  allowed_to:   ${result.allowed_to.join(', ') || '(none)'}`);
      console.log(`  allowed_from: ${result.allowed_from.join(', ') || '(none)'}`);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    return;
  }

  fatal(`Unknown command: ${command}. Valid: list, check, show`);
}

function fatal(msg: string): never {
  console.error(JSON.stringify({ error: msg }));
  process.exit(1);
}

const isMain = process.argv[1]?.endsWith('comms-acl.ts') ||
  process.argv[1]?.endsWith('comms-acl.js');

if (isMain) {
  main().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ error: msg }));
    process.exit(1);
  });
}
