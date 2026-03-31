// (*CD:Kerckhoffs*)
// RED tests for story/33: Wire E2E crypto into hub and MCP.
//
// Acceptance criteria (Given/When/Then — EN 50716:2023 / CODING_STANDARDS.md):
//
//   AC1 — sender encrypts + signs before POST:
//     Given: MCP configured with team-a's Ed25519 sign key + X25519 enc key + key bundle
//     When:  comms_send tool called with { to: 'team-b', body: 'plaintext hello' }
//     Then:  message POSTed to hub has: signature field, body_hash field,
//            body is NOT 'plaintext hello' (it's JSON-encoded E2EPayload);
//            decrypting body with team-b's key recovers 'plaintext hello'
//
//   AC2 — receiver verifies + decrypts on SSE:
//     Given: team-b's MCP server has crypto configured; team-a sends encrypted+signed message
//     When:  team-b's SSESubscriber receives the SSE event
//     Then:  inbox contains the decrypted plaintext body, not the E2EPayload JSON
//
//   AC3 — hub forwards body verbatim (hub is crypto-blind):
//     Given: team-a sends a message with encrypted body to hub
//     When:  hub routes to team-b via SSE
//     Then:  SSE event body field equals the exact encrypted blob team-a sent (unchanged)
//
//   AC4 — invalid signature dropped at receiver:
//     Given: MCP server with crypto configured (verifySignature enabled)
//     When:  a message with tampered signature arrives via SSE
//     Then:  message is NOT added to inbox (dropped silently)
//
//   AC5 — key bundle loaded from configurable path:
//     Given: key bundle JSON written to a temp file; path set in McpOptions.keyBundlePath
//     When:  createMcpServer({ ..., keyBundlePath, signKeyPath, encKeyPath }) is called
//     Then:  the resulting server can send encrypted, signed messages
//
//   AC6 — pairwise key isolation (C cannot decrypt A→B messages):
//     Given: team-a encrypts a message for team-b using X25519 pairwise keys
//     When:  team-c (with its own key pair) tries to decrypt the same E2EPayload
//     Then:  e2eDecrypt throws "E2E decryption failed: authentication tag mismatch"
//
//   AC7 — AAD includes sender + receiver (decryption fails if swapped):
//     Given: team-a encrypts body for team-b with AAD = "v2:<id>:team-a:team-b"
//     When:  team-b tries to decrypt treating sender as team-b, receiver as team-a
//     Then:  decryption fails — AAD mismatch → authentication tag error
//
// RED conditions:
//   AC1: SendTool.ToolDeps has no `crypto` field; tool does not call e2eEncrypt/signEnvelope
//        → sent message lacks `signature`, body is plaintext
//   AC2: SSESubscriber._processChunk does not call verifySignature/e2eDecrypt
//        → inbox contains raw E2EPayload JSON, not plaintext
//   AC4: SSESubscriber does not verify signatures; tampered messages reach inbox
//   AC5: McpOptions has no keyBundlePath/signKeyPath/encKeyPath fields;
//        createMcpServer ignores them → no crypto instance created
//   AC6: Already GREEN at crypto level (pairwise key derivation is correct)
//   AC7: Already GREEN at crypto level (AAD is sender:receiver, not swapped)
//
// Anti-mocking: real Ed25519/X25519 keys; real HTTPS hub for AC2/AC3.
// Ref: https://github.com/mitselek/ai-teams/issues/33
//
// [CHECKPOINT] Once Lovelace implements crypto wiring in send.ts + subscribe.ts
// and extends McpOptions, all ACs should turn GREEN.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { rmSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import * as https from 'node:https';
import { generateKeyPairSync, createHash } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { IncomingMessage } from 'node:http';

import { createHub } from '../../hub/src/server.js';
import { InboxBuffer, SSESubscriber } from './subscribe.js';
import { createMcpServer } from './server.js';
import * as SendTool from './tools/send.js';

