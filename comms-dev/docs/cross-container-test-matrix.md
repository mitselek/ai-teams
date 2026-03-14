# Cross-Container Acceptance Test Matrix

(*CD:Kerckhoffs*)

## Purpose

Verify the comms-dev broker stack works correctly when two team brokers run in separate Docker containers sharing a `/shared/comms/` volume. These tests cannot be executed as Vitest unit tests — they require real container orchestration. The planned implementation is a shell script (`scripts/acceptance-test.sh`) that drives `docker compose` and validates outcomes via file inspection and `curl`/`nc` probes.

## Infrastructure Setup

```
Container: comms-dev                 Container: framework-research
┌───────────────────────┐            ┌──────────────────────────────┐
│ broker daemon          │            │ broker daemon                 │
│ COMMS_TEAM_NAME=       │            │ COMMS_TEAM_NAME=              │
│   comms-dev            │            │   framework-research          │
│ socket: comms-dev.sock │            │ socket: framework-research.sock│
└───────────┬───────────┘            └──────────────┬───────────────┘
            │              /shared/comms/             │
            └──────────────────┬──────────────────────┘
                               │
                    ┌──────────┴───────────┐
                    │  registry.json       │
                    │  comms-dev.sock      │
                    │  framework-          │
                    │    research.sock     │
                    └──────────────────────┘

Shared secret: /run/secrets/comms-psk (same 256-bit key in both containers)
```

## Test Cases

---

### TC-01: Broker Registration in registry.json

**Category:** Discovery
**Priority:** P0 — all other tests depend on this

**Preconditions:**
- Shared volume mounted at `/shared/comms/` in both containers
- `registry.json` does not exist (clean state)

**Steps:**
1. Start `comms-dev` broker container
2. Wait 2s for broker to initialize
3. Read `/shared/comms/registry.json`

**Expected outcomes:**
- `registry.json` exists and is valid JSON
- `registry.json.teams["comms-dev"]` is present
- `teams["comms-dev"].socket` equals `/shared/comms/comms-dev.sock`
- `teams["comms-dev"].prefix` equals `"CD"`
- `teams["comms-dev"].capabilities` is a non-empty array
- `teams["comms-dev"].registered_at` is a valid ISO 8601 timestamp
- `teams["comms-dev"].heartbeat` is a valid ISO 8601 timestamp within 5s of `registered_at`
- `comms-dev.sock` file exists on the shared volume

**Failure signal:** registry missing, malformed JSON, missing required fields

---

### TC-02: Heartbeat Update

**Category:** Discovery
**Priority:** P1

**Preconditions:** TC-01 passed, broker running

**Steps:**
1. Record `heartbeat` value from `registry.json`
2. Wait 65s (heartbeat interval is 60s)
3. Re-read `registry.json`

**Expected outcomes:**
- `teams["comms-dev"].heartbeat` has changed to a newer timestamp
- Registry is still valid JSON (no corruption during write)

**Failure signal:** heartbeat unchanged after 65s → broker heartbeat loop broken

---

### TC-03: Message Send comms-dev → framework-research

**Category:** Delivery
**Priority:** P0

**Preconditions:** Both brokers running and registered (TC-01 verified for both)

**Steps:**
1. From `comms-dev` container, run:
   ```bash
   npx tsx src/cli/comms-send.ts \
     --to framework-research \
     --agent team-lead \
     --type query \
     --body "TC-03: ping from comms-dev"
   ```
2. Wait 2s
3. Inspect `framework-research` container's inbox:
   ```bash
   # In framework-research container:
   ls ~/.claude/teams/framework-research/inboxes/
   ```

**Expected outcomes:**
- Exit code 0 from `comms-send`
- Exactly one new `.json` file in `framework-research` agent inbox
- File parses as a valid `Message` with:
  - `from.team === "comms-dev"`
  - `to.team === "framework-research"`
  - `to.agent === "team-lead"`
  - `body` contains `"TC-03: ping from comms-dev"`
  - `type === "query"`
  - `checksum` matches HMAC-SHA256 over the message fields

**Failure signal:** no inbox file after 2s, wrong fields, checksum mismatch

---

### TC-04: Message Send framework-research → comms-dev

**Category:** Delivery
**Priority:** P0

**Preconditions:** Both brokers running and registered

**Steps:**
1. From `framework-research` container, run `comms-send` targeting `comms-dev`
2. Wait 2s
3. Inspect `comms-dev` container's agent inbox

**Expected outcomes:** Same structural assertions as TC-03 with teams swapped:
- `from.team === "framework-research"`
- `to.team === "comms-dev"`
- Message body intact
- Checksum valid

**Failure signal:** same as TC-03

---

### TC-05: Encrypted Payload Verified

**Category:** Crypto
**Priority:** P0

**Preconditions:** Both brokers running with PSK configured

**Steps:**
1. Capture the raw wire bytes of a message in transit by tapping the socket with:
   ```bash
   # On the shared volume, use socat to intercept one frame:
   socat -x UNIX-LISTEN:/shared/comms/tap.sock,fork \
     UNIX-CONNECT:/shared/comms/framework-research.sock
   ```
   Or alternatively, use `tcpdump`/`strace` within the container.
2. Send a message from comms-dev to framework-research (TC-03 scenario)
3. Capture the raw frame bytes from the socket

