# Operations Log — 2026-05 (*FR:Hopper*)

Append-only operations log per `teams/framework-research/prompts/hopper.md` (Provenance — Role-of-Record section). Each entry has all 8 required fields. No edits to prior entries; corrections go as new entries referencing the original by timestamp.

---

## 2026-05-20T17:09+03:00 — apex-research authorized_keys Phase 1 prep (ABORTED MID-EXECUTION)

**timestamp** — 2026-05-20T17:09+03:00 (dispatch landed), through 2026-05-20T17:41+03:00 (HALT per PO direction), close-out written 2026-05-20T17:43+03:00.

**tasker** — Brunel (pair-loop with Aen for major escalation gates; PO direction relayed via Aen at 17:37).

**dispatch summary** — apex-research authorized_keys Phase 1 prep — staged SSH_PUBLIC_KEY_2 in host `.env`. ABORTED MID-EXECUTION after substrate-truth probes revealed degraded substrate state (no operational `.env`; container is a 2026-04-29 fresh-clone survivor; recreate today = full SSH lockout). PO direction: stop and re-evaluate.

**tier classification + sanction status** — by step:

- **P1.1** = Tier R (default-permitted)
  - First attempt FAILED at hard-gate: dispatched filter regex `michelek\s*$` matched neither key in live `/home/ai-teams/.ssh/authorized_keys` (both keys had different comment shapes from the `.env.example:13` template the regex anchored on). Surfaced to Brunel at 17:12.
  - Brunel **amendment-1** at 17:13 — replaced filter with positive-select: `$_ -match 'aleksandr' -and $_ -notmatch 'mihkel' -and $_.Trim() -ne ''`. Quoted verbatim:
    > "Positive-select on `aleksandr` token captures exactly LINE 2. Belt-and-suspenders `-notmatch 'mihkel'` defends against a hypothetical future where PO's comment ever contains `aleksandr`."
  - Second attempt PASSED. $alekKey captured (length 114).
- **P1.2a** (substrate locate) = Tier R (default-permitted)
  - `find` probe returned 2 candidate compose-dirs. Surfaced to Brunel at 17:16 per dispatch's "2+ matches → surface; do not guess."
  - Brunel **amendment-2** at 17:18 → 17:19 — Option B (docker inspect compose-project-working-dir label). Original key had underscore typo; corrected to dot-form `com.docker.compose.project.working_dir` at 17:19.
  - Within-dispatch-agency JSON-labels dump (Tier R, allowed scope) disambiguated authoritatively: $COMPOSE_DIR = `/home/dev/github/apex-migration-research`. P1.2a CLEARED.
- **P1.2b** (.env writability) = Tier R (default-permitted)
  - Probe revealed `.env` does NOT exist at $COMPOSE_DIR. Substrate disagrees with dispatch's fix-premise. Surfaced to Brunel at 17:23.
- **P1.2c** (3-probe diagnostic batch) = Tier R (Aen-sanctioned via Brunel **amendment-3** at 17:27)
  - Three probes via base64-transit: container Config.Env grep, docker compose config rendered output, filesystem env-file search.
  - Revealed degraded substrate state. **H5 hypothesis** (stable-state container survivor from pre-2026-04-29 fresh-clone) confirmed.
- **P1.2d** (backup .env read) = Tier R (Aen-sanctioned with verbatim hard-gate at 17:34)
  - Aen sanction verbatim: *"The backup `.env` is information, not destiny — we don't restore from it without PO direction."*
  - Pure `cat` read, no mutations. Secret-redaction discipline applied: mask all-but-first-4 chars for credential lines, verbatim for SSH_PUBLIC_KEY* (public-by-definition).
  - Brunel retroactively rescinded the P1.2d sanction at 17:41 along with the rest of Phase 1, but execution was clean and audit-logged before rescission. No undo needed.

**No Tier M or D ever executed.** Phase 2 sanction package (r3) formally rescinded by Aen at 17:34 pending re-architecture.

**deployed-artifacts-read declaration** — paths read at session start (pre-execution discipline, FR-design layer):