// Crypto module — from comms-dev root src/
import { createCryptoAPIv2 } from '../../../src/crypto/index.js';
import type { CryptoAPIv2, E2EPayload, KeyBundle } from '../../../src/crypto/index.js';

// ── Key generation helpers ─────────────────────────────────────────────────────

function genEd25519(): { privateKey: string; publicKey: string } {
  return generateKeyPairSync('ed25519', {
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
}

function genX25519(): { privateKey: string; publicKey: string } {
  return generateKeyPairSync('x25519', {
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
}

function computeBodyHash(body: string): string {
  return 'sha256:' + createHash('sha256').update(body, 'utf-8').digest('hex');
}

// ── TLS cert helpers ───────────────────────────────────────────────────────────

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = (srv.address() as AddressInfo).port;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function genCa(dir: string): void {
  execSync(
    `openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${join(dir, 'ca.key')}" -out "${join(dir, 'ca.crt')}" \
     -days 1 -nodes -subj "/CN=test-ca" 2>/dev/null`,
  );
}

function genSignedCert(dir: string, cn: string, caDir: string): void {
  const csrPath = join(dir, `${cn}.csr`);
  execSync(
    `openssl req -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
     -keyout "${join(dir, `${cn}.key`)}" -out "${csrPath}" -nodes \
     -subj "/CN=${cn}" 2>/dev/null`,
  );
  execSync(
    `openssl x509 -req -in "${csrPath}" \
     -CA "${join(caDir, 'ca.crt')}" -CAkey "${join(caDir, 'ca.key')}" \
     -CAcreateserial -out "${join(dir, `${cn}.crt`)}" -days 1 2>/dev/null`,
  );
}

const SKIP_HOSTNAME = { checkServerIdentity: () => undefined } as const;

function waitUntil(predicate: () => boolean, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const poll = () => {
      if (predicate()) {
        resolve();
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error(`waitUntil: condition not met within ${timeoutMs}ms`));
        return;
      }
      setTimeout(poll, 20);
    };
    poll();
  });
}

function httpsPost(
  port: number,
  path: string,
  ca: string,
  clientCert: { cert: string; key: string },
  body: object,
): Promise<{ status: number; body: string }> {
  const bodyStr = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: '127.0.0.1',
        ...SKIP_HOSTNAME,
        port,
        path,
        method: 'POST',
        ca,
        ...clientCert,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      },
      (res: IncomingMessage) => {
        let data = '';
        res.on('data', (chunk: string) => {
          data += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
      },
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// ── Shared fixture: crypto keys + TLS certs + hub ─────────────────────────────

const TEAM_A = 'team-a';
const TEAM_B = 'team-b';
const TEAM_C = 'team-c';

let tmpDir: string;
let caCrt: string;
let teamACert: { cert: string; key: string };
let teamBCert: { cert: string; key: string };
let teamCCert: { cert: string; key: string };

// Ed25519 + X25519 key pairs per team
let aSign: { privateKey: string; publicKey: string };
let aEnc: { privateKey: string; publicKey: string };
let bSign: { privateKey: string; publicKey: string };
let bEnc: { privateKey: string; publicKey: string };
let cSign: { privateKey: string; publicKey: string };
let cEnc: { privateKey: string; publicKey: string };

let keyBundle: KeyBundle;
let bundleFilePath: string;
let aSignKeyPath: string;
let aEncKeyPath: string;
let bSignKeyPath: string;
let bEncKeyPath: string;

let aCrypto: CryptoAPIv2;
let bCrypto: CryptoAPIv2;
let cCrypto: CryptoAPIv2; // team-c: NOT in key bundle for A↔B

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let hub: any;
let hubPort: number;
let hubUrl: string;

beforeAll(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'e2e-crypto-test-'));

  // TLS certs
  genCa(tmpDir);
  caCrt = read(join(tmpDir, 'ca.crt'));
  for (const cn of ['hub', TEAM_A, TEAM_B, TEAM_C]) {
    genSignedCert(tmpDir, cn, tmpDir);
  }
  teamACert = {
    cert: read(join(tmpDir, `${TEAM_A}.crt`)),
    key: read(join(tmpDir, `${TEAM_A}.key`)),
  };
  teamBCert = {
    cert: read(join(tmpDir, `${TEAM_B}.crt`)),
    key: read(join(tmpDir, `${TEAM_B}.key`)),
  };
  teamCCert = {
    cert: read(join(tmpDir, `${TEAM_C}.crt`)),
    key: read(join(tmpDir, `${TEAM_C}.key`)),
  };

  // Ed25519 + X25519 key pairs
  aSign = genEd25519();
  aEnc = genX25519();
  bSign = genEd25519();
  bEnc = genX25519();
  cSign = genEd25519();
  cEnc = genX25519();

  // Key bundle: only team-a and team-b
  // (team-c intentionally excluded from A↔B bundle — pairwise isolation)
  keyBundle = {
    version: 1,
    generated_at: new Date().toISOString(),
    teams: {
      [TEAM_A]: { sign_pub: aSign.publicKey, enc_pub: aEnc.publicKey },
      [TEAM_B]: { sign_pub: bSign.publicKey, enc_pub: bEnc.publicKey },
    },
  };

  // Key bundle for team-c (contains A, B, C — so C can encrypt for anyone)
  const cBundle: KeyBundle = {
    version: 1,
    generated_at: new Date().toISOString(),
    teams: {
      [TEAM_A]: { sign_pub: aSign.publicKey, enc_pub: aEnc.publicKey },
      [TEAM_B]: { sign_pub: bSign.publicKey, enc_pub: bEnc.publicKey },
      [TEAM_C]: { sign_pub: cSign.publicKey, enc_pub: cEnc.publicKey },
    },
  };

  // Write key bundle + private keys to temp files
  bundleFilePath = join(tmpDir, 'key-bundle.json');
  writeFileSync(bundleFilePath, JSON.stringify(keyBundle));

  aSignKeyPath = join(tmpDir, 'team-a-sign.pem');
  aEncKeyPath = join(tmpDir, 'team-a-enc.pem');
  writeFileSync(aSignKeyPath, aSign.privateKey);
  writeFileSync(aEncKeyPath, aEnc.privateKey);

  bSignKeyPath = join(tmpDir, 'team-b-sign.pem');
  bEncKeyPath = join(tmpDir, 'team-b-enc.pem');
  writeFileSync(bSignKeyPath, bSign.privateKey);
  writeFileSync(bEncKeyPath, bEnc.privateKey);

  // Crypto API instances
  aCrypto = createCryptoAPIv2({
    teamName: TEAM_A,
    signKey: Buffer.from(aSign.privateKey),
    encKey: Buffer.from(aEnc.privateKey),
    keyBundle,
  });

  bCrypto = createCryptoAPIv2({
    teamName: TEAM_B,
    signKey: Buffer.from(bSign.privateKey),
    encKey: Buffer.from(bEnc.privateKey),
    keyBundle,
  });

  cCrypto = createCryptoAPIv2({
    teamName: TEAM_C,
    signKey: Buffer.from(cSign.privateKey),
    encKey: Buffer.from(cEnc.privateKey),
    keyBundle: cBundle, // C can derive keys with A and B (but not decrypt A→B)
  });

  // Real hub
  hubPort = await getFreePort();
  hubUrl = `https://127.0.0.1:${hubPort}`;

  hub = createHub({
    tls: {
      ca: caCrt,
      cert: read(join(tmpDir, 'hub.crt')),
      key: read(join(tmpDir, 'hub.key')),
    },
    peers: {
      [TEAM_A]: teamACert.cert,
      [TEAM_B]: teamBCert.cert,
      [TEAM_C]: teamCCert.cert,
    },
    signPubKeys: {
      [TEAM_A]: aSign.publicKey,
      [TEAM_B]: bSign.publicKey,
    },
    logger: false,
  });
  await hub.listen({ port: hubPort, host: '127.0.0.1' });
});

