// (*CD:Vigenere*)
// v2 crypto module: hub-mode E2E encryption (X25519 + AES-256-GCM) and
// message signing (Ed25519) for the comms-dev inter-team messaging system.
//
// Threat model: see comms-dev/docs/threat-model.md §v2
// Spec: see comms-dev/docs/crypto-spec.md §v2

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  hkdfSync,
  randomBytes,
  sign,
  verify,
} from 'node:crypto';
import type { KeyObject } from 'node:crypto';
import { readFileSync } from 'node:fs';

import type { Message } from '../types.js';
import { stableStringify } from '../util/stable-stringify.js';
import { createCryptoAPI, deriveKey as deriveKeyV1 } from './crypto.js';
import type {
  CryptoAPIv2,
  CryptoAPIv2Options,
  DerivedKeys,
  E2EPayload,
  KeyBundle,
  SignedMessage,
} from './types.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 12;        // 96 bits — GCM standard nonce size
const TAG_LENGTH = 16;       // 128 bits — full GCM tag
const KEY_LENGTH = 32;       // 256 bits
const HKDF_HASH = 'sha256';
const CHECKSUM_PREFIX = 'sha256:';

// ── Key Bundle Loading ────────────────────────────────────────────────────────

/**
 * Load and validate a key bundle from a JSON file.
 * @param bundlePath - Path to comms-key-bundle.json
 * @returns Parsed and validated KeyBundle
 * @throws Error if file is missing, malformed, or fails validation
 */
export function loadKeyBundle(bundlePath: string): KeyBundle {
  const raw = readFileSync(bundlePath, 'utf-8');
  const parsed = JSON.parse(raw);

  if (typeof parsed.version !== 'number' || parsed.version < 1) {
    throw new Error('Key bundle missing or invalid "version" field');
  }
  if (!parsed.generated_at || typeof parsed.generated_at !== 'string') {
    throw new Error('Key bundle missing "generated_at" field');
  }
  if (!parsed.teams || typeof parsed.teams !== 'object') {
    throw new Error('Key bundle missing "teams" field');
  }

  // Validate each team entry has required keys
  for (const [team, keys] of Object.entries(parsed.teams)) {
    const tk = keys as Record<string, unknown>;
    if (!tk.sign_pub || typeof tk.sign_pub !== 'string') {
      throw new Error(`Key bundle: team "${team}" missing "sign_pub"`);
    }
    if (!tk.enc_pub || typeof tk.enc_pub !== 'string') {
      throw new Error(`Key bundle: team "${team}" missing "enc_pub"`);
    }
    // Validate PEM can be parsed
    try {
      createPublicKey(tk.sign_pub as string);
    } catch {
      throw new Error(`Key bundle: team "${team}" has invalid sign_pub PEM`);
    }
    try {
      createPublicKey(tk.enc_pub as string);
    } catch {
      throw new Error(`Key bundle: team "${team}" has invalid enc_pub PEM`);
    }
  }

  return parsed as KeyBundle;
}

// ── Pairwise Key Derivation ───────────────────────────────────────────────────

/**
 * Compute the deterministic salt for a team pair.
 * Sort names lexicographically, join with "|", SHA-256 hash.
 * Both sides derive the same salt regardless of who initiates.
 */
function computePairSalt(teamA: string, teamB: string): Buffer {
  const sorted = [teamA, teamB].sort();
  const input = sorted.join('|');
  return createHash('sha256').update(input).digest();
}

/**
 * Derive pairwise encryption and integrity keys from X25519 DH shared secret.
 */
function derivePairwiseKeysFromSecret(
  sharedSecret: Buffer,
  salt: Buffer,
): DerivedKeys {
  const encryptionKey = Buffer.from(
    hkdfSync(HKDF_HASH, sharedSecret, salt, 'comms-v2:e2e:encryption', KEY_LENGTH),
  );
  const integrityKey = Buffer.from(
    hkdfSync(HKDF_HASH, sharedSecret, salt, 'comms-v2:e2e:integrity', KEY_LENGTH),
  );
  return { encryptionKey, integrityKey };
}

// ── Envelope Signing ──────────────────────────────────────────────────────────

