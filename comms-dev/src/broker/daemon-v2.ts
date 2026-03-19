// (*CD:Babbage*)
// DaemonV2 — wires TlsServer, TunnelManager, AclManager, MessageStore, and
// InboxDelivery together into the cross-team messaging daemon.
// Spec: #16 §5–§7, #18 Phase 3

import { join } from 'node:path';
import { writeFileSync, unlinkSync, renameSync, mkdirSync } from 'node:fs';
import { loadDaemonCrypto } from '../crypto/tls-config.js';
import { createAclManager } from '../crypto/acl.js';
import { TlsServer } from '../transport/tls-server.js';
import { TunnelManager } from '../transport/tunnel-manager.js';
import { MessageStore } from './message-store.js';
import type { AclManager } from '../crypto/acl.js';
import type { Message } from '../types.js';

export interface DaemonV2Options {
  teamName: string;
  keysDir: string;         // contains daemon.key, daemon.crt, peers/*.crt, acl.json
  inboxDir: string;        // direct path to inbox directory (files land here as <id>.json)
  listenPort: number;      // 0 for OS-assigned
  peers?: Record<string, { host: string; port: number }>;
  reconnectBaseMs?: number;
  heartbeatIntervalMs?: number;
  deadConnectionMs?: number;
}

export class DaemonV2 {
  private readonly opts: DaemonV2Options;
  private tlsServer: TlsServer | null = null;
  private tunnelManager: TunnelManager | null = null;
  private aclManager: AclManager | null = null;
  private messageStore: MessageStore | null = null;
  private ready = false;
  private connectedPeerSet = new Set<string>();

  constructor(opts: DaemonV2Options) {
    this.opts = opts;
  }

  async start(): Promise<void> {
    const { teamName, keysDir, inboxDir, listenPort } = this.opts;

    // Load crypto (throws if keys missing or invalid)
    const config = await loadDaemonCrypto({
      keyPath:  join(keysDir, 'daemon.key'),
      certPath: join(keysDir, 'daemon.crt'),
      peersDir: join(keysDir, 'peers'),
    });

    // Load ACL (throws if acl.json missing or malformed)
    this.aclManager = createAclManager(join(keysDir, 'acl.json'));

    // Ensure inbox dir exists
    mkdirSync(inboxDir, { recursive: true });

    // Set up dedup store
    this.messageStore = new MessageStore();
    this.messageStore.start();

    // Set up TLS server
    this.tlsServer = new TlsServer({ config, teamName });
    this.tlsServer.onMessage((msg: Message) => this.handleInbound(msg));

    await this.tlsServer.start(listenPort);

    // Set up tunnel manager
    this.tunnelManager = new TunnelManager({
      config,
      teamName,
      reconnectBaseMs:     this.opts.reconnectBaseMs,
      heartbeatIntervalMs: this.opts.heartbeatIntervalMs,
      deadConnectionMs:    this.opts.deadConnectionMs,
    });

    this.tunnelManager.onTunnelDown((team: string) => {
      this.connectedPeerSet.delete(team);
      console.log(`[daemon] tunnel disconnected: ${team}`);
    });

    this.tunnelManager.onTunnelUp((team: string) => {
      this.connectedPeerSet.add(team);
      console.log(`[daemon] tunnel connected: ${team}`);
    });

    const peers = this.opts.peers ?? {};
    await this.tunnelManager.start(peers);

    this.ready = true;

    console.log(`[daemon] ${teamName} listening on port ${this.tlsServer.port}`);
  }

  async stop(): Promise<void> {
    this.ready = false;

    if (this.tunnelManager) {
      await this.tunnelManager.stop();
      this.tunnelManager = null;
    }

    if (this.tlsServer) {
      await this.tlsServer.stop();
      this.tlsServer = null;
    }

    if (this.messageStore) {
      this.messageStore.stop();
      this.messageStore = null;
    }

    this.connectedPeerSet.clear();
  }

  isReady(): boolean {
    return this.ready;
  }

  get port(): number {
    return this.tlsServer?.port ?? 0;
  }

  /**
   * Send a message to a remote agent, enforcing local ACL.
   * Returns: OK | ACL_DENIED | REMOTE_ACL_DENIED | PEER_UNAVAILABLE
   */
  async sendMessage(msg: Message): Promise<'OK' | 'ACL_DENIED' | 'REMOTE_ACL_DENIED' | 'PEER_UNAVAILABLE'> {
    if (!this.aclManager || !this.tunnelManager) return 'PEER_UNAVAILABLE';

    // Local ACL check: can from.agent send to to.agent@to.team?
    const localAgent = msg.from.agent;
    const remoteAddress = `${msg.to.agent}@${msg.to.team}`;

    if (!this.aclManager.isAllowed('send', localAgent, remoteAddress)) {
      return 'ACL_DENIED';
    }

    const result = await this.tunnelManager.send(msg.to.team, msg);
    if (result === 'PEER_UNKNOWN' || result === 'PEER_UNAVAILABLE') {
      return 'PEER_UNAVAILABLE';
    }
    return 'OK';
  }

  /**
   * Send a message bypassing local ACL — for testing forgery detection.
   * Returns FORGERY_REJECTED if remote closes connection due to from.team mismatch.
   */
  async sendMessageRaw(msg: Message): Promise<'FORGERY_REJECTED' | 'OK' | 'PEER_UNAVAILABLE'> {
    if (!this.tunnelManager) return 'PEER_UNAVAILABLE';

    const result = await this.tunnelManager.send(msg.to.team, msg);
    if (result === 'PEER_UNKNOWN') return 'PEER_UNAVAILABLE';
    if (result === 'PEER_UNAVAILABLE') return 'FORGERY_REJECTED';
    return 'OK';
  }

  async reloadAcl(): Promise<void> {
    this.aclManager?.reload();
  }

  connectedPeers(): string[] {
    return Array.from(this.connectedPeerSet);
  }

  private handleInbound(msg: Message): void {
    if (!this.messageStore) return;

    // Dedup check
    const isNew = this.messageStore.record(msg);
    if (!isNew) return;

    // Receive-side ACL check: can local agent receive from remote?
    if (this.aclManager) {
      const localAgent = msg.to.agent;
      const remoteAddress = `${msg.from.agent}@${msg.from.team}`;
      if (!this.aclManager.isAllowed('receive', localAgent, remoteAddress)) {
        console.log(`[daemon] ACL denied inbound: ${remoteAddress} → ${localAgent}`);
        return;
      }
    }

    // Deliver to inbox
    const filename = `${msg.id}.json`;
    const destPath = join(this.opts.inboxDir, filename);
    const tmpPath = destPath + '.tmp';
    try {
      writeFileSync(tmpPath, JSON.stringify(msg, null, 2), 'utf8');
      renameSync(tmpPath, destPath);
    } catch (err) {
      console.error(`[daemon] Failed to deliver message ${msg.id}:`, err);
      try { unlinkSync(tmpPath); } catch { /* ignore */ }
    }
  }
}
