// (*CD:Kerckhoffs*)
// TDD — Tests for SendMessageBridge seen-set bounding (task #25).
//
// Bug: the `seen` Set in SendMessageBridge grows unboundedly. Paths are added
// on first encounter but only removed on successful delivery. Failed deliveries
// (e.g. malformed framework inbox dir) leave paths in `seen` forever.
//
// Required fix: cap `seen` at a configurable max size (default ≤ 1000 entries).
// When the cap is reached, oldest entries are evicted to make room.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { SendMessageBridge } from '../../src/broker/sendmessage-bridge.js';
import { buildMessage } from '../../src/broker/message-builder.js';
import type { Message } from '../../src/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FROM = { team: 'framework-research', agent: 'herald' };
const TO   = { team: 'comms-dev', agent: 'team-lead' };

function makeMessage(body = 'hello'): Message {
  return buildMessage({ from: FROM, to: TO, type: 'query', body });
}

function writeInboxFile(dir: string, msg: Message): string {
  fs.mkdirSync(dir, { recursive: true });
  const fp = path.join(dir, `${msg.id}.json`);
  fs.writeFileSync(fp, JSON.stringify(msg, null, 2), 'utf8');
  return fp;
}

function makeBridge(brokerInboxDir: string, frameworkInboxDir: string, extra: Partial<ConstructorParameters<typeof SendMessageBridge>[0]> = {}) {
  return new SendMessageBridge({
    teamName: 'comms-dev',
    brokerInboxDir,
    frameworkInboxDir,
    onError: () => {},
    ...extra,
  });
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let tmpDir: string;
let brokerInboxDir: string;
let frameworkInboxDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'comms-bridge-test-'));
  brokerInboxDir = path.join(tmpDir, 'broker-inbox');
  frameworkInboxDir = path.join(tmpDir, 'fw-inbox');
  fs.mkdirSync(brokerInboxDir, { recursive: true });
  fs.mkdirSync(frameworkInboxDir, { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Seen-set bounding
// ---------------------------------------------------------------------------

describe('SendMessageBridge — seen set bounding', () => {
  it('seenSize() returns 0 before any messages are processed', () => {
    const bridge = makeBridge(brokerInboxDir, frameworkInboxDir);
    expect(bridge.seenSize()).toBe(0);
  });

  it('seenSize() increments as messages are processed', async () => {
    const bridge = makeBridge(brokerInboxDir, frameworkInboxDir);
    bridge.start();
    try {
      const msg = makeMessage();
      writeInboxFile(brokerInboxDir, msg);
      await new Promise(r => setTimeout(r, 700));
      // After successful delivery the path is removed from seen — size back to 0
      expect(bridge.seenSize()).toBe(0);
    } finally {
      bridge.stop();
    }
  });

  it('seen set does not grow beyond maxSeenSize when delivery keeps failing', async () => {
    // Use an unwritable framework inbox dir to force repeated delivery failures
    const badFrameworkDir = path.join(tmpDir, 'nonexistent', 'deeply', 'nested');

    const bridge = makeBridge(brokerInboxDir, badFrameworkDir, { maxSeenSize: 10 });
    bridge.start();
    try {
      // Write 20 messages — all deliveries will fail (bad frameworkDir)
      for (let i = 0; i < 20; i++) {
        writeInboxFile(brokerInboxDir, makeMessage(`msg-${i}`));
      }
      await new Promise(r => setTimeout(r, 1200));

      // Seen set must be bounded at maxSeenSize even though none were delivered
      expect(bridge.seenSize()).toBeLessThanOrEqual(10);
    } finally {
      bridge.stop();
    }
  });

  it('evicts oldest entries when seen set reaches maxSeenSize', async () => {
    // Drive the bridge to exactly maxSeenSize entries, then add one more —
    // the oldest entry must be evicted so a fresh file with that path could be reprocessed.
    const badFrameworkDir = path.join(tmpDir, 'bad-fw');
    const MAX = 5;
    const bridge = makeBridge(brokerInboxDir, badFrameworkDir, { maxSeenSize: MAX });
    bridge.start();
    try {
      const msgs: Message[] = [];
      for (let i = 0; i < MAX + 2; i++) {
        const msg = makeMessage(`evict-${i}`);
        msgs.push(msg);
        writeInboxFile(brokerInboxDir, msg);
        await new Promise(r => setTimeout(r, 150)); // give bridge time to pick up each one
      }

      expect(bridge.seenSize()).toBeLessThanOrEqual(MAX);
    } finally {
      bridge.stop();
    }
  });

  it('default maxSeenSize is at most 1000', () => {
    const bridge = makeBridge(brokerInboxDir, frameworkInboxDir);
    expect(bridge.maxSeenSize).toBeLessThanOrEqual(1000);
  });

  it('seen set is cleared on stop()', async () => {
    const badFwDir = path.join(tmpDir, 'bad-fw2');
    const bridge = makeBridge(brokerInboxDir, badFwDir, { maxSeenSize: 100 });
    bridge.start();

    for (let i = 0; i < 5; i++) {
      writeInboxFile(brokerInboxDir, makeMessage(`pre-stop-${i}`));
    }
    await new Promise(r => setTimeout(r, 700));

    bridge.stop();
    expect(bridge.seenSize()).toBe(0);
  });

  it('successful deliveries are removed from seen so the set stays small', async () => {
    const delivered: string[] = [];
    const bridge = makeBridge(brokerInboxDir, frameworkInboxDir, {
      onDelivered: (msg) => delivered.push(msg.id),
    });
    bridge.start();
    try {
      for (let i = 0; i < 10; i++) {
        writeInboxFile(brokerInboxDir, makeMessage(`ok-${i}`));
      }
      await new Promise(r => setTimeout(r, 1500));

      expect(delivered).toHaveLength(10);
      // Successful deliveries delete both the file AND the seen entry
      expect(bridge.seenSize()).toBe(0);
    } finally {
      bridge.stop();
    }
  });
});

// ---------------------------------------------------------------------------
// Delivery correctness (regression — ensure bounding doesn't break happy path)
// ---------------------------------------------------------------------------

describe('SendMessageBridge — delivery correctness', () => {
  it('delivers message to target agent framework inbox', async () => {
    const bridge = makeBridge(brokerInboxDir, frameworkInboxDir);
    bridge.start();
    try {
      const msg = makeMessage('hello agent');
      writeInboxFile(brokerInboxDir, msg);
      await new Promise(r => setTimeout(r, 700));

      const agentInbox = path.join(frameworkInboxDir, 'team-lead.json');
      expect(fs.existsSync(agentInbox)).toBe(true);
      const entries = JSON.parse(fs.readFileSync(agentInbox, 'utf8'));
      expect(entries).toHaveLength(1);
      expect(entries[0].from).toBe('framework-research/herald');
    } finally {
      bridge.stop();
    }
  });

  it('consumes broker file after delivery', async () => {
    const bridge = makeBridge(brokerInboxDir, frameworkInboxDir);
    bridge.start();
    try {
      const msg = makeMessage();
      const fp = writeInboxFile(brokerInboxDir, msg);
      await new Promise(r => setTimeout(r, 700));
      expect(fs.existsSync(fp)).toBe(false);
    } finally {
      bridge.stop();
    }
  });
});
