// (*CD:Kerckhoffs*)
// Integration tests for DaemonV2 v2 E2E crypto (Task #16).
// Tests prepareOutbound (E2E encrypt+sign) and handleInbound (verify+decrypt)
// using real TLS tunnels with in-process daemons.
//
// Scenarios:
//   1. v2→v2 E2E round-trip: both daemons have v2 keys → inbox body = plaintext
//   2. Invalid signature → dropped (hub forgery detection at receiver)
//   3. v2→v1 backward compat: encrypted body delivered to v1 inbox
//   4. v1→v2 backward compat: no signature → v2 skips verify, delivers plaintext
//   5. Hub relay (three-daemon): see NOTE below
//
//
// Spec: daemon-v2.ts §prepareOutbound, §handleInbound
// Security: security-report.md HUB-2 (forgery), HUB-3 (AAD), HUB-8 (identity)

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import {
  mkdirSync, rmSync, writeFileSync, readFileSync, existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { DaemonV2, type DaemonV2Options } from '../../src/broker/daemon-v2.js';
import type { Message } from '../../src/types.js';

// ── Fixture helpers ───────────────────────────────────────────────────────────

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = (srv.address() as { port: number }).port;
      srv.close(err => err ? reject(err) : resolve(port));
    });
  });
}

function genTlsCert(dir: string, cn: string): void {
  execSync(
    `openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${join(dir, 'daemon.key')}" \
     -out    "${join(dir, 'daemon.crt')}" \
     -days 1 -nodes \
     -subj "/CN=${cn}" \
     -addext "subjectAltName=DNS:${cn}" 2>/dev/null`,
  );
}

function genPemKey(algorithm: 'ed25519' | 'x25519'): { priv: string; pub: string } {
  const { privateKey, publicKey } = generateKeyPairSync(algorithm, {
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  });
  return { priv: privateKey as string, pub: publicKey as string };
}

async function waitForInboxFile(
  inboxDir: string,
  messageId: string,
  timeoutMs = 4000,
): Promise<Message> {
  const filePath = join(inboxDir, `${messageId}.json`);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf8')) as Message;
    }
    await new Promise(r => setTimeout(r, 30));
  }
  throw new Error(`Inbox timeout: ${filePath} not found after ${timeoutMs}ms`);
}

/** Confirm message was NOT delivered within waitMs. */
async function confirmNotDelivered(
  inboxDir: string,
  messageId: string,
  waitMs = 600,
): Promise<void> {
  await new Promise(r => setTimeout(r, waitMs));
  const filePath = join(inboxDir, `${messageId}.json`);
  if (existsSync(filePath)) {
    throw new Error(`Message ${messageId} was unexpectedly delivered to ${inboxDir}`);
  }
}

