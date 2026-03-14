// (*CD:Babbage*)
// In-memory message store for deduplication and audit trail.
// The dedup window prevents reprocessing at-least-once retries.
// Messages are keyed by their ID; a TTL-based cleanup prevents unbounded growth.

import type { Message } from '../types.js';

interface StoredMessage {
  message: Message;
  receivedAt: number; // ms since epoch
}

const DEFAULT_DEDUP_TTL_MS = 5 * 60 * 1_000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1_000;       // Run GC every 60s

export class MessageStore {
  private readonly store = new Map<string, StoredMessage>();
  private readonly ttl: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(dedupTtlMs = DEFAULT_DEDUP_TTL_MS) {
    this.ttl = dedupTtlMs;
  }

  /** Start periodic stale-entry cleanup. Call on broker startup. */
  start(): void {
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    // Don't prevent process exit
    this.cleanupTimer.unref?.();
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Record a message as seen. Returns true if this is a new message,
   * false if it's a duplicate (already seen within the TTL window).
   */
  record(message: Message): boolean {
    if (this.store.has(message.id)) return false;
    this.store.set(message.id, { message, receivedAt: Date.now() });
    return true;
  }

  has(messageId: string): boolean {
    return this.store.has(messageId);
  }

  get(messageId: string): Message | undefined {
    return this.store.get(messageId)?.message;
  }

  size(): number {
    return this.store.size;
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.ttl;
    for (const [id, entry] of this.store.entries()) {
      if (entry.receivedAt < cutoff) {
        this.store.delete(id);
      }
    }
  }
}
