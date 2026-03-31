// (*CD:Babbage*)
// In-memory message store for deduplication and audit trail.
// The dedup window prevents reprocessing at-least-once retries.
// Messages are keyed by their ID; a TTL-based cleanup prevents unbounded growth.
//
// Persistence (HUB-4): dedup set is flushed to disk every cleanup cycle (60s).
// On restart, the file is loaded and stale entries discarded. This leaves a
// ≤60s gap window on restart — acceptable for v1. File write is atomic (tmp+rename).

import { writeFileSync, readFileSync, renameSync, existsSync } from 'node:fs';
import type { Message } from '../types.js';

interface StoredMessage {
  message: Message;
  receivedAt: number; // ms since epoch
}

/** Serialised form written to disk — minimal, just what we need for dedup */
interface PersistedEntry {
  receivedAt: number;
}

const DEFAULT_DEDUP_TTL_MS = 5 * 60 * 1_000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1_000;       // Run GC every 60s

export class MessageStore {
  private readonly store = new Map<string, StoredMessage>();
  private readonly ttl: number;
  private readonly storePath: string | null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * @param dedupTtlMs  TTL for dedup entries. Default: 5 minutes.
   * @param storePath   Path to persist dedup set (optional). When set, the store
   *                    is flushed to disk every cleanup cycle and loaded on start().
   *                    Prevents replay attacks across daemon restarts (HUB-4).
   */
  constructor(dedupTtlMs = DEFAULT_DEDUP_TTL_MS, storePath?: string) {
    this.ttl = dedupTtlMs;
    this.storePath = storePath ?? null;
  }

  /** Start periodic stale-entry cleanup. Call on broker startup. */
  start(): void {
    // Load persisted entries from previous run
    if (this.storePath) {
      this.loadFromDisk();
    }
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    // Don't prevent process exit
    this.cleanupTimer.unref?.();
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    // Final flush on clean shutdown
    if (this.storePath) {
      this.flushToDisk();
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
    if (this.storePath) {
      this.flushToDisk();
    }
  }

  private flushToDisk(): void {
    if (!this.storePath) return;
    try {
      const data: Record<string, PersistedEntry> = {};
      for (const [id, entry] of this.store.entries()) {
        data[id] = { receivedAt: entry.receivedAt };
      }
      const tmp = this.storePath + '.tmp';
      writeFileSync(tmp, JSON.stringify(data), 'utf8');
      renameSync(tmp, this.storePath);
    } catch (err) {
      console.error('[message-store] Failed to persist dedup set:', err);
    }
  }

  private loadFromDisk(): void {
    if (!this.storePath || !existsSync(this.storePath)) return;
    try {
      const raw = readFileSync(this.storePath, 'utf8');
      const data = JSON.parse(raw) as Record<string, PersistedEntry>;
      const cutoff = Date.now() - this.ttl;
      for (const [id, entry] of Object.entries(data)) {
        // Discard entries older than TTL — they're outside the dedup window
        if (entry.receivedAt >= cutoff) {
          // Restore as a stub — we only need the ID and timestamp for dedup
          this.store.set(id, {
            message: {} as Message,
            receivedAt: entry.receivedAt,
          });
        }
      }
    } catch (err) {
      console.error('[message-store] Failed to load persisted dedup set:', err);
      // Non-fatal: start with empty store; worst case is accepting a replay
    }
  }
}