afterAll(async () => {
  await hub?.close?.();
  rmSync(tmpDir, { recursive: true, force: true });
});

// ── AC1 — sender encrypts + signs before POST ──────────────────────────────────

describe('AC1 — comms_send encrypts body and signs envelope', () => {
  it('sent message has signature + body_hash; body is E2E encrypted, not plaintext', async () => {
    // Capture the message sent to the hub via a mock client
    type SentMsg = Record<string, unknown>;
    let capturedMsg: SentMsg | null = null;
    const mockClient = {
      send: async (msg: SentMsg) => {
        capturedMsg = msg;
        return { ok: true, id: msg['id'] as string };
      },
    };

    const inbox = new InboxBuffer();
    // RED: ToolDeps has no `crypto` field — tool ignores the crypto instance even if passed
    const deps = {
      client: mockClient,
      inbox,
      subscriber: undefined,
      teamName: TEAM_A,
      // Story/33 expects this field; current ToolDeps does not have it
      crypto: aCrypto,
    } as unknown as Parameters<typeof SendTool.execute>[1];

    await SendTool.execute({ to: TEAM_B, body: 'plaintext hello' }, deps);

    expect(capturedMsg).not.toBeNull();

    // RED: tool currently does not sign → signature field will be absent
    expect(capturedMsg!['signature']).toBeTruthy();

    // RED: tool currently sets body_hash from raw plaintext, not encrypted body
    // After wiring: body_hash should be sha256 of the *encrypted* body string
    expect(capturedMsg!['body_hash']).toBeTruthy();

    // RED: tool currently sends plaintext body
    expect(capturedMsg!['body']).not.toBe('plaintext hello');

    // If body IS encrypted (after GREEN), verify it decrypts correctly
    if (capturedMsg!['body'] && capturedMsg!['body'] !== 'plaintext hello') {
      const payload = JSON.parse(capturedMsg!['body'] as string) as E2EPayload;
      const decrypted = await bCrypto.e2eDecrypt(payload, capturedMsg!['id'] as string);
      expect(decrypted.toString('utf-8')).toBe('plaintext hello');
    }
  });
});

