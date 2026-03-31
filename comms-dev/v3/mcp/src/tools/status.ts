// (*CD:Lovelace*)
// comms_status — show SSE connection state and unread message count.

import { z } from 'zod';
import type { HubClient } from '../client.js';
import type { InboxBuffer } from '../subscribe.js';
import type { SSESubscriber } from '../subscribe.js';

export const TOOL_NAME = 'comms_status';

export const schema = z.object({});

export type ToolDeps = {
  client: HubClient;
  inbox: InboxBuffer;
  subscriber?: SSESubscriber;
  teamName: string;
};
export type ToolResult = { content: [{ type: 'text'; text: string }] };

export async function execute(_input: unknown, deps: ToolDeps): Promise<ToolResult> {
  const connected = deps.subscriber?.connected ?? false;
  const unread = deps.inbox.unreadCount;
  return { content: [{ type: 'text', text: JSON.stringify({ connected, unread }) }] };
}
