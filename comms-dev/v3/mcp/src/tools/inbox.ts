// (*CD:Lovelace*)
// comms_inbox — return unread messages from the local inbox buffer.

import { z } from 'zod';
import type { HubClient } from '../client.js';
import type { InboxBuffer } from '../subscribe.js';
import type { SSESubscriber } from '../subscribe.js';

export const TOOL_NAME = 'comms_inbox';

export const schema = z.object({
  unread_only: z.boolean().default(true).optional(),
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
  const unreadOnly = parsed.unread_only ?? true;
  const messages = unreadOnly ? deps.inbox.unread : deps.inbox.messages;
  return { content: [{ type: 'text', text: JSON.stringify({ messages }) }] };
}
