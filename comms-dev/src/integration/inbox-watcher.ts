// (*CD:Babbage*)
// InboxWatcher — polls the file-based broker inbox and dispatches each
// message to the provided handler. Files are consumed (deleted) after
// successful dispatch.
//
// Inbox directory: <baseDir>/<teamName>/inboxes/
// Each message is a <message-id>.json file written by InboxDelivery.

import fs from 'fs';
import path from 'path';
import type { Message } from '../types.js';

export interface InboxWatcherOptions {
  teamName: string;
  /** Base directory — inbox lives at <baseDir>/<teamName>/inboxes/ */
  baseDir: string;
  /** Called once per message. If it throws, the file is NOT deleted. */
  onMessage: (message: Message) => Promise<void>;
  /** Polling interval in milliseconds. Default: 500. */
  pollIntervalMs?: number;
  onError?: (err: Error) => void;
}

export class InboxWatcher {
  private readonly inboxDir: string;
  private readonly onMessage: (message: Message) => Promise<void>;
  private readonly onError: (err: Error) => void;
  private readonly pollIntervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(opts: InboxWatcherOptions) {
    this.inboxDir = path.join(opts.baseDir, opts.teamName, 'inboxes');
    this.onMessage = opts.onMessage;
    this.onError = opts.onError ?? ((err) => console.error('[inbox-watcher]', err));
    this.pollIntervalMs = opts.pollIntervalMs ?? 500;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.poll(), this.pollIntervalMs);
    this.timer.unref?.();
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
      files = fs.readdirSync(this.inboxDir)
        .filter(f => f.endsWith('.json') && !f.endsWith('.tmp'))
        .map(f => path.join(this.inboxDir, f));
    } catch {
      return; // Directory doesn't exist yet — wait
    }

    for (const filePath of files) {
      let message: Message;
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        message = JSON.parse(raw) as Message;
      } catch {
        // Malformed — consume the file and skip
        try { fs.unlinkSync(filePath); } catch { /* ignore */ }
        continue;
      }

      try {
        await this.onMessage(message);
        // Only consume after successful dispatch
        fs.unlinkSync(filePath);
      } catch (err) {
        this.onError(err as Error);
        // Leave the file — do not re-deliver on next cycle (file still exists,
        // but stop trying so we don't spin). Delete to avoid infinite loop:
        try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      }
    }
  }
}
