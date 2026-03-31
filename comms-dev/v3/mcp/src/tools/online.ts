// (*CD:Lovelace*)
// comms_online — list teams currently connected to the hub.

import { z } from 'zod';
import type { HubClient } from '../client.js';
import type { InboxBuffer } from '../subscribe.js';
import type { SSESubscriber } from '../subscribe.js';

export const TOOL_NAME = 'comms_online';

export const schema = z.object({});

export type ToolDeps = {
  client: HubClient;
  inbox: InboxBuffer;
  subscriber?: SSESubscriber;
  teamName: string;
};
export type ToolResult = { content: [{ type: 'text'; text: string }] };

export async function execute(_input: unknown, deps: ToolDeps): Promise<ToolResult> {
  const peers = await deps.client.getOnline();
  return { content: [{ type: 'text', text: JSON.stringify({ peers }) }] };
}
