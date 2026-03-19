// (*CD:Lovelace*)
// comms-daemon — control CLI for the cross-team relay daemon.
// Spec: #17 §2, #18 Phase 5.3
//
// Commands:
//   comms-daemon status  [--format json|human]
//   comms-daemon reload  [--format json|human]
//   comms-daemon peers   [--format json|human]
//
// Connects to daemon via UDS socket at <socketDir>/<teamName>.sock.
// Protocol: newline-delimited JSON, one command per connection.
//
// Environment:
//   COMMS_SOCKET_DIR  — default /shared/comms
//   COMMS_TEAM_NAME   — required

import { createConnection } from 'node:net';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DaemonStatusResult {
  status: string;
  uptime_seconds: number;
  version: string;
  team_name: string;
}

export interface DaemonReloadResult {
  success: boolean;
  reloaded_at: string;
  acl_agents_count: number;
}

export interface PeerInfo {
  team: string;
  status: 'connected' | 'disconnected';
  host: string;
  port: number;
  connected_at: string | null;
}

export interface DaemonPeersResult {
  peers: PeerInfo[];
}

// ── UDS client ────────────────────────────────────────────────────────────────

function socketPath(socketDir: string, teamName: string): string {
  return join(socketDir, `${teamName}.sock`);
}

function sendCommand(
  socketDir: string,
  teamName: string,
  cmd: string,
  timeoutMs = 5000,
): Promise<Record<string, unknown>> {
  const sockPath = socketPath(socketDir, teamName);

  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.destroy();
      const e = new Error(`Daemon did not respond within ${timeoutMs}ms`);
      (e as NodeJS.ErrnoException).code = 'TIMEOUT';
      reject(e);
    }, timeoutMs);

    const socket = createConnection(sockPath);
    let buffer = '';

    socket.on('connect', () => {
      socket.write(JSON.stringify({ cmd }) + '\n');
    });

    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      const newlineIdx = buffer.indexOf('\n');
      if (newlineIdx === -1) return;
      const line = buffer.slice(0, newlineIdx);
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      try {
        const parsed = JSON.parse(line) as Record<string, unknown>;
        if (!parsed.ok) {
          const e = new Error(String(parsed['message'] ?? 'Daemon error'));
          (e as NodeJS.ErrnoException).code = String(parsed['code'] ?? 'DAEMON_ERROR');
          reject(e);
        } else {
          resolve(parsed);
        }
      } catch {
        const e = new Error(`Invalid JSON response from daemon: ${line}`);
        (e as NodeJS.ErrnoException).code = 'PROTOCOL_ERROR';
        reject(e);
      }
    });

    socket.on('error', (err: NodeJS.ErrnoException) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err.code === 'ENOENT' || err.code === 'ECONNREFUSED') {
        const e = new Error(`Daemon not running at ${sockPath}`);
        (e as NodeJS.ErrnoException).code = 'DAEMON_NOT_RUNNING';
        reject(e);
      } else {
        reject(err);
      }
    });

    socket.on('close', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const e = new Error('Daemon closed connection without responding');
      (e as NodeJS.ErrnoException).code = 'DAEMON_NOT_RUNNING';
      reject(e);
    });
  });
}

// ── daemonStatus ──────────────────────────────────────────────────────────────

export async function daemonStatus(opts: {
  socketDir: string;
  teamName: string;
  timeoutMs?: number;
}): Promise<DaemonStatusResult> {
  const response = await sendCommand(opts.socketDir, opts.teamName, 'status', opts.timeoutMs);
  return {
    status:          String(response['status'] ?? 'running'),
    uptime_seconds:  Number(response['uptime_seconds'] ?? 0),
    version:         String(response['version'] ?? ''),
    team_name:       String(response['team_name'] ?? opts.teamName),
  };
}

// ── daemonReload ──────────────────────────────────────────────────────────────

export async function daemonReload(opts: {
  socketDir: string;
  teamName: string;
  timeoutMs?: number;
}): Promise<DaemonReloadResult> {
  const response = await sendCommand(opts.socketDir, opts.teamName, 'reload', opts.timeoutMs);
  return {
    success:          Boolean(response['success'] ?? true),
    reloaded_at:      String(response['reloaded_at'] ?? new Date().toISOString()),
    acl_agents_count: Number(response['acl_agents_count'] ?? 0),
  };
}

// ── daemonPeers ───────────────────────────────────────────────────────────────

export async function daemonPeers(opts: {
  socketDir: string;
  teamName: string;
  timeoutMs?: number;
}): Promise<DaemonPeersResult> {
  const response = await sendCommand(opts.socketDir, opts.teamName, 'peers', opts.timeoutMs);
  const raw = Array.isArray(response['peers']) ? response['peers'] : [];
  const peers: PeerInfo[] = (raw as Record<string, unknown>[]).map(p => ({
    team:         String(p['team'] ?? ''),
    status:       (p['status'] === 'connected' ? 'connected' : 'disconnected') as 'connected' | 'disconnected',
    host:         String(p['host'] ?? ''),
    port:         Number(p['port'] ?? 0),
    connected_at: p['connected_at'] != null ? String(p['connected_at']) : null,
  }));
  return { peers };
}

// ── CLI entry point ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const socketDir = process.env['COMMS_SOCKET_DIR'] ?? '/shared/comms';
  const teamName  = process.env['COMMS_TEAM_NAME'] ?? '';

  if (!teamName) fatal('COMMS_TEAM_NAME env var is required');

  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) fatal('Command required: status, reload, peers');

  if (command === 'status') {
    const { values } = parseArgs({
      args: args.slice(1),
      options: { format: { type: 'string', default: 'json' } },
    });
    const result = await daemonStatus({ socketDir, teamName });
    if (values.format === 'human') {
      console.log(`Status:  ${result.status}`);
      console.log(`Team:    ${result.team_name}`);
      console.log(`Uptime:  ${result.uptime_seconds}s`);
      console.log(`Version: ${result.version}`);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    return;
  }

  if (command === 'reload') {
    const result = await daemonReload({ socketDir, teamName });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === 'peers') {
    const { values } = parseArgs({
      args: args.slice(1),
      options: { format: { type: 'string', default: 'json' } },
    });
    const result = await daemonPeers({ socketDir, teamName });
    if (values.format === 'human') {
      if (result.peers.length === 0) {
        console.log('No peers configured.');
      }
      for (const p of result.peers) {
        const since = p.connected_at ? ` since ${p.connected_at}` : '';
        console.log(`${p.team}  ${p.status}  ${p.host}:${p.port}${since}`);
      }
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    return;
  }

  fatal(`Unknown command: ${command}. Valid: status, reload, peers`);
}

function fatal(msg: string): never {
  console.error(JSON.stringify({ error: msg }));
  process.exit(1);
}

const isMain = process.argv[1]?.endsWith('comms-daemon.ts') ||
  process.argv[1]?.endsWith('comms-daemon.js');

if (isMain) {
  main().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ error: msg }));
    process.exit(1);
  });
}
