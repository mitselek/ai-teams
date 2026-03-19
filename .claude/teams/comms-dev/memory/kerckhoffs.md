# Kerckhoffs Scratchpad
<!-- (*CD:Kerckhoffs*) -->

## [CHECKPOINT] 2026-03-19 — v2 architecture pivot

Architecture changed: **capability-based selective directory sharing with mTLS**, not CF relay.
Previous relay QA decisions (CF DO, Playwright, Miniflare) are superseded.

**Prior test suite: 203 passing across 8 files** (v1, still valid for existing src/)

---

## [WIP] 2026-03-19 — v2 test matrix (pending Vigenere crypto spec + Babbage protocol design)

### Model
Each team runs an export daemon. Export manifest declares: `{ path, to, mode }`.
Consumer connects via mTLS (identity = cert CN). Server enforces access per operation.

### Test matrix — 5 risk domains

---

#### 1. Export manifest validation
*Tests the daemon's config parser. Pure unit tests — no network needed.*

| Scenario | Input | Expected |
|---|---|---|
| Valid manifest | `{ path: "/results/", to: "team-b", mode: "ro" }` | Accepted |
| Root export | `path: "/"` | REJECT — must not export filesystem root |
| Parent escape in path | `path: "/results/../secrets/"` | REJECT — canonical path must be inside team root |
| Duplicate mount point | Two exports with same `path` | REJECT — mount-point uniqueness required |
| Unknown mode | `mode: "rw-execute"` | REJECT — only `ro` / `rw` allowed |
| Unknown consumer team | `to: "nonexistent-team"` | WARN or REJECT (TBD — needs Babbage spec) |
| Empty path | `path: ""` | REJECT |
| Relative path | `path: "results/"` | REJECT — must be absolute |

---

#### 2. Path traversal
*Tests the request handler's path canonicalization. Security-critical.*

| Scenario | Request path | Expected |
|---|---|---|
| Simple traversal | `../../../etc/passwd` | REJECT 403 |
| URL-encoded traversal | `%2e%2e%2f%2e%2e%2fetc%2fpasswd` | REJECT 403 |
| Double-encoded | `%252e%252e%252f` | REJECT 403 |
| Null byte injection | `/results/file\x00.txt` | REJECT 400 |
| Valid subpath | `/results/output.json` | ACCEPT |
| Exact export root | `/results/` | ACCEPT (list) |
| Subdir within export | `/results/subdir/file.txt` | ACCEPT |
| Path outside export | `/other-dir/file.txt` | REJECT 403 |
| Canonicalized escape | `/results/./../../etc/passwd` | REJECT 403 |

*Invariant: `resolve(exportRoot, requestedPath).startsWith(exportRoot)` must be enforced AFTER decoding, BEFORE any fs operation.*

---

#### 3. Symlink escape
*Tests that symlinks within the export root cannot point outside it.*

| Scenario | Setup | Expected |
|---|---|---|
| Symlink inside export root | `/results/link → /results/other.txt` | ACCEPT — target is within root |
| Symlink escapes export root | `/results/link → /etc/passwd` | REJECT — resolved target outside root |
| Symlink chain escapes | `/results/a → /results/b → /etc/passwd` | REJECT — fully resolve chain |
| Symlink to parent dir | `/results/link → /results/../secrets/` | REJECT |
| Circular symlink | `/results/a → /results/b → /results/a` | REJECT with error (no infinite loop) |

*Invariant: ALL symlinks in request path must be fully resolved before access check.*

---

#### 4. Access control enforcement (per-operation)
*Tests that mode (`ro`/`rw`) is enforced at every filesystem operation, not just at connect time.*

| Scenario | Export mode | Operation | Expected |
|---|---|---|---|
| Read on ro export | `ro` | READ file | ACCEPT |
| List on ro export | `ro` | LIST dir | ACCEPT |
| Stat on ro export | `ro` | STAT file | ACCEPT |
| Write on ro export | `ro` | WRITE file | REJECT 403 |
| Delete on ro export | `ro` | DELETE file | REJECT 403 |
| Create on ro export | `ro` | CREATE file | REJECT 403 |
| Write on rw export | `rw` | WRITE file | ACCEPT |
| Delete on rw export | `rw` | DELETE file | ACCEPT |
| Mode changed to ro mid-session | `rw` → `ro` (revocation) | WRITE after revocation | REJECT 403 |

*Each operation type must be independently tested — "probably enforced" is not a test result.*

---

#### 5. Identity spoofing / mTLS binding
*Tests that authenticated identity (cert CN) cannot be overridden by request payload.*

| Scenario | mTLS CN | Request claims | Expected |
|---|---|---|---|
| Valid identity | `team-b` | `from: "team-b"` | ACCEPT |
| Identity spoofing | `team-b` cert | `from: "team-a"` in request | REJECT — use CN, not claim |
| No client cert | (no cert) | `from: "team-b"` | REJECT — mTLS required |
| Expired cert | expired `team-b` cert | — | REJECT |
| Wrong CA | self-signed (unknown CA) | — | REJECT |
| Valid cert, no export grant | `team-c` cert | — | REJECT 403 — no grant for team-c |
| Cert CN mismatch to export `to` field | `team-c` cert | accessing team-b-only export | REJECT 403 |

*Invariant: authenticated identity = cert CN ONLY. Request payload `from` field is informational, never used for access decisions.*

---

#### 6. Revocation
*Tests runtime revocation of access grants. Depends on revocation mechanism — pending Babbage spec.*

| Scenario | Expected |
|---|---|
| Grant revoked at runtime | Subsequent requests from revoked team → REJECT 403 |
| In-flight request at revocation time | Complete current request, reject next |
| Grant re-issued after revocation | Requests succeed again |
| Daemon restart clears revocation | (TBD — depends on whether revocations are persistent) |

---

#### 7. Export enumeration
*Tests whether consumers can discover exports they are not granted access to.*

| Scenario | Expected |
|---|---|
| List all exports (no auth) | REJECT — no unauthenticated listing |
| Authenticated team lists exports | Returns ONLY exports granted to that team |
| Probe for known path on ungranted export | REJECT 403 (not 404 — avoid oracle) |

*Note: returning 404 vs 403 for ungranted paths leaks existence. Prefer uniform 403.*

---

### Blocked on (before writing RED tests)

1. **Transport protocol** — HTTP/custom framing? Determines request format and traversal vectors.
2. **Export manifest format** — JSON file? API? Schema? (Babbage)
3. **Revocation mechanism** — runtime API? Restart required? (Babbage)
4. **Symlink policy** — follow within root only, or reject all? (Babbage/Vigenere)
5. **mTLS CA model** — shared CA? Per-team CA? How are certs provisioned? (Vigenere)
6. **Export enumeration policy** — 403 vs 404 decision needed. (team-lead)

---

## [DECISION] v2 architecture (2026-03-19)

Capability-based selective directory sharing with mTLS. NOT chat relay. NOT mesh VPN.
Each team is sovereign — exports declared per-team, enforced locally.

## [PATTERN] TDD flow (active from 2026-03-14)

Kerckhoffs writes RED → `[COORDINATION]` to implementer → GREEN → Kerckhoffs verifies + edge cases.

## [GOTCHA] ESM — no require()

`"type":"module"` in package.json. Use top-level imports or `await import()`.

## [DEFERRED] Task #25 GREEN (from v1)

Verify `seenSize()`, `maxSeenSize`, eviction, `stop()` clear — all 9 tests pass.
(Low priority until v2 direction is confirmed stable.)
