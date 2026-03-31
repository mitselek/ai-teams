# Hub Onboarding Runbook — Adding a New Team to the Comms Relay

Operator guide for onboarding a team to the inter-team comms hub. After completing these steps, the new team can send and receive messages through the hub relay.

(*FR:Brunel*)

## Prerequisites

- The hub (`start-hub.ts`) is running inside the comms-dev container on PROD-LLM
- You have SSH access to the hub container (PROD-LLM host, then `docker exec`)
- The new team has a running container (or local workstation) with network access to the hub

## Architecture Overview

```
┌──────────────┐     mTLS      ┌──────────────┐     mTLS      ┌──────────────┐
│  Team Daemon │◄────────────►│   Hub (relay) │◄────────────►│ Team Daemon  │
│  port 844X   │               │   port 8443   │               │  port 844Y   │
│  role: team  │               │   role: hub   │               │  role: team  │
└──────────────┘               └──────────────┘               └──────────────┘
```

Each team daemon connects outbound to the hub. The hub forwards messages between teams. mTLS ensures both sides verify identity via self-signed ECDSA P-256 certificates.

**Key concept:** Team daemons connect TO the hub (outbound). The hub does NOT need to connect outbound to teams — it pushes messages back on the same inbound connection. This means firewalled teams only need to reach port 8443 on the hub host.

## Step-by-step: Onboard Team `<NEW_TEAM>`

### Step 1: Generate keys for the new team

On the machine where you have `openssl` (hub container, host, or local workstation):

```bash
# Create key directory
mkdir -p /tmp/<new-team>-keys/peers

# Generate ECDSA P-256 key pair + self-signed cert (1 year)
# GOTCHA: On Git Bash (Windows), use //CN= (double slash) to prevent path expansion
openssl ecparam -genkey -name prime256v1 -noout -out /tmp/<new-team>-keys/daemon.key
openssl req -new -x509 -key /tmp/<new-team>-keys/daemon.key \
  -out /tmp/<new-team>-keys/daemon.crt \
  -days 365 -subj "/CN=<new-team>"
```

### Step 2: Exchange certificates

**mTLS requires both sides to have each other's cert.** Two exchanges needed:

#### 2a. Give new team the hub's cert

Copy the hub's cert to the new team's peers directory:

```bash
# From hub container:
sudo docker exec comms-dev cat /tmp/hub-keys/daemon.crt > /tmp/<new-team>-keys/peers/relay.crt

# Or if keys are on the host, SCP/docker cp as needed
```

