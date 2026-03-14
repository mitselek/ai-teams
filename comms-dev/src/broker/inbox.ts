// (*CD:Babbage*)
// File-based inbox delivery — writes incoming inter-team messages as JSON files
// to ~/.claude/teams/<team-name>/inboxes/, one file per message, named by message ID.
// This is consistent with how the agent framework already handles inboxes.
// Receiving agents poll this directory for new files.

import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Message } from '../types.js';

export interface InboxDeliveryOptions {
  // Override the base directory (default: ~/.claude/teams)
  baseDir?: string;
}

export class InboxDelivery {
  private readonly inboxDir: string;

  constructor(teamName: string, opts: InboxDeliveryOptions = {}) {
    const baseDir = opts.baseDir ?? path.join(os.homedir(), '.claude', 'teams');
    this.inboxDir = path.join(baseDir, teamName, 'inboxes');
  }

  /**
   * Write a message to the team's inbox directory as a JSON file.
   * Filename: <message-id>.json
   * Atomic: write to .tmp then rename to prevent partial reads.
   */
  async deliver(message: Message): Promise<string> {
    this.ensureInboxDir();

    const filename = `${message.id}.json`;
    const destPath = path.join(this.inboxDir, filename);
    const tmpPath = destPath + '.tmp';

    const content = JSON.stringify(message, null, 2);
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, destPath);

    console.log(`[inbox] Delivered ${message.id} → ${destPath}`);
    return destPath;
  }

  /** List unread message files in the inbox directory. */
  list(): string[] {
    this.ensureInboxDir();
    return fs.readdirSync(this.inboxDir)
      .filter(f => f.endsWith('.json') && !f.endsWith('.tmp'))
      .map(f => path.join(this.inboxDir, f));
  }

  /** Read and parse a message file. Returns null if file doesn't exist or is malformed. */
  read(filePath: string): Message | null {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw) as Message;
    } catch {
      return null;
    }
  }

  /** Remove a message file after processing (acknowledge delivery). */
  consume(filePath: string): void {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Already removed — non-fatal
    }
  }

  get inboxPath(): string {
    return this.inboxDir;
  }

  private ensureInboxDir(): void {
    fs.mkdirSync(this.inboxDir, { recursive: true });
  }
}
