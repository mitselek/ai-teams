// (*CD:Kerckhoffs*)
// Tests for comms-watch CLI — issue #25: remove redundant --consume flag.
//
// SendMessageBridge is the production inbox consumer. comms-watch must be
// read-only so it is safe to run alongside the broker without racing.
//
// Test categories:
//   1. Read-only behaviour (no --consume) — files survive after watch
//   2. --consume flag rejected [RED]:
//      a. Process exits non-zero (currently: killed by timeout, status null)
//      b. Stderr contains no "will be deleted" message (currently: it does)
//      c. Files NOT deleted even when --consume is passed (currently: they ARE)
//
// Subprocess approach: comms-watch has no exported functions; all tests spawn
// it as a subprocess. The process loops indefinitely (--no-follow is not
// supported by the current parseArgs config), so tests use spawnSync timeout.
//
// Read-only tests: process is killed by timeout (status null) — that's fine,
// we only care that files survive.
//
// --consume RED tests: after fix, parseArgs rejects the unknown/removed option
// immediately (status 1) before entering the loop. Before fix: process loops
// and is killed by timeout (status null) having already deleted files.
//
// Ref: issue #25

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync, rmSync, writeFileSync, existsSync, readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Message } from '../../src/types.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TSX      = resolve('node_modules/.bin/tsx');
const WATCH_CLI = resolve('src/cli/comms-watch.ts');
const TEAM     = 'watch-test-team';

/** Milliseconds to let the process run one poll cycle before killing it. */
const POLL_WAIT_MS = 1200;

function makeMsg(id: string): Message {
  return {
    version:   '1',
    id,
    timestamp: new Date().toISOString(),
    from:      { team: 'framework-research', agent: 'herald' },
    to:        { team: TEAM, agent: 'babbage' },
    type:      'query',
    priority:  'normal',
    reply_to:  null,
    body:      `Test message ${id}`,
    checksum:  'sha256:test',
  };
}

function writeMsg(inboxDir: string, id: string): string {
  const fp = join(inboxDir, `${id}.json`);
  writeFileSync(fp, JSON.stringify(makeMsg(id), null, 2), 'utf8');
  return fp;
}

/**
 * Spawn comms-watch synchronously.
 * Uses spawnSync timeout to kill the process after POLL_WAIT_MS if it doesn't
 * exit on its own (normal case for the follow loop; fast-exit for error cases).
 */
