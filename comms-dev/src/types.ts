// (*CD:Babbage*)
// Shared type definitions for the comms-dev inter-team messaging system.
// Based on Protocol 4 spec in topics/03-communication.md

export type MessageType =
  | 'handoff'
  | 'query'
  | 'response'
  | 'broadcast'
  | 'ack'
  | 'heartbeat';

export type MessagePriority = 'blocking' | 'high' | 'normal' | 'low';

export interface MessageEndpoint {
  team: string;
  agent: string;
  prefix?: string;
}

export interface Message {
  version: '1';
  id: string;         // "msg-<uuid>"
  timestamp: string;  // ISO 8601
  from: MessageEndpoint;
  to: MessageEndpoint;
  type: MessageType;
  priority: MessagePriority;
  reply_to: string | null;
  body: string;       // Markdown-formatted
  checksum: string;   // "sha256:<hex>" — computed over all other fields
}

// Message without checksum — used when constructing before signing
export type MessageDraft = Omit<Message, 'checksum'>;

// ACK message body content
export interface AckBody {
  ack_id: string;   // The message ID being acknowledged
  status: 'ok' | 'error';
  error?: string;
}

// Registry entry for a single team
export interface RegistryEntry {
  socket: string;           // Absolute path to the team's UDS socket
  prefix: string;           // Team prefix (e.g. "FR", "CD")
  capabilities: string[];
  registered_at: string;    // ISO 8601
  heartbeat: string;        // ISO 8601 — updated every 60s
}

// Full registry structure
export interface Registry {
  teams: Record<string, RegistryEntry>;
}

// Broker configuration
export interface BrokerConfig {
  teamName: string;
  teamPrefix: string;
  capabilities: string[];
  socketDir: string;    // Directory containing .sock files (e.g. /shared/comms)
  registryPath: string; // Path to registry.json
  heartbeatInterval: number;  // ms, default 60_000
  staleThreshold: number;     // ms, default 120_000
  maxMessageSize: number;     // bytes, default 1_048_576 (1MB)
  pskFile?: string;     // Path to PSK file (default: /run/secrets/comms-psk)
  // Crypto is injected after PSK loading — absent means plaintext mode (dev only)
  crypto?: CryptoProvider;
}

// Interface for Vigenere's crypto module
// AAD (additional authenticated data) binds metadata to ciphertext to prevent
// ciphertext transplant attacks. Recommended AAD: "msg-<id>:<from-team>"
export interface CryptoProvider {
  encrypt(plaintext: Buffer, aad?: string): Promise<Buffer>;
  decrypt(ciphertext: Buffer): Promise<Buffer>;
}

// Delivery result from broker
export interface DeliveryResult {
  messageId: string;
  success: boolean;
  error?: string;
  retries: number;
}
