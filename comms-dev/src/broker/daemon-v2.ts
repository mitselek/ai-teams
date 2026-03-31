// (*CD:Babbage*)
// DaemonV2 — wires TlsServer, TunnelManager, AclManager, MessageStore, and
// InboxDelivery together into the cross-team messaging daemon.
// Also exposes a local UDS JSON command socket for agent tools (CrossTeamSend, CLI).
// Spec: #16 §5–§7, #18 Phase 3–4

import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { writeFileSync, unlinkSync, renameSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { createServer as createNetServer, type Server as NetServer, type Socket } from 'node:net';
import { loadDaemonCrypto } from '../crypto/tls-config.js';
import { createAclManager, loadAcl } from '../crypto/acl.js';
import { createCryptoAPIv2, loadKeyBundle } from '../crypto/index.js';
import { TlsServer } from '../transport/tls-server.js';
import { TunnelManager } from '../transport/tunnel-manager.js';
import { MessageStore } from './message-store.js';
import { buildMessage } from './message-builder.js';
import type { AclManager } from '../crypto/acl.js';
import type { CryptoAPIv2, E2EPayload, SignedMessage } from '../crypto/types.js';
import type { Message, MessageType, MessagePriority } from '../types.js';

const DAEMON_VERSION = '1.0.0';

export interface DaemonV2Options {
  teamName: string;
  keysDir: string;         // contains daemon.key, daemon.crt, peers/*.crt, acl.json
  inboxDir: string;        // direct path to inbox directory (files land here as <id>.json)
  listenPort: number;      // 0 for OS-assigned
  listenHost?: string;     // bind address; defaults to '0.0.0.0' for cross-container reachability
  socketDir?: string;      // UDS socket directory; if set, daemon listens on <socketDir>/<teamName>.sock
  peers?: Record<string, { host: string; port: number }>;
  reconnectBaseMs?: number;
  heartbeatIntervalMs?: number;
  deadConnectionMs?: number;
  maxQueueSize?: number;
  /**
   * 'hub': forward messages addressed to other teams; no local ACL enforcement.
   * 'team' (default): deliver to local inbox, enforce ACL.
   */
  role?: 'team' | 'hub';
  /**
   * Cert CNs of hub peers (e.g. ["comms-hub"]). Passed to TlsServer to skip
   * from.team === peerCertCN for hub-relayed messages.
   * Ed25519 signature verification added when createCryptoAPIv2 is available.
   */
  hubPeers?: string[];
  /** v2 E2E crypto: path to comms-key-bundle.json (all teams' public keys) */
  keyBundlePath?: string;
  /** v2 E2E crypto: path to this team's Ed25519 signing private key (PEM) */
  signKeyPath?: string;
  /** v2 E2E crypto: path to this team's X25519 encryption private key (PEM) */
  encKeyPath?: string;
  /**
   * Default hub peer name for routing messages to teams not in the direct peers map.
   * When set, sendMessage(msg) for unknown destinations routes via this peer (the relay).
   * Example: 'relay' — cd sends to fr via relay without a direct fr→cd cert pin.
   */
  defaultPeer?: string;
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
  private cryptoV2: CryptoAPIv2 | null = null;
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

    // Hub mode skips ACL — it forwards based on routing metadata only.
    // Team mode loads ACL (throws if acl.json missing or malformed).
    if (this.opts.role !== 'hub') {
      this.aclPath = join(keysDir, 'acl.json');
      this.aclManager = createAclManager(this.aclPath);
    }

    // v2 E2E crypto: load key bundle and private keys if all three paths provided.
    // When absent, daemon operates in v1 mode (no E2E encryption, no message signing).
    if (this.opts.keyBundlePath && this.opts.signKeyPath && this.opts.encKeyPath) {
      const keyBundle = loadKeyBundle(this.opts.keyBundlePath);
      this.cryptoV2 = createCryptoAPIv2({
        teamName,
        signKey: readFileSync(this.opts.signKeyPath),
        encKey:  readFileSync(this.opts.encKeyPath),
        keyBundle,
      });
      console.log(`[daemon] v2 E2E crypto loaded (key bundle v${keyBundle.version})`);
    }

    // Ensure inbox dir exists
    mkdirSync(inboxDir, { recursive: true });

    // Set up dedup store
    this.messageStore = new MessageStore();
    this.messageStore.start();

    // Set up TLS server
    this.tlsServer = new TlsServer({
      config,
      teamName,
      hubPeers: this.opts.hubPeers,
    });
    this.tlsServer.onMessage((msg: Message) => this.handleInbound(msg));

    // Hub mode: when a peer authenticates an inbound connection, register
    // the socket in TunnelManager so forwardMessage() can write back to them.
    if (this.opts.role === 'hub') {
      this.tlsServer.onPeerSocket((peerTeam, socket) => {
        this.tunnelManager?.registerInboundSocket(peerTeam, socket);
      });
    }

    await this.tlsServer.start(listenPort, this.opts.listenHost ?? '0.0.0.0');

    // Set up tunnel manager
    this.tunnelManager = new TunnelManager({
      config,
      teamName,
      reconnectBaseMs:     this.opts.reconnectBaseMs,
      heartbeatIntervalMs: this.opts.heartbeatIntervalMs,
      deadConnectionMs:    this.opts.deadConnectionMs,
      maxQueueSize:        this.opts.maxQueueSize,
      defaultPeer:         this.opts.defaultPeer,
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

    // Messages received on outbound sockets (hub writing back to us) are
    // processed identically to messages received via TlsServer.
    this.tunnelManager.onMessage((msg: Message) => this.handleInbound(msg));

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

    // v2: E2E encrypt body + sign envelope before handing to tunnel
    const outMsg = this.cryptoV2 ? await this.prepareOutbound(msg) : msg;

    const result = await this.tunnelManager.send(outMsg.to.team, outMsg);
    if (result === 'PEER_UNKNOWN' || result === 'PEER_UNAVAILABLE') {
      return 'PEER_UNAVAILABLE';
    }
    return 'OK';
  }

  /**
   * Encrypt body with E2E (X25519+AES-256-GCM) and sign the envelope (Ed25519).
   * Returns a SignedMessage with encrypted body, body_hash, and signature fields.
   * Falls back to the original message if encryption fails (logs error).
   */
  private async prepareOutbound(msg: Message): Promise<Message> {
    if (!this.cryptoV2) return msg;
    try {
      const e2ePayload = await this.cryptoV2.e2eEncrypt(
        Buffer.from(msg.body, 'utf-8'),
        msg.to.team,
        msg.id,
      );
      const encBody = JSON.stringify(e2ePayload);
      const encMsg: Message = { ...msg, body: encBody };
      const bodyHash = 'sha256:' + createHash('sha256').update(encBody, 'utf-8').digest('hex');
      const signature = this.cryptoV2.signEnvelope(encMsg);
      return { ...encMsg, body_hash: bodyHash, signature } as unknown as Message;
    } catch (err) {
      console.error(`[daemon] E2E encrypt failed for msg ${msg.id}:`, err);
      return msg;
    }
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

  private async handleInbound(msg: Message): Promise<void> {
    if (!this.messageStore) return;

    const isNew = this.messageStore.record(msg);
    if (!isNew) return;

    // Hub mode: forward messages addressed to other teams.
    // Hub-local messages (msg.to.team === teamName) fall through to normal delivery.
    if (this.opts.role === 'hub' && msg.to.team !== this.opts.teamName) {
      this.forwardMessage(msg);
      return;
    }

    // v2: verify Ed25519 signature and E2E decrypt body.
    // Drop messages that fail verification — they may be forgeries relayed via hub.
    const possibleSigned = msg as Partial<SignedMessage>;
    if (this.cryptoV2 && possibleSigned.signature) {
      const valid = this.cryptoV2.verifySignature(possibleSigned as SignedMessage);
      if (!valid) {
        console.warn(
          `[daemon] Signature verification failed for msg ${msg.id} from ${msg.from.team}/${msg.from.agent} — dropping`,
        );
        return;
      }
      try {
        const e2ePayload = JSON.parse(msg.body) as E2EPayload;
        const plaintext = await this.cryptoV2.e2eDecrypt(e2ePayload, msg.id);
        msg = { ...msg, body: plaintext.toString('utf-8') };
      } catch (err) {
        console.error(`[daemon] E2E decrypt failed for msg ${msg.id}:`, err);
        return;
      }
    }

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

  // ── Hub forwarding ───────────────────────────────────────────────────────────

  private forwardMessage(msg: Message): void {
    if (!this.tunnelManager) {
      console.error(`[hub] Cannot forward to ${msg.to.team}: tunnel manager not ready`);
      return;
    }

    // Fire-and-forget: ACK to sender already sent by TlsServer on receipt.
    // v1 semantics: hub delivery is best-effort; sender retries on its own schedule.
    // v2 TODO: hold ACK until destination ACKs (async ACK chain).
    this.tunnelManager.send(msg.to.team, msg).then((result) => {
      if (result === 'PEER_UNKNOWN') {
        console.error(`[hub] Forward failed — unknown destination team: ${msg.to.team} (msg ${msg.id})`);
      } else if (result === 'PEER_UNAVAILABLE') {
        console.warn(`[hub] Forward queued/failed — ${msg.to.team} unavailable (msg ${msg.id})`);
      }
    }).catch((err) => {
      console.error(`[hub] Forward error to ${msg.to.team} (msg ${msg.id}):`, err);
    });
  }
}
