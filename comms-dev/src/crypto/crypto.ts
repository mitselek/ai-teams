// (*CD:Vigenere*)
// Core crypto module implementing AES-256-GCM encryption, HKDF-SHA256 key derivation,
// and HMAC-SHA256 integrity for the comms-dev inter-team messaging system.
//
// Threat model: see comms-dev/docs/threat-model.md
// Spec: see comms-dev/docs/crypto-spec.md

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import type {
  CryptoAPI,
  CryptoOptions,
  DerivedKeys,
  EncryptedPayload,
} from './types.js';

// Constants
const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 12;        // 96 bits — GCM standard nonce size
const TAG_LENGTH = 16;       // 128 bits — full GCM tag
const KEY_LENGTH = 32;       // 256 bits
const HKDF_HASH = 'sha256';
const HMAC_HASH = 'sha256';
const CHECKSUM_PREFIX = 'sha256:';

/**
 * Create a CryptoAPI instance from derived keys.
 *
 * Usage:
 *   const psk = readFileSync('/run/secrets/comms-psk');
 *   const keys = deriveKey(psk, 'comms-v1');
 *   const crypto = createCryptoAPI(keys);
 *   const encrypted = await crypto.encrypt(Buffer.from('hello'));
 *   const decrypted = await crypto.decrypt(encrypted);
 */
export function createCryptoAPI(keys: DerivedKeys): CryptoAPI {
  return {
    encrypt: (plaintext: Buffer, options?: CryptoOptions) =>
      encrypt(keys.encryptionKey, plaintext, options),

    decrypt: (payload: EncryptedPayload) =>
      decrypt(keys.encryptionKey, payload),

    deriveKey,

    computeChecksum: (data: Buffer) =>
      computeChecksum(keys.integrityKey, data),

    verifyIntegrity: (data: Buffer, checksum: string) =>
      verifyIntegrity(keys.integrityKey, data, checksum),
  };
}

/**
 * Derive separate encryption and integrity keys from a PSK using HKDF-SHA256.
 *
 * Uses distinct info strings for domain separation:
 *   encryption key: HKDF(psk, salt="", info="<context>:encryption")
 *   integrity key:  HKDF(psk, salt="", info="<context>:integrity")
 *
 * The empty salt is acceptable because the PSK should already have high entropy.
 * The context parameter provides domain separation between different uses.
 */
export function deriveKey(psk: Buffer, context: string): DerivedKeys {
  if (psk.length < KEY_LENGTH) {
    throw new Error(
      `PSK too short: got ${psk.length} bytes, need at least ${KEY_LENGTH}. ` +
      'Generate with: openssl rand -hex 32'
    );
  }

  const encryptionKey = Buffer.from(
    hkdfSync(HKDF_HASH, psk, Buffer.alloc(0), `${context}:encryption`, KEY_LENGTH)
  );

  const integrityKey = Buffer.from(
    hkdfSync(HKDF_HASH, psk, Buffer.alloc(0), `${context}:integrity`, KEY_LENGTH)
  );

  return { encryptionKey, integrityKey };
}

/**
 * Encrypt plaintext using AES-256-GCM.
 *
 * - Generates a random 96-bit IV per message
 * - Optionally binds AAD (additional authenticated data) to prevent ciphertext transplant
 * - Returns a self-contained EncryptedPayload with everything needed for decryption
 */
export async function encrypt(
  key: Buffer,
  plaintext: Buffer,
  options?: CryptoOptions,
): Promise<EncryptedPayload> {
  const iv = randomBytes(IV_LENGTH);
  const aadBuffer = options?.aad ? Buffer.from(options.aad, 'utf-8') : Buffer.alloc(0);

  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  if (aadBuffer.length > 0) {
    cipher.setAAD(aadBuffer);
  }

  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    ciphertext: encrypted.toString('base64'),
    tag: tag.toString('base64'),
    aad: aadBuffer.toString('base64'),
    version: 1,
  };
}

/**
 * Decrypt an EncryptedPayload back to plaintext.
 *
 * Verifies the GCM authentication tag. If the ciphertext, IV, AAD, or tag
 * have been modified, decryption fails with an error.
 *
 * @throws Error if authentication fails (tampered data)
 */
export async function decrypt(
  key: Buffer,
  payload: EncryptedPayload,
): Promise<Buffer> {
  if (payload.version !== 1) {
    throw new Error(`Unsupported crypto version: ${payload.version}`);
  }

  const iv = Buffer.from(payload.iv, 'base64');
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const aad = Buffer.from(payload.aad, 'base64');

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: got ${iv.length}, expected ${IV_LENGTH}`);
  }

  if (tag.length !== TAG_LENGTH) {
    throw new Error(`Invalid tag length: got ${tag.length}, expected ${TAG_LENGTH}`);
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);

  if (aad.length > 0) {
    decipher.setAAD(aad);
  }

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted;
  } catch (err) {
    throw new Error('Decryption failed: authentication tag mismatch (data may be tampered)');
  }
}

/**
 * Compute HMAC-SHA256 over data using the integrity key.
 * Returns in the format "sha256:<hex>" to match the message envelope checksum field.
 */
export function computeChecksum(integrityKey: Buffer, data: Buffer): string {
  const hmac = createHmac(HMAC_HASH, integrityKey);
  hmac.update(data);
  return `${CHECKSUM_PREFIX}${hmac.digest('hex')}`;
}

/**
 * Verify HMAC-SHA256 integrity checksum using constant-time comparison.
 * Prevents timing attacks that could leak information about the expected checksum.
 */
export function verifyIntegrity(
  integrityKey: Buffer,
  data: Buffer,
  checksum: string,
): boolean {
  if (!checksum.startsWith(CHECKSUM_PREFIX)) {
    return false;
  }

  const expected = computeChecksum(integrityKey, data);

  // Constant-time comparison to prevent timing attacks
  const expectedBuf = Buffer.from(expected, 'utf-8');
  const actualBuf = Buffer.from(checksum, 'utf-8');

  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, actualBuf);
}

/**
 * Load a PSK from a Docker secrets file path.
 * Strips whitespace and validates minimum length.
 */
export function loadPsk(pskHex: string): Buffer {
  const cleaned = pskHex.trim();

  // PSK is expected as hex-encoded 256-bit key
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error('PSK must be hex-encoded');
  }

  const psk = Buffer.from(cleaned, 'hex');

  if (psk.length < KEY_LENGTH) {
    throw new Error(
      `PSK too short: got ${psk.length} bytes (${cleaned.length} hex chars), ` +
      `need at least ${KEY_LENGTH} bytes (64 hex chars). ` +
      'Generate with: openssl rand -hex 32'
    );
  }

  return psk;
}
