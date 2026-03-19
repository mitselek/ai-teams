// (*CD:Babbage*)
// DaemonV2 — wires TlsServer, TunnelManager, AclManager, MessageStore, and
// InboxDelivery together into the cross-team messaging daemon.
// Also exposes a local UDS JSON command socket for agent tools (CrossTeamSend, CLI).
// Spec: #16 §5–§7, #18 Phase 3–4

import { join } from 'node:path';
import { writeFileSync, unlinkSync, renameSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { createServer as createNetServer, type Server as NetServer, type Socket } from 'node:net';
import { loadDaemonCrypto } from '../crypto/tls-config.js';
import { createAclManager, loadAcl } from '../crypto/acl.js';
import { TlsServer } from '../transport/tls-server.js';
import { TunnelManager } from '../transport/tunnel-manager.js';
import { MessageStore } from './message-store.js';
import { buildMessage } from './message-builder.js';
import type { AclManager } from '../crypto/acl.js';
import type { Message, MessageType, MessagePriority } from '../types.js';

const DAEMON_VERSION = '1.0.0';

export interface DaemonV2Options {
  teamName: string;
  keysDir: string;         // contains daemon.key, daemon.crt, peers/*.crt, acl.json
  inboxDir: string;        // direct path to inbox directory (files land here as <id>.json)
  listenPort: number;      // 0 for OS-assigned
  socketDir?: string;      // UDS socket directory; if set, daemon listens on <socketDir>/<teamName>.sock
  peers?: Record<string, { host: string; port: number }>;
  reconnectBaseMs?: number;
  heartbeatIntervalMs?: number;
  deadConnectionMs?: number;
  maxQueueSize?: number;
}

// ── Per-peer tracking ─────────────────────────────────────────────────────────

interface PeerInfo {
  host: string;
  port: number;
  status: 'connected' | 'disconnected';
  connected_at: string | null;
}

// ── UDS command protocol ──────────────────────────────────────────────────────

export interface UdsCommand {
  cmd: 'send' | 'status' | 'reload' | 'peers';
  // send fields
  from?: string;
  to?: string;
  body?: string;
  type?: MessageType;
  priority?: MessagePriority;
  reply_to?: string | null;
}

export interface UdsPeerInfo {
  team: string;
  status: 'connected' | 'disconnected';
  host: string;
  port: number;
  connected_at: string | null;
}

export interface UdsResponse {
  ok: boolean;
  // send success
  message_id?: string;
  delivered_at?: string;
  // error
  code?: string;
  message?: string;
  // peers
  peers?: UdsPeerInfo[];
  // status
  status?: string;
  uptime_seconds?: number;
  version?: string;
  team_name?: string;
  port?: number;
  // reload
  success?: boolean;
  reloaded_at?: string;
  acl_agents_count?: number;
}

export class DaemonV2 {
  private readonly opts: DaemonV2Options;
  private tlsServer: TlsServer | null = null;
  private tunnelManager: TunnelManager | null = null;
  private aclManager: AclManager | null = null;
  private messageStore: MessageStore | null = null;
  private udsServer: NetServer | null = null;
  private ready = false;
  private connectedPeerSet = new Set<string>();
  private peerInfoMap = new Map<string, PeerInfo>();
  private startedAt: Date | null = null;
  private aclPath = '';

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
    this.aclPath = join(keysDir, 'acl.json');
    this.aclManager = createAclManager(this.aclPath);

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
      maxQueueSize:        this.opts.maxQueueSize,
    });

    // Initialise per-peer info from configured peers
    const peers = this.opts.peers ?? {};
    for (const [team, endpoint] of Object.entries(peers)) {
      this.peerInfoMap.set(team, {
        host: endpoint.host,
        port: endpoint.port,
        status: 'disconnected',
        connected_at: null,
      });
    }

    this.tunnelManager.onTunnelDown((team: string) => {
      this.connectedPeerSet.delete(team);
      const info = this.peerInfoMap.get(team);
      if (info) {
        info.status = 'disconnected';
        info.connected_at = null;
      }
      console.log(`[daemon] tunnel disconnected: ${team}`);
    });

    this.tunnelManager.onTunnelUp((team: string) => {
      this.connectedPeerSet.add(team);
      const info = this.peerInfoMap.get(team);
      if (info) {
        info.status = 'connected';
        info.connected_at = new Date().toISOString();
      }
      console.log(`[daemon] tunnel connected: ${team}`);
    });

    await this.tunnelManager.start(peers);

    // Start UDS listener if socketDir is configured
    if (this.opts.socketDir) {
      await this.startUdsServer(this.opts.socketDir, teamName);
    }

    this.startedAt = new Date();
    this.ready = true;

    console.log(`[daemon] ${teamName} listening on port ${this.tlsServer.port}`);
  }

  async stop(): Promise<void> {
    this.ready = false;

    if (this.udsServer) {
      await new Promise<void>((resolve) => {
        this.udsServer!.close(() => resolve());
      });
      this.udsServer = null;
    }

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

  // ── UDS server ──────────────────────────────────────────────────────────────

  private async startUdsServer(socketDir: string, teamName: string): Promise<void> {
    mkdirSync(socketDir, { recursive: true });
    const socketPath = join(socketDir, `${teamName}.sock`);

    if (existsSync(socketPath)) {
      unlinkSync(socketPath);
    }

    return new Promise((resolve, reject) => {
      const server = createNetServer((socket) => {
        this.handleUdsConnection(socket);
      });

      server.once('error', reject);

      server.listen(socketPath, () => {
        this.udsServer = server;
        resolve();
      });
    });
  }

  private handleUdsConnection(socket: Socket): void {
    let buf = '';

    socket.setEncoding('utf8');
    socket.on('data', (chunk: string) => {
      buf += chunk;
      const nl = buf.indexOf('\n');
      if (nl !== -1) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        this.handleUdsCommand(socket, line);
      }
    });

    socket.on('error', () => { /* ignore */ });
  }

  private async handleUdsCommand(socket: Socket, line: string): Promise<void> {
    let cmd: UdsCommand;
    try {
      cmd = JSON.parse(line) as UdsCommand;
    } catch {
      this.sendUdsResponse(socket, { ok: false, code: 'PARSE_ERROR', message: 'Invalid JSON' });
      return;
    }

    try {
      switch (cmd.cmd) {
        case 'send': {
          const result = await this.handleUdsSend(cmd);
          this.sendUdsResponse(socket, result);
          break;
        }
        case 'status': {
          const uptimeSeconds = this.startedAt
            ? Math.floor((Date.now() - this.startedAt.getTime()) / 1000)
            : 0;
          this.sendUdsResponse(socket, {
            ok: true,
            status: 'running',
            uptime_seconds: uptimeSeconds,
            version: DAEMON_VERSION,
            team_name: this.opts.teamName,
            port: this.port,
          });
          break;
        }
        case 'reload': {
          await this.reloadAcl();
          const aclAgentsCount = this.countAclAgents();
          this.sendUdsResponse(socket, {
            ok: true,
            success: true,
            reloaded_at: new Date().toISOString(),
            acl_agents_count: aclAgentsCount,
          });
          break;
        }
        case 'peers': {
          const peerList: UdsPeerInfo[] = Array.from(this.peerInfoMap.entries()).map(
            ([team, info]) => ({ team, ...info }),
          );
          this.sendUdsResponse(socket, { ok: true, peers: peerList });
          break;
        }
        default: {
          this.sendUdsResponse(socket, { ok: false, code: 'UNKNOWN_CMD', message: 'Unknown command' });
        }
      }
    } catch (err) {
      this.sendUdsResponse(socket, { ok: false, code: 'INTERNAL', message: (err as Error).message });
    }
  }

  private countAclAgents(): number {
    try {
      const acl = loadAcl(this.aclPath);
      return Object.keys(acl.agents).length;
    } catch {
      return 0;
    }
  }

  private async handleUdsSend(cmd: UdsCommand): Promise<UdsResponse> {
    const { from, to, body, type, priority, reply_to } = cmd;

    if (!from || !to || body === undefined) {
      return { ok: false, code: 'INVALID_PARAMS', message: 'from, to, and body are required' };
    }

    const atIdx = to.indexOf('@');
    if (atIdx === -1) {
      return { ok: false, code: 'INVALID_ADDRESS', message: 'Invalid to address' };
    }
    const toAgent = to.slice(0, atIdx);
    const toTeam = to.slice(atIdx + 1);

    const msg = buildMessage({
      from: { team: this.opts.teamName, agent: from },
      to:   { team: toTeam, agent: toAgent },
      type: type ?? 'query',
      priority: priority ?? 'normal',
      body,
      reply_to: reply_to ?? null,
    });

    const result = await this.sendMessage(msg);

    switch (result) {
      case 'OK':
        return { ok: true, message_id: msg.id, delivered_at: new Date().toISOString() };
      case 'ACL_DENIED':
        return { ok: false, code: 'ACL_DENIED', message: 'Local ACL denied the send' };
      case 'REMOTE_ACL_DENIED':
        return { ok: false, code: 'REMOTE_ACL_DENIED', message: 'Remote ACL denied the receive' };
      case 'PEER_UNAVAILABLE':
        return { ok: false, code: 'PEER_UNAVAILABLE', message: 'Peer daemon is unreachable' };
    }
  }

  private sendUdsResponse(socket: Socket, response: UdsResponse): void {
    if (!socket.destroyed) {
      socket.write(JSON.stringify(response) + '\n');
    }
  }

  // ── Inbound message handler ─────────────────────────────────────────────────

  private handleInbound(msg: Message): void {
    if (!this.messageStore) return;

    const isNew = this.messageStore.record(msg);
    if (!isNew) return;

    if (this.aclManager) {
      const localAgent = msg.to.agent;
      const remoteAddress = `${msg.from.agent}@${msg.from.team}`;
      if (!this.aclManager.isAllowed('receive', localAgent, remoteAddress)) {
        console.log(`[daemon] ACL denied inbound: ${remoteAddress} → ${localAgent}`);
        return;
      }
    }

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
