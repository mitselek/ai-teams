// (*CD:Babbage*)
// SQLite-backed offline message queue.
// story/32: persistence, per-team capacity cap, TTL expiry, SQL-injection resistance.

import Database from 'better-sqlite3';

const DEFAULT_CAPACITY = 100;
const DEFAULT_TTL_MS = 86_400_000; // 24 hours

/**
 * Durable offline queue backed by SQLite (better-sqlite3).
 * All operations are synchronous — safe in Node.js single-threaded loop.
 *
 * Schema:
 *   messages (id TEXT PK, team TEXT, payload TEXT, created_at INTEGER)
 *
 * Guarantees:
 *   - Per-team capacity: oldest row dropped when limit reached
 *   - TTL: expired rows deleted at drain time (before delivery)
 *   - Injection-safe: all SQL uses prepared statements with bound parameters
 */
export class MessageQueue {
  private db: Database.Database;
  private capacity: number;
  private ttlMs: number;

  constructor(path?: string, capacity?: number, ttlMs?: number) {
    this.capacity = capacity ?? DEFAULT_CAPACITY;
    this.ttlMs = ttlMs ?? DEFAULT_TTL_MS;
    this.db = new Database(path ?? ':memory:');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id         TEXT    PRIMARY KEY,
        team       TEXT    NOT NULL,
        payload    TEXT    NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
  }

  /**
   * Enqueue a message for a team.
   * If the team's queue is at capacity, the oldest message is evicted first.
   */
  push(team: string, msg: unknown): void {
    const now = Date.now();
    const row = this.db.prepare('SELECT COUNT(*) AS n FROM messages WHERE team = ?').get(team) as
      | { n: number }
      | undefined;

    if ((row?.n ?? 0) >= this.capacity) {
      // Drop the oldest row for this team
      this.db
        .prepare(
          'DELETE FROM messages WHERE id = (' +
            'SELECT id FROM messages WHERE team = ? ORDER BY created_at ASC LIMIT 1)',
        )
        .run(team);
    }

    this.db
      .prepare('INSERT OR IGNORE INTO messages (id, team, payload, created_at) VALUES (?, ?, ?, ?)')
      .run((msg as { id: string }).id, team, JSON.stringify(msg), now);
  }

  /**
   * Drain all non-expired messages for a team in insertion order.
   * Expired rows are deleted first; returned rows are removed from the table.
   */
  drain(team: string): unknown[] {
    const cutoff = Date.now() - this.ttlMs;

    // Purge expired messages before delivering
    this.db.prepare('DELETE FROM messages WHERE team = ? AND created_at < ?').run(team, cutoff);

    const rows = this.db
      .prepare('SELECT payload FROM messages WHERE team = ? ORDER BY created_at ASC')
      .all(team) as { payload: string }[];

    // Remove delivered rows
    this.db.prepare('DELETE FROM messages WHERE team = ?').run(team);

    return rows.map((r) => JSON.parse(r.payload) as unknown);
  }

  /** Total number of queued messages across all teams. */
  depth(): number {
    const row = this.db.prepare('SELECT COUNT(*) AS n FROM messages').get() as
      | { n: number }
      | undefined;
    return row?.n ?? 0;
  }

  /** Close the underlying SQLite connection (triggers WAL checkpoint). */
  close(): void {
    this.db.close();
  }
}
