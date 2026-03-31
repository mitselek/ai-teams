// (*CD:Kerckhoffs*)
// RED tests for v2 hub-mode crypto: X25519 E2E encryption, Ed25519 signing,
// pairwise key derivation, and key bundle loading.
//
// These tests are intentionally RED — createCryptoAPIv2 is not yet exported
// from src/crypto/index.ts. Green condition: Vigenere implements the v2 API
// per crypto-spec.md §Hub-Mode Cryptographic Protocol — v2.
//
// Test matrix:
//   Pairwise key derivation — DH symmetry, salt construction, key size,
//                             isolation, unknown peer rejection
//   E2E encrypt/decrypt     — round-trip, fresh IV per call, wrong receiver
//                             (HUB-3 scenario), AAD mismatch, tampered
//                             ciphertext, tampered tag
//   Ed25519 signing         — valid round-trip, tampered from.team (HUB-8),
//                             tampered to.team (HUB-3), tampered body,
//                             tampered body_hash, wrong signer key, missing
//                             signature, tampered timestamp (replay)
//   loadKeyBundle           — valid path, missing fields, bad path
//   Version compat          — v1 path unaffected; v2 instance exposes v1 API
//   Known-answer vectors    — placeholders pending Vigenere's test vectors
//
// Spec: crypto-spec.md §Hub-Mode Cryptographic Protocol — v2
// Security: security-report.md HUB-T01 (AAD/to.team), HUB-T03 (signature)

import { describe, it, expect, beforeAll } from 'vitest';
import { generateKeyPairSync, createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCryptoAPIv2, createCryptoAPI, deriveKey } from '../../src/crypto/index.js';
import type { E2EPayload, KeyBundle, SignedMessage, CryptoAPIv2 } from '../../src/crypto/index.js';
import type { Message } from '../../src/types.js';

// ── Key generation helpers ────────────────────────────────────────────────────

function genEd25519() {
  return generateKeyPairSync('ed25519', {
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  });
}

function genX25519() {
  return generateKeyPairSync('x25519', {
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  });
}

function sha256hex(input: string): string {
  return 'sha256:' + createHash('sha256').update(input).digest('hex');
}

// ── Test fixture ──────────────────────────────────────────────────────────────

const TEAM_CD    = 'comms-dev';
const TEAM_FR    = 'framework-research';
const TEAM_OTHER = 'unknown-team';

let cdSign:    { privateKey: string; publicKey: string };
let cdEnc:     { privateKey: string; publicKey: string };
let frSign:    { privateKey: string; publicKey: string };
let frEnc:     { privateKey: string; publicKey: string };
let otherSign: { privateKey: string; publicKey: string };
let otherEnc:  { privateKey: string; publicKey: string };

let keyBundle: KeyBundle;

let cdCrypto:    CryptoAPIv2;
let frCrypto:    CryptoAPIv2;

beforeAll(() => {
  cdSign    = genEd25519();
  cdEnc     = genX25519();
  frSign    = genEd25519();
  frEnc     = genX25519();
  otherSign = genEd25519();
  otherEnc  = genX25519();

  keyBundle = {
    version:      1,
    generated_at: '2026-03-30T00:00:00Z',
    teams: {
      [TEAM_CD]: { sign_pub: cdSign.publicKey, enc_pub: cdEnc.publicKey },
      [TEAM_FR]: { sign_pub: frSign.publicKey, enc_pub: frEnc.publicKey },
    },
  };

  cdCrypto = createCryptoAPIv2({
    teamName:  TEAM_CD,
    signKey:   Buffer.from(cdSign.privateKey),
    encKey:    Buffer.from(cdEnc.privateKey),
    keyBundle,
  });

  frCrypto = createCryptoAPIv2({
    teamName:  TEAM_FR,
    signKey:   Buffer.from(frSign.privateKey),
    encKey:    Buffer.from(frEnc.privateKey),
    keyBundle,
  });
});

// ── Pairwise key derivation ───────────────────────────────────────────────────

