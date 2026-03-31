// (*CD:Kerckhoffs*)
// Story/35: E2E integration test — MCP spoke ↔ hub ↔ MCP spoke.
//
// Capstone proof that v3 works end-to-end: real hub, real TLS, real E2E crypto,
// real SSE subscriptions, all running in-process.
//
// Acceptance criteria:
//
//   AC1 — spoke A sends → spoke B receives (correct from/to envelope):
//     Given: hub running; both spokes subscribed; B's inbox empty
//     When:  A calls comms_send({ to: 'team-b', body: 'hello from A' })
//     Then:  B's inbox receives a message with:
//              body === 'hello from A' (decrypted)
//              from.team === 'team-a', to.team === 'team-b'
//
//   AC2 — bidirectional (B → A):
//     Given: hub running; both spokes subscribed
//     When:  B calls comms_send({ to: 'team-a', body: 'reply from B' })
//     Then:  A's inbox receives the message with body === 'reply from B'
//
//   AC3 — hub logs contain no plaintext body:
//     Given: hub configured with a captured log stream
//     When:  A sends a message with a distinctive plaintext body
//     Then:  the captured log output does NOT contain the plaintext string
//            (hub is crypto-blind; body is forwarded as opaque ciphertext)
//
//   AC4 — offline queue: send while B disconnected, reconnect, delivered:
//     Given: B's subscriber is stopped (B is offline)
//     When:  A sends a message to B (queued); B's subscriber restarts
//     Then:  the queued message arrives in B's inbox after reconnect
//
//   AC5 — forged signature rejected at hub:
//     Given: hub configured with team-a's Ed25519 sign_pub
//     When:  a message is POSTed using team-a's mTLS cert but signed with a different key
//     Then:  hub returns HTTP 403 (Invalid signature)
//
//   AC6 — runs under pnpm test in < 30s:
//     Given: standard test environment
//     When:  the test suite runs
//     Then:  all tests complete within the per-test timeout budget
//
//   AC7 — clean teardown (no orphaned handles):
//     Given: tests are complete
//     When:  afterAll cleanup runs
//     Then:  hub closed; subscribers stopped; temp dir removed; no Node.js handle leaks
//
// Ref: https://github.com/mitselek/ai-teams/issues/35

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { rmSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import * as https from 'node:https';
import { generateKeyPairSync, createHash, sign as cryptoSign } from 'node:crypto';
import { PassThrough } from 'node:stream';
import type { AddressInfo } from 'node:net';
import type { IncomingMessage } from 'node:http';
import { randomUUID } from 'node:crypto';

import { createHub } from '../../hub/src/server.js';
import { createMcpServer } from './server.js';
import * as SendTool from './tools/send.js';
import type { HubClient } from './client.js';
import type { CryptoAPIv2, KeyBundle } from '../../../src/crypto/index.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

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

const SKIP_HOSTNAME = { checkServerIdentity: () => undefined } as const;

function httpsPost(
  port: number,
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
        path: '/api/send',
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

function waitUntil(predicate: () => boolean, timeoutMs = 4000): Promise<void> {
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

// ── Fixture ────────────────────────────────────────────────────────────────────

const TEAM_A = 'team-a';
const TEAM_B = 'team-b';

let tmpDir: string;
let caCrt: string;
let teamACert: { cert: string; key: string };
let teamBCert: { cert: string; key: string };

// Ed25519 + X25519 key pairs
let aSign: { privateKey: string; publicKey: string };
let bSign: { privateKey: string; publicKey: string };

// Key file paths
let bundleFilePath: string;
let aSignKeyPath: string;
let aEncKeyPath: string;
let bSignKeyPath: string;
let bEncKeyPath: string;

// Hub log capture
const hubLogChunks: string[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let hub: any;
let hubPort: number;

// MCP server handles
let aMcp: ReturnType<typeof createMcpServer>;
let bMcp: ReturnType<typeof createMcpServer>;

// Tool deps for direct tool invocation
type ToolDeps = Parameters<typeof SendTool.execute>[1];
let aDeps: ToolDeps;
let bDeps: ToolDeps;

beforeAll(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'e2e-int-test-'));

  // TLS certs
  genCa(tmpDir);
  caCrt = read(join(tmpDir, 'ca.crt'));
  for (const cn of ['hub', TEAM_A, TEAM_B]) {
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

  // Ed25519 + X25519 key pairs
  aSign = genEd25519();
  const aEnc = genX25519();
  bSign = genEd25519();
  const bEnc = genX25519();

  // Key bundle (both teams)
  const keyBundle: KeyBundle = {
    version: 1,
    generated_at: new Date().toISOString(),
    teams: {
      [TEAM_A]: { sign_pub: aSign.publicKey, enc_pub: aEnc.publicKey },
      [TEAM_B]: { sign_pub: bSign.publicKey, enc_pub: bEnc.publicKey },
    },
  };
  bundleFilePath = join(tmpDir, 'key-bundle.json');
  writeFileSync(bundleFilePath, JSON.stringify(keyBundle));

  aSignKeyPath = join(tmpDir, 'a-sign.pem');
  aEncKeyPath = join(tmpDir, 'a-enc.pem');
  bSignKeyPath = join(tmpDir, 'b-sign.pem');
  bEncKeyPath = join(tmpDir, 'b-enc.pem');
  writeFileSync(aSignKeyPath, aSign.privateKey);
  writeFileSync(aEncKeyPath, aEnc.privateKey);
  writeFileSync(bSignKeyPath, bSign.privateKey);
  writeFileSync(bEncKeyPath, bEnc.privateKey);

  // Hub — capture logs via PassThrough stream to verify AC3
  const logStream = new PassThrough();
  logStream.on('data', (chunk: Buffer | string) => {
    hubLogChunks.push(typeof chunk === 'string' ? chunk : chunk.toString('utf-8'));
  });

  hubPort = await getFreePort();
  const hubUrl = `https://127.0.0.1:${hubPort}`;

  hub = createHub({
    tls: {
      ca: caCrt,
      cert: read(join(tmpDir, 'hub.crt')),
      key: read(join(tmpDir, 'hub.key')),
    },
    peers: {
      [TEAM_A]: teamACert.cert,
      [TEAM_B]: teamBCert.cert,
    },
    signPubKeys: {
      [TEAM_A]: aSign.publicKey,
      [TEAM_B]: bSign.publicKey,
    },
    logger: { stream: logStream },
  });
  await hub.listen({ port: hubPort, host: '127.0.0.1' });

  // MCP servers with E2E crypto
  const mcpOpts = (
    teamName: string,
    cert: string,
    key: string,
    signKeyPath: string,
    encKeyPath: string,
  ) => ({
    hubUrl,
    cert,
    key,
    ca: caCrt,
    teamName,
    keyBundlePath: bundleFilePath,
    signKeyPath,
    encKeyPath,
  });

  aMcp = createMcpServer(mcpOpts(TEAM_A, teamACert.cert, teamACert.key, aSignKeyPath, aEncKeyPath));
  bMcp = createMcpServer(mcpOpts(TEAM_B, teamBCert.cert, teamBCert.key, bSignKeyPath, bEncKeyPath));

  // Build tool deps (expose crypto from client for encrypted sends)
  const aCrypto = (aMcp.client as HubClient & { crypto?: CryptoAPIv2 }).crypto;
  const bCrypto = (bMcp.client as HubClient & { crypto?: CryptoAPIv2 }).crypto;

  aDeps = {
    client: aMcp.client,
    inbox: aMcp.inbox,
    subscriber: aMcp.subscriber,
    teamName: TEAM_A,
    crypto: aCrypto,
  };
  bDeps = {
    client: bMcp.client,
    inbox: bMcp.inbox,
    subscriber: bMcp.subscriber,
    teamName: TEAM_B,
    crypto: bCrypto,
  };

  // Start SSE subscribers
  aMcp.subscriber.start();
  bMcp.subscriber.start();
  await waitUntil(() => aMcp.subscriber.connected && bMcp.subscriber.connected, 5000);
}, 20000);

afterAll(async () => {
  // AC7 — clean teardown
  aMcp?.subscriber.stop();
  bMcp?.subscriber.stop();
  await hub?.close?.();
  rmSync(tmpDir, { recursive: true, force: true });
});

// ── AC1 — A → B ────────────────────────────────────────────────────────────────

describe('AC1 — spoke A sends, spoke B receives with correct envelope', () => {
  it('B inbox contains decrypted message with from.team=team-a, to.team=team-b', async () => {
    const beforeCount = bMcp.inbox.messages.length;
    const distinctBody = `e2e-ac1-${randomUUID()}`;

    await SendTool.execute({ to: TEAM_B, body: distinctBody }, aDeps);

    await waitUntil(() => bMcp.inbox.messages.length > beforeCount, 4000);

    const msg = bMcp.inbox.messages[bMcp.inbox.messages.length - 1] as Record<string, unknown>;
    expect(msg['body']).toBe(distinctBody);
    expect((msg['from'] as { team: string }).team).toBe(TEAM_A);
    expect((msg['to'] as { team: string }).team).toBe(TEAM_B);
  }, 10000);
});

// ── AC2 — B → A (bidirectional) ───────────────────────────────────────────────

describe('AC2 — bidirectional: B sends, A receives', () => {
  it('A inbox contains decrypted message from B', async () => {
    const beforeCount = aMcp.inbox.messages.length;
    const distinctBody = `e2e-ac2-${randomUUID()}`;

    await SendTool.execute({ to: TEAM_A, body: distinctBody }, bDeps);

    await waitUntil(() => aMcp.inbox.messages.length > beforeCount, 4000);

    const msg = aMcp.inbox.messages[aMcp.inbox.messages.length - 1] as Record<string, unknown>;
    expect(msg['body']).toBe(distinctBody);
    expect((msg['from'] as { team: string }).team).toBe(TEAM_B);
    expect((msg['to'] as { team: string }).team).toBe(TEAM_A);
  }, 10000);
});

// ── AC3 — hub logs contain no plaintext body ───────────────────────────────────

describe('AC3 — hub logs contain no plaintext (hub is crypto-blind)', () => {
  it('distinctive plaintext does not appear in captured hub log output', async () => {
    // Flush any prior log activity
    await new Promise<void>((r) => setTimeout(r, 50));
    const logsBefore = hubLogChunks.length;

    const distinctPlaintext = `KERCKHOFFS_PLAINTEXT_PROBE_${randomUUID().replace(/-/g, '')}`;
    const beforeCount = bMcp.inbox.messages.length;

    await SendTool.execute({ to: TEAM_B, body: distinctPlaintext }, aDeps);

    // Wait for hub to process (message arrives at B)
    await waitUntil(() => bMcp.inbox.messages.length > beforeCount, 4000);
    // Small pause to let any async log flushes complete
    await new Promise<void>((r) => setTimeout(r, 100));

    const newLogs = hubLogChunks.slice(logsBefore).join('');
    expect(newLogs.length).toBeGreaterThan(0); // sanity: hub logged something
    expect(newLogs).not.toContain(distinctPlaintext);
  }, 10000);
});

// ── AC4 — offline queue ────────────────────────────────────────────────────────

describe('AC4 — offline queue: message delivered after B reconnects', () => {
  it('queued message arrives in B inbox when subscriber restarts', async () => {
    // Stop B's subscriber — B goes offline
    bMcp.subscriber.stop();
    await waitUntil(() => !bMcp.subscriber.connected, 2000);

    const beforeCount = bMcp.inbox.messages.length;
    const queuedBody = `e2e-ac4-queued-${randomUUID()}`;

    // A sends while B is offline — should queue
    const sendResult = await SendTool.execute({ to: TEAM_B, body: queuedBody }, aDeps);
    const parsed = JSON.parse(
      (sendResult as { content: [{ type: 'text'; text: string }] }).content[0].text,
    ) as { ok: boolean; queued?: boolean };
    expect(parsed.ok).toBe(true);
    expect(parsed.queued).toBe(true);

    // Restart B's subscriber — hub drains queue on connect
    bMcp.subscriber.start();
    await waitUntil(() => bMcp.subscriber.connected, 4000);

    // Wait for queued message to arrive
    await waitUntil(() => bMcp.inbox.messages.length > beforeCount, 4000);

    const msg = bMcp.inbox.messages[bMcp.inbox.messages.length - 1] as Record<string, unknown>;
    expect(msg['body']).toBe(queuedBody);
  }, 15000);
});

// ── AC5 — forged signature rejected at hub ─────────────────────────────────────

describe('AC5 — forged Ed25519 signature rejected at hub with HTTP 403', () => {
  it('message signed with wrong key returns 403 from hub', async () => {
    // Generate a random Ed25519 key NOT registered with the hub
    const wrongSign = generateKeyPairSync('ed25519', {
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });

    const msgId = `forged-${randomUUID()}`;
    // Body can be anything — use a simple plaintext for the forged attempt
    const encBody = JSON.stringify({
      iv: 'AAAAAAAAAAAAAAAA',
      ciphertext: 'FAKE',
      tag: 'FAKE',
      sender_team: TEAM_A,
      version: 2,
    });
    const bodyHash = computeBodyHash(encBody);

    // Build canonical sign input the same way crypto-v2.ts does
    const signData = {
      version: '1',
      id: msgId,
      timestamp: new Date().toISOString(),
      from: { team: TEAM_A, agent: 'mcp' },
      to: { team: TEAM_B, agent: 'mcp' },
      type: 'query',
      priority: 'normal',
      reply_to: null,
      body_hash: bodyHash,
    };
    const signInput = Buffer.from(JSON.stringify(signData), 'utf-8');
    const forgedSig = cryptoSign(null, signInput, wrongSign.privateKey).toString('base64');

    const forgedMsg = {
      version: '1',
      id: msgId,
      timestamp: signData.timestamp,
      from: signData.from,
      to: signData.to,
      type: signData.type,
      priority: signData.priority,
      reply_to: signData.reply_to,
      body: encBody,
      body_hash: bodyHash,
      signature: forgedSig,
    };

    // POST using team-a's valid TLS cert — the signature itself is forged
    const result = await httpsPost(hubPort, caCrt, teamACert, forgedMsg);
    expect(result.status).toBe(403);
    expect(JSON.parse(result.body)).toMatchObject({ error: expect.stringContaining('signature') });
  }, 10000);
});
