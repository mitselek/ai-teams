// (*CD:Vigenere*)
// Crypto module type definitions.
// These types define the full crypto API surface for the comms-dev system.
// v1: PSK-based symmetric encryption (peer-to-peer)
// v2: Per-team asymmetric keys for hub-mode E2E encryption + message signing

import type { Message } from '../types.js';

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

// ── v2 Hub-Mode Types ─────────────────────────────────────────────────────────

/**
 * E2E encrypted payload for hub-mode (v2).
 * Encrypted with a pairwise X25519-derived AES-256-GCM key.
 * The hub forwards this opaquely — it cannot decrypt.
 */
export interface E2EPayload {
  /** AES-256-GCM initialization vector (12 bytes, base64) */
  iv: string;
  /** Ciphertext (base64) */
  ciphertext: string;
  /** GCM authentication tag (16 bytes, base64) */
  tag: string;
  /** Sender team name — receiver needs this to derive the pairwise key */
  sender_team: string;
  /** Crypto protocol version */
  version: 2;
}

/**
 * Key bundle containing all teams' public keys.
 * Provisioned out-of-band via Docker secrets — NOT via the hub.
 * Path: /run/secrets/comms-key-bundle.json
 */
export interface KeyBundle {
  /** Monotonically increasing version — reject downgrades */
  version: number;
  /** ISO 8601 timestamp of bundle generation */
  generated_at: string;
  /** Per-team public keys */
  teams: Record<string, TeamPublicKeys>;
}

/**
 * A team's public keys for E2E encryption and message signing.
 */
export interface TeamPublicKeys {
  /** PEM-encoded Ed25519 public key for signature verification */
  sign_pub: string;
  /** PEM-encoded X25519 public key for key agreement */
  enc_pub: string;
}

/**
 * Options for creating a v2 crypto API instance.
 */
export interface CryptoAPIv2Options {
  /** This team's name (used for key derivation salt and AAD) */
  teamName: string;
  /** PEM-encoded Ed25519 private key for signing */
  signKey: Buffer;
  /** PEM-encoded X25519 private key for key agreement */
  encKey: Buffer;
  /** Loaded key bundle with all teams' public keys */
  keyBundle: KeyBundle;
}

/**
 * v2 crypto API for hub-mode E2E encryption and message signing.
 * Extends v1 CryptoAPI — v1 methods remain available for backward compatibility.
 */
export interface CryptoAPIv2 extends CryptoAPI {
  /**
   * E2E encrypt a message body for a specific receiver team.
   * Uses X25519 DH key agreement → HKDF-SHA256 → AES-256-GCM.
   * AAD: "v2:<messageId>:<senderTeam>:<receiverTeam>"
   * @param plaintext - Message body to encrypt
   * @param receiverTeam - Destination team name
   * @param messageId - Message ID for AAD binding
   * @returns E2EPayload (hub-opaque)
   * @throws Error if receiverTeam not found in key bundle
   */
  e2eEncrypt(plaintext: Buffer, receiverTeam: string, messageId: string): Promise<E2EPayload>;

  /**
   * E2E decrypt a message body from a sender team.
   * Derives pairwise key from sender's X25519 public key.
   * @param payload - E2EPayload received via hub
   * @param messageId - Message ID for AAD verification
   * @returns Decrypted plaintext
   * @throws Error if decryption fails (tampered, wrong key, or AAD mismatch)
   */
  e2eDecrypt(payload: E2EPayload, messageId: string): Promise<Buffer>;

  /**
   * Sign a message envelope with Ed25519.
   * Signs: canonicalize({ version, id, timestamp, from, to, type, priority, reply_to, body_hash })
   * where body_hash = SHA-256(message.body).
   * @param message - Complete message (body should already be E2E-encrypted)
   * @returns base64-encoded Ed25519 signature
   */
  signEnvelope(message: Message): string;

  /**
   * Verify an Ed25519 signature on a message envelope.
   * Looks up sender's public key from the key bundle using message.from.team.
   * @param message - Message with signature and body_hash fields
   * @returns true if signature is valid, false otherwise
   */
  verifySignature(message: SignedMessage): boolean;

  /**
   * Derive pairwise keys for a specific team pair.
   * Uses X25519(my_private, their_public) → HKDF-SHA256.
   * Cached after first derivation.
   * @param peerTeam - The other team's name
   * @returns DerivedKeys for E2E encryption with that team
   * @throws Error if peerTeam not found in key bundle
   */
  derivePairwiseKeys(peerTeam: string): DerivedKeys;

  /**
   * Load and validate a key bundle from a JSON file.
   * @param bundlePath - Path to comms-key-bundle.json
   * @returns Parsed and validated KeyBundle
   * @throws Error if file is missing, malformed, or fails validation
   */
  loadKeyBundle(bundlePath: string): KeyBundle;
}

/**
 * Extended message with Ed25519 signature.
 * Used in hub-mode to authenticate the sender independently of mTLS.
 */
export interface SignedMessage extends Message {
  /** Ed25519 signature over canonical envelope (base64) */
  signature: string;
  /** SHA-256 hash of the body field: "sha256:<hex>" */
  body_hash: string;
}
