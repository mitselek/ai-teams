// (*CD:Kerckhoffs*)
// RED tests for comms-keys CLI tool.
// Spec: #17 §3
//
// comms-keys is a read-only cert inspection tool. It reads from COMMS_KEYS_DIR
// (default /run/secrets/comms) and never writes.
//
// Commands under test:
//   comms-keys list [--format json|human]
//   comms-keys export [--format pem|json]
//   comms-keys verify --peer <team-name>
//
// Tests exercise the underlying logic module (not the CLI binary directly)
// to keep tests fast and deterministic. Integration-level subprocess tests
// are handled in tests/integration/.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  listKeys,
  exportDaemonCert,
  verifyPeerCert,
  type KeysListResult,
  type KeysVerifyResult,
} from '../../src/cli/comms-keys.js';

// ── Test fixture helpers ──────────────────────────────────────────────────────

function genSelfSignedCert(dir: string, cn: string, filename = cn): void {
  execSync(
    `openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${join(dir, `${filename}.key`)}" \
     -out "${join(dir, `${filename}.crt`)}" \
     -days 365 -nodes \
     -subj "/CN=${cn}" \
     -addext "subjectAltName=DNS:${cn}" 2>/dev/null`,
  );
}

let keysDir: string;
let peersDir: string;

beforeAll(() => {
  keysDir = join(tmpdir(), `kerckhoffs-keys-test-${Date.now()}`);
  peersDir = join(keysDir, 'peers');
  mkdirSync(peersDir, { recursive: true });

  genSelfSignedCert(keysDir, 'comms-dev', 'daemon');
  genSelfSignedCert(peersDir, 'framework-research');
  genSelfSignedCert(peersDir, 'entu-research');
});

afterAll(() => {
  rmSync(keysDir, { recursive: true, force: true });
});

// ── comms-keys list ───────────────────────────────────────────────────────────

