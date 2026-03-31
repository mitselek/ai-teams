// (*CD:Kerckhoffs*)
// RED tests for story/34: MCP server for Claude Code agents.
//
// Acceptance criteria (Given/When/Then — EN 50716:2023 / CODING_STANDARDS.md):
//
//   AC1 — tool registration:
//     Given: a configured MCP server
//     When:  Claude Code starts it via stdio (tested via InMemoryTransport)
//     Then:  tools/list returns 5 tools: comms_send, comms_inbox, comms_online,
//            comms_reply, comms_status
//
//   AC2 — comms_send:
//     Given: hub is reachable; team-b is subscribed via SSE
//     When:  comms_send called with { to: 'team-b', body: 'hello' }
//     Then:  POST /api/send is made with mTLS; response { ok: true, id: ... }
//
//   AC3 — comms_inbox:
//     Given: team-b sent a message to our MCP team (team-a) via the hub
//     When:  comms_inbox is called
//     Then:  the message appears in the returned content
//
//   AC4 — comms_reply:
//     Given: a message from team-b is buffered in inbox (id: originalId)
//     When:  comms_reply called with { id: originalId, body: 'response' }
//     Then:  a message is sent with reply_to: originalId
//
//   AC5 — comms_online:
//     Given: hub responds to GET /api/online
//     When:  comms_online is called
//     Then:  tool returns the peer list as JSON content
//
//   AC6 — comms_status:
//     Given: SSE subscription is active
//     When:  comms_status is called
//     Then:  response includes { connected: true, unread: N }
//
//   AC7 — SSE reconnection:
//     Given: hub goes down (or was never up)
//     When:  SSESubscriber.start() is called
//     Then:  subscriber.connected === false; comms_status shows connected: false
//
//   AC8 — env var config:
//     Given: COMMS_HUB_URL, COMMS_TLS_CERT, COMMS_TLS_KEY, COMMS_CA_CERT,
//            COMMS_TEAM_NAME are set
//     When:  createMcpFromEnv() is called
//     Then:  returned client uses those credentials
//
//   AC9 — Zod validation:
//     Given: each tool's Zod schema
//     When:  invalid input is provided (missing required fields)
//     Then:  schema.safeParse() returns success: false with a ZodError
//
//   AC10 — one tool per file:
//     Given: tools/ directory
//     When:  each tool file is inspected
//     Then:  tools/send.ts → TOOL_NAME = 'comms_send', etc.
//
// RED state: src/client.ts, src/subscribe.ts, src/tools/*.ts do not exist →
//   import throws ERR_MODULE_NOT_FOUND → all tests fail to collect.
//   src/server.ts exists as placeholder but does not export createMcpServer.
//
// Expected module interface for Lovelace to implement:
//
//   src/client.ts:
//     export class HubClient {
//       constructor(opts: { hubUrl, cert, key, ca, teamName })
//       async send(msg): Promise<{ ok: boolean; id: string; queued?: boolean }>
//       async getOnline(): Promise<OnlineEntry[]>
//       async getHubStatus(): Promise<HubStatusResult>
//       readonly hubUrl: string; readonly teamName: string
//     }
//
//   src/subscribe.ts:
//     export class InboxBuffer {
//       push(msg: unknown): void
//       get messages(): unknown[]
//       get unread(): unknown[]
//       markAllRead(): void
//       get unreadCount(): number
//     }
//     export class SSESubscriber {
//       constructor(hubUrl: string, opts: { cert, key, ca }, inbox: InboxBuffer)
//       start(): void; stop(): void; get connected(): boolean
//       // Reconnects with exponential backoff 1s → 60s cap
//     }
//
//   src/server.ts (replace placeholder):
//     export interface McpOptions { hubUrl, cert, key, ca, teamName }
//     export function createMcpServer(opts: McpOptions):
//       { mcpServer: McpServer; client: HubClient; inbox: InboxBuffer; subscriber: SSESubscriber }
//     export function createMcpFromEnv(): ReturnType<typeof createMcpServer>
//
//   src/tools/send.ts | inbox.ts | online.ts | reply.ts | status.ts:
//     export const TOOL_NAME: string            // e.g. 'comms_send'
//     export const schema: z.ZodObject<...>     // for validation
//     export async function execute(input, deps): Promise<ToolResult>
//     export type ToolDeps = { client: HubClient; inbox: InboxBuffer; teamName: string }
//     export type ToolResult = { content: [{ type: 'text'; text: string }] }
//
// Ref: https://github.com/mitselek/ai-teams/issues/34

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import * as https from 'node:https';
import type { AddressInfo } from 'node:net';
import type { IncomingMessage } from 'node:http';
import { createHash } from 'node:crypto';

