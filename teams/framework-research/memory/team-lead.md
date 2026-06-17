# Team-Lead Scratchpad (*FR:Aen*)

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S54 closed 2026-06-17 -- **the 2.1.178 teams-migration question is EMPIRICALLY ANSWERED.** A throwaway 2.1.179 probe container proved: only the hardcoded team-NAME breaks (team dirs are `session-<id>`, Agent `team_name` ignored on disk); ALL courier primitives survive (SendMessage, members[] injection, and external-inbox-write **proactively wakes a bare idle session**). Migration is VIABLE conditional on ONE change: courier runtime team-name-discovery. **NEXT SESSION (S55) SCOPE (PO-stated): prepare to UNFREEZE the CLI (unpin off 2.1.177) + adopt 2.1.178 behaviour.**
- **Shipped S54 (origin/main):** `-courier` cross-team channel convention (c92e549, live round-trip green w/ apex, backwards-compat -bridge) · obsolete ghost mechanics removed (b23d605) · probe artifacts + findings doc (b37b938) · uid-1000 Dockerfile fix (ed1fe3d) · 6 wiki entries (Cal) · RfC draft `docs/rfc-teamless-courier-2026-06-17.md` (DRAFT, awaits PO review) · feature requests **#75** (notify-on-subscribe + counter-subscription handshake) + **#76** (mediated scp file transfer, capability-proven+jailed).
- **rc-connect tmux autoconnect** (apex -> `tmux:"apex"`): in dev-toolkit repo (separate) -- committed+pushed at S54 close.
- **Carry-forward:** see NEXT-SESSION BOOT + Standing watch below.

---

### SESSION 54 WRAP -- 2026-06-17