describe('v2 crypto — pairwise key derivation', () => {

  it('DH symmetry: comms-dev derives same encryption key as framework-research for the pair', () => {
    const cdKeys = cdCrypto.derivePairwiseKeys(TEAM_FR);
    const frKeys = frCrypto.derivePairwiseKeys(TEAM_CD);
    expect(cdKeys.encryptionKey.toString('hex')).toBe(frKeys.encryptionKey.toString('hex'));
  });

  it('DH symmetry: comms-dev derives same integrity key as framework-research for the pair', () => {
    const cdKeys = cdCrypto.derivePairwiseKeys(TEAM_FR);
    const frKeys = frCrypto.derivePairwiseKeys(TEAM_CD);
    expect(cdKeys.integrityKey.toString('hex')).toBe(frKeys.integrityKey.toString('hex'));
  });

  it('derivePairwiseKeys returns 32-byte encryption key', () => {
    const keys = cdCrypto.derivePairwiseKeys(TEAM_FR);
    expect(keys.encryptionKey).toHaveLength(32);
  });

  it('derivePairwiseKeys returns 32-byte integrity key', () => {
    const keys = cdCrypto.derivePairwiseKeys(TEAM_FR);
    expect(keys.integrityKey).toHaveLength(32);
  });

  it('pairwise keys are distinct for different peer pairs', () => {
    // Build a bundle including a third team to test key isolation
    const bundleWithOther: KeyBundle = {
      ...keyBundle,
      teams: {
        ...keyBundle.teams,
        [TEAM_OTHER]: { sign_pub: otherSign.publicKey, enc_pub: otherEnc.publicKey },
      },
    };
    const cdCryptoExt = createCryptoAPIv2({
      teamName:  TEAM_CD,
      signKey:   Buffer.from(cdSign.privateKey),
      encKey:    Buffer.from(cdEnc.privateKey),
      keyBundle: bundleWithOther,
    });
    const keysToFR    = cdCryptoExt.derivePairwiseKeys(TEAM_FR);
    const keysToOther = cdCryptoExt.derivePairwiseKeys(TEAM_OTHER);
    expect(keysToFR.encryptionKey.toString('hex')).not.toBe(keysToOther.encryptionKey.toString('hex'));
  });

  it('derivePairwiseKeys throws for a team not in the key bundle', () => {
    expect(() => cdCrypto.derivePairwiseKeys('nonexistent-team')).toThrow();
  });

  it('sorted team name ordering produces the same salt regardless of who initiates', () => {
    // Verified implicitly by DH symmetry above:
    // sorted(['comms-dev', 'framework-research']) = "comms-dev|framework-research"
    // both sides must use this same string → SHA-256 → same salt → same HKDF output
    const cdKeys = cdCrypto.derivePairwiseKeys(TEAM_FR);
    const frKeys = frCrypto.derivePairwiseKeys(TEAM_CD);
    expect(cdKeys.encryptionKey).toEqual(frKeys.encryptionKey);
  });
});

// ── E2E encrypt / decrypt ─────────────────────────────────────────────────────

