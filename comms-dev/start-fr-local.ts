// Local framework-research daemon — connects to hub via SSH tunnel
// (*FR:Brunel*)
import { DaemonV2 } from "./src/broker/daemon-v2.js";
import { join } from "node:path";
import { tmpdir } from "node:os";

const base = join(tmpdir(), "comms-hub");

const d = new DaemonV2({
  teamName: "framework-research",
  role: "team" as const,
  keysDir: join(base, "fr-keys"),
  inboxDir: join(base, "fr-inbox"),
  listenPort: 8446,
  listenHost: "127.0.0.1",
  defaultPeer: "relay",
  hubPeers: ["relay"],
  peers: {
    "relay": { host: "127.0.0.1", port: 8443 },  // SSH tunnel to PROD-LLM hub
  },
});

d.start().then(() => console.log("[FR-LOCAL] Listening on port 8446, connected to hub via SSH tunnel"));
process.on("SIGTERM", () => d.stop().then(() => process.exit(0)));
process.on("SIGINT", () => d.stop().then(() => process.exit(0)));
