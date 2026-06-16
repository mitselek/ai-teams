# Apex Keys Dispatch -- Findings & Recommendations

**Dates:** 2026-05-20 → 2026-05-21
**Dispatch:** Hopper's first-ever (Phase 1 prep → Phase 2 recreate)
**Final outcome:** **ORIGINAL PO ASK ACHIEVED 2026-05-21 09:18.** Aleksandr's SSH key now persists across apex container rebuilds. Multi-system credential failure prevented. See Phase 2 success update at end of memo.

This memo was originally written 2026-05-20 when the Phase 1 dispatch aborted mid-execution per PO "stop and let me think" direction. The Phase 2 follow-up landed 2026-05-21 in apex team's maintenance window. The body of the memo below preserves the 2026-05-20 framing (degraded substrate, original-ask-unaddressed) as the diagnostic record; the Phase 2 success update at the bottom captures the resolution.

(*FR:Aen*)

---

## Original ask

PO surfaced: "Inside the apex container, in `~/.ssh/authorized_keys`, there are two keys (mine + Aleksandr's). On container rebuild, only mine survives. Make Aleksandr's key persist rebuilds too."

## Original diagnosis (Brunel, S33+ design discipline applied)

Read FR-deployed artifacts (`designs/deployed/apex-research/container/`). Conclusion: substrate is already designed for multi-key -- entrypoint Step 7 (`entrypoint-apex.sh:166-196`) iterates ALL `SSH_PUBLIC_KEY*` env vars and writes them to `authorized_keys` on container start. `docker-compose.yml:53-54` passes both `SSH_PUBLIC_KEY` and `SSH_PUBLIC_KEY_2` from host-side `.env`. Gap: host-side `.env` only has `SSH_PUBLIC_KEY` (PO's). Aleksandr's key was added via `docker exec` to the ephemeral container layer -- wiped on rebuild.

Fix-shape: extract Aleksandr's pubkey from live container (Tier R), append `SSH_PUBLIC_KEY_2` line to host `.env` (Tier M), verify (Tier R). Container recreate (Tier D) deferred to a maintenance window approved by apex team.

## What actually happened

The dispatch hit **FOUR hard-gates** during P1.1 and P1.2 execution, each correctly held by Hopper's discipline. None were graceful -- each revealed something the diagnosis didn't see.

### Hard-gate 1 -- Discriminator drift (P1.1)

Brunel's regex `michelek\s*$` to identify PO's key vs Aleksandr's was anchored on `.env.example:13`'s placeholder comment `michelek`. **Real production key comment is `mihkel.putrinsh@evr.ee apex-research`.** Filter matched neither line; @()-force-array returned 2 lines; count check tripped; halted.

Resolved by Brunel amendment-1: positive-select on `aleksandr` token + assert `mihkel` not present.

### Hard-gate 2 -- Compose-dir ambiguity (P1.2a)

Locate-probe returned two candidates: `apex-migration-research/` (live by naming) and `apex-migration-research.pre-fresh-clone-2026-04-29/` (backup by naming suffix). Discipline refused to guess.

Resolved by Brunel amendment-2: `docker inspect` for `com.docker.compose.project.working_dir` label = `/home/dev/github/apex-migration-research`. Substrate-truth via docker labels, not naming-heuristic.

### Hard-gate 2.5 -- Label-key typo (within P1.2a)

Brunel typo'd label key as `com.docker.compose.project_working_dir` (underscore). Canonical is dot-separated. Probe returned empty.

**Hopper's within-dispatch-agency move:** ran a `--format '{{json .Config.Labels}}'` dump to disambiguate empty-key vs missing-label vs malformed-command. JSON dump revealed all labels; correct key surfaced as substrate-truth. This is the within-dispatch-agency boundary working exactly as designed.

### Hard-gate 3 -- Dispatch-premise drift (P1.2b)

`.env` writability probe returned `No such file or directory`. **The `.env` file does not exist at `$COMPOSE_DIR`.** The entire Phase 1 fix-shape ("append SSH_PUBLIC_KEY_2 to host `.env`") presupposes `.env` exists. A regex amendment can't fix this; the plan-shape itself was wrong.

### Hard-gate 4 -- Degraded substrate state revealed (P1.2c three-probe batch)

Three Tier R probes returned:

1. **Container's `Config.Env`** (substrate-truth, baked at container-create time):
   - `SSH_PUBLIC_KEY_2 = ssh-ed25519... mihkel.putrinsh@evr.ee apex-research` (PO's key in **SLOT 2**, not SLOT 1 as Brunel's diagnosis assumed)
   - `SSH_PUBLIC_KEY = ""` (SLOT 1 EMPTY)
   - No `SSH_PUBLIC_KEY_3` in Config.Env
   - Aleksandr's key not in Config.Env (matches diagnosis: only in ephemeral layer)
2. **`docker compose config`** (compose's resolution NOW):
   - All three slots resolve to **empty strings**
   - **Operational compose-yml exposes `SSH_PUBLIC_KEY_3`** -- this slot is NOT in FR's `designs/deployed/apex-research/container/docker-compose.yml`. Operational copy has drifted from FR design.
3. **Filesystem search:**
   - No `.env` or `.env.local` at `$COMPOSE_DIR`
   - Pre-fresh-clone backup `.env` exists at `/home/dev/github/apex-migration-research.pre-fresh-clone-2026-04-29/.env` (1.2 KB, mtime 2026-04-29)

**Hopper's hypothesis (H5), and it fits:** A fresh-clone of `apex-migration-research` on 2026-04-29 created the `.pre-fresh-clone-2026-04-29` backup dir, re-cloned the repo. The fresh clone doesn't include `.env` (gitignored). Operational `.env` was lost. The running container is a stable-state survivor -- env was baked into the container at create-time before the wipe, and the container hasn't been recreated since.

**Critical implication:** ANY container recreate today (`docker compose up --force-recreate` or any equivalent) would launch the new container with all three slots empty → entrypoint Step 7 KEY_COUNT=0 → no `authorized_keys` written → sshd rejects all logins → **complete SSH lockout.**

This includes the original Phase 2 recreate in Brunel's r3 dispatch package. Had Phase 1 succeeded cleanly and Phase 2 proceeded blind (even with apex team's maintenance window approval), the recreate would have caused a real SSH-lockout incident.

**Hopper's hard-gate discipline at P1.2b prevented this.** No mutations occurred; substrate is unchanged.

## PO clarifications captured during dispatch

- **Q1 -- Why no `.env` restore after 2026-04-29 fresh-clone?** "I don't remember." → Treat as oversight; not a known intentional pattern.
- **Q2 -- What's `SSH_PUBLIC_KEY_3` for in apex's compose-yml?** Reserved for future key. Placeholder capacity, never populated.
- **Q3 -- Course of action?** Stop and let me think.

## Additional finding (P1.2d backup-`.env` read, executed before halt landed)

A Tier R `cat` of the pre-fresh-clone backup `.env` ran at 17:37, crossing my 17:37 halt order in transit. The operation completed cleanly (no mutations, just file read). Content surfaced:

- `SSH_PUBLIC_KEY="ssh-ed25519 AAAA... mihkel.putrinsh@evr.ee apex-research"` -- **PO's key was in SLOT 1** in the backup
- `SSH_PUBLIC_KEY_3="ssh-ed25519 AAAA... rc-connect"` -- **SLOT 3 was populated** with rc-connect wrapper's pubkey
- No `SSH_PUBLIC_KEY_2` entry in the backup
- Tokens preserved: `GITHUB_TOKEN`, `ATLASSIAN_API_TOKEN`, `ATLASSIAN_EMAIL`, `ATLASSIAN_BASE_URL`, `TUNNEL_TOKEN` (all secret-redacted in ops-log per first-4-chars-only discipline)
- `ANTHROPIC_API_KEY` empty (Claude Code apparently uses subscription auth, not this var)

### Two contradictions this surfaces

**Contradiction 1 -- Slot migration mystery.** The backup has PO's key in SLOT 1; the running container's `Config.Env` has PO's key in SLOT 2. A migration happened in an intermediate `.env` that no longer exists (post-backup, pre-current-container-create, pre-fresh-clone-delete). We have the pre-migration state preserved and the post-migration state baked in, but the migration itself and its motivation are not recoverable from substrate alone.

Hypotheses (only PO can confirm):
- SLOT 1 was reserved for something else and PO's key was moved to SLOT 2 deliberately
- A test or experiment that didn't get reverted
- An ordering preference (SLOT 1 became "system", SLOT 2+ "humans")
- An accident

**Contradiction 2 -- Q2 answer vs backup content.** PO recalled SLOT 3 as "reserved for future key, never populated." Backup `.env` shows SLOT 3 = rc-connect key. So either:
- PO forgot rc-connect populated SLOT 3 at some point
- The backup is from a more recent state than PO recalls
- Someone else (apex team, dev tooling) populated SLOT 3 without PO's direct involvement

This is documented in the ops-log but not adjudicated. PO can disambiguate at leisure if it matters for the eventual fix-shape.

### Multi-system credential loss -- sharper than the SSH-lockout framing

My earlier framing was "recreate today = SSH lockout." Sharper truth from the backup-`.env` content: **recreate today = ALL credentials lost.** Not just SSH -- also GitHub clone access (GITHUB_TOKEN), Atlassian MCP server (ATLASSIAN_API_TOKEN), Cloudflare tunnel (TUNNEL_TOKEN). The container becomes useless across all its external integrations on the first recreate post-2026-04-29.

This raises the recreate-risk priority. The container is currently functional only because it hasn't restarted; any restart event (host reboot, OOM kill, docker daemon restart, planned maintenance, etc.) triggers the full multi-system failure cascade.

## The substrate-ownership vs design-ownership observation

This dispatch surfaced an axis of substrate-drift that FR did not previously have a check for:

**FR's `designs/deployed/<team>/container/` is canonical for the DESIGN.** The consumer team (apex) operationalized the design by forking/copying the compose-yml + entrypoint into their own repo (`apex-migration-research`). Over time the operational copy drifted -- SLOT 3 was added in apex's copy but never propagated back to FR's design.

**FR's "read-your-own-deployed-artifacts" discipline catches FR-design-vs-running-state drift on FR's side.** It does NOT catch FR-design-vs-consumer-team-operational drift. Different axis. The dispatch assumed FR's design copy was canonical for everything; the actual running substrate told a different story.

This is the load-bearing wiki-grade observation from this dispatch, candidate for Cal Protocol A submission:

> When FR ships a design template and a consumer team operationalizes it on their own repo, the operational substrate WILL diverge from the design over time. FR-side diagnosis MUST cross-read substrate-live state (running container `Config.Env`, deployed compose-yml on the operational host) before assuming FR's design copy is canonical. Substrate-live is canonical for the operational substrate; FR's design copy is canonical only for the design lineage. Conflating them creates dispatch-premise drift that surface-checks catch but proceed-without-checks would not.

Five sub-shapes catalogued by Brunel during this dispatch:

- **Sub-shape A:** template-stub-as-selector (`.env.example` stub `michelek` ≠ live `.env` value)
- **Sub-shape B:** name-inference-as-selector (filesystem naming convention ≠ runtime canonical)
- **Sub-shape C:** documentation-convention-as-discriminator (Brunel's typo'd label key)
- **Sub-shape D:** deployed-artifacts-as-premise-source (P1.2b `.env` presence assumption)
- **Sub-shape E:** substrate-ownership-vs-design-ownership distinction (structural meta-pattern -- likely wiki-entry headline with A-D as illustrative subcases)

Recovery pattern shared across all: substrate-live probe (running container labels, runtime env, filesystem) is cheap when Tier R and conclusive when authoritative. Inference and template/naming-based selectors are fallbacks, not primary sources.

## What is the current state of apex

- **Container is running stable.** Substrate is unchanged from pre-dispatch state. PO and Aleksandr both currently have SSH access (PO via container's baked-in `Config.Env` SLOT 2; Aleksandr via the ephemeral `authorized_keys` injection that survives only until recreate).
- **Container is fragile.** Any restart, recreate, host reboot, or maintenance event that triggers a container recreation will result in **complete SSH lockout** until `.env` is restored. This is true regardless of Phase 1 progress; the fragility predates this dispatch by ~3 weeks (since 2026-04-29).
- **No SSH-lockout-causing operation is queued.** This dispatch is halted. Phase 2 sanction package is rescinded.

## Open questions for PO

(Answered/superseded items struck through; only-PO-can-answer items remain.)

1. ~~What was in the 2026-04-29 backup `.env`?~~ **Answered by P1.2d** -- see "Additional finding" section above.

2. **Why does the running container have PO's key in SLOT 2 when the backup had it in SLOT 1? What was the slot-migration about?** Only PO can answer; not recoverable from substrate. Affects the canonical slot-assignment for the eventual fix.

3. **Is the SLOT 3 rc-connect key still needed?** Backup shows it was populated with rc-connect's wrapper pubkey. PO recalled SLOT 3 as "never populated." Disambiguating this informs whether SLOT 3 stays for rc-connect (and Aleksandr gets a new slot) or is reclaimable.

4. **Should FR ship a `.env` restoration as part of a sanitized Phase 1 redesign?** Options:
   - **(a) Restore from backup + slot-reorg per PO direction + add Aleksandr.** Reconstruct `.env` from backup (preserves tokens), apply PO's canonical slot assignment for SSH_PUBLIC_KEY*, base64-transit-pattern write. Still requires apex team's maintenance window before any recreate.
   - **(b) Escalate to apex team.** Hand them the diagnosis; let them decide how to repair their substrate. FR's role becomes documentation + design-side amendments.
   - **(c) Restore-only.** Restore `.env` to prevent lockout; defer Aleksandr to a later dispatch.
   - **(d) None of the above.** Some other shape PO hasn't surfaced yet.

5. **Should FR's `designs/deployed/apex-research/container/docker-compose.yml` be amended to match apex's operational copy (add SLOT 3)?** Separate FR-side work item, regardless of lockout fix.

6. **Does FR want to formalize a "cross-read operational copy before diagnosing" discipline?** Brunel + Hopper sketched a "three-layer diagnostic discipline" mid-dispatch -- FR-design + consumer-team-operational + runtime-container-state as three independent substrates each capable of drift. Joint-authored structural amendment proposed for Brunel and Hopper prompts via Celes-routed future session. Aen ratification once drafted. Cal Protocol A wiki entry will document the meta-pattern independently.

## Recommendations from Aen (team-lead)

Take time on (3). The substrate is stable for now; there's no clock on the decision. The fragility (any-recreate = lockout) is the load-bearing risk and applies regardless of timing -- so engaging apex team about the substrate state, separately from this dispatch, may be the highest-priority follow-up. Their substrate is what's degraded; their maintenance window is the only safe path to recreate; their decision to populate or remove SLOT 3 is theirs to make.

For (4) and (5), defer to a future session once (3) is settled. They are FR-side follow-ups that don't need to bundle with the apex-substrate fix.

For (1) and (2), I can read the backup `.env` (Tier R, cheap) in any future session -- no urgency.

## Audit trail

- **Operations log:** `teams/framework-research/docs/operations-log-2026-05.md` (authored by Hopper at close-out; canonical dispatch record per her role-of-record discipline).
- **Hopper scratchpad:** `teams/framework-research/memory/hopper.md` (substrate-facts learned, first-dispatch carry-forward for future-Hopper).
- **Brunel scratchpad:** `teams/framework-research/memory/brunel.md` (diagnostic arc + sub-shape A-E catalog candidates).
- **This memo:** the digestible findings + recommendations for PO review at leisure.
- **Pattern catalog (session-wrap candidate Cal Protocol A submission):** sub-shapes A-E with E as headline; will be folded into FR wiki by Callimachus when ratified.

## Gold star: Hopper's discipline

This was Hopper's first-ever dispatch. The role of Deployment Operator was designed (S33+ wrap, 2026-05-19) around hard-gate surface-back discipline and within-dispatch agency limits. The dispatch encountered four ambiguity gates and one substrate-degradation gate -- every single one was caught cleanly, no silent re-classification, no proceed-on-partial-information, no scope-broadening. The within-dispatch-agency JSON-labels probe (Hopper's autonomous interpretation of an empty-result puzzle) is the textbook example of the boundary working as designed.

The operations-log entry from this dispatch will be a public artifact for future operators -- both inside FR and externally. The first-dispatch-is-audit-grade bias paid compound interest: the audit trail produced by these surface-backs documents not just the diagnostic arc but the role's design intent in operation.

---

**Status when this memo was written:** Hopper closing out (ops-log + scratchpad write per close-out instructions). Brunel preparing scratchpad capture. Aen preparing this memo. No further substrate touches pending PO direction in a future engagement.

(*FR:Aen*)

---

## Phase 2 Success Update -- 2026-05-21

PO clarified mid-session that apex team had voluntarily taken their AI agents offline specifically to enable our recreate without disrupting their work -- the down-state IS the maintenance window. Phase-1-Redux (Tier M `.env` reconstruction) + Phase 2 (Tier D recreate) executed end-to-end against the apex production substrate in this window. **Original ask ACHIEVED 09:18 on 2026-05-21.**

Final substrate state on apex-research container:
- `authorized_keys`: 3 keys installed by entrypoint Step 7 (PO + Aleksandr + rc-connect)
- Config.Env: all declared tokens propagated (SSH_PUBLIC_KEY×3, GITHUB_TOKEN, GH_TOKEN, ANTHROPIC_API_KEY, ATLASSIAN_*)
- Named volumes preserved: `apex-claude-home`, `apex-research-repo`, `apex-source-data`
- Future recreates reproduce the same state (canonical `.env` at `$COMPOSE_DIR` + amended operational compose-yml are the substrate baseline)

PO direction during execution superseded the original "substrate-correction normalization" plan with explicit GH_TOKEN preservation ("if they have it right now, then why would we take away from them"). P4.05 Tier M compose-yml amendment added `- GH_TOKEN=${GH_TOKEN:-}` to apex-research's `environment:` block before P4.2 recreate.

Execution amendments (substrate-truth-anchored, Hopper hard-gate caught):
- P3.6 amendment-1: backup `.env` SLOT 3 unquoted breaks `source` under `set -e`; switched to grep-extract per token
- P3.6 amendment-2: pass-criterion regex `[A-Z_]+` rejects digits; corrected to POSIX `[A-Z_][A-Z0-9_]*`
- Phase 2 PO 19:35 reversal: GH_TOKEN preserved via P4.05 instead of "normalized out"
- P4.05 amendment-2: PowerShell→bash→awk multi-layer escape chain failed at awk's string grammar; fixed via printf `%s%s` string-concatenation

Pattern catalog filed for Cal-Protocol-A submission next session (Brunel + Hopper joint drafts in scratchpads):
1. `wiki/patterns/discriminator-anchored-on-sub-canonical-source.md` -- n=4 catalog with A.1 (identifier-grammar) and A.2 (multi-layer-transit) sub-distinctions
2. `wiki/patterns/three-layer-substrate-truth-discipline.md` -- joint architectural-and-operator-defense entry; sub-shape E as headline
3. Hopper-Amendment-4 (three-layer Diagnostic Discipline prompt amendment) -- Celes-routed for ratification

Audit trail: 6 append-only entries in `teams/framework-research/docs/operations-log-2026-05.md` spanning the full dispatch arc (17:09 original abort → 18:05 first correction → 18:22 revert-correction → 18:46 P2 diff probe → 19:23 Phase 1 close → 09:18 Phase 2 close).

Apex team came back online ~09:30 post-rebuild; substrate is canonical-recreate-safe; they should notice no disruption.

The "Open questions for PO" section above is now mostly resolved: questions 2-5 were either answered in-execution (slot assignment, compose method, GH_TOKEN preservation, restoration approach) or remain as future FR-side work items (compose-yml design refresh, formalize three-layer cross-read discipline as Hopper-Amendment-4). Question 6 (formalize the three-layer discipline) is the one open item that flows to next-session Celes-routed work.

(*FR:Aen*)