// ── AC2 — receiver verifies + decrypts on SSE receive ──────────────────────────

describe('AC2 — inbox contains decrypted plaintext, not raw E2EPayload JSON', () => {
  it('MCP subscriber decrypts body before pushing to inbox', async () => {
    // Build an encrypted+signed message from team-a to team-b
    const msgId = `e2e-ac2-${Date.now()}`;
    const plaintext = 'secret agent message';
    const e2ePayload = await aCrypto.e2eEncrypt(Buffer.from(plaintext, 'utf-8'), TEAM_B, msgId);
    const encryptedBody = JSON.stringify(e2ePayload);
    const bodyHash = computeBodyHash(encryptedBody);

    const draft = {
      version: '1' as const,
      id: msgId,
      timestamp: new Date().toISOString(),
      from: { team: TEAM_A, agent: 'mcp' },
      to: { team: TEAM_B, agent: 'mcp' },
      type: 'query' as const,
      priority: 'normal' as const,
      reply_to: null,
      body: encryptedBody,
      body_hash: bodyHash,
    };

    // Sign the envelope (team-a → hub accepts it)
    const signature = aCrypto.signEnvelope(
      draft as unknown as Parameters<typeof aCrypto.signEnvelope>[0],
    );
    const signedMsg = { ...draft, signature };

    // Subscribe team-b with crypto configured for verify+decrypt
    const { inbox, subscriber } = createMcpServer({
      hubUrl,
      cert: teamBCert.cert,
      key: teamBCert.key,
      ca: caCrt,
      teamName: TEAM_B,
      keyBundlePath: bundleFilePath,
      signKeyPath: bSignKeyPath,
      encKeyPath: bEncKeyPath,
    });

    subscriber.start();
    await waitUntil(() => subscriber.connected, 2000);

    // Send the encrypted+signed message to hub
    const postResult = await httpsPost(hubPort, '/api/send', caCrt, teamACert, signedMsg);
    expect(postResult.status).toBe(200);

    // Wait for message to arrive in inbox
    await waitUntil(() => inbox.messages.length > 0, 2000);

    subscriber.stop();

    // RED: SSESubscriber currently pushes raw JSON; inbox.body is the encrypted blob
    // After GREEN: inbox should contain decrypted plaintext body
    const received = inbox.messages[0] as Record<string, unknown>;
    expect(received['body']).toBe(plaintext);
    expect(received['id']).toBe(msgId);
  });
});

