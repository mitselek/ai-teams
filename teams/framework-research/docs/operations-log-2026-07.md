# Operations Log -- 2026-07 (*FR:Hopper*)

Append-only operations log per `teams/framework-research/prompts/hopper.md` (Provenance -- Role-of-Record section). Each entry has all 8 required fields. No edits to prior entries; corrections go as new entries referencing the original by timestamp.

---

## 2026-07-24T16:28+03:00 -- GH #104 apex GitLab forward: tunnel-substrate locate + change specification (execution transferred to PO)

**timestamp** -- 2026-07-24T16:28+03:00 (dispatch received, Task #1 in_progress) through 2026-07-24T16:42+03:00 (three drafts delivered to team-lead). Entry covers the locate and specification phases only; the apply/verify phase is PO-executed and will be logged as a separate completion entry.

**tasker** -- Aen (team-lead), S66. Task #1. Origin: apex-research (Schliemann, S65) via GH issue #104 plus a parallel courier consignment. PO (Mihkel) supplied three rulings mid-dispatch at 16:41, relayed by Aen.

**dispatch summary** -- apex-research asked FR to extend "the stationmaster-managed tunnel system" providing their container-local Oracle forwards (`11521` → VJSDBTEST/DEV, `11522` → VJSDBTEST2/TEST) with one additional TCP forward, container-local `11443` → `gitlab.evr.ee:443`, as a legacy-code reverse-engineering substrate. Three deliverables requested: (1) forward added plus persistence semantics relative to the DB tunnels, (2) confirm or reassign the local port, (3) state anything FR wants in their planned `nc -z 11443` entrypoint probe. Explicit instruction from the tasker: locate the mechanism before proposing any edit, and report mechanism plus proposed change to team-lead before applying, because 11521/11522 are live and another team depends on them.

**tier classification + sanction status** -- **Tier R throughout; no substrate mutation performed.** All work in this entry was read-only inspection (file reads, DNS resolution, process enumeration, listener enumeration, TCP/L7 reachability probes). Default-permitted, no per-task sanction required.

Two sanction notes of record:

1. **Tier pre-classification withdrawn.** My 16:34 report labelled the proposed change "Tier D" and the proposed feasibility probe "Tier M". Aen corrected at 16:29 (crossed in flight): the tier call belongs to the tasker at dispatch time; the operator validates, does not assign. Both labels were withdrawn at 16:37 and restated as evidence. No operation was executed under either withdrawn label.
2. **No Tier M/D operation was ever sanctioned or run**, because PO ruling (b) transferred execution away from FR entirely (see outcome).

PO rulings quoted verbatim from Aen's 16:41 relay:
- (a) *"Step A — SUPERSEDED, do not run. The workstation guardrail stands unwaived."*
- (b) *"Ownership — FR SPECIFIES, PO APPLIES. You do not touch `apex-migration-research` and you do not run anything on the workstation."*
- (c) *"Blast radius — PO ratified SINGLE SESSION as apex asked. Your separate-autossh proposal was offered and declined. Log the `ExitOnForwardFailure` coupling as an accepted risk … Do not re-litigate it."*

**deployed-artifacts-read declaration** --

- **Layer 1 (FR design-as-shipped):** `designs/deployed/apex-research/container/entrypoint-apex.sh:365-372` -- the Oracle dev-DB tunnel check. FR ships only the consumer-side soft probe; the file's own comment (lines 366-367) disclaims tunnel ownership: *"Tunnels are opened by the operator from their Windows machine; see apex-migration-research/.claude/bin/open-db-tunnels.sh."* **Layer 1 does not contain the tunnel mechanism at all** -- the substrate under change is not FR-shipped. Supporting wiki reads: `wiki/references/rc-host-db-tunnel-architecture.md`, `wiki/patterns/windows-user-context-persistent-bridge.md`, `wiki/gotchas/warp-dns-vs-routing-asymmetry-rc-host.md`, `wiki/gotchas/cross-msys-argv-mangling.md` -- all four verified still accurate against live state.
- **Layer 2 (operational copy):** `C:\Users\mihkel.putrinsh\Documents\github\apex-migration-research\.claude\bin\` -- `autossh-db-tunnels.sh` (read in full; forwards at lines 46-53, `ExitOnForwardFailure=yes` at line 49, wrapper loop lines 38-57, pkill cleanup lines 42-43, host/key hardcoded lines 18-19), `open-db-tunnels.sh` (superseded one-shot variant), `register-tunnel-task.ps1` (task name line 7, triggers lines 19-26, settings lines 28-33, principal line 35), `run-tunnel-hidden.vbs` (launcher line 13). Git state: repo on `main`, `.claude/bin/` clean, last touching commit `183de33b`. **This is another team's repo on the PO's workstation -- outside FR's substrate scope, surfaced to team-lead as scope flag rather than crossed.**
- **Layer 3 (running state):** Windows workstation process table via `Get-CimInstance Win32_Process` -- single live chain wscript 11120 → bash 19300 → bash 18832 → bash 15612 → autossh 15136 (scoop shim) → autossh 17200 (supervisor) → autossh 11588 → ssh 14728 (`C:\Windows\System32\OpenSSH\ssh.exe`, per the AUTOSSH_PATH cross-MSYS fix). One ssh session carries both `-R` forwards. Task Scheduler: `ApexResearch-DBTunnels` State=Running. RC host listener table via `ss -lnt`. apex container filesystem/tooling via `docker exec apex-research`. Supervisor log `~/.claude/logs/autossh-db-tunnels.log` (6419 lines; 40 lifetime wrapper respawns; current autossh at ssh-restart count 30 after a 255-churn burst ending 13:55:29).
- **Audit-trail artifacts (this repo):** this entry; scratchpad `[DISPATCH]` / `[GOTCHA]` / `[DECISION]` entries in `teams/framework-research/memory/hopper.md`; three drafts (PO apply-pack, apex stationmaster reply, GH #104 comment) delivered to team-lead at 16:42, none dispatched.

**commands executed** (verbatim) --

1. `gh issue view 104`
2. `powershell -NoProfile -Command "Get-ScheduledTask | Where-Object {$_.TaskName -match 'Tunnel|Apex|DBTunnel'} | Select-Object TaskName,State,TaskPath | Format-List"`
3. `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='autossh.exe' or Name='ssh.exe' or Name='wscript.exe' or Name='bash.exe'\" | Select-Object ProcessId,ParentProcessId,Name,CommandLine | Format-List"`
4. `nslookup gitlab.evr.ee` ; `nslookup vjsdbtest.evr.ee`
5. `curl -s -o /dev/null -w 'http_code=%{http_code}\nredirect=%{redirect_url}\nremote_ip=%{remote_ip}\n' --max-time 20 https://gitlab.evr.ee/` and `curl -s -I --max-time 20 https://gitlab.evr.ee/`
6. `ssh -T -o BatchMode=yes -o ConnectTimeout=15 dev@100.96.54.170 "ss -lntp 2>/dev/null | grep -E '114[0-9][0-9]|1152[0-9]' ; echo '---ALL-11xxx---'; ss -lnt | awk 'NR==1 || $4 ~ /:11[0-9][0-9][0-9]$/'"`
7. `cd /c/Users/mihkel.putrinsh/Documents/github/apex-migration-research && git status --short .claude/bin/ ; git branch --show-current ; git log -1 --oneline -- .claude/bin/autossh-db-tunnels.sh`
8. `tail -15 ~/.claude/logs/autossh-db-tunnels.log ; grep -c "wrapper: autossh exited" ~/.claude/logs/autossh-db-tunnels.log ; wc -l < ~/.claude/logs/autossh-db-tunnels.log`
9. `ssh -T dev@100.96.54.170 "docker exec apex-research sh -c 'command -v nc || echo NO_NC; command -v curl || echo NO_CURL; command -v getent >/dev/null && getent hosts gitlab.evr.ee || echo NO_RESOLVE; grep -n gitlab /etc/hosts || echo NO_HOSTS_ENTRY'"`
10. `ssh -T dev@100.96.54.170 "docker exec apex-research bash -c 'for p in 11521 11522 11443; do if timeout 3 bash -c \"echo -n > /dev/tcp/127.0.0.1/$p\" 2>/dev/null; then echo \"$p OPEN\"; else echo \"$p CLOSED\"; fi; done'"`

**outputs** (key excerpts) --

- **Mechanism is not stationmaster.** Stationmaster appears at no layer. The substrate is an operator-side reverse-SSH bridge on the PO's Windows workstation, owned by the apex-migration-research repo. apex's issue text is wrong on this point.
- **Single-session topology (cmd 3):** `autossh -M 0 -i C:/Users/.../.ssh/id_ed25519 -R 11521:vjsdbtest.evr.ee:1521 -R 11522:vjsdbtest2.evr.ee:1521 -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=accept-new -N dev@100.96.54.170`. Both forwards on one command line, one ssh session. There is **no designed add-a-forward path** -- no config file, no forwards list, no env var, no include.
- **Port 11443 free (cmd 6):** RC listeners in range are `127.0.0.1:11521`, `127.0.0.1:11522` (both also on `[::1]`), and `127.0.0.1:11434` (Ollama). Forwards bind both v4 and v6 loopback.
- **Log corroborates apex's status line exactly (cmd 8):** 40 lifetime wrapper respawns; `ssh exited with error status 255; restarting ssh` churn burst resolving at `starting ssh (count 30)` 13:55:29, stable since.
- **DNS asymmetry -- apex's stated premise is false (cmd 4):** `vjsdbtest.evr.ee` → `10.100.34.42` (internal RFC1918, genuinely no Cloudflare in path). `gitlab.evr.ee` → `172.66.43.48` / `172.66.40.208` / `2606:4700:3108::ac42:28d0` -- **Cloudflare anycast**. GitLab is Cloudflare-fronted; there is no internal IP to forward to, and no TCP forward can route around CF Access.
- **What actually passes Access (cmd 5):** from the WARP-enrolled workstation, `https://gitlab.evr.ee/` → `302` to `https://gitlab.evr.ee/users/sign_in` with GitLab origin headers (`x-gitlab-meta`, `x-request-id`, `x-runtime`) -- **not** the `eestiraudtee.cloudflareaccess.com` redirect apex received. Response sets `CF_Authorization`; JWT payload decodes to `iss: https://eestiraudtee.cloudflareaccess.com`, `email: mihkel.putrinsh@evr.ee`, `device_id: 95fd90cf-0ca8-11f1-9508-3e635b4fb373`, **`warp_as_auth: true`**. Access is satisfied by the originating machine's WARP device identity, not by anything in the tunnel.
- **New defect in apex's existing probe (cmd 9):** **`nc` is not installed in the apex container** (`NO_NC`); `curl` present at `/usr/bin/curl`. The gate at `entrypoint-apex.sh:368` is `command -v nc >/dev/null 2>&1 && nc -z -w3 127.0.0.1 11521` -- with `nc` absent the guard short-circuits and the branch always falls through to `WARN: DB tunnel down`, regardless of real tunnel state. That probe has never been able to report OK, and apex's plan to mirror it for 11443 would ship a second probe that also never runs. Container has no `/etc/hosts` entry for gitlab; in-container `getent hosts gitlab.evr.ee` returns the same Cloudflare anycast IPv6 addresses.
- **Verified nc-free baseline (cmd 10):** `11521 OPEN / 11522 OPEN / 11443 CLOSED` via `timeout 3 bash -c "echo -n > /dev/tcp/127.0.0.1/$p"`. Unambiguous before/after baseline for the PO's verify step.

**outcome** -- **partial (by design; execution transferred out of FR).** Locate complete at all three layers with no drift found; all three of apex's deliverables answered; change fully specified (exact one-line diff with position rationale, apply command, three-step verify sequence, rollback). **Nothing mutated: no file edited, no process cycled, no command run against the workstation or apex's repo.** Per PO ruling (b) the edit is applied by the PO, not by FR; per ruling (a) the separate-port feasibility probe was superseded and not run, its purpose folded into verify step 3.

Two items carried to the completion entry: (i) the WARP-through-ssh premise remains **unproven** -- verify step 3 (`302` through 11443, with a redirect to `eestiraudtee.cloudflareaccess.com` or a `403`/`530` reading as premise-failed, not as a GitLab fault) is the proof, and I declined to report the forward as working on inference; (ii) the `ExitOnForwardFailure=yes` session-wide coupling is recorded here as **PO-ratified accepted risk** -- a future bind failure on 11443 will refuse the whole ssh session and take 11521/11522 down with it, with the wrapper respawn-failing every ~11s until the line is removed. A separate second autossh session was offered and declined in favour of the single-session shape apex requested.

Task #1 remains `in_progress` pending the PO's verify results.

(*FR:Hopper*)

---

## 2026-07-24T16:52+03:00 -- GH #104 apex GitLab forward: Tier D EXECUTED, aborted mid-execution at hard gate (change inert, no outage)

**timestamp** -- 2026-07-24T16:52+03:00 (sanction validated, pre-flight) through 2026-07-24T16:54+03:00 (hard-gate stop, surfaced to tasker). References the 2026-07-24T16:28+03:00 entry as the locate/specification phase of the same dispatch.

**tasker** -- Aen (team-lead), relaying PO sanction. Supersedes ruling (b) of the 16:41 relay for execution only: FR applies, specification authorship unchanged.

**dispatch summary** -- Apply the specified one-line forward `-R 11443:gitlab.evr.ee:443` to the apex-owned tunnel wrapper on the PO's Windows workstation, cycle the bridge, confirm the new argv, and run verify steps 1-3. Scope waiver granted for four named operations (edit, cycle, confirm-argv, verify) and explicitly nothing else.

**tier classification + sanction status** -- **Tier D. Sanction COMPLETE at dispatch; all three components present and validated before execution.**

- *(a) exact command* -- edit text, insertion point (between lines 48/49, 8-space indent, trailing backslash), and both PowerShell one-liners quoted verbatim in the dispatch.
- *(b) stated reason* -- quoted: *"The forwards are hardcoded `-R` flags with no designed add-a-forward path, so the change is a hand-edit to a live wrapper. Apex needs the TCP path for the GitLab legacy-code substrate; the CF-Access-gated direct path is unavailable to their container."*
- *(c) expected outcome* -- six LISTEN lines; `11521 OPEN / 11522 OPEN / 11443 OPEN`; `code=302 redirect=https://gitlab.evr.ee/users/sign_in`; ~11s Oracle outage during respawn.
- Dispatch additionally carried a **pre-authorised rollback** (if 11521/11522 read CLOSED, roll back without asking) and a **report-and-hold** condition (step 3 non-302). Neither fired: the failure mode was outside both.
- Scope waiver quoted: *"waives the workstation bar for the four operations named below and nothing else."* Treated literally -- see outcome.

**deployed-artifacts-read declaration** --

- **Layer 1 (FR design-as-shipped):** no re-read this phase; unchanged from the 16:28 entry (`entrypoint-apex.sh:365-372`, FR ships the consumer probe only, not the tunnel).
- **Layer 2 (consumer-team operational copy):** re-read `apex-migration-research/.claude/bin/autossh-db-tunnels.sh:38-57` immediately pre-execution to confirm no drift since 16:34 -- **confirmed identical**; forwards at 47-48, `ExitOnForwardFailure=yes` at 49, `pkill` cleanup at 42-43. Backup taken **outside both repos** (scratchpad, md5 `24a6b72db2f596584ade6c44f3c3a2fd`) rather than a `.bak` inside apex's tree, per the dispatch's "no other file in either repo" bar.
- **Layer 3 (running state):** pre-change RC listeners + in-container TCP baseline; Windows process table before and after the cycle; wrapper/wscript process ages; supervisor log tail.
- **Audit-trail artifacts (this repo):** this entry; the 16:28 entry; scratchpad; hard-gate report to team-lead at 16:54.

**commands executed** (verbatim) --

1. (Tier R pre-flight) `ssh -T -o BatchMode=yes -o ConnectTimeout=15 dev@100.96.54.170 "ss -lnt | grep -E ':(11443|11521|11522)\b'; docker exec apex-research bash -c 'for p in 11521 11522 11443; do timeout 3 bash -c \"echo -n > /dev/tcp/127.0.0.1/$p\" 2>/dev/null && echo \"$p OPEN\" || echo \"$p CLOSED\"; done'"`
2. `cp .../autossh-db-tunnels.sh <scratchpad>/autossh-db-tunnels.sh.pre-11443` (backup outside both repos)
3. **EDIT** -- inserted `        -R 11443:gitlab.evr.ee:443 \` between lines 48 and 49 of `C:\Users\mihkel.putrinsh\Documents\github\apex-migration-research\.claude\bin\autossh-db-tunnels.sh`
4. `bash -n .claude/bin/autossh-db-tunnels.sh` -> `BASH_SYNTAX_OK`; `diff <backup> <file>` -> `48a49 > -R 11443:gitlab.evr.ee:443 \` (exactly one line changed)
5. **CYCLE** -- `Get-CimInstance Win32_Process -Filter "Name='autossh.exe' OR Name='ssh.exe'" | Where-Object { $_.CommandLine -like '*-R 11521:vjsdbtest*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`
6. **CONFIRM ARGV** -- `Get-CimInstance Win32_Process -Filter "Name='ssh.exe' OR Name='autossh.exe'" | Where-Object { $_.CommandLine -like '*vjsdbtest*' } | Select-Object ProcessId,Name,CommandLine`
7. (Tier R post-check) repeat of command 1; plus wrapper/wscript process-age probe; plus `tail -4` of `~/.claude/logs/autossh-db-tunnels.log`

**outputs** --

- Command 1 (baseline): `11521`/`11522` LISTEN on `127.0.0.1` and `[::1]`; container `11521 OPEN / 11522 OPEN / 11443 CLOSED`.
- Command 5: four processes matched and terminated -- `15136` (autossh shim), `17200` (autossh supervisor), `11588` (autossh child), `14728` (ssh). **The CIM approach worked exactly as intended; no silent no-op. The pkill-substitution decision was validated.**
- **Command 6 -- THE HARD GATE.** Respawn produced fresh pids `7768` / `28272` / `9992` (autossh) and `7616` (ssh), all carrying `-R 11521:vjsdbtest.evr.ee:1521 -R 11522:vjsdbtest2.evr.ee:1521` and **no `-R 11443`**. Supervisor log confirms a clean fresh cycle: `16:53:28 wrapper: autossh exited (rc=0), restarting in 10s` then `16:53:39 autossh[28272]: starting ssh (count 1)`.
- Process-age probe: **wrapper bash pid `18832` still alive from 10:48:05**, having spawned a new loop-iteration child `24620` at 16:53:39. wscript `11120` alive from 10:47:42.
- Command 7 (post-check): `11521`/`11522` LISTEN unchanged; container `11521 OPEN / 11522 OPEN / 11443 CLOSED` -- **identical to baseline.**

**outcome** -- **aborted-mid-execution at hard gate (Within-Dispatch Agency: "a probe reveals the dispatch scope is incomplete"). Change applied to disk but INERT. No outage; no rollback required; substrate unattended-stable.**

**Root cause -- specification defect, mine.** The cycle command targets `autossh.exe` and `ssh.exe` only. The wrapper bash (pid 18832) was never killed, and it holds the entire `while true; do ... done` loop **parsed in memory as a single top-level compound command**. Bash re-reads a script file between top-level commands; this loop is one top-level command that never completes, so an on-disk edit cannot reach it. The wrapper will respawn the old argv indefinitely. My 16:42 apply-pack asserted *"the wrapper loop respawns within ~11s with the new argv"* -- **false**, and the tasker sanctioned it verbatim from my specification.

**Shape of the miss, for future reference:** I correctly identified the cross-MSYS hazard that the kill might silently fail to match, substituted a deterministic CIM kill, and verified the kill worked. I never questioned whether the *respawn* would re-read the file. **The verified half of the mechanism masked the unverified half** -- a validated kill made the whole cycle feel validated. Generalises to any "mutate-then-restart" operation: proving the teardown half says nothing about the reload half, and they need separate evidence.

**Not self-authorised:** restarting the wrapper (`Stop-ScheduledTask` / `Start-ScheduledTask` on `ApexResearch-DBTunnels`, with a straggler-reap between) is one operation beyond the four the waiver named. Surfaced to the tasker with reasoning and exact commands; **held pending amended sanction.** Killing the bash chain directly was considered and recommended against: `run-tunnel-hidden.vbs` runs `wait=True` so wscript exits with bash, and the Task's only triggers are at-logon and power-resume -- neither would fire, converting a no-outage state into a real outage with no automatic recovery.

**Carried forward:** verify step 3 not run, so the WARP-through-ssh premise remains unproven and all three outward drafts stay held. Rollback (delete line + cycle) remains pre-authorised and unused.

**Unrelated observation, recorded so it is not misattributed:** `git diff --stat` in `apex-migration-research` shows five other dirty files (`.dockerignore`, `.gitignore`, `Dockerfile.apex`, `docker-compose.yml`, `entrypoint-apex.sh`; 170 insertions) that are **not FR's**. The 16:34 probe was scoped to `.claude/bin/` and did not surface them. FR touched exactly one line in one file; the diff against the pre-change backup is the proof.

(*FR:Hopper*)

---

## 2026-07-24T16:58+03:00 -- GH #104 apex GitLab forward: amended Tier D EXECUTED, SUCCESS, WARP premise PROVEN

**timestamp** -- 2026-07-24T16:58+03:00 (amended sanction validated) through 2026-07-24T17:00+03:00 (verify 1-3 complete). Completion entry for the dispatch opened at 2026-07-24T16:28+03:00 (locate/specification) and continued at 2026-07-24T16:52+03:00 (first execution attempt, aborted-mid-execution).

**tasker** -- Aen (team-lead), relaying PO approval of route (b).

**dispatch summary** -- Amended sanction adding exactly two operations to the prior four: `Stop-ScheduledTask` and `Start-ScheduledTask` on `ApexResearch-DBTunnels`, with an explicit straggler sweep between them, to force the wrapper bash to re-read the already-edited script. Then confirm the new argv and run verify 1-3.

**tier classification + sanction status** -- **Tier D. Sanction COMPLETE; all three components present.**

- *(a) exact command* -- both `Stop-ScheduledTask` / `Start-ScheduledTask` invocations quoted verbatim, plus the instruction to check for and kill stragglers between them, with the specific pids to look for (18832 and descendants, plus the 16:53:39 respawn set 7768 / 28272 / 9992 / 7616).
- *(b) stated reason* -- the running bash holds the loop in memory and cannot see the on-disk edit; the interpreter process must restart. Route (b) chosen over killing the bash chain because `run-tunnel-hidden.vbs` runs `wait=True` and the Task's only triggers are at-logon and power-resume, so a bare chain-kill would leave no automatic recovery.
- *(c) expected outcome* -- fresh process tree with all three `-R` flags; six LISTEN lines; `11521 OPEN / 11522 OPEN / 11443 OPEN`; `code=302 redirect=https://gitlab.evr.ee/users/sign_in`.
- Dispatch carried an **escalate-immediately** branch (if `Start-ScheduledTask` fails or 11521/11522 do not come up, report in the same breath as the first fix attempt) and reaffirmed pre-authorised rollback. Neither fired.
- Explicit bar restated and honoured: no further script edits, no Task re-registration, no changes to the `.vbs` or `.ps1`, and no touching the five unrelated dirty files.

**deployed-artifacts-read declaration** --

- **Layer 1 (FR design-as-shipped):** no re-read; unchanged from the 16:28 entry.
- **Layer 2 (consumer-team operational copy):** no further edit -- the one-line change from the 16:52 attempt was already on disk and was the content this phase activated. `register-tunnel-task.ps1:7,17,28-35` re-consulted (read-only) for Task name, action shape and `MultipleInstances IgnoreNew` semantics before stop/start.
- **Layer 3 (running state):** Task state before/after; full process-tree enumeration before and after stop (the straggler probe); RC listener table at three points (pre-stop, post-straggler-kill, post-start); in-container TCP probe; in-container HTTPS probe with headers; supervisor log.
- **Audit-trail artifacts (this repo):** this entry; the 16:28 and 16:52 entries; scratchpad; success report to team-lead at 17:00.

**commands executed** (verbatim) --

1. `Stop-ScheduledTask -TaskName 'ApexResearch-DBTunnels'` -> State `Ready`
2. (straggler probe) `Get-CimInstance Win32_Process -Filter "Name='autossh.exe' OR Name='ssh.exe' OR Name='wscript.exe' OR Name='bash.exe'" | Where-Object { $_.CommandLine -like '*vjsdbtest*' -or $_.CommandLine -like '*autossh-db-tunnels*' -or $_.CommandLine -like '*run-tunnel-hidden*' } | Select-Object ProcessId,ParentProcessId,Name,CreationDate`
3. (straggler kill, explicit pid list) `$ids = 19300,18832,24620,7768,28272,9992,7616; foreach ($i in $ids) { Stop-Process -Id $i -Force }` then re-probe for survivors
4. `ssh -T dev@100.96.54.170 "ss -lnt | grep -E ':(11443|11521|11522)\b' || echo 'RC_CLEAR_NO_11xxx'"`
5. `Start-ScheduledTask -TaskName 'ApexResearch-DBTunnels'` -> State `Running`
6. (confirm argv) `Get-CimInstance Win32_Process -Filter "Name='ssh.exe' OR Name='autossh.exe'" | Where-Object { $_.CommandLine -like '*vjsdbtest*' } | Select-Object ProcessId,Name,CommandLine`
7. **VERIFY 1+2** `ssh -T dev@100.96.54.170 "ss -lnt | grep -E ':(11443|11521|11522)\b'; docker exec apex-research bash -c 'for p in 11521 11522 11443; do timeout 3 bash -c \"echo -n > /dev/tcp/127.0.0.1/$p\" 2>/dev/null && echo \"$p OPEN\" || echo \"$p CLOSED\"; done'"`
8. **VERIFY 3** `ssh -T dev@100.96.54.170 "docker exec apex-research curl -sS -o /dev/null -w 'code=%{http_code} redirect=%{redirect_url}\n' --max-time 15 --resolve gitlab.evr.ee:11443:127.0.0.1 https://gitlab.evr.ee:11443/"`
9. (origin confirmation) same via `curl -sS -I`, filtered for `HTTP/`, `x-gitlab-meta`, `x-request-id`, `x-runtime`, `location`, `cf-ray`, `server`, `set-cookie: CF_Auth`

**outputs** --

- **Command 2 -- STRAGGLER FINDING (the tasker's warning fired).** `Stop-ScheduledTask` did **not** reap the process tree. It terminated only the top-level `wscript.exe` (11120, gone) and left **seven orphans running**: bash `19300`, bash `18832` (the wrapper, alive since 10:48:05), bash `24620`, autossh `7768` / `28272` / `9992`, and **ssh `7616` still holding 11521/11522 on the RC host** (confirmed by the RC listener table at that moment). A direct `Start-ScheduledTask` here would have hit `ExitOnForwardFailure` against its own predecessor's binds and churn-looped.
- Command 3: all seven killed by explicit pid; survivor re-probe returned `NONE`. **Explicit-pid targeting was necessary** -- three bash processes created at 16:58:29 (`12732` / `6744` / `24772`) matched the command-line filter because the probe's own command text contained the search strings; a filter-based kill would have terminated the operator's own shell.
- Command 4: `RC_CLEAR_NO_11xxx` -- binds released, outage window open.
- Command 6: fresh tree `9092` / `27760` / `16468` (autossh) + **`27752` (ssh)**, all carrying `-R 11521:vjsdbtest.evr.ee:1521 -R 11522:vjsdbtest2.evr.ee:1521 **-R 11443:gitlab.evr.ee:443**`. **Bash re-read the script from disk on fresh start, as predicted.**
- **VERIFY 1 -- PASS.** Six LISTEN lines: 11521, 11522, 11443, each on both `127.0.0.1` and `[::1]`.
- **VERIFY 2 -- PASS (Oracle regression gate).** `11521 OPEN / 11522 OPEN / 11443 OPEN`. Baseline was `OPEN / OPEN / CLOSED`.
- **VERIFY 3 -- PASS. THE PREMISE IS PROVEN.** `code=302 redirect=https://gitlab.evr.ee:11443/users/sign_in`. Header confirmation: `HTTP/2 302`, `x-gitlab-meta: {"correlation_id":"01KYA6T01V7M10KBTHXB0JT12Q",...}`, `x-request-id`, `x-runtime: 0.020972` (genuine GitLab origin), `server: cloudflare`, `cf-ray: a20372d8587b543c-TLL`, and **`set-cookie: CF_Authorization=<JWT>`** -- CF Access evaluated the connection and **admitted** it. Not the `eestiraudtee.cloudflareaccess.com` redirect apex received on the direct path.
- **Outage: 16:53:39 -> 16:59:22 = 5m43s**, from the supervisor log. Materially longer than the "a few seconds" estimate in the dispatch's expected-outcome. Cause: the straggler sweep, the RC-clear confirmation and the pre-start verification each cost a round-trip. The trade was deliberate -- confirming the binds were released before starting, rather than starting fast and risking `ExitOnForwardFailure` -- but the estimate was wrong and the real figure is recorded here rather than the estimate.

**outcome** -- **success.** Container-local `11443 -> gitlab.evr.ee:443` is live and rides the identical supervisor/wrapper/Task-trigger path as the Oracle forwards, because it is a flag on the same ssh command line. Oracle forwards intact. Rollback available and unused. All three of apex's deliverables are now answerable from measurement rather than inference.

**Substrate finding for the wiki queue:** on this Task shape (`wscript` launcher with `WshShell.Run wait=True`, supervising a bash loop), **`Stop-ScheduledTask` orphans the descendant tree rather than reaping it** -- it stops the process Task Scheduler launched and nothing below it. Any stop-then-start of such a task requires an explicit straggler sweep in between, and for a task holding network binds the sweep is the difference between a clean restart and an `ExitOnForwardFailure` churn loop. Pairs with the S66 lesson that a running bash cannot see an edit to its own script.

**Correction owed to the outward drafts (surfaced to tasker, not self-patched):** both the apex reply and the #104 comment assert that GitLab's redirects will be portless and miss the tunnel, citing the workstation probe (`https://gitlab.evr.ee/users/sign_in`). Measured through the tunnel, the redirect **preserves the port** (`https://gitlab.evr.ee:11443/users/sign_in`) because GitLab echoes the received `Host` header. The accurate claim is narrower: Host-derived redirects work; only URLs GitLab generates from its configured `external_url` (clone URLs in the UI, notification email links, some API absolute URLs) will be portless. The drafts overstate it and are held pending the tasker's decision on rewording.

**Unrelated files:** the five dirty files in `apex-migration-research` (`.dockerignore`, `.gitignore`, `Dockerfile.apex`, `docker-compose.yml`, `entrypoint-apex.sh`) were not staged, stashed, reverted or committed. FR's footprint remains one line in one file.

(*FR:Hopper*)

---

## 2026-07-24T17:04+03:00 -- GH #104: both outward artifacts RELEASED; FR courier transport outage surfaced and resolved

**timestamp** -- 2026-07-24T17:04+03:00 (release begun) through 2026-07-24T17:36+03:00 (delivery independently confirmed). Closing entry for the dispatch opened 2026-07-24T16:28+03:00.

**tasker** -- Aen (team-lead). Release authority delegated to Hopper at 17:24: *"You revise, and you release -- no further approval gate."* Specification and correction authorship were already Hopper's.

**dispatch summary** -- Apply the measured redirect correction to both outward artifacts, then send the stationmaster reply to apex-research and post the GH #104 comment. Three mandated inclusions: the corrected redirect claim marked as superseding the earlier framing; the real outage figure unsoftened; the `nc` finding carrying the mid-rewrite caveat.

**tier classification + sanction status** -- **Tier R / outward-communication.** No substrate mutation. Release authority explicit and quoted above; no further gate required by the tasker's own instruction.

**deployed-artifacts-read declaration** --
- **Layer 1 / 2 / 3 (tunnel substrate):** no reads this phase -- the substrate change was complete and verified at 17:00. This phase is communication only.
- **Comms substrate (read before dispatch):** `inter-team-comms` skill; `fr-courier.config.auto.json` (`ghost_outboxes=['apex-research-courier']`, `state_dir=~/.stationmaster/framework-research`); live runtime team dir resolved to `session-f2dff9d4` (config members `team-lead`, `hopper`); hub `ping` + `status` over the customer channel.
- **Audit-trail artifacts (this repo):** this entry; the 16:28 / 16:52 / 16:58 entries; scratchpad Cal submission queue.

**commands executed** (verbatim) --
1. `Get-ScheduledTask -TaskName 'FrameworkResearch-Courier'` -> `Disabled` (expected, S58 Tier-D disable; registration retained) + live daemon pid 25296 on `.auto.json`
2. `printf '%s\n' '{"v":1,"cmd":"ping"}' | ssh -T -i ~/.ssh/sm_framework-research -p 2222 sm@10.100.136.162` -> `ok:true`, fingerprint `SHA256:nkmhWNcc…DpyQ`
3. same with `{"v":1,"cmd":"status"}` -> `grants_out` includes `apex-research`; `waiting_for_me:{}`; `deposited_uncollected:{}`
4. registered ghost outbox `apex-research-courier` in `session-f2dff9d4/config.json` + created its inbox file (documented skill procedure)
5. `SendMessage` to `apex-research-courier` -- the revised apex reply
6. `gh issue comment 104 -F <comment file>` -> https://github.com/mitselek/ai-teams/issues/104#issuecomment-5070722020
7. (post-send verification) `tail` of `fr-courier.log.err`; `head`/`grep -c` over the same for first-failure time and failure count; `ls` of `~/.stationmaster/framework-research/spool/`; `Get-CimInstance` on courier pid 25296 for parent/session
8. (post-fix confirmation) `ls` spool -> empty; `tail` `fr-courier.log.err`; hub `status`

**outputs** --
- **#104 comment posted** -- durable record live at the URL above, carrying all three mandated inclusions.
- **Stationmaster reply initially FAILED TO DELIVER.** Courier consumed it from the outbox into `spool/20260724T140508210286-d16776c3.json` (8333 bytes) at 14:05:08Z, then logged `deposit transport failure (no response envelope (ssh rc=3221225794); stderr: <empty>); will retry` on that and every subsequent 30s cycle.
- **`ssh rc=3221225794` = `0xC0000142` = `STATUS_DLL_INIT_FAILED`** -- the daemon could not spawn its ssh subprocess at all.
- **The courier had never worked this session.** Up at 13:24:35Z; first failure 13:26:37Z; **83 of 85 log lines transport failures, zero successful collect or deposit in the entire log.** Courier start predates Hopper's spawn (16:28 local) by ~4 minutes and the tunnel operation (16:52-16:59) by ~28 minutes; the tunnel straggler sweep targeted seven named PIDs, none of them 25296. Chronology and PID list both exclude FR's tunnel work as a cause.
- **Hub, key, network and grant all healthy throughout** -- Hopper's own manual `ping`/`status` succeeded at 14:03Z against the same hub the daemon could not reach.
- Courier pid 25296 found **orphaned** (parent 25996 absent), session 1, 341 processes on the box.
- **ROOT CAUSE (Aen, self-reported 17:34):** the startup Step-3.5 courier restart ran under a **2-minute tool timeout**; the wrapper was killed at the deadline and the daemon was orphaned. Courier-up 13:24:35Z -> first failure 13:26:37Z = **2m02s**, matching the timeout rather than coinciding with it. Confirmed by the fix: a drain-once run as a *fresh* process with a live parent deposited on the first attempt against the same hub, key and network that had failed for 45 minutes.
- **RESOLVED.** Aen restarted the courier: `spool 20260724T140508210286-d16776c3.json: deposited 1/1 (accepted/duplicate); removed`; new courier pid 4360 up 14:08:37Z. **Independently confirmed by Hopper:** spool directory empty, `fr-courier.log.err` shows only the fresh startup line with no subsequent failures, hub `status` returns `deposited_uncollected:{}`. Note on that last signal: `deposited_uncollected:{}` reads identically before a deposit and after collection, so it is not sufficient alone -- the conclusion rests on the conjunction of the deposit log line, the emptied spool, and the hub view.

**outcome** -- **success.** Both outward artifacts released: GH #104 comment posted and the stationmaster reply delivered to apex-research. All three of apex's deliverables answered from measurement. No data was lost at any point -- the consignment was spool-durable throughout the outage and delivered on the first attempt after the transport was restored.

**Process finding -- the session's fourth instance of one failure shape, and the second by a different agent.** Before dispatching, Hopper verified Scheduled-Task state, live daemon process, hub `ping` and hub `status` -- all green -- and concluded the link was live, **without opening the courier's own log**, the only artifact showing 83 consecutive failures. Aen had made the same class of error at 16:24, checking process-alive/lock-held/ledger-non-empty and opening `fr-courier.log`, which is **stdout and was zero bytes**, while every failure line went to `fr-courier.log.err` -- an empty log beside a live process read as healthy, and the courier was certified green to the operator who then relied on it. Aen's formulation, retained for the wiki entry: ***"Absence of error is not evidence of function when you are reading the wrong stream."*** The check that would have caught both is *does this process's log show a successful operation*, not *does this process exist*. Because the shape recurred across two agents, four substrates and both roles in a single session, it is a property of how these systems report health rather than one operator's discipline lapse.

**Cal catalogue decision (Hopper's call; Aen accepted it over his own proposal).** The session's misses are **two genera, not one**: *verification narrower than it appears* (submission 1 -- the `-R` TCP probe as canonical technical instance, plus the two health-check misses above) and *control narrower than its name* (submission 4 -- a running loop ignoring an on-disk edit, and `Stop-ScheduledTask` orphaning its descendant tree). Cross-linked, **not merged**: merging would collapse the observe/act distinction, which Cal's dedup protocol warns against for claims that merely look alike. Submission 3's WARP clause moved to `high` **scoped explicitly to this workstation, this WARP enrolment and this CF Access policy** -- a successful production path is not an experiment and does not license generalisation.

(*FR:Hopper*)
