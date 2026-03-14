// (*CD:Kerckhoffs*)
// Registry test helpers: temp directories, fake registry entries.

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface RegistryEntry {
  team: string;
  socketPath: string;
  lastSeen: number;
  pid: number;
}

/**
 * Create a temp directory for registry tests and return its path.
 * Caller must call cleanup() when done.
 */
export function createTempRegistry(): { dir: string; registryPath: string; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'comms-registry-test-'));
  const registryPath = path.join(dir, 'registry.json');
  return {
    dir,
    registryPath,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

/**
 * Write a registry file with the given entries.
 */
export function writeRegistry(registryPath: string, entries: RegistryEntry[]): void {
  fs.writeFileSync(registryPath, JSON.stringify(entries, null, 2), 'utf8');
}

/**
 * Read the registry file and parse it.
 */
export function readRegistry(registryPath: string): RegistryEntry[] {
  const raw = fs.readFileSync(registryPath, 'utf8');
  return JSON.parse(raw) as RegistryEntry[];
}

/**
 * Build a fake registry entry.
 */
export function makeEntry(overrides: Partial<RegistryEntry> = {}): RegistryEntry {
  return {
    team: 'test-team',
    socketPath: '/shared/comms/test-team.sock',
    lastSeen: Date.now(),
    pid: process.pid,
    ...overrides,
  };
}

/**
 * Build a stale registry entry (lastSeen > 120s ago).
 */
export function makeStaleEntry(overrides: Partial<RegistryEntry> = {}): RegistryEntry {
  return makeEntry({ lastSeen: Date.now() - 125_000, ...overrides });
}