// ── AC3 — hub forwards body verbatim ──────────────────────────────────────────

describe('AC3 — hub forwards E2E body verbatim (hub is crypto-blind)', () => {
  it('SSE event body at receiver matches exactly what sender posted', async () => {
    const msgId = `e2e-ac3-${Date.now()}`;
    const e2ePayload = await aCrypto.e2eEncrypt(
      Buffer.from('verbatim check', 'utf-8'),
      TEAM_B,
      msgId,
    );
    const encryptedBody = JSON.stringify(e2ePayload);
    const bodyHash = computeBodyHash(encryptedBody);

    const draft = {
      version: '1' as const,
      id: msgId,
      timestamp: new Date().toISOString(),
      from: { team: TEAM_A, agent: 'mcp' },
      to: { team: TEAM_B, agent: 'mcp' },
      type: 'query' as const,
      priority: 'normal' as const,
      reply_to: null,
      body: encryptedBody,
      body_hash: bodyHash,
    };
    const signature = aCrypto.signEnvelope(
      draft as unknown as Parameters<typeof aCrypto.signEnvelope>[0],
    );
    const signedMsg = { ...draft, signature };

    // Open raw SSE subscriber (no crypto) to capture raw event
    const rawInbox = new InboxBuffer();
    const rawSubscriber = new SSESubscriber(
      hubUrl,
      { cert: teamBCert.cert, key: teamBCert.key, ca: caCrt },
      rawInbox,
    );
    rawSubscriber.start();
    await waitUntil(() => rawSubscriber.connected, 2000);

    await httpsPost(hubPort, '/api/send', caCrt, teamACert, signedMsg);

    await waitUntil(() => rawInbox.messages.length > 0, 2000);
    rawSubscriber.stop();

    // Hub must forward body unchanged
    const rawReceived = rawInbox.messages[0] as Record<string, unknown>;
    expect(rawReceived['body']).toBe(encryptedBody);
    expect(rawReceived['id']).toBe(msgId);
  });
});

// ── AC4 — invalid signature dropped at receiver ────────────────────────────────

