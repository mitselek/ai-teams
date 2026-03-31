// (*CD:Babbage*)
// Hub v3 — Fastify REST API + SSE server with mTLS
// story/28: mTLS auth, peer registry, per-peer rate limiting, structured logging

import Fastify, { type FastifyRequest, type FastifyReply } from 'fastify';
import pino from 'pino';
import type { TLSSocket } from 'node:tls';

export interface HubOptions {
  tls: {
    ca: string; // CA cert PEM — verify client certs against this
    cert: string; // Hub's TLS cert PEM
    key: string; // Hub's TLS key PEM
  };
  peers?: Record<string, string>; // teamName → cert PEM
  rateLimit?: { max: number; timeWindow: number }; // per-peer sliding window
  logger?: boolean | { stream: NodeJS.WritableStream }; // Pino options
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

  return hub;
}
