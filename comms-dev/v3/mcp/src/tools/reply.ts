// (*CD:Lovelace*)
// comms_reply — reply to a buffered message by ID.

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { HubClient } from '../client.js';
import { computeBodyHash } from '../client.js';
import type { InboxBuffer } from '../subscribe.js';
import type { SSESubscriber } from '../subscribe.js';

export const TOOL_NAME = 'comms_reply';

export const schema = z.object({
  id: z.string().describe('ID of the message to reply to'),
  body: z.string().describe('Reply body (Markdown)'),
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
  const messages = deps.inbox.messages as Array<{
    id: string;
    from: { team: string; agent?: string };
  }>;
  const original = messages.find((m) => m.id === parsed.id);

  if (!original) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ ok: false, error: `Message ${parsed.id} not found in inbox` }),
        },
      ],
    };
  }

  const id = randomUUID();
  const body = parsed.body;
  const body_hash = computeBodyHash(body);

  const msg = {
    version: '1' as const,
    id,
    timestamp: new Date().toISOString(),
    from: { team: deps.teamName, agent: 'mcp' },
    to: { team: original.from.team, agent: original.from.agent ?? 'mcp' },
    type: 'response' as const,
    priority: 'normal' as const,
    reply_to: parsed.id,
    body,
    body_hash,
  };

  const result = await deps.client.send(msg);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
}
