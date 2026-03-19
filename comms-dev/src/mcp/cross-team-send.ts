// (*CD:Babbage*)
// CrossTeamSend — MCP tool that sends a message to a remote agent via the local daemon.
// Connects to the daemon's UDS socket, sends a JSON command, waits for response.
// Spec: #16 §4, §6, #18 Phase 4

import { connect } from 'node:net';
import { join } from 'node:path';
import type { MessageType, MessagePriority } from '../types.js';

// ── Address validation ────────────────────────────────────────────────────────

// Valid address: lowercase alphanumeric + hyphens/underscores, no spaces, must have @
const VALID_ADDRESS_RE = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+$/;

function validateAddress(to: string): void {
  if (!to || to.length === 0) {
    throw Object.assign(new Error('Invalid address: empty'), { code: 'INVALID_ADDRESS' });
  }
  const atIdx = to.indexOf('@');
  if (atIdx === -1) {
    throw Object.assign(new Error(`Invalid address: missing @ in "${to}"`), { code: 'INVALID_ADDRESS' });
  }
  if (!VALID_ADDRESS_RE.test(to)) {
    throw Object.assign(new Error(`Invalid address: "${to}" contains invalid characters or uses wildcard`), { code: 'INVALID_ADDRESS' });
  }
  const agent = to.slice(0, atIdx);
  if (agent === '*') {
    throw Object.assign(new Error(`Invalid address: wildcard agents not allowed in "${to}"`), { code: 'INVALID_ADDRESS' });
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CrossTeamSendParams {
  /** Target address in "agent@team" format */
  to: string;
  /** Message body (Markdown) */
  body: string;
  /** Sending agent name */
  fromAgent: string;
  /** Message type (default: query) */
  type?: MessageType;
  /** Message priority (default: normal) */
  priority?: MessagePriority;
  /** Reply-to message ID */
  reply_to?: string | null;
}

export interface CrossTeamSendContext {
  /** Directory containing the daemon's UDS socket */
  socketDir: string;
  /** Local team name (used to locate the socket) */
  teamName: string;
  /** Timeout in ms for the entire operation (default: 30000) */
  timeoutMs?: number;
}

export interface CrossTeamSendResult {
  message_id: string;
  delivered_at: string;
}

// ── Implementation ────────────────────────────────────────────────────────────

/**
 * Send a cross-team message via the local daemon.
 * Connects to <socketDir>/<teamName>.sock, sends a JSON command, returns result.
 * Throws with a `code` property on error (INVALID_ADDRESS, ACL_DENIED, PEER_UNAVAILABLE, TIMEOUT, etc.)
 */
export async function crossTeamSend(
  params: CrossTeamSendParams,
  context: CrossTeamSendContext,
): Promise<CrossTeamSendResult> {
  const { to, body, fromAgent, type, priority, reply_to } = params;
  const { socketDir, teamName, timeoutMs = 30_000 } = context;

  // Validate address BEFORE attempting connection
  validateAddress(to);

  if (!fromAgent) {
    throw Object.assign(new Error('fromAgent is required'), { code: 'INVALID_PARAMS' });
  }

  const socketPath = join(socketDir, `${teamName}.sock`);

  const command = JSON.stringify({
    cmd: 'send',
    from: fromAgent,
    to,
    body,
    type: type ?? 'query',
    priority: priority ?? 'normal',
    reply_to: reply_to ?? null,
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    let buf = '';

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(Object.assign(new Error('Daemon did not respond within timeout'), { code: 'TIMEOUT' }));
    }, timeoutMs);

    const socket = connect(socketPath);

    socket.setEncoding('utf8');

    socket.once('connect', () => {
      socket.write(command + '\n');
    });

    socket.on('data', (chunk: string) => {
      buf += chunk;
      const nl = buf.indexOf('\n');
      if (nl !== -1) {
        const line = buf.slice(0, nl);
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        socket.destroy();

        let response: any;
        try {
          response = JSON.parse(line);
        } catch {
          reject(Object.assign(new Error('Invalid response from daemon'), { code: 'PROTOCOL_ERROR' }));
          return;
        }

        if (response.ok) {
          resolve({
            message_id: response.message_id as string,
            delivered_at: response.delivered_at as string,
          });
        } else {
          reject(Object.assign(
            new Error(response.message ?? `Daemon error: ${response.code}`),
            { code: response.code ?? 'DAEMON_ERROR' },
          ));
        }
      }
    });

    socket.once('error', (err: NodeJS.ErrnoException) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Connection errors (ENOENT, ECONNREFUSED) = daemon not available = TIMEOUT
      reject(Object.assign(
        new Error(`Daemon unavailable: ${err.message}`),
        { code: 'TIMEOUT' },
      ));
    });

    socket.once('close', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(Object.assign(new Error('Daemon closed connection unexpectedly'), { code: 'TIMEOUT' }));
    });
  });
}
