// (*CD:Vigenere*)
// Crypto module type definitions.
// These types define the full crypto API surface for the comms-dev system.

/**
 * Result of an encryption operation.
 * Contains everything the receiver needs to decrypt (except the key).
 */
export interface EncryptedPayload {
  /** AES-256-GCM initialization vector (12 bytes, base64-encoded) */
  iv: string;
  /** Ciphertext (base64-encoded) */
  ciphertext: string;
  /** GCM authentication tag (16 bytes, base64-encoded) */
  tag: string;
  /** Additional authenticated data that was bound to this ciphertext (base64-encoded) */
  aad: string;
  /** Crypto protocol version — for future migration */
  version: 1;
}

/**
 * Derived key material from a single PSK.
 * HKDF-SHA256 produces separate keys for encryption and integrity,
 * preventing key reuse across cryptographic operations.
 */
export interface DerivedKeys {
  /** AES-256-GCM encryption key (32 bytes) */
  encryptionKey: Buffer;
  /** HMAC-SHA256 integrity key (32 bytes) */
  integrityKey: Buffer;
}

/**
 * Options for encrypt/decrypt operations.
 */
export interface CryptoOptions {
  /** Additional authenticated data — bound to the ciphertext but not encrypted.
   *  Typically: message ID + sender identity, to prevent ciphertext transplant attacks. */
  aad?: string;
}

/**
 * Full crypto API for the comms-dev system.
 * Extends the CryptoProvider interface from types.ts with key derivation and integrity.
 */
export interface CryptoAPI {
  /**
   * Encrypt plaintext using AES-256-GCM.
   * @param plaintext - Data to encrypt
   * @param options - Optional AAD for authenticated encryption
   * @returns EncryptedPayload containing iv, ciphertext, tag, and aad
   */
  encrypt(plaintext: Buffer, options?: CryptoOptions): Promise<EncryptedPayload>;

  /**
   * Decrypt an EncryptedPayload back to plaintext.
   * Verifies the GCM authentication tag. Throws on tampered data.
   * @param payload - The encrypted payload from encrypt()
   * @returns Decrypted plaintext
   * @throws Error if authentication tag verification fails
   */
  decrypt(payload: EncryptedPayload): Promise<Buffer>;

  /**
   * Derive encryption and integrity keys from a PSK using HKDF-SHA256.
   * @param psk - Pre-shared key (raw bytes)
   * @param context - Context string for domain separation (e.g., "comms-v1")
   * @returns DerivedKeys with separate encryption and integrity keys
   */
  deriveKey(psk: Buffer, context: string): DerivedKeys;

  /**
   * Compute HMAC-SHA256 over data for integrity verification.
   * @param data - Data to compute integrity checksum over
   * @returns Hex-encoded HMAC-SHA256: "sha256:<hex>"
   */
  computeChecksum(data: Buffer): string;

  /**
   * Verify HMAC-SHA256 integrity checksum.
   * Uses constant-time comparison to prevent timing attacks.
   * @param data - Data to verify
   * @param checksum - Expected checksum in "sha256:<hex>" format
   * @returns true if checksum matches, false otherwise
   */
  verifyIntegrity(data: Buffer, checksum: string): boolean;
}
