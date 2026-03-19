// (*CD:Lovelace*)
// comms-keys — certificate inspection CLI for the cross-team relay daemon.
// Spec: #17 §3
//
// Commands:
//   comms-keys list [--format json|human]
//   comms-keys export [--format pem|json]
//   comms-keys verify --peer <team-name>
//
// Read-only. Never writes. Key generation is out of scope (pre-provisioned).
//
// Environment:
//   COMMS_KEYS_DIR   — default /run/secrets/comms

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { X509Certificate } from 'node:crypto';
import { parseArgs } from 'node:util';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CertInfo {
  subject: string;
  fingerprint: string;
  not_after: string;
}

export interface PeerCertInfo extends CertInfo {
  team: string;
}

export interface KeysListResult {
  daemon: CertInfo;
  peers: PeerCertInfo[];
}

export interface KeysVerifyResult {
  valid: boolean;
  peer: string;
  cn?: string;
  code?: 'PEER_NOT_FOUND' | 'INVALID_CERT' | 'CN_MISMATCH';
  expected_cn?: string;
  actual_cn?: string;
}

export interface ExportResult {
  pem: string;
  subject?: string;
  fingerprint?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseCert(pemOrBuffer: string | Buffer, context: string): X509Certificate {
  try {
    return new X509Certificate(pemOrBuffer);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    const e = new Error(`Invalid certificate: ${context} — ${detail}`);
    (e as NodeJS.ErrnoException).code = 'INVALID_CERT';
    throw e;
  }
}

function extractCN(subject: string): string {
  // subject is a multiline string like "CN=comms-dev\n" or "CN=comms-dev, O=..."
  const match = subject.match(/CN=([^,\n\r]+)/);
  return match ? match[1].trim() : subject;
}

function formatFingerprint(raw: string): string {
  // X509Certificate.fingerprint256 returns "AB:CD:EF:..." already
  // Ensure "SHA256:" prefix
  if (raw.startsWith('SHA256:') || raw.startsWith('sha256:')) {
    return `SHA256:${raw.slice(7).toUpperCase()}`;
  }
  return `SHA256:${raw.toUpperCase()}`;
}

function toISODate(certDate: string): string {
  // X509Certificate.validTo returns a string like "Mar 19 22:00:00 2027 GMT"
  // Convert to ISO 8601
  return new Date(certDate).toISOString();
}

function certInfoFromX509(cert: X509Certificate): CertInfo {
  return {
    subject: cert.subject.trim(),
    fingerprint: formatFingerprint(cert.fingerprint256),
    not_after: toISODate(cert.validTo),
  };
}

// ── listKeys ──────────────────────────────────────────────────────────────────

export async function listKeys(opts: { keysDir: string }): Promise<KeysListResult> {
  const { keysDir } = opts;
  const daemonCertPath = join(keysDir, 'daemon.crt');

  if (!existsSync(daemonCertPath)) {
    const e = new Error(`Daemon cert not found: ${daemonCertPath}`);
    (e as NodeJS.ErrnoException).code = 'DAEMON_CERT_NOT_FOUND';
    throw e;
  }

  const daemonPem = readFileSync(daemonCertPath);
  const daemonCert = parseCert(daemonPem, 'daemon.crt');
  const daemon = certInfoFromX509(daemonCert);

  const peersDir = join(keysDir, 'peers');
  const peers: PeerCertInfo[] = [];

  if (existsSync(peersDir)) {
    let entries: string[];
    try {
      entries = readdirSync(peersDir);
    } catch {
      entries = [];
    }
    for (const filename of entries) {
      if (!filename.endsWith('.crt')) continue;
      const team = basename(filename, '.crt');
      const peerPath = join(peersDir, filename);
      const peerPem = readFileSync(peerPath);
      const peerCert = parseCert(peerPem, `peers/${filename}`);
      peers.push({
        team,
        ...certInfoFromX509(peerCert),
      });
    }
  }

  return { daemon, peers };
}

// ── exportDaemonCert ──────────────────────────────────────────────────────────

export async function exportDaemonCert(opts: {
  keysDir: string;
  format: 'pem' | 'json';
}): Promise<ExportResult> {
  const { keysDir, format } = opts;
  const daemonCertPath = join(keysDir, 'daemon.crt');

  if (!existsSync(daemonCertPath)) {
    const e = new Error(`Daemon cert not found: ${daemonCertPath}`);
    (e as NodeJS.ErrnoException).code = 'DAEMON_CERT_NOT_FOUND';
    throw e;
  }

  const pem = readFileSync(daemonCertPath, 'utf8');
  const cert = parseCert(pem, 'daemon.crt');

  if (format === 'json') {
    return {
      pem,
      subject: cert.subject.trim(),
      fingerprint: formatFingerprint(cert.fingerprint256),
    };
  }

  return { pem };
}

// ── verifyPeerCert ────────────────────────────────────────────────────────────

export async function verifyPeerCert(opts: {
  keysDir: string;
  peerName: string;
}): Promise<KeysVerifyResult> {
  const { keysDir, peerName } = opts;
  const certPath = join(keysDir, 'peers', `${peerName}.crt`);

  if (!existsSync(certPath)) {
    return { valid: false, peer: peerName, code: 'PEER_NOT_FOUND' };
  }

  let cert: X509Certificate;
  try {
    const pem = readFileSync(certPath);
    cert = new X509Certificate(pem);
  } catch {
    return { valid: false, peer: peerName, code: 'INVALID_CERT' };
  }

  const actualCN = extractCN(cert.subject);
  if (actualCN !== peerName) {
    return {
      valid: false,
      peer: peerName,
      code: 'CN_MISMATCH',
      expected_cn: peerName,
      actual_cn: actualCN,
    };
  }

  return { valid: true, peer: peerName, cn: actualCN };
}

// ── CLI entry point ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const keysDir = process.env['COMMS_KEYS_DIR'] ?? '/run/secrets/comms';

  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    fatal('Command required: list, export, verify');
  }

  if (command === 'list') {
    const { values } = parseArgs({
      args: args.slice(1),
      options: { format: { type: 'string', default: 'json' } },
    });
    const result = await listKeys({ keysDir });
    if (values.format === 'human') {
      console.log(`Daemon cert:`);
      console.log(`  Subject:     ${result.daemon.subject}`);
      console.log(`  Fingerprint: ${result.daemon.fingerprint}`);
      console.log(`  Expires:     ${result.daemon.not_after}`);
      console.log(`\nPeer certs (${result.peers.length}):`);
      for (const peer of result.peers) {
        console.log(`  ${peer.team}`);
        console.log(`    Fingerprint: ${peer.fingerprint}`);
        console.log(`    Expires:     ${peer.not_after}`);
      }
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    return;
  }

  if (command === 'export') {
    const { values } = parseArgs({
      args: args.slice(1),
      options: { format: { type: 'string', default: 'pem' } },
    });
    const fmt = values.format as 'pem' | 'json';
    const result = await exportDaemonCert({ keysDir, format: fmt });
    if (fmt === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      process.stdout.write(result.pem);
    }
    return;
  }

  if (command === 'verify') {
    const { values } = parseArgs({
      args: args.slice(1),
      options: {
        peer: { type: 'string' },
        format: { type: 'string', default: 'json' },
      },
    });
    if (!values.peer) fatal('--peer <team-name> is required');
    const result = await verifyPeerCert({ keysDir, peerName: values.peer! });
    if (values.format === 'human') {
      if (result.valid) {
        console.log(`OK: ${result.peer} (CN=${result.cn})`);
      } else {
        console.error(`FAIL: ${result.peer} — ${result.code}`);
        if (result.code === 'CN_MISMATCH') {
          console.error(`  Expected CN: ${result.expected_cn}`);
          console.error(`  Actual CN:   ${result.actual_cn}`);
        }
      }
    } else {
      const out = result.valid ? result : { error: result.code, ...result };
      console.log(JSON.stringify(out, null, 2));
    }
    if (!result.valid) process.exit(1);
    return;
  }

  fatal(`Unknown command: ${command}. Valid: list, export, verify`);
}

function fatal(msg: string): never {
  console.error(JSON.stringify({ error: msg }));
  process.exit(1);
}

// Only run CLI when executed directly (not when imported by tests)
const isMain = process.argv[1]?.endsWith('comms-keys.ts') ||
  process.argv[1]?.endsWith('comms-keys.js');

if (isMain) {
  main().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ error: msg }));
    process.exit(1);
  });
}
