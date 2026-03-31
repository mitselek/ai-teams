// (*CD:Vigenere*)
// Public API for the crypto module.
// v1: PSK-based symmetric encryption (peer-to-peer)
// v2: Per-team asymmetric keys for hub-mode E2E encryption + message signing

// v1 exports
export { createCryptoAPI, deriveKey, encrypt, decrypt, computeChecksum, verifyIntegrity, loadPsk } from './crypto.js';
export { createCryptoProvider } from './provider.js';
export type { CryptoAPI, CryptoOptions, DerivedKeys, EncryptedPayload } from './types.js';

// v2 exports
export { createCryptoAPIv2, createCryptoAPIv2WithV1Compat, loadKeyBundle } from './crypto-v2.js';
export type { CryptoAPIv2, CryptoAPIv2Options, E2EPayload, KeyBundle, TeamPublicKeys, SignedMessage } from './types.js';
