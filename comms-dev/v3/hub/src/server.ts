// (*CD:Babbage*)
// Hub v3 — Fastify REST API + SSE server with mTLS
// story/28: mTLS auth, peer registry, per-peer rate limiting, structured logging
// story/29: POST /api/send, GET /api/subscribe — message routing + offline queue
// story/30: SSE id: field, per-team event buffer, Last-Event-ID replay on reconnect

import Fastify, { type FastifyRequest, type FastifyReply } from 'fastify';
import pino from 'pino';
import type { TLSSocket } from 'node:tls';
import { PassThrough } from 'node:stream';
import { verify as cryptoVerify } from 'node:crypto';
import { stableStringify } from './util/stable-stringify.js';

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

interface BufferedEvent {
  sseId: number;
  msg: unknown;
}

export function createHub(options: HubOptions) {
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
  const seenIds = new Set<string>(); // dedup by message ID
  const offlineQueue = new Map<string, unknown[]>(); // teamName → queued messages (no active subscriber)

  // SSE event id: monotonic counters and ring-buffer for Last-Event-ID replay
  const sseCounters = new Map<string, number>(); // teamName → last assigned SSE id
  const eventBuffer = new Map<string, BufferedEvent[]>(); // teamName → last N live-delivered events

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
  });

  // GET /api/status — returns { peerTeam } for authenticated peers
  hub.get('/api/status', async (request: FastifyRequest) => {
    const peerTeam = getPeerCN(request.raw.socket as TLSSocket)!;
    return { peerTeam };
  });

  // POST /api/register — add a new peer cert at runtime (hot-reload, no restart)
  hub.post('/api/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { team?: string; cert?: string };
    if (!body?.team || !body?.cert) {
      return reply.code(400).send({ error: 'Missing team or cert' });
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

    // Register this subscriber
    const existing = subscriptions.get(cn) ?? [];
    existing.push(stream);
    subscriptions.set(cn, existing);

    // Swallow stream errors (ECONNRESET when client abruptly disconnects)
    stream.on('error', () => {});

    // Clean up on client disconnect
    request.raw.on('close', () => {
      const subs = subscriptions.get(cn);
      if (subs) {
        const idx = subs.indexOf(stream);
        if (idx !== -1) subs.splice(idx, 1);
        if (subs.length === 0) subscriptions.delete(cn);
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

    // Drain offline queue (messages sent while team had no active subscriber)
    const queued = offlineQueue.get(cn);
    if (queued && queued.length > 0) {
      for (const msg of queued) {
        const sseId = nextSseId(cn);
        bufferEvent(cn, sseId, msg);
        writeEvent(stream, sseId, msg);
      }
      offlineQueue.delete(cn);
    }

    reply
      .header('Content-Type', 'text/event-stream')
      .header('Cache-Control', 'no-cache')
      .header('Connection', 'keep-alive');

    return reply.send(stream);
  });

  // POST /api/send — route message to active subscriber or offline queue
  hub.post('/api/send', async (request: FastifyRequest, reply: FastifyReply) => {
    const msg = request.body as Record<string, unknown>;

    // Validate required fields
    if (!msg?.to || !msg?.id || !msg?.body || !msg?.version || !msg?.from || !msg?.timestamp) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    const msgId = msg.id as string;

    // Dedup: reject messages with a previously seen ID
    if (seenIds.has(msgId)) {
      return reply.code(409).send({ error: 'Duplicate message ID' });
    }

    // Ed25519 signature verification — only when key is configured AND message carries sig + body_hash
    const fromTeam = (msg.from as { team: string }).team;
    if (options.signPubKeys?.[fromTeam] && msg.signature && msg.body_hash) {
      const pubKeyPem = options.signPubKeys[fromTeam];
      // Canonical sign-data mirrors crypto-v2.ts signMessage (fields + body_hash, no body)
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
        if (!valid) {
          return reply.code(403).send({ error: 'Invalid signature' });
        }
      } catch {
        return reply.code(403).send({ error: 'Signature verification failed' });
      }
    }

    // Mark seen after validation, before routing (at-least-once dedup)
    seenIds.add(msgId);

    // Route to active SSE subscriber or queue for offline delivery
    const toTeam = (msg.to as { team: string }).team;
    const subs = subscriptions.get(toTeam);

    if (subs && subs.length > 0) {
      // Live delivery: assign SSE id, buffer for Last-Event-ID replay, fan-out
      const sseId = nextSseId(toTeam);
      bufferEvent(toTeam, sseId, msg);
      for (const sub of subs) {
        writeEvent(sub, sseId, msg);
      }
      return { ok: true, id: msgId };
    } else {
      // Offline: queue without SSE id (assigned when drained on subscribe)
      const queue = offlineQueue.get(toTeam) ?? [];
      queue.push(msg);
      offlineQueue.set(toTeam, queue);
      return { ok: true, id: msgId, queued: true };
    }
  });

  return hub;
}
