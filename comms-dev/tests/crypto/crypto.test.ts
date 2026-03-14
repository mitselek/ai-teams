// (*CD:Kerckhoffs*)
// Crypto module correctness tests.
// Tests AES-256-GCM encryption, HKDF key derivation, HMAC-SHA256 integrity.
// Kerckhoffs principle: we test as if the attacker knows the source. Only the key is secret.

import { describe, it, expect, beforeAll } from 'vitest';
import {
  createCryptoAPI,
  deriveKey,
  encrypt,
  decrypt,
  computeChecksum,
  verifyIntegrity,
  loadPsk,
} from '../../src/crypto/index.js';
import type { CryptoAPI, DerivedKeys, EncryptedPayload } from '../../src/crypto/index.js';

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

/** A well-formed 32-byte PSK (256-bit), hex-encoded */
const PSK_HEX = 'a'.repeat(64); // 64 hex chars = 32 bytes
const PSK_BUF = Buffer.from(PSK_HEX, 'hex');
const CONTEXT = 'comms-v1';

let keys: DerivedKeys;
let api: CryptoAPI;

beforeAll(() => {
  keys = deriveKey(PSK_BUF, CONTEXT);
  api = createCryptoAPI(keys);
});

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

describe('deriveKey', () => {
  it('produces a 32-byte encryption key', () => {
    expect(keys.encryptionKey).toBeInstanceOf(Buffer);
    expect(keys.encryptionKey.byteLength).toBe(32);
  });

  it('produces a 32-byte integrity key', () => {
    expect(keys.integrityKey).toBeInstanceOf(Buffer);
    expect(keys.integrityKey.byteLength).toBe(32);
  });

  it('encryption key and integrity key are distinct (no key reuse)', () => {
    expect(keys.encryptionKey.equals(keys.integrityKey)).toBe(false);
  });

  it('derivation is deterministic: same PSK + context yields same keys', () => {
    const keys2 = deriveKey(PSK_BUF, CONTEXT);
    expect(keys.encryptionKey.equals(keys2.encryptionKey)).toBe(true);
    expect(keys.integrityKey.equals(keys2.integrityKey)).toBe(true);
  });

  it('different context produces different keys (domain separation)', () => {
    const keys2 = deriveKey(PSK_BUF, 'comms-v2');
    expect(keys.encryptionKey.equals(keys2.encryptionKey)).toBe(false);
    expect(keys.integrityKey.equals(keys2.integrityKey)).toBe(false);
  });

  it('different PSK produces different keys', () => {
    const psk2 = Buffer.from('b'.repeat(64), 'hex');
    const keys2 = deriveKey(psk2, CONTEXT);
    expect(keys.encryptionKey.equals(keys2.encryptionKey)).toBe(false);
  });

  it('rejects PSK shorter than 32 bytes', () => {
    const shortPsk = Buffer.from('aa'.repeat(16), 'hex'); // 16 bytes
    expect(() => deriveKey(shortPsk, CONTEXT)).toThrow(/too short/i);
  });

  it('accepts PSK exactly 32 bytes', () => {
    const exactPsk = Buffer.from('cc'.repeat(32), 'hex');
    expect(() => deriveKey(exactPsk, CONTEXT)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Encrypt / decrypt — happy path
// ---------------------------------------------------------------------------

describe('encrypt/decrypt roundtrip', () => {
  it('decrypts back to original plaintext', async () => {
    const plaintext = Buffer.from('Hello, comms-dev!');
    const payload = await api.encrypt(plaintext);
    const decrypted = await api.decrypt(payload);
    expect(decrypted.equals(plaintext)).toBe(true);
  });

  it('handles empty plaintext (zero-byte message)', async () => {
    const plaintext = Buffer.alloc(0);
    const payload = await api.encrypt(plaintext);
    const decrypted = await api.decrypt(payload);
    expect(decrypted.byteLength).toBe(0);
  });

  it('handles max-size plaintext (1 MB)', async () => {
    const plaintext = Buffer.alloc(1024 * 1024, 0x41); // 1MB of 'A'
    const payload = await api.encrypt(plaintext);
    const decrypted = await api.decrypt(payload);
    expect(decrypted.equals(plaintext)).toBe(true);
  }, 15000); // extended timeout for large buffer

  it('handles non-ASCII / binary plaintext', async () => {
    const plaintext = Buffer.from([0x00, 0xff, 0xfe, 0x80, 0x01]);
    const payload = await api.encrypt(plaintext);
    const decrypted = await api.decrypt(payload);
    expect(decrypted.equals(plaintext)).toBe(true);
  });

  it('returned payload has expected structure (iv, ciphertext, tag, aad, version)', async () => {
    const payload = await api.encrypt(Buffer.from('test'));
    expect(payload.version).toBe(1);
    expect(typeof payload.iv).toBe('string');
    expect(typeof payload.ciphertext).toBe('string');
    expect(typeof payload.tag).toBe('string');
    expect(typeof payload.aad).toBe('string');
    // Verify they are valid base64
    expect(() => Buffer.from(payload.iv, 'base64')).not.toThrow();
    expect(() => Buffer.from(payload.ciphertext, 'base64')).not.toThrow();
    expect(() => Buffer.from(payload.tag, 'base64')).not.toThrow();
  });

  it('IV is 12 bytes (96-bit GCM standard)', async () => {
    const payload = await api.encrypt(Buffer.from('nonce-size-check'));
    const ivBytes = Buffer.from(payload.iv, 'base64');
    expect(ivBytes.byteLength).toBe(12);
  });

  it('auth tag is 16 bytes (128-bit full GCM tag)', async () => {
    const payload = await api.encrypt(Buffer.from('tag-size-check'));
    const tagBytes = Buffer.from(payload.tag, 'base64');
    expect(tagBytes.byteLength).toBe(16);
  });
});

// ---------------------------------------------------------------------------
// Nonce uniqueness (no IV reuse)
// ---------------------------------------------------------------------------

describe('nonce uniqueness', () => {
  it('each encryption produces a unique IV', async () => {
    const pt = Buffer.from('same message');
    const results = await Promise.all(Array.from({ length: 50 }, () => api.encrypt(pt)));
    const ivs = results.map((r) => r.iv);
    const unique = new Set(ivs);
    expect(unique.size).toBe(50);
  });

  it('same plaintext encrypts to different ciphertext each time (semantic security)', async () => {
    const pt = Buffer.from('determinism test');
    const p1 = await api.encrypt(pt);
    const p2 = await api.encrypt(pt);
    expect(p1.ciphertext).not.toBe(p2.ciphertext);
  });
});

// ---------------------------------------------------------------------------
// Additional Authenticated Data (AAD)
// ---------------------------------------------------------------------------

describe('AAD / ciphertext transplant prevention', () => {
  it('encrypts and decrypts successfully when AAD provided', async () => {
    const pt = Buffer.from('secret');
    const aad = 'msg-id:abc123:sender:team-a';
    const payload = await encrypt(keys.encryptionKey, pt, { aad });
    const decrypted = await decrypt(keys.encryptionKey, payload);
    expect(decrypted.equals(pt)).toBe(true);
  });

  it('empty AAD (no options) and empty AAD (explicit empty string) both work', async () => {
    const pt = Buffer.from('aad test');
    const p1 = await encrypt(keys.encryptionKey, pt);
    const p2 = await encrypt(keys.encryptionKey, pt, { aad: '' });
    const d1 = await decrypt(keys.encryptionKey, p1);
    const d2 = await decrypt(keys.encryptionKey, p2);
    expect(d1.equals(pt)).toBe(true);
    expect(d2.equals(pt)).toBe(true);
  });

  it('decryption fails if AAD is modified after encryption (transplant attack)', async () => {
    const pt = Buffer.from('protected');
    const payload = await encrypt(keys.encryptionKey, pt, { aad: 'original-aad' });
    // Tamper with the AAD field
    const tampered: EncryptedPayload = {
      ...payload,
      aad: Buffer.from('attacker-aad').toString('base64'),
    };
    await expect(decrypt(keys.encryptionKey, tampered)).rejects.toThrow(/tampered|authentication/i);
  });
});

// ---------------------------------------------------------------------------
// Tamper detection
// ---------------------------------------------------------------------------

describe('tamper detection', () => {
  it('rejects ciphertext with modified byte', async () => {
    const pt = Buffer.from('tamper me');
    const payload = await api.encrypt(pt);
    const ctBytes = Buffer.from(payload.ciphertext, 'base64');
    ctBytes[0] ^= 0xff; // flip all bits in first byte
    const tampered: EncryptedPayload = {
      ...payload,
      ciphertext: ctBytes.toString('base64'),
    };
    await expect(api.decrypt(tampered)).rejects.toThrow(/tampered|authentication/i);
  });

  it('rejects payload with modified IV', async () => {
    const pt = Buffer.from('iv tamper');
    const payload = await api.encrypt(pt);
    const ivBytes = Buffer.from(payload.iv, 'base64');
    ivBytes[0] ^= 0x01;
    const tampered: EncryptedPayload = { ...payload, iv: ivBytes.toString('base64') };
    await expect(api.decrypt(tampered)).rejects.toThrow();
  });

  it('rejects payload with modified auth tag', async () => {
    const pt = Buffer.from('tag tamper');
    const payload = await api.encrypt(pt);
    const tagBytes = Buffer.from(payload.tag, 'base64');
    tagBytes[0] ^= 0xff;
    const tampered: EncryptedPayload = { ...payload, tag: tagBytes.toString('base64') };
    await expect(api.decrypt(tampered)).rejects.toThrow(/tampered|authentication/i);
  });

  it('rejects payload encrypted with a different key (wrong key)', async () => {
    const pt = Buffer.from('wrong key test');
    const payload = await api.encrypt(pt);
    const wrongKeys = deriveKey(Buffer.from('f'.repeat(64), 'hex'), CONTEXT);
    await expect(decrypt(wrongKeys.encryptionKey, payload)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Malformed payload handling
// ---------------------------------------------------------------------------

describe('malformed payload handling', () => {
  it('rejects payload with unsupported version', async () => {
    const pt = Buffer.from('version test');
    const payload = await api.encrypt(pt);
    const bad = { ...payload, version: 2 } as unknown as EncryptedPayload;
    await expect(api.decrypt(bad)).rejects.toThrow(/unsupported.*version/i);
  });

  it('rejects payload with IV of wrong length', async () => {
    const pt = Buffer.from('bad iv');
    const payload = await api.encrypt(pt);
    const bad: EncryptedPayload = {
      ...payload,
      iv: Buffer.from('tooshort').toString('base64'), // not 12 bytes
    };
    await expect(api.decrypt(bad)).rejects.toThrow(/invalid iv length/i);
  });

  it('rejects payload with tag of wrong length', async () => {
    const pt = Buffer.from('bad tag');
    const payload = await api.encrypt(pt);
    const bad: EncryptedPayload = {
      ...payload,
      tag: Buffer.from('short').toString('base64'), // not 16 bytes
    };
    await expect(api.decrypt(bad)).rejects.toThrow(/invalid tag length/i);
  });

  it('rejects entirely empty ciphertext with wrong key (not silent)', async () => {
    const pt = Buffer.from('empty ct');
    const payload = await api.encrypt(pt);
    const bad: EncryptedPayload = { ...payload, ciphertext: '' };
    await expect(api.decrypt(bad)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Checksum / integrity (HMAC-SHA256)
// ---------------------------------------------------------------------------

describe('computeChecksum', () => {
  it('returns a string prefixed with "sha256:"', () => {
    const checksum = api.computeChecksum(Buffer.from('data'));
    expect(checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('is deterministic for same key and data', () => {
    const data = Buffer.from('deterministic');
    const c1 = api.computeChecksum(data);
    const c2 = api.computeChecksum(data);
    expect(c1).toBe(c2);
  });

  it('different data produces different checksum', () => {
    const c1 = api.computeChecksum(Buffer.from('data-a'));
    const c2 = api.computeChecksum(Buffer.from('data-b'));
    expect(c1).not.toBe(c2);
  });

  it('different integrity key produces different checksum (key separation)', () => {
    const keys2 = deriveKey(Buffer.from('e'.repeat(64), 'hex'), CONTEXT);
    const api2 = createCryptoAPI(keys2);
    const data = Buffer.from('same data');
    expect(api.computeChecksum(data)).not.toBe(api2.computeChecksum(data));
  });

  it('handles empty data', () => {
    expect(() => api.computeChecksum(Buffer.alloc(0))).not.toThrow();
  });
});

describe('verifyIntegrity', () => {
  it('returns true for correct checksum', () => {
    const data = Buffer.from('hello integrity');
    const checksum = api.computeChecksum(data);
    expect(api.verifyIntegrity(data, checksum)).toBe(true);
  });

  it('returns false for wrong checksum value', () => {
    const data = Buffer.from('integrity test');
    const checksum = api.computeChecksum(data);
    const wrong = checksum.replace(/[0-9a-f]$/, (c) => (c === 'f' ? '0' : 'f'));
    expect(api.verifyIntegrity(data, wrong)).toBe(false);
  });

  it('returns false for modified data', () => {
    const data = Buffer.from('original data');
    const checksum = api.computeChecksum(data);
    const modified = Buffer.from('modified data');
    expect(api.verifyIntegrity(modified, checksum)).toBe(false);
  });

  it('returns false for checksum without "sha256:" prefix', () => {
    const data = Buffer.from('prefix test');
    const checksum = api.computeChecksum(data).replace('sha256:', '');
    expect(api.verifyIntegrity(data, checksum)).toBe(false);
  });

  it('returns false for empty checksum string', () => {
    const data = Buffer.from('empty checksum');
    expect(api.verifyIntegrity(data, '')).toBe(false);
  });

  it('checksum computed with one key does not verify with another (key isolation)', () => {
    const keys2 = deriveKey(Buffer.from('d'.repeat(64), 'hex'), CONTEXT);
    const api2 = createCryptoAPI(keys2);
    const data = Buffer.from('cross-key test');
    const checksum = api.computeChecksum(data);
    expect(api2.verifyIntegrity(data, checksum)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// loadPsk
// ---------------------------------------------------------------------------

describe('loadPsk', () => {
  it('parses a valid 64-char hex string into 32-byte buffer', () => {
    const buf = loadPsk('a'.repeat(64));
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.byteLength).toBe(32);
  });

  it('strips leading/trailing whitespace', () => {
    const buf = loadPsk(`  ${'b'.repeat(64)}\n`);
    expect(buf.byteLength).toBe(32);
  });

  it('accepts 64 hex chars (lowercase)', () => {
    expect(() => loadPsk('0123456789abcdef'.repeat(4))).not.toThrow();
  });

  it('accepts 64 hex chars (uppercase)', () => {
    expect(() => loadPsk('0123456789ABCDEF'.repeat(4))).not.toThrow();
  });

  it('rejects non-hex characters', () => {
    expect(() => loadPsk('z'.repeat(64))).toThrow(/hex/i);
  });

  it('rejects hex string shorter than 64 chars (< 32 bytes)', () => {
    expect(() => loadPsk('ab'.repeat(16))).toThrow(/too short/i); // 32 hex = 16 bytes
  });

  it('accepts hex string longer than 64 chars (extra entropy OK)', () => {
    expect(() => loadPsk('a'.repeat(128))).not.toThrow(); // 128 hex = 64 bytes
  });
});

// ---------------------------------------------------------------------------
// Known-answer vectors
// These tests verify AES-256-GCM with fixed inputs to catch regressions in the
// encrypt/decrypt pipeline. We control the IV by calling Node crypto directly,
// then round-trip through our decrypt() wrapper.
// ---------------------------------------------------------------------------

describe('known-answer vectors', () => {
  it('AES-256-GCM with all-zeros key+iv decrypts empty ciphertext to empty plaintext', async () => {
    const { createCipheriv } = await import('node:crypto');
    const key = Buffer.alloc(32, 0x00);
    const iv = Buffer.alloc(12, 0x00);
    const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
    const ct = Buffer.concat([cipher.update(Buffer.alloc(0)), cipher.final()]);
    const tag = cipher.getAuthTag();

    const knownPayload: EncryptedPayload = {
      version: 1,
      iv: iv.toString('base64'),
      ciphertext: ct.toString('base64'),
      tag: tag.toString('base64'),
      aad: '',
    };

    const decrypted = await decrypt(key, knownPayload);
    expect(decrypted.byteLength).toBe(0);
  });

  it('AES-256-GCM with fixed key+iv+plaintext recovers original plaintext', async () => {
    const { createCipheriv, createDecipheriv } = await import('node:crypto');
    const key = Buffer.alloc(32, 0x01);
    const iv = Buffer.alloc(12, 0x02);
    const plaintext = Buffer.from('Hello');

    const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
    const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Verify raw Node crypto roundtrip
    const decipher = createDecipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
    decipher.setAuthTag(tag);
    const recovered = Buffer.concat([decipher.update(ct), decipher.final()]);
    expect(recovered.equals(plaintext)).toBe(true);

    // Verify our decrypt() wrapper also recovers it
    const knownPayload: EncryptedPayload = {
      version: 1,
      iv: iv.toString('base64'),
      ciphertext: ct.toString('base64'),
      tag: tag.toString('base64'),
      aad: '',
    };
    const recovered2 = await decrypt(key, knownPayload);
    expect(recovered2.equals(plaintext)).toBe(true);
  });

  it('HMAC-SHA256 known-answer: all-zeros key + "abc" produces expected digest', async () => {
    const { createHmac } = await import('node:crypto');
    const key = Buffer.alloc(32, 0x00);
    const data = Buffer.from('abc');
    const hmac = createHmac('sha256', key);
    hmac.update(data);
    const expected = `sha256:${hmac.digest('hex')}`;

    // verifyIntegrity with matching key should confirm it
    expect(verifyIntegrity(key, data, expected)).toBe(true);
    // verifyIntegrity with wrong data should fail
    expect(verifyIntegrity(key, Buffer.from('xyz'), expected)).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Vigenere's official test vectors (received 2026-03-14)
  // ---------------------------------------------------------------------------

  it('HKDF key derivation: known PSK produces expected encryption key', () => {
    const psk = loadPsk('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2');
    const derived = deriveKey(psk, 'comms-v1');
    expect(derived.encryptionKey.toString('hex')).toBe(
      '379a447f9cbdb6d5f740bf45b5ab560084b91d0dd3d00508cf760f5edafedcca'
    );
  });

  it('HKDF key derivation: known PSK produces expected integrity key', () => {
    const psk = loadPsk('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2');
    const derived = deriveKey(psk, 'comms-v1');
    expect(derived.integrityKey.toString('hex')).toBe(
      '05460b9c146eb6d124364d52a3ff76a7de45008f0d23a54f02827cabcdd8f826'
    );
  });

  it('HMAC-SHA256 known-answer: Vigenere vector — "Hello, World!" with derived integrity key', () => {
    const psk = loadPsk('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2');
    const derived = deriveKey(psk, 'comms-v1');
    const officialApi = createCryptoAPI(derived);
    const checksum = officialApi.computeChecksum(Buffer.from('Hello, World!', 'utf-8'));
    expect(checksum).toBe(
      'sha256:cc16d65760ecde69ee848beda3ece08c58c1bd12f695f4553ef49550edb3c4cc'
    );
  });

  it('Vigenere vector: integrity verification passes for correct input', () => {
    const psk = loadPsk('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2');
    const derived = deriveKey(psk, 'comms-v1');
    const officialApi = createCryptoAPI(derived);
    const data = Buffer.from('Hello, World!', 'utf-8');
    const expected = 'sha256:cc16d65760ecde69ee848beda3ece08c58c1bd12f695f4553ef49550edb3c4cc';
    expect(officialApi.verifyIntegrity(data, expected)).toBe(true);
  });

  it('Vigenere vector: integrity verification fails for wrong data', () => {
    const psk = loadPsk('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2');
    const derived = deriveKey(psk, 'comms-v1');
    const officialApi = createCryptoAPI(derived);
    const expected = 'sha256:cc16d65760ecde69ee848beda3ece08c58c1bd12f695f4553ef49550edb3c4cc';
    expect(officialApi.verifyIntegrity(Buffer.from('Wrong data'), expected)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CryptoProvider adapter (Vigenere's bridge to Babbage's interface)
// ---------------------------------------------------------------------------

import { createCryptoProvider } from '../../src/crypto/provider.js';

describe('createCryptoProvider adapter', () => {
  it('encrypt returns a Buffer containing JSON-serialised EncryptedPayload', async () => {
    const provider = createCryptoProvider(api);
    const plaintext = Buffer.from('adapter test');
    const cipherBuf = await provider.encrypt(plaintext);
    expect(Buffer.isBuffer(cipherBuf)).toBe(true);
    const parsed = JSON.parse(cipherBuf.toString('utf-8'));
    expect(parsed).toHaveProperty('iv');
    expect(parsed).toHaveProperty('ciphertext');
    expect(parsed).toHaveProperty('tag');
    expect(parsed).toHaveProperty('version', 1);
  });

  it('decrypt recovers original plaintext from encrypted Buffer', async () => {
    const provider = createCryptoProvider(api);
    const plaintext = Buffer.from('roundtrip via provider');
    const cipherBuf = await provider.encrypt(plaintext);
    const recovered = await provider.decrypt(cipherBuf);
    expect(recovered.equals(plaintext)).toBe(true);
  });

  it('handles empty plaintext roundtrip', async () => {
    const provider = createCryptoProvider(api);
    const empty = Buffer.alloc(0);
    const cipherBuf = await provider.encrypt(empty);
    const recovered = await provider.decrypt(cipherBuf);
    expect(recovered.byteLength).toBe(0);
  });

  it('encrypt with AAD — decrypt recovers plaintext', async () => {
    const provider = createCryptoProvider(api);
    const plaintext = Buffer.from('aad via provider');
    const cipherBuf = await provider.encrypt(plaintext, 'msg-id:test:sender:team-a');
    const recovered = await provider.decrypt(cipherBuf);
    expect(recovered.equals(plaintext)).toBe(true);
  });

  it('tampered ciphertext buffer fails decryption', async () => {
    const provider = createCryptoProvider(api);
    const plaintext = Buffer.from('tamper provider');
    const cipherBuf = await provider.encrypt(plaintext);
    // Flip a byte in the JSON to corrupt ciphertext field
    const parsed = JSON.parse(cipherBuf.toString('utf-8'));
    const ctBytes = Buffer.from(parsed.ciphertext, 'base64');
    ctBytes[0] ^= 0xff;
    parsed.ciphertext = ctBytes.toString('base64');
    const tampered = Buffer.from(JSON.stringify(parsed), 'utf-8');
    await expect(provider.decrypt(tampered)).rejects.toThrow();
  });

  it('different provider instances (same keys) can cross-decrypt', async () => {
    const provider1 = createCryptoProvider(api);
    const provider2 = createCryptoProvider(api);
    const plaintext = Buffer.from('cross decrypt');
    const cipher = await provider1.encrypt(plaintext);
    const recovered = await provider2.decrypt(cipher);
    expect(recovered.equals(plaintext)).toBe(true);
  });
});