describe('v2 crypto — e2eEncrypt / e2eDecrypt', () => {

  const MESSAGE_ID = 'e2e-test-001';
  const PLAINTEXT  = Buffer.from('Hello from comms-dev to framework-research');

  it('round-trip: encrypt on sender side, decrypt on receiver side', async () => {
    const payload   = await cdCrypto.e2eEncrypt(PLAINTEXT, TEAM_FR, MESSAGE_ID);
    const plaintext = await frCrypto.e2eDecrypt(payload, MESSAGE_ID);
    expect(plaintext).toEqual(PLAINTEXT);
  });

  it('E2EPayload has version 2', async () => {
    const payload = await cdCrypto.e2eEncrypt(PLAINTEXT, TEAM_FR, MESSAGE_ID);
    expect(payload.version).toBe(2);
  });

  it('E2EPayload.sender_team is the sending team name', async () => {
    const payload = await cdCrypto.e2eEncrypt(PLAINTEXT, TEAM_FR, MESSAGE_ID);
    expect(payload.sender_team).toBe(TEAM_CD);
  });

  it('E2EPayload.iv is 12 bytes (base64-encoded)', async () => {
    const payload = await cdCrypto.e2eEncrypt(PLAINTEXT, TEAM_FR, MESSAGE_ID);
    expect(Buffer.from(payload.iv, 'base64')).toHaveLength(12);
  });

  it('E2EPayload.tag is 16 bytes (base64-encoded)', async () => {
    const payload = await cdCrypto.e2eEncrypt(PLAINTEXT, TEAM_FR, MESSAGE_ID);
    expect(Buffer.from(payload.tag, 'base64')).toHaveLength(16);
  });

  it('each e2eEncrypt call generates a fresh IV (nonce uniqueness)', async () => {
    const p1 = await cdCrypto.e2eEncrypt(PLAINTEXT, TEAM_FR, MESSAGE_ID);
    const p2 = await cdCrypto.e2eEncrypt(PLAINTEXT, TEAM_FR, MESSAGE_ID);
    expect(p1.iv).not.toBe(p2.iv);
  });

  it('HUB-3: wrong receiver — different pairwise key causes decryption failure', async () => {
    // Scenario: hub redirects A→B message to team C.
    // C has a different pairwise key with A — decryption must fail.
    const bundleWithOther: KeyBundle = {
      ...keyBundle,
      teams: {
        ...keyBundle.teams,
        [TEAM_OTHER]: { sign_pub: otherSign.publicKey, enc_pub: otherEnc.publicKey },
      },
    };
    const otherCrypto = createCryptoAPIv2({
      teamName:  TEAM_OTHER,
      signKey:   Buffer.from(otherSign.privateKey),
      encKey:    Buffer.from(otherEnc.privateKey),
      keyBundle: bundleWithOther,
    });

    const payload = await cdCrypto.e2eEncrypt(PLAINTEXT, TEAM_FR, MESSAGE_ID);
    // Attempt decrypt as OTHER — has a different pairwise key with CD
    await expect(otherCrypto.e2eDecrypt(payload, MESSAGE_ID)).rejects.toThrow();
  });

  it('AAD mismatch: modified message ID causes decryption failure', async () => {
    // AAD = "v2:" + message.id + ":" + sender_team + ":" + receiver_team
    // Hub re-routes with a different message ID — AAD no longer matches
    const payload = await cdCrypto.e2eEncrypt(PLAINTEXT, TEAM_FR, MESSAGE_ID);
    await expect(frCrypto.e2eDecrypt(payload, 'tampered-msg-id')).rejects.toThrow();
  });

  it('tampered ciphertext causes decryption failure', async () => {
    const payload = await cdCrypto.e2eEncrypt(PLAINTEXT, TEAM_FR, MESSAGE_ID);
    const bytes   = Buffer.from(payload.ciphertext, 'base64');
    bytes[0] ^= 0xff; // flip first byte
    const tampered: E2EPayload = { ...payload, ciphertext: bytes.toString('base64') };
    await expect(frCrypto.e2eDecrypt(tampered, MESSAGE_ID)).rejects.toThrow();
  });

  it('tampered GCM tag causes decryption failure', async () => {
    const payload  = await cdCrypto.e2eEncrypt(PLAINTEXT, TEAM_FR, MESSAGE_ID);
    const tagBytes = Buffer.from(payload.tag, 'base64');
    tagBytes[0] ^= 0xff;
    const tampered: E2EPayload = { ...payload, tag: tagBytes.toString('base64') };
    await expect(frCrypto.e2eDecrypt(tampered, MESSAGE_ID)).rejects.toThrow();
  });

  it('empty plaintext round-trips without error', async () => {
    const payload   = await cdCrypto.e2eEncrypt(Buffer.alloc(0), TEAM_FR, 'empty-msg-001');
    const plaintext = await frCrypto.e2eDecrypt(payload, 'empty-msg-001');
    expect(plaintext).toEqual(Buffer.alloc(0));
  });
});

// ── Ed25519 signing ───────────────────────────────────────────────────────────

function buildTestMessage(overrides: Partial<Message> = {}): Message {
  return {
    version:   '1',
    id:        'sign-test-001',
    timestamp: '2026-03-30T00:00:00Z',
    from:      { team: TEAM_CD, agent: 'babbage' },
    to:        { team: TEAM_FR, agent: 'herald' },
    type:      'query',
    priority:  'normal',
    reply_to:  null,
    body:      'test body payload',
    checksum:  'sha256:placeholder',
    ...overrides,
  };
}