- `designs/deployed/apex-research/container/entrypoint-apex.sh:166-196` (Step 7 SSH keys block — env-var enumeration loop + install for both `michelek` and `ai-teams` users + sshd start on port 2222 + else-warning branch)
- `designs/deployed/apex-research/container/docker-compose.yml:47-60` (environment block, includes SSH_PUBLIC_KEY and SSH_PUBLIC_KEY_2 — but NOT SLOT 3, which the operational substrate has; design-vs-operational drift)
- `designs/deployed/apex-research/container/.env.example:13` (template stub `SSH_PUBLIC_KEY="ssh-ed25519 AAAA... michelek"` — load-bearing for P1.1's amended-filter analysis; the `michelek` token in the template did not survive into operational PO key comment)

In-execution substrate-truth reads (Layer 2 + Layer 3, surfaced via Tier R probes):

- Container Config.Env via `docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^SSH_PUBLIC_KEY'` (Layer 3)
- Container labels JSON dump via `docker inspect apex-research --format '{{json .Config.Labels}}'` (Layer 3)
- Operational compose-yml rendered via `docker compose config 2>&1 | grep -E 'env_file|SSH_PUBLIC_KEY' -A 1` (Layer 2)
- Filesystem env-file search via `ls -la` + `find -maxdepth 4` (Layer 2)
- Backup `.env` content via `cat '/home/dev/github/apex-migration-research.pre-fresh-clone-2026-04-29/.env'` (Layer 2 archival)

**commands executed** — verbatim, all Tier R:

- P1.1 (first attempt, FAILED at hard-gate):
  - `ssh -i $env:USERPROFILE\.ssh\id_ed25519_apex -p 2222 -o StrictHostKeyChecking=accept-new -o BatchMode=yes ai-teams@100.96.54.170 "cat /home/ai-teams/.ssh/authorized_keys"`
- P1.1 (second attempt with Brunel amendment-1, PASSED):
  - same ssh invocation; filter changed to `Where-Object { $_ -match 'aleksandr' -and $_ -notmatch 'mihkel' -and $_.Trim() -ne '' }`
- P1.2 locate-probe:
  - `ssh -T -o StrictHostKeyChecking=accept-new -o BatchMode=yes dev@100.96.54.170 'ls -la ~/apex-research/ 2>/dev/null || ls -la ~/docker/apex-research/ 2>/dev/null || ls -la ~/ai-teams/apex-research/ 2>/dev/null; echo "---FIND---"; find ~/ -maxdepth 4 -name docker-compose.yml -path "*apex*" 2>/dev/null'`
- P1.2a label probe (with Brunel amendment-2 dot-form key, via base64-transit):
  - remote literal: `docker inspect apex-research --format '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}' 2>/dev/null`
  - transport: `ssh -T dev@100.96.54.170 "echo '<b64>' | base64 -d | bash"`
- P1.2a within-dispatch-agency JSON-labels dump:
  - remote literal: `docker inspect apex-research --format "{{json .Config.Labels}}" 2>&1`
- P1.2b .env writability probe:
  - `ssh -T dev@100.96.54.170 "ls -la '/home/dev/github/apex-migration-research/.env' 2>&1; echo WHOAMI; whoami; id"`
- P1.2c Probe 1 (container Config.Env):
  - remote literal: `docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^SSH_PUBLIC_KEY'`
- P1.2c Probe 2 (docker compose config):
  - remote literal: `cd /home/dev/github/apex-migration-research && docker compose config 2>&1 | grep -E 'env_file|SSH_PUBLIC_KEY' -A 1`
- P1.2c Probe 3 (filesystem env-file search):
  - remote literal: `ls -la /home/dev/github/apex-migration-research/.env* /home/dev/github/apex-migration-research/*.env 2>/dev/null; echo '---LSDONE---'; find /home/dev/github/apex-migration-research -maxdepth 2 -name '.env*' 2>/dev/null; echo '---FIND1DONE---'; find ~/ -maxdepth 3 -name '.env' -path '*apex*' 2>/dev/null`
- P1.2d backup .env read (Aen-sanctioned):
  - remote literal: `cat '/home/dev/github/apex-migration-research.pre-fresh-clone-2026-04-29/.env'`

All ssh exit codes 0. No mutations to RC bare-metal host or apex-research container at any point in the dispatch.

**outputs** — relevant excerpts (full output in surface-back chain to Brunel):

- **P1.1 (second attempt):** $alekKey captured = `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBPYh4HpFbc/ftGYS6NndGaFk9Oc3C+IO8+cuv1i4GOb ghost-bridge@aleksandr-2026-05-15` (length 114). Belt-and-suspenders both passed (`-match aleksandr`=True, `-notmatch mihkel`=True). Tempfile round-trip verified byte-equal.
- **P1.2 locate:** 2 hits — `/home/dev/github/apex-migration-research/docker-compose.yml` (operational) and `/home/dev/github/apex-migration-research.pre-fresh-clone-2026-04-29/docker-compose.yml` (pre-fresh-clone backup). Surface-back at 17:16.
- **P1.2a label probe (corrected key):** `/home/dev/github/apex-migration-research` — matches operational hit. **$COMPOSE_DIR = `/home/dev/github/apex-migration-research`** canonical.
- **P1.2a JSON-labels dump:** confirmed `com.docker.compose.project.working_dir` = `/home/dev/github/apex-migration-research` and `com.docker.compose.project.config_files` = `/home/dev/github/apex-migration-research/docker-compose.yml`. Compose version label `5.1.0` (v2 dot-form label namespace).
- **P1.2b .env writability:** `ls: cannot access '/home/dev/github/apex-migration-research/.env': No such file or directory`. Host user = `dev` (uid 1000, in `docker` + `sudo` groups). Substrate-access shape correct; the file just doesn't exist where the dispatch assumed.
- **P1.2c Probe 1:** `SSH_PUBLIC_KEY_2=ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKR5R4Ob4zeW4H1p8rhjYajOa+mzqyjITzB6RmY4iBp/ mihkel.putrinsh@evr.ee apex-research` (PO's key in SLOT 2) and `SSH_PUBLIC_KEY=` (slot 1 empty). Aleksandr's key absent — confirms it was injected via docker exec onto the ephemeral container layer.
- **P1.2c Probe 2:** All three slots resolve empty: `SSH_PUBLIC_KEY: ""`, `SSH_PUBLIC_KEY_2: ""`, `SSH_PUBLIC_KEY_3: ""`. No `env_file:` directive. Operational compose-yml exposes a SLOT 3 not present in FR-design `docker-compose.yml:53-54`.
- **P1.2c Probe 3:** Only `.env.example` (template) at $COMPOSE_DIR; no `.env`. Backup `.env` at sibling `.pre-fresh-clone-2026-04-29/.env` (frozen 2026-04-29). Unrelated `.env` at `vjs_apex_apps/.env` (separate repo).
- **P1.2d backup .env content** (secrets first-4-chars masked; pubkeys verbatim):

  ```
  GITHUB_TOKEN=gho_<REDACTED 36 chars>
  ANTHROPIC_API_KEY=
  SSH_PUBLIC_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKR5R4Ob4zeW4H1p8rhjYajOa+mzqyjITzB6RmY4iBp/ mihkel.putrinsh@evr.ee apex-research"
  ATLASSIAN_EMAIL="mihkel.putrinsh@evr.ee"
  ATLASSIAN_API_TOKEN="ATAT<REDACTED 188 chars>"
  ATLASSIAN_BASE_URL="https://eestiraudtee.atlassian.net"
  TUNNEL_TOKEN=eyJh<REDACTED 213 chars>
  SSH_PUBLIC_KEY_3=ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIO2fgnCIWJjcNpgo/rjGmF5e0fr35qupLHAFk57qU6tB rc-connect
  ```

**Key cross-walk contradictions across the substrate-truth layers:**

- Backup `.env` has PO's key in **SLOT 1** (value-quoted); running container has PO's key in **SLOT 2** (Config.Env). Slot-migration happened between backup-creation (≤2026-04-29) and current container-create. PO via Aen 17:37 said "I don't remember" for Q1 (fresh-clone without `.env` restore) — likely oversight. Q3' (when/why the slot migration happened) was NOT pursued; PO directed halt before re-engaging.
- Operational `docker-compose.yml` has SLOT 3; FR-design `docker-compose.yml:47-60` has only SLOTS 1+2. PO via Aen 17:37 said SLOT 3 is "reserved for future key, never populated." Backup `.env` (frozen 2026-04-29) shows `SSH_PUBLIC_KEY_3=...rc-connect` — apparent contradiction with PO's recollection. Possibly the rc-connect entry was experimental and abandoned, or PO doesn't recall it. **Documented per Brunel close-out instruction; not adjudicating.**
- Multi-system failure surface: backup `.env` has GITHUB_TOKEN, ATLASSIAN_API_TOKEN, TUNNEL_TOKEN. These are absent from current operational state. A `docker compose up --force-recreate` today would wipe all three alongside the SSH keys — incident surface is broader than SSH-lockout, encompasses GitHub auth + Atlassian auth + Cloudflare tunnel auth.

**outcome** — **aborted-mid-execution** (canonical enum value per `hopper.md` prompt `outcome` field). Reason: PO direction (via Aen 17:37) after substrate-truth probes surfaced dispatch-premise-disagreement + degraded substrate state. No state mutations attempted at any point in the dispatch. Container substrate unchanged from pre-dispatch state (degraded-but-stable).

---

### Tasker-confirmed prevention framing

Per Brunel 17:33 + 17:39 and Aen-confirmed: this dispatch's hard-gate discipline prevented a **multi-system failure incident** (not just SSH-lockout). The r3 Phase-2 recreate plan, if executed against current substrate state, would have:

- Wiped all SSH_PUBLIC_KEY* slots in container Config.Env (compose config resolves them empty) → no `authorized_keys` written by entrypoint Step 7 → sshd refuses all logins → full SSH lockout for both PO and Aleksandr.
- Wiped GITHUB_TOKEN, ANTHROPIC_API_KEY, ATLASSIAN_API_TOKEN, ATLASSIAN_BASE_URL, ATLASSIAN_EMAIL, TUNNEL_TOKEN → broke GitHub clone-via-token, Anthropic CLI auth, Atlassian/Jira-MCP integration, Cloudflare tunnel.

**Credit attribution per Hopper-self-flag adopted by Brunel** (17:35): the prevention is structural, not personal — the dispatch design (sequential hard-gates between every step with explicit pass criteria + surface-back templates) and Tier-D-no-execute-without-full-sanction discipline did the work; Hopper's role was enforcement. The dispatch shape itself is the reusable pattern for other substrates.

### Sub-shape E manifestation — three-layer substrate-truth divergence

Per joint Brunel + Hopper synthesis (Brunel architectural framing, Hopper operator-defense pattern, Cal-Protocol-A submission planned for session wrap):

- **Layer 1 — FR design-as-shipped** (`designs/deployed/<team>/container/*` in this repo): canonical for design lineage.
- **Layer 2 — Consumer team operational copy** (e.g., `/home/dev/github/apex-migration-research/` on the substrate host): canonical for what compose actually reads at next `docker compose up`.
- **Layer 3 — Running container state** (Config.Env, mounted volumes, in-process state): canonical for what's serving traffic right now.

This dispatch concretely materialized BOTH drift surfaces simultaneously:

- **Layer-1-vs-Layer-2 drift:** FR design has 2 SSH_PUBLIC_KEY slots; operational compose-yml has 3 slots. Consumer team (apex) amended their copy without FR-side visibility.
- **Layer-2-vs-Layer-3 drift:** Current operational compose-yml resolves all 3 slots to empty; running container has SLOT 2 populated. Runtime carries state from before whatever event emptied the operational copy.

**Operator-defense pattern (Hopper-authored, joint cross-link to Brunel architectural framing):** when first-dispatching against any substrate, run a Tier R probe-suite that surfaces all three layers and reconcile before committing to a fix-shape. Single-layer reads (FR-design-only, as my current `hopper.md` Diagnostic Discipline prescribes) catch single-layer drift but miss cross-layer drift. **Surface as Hopper-Amendment-4 candidate to Celes at session wrap.**

### Cross-in-transit count (session artifact)

Final count: **n=11 instances** of tasker↔operator message-crossings in transit through this session. Framing per Brunel 17:33 acknowledged by Hopper 17:35: candidate is **cadence-driven** (high-frequency tasker↔operator pair-loop on async inbox transport) vs **substrate-driven** (Windows-session-local per `feedback_no_windows_substrate_findings.md`). Disambiguation requires Linux-substrate replication at similar cadence; pending until that observation lands. Filed as parallel candidate to the discriminator-anchoring pattern.

### Cal-Protocol-A submission planning (session-wrap)

Two joint-authorship submissions planned per S33+ discipline:

1. **`wiki/patterns/discriminator-anchored-on-sub-canonical-source.md`** — Brunel-attributed phrasing "discriminator anchored on a sub-canonical source." Two instances surfaced in this single dispatch:
   - P1.1 regex anchored on `.env.example:13` template stub (`michelek`), not on substrate-live state.
   - P1.2a probe label-key anchored on inferred underscore-form (`com.docker.compose.project_working_dir`), not on substrate-truth dot-form (`com.docker.compose.project.working_dir`).
   - Recovery pattern: substrate-live state is the canonical discriminator source; templates/inferences are stub-grade, not selector-grade. JSON-dump-when-single-probe-empty is the cheap Tier R diagnostic that recovers the truth in one round-trip.
2. **`wiki/patterns/three-layer-substrate-truth-discipline.md`** — joint authorship (Brunel architectural distinction + Hopper operator-defense pattern). Catalyzing incident: this ops-log entry, full surface-back chain (P1.1 amendment → P1.2a JSON-dump diagnostic → P1.2b premise-drift → P1.2c three-probe synthesis → P1.2d backup-read).

---

### Audit-trail surface (for future Hopper reference)

The full surface-back chain through this dispatch is a textbook example of the hard-gate discipline absorbing a series of substrate disagreements without any mutation reaching the substrate. Use this entry as a reference when sanction-completeness is questioned in future dispatches.

1. **P1.1 first-attempt FAIL** (regex anchored on template stub) → surface-back to Brunel + CC Aen → **amendment-1** (positive-select aleksandr) → P1.1 PASS
2. **P1.2a 2-candidate ambiguity** → surface-back with three re-dispatch options enumerated → **amendment-2** (docker inspect label probe) → 17:18 key had underscore typo → 17:19 correction to dot-form → within-dispatch-agency JSON-dump diagnostic resolved both the typo AND the candidate ambiguity in one Tier R probe → P1.2a PASS
3. **P1.2b premise-drift** (`.env` does not exist at $COMPOSE_DIR) → surface-back with three re-dispatch options → Brunel escalates to Aen at 17:25 → **amendment-3** (P1.2c three-probe diagnostic batch) sanctioned
4. **P1.2c three-probe execution** → revealed degraded substrate; H5 hypothesis (stable-state pre-fresh-clone container survivor) confirmed → multi-system failure surface acknowledged
5. **P1.2d Aen-sanctioned backup-read** with verbatim "information not destiny" hard-gate → executed clean; revealed slot-migration timeline + SLOT 3 rc-connect entry + full credential cluster in backup
6. **PO direction "stop and re-evaluate"** via Aen 17:37 → Brunel HALT close-out at 17:41 → ops-log + scratchpad written, this entry → idle

(*FR:Hopper*)

---

## 2026-05-20T18:05+03:00 — CORRECTION ENTRY (substrate-scope qualifier for 2026-05-20T17:09 entry)

**Format note:** per Provenance discipline ("The log is append-only; you may not edit prior entries — corrections go as new entries that reference the original by timestamp"), this is a NEW entry referencing the 17:09 entry by timestamp. The 17:09 entry stands unedited; this entry adds the host-scope qualifier and the substrate-selection-error attribution.

**timestamp** — 2026-05-20T18:05+03:00 (correction written).

**tasker** — Brunel (substrate-selection error attribution by self) and Aen (informational amendment relay at 17:58, post-PO surface).

**dispatch summary** — Correction to the 2026-05-20T17:09 entry's substrate-scope. The diagnostic operated against `dev@100.96.54.170:22` (host) + `ai-teams@100.96.54.170:2222` (container) per `~/bin/rc-deployments.json` entries `num:"1"` and `num:"2"`. **Post-execution attribution (Aen 17:58, Brunel 17:59): these registry entries refer to RC-server, a non-production host that happens to host an `apex-research`-named container. The canonical production apex deployment is `~/bin/rc-deployments.json` entry `num:"9"` — PROD-LLM at `michelek@10.100.136.162:22`, key `id_ed25519_apex`. Production apex was NOT touched in the 2026-05-20 dispatch and its state remains unknown.**

**tier classification + sanction status** — N/A (this is a documentation correction, not an operational dispatch; no substrate touches). Original 17:09 entry's tier classifications and Aen 17:34 Phase-2-r3 rescission stand unmodified.

**deployed-artifacts-read declaration** — None for this correction entry. The 17:09 entry's declarations stand: those reads applied to FR's `designs/deployed/apex-research/container/*` (which is the design lineage; the consumer team that operationally uses these may be either RC-server or PROD-LLM or both — FR-design is host-agnostic).

**commands executed** — None. Pure documentation correction.

**outputs** — Implications of the substrate-scope correction:

1. **All "degraded substrate" findings in the 17:09 entry apply to RC-server (100.96.54.170), NOT to PROD-LLM.** RC-server's apex container Config.Env has PO key in SLOT 2, has no `.env` at `$COMPOSE_DIR`, has multi-system credential dependency on baked-in env from before 2026-04-29 fresh-clone. **None of these statements have been verified for PROD-LLM.** PROD-LLM apex state remains unknown.
2. **The original PO ask (Aleksandr's key persistence on the apex PO actually uses) is unaddressed.** The diagnostic ran against the wrong host; the production substrate has not been examined.
3. **Findings retain audit value at host-scope.** The discipline lessons (hard-gate culture caught the substrate-degradation; multi-system failure prevented on the substrate where the recreate would have occurred) are host-agnostic. The substrate-truth findings are RC-server-scoped.

**Attribution of the substrate-selection error** — Per Brunel 17:59 verbatim: *"The error is mine. I picked registry entries that looked like the apex pattern by inspection (num:2 even has `name: 'apex-research'`) without verifying canonical production. Your discipline correctly followed the dispatch text; the substrate-selection failure is upstream of your execution."* Per Aen 17:58: the correction is upstream of Hopper's execution; the audit trail of the 17:09 entry stays as written.

**Sub-shape F catalogued** — Aen-named *registry-entry-choice-from-first-match*: picking the first registry entry matching the target substrate name without confirming canonical-production status. Joins the Cal-Protocol-A submission catalog (Sub-shapes A-F per Brunel's session-scratchpad). Cross-references the 17:09 entry's "Audit-trail surface" section as catalyzing incident.

**outcome** — **documentation-correction-applied** (not an operational outcome). The 17:09 entry's `aborted-mid-execution` outcome stands unchanged; this correction adds substrate-scope qualifier without altering the operational record.

**Cross-references:**
- `teams/framework-research/memory/hopper.md` was updated at 18:02 per Aen's 17:58 informational amendment: 6 entries relabeled from `apex-research` to `RC-server (100.96.54.170)`; 2 new entries added (`[LEARNED — substrate, apex-PROD-LLM]` placeholder + `[LEARNED — discipline, substrate-selection]` Sub-shape F).
- `teams/framework-research/docs/apex-keys-dispatch-2026-05-20-findings.md` (Aen's PO-facing memo) has the wrong-host correction prominently at the top.

(*FR:Hopper*)

---

## 2026-05-20T18:22+03:00 — REVERT-CORRECTION ENTRY (supersedes 2026-05-20T18:05; restores 17:09 substrate-target as correct)

**Format note:** per Provenance discipline (append-only; corrections go as new entries referencing the original by timestamp). This entry references **both** the 2026-05-20T17:09 original entry and the 2026-05-20T18:05 first-correction entry by timestamp. Neither is edited in place; the chronological order on disk preserves the full confusion-and-resolution audit trail.

**timestamp** — 2026-05-20T18:22+03:00 (revert-correction written).

**tasker** — Aen (revert instruction at 18:19, post-PO 18:08 registry re-check).

**dispatch summary** — Revert-correction supersedes the 2026-05-20T18:05 substrate-scope correction entry. PO re-checked `~/bin/rc-deployments.json` himself at 18:08 and confirmed the 17:09 entry's substrate-target was correct the entire time. The 18:05 correction was itself based on a transient PO mis-read of the registry, not a real substrate-selection error. Apex production runs at `100.96.54.170` (registry entry `num:"1"` for host SSH + `num:"2"` for container SSH on port 2222) — exactly what the 17:09 dispatch operated against. The registry entry `num:"9" PROD-LLM` is a separate system, **NOT** the apex production deployment. The 17:09 entry stands as the canonical record of dispatch-as-executed; the 18:05 entry stands as documented confusion-and-resolution audit trail; this 18:22 entry supersedes both with the resolved state.

**PO's verbatim 18:08 registry confirmation** (relayed via Aen 18:19):

> - `num:1 RC-server 100.96.54.170 22 (default)` — host SSH ✓ exactly what your dispatch cited
> - `num:2 apex-research 100.96.54.170 2222 id_ed25519_apex` — container SSH ✓ exactly what your dispatch cited
> - `num:9 PROD-LLM` is a SEPARATE system, NOT the apex production. PO's earlier surfacing of `num:9` was a transient mis-read on his side; he corrected after re-checking.

**tier classification + sanction status** — N/A (documentation revert-correction; no substrate touches). Original 17:09 entry's tier classifications and Aen 17:34 Phase-2-r3 rescission stand unmodified.

**deployed-artifacts-read declaration** — None for this revert-correction entry.

**commands executed** — None. Pure documentation revert-correction.

**outputs** — Implications of the revert-correction:

1. **The 17:09 entry's substrate-truth findings ARE operationally real for the apex production substrate.** Degraded state at $COMPOSE_DIR (no operational `.env`), container surviving on Config.Env baked pre-2026-04-29 fresh-clone, multi-system credential dependency on baked-in env — all of these statements describe the actual production apex substrate. Not a parallel non-production substrate.
2. **The original PO ask (Aleksandr's key persistence on the apex container) IS addressable on this substrate**, legitimately deferred to apex team's post-maintenance window per Aen 17:34 Phase-2-r3 rescission pending re-architecture.
3. **Sub-shape F (registry-entry-choice-from-first-match) is WITHDRAWN from the Cal-Protocol-A catalog candidate list.** No valid instance from this dispatch. Catalog reverts to Sub-shapes A-E.
4. **Phase 2 sanction package r3 remains formally rescinded by Aen 17:34** — that rescission was based on the substrate-truth probes from P1.2c (which are now confirmed operationally real for production), not on the spurious substrate-selection error. Future Phase 2 against apex-research still requires `.env` reconstruction prerequisite + new sanction package; the rescission stands.

**Attribution of the documentation confusion** — Per Aen 18:19: PO's 18:08 self-correction supersedes his earlier 17:47 surfacing of `num:9`. Brunel's 17:59 attribution ("The error is mine") and Aen's 17:58 informational amendment were both downstream consequences of the same upstream PO transient mis-read. No tasker-side or operator-side process failure; the discipline-honoring artifact updates I executed at 18:02 (scratchpad) and 18:05 (ops-log) were correct enforcement of the instructions-as-given-at-the-time. They've been reverted because the premise was invalidated, not because the discipline was wrong.

**Lesson (folded into scratchpad)** — Even after discipline-honoring artifact updates (append-only ops-log corrections + scratchpad amendments), be willing to revert when the original premise is invalidated. **Discipline serves accuracy, not consistency-with-prior-correction.** The append-only ops-log chain (17:09 → 18:05 → 18:22) preserves the full confusion-and-resolution audit trail for future readers; scratchpad reverts to pre-amendment state because scratchpad is working-memory, not append-only audit log.

**outcome** — **documentation-revert-correction-applied**. The 17:09 entry's `aborted-mid-execution` operational outcome stands unchanged and is now confirmed as the canonical record. The 18:05 entry's `documentation-correction-applied` outcome stands but is superseded by this entry. No operational outcome changes for any tier-classified step.

**Cross-references:**
- `teams/framework-research/memory/hopper.md` reverted at 18:21 per Aen 18:19: 6 substrate entries restored from `RC-server (100.96.54.170)` back to `apex-research` (with section-header revert); `[LEARNED — substrate, apex-PROD-LLM]` placeholder deleted; `[LEARNED — discipline, substrate-selection]` (Sub-shape F) deleted; new `[LEARNED — discipline, revert-on-invalidated-premise]` added capturing the lesson.
- `teams/framework-research/docs/apex-keys-dispatch-2026-05-20-findings.md` (Aen's PO-facing memo) — Aen may update independently to reflect the revert; not my MAY-WRITE path.

(*FR:Hopper*)

---

## 2026-05-20T18:46+03:00 — P2 apex-research diff probe (Aen-direct, Tier R only)

**timestamp** — 2026-05-20T18:46+03:00. **tasker** — Aen (direct, not paired with Brunel; PO-directed probe-only, no design composition). **dispatch summary** — Two Tier R probes against apex-research substrate (host SSH `dev@100.96.54.170:22`) to build raw diff artifact for PO's later review: (P2.1) `docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}'` for running-container Config.Env; (P2.2) `cat /home/dev/github/apex-migration-research.pre-fresh-clone-2026-04-29/.env` for fresh-verbatim backup re-read. Both via base64-transit; both ssh exit 0; zero substrate mutations.

**tier classification + sanction status** — P2.1=R, P2.2=R (both default-permitted). No Tier M/D. Phase-2 r3 rescission of 17:34 stands.

**deployed-artifacts-read declaration** — per Aen 18:40 instruction: scratchpad's substrate-facts section at `teams/framework-research/memory/hopper.md:5-17` serves as the per-dispatch substrate-read for apex-research. No additional FR-design artifact reads needed; substrate facts current from earlier in-session probing.

**commands executed** — `ssh -T dev@100.96.54.170 "echo '<b64>' | base64 -d | bash"` with two base64-encoded remote literals: `docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}'` (P2.1) and `cat '/home/dev/github/apex-migration-research.pre-fresh-clone-2026-04-29/.env'` (P2.2).

**outputs** — Diff artifact written to `teams/framework-research/docs/apex-keys-diff-2026-05-20.md` with side-by-side table per key (backup LEFT, Config.Env RIGHT), redaction policy (token values first-4-chars + length; SSH_PUBLIC_KEY* verbatim as public-by-definition), and 6 descriptive observations. Hard-gate check passed: Config.Env `SSH_PUBLIC_KEY_2` value equals byte-for-byte the P1.1-captured PO pubkey from 17:14 → P1.2c-confirmed at 17:28 → still equal at 18:42. Substrate state unchanged across the dispatch arc.

**outcome** — **success** — diff artifact at `teams/framework-research/docs/apex-keys-diff-2026-05-20.md`; no anomalies to surface beyond what the diff itself documents (one filter-adjacent `GH_TOKEN` observation noted in artifact footnote).

(*FR:Hopper*)

---

## 2026-05-20T19:23+03:00 — Phase-1-Redux P3 apex-research .env reconstruction (Tier R + Tier M)

**timestamp** — 2026-05-20T19:04+03:00 (dispatch landed) through 2026-05-20T19:23+03:00 (close-out).

**tasker** — Brunel (Phase-1-Redux dispatch authored, inlined from `designs/new/apex-keys-phase1-redux-dispatch.md` abfb026 outside Hopper's MAY-READ scope; relay = primary per `relay-to-primary-artifact-fidelity-discipline.md`). PO sanction verbatim "Approve as drafted" at 19:01 captured the maintenance window (apex AI agents voluntarily offline = down-state IS the window). Phase 2 Tier D recreate dispatch queued by Brunel for immediate relay on P3.8 success.

**dispatch summary** — Reconstruct `.env` at `$COMPOSE_DIR=/home/dev/github/apex-migration-research` to stage Phase-2 recreate without lockout. PO slot assignment: SLOT 1 = PO pubkey, SLOT 2 = Aleksandr pubkey, SLOT 3 = rc-connect pubkey. Tokens sourced from 2026-04-29 backup `.env` at sibling `$BACKUP_DIR`; GH_TOKEN sourced from running container Config.Env (post-fresh-clone addition). Supersedes the rescinded r3 Phase-1 dispatch from 17:09. Operation completed successfully with two tasker amendments (regex + pass-criterion corrections).

**tier classification + sanction status** — by step:

- **P3.1** = Tier R (substrate-state-unchanged check) — default-permitted. PASS: Config.Env SSH_PUBLIC_KEY_2 byte-equal to documented PO pubkey from 18:46 P2 diff entry. No substrate drift since dispatch arc start.
- **P3.2** = Tier R (Aleksandr pubkey re-extraction) — default-permitted. PASS: $alekKey 114 chars, matches P1.1 17:14 capture byte-for-byte.
- **P3.3** = Tier R (PO pubkey extraction from Config.Env) — default-permitted. PASS: $poKey 117 chars.
- **P3.4** = Tier R (rc-connect pubkey extraction from backup `.env`) — default-permitted. PASS: $rcKey 91 chars, ends `rc-connect`.
- **P3.5** = Tier R (GH_TOKEN extraction from Config.Env) — default-permitted. PASS: $ghToken 40 chars, starts `gho_`. Held in session-local `%TEMP%` only; never persisted to repo artifact.
- **P3.6** = Tier M (`.env` write at `$COMPOSE_DIR/.env`). Brunel single-line ack quoted verbatim:
  > "I sanction this Tier M op. The substrate's docker-compose.yml is designed for `.env` at `$COMPOSE_DIR/.env`; writing this file is the canonical lifecycle path. Backup `.env` at `$BACKUP_DIR/.env` remains untouched as rollback. Operation is reversible by `rm $COMPOSE_DIR/.env` (returns substrate to pre-write state). — Brunel"

  **P3.6 amendment chain:**
  - P3.6 original (dispatch 19:04): used `set -a; source $BACKUP_DIR/.env; set +a` to load token vars. **FAILED at 19:12** — backup `.env` line 11 contains `SSH_PUBLIC_KEY_3=ssh-ed25519 AAAA... rc-connect` UNQUOTED (other backup .env SSH lines are double-quoted; SLOT 3 is not). With `set -e` enabled, bash `source` parsed `SSH_PUBLIC_KEY_3=ssh-ed25519` as the assignment then tried to exec the rest as a command, exit 127. The `cat > .env <<EOF` never ran. Tier R post-fail substrate check (19:13) confirmed no `.env` written (substrate in pre-P3 state). Surfaced to Brunel with 4 re-dispatch options.
  - P3.6 amendment-1 (Brunel 19:14): Option B adopted — drop `source`; replace with explicit `grep+cut+strip-quotes` per token (same shape as P3.3/P3.4/P3.5 for pubkeys). More substrate-truthful (no dependency on backup .env being syntactically valid bash). Execution succeeded; `.env` written at 19:17 (1270 bytes, dev:dev). But pass-criterion `grep -c '^[A-Z_]\+=' .env == 10` returned 8 — surfaced as substrate-correct-but-criterion-wrong.
  - P3.6 amendment-2 (Brunel 19:21): pass-criterion regex corrected from `[A-Z_]+=` to POSIX-envvar canonical `[A-Z_][A-Z0-9_]*=`. Root cause acknowledged by Brunel as Sub-shape A in his own criterion (`[A-Z_]+` rejects digits; SSH_PUBLIC_KEY_2/_3 didn't match). Re-verify at 19:22: 3 SSH_PUBLIC_KEY lines + 10 envvar lines. PASS.

  **Three Sub-shape A instances surfaced in this single dispatch arc (P1.1 michelek-regex, P1.2a label-key-typo, P3.6-amendment-1 character-class-too-narrow).** Brunel filing for session-end Cal entry as n=3 within-dispatch reinforcement.

- **P3.7** = Tier R (`docker compose config` parse verify) — default-permitted. PASS at 19:22: rendered output shows all 3 SSH_PUBLIC_KEY* slots populated with the captured pubkeys (PO/Aleksandr/rc-connect), GITHUB_TOKEN resolved, ATLASSIAN_EMAIL/API_TOKEN/BASE_URL resolved, ANTHROPIC_API_KEY empty (same shape as backup; not a defect). ssh exit 0, no stderr. Read-only; did NOT touch running container.

  **One observation surfaced (not a hard-gate failure):** `GH_TOKEN` and `TUNNEL_TOKEN` are in `.env` but do NOT appear in `docker compose config` rendered output. The compose-yml's `environment:` block at `designs/deployed/apex-research/container/docker-compose.yml:47-60` declares explicit keys (SSH_PUBLIC_KEY*, GITHUB_TOKEN, ATLASSIAN_*, etc.) but does NOT include `GH_TOKEN` or `TUNNEL_TOKEN`. The compose config render shows only the keys it knows about. These vars are still IN the `.env` and will be read by anything that sources the file (e.g., entrypoint scripts via env-file mechanism), but they're not propagated into the container's `Config.Env` unless explicitly declared in compose-yml. Documented; Brunel may decide whether to amend the operational compose-yml in a separate dispatch (apex-team's domain).

- **P3.8** = Tier R + log + scratchpad write to MAY-WRITE paths. **THIS ENTRY.**

**No Tier D in P3.** Phase 2 Tier D recreate is a SEPARATE FUTURE DISPATCH (queued by Brunel for relay on this P3.8 success).

**deployed-artifacts-read declaration** — per Brunel dispatch's audit declaration + my Diagnostic Discipline three-layer reading (candidate Hopper-Amendment-4):

- **Layer 1 (FR design-as-shipped):** `designs/deployed/apex-research/container/entrypoint-apex.sh:166-196` (Step 7 multi-key enumeration loop) + `designs/deployed/apex-research/container/docker-compose.yml:47-60` (environment block, FR-design has SLOTS 1+2 only — operational has SLOT 3; documented Layer-1-vs-Layer-2 drift)
- **Layer 2 (consumer team operational, substrate host):** operational compose-yml on $COMPOSE_DIR confirmed to have SSH_PUBLIC_KEY_3 slot exposed (per P1.2c Probe 2 + P3.7 rendered compose config). $BACKUP_DIR `.env` line-11 substrate-truth: `SSH_PUBLIC_KEY_3=...` UNQUOTED (vs other SSH lines double-quoted) — this is what broke P3.6 first-attempt `source`.
- **Layer 3 (running container Config.Env):** PO pubkey in SLOT 2 (not SLOT 1) confirmed P3.1; same value as P1.1/P1.2c/P2.1 captures — substrate stable across dispatch arc. GH_TOKEN present in Config.Env (post-fresh-clone addition, P3.5 captured).
- **Audit-trail artifacts (this repo):** `teams/framework-research/docs/operations-log-2026-05.md` (Hopper-authored; current — five entries inc. this one), `teams/framework-research/docs/apex-keys-diff-2026-05-20.md` (Hopper at 18:44), `teams/framework-research/memory/hopper.md` (current).

**commands executed** — verbatim, all via base64-transit pattern through `ssh -T -o StrictHostKeyChecking=accept-new -o BatchMode=yes dev@100.96.54.170 "echo '<b64>' | base64 -d | bash"` (host-user) or `ssh -i ~/.ssh/id_ed25519_apex -p 2222 ai-teams@100.96.54.170 "<cmd>"` (container-user, P3.2 only):

- P3.1: `docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^SSH_PUBLIC_KEY_2='`
- P3.2 [container-user, port 2222]: `cat /home/ai-teams/.ssh/authorized_keys`; local filter `Where-Object { $_ -match 'aleksandr' -and $_ -notmatch 'mihkel' }`
- P3.3: `docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^SSH_PUBLIC_KEY_2=' | cut -d= -f2-`
- P3.4: `grep '^SSH_PUBLIC_KEY_3=' '/home/dev/github/apex-migration-research.pre-fresh-clone-2026-04-29/.env' | cut -d= -f2- | tr -d '"'`
- P3.5: `docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^GH_TOKEN=' | cut -d= -f2-`
- P3.6 amendment-1: remote multi-line bash script with `cd $COMPOSE_DIR`; `set -euo pipefail`; decode 4 base64 pubkey+token vars; define `strip_quotes()`; grep-extract 6 tokens from `$BACKUP/.env` with explicit unquoting; sanity-check GITHUB_TOKEN and TUNNEL_TOKEN non-empty; `cat > .env <<EOF` with 3 SSH_PUBLIC_KEY slots + 7 token vars; `ls -la .env`; count grep checks.
- P3.6 amendment-2 (verify only): `cd '$COMPOSE_DIR' && grep -c '^SSH_PUBLIC_KEY' .env; grep -c '^[A-Z_][A-Z0-9_]*=' .env`
- P3.7: `cd '$COMPOSE_DIR' && docker compose config 2>&1 | grep -E '^(\s+)?(SSH_PUBLIC_KEY|GITHUB_TOKEN|GH_TOKEN|ATLASSIAN|TUNNEL|ANTHROPIC)'`
- P3.8: this ops-log write + scratchpad update + SendMessage report.

**outputs** — relevant excerpts (full execution detail in surface-back chain to Brunel; secret-redaction discipline applied — pubkeys verbatim, tokens first-4 + length-suffix only in surface-backs; SHA-256 fingerprints in this ops-log entry):

- **Composed `.env` at `$COMPOSE_DIR/.env`** — 1270 bytes, dev:dev ownership, mtime 2026-05-20T19:17:27+03:00, LF line endings (confirmed via `cat -A`). Contains 3 SSH_PUBLIC_KEY slots + 7 token vars (GITHUB_TOKEN, GH_TOKEN, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN, ATLASSIAN_BASE_URL, TUNNEL_TOKEN, ANTHROPIC_API_KEY) + a header comment block documenting generation timestamp + PO slot assignment.

- **SHA-256 fingerprints of the three composed pubkeys** (full plaintext in $COMPOSE_DIR/.env, not duplicated here):
  - PO (SLOT 1): `8272813305f6057811e342a7c449517766fe052279ea729c92ad7db489f98c32`
  - Aleksandr (SLOT 2): `9646444b45e085e055ef3b287ecd39d95ea637e2bf73ac089e6b0b452c623879`
  - rc-connect (SLOT 3): `a71278256c095c63e525fe2101db5577d846c4316c1b977a577cd2945a263f41`

- **Token first-4-chars + length** (per secret-redaction discipline; full plaintext in $COMPOSE_DIR/.env):
  - GITHUB_TOKEN: `gho_...` (40 chars)
  - GH_TOKEN: `gho_...` (40 chars)
  - ATLASSIAN_API_TOKEN: `ATAT...` (192 chars including trailing checksum-shape `=80E79C65`)
  - TUNNEL_TOKEN: `eyJh...` (217 chars)
  - ATLASSIAN_EMAIL: `mihkel.putrinsh@evr.ee` (non-secret config)
  - ATLASSIAN_BASE_URL: `https://eestiraudtee.atlassian.net` (non-secret config)
  - ANTHROPIC_API_KEY: empty quoted (same shape as backup; Claude Code uses subscription auth)

- **P3.7 docker compose config rendered output** — all 3 SSH_PUBLIC_KEY* slots populated, GITHUB_TOKEN + ATLASSIAN_API_TOKEN + ATLASSIAN_BASE_URL + ATLASSIAN_EMAIL resolved; ANTHROPIC_API_KEY rendered as empty. GH_TOKEN and TUNNEL_TOKEN NOT in rendered output (operational compose-yml `environment:` block doesn't declare them; they exist in `.env` only; flagged for separate dispatch if apex team wants compose-yml amended).

**outcome** — **success** — Phase 1 fix-staged. `.env` at $COMPOSE_DIR is complete with PO's slot assignment (PO/Aleksandr/rc-connect), all credentials present, parses cleanly under `docker compose config`. Substrate ready for Phase 2 Tier D recreate (queued by Brunel for immediate relay). Original PO ask (Aleksandr's key persistence across container rebuilds) is now addressable on next compose-up. Backup `.env` at $BACKUP_DIR/.env remains untouched as further rollback artifact.

**Multi-system failure prevention reaffirmed:** Phase-2 recreate against current `.env` (vs the pre-P3 empty-env state) installs SSH for all three slots + restores full credential cluster. The hard-gate culture that caught the pre-P3 degraded state at 17:23 still stands as the prevention catalyst; this P3 dispatch resolves it.

**Three Sub-shape A instances in this single dispatch arc** (P1.1 michelek-regex on template stub, P1.2a label-key underscore-vs-dot typo on inferred convention, P3.6-amendment-1 `[A-Z_]+` character-class missing digits): filing for session-end Cal-Protocol-A submission per joint authorship discipline (Brunel architectural framing + Hopper operator-defense pattern).

(*FR:Hopper*)

---

## 2026-05-21T09:18+03:00 — Phase 2 apex-research recreate (Tier R + Tier M + Tier D)

**timestamp** — 2026-05-20T19:04+03:00 (Phase 2 originally dispatched) → 2026-05-20T19:35-19:38 (Option-A/Option-B reversal + amendment-1) → 2026-05-20T19:37-19:40 (Aen HALT + session pause) → 2026-05-21T09:07+03:00 (Aen resume signal) → 2026-05-21T09:18+03:00 (close-out written; original ask achieved).

**tasker** — Brunel (Phase 2 amendment-1 dispatch authored, inlined from `designs/new/apex-keys-phase2-recreate-dispatch.md` outside Hopper's MAY-READ scope; relay = primary per `relay-to-primary-artifact-fidelity-discipline.md`). PO Tier D sanction verbatim "Approve as drafted" at 2026-05-20 19:01 (predates the Option-B reversal but still governed the Tier D recreate command which was unchanged). Aen ratified Option B at 2026-05-20 19:34, ratified P4.1 substrate-state-checks at 2026-05-21 09:07 resume.

**dispatch summary** — Apex-research container recreate via `docker compose up -d --force-recreate apex-research` to apply Phase-1-Redux .env, install all 3 SSH keys (PO + Aleksandr + rc-connect), and preserve GH_TOKEN via P4.05 Tier M compose-yml amendment. Original PO ask ("make Aleksandr's key persist apex rebuilds") ACHIEVED.

**tier classification + sanction status** — by step:

- **P4.1** = Tier R (substrate-state capture + Aen-09:07-added drift check + apex-offline check + Brunel-09:11-sanctioned indentation probe). PASS at 09:13: container Up 42h, 3 volumes present, both .env files present, Config.Env SSH_PUBLIC_KEY_2 byte-equal to S20-19:23 documented value (no drift), 0 ESTABLISHED on :2222 + NO_ESTABLISHED_SESSIONS marker (apex offline as expected), docker logs last activity 2026-05-19T12:31, indentation probe (after width-adjustment within-dispatch-agency) confirmed 2-space service-key indent in compose-yml.

- **P4.05** = Tier M (Brunel single-line ack from 2026-05-20 19:38, quoted verbatim):
  > "I sanction this Tier M op. Operational compose-yml's apex-research env block adds one line `- GH_TOKEN=${GH_TOKEN:-}`, the `:-` default-fallback pattern matching existing token entries. Backup `.bak` is the rollback artifact. Reversible by `cp .bak docker-compose.yml`. Operation preserves apex team's existing GH_TOKEN credential through the Phase 2 recreate per PO direction. — Brunel"

  **P4.05 amendment chain (Sub-shape A n=4):**
  - P4.05 first-attempt 09:13: backup created at `docker-compose.yml.bak.20260521-091347` (3903 bytes, identical to original); awk script then FAILED with `runaway string constant "      - GH ...` — the awk parser interpreted the `}` in the literal string `${GH_TOKEN:-}` as block-terminator. `set -e` halted before `mv`; original docker-compose.yml UNCHANGED (verified via `diff -q` returning no output). Substrate clean; 0-byte `.new` leftover.
  - Brunel amendment-2 at 09:16: replaced `print "      - GH_TOKEN=\${GH_TOKEN:-}"` with `printf "      - GH_TOKEN=%s%s\n", "$", "{GH_TOKEN:-}"` (awk-canonical string concatenation; the `{GH_TOKEN:-}` chunk has no leading `$` so awk doesn't parse it specially). Sanctioned reuse of 09:13 backup (no double-backup) + `.new` cleanup at script start.
  - P4.05 second-attempt 09:18: PASS. ssh exit 0; `docker compose config` rendered output shows `GH_TOKEN: gho_2xo5...` resolved from .env; context-grep confirms insertion in apex-research env block (surrounded by SOURCE_REPO_URL/GITHUB_TOKEN/ANTHROPIC_API_KEY siblings; not in cloudflared block).

  **Sub-shape A self-instance in tasker amendment text:** caught by Hopper's hard-gate culture at P4.05 first-attempt fail; root cause (awk grammar's `}` interpretation in nested-quoting layer-chain PowerShell→base64→bash→awk) diagnosed and surfaced; Brunel amendment-2 resolved via string-concat workaround.

- **P4.2** = **Tier D** (PO sanction verbatim "Approve as drafted" at 2026-05-20 19:01 against the full Phase 2 dispatch text including (a) exact command + (b) stated reason + (c) expected outcome — three-component sanction validated complete at Hopper 09:08 ack against canonical amendment-1 dispatch text). Exact command executed verbatim:
  > `ssh -T dev@100.96.54.170 "cd '/home/dev/github/apex-migration-research' && docker compose up -d --force-recreate apex-research"`

  PASS at 09:18: ssh exit 0; docker output shows lifecycle progression `Container apex-research Recreate → Recreated → Starting → Started`. Container destroyed and re-created cleanly.

- **P4.3** = Tier R. PASS at 09:18: container status `Up 46 seconds` (not Restarting/Exited). New container running.

- **P4.4** = Tier R (preservation framing per amendment-1 wording rescission). PASS at 09:18: Config.Env contains all 3 SSH_PUBLIC_KEY slots populated with the captured pubkey values; GH_TOKEN present with `gho_2xo5...` value (P4.05 preservation succeeded); GITHUB_TOKEN, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN, ATLASSIAN_BASE_URL all present with matching values; ANTHROPIC_API_KEY empty (matches `.env` shape, not a defect). TUNNEL_TOKEN intentionally absent (cloudflared-service domain).

- **P4.5** = Tier R (container-user SSH port 2222). PASS at 09:18: `cat /home/ai-teams/.ssh/authorized_keys` returns 3 lines — Aleksandr (`ghost-bridge@aleksandr-2026-05-15`) + rc-connect + PO (`mihkel.putrinsh@evr.ee apex-research`). All 3 keys installed by entrypoint Step 7 from new .env.

- **P4.6** = Tier R. PASS at 09:18: entrypoint logs show `[entrypoint] 3 SSH public key(s) installed for michelek + ai-teams.` (KEY_COUNT=3 confirmed), `sshd started on port 2222`, `All gates passed. Starting...`. ZERO ERROR lines.

- **P4.7** = Tier R. PASS at 09:18: all 3 named volumes (`apex-research_apex-claude-home`, `apex-research_apex-research-repo`, `apex-research_apex-source-data`) preserved across recreate; none lost.

- **P4.8** = Tier R + log + scratchpad write. **THIS ENTRY.**

**deployed-artifacts-read declaration** — per Brunel dispatch's audit declaration + Hopper Diagnostic Discipline three-layer reading (Hopper-Amendment-4 candidate):

- **Layer 1 (FR design-as-shipped):** session-start reads at `designs/deployed/apex-research/container/entrypoint-apex.sh:166-196` + `docker-compose.yml:47-60` + `.env.example:13` still current.
- **Layer 2 (consumer team operational on substrate host):** P4.0 + P4.0 amendment-1 substrate reads at 2026-05-20 19:30-19:33 (compose-yml env block has 14 vars, no GH_TOKEN at Layer 2 pre-amendment; Dockerfile.apex has no ENV directives). P4.05 amendment ADDED `- GH_TOKEN=${GH_TOKEN:-}` to apex-research env block (Layer 2 now declares GH_TOKEN). P4.1 indentation probe at 09:13 confirmed 2-space service-key indent.
- **Layer 3 (running container Config.Env):** P3.5 + P3.1 + P4.1(b) substrate-static checks all confirmed PO key in SLOT 2 byte-equal to documented value pre-recreate. Post-recreate P4.4 shows new Config.Env with all 3 SSH slots + GH_TOKEN populated per the amended Layer 2 declaration + .env values.
- **Audit-trail artifacts (this repo):** operations-log-2026-05.md (Hopper-authored; current — 6 entries including this one), apex-keys-diff-2026-05-20.md (Hopper at 2026-05-20 18:44), hopper.md scratchpad (current).

**commands executed** — verbatim (via base64-transit pattern through `ssh -T -o StrictHostKeyChecking=accept-new -o BatchMode=yes dev@100.96.54.170 "echo '<b64>' | base64 -d | bash"` for host-user, or `ssh -i ~/.ssh/id_ed25519_apex -p 2222 ai-teams@100.96.54.170 "<cmd>"` for container-user):

- P4.1 multi-probe: `docker ps --filter name=apex-research --format ...`; `docker volume ls | grep apex-research`; `ls -la $COMPOSE_DIR/.env $BACKUP_DIR/.env`; `docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^SSH_PUBLIC_KEY_2='`; `docker exec apex-research sh -c "netstat -tan 2>/dev/null | grep ':2222.*ESTABLISHED' || echo NO_ESTABLISHED_SESSIONS"`; `docker logs apex-research --tail 20 --timestamps`. Then `head -10 docker-compose.yml | grep -nE ...` (indentation probe, empty output → width-adjusted to `cat -n docker-compose.yml | head -30` per within-dispatch-agency).
- P4.05 amendment-2 (the second-attempt + successful) remote bash: `set -euo pipefail`; `rm -f docker-compose.yml.new`; `test -f docker-compose.yml.bak.20260521-091347`; awk with `printf "      - GH_TOKEN=%s%s\n", "$", "{GH_TOKEN:-}"` insertion logic + apex-vs-cloudflared block boundaries; `test -s docker-compose.yml.new`; `mv docker-compose.yml.new docker-compose.yml`; `docker compose config 2>&1 | grep -E '^(\s+)?GH_TOKEN'`; `grep -B2 -A1 'GH_TOKEN' docker-compose.yml | head -10`.
- **P4.2 (Tier D):** `cd '/home/dev/github/apex-migration-research' && docker compose up -d --force-recreate apex-research 2>&1` — exact command per PO sanction.
- P4.3: `sleep 10 && docker ps --filter name=apex-research --format '{{.Names}} STATUS={{.Status}}'`
- P4.4: `docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^(SSH_PUBLIC_KEY|GITHUB_TOKEN|GH_TOKEN|ATLASSIAN|TUNNEL|ANTHROPIC)'`
- P4.5: `cat /home/ai-teams/.ssh/authorized_keys` (via container-user SSH)
- P4.6: `docker logs apex-research --tail 100 2>&1 | grep -E 'SSH public key|entrypoint|ERROR'`
- P4.7: `docker volume ls | grep apex-research`
- P4.8: this ops-log entry + scratchpad update + report SendMessages.

**outputs** — relevant excerpts (secret-redaction discipline applied; SHA-256 fingerprints from P3.8 entry are the audit anchors for the 3 pubkeys; full plaintext lives in $COMPOSE_DIR/.env and now also in container's Config.Env):

- **P4.05 success:** docker-compose.yml updated with `      - GH_TOKEN=${GH_TOKEN:-}` line in apex-research env block at line after `- GITHUB_TOKEN=${GITHUB_TOKEN}`. Backup `docker-compose.yml.bak.20260521-091347` preserved as rollback artifact. Compose config render shows `GH_TOKEN: gho_2xo5<REDACTED>` resolved from .env.
- **P4.2 recreate sequence:** `Container apex-research Recreate → Recreated → Starting → Started` — clean Docker lifecycle.
- **P4.3 container status:** `apex-research STATUS=Up 46 seconds` (immediately post-recreate; clean start, no crash-loop).
- **P4.4 Config.Env post-recreate (all DECLARED tokens populated; SHA-256 fingerprints for pubkeys per P3.8):**
  - `SSH_PUBLIC_KEY=ssh-ed25519 ...` (PO, SHA256 `8272813305...`)
  - `SSH_PUBLIC_KEY_2=ssh-ed25519 ...` (Aleksandr, SHA256 `9646444b45...`)
  - `SSH_PUBLIC_KEY_3=ssh-ed25519 ...` (rc-connect, SHA256 `a71278256c...`)
  - `GITHUB_TOKEN=gho_2xo5<REDACTED>` (40 chars; same value as backup .env)
  - `GH_TOKEN=gho_2xo5<REDACTED>` (40 chars; preservation succeeded per P4.05 amendment + PO Option B direction)
  - `ATLASSIAN_EMAIL=mihkel.putrinsh@evr.ee`
  - `ATLASSIAN_API_TOKEN=ATATT3xF<REDACTED>` (192 chars)
  - `ATLASSIAN_BASE_URL=https://eestiraudtee.atlassian.net`
  - `ANTHROPIC_API_KEY=` (empty, matches .env shape; Claude Code uses subscription auth)
- **P4.5 authorized_keys post-recreate:** 3 lines installed by entrypoint Step 7, one each for PO + Aleksandr + rc-connect (all comments match captured pubkeys).
- **P4.6 entrypoint logs:** `[entrypoint] 3 SSH public key(s) installed for michelek + ai-teams.` + `sshd started on port 2222` + `All gates passed. Starting...`. Zero errors. KEY_COUNT=3 confirmed.
- **P4.7 volume integrity:** all 3 named volumes preserved across recreate.

**outcome** — **success — original task ACHIEVED.** Aleksandr's SSH key persists in apex-research container's authorized_keys, baked into Config.Env from the canonical .env at $COMPOSE_DIR. Container will retain all 3 keys (PO + Aleksandr + rc-connect) across any future rebuild. GH_TOKEN preserved per PO Option B direction (P4.05 compose-yml amendment). All declared tokens propagated. All 3 named volumes preserved. Backup `.env` at $BACKUP_DIR untouched as further rollback artifact (and the 09:13 compose-yml backup also retained for compose-yml rollback if ever needed).

**Multi-system failure prevention (substantively confirmed):** had we executed the original r3 Phase-2 recreate against the pre-Phase-1-Redux degraded state (no .env, container Config.Env stale from 2026-04-29-fresh-clone era), the recreate would have produced a container with all SSH slots empty + no credentials. Full SSH lockout + GitHub auth loss + Atlassian auth loss + Cloudflare tunnel auth loss. The hard-gate-surface-back chain through this dispatch arc prevented that incident.

**Audit-trail surface for this Phase 2 close** documents the full reversal-and-redirect sequence as load-bearing dispatch events:
- 2026-05-20 19:04: Phase 2 first dispatch (Option A "substrate-correction normalization" framing for GH_TOKEN; PO sanctioned at 19:01)
- 2026-05-20 19:35: PO objected to Option A → "preserve their GH_TOKEN, too"
- 2026-05-20 19:35: Aen direct intercept → reversed to Option B, instructed P4.05 Tier M compose-yml amendment to preserve GH_TOKEN
- 2026-05-20 19:37: Aen HALT to Hopper (intercepted cross-in-transit on the now-rescinded Option A dispatch)
- 2026-05-20 19:38: Brunel amendment-1 dispatch (canonical Phase 2 text with P4.05 inserted, wording rescissions on P4.4 + P4.8)
- 2026-05-20 19:40-end: session paused
- 2026-05-21 09:07: Aen resume signal with 2 P4.1 substrate-state-checks added (drift check + apex-offline check)
- 2026-05-21 09:11: Brunel green-light + indentation probe sanctioned
- 2026-05-21 09:13: P4.1 PASS + P4.05 first-attempt FAIL (awk runaway-string; Sub-shape A n=4 catalogued)
- 2026-05-21 09:16: Brunel amendment-2 (awk printf string-concat fix)
- 2026-05-21 09:18: P4.05 second-attempt PASS + P4.2 Tier D recreate executed + P4.3-P4.7 all PASS + this P4.8 close-out

**Four Sub-shape A instances in the full dispatch arc** (P1.1 michelek-regex, P1.2a label-key typo, P3.6-amendment-1 character-class, P4.05-first-attempt awk runaway-string): cataloging confirmed for session-end Cal-Protocol-A submission. The shape is hardening; substrate-truth-anchored discriminators/literals reliably outperform inferred/template-anchored ones.

(*FR:Hopper*)

---

## 2026-05-25T10:24+03:00 — apex DEV db tunnels diagnostic (Tier R-only, Hopper-scope-exit)

**timestamp** — 2026-05-25T10:24+03:00 (dispatch landed via Aen task #6) → 2026-05-25T10:27+03:00 (hard-gate-trip surface-back, L3-UP vs dispatch-DOWN) → 2026-05-25T10:32+03:00 (consolidated Tier R findings + three unblock-asks) → 2026-05-25T10:35+03:00 (Aen acked, HOLD posture, routing (A) ask through PO) → 2026-05-25T10:36+03:00 (PO sharpened symptom verbatim: "localhost:11521 connection refused") → 2026-05-25T10:40+03:00 (Aen sharpened probe-suite P2a-2d, sequential single-probes per Windows-substrate friction discipline) → 2026-05-25T10:39+03:00 (P2a-2d complete, substrate-shape revised, Hopper-scope-exit recommendation surfaced) → close-out written 2026-05-25T10:42+03:00 (this entry).

**tasker** — Aen (operational urgency path; PO surfaced the apex team complaint to Aen, who dispatched to Hopper as task #6). PO direction relayed through Aen at 10:36 sharpening the symptom-text. No Brunel involvement this arc; pure Hopper diagnostic.

**dispatch summary** — Apex team reported DEV db tunnels (11521 VJSDBTEST, 11522 VJSDBTEST2) DOWN as of 2026-05-25; baseline metrics 2026-05-21 09:33 showed UP-with-high-churn (54 ssh restarts/24h + 17 wrapper-loop respawns lifetime). Hopper diagnosed Tier R first per discipline; surfaced hard-gate trip (L3 sockets BOUND, dispatch said DOWN); after sharpened probe-suite, surfaced revised substrate-truth (host AND container both have own tunnels, both protocol-functionally-dead with stale-listener-with-dead-upstream fingerprint); recommended Hopper-scope-exit on three independent grounds (substrate-of-truth in apex team's workspace OUT-OF-SCOPE; failing locus is THIRD context not probed; recovery action is apex-team-domain not FR-shipped).

**tier classification + sanction status** — by probe:

- **P0** = Tier R (connectivity viability check) — default-permitted. PASS at 10:26:56: host paarisprogemis-fyysiline up 67 days, load 1.73-1.90, ssh-as-dev viable.
- **P1** = Tier R (L3 listen-socket check, host-side) — default-permitted. **HARD-GATE TRIP at 10:27**: `ss -tln | grep :1152[12]` returned 4 LISTEN entries (127.0.0.1 + IPv6 [::1] on both 11521 and 11522). Dispatch said DOWN; substrate said UP at L3 socket-state. Surfaced per discipline; do not silent-broaden.
- **P2-P4** (host-side TCP+protocol probes) = Tier R (default-permitted, continued under Aen 10:32 (b)-sanction crossing in-flight with surface-back):
  - P2: `echo > /dev/tcp/127.0.0.1/11521` exit 0 — TCP handshake OK
  - P3: same for 11522 exit 0 — TCP handshake OK
  - P4: `exec 3<>/dev/tcp/127.0.0.1/11521; printf x >&3; head -c 64 <&3 | od -c` returned 0 bytes within 4s timeout — **stale-listener-with-dead-upstream signature** captured
- **P5-P13** (substrate-discovery probes, host-side) = Tier R (default-permitted): pgrep/who/ps/systemctl/docker/tmux/sudo-check — all returned no-actionable-substrate-truth (process-owner invisible without sudo; no systemd/cron/docker port; tmux-socket-visibility-under-ssh dead-end).
- **P2a** = Tier R (host-side `nc -zv` re-confirm) — default-permitted under Aen 10:40 sharpened sanction. PASS: both 11521 + 11522 report `open`.
- **P2b** = Tier R (container-side TCP probe via container-user SSH on port 2222) — default-permitted. **UNEXPECTED PASS**: `/dev/tcp/127.0.0.1/11521` and :11522 from inside container both return exit 0. **Substrate-shape 2 (container-can't-reach-host) REFUTED** — container has its OWN listeners.
- **P2b-extended** = Tier R (container-side protocol-handshake) — default-permitted. **SAME stale-listener fingerprint**: exit 124 timeout, 0 bytes in 4s for both ports.
- **P2c** = Tier R (container-side `/proc/net/tcp` direct read, no ss/netstat/lsof in container) — default-permitted. **SUBSTRATE-TRUTH CAPTURED**: container has inodes 674958957 (127.0.0.1:11521) + 674958961 (127.0.0.1:11522) in LISTEN state (0A) owned by uid=1000 (ai-teams). Each environment runs its OWN SSH tunnels; container's are separate from host's.
- **P2d** = Tier R (container filesystem search for 11521/VJSDBTEST config). **SCOPE BOUNDARY HIT**: matching files live in `/home/ai-teams/workspace/teams/apex-research/{memory,inboxes,wiki}/` — apex team's own workspace, OUTSIDE Hopper's MAY-READ scope. Did NOT read those files; surfaced the gap to Aen.

**No Tier M / Tier D in this arc.** No FR-shipped substrate mutated. All probes were Tier R default-permitted or default-permitted under sharpened Aen sanction. The diagnostic exited Hopper-scope before any recovery proposal was committed.

**deployed-artifacts-read declaration** — per the Hopper-Amendment-4 three-layer discipline I co-authored (currently in joint-review with Celes + Brunel):

- **Layer 1 (FR design-as-shipped):** **ABSENT** for this substrate. Read `designs/deployed/apex-research/container/docker-compose.yml` (lines 1-89) + glob-walked the entire `designs/deployed/apex-research/**` tree — no `tunnel`/`wrapper`/`db`/`oracle`/`VJSDBTEST`/`11521`/`11522` artifacts. FR-design covers the apex-research CONTAINER substrate, not the DEV db tunnel substrate. Per §Graceful Degradation case 1, surfaced gap to Aen at 10:24; Aen confirmed (b)-proceed-with-Layer-1-absent at 10:32.
- **Layer 2 (consumer-team operational on substrate host):** **PARTIALLY UNREACHABLE / OUT-OF-SCOPE**. Probed standard locations (host /home/dev/bin/ EMPTY; systemctl user+system NO MATCHES; docker ps NO 11521/11522 PUBLISHED; ps -eo NO TUNNEL/WRAPPER VISIBLE TO dev USER; sudo NOT PASSWORD-LESS). Substrate-truth source IS in apex team's workspace (`/home/ai-teams/workspace/teams/apex-research/memory/hammurabi.md`, `inboxes/team-lead.json`, `wiki/decisions/`, `wiki/patterns/`) — NOT READ per Hopper's §Scope Restrictions (another team's substrate not in MAY-READ list). Surfaced the scope-boundary to Aen at 10:39 as part of scope-exit recommendation.
- **Layer 3 (running container Config.Env / runtime state):** OBSERVED across host AND container. Host: ss output shows both ports LISTENING on 127.0.0.1 + [::1]. Container: /proc/net/tcp shows both ports LISTENING on 127.0.0.1 owned by uid=1000. Both contexts produce SAME stale-listener fingerprint at protocol-handshake (4s timeout, 0 bytes returned). L3 evidence is conclusive: tunnels are TCP-functionally-alive + protocol-functionally-dead in BOTH host and apex-research-container substrates.
- **Audit-trail artifacts (this repo):** `teams/framework-research/docs/operations-log-2026-05.md` (this entry; 7th chronological entry for the month), `teams/framework-research/memory/hopper.md` (updated mid-arc with `[DISPATCH]` task #6 in-flight + `[GOTCHA]` stale-listener-fingerprint + `[LEARNED]` L2-unreachable-as-graceful-degradation-case-2-outcome).

**commands executed** — verbatim, all Tier R via base64-transit-not-needed (single-token ssh commands; sequential single-probes per Windows-substrate friction discipline):

- P0: `ssh -T -o StrictHostKeyChecking=accept-new -o BatchMode=yes -o ConnectTimeout=10 dev@100.96.54.170 'date; hostname; uptime'`
- P1: `ssh -T ... dev@... "ss -tlnp 2>/dev/null | grep -E ':(1152[12])\b' || echo 'NO_LISTEN_ON_11521_11522'"`
- P2/P3: `ssh -T ... dev@... "timeout 3 bash -c 'echo > /dev/tcp/127.0.0.1/11521' && echo PORT_11521_CONNECTABLE ..."` (separate invocations for 11521 and 11522)
- P4: `ssh -T ... dev@... "timeout 4 bash -c 'exec 3<>/dev/tcp/127.0.0.1/11521; printf \"x\" >&3; head -c 64 <&3 | od -c'"`
- P5: `ssh -T ... dev@... "pgrep -af 'ssh.*1152' 2>&1; echo '---PGREP_EXIT:'$?'---'"`
- P6: `ssh -T ... dev@... "ss -tlnp 2>&1 | grep -E ':(1152[12])\b'"`
- P7-P11: combined inventory probes for /home/dev/bin, systemctl --user/system, docker ps, who, ps -eo user,pid,etime,cmd (sequential single-probes).
- P12: `ssh -T ... dev@... "sudo -n true 2>&1"` (negative result: password required)
- P13: `ssh -T ... dev@... "tmux list-sessions 2>/dev/null; ... for s in \$(tmux list-sessions -F '#{session_name}' 2>/dev/null); do echo \"== \$s ==\"; tmux list-windows -t \"\$s\" -F '  #{window_index}: #{window_name}' 2>/dev/null; done"` — visibility dead-end under ssh-without-PAM-session.
- P2a: `ssh -T ... dev@... "nc -zv 127.0.0.1 11521 2>&1; echo '---'; nc -zv 127.0.0.1 11522 2>&1"`
- P2b: `ssh -i ~/.ssh/id_ed25519_apex -p 2222 ai-teams@100.96.54.170 "timeout 3 bash -c 'echo > /dev/tcp/127.0.0.1/11521' 2>&1; echo P11521_EXIT=$?; ..."` (container-user SSH per ~/bin/rc-deployments.json entry num:"2")
- P2b-extended: same shape with `exec 3<>/dev/tcp/127.0.0.1/11521; printf x >&3; head -c 64 <&3 | od -c` for protocol probe
- P2c: `ssh -i ~/.ssh/id_ed25519_apex -p 2222 ai-teams@... "head -20 /proc/net/tcp; awk 'NR>1 && \$4==\"0A\" { print \$2 }' /proc/net/tcp"`
- P2d: `ssh -i ~/.ssh/id_ed25519_apex -p 2222 ai-teams@... "grep -rlE '11521|VJSDBTEST' /home/ai-teams/workspace/ /home/ai-teams/.config/ /home/ai-teams/bin 2>/dev/null | head -10"` — surfaced file list; did NOT read the contents (out-of-scope).

**outputs** — relevant excerpts (full execution detail in the surface-back chain to Aen at 10:27, 10:32, 10:39):

- **Host L3 listen sockets** (P1, P2, P3): both 11521 and 11522 bound on 127.0.0.1 + IPv6 [::1]; TCP-connect-via-/dev/tcp returns exit 0.
- **Host protocol stale-listener fingerprint** (P4): `timeout 4 ... printf x >&3; head -c 64 <&3 | od -c` returns empty output, exit 0 (head's 4-byte default for `-c 64` partial-fill with EOF on timeout; substrate gave us NO data within 4s).
- **No host-side wrapper-script visible to dev** (P5, P7-P11): /home/dev/bin/ has zero non-dotfile contents; no systemctl unit matching tunnel/db/wrapper/vjs/sql/oracle/apex/1152; docker ps shows 8 containers but none publish 11521/11522 to host; ps -eo for users michelek|root|apex × tunnel-related cmd patterns returns no match; sudo not password-less for dev.
- **Container L3 listen sockets** (P2c): `/proc/net/tcp` lines 4-5 show `0100007F:2D02` and `0100007F:2D01` both in state 0A (LISTEN), uid 1000 (ai-teams), inodes 674958961 and 674958957. Container has its own tunnels.
- **Container protocol stale-listener fingerprint** (P2b-extended): exit 124 (timeout) for both ports; SAME zero-bytes-in-4s shape as host-side.
- **Apex-team workspace files mentioning 11521/VJSDBTEST** (P2d, FILE LIST ONLY, contents NOT READ per scope): `hammurabi.md`, `inboxes/team-lead.json`, `wiki/decisions/transition-detected-audit-stamping-adr-0014-gap-6.md`, `wiki/patterns/yleandmised-muutja-state-transition-audit.md`, `wiki/patterns/apex-page-item-v-idiom-in-plsql.md`, `wiki/patterns/vjs-oracle-designer-cg-scaffolding.md`, and others.

**outcome** — **success (diagnostic) + scope-exit-recommended (recovery)**. Tier R substrate-truth captured at all three layers in both host AND container contexts; stale-listener-with-dead-upstream fingerprint reproduced in both contexts; no FR-shipped substrate mutated; substrate-shape-1 (stale-listener) revived; substrate-shape-2 (bridge-network-isolation) REFUTED.

**Hopper-scope-exit recommendation surfaced on three independent grounds:**

1. **Substrate-of-truth lives in apex team's workspace** (their hammurabi/wiki/inbox files), which is OUTSIDE Hopper's MAY-READ scope per §Scope Restrictions. Reading their substrate to find the wrapper-loop launcher is a scope violation.
2. **The actual failing context (PO's "localhost:11521 connection refused" verbatim quote) is a THIRD locus** — neither host nor apex-research-container produces ECONNREFUSED; they both produce TCP-OK + protocol-hang. Failing locus not yet identified; cannot probe without PO surfacing where he ran the test.
3. **Recovery action is fundamentally apex-team-domain** — modifying their tunnel wrapper-loop, modifying binding shape, restarting their SSH-tunnel infrastructure is apex's operational substrate, not FR-shipped. Hopper's MAY-DO is "operational against FR-shipped substrates"; apex's intra-substrate tunnels are not FR-shipped.

**Recommended next actions** (surfaced to Aen at 10:39; awaiting routing decision):
- **Escalate to apex-lead-ghost (Schliemann) via PO** for apex-side action with these diagnostic findings citable verbatim.
- OR **expand Hopper scope** with explicit cross-team sanction to read apex's workspace.
- OR **task Brunel diagnostic-side** for cross-team substrate analysis (his design-side scope when sanctioned).

**Generalizable patterns surfaced (added to scratchpad):**
- `[GOTCHA — substrate, apex-host]` **Stale-listener-with-dead-upstream fingerprint** — ss/`/proc/net/tcp` shows LISTEN; `/dev/tcp` TCP-connect succeeds; first-byte-write returns 0 bytes within timeout. Distinguishes from "missing listener" and "live listener serving."
- `[LEARNED — discipline, substrate-scope-bound]` **L2 unreachable as legitimate §Graceful Degradation case 2 outcome** — when multiple substrate-discovery vectors return empty/null/access-denied AND the substrate-of-truth lives outside Hopper's MAY-READ scope, the responsible posture is declare-L2-unreachable-and-surface-to-tasker, NOT escalate probe-shapes recursively.

(*FR:Hopper*)

---

## 2026-05-25T11:25+03:00 — Correction entry — references 2026-05-25T10:24+03:00 (task #6 dispatch)

**timestamp** — 2026-05-25T11:25+03:00 (correction-entry written).

**tasker** — Aen (substrate-map correction landed at 11:05 via wiki-query; interpretation-refinement landed at 11:18).

**dispatch summary** — Correction to two interpretations in the 2026-05-25T10:24+03:00 task #6 entry above. **The entry above (10:24) stands as written for the audit trail per append-only ops-log discipline; this entry supersedes specific interpretive claims, NOT the probe outputs.**

**Correction 1 — "host AND container both have own listeners" was incorrect.**

The 10:24 entry's `outcome` section and the `Layer 3` bullet of its `deployed-artifacts-read declaration` describe the substrate as "host and container both have own SSH tunnels on 11521/11522, both stale" and "host AND host-networked-container... same wrapper-loop owns both." **The corrected interpretation:** there is ONE set of listeners — RC host's loopback. The apex-research container is **host-networked** (compose-yml `network_mode: host`, per Brunel S34 scratchpad and `wiki/references/rc-host-db-tunnel-architecture.md` filed 2026-04-24). Host-networked containers share the host's network namespace; `/proc/net/tcp` inside the container reflects the host's network state, not the container's own.

Substrate-truth-verification this entry executed (Tier R, single probe, no further sanction needed per default-permitted scope):

```
$ ssh -T dev@RC "awk 'NR>1 && (\$2 ~ /:2D01\$/ || \$2 ~ /:2D02\$/) && \$4==\"0A\" { print \$2 \" inode=\" \$10 \" uid=\" \$8 }' /proc/net/tcp"
0100007F:2D02 inode=674958961 uid=1000
0100007F:2D01 inode=674958957 uid=1000
```

**Host's inodes 674958961 and 674958957 are byte-identical to container's** (P2c reading from container's `/proc/net/tcp` at 10:39 captured these exact inodes). Same kernel-side inodes; same uid=1000 (kernel-numeric; host's `dev` user shares uid 1000 with container's `ai-teams` user — name-aliasing-only, single underlying identity to the kernel). **One listener observed from two vantage points in the same shared netns. NOT two parallel substrates.**

The "same wrapper-loop owns both" intuition in the 10:24 entry is correct (single owner) but the structural framing ("both contexts have their own tunnels") is wrong. Cleaner substrate-truth: single set of listeners in shared netns, observed from host SSH and container SSH, both showing the same kernel inode IDs.

**Correction 2 — "substrate-of-truth is in apex team's workspace" was incorrect.**

The 10:24 entry's `outputs` section listed apex team's workspace files (`hammurabi.md`, `inboxes/team-lead.json`, `wiki/decisions/...`, `wiki/patterns/...`) as containing the substrate-of-truth for the tunnel wrapper-loop. **The corrected interpretation:** those files are agents documenting the database they USE; they do not OWN the tunnel substrate. The wrapper-loop substrate-of-truth is on **PO's Windows workstation** — script at `apex-migration-research/.claude/bin/open-db-tunnels.sh` (cross-repo, on PO's Windows filesystem, NOT inside this repo or apex team's container), persisted via Windows Task Scheduler task `ApexResearch-DBTunnels` in PO's user-context. Source-of-truth: `wiki/patterns/windows-user-context-persistent-bridge.md` (filed 2026-04-28, expanded 2026-04-29 with 2 refinements; 6-component persistent-bridge pattern: autossh + supervisor-of-supervisor + wscript launcher + dual triggers + IgnoreNew + stale-process cleanup).

**MAY-READ scope was NOT the actual blocker** for the apex-workspace files surfaced at P2d. The actual blocker is structural: the wrapper-loop runs in PO's Windows user-context, unreachable from any Hopper SSH access path (host-user-SSH `dev@RC`, container-user-SSH `ai-teams@RC:2222`). Scope-exit still holds, just with cleaner reasoning.

**Correction 3 — recovery routing.**

The 10:24 entry's `Recommended next actions` proposed "(1) Escalate to apex-lead-ghost (Schliemann) via PO." Per Aen 11:18: **wrong routing.** Schliemann's team doesn't own the wrapper-loop; PO does. Routing through apex would just bounce back. Per the corrected substrate-map: **recovery action is PO restarting `ApexResearch-DBTunnels` Task Scheduler task** (or killing stale Windows-side `ssh.exe` / `autossh.exe` processes and re-triggering). PO is handling Windows-side recovery directly. Hopper's only operational action remaining is the single TNS-bytes verification probe post-restart (per Aen 11:05 dispatch text).

**tier classification + sanction status** — Tier R only:

- 11:25 verification probe (host inode + uid extraction via `awk` on `/proc/net/tcp`): Tier R default-permitted, single sequential probe per Windows-substrate friction discipline. PASS at 11:25: inodes byte-identical to container's P2c output from 10:39. Corrected interpretation substrate-truth-anchored.

**deployed-artifacts-read declaration** — corrections fold per Hopper-Amendment-4 candidate (three-layer):

- **Layer 0 (documented-knowledge probe) — NEW DISCIPLINE GAP SURFACED:** `wiki/references/rc-host-db-tunnel-architecture.md` (filed 2026-04-24, status active) and `wiki/patterns/windows-user-context-persistent-bridge.md` (filed 2026-04-28, amended 2026-04-29, status active) **both contained the complete substrate map for this incident.** Library-query at dispatch-receipt-time would have collapsed the diagnostic surface entirely — avoiding P5-P13 + sudo-escalation ask + the host-vs-container-as-two-substrates wrong-interpretation. This is the catalyzing-incident for the Layer-0-library-first discipline now captured in scratchpad as `[LEARNED — discipline, library-first]`; candidate sub-pattern for Hopper-Amendment-4 (Phase B mid-flight; not surfacing to Celes until post-verification per discipline-batched-iterate).
- **Layer 1 (FR design-as-shipped):** ABSENT for DEV db tunnel substrate (correct as stated in 10:24 entry). Reaffirmed.
- **Layer 2 (consumer-team operational on substrate host):** **CORRECTED INTERPRETATION** — the wrapper-loop substrate-of-truth is on **PO's Windows workstation**, NOT in apex team's workspace. The apex workspace files surfaced at P2d are agents-using-the-database references, not the tunnel-wrapper-loop owner.
- **Layer 3 (running container Config.Env / runtime state):** **CORRECTED INTERPRETATION** — single set of listeners in shared netns (apex-research container is host-networked, `network_mode: host`), observed from host SSH and container SSH via byte-identical kernel inodes 674958961 / 674958957. NOT two parallel substrates. Same stale-listener-with-dead-upstream fingerprint (TCP-accept-OK + 0-bytes-on-first-byte-write + 4s-timeout); same owning process (Windows-side reverse-SSH that has gone stale).
- **Audit-trail artifacts (this repo):** `teams/framework-research/docs/operations-log-2026-05.md` (entry 7 at 10:24 + this correction entry 8 at 11:25), `teams/framework-research/memory/hopper.md` (updated at 11:12 with [GOTCHA] host-networked refresh + [GOTCHA] stale-RC-listener-Windows-side-process-death + [LEARNED] Layer-0 library-first).

**commands executed** — verbatim, single probe:

- `ssh -T -o StrictHostKeyChecking=accept-new -o BatchMode=yes dev@100.96.54.170 "awk 'NR>1 && (\$2 ~ /:2D01\$/ || \$2 ~ /:2D02\$/) && \$4==\"0A\" { print \$2 \" inode=\" \$10 \" uid=\" \$8 }' /proc/net/tcp"`

**outputs** — verbatim:

```
0100007F:2D02 inode=674958961 uid=1000
0100007F:2D01 inode=674958957 uid=1000
```

Host inodes match container's P2c reading byte-perfect → shared-netns confirmed via primary-artifact substrate-truth.

**outcome** — **success (correction)**. Three interpretations in the 10:24 entry corrected with substrate-truth-anchored evidence + wiki-source-citation. Append-only ops-log discipline preserved — 10:24 entry untouched as historical audit record; this entry supersedes specific interpretive claims and serves as the audit-detectable correction. Hopper-scope-exit conclusion CONFIRMED unchanged: PO-Windows-side recovery is outside Hopper's SSH access path; no Tier M/D from this role. Next operational action: single TNS-bytes verification probe after PO signals Windows-side restart complete.

**Generalizable pattern reinforced:**
- `[LEARNED — discipline, library-first / Layer-0]` Now the load-bearing observation from this dispatch arc. The wrong-interpretation surfaced in entry 10:24 traces back to single root cause: probing-without-library-query-first. Once library was queried (Aen 11:05), the substrate-map snapped into focus and the wrong-interpretation was diagnosable. Layer-0 discipline value: demonstrated via in-vivo catalyzing-incident at n=1.

(*FR:Hopper*)

---

## 2026-05-25T13:39+03:00 — task #6 close-out (PASS-via-out-of-band recovery)

**timestamp** — 2026-05-25T13:38+03:00 (Aen close-out signal landed) → 2026-05-25T13:39+03:00 (Hopper final substrate-verification probe + this entry written).

**tasker** — Aen (task close-out signal); PO-authorized Aen to execute Windows-side recovery directly under coordinator-tool-override for this specific operational case.

**dispatch summary** — Task #6 (apex DEV db tunnels DOWN) closed by Aen via Path B execution: Windows-side full reset with orphan tree kill. **Hopper-role-of-record in this entry: final substrate-truth verification + capture of carry-forwards Aen surfaced + ops-log close-out.** No Tier M/D executed by Hopper this arc (Hopper-scope-exit recommendation in #7 + #8 stood; Aen+PO took the Windows-side action).

**tier classification + sanction status** — Tier R only this entry:

- **P_F1 (final substrate-truth verification, 13:39):** re-read host `/proc/net/tcp` for 11521/11522 listener inodes to confirm substrate-fresh post-recovery. Default-permitted Tier R, no per-task sanction required. PASS at 13:39.

**deployed-artifacts-read declaration** — per Hopper-Amendment-4 three-layer discipline (NOW CANONICAL per `prompts/hopper.md` lines 130-211 landed by Celes 14:50 same day; second in-vivo demonstration of the discipline within hours of the section landing):

- **Layer 0 (documented-knowledge probe):** the discipline-gap that catalyzed the rest of this arc. Wiki entries `wiki/references/rc-host-db-tunnel-architecture.md` + `wiki/patterns/windows-user-context-persistent-bridge.md` contained the complete substrate map; should have been queried at dispatch-receipt-time. Per `[LEARNED — discipline, library-first]` in scratchpad, candidate for next Hopper-Amendment-5 (Layer 0 prepended).
- **Layer 1 (FR design-as-shipped):** ABSENT for DEV db tunnel substrate (reaffirmed; same as #7 entry). Per §Graceful Degradation case 1 + Layer-2+3 fallback note (line 190 of new prompt section): proceed with tasker confirmation, Layer 1 absence not blocking when Layer 2 + Layer 3 are reachable + substrate-truth-verifiable.
- **Layer 2 (consumer-team operational on substrate host):** **REACHABLE via Aen-routing-from-PO with the wiki-loaded substrate map.** Substrate-of-truth: PO's Windows workstation; `apex-migration-research/.claude/bin/open-db-tunnels.sh`; Task Scheduler task `ApexResearch-DBTunnels`; 6-component (now 7-component candidate) persistent-bridge pattern. Read via wiki-Layer-0, not direct-probe.
- **Layer 3 (running container Config.Env / runtime state):** REACHABLE + VERIFIED. Final probe 13:39:

```
$ ssh -T dev@100.96.54.170 "awk 'NR>1 && (\$2 ~ /:2D01\$/ || \$2 ~ /:2D02\$/) && \$4==\"0A\" { print \$2 \" inode=\" \$10 \" uid=\" \$8 }' /proc/net/tcp"
0100007F:2D02 inode=677674111 uid=1000
0100007F:2D01 inode=677674107 uid=1000
```

Third-generation inodes confirmed: morning 674958961/57 (zombie) → Aen post-restart 675595325/21 (Path B fresh) → 13:39 final 677674111/107 (substrate continues evolving normally post-Path-B; not zombie-stuck). Substrate-fresh independently verified.

- **Audit-trail artifacts (this repo):** ops-log entries #7 (10:24 initial findings + Hopper-scope-exit) + #8 (11:25 correction entry, shared-netns interpretation refined) + this #9 close-out; hopper.md scratchpad updated through 13:39 with revised gotchas + new probe-design-as-sub-canonical-source A.3-candidate observation.

**commands executed** — single Tier R probe, verbatim:

- P_F1: `ssh -T -o StrictHostKeyChecking=accept-new -o BatchMode=yes dev@100.96.54.170 "awk 'NR>1 && (\$2 ~ /:2D01\$/ || \$2 ~ /:2D02\$/) && \$4==\"0A\" { print \$2 \" inode=\" \$10 \" uid=\" \$8 }' /proc/net/tcp"`

**outputs** — verbatim:
```
0100007F:2D02 inode=677674111 uid=1000
0100007F:2D01 inode=677674107 uid=1000
```

Distinct from both morning generation (674958961/57) AND Aen's post-restart generation (675595325/21). Substrate evolves in normal supervisor-restart cycles post-Path-B; not zombie-frozen.

**outcome** — **success (out-of-band recovery + final verification + close-out)**. Task #6 closed. Original goal (diagnose apex DEV db tunnels DOWN) achieved through joint Hopper-diagnostic + Aen-Path-B-execution. Apex's actual workflow re-test is bounded by apex team's own client-protocol-test (sqlplus / Oracle SDK / whatever produced the original "connection refused" report); PO will surface if apex re-reports failures. Hopper-role-of-record on task #6 closed.

**Generalizable patterns + carry-forwards (committed to scratchpad):**

- `[GOTCHA — apex-host, REVISED 13:38]` Stale-listener "fingerprint" was sub-canonical-source-anchored — Oracle TNS protocol is silent-on-garbage-by-design; the probe could not disambiguate live-vs-dead. Substrate-truth-anchored disambiguation requires independent dimensions (inode-delta, DNS/TCP-reachability of upstream, process-tree integrity). My morning P4 interpretation was over-confident from a probe-shape that didn't actually disambiguate. Probe-validity is protocol-dependent.

- `[LEARNED — sub-shape A.3 candidate]` **Probe-design CAN be a sub-canonical-source itself** — extending the discriminator-anchored-on-sub-canonical-source pattern (`wiki/patterns/discriminator-anchored-on-sub-canonical-source.md`) to probe-design. Aen 13:38: TNS-bytes probe was a sub-canonical proxy for "Oracle TNS protocol works" anchored on the assumption that Oracle responds to any input. Substrate-truth (Oracle's silent-on-garbage protocol behavior) was the canonical source; probe fingerprint was outer-layer pass-through. Whether this is A.3 or already covered by A.1's identifier-grammar-mismatch framing is a question for Brunel when Cal-Protocol-A queue reopens — the analogue holds either way: probe semantics anchored on assumed-protocol-behavior is the same defect class as regex anchored on assumed-identifier-grammar. Catalog-extension question; not a behavior-change for Hopper-discipline.

- `[GOTCHA — apex-research, REVISED 13:38]` Orphan-tree pathology in autossh-wrapper supervised by Task Scheduler — wscript → bash supervisor → bash worker → 3-deep autossh self-fork → ssh.exe; orphaned leaf with dead-parent-PID retains kernel-side reverse-forward as zombie even when supervisor died. The 6-component persistent-bridge pattern's component #5 stale-process cleanup operates at supervisor-level, NOT orphaned-leaf-cross-tree-walk. **Path B recovery validated:** `schtasks /End` → process-tree query → `Stop-Process -Force` cascade on orphan PIDs → verify RC-side socket release → `schtasks /Run` for fresh tree. **Cal-Protocol-A submission candidate** (n=1 catalyzing-incident materialized): 7th component "orphaned-leaf detector with dead-parent-PID" OR refinement to component #5 cross-tree-walk. Aen queued for Cal post-Phase-B spawn.

- `[LEARNED — discipline, library-first / Layer-0]` Reaffirmed as the load-bearing observation from this dispatch arc. **Candidate Hopper-Amendment-5** (Layer 0 prepended to the three-layer discipline that just landed in Amendment-4). Per the batched-iterate compact with Celes from 14:47 yesterday, deferred to next amendment-pass since task #6 catalyzing-incident is now materialized + Amendment-4 has just settled. Not surfacing to Celes now — letting Amendment-4 stabilize for a session or two before proposing the Layer-0 extension; n=1 catalyzing-incident is sufficient for the next round.

(*FR:Hopper*)

---

## 2026-05-27T11:19+03:00 — fr-cma-pilot CF substrate Tier-R pre-flight (PASS-with-ANOMALY)

**timestamp** — 2026-05-27T11:15+03:00 (dispatch landed via Aen) through 2026-05-27T11:19+03:00 (pre-flight batch complete).

**tasker** — Aen (S37 dispatch; PO-routed via Aen per single-coordinator-hub pattern; references PO 14:40 2026-05-26 verbatim sanction "Approve as drafted" against Deliverable 2 NEW Access App POST shape, which remains HELD pending Edit scope).

**dispatch summary** — Read-only pre-flight on Cloudflare pilot substrate `fr-cma-pilot.evree.workers.dev` using current CF API token (`cfut_W91X...605b4`, 4 of 5 required scopes; Access:Apps:Edit MISSING per EVR IT ticket ITSD-38884). Validate Worker + 2 KV + 1 D1 + 1 R2 + Access apps inventory against S35 deploy notes (Aen scratchpad + cf-pilot-status-and-s37-plan-2026-05-26.md). Surface back with full results so next-session Tier-D POST (when Edit scope lands) can execute against verified-current baseline without re-verification.

**tier classification + sanction status** — Tier R throughout; default-permitted; no per-task sanction required. Token redacted in all outputs (form `cfut_W91X...605b4`).

**deployed-artifacts-read declaration** — three-layer probe suite, per-layer attribution:

- **Layer 1 (FR design-as-shipped)** — No on-disk artifacts at `designs/deployed/fr-cma-pilot/container/*` (this is a CF managed-agents-template-derived substrate, not FR-shipped via Brunel Dockerfile-discipline). §Graceful Degradation case 1 applies. Proceed-without-Layer-1-read per Aen S37 dispatch package which references the equivalent canonical sources: `teams/framework-research/docs/cf-pilot-status-and-s37-plan-2026-05-26.md` §1 (deployment substrate established) + §1.2 (bindings provisioned) + scratchpad `[DISPATCH — Task #1 S36 ...]` carry-forward. Aen tasker-confirmation implicit in the dispatch's enumerated expected-bindings list.
- **Layer 2 (consumer-team operational copy)** — CF managed-agents template at `~/Documents/github/.mmp/claude-managed-agents/` (cloned in S35 by Aen-direct; canonical for `wrangler.jsonc` declarations + DO class definitions + worker `src/webhooks.ts` signature-check logic). Not re-probed this pre-flight (S35-S36 reads already canonical; no drift signal in dispatch). Read via prior session: `docs/securing-access.md`, `wrangler.jsonc:80-96` (Container DO commented out), `src/webhooks.ts:74-126` (Standard Webhooks signature verification).
- **Layer 3 (running substrate state — CF control plane)** — six API reads against `https://api.cloudflare.com/client/v4/`, account `8f150f98013eec8cae0a9db20a010c49`:
  - `/user/tokens/verify` → token id `bce585f6572a1229e9133d988379c059`, status active, not_before 2026-05-26T00:00:00Z, expires_on 2026-05-28T23:59:59Z (~37h headroom from probe time)
  - `/accounts/{acct}/workers/scripts` (list) → `fr-cma-pilot` present, modified_on `2026-05-26T10:08:32.237277Z`, created_on `2026-05-26T10:08:06.00474Z` (S35 deploy window confirmed)
  - `/accounts/{acct}/storage/kv/namespaces` → 2 namespaces matching S35 IDs exactly
  - `/accounts/{acct}/d1/database` → 11 total; `fr-cma-pilot-db` UUID `5d28cbc6-5b35-4479-9650-4d793ccbca44`, created `2026-05-26T10:06:10.871Z`, version production, num_tables 0, file_size 114688
  - `/accounts/{acct}/r2/buckets` → 9 total; `fr-cma-pilot-snapshots` present, creation_date `2026-05-26T10:08:20.747Z`
  - `/accounts/{acct}/access/apps` → HTTP 403 Authentication error (scope-not-granted; expected given Edit-scope-missing context, but Read also absent — pre-flight surfaces this distinctly)
- **Audit-trail artifacts (this repo)** — scratchpad `memory/hopper.md` [DISPATCH — Task #1 S36 ...] carry-forward; `docs/cf-pilot-status-and-s37-plan-2026-05-26.md` §3 (token-scope expectation) + §2.4 Deliverable 4 (L3 batch shape).

**commands executed** — six `curl.exe` GET requests via Bash with ephemeral `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` shell vars:

```
curl.exe -sS "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer <REDACTED:cfut_W91X...605b4>"

curl.exe -sS "https://api.cloudflare.com/client/v4/accounts/8f150f98013eec8cae0a9db20a010c49/workers/scripts/fr-cma-pilot" \
  -H "Authorization: Bearer <REDACTED>"

curl.exe -sS "https://api.cloudflare.com/client/v4/accounts/8f150f98013eec8cae0a9db20a010c49/workers/scripts" \
  -H "Authorization: Bearer <REDACTED>"

curl.exe -sS "https://api.cloudflare.com/client/v4/accounts/8f150f98013eec8cae0a9db20a010c49/storage/kv/namespaces" \
  -H "Authorization: Bearer <REDACTED>"

curl.exe -sS "https://api.cloudflare.com/client/v4/accounts/8f150f98013eec8cae0a9db20a010c49/d1/database" \
  -H "Authorization: Bearer <REDACTED>"

curl.exe -sS "https://api.cloudflare.com/client/v4/accounts/8f150f98013eec8cae0a9db20a010c49/r2/buckets" \
  -H "Authorization: Bearer <REDACTED>"

curl.exe -sS "https://api.cloudflare.com/client/v4/accounts/8f150f98013eec8cae0a9db20a010c49/access/apps" \
  -H "Authorization: Bearer <REDACTED>"
```

Token referenced as redacted form `cfut_W91X...605b4` throughout; never written verbatim to scratchpad, ops-log, or SendMessage body. Shell vars exported in single Bash-tool invocations only — not persisted across invocations and not written to any file.

**outputs** — per-check verdict (PASS / FAIL / ANOMALY) with substrate-truth evidence:

| # | Check | Verdict | Evidence (substrate-truth) |
|---|---|---|---|
| 0 | Token verify | PASS | HTTP 200; id `bce585f6...`; status active; expires 2026-05-28T23:59:59Z |
| 1 | Worker `fr-cma-pilot` exists | PASS | HTTP 200; list metadata: modified_on `2026-05-26T10:08:32Z`, created_on `2026-05-26T10:08:06Z`; matches S35 deploy window |
| 2 | KV namespaces (2 expected) | PASS | HTTP 200; `fr-cma-pilot-EGRESS_POLICIES` id `9780ffa017594d2db28581d7f42badb1`; `fr-cma-pilot-SECRETS` id `cf67fa1020be4436bad5fb99919fd2d7`; both IDs match scratchpad to char |
| 3 | D1 `fr-cma-pilot-db` | PASS | HTTP 200; UUID `5d28cbc6-5b35-4479-9650-4d793ccbca44`; matches scratchpad to char; created `2026-05-26T10:06:10Z` |
| 4 | R2 `fr-cma-pilot-snapshots` | PASS | HTTP 200; bucket present; created `2026-05-26T10:08:20Z` |
| 5 | Access apps inventory | **ANOMALY — token scope** | HTTP 403; `{"errors":[{"code":10000,"message":"Authentication error"}],"success":false}`; endpoint `GET /accounts/{acct}/access/apps`. **Not a substrate problem** — substrate is presumably in expected state (no `fr-cma-pilot` Access app yet) but cannot be verified with current token. Read scope on Access also absent, not just Edit. |

**outcome** — partial (substrate checks 1-4 PASS; Access-apps check 5 ANOMALY at token-scope layer, not substrate layer).

**Recommendation:** **ready-for-Tier-D-once-Edit-scope-lands**, with the following caveat surfaced for PO/Aen via task #1 channel:

- The Access:Apps:Edit scope grant request should be **expanded to include Access:Apps:Read** (or whatever scope name CF uses for `GET /access/apps`). Without Read, pre-flight cannot confirm the "no existing `fr-cma-pilot` Access app" precondition that the dispatched Tier-D POST shape (NEW App with `destinations: [{type:"public", uri:"fr-cma-pilot.evree.workers.dev/webhooks"}]`) assumes.
- If CF's dashboard exposes Read-and-Edit as a single "Edit" affordance (some CF scope categories grant Read implicitly with Edit), the ITSD-38884 grant may resolve both at once. If the scopes are separate, the ticket needs a one-line amendment.
- Substrate-state for the four bindings (Worker + KV + D1 + R2) is verified-current and matches S35 baseline exactly — the 14:40 PO Tier-D sanction is against a substrate-state that has not drifted since the sanction was issued. **No substrate-state-requires-re-sanction**; the only remaining gate is the scope grant.

**Token state for next-session execution:** valid through 2026-05-28T23:59:59Z. ~37h headroom from probe time; if Edit scope grant lands within that window, the same token can execute Tier-D POST without re-issuance. If grant arrives after 2026-05-28T23:59:59Z, fresh token issuance required per Deliverable-1 shape (`docs/cf-pilot-status-and-s37-plan-2026-05-26.md` §3).

**No Tier M or D executed.** All operations Tier R; pre-flight discipline honored end-to-end. Substrate untouched.

**Cross-references:**

- `teams/framework-research/docs/cf-pilot-status-and-s37-plan-2026-05-26.md` §2.4 Deliverable 4 (L3 batch — this entry's checks 1-4 are subset)
- `teams/framework-research/docs/cf-pilot-status-and-s37-plan-2026-05-26.md` §3.2 (Required scopes — 5; current token has 4; Access:Apps:Edit missing per ITSD-38884; **this entry surfaces additional gap: Access:Apps:Read also missing or not granted**)
- `teams/framework-research/memory/hopper.md` [DISPATCH — Task #1 S36 ...] carry-forward
- TaskList task #1 (Request Access:Apps and Policies:Edit scope from EVR CF admin) — recommend Aen review whether to expand task #1's scope or add task to track Read-scope gap distinctly

(*FR:Hopper*)

---

## 2026-05-27T13:01+03:00 — fr-cma-pilot Round-1 op-step-2 secret-rotation (SUCCESS-via-retry; discipline-gap surfaced and corrected)

**timestamp** — 2026-05-27T12:05+03:00 (dispatch arc begins: KV-keys inventory dispatch) through 2026-05-27T13:01+03:00 (Tier-M retry success + guarded shred). Three-phase arc; logged as one coherent entry per Aen 12:11 dispatch-close approval.

**tasker** — Aen (single tasker across arc; PO-routed per single-coordinator-hub pattern). PO 12:11 verbatim Tier-M sanction "sanction approved" against three-component action package; PO 12:58 verbatim "1" choosing Path-1 retry path (rewrite ephemeral file + apply fixes).

**dispatch summary** — Round-1 op-step-2: rotate two of four worker `secret_text` bindings to PO Option A "three-credential split" per CMA reference impl. Carried via three sub-dispatches:

1. **12:05 Tier-R KV-keys inventory** (Aen dispatch) — list NAMES only in CF KV `SECRETS` namespace (id `cf67fa1020...`); confirm `WEBHOOK_SECRET` present; surface drift.
2. **12:11 Tier-M batch attempt 1** (Aen dispatch + PO sanction) — `wrangler secret put ANTHROPIC_API_KEY` + `wrangler secret put ANTHROPIC_ENVIRONMENT_KEY` with `--name fr-cma-pilot`, values via stdin-pipe from ephemeral creds file, post-success shred. FAILED pre-API on ambiguous-account error; **operator-side discipline gap on shred bundling**.
3. **12:58 Tier-M batch retry** (Aen re-dispatch + PO restated sanction-via-path-choice "1") — two fixes (CLOUDFLARE_ACCOUNT_ID env-var + structural decomposition for guarded shred). SUCCESS on first attempt.

**tier classification + sanction status** — by sub-dispatch:

- **Sub-dispatch 1** = Tier R (default-permitted; no per-task sanction). KV-keys list via `GET /accounts/{acct}/storage/kv/namespaces/{ns_id}/keys`. Plus two within-dispatch-agency Tier R disambiguator probes (sister KV + worker `/settings` endpoint) per Aen's empty-namespace hard-gate "surface, then disambiguate."
- **Sub-dispatch 2** = Tier M (designed-recovery mutation; substrate-mechanism is `wrangler secret put` which is the canonical wrangler secret-rotation API — idempotent overwrite, atomic, substrate handles secret-binding lifecycle). PO sanction verbatim 12:11:
  > "Commands: `wrangler secret put ANTHROPIC_API_KEY --name fr-cma-pilot` (stdin: full sk-ant-api03 value); `wrangler secret put ANTHROPIC_ENVIRONMENT_KEY --name fr-cma-pilot` (stdin: full sk-ant-oat01 value). Reason: Round-1 Option A overwrite of S35 OAuth-everywhere values per CMA reference impl. Expected outcome: both commands return success; bindings updated (no read-back possible); WEBHOOK_SECRET + ENVIRONMENT_ID untouched; Worker auto-redeploys."
  
  Tier-M single-line-ack-suffices threshold per hopper.md:88 satisfied; PO-direct sanction routed through Aen per single-coordinator-hub.
- **Sub-dispatch 3** = Tier M same as sub-dispatch 2 (retry of same operation; PO 12:58 verbatim "1" chose Path 1 = "proceed with retry; I rewrite the file from my held context; you apply the fix" — within-scope retry of originally-sanctioned operation with two disciplined corrective fixes). Aen 12:58 re-dispatch text named two fixes: CLOUDFLARE_ACCOUNT_ID env-var, guarded shred. Both fixes are disciplined corrections (one Layer-0 library-first from wrangler's own error message; one operator-discipline carry-forward from sub-dispatch 2's [LEARNED]), not new substrate decisions.

**deployed-artifacts-read declaration** — three-layer probe suite, per-layer attribution:

- **Layer 1 (FR design-as-shipped)** — No on-disk artifacts at `designs/deployed/fr-cma-pilot/container/*` per §Graceful Degradation case 1 (carry-forward from 2026-05-27T11:19 ops-log entry's same-substrate disposition). Proceed-without-Layer-1-read; canonical substrate-design source is `teams/framework-research/docs/cf-pilot-status-and-s37-plan-2026-05-26.md` §1.3 (4 worker-level secrets enumeration). Aen tasker-confirmation implicit in dispatch's enumerated commands. **Documentation-grade finding surfaced retroactively to Layer 1 (see substrate-truth section below):** §1.3 column header "wired into KV SECRETS namespace" was a mechanism-misattribution; actual S35 mechanism was `wrangler secret put` = worker-script `secret_text` bindings.
- **Layer 2 (consumer-team operational copy)** — CMA template at `~/Documents/github/.mmp/claude-managed-agents/`. Read this dispatch: `package.json` scripts (confirms wrangler available locally at `node_modules/.bin/wrangler` via npx); `wrangler.jsonc` indirectly via wrangler error text (confirms NO pinned `account_id` field in operational config — wrangler's ambiguous-account error names this gap explicitly). `npx wrangler --version` confirmed 4.90.0; `npx wrangler whoami` confirmed logged-in OAuth session with d1+secrets+workers write scopes (sufficient for `secret put`); `npx wrangler secret put --help` confirmed `--name` flag + stdin-piped value pattern.
- **Layer 3 (running substrate state — CF control plane)** — multiple Tier-R reads:
  - `GET /accounts/{acct}/storage/kv/namespaces/{cf67fa1020...}/keys` → 0 keys (KV `SECRETS` empty)
  - `GET /accounts/{acct}/storage/kv/namespaces/{9780ffa017...}/keys` → 0 keys (KV `EGRESS_POLICIES` empty; disambiguator)
  - `GET /accounts/{acct}/workers/scripts/fr-cma-pilot/settings` → 16 bindings inventoried (4 secret_text + 12 others)
  - `GET /accounts/{acct}/workers/scripts` (pre-Tier-M baseline) → modified_on `2026-05-26T10:08:32.237277Z`
  - `GET /accounts/{acct}/workers/scripts/fr-cma-pilot/settings` (post-attempt-1-failure verification) → 4 secret_text bindings intact at S35 names; substrate clean post-failure
  - `GET /accounts/{acct}/workers/scripts` (post-Tier-M-retry-success baseline) → modified_on `2026-05-26T10:08:32.237277Z` (UNCHANGED — see substrate-truth observation below)
  - `GET /accounts/{acct}/workers/scripts/fr-cma-pilot/settings` (post-Tier-M-retry-success verification) → 4 secret_text bindings unchanged in count + names
- **Audit-trail artifacts (this repo)** — `docs/cf-pilot-status-and-s37-plan-2026-05-26.md` §1.3 (S35 secret enumeration; mechanism-misattribution surfaced this dispatch); scratchpad `memory/hopper.md` carry-forward across three sub-dispatches; prior ops-log entry `2026-05-27T11:19+03:00` (same substrate, same session).

**commands executed** — verbatim, including substrate prefix:

Sub-dispatch 1 (Tier R inventory + disambiguator):
```
curl.exe -sS "https://api.cloudflare.com/client/v4/accounts/8f150f98013eec8cae0a9db20a010c49/storage/kv/namespaces/cf67fa1020be4436bad5fb99919fd2d7/keys" \
  -H "Authorization: Bearer <REDACTED:cfut_W91X...605b4>"

curl.exe -sS "https://api.cloudflare.com/client/v4/accounts/8f150f98013eec8cae0a9db20a010c49/storage/kv/namespaces/9780ffa017594d2db28581d7f42badb1/keys" \
  -H "Authorization: Bearer <REDACTED>"

curl.exe -sS "https://api.cloudflare.com/client/v4/accounts/8f150f98013eec8cae0a9db20a010c49/workers/scripts/fr-cma-pilot/settings" \
  -H "Authorization: Bearer <REDACTED>"
```

Sub-dispatch 2 (Tier M attempt 1 — FAILED pre-API):
```
cd ~/Documents/github/.mmp/claude-managed-agents
VAL_API=$(grep -E '^ANTHROPIC_API_KEY=' "$CREDS_FILE" | sed 's/^ANTHROPIC_API_KEY=//' | sed 's/^"//;s/"$//')
VAL_ENV=$(grep -E '^ANTHROPIC_ENVIRONMENT_KEY=' "$CREDS_FILE" | sed 's/^ANTHROPIC_ENVIRONMENT_KEY=//' | sed 's/^"//;s/"$//')
printf '%s' "$VAL_API" | npx wrangler secret put ANTHROPIC_API_KEY --name fr-cma-pilot
# EXIT_1=1 — "More than one account available but unable to select one in non-interactive mode"
printf '%s' "$VAL_ENV" | npx wrangler secret put ANTHROPIC_ENVIRONMENT_KEY --name fr-cma-pilot
# EXIT_2=1 — same error
unset VAL_API VAL_ENV
rm -f "$CREDS_FILE"  # <-- DISCIPLINE GAP: ran unconditionally because && chain guarded on intervening echo, not on EXIT_N
```

Sub-dispatch 3 (Tier M retry — SUCCESS):
```
# Invocation 1 (write + Tier-R verify; NO shred)
cd ~/Documents/github/.mmp/claude-managed-agents
export CLOUDFLARE_ACCOUNT_ID=8f150f98013eec8cae0a9db20a010c49   # Fix 1: account disambiguation
VAL_API=$(grep -E '^ANTHROPIC_API_KEY=' "$CREDS_FILE" | sed 's/^ANTHROPIC_API_KEY=//' | sed 's/^"//;s/"$//')
VAL_ENV=$(grep -E '^ANTHROPIC_ENVIRONMENT_KEY=' "$CREDS_FILE" | sed 's/^ANTHROPIC_ENVIRONMENT_KEY=//' | sed 's/^"//;s/"$//')
printf '%s' "$VAL_API" | npx wrangler secret put ANTHROPIC_API_KEY --name fr-cma-pilot
# EXIT_1=0 — "✨ Success! Uploaded secret ANTHROPIC_API_KEY"
printf '%s' "$VAL_ENV" | npx wrangler secret put ANTHROPIC_ENVIRONMENT_KEY --name fr-cma-pilot
# EXIT_2=0 — "✨ Success! Uploaded secret ANTHROPIC_ENVIRONMENT_KEY"
unset VAL_API VAL_ENV
curl.exe -sS "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts/fr-cma-pilot/settings" -H "Authorization: Bearer <REDACTED>"
# 4 secret_text bindings confirmed: ANTHROPIC_API_KEY, ANTHROPIC_ENVIRONMENT_KEY, ENVIRONMENT_ID, WEBHOOK_SECRET

# Invocation 2 (guarded shred — Fix 2: cleanup at audit boundary, not buried in shell)
# Preconditions from Invocation 1 transcript: EXIT_1=0, EXIT_2=0, both wrangler "✨ Success!" lines, binding count=4 verified
rm -f "$CREDS_FILE"
# rm exit 0; [ ! -e "$CREDS_FILE" ] → True (file gone)
```

Token referenced as redacted form `cfut_W91X...605b4` throughout; never written verbatim. Verbatim credential values (lengths 108, prefixes `sk-ant-api03` and `sk-ant-oat01-X`) never persisted to scratchpad, ops-log, or SendMessage body.

**outputs** — substrate-truth findings + outcome by phase:

| Phase | Outcome | Substrate-truth |
|---|---|---|
| Sub-1: KV inventory | PASS-with-SUBSTRATE-TRUTH | KV `SECRETS` + `EGRESS_POLICIES` both EMPTY (count=0); worker script has 16 bindings including 4 `secret_text` (ANTHROPIC_API_KEY, ANTHROPIC_ENVIRONMENT_KEY, ENVIRONMENT_ID, WEBHOOK_SECRET). **Mechanism-misattribution surfaced:** S35's "4 secrets to KV SECRETS" was actually 4 worker-script `secret_text` bindings via `wrangler secret put`. cf-pilot-status §1.3 column header is wrong. |
| Sub-2: Tier-M attempt 1 | FAILED pre-API (no substrate write) | Both `wrangler secret put` returned exit 1 with `"More than one account available but unable to select one in non-interactive mode"` — CMA template's `wrangler.jsonc` does not pin `account_id`; non-interactive shell cannot prompt. Substrate state verified UNCHANGED post-failure (4 bindings at S35 values). |
| Sub-2 discipline gap | Self-surfaced + carried forward | Operator shredded ephemeral creds file in same atomic bash pipeline; `&&` chain guarded on intervening `echo "EXIT_N=$N"` (always exit-0) rather than on the wrangler exit codes. "Shred after success" misinterpreted as syntactic-temporal-position rather than conditional-on-success. **[LEARNED] recorded in scratchpad; sub-shape candidate for Cal Protocol A if n=2 materializes.** |
| Sub-3: Tier-M retry | PASS | Both `wrangler secret put` returned exit 0 with `"✨ Success! Uploaded secret <NAME>"` on first attempt. Account disambiguation via `CLOUDFLARE_ACCOUNT_ID` env-var (Layer-0 library-first: wrangler's own error text was the canonical fix-source). Structural decomposition (two Bash-tool invocations: write+verify then guarded-shred) made the conditional gate visible at the human/audit boundary. |
| Sub-3 verification | PASS | Worker `/settings` re-read: 4 `secret_text` bindings unchanged in count + names. Values opaque (secret_text bindings are write-only by design). |
| Sub-3 shred | PASS | Guarded shred fired correctly on conjoined-success preconditions (EXIT_1=0 AND EXIT_2=0 AND wrangler-success-confirmations-observed AND binding-count-verification-passed). File removed; `[ -e "$CREDS_FILE" ]` returned False; verified gone. |

**Substrate-truth observation on `modified_on` (worth surfacing; not a failure):**

The dispatch's expected-outcome included "Worker auto-redeploys" ostensibly verifiable by `modified_on` field delta. Observed:

```
modified_on_BEFORE:  2026-05-26T10:08:32.237277Z
modified_on_AFTER:   2026-05-26T10:08:32.237277Z   (UNCHANGED)
```

`modified_on` reflects script-bundle deploy timestamp, not secret-binding-rotation timestamp. `wrangler secret put` updates secret bindings via a separate control-plane endpoint that does NOT bump the script's `modified_on`. The secrets ARE live (wrangler's success confirmations are authoritative; CF API binding-inventory confirms presence), but the Worker did not "re-deploy" in the script-bundle sense. **Documentation-level expected-outcome marker** in the dispatch text doesn't match wrangler-substrate behavior at the `modified_on` granularity. Canonical positive-control paths if needed in future: (a) trigger a Worker request that uses one of the new env values — not viable Round-1 without sessions; (b) CF audit-log secret-rotation event (right token scope required); (c) trust wrangler's success message + CF API binding inventory (both confirmed). For Round-1 this dispatch, (c) is sufficient.

**outcome** — SUCCESS (via retry).

- Substrate operation complete: 2 of 4 worker `secret_text` bindings rotated to Option A values (`ANTHROPIC_API_KEY` to fresh `sk-ant-api03-...` regular API key; `ANTHROPIC_ENVIRONMENT_KEY` to fresh `sk-ant-oat01-...` OAuth env key). Other 2 (`WEBHOOK_SECRET`, `ENVIRONMENT_ID`) untouched per dispatch scope.
- Credential discipline: ephemeral file shredded + verified gone; shell vars unset; verbatim values discarded; CF API token used Tier-R only, redacted throughout.
- Discipline self-correction: shred-bundled-with-write [LEARNED] recorded in scratchpad with recovery primitives (explicit conjoined check OR structural-decomposition into two Bash-tool invocations); retry applied structural decomposition; gate fired correctly.
- Documentation surface: cf-pilot-status §1.3 mechanism-misattribution surfaced for future-Hopper/Brunel/Aen documentation correction (not corrected in this entry; ops-log is append-only; Aen owns whether the §1.3 doc gets amended).

**No Tier D executed.** Op-step-1 (path-rule bypass) remains held pending Edit scope grant (ITSD-38884).

**Cross-references:**

- `teams/framework-research/docs/cf-pilot-status-and-s37-plan-2026-05-26.md` §1.3 (S35 4-secret enumeration; mechanism-misattribution surfaced)
- `teams/framework-research/docs/operations-log-2026-05.md` 2026-05-27T11:19+03:00 entry (preceding pre-flight against same substrate; same session)
- `teams/framework-research/memory/hopper.md` [DISPATCH — Task #2 S37 op-step-2 prep/Tier-M/retry] entries + [LEARNED — discipline, credential-cleanup-bundled-with-credential-use] entry
- TaskList task #2 (Provision three Anthropic credentials per reference-impl split) — operationally complete on substrate-side post sub-dispatch 3; task ownership remains with Aen for closure decision

(*FR:Hopper*)
