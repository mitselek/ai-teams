// (*CD:Babbage*)
// Constructs well-formed Message envelopes with correct checksums.
//
// Checksum algorithm:
//   - With integrityKey: HMAC-SHA256 over stableStringify(draft) using Vigenere's crypto module
//   - Without integrityKey: plain SHA-256 (dev/plaintext mode only — no authentication)
//
// stableStringify ensures nested objects (from, to) are fully included in the hash input.
// See src/util/stable-stringify.ts and Issue #2 for why JSON.stringify with array replacer fails.

import { createHash, randomUUID } from 'crypto';
import { stableStringify } from '../util/stable-stringify.js';
import { computeChecksum as hmacChecksum } from '../crypto/index.js';
import type { Message, MessageDraft, MessageEndpoint, MessageType, MessagePriority } from '../types.js';

export interface BuildMessageOptions {
  from: MessageEndpoint;
  to: MessageEndpoint;
  type: MessageType;
  priority?: MessagePriority;
  body: string;
  reply_to?: string | null;
  /** HMAC-SHA256 integrity key from deriveKey(). Required in production. */
  integrityKey?: Buffer;
}

export function buildMessage(opts: BuildMessageOptions): Message {
  const draft: MessageDraft = {
    version: '1',
    id: `msg-${randomUUID()}`,
    timestamp: new Date().toISOString(),
    from: opts.from,
    to: opts.to,
    type: opts.type,
    priority: opts.priority ?? 'normal',
    reply_to: opts.reply_to ?? null,
    body: opts.body,
  };

  return {
    ...draft,
    checksum: computeChecksum(draft, opts.integrityKey),
  };
}

/**
 * Compute the checksum over a MessageDraft (all fields except 'checksum').
 *
 * With integrityKey: HMAC-SHA256 (authenticated — production mode)
 * Without integrityKey: plain SHA-256 (dev/plaintext mode — no auth guarantee)
 *
 * Uses stableStringify for recursive key sorting to ensure nested objects
 * (from, to endpoints) are fully covered by the hash.
 */
export function computeChecksum(draft: MessageDraft | Omit<Message, 'checksum'>, integrityKey?: Buffer): string {
  const canonical = Buffer.from(stableStringify(draft), 'utf8');
  if (integrityKey) {
    return hmacChecksum(integrityKey, canonical);
  }
  return 'sha256:' + createHash('sha256').update(canonical).digest('hex');
}