describe('v2 crypto — Ed25519 signEnvelope / verifySignature', () => {

  it('valid sign/verify round-trip', () => {
    const message   = buildTestMessage();
    const signature = cdCrypto.signEnvelope(message);
    const signed: SignedMessage = {
      ...message,
      signature,
      body_hash: sha256hex(message.body),
    };
    expect(frCrypto.verifySignature(signed)).toBe(true);
  });

  it('signEnvelope returns a 64-byte base64-encoded Ed25519 signature', () => {
    const message   = buildTestMessage();
    const signature = cdCrypto.signEnvelope(message);
    // Ed25519 signatures are exactly 64 bytes
    expect(Buffer.from(signature, 'base64')).toHaveLength(64);
  });

  it('HUB-8: tampered from.team causes signature verification failure', () => {
    const message   = buildTestMessage();
    const signature = cdCrypto.signEnvelope(message);
    const signed: SignedMessage = {
      ...message,
      from:      { team: 'attacker-team', agent: 'babbage' }, // hub forges sender
      signature,
      body_hash: sha256hex(message.body),
    };
    expect(frCrypto.verifySignature(signed)).toBe(false);
  });

  it('HUB-3: tampered to.team causes signature verification failure', () => {
    const message   = buildTestMessage();
    const signature = cdCrypto.signEnvelope(message);
    const signed: SignedMessage = {
      ...message,
      to:        { team: 'wrong-team', agent: 'herald' }, // hub redirects
      signature,
      body_hash: sha256hex(message.body),
    };
    expect(frCrypto.verifySignature(signed)).toBe(false);
  });

  it('tampered body causes signature verification failure', () => {
    // body_hash field is correct for original body, but body has been changed.
    // Verifier recomputes SHA-256(body) and checks against body_hash → mismatch.
    const message   = buildTestMessage();
    const signature = cdCrypto.signEnvelope(message);
    const signed: SignedMessage = {
      ...message,
      body:      'injected body content',         // tampered
      signature,
      body_hash: sha256hex(message.body),          // hash of ORIGINAL body
    };
    expect(frCrypto.verifySignature(signed)).toBe(false);
  });

  it('tampered body_hash causes signature verification failure', () => {
    const message   = buildTestMessage();
    const signature = cdCrypto.signEnvelope(message);
    const signed: SignedMessage = {
      ...message,
      signature,
      body_hash: 'sha256:' + 'aa'.repeat(32), // all-0xaa hash — not the real hash
    };
    expect(frCrypto.verifySignature(signed)).toBe(false);
  });

  it('signature from wrong team key fails verification (HUB-2 scenario)', () => {
    // frCrypto (framework-research) signs a message that claims to be from comms-dev.
    // Verifier looks up comms-dev public key — signature won't match.
    const message      = buildTestMessage(); // from.team = comms-dev
    const wrongSig     = frCrypto.signEnvelope(message); // signed with FR key, not CD
    const signed: SignedMessage = {
      ...message,
      signature: wrongSig,
      body_hash: sha256hex(message.body),
    };
    expect(frCrypto.verifySignature(signed)).toBe(false);
  });

  it('missing signature field returns false — API contract: returns boolean, must not throw', () => {
    // Per CryptoAPIv2 interface: verifySignature(...): boolean
    // Implementation must null-check message.signature before Buffer.from().
    // Throwing here violates the type contract (callers check return value, not exceptions).
    const message = buildTestMessage();
    const unsigned = {
      ...message,
      body_hash: sha256hex(message.body),
      // signature deliberately absent
    } as unknown as SignedMessage;
    expect(frCrypto.verifySignature(unsigned)).toBe(false);
  });

  it('tampered timestamp causes signature verification failure (replay detection)', () => {
    const message   = buildTestMessage();
    const signature = cdCrypto.signEnvelope(message);
    const signed: SignedMessage = {
      ...message,
      timestamp: '2020-01-01T00:00:00Z', // replayed with old timestamp
      signature,
      body_hash: sha256hex(message.body),
    };
    expect(frCrypto.verifySignature(signed)).toBe(false);
  });

  it('tampered message ID causes signature verification failure', () => {
    const message   = buildTestMessage();
    const signature = cdCrypto.signEnvelope(message);
    const signed: SignedMessage = {
      ...message,
      id:        'tampered-id-xyz',
      signature,
      body_hash: sha256hex(message.body),
    };
    expect(frCrypto.verifySignature(signed)).toBe(false);
  });

  it('tampered message type causes signature verification failure', () => {
    const message   = buildTestMessage();
    const signature = cdCrypto.signEnvelope(message);
    const signed: SignedMessage = {
      ...message,
      type:      'handoff', // was 'query'
      signature,
      body_hash: sha256hex(message.body),
    };
    expect(frCrypto.verifySignature(signed)).toBe(false);
  });
});

