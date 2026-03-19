// (*CD:Vigenere*)
// TLS configuration module for cross-team mTLS tunnels.
// Loads daemon key/cert, peer certs, computes fingerprints, validates key/cert pairs.
// Spec: #15 §1–§3, §5

import {
  createPrivateKey,
  createPublicKey,
  X509Certificate,
} from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { TLSSocket } from 'node:tls';
import type { Message } from '../types.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface DaemonCryptoConfig {
  /** PEM-encoded ECDSA P-256 private key */
  key: Buffer;
  /** PEM-encoded self-signed X.509 certificate */
  cert: Buffer;
  /** team-name → PEM-encoded peer certificate */
  peerCerts: Map<string, Buffer>;
  /** team-name → SHA-256 fingerprint (colon-separated hex) */
  peerFingerprints: Map<string, string>;
}

export interface LoadDaemonCryptoOptions {
  keyPath: string;
  certPath: string;
  peersDir: string;
}

// ── Core functions ───────────────────────────────────────────────────────────

/**
 * Load daemon key, cert, and peer certs from the filesystem.
 * Validates key/cert pair match and peer cert CN/filename alignment.
 */
export async function loadDaemonCrypto(
  opts: LoadDaemonCryptoOptions,
): Promise<DaemonCryptoConfig> {
  // Load and validate daemon key
  let keyPem: Buffer;
  try {
    keyPem = readFileSync(opts.keyPath);
  } catch {
    throw new Error(`Failed to read daemon key: ${opts.keyPath}`);
  }

  // Validate it's a valid PEM private key
  try {
    createPrivateKey(keyPem);
  } catch {
    throw new Error(`Invalid PEM private key: ${opts.keyPath}`);
  }

  // Load and validate daemon cert
  let certPem: Buffer;
  try {
    certPem = readFileSync(opts.certPath);
  } catch {
    throw new Error(`Failed to read daemon cert: ${opts.certPath}`);
  }

  // Validate it's a valid PEM X.509 certificate
  try {
    new X509Certificate(certPem);
  } catch {
    throw new Error(`Invalid PEM certificate: ${opts.certPath}`);
  }

  // Validate key/cert pair match
  validateKeyPair(keyPem, certPem);

  // Load peer certs
  const peerCerts = new Map<string, Buffer>();
  const peerFingerprints = new Map<string, string>();

  let peerFiles: string[];
  try {
    peerFiles = readdirSync(opts.peersDir).filter((f) => f.endsWith('.crt'));
  } catch {
    // peers dir doesn't exist or is empty — not fatal
    peerFiles = [];
  }

  for (const file of peerFiles) {
    const teamName = basename(file, '.crt');
    const certPath = join(opts.peersDir, file);

    try {
      const peerCertPem = readFileSync(certPath);
      const cert = new X509Certificate(peerCertPem);

      // Validate CN matches filename
      const cn = extractCN(cert);
      if (cn !== teamName) {
        throw new Error(
          `Peer cert CN mismatch: file "${file}" has CN="${cn}", expected CN="${teamName}"`,
        );
      }

      peerCerts.set(teamName, peerCertPem);
      peerFingerprints.set(teamName, cert.fingerprint256);
    } catch (err) {
      // CN mismatch is fatal for that peer — rethrow
      if (err instanceof Error && /CN.*mismatch/i.test(err.message)) {
        throw err;
      }
      // Invalid cert file — skip with warning
      console.warn(
        `[tls-config] Skipping invalid peer cert ${file}: ${(err as Error).message}`,
      );
    }
  }

  return { key: keyPem, cert: certPem, peerCerts, peerFingerprints };
}

/**
 * Compute SHA-256 fingerprint of a PEM-encoded X.509 certificate.
 * Returns colon-separated hex format: "AB:CD:EF:..."
 */
export function computeFingerprint(certPem: Buffer): string {
  const cert = new X509Certificate(certPem);
  return cert.fingerprint256;
}

/**
 * Extract the authenticated team name from a TLS socket.
 * Returns null if the socket has not been authenticated.
 */
export function getAuthenticatedTeam(socket: TLSSocket): string | null {
  const team = (socket as any)._authenticatedTeam;
  if (!team || typeof team !== 'string') {
    return null;
  }
  return team;
}

/**
 * Validate that from.team matches the mTLS-authenticated peer team.
 * Hard invariant: mismatch = reject immediately, no NACK.
 */
export function validateSenderIdentity(
  message: Message,
  authenticatedTeam: string,
): { valid: boolean; reason?: string } {
  // Reject if authenticatedTeam is missing/empty
  if (!authenticatedTeam) {
    return {
      valid: false,
      reason: 'No authenticated team on connection',
    };
  }

  // Reject if from.team is missing/empty/non-string
  const claimedTeam = message?.from?.team;
  if (!claimedTeam || typeof claimedTeam !== 'string') {
    return {
      valid: false,
      reason: 'Message from.team is missing or empty',
    };
  }

  // Strict equality — case-sensitive, no normalization
  if (claimedTeam !== authenticatedTeam) {
    return {
      valid: false,
      reason:
        `Sender team mismatch: message claims from.team="${claimedTeam}" ` +
        `but mTLS peer authenticated as "${authenticatedTeam}"`,
    };
  }

  return { valid: true };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function validateKeyPair(keyPem: Buffer, certPem: Buffer): void {
  const cert = new X509Certificate(certPem);
  const certPubKey = cert.publicKey;
  const privKey = createPrivateKey(keyPem);
  const derivedPubKey = createPublicKey(privKey);

  const certDer = certPubKey.export({ type: 'spki', format: 'der' });
  const derivedDer = derivedPubKey.export({ type: 'spki', format: 'der' });

  if (!certDer.equals(derivedDer)) {
    throw new Error(
      'Key/cert mismatch: daemon.key and daemon.crt public keys do not match',
    );
  }
}

function extractCN(cert: X509Certificate): string {
  // cert.subject format: "CN=team-name\n" or "CN=team-name"
  const match = cert.subject.match(/CN=([^\n]+)/);
  return match ? match[1].trim() : '';
}
