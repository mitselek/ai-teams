// (*CD:Vigenere*)
// ACL (Access Control List) module for cross-team messaging.
// Per-agent allow-list with wildcard support, default-deny.
// Supports hot-reload via SIGHUP (createAclManager).
// Spec: #15 §4, #16 §4

import { readFileSync } from 'node:fs';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AgentACL {
  allowed_to: string[];
  allowed_from: string[];
}

export interface ACLConfig {
  version: 1;
  agents: Record<string, AgentACL>;
  default: 'deny';
}

export interface AclManager {
  isAllowed(direction: 'send' | 'receive', localAgent: string, remoteAddress: string): boolean;
  reload(): void;
}

// ── Pattern matching ─────────────────────────────────────────────────────────

/**
 * Match an address ("agent@team") against a pattern.
 * Supports:
 *   - Exact match: "herald@framework-research"
 *   - Wildcard agent: "*@framework-research" (any agent on that team)
 * Does NOT support:
 *   - Full wildcard: "*@*" or "*"
 */
export function matchesPattern(address: string, pattern: string): boolean {
  // Exact match
  if (address === pattern) return true;

  // Bare wildcard — not supported
  if (pattern === '*') return false;

  // Wildcard agent match: "*@team"
  if (pattern.startsWith('*@')) {
    const patternTeam = pattern.slice(2);

    // Reject "*@*" — not supported in v1
    if (patternTeam === '*') return false;

    const atIndex = address.indexOf('@');
    if (atIndex === -1) return false;

    const addressTeam = address.slice(atIndex + 1);
    return addressTeam === patternTeam;
  }

  return false;
}

// ── ACL evaluation ───────────────────────────────────────────────────────────

/**
 * Check if a local agent is allowed to send to / receive from a remote address.
 * Default-deny: if the agent is not in the ACL or the address is not in the
 * relevant allow list, access is denied.
 */
export function isAllowed(
  acl: ACLConfig,
  direction: 'send' | 'receive',
  localAgent: string,
  remoteAddress: string,
): boolean {
  const agentAcl = acl.agents[localAgent];

  // Agent not in ACL → default deny
  if (!agentAcl) return false;

  const patterns =
    direction === 'send' ? agentAcl.allowed_to : agentAcl.allowed_from;

  return patterns.some((pattern) => matchesPattern(remoteAddress, pattern));
}

// ── ACL loading ──────────────────────────────────────────────────────────────

/**
 * Load and validate an ACL config from a JSON file.
 * Throws on missing file, malformed JSON, or missing required fields.
 */
export function loadAcl(path: string): ACLConfig {
  const raw = readFileSync(path, 'utf-8');
  const parsed = JSON.parse(raw);

  if (!parsed.agents || typeof parsed.agents !== 'object') {
    throw new Error('ACL missing required "agents" field');
  }

  return parsed as ACLConfig;
}

// ── ACL manager (supports hot-reload) ────────────────────────────────────────

/**
 * Create an ACL manager that supports hot-reload.
 * Call `manager.reload()` to re-read the ACL file (e.g., on SIGHUP).
 * On reload failure, keeps the previous valid ACL.
 */
export function createAclManager(aclPath: string): AclManager {
  let currentAcl = loadAcl(aclPath);

  return {
    isAllowed(
      direction: 'send' | 'receive',
      localAgent: string,
      remoteAddress: string,
    ): boolean {
      return isAllowed(currentAcl, direction, localAgent, remoteAddress);
    },

    reload(): void {
      try {
        currentAcl = loadAcl(aclPath);
      } catch (err) {
        console.error(
          '[acl] Reload failed, keeping previous ACL:',
          (err as Error).message,
        );
      }
    },
  };
}