// ── loadKeyBundle ─────────────────────────────────────────────────────────────

describe('v2 crypto — loadKeyBundle', () => {

  it('loads a valid bundle from disk', () => {
    const path = join(tmpdir(), `comms-bundle-valid-${Date.now()}.json`);
    writeFileSync(path, JSON.stringify(keyBundle));
    const loaded = cdCrypto.loadKeyBundle(path);
    expect(loaded.version).toBe(1);
    expect(loaded.teams[TEAM_CD]).toBeDefined();
    expect(loaded.teams[TEAM_FR]).toBeDefined();
  });

  it('loaded bundle has sign_pub and enc_pub for each team', () => {
    const path = join(tmpdir(), `comms-bundle-keys-${Date.now()}.json`);
    writeFileSync(path, JSON.stringify(keyBundle));
    const loaded = cdCrypto.loadKeyBundle(path);
    expect(typeof loaded.teams[TEAM_CD].sign_pub).toBe('string');
    expect(typeof loaded.teams[TEAM_CD].enc_pub).toBe('string');
  });

  it('rejects a bundle with missing teams field', () => {
    // Guard: if loadKeyBundle is missing, this test must fail (not accidentally pass
    // because "not a function" also throws).
    expect(typeof cdCrypto.loadKeyBundle).toBe('function');
    const bad  = { version: 1, generated_at: '2026-01-01T00:00:00Z' };
    const path = join(tmpdir(), `comms-bundle-bad-${Date.now()}.json`);
    writeFileSync(path, JSON.stringify(bad));
    expect(() => cdCrypto.loadKeyBundle(path)).toThrow();
  });

  it('rejects a non-existent bundle path', () => {
    expect(typeof cdCrypto.loadKeyBundle).toBe('function');
    expect(() => cdCrypto.loadKeyBundle('/nonexistent/path/comms-bundle.json')).toThrow();
  });

  it('rejects a bundle with invalid JSON', () => {
    expect(typeof cdCrypto.loadKeyBundle).toBe('function');
    const path = join(tmpdir(), `comms-bundle-invalid-json-${Date.now()}.json`);
    writeFileSync(path, 'not valid json {{{}}}');
    expect(() => cdCrypto.loadKeyBundle(path)).toThrow();
  });
});

// ── Version compatibility ─────────────────────────────────────────────────────

describe('v2 crypto — version compatibility', () => {

  it('v1 createCryptoAPI is unaffected by v2 exports', async () => {
    const psk  = Buffer.alloc(32, 0xab);
    const keys = deriveKey(psk, 'comms-v1');
    const api  = createCryptoAPI(keys);
    const payload   = await api.encrypt(Buffer.from('v1 test'), { aad: 'test:v1' });
    const plaintext = await api.decrypt(payload);
    expect(payload.version).toBe(1);
    expect(plaintext.toString()).toBe('v1 test');
  });

  it('createCryptoAPIv2 returns an object with all required v2 methods', () => {
    expect(typeof cdCrypto.e2eEncrypt).toBe('function');
    expect(typeof cdCrypto.e2eDecrypt).toBe('function');
    expect(typeof cdCrypto.signEnvelope).toBe('function');
    expect(typeof cdCrypto.verifySignature).toBe('function');
    expect(typeof cdCrypto.loadKeyBundle).toBe('function');
    expect(typeof cdCrypto.derivePairwiseKeys).toBe('function');
  });

  it('CryptoAPIv2 also exposes v1 methods (extends CryptoAPI)', () => {
    // Per spec: CryptoAPIv2 extends CryptoAPI — backward compat
    expect(typeof cdCrypto.encrypt).toBe('function');
    expect(typeof cdCrypto.decrypt).toBe('function');
    expect(typeof cdCrypto.computeChecksum).toBe('function');
    expect(typeof cdCrypto.verifyIntegrity).toBe('function');
    expect(typeof cdCrypto.deriveKey).toBe('function');
  });
});

