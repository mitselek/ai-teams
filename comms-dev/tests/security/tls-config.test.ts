// (*CD:Kerckhoffs*)
// RED tests for TLS context creation, cert loading, fingerprint verification.
// Spec: #15 §1–§3
//
// Tests use test fixtures (self-signed certs generated in beforeAll).
// Node.js built-ins: tls, crypto, fs — no external dependencies.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  loadDaemonCrypto,
  computeFingerprint,
  getAuthenticatedTeam,
  type DaemonCryptoConfig,
} from '../../src/crypto/tls-config.js';

// ── Test fixture helpers ──────────────────────────────────────────────────────

function genSelfSignedCert(dir: string, cn: string, filename = cn): void {
  execSync(
    `openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${join(dir, `${filename}.key`)}" \
     -out "${join(dir, `${filename}.crt`)}" \
     -days 1 -nodes \
     -subj "/CN=${cn}" \
     -addext "subjectAltName=DNS:${cn}" 2>/dev/null`,
  );
}

let fixtureDir: string;
let peersDir: string;
let config: DaemonCryptoConfig;

beforeAll(() => {
  fixtureDir = join(tmpdir(), `kerckhoffs-tls-test-${Date.now()}`);
  peersDir = join(fixtureDir, 'peers');
  mkdirSync(peersDir, { recursive: true });

  // Generate daemon cert
  genSelfSignedCert(fixtureDir, 'comms-dev', 'daemon');

  // Generate peer certs — filenames match CNs
  genSelfSignedCert(peersDir, 'framework-research');
  genSelfSignedCert(peersDir, 'entu-research');
});

afterAll(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
});

// ── §2 loadDaemonCrypto — startup validation ───────────────────────────────

describe('loadDaemonCrypto — startup validation', () => {

  it('loads valid key, cert, and peer certs without error', async () => {
    config = await loadDaemonCrypto({
      keyPath:  join(fixtureDir, 'daemon.key'),
      certPath: join(fixtureDir, 'daemon.crt'),
      peersDir,
    });
    expect(config).toBeDefined();
    expect(config.peerFingerprints.size).toBe(2);
    expect(config.peerFingerprints.has('framework-research')).toBe(true);
    expect(config.peerFingerprints.has('entu-research')).toBe(true);
  });

  it('throws fatal error when daemon.key is missing', async () => {
    await expect(loadDaemonCrypto({
      keyPath:  join(fixtureDir, 'nonexistent.key'),
      certPath: join(fixtureDir, 'daemon.crt'),
      peersDir,
    })).rejects.toThrow();
  });

  it('throws fatal error when daemon.crt is missing', async () => {
    await expect(loadDaemonCrypto({
      keyPath:  join(fixtureDir, 'daemon.key'),
      certPath: join(fixtureDir, 'nonexistent.crt'),
      peersDir,
    })).rejects.toThrow();
  });

  it('throws fatal error when daemon.key is not valid PEM', async () => {
    const badKeyPath = join(fixtureDir, 'bad.key');
    writeFileSync(badKeyPath, 'this is not a PEM key');
    await expect(loadDaemonCrypto({
      keyPath:  badKeyPath,
      certPath: join(fixtureDir, 'daemon.crt'),
      peersDir,
    })).rejects.toThrow();
  });

  it('throws fatal error when daemon.crt is not valid PEM', async () => {
    const badCertPath = join(fixtureDir, 'bad.crt');
    writeFileSync(badCertPath, 'this is not a PEM cert');
    await expect(loadDaemonCrypto({
      keyPath:  join(fixtureDir, 'daemon.key'),
      certPath: badCertPath,
      peersDir,
    })).rejects.toThrow();
  });

  it('throws fatal error when key/cert pair does not match', async () => {
    // Generate a second unrelated key
    const dir2 = join(tmpdir(), `kerckhoffs-mismatch-${Date.now()}`);
    mkdirSync(dir2);
    genSelfSignedCert(dir2, 'other-team', 'other');
    try {
      await expect(loadDaemonCrypto({
        keyPath:  join(dir2, 'other.key'),  // different key
        certPath: join(fixtureDir, 'daemon.crt'),  // daemon cert
        peersDir,
      })).rejects.toThrow(/key.*cert|mismatch/i);
    } finally {
      rmSync(dir2, { recursive: true, force: true });
    }
  });

  it('logs warning but does not fail when peers/ directory is empty', async () => {
    const emptyPeersDir = join(tmpdir(), `kerckhoffs-empty-peers-${Date.now()}`);
    mkdirSync(emptyPeersDir);
    try {
      const cfg = await loadDaemonCrypto({
        keyPath:  join(fixtureDir, 'daemon.key'),
        certPath: join(fixtureDir, 'daemon.crt'),
        peersDir: emptyPeersDir,
      });
      expect(cfg.peerFingerprints.size).toBe(0);
    } finally {
      rmSync(emptyPeersDir, { recursive: true, force: true });
    }
  });

  it('skips invalid peer cert files (logs warning, does not crash)', async () => {
    const mixedPeersDir = join(tmpdir(), `kerckhoffs-mixed-peers-${Date.now()}`);
    mkdirSync(mixedPeersDir);
    // Valid cert
    const validCert = readFileSync(join(peersDir, 'framework-research.crt'));
    writeFileSync(join(mixedPeersDir, 'framework-research.crt'), validCert);
    // Invalid cert
    writeFileSync(join(mixedPeersDir, 'bad-team.crt'), 'not a certificate');
    try {
      const cfg = await loadDaemonCrypto({
        keyPath:  join(fixtureDir, 'daemon.key'),
        certPath: join(fixtureDir, 'daemon.crt'),
        peersDir: mixedPeersDir,
      });
      // Valid cert loaded, invalid skipped
      expect(cfg.peerFingerprints.has('framework-research')).toBe(true);
      expect(cfg.peerFingerprints.has('bad-team')).toBe(false);
    } finally {
      rmSync(mixedPeersDir, { recursive: true, force: true });
    }
  });
});

