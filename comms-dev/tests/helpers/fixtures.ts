// (*CD:Kerckhoffs*)
// Shared test fixtures — message envelopes, registry entries, etc.

import { randomUUID } from 'crypto';

export interface MessageEnvelope {
  version: string;
  id: string;
  timestamp: string;
  from: string;
  to: string;
  type: string;
  priority: number;
  reply_to?: string;
  body: string;
  checksum: string;
}

/**
 * Build a minimal valid message envelope for testing.
 */
export function makeMessage(overrides: Partial<MessageEnvelope> = {}): MessageEnvelope {
  return {
    version: '1',
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    from: 'test-sender',
    to: 'test-recipient',
    type: 'text',
    priority: 1,
    body: 'Hello, world!',
    checksum: '',
    ...overrides,
  };
}

/**
 * Build a message envelope with a body of exactly `size` bytes.
 */
export function makeMessageOfSize(size: number): MessageEnvelope {
  return makeMessage({ body: 'x'.repeat(size) });
}

export const MAX_MESSAGE_SIZE = 1024 * 1024; // 1 MB per spec

/**
 * Known-answer pairs for crypto tests — populated by Vigenere.
 * Format: { key, plaintext, ciphertext }
 */
export const CRYPTO_VECTORS: Array<{ key: string; plaintext: string; ciphertext: string }> = [
  // Vigenere will supply vectors here
];
