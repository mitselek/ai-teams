// (*CD:Babbage*)
// Registry management — reads and writes registry.json on the shared volume.
// Uses a .lock sentinel file for advisory file locking (no external deps).
// Spec: 60s heartbeat interval, 120s stale threshold, file-locked writes.

import fs from 'fs';
import path from 'path';
import type { Registry, RegistryEntry } from '../types.js';

const LOCK_RETRY_INTERVAL_MS = 50;
const LOCK_MAX_WAIT_MS = 5_000;
const LOCK_MAX_AGE_MS = 10_000; // Treat locks older than 10s as stale

export class RegistryManager {
  private readonly registryPath: string;
  private readonly lockPath: string;

  constructor(registryPath: string) {
    this.registryPath = registryPath;
    this.lockPath = registryPath + '.lock';
  }

  /** Register this team or update its heartbeat. Writes atomically via lock. */
  async register(teamName: string, entry: RegistryEntry): Promise<void> {
    await this.withLock(async () => {
      const registry = this.readRegistry();
      registry.teams[teamName] = entry;
      this.writeRegistry(registry);
    });
  }

  /** Update just the heartbeat timestamp for an existing team entry. */
  async heartbeat(teamName: string): Promise<void> {
    await this.withLock(async () => {
      const registry = this.readRegistry();
      if (registry.teams[teamName]) {
        registry.teams[teamName].heartbeat = new Date().toISOString();
        this.writeRegistry(registry);
      }
    });
  }

  /** Remove a team from the registry (called on clean shutdown). */
  async deregister(teamName: string): Promise<void> {
    await this.withLock(async () => {
      const registry = this.readRegistry();
      delete registry.teams[teamName];
      this.writeRegistry(registry);
    });
  }

  /** Read the registry without locking (safe for reads — at worst stale). */
  read(): Registry {
    return this.readRegistry();
  }

  /**
   * Remove stale entries — teams whose heartbeat is older than staleThreshold.
   * Called periodically by the broker.
   */
  async cleanStale(staleThresholdMs: number): Promise<string[]> {
    const removed: string[] = [];
    await this.withLock(async () => {
      const registry = this.readRegistry();
      const now = Date.now();
      for (const [name, entry] of Object.entries(registry.teams)) {
        const age = now - new Date(entry.heartbeat).getTime();
        if (age > staleThresholdMs) {
          delete registry.teams[name];
          removed.push(name);
        }
      }
      if (removed.length > 0) {
        this.writeRegistry(registry);
      }
    });
    return removed;
  }

  private readRegistry(): Registry {
    try {
      const raw = fs.readFileSync(this.registryPath, 'utf8');
      return JSON.parse(raw) as Registry;
    } catch {
      // File doesn't exist yet or is corrupted — start fresh
      return { teams: {} };
    }
  }

  private writeRegistry(registry: Registry): void {
    // Atomic write: write to .tmp then rename (rename is atomic on POSIX)
    const tmpPath = this.registryPath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(registry, null, 2), 'utf8');
    fs.renameSync(tmpPath, this.registryPath);
  }

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquireLock();
    try {
      return await fn();
    } finally {
      this.releaseLock();
    }
  }

  private async acquireLock(): Promise<void> {
    const start = Date.now();
    while (true) {
      try {
        // O_EXCL: fails if file exists — atomic test-and-set
        const fd = fs.openSync(this.lockPath, 'wx');
        fs.writeSync(fd, String(Date.now()));
        fs.closeSync(fd);
        return; // Lock acquired
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;

        // Check if the existing lock is stale (holder crashed)
        try {
          const stat = fs.statSync(this.lockPath);
          if (Date.now() - stat.mtimeMs > LOCK_MAX_AGE_MS) {
            fs.unlinkSync(this.lockPath);
            continue; // Retry immediately after removing stale lock
          }
        } catch {
          // Lock file disappeared between EEXIST and stat — retry
          continue;
        }

        if (Date.now() - start > LOCK_MAX_WAIT_MS) {
          throw new Error(`Registry lock timeout after ${LOCK_MAX_WAIT_MS}ms`);
        }
        await sleep(LOCK_RETRY_INTERVAL_MS);
      }
    }
  }

  private releaseLock(): void {
    try {
      fs.unlinkSync(this.lockPath);
    } catch {
      // Lock already gone — non-fatal
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