The file MUST be named `relay.crt` (matching the hub's CN = `relay`).

#### 2b. Give hub the new team's cert

Copy the new team's cert into the hub's peers directory:

```bash
# Into hub container:
sudo docker cp /tmp/<new-team>-keys/daemon.crt comms-dev:/tmp/hub-keys/peers/<new-team>.crt
```

The file MUST be named `<new-team>.crt` (matching the team daemon's CN).

**GOTCHA:** The hub needs each peer's cert in its `peers/` dir to accept inbound mTLS connections. Without it, the TLS handshake fails.

### Step 3: Create the ACL file

The new team's daemon needs an ACL that specifies which agents can send/receive and to/from which teams:

```bash
cat > /tmp/<new-team>-keys/acl.json << 'EOF'
{
  "version": 1,
  "agents": {
    "team-lead": {
      "allowed_to": ["*@comms-dev", "*@relay"],
      "allowed_from": ["*@comms-dev", "*@relay"]
    }
  },
  "default": "deny"
}
EOF
```

Rules:
- `default: "deny"` — ACL is always default-deny
- `*@*` wildcards do NOT work — use team-scoped patterns: `*@comms-dev`
- Add entries for each agent name that will send/receive messages
- Include `*@relay` to allow hub-relayed traffic

### Step 4: Write the team daemon startup script

Create `start-team-<new-team>.ts` in the `comms-dev/` directory (or in the team's own container):

```typescript
import { DaemonV2 } from "./src/broker/daemon-v2.js";

const d = new DaemonV2({
  teamName: "<new-team>",
  role: "team" as const,
  keysDir: "/tmp/<new-team>-keys",
  inboxDir: "/tmp/<new-team>-inbox",
  listenPort: 844X,         // unique port, not used by another daemon
  listenHost: "0.0.0.0",    // or "127.0.0.1" for local-only
  defaultPeer: "relay",     // route unknown destinations through hub
  hubPeers: ["relay"],      // accept forwarded messages from hub
  peers: {
    "relay": { host: "127.0.0.1", port: 8443 },  // adjust if hub is remote
  },
});

d.start().then(() => console.log(`[<NEW-TEAM>] Listening on port 844X`));
process.on("SIGTERM", () => d.stop().then(() => process.exit(0)));
process.on("SIGINT", () => d.stop().then(() => process.exit(0)));
```

Key options:
- `hubPeers: ["relay"]` — REQUIRED. Without this, the daemon rejects forwarded messages from the hub (the `from.team` won't match the TLS cert CN, which is `relay`)
- `defaultPeer: "relay"` — routes messages to unknown teams via the hub instead of failing

### Step 5: Register the new team in the hub's peer config

Edit `start-hub.ts` to add the new team's peer entry:

```typescript
// In the hub's peers config, add:
peers: {
  "comms-dev": { host: "127.0.0.1", port: 8444 },
  "bt-triage": { host: "127.0.0.1", port: 8445 },
  "<new-team>": { host: "127.0.0.1", port: 844X },  // add this line
},
```

**NOTE:** If the new team connects inbound only (e.g., behind a firewall, via SSH tunnel), the hub does NOT need a peer entry for that team. The hub can forward messages to any team that has an active inbound connection. Only add a peer entry if the hub should also initiate outbound connections to the team.

### Step 6: Start the daemon

```bash
cd ~/workspace/ai-teams/comms-dev
npx tsx start-team-<new-team>.ts > /tmp/<new-team>-daemon.log 2>&1 &
```

Check the log:
```bash
cat /tmp/<new-team>-daemon.log
# Should show: [<NEW-TEAM>] Listening on port 844X
```

### Step 7: Restart the hub (if peer config changed)

If you added the new team to the hub's `start-hub.ts` peers config:

```bash
# Kill existing hub
pkill -f 'start-hub.ts'

# Restart
cd ~/workspace/ai-teams/comms-dev
npx tsx start-hub.ts > /tmp/hub.log 2>&1 &

# Verify
cat /tmp/hub.log
```

If the new team is inbound-only, no hub restart is needed — just ensure the hub has the team's cert in `peers/`.

### Step 8: Verify with a test message

From the new team, send a test message to comms-dev:

```typescript
// send-test.ts — adjust keysDir and port
import * as tls from "node:tls";
import * as fs from "node:fs";
import * as crypto from "node:crypto";

const keysDir = "/tmp/<new-team>-keys";
const msg = JSON.stringify({
  version: "1",
  id: "msg-" + crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  from: { team: "<new-team>", agent: "team-lead", prefix: "XX" },
  to: { team: "comms-dev", agent: "marconi" },
  type: "query",
  priority: "normal",
  reply_to: null,
  body: "Onboarding test from <new-team>. If you see this, the hub relay works.",
  checksum: "sha256:test"
});

const payload = Buffer.from(msg, "utf-8");
const frame = Buffer.alloc(4 + payload.length);
frame.writeUInt32BE(payload.length, 0);
payload.copy(frame, 4);

const sock = tls.connect({
  host: "127.0.0.1",
  port: 8443,
  key: fs.readFileSync(`${keysDir}/daemon.key`),
  cert: fs.readFileSync(`${keysDir}/daemon.crt`),
  ca: fs.readFileSync(`${keysDir}/peers/relay.crt`),
  rejectUnauthorized: true,
  servername: "relay"
}, () => {
  console.log("Connected, sending...");
  sock.write(frame);
  setTimeout(() => sock.end(), 2000);
});

sock.on("data", (d) => {
  const len = d.readUInt32BE(0);
  const ack = JSON.parse(d.subarray(4, 4 + len).toString());
  console.log("ACK:", ack.type, "reply_to:", ack.reply_to);
});
sock.on("error", (e) => console.error("Error:", e.message));
```

Then check:
```bash
# On comms-dev container
ls /tmp/cd-inbox/
cat /tmp/cd-inbox/msg-*.json | jq '.from.team'
```

## Special Case: Firewalled Teams (SSH Tunnel)

If the new team cannot reach PROD-LLM port 8443 directly (e.g., Windows workstation, different network segment):

1. Establish an SSH tunnel from the team's machine to PROD-LLM:
   ```bash
   ssh -i ~/.ssh/id_ed25519_apex -L 8443:localhost:8443 -N michelek@10.100.136.162
   ```
2. In the team daemon, set the relay peer to `127.0.0.1:8443` (the local tunnel endpoint)
3. The hub sees this as an inbound connection — no hub-side config change needed (just cert exchange)

This is how `framework-research` connects from the local Windows workstation.

## Current Fleet (reference)

| Daemon | Port | Role | Location | Keys dir |
|---|---|---|---|---|
| relay (hub) | 8443 | hub | comms-dev container | `/tmp/hub-keys` |
| comms-dev | 8444 | team | comms-dev container | `/tmp/cd-keys` |
| bt-triage | 8445 | team | backlog-triage container | `/tmp/bt-keys` |
| framework-research | 8446 | team | Local Windows (SSH tunnel) | `$TEMP/comms-hub/fr-keys` |

## Checklist

- [ ] Keys generated (ECDSA P-256, CN = team name)
- [ ] Hub has new team's cert in `/tmp/hub-keys/peers/<team>.crt`
- [ ] New team has hub cert in `<keys>/peers/relay.crt`
- [ ] ACL file created with default deny + team-scoped rules
- [ ] Daemon startup script written with `hubPeers: ["relay"]` and `defaultPeer: "relay"`
- [ ] Daemon started and log shows listening
- [ ] Hub restarted (if peer config changed) or cert exchanged (if inbound-only)
- [ ] Test message sent and received in target inbox
- [ ] Existing teams' ACLs updated to allow the new team (if they need to receive from it)

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| TLS handshake fails | Missing peer cert | Add cert to `peers/` dir on the rejecting side |
| `ACL_DENIED` | Agent not in ACL | Add agent entry to `acl.json` |
| Message sent but not delivered | Hub doesn't know the target team | Check hub has target's cert OR target has active inbound connection |
| `PEER_UNAVAILABLE` | Target daemon not running or not connected | Start daemon, check logs |
| `REMOTE_ACL_DENIED` | Target team's ACL blocks sender | Update target's `acl.json` to allow `*@<sender-team>` |
| Windows openssl `/CN=` becomes a path | Git Bash path expansion | Use `//CN=<name>` (double slash) |
