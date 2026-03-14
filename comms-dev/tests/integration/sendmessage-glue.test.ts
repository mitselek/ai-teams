// (*CD:Kerckhoffs*)
// TDD — RED phase. Tests for the SendMessage integration glue.
//
// Contract: InboxWatcher polls the file-based inbox and surfaces each new
// message to a handler (the agent framework's SendMessage bridge).
// Files are consumed (deleted) after successful dispatch.
//
// Expected module: src/integration/inbox-watcher.ts
// Expected export: class InboxWatcher

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { buildMessage } from '../../src/broker/message-builder.js';
import type { Message } from '../../src/types.js';

// The module under test — does not exist yet (RED).
// Babbage will implement it at src/integration/inbox-watcher.ts
import { InboxWatcher } from '../../src/integration/inbox-watcher.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FROM = { team: 'framework-research', agent: 'herald' };
const TO   = { team: 'comms-dev', agent: 'team-lead' };

function makeMessage(body = 'hello'): Message {
  return buildMessage({ from: FROM, to: TO, type: 'query', body });
}

/** Write a message JSON file directly into an inbox dir (simulates broker delivery). */
function writeInboxFile(inboxDir: string, msg: Message): string {
  fs.mkdirSync(inboxDir, { recursive: true });
  const filePath = path.join(inboxDir, `${msg.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(msg, null, 2), 'utf8');
  return filePath;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let tmpDir: string;
let inboxDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'comms-glue-test-'));
  inboxDir = path.join(tmpDir, 'comms-dev', 'inboxes');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('InboxWatcher — construction', () => {
  it('constructs without throwing', () => {
    expect(() => new InboxWatcher({
      teamName: 'comms-dev',
      baseDir: tmpDir,
      onMessage: async () => {},
    })).not.toThrow();
  });

  it('is not polling before start() is called', async () => {
    const handler = vi.fn();
    const msg = makeMessage();
    writeInboxFile(inboxDir, msg);

    new InboxWatcher({ teamName: 'comms-dev', baseDir: tmpDir, onMessage: handler });
    await new Promise(r => setTimeout(r, 100));

    expect(handler).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Polling and dispatch
// ---------------------------------------------------------------------------

describe('InboxWatcher — polling and dispatch', () => {
  it('calls onMessage with the parsed Message when a file appears in inbox', async () => {
    const received: Message[] = [];
    const watcher = new InboxWatcher({
      teamName: 'comms-dev',
      baseDir: tmpDir,
      onMessage: async (msg) => { received.push(msg); },
      pollIntervalMs: 50,
    });

    watcher.start();
    try {
      const msg = makeMessage('dispatch me');
      writeInboxFile(inboxDir, msg);

      await new Promise(r => setTimeout(r, 200));
      expect(received).toHaveLength(1);
      expect(received[0].id).toBe(msg.id);
      expect(received[0].body).toBe('dispatch me');
    } finally {
      watcher.stop();
    }
  });

  it('consumes (deletes) the inbox file after successful dispatch', async () => {
    const watcher = new InboxWatcher({
      teamName: 'comms-dev',
      baseDir: tmpDir,
      onMessage: async () => {},
      pollIntervalMs: 50,
    });

    watcher.start();
    try {
      const msg = makeMessage();
      const filePath = writeInboxFile(inboxDir, msg);

      await new Promise(r => setTimeout(r, 200));
      expect(fs.existsSync(filePath)).toBe(false);
    } finally {
      watcher.stop();
    }
  });

  it('dispatches multiple messages delivered before first poll', async () => {
    const received: Message[] = [];
    const msgs = ['one', 'two', 'three'].map(makeMessage);
    msgs.forEach(m => writeInboxFile(inboxDir, m));

    const watcher = new InboxWatcher({
      teamName: 'comms-dev',
      baseDir: tmpDir,
      onMessage: async (msg) => { received.push(msg); },
      pollIntervalMs: 50,
    });
    watcher.start();
    try {
      await new Promise(r => setTimeout(r, 300));
      expect(received).toHaveLength(3);
    } finally {
      watcher.stop();
    }
  });

  it('dispatches messages that arrive after watcher has already started', async () => {
    const received: Message[] = [];
    const watcher = new InboxWatcher({
      teamName: 'comms-dev',
      baseDir: tmpDir,
      onMessage: async (msg) => { received.push(msg); },
      pollIntervalMs: 50,
    });
    watcher.start();
    try {
      await new Promise(r => setTimeout(r, 80));
      expect(received).toHaveLength(0);

      writeInboxFile(inboxDir, makeMessage('late arrival'));
      await new Promise(r => setTimeout(r, 200));
      expect(received).toHaveLength(1);
      expect(received[0].body).toBe('late arrival');
    } finally {
      watcher.stop();
    }
  });

  it('does not dispatch the same message twice (no double-processing)', async () => {
    const received: Message[] = [];
    const msg = makeMessage('once only');
    writeInboxFile(inboxDir, msg);

    const watcher = new InboxWatcher({
      teamName: 'comms-dev',
      baseDir: tmpDir,
      onMessage: async (m) => { received.push(m); },
      pollIntervalMs: 50,
    });
    watcher.start();
    try {
      await new Promise(r => setTimeout(r, 300)); // 6 poll cycles
      expect(received).toHaveLength(1);
    } finally {
      watcher.stop();
    }
  });
});

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

describe('InboxWatcher — lifecycle', () => {
  it('stop() prevents further dispatch after being called', async () => {
    const received: Message[] = [];
    const watcher = new InboxWatcher({
      teamName: 'comms-dev',
      baseDir: tmpDir,
      onMessage: async (msg) => { received.push(msg); },
      pollIntervalMs: 50,
    });

    watcher.start();
    watcher.stop();

    writeInboxFile(inboxDir, makeMessage('should not arrive'));
    await new Promise(r => setTimeout(r, 200));
    expect(received).toHaveLength(0);
  });

  it('start() after stop() resumes polling', async () => {
    const received: Message[] = [];
    const watcher = new InboxWatcher({
      teamName: 'comms-dev',
      baseDir: tmpDir,
      onMessage: async (msg) => { received.push(msg); },
      pollIntervalMs: 50,
    });

    watcher.start();
    watcher.stop();

    // Write a message while stopped
    writeInboxFile(inboxDir, makeMessage('after restart'));

    // Restart
    watcher.start();
    await new Promise(r => setTimeout(r, 200));
    expect(received).toHaveLength(1);
    watcher.stop();
  });

  it('works when inbox directory does not exist yet at start()', async () => {
    // inboxDir hasn't been created — watcher should handle gracefully
    const received: Message[] = [];
    const watcher = new InboxWatcher({
      teamName: 'comms-dev',
      baseDir: tmpDir,
      onMessage: async (msg) => { received.push(msg); },
      pollIntervalMs: 50,
    });
    watcher.start();
    try {
      // Create the dir and drop a file after watcher is already running
      await new Promise(r => setTimeout(r, 80));
      writeInboxFile(inboxDir, makeMessage('created late'));
      await new Promise(r => setTimeout(r, 200));
      expect(received).toHaveLength(1);
    } finally {
      watcher.stop();
    }
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('InboxWatcher — error handling', () => {
  it('does not crash if onMessage handler throws — continues polling', async () => {
    // When onMessage throws, the file is LEFT in place for retry.
    // The watcher must not crash and must process subsequent messages.
    let callCount = 0;
    const received: Message[] = [];

    const watcher = new InboxWatcher({
      teamName: 'comms-dev',
      baseDir: tmpDir,
      onMessage: async (msg) => {
        callCount++;
        if (callCount === 1) throw new Error('handler exploded');
        received.push(msg);
      },
      pollIntervalMs: 50,
    });
    watcher.start();
    try {
      writeInboxFile(inboxDir, makeMessage('retried after throw'));
      await new Promise(r => setTimeout(r, 200)); // enough for retry to succeed

      // Message was retried — now dispatched successfully on second attempt
      expect(callCount).toBeGreaterThanOrEqual(2);
      expect(received).toHaveLength(1);
      expect(received[0].body).toBe('retried after throw');
    } finally {
      watcher.stop();
    }
  });

  it('file survives when onMessage throws — not lost on transient failure', async () => {
    let threw = false;
    const received: Message[] = [];
    const msg = makeMessage('survives failure');
    writeInboxFile(inboxDir, msg);

    const watcher = new InboxWatcher({
      teamName: 'comms-dev',
      baseDir: tmpDir,
      onMessage: async (m) => {
        if (!threw) {
          threw = true;
          throw new Error('transient failure');
        }
        received.push(m);
      },
      pollIntervalMs: 50,
    });
    watcher.start();
    try {
      await new Promise(r => setTimeout(r, 200));
      // File was retried and eventually delivered
      expect(received).toHaveLength(1);
      expect(received[0].id).toBe(msg.id);
    } finally {
      watcher.stop();
    }
  });

  it('skips and removes malformed JSON files without crashing', async () => {
    const received: Message[] = [];
    fs.mkdirSync(inboxDir, { recursive: true });
    fs.writeFileSync(path.join(inboxDir, 'corrupt.json'), 'not-json', 'utf8');

    const watcher = new InboxWatcher({
      teamName: 'comms-dev',
      baseDir: tmpDir,
      onMessage: async (msg) => { received.push(msg); },
      pollIntervalMs: 50,
    });
    watcher.start();
    try {
      await new Promise(r => setTimeout(r, 200));
      // Malformed file should be gone (consumed/skipped) and no crash
      expect(received).toHaveLength(0);
      expect(fs.existsSync(path.join(inboxDir, 'corrupt.json'))).toBe(false);
    } finally {
      watcher.stop();
    }
  });
});
