// (*CD:Lovelace*)
// comms_send — send a message to a team via the hub.

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { HubClient } from '../client.js';
import { computeBodyHash } from '../client.js';
import type { InboxBuffer } from '../subscribe.js';
import type { SSESubscriber } from '../subscribe.js';

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
};
export type ToolResult = { content: [{ type: 'text'; text: string }] };

export async function execute(input: unknown, deps: ToolDeps): Promise<ToolResult> {
  const parsed = schema.parse(input);
  const id = randomUUID();
  const body = parsed.body;
  const body_hash = computeBodyHash(body);

  const msg = {
    version: '1' as const,
    id,
    timestamp: new Date().toISOString(),
    from: { team: deps.teamName, agent: 'mcp' },
    to: { team: parsed.to, agent: 'mcp' },
    type: parsed.type ?? 'query',
    priority: parsed.priority ?? 'normal',
    reply_to: parsed.reply_to ?? null,
    body,
    body_hash,
  };

  const result = await deps.client.send(msg);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
}