- [MILESTONE] **2.1.178 migration empirically answered.** Brunel built a throwaway 2.1.179 probe container; Hopper drove it via tmux+docker-exec on the rc-WARP host (host-net + WARP CA + NO sshd -> apex :2222 untouched; fresh OAuth login method-1 via tmux round-trip through PO; clean `down -v`). Probes P1-P6: P1 FAIL (team_name ignored, dir=session-<id>) = the ONE break -> courier needs runtime name-discovery; P2/P3/P4/P5 PASS (SendMessage, round-trip, members[]-injection, persistence); P6 PASS (external inbox-write PROACTIVELY wakes a bare idle session -- PO's ideal). Findings doc b37b938.
- [MILESTONE] **`-courier` convention** adopted (apex's proposal) -- closes the reply-path dead-letter class. Herald edited stationmaster-courier.py (rewrite_attribution -> -courier; _outbox_to_team strips -courier then -bridge); Brunel flipped fr-courier.config.json + restarted the live courier; round-trip green E2E with apex. Skill `inter-team-comms` doc updated too.
- [LEARNED] **Empirical beats inference, repeatedly:** (1) our pin memory was RIGHT, the claude-code-guide research agent WRONGLY said TeamCreate wasn't removed -- the official agent-teams doc + binary diff confirm removal in 2.1.178; (2) apex auth is OAuth creds-file, NOT API key (Brunel's Phase-1 inference corrected by live probe); (3) Hopper's P6 "inert" read self-corrected to "proactively wakes."
- [LEARNED] **Hook primitives PROVEN in-session** (not just researched): UserPromptSubmit/Stop inject additionalContext; Stop fires content-agnostically every turn-end + blocks-to-wake; harness caps consecutive Stop-blocks at 9 (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`), correct discipline = check `stop_hook_active`; `asyncRewake:true` is official (schema-confirmed). Curated to wiki.
- [DECISION] Removed obsolete ghost mechanics (buckets 1-4: old ghost-bridge POC, ghost-member-cli, restore-ghost-members.sh + startup Step 2c, stale inboxes). Active courier untouched; wiki left for Cal. startup.md is now lighter (no Step 2c).
- [GOTCHA] WARP host: bridge-net can't egress; host-net collides probe sshd with live apex :2222 -> throwaway pattern = host-net + no-sshd + docker-exec drive. ubuntu:24.04 ships stock `ubuntu` @ uid 1000 (collides useradd). Both in wiki gotchas.
- mitselek-ai-teams S54 commits: c92e549, b23d605, 520a714, a7c8cee, ed1fe3d, b37b938 (+ Cal wiki + RfC + inboxes at close). Issues #75, #76 filed.

---

### NEXT-SESSION BOOT (re-orient instructions for S55)

1. Read `startup.md` first. Steps 1-5 (Sync -> Reset team state -> Restore inboxes -> wait for PO before spawning). **NOTE: Step 2c (ghost re-registration) was REMOVED in S54 -- startup is lighter; don't expect it.**
2. Pull `mitselek-ai-teams`.
3. **Don't pre-spawn any agent.** Wait for PO direction.
4. **PRIMARY SCOPE (PO-stated): prepare to UNFREEZE the CLI (unpin off 2.1.177) + adopt 2.1.178+.** The ONE gating change = **courier runtime team-name-discovery** (see `wiki/decisions/courier-must-runtime-discover-team-name.md`: glob `~/.claude/teams/*/config.json` `.name` OR derive from `sessions/<pid>.json`; never hardcode `framework-research`). Also rework startup Step 2 (`TeamCreate`/`TeamDelete` GONE on 2.1.178) + shutdown S5. **Brunel offered to draft the name-discovery design** -> spawn Brunel (+Herald for the lifecycle protocol). THEN the unpin itself (re-enable updater / unset `DISABLE_AUTOUPDATER=1`, update CLI, validate against the probe findings). Ground everything in `docs/teams-migration-probe-findings-2026-06-17.md` (b37b938).
5. **comms-dev will chime in on the S54 discoveries (PO is inviting them).** If comms-dev sends feedback on the 2.1.178 findings / teamless-courier RfC / #75 / #76 -> route + respond (likely Herald). Reachable via `comms-dev-courier` over the hub (grant status: verify).
6. **teamless-courier RfC** (`docs/rfc-teamless-courier-2026-06-17.md`) awaits PO review -> numbered RFC filing + reference-impl sketch (Finn/Brunel). Grounded in the proven primitives; the "Ruth" thin-client is viable (courier-created inbox file + name-discovery, proactive wake).
7. **Feature requests #75 (subscribe handshake) + #76 (scp transfer)** filed -- design owners Herald (+Brunel for #76's jailing). Pick up when PO/comms-dev prioritise.

### Standing watch items going into session 55

- **The migration is the headline next-session deliverable.** Don't unpin blind -- name-discovery design + lifecycle rework FIRST, then unpin, then validate.
- **Probe container is GONE** (`down -v`) and was never hub-connected. A real FR<->test-container stationmaster round-trip + a hub-connected test endpoint = DEFERRED (PO-stated future step, distinct from the unpin).
- **apex on 2.1.110** (older than us) -- not a 2.1.178 oracle; the probe is our only 2.1.178 data path.
- **Running Opus 4.8** (roster pins fable-5; doc-only deviation per roster _substrate_note, carried since S51).
- **dev-toolkit rc-connect** tmux-autoconnect committed+pushed at S54 close (separate repo).
- **Unchanged carries:** GitHub retention-flip (PO go), A1 audit overdue (S44), hr-devs 3rd-customer, phantom-brunel, ELEX, Entu #42. Hub-admin access needs `~/.ssh/id_ed25519_apex` (michelek@).

(*FR:Aen*)

---
*Earlier sessions pruned per the 100-line discipline. Full history in git; durable knowledge in `wiki/`. S53 = CCR protocol shipped + apex reference instance #1 proven. S52 = apex container hardening (PR #165). S51 = FR courier daemon LIVE.*

(*FR:Aen*)
