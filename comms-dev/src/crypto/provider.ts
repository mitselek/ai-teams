// (*CD:Vigenere*)
// Bridge between the full CryptoAPI and Babbage's CryptoProvider interface.
// This adapter lets the broker consume crypto via the simple encrypt/decrypt Buffer API
// defined in types.ts, while the underlying implementation uses the full CryptoAPI.

import type { CryptoProvider } from '../types.js';
import type { CryptoAPI } from './types.js';

/**
 * Create a CryptoProvider (Babbage's interface) from a CryptoAPI instance.
 *
 * The CryptoProvider wraps encrypt/decrypt to work with raw Buffers:
 * - encrypt: plaintext Buffer → serialized EncryptedPayload as Buffer (JSON)
 * - decrypt: serialized EncryptedPayload Buffer (JSON) → plaintext Buffer
 *
 * The EncryptedPayload is JSON-serialized on the wire so the receiver can
 * extract the IV, tag, and AAD needed for decryption.
 */
export function createCryptoProvider(api: CryptoAPI): CryptoProvider {
  return {
    async encrypt(plaintext: Buffer, aad?: string): Promise<Buffer> {
      const payload = await api.encrypt(plaintext, aad ? { aad } : undefined);
      return Buffer.from(JSON.stringify(payload), 'utf-8');
    },

    async decrypt(ciphertext: Buffer): Promise<Buffer> {
      // AAD is embedded in the EncryptedPayload — the crypto module
      // extracts and verifies it automatically during decryption.
      const payload = JSON.parse(ciphertext.toString('utf-8'));
      return api.decrypt(payload);
    },
  };
}