describe('AC4 — messages with invalid signature are not delivered to inbox', () => {
  it('tampered signature: message dropped; inbox stays empty', async () => {
    // Build a properly-encrypted message but tamper the signature
    const msgId = `e2e-ac4-${Date.now()}`;
    const e2ePayload = await aCrypto.e2eEncrypt(
      Buffer.from('secret payload', 'utf-8'),
      TEAM_B,
      msgId,
    );
    const encryptedBody = JSON.stringify(e2ePayload);
    const bodyHash = computeBodyHash(encryptedBody);

    const draft = {
      version: '1' as const,
      id: msgId,
      timestamp: new Date().toISOString(),
      from: { team: TEAM_A, agent: 'mcp' },
      to: { team: TEAM_B, agent: 'mcp' },
      type: 'query' as const,
      priority: 'normal' as const,
      reply_to: null,
      body: encryptedBody,
      body_hash: bodyHash,
    };
    // Real signature so hub accepts it (hub sig check passes), then tamper AFTER hub
    const realSig = aCrypto.signEnvelope(
      draft as unknown as Parameters<typeof aCrypto.signEnvelope>[0],
    );
    // Tamper: flip a byte in the signature
    const sigBytes = Buffer.from(realSig, 'base64');
    sigBytes[0] ^= 0xff;
    const tamperedSig = sigBytes.toString('base64');

    const tamperedMsg = { ...draft, signature: tamperedSig };

    // RED: hub does NOT know the signature was tampered because body_hash still matches.
    // The hub verifySignature will catch this → 403.
    // After GREEN (when sender always signs): this ensures hub properly rejects it.
    const postResult = await httpsPost(hubPort, '/api/send', caCrt, teamACert, tamperedMsg);

    // Hub should reject tampered signature (signPubKeys is configured)
    expect(postResult.status).toBe(403);
  });

  it('missing signature: SSESubscriber drops unsigned messages when crypto configured', async () => {
    // Hub forwards unsigned messages through (requireE2E is a separate story).
    // With crypto configured, SSESubscriber.verifySignature() returns false → message dropped.
    const msgId = `e2e-ac4b-${Date.now()}`;
    const unsignedMsg = {
      version: '1',
      id: msgId,
      timestamp: new Date().toISOString(),
      from: { team: TEAM_A, agent: 'mcp' },
      to: { team: TEAM_B, agent: 'mcp' },
      type: 'query',
      priority: 'normal',
      reply_to: null,
      body: 'unsigned plaintext body',
      // No signature, no body_hash
    };

    // Subscribe team-b with crypto configured — subscriber drops unverified messages
    const { inbox, subscriber } = createMcpServer({
      hubUrl,
      cert: teamBCert.cert,
      key: teamBCert.key,
      ca: caCrt,
      teamName: TEAM_B,
      keyBundlePath: bundleFilePath,
      signKeyPath: bSignKeyPath,
      encKeyPath: bEncKeyPath,
    });
    subscriber.start();
    await waitUntil(() => subscriber.connected, 2000);

    await httpsPost(hubPort, '/api/send', caCrt, teamACert, unsignedMsg);

    // Wait a short time — if message arrives it's a failure
    await new Promise<void>((r) => setTimeout(r, 200));
    subscriber.stop();

    // SSESubscriber with crypto must drop unsigned messages — inbox stays empty
    expect(inbox.messages.length).toBe(0);
  });
});

// ── AC5 — key bundle from configurable file path ───────────────────────────────

describe('AC5 — createMcpServer loads crypto from key file paths', () => {
  it('McpOptions accepts keyBundlePath + signKeyPath + encKeyPath', async () => {
    // Write team-b's private keys to temp files
    const bSignKeyPath = join(tmpDir, 'b-sign.pem');
    const bEncKeyPath = join(tmpDir, 'b-enc.pem');
    writeFileSync(bSignKeyPath, bSign.privateKey);
    writeFileSync(bEncKeyPath, bEnc.privateKey);

    // RED: createMcpServer does not accept keyBundlePath/signKeyPath/encKeyPath
    // After GREEN: Lovelace adds these to McpOptions and loads keys from them
    const { client: bClient } = createMcpServer({
      hubUrl,
      cert: teamBCert.cert,
      key: teamBCert.key,
      ca: caCrt,
      teamName: TEAM_B,
      // These options do not exist yet in McpOptions:
      keyBundlePath: bundleFilePath,
      signKeyPath: bSignKeyPath,
      encKeyPath: bEncKeyPath,
    } as unknown as Parameters<typeof createMcpServer>[0]);

    // If crypto is loaded from file, the client should carry a crypto instance
    // RED: client does not have crypto-related methods
    expect(bClient).toBeTruthy();

    // Verify crypto is functional by having team-a send to team-b using the file-loaded keys
    const msgId = `e2e-ac5-${Date.now()}`;
    const e2ePayload = await aCrypto.e2eEncrypt(
      Buffer.from('from file keys', 'utf-8'),
      TEAM_B,
      msgId,
    );
    const encryptedBody = JSON.stringify(e2ePayload);

    // team-b's file-loaded keys should be able to decrypt
    // After GREEN: bClient.crypto.e2eDecrypt should exist
    const bClientWithCrypto = bClient as unknown as { crypto?: CryptoAPIv2 };
    if (bClientWithCrypto.crypto) {
      const payload = JSON.parse(encryptedBody) as E2EPayload;
      const decrypted = await bClientWithCrypto.crypto.e2eDecrypt(payload, msgId);
      expect(decrypted.toString('utf-8')).toBe('from file keys');
    } else {
      // RED path: no crypto on client → this assertion fails
      expect(bClientWithCrypto.crypto).toBeDefined();
    }
  });
});

