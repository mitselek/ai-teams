// (*CD:Babbage*)
// comms-watch — watch the local team's inbox for incoming inter-team messages.
// Monitors ~/.claude/teams/<team-name>/inboxes/ for new JSON files and prints
// each message as it arrives. Behaves like `tail -f` for the inbox.
//
// Usage:
//   comms-watch [--follow] [--consume] [--format <pretty|json|oneline>]
//
// Options:
//   --follow            Keep watching after printing existing messages (default: true)
//   --no-follow         Print existing messages and exit
//   --consume           Delete message files after displaying (mark as read)
//   --format <mode>     Output format: pretty (default), json (raw), oneline
//   --base-dir <path>   Override ~/.claude/teams base directory
//
// Required environment:
//   COMMS_TEAM_NAME   — team whose inbox to watch
//
// !! MUTUAL EXCLUSION WARNING !!
// comms-watch --consume and SendMessageBridge both poll the same inbox directory
// and delete files after processing. Running both simultaneously causes a race:
// one process may consume a file before the other has processed it, silently
// dropping messages.
//
// Rule: run EITHER comms-watch (for human inspection) OR the broker with
// SendMessageBridge enabled (for agent delivery) — never both at the same time.
// comms-watch without --consume is safe to run alongside the broker (read-only).

import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseArgs } from 'util';
import type { Message } from '../types.js';

const POLL_INTERVAL_MS = 500; // Check for new files every 500ms

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      follow: { type: 'boolean', default: true },
      consume: { type: 'boolean', default: false },
      format: { type: 'string', default: 'pretty' },
      'base-dir': { type: 'string' },
    },
  });

  const teamName = requireEnv('COMMS_TEAM_NAME');
  const baseDir = values['base-dir'] ?? path.join(os.homedir(), '.claude', 'teams');
  const inboxDir = path.join(baseDir, teamName, 'inboxes');

  if (!['pretty', 'json', 'oneline'].includes(values.format!)) {
    fatal(`Invalid format: ${values.format}. Valid: pretty, json, oneline`);
  }

  // Ensure inbox directory exists
  fs.mkdirSync(inboxDir, { recursive: true });

  console.error(`[comms-watch] Watching inbox for team: ${teamName}`);
  console.error(`[comms-watch] Directory: ${inboxDir}`);
  if (values.consume) console.error('[comms-watch] Consume mode: messages will be deleted after display');

  // Track already-seen files so we only print new arrivals
  const seen = new Set<string>();

  // First pass — print existing messages
  const existing = listMessages(inboxDir);
  if (existing.length === 0) {
    console.error('[comms-watch] No existing messages.');
  } else {
    console.error(`[comms-watch] ${existing.length} existing message(s):`);
  }
  for (const filePath of existing) {
    seen.add(filePath);
    const msg = readMessage(filePath);
    if (msg) {
      printMessage(msg, values.format!, filePath);
      if (values.consume) fs.unlinkSync(filePath);
    }
  }

  if (!values.follow) return;

  // Poll for new files
  let running = true;
  const shutdown = (): void => {
    running = false;
    console.error('\n[comms-watch] Shutting down…');
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  console.error('[comms-watch] Waiting for new messages… (Ctrl+C to exit)');
  while (running) {
    await sleep(POLL_INTERVAL_MS);
    const current = listMessages(inboxDir);
    for (const filePath of current) {
      if (seen.has(filePath)) continue;
      seen.add(filePath);
      const msg = readMessage(filePath);
      if (msg) {
        printMessage(msg, values.format!, filePath);
        if (values.consume) {
          try { fs.unlinkSync(filePath); } catch { /* already removed */ }
        }
      }
    }
  }
}

function listMessages(inboxDir: string): string[] {
  try {
    return fs.readdirSync(inboxDir)
      .filter(f => f.endsWith('.json') && !f.endsWith('.tmp'))
      .sort() // sort by filename = sort by message ID (UUIDs are not time-ordered, but consistent)
      .map(f => path.join(inboxDir, f));
  } catch {
    return [];
  }
}

function readMessage(filePath: string): Message | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as Message;
  } catch {
    return null;
  }
}

function printMessage(msg: Message, format: string, filePath: string): void {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(msg));
      break;

    case 'oneline':
      console.log(
        `[${msg.timestamp}] ${msg.from.team}/${msg.from.agent} → ${msg.to.team}/${msg.to.agent} ` +
        `[${msg.type}:${msg.priority}] ${msg.id} | ${msg.body.slice(0, 80).replace(/\n/g, ' ')}`
      );
      break;

    case 'pretty':
    default: {
      const separator = '─'.repeat(60);
      console.log(separator);
      console.log(`From:      ${msg.from.team}/${msg.from.agent}${msg.from.prefix ? ` (${msg.from.prefix})` : ''}`);
      console.log(`To:        ${msg.to.team}/${msg.to.agent}`);
      console.log(`Type:      ${msg.type}  Priority: ${msg.priority}`);
      console.log(`ID:        ${msg.id}`);
      console.log(`Timestamp: ${msg.timestamp}`);
      if (msg.reply_to) console.log(`Reply-to:  ${msg.reply_to}`);
      console.log(`File:      ${path.basename(filePath)}`);
      console.log('');
      console.log(msg.body);
      console.log('');
      break;
    }
  }
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) fatal(`Required environment variable not set: ${name}`);
  return val!;
}

function fatal(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
