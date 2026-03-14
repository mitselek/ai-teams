// (*CD:Babbage*)
// SendMessage integration glue — bridges incoming inter-team messages from the
// broker's file-based inbox into the agent framework's SendMessage inbox mechanism.
//
// The broker writes each incoming message as <message-id>.json to:
//   ~/.claude/teams/<team-name>/inboxes/   (broker inbox)
//
// The agent framework reads agent inboxes from:
//   ~/.claude/teams/<team-name>/inboxes/<agent-name>.json  (framework inbox)
//
// This bridge polls the broker inbox directory for new message files, converts
// them to the framework's inbox entry format, and appends them to the target
// agent's inbox JSON array. The broker file is then consumed (deleted).
//
// The target agent is determined by msg.to.agent. If the agent has no inbox
// file yet, one is created. Unknown agents default to 'team-lead'.

import fs from 'fs';
import path from 'path';
import os from 'os';
import type { Message } from '../types.js';

const POLL_INTERVAL_MS = 500;
const DEFAULT_AGENT = 'team-lead';

// Agent colors matching the framework's convention (from config.json)
const AGENT_COLORS: Record<string, string> = {
  'team-lead': 'red',
  'babbage': 'green',
  'vigenere': 'blue',
  'kerckhoffs': 'yellow',
};

// Framework inbox entry format (matches ~/.claude/teams/<team>/inboxes/<agent>.json)
interface InboxEntry {
  from: string;       // sender identifier, e.g. "framework-research/team-lead"
  text: string;       // formatted message body
  summary: string;    // short one-line summary
  timestamp: string;  // ISO 8601
  color: string;      // display color
  read: boolean;
}

export interface BridgeOptions {
  teamName: string;
  /** Broker file inbox: where broker writes <message-id>.json files */
  brokerInboxDir: string;
  /** Framework inbox dir: where <agent-name>.json arrays live */
  frameworkInboxDir: string;
  onDelivered?: (message: Message, agentName: string) => void;
  onError?: (err: Error) => void;
}

export class SendMessageBridge {
  private readonly opts: BridgeOptions;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly seen = new Set<string>();

  constructor(opts: BridgeOptions) {
    this.opts = opts;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.poll(), POLL_INTERVAL_MS);
    this.timer.unref?.();
    console.log(`[bridge] Watching broker inbox: ${this.opts.brokerInboxDir}`);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async poll(): Promise<void> {
    let files: string[];
    try {
      files = fs.readdirSync(this.opts.brokerInboxDir)
        .filter(f => f.endsWith('.json') && !f.endsWith('.tmp'))
        .map(f => path.join(this.opts.brokerInboxDir, f));
    } catch {
      return; // Directory doesn't exist yet — wait
    }

    for (const filePath of files) {
      if (this.seen.has(filePath)) continue;
      this.seen.add(filePath);

      let message: Message;
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        message = JSON.parse(raw) as Message;
      } catch {
        continue; // Malformed or already consumed
      }

      try {
        await this.deliver(message);
        // Consume the broker inbox file — it's been handed off to the framework
        fs.unlinkSync(filePath);
        this.seen.delete(filePath); // Allow re-delivery if broker re-queues
      } catch (err) {
        (this.opts.onError ?? console.error)('[bridge] Delivery failed:', err);
      }
    }
  }

  private async deliver(message: Message): Promise<void> {
    // Determine target agent — default to team-lead for unknown agents
    const targetAgent = message.to.agent || DEFAULT_AGENT;
    const agentInboxPath = path.join(this.opts.frameworkInboxDir, `${targetAgent}.json`);

    // Format the message body as natural language with metadata header
    const text = formatMessageText(message);
    const summary = buildSummary(message);
    const senderColor = AGENT_COLORS[message.from.agent] ?? 'white';

    const entry: InboxEntry = {
      from: `${message.from.team}/${message.from.agent}`,
      text,
      summary,
      timestamp: message.timestamp,
      color: senderColor,
      read: false,
    };

    // Read existing inbox array (or start fresh)
    let inbox: InboxEntry[] = [];
    try {
      const raw = fs.readFileSync(agentInboxPath, 'utf8');
      inbox = JSON.parse(raw) as InboxEntry[];
    } catch {
      // File doesn't exist or is malformed — start fresh
    }

    inbox.push(entry);

    // Atomic write — tmp + rename to avoid partial reads by the framework
    const tmpPath = agentInboxPath + '.tmp';
    fs.mkdirSync(path.dirname(agentInboxPath), { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(inbox, null, 2), 'utf8');
    fs.renameSync(tmpPath, agentInboxPath);

    console.log(`[bridge] Delivered ${message.id} → ${targetAgent} inbox`);
    this.opts.onDelivered?.(message, targetAgent);
  }
}

function formatMessageText(msg: Message): string {
  const timestamp = new Date(msg.timestamp).toISOString().replace('T', ' ').slice(0, 16);
  const prefix = msg.from.prefix ? ` (*${msg.from.prefix}:${msg.from.agent}*)` : '';

  const lines = [
    `[${timestamp}]${prefix} **Inter-team message from ${msg.from.team}**`,
    '',
    `**From:** ${msg.from.team}/${msg.from.agent}`,
    `**Type:** ${msg.type}  **Priority:** ${msg.priority}`,
    `**Message ID:** ${msg.id}`,
    ...(msg.reply_to ? [`**Reply-to:** ${msg.reply_to}`] : []),
    '',
    msg.body,
  ];

  return lines.join('\n');
}

function buildSummary(msg: Message): string {
  const bodyPreview = msg.body.slice(0, 80).replace(/\n/g, ' ');
  return `[${msg.type}] from ${msg.from.team}: ${bodyPreview}${msg.body.length > 80 ? '…' : ''}`;
}

// ── Standalone runner ─────────────────────────────────────────────────────────
// Can be run directly: tsx src/broker/sendmessage-bridge.ts
// Environment:
//   COMMS_TEAM_NAME    — required
//   COMMS_INBOX_DIR    — broker file inbox (default: ~/.claude/teams/<team>/inboxes)
//   COMMS_FW_INBOX_DIR — framework inbox dir (default: ~/.claude/teams/<team>/inboxes)
//                        (same dir — broker writes msg-<uuid>.json, framework reads <agent>.json)

if (process.argv[1] && process.argv[1].includes('sendmessage-bridge')) {
  const teamName = process.env['COMMS_TEAM_NAME'];
  if (!teamName) {
    console.error('Error: COMMS_TEAM_NAME is required');
    process.exit(1);
  }

  const defaultInboxDir = path.join(os.homedir(), '.claude', 'teams', teamName, 'inboxes');
  const brokerInboxDir = process.env['COMMS_INBOX_DIR'] ?? defaultInboxDir;
  const frameworkInboxDir = process.env['COMMS_FW_INBOX_DIR'] ?? defaultInboxDir;

  const bridge = new SendMessageBridge({
    teamName,
    brokerInboxDir,
    frameworkInboxDir,
    onError: (err) => console.error('[bridge] Error:', err),
  });

  bridge.start();
  console.log('[bridge] Running. Ctrl+C to stop.');

  process.on('SIGTERM', () => { bridge.stop(); process.exit(0); });
  process.on('SIGINT', () => { bridge.stop(); process.exit(0); });
}
