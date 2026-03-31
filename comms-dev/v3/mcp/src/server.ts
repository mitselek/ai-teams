// (*CD:Lovelace*)
// MCP server v3 — Claude Code agent interface to the comms hub.
// Registers 5 tools: comms_send, comms_inbox, comms_online, comms_reply, comms_status.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { HubClient } from './client.js';
import { InboxBuffer, SSESubscriber } from './subscribe.js';
import * as SendTool from './tools/send.js';
import * as InboxTool from './tools/inbox.js';
import * as OnlineTool from './tools/online.js';
import * as ReplyTool from './tools/reply.js';
import * as StatusTool from './tools/status.js';

export interface McpOptions {
  hubUrl: string;
  cert: string;
  key: string;
  ca: string;
  teamName: string;
}

export function createMcpServer(opts: McpOptions): {
  mcpServer: McpServer;
  client: HubClient;
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

  const inbox = new InboxBuffer();
  const subscriber = new SSESubscriber(
    opts.hubUrl,
    { cert: opts.cert, key: opts.key, ca: opts.ca },
    inbox,
  );

  const mcpServer = new McpServer({ name: 'comms-mcp', version: '0.1.0' });

  const deps = { client, inbox, subscriber, teamName: opts.teamName };

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

  return { mcpServer, client, inbox, subscriber };
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
  });
}