/**
 * Compute SHA-256 hash of a string, returned as "sha256:<hex>".
 */
function computeBodyHash(body: string): string {
  const hash = createHash('sha256').update(body, 'utf-8').digest('hex');
  return `${CHECKSUM_PREFIX}${hash}`;
}

/**
 * Build the canonical sign input from a message and body_hash.
 * Includes all routing/identity fields + body_hash, excludes signature and checksum.
 */
function buildSignInput(message: Message, bodyHash: string): Buffer {
  const signData = {
    version: message.version,
    id: message.id,
    timestamp: message.timestamp,
    from: message.from,
    to: message.to,
    type: message.type,
    priority: message.priority,
    reply_to: message.reply_to,
    body_hash: bodyHash,
  };
  return Buffer.from(stableStringify(signData), 'utf-8');
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a CryptoAPIv2 instance for hub-mode E2E encryption and signing.
 *
 * Usage:
 *   const signKey = readFileSync('/run/secrets/comms-sign-key');
 *   const encKey = readFileSync('/run/secrets/comms-enc-key');
 *   const bundle = loadKeyBundle('/run/secrets/comms-key-bundle.json');
 *   const crypto = createCryptoAPIv2({ teamName: 'comms-dev', signKey, encKey, keyBundle: bundle });
 */
export function createCryptoAPIv2(opts: CryptoAPIv2Options): CryptoAPIv2 {
  const { teamName, keyBundle } = opts;

  // Parse our own private keys
  const signPrivateKey: KeyObject = createPrivateKey(opts.signKey);
  const encPrivateKey: KeyObject = createPrivateKey(opts.encKey);

  // Cache for pairwise derived keys: peerTeam → DerivedKeys
  const pairwiseCache = new Map<string, DerivedKeys>();

  // We need a v1 CryptoAPI base for backward compat.
  // For v2-only usage, the v1 methods use a dummy key.
  // If a real PSK is needed for v1 compat, the caller should create a v1 API separately.
  // Here we provide stub v1 methods that throw if called without setup.
  const v1Stub = {
    encrypt: () => { throw new Error('v1 encrypt not available on CryptoAPIv2 — use e2eEncrypt for hub mode'); },
    decrypt: () => { throw new Error('v1 decrypt not available on CryptoAPIv2 — use e2eDecrypt for hub mode'); },
    deriveKey: deriveKeyV1,
    computeChecksum: () => { throw new Error('v1 computeChecksum not available on CryptoAPIv2 — provide a v1 PSK'); },
    verifyIntegrity: () => { throw new Error('v1 verifyIntegrity not available on CryptoAPIv2 — provide a v1 PSK'); },
  };

  function derivePairwise(peerTeam: string): DerivedKeys {
    const cached = pairwiseCache.get(peerTeam);
    if (cached) return cached;

    const peerKeys = keyBundle.teams[peerTeam];
    if (!peerKeys) {
      throw new Error(`Team "${peerTeam}" not found in key bundle`);
    }

    // X25519 DH: our private key + their public key → shared secret
    const peerEncPub: KeyObject = createPublicKey(peerKeys.enc_pub);
    const sharedSecret: Buffer = diffieHellman({
      privateKey: encPrivateKey,
      publicKey: peerEncPub,
    });

    const salt = computePairSalt(teamName, peerTeam);
    const keys = derivePairwiseKeysFromSecret(sharedSecret, salt);

    pairwiseCache.set(peerTeam, keys);
    return keys;
  }

  async function e2eEncrypt(
    plaintext: Buffer,
    receiverTeam: string,
    messageId: string,
  ): Promise<E2EPayload> {
    const keys = derivePairwise(receiverTeam);
    const iv = randomBytes(IV_LENGTH);
    const aadString = `v2:${messageId}:${teamName}:${receiverTeam}`;
    const aadBuffer = Buffer.from(aadString, 'utf-8');

    const cipher = createCipheriv(ALGORITHM, keys.encryptionKey, iv, {
      authTagLength: TAG_LENGTH,
    });
    cipher.setAAD(aadBuffer);

    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString('base64'),
      ciphertext: encrypted.toString('base64'),
      tag: tag.toString('base64'),
      sender_team: teamName,
      version: 2,
    };
  }

  async function e2eDecrypt(
    payload: E2EPayload,
    messageId: string,
  ): Promise<Buffer> {
    if (payload.version !== 2) {
      throw new Error(`Unsupported E2E payload version: ${payload.version}`);
    }

    const senderTeam = payload.sender_team;
    const keys = derivePairwise(senderTeam);

    const iv = Buffer.from(payload.iv, 'base64');
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');

    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: got ${iv.length}, expected ${IV_LENGTH}`);
    }
    if (tag.length !== TAG_LENGTH) {
      throw new Error(`Invalid tag length: got ${tag.length}, expected ${TAG_LENGTH}`);
    }

    const aadString = `v2:${messageId}:${senderTeam}:${teamName}`;
    const aadBuffer = Buffer.from(aadString, 'utf-8');

    const decipher = createDecipheriv(ALGORITHM, keys.encryptionKey, iv, {
      authTagLength: TAG_LENGTH,
    });
    decipher.setAuthTag(tag);
    decipher.setAAD(aadBuffer);

    try {
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch {
      throw new Error(
        'E2E decryption failed: authentication tag mismatch (data may be tampered or wrong pairwise key)',
      );
    }
  }

  function signEnvelope(message: Message): string {
    const bodyHash = computeBodyHash(message.body);
    const signInput = buildSignInput(message, bodyHash);
    // Ed25519 uses null for algorithm (it's implicit)
    const signature = sign(null, signInput, signPrivateKey);
    return signature.toString('base64');
  }

  function verifySignatureImpl(message: SignedMessage): boolean {
    // Guard: missing or invalid fields → return false, never throw
    if (!message?.signature || typeof message.signature !== 'string') return false;
    if (!message?.body_hash || typeof message.body_hash !== 'string') return false;

    const senderTeam = message.from?.team;
    if (!senderTeam) return false;

    const peerKeys = keyBundle.teams[senderTeam];
    if (!peerKeys) return false;

    // Verify body_hash matches the actual body
    const expectedBodyHash = computeBodyHash(message.body);
    if (message.body_hash !== expectedBodyHash) return false;

    const signInput = buildSignInput(message, message.body_hash);
    const signatureBuffer = Buffer.from(message.signature, 'base64');
    const senderSignPub: KeyObject = createPublicKey(peerKeys.sign_pub);

    try {
      return verify(null, signInput, senderSignPub, signatureBuffer);
    } catch {
      return false;
    }
  }

  return {
    // v1 stubs
    ...v1Stub,

    // v2 methods
    e2eEncrypt,
    e2eDecrypt,
    signEnvelope,
    verifySignature: verifySignatureImpl,
    derivePairwiseKeys: derivePairwise,
    loadKeyBundle,
  } as CryptoAPIv2;
}

/**
 * Create a CryptoAPIv2 instance with v1 backward compatibility.
 * Provides both v1 PSK-based methods and v2 E2E methods.
 *
 * Use this when the broker needs to handle both v1 and v2 messages
 * during the migration period.
 */
export function createCryptoAPIv2WithV1Compat(
  v2Opts: CryptoAPIv2Options,
  v1Keys: DerivedKeys,
): CryptoAPIv2 {
  const v1Api = createCryptoAPI(v1Keys);
  const v2Api = createCryptoAPIv2(v2Opts);

  return {
    // v1 methods from the real v1 API
    encrypt: v1Api.encrypt,
    decrypt: v1Api.decrypt,
    deriveKey: v1Api.deriveKey,
    computeChecksum: v1Api.computeChecksum,
    verifyIntegrity: v1Api.verifyIntegrity,

    // v2 methods
    e2eEncrypt: v2Api.e2eEncrypt,
    e2eDecrypt: v2Api.e2eDecrypt,
    signEnvelope: v2Api.signEnvelope,
    verifySignature: v2Api.verifySignature,
    derivePairwiseKeys: v2Api.derivePairwiseKeys,
    loadKeyBundle: v2Api.loadKeyBundle,
  };
}