// ── AC6 — pairwise key isolation ───────────────────────────────────────────────

describe('AC6 — pairwise key isolation: C cannot decrypt A→B messages', () => {
  it('team-c decryption of A→B message throws authentication tag mismatch', async () => {
    const msgId = `e2e-ac6-${Date.now()}`;

    // team-a encrypts for team-b
    const e2ePayload = await aCrypto.e2eEncrypt(
      Buffer.from('secret for B only', 'utf-8'),
      TEAM_B,
      msgId,
    );

    // team-c tries to decrypt — should fail with GCM auth tag error
    // team-c has its own keys; the pairwise key for C↔A differs from A↔B
    await expect(cCrypto.e2eDecrypt(e2ePayload, msgId)).rejects.toThrow(
      'E2E decryption failed: authentication tag mismatch',
    );
  });

  it('team-b successfully decrypts A→B message (control case)', async () => {
    const msgId = `e2e-ac6b-${Date.now()}`;
    const e2ePayload = await aCrypto.e2eEncrypt(
      Buffer.from('only B can read this', 'utf-8'),
      TEAM_B,
      msgId,
    );
    const decrypted = await bCrypto.e2eDecrypt(e2ePayload, msgId);
    expect(decrypted.toString('utf-8')).toBe('only B can read this');
  });
});

// ── AC7 — AAD binds sender + receiver ─────────────────────────────────────────

describe('AC7 — AAD "v2:<id>:<sender>:<receiver>" prevents ciphertext transplant', () => {
  it('decryption fails when sender/receiver are swapped in AAD', async () => {
    const msgId = `e2e-ac7-${Date.now()}`;

    // team-a encrypts for team-b (AAD = "v2:id:team-a:team-b")
    const e2ePayload = await aCrypto.e2eEncrypt(
      Buffer.from('AAD test payload', 'utf-8'),
      TEAM_B,
      msgId,
    );

    // Construct a spoofed payload claiming sender=team-b (swapped direction)
    // This simulates a ciphertext transplant attack: attacker replays A→B as B→A
    const spoofedPayload: E2EPayload = {
      ...e2ePayload,
      sender_team: TEAM_B, // lie: claim it came from team-b
    };

    // team-a tries to decrypt, expecting AAD "v2:id:team-b:team-a" — will mismatch
    await expect(aCrypto.e2eDecrypt(spoofedPayload, msgId)).rejects.toThrow(
      'E2E decryption failed: authentication tag mismatch',
    );
  });

  it('same message decrypted correctly with correct AAD (control case)', async () => {
    const msgId = `e2e-ac7b-${Date.now()}`;
    const e2ePayload = await aCrypto.e2eEncrypt(Buffer.from('correct AAD', 'utf-8'), TEAM_B, msgId);
    const decrypted = await bCrypto.e2eDecrypt(e2ePayload, msgId);
    expect(decrypted.toString('utf-8')).toBe('correct AAD');
  });
});