// ── Known-answer vectors (Vigenere's official test vectors, 2026-03-30) ──────
//
// All expected values computed from the fixed keys below using a reference
// implementation. These pin the crypto implementation against regressions.

const VECTOR_KEYS = {
  teamA: {
    sign_priv: '-----BEGIN PRIVATE KEY-----\nREDACTED-ED25519-PRIVATE-KEY-TEAM-A\n-----END PRIVATE KEY-----\n',
    sign_pub:  '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA1+OdhVKAC1C3UfLMFgAZ9YoCn5l/3nfeaX3f2bW6rRg=\n-----END PUBLIC KEY-----\n',
    enc_priv:  '-----BEGIN PRIVATE KEY-----\nREDACTED-X25519-PRIVATE-KEY-TEAM-A\n-----END PRIVATE KEY-----\n',
    enc_pub:   '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VuAyEAUC7S6stRc3MuoRMuWgVAQqvbRzxt2+6+Zubc1YvsumM=\n-----END PUBLIC KEY-----\n',
  },
  teamB: {
    sign_priv: '-----BEGIN PRIVATE KEY-----\nREDACTED-ED25519-PRIVATE-KEY-TEAM-B\n-----END PRIVATE KEY-----\n',
    sign_pub:  '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA8YbnndgDNacLUIMxG6oKLGfMSmn8jJx3rrRWTs/3D2c=\n-----END PUBLIC KEY-----\n',
    enc_priv:  '-----BEGIN PRIVATE KEY-----\nREDACTED-X25519-PRIVATE-KEY-TEAM-B\n-----END PRIVATE KEY-----\n',
    enc_pub:   '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VuAyEAttjw/K9Ri0ImqjTUo65D6E+PJmByA7oThqYYsA3wnwA=\n-----END PUBLIC KEY-----\n',
  },
};

const VECTOR_BUNDLE: KeyBundle = {
  version:      1,
  generated_at: '2026-03-30T00:00:00Z',
  teams: {
    'team-a': { sign_pub: VECTOR_KEYS.teamA.sign_pub, enc_pub: VECTOR_KEYS.teamA.enc_pub },
    'team-b': { sign_pub: VECTOR_KEYS.teamB.sign_pub, enc_pub: VECTOR_KEYS.teamB.enc_pub },
  },
};

// Known ciphertext — generated with fixed IV=000102030405060708090a0b
// Plaintext: 'Hello from team-a to team-b', MESSAGE_ID: 'msg-test-vector-001'
const VECTOR_KNOWN_PAYLOAD: E2EPayload = {
  iv:          'AAECAwQFBgcICQoL',
  ciphertext:  'Nhe3jjbUmBEHX69kFqjG6lIACN/n5Uf9XI1v',
  tag:         'GyzEZG916jWLkHsNiQ5O3g==',
  sender_team: 'team-a',
  version:     2,
};
const VECTOR_PLAINTEXT  = 'Hello from team-a to team-b';
const VECTOR_MESSAGE_ID = 'msg-test-vector-001';

const VECTOR_MESSAGE: Message = {
  version:   '1',
  id:        'msg-test-vector-001',
  timestamp: '2026-03-30T12:00:00.000Z',
  from:      { team: 'team-a', agent: 'herald' },
  to:        { team: 'team-b', agent: 'marconi' },
  type:      'query',
  priority:  'normal',
  reply_to:  null,
  body:      'test-body-content',
  checksum:  'sha256:placeholder',
};
const VECTOR_EXPECTED_BODY_HASH = 'sha256:8f6d4a1e19b34f4a1e0a68e0da202ab29fb913fa04cbc685836bb25af64ed2f8';
const VECTOR_EXPECTED_SIG_B64   = 'RQ+XQC9I0jspnH35FkG6VC2HVeHHAXon8Eo9Z6ORmuzOWJCxBsPJxzF07h/ymwdUncwaFDcOPgd2zgvq04/CDg==';

