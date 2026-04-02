// Send test message from framework-research to comms-dev via hub
// (*FR:Brunel*)
import * as tls from "node:tls";
import * as fs from "node:fs";
import * as crypto from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";

const base = join(tmpdir(), "comms-hub");
const keysDir = join(base, "fr-keys");

const key = fs.readFileSync(join(keysDir, "daemon.key"));
const cert = fs.readFileSync(join(keysDir, "daemon.crt"));
const ca = fs.readFileSync(join(keysDir, "peers", "relay.crt"));

const msg = JSON.stringify({
  version: "1",
  id: "msg-" + crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  from: { team: "framework-research", agent: "brunel", prefix: "FR" },
  to: { team: "comms-dev", agent: "marconi" },
  type: "query",
  priority: "normal",
  reply_to: null,
  body: "First message from Windows to PROD-LLM through the hub! framework-research (local) -> relay hub -> comms-dev (container). Sent by Brunel.",
  checksum: "sha256:test"
});

const payload = Buffer.from(msg, "utf-8");
const frame = Buffer.alloc(4 + payload.length);
frame.writeUInt32BE(payload.length, 0);
payload.copy(frame, 4);

const sock = tls.connect({
  host: "127.0.0.1",
  port: 8443,  // SSH tunnel to PROD-LLM hub
  key, cert, ca,
  rejectUnauthorized: true,
  servername: "relay"
}, () => {
  console.log("[SENDER] Connected to hub via SSH tunnel, sending message...");
  sock.write(frame);
  console.log("[SENDER] Message sent to comms-dev/marconi via hub!");
  setTimeout(() => sock.end(), 2000);
});

sock.on("data", (d: Buffer) => {
  const len = d.readUInt32BE(0);
  const ack = JSON.parse(d.subarray(4, 4 + len).toString());
  console.log("[SENDER] ACK received:", ack.type, "reply_to:", ack.reply_to);
});

sock.on("error", (e: Error) => console.error("[SENDER] Error:", e.message));
sock.on("end", () => { console.log("[SENDER] Done."); process.exit(0); });
