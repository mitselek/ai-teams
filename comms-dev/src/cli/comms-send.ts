// (*CD:Babbage*)
// comms-send — CLI for sending a message to another team.
//
// Usage:
//   comms-send --to <team-name> --type <type> --body <markdown-text> [options]
//
// Options:
//   --to <team>          Target team name (required)
//   --to-agent <agent>   Target agent within team (default: team-lead)
//   --type <type>        Message type: handoff|query|response|broadcast|heartbeat (default: query)
//   --priority <p>       blocking|high|normal|low (default: normal)
//   --body <text>        Message body as markdown (required, or use --body-file)
//   --body-file <path>   Read body from file
//   --reply-to <id>      Message ID being replied to
//
// Required environment:
//   COMMS_TEAM_NAME    — this team's name
//   COMMS_TEAM_PREFIX  — this team's prefix
//   COMMS_SOCKET_DIR   — default: /shared/comms
//   COMMS_AGENT_NAME   — this agent's name (default: team-lead)

import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';
import { UDSClient } from '../transport/client.js';
import { RegistryManager } from '../discovery/registry.js';
import { buildMessage } from '../broker/message-builder.js';
import { loadPsk, deriveKey, createCryptoAPI, createCryptoProvider } from '../crypto/index.js';
import type { MessageType, MessagePriority, CryptoProvider } from '../types.js';

const VALID_TYPES = new Set<string>(['handoff', 'query', 'response', 'broadcast', 'heartbeat']);
const VALID_PRIORITIES = new Set<string>(['blocking', 'high', 'normal', 'low']);

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      to: { type: 'string' },
      'to-agent': { type: 'string', default: 'team-lead' },
      type: { type: 'string', default: 'query' },
      priority: { type: 'string', default: 'normal' },
      body: { type: 'string' },
      'body-file': { type: 'string' },
      'reply-to': { type: 'string' },
    },
  });

  // Validate required args
  if (!values.to) fatal('--to is required');

  let body: string;
  if (values['body-file']) {
    try {
      body = fs.readFileSync(values['body-file'], 'utf8').trim();
    } catch (err) {
      fatal(`Cannot read body file: ${(err as Error).message}`);
    }
  } else if (values.body) {
    body = values.body;
  } else {
    fatal('Either --body or --body-file is required');
  }

  const msgType = values.type!;
  if (!VALID_TYPES.has(msgType)) fatal(`Invalid type: ${msgType}. Valid: ${[...VALID_TYPES].join(', ')}`);

  const priority = values.priority!;
  if (!VALID_PRIORITIES.has(priority)) fatal(`Invalid priority: ${priority}`);

  // Environment
  const teamName = requireEnv('COMMS_TEAM_NAME');
  const teamPrefix = requireEnv('COMMS_TEAM_PREFIX');
  const socketDir = process.env['COMMS_SOCKET_DIR'] ?? '/shared/comms';
  const agentName = process.env['COMMS_AGENT_NAME'] ?? 'team-lead';
  const pskFile = process.env['COMMS_PSK_FILE'] ?? '/run/secrets/comms-psk';

  // Load crypto material if PSK is available
  let cryptoProvider: CryptoProvider | undefined;
  let integrityKey: Buffer | undefined;
  try {
    const pskHex = fs.readFileSync(pskFile, 'utf8');
    const psk = loadPsk(pskHex);
    const keys = deriveKey(psk, 'comms-v1');
    cryptoProvider = createCryptoProvider(createCryptoAPI(keys));
    integrityKey = keys.integrityKey;
  } catch {
    // Plaintext mode — no PSK file
  }

  // Look up target team's socket
  const registryPath = path.join(socketDir, 'registry.json');
  const registry = new RegistryManager(registryPath);
  const reg = registry.read();
  const target = reg.teams[values.to!];

  if (!target) {
    fatal(`Team not found in registry: ${values.to}. Known teams: ${Object.keys(reg.teams).join(', ') || 'none'}`);
  }

  const message = buildMessage({
    from: { team: teamName, agent: agentName, prefix: teamPrefix },
    to: { team: values.to!, agent: values['to-agent']! },
    type: msgType as MessageType,
    priority: priority as MessagePriority,
    body: body!,
    reply_to: values['reply-to'] ?? null,
    integrityKey,
  });

  console.log(`Sending ${message.type} to ${message.to.team}/${message.to.agent} [${message.id}]`);

  const client = new UDSClient(target.socket);
  try {
    const attempts = await client.send(message, { crypto: cryptoProvider });
    console.log(`Delivered after ${attempts} attempt(s). Message ID: ${message.id}`);
  } catch (err) {
    fatal(`Delivery failed: ${(err as Error).message}`);
  }
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) fatal(`Required environment variable not set: ${name}`);
  return val!;
}

function fatal(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