describe('v2 crypto — known-answer vectors', () => {

  let vectorCryptoA: CryptoAPIv2;
  let vectorCryptoB: CryptoAPIv2;

  beforeAll(() => {
    vectorCryptoA = createCryptoAPIv2({
      teamName:  'team-a',
      signKey:   Buffer.from(VECTOR_KEYS.teamA.sign_priv),
      encKey:    Buffer.from(VECTOR_KEYS.teamA.enc_priv),
      keyBundle: VECTOR_BUNDLE,
    });
    vectorCryptoB = createCryptoAPIv2({
      teamName:  'team-b',
      signKey:   Buffer.from(VECTOR_KEYS.teamB.sign_priv),
      encKey:    Buffer.from(VECTOR_KEYS.teamB.enc_priv),
      keyBundle: VECTOR_BUNDLE,
    });
  });

  it('Vector 1 — pairwise key derivation: fixed X25519 keypairs → expected HKDF-SHA256 output', () => {
    const EXPECTED_ENC_KEY = '9d7005be296eb14309df39b0d750f0cf7d49b40ccc6f4055364523be97479e48';
    const EXPECTED_INT_KEY = '7bfc34feb0e9b0cf86d0c658e08bc34ad40de5e178e1d303f3cbf7f2fd749f14';

    const keysA = vectorCryptoA.derivePairwiseKeys('team-b');
    const keysB = vectorCryptoB.derivePairwiseKeys('team-a');

    // Both sides must derive identical keys (DH symmetry + salt ordering)
    expect(keysA.encryptionKey.toString('hex')).toBe(EXPECTED_ENC_KEY);
    expect(keysB.encryptionKey.toString('hex')).toBe(EXPECTED_ENC_KEY);
    expect(keysA.integrityKey.toString('hex')).toBe(EXPECTED_INT_KEY);
    expect(keysB.integrityKey.toString('hex')).toBe(EXPECTED_INT_KEY);
  });

  it('Vector 2 — e2eEncrypt known-answer: vector keys round-trip is consistent with known ciphertext', async () => {
    // e2eEncrypt uses a random IV, so ciphertext output cannot be pinned directly.
    // Instead: verify that encrypt→decrypt with vector keys recovers plaintext,
    // and that the KNOWN_PAYLOAD (same pairwise key, different IV) also decrypts.
    const plaintext = Buffer.from(VECTOR_PLAINTEXT);
    const payload   = await vectorCryptoA.e2eEncrypt(plaintext, 'team-b', VECTOR_MESSAGE_ID);
    const recovered = await vectorCryptoB.e2eDecrypt(payload, VECTOR_MESSAGE_ID);
    expect(recovered.toString()).toBe(VECTOR_PLAINTEXT);
  });

  it('Vector 3 — e2eDecrypt known-answer: spec ciphertext/tag/IV → expected plaintext', async () => {
    const plaintext = await vectorCryptoB.e2eDecrypt(VECTOR_KNOWN_PAYLOAD, VECTOR_MESSAGE_ID);
    expect(plaintext.toString()).toBe(VECTOR_PLAINTEXT);
  });

  it('Vector 4 — signEnvelope known-answer: fixed Ed25519 key + canonical message → expected signature', () => {
    const signature = vectorCryptoA.signEnvelope(VECTOR_MESSAGE);
    expect(signature).toBe(VECTOR_EXPECTED_SIG_B64);
  });

  it('Vector 5 — verifySignature known-answer: official test vector passes', () => {
    const signed: SignedMessage = {
      ...VECTOR_MESSAGE,
      signature: VECTOR_EXPECTED_SIG_B64,
      body_hash: VECTOR_EXPECTED_BODY_HASH,
    };
    // vectorCryptoB verifies using team-a's sign_pub from VECTOR_BUNDLE
    expect(vectorCryptoB.verifySignature(signed)).toBe(true);
  });
});
