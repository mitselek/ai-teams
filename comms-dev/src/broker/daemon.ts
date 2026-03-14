// (*CD:Babbage*)
// Message broker daemon — the main entry point for a team's comms broker.
// Wires together: UDS server, discovery registry, message store, crypto, and routing.
//
// Usage: tsx src/broker/daemon.ts
// Or via: npm run broker
//
// Environment variables:
//   COMMS_TEAM_NAME    — required, e.g. "comms-dev"
//   COMMS_TEAM_PREFIX  — required, e.g. "CD"
//   COMMS_SOCKET_DIR   — default: /shared/comms
//   COMMS_CAPABILITIES — comma-separated list, default: "messaging"
//   COMMS_PSK_FILE     — path to PSK file, default: /run/secrets/comms-psk
//                        If file missing, broker starts in PLAINTEXT mode (dev only)

import fs from 'fs';
import path from 'path';
import { UDSServer } from '../transport/server.js';
import { UDSClient } from '../transport/client.js';
import { RegistryManager } from '../discovery/registry.js';
import { MessageStore } from './message-store.js';
import { InboxDelivery } from './inbox.js';
import { buildMessage } from './message-builder.js';
import { loadPsk, deriveKey, createCryptoAPI, createCryptoProvider } from '../crypto/index.js';
import type { DerivedKeys } from '../crypto/types.js';
import type { Message, BrokerConfig, RegistryEntry, CryptoProvider } from '../types.js';

const PSK_CONTEXT = 'comms-v1';
const DEFAULT_PSK_FILE = '/run/secrets/comms-psk';

// ── Configuration ──────────────────────────────────────────────────────────────

function loadConfig(): BrokerConfig {
  const teamName = requireEnv('COMMS_TEAM_NAME');
  const teamPrefix = requireEnv('COMMS_TEAM_PREFIX');
  const socketDir = process.env['COMMS_SOCKET_DIR'] ?? '/shared/comms';
  const capabilities = (process.env['COMMS_CAPABILITIES'] ?? 'messaging').split(',');
  const pskFile = process.env['COMMS_PSK_FILE'] ?? DEFAULT_PSK_FILE;

  return {
    teamName,
    teamPrefix,
    capabilities,
    socketDir,
    registryPath: path.join(socketDir, 'registry.json'),
    heartbeatInterval: 60_000,
    staleThreshold: 120_000,
    maxMessageSize: 1_048_576,
    pskFile,
  };
}

interface CryptoMaterial {
  provider: CryptoProvider;
  integrityKey: Buffer;
}

function loadCryptoMaterial(pskFile: string): CryptoMaterial | undefined {
  try {
    const pskHex = fs.readFileSync(pskFile, 'utf8');
    const psk = loadPsk(pskHex);
    const keys: DerivedKeys = deriveKey(psk, PSK_CONTEXT);
    const api = createCryptoAPI(keys);
    const provider = createCryptoProvider(api);
    console.log(`[broker] Crypto enabled — PSK loaded from ${pskFile}`);
    return { provider, integrityKey: keys.integrityKey };
  } catch (err) {
    console.warn(
      `[broker] WARNING: PSK file not found or invalid (${pskFile}): ${(err as Error).message}. ` +
      'Starting in PLAINTEXT mode — do not use in production.'
    );
    return undefined;
  }
}

// ── Broker ─────────────────────────────────────────────────────────────────────

class Broker {
  private readonly config: BrokerConfig;
  private readonly socketPath: string;
  private readonly registry: RegistryManager;
  private readonly store: MessageStore;
  private readonly inbox: InboxDelivery;
  private readonly cryptoMaterial: CryptoMaterial | undefined;
  private readonly server: UDSServer;
  private heartbeatTimer?: ReturnType<typeof setInterval>;

  constructor(config: BrokerConfig) {
    this.config = config;
    this.socketPath = path.join(config.socketDir, `${config.teamName}.sock`);
    this.registry = new RegistryManager(config.registryPath);
    this.store = new MessageStore();
    this.inbox = new InboxDelivery(config.teamName);
    this.cryptoMaterial = loadCryptoMaterial(config.pskFile ?? DEFAULT_PSK_FILE);

    this.server = new UDSServer({
      socketPath: this.socketPath,
      maxSize: config.maxMessageSize,
      crypto: this.cryptoMaterial?.provider,
      integrityKey: this.cryptoMaterial?.integrityKey,
      onMessage: (msg) => this.handleIncoming(msg),
      onError: (err) => console.error('[broker] Server error:', err),
    });
  }