describe('listKeys', () => {

  it('returns daemon cert info and peer cert list', async () => {
    const result = await listKeys({ keysDir });
    expect(result.daemon).toBeDefined();
    expect(result.daemon.subject).toContain('comms-dev');
    expect(result.daemon.fingerprint).toMatch(/^SHA256:[0-9A-F:]+$/i);
    expect(result.daemon.not_after).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('lists all peer certs from peers/ directory', async () => {
    const result = await listKeys({ keysDir });
    expect(result.peers).toHaveLength(2);
    const teams = result.peers.map(p => p.team).sort();
    expect(teams).toEqual(['entu-research', 'framework-research']);
  });

  it('each peer entry has team, fingerprint, and not_after', async () => {
    const result = await listKeys({ keysDir });
    for (const peer of result.peers) {
      expect(peer.team).toBeTruthy();
      expect(peer.fingerprint).toMatch(/^SHA256:[0-9A-F:]+$/i);
      expect(peer.not_after).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('throws when daemon.crt is missing', async () => {
    const emptyDir = join(tmpdir(), `kerckhoffs-no-daemon-${Date.now()}`);
    mkdirSync(join(emptyDir, 'peers'), { recursive: true });
    try {
      await expect(listKeys({ keysDir: emptyDir })).rejects.toMatchObject({
        code: 'DAEMON_CERT_NOT_FOUND',
      });
    } finally {
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('returns empty peers array when peers/ directory is missing', async () => {
    const noPeersDir = join(tmpdir(), `kerckhoffs-no-peers-${Date.now()}`);
    mkdirSync(noPeersDir, { recursive: true });
    // Copy daemon cert only
    const certContent = readFileSync(join(keysDir, 'daemon.crt'));
    writeFileSync(join(noPeersDir, 'daemon.crt'), certContent);
    try {
      const result = await listKeys({ keysDir: noPeersDir });
      expect(result.peers).toEqual([]);
    } finally {
      rmSync(noPeersDir, { recursive: true, force: true });
    }
  });

  it('returns empty peers array when peers/ directory exists but is empty', async () => {
    const emptyPeersKeysDir = join(tmpdir(), `kerckhoffs-empty-peers-${Date.now()}`);
    const emptyPeers = join(emptyPeersKeysDir, 'peers');
    mkdirSync(emptyPeers, { recursive: true });
    const certContent = readFileSync(join(keysDir, 'daemon.crt'));
    writeFileSync(join(emptyPeersKeysDir, 'daemon.crt'), certContent);
    try {
      const result = await listKeys({ keysDir: emptyPeersKeysDir });
      expect(result.peers).toEqual([]);
    } finally {
      rmSync(emptyPeersKeysDir, { recursive: true, force: true });
    }
  });

  it('throws with invalid cert detail when daemon.crt is not valid PEM', async () => {
    const badCertDir = join(tmpdir(), `kerckhoffs-bad-cert-${Date.now()}`);
    mkdirSync(join(badCertDir, 'peers'), { recursive: true });
    writeFileSync(join(badCertDir, 'daemon.crt'), 'not a certificate');
    try {
      await expect(listKeys({ keysDir: badCertDir })).rejects.toMatchObject({
        code: 'INVALID_CERT',
      });
    } finally {
      rmSync(badCertDir, { recursive: true, force: true });
    }
  });
});

// ── comms-keys export ─────────────────────────────────────────────────────────

describe('exportDaemonCert', () => {

  it('returns PEM string by default', async () => {
    const result = await exportDaemonCert({ keysDir, format: 'pem' });
    expect(result.pem).toMatch(/^-----BEGIN CERTIFICATE-----/);
    expect(result.pem).toContain('-----END CERTIFICATE-----');
  });

  it('returns JSON format with fingerprint and subject when requested', async () => {
    const result = await exportDaemonCert({ keysDir, format: 'json' });
    expect(result.subject).toContain('comms-dev');
    expect(result.fingerprint).toMatch(/^SHA256:[0-9A-F:]+$/i);
    expect(result.pem).toMatch(/^-----BEGIN CERTIFICATE-----/);
  });

  it('throws when daemon.crt is missing', async () => {
    const emptyDir = join(tmpdir(), `kerckhoffs-export-no-cert-${Date.now()}`);
    mkdirSync(emptyDir, { recursive: true });
    try {
      await expect(exportDaemonCert({ keysDir: emptyDir, format: 'pem' }))
        .rejects.toMatchObject({ code: 'DAEMON_CERT_NOT_FOUND' });
    } finally {
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });
});

// ── comms-keys verify ─────────────────────────────────────────────────────────

describe('verifyPeerCert', () => {

  it('returns valid=true when cert exists, is valid, and CN matches filename stem', async () => {
    const result = await verifyPeerCert({ keysDir, peerName: 'framework-research' });
    expect(result.valid).toBe(true);
    expect(result.peer).toBe('framework-research');
    expect(result.cn).toBe('framework-research');
  });

  it('returns valid=true for entu-research', async () => {
    const result = await verifyPeerCert({ keysDir, peerName: 'entu-research' });
    expect(result.valid).toBe(true);
  });

  it('returns valid=false with code PEER_NOT_FOUND when cert file is missing', async () => {
    const result = await verifyPeerCert({ keysDir, peerName: 'nonexistent-team' });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('PEER_NOT_FOUND');
  });

  it('returns valid=false with code INVALID_CERT when cert file is not valid PEM', async () => {
    const badPeersDir = join(tmpdir(), `kerckhoffs-bad-peer-${Date.now()}`);
    mkdirSync(badPeersDir, { recursive: true });
    const badKeysDirRoot = join(tmpdir(), `kerckhoffs-bad-peer-root-${Date.now()}`);
    mkdirSync(join(badKeysDirRoot, 'peers'), { recursive: true });
    // Copy valid daemon cert
    writeFileSync(join(badKeysDirRoot, 'daemon.crt'), readFileSync(join(keysDir, 'daemon.crt')));
    // Write invalid peer cert
    writeFileSync(join(badKeysDirRoot, 'peers', 'bad-team.crt'), 'not a certificate');
    try {
      const result = await verifyPeerCert({ keysDir: badKeysDirRoot, peerName: 'bad-team' });
      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_CERT');
    } finally {
      rmSync(badKeysDirRoot, { recursive: true, force: true });
    }
  });

  it('returns valid=false with code CN_MISMATCH when cert CN does not match peer name', async () => {
    // Create a cert for entu-research but name the file framework-research.crt
    const mismatchDir = join(tmpdir(), `kerckhoffs-cn-mismatch-${Date.now()}`);
    mkdirSync(join(mismatchDir, 'peers'), { recursive: true });
    writeFileSync(join(mismatchDir, 'daemon.crt'), readFileSync(join(keysDir, 'daemon.crt')));
    // entu-research cert placed as framework-research.crt
    writeFileSync(
      join(mismatchDir, 'peers', 'framework-research.crt'),
      readFileSync(join(peersDir, 'entu-research.crt')),
    );
    try {
      const result = await verifyPeerCert({ keysDir: mismatchDir, peerName: 'framework-research' });
      expect(result.valid).toBe(false);
      expect(result.code).toBe('CN_MISMATCH');
      expect(result.expected_cn).toBe('framework-research');
      expect(result.actual_cn).toBe('entu-research');
    } finally {
      rmSync(mismatchDir, { recursive: true, force: true });
    }
  });

  it('exits process with code 0 when verify passes (CLI contract)', async () => {
    // The function itself returns the result; the CLI layer handles exit codes.
    // Test that valid=true result has no error code set.
    const result = await verifyPeerCert({ keysDir, peerName: 'framework-research' });
    expect(result.valid).toBe(true);
    expect(result.code).toBeUndefined();
  });

  it('exits process with code 1 when verify fails (CLI contract)', async () => {
    // The function returns valid=false; CLI layer calls process.exit(1).
    const result = await verifyPeerCert({ keysDir, peerName: 'nonexistent-team' });
    expect(result.valid).toBe(false);
    // code must be set for CLI to use in error output
    expect(result.code).toBeDefined();
  });
});

// ── JSON output shape ─────────────────────────────────────────────────────────

describe('listKeys — JSON output shape matches spec #17', () => {

  it('daemon object has subject, fingerprint, not_after fields', async () => {
    const result = await listKeys({ keysDir });
    expect(result.daemon).toMatchObject({
      subject: expect.stringContaining('CN='),
      fingerprint: expect.stringMatching(/^SHA256:/i),
      not_after: expect.stringMatching(/^\d{4}-/),
    });
  });

  it('peers array entries have team, fingerprint, not_after fields', async () => {
    const result = await listKeys({ keysDir });
    for (const peer of result.peers) {
      expect(peer).toMatchObject({
        team: expect.any(String),
        fingerprint: expect.stringMatching(/^SHA256:/i),
        not_after: expect.stringMatching(/^\d{4}-/),
      });
    }
  });

  it('fingerprint format uses SHA256: prefix (spec #17 format)', async () => {
    // Spec shows "SHA256:ab:cd:ef:..." — SHA256: prefix, colon-separated hex
    const result = await listKeys({ keysDir });
    expect(result.daemon.fingerprint).toMatch(/^SHA256:([0-9A-F]{2}:)*[0-9A-F]{2}$/i);
  });
});