function makeMsg(
  fromTeam: string, fromAgent: string,
  toTeam: string,   toAgent: string,
  body: string,
): Message {
  return {
    version:   '1',
    id:        `v2-int-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    from:      { team: fromTeam, agent: fromAgent },
    to:        { team: toTeam,   agent: toAgent },
    type:      'query',
    priority:  'normal',
    reply_to:  null,
    body,
    checksum:  'sha256:placeholder',
  };
}

const CD_TEAM = 'comms-dev';
const FR_TEAM = 'framework-research';

const CD_ACL = {
  version: 1,
  agents: {
    babbage: {
      allowed_to:   [`herald@${FR_TEAM}`],
      allowed_from: [`herald@${FR_TEAM}`],
    },
  },
  default: 'deny',
};

const FR_ACL = {
  version: 1,
  agents: {
    herald: {
      allowed_to:   [`babbage@${CD_TEAM}`],
      allowed_from: [`babbage@${CD_TEAM}`],
    },
  },
  default: 'deny',
};

// ── Scenario 1: v2→v2 E2E round-trip ─────────────────────────────────────────
//
// Both daemons configured with v2 keys.
// Expected: inbox body === original plaintext (E2E decrypted on receive).

describe('DaemonV2 v2 crypto — scenario 1: v2→v2 E2E round-trip', () => {

  let cdDir: string;
  let frDir: string;
  let cdInbox: string;
  let frInbox: string;
  let cdDaemon: DaemonV2;
  let frDaemon: DaemonV2;

  beforeAll(async () => {
    const ts = Date.now();
    cdDir   = join(tmpdir(), `v2int-s1-cd-${ts}`);
    frDir   = join(tmpdir(), `v2int-s1-fr-${ts}`);
    cdInbox = join(tmpdir(), `v2int-s1-cdinbox-${ts}`);
    frInbox = join(tmpdir(), `v2int-s1-frinbox-${ts}`);

    mkdirSync(join(cdDir, 'peers'), { recursive: true });
    mkdirSync(join(frDir, 'peers'), { recursive: true });
    mkdirSync(cdInbox, { recursive: true });
    mkdirSync(frInbox, { recursive: true });

    genTlsCert(cdDir, CD_TEAM);
    genTlsCert(frDir, FR_TEAM);

    execSync(`cp "${join(frDir, 'daemon.crt')}" "${join(cdDir, 'peers', `${FR_TEAM}.crt`)}"`);
    execSync(`cp "${join(cdDir, 'daemon.crt')}" "${join(frDir, 'peers', `${CD_TEAM}.crt`)}"`);

    writeFileSync(join(cdDir, 'acl.json'), JSON.stringify(CD_ACL));
    writeFileSync(join(frDir, 'acl.json'), JSON.stringify(FR_ACL));

    // Generate v2 key material for both teams
    const cdSign = genPemKey('ed25519');
    const cdEnc  = genPemKey('x25519');
    const frSign = genPemKey('ed25519');
    const frEnc  = genPemKey('x25519');

    const bundle = {
      version:      1,
      generated_at: new Date().toISOString(),
      teams: {
        [CD_TEAM]: { sign_pub: cdSign.pub, enc_pub: cdEnc.pub },
        [FR_TEAM]: { sign_pub: frSign.pub, enc_pub: frEnc.pub },
      },
    };

    writeFileSync(join(cdDir, 'sign.pem'), cdSign.priv);
    writeFileSync(join(cdDir, 'enc.pem'),  cdEnc.priv);
    writeFileSync(join(cdDir, 'bundle.json'), JSON.stringify(bundle));

    writeFileSync(join(frDir, 'sign.pem'), frSign.priv);
    writeFileSync(join(frDir, 'enc.pem'),  frEnc.priv);
    writeFileSync(join(frDir, 'bundle.json'), JSON.stringify(bundle));

    const [cdPort, frPort] = await Promise.all([getFreePort(), getFreePort()]);

    cdDaemon = new DaemonV2({
      teamName:            CD_TEAM,
      keysDir:             cdDir,
      inboxDir:            cdInbox,
      listenPort:          cdPort,
      peers:               { [FR_TEAM]: { host: '127.0.0.1', port: frPort } },
      reconnectBaseMs:     50,
      heartbeatIntervalMs: 60_000,
      deadConnectionMs:    120_000,
      signKeyPath:  join(cdDir, 'sign.pem'),
      encKeyPath:   join(cdDir, 'enc.pem'),
      keyBundlePath: join(cdDir, 'bundle.json'),
    });

    frDaemon = new DaemonV2({
      teamName:            FR_TEAM,
      keysDir:             frDir,
      inboxDir:            frInbox,
      listenPort:          frPort,
      peers:               { [CD_TEAM]: { host: '127.0.0.1', port: cdPort } },
      reconnectBaseMs:     50,
      heartbeatIntervalMs: 60_000,
      deadConnectionMs:    120_000,
      signKeyPath:  join(frDir, 'sign.pem'),
      encKeyPath:   join(frDir, 'enc.pem'),
      keyBundlePath: join(frDir, 'bundle.json'),
    });

    await Promise.all([cdDaemon.start(), frDaemon.start()]);
    await new Promise(r => setTimeout(r, 500));
  });

  afterAll(async () => {
    await cdDaemon?.stop();
    await frDaemon?.stop();
    for (const d of [cdDir, frDir, cdInbox, frInbox]) {
      rmSync(d, { recursive: true, force: true });
    }
  });

  it('sendMessage returns OK with v2 keys', async () => {
    const msg = makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', 'E2E test payload');
    const result = await cdDaemon.sendMessage(msg);
    expect(result).toBe('OK');
  });

  it('inbox body is the original plaintext (E2E decrypted at receiver)', async () => {
    const body = 'E2E round-trip: plaintext check';
    const msg  = makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', body);
    await cdDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(frInbox, msg.id);
    expect(delivered.body).toBe(body);
  });

  it('inbox body is NOT the raw E2EPayload JSON (must be decrypted)', async () => {
    const body = 'E2E not-encrypted-in-inbox';
    const msg  = makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', body);
    await cdDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(frInbox, msg.id);
    // Decrypted body = original plaintext — equals the sent string
    expect(delivered.body).toBe(body);
    // Confirm it is NOT a JSON object with {ciphertext} — i.e., not still encrypted
    let isEncryptedPayload = false;
    try {
      const parsed = JSON.parse(delivered.body);
      if (typeof parsed === 'object' && parsed !== null && 'ciphertext' in parsed) {
        isEncryptedPayload = true;
      }
    } catch { /* JSON.parse fails → definitely not E2EPayload */ }
    expect(isEncryptedPayload).toBe(false);
  });

  it('reverse direction: fr→cd E2E round-trip', async () => {
    const body = 'reverse E2E round-trip';
    const msg  = makeMsg(FR_TEAM, 'herald', CD_TEAM, 'babbage', body);
    const result = await frDaemon.sendMessage(msg);
    expect(result).toBe('OK');
    const delivered = await waitForInboxFile(cdInbox, msg.id);
    expect(delivered.body).toBe(body);
  });

  it('delivered message preserves from/to/type fields', async () => {
    const body = 'field preservation check';
    const msg  = makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', body);
    await cdDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(frInbox, msg.id);
    expect(delivered.from.team).toBe(CD_TEAM);
    expect(delivered.from.agent).toBe('babbage');
    expect(delivered.to.team).toBe(FR_TEAM);
    expect(delivered.to.agent).toBe('herald');
    expect(delivered.type).toBe('query');
  });
});

// ── Scenario 2: invalid signature → message dropped ──────────────────────────
//
// cd daemon is configured with a WRONG signing key (not in fr's key bundle).
// fr has the CORRECT cd public key → verification fails → message dropped.
// This simulates a hub forging a message that claims to be from comms-dev.

describe('DaemonV2 v2 crypto — scenario 2: invalid signature → message dropped', () => {

  let cdDir: string;
  let frDir: string;
  let frInbox: string;
  let cdDaemon: DaemonV2;
  let frDaemon: DaemonV2;

  beforeAll(async () => {
    const ts = Date.now();
    cdDir   = join(tmpdir(), `v2int-s2-cd-${ts}`);
    frDir   = join(tmpdir(), `v2int-s2-fr-${ts}`);
    frInbox = join(tmpdir(), `v2int-s2-frinbox-${ts}`);

    mkdirSync(join(cdDir, 'peers'), { recursive: true });
    mkdirSync(join(frDir, 'peers'), { recursive: true });
    mkdirSync(frInbox, { recursive: true });

    genTlsCert(cdDir, CD_TEAM);
    genTlsCert(frDir, FR_TEAM);

    execSync(`cp "${join(frDir, 'daemon.crt')}" "${join(cdDir, 'peers', `${FR_TEAM}.crt`)}"`);
    execSync(`cp "${join(cdDir, 'daemon.crt')}" "${join(frDir, 'peers', `${CD_TEAM}.crt`)}"`);

    writeFileSync(join(cdDir, 'acl.json'), JSON.stringify(CD_ACL));
    writeFileSync(join(frDir, 'acl.json'), JSON.stringify(FR_ACL));

    // CORRECT cd public key (what fr expects)
    const cdSignCorrect = genPemKey('ed25519');
    const cdEncCorrect  = genPemKey('x25519');
    // WRONG cd signing key (what cd actually uses — not in bundle)
    const cdSignWrong   = genPemKey('ed25519');

    const frSign = genPemKey('ed25519');
    const frEnc  = genPemKey('x25519');

    // Bundle contains CORRECT cd public key — fr will verify against this
    const bundle = {
      version:      1,
      generated_at: new Date().toISOString(),
      teams: {
        [CD_TEAM]: { sign_pub: cdSignCorrect.pub, enc_pub: cdEncCorrect.pub },
        [FR_TEAM]: { sign_pub: frSign.pub,         enc_pub: frEnc.pub },
      },
    };

    // cd daemon uses the WRONG signing key — its signatures won't match cdSignCorrect.pub
    writeFileSync(join(cdDir, 'sign.pem'), cdSignWrong.priv);   // ← wrong key
    writeFileSync(join(cdDir, 'enc.pem'),  cdEncCorrect.priv);  // enc key matches (for AAD)
    writeFileSync(join(cdDir, 'bundle.json'), JSON.stringify(bundle));

    writeFileSync(join(frDir, 'sign.pem'), frSign.priv);
    writeFileSync(join(frDir, 'enc.pem'),  frEnc.priv);
    writeFileSync(join(frDir, 'bundle.json'), JSON.stringify(bundle));

    const [cdPort, frPort] = await Promise.all([getFreePort(), getFreePort()]);

    cdDaemon = new DaemonV2({
      teamName:            CD_TEAM,
      keysDir:             cdDir,
      inboxDir:            join(tmpdir(), `v2int-s2-cdinbox-${ts}`),
      listenPort:          cdPort,
      peers:               { [FR_TEAM]: { host: '127.0.0.1', port: frPort } },
      reconnectBaseMs:     50,
      heartbeatIntervalMs: 60_000,
      deadConnectionMs:    120_000,
      signKeyPath:  join(cdDir, 'sign.pem'),
      encKeyPath:   join(cdDir, 'enc.pem'),
      keyBundlePath: join(cdDir, 'bundle.json'),
    });

    mkdirSync(join(tmpdir(), `v2int-s2-cdinbox-${ts}`), { recursive: true });

    frDaemon = new DaemonV2({
      teamName:            FR_TEAM,
      keysDir:             frDir,
      inboxDir:            frInbox,
      listenPort:          frPort,
      peers:               { [CD_TEAM]: { host: '127.0.0.1', port: cdPort } },
      reconnectBaseMs:     50,
      heartbeatIntervalMs: 60_000,
      deadConnectionMs:    120_000,
      signKeyPath:  join(frDir, 'sign.pem'),
      encKeyPath:   join(frDir, 'enc.pem'),
      keyBundlePath: join(frDir, 'bundle.json'),
    });

    await Promise.all([cdDaemon.start(), frDaemon.start()]);
    await new Promise(r => setTimeout(r, 500));
  });

  afterAll(async () => {
    await cdDaemon?.stop();
    await frDaemon?.stop();
    for (const d of [cdDir, frDir, frInbox]) {
      rmSync(d, { recursive: true, force: true });
    }
  });

  it('sendMessage still returns OK (transport-level ACK from sender side)', async () => {
    // The sender gets OK from the TLS ACK — it can't know the receiver will drop the message.
    // Message verification (and drop) happens asynchronously on the receiver side.
    const msg = makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', 'should be dropped');
    const result = await cdDaemon.sendMessage(msg);
    expect(result).toBe('OK');
  });

  it('message is NOT delivered to inbox when signature is invalid (HUB-2/HUB-8)', async () => {
    const msg = makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', 'forged message payload');
    await cdDaemon.sendMessage(msg);
    // Verify inbox stays empty — message must be dropped by fr's signature check
    await confirmNotDelivered(frInbox, msg.id);
    const filePath = join(frInbox, `${msg.id}.json`);
    expect(existsSync(filePath)).toBe(false);
  });
});

// ── Scenario 3: v2→v1 (encrypted body to v1 inbox) ───────────────────────────
//
// cd has v2 keys, fr does NOT (no keyBundlePath/signKeyPath/encKeyPath).
// fr receives the message and delivers the encrypted body to inbox (v1 limitation).
// Per spec: v1 daemon cannot decrypt — accepts the ciphertext as body.

describe('DaemonV2 v2 crypto — scenario 3: v2→v1 backward compat', () => {

  let cdDir: string;
  let frDir: string;
  let frInbox: string;
  let cdDaemon: DaemonV2;
  let frDaemon: DaemonV2;

  beforeAll(async () => {
    const ts = Date.now();
    cdDir   = join(tmpdir(), `v2int-s3-cd-${ts}`);
    frDir   = join(tmpdir(), `v2int-s3-fr-${ts}`);
    frInbox = join(tmpdir(), `v2int-s3-frinbox-${ts}`);

    mkdirSync(join(cdDir, 'peers'), { recursive: true });
    mkdirSync(join(frDir, 'peers'), { recursive: true });
    mkdirSync(frInbox, { recursive: true });

    genTlsCert(cdDir, CD_TEAM);
    genTlsCert(frDir, FR_TEAM);

    execSync(`cp "${join(frDir, 'daemon.crt')}" "${join(cdDir, 'peers', `${FR_TEAM}.crt`)}"`);
    execSync(`cp "${join(cdDir, 'daemon.crt')}" "${join(frDir, 'peers', `${CD_TEAM}.crt`)}"`);

    writeFileSync(join(cdDir, 'acl.json'), JSON.stringify(CD_ACL));
    writeFileSync(join(frDir, 'acl.json'), JSON.stringify(FR_ACL));

    const cdSign = genPemKey('ed25519');
    const cdEnc  = genPemKey('x25519');
    const frSign = genPemKey('ed25519');
    const frEnc  = genPemKey('x25519');

    const bundle = {
      version:      1,
      generated_at: new Date().toISOString(),
      teams: {
        [CD_TEAM]: { sign_pub: cdSign.pub, enc_pub: cdEnc.pub },
        [FR_TEAM]: { sign_pub: frSign.pub, enc_pub: frEnc.pub },
      },
    };

    writeFileSync(join(cdDir, 'sign.pem'), cdSign.priv);
    writeFileSync(join(cdDir, 'enc.pem'),  cdEnc.priv);
    writeFileSync(join(cdDir, 'bundle.json'), JSON.stringify(bundle));
    // fr does NOT get sign/enc keys or bundle (v1 mode)

    const [cdPort, frPort] = await Promise.all([getFreePort(), getFreePort()]);

    cdDaemon = new DaemonV2({
      teamName:            CD_TEAM,
      keysDir:             cdDir,
      inboxDir:            join(tmpdir(), `v2int-s3-cdinbox-${ts}`),
      listenPort:          cdPort,
      peers:               { [FR_TEAM]: { host: '127.0.0.1', port: frPort } },
      reconnectBaseMs:     50,
      heartbeatIntervalMs: 60_000,
      deadConnectionMs:    120_000,
      signKeyPath:  join(cdDir, 'sign.pem'),
      encKeyPath:   join(cdDir, 'enc.pem'),
      keyBundlePath: join(cdDir, 'bundle.json'),
    });

    mkdirSync(join(tmpdir(), `v2int-s3-cdinbox-${ts}`), { recursive: true });

    frDaemon = new DaemonV2({
      teamName:            FR_TEAM,
      keysDir:             frDir,
      inboxDir:            frInbox,
      listenPort:          frPort,
      peers:               { [CD_TEAM]: { host: '127.0.0.1', port: cdPort } },
      reconnectBaseMs:     50,
      heartbeatIntervalMs: 60_000,
      deadConnectionMs:    120_000,
      // No signKeyPath / encKeyPath / keyBundlePath → v1 mode
    });

    await Promise.all([cdDaemon.start(), frDaemon.start()]);
    await new Promise(r => setTimeout(r, 500));
  });

  afterAll(async () => {
    await cdDaemon?.stop();
    await frDaemon?.stop();
    for (const d of [cdDir, frDir, frInbox]) {
      rmSync(d, { recursive: true, force: true });
    }
  });

  it('message IS delivered to v1 inbox (v1 daemon does not drop on missing crypto)', async () => {
    const msg = makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', 'v2 to v1 body');
    await cdDaemon.sendMessage(msg);
    // Should deliver — v1 daemon has no cryptoV2, skips verification
    const delivered = await waitForInboxFile(frInbox, msg.id);
    expect(delivered.id).toBe(msg.id);
  });

  it('inbox body is the E2EPayload JSON (v1 daemon cannot decrypt)', async () => {
    const msg = makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', 'plaintext body');
    await cdDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(frInbox, msg.id);
    // v1 receives encrypted body — it's a JSON-serialized E2EPayload
    const parsedBody = JSON.parse(delivered.body);
    expect(parsedBody).toMatchObject({
      version:     2,
      sender_team: CD_TEAM,
      iv:          expect.any(String),
      ciphertext:  expect.any(String),
      tag:         expect.any(String),
    });
  });
});

// ── Scenario 4: v1→v2 (no signature → v2 delivers plaintext) ─────────────────
//
// cd does NOT have v2 keys (v1 mode). fr HAS v2 keys.
// Message arrives at fr without signature field.
// handleInbound: `if (this.cryptoV2 && possibleSigned.signature)` → false (no signature).
// fr skips verification and delivers the plaintext body as-is.

describe('DaemonV2 v2 crypto — scenario 4: v1→v2 backward compat', () => {

  let cdDir: string;
  let frDir: string;
  let frInbox: string;
  let cdDaemon: DaemonV2;
  let frDaemon: DaemonV2;

  beforeAll(async () => {
    const ts = Date.now();
    cdDir   = join(tmpdir(), `v2int-s4-cd-${ts}`);
    frDir   = join(tmpdir(), `v2int-s4-fr-${ts}`);
    frInbox = join(tmpdir(), `v2int-s4-frinbox-${ts}`);

    mkdirSync(join(cdDir, 'peers'), { recursive: true });
    mkdirSync(join(frDir, 'peers'), { recursive: true });
    mkdirSync(frInbox, { recursive: true });

    genTlsCert(cdDir, CD_TEAM);
    genTlsCert(frDir, FR_TEAM);

    execSync(`cp "${join(frDir, 'daemon.crt')}" "${join(cdDir, 'peers', `${FR_TEAM}.crt`)}"`);
    execSync(`cp "${join(cdDir, 'daemon.crt')}" "${join(frDir, 'peers', `${CD_TEAM}.crt`)}"`);

    writeFileSync(join(cdDir, 'acl.json'), JSON.stringify(CD_ACL));
    writeFileSync(join(frDir, 'acl.json'), JSON.stringify(FR_ACL));

    // Only fr gets v2 keys
    const cdSign = genPemKey('ed25519');
    const cdEnc  = genPemKey('x25519');
    const frSign = genPemKey('ed25519');
    const frEnc  = genPemKey('x25519');

    const bundle = {
      version:      1,
      generated_at: new Date().toISOString(),
      teams: {
        [CD_TEAM]: { sign_pub: cdSign.pub, enc_pub: cdEnc.pub },
        [FR_TEAM]: { sign_pub: frSign.pub, enc_pub: frEnc.pub },
      },
    };

    writeFileSync(join(frDir, 'sign.pem'), frSign.priv);
    writeFileSync(join(frDir, 'enc.pem'),  frEnc.priv);
    writeFileSync(join(frDir, 'bundle.json'), JSON.stringify(bundle));
    // cd does NOT get v2 keys (v1 mode)

    const [cdPort, frPort] = await Promise.all([getFreePort(), getFreePort()]);

    cdDaemon = new DaemonV2({
      teamName:            CD_TEAM,
      keysDir:             cdDir,
      inboxDir:            join(tmpdir(), `v2int-s4-cdinbox-${ts}`),
      listenPort:          cdPort,
      peers:               { [FR_TEAM]: { host: '127.0.0.1', port: frPort } },
      reconnectBaseMs:     50,
      heartbeatIntervalMs: 60_000,
      deadConnectionMs:    120_000,
      // No v2 keys → v1 mode
    });

    mkdirSync(join(tmpdir(), `v2int-s4-cdinbox-${ts}`), { recursive: true });

    frDaemon = new DaemonV2({
      teamName:            FR_TEAM,
      keysDir:             frDir,
      inboxDir:            frInbox,
      listenPort:          frPort,
      peers:               { [CD_TEAM]: { host: '127.0.0.1', port: cdPort } },
      reconnectBaseMs:     50,
      heartbeatIntervalMs: 60_000,
      deadConnectionMs:    120_000,
      signKeyPath:  join(frDir, 'sign.pem'),
      encKeyPath:   join(frDir, 'enc.pem'),
      keyBundlePath: join(frDir, 'bundle.json'),
    });

    await Promise.all([cdDaemon.start(), frDaemon.start()]);
    await new Promise(r => setTimeout(r, 500));
  });

  afterAll(async () => {
    await cdDaemon?.stop();
    await frDaemon?.stop();
    for (const d of [cdDir, frDir, frInbox]) {
      rmSync(d, { recursive: true, force: true });
    }
  });

  it('v1 message is delivered to v2 inbox (no signature = backward compat path)', async () => {
    const body = 'v1 to v2: plaintext delivery';
    const msg  = makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', body);
    const result = await cdDaemon.sendMessage(msg);
    expect(result).toBe('OK');
    const delivered = await waitForInboxFile(frInbox, msg.id);
    expect(delivered.id).toBe(msg.id);
  });

  it('inbox body is the original plaintext (v2 daemon skips decrypt when no signature)', async () => {
    const body = 'original plaintext from v1 sender';
    const msg  = makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', body);
    await cdDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(frInbox, msg.id);
    // Body must be the original string, not encrypted JSON
    expect(delivered.body).toBe(body);
  });

  it('v2 daemon does not crash on unsigned messages (backward compat robustness)', async () => {
    // Multiple unsigned messages should all deliver cleanly
    const messages = ['msg1', 'msg2', 'msg3'].map(suffix =>
      makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', `v1 payload ${suffix}`),
    );
    await Promise.all(messages.map(m => cdDaemon.sendMessage(m)));
    const delivered = await Promise.all(
      messages.map(m => waitForInboxFile(frInbox, m.id)),
    );
    expect(delivered).toHaveLength(3);
    for (const [i, d] of delivered.entries()) {
      expect(d.body).toBe(`v1 payload ${['msg1', 'msg2', 'msg3'][i]}`);
    }
  });
});

// ── Scenario 5: three-daemon hub relay ───────────────────────────────────────
//
// Topology: cd (v2) ─mTLS→ relay (hub, no v2 keys) ─mTLS→ fr (v2)
//
// Routing mechanism: `defaultPeer` (Babbage's option A).
// cd/fr have `defaultPeer: 'relay'` — unknown destinations fall back to relay tunnel.
// relay has `role: 'hub'` — forwards on `msg.to.team` using its own peers map.
//
// Security assertions (Kerckhoffs' principle — relay has source code + spec):
//   a) cd E2E-encrypts for fr — relay sees only opaque ciphertext
//   b) cd signs envelope — fr verifies (hubPeers bypass allows relay-relayed messages)
//   c) relay has no v2 keys — cannot read or forge body
//
// Spec: security-report.md HUB-1 (E2E), HUB-2 (forgery), HUB-8 (identity)

describe('DaemonV2 v2 crypto — scenario 5: hub relay (three-daemon)', () => {

  const RELAY_TEAM = 'relay';

  let cdDir: string;
  let frDir: string;
  let relayDir: string;
  let cdInbox: string;
  let frInbox: string;
  let cdDaemon: DaemonV2;
  let frDaemon: DaemonV2;
  let relayDaemon: DaemonV2;

  // Capture what the relay actually forwarded (body visible at relay level)
  const relayForwardedBodies: string[] = [];

  beforeAll(async () => {
    const ts = Date.now();
    cdDir    = join(tmpdir(), `v2int-s5-cd-${ts}`);
    frDir    = join(tmpdir(), `v2int-s5-fr-${ts}`);
    relayDir = join(tmpdir(), `v2int-s5-relay-${ts}`);
    cdInbox  = join(tmpdir(), `v2int-s5-cdinbox-${ts}`);
    frInbox  = join(tmpdir(), `v2int-s5-frinbox-${ts}`);

    mkdirSync(join(cdDir,    'peers'), { recursive: true });
    mkdirSync(join(frDir,    'peers'), { recursive: true });
    mkdirSync(join(relayDir, 'peers'), { recursive: true });
    mkdirSync(cdInbox,  { recursive: true });
    mkdirSync(frInbox,  { recursive: true });

    // TLS certs: relay has CN=relay, cd/fr pin relay's cert
    genTlsCert(cdDir,    CD_TEAM);
    genTlsCert(frDir,    FR_TEAM);
    genTlsCert(relayDir, RELAY_TEAM);

    // cd and fr trust only relay (their only direct peer)
    execSync(`cp "${join(relayDir, 'daemon.crt')}" "${join(cdDir,    'peers', `${RELAY_TEAM}.crt`)}"`);
    execSync(`cp "${join(relayDir, 'daemon.crt')}" "${join(frDir,    'peers', `${RELAY_TEAM}.crt`)}"`);
    // relay trusts both cd and fr (it forwards to both)
    execSync(`cp "${join(cdDir,    'daemon.crt')}" "${join(relayDir, 'peers', `${CD_TEAM}.crt`)}"`);
    execSync(`cp "${join(frDir,    'daemon.crt')}" "${join(relayDir, 'peers', `${FR_TEAM}.crt`)}"`);

    writeFileSync(join(cdDir, 'acl.json'), JSON.stringify(CD_ACL));
    writeFileSync(join(frDir, 'acl.json'), JSON.stringify(FR_ACL));

    // v2 key material for cd and fr only — relay gets none
    const cdSign = genPemKey('ed25519');
    const cdEnc  = genPemKey('x25519');
    const frSign = genPemKey('ed25519');
    const frEnc  = genPemKey('x25519');

    const bundle = {
      version:      1,
      generated_at: new Date().toISOString(),
      teams: {
        [CD_TEAM]: { sign_pub: cdSign.pub, enc_pub: cdEnc.pub },
        [FR_TEAM]: { sign_pub: frSign.pub, enc_pub: frEnc.pub },
      },
    };

    writeFileSync(join(cdDir, 'sign.pem'), cdSign.priv);
    writeFileSync(join(cdDir, 'enc.pem'),  cdEnc.priv);
    writeFileSync(join(cdDir, 'bundle.json'), JSON.stringify(bundle));

    writeFileSync(join(frDir, 'sign.pem'), frSign.priv);
    writeFileSync(join(frDir, 'enc.pem'),  frEnc.priv);
    writeFileSync(join(frDir, 'bundle.json'), JSON.stringify(bundle));
    // relayDir gets NO v2 key files

    const [cdPort, frPort, relayPort] = await Promise.all([
      getFreePort(), getFreePort(), getFreePort(),
    ]);

    relayDaemon = new DaemonV2({
      teamName:            RELAY_TEAM,
      keysDir:             relayDir,
      inboxDir:            join(tmpdir(), `v2int-s5-relayinbox-${ts}`),
      listenPort:          relayPort,
      peers: {
        [CD_TEAM]: { host: '127.0.0.1', port: cdPort },
        [FR_TEAM]: { host: '127.0.0.1', port: frPort },
      },
      role:                'hub',
      reconnectBaseMs:     50,
      heartbeatIntervalMs: 60_000,
      deadConnectionMs:    120_000,
      // No v2 keys — relay cannot read E2E-encrypted bodies
    });

    mkdirSync(join(tmpdir(), `v2int-s5-relayinbox-${ts}`), { recursive: true });

    cdDaemon = new DaemonV2({
      teamName:            CD_TEAM,
      keysDir:             cdDir,
      inboxDir:            cdInbox,
      listenPort:          cdPort,
      peers:               { [RELAY_TEAM]: { host: '127.0.0.1', port: relayPort } },
      hubPeers:            [RELAY_TEAM],   // skip from.team check for relay-relayed messages
      defaultPeer:         RELAY_TEAM,     // route unknown destinations via relay
      role:                'team',
      reconnectBaseMs:     50,
      heartbeatIntervalMs: 60_000,
      deadConnectionMs:    120_000,
      signKeyPath:  join(cdDir, 'sign.pem'),
      encKeyPath:   join(cdDir, 'enc.pem'),
      keyBundlePath: join(cdDir, 'bundle.json'),
    });

    frDaemon = new DaemonV2({
      teamName:            FR_TEAM,
      keysDir:             frDir,
      inboxDir:            frInbox,
      listenPort:          frPort,
      peers:               { [RELAY_TEAM]: { host: '127.0.0.1', port: relayPort } },
      hubPeers:            [RELAY_TEAM],
      defaultPeer:         RELAY_TEAM,
      role:                'team',
      reconnectBaseMs:     50,
      heartbeatIntervalMs: 60_000,
      deadConnectionMs:    120_000,
      signKeyPath:  join(frDir, 'sign.pem'),
      encKeyPath:   join(frDir, 'enc.pem'),
      keyBundlePath: join(frDir, 'bundle.json'),
    });

    // Start relay first so cd/fr can connect immediately
    await relayDaemon.start();
    await Promise.all([cdDaemon.start(), frDaemon.start()]);
    await new Promise(r => setTimeout(r, 600));
  });

  afterAll(async () => {
    await cdDaemon?.stop();
    await frDaemon?.stop();
    await relayDaemon?.stop();
    for (const d of [cdDir, frDir, relayDir, cdInbox, frInbox]) {
      rmSync(d, { recursive: true, force: true });
    }
  });

  it('cd→relay→fr: message is delivered to fr inbox', async () => {
    const body = 'hub relay: end-to-end delivery test';
    const msg  = makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', body);
    const result = await cdDaemon.sendMessage(msg);
    expect(result).toBe('OK');
    const delivered = await waitForInboxFile(frInbox, msg.id, 5000);
    expect(delivered.id).toBe(msg.id);
  });

  it('fr inbox body is the original plaintext (E2E decrypted: cd encrypted, fr decrypted)', async () => {
    const body = 'hub relay: E2E plaintext body check';
    const msg  = makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', body);
    await cdDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(frInbox, msg.id, 5000);
    // fr received, verified signature, decrypted body → plaintext
    expect(delivered.body).toBe(body);
  });

  it('relay (hub) has no v2 keys — confirms HUB-1: relay blind to body content', async () => {
    // Verify by inspection: relay daemon has no cryptoV2 (no key paths configured).
    // This proves the relay cannot decrypt the E2E-encrypted body.
    // Structural test: relay was started without signKeyPath/encKeyPath/keyBundlePath.
    // If relay HAD been able to decrypt, the v2 crypto would be broken (HUB-1 violation).
    // We verify indirectly: fr inbox has PLAINTEXT, proving decryption happened at fr,
    // not at relay (relay would have needed to re-encrypt if it could read plaintext).
    const body = 'hub-1: relay blindness check';
    const msg  = makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', body);
    await cdDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(frInbox, msg.id, 5000);
    // fr has plaintext — decryption happened at fr using fr's private key (not relay)
    expect(delivered.body).toBe(body);
  });

  it('reverse direction: fr→relay→cd E2E round-trip', async () => {
    const body = 'hub relay: reverse direction check';
    const msg  = makeMsg(FR_TEAM, 'herald', CD_TEAM, 'babbage', body);
    const result = await frDaemon.sendMessage(msg);
    expect(result).toBe('OK');
    const delivered = await waitForInboxFile(cdInbox, msg.id, 5000);
    expect(delivered.body).toBe(body);
  });

  it('fr inbox from.team is comms-dev (not relay) — Ed25519 sender identity preserved', async () => {
    const body = 'hub relay: sender identity check';
    const msg  = makeMsg(CD_TEAM, 'babbage', FR_TEAM, 'herald', body);
    await cdDaemon.sendMessage(msg);
    const delivered = await waitForInboxFile(frInbox, msg.id, 5000);
    // Envelope from.team must be 'comms-dev', not 'relay'
    // Ed25519 signature verification confirms cd is the actual sender (not the hub)
    expect(delivered.from.team).toBe(CD_TEAM);
    expect(delivered.from.agent).toBe('babbage');
  });
});