// ── §2 Cert filename === cert CN validation ───────────────────────────────────
// Spec: #16 §8 — peer cert filename MUST match cert CN; mismatch = fatal startup error

describe('loadDaemonCrypto — cert filename vs CN validation', () => {

  it('rejects peer cert where filename does not match cert CN', async () => {
    const mismatchPeersDir = join(tmpdir(), `kerckhoffs-cn-mismatch-${Date.now()}`);
    mkdirSync(mismatchPeersDir);
    // File is named framework-research.crt but cert CN is entu-research
    const entuCert = readFileSync(join(peersDir, 'entu-research.crt'));
    writeFileSync(join(mismatchPeersDir, 'framework-research.crt'), entuCert);
    try {
      await expect(loadDaemonCrypto({
        keyPath:  join(fixtureDir, 'daemon.key'),
        certPath: join(fixtureDir, 'daemon.crt'),
        peersDir: mismatchPeersDir,
      })).rejects.toThrow(/CN.*mismatch|filename.*CN/i);
    } finally {
      rmSync(mismatchPeersDir, { recursive: true, force: true });
    }
  });
});

// ── §3 computeFingerprint ─────────────────────────────────────────────────────

describe('computeFingerprint', () => {

  it('returns a SHA-256 fingerprint in colon-separated hex format', () => {
    const certPem = readFileSync(join(peersDir, 'framework-research.crt'));
    const fp = computeFingerprint(certPem);
    // Format: "AB:CD:EF:..." — 32 bytes = 95 chars (64 hex + 31 colons)
    expect(fp).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/i);
  });

  it('returns the same fingerprint for the same cert loaded twice', () => {
    const certPem = readFileSync(join(peersDir, 'framework-research.crt'));
    expect(computeFingerprint(certPem)).toBe(computeFingerprint(certPem));
  });

  it('returns different fingerprints for different certs', () => {
    const fp1 = computeFingerprint(readFileSync(join(peersDir, 'framework-research.crt')));
    const fp2 = computeFingerprint(readFileSync(join(peersDir, 'entu-research.crt')));
    expect(fp1).not.toBe(fp2);
  });

  it('throws on invalid PEM input', () => {
    expect(() => computeFingerprint(Buffer.from('not a cert'))).toThrow();
  });
});

// ── §3 getAuthenticatedTeam ───────────────────────────────────────────────────

describe('getAuthenticatedTeam', () => {

  it('returns the team name from a socket with a valid authenticated team', () => {
    // Simulated socket with _authenticatedTeam set after handshake
    const mockSocket = { _authenticatedTeam: 'framework-research' } as any;
    expect(getAuthenticatedTeam(mockSocket)).toBe('framework-research');
  });

  it('returns null for socket without authenticated team (pre-handshake)', () => {
    const mockSocket = {} as any;
    expect(getAuthenticatedTeam(mockSocket)).toBeNull();
  });

  it('returns null for socket with null authenticated team', () => {
    const mockSocket = { _authenticatedTeam: null } as any;
    expect(getAuthenticatedTeam(mockSocket)).toBeNull();
  });

  it('returns null for socket with empty string authenticated team', () => {
    const mockSocket = { _authenticatedTeam: '' } as any;
    expect(getAuthenticatedTeam(mockSocket)).toBeNull();
  });
});