// RED: these modules do not exist yet → ERR_MODULE_NOT_FOUND → file fails to collect
import { HubClient } from './client.js';
import { InboxBuffer, SSESubscriber } from './subscribe.js';
import { createMcpServer, createMcpFromEnv } from './server.js';
import * as SendTool from './tools/send.js';
import * as InboxTool from './tools/inbox.js';
import * as OnlineTool from './tools/online.js';
import * as ReplyTool from './tools/reply.js';
import * as StatusTool from './tools/status.js';

// Hub is available cross-package via relative path:
import { createHub } from '../../hub/src/server.js';

// MCP SDK — for AC1 tool registration test
import { Client } from '@modelcontextprotocol/sdk/client';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = (srv.address() as AddressInfo).port;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function genCa(dir: string): void {
  execSync(
    `openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${join(dir, 'ca.key')}" -out "${join(dir, 'ca.crt')}" \
     -days 1 -nodes -subj "/CN=test-ca" 2>/dev/null`,
  );
}

function genSignedCert(dir: string, cn: string, caDir: string): void {
  const csrPath = join(dir, `${cn}.csr`);
  execSync(
    `openssl req -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${join(dir, `${cn}.key`)}" -out "${csrPath}" -nodes \
     -subj "/CN=${cn}" 2>/dev/null`,
  );
  execSync(
    `openssl x509 -req -in "${csrPath}" \
     -CA "${join(caDir, 'ca.crt')}" -CAkey "${join(caDir, 'ca.key')}" \
     -CAcreateserial -out "${join(dir, `${cn}.crt`)}" -days 1 2>/dev/null`,
  );
}

const SKIP_HOSTNAME = { checkServerIdentity: () => undefined } as const;

