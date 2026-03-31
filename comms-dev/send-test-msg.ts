import * as tls from "node:tls";
import * as fs from "node:fs";
import * as crypto from "node:crypto";

// Connect directly to hub as comms-dev, send a message for bt-triage
const keysDir = "/tmp/cd-keys";
const key = fs.readFileSync(keysDir + "/daemon.key");
const cert = fs.readFileSync(keysDir + "/daemon.crt");
const ca = fs.readFileSync(keysDir + "/peers/relay.crt");

const msg = JSON.stringify({
  version: "1",
  id: "msg-" + crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  from: { team: "comms-dev", agent: "marconi", prefix: "CD" },
  to: { team: "bt-triage", agent: "team-lead" },
  type: "query",
  priority: "normal",
  reply_to: null,
  body: "First real cross-container message through the hub! Sent from comms-dev to bt-triage via the relay hub.",
  checksum: "sha256:test"
});

const payload = Buffer.from(msg, "utf-8");
const frame = Buffer.alloc(4 + payload.length);
frame.writeUInt32BE(payload.length, 0);
payload.copy(frame, 4);

const sock = tls.connect({
  host: "127.0.0.1",
  port: 8443,
  key, cert, ca,
  rejectUnauthorized: true,
  servername: "relay"
}, () => {
  console.log("[SENDER] Connected to hub, sending message...");
  sock.write(frame);
  console.log("[SENDER] Message sent! Body:", msg.substring(0, 120) + "...");
  setTimeout(() => sock.end(), 1000);
});

sock.on("data", (d: Buffer) => {
  const len = d.readUInt32BE(0);
  const ack = d.subarray(4, 4 + len).toString();
  console.log("[SENDER] ACK received:", ack);
});

sock.on("error", (e: Error) => console.error("[SENDER] Error:", e.message));
sock.on("end", () => { console.log("[SENDER] Done."); process.exit(0); });
