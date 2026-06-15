# Team-Lead Scratchpad (*FR:Aen*)

## Summary (lines 1-15 — always read on startup)
- **Current state:** S52 closed 2026-06-15 — **apex-team container hardening (Task #5) COMPLETE + PROVEN end-to-end.** Container rebuilt 5× during quiescence; 6 fixes shipped on branch `fr/apex-container-hardening-s52` (**PR #165, 6 commits**, awaiting apex review/merge). apex woke at session-end → courier delivered both queued consignments → **round-trip proven live**. ALL GREEN: ASK-1 supervisor (container-restart + restart-on-exit), ASK-2 (courier private key + hub host key), inbox-dir, GH_TOKEN, dashboard, lock-pre-clean, container sshd-host-key persist.
- **Active items:** none open — lead item done, apex UP. 3 follow-ups QUEUED (see BOOT item 3).
- **Key decisions S52:** stayed Opus 4.8 (fable-5 roster pin = carried deviation); branch+PR transit (atomic-PR on apex's repo, base current origin/main not stale rc d9074bb); in-scope = apex-entrypoint/container fixes; out-of-scope = shared courier.reference.py changes (queued, spec-now-implement-next).
- **Carry-forward:** PR #165 apex review/merge → then return rc build-source from FR branch to `main`; 3 queued fixes (boot_id lock / inject down-agent / .claude.json persist); 7 Cal items (held, Cal not spawned); GitHub retention-flip (PO go); A1 audit overdue (S44); hr-devs 3rd customer.

---

### NEXT-SESSION BOOT (re-orient instructions for S53)

1. Read `startup.md` first (always). Steps 1–5 (Sync → Reset team state → Restore inboxes → **wait for PO before spawning**). Pull `mitselek-ai-teams`.
2. **Don't pre-spawn any agent.** Wait for PO direction.
3. **If PO wants the queued courier-ref/persist fixes implemented:** spawn Herald (courier-ref owner) + Brunel (container) + Hopper (operator). THREE queued, all spec'd, all were HOLD-pending-go:
   - (1) **lock-staleness fix** — boot_id→PID-1-starttime discriminator (boot_id is host-scoped, wrong); spec `docs/courier-lock-staleness-fix-spec-2026-06-15.md`, Brunel concurred, implementation-ready. Shared `stationmaster-courier.py`.
   - (2) **inject down-agent occupied-inbox** — Herald: B cap-and-surface (content-stable-across-rounds ⇒ "agent likely down", honest-fast-fail) + A rename-aside-merge to occupied case (live-agent-race hazard, careful). Shared courier.py. Spec at impl time.
   - (3) **persist `.claude.json`** — CAUTION it's STATEFUL: restore-from-latest-`~/.claude/backups/`-if-absent OR symlink-after-seeding-real-config. NEVER generate-empty (would RESET apex's config). Brunel container fix.
   - All touch shared courier.py OR apex's container → land via PR (atomic, apex reviews), not silent.
4. **If PO asks about apex / PR #165:** apex's to review+merge (6 commits on `fr/apex-container-hardening-s52`). After merge+rebuild: return rc build-source from FR branch → `main`. **ORDERING TRAP:** the merge-rebuild RE-WIPES `.claude.json` unless fix #3 lands first — flag to apex/PO.
5. **If apex sends traffic / answers WINDOWPREP:** FR↔apex courier round-trip is LIVE + proven (host key pinned both ways). The S51-WINDOWPREP questions apex may answer are now CONFIRMATION (we resolved them empirically: network=host, courier.json path) — not prerequisites. Spawn Herald for protocol.
6. **If PO gives go on GitHub retention-flip:** draft from TRUTHS.md I-1 + version bracket; PO reviews before filing.
7. **Cal NOT spawned S52** — 7 items parked in Herald's scratchpad (trust-triangle umbrella + leg/finding entries) + Brunel's build-source-drift gotcha + the "inventory-every-ephemeral-home-path" framework finding. Spawn Cal to file.

### Standing watch items going into session 53

- **apex container SSH identity now STABLE** (host key persisted on volume, fp `SHA256:z1/fXAE8gRCfUrKnIJ8PM5bcO/pBhAMrZESNHbmh4vA`). If it CHANGES on a future rebuild → the Step-6c persist regressed. PO's known_hosts now holds this key.
- **FRAMEWORK FINDING (Cal-worthy):** 6 ephemeral-home casualties this session = "container hardening must INVENTORY every ephemeral-home path the agent depends on; fix-shape splits generate-able (keys → generate-if-absent on persistent vol) vs stateful (config → restore/preserve, never reset)."
- **3 queued courier-ref/persist fixes** — HOLD until PO go (item 3).
- **FR courier daemon NOT restarted S52** — session-scoped; restart if a session needs FR-side inbox↔hub automation (`poc/ghost-bridge/start-fr-courier.ps1`).
- **Hub health on prod-llm** (`restart: unless-stopped`); CLI version re-validation if it changed (courier facts version-coupled). Hub-admin access needs registry key `~/.ssh/id_ed25519_apex` (michelek@), NOT default.
- **Unchanged carries:** GitHub retention-flip (PO go), A1 audit overdue (S44), hr-devs 3rd-customer invite, phantom-brunel, ELEX, Entu #42.

(*FR:Aen*)

---

## SESSION 52 WRAP — 2026-06-15 (apex container hardening COMPLETE + PROVEN; PR #165 = 6 commits)

- [MILESTONE] **apex container hardening done + proven end-to-end.** Survives rebuild with services auto-relaunching + courier key/host-key/identity all surviving. Round-trip proven LIVE (apex woke at session-end, drained inbox, courier delivered both consignments incl. the test). FR↔apex courier is now bidirectional + working.
- [DECISION — Aen] Stayed Opus 4.8 (roster pins fable-5; carried S51 deviation; specialists inherited opus-4-8).
- [DECISION — Aen] Transit = branch+PR (atomic-PR discipline on apex's collaborator repo), based on **current origin/main** (rc d9074bb was 2 lines stale on entrypoint). Worktree-isolated commits; local main + Brunel's working tree untouched.
- [DECISION — Aen] **Scope split:** in-scope = apex-entrypoint/container fixes (all 6 ephemeral gaps, my domain to commit); out-of-scope = shared `stationmaster-courier.py` changes (lock-staleness + inject down-agent) → spec-now-implement-next, queued, never landed mid-apex-close.
- [DECISION — Aen] PO set hard gates on the rebuild (route confirmed / PO go / window / quiescence); all held. PO greenlit each escalation (rebuilds #1–#5, close-the-collect-leg, fix-the-5th-gap).
- [LEARNED] **Empirical-in-container beats local inference** — Brunel's "supervise() sound" came from a local repro that omitted `set -e` + the terminal `exec`; Hopper's in-container narrow-kill was the truth (the inherited errexit killed the loop). One-line `set +e` fixed it. Reinforces S51 probe-beats-artifact.
- [LEARNED] **6 ephemeral-home casualties** found by exercising the substrate: courier private key, hub host key (known_hosts), sshd host keys, courier lock, .claude.json config (+ inbox state was already persistent). Fix-shape SPLITS by data type (generate-able vs stateful). The framework finding.
- [LEARNED] **Gate discipline caught 4 silent failures pre-ship** (transit gap, GH_TOKEN regression, supervise set-e, inject down-agent) + 2 post-hoc (sshd host key, .claude.json). Hopper refused every insecure shortcut (TOFU/disable-strict/hand-edit-inbox/improvise-deposit).
- [PROVEN] Host-key chain verified at every hop (4 independent fp confirms); courier-lock pid-aliasing root-caused (honest inferred-vs-measured); deposit/collect/inject all exercised live.
- Commits (PR #165, apex repo `Eesti-Raudtee/apex-migration-research`): `0602f686` hardening + `30749c85` GH_TOKEN + `4d923ae5` inbox-dir + `26e5a7ed` set+e/lock-pre-clean + `22a3a320` hub-host-key + `c0fb2bac` sshd-host-key-persist. Plus this S52 `mitselek-ai-teams` session-state commit.

---
*Earlier sessions (S51 and prior): pruned 2026-06-15 per the 100-line discipline. Full history in git; durable knowledge promoted to `wiki/`. S51 = FR courier daemon LIVE + stationmaster docs FINAL.*

(*FR:Aen*)
