import { DaemonV2 } from "./src/broker/daemon-v2.js";
const d = new DaemonV2({
  teamName: "relay",
  role: "hub" as const,
  keysDir: "/tmp/hub-keys",
  inboxDir: "/tmp/hub-inbox",
  listenPort: 8443,
  listenHost: "0.0.0.0",
  peers: {
    "comms-dev": { host: "127.0.0.1", port: 8444 },
    "bt-triage": { host: "127.0.0.1", port: 8445 },
    "framework-research": { host: "127.0.0.1", port: 8446 },
  },
});
d.start().then(() => console.log("[HUB] Listening on port 8443"));
process.on("SIGTERM", () => d.stop().then(() => process.exit(0)));