  async start(): Promise<void> {
    console.log(`[broker] Starting — team: ${this.config.teamName}`);
    this.store.start();
    await this.server.listen();
    await this.registerSelf();
    this.startHeartbeat();
    this.startStaleCleanup();
    console.log('[broker] Ready');
  }

  async stop(): Promise<void> {
    console.log('[broker] Shutting down…');
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    await this.registry.deregister(this.config.teamName);
    await this.server.close();
    this.store.stop();
    console.log('[broker] Stopped');
  }

  /**
   * Send a message to another team. Resolves when ACK received.
   * Throws UNREACHABLE if delivery fails after 5 minutes of retries.
   */
  async send(message: Message): Promise<void> {
    const registry = this.registry.read();
    const target = registry.teams[message.to.team];
    if (!target) {
      throw new Error(`Team not in registry: ${message.to.team}`);
    }

    const client = new UDSClient(target.socket);
    const attempts = await client.send(message, {
      maxSize: this.config.maxMessageSize,
      crypto: this.cryptoMaterial?.provider,
    });
    console.log(`[broker] Delivered msg:${message.id} to ${message.to.team} after ${attempts} attempt(s)`);
  }

  /**
   * Build and send a new outgoing message.
   * Uses HMAC-SHA256 if crypto material is available.
   */
  async sendNew(opts: {
    to: { team: string; agent: string };
    type: import('../types.js').MessageType;
    body: string;
    priority?: import('../types.js').MessagePriority;
    reply_to?: string;
  }): Promise<void> {
    const msg = buildMessage({
      from: { team: this.config.teamName, agent: 'team-lead', prefix: this.config.teamPrefix },
      to: opts.to,
      type: opts.type,
      body: opts.body,
      priority: opts.priority,
      reply_to: opts.reply_to,
      integrityKey: this.cryptoMaterial?.integrityKey,
    });
    await this.send(msg);
  }

  private async handleIncoming(message: Message): Promise<void> {
    // Dedup: at-least-once — sender retries, we silently swallow duplicates
    const isNew = this.store.record(message);
    if (!isNew) {
      console.log(`[broker] Duplicate message ${message.id} — discarded`);
      return;
    }

    console.log(
      `[broker] Received ${message.type} from ${message.from.team}/${message.from.agent} ` +
      `— id: ${message.id}`
    );

    // Deliver to local agent inbox: write JSON file to ~/.claude/teams/<team>/inboxes/
    await this.inbox.deliver(message);
  }

  private async registerSelf(): Promise<void> {
    const entry: RegistryEntry = {
      socket: this.socketPath,
      prefix: this.config.teamPrefix,
      capabilities: this.config.capabilities,
      registered_at: new Date().toISOString(),
      heartbeat: new Date().toISOString(),
    };
    await this.registry.register(this.config.teamName, entry);
    console.log(`[broker] Registered as ${this.config.teamName}`);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.registry.heartbeat(this.config.teamName);
      } catch (err) {
        console.error('[broker] Heartbeat failed:', err);
      }
    }, this.config.heartbeatInterval);
    this.heartbeatTimer.unref?.();
  }

  private startStaleCleanup(): void {
    const timer = setInterval(async () => {
      try {
        const removed = await this.registry.cleanStale(this.config.staleThreshold);
        if (removed.length > 0) {
          console.log(`[broker] Removed stale registry entries: ${removed.join(', ')}`);
        }
      } catch (err) {
        console.error('[broker] Stale cleanup failed:', err);
      }
    }, this.config.heartbeatInterval);
    timer.unref?.();
  }
}

// ── Entry point ─────────────────────────────────────────────────────────────────

const config = loadConfig();
const broker = new Broker(config);

process.on('SIGTERM', () => broker.stop().then(() => process.exit(0)));
process.on('SIGINT', () => broker.stop().then(() => process.exit(0)));

broker.start().catch((err) => {
  console.error('[broker] Fatal startup error:', err);
  process.exit(1);
});

// ── Utilities ───────────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Required environment variable not set: ${name}`);
  return val;
}