function httpsPost(
  port: number,
  path: string,
  ca: string,
  clientCert: { cert: string; key: string },
  body: object,
): Promise<{ status: number; body: string }> {
  const bodyStr = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: '127.0.0.1',
        ...SKIP_HOSTNAME,
        port,
        path,
        method: 'POST',
        ca,
        ...clientCert,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      },
      (res: IncomingMessage) => {
        let data = '';
        res.on('data', (chunk: string) => {
          data += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
      },
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function makeMsg(fromTeam: string, toTeam: string, body = 'test-body') {
  const hash = 'sha256:' + createHash('sha256').update(body, 'utf-8').digest('hex');
  return {
    version: '1' as const,
    id: `mcp-test-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    from: { team: fromTeam, agent: 'sender' },
    to: { team: toTeam, agent: 'receiver' },
    type: 'query' as const,
    priority: 'normal' as const,
    reply_to: null,
    body,
    checksum: hash,
  };
}

function settle(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function waitUntil(predicate: () => boolean, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const poll = () => {
      if (predicate()) {
        resolve();
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error(`Condition not met within ${timeoutMs}ms`));
        return;
      }
      setTimeout(poll, 20);
    };
    poll();
  });
}

// ── Shared cert + hub fixture ─────────────────────────────────────────────────

let tmpDir: string;
let caCrt: string;
let hubCrt: string;
let hubKey: string;
let teamACert: { cert: string; key: string }; // MCP team
let teamBCert: { cert: string; key: string }; // remote peer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let hub: any;
let hubPort: number;
let hubUrl: string;

beforeAll(async () => {
  tmpDir = join(tmpdir(), `mcp-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tmpDir, { recursive: true });

  genCa(tmpDir);
  caCrt = read(join(tmpDir, 'ca.crt'));
  for (const cn of ['hub', 'team-a', 'team-b']) {
    genSignedCert(tmpDir, cn, tmpDir);
  }

  hubCrt = read(join(tmpDir, 'hub.crt'));
  hubKey = read(join(tmpDir, 'hub.key'));
  teamACert = { cert: read(join(tmpDir, 'team-a.crt')), key: read(join(tmpDir, 'team-a.key')) };
  teamBCert = { cert: read(join(tmpDir, 'team-b.crt')), key: read(join(tmpDir, 'team-b.key')) };

  hubPort = await getFreePort();
  hubUrl = `https://127.0.0.1:${hubPort}`;

  hub = createHub({
    tls: { ca: caCrt, cert: hubCrt, key: hubKey },
    peers: {
      'team-a': teamACert.cert,
      'team-b': teamBCert.cert,
    },
    logger: false,
  });
  await hub.listen({ port: hubPort, host: '127.0.0.1' });
});

afterAll(async () => {
  await hub?.close?.();
  rmSync(tmpDir, { recursive: true, force: true });
});

// ── AC1 — MCP server registers 5 tools ───────────────────────────────────────

describe('AC1 — createMcpServer registers 5 tools', () => {
  it('tools/list response contains exactly the 5 comms tools', async () => {
    // Connect MCP server to an in-memory client transport to test tool registration
    const { mcpServer } = createMcpServer({
      hubUrl,
      cert: teamACert.cert,
      key: teamACert.key,
      ca: caCrt,
      teamName: 'team-a',
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await mcpServer.connect(serverTransport);

    const client = new Client({ name: 'test-client', version: '0.0.1' });
    await client.connect(clientTransport);

    const { tools } = await client.listTools();
    await client.close();

    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toHaveLength(5);
    expect(toolNames).toContain('comms_send');
    expect(toolNames).toContain('comms_inbox');
    expect(toolNames).toContain('comms_online');
    expect(toolNames).toContain('comms_reply');
    expect(toolNames).toContain('comms_status');
  });
});

// ── AC2 — comms_send POSTs to hub with mTLS ───────────────────────────────────

describe('AC2 — comms_send sends message via hub client', () => {
  it('execute returns { ok: true, id } when message queued for offline team-b', async () => {
    const client = new HubClient({
      hubUrl,
      cert: teamACert.cert,
      key: teamACert.key,
      ca: caCrt,
      teamName: 'team-a',
    });
    const inbox = new InboxBuffer();

    const result = await SendTool.execute(
      { to: 'team-b', body: 'hello from MCP' },
      { client, inbox, teamName: 'team-a' },
    );

    // Result is MCP content format
    const parsed = JSON.parse(result.content[0].text) as { ok: boolean; id: string };
    expect(parsed.ok).toBe(true);
    expect(typeof parsed.id).toBe('string');
  });
});

// ── AC3 — comms_inbox returns buffered messages ───────────────────────────────

describe('AC3 — comms_inbox returns buffered unread messages from SSE', () => {
  it('returns messages received by SSESubscriber from hub', async () => {
    const client = new HubClient({
      hubUrl,
      cert: teamACert.cert,
      key: teamACert.key,
      ca: caCrt,
      teamName: 'team-a',
    });
    const inbox = new InboxBuffer();
    const subscriber = new SSESubscriber(
      hubUrl,
      { cert: teamACert.cert, key: teamACert.key, ca: caCrt },
      inbox,
    );

    subscriber.start();
    await settle(150); // allow SSE to establish

    // team-b sends a message to team-a (our MCP team)
    const sentMsg = makeMsg('team-b', 'team-a', 'inbox-test-body');
    await httpsPost(hubPort, '/api/send', caCrt, teamBCert, sentMsg);

    // Wait for subscriber to receive and buffer it
    await waitUntil(() => inbox.unreadCount > 0, 2000);

    const result = await InboxTool.execute({}, { client, inbox, teamName: 'team-a' });
    subscriber.stop();

    const parsed = JSON.parse(result.content[0].text) as { messages: Array<{ id: string }> };
    expect(parsed.messages.length).toBeGreaterThan(0);
    expect(parsed.messages.some((m) => m.id === sentMsg.id)).toBe(true);
  });
});

// ── AC4 — comms_reply sets reply_to ──────────────────────────────────────────

describe('AC4 — comms_reply sends message with reply_to set to original ID', () => {
  it('message sent via comms_reply has reply_to === originalMsg.id', async () => {
    const client = new HubClient({
      hubUrl,
      cert: teamACert.cert,
      key: teamACert.key,
      ca: caCrt,
      teamName: 'team-a',
    });
    const inbox = new InboxBuffer();
    const subscriber = new SSESubscriber(
      hubUrl,
      { cert: teamACert.cert, key: teamACert.key, ca: caCrt },
      inbox,
    );

    subscriber.start();
    await settle(150);

    // team-b sends a message to team-a
    const originalMsg = makeMsg('team-b', 'team-a', 'reply-target');
    await httpsPost(hubPort, '/api/send', caCrt, teamBCert, originalMsg);
    await waitUntil(() => inbox.unreadCount > 0, 2000);

    // team-b subscribes to receive our reply
    let replyReceived: Record<string, unknown> | null = null;
    const sseBReq = https.request({
      hostname: '127.0.0.1',
      ...SKIP_HOSTNAME,
      port: hubPort,
      path: '/api/subscribe',
      method: 'GET',
      ca: caCrt,
      ...teamBCert,
      headers: { Accept: 'text/event-stream' },
    });
    sseBReq.on('error', () => {});
    sseBReq.on('response', (res: IncomingMessage) => {
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        buf += chunk;
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';
        for (const part of parts) {
          const dataLine = part.split('\n').find((l) => l.startsWith('data:'));
          if (dataLine) {
            try {
              replyReceived = JSON.parse(dataLine.slice(5).trim()) as Record<string, unknown>;
            } catch {
              /* ignore */
            }
          }
        }
      });
    });
    sseBReq.end();
    await settle(80); // allow subscription to register

    // Send reply
    const replyResult = await ReplyTool.execute(
      { id: originalMsg.id, body: 'my reply' },
      { client, inbox, teamName: 'team-a' },
    );
    subscriber.stop();
    // NOTE: keep sseBReq open until after waitUntil — closing it early kills the channel
    // before the reply event can arrive.

    const parsed = JSON.parse(replyResult.content[0].text) as { ok: boolean };
    expect(parsed.ok).toBe(true);

    // Wait specifically for the reply (not the AC2 drain message which has reply_to: null)
    await waitUntil(
      () => (replyReceived as { reply_to?: string } | null)?.reply_to === originalMsg.id,
      2000,
    );
    sseBReq.destroy(); // close only after the reply has been received
    expect((replyReceived as unknown as { reply_to?: string }).reply_to).toBe(originalMsg.id);
  });
});

// ── AC5 — comms_online returns peer list ──────────────────────────────────────

describe('AC5 — comms_online returns GET /api/online peer list', () => {
  it('execute returns JSON content with an array of peers', async () => {
    const client = new HubClient({
      hubUrl,
      cert: teamACert.cert,
      key: teamACert.key,
      ca: caCrt,
      teamName: 'team-a',
    });
    const inbox = new InboxBuffer();

    const result = await OnlineTool.execute({}, { client, inbox, teamName: 'team-a' });

    const parsed = JSON.parse(result.content[0].text) as { peers: unknown[] };
    expect(Array.isArray(parsed.peers)).toBe(true);
  });
});

// ── AC6 — comms_status shows { connected, unread } ───────────────────────────

describe('AC6 — comms_status reports SSE connection state and unread count', () => {
  it('returns { connected: true, unread: N } when subscriber is active', async () => {
    const client = new HubClient({
      hubUrl,
      cert: teamACert.cert,
      key: teamACert.key,
      ca: caCrt,
      teamName: 'team-a',
    });
    const inbox = new InboxBuffer();
    const subscriber = new SSESubscriber(
      hubUrl,
      { cert: teamACert.cert, key: teamACert.key, ca: caCrt },
      inbox,
    );

    subscriber.start();
    await waitUntil(() => subscriber.connected, 2000);

    const result = await StatusTool.execute({}, { client, inbox, subscriber, teamName: 'team-a' });
    subscriber.stop();

    const parsed = JSON.parse(result.content[0].text) as { connected: boolean; unread: number };
    expect(parsed.connected).toBe(true);
    expect(typeof parsed.unread).toBe('number');
  });
});

// ── AC7 — SSE reconnects with exponential backoff ─────────────────────────────

describe('AC7 — SSESubscriber reconnects; comms_status shows disconnected state', () => {
  it('subscriber.connected is false when hub URL is unreachable', async () => {
    const unreachableUrl = 'https://127.0.0.1:1'; // port 1 is always closed
    const inbox = new InboxBuffer();
    const subscriber = new SSESubscriber(
      unreachableUrl,
      { cert: teamACert.cert, key: teamACert.key, ca: caCrt },
      inbox,
    );

    subscriber.start();
    await settle(200); // wait longer than one reconnect attempt

    expect(subscriber.connected).toBe(false);
    subscriber.stop();
  });

  it('comms_status returns { connected: false } when subscriber is not connected', async () => {
    const client = new HubClient({
      hubUrl,
      cert: teamACert.cert,
      key: teamACert.key,
      ca: caCrt,
      teamName: 'team-a',
    });
    const inbox = new InboxBuffer();
    const subscriber = new SSESubscriber(
      'https://127.0.0.1:1',
      { cert: teamACert.cert, key: teamACert.key, ca: caCrt },
      inbox,
    );
    subscriber.start();
    await settle(200);

    const result = await StatusTool.execute({}, { client, inbox, subscriber, teamName: 'team-a' });
    subscriber.stop();

    const parsed = JSON.parse(result.content[0].text) as { connected: boolean };
    expect(parsed.connected).toBe(false);
  });
});

// ── AC8 — env var configuration ───────────────────────────────────────────────

describe('AC8 — createMcpFromEnv() reads hub config from environment variables', () => {
  it('creates a functioning MCP server from COMMS_* env vars', () => {
    const prev = {
      COMMS_HUB_URL: process.env.COMMS_HUB_URL,
      COMMS_TLS_CERT: process.env.COMMS_TLS_CERT,
      COMMS_TLS_KEY: process.env.COMMS_TLS_KEY,
      COMMS_CA_CERT: process.env.COMMS_CA_CERT,
      COMMS_TEAM_NAME: process.env.COMMS_TEAM_NAME,
    };

    process.env.COMMS_HUB_URL = hubUrl;
    process.env.COMMS_TLS_CERT = teamACert.cert;
    process.env.COMMS_TLS_KEY = teamACert.key;
    process.env.COMMS_CA_CERT = caCrt;
    process.env.COMMS_TEAM_NAME = 'team-a';

    let result: ReturnType<typeof createMcpFromEnv> | undefined;
    try {
      result = createMcpFromEnv();
    } finally {
      // Restore env
      for (const [k, v] of Object.entries(prev)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }

    expect(result).toBeDefined();
    expect(result!.client.hubUrl).toBe(hubUrl);
    expect(result!.client.teamName).toBe('team-a');
  });

  it('throws a descriptive error when required env vars are missing', () => {
    const saved = process.env.COMMS_HUB_URL;
    delete process.env.COMMS_HUB_URL;
    try {
      expect(() => createMcpFromEnv()).toThrow(/COMMS_HUB_URL/);
    } finally {
      if (saved !== undefined) process.env.COMMS_HUB_URL = saved;
    }
  });
});

// ── AC9 — Zod input validation ────────────────────────────────────────────────

describe('AC9 — tool schemas reject invalid input with Zod', () => {
  it('comms_send schema rejects missing "to" field', () => {
    const result = SendTool.schema.safeParse({ body: 'hello' });
    expect(result.success).toBe(false);
  });

  it('comms_send schema rejects missing "body" field', () => {
    const result = SendTool.schema.safeParse({ to: 'team-b' });
    expect(result.success).toBe(false);
  });

  it('comms_send schema accepts valid { to, body }', () => {
    const result = SendTool.schema.safeParse({ to: 'team-b', body: 'hello' });
    expect(result.success).toBe(true);
  });

  it('comms_reply schema rejects missing "id" field', () => {
    const result = ReplyTool.schema.safeParse({ body: 'response' });
    expect(result.success).toBe(false);
  });

  it('comms_reply schema rejects missing "body" field', () => {
    const result = ReplyTool.schema.safeParse({ id: 'some-id' });
    expect(result.success).toBe(false);
  });

  it('comms_reply schema accepts valid { id, body }', () => {
    const result = ReplyTool.schema.safeParse({ id: 'msg-123', body: 'my reply' });
    expect(result.success).toBe(true);
  });
});

// ── AC10 — One tool per file ──────────────────────────────────────────────────

describe('AC10 — each tool is in its own file with correct TOOL_NAME', () => {
  it('tools/send.ts exports TOOL_NAME = "comms_send"', () => {
    expect(SendTool.TOOL_NAME).toBe('comms_send');
  });

  it('tools/inbox.ts exports TOOL_NAME = "comms_inbox"', () => {
    expect(InboxTool.TOOL_NAME).toBe('comms_inbox');
  });

  it('tools/online.ts exports TOOL_NAME = "comms_online"', () => {
    expect(OnlineTool.TOOL_NAME).toBe('comms_online');
  });

  it('tools/reply.ts exports TOOL_NAME = "comms_reply"', () => {
    expect(ReplyTool.TOOL_NAME).toBe('comms_reply');
  });

  it('tools/status.ts exports TOOL_NAME = "comms_status"', () => {
    expect(StatusTool.TOOL_NAME).toBe('comms_status');
  });
});
