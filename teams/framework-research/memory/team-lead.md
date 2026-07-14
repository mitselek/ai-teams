# Team-Lead Scratchpad (*FR:Aen*)

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S60 2026-07-14 CLOSED. Delivered the **product-owners team design package** (`designs/new/po-team/`, 10 artifacts, commits 7638394 + 41e9783 + 98340cb). Session ran on **fable-5** (PO call; roster repinned to `claude-fable-5[1m]`). Host = macOS (not the Windows box); Step 3.5 courier skipped (no cross-team courier needed).
- **S60 KEY RESULTS:** PO team (Sagres lore): Henry (lead), POs Gama=mvox / Pacheco=bigbook / Albuquerque=ad-auto / Magellan=field-network, Nunes (librarian). Channel = **literal tmux driving** (PO decision; evidence: Hopper WS3b probe proves send-keys/capture-pane safe on EXISTING sessions -- #60 crash = launch+dialog coupling only). Two-substrate split: tmux=doorbell, GitHub=work-of-record; `ready` label = durable dispatch handshake; R/M/D tiered PO discipline; protocols.md rev4 incl. **§1.6 control-message semantics**.
- **Key decisions:** tmux (not screen); English issues; allowlist-tuned remote perms (observe-before-inject stays MANDATORY); GitHub-only durable async v1 (courier = §7 v2 fallback); one-shot ssh-exec default; Nunes owns versioned sentinel-token card; priority:P0-2 labels = PENDING Mihkel (proposal parked in issue-standard §7).
- **CARRY-FORWARD:** (1) **PENDING Mihkel batch:** infra values x4 (host/port/key/tmux-session), GH issue-write scope check x4, org-board y/n, priority labels y/n. (2) **Comms lane PARKED, uncommissioned:** `designs/new/company-station/station-design.md` on disk UNCOMMITTED behind a PARKED banner -- do NOT commit/iterate until Mihkel commissions; his musing = "stationmaster + dedicated company station"; discussion open (keeper seat / host slot / observability front-end). (3) Per-pair go-live gate = over-real-ssh acceptance test (pins DIALOG sentinel). (4) S59 leftovers: Medici read-backs L2+L3 stage-2; inter-team-comms skill stale; apex 10-failure-mode relay.
- **WARNINGS (PO feedback, S60 -- FILED as wiki/process/control-signal-semantics-at-authority-boundaries, stage-2 CONFIRMED both co-authors):** musing != commission; stop != revert (per-artifact); control acts at boundaries, never race a working agent. ALSO: do NOT echo idle pings ("all quiet" spam broke PO's concentration for 45 min -- one-word turns on routine pings; verify state, don't narrate).

---
## Session transcript (prune beyond line 100)

### S60 wrap (2026-07-14)
- Startup: 2.1.178+ implicit-team path clean on macOS; SLUG=session-a12dac02; restore-inboxes needed explicit `FR_COURIER_TEAM_DIR_NAME=<slug>` override (two live sessions on box -> $PPID ambiguous inside script). 44 inboxes.
- Cell: Finn (precedent x2 -- incl. RETRACTION of "no send-keys precedent"; WS3b is the proof), Celes (roster+prompts; R/M/D fold; pane-target asymmetry = capture-before-send), Herald (protocols rev4; issue-standard rev2 co-owned w/ Celes -- 5 core labels, status:* rejected as GH-native-duplicating), Callimachus (spawned late to file control-semantics lessons; wiki 161).
- **Costly lesson lived:** tasked Herald off Mihkel's comms musing -> "don't rush" -> instant HOLD raced his finished doc -> he over-reverted §7 edit. Full record in the wiki entry; henry.md carries coordinator-level rules so PO-team inherits the lesson.
- Cal caught tag-leak (`</content></invoke>` tails) in committed wiki entry 98340cb; cleaned + wiki-wide sweep clean; fix rides shutdown commit w/ Herald read-back fold (per-artifact sharpening) + §1.6 numbering fix.
- NEXT SESSION: boot per startup.md; expect Mihkel's batch above; company-station lane resumes ONLY on explicit commission (Herald's parked doc = starting point; Brunel image + Hopper deploy flagged as execution owners).

(*FR:Aen*)
