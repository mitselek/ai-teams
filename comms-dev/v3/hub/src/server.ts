// (*CD:Babbage*)
// Hub v3 — Fastify REST API + SSE server with mTLS
// story/28: mTLS auth, peer registry, per-peer rate limiting, structured logging
// story/29: POST /api/send, GET /api/subscribe — message routing + offline queue
// story/30: SSE id: field, per-team event buffer, Last-Event-ID replay on reconnect
// story/31: GET /api/online, enhanced /api/status, /api/register admin + dedup

import Fastify, { type FastifyRequest, type FastifyReply } from 'fastify';
import pino from 'pino';
import type { TLSSocket } from 'node:tls';
import { PassThrough } from 'node:stream';
import { verify as cryptoVerify, createHash } from 'node:crypto';
import { stableStringify } from './util/stable-stringify.js';
import { MessageQueue } from './delivery/queue.js';

export interface HubOptions {
  tls: {
    ca: string; // CA cert PEM — verify client certs against this
    cert: string; // Hub's TLS cert PEM
    key: string; // Hub's TLS key PEM
  };
  peers?: Record<string, string>; // teamName → cert PEM
  rateLimit?: { max: number; timeWindow: number }; // per-peer sliding window
  logger?: boolean | { stream: NodeJS.WritableStream }; // Pino options
  signPubKeys?: Record<string, string>; // teamName → Ed25519 PEM public key
  adminTeams?: string[]; // if set, only these CNs may POST /api/register
  queuePath?: string; // SQLite file path; absent = :memory:
  queueCapacity?: number; // max queued messages per team; default 100
  queueTtlMs?: number; // message TTL in ms; default 86_400_000 (24h)
}

/** Extract the CN from the peer TLS certificate, or null if absent. */
function getPeerCN(socket: TLSSocket): string | null {
  const cert = socket.getPeerCertificate?.();
  if (!cert?.subject) return null;
  const cn = cert.subject.CN;
  return typeof cn === 'string' && cn.length > 0 ? cn : null;
}

/**
 * Resolve the Fastify logger option.
 * - undefined / true  → default Pino to stdout
 * - false             → logging disabled
 * - { stream }        → Pino writing to supplied stream (tests)
 */
function resolveLogger(
  opt: HubOptions['logger'],
): { logger: boolean } | { loggerInstance: pino.Logger } {
  if (opt === undefined || opt === true) return { logger: true };
  if (opt === false) return { logger: false };
  return { loggerInstance: pino({ level: 'info' }, opt.stream) };
}

const EVENT_BUFFER_SIZE = 100;
const HUB_VERSION = '0.1.0';

interface BufferedEvent {
  sseId: number;
  msg: unknown;
}

type PresenceEntry =
  | { team: string; type: string; status: 'connected'; since: string }
  | { team: string; type: string; status: 'offline'; lastSeen: string };

