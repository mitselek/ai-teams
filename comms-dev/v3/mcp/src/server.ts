// (*CD:Vigenere+Lovelace*)
// MCP server v3 — Claude Code agent interface to the comms hub.
// Registers 5 tools: comms_send, comms_inbox, comms_online, comms_reply, comms_status.
// E2E crypto: loads keys from file paths, wires into send tool and SSE subscriber.

import { readFileSync } from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { HubClient } from './client.js';
import { InboxBuffer, SSESubscriber } from './subscribe.js';
import * as SendTool from './tools/send.js';
import * as InboxTool from './tools/inbox.js';
import * as OnlineTool from './tools/online.js';
import * as ReplyTool from './tools/reply.js';
import * as StatusTool from './tools/status.js';
import { createCryptoAPIv2, loadKeyBundle } from '../../../src/crypto/index.js';
import type { CryptoAPIv2 } from '../../../src/crypto/index.js';

export interface McpOptions {
  hubUrl: string;
  cert: string;
  key: string;
  ca: string;
  teamName: string;
  /** Path to comms-key-bundle.json (enables E2E encryption + signing) */
  keyBundlePath?: string;
  /** Path to Ed25519 private key PEM (required if keyBundlePath is set) */
  signKeyPath?: string;
  /** Path to X25519 private key PEM (required if keyBundlePath is set) */
  encKeyPath?: string;
}

export function createMcpServer(opts: McpOptions): {
  mcpServer: McpServer;
  client: HubClient & { crypto?: CryptoAPIv2 };
  inbox: InboxBuffer;
  subscriber: SSESubscriber;
} {
  const client = new HubClient({
    hubUrl: opts.hubUrl,
    cert: opts.cert,
    key: opts.key,
    ca: opts.ca,
    teamName: opts.teamName,
  });

  // Load E2E crypto from key file paths if all three are provided
  let crypto: CryptoAPIv2 | undefined;
  if (opts.keyBundlePath && opts.signKeyPath && opts.encKeyPath) {
    const keyBundle = loadKeyBundle(opts.keyBundlePath);
    crypto = createCryptoAPIv2({
      teamName: opts.teamName,
      signKey: readFileSync(opts.signKeyPath),
      encKey: readFileSync(opts.encKeyPath),
      keyBundle,
    });
  }

  // Expose crypto on client for test access (AC5)
  const clientWithCrypto = client as HubClient & { crypto?: CryptoAPIv2 };
  if (crypto) clientWithCrypto.crypto = crypto;

  const inbox = new InboxBuffer();
  const subscriber = new SSESubscriber(
    opts.hubUrl,
    { cert: opts.cert, key: opts.key, ca: opts.ca },
    inbox,
    crypto,
  );

  const mcpServer = new McpServer({ name: 'comms-mcp', version: '0.1.0' });

  const deps = { client, inbox, subscriber, teamName: opts.teamName, crypto };

  mcpServer.tool(
    SendTool.TOOL_NAME,
    'Send a message to a team via the hub',
    SendTool.schema.shape,
    (input) => SendTool.execute(input, deps),
  );

  mcpServer.tool(
    InboxTool.TOOL_NAME,
    'Read unread messages from the local inbox buffer',
    InboxTool.schema.shape,
    (input) => InboxTool.execute(input, deps),
  );

  mcpServer.tool(
    OnlineTool.TOOL_NAME,
    'List teams currently connected to the hub',
    OnlineTool.schema.shape,
    (_input) => OnlineTool.execute(_input, deps),
  );

  mcpServer.tool(
    ReplyTool.TOOL_NAME,
    'Reply to a buffered message by ID',
    ReplyTool.schema.shape,
    (input) => ReplyTool.execute(input, deps),
  );

  mcpServer.tool(
    StatusTool.TOOL_NAME,
    'Show SSE connection state and unread message count',
    StatusTool.schema.shape,
    (_input) => StatusTool.execute(_input, deps),
  );

  return { mcpServer, client: clientWithCrypto, inbox, subscriber };
}

export function createMcpFromEnv(): ReturnType<typeof createMcpServer> {
  const required = [
    'COMMS_HUB_URL',
    'COMMS_TLS_CERT',
    'COMMS_TLS_KEY',
    'COMMS_CA_CERT',
    'COMMS_TEAM_NAME',
  ];

  for (const varName of required) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  return createMcpServer({
    hubUrl: process.env.COMMS_HUB_URL!,
    cert: process.env.COMMS_TLS_CERT!,
    key: process.env.COMMS_TLS_KEY!,
    ca: process.env.COMMS_CA_CERT!,
    teamName: process.env.COMMS_TEAM_NAME!,
    // E2E crypto (optional — omit to run without encryption)
    keyBundlePath: process.env.COMMS_KEY_BUNDLE_PATH,
    signKeyPath: process.env.COMMS_SIGN_KEY_PATH,
    encKeyPath: process.env.COMMS_ENC_KEY_PATH,
  });
}