function runWatch(
  baseDir: string,
  extraArgs: string[] = [],
  timeoutMs = POLL_WAIT_MS,
): ReturnType<typeof spawnSync> {
  return spawnSync(
    TSX,
    [WATCH_CLI, '--base-dir', baseDir, ...extraArgs],
    {
      env:      { ...process.env, COMMS_TEAM_NAME: TEAM },
      encoding: 'utf8',
      timeout:  timeoutMs,
    },
  );
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

let baseDir: string;
let inboxDir: string;

beforeEach(() => {
  baseDir  = join(tmpdir(), `cw-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  inboxDir = join(baseDir, TEAM, 'inboxes');
  mkdirSync(inboxDir, { recursive: true });
});

afterEach(() => {
  rmSync(baseDir, { recursive: true, force: true });
});

// ── 1. Read-only behaviour (no --consume) ─────────────────────────────────────
//
// These should all be GREEN — comms-watch without --consume never calls unlink.

describe('comms-watch — read-only (no --consume flag)', () => {

  it('does NOT delete inbox files when run without --consume', () => {
    const fp1 = writeMsg(inboxDir, 'read-only-001');
    const fp2 = writeMsg(inboxDir, 'read-only-002');
    const fp3 = writeMsg(inboxDir, 'read-only-003');

    runWatch(baseDir); // killed by timeout after POLL_WAIT_MS

    // All files must survive — comms-watch is read-only without --consume
    expect(existsSync(fp1)).toBe(true);
    expect(existsSync(fp2)).toBe(true);
    expect(existsSync(fp3)).toBe(true);
  });

  it('inbox file count is unchanged after read-only watch', () => {
    writeMsg(inboxDir, 'count-001');
    writeMsg(inboxDir, 'count-002');
    writeMsg(inboxDir, 'count-003');
    const before = readdirSync(inboxDir).length;

    runWatch(baseDir);

    expect(readdirSync(inboxDir).length).toBe(before);
  });

  it('is safe to run concurrently: two read-only watchers leave files intact', () => {
    // Structural guarantee: without --consume, comms-watch never calls unlink.
    // Two concurrent read-only watchers cannot race on the same files.
    writeMsg(inboxDir, 'concurrent-001');
    writeMsg(inboxDir, 'concurrent-002');

    runWatch(baseDir); // first watcher (synchronous — these are sequential here)
    runWatch(baseDir); // second watcher

    expect(existsSync(join(inboxDir, 'concurrent-001.json'))).toBe(true);
    expect(existsSync(join(inboxDir, 'concurrent-002.json'))).toBe(true);
  });

  it('prints messages to stdout in json format', () => {
    writeMsg(inboxDir, 'print-001');
    const result = runWatch(baseDir, ['--format', 'json']);

    const stdout = result.stdout as string;
    const lines = stdout.trim().split('\n').filter(l => l.trim().startsWith('{'));
    expect(lines.length).toBeGreaterThan(0);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.id).toBe('print-001');
    // file still exists
    expect(existsSync(join(inboxDir, 'print-001.json'))).toBe(true);
  });

  it('stderr does NOT mention consume/delete in read-only mode', () => {
    writeMsg(inboxDir, 'no-delete-mention-001');
    const result = runWatch(baseDir);
    const stderr = result.stderr as string;

    expect(stderr).not.toMatch(/consume mode/i);
    expect(stderr).not.toMatch(/will be deleted/i);
  });
});

// ── 2. --consume flag rejected [RED — Lovelace to fix] ───────────────────────
//
// Current (RED) state:
//   - --consume IS accepted by parseArgs
//   - Process prints "Consume mode: messages will be deleted after display"
//   - Files ARE deleted during the first pass
//   - Process then enters infinite follow-loop, killed by spawnSync timeout
//   - result.status === null (killed by signal, not a clean exit)
//
// After fix (GREEN) state:
//   - --consume is rejected (unknown option OR explicit fatal())
//   - Process exits immediately with status 1
//   - result.status === 1
//   - Files are NOT deleted

describe('comms-watch — --consume flag rejected', () => {

  it('--consume: process exits with non-zero status (not killed by timeout)', () => {
    // RED: process loops (--consume accepted), killed by timeout → status null
    // GREEN: parseArgs rejects --consume immediately → status 1
    const result = runWatch(baseDir, ['--consume'], 3000);

    // null means the process was still running and had to be force-killed —
    // that means --consume was accepted (RED). After fix: status should be 1.
    expect(result.status).toBe(1);
  });

  it('--consume: stderr contains rejection message, not "will be deleted"', () => {
    // RED: stderr says "Consume mode: messages will be deleted after display"
    // GREEN: stderr contains parse error or explicit removal notice
    const result = runWatch(baseDir, ['--consume'], 3000);
    const stderr = result.stderr as string;

    expect(stderr).not.toMatch(/consume mode/i);
    expect(stderr).not.toMatch(/will be deleted/i);
  });

  it('--consume: inbox files are NOT deleted', () => {
    // RED: --consume deletes files during first pass before the loop
    // GREEN: process errors out before touching any files
    const fp1 = writeMsg(inboxDir, 'consume-guard-001');
    const fp2 = writeMsg(inboxDir, 'consume-guard-002');

    runWatch(baseDir, ['--consume'], 3000);

    expect(existsSync(fp1)).toBe(true);
    expect(existsSync(fp2)).toBe(true);
  });
});
