import * as tls from "node:tls";
import * as fs from "node:fs";
import * as crypto from "node:crypto";

const keysDir = "/tmp/cd-keys";
const key = fs.readFileSync(keysDir + "/daemon.key");
const cert = fs.readFileSync(keysDir + "/daemon.crt");
const ca = fs.readFileSync(keysDir + "/peers/relay.crt");

const msg = JSON.stringify({
  version: "1",
  id: "msg-" + crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  from: { team: "comms-dev", agent: "marconi", prefix: "CD" },
  to: { team: "framework-research", agent: "brunel" },
  type: "query",
  priority: "normal",
  reply_to: null,
  body: "Reply from PROD-LLM to Windows! comms-dev (container) -> relay hub -> framework-research (local). Sent by Marconi.",
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
  console.log("[CD-SENDER] Connected to hub, sending to FR...");
  sock.write(frame);
  console.log("[CD-SENDER] Sent!");
  setTimeout(() => sock.end(), 2000);
});

sock.on("data", (d: Buffer) => {
  const len = d.readUInt32BE(0);
  const ack = JSON.parse(d.subarray(4, 4 + len).toString());
  console.log("[CD-SENDER] ACK:", ack.type, "reply_to:", ack.reply_to);
});

sock.on("error", (e: Error) => console.error("[CD-SENDER] Error:", e.message));
sock.on("end", () => { console.log("[CD-SENDER] Done."); process.exit(0); });
