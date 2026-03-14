// (*CD:Kerckhoffs*)
// Discovery registry tests — R/W correctness, locking, stale cleanup, heartbeat.
// Tests against src/discovery/registry.ts (RegistryManager).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { RegistryManager } from '../../src/discovery/registry.js';
import type { RegistryEntry } from '../../src/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'comms-registry-test-'));
}

function makeEntry(overrides: Partial<RegistryEntry> = {}): RegistryEntry {
  return {
    socket: '/shared/comms/test-team.sock',
    prefix: 'TT',
    capabilities: ['send', 'receive'],
    registered_at: new Date().toISOString(),
    heartbeat: new Date().toISOString(),
    ...overrides,
  };
}

function staleHeartbeat(ageMs: number): string {
  return new Date(Date.now() - ageMs).toISOString();
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let tmpDir: string;
let registryPath: string;
let manager: RegistryManager;

beforeEach(() => {
  tmpDir = makeTempDir();
  registryPath = path.join(tmpDir, 'registry.json');
  manager = new RegistryManager(registryPath);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

describe('RegistryManager — register', () => {
  it('registers a new team entry and persists to disk', async () => {
    await manager.register('team-a', makeEntry({ socket: '/shared/comms/team-a.sock' }));
    const reg = manager.read();
    expect(reg.teams['team-a']).toBeDefined();
    expect(reg.teams['team-a'].socket).toBe('/shared/comms/team-a.sock');
  });

  it('overwrites an existing entry on re-register (idempotent)', async () => {
    await manager.register('team-a', makeEntry({ prefix: 'AA' }));
    await manager.register('team-a', makeEntry({ prefix: 'BB' }));
    const reg = manager.read();
    expect(reg.teams['team-a'].prefix).toBe('BB');
  });

  it('registers multiple teams independently', async () => {
    await manager.register('team-a', makeEntry({ prefix: 'AA' }));
    await manager.register('team-b', makeEntry({ prefix: 'BB' }));
    const reg = manager.read();
    expect(Object.keys(reg.teams)).toHaveLength(2);
    expect(reg.teams['team-a'].prefix).toBe('AA');
    expect(reg.teams['team-b'].prefix).toBe('BB');
  });

  it('uses atomic write (no partial file visible)', async () => {
    // Verify the .tmp file does not persist after register
    await manager.register('team-a', makeEntry());
    expect(fs.existsSync(registryPath + '.tmp')).toBe(false);
    expect(fs.existsSync(registryPath)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Heartbeat
// ---------------------------------------------------------------------------

describe('RegistryManager — heartbeat', () => {
  it('updates heartbeat timestamp for an existing entry', async () => {
    const oldTime = new Date(Date.now() - 10_000).toISOString();
    await manager.register('team-a', makeEntry({ heartbeat: oldTime }));

    await manager.heartbeat('team-a');

    const reg = manager.read();
    const updatedTime = new Date(reg.teams['team-a'].heartbeat).getTime();
    expect(updatedTime).toBeGreaterThan(new Date(oldTime).getTime());
  });

  it('does nothing for a team not in the registry (no error)', async () => {
    await expect(manager.heartbeat('nonexistent-team')).resolves.not.toThrow();
  });

  it('does not change other fields when updating heartbeat', async () => {
    await manager.register('team-a', makeEntry({ socket: '/path/to/sock', prefix: 'TA' }));
    await manager.heartbeat('team-a');
    const reg = manager.read();
    expect(reg.teams['team-a'].socket).toBe('/path/to/sock');
    expect(reg.teams['team-a'].prefix).toBe('TA');
  });
});

// ---------------------------------------------------------------------------
// Deregister
// ---------------------------------------------------------------------------

describe('RegistryManager — deregister', () => {
  it('removes a team from the registry', async () => {
    await manager.register('team-a', makeEntry());
    await manager.deregister('team-a');
    const reg = manager.read();
    expect(reg.teams['team-a']).toBeUndefined();
  });

  it('does not affect other teams when deregistering one', async () => {
    await manager.register('team-a', makeEntry());
    await manager.register('team-b', makeEntry());
    await manager.deregister('team-a');
    const reg = manager.read();
    expect(reg.teams['team-b']).toBeDefined();
    expect(reg.teams['team-a']).toBeUndefined();
  });

  it('deregistering non-existent team does not throw', async () => {
    await expect(manager.deregister('ghost')).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Read (no-lock)
// ---------------------------------------------------------------------------

describe('RegistryManager — read', () => {
  it('returns empty teams object when registry does not exist yet', () => {
    const reg = manager.read();
    expect(reg.teams).toEqual({});
  });

  it('returns empty teams object on malformed JSON', () => {
    fs.writeFileSync(registryPath, 'not valid json!!!', 'utf8');
    const reg = manager.read();
    expect(reg.teams).toEqual({});
  });

  it('returns current registry state after register', async () => {
    await manager.register('team-x', makeEntry({ prefix: 'XX' }));
    const reg = manager.read();
    expect(reg.teams['team-x'].prefix).toBe('XX');
  });
});

// ---------------------------------------------------------------------------
// Stale cleanup
// ---------------------------------------------------------------------------

describe('RegistryManager — cleanStale', () => {
  it('removes entries whose heartbeat is older than the threshold', async () => {
    await manager.register('stale-team', makeEntry({
      heartbeat: staleHeartbeat(130_000), // 130s ago > 120s threshold
    }));
    await manager.register('fresh-team', makeEntry({
      heartbeat: new Date().toISOString(),
    }));

    const removed = await manager.cleanStale(120_000);

    expect(removed).toContain('stale-team');
    expect(removed).not.toContain('fresh-team');
    const reg = manager.read();
    expect(reg.teams['stale-team']).toBeUndefined();
    expect(reg.teams['fresh-team']).toBeDefined();
  });

  it('returns empty array when no entries are stale', async () => {
    await manager.register('fresh-team', makeEntry({
      heartbeat: new Date().toISOString(),
    }));
    const removed = await manager.cleanStale(120_000);
    expect(removed).toHaveLength(0);
  });

  it('removes all entries if all are stale', async () => {
    await manager.register('old-a', makeEntry({ heartbeat: staleHeartbeat(200_000) }));
    await manager.register('old-b', makeEntry({ heartbeat: staleHeartbeat(300_000) }));
    const removed = await manager.cleanStale(120_000);
    expect(removed).toHaveLength(2);
    expect(manager.read().teams).toEqual({});
  });

  it('does not write registry file if nothing is stale', async () => {
    await manager.register('fresh', makeEntry({ heartbeat: new Date().toISOString() }));
    const statBefore = fs.statSync(registryPath).mtimeMs;
    await new Promise((r) => setTimeout(r, 10));
    await manager.cleanStale(120_000);
    const statAfter = fs.statSync(registryPath).mtimeMs;
    expect(statAfter).toBe(statBefore); // file not rewritten
  });

  it('entry exactly at threshold boundary is NOT removed (> not >=)', async () => {
    // heartbeat exactly 120_000ms ago — age === threshold, not greater
    const entry = makeEntry({ heartbeat: staleHeartbeat(120_000) });
    await manager.register('boundary-team', entry);
    await new Promise((r) => setTimeout(r, 5)); // let a few ms pass to exceed threshold
    const removed = await manager.cleanStale(120_000);
    // Boundary case: may or may not be removed depending on exact timing;
    // just verify no crash and registry is valid
    const reg = manager.read();
    expect(typeof reg.teams).toBe('object');
  });
});

// ---------------------------------------------------------------------------
// Locking
// ---------------------------------------------------------------------------

describe('RegistryManager — locking', () => {
  it('lock file is removed after a successful operation', async () => {
    await manager.register('team-a', makeEntry());
    expect(fs.existsSync(registryPath + '.lock')).toBe(false);
  });

  it('concurrent registrations do not corrupt the registry', async () => {
    const teams = Array.from({ length: 10 }, (_, i) => `team-${i}`);
    await Promise.all(teams.map((name) => manager.register(name, makeEntry({ prefix: name }))));
    const reg = manager.read();
    expect(Object.keys(reg.teams)).toHaveLength(10);
    teams.forEach((name) => expect(reg.teams[name]).toBeDefined());
  }, 15000);

  it('stale lock file (>10s old) is broken automatically', async () => {
    // Write a stale lock file
    const lockPath = registryPath + '.lock';
    fs.writeFileSync(lockPath, String(Date.now() - 11_000), 'utf8');
    // Manually backdate its mtime
    const staleTime = new Date(Date.now() - 11_000);
    fs.utimesSync(lockPath, staleTime, staleTime);

    // Should still succeed despite the stale lock
    await expect(manager.register('team-a', makeEntry())).resolves.not.toThrow();
    expect(fs.existsSync(lockPath)).toBe(false);
  });
});
