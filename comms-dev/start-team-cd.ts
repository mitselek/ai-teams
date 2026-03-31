import { DaemonV2 } from "./src/broker/daemon-v2.js";
const d = new DaemonV2({
  teamName: "comms-dev",
  role: "team" as const,
  keysDir: "/tmp/cd-keys",
  inboxDir: "/tmp/cd-inbox",
  listenPort: 8444,
  listenHost: "0.0.0.0",
  defaultPeer: "relay",
  hubPeers: ["relay"],
  peers: {
    "relay": { host: "127.0.0.1", port: 8443 },
  },
});
d.start().then(() => console.log("[COMMS-DEV] Listening on port 8444"));
process.on("SIGTERM", () => d.stop().then(() => process.exit(0)));
