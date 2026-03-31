// (*CD:Lovelace*)
// comms_send — send a message to a team via the hub.

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { HubClient } from '../client.js';
import { computeBodyHash } from '../client.js';
import type { InboxBuffer } from '../subscribe.js';
import type { SSESubscriber } from '../subscribe.js';
import type { CryptoAPIv2 } from '../../../../src/crypto/index.js';

export const TOOL_NAME = 'comms_send';

export const schema = z.object({
  to: z.string().describe('Target team name, e.g. "framework-research"'),
  body: z.string().describe('Message body (Markdown)'),
  type: z.enum(['query', 'response', 'update', 'alert']).default('query').optional(),
  priority: z.enum(['normal', 'high', 'urgent']).default('normal').optional(),
  reply_to: z.string().optional().describe('Message ID being replied to'),
});

export type ToolDeps = {
  client: HubClient;
  inbox: InboxBuffer;
  subscriber?: SSESubscriber;
  teamName: string;
  crypto?: CryptoAPIv2;
};
export type ToolResult = { content: [{ type: 'text'; text: string }] };

export async function execute(input: unknown, deps: ToolDeps): Promise<ToolResult> {
  const parsed = schema.parse(input);
  const id = randomUUID();
  const receiverTeam = parsed.to;

  // E2E encrypt body if crypto is configured
  let body: string;
  if (deps.crypto) {
    const e2ePayload = await deps.crypto.e2eEncrypt(
      Buffer.from(parsed.body, 'utf-8'),
      receiverTeam,
      id,
    );
    body = JSON.stringify(e2ePayload);
  } else {
    body = parsed.body;
  }

  const body_hash = computeBodyHash(body);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msg: any = {
    version: '1' as const,
    id,
    timestamp: new Date().toISOString(),
    from: { team: deps.teamName, agent: 'mcp' },
    to: { team: receiverTeam, agent: 'mcp' },
    type: parsed.type ?? 'query',
    priority: parsed.priority ?? 'normal',
    reply_to: parsed.reply_to ?? null,
    body,
    body_hash,
  };

  // Sign envelope if crypto is configured
  if (deps.crypto) {
    const signature = deps.crypto.signEnvelope(
      msg as unknown as Parameters<CryptoAPIv2['signEnvelope']>[0],
    );
    msg.signature = signature;
  }

  const result = await deps.client.send(msg as Parameters<HubClient['send']>[0]);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
}