**Expected outcomes:**
- Raw frame bytes (after stripping 4-byte length prefix) do NOT contain the plaintext message body as UTF-8
- Decoding the frame as plain JSON fails (or produces a valid `EncryptedPayload` structure, not a `Message`)
- The `EncryptedPayload` has fields: `iv`, `ciphertext`, `tag`, `aad`, `version: 1`

**Alternative (simpler) approach if socket tap is too complex:**
- Run a second broker with a WRONG PSK
- Attempt to send a message to it
- Verify: the wrong-PSK broker rejects the message (cannot decrypt) and never delivers to its inbox

**Failure signal:** raw bytes contain plaintext body → encryption not applied on wire

---

### TC-06: Tampered Message Rejected

**Category:** Security / Integrity
**Priority:** P0

**Preconditions:** Both brokers running

**Steps:**
1. Capture a valid encrypted frame destined for `framework-research`
2. Flip one bit in the ciphertext bytes (byte offset 42 XOR 0x01)
3. Replay the modified frame to `/shared/comms/framework-research.sock` via `nc`:
   ```bash
   # Write 4-byte length header + corrupted ciphertext
   python3 -c "
   import struct, sys
   frame = open('captured.bin','rb').read()
   tampered = bytearray(frame)
   tampered[4+42] ^= 0x01  # flip a ciphertext byte
   sys.stdout.buffer.write(bytes(tampered))
   " | nc -U /shared/comms/framework-research.sock
   ```
4. Wait 1s
5. Check `framework-research` inbox

**Expected outcomes:**
- `framework-research` inbox receives NO new message files
- The receiving broker logs a decryption failure (GCM auth tag mismatch)
- Connection is closed cleanly (no crash)

**Alternative (no raw socket access):** send a message with a manually constructed bad checksum field (plaintext mode test, PSK disabled):
- Build a message JSON with `checksum: "sha256:" + "0".repeat(64)`
- Frame and send to the broker socket
- Verify: broker returns ACK with `status: error, error: "checksum"` and inbox is empty

**Failure signal:** tampered message appears in inbox → integrity check bypassed

---

### TC-07: Broker Graceful Shutdown and Deregistration

**Category:** Lifecycle
**Priority:** P1

**Preconditions:** `comms-dev` broker running, registered in `registry.json`

**Steps:**
1. Confirm `teams["comms-dev"]` present in `registry.json`
2. Send SIGTERM to `comms-dev` broker process:
   ```bash
   docker compose exec comms-dev kill -SIGTERM $(pgrep -f "broker/daemon")
   ```
3. Wait 3s for graceful shutdown
4. Read `registry.json`

**Expected outcomes:**
- Broker process exits with code 0
- `teams["comms-dev"]` is absent from `registry.json` (deregistered)
- `comms-dev.sock` file may still exist on the volume (socket files persist) — this is acceptable
- `registry.json` is valid JSON after deregistration write

**Failure signal:** broker still in registry after SIGTERM, registry corrupted, non-zero exit

---

### TC-08: Stale Entry Cleanup (Bonus)

**Category:** Lifecycle
**Priority:** P2

**Preconditions:** `comms-dev` broker registered

**Steps:**
1. Kill the `comms-dev` broker process with SIGKILL (no graceful shutdown):
   ```bash
   docker compose kill comms-dev
   ```
2. Wait 130s (stale threshold is 120s)
3. Trigger a write on the `framework-research` broker (send a heartbeat or any registry update)

**Expected outcomes:**
- `teams["comms-dev"]` has been removed from `registry.json` by the `framework-research` broker's stale cleanup pass

**Failure signal:** stale entry still present after 130s → cleanup loop broken

---

## Test Script Design

The acceptance script (`scripts/acceptance-test.sh`) should:

1. **Bring up containers:** `docker compose up -d`
2. **Wait for both brokers to register:** poll `registry.json` with 500ms intervals, timeout 15s
3. **Run TC-01 through TC-07 in order** — each test:
   - Prints `[TC-NN] <name> ... PASS` or `FAIL: <reason>`
   - On FAIL, dumps relevant log lines from both containers
4. **Tear down:** `docker compose down -v`
5. **Exit code:** 0 if all P0 tests pass, 1 otherwise (P2 failures are warnings only)

### Helper functions needed

```bash
# Wait for a condition with timeout
wait_for() { ... }

# Read registry.json from shared volume
registry_get() { docker compose exec comms-dev cat /shared/comms/registry.json; }

# Check inbox for a new message file matching a pattern
inbox_has_message() { team=$1; pattern=$2; ... }

# Send a message via comms-send
send_message() { from_container=$1; to_team=$2; body=$3; ... }
```

## Pass Criteria

| Test | Priority | Required for PASS |
|---|---|---|
| TC-01 Broker registration | P0 | Yes |
| TC-02 Heartbeat update | P1 | No |
| TC-03 CD → FR delivery | P0 | Yes |
| TC-04 FR → CD delivery | P0 | Yes |
| TC-05 Encrypted payload | P0 | Yes |
| TC-06 Tampered rejected | P0 | Yes |
| TC-07 Graceful shutdown | P1 | No |
| TC-08 Stale cleanup | P2 | No |

**Minimum passing bar:** TC-01, TC-03, TC-04, TC-05, TC-06 all PASS.