export function createHub(options: HubOptions) {
  const startTime = Date.now();

  // Mutable peer registry: CN → cert PEM
  const registry = new Map<string, string>();
  if (options.peers) {
    for (const [team, certPem] of Object.entries(options.peers)) {
      registry.set(team, certPem);
    }
  }

  // Per-peer rate limit counters: CN → { count, resetAt }
  // Counter read+write are synchronous (no await between them) so no race
  // in Node.js's single-threaded event loop.
  interface RateSlot {
    count: number;
    resetAt: number;
  }
  const rateCounts = new Map<string, RateSlot>();

  // Message routing state
  const subscriptions = new Map<string, PassThrough[]>(); // teamName → active SSE streams
  const streamSockets = new WeakMap<PassThrough, TLSSocket>(); // stream → backing TLS socket
  const seenIds = new Set<string>(); // dedup by message ID
  // SQLite-backed offline queue (falls back to :memory: when queuePath is absent)
  const queue = new MessageQueue(options.queuePath, options.queueCapacity, options.queueTtlMs);

  // SSE event id: monotonic counters and ring-buffer for Last-Event-ID replay
  const sseCounters = new Map<string, number>(); // teamName → last assigned SSE id
  const eventBuffer = new Map<string, BufferedEvent[]>(); // teamName → last N live-delivered events

  // Presence tracking for GET /api/online
  const presence = new Map<string, PresenceEntry>();

  /** Assign the next SSE id for a team (1-based, monotonically increasing). */
  function nextSseId(team: string): number {
    const id = (sseCounters.get(team) ?? 0) + 1;
    sseCounters.set(team, id);
    return id;
  }

  /** Record a live-delivered event in the ring buffer (trim to EVENT_BUFFER_SIZE). */
  function bufferEvent(team: string, sseId: number, msg: unknown): void {
    const buf = eventBuffer.get(team) ?? [];
    buf.push({ sseId, msg });
    if (buf.length > EVENT_BUFFER_SIZE) buf.shift();
    eventBuffer.set(team, buf);
  }

  /** Write a single SSE event to a stream with id: and data: lines. */
  function writeEvent(stream: PassThrough, sseId: number, msg: unknown): void {
    stream.write(`id: ${sseId}\ndata: ${JSON.stringify(msg)}\n\n`);
  }

  /** Returns true only when all required envelope fields are present. */
  function isValidEnvelope(msg: Record<string, unknown>): boolean {
    return !!(msg?.to && msg?.id && msg?.body && msg?.version && msg?.from && msg?.timestamp);
  }

  /**
   * Returns true if body_hash is absent (no check needed) or matches sha256(body).
   * Hub can verify integrity over the encrypted body without any E2E keys.
   */
  function bodyHashOk(msg: Record<string, unknown>): boolean {
    if (!msg.body_hash) return true;
    const expected =
      'sha256:' +
      createHash('sha256')
        .update(msg.body as string, 'utf-8')
        .digest('hex');
    return msg.body_hash === expected;
  }

  /** Returns true if the stream and its backing socket are both alive. */
  function isLiveStream(s: PassThrough): boolean {
    if (s.destroyed) return false;
    const sock = streamSockets.get(s);
    return !sock || !sock.destroyed;
  }

  /**
   * Verify an Ed25519 signature on an inbound message.
   * Returns null on success, or an error string if verification fails.
   * Only called when signPubKeys is configured and the message carries sig + body_hash.
   */
  function verifySignature(msg: Record<string, unknown>, fromTeam: string): string | null {
    const pubKeyPem = options.signPubKeys![fromTeam];
    const signData = {
      version: msg.version,
      id: msg.id,
      timestamp: msg.timestamp,
      from: msg.from,
      to: msg.to,
      type: msg.type,
      priority: msg.priority,
      reply_to: msg.reply_to,
      body_hash: msg.body_hash,
    };
    const signInput = Buffer.from(stableStringify(signData), 'utf-8');
    try {
      const valid = cryptoVerify(
        null,
        signInput,
        pubKeyPem,
        Buffer.from(msg.signature as string, 'base64'),
      );
      return valid ? null : 'Invalid signature';
    } catch {
      return 'Signature verification failed';
    }
  }

  const hub = Fastify({
    https: {
      requestCert: true,
      rejectUnauthorized: true,
      ca: options.tls.ca,
      cert: options.tls.cert,
      key: options.tls.key,
    },
    ...resolveLogger(options.logger),
  });

  // Combined auth + rate-limit hook — single onRequest to avoid plugin ordering issues
  hub.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const cn = getPeerCN(request.raw.socket as TLSSocket);

    // 403 for missing or unregistered cert
    if (!cn || !registry.has(cn)) {
      await reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    // Per-peer sliding window rate limit
    if (options.rateLimit) {
      const { max, timeWindow } = options.rateLimit;
      const now = Date.now();
      const slot = rateCounts.get(cn);
      if (!slot || now >= slot.resetAt) {
        rateCounts.set(cn, { count: 1, resetAt: now + timeWindow });
      } else {
        slot.count++;
        if (slot.count > max) {
          await reply.code(429).send({ error: 'Too Many Requests' });
          return;
        }
      }
    }

    request.log.info({ peerTeam: cn }, 'authenticated request');
  });

  // Graceful shutdown: end all active SSE streams so clients get a clean FIN, not ECONNRESET
  hub.addHook('onClose', async () => {
    for (const streams of subscriptions.values()) {
      for (const s of streams) s.end();
    }
    subscriptions.clear();
    queue.close(); // flush WAL and close SQLite connection
  });

  // GET /api/status — hub metrics + peerTeam for authenticated caller
  hub.get('/api/status', async (request: FastifyRequest) => {
    const peerTeam = getPeerCN(request.raw.socket as TLSSocket)!;
    const uptime = (Date.now() - startTime) / 1000;
    const queueDepth = queue.depth();
    return { uptime, version: HUB_VERSION, peerCount: registry.size, queueDepth, peerTeam };
  });

  // GET /api/online — list teams that have ever had an SSE subscription
  hub.get('/api/online', async () => {
    return Array.from(presence.values());
  });

  // POST /api/register — add a new peer cert at runtime (hot-reload, no restart)
  hub.post('/api/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const cn = getPeerCN(request.raw.socket as TLSSocket)!;
    const body = request.body as { team?: string; cert?: string };

    if (!body?.team || !body?.cert) {
      return reply.code(400).send({ error: 'Missing team or cert' });
    }

    // Admin check: if adminTeams is configured, only listed CNs may register
    if (options.adminTeams && !options.adminTeams.includes(cn)) {
      return reply.code(403).send({ error: 'Forbidden: not an admin team' });
    }

    // Duplicate check: reject attempts to overwrite an existing registration
    if (registry.has(body.team)) {
      return reply.code(409).send({ error: 'Team already registered' });
    }

    registry.set(body.team, body.cert);
    return reply.code(201).send({ registered: body.team });
  });

  // GET /api/subscribe — SSE endpoint; client receives messages addressed to their team.
  // Supports Last-Event-ID replay: on reconnect, buffered events missed since lastId are
  // replayed before the stream goes live. Offline-queued messages are also drained.
  hub.get('/api/subscribe', async (request: FastifyRequest, reply: FastifyReply) => {
    const cn = getPeerCN(request.raw.socket as TLSSocket)!;
    const stream = new PassThrough();

    // Register this subscriber (and map stream → TLS socket for dead-socket detection)
    streamSockets.set(stream, request.raw.socket as TLSSocket);
    const existing = subscriptions.get(cn) ?? [];
    existing.push(stream);
    subscriptions.set(cn, existing);

    // Track presence: this team is now connected
    presence.set(cn, {
      team: cn,
      type: 'sse',
      status: 'connected',
      since: new Date().toISOString(),
    });

    // Swallow stream errors (ECONNRESET when client abruptly disconnects)
    stream.on('error', () => {});

    // Clean up on client disconnect
    request.raw.on('close', () => {
      const subs = subscriptions.get(cn);
      if (subs) {
        const idx = subs.indexOf(stream);
        if (idx !== -1) subs.splice(idx, 1);
        // Mark offline only when the last subscriber for this team disconnects
        if (subs.length === 0) {
          subscriptions.delete(cn);
          presence.set(cn, {
            team: cn,
            type: 'sse',
            status: 'offline',
            lastSeen: new Date().toISOString(),
          });
        }
      }
      stream.destroy();
    });

    // Last-Event-ID replay: re-send buffered live events the client missed
    const lastEventIdRaw = request.headers['last-event-id'];
    if (lastEventIdRaw) {
      const lastSeen = parseInt(lastEventIdRaw as string, 10);
      if (!isNaN(lastSeen)) {
        const buf = eventBuffer.get(cn) ?? [];
        for (const { sseId, msg } of buf) {
          if (sseId > lastSeen) writeEvent(stream, sseId, msg);
        }
      }
    }

    // Drain offline queue — TTL cleanup runs inside drain() before delivery
    for (const msg of queue.drain(cn)) {
      const sseId = nextSseId(cn);
      bufferEvent(cn, sseId, msg);
      writeEvent(stream, sseId, msg);
    }

    reply
      .header('Content-Type', 'text/event-stream')
      .header('Cache-Control', 'no-cache')
      .header('Connection', 'keep-alive');

    // SSE keep-alive comment: flushes HTTP headers to the client immediately so
    // connection establishment is detectable without TLS-layer workarounds.
    stream.write(':\n\n');

    return reply.send(stream);
  });

  // POST /api/send — route message to active subscriber or offline queue
  hub.post('/api/send', async (request: FastifyRequest, reply: FastifyReply) => {
    const msg = request.body as Record<string, unknown>;

    // Validate required fields
    if (!isValidEnvelope(msg)) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    const msgId = msg.id as string;

    // Dedup: reject messages with a previously seen ID
    if (seenIds.has(msgId)) {
      return reply.code(409).send({ error: 'Duplicate message ID' });
    }

    const fromTeam = (msg.from as { team: string }).team;

    // CN ↔ from.team binding: TLS identity must match the claimed sender.
    // Belt-and-suspenders — Ed25519 sig also catches this, but the transport check is free
    // and catches spoofing attempts from peers that haven't registered a signing key.
    const senderCN = getPeerCN(request.raw.socket as TLSSocket)!;
    if (fromTeam !== senderCN) {
      return reply.code(403).send({ error: 'Sender team does not match TLS identity' });
    }

    // body_hash integrity: hub verifies hash over the (possibly encrypted) body without decrypting.
    if (!bodyHashOk(msg)) {
      return reply.code(400).send({ error: 'body_hash mismatch' });
    }

    // Ed25519 signature verification — only when key is configured AND message carries sig + body_hash
    if (options.signPubKeys?.[fromTeam] && msg.signature && msg.body_hash) {
      const sigError = verifySignature(msg, fromTeam);
      if (sigError) return reply.code(403).send({ error: sigError });
    }

    // Mark seen after validation, before routing (at-least-once dedup)
    seenIds.add(msgId);

    // Yield one event-loop turn so pending I/O callbacks (e.g. RST from a just-closed
    // SSE subscriber) run before we inspect subscriptions. Without this, a dead stream
    // whose socket RST hasn't been processed yet would intercept the message and lose it
    // (PassThrough silently buffers the write; client is gone; message never queued).
    await new Promise<void>((resolve) => setImmediate(resolve));

    // Route to active SSE subscriber or queue for offline delivery
    const toTeam = (msg.to as { team: string }).team;
    const rawSubs = subscriptions.get(toTeam) ?? [];

    // Eagerly prune destroyed streams/sockets (isLiveStream checks both stream.destroyed
    // and socket.destroyed — the latter catches the RST race window).
    const liveSubs = rawSubs.filter(isLiveStream);
    if (liveSubs.length === 0) subscriptions.delete(toTeam);
    else if (liveSubs.length < rawSubs.length) subscriptions.set(toTeam, liveSubs);

    if (liveSubs.length > 0) {
      // Live delivery: assign SSE id, buffer for Last-Event-ID replay, fan-out
      const sseId = nextSseId(toTeam);
      bufferEvent(toTeam, sseId, msg);
      for (const sub of liveSubs) {
        writeEvent(sub, sseId, msg);
      }
      return { ok: true, id: msgId };
    } else {
      // Offline: store in SQLite queue (SSE id assigned when drained on subscribe)
      queue.push(toTeam, msg);
      return { ok: true, id: msgId, queued: true };
    }
  });

  return hub;
}
