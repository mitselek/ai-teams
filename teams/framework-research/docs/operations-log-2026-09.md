# Operations Log -- 2026-09 (*FR:Hopper*)

Append-only operations log per `teams/framework-research/prompts/hopper.md` (Provenance -- Role-of-Record section). Each entry has all 8 required fields. No edits to prior entries; corrections go as new entries referencing the original by timestamp.

---

## 2026-09-02T16:02+03:00 -- S71 apex CLI upgrade arc, step 1 of the rebuild path: fast-forward the RC build-source checkout (Tier M)

**timestamp** -- 2026-09-02T15:56+03:00 (Tier R recon opened) through 2026-09-02T16:03+03:00 (Tier M executed and verified). First entry of the month; this file created by this dispatch.

**tasker** -- Aen (team-lead), S71. Two messages: the dispatch at 15:56 (Tier R contradiction-settling recon, then wait for Brunel), and the sanction relay at 15:58 carrying two PO decisions, cleared of its one conditional clause at 16:01.

**dispatch summary** -- The apex-research Claude CLI is to move 2.1.217 -> 2.1.258. Brunel designs, I execute. Step 1 was to settle a direct contradiction between my S70 live recon (no `~/.local/bin/claude`; the CLI is the base image's root-owned npm-global install) and Brunel's S70 plan written from `Dockerfile.apex` (a native `~/.local/bin/claude` with a stalled autoupdater). Step 2, once the rebuild path was the settled mechanism, was to fast-forward the RC host's own checkout of this repo so the build source carries the 2.1.258 pin. The build-source-on-build-host gate is mine as a standing step-1 for any rebuild dispatch: edits authored in a local workspace do not automatically exist on the build host.

**tier classification + sanction status** --

- **Tier R (recon, 15:56-15:59)** -- default-permitted, no per-task sanction. Two probe rounds against the apex container plus a read-only pre-flight of the checkout. Zero mutation.
- **Tier M (fast-forward, 16:02)** -- **tasker-ack quoted verbatim**, Aen 2026-09-02 15:58: *"(b) RC checkout fast-forward is SANCTIONED (Tier M): `cd /home/dev/github/mitselek-ai-teams && git pull --ff-only`, expected HEAD `e7ab474`. Execute it after your Tier R report is out and only if the settled mechanism from Brunel's plan is the rebuild path; open `docs/operations-log-2026-09.md` with that entry."* The trailing clause was **held, not spent** -- Brunel had sent no plan, and substituting my own diagnostic conclusion for the named artifact is the silent-broadening failure this role exists to prevent. Surfaced to Aen at 16:00 and cleared verbatim at 16:01: *"Clause cleared: my 15:58 was written before your 15:57 recon reached me; your recon settles the mechanism (no in-place path exists on the substrate). The PO sanction was unconditional. Execute `git pull --ff-only` in `/home/dev/github/mitselek-ai-teams` now, verify HEAD `e7ab474`."*
- PO decision (a), relayed by Aen in the same 15:58 message and recorded here because it discharges a rebuild gate: *"The attached apex tmux client is the PO's own; apex-research has no live agent sessions to protect; the window is ours."*
- **Tier D (rebuild / recreate) NOT executed and NOT sanctioned.** It still awaits Brunel's dispatch package plus Aen's relay.

**deployed-artifacts-read declaration** --

- **Layer 1 (FR design-as-shipped)** -- carried forward from the S70 read, not re-read this session: FR repo root `Dockerfile:52-53` (`ARG CLAUDE_VERSION` + `npm install -g @anthropic-ai/claude-code@${CLAUDE_VERSION} 2>&1 | tail -5`) as the base-image install path, and `Dockerfile.apex:114-116` as the native-`install.sh` layer. Re-read post-pull on the build host itself as the verification step (see outputs): `Dockerfile:52` now reads `ARG CLAUDE_VERSION=2.1.258`.
- **Layer 2 (consumer-team operational copy on the substrate host)** -- `md5sum /home/dev/github/apex-migration-research/Dockerfile.apex` = `1c48d8f3dadda753df090b176373eb42`. The known L1<->L2 drift on `entrypoint-apex.sh` and `Dockerfile.apex` (recorded S70) is unchanged and is NOT resolved by this operation; this fast-forward touches only `/home/dev/github/mitselek-ai-teams`, a different checkout from the apex compose directory.
- **Layer 3 (running container state)** -- probed 15:56 and 15:57 via `ssh -T dev@100.96.54.170` then `docker exec`. `command -v claude` resolves through a root:root symlink dated Jul 22 18:55 to `/usr/local/lib/node_modules/@anthropic-ai/claude-code/bin/claude.exe`; package.json `"version": "2.1.217"`; `claude --version` 2.1.217; `~/.local/bin/claude` and `~/.local/share/claude/versions/` both absent; `~/.npm` root-owned with the container user at uid 1000; `md5sum /entrypoint-apex.sh` = `0fcb7623285a4009cc10612f4844888e`; no claude process running anywhere in the container.
- **Audit-trail artifacts (this repo)** -- `teams/framework-research/memory/hopper.md` summary header (S70 recon block, amended at S71 checkpoints). No prior ops-log entry exists for September; this entry opens the file.

**commands executed** (verbatim; all remote work via `ssh -T dev@100.96.54.170` with the script base64-transited per my standing PowerShell-quoting workaround) --

1. Recon round 1, container-side:
   `docker exec -u ai-teams apex-research bash -lc 'type -a claude; ls -l ~/.local/bin/claude 2>&1; readlink -f "$(command -v claude)"; ls ~/.local/share/claude/versions/ 2>&1; grep -E "autoUpdates|minimumVersion|DISABLE" ~/.claude/settings.json 2>&1'`
   `docker exec apex-research bash -c 'type -a claude; node --version; ls -ld /home/ai-teams/.npm'`
   `for p in $(docker exec apex-research pgrep -f claude); do docker exec apex-research readlink /proc/$p/exe; done`
   `docker exec apex-research md5sum /entrypoint-apex.sh; md5sum /home/dev/github/apex-migration-research/Dockerfile.apex`
   `cd /home/dev/github/mitselek-ai-teams && git rev-parse --short HEAD && git status --short | head`
   `docker exec apex-research tmux list-clients 2>&1`
2. Recon round 2, my own initiative, to disambiguate two ambiguous nulls from round 1 (an empty grep that could have meant a missing file, and a tmux error that was a root shell on the wrong socket): `ls -l`/`cat` of `~/.claude/settings.json`; `ls -l /usr/local/bin/claude` + package.json version + `claude --version`; the same tmux probes re-run as `docker exec -u ai-teams`; `ps -eo pid,user,etime,args`; `ls -l /dev/pts/` + `who`.
3. Tier M pre-flight, read-only. `git ls-remote` used deliberately in place of `git fetch`, which writes local refs: `git rev-parse HEAD`, `git branch --show-current`, `git symbolic-ref -q HEAD`, `git status --porcelain=v1 --untracked-files=all`, `git stash list`, `git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}'`, `git remote -v`, `git ls-remote origin refs/heads/main`, `git cat-file -t e7ab474`.
4. At-moment-of-use gate, immediately before the mutation, aborting rather than pulling if any of the three failed: re-read of HEAD, branch, and porcelain dirty-line count, asserted against the 15:59 pre-flight values.
5. **The sanctioned mutation, verbatim:** `cd /home/dev/github/mitselek-ai-teams && git pull --ff-only`, with `RC=$?` captured directly and not through a pipe.
6. Verification: `git rev-parse HEAD`, `git rev-parse --short HEAD`, `git branch --show-current`, `git status --porcelain=v1 --untracked-files=all`, `git rev-parse --short origin/main`, `git log --oneline -3`, `git rev-list --parents -n 1 HEAD`, `grep -rn "CLAUDE_VERSION" Dockerfile`.

**outputs** (key lines) --

- Gate at 16:02:50 EEST: `pre HEAD : 5336c2eee46003a35c296f3694c58dc08a283467`, `pre branch: [main]`, `pre dirty-lines: 0`. GATE PASS; state matched the pre-flight exactly, so the authorization was spent against verified-current state rather than a three-minute-old reading.
- Pull: `From https://github.com/mitselek/ai-teams` / `5336c2e..e7ab474  main -> origin/main` / `Updating 5336c2e..e7ab474` / `Fast-forward` / `98 files changed, 4150 insertions(+), 688 deletions(-)`. **`rc=0`.**
- Verify: `post HEAD : e7ab47450be186e66287d09d1968bfded8be0278`, short `e7ab474` -- **matches the sanctioned expected HEAD**. Branch still `main`; dirty-lines 0; `origin/main` ref now `e7ab474`.
- True fast-forward confirmed structurally, not just by the word in git's output: `git rev-list --parents -n 1 HEAD` returns 2 tokens, i.e. one parent, i.e. linear history with no merge commit created.
- **The load-bearing verification for the rebuild gate:** on the build host, post-pull, `Dockerfile:52` reads `ARG CLAUDE_VERSION=2.1.258` and `Dockerfile:53` reads `RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_VERSION} 2>&1 | tail -5`. The build source now carries the target version. Before the pull it pinned 2.1.217.
- Incidental, noted for completeness and not acted on: the diff also moved `designs/new/joosep/*` to `designs/deployed/joosep/*`, added the S67 August operations log and a batch of wiki entries, and changed two file modes to 100755. None of it is in this dispatch's scope.

**outcome** -- **success.** The RC build-source checkout is at the sanctioned HEAD `e7ab474` with a clean tree on `main`, reached by a true fast-forward, and the Dockerfile on the build host now pins CLAUDE_VERSION 2.1.258. The build-source-on-build-host gate for the apex rebuild is **closed**. Rebuild gate (4), coordinating around the attached apex tmux client, is **discharged by PO decision (a)**. Still open and not mine to start: the Tier D rebuild and recreate, pending Brunel's dispatch package plus Aen's relay; the L1<->L2 drift on `entrypoint-apex.sh` and `Dockerfile.apex`, which this operation does not touch; and the Config.Env-versus-`.env` diff that must be taken immediately before any recreate. Nothing in the apex container was mutated at any point in this arc.

(*FR:Hopper*)

---

## 2026-09-02T16:06+03:00 -- S71 Brunel dispatches R-A + R-B: L2 entrypoint lock-pre-clean gate and env-key loss diff (Tier R)

**timestamp** -- 2026-09-02T16:06+03:00 (probes run) through 2026-09-02T16:09+03:00 (reported to Brunel, CC team-lead).

**tasker** -- Brunel, 2026-09-02 16:14 message (his clock; my probes ran 16:06 by mine -- the two agents' clocks are not synchronised and I am recording my own timestamps per the field definition). Diagnosis-then-execution loop: he designs the rebuild, I execute the reads that clear its gates.

**dispatch summary** -- Two read-only probes, each clearing a gate on the pending Tier D rebuild. R-A: read the RUNNING (Layer 2) `/entrypoint-apex.sh` to establish whether it carries the S52 stale-courier-lock pre-clean, because the lock lives on the `~/.claude` volume which SURVIVES recreate and the courier's staleness check is pid-only. Without a boot-time pre-clean the courier false-refuses to start after recreate and the supervisor cannot save it, taking apex cross-team comms down silently while the container looks healthy. R-B: diff live `Config.Env` key names against the compose env block and `.env`, to find any key that is live now but declared nowhere and would therefore be LOST at recreate (the GH_TOKEN class, fixed once at P4.05 and worth re-checking rather than assuming it stayed fixed). Also confirm the `courier_key` secret file `stationmaster_apex` exists.

**tier classification + sanction status** -- **Tier R throughout; default-permitted, no per-task sanction required.** Validated against the substrate: every command is a read (`wc`, `grep`, `ls`, `md5sum`, `docker inspect --format`, `git rev-parse`, `git status`). No mutation of any layer. Brunel's own dispatch states "Nothing here is Tier M or D" and my read agrees, so no tier disagreement to surface.

**deployed-artifacts-read declaration** --

- **Layer 1 (FR design-as-shipped)** -- deliberately NOT read for this dispatch, and that is the point of it. Brunel declined to assert Layer 2's content from the Layer 1 mirror, so reading L1 here would have defeated the purpose. Recorded as a deliberate scope choice, not a gap.
- **Layer 2 (consumer-team operational copy)** -- the running `/entrypoint-apex.sh` read in full by grep, identity pinned in the same probe: `md5sum` = `0fcb7623285a4009cc10612f4844888e`, 25805 bytes, 522 lines, `-rwxrwxr-x root root`, dated Jun 16 14:21. Matches the L2 checksum recorded at S70, so the file read is the file running. Compose dir `/home/dev/github/apex-migration-research`: `docker-compose.yml` environment block (lines 53-71), `.env` key names, `ls -l stationmaster_apex`, `git rev-parse --short HEAD` = `4d68b88` with two untracked backups.
- **Layer 3 (running container state)** -- `docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}'` with values stripped on the host before printing; live contents of `~/.claude/teams/apex-research/stationmaster-state/`.
- **Audit-trail artifacts (this repo)** -- prior entry `2026-09-02T16:02+03:00` (the fast-forward) in this file; S34 P4.05 GH_TOKEN precedent and the S52 lock gotcha as recorded in `teams/framework-research/memory/hopper.md`.

**commands executed** (verbatim; run on the RC host as `dev` via `ssh -T dev@100.96.54.170`, script base64-transited per my standing PowerShell nested-quote workaround -- transport differs from the dispatch's literal nested-quote SSH form, the command does not) --

R-A, as dispatched:
`docker exec apex-research bash -c "wc -c /entrypoint-apex.sh; grep -n 'COURIER_LOCK\|courier.lock\|inboxes_dir\|supervise \|claude.json' /entrypoint-apex.sh"`

R-A cross-checks, my own initiative within dispatch (a null on the lock question had to be a TRUE null, and a false POSITIVE would be far more expensive than a false negative, so I gathered context rather than assert a verdict): `grep -ni 'lock'` plus a count; `grep -ni 'stationmaster\|courier\|state'`; `grep -n -C 4 'supervise'`; step-list grep; `ls -la ~/.claude/teams/apex-research/stationmaster-state/`; `md5sum` + `wc -l` + `ls -l` on the entrypoint.

R-B, as dispatched:
`docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}' | sed 's/=.*//' | sort -u`
`cd /home/dev/github/apex-migration-research && ls -l stationmaster_apex; grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' .env | tr -d = | sort -u; echo '--- compose declared ---'; grep -oE '^ +- [A-Z_][A-Z0-9_]*=' docker-compose.yml | sed 's/[ -]//g;s/=//' | sort -u`

R-B cross-checks, my own initiative: raw dump of every `environment:` block in the compose via awk, because the dispatched regex assumes the `- KEY=value` list form and uppercase-only keys and would return a silent false negative against the `KEY: value` map form; `grep -n 'env_file' -A 4`; `.env` line-count vs matched-key-count sanity; compose-dir git state.

**outputs** (key lines) --

R-A. **The lock pre-clean IS PRESENT in Layer 2.** Entrypoint lines 500-513 carry a commented block attributed `(*FR:Brunel* S52)` and then `COURIER_LOCK="/home/ai-teams/.claude/teams/apex-research/stationmaster-state/courier.lock"` followed by `rm -f "${COURIER_LOCK}"`. Ordering is correct: the `rm -f` is line 513 and `supervise courier` is line 516, so the clean happens BEFORE the courier launches. `supervise dashboard` is line 481; the `supervise()` function itself is line 61. Step 9e is line 469. The `inboxes_dir` pre-create is lines 497-498. `claude.json` produced no match. Independent corroboration that the negative-space was searched: case-insensitive `lock` returns 11 lines and every courier-lock-related one falls in the 500-513 block.

**A live lock file exists right now**: `-rw-r--r-- 1 ai-teams ai-teams 44 Aug 27 11:30 courier.lock`, alongside `delivered-ledger.jsonl`, `inject-tmp/` and `spool/`. Its presence is expected -- the courier (pid 1379) is running and holding it -- and it is exactly the artifact line 513 removes at next boot.

R-B. **No key is at risk of loss at recreate.** Live `Config.Env` carries 16 key names; the compose env block declares 15; the sole difference is `PATH`, which is supplied by the image rather than by compose or `.env`, so it is re-supplied on recreate and is not a loss surface. A leading blank line in the sorted output is a formatting artifact of the template's trailing newline, not an env entry.

Resolution direction checked as well, since a compose key with no source resolves to empty rather than failing: the six compose-declared keys absent from `.env` (`HOME`, `REPO_URL`, `SOURCE_REPO_URL`, `NODE_EXTRA_CA_CERTS`, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, `TEAM_NAME`) all carry either a literal value or a `:-` default in the compose file itself, so all six survive independently of `.env`. `GITHUB_TOKEN` is the one key interpolated with NO default (`${GITHUB_TOKEN}`), and it is present in `.env`, so it resolves.

**One observation in the opposite direction, reported but NOT diagnosed:** `TUNNEL_TOKEN` is present in `.env` but appears in neither the compose environment block nor live `Config.Env`. There is exactly one `environment:` block in the compose and NO `env_file` directive anywhere in it. So on this evidence the key is declared and not consumed by any service env block. Whether it is interpolated elsewhere in the compose, or is simply a leftover of the S34 credential cluster, is not established by these probes.

`stationmaster_apex` present: `-rw------- 1 dev dev 399 Jun 15 12:54`. Size and mtime only; content not read, per the dispatch. Sanity on the `.env` grep: 17 total lines, 10 non-blank non-comment lines, 10 keys matched -- the grep missed nothing. Compose dir at `4d68b88` with untracked `.env.bak` and `docker-compose.yml.bak.20260521-091347`, unchanged from the S70 reading.

**Minor defect noticed while reading the whole output rather than only the dispatched field, flagged not fixed:** the entrypoint's own header comment at line 4 reads "Sets up the apex-research container in 6 steps" while the file actually implements Step 0 through Step 10. A stale docstring, self-inflicted-staleness class, cosmetic and no operational consequence.

**outcome** -- **success; both gates cleared in Brunel's favour.** R-A: the Layer 2 entrypoint carries the S52 stale-lock pre-clean with correct ordering, so no explicit pre-recreate lock removal needs to be added to the Tier D package and no entrypoint change is needed. R-B: the recreate is env-safe; no key is live-but-undeclared, and every compose key resolves from `.env` or from an in-file default. Nothing mutated at any layer. Tier D rebuild and recreate remain unexecuted and unsanctioned, pending Brunel's dispatch package plus team-lead's relay.

(*FR:Hopper*)

---

## 2026-09-02T16:11+03:00 -- S71 Brunel dispatch R-C: courier-key three-way fingerprint and image/tag inventory (Tier R)

**timestamp** -- 2026-09-02T16:11+03:00 (probes run) through 2026-09-02T16:14+03:00 (reported to Brunel, CC team-lead).

**tasker** -- Brunel, his 16:10 message. Last Tier R before his Tier D package goes to team-lead.

**dispatch summary** -- Two read-only items. R-C part 1: fingerprint the courier private key at three locations -- the RC-host compose-dir file that the NEXT build would bake, the `.ssh-seed` copy the CURRENT image baked, and the `~/.ssh` copy the WORKING courier is using -- to establish that a rebuild reproduces the key the hub already accepts. This probe exists because I refused to close the question on file size alone in the prior dispatch. R-C part 2: inventory the `ai-teams-claude` and `apex-research-claude` images and tags, so the D2 rollback retag can be confirmed to land on the right image IDs before `docker compose build` overwrites `:latest`.

**tier classification + sanction status** -- **Tier R throughout; default-permitted, no per-task sanction.** Validated against the substrate: `ssh-keygen -lf`, `ls -l`, `docker images`, `docker inspect`, `grep`, `wc`, `ps`. No mutation at any layer. Brunel's dispatch states "Still nothing Tier M or D from me" and my read agrees. **No key body was read or transited at any point** -- fingerprints only, which are public information, per the dispatch's explicit constraint.

**deployed-artifacts-read declaration** --

- **Layer 1 (FR design-as-shipped)** -- not read; not required for a fingerprint comparison or an image inventory. The relevant design intent (entrypoint Step 7b seeds `~/.ssh` from `.ssh-seed`) was already read at the `2026-09-02T16:06+03:00` dispatch and is cited from there rather than re-read.
- **Layer 2 (consumer-team operational copy)** -- `/home/dev/github/apex-migration-research/stationmaster_apex` (`ls -l` and fingerprint only).
- **Layer 3 (running container state)** -- `/home/ai-teams/.ssh-seed/stationmaster_apex` and `/home/ai-teams/.ssh/stationmaster_apex` fingerprints; `ls -l /home/ai-teams/.ssh/`; `/home/ai-teams/.claude/logs/courier.log` status lines; `delivered-ledger.jsonl` size; live `ps` for the courier; `docker inspect apex-research` image ID; host-level `docker images`.
- **Audit-trail artifacts (this repo)** -- prior entries `2026-09-02T16:02+03:00` and `2026-09-02T16:06+03:00` in this file; the rollback-tag precedent recorded in `teams/framework-research/memory/hopper.md`.

**commands executed** (verbatim; RC host as `dev` via `ssh -T dev@100.96.54.170`, base64-transited) --

Pre-flight, my own initiative, one binary per call per my standing rule that `command -v a b c` returns only the first operand in dash and yields a silent false negative: `command -v ssh-keygen` on the host and again inside the container.

R-C part 1, as dispatched:
`ssh-keygen -lf /home/dev/github/apex-migration-research/stationmaster_apex`
`docker exec apex-research ssh-keygen -lf /home/ai-teams/.ssh-seed/stationmaster_apex`
`docker exec apex-research ssh-keygen -lf /home/ai-teams/.ssh/stationmaster_apex`
plus a host-side equality test over the three fingerprint fields with an explicit INCOMPLETE branch, so an empty fingerprint could not be read as a match.

R-C part 2, as dispatched:
`docker images --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedAt}}' | grep -E 'ai-teams-claude|apex-research-claude'`
plus an unfiltered `docker images` listing as cross-check, because the dispatched grep filters by repository name and would not attribute an image carrying only a dangling `<none>` tag; and `docker inspect apex-research --format 'Image={{.Image}} Config.Image={{.Config.Image}}'`.

Follow-up, my own initiative (see outputs for why): `ls -l /home/ai-teams/.claude/logs/`; per-pattern `grep -ci` counts over `courier.log` for six auth-specific signatures and five transport-only signatures, one pattern per call; `grep -c 'deposited'` and its last three lines; `ps -eo pid,etime,args` filtered to the courier.

**outputs** (key lines) --

**Part 1 -- ALL THREE FINGERPRINTS IDENTICAL.** Each of the three locations returns, verbatim:
`256 SHA256:NBq5a/r3GsTuIGME1BzsklC9Sr+6VrltsxoSfW4QsaE apex-research (ED25519)`
All three files are 399 bytes, mode `600`. Mtimes differ as the seeding chain predicts and do not indicate divergence: RC-host file Jun 15 12:54 (predates the image), `.ssh-seed` Jul 22 18:57 (image build), `~/.ssh` Jul 22 19:34 (container start, entrypoint Step 7b). `~/.ssh` also holds `authorized_keys` (325 B, Aug 27) and `stationmaster_known_hosts` (103 B, Jul 22).

**The hub-acceptance link, closed by observation rather than inference.** The three-way match proves the key is CONSISTENT across build-source, image and live; it does NOT by itself prove the hub accepts it. Brunel's dispatch treats the live courier's health as carrying that link, so I measured it. Across all 203 lines of `courier.log`: **`Permission denied` 0, `publickey` 0, `Authentication failed` 0, `Too many authentication failures` 0, `Invalid key` 0, `Host key verification failed` 0.** Successful `deposited` lines: **32**, most recent `2026-09-02T06:13:06Z ... deposited 1/1 (accepted/duplicate); removed`, i.e. today. Courier alive at pid 1379, 6d04h. So the hub accepts this fingerprint, and a rebuild that reproduces it will authenticate.

**A near-miss of my own, recorded because the number would have misled.** My first sweep used a single over-broad pattern combining auth and transport signatures and returned **86** matches. Read carelessly that is "86 authentication failures" and would have stopped the rebuild. It is not: the 86 are `rc=255` transport failures and decompose exactly as `No route to host` 81, `Network is unreachable` 3, `Connection refused` 1, `Connection closed` 1, all against hub `10.100.136.162:2222`, none of them a key rejection. I caught it because the five sample lines printed alongside the count did not match the interpretation the count invited, then re-ran with one pattern per call to separate the two classes. Same genus as my catalogued `discriminator-anchored-on-sub-canonical-source`, committed in my own instrument: **a count is only as specific as its narrowest pattern, and a merged pattern reports the union while reading like the member you had in mind.**

**Unrelated courier-health observation, flagged not diagnosed and out of this dispatch's scope:** six consecutive `ERROR inject failed ... exhausted 50 rounds against contested inbox team-lead.json; did NOT write -- will NOT ack` lines on 2026-08-28 between 10:48 and 10:52, followed at 10:52:24 by `inject: treating 1 read-marked entr(y/ies) as drained` and `inbound: injected+acked 1 consignment(s)`. It resolved on its own and is not an auth matter.

**Part 2 -- inventory matches Brunel's expectation, plus one tag he did not name.**
`apex-research-claude:latest fb99aee1887c 2026-07-22 18:57:20 +0300` (2.37GB)
`ai-teams-claude:latest a983e663b44b 2026-07-22 18:55:02 +0300` (1.73GB)
`apex-research-claude:rollback-pre-2.1.217 1786c34bd62b 2026-06-16 14:22:28 +0300` (1.59GB)
`ai-teams-claude:rollback-pre-2.1.217 762542b8351a 2026-04-16 16:53:00 +0300` (865MB)
**`apex-research-claude:pre-20260616-1417 df21b51ae0db 2026-06-15 14:29:33 +0300` (1.59GB)** -- a third apex tag, distinct image ID from the 2.1.217 rollback tag, not named in the dispatch's expected set.
Both expected `:latest` IDs match the dispatch exactly, and both `rollback-pre-2.1.217` precedent tags are still present.

**The running container is on the current `:latest`:** `Image=sha256:fb99aee1887c3d49f72dca1536978bd126c969e3490fdd69d27cffeea96d780f`, `Config.Image=apex-research-claude:latest`. So retagging `:latest` to `rollback-pre-2.1.258` before the build preserves precisely the image now serving, which is what makes the D2 retag a real rollback rather than a nominal one. The unfiltered listing shows **no dangling `<none>` images at all**, so the dispatched grep missed nothing.

**outcome** -- **success; both parts clear.** The rebuild will reproduce the courier key the hub already accepts, evidenced by an exact three-way fingerprint match plus zero authentication failures and 32 successful hub deposits, the latest today. The rollback retag has confirmed target IDs and the pre-upgrade image is the one currently running. Nothing mutated; no key material read. Tier D rebuild and recreate remain unexecuted and unsanctioned, awaiting Brunel's package plus team-lead's relay.

(*FR:Hopper*)

---

## 2026-09-02T16:16+03:00 -- S71 EXECUTION: fast path F0-F2 SUCCESS; rebuild D0-ii/D1/D2/D3 SUCCESS; **D4 gate ABORTED, D5-D8 NOT RUN**

**timestamp** -- 2026-09-02T16:16+03:00 (F0) through 2026-09-02T16:21+03:00 (D4 stop diagnostics complete, surfaced).

**tasker** -- Brunel (execution dispatch, his 16:13 message; unblocked by his 16:14 R-C adjudication), with PO sanction relayed by Aen (team-lead) at his 16:05. Dual-tasker dispatch: Aen carries the PO sanction, Brunel carries the technical package.

**dispatch summary** -- PO decision: fast path now AND rebuild today. Phase 1 (F0-F2) upgrades the running container's CLI in place to 2.1.258, delivering the ask immediately and independently of the rebuild. Phase 2 (D0-ii) gates the checkout ancestry. Phase 3 (D1-D6) fast-forwards the build source, retags both `:latest` images for rollback, rebuilds the base image, gates it on a runtime version check, rebuilds the apex image, and gates that. D7 (`.claude.json` backup) is sanctioned but explicitly deferred to immediately before the recreate. **D8 (`docker compose up -d --force-recreate`, Tier D) is NOT sanctioned and was not in the dispatch.**

**tier classification + sanction status** --

- **F0, D0-ii, D4, D6 -- Tier R**, default-permitted.
- **F1, F2, D1, D2, D3, D5 -- Tier M**, PO-sanctioned, relayed by Aen verbatim: *"execute F0-F2 (Tier M) and D0-D7 (Tier R/M) as Brunel's dispatch packages arrive, validating each against deployed artifacts per your discipline. D8 (`docker compose up -d --force-recreate`, Tier D) is HELD."* Brunel's dispatch: *"F0-F2 and D1-D7 are Tier M SANCTIONED. D8 (Tier D recreate) is NOT sanctioned and is not in this dispatch -- do not execute it even if everything upstream is green."*
- **TIER VALIDATION SURFACED ON F1, not silently accepted.** F1 is a container-side mutation, and my prompt's asymmetry rule flags container-side-labelled-Tier-M as the unusual shape and usually a mis-classified Tier D. Strictly it is neither: an in-place `npm install -g` is not a lifecycle event the substrate's own scripts handle (so not Tier M by definition), and it drops no state, carries no irreversible-data-loss surface, and has a stated rollback (so not Tier D by definition). I proceeded because the dispatch carries all three Tier D sanction components regardless -- exact command, stated reason, expected outcome -- with PO sanction relayed on top, so it clears the higher bar whichever label applies. Recorded so the classification stands on the record rather than being settled by my silence. Surfaced to both taskers at 16:17.
- **D0(iv) NOT re-run.** Brunel discharged it against my R-B of 16:09 and instructed no re-probe; my own `redundant-verification-carries-authorisation-cost` entry applies.

**deployed-artifacts-read declaration** --

- **Layer 1 (FR design-as-shipped)** -- `Dockerfile` on the build host post-D1 at HEAD `057fab4`, lines 67-69, read as the build input. Aen's assertion commit is present: line 68 is the install, line 69 is `&& [ "$(claude --version | cut -d' ' -f1)" = "${CLAUDE_VERSION}" ]`, which closes the historical trailing-pipe masking inside the build itself.
- **Layer 2 (consumer-team operational copy)** -- build source `/home/dev/github/mitselek-ai-teams` at `057fab4`; apex compose dir not touched (D5 not run).
- **Layer 3 (running container state)** -- pre-mutation and post-mutation reads of `claude --version`, `type -a claude`, process table, tmux client list; post-build `docker inspect` of the new image's Entrypoint/Cmd; `docker images` inventory throughout.
- **Audit-trail artifacts (this repo)** -- prior entries `2026-09-02T16:02+03:00`, `T16:06`, `T16:11` in this file; R-B and R-C results cited rather than re-probed.

**commands executed** (verbatim; RC host as `dev` via `ssh -T dev@100.96.54.170`) --

1. **F0** `docker exec apex-research bash -c 'claude --version; pgrep -af claude || echo NO_CLAUDE_PROCESS'`
2. **F0 correction, my own Tier R initiative** (see outputs): `pgrep -x claude`; a scan of every `/proc/[0-9]*/exe` for a claude target; full `ps -eo pid,user,etime,args`.
3. **F1** `docker exec apex-research bash -c 'npm install -g @anthropic-ai/claude-code@2.1.258; echo npm_rc=$?'`
4. **F2** `docker exec -u ai-teams apex-research bash -lc 'claude --version; type -a claude'` plus my own absence-count check and a post-mutation blast-radius re-read.
5. **D0-ii** `cd /home/dev/github/mitselek-ai-teams && git fetch origin && git merge-base --is-ancestor HEAD origin/main && echo FF_OK`
6. **D1** `cd /home/dev/github/mitselek-ai-teams && git merge --ff-only origin/main && git rev-parse HEAD && grep -n CLAUDE_VERSION Dockerfile`
7. **D2** `docker tag ai-teams-claude:latest ai-teams-claude:rollback-pre-2.1.258 && docker tag apex-research-claude:latest apex-research-claude:rollback-pre-2.1.258 && docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | grep rollback-pre-2.1.258`
8. **D3** `cd /home/dev/github/mitselek-ai-teams && docker build --network=host -t ai-teams-claude:latest .` (output redirected to `/tmp/d3-build.log`; rc captured directly, never through a pipe)
9. **D4** `docker run --rm ai-teams-claude:latest claude --version`
10. **D4 stop diagnostics, Tier R:** `docker inspect ai-teams-claude:latest --format 'Entrypoint={{json .Config.Entrypoint}}'` and the same for `.Config.Cmd`; the entrypoint's own validation block; **the control** -- the identical D4 command run against the known-good pre-build image `ai-teams-claude:rollback-pre-2.1.258` and against `apex-research-claude:latest`.

**outputs** (key lines) --

**F0.** `2.1.217 (Claude Code)`. The `NO_CLAUDE_PROCESS` branch did NOT print; instead pgrep returned `147601 bash -c claude --version; pgrep -af claude || echo NO_CLAUDE_PROCESS`. **F0's null is unreachable by construction:** `pgrep -af claude` matches its own wrapper because the wrapper's command line contains the string "claude", so pgrep always exits 0 and the `||` branch can never fire. Not treated as a stop -- a defect in the instrument, not a finding about the substrate, and F0 is not among the dispatch's listed stop conditions. Answered the underlying question instead: `pgrep -x claude` exits 1, the `/proc/*/exe` scan finds no claude binary, and the full ps shows none. **No claude process, three independent ways.**

**F1.** `changed 3 packages in 4s` / `npm_rc=0`. First try, no TLS retry needed.

**F2 -- PASS.** `2.1.258 (Claude Code)`, then two identical `claude is /usr/local/bin/claude` lines. Pass condition met as Brunel corrected it (absence of a second path, not a line count): `.local/bin` mentions 0, `/usr/local/bin/claude` lines 2, total lines 2. Corroboration: package.json `"version": "2.1.258"`; symlink and binary both re-dated 16:17; binary size changed 268573680 -> 215473560 (different upstream build, not a partial install, since the version reads correctly). Native-installer layout still absent both ways. **Blast radius re-checked AFTER the mutation rather than assumed: courier pid 1379 up at 6d04h, vite processes up, PO's tmux client still attached at /dev/pts/1.**

**D0-ii.** `FF_OK`, and `e7ab474..057fab4  main -> origin/main` -- Aen's two commits landed mid-dispatch, as Brunel predicted.

**D1.** `Updating e7ab474..057fab4`, `Fast-forward`, `Dockerfile | 18 +++-`, `docker-compose.yml | 8 ++-`. HEAD `057fab452b4d80a3c56511885eb912df28616ae0`. `67:ARG CLAUDE_VERSION=2.1.258`, `68:RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_VERSION} 2>&1 | tail -5 \`, `69: && [ "$(claude --version | cut -d' ' -f1)" = "${CLAUDE_VERSION}" ]`.

**D2 -- PASS.** `apex-research-claude:rollback-pre-2.1.258 fb99aee1887c` and `ai-teams-claude:rollback-pre-2.1.258 a983e663b44b`. Both IDs match the `:latest` IDs recorded in R-C part 2 exactly, so the rollback points at the images that were actually serving.

**D3 -- SUCCESS, rc=0**, 20 seconds. New image `ebef9b7b8ed9`, 1.7GB. Layer `#8` ran the install AND Aen's new assertion and reported `DONE 5.2s`, so the assertion passed inside the build. **Carrying Brunel's own S69 base-image finding, now live in this build:** layer #8 emitted `npm WARN EBADENGINE required: { node: '>=22.0.0' }, current: { node: 'v18.19.1', npm: '9.2.0' }`. The install and the assertion both succeeded regardless, and the base image's node is `v18.19.1` while apex overlays its own Node 22 tarball, which is why this has stayed masked at the apex layer.

**D4 -- ABORTED. `ERROR: REPO_URL is not set.` rc=1. This is a listed stop condition, so execution stopped here and D5 was NOT run.**

Diagnosis, Tier R, no fix improvised. `Entrypoint=["/entrypoint.sh"]`, `Cmd=["bash"]`. The image has an ENTRYPOINT, so `docker run --rm <image> claude --version` passes `claude --version` as the CMD **argument to the entrypoint** rather than executing it; the entrypoint reaches its Step 2 validation at lines 38-41 (`if [ -z "${REPO_URL:-}" ]; then echo "ERROR: REPO_URL is not set." >&2; exit 1; fi`) and exits before any version can print.

**THE CONTROL IS DECISIVE.** The identical D4 command run against the known-good pre-build image `ai-teams-claude:rollback-pre-2.1.258` returns the same `ERROR: REPO_URL is not set.` and rc=1. Against `apex-research-claude:latest` it returns `ERROR: GITHUB_TOKEN is not set.` and rc=1, same mechanism, different variable. **So the gate command cannot pass for ANY image in this family, including images known to be good. D4 is structurally unable to discharge, and D6 is the same shape and will fail identically when reached.** The failure is in the gate command, not in the image D3 produced.

**Diagnostic evidence about the image itself, labelled explicitly as NOT discharging D4:** with the entrypoint bypassed the new image reports `2.1.258 (Claude Code)` rc=0, and its package.json reads `"version": "2.1.258"`. Reported as evidence for Brunel's re-dispatch, NOT as the gate passing. The sanctioned gate is his to re-issue.

**NO RESTORE PERFORMED, deliberately.** Brunel's failure path says restore with `docker tag ai-teams-claude:rollback-pre-2.1.258 ai-teams-claude:latest`. That instruction is conditioned on the image being bad; the evidence says the gate command is defective and the image is correct. Restoring would undo a good build on a false signal, so I surfaced instead. The rollback tags are intact and the restore remains available unused.

**State at stop:** apex image untouched (`apex-research-claude:latest` still `fb99aee1887c`, D5 not run). Container `apex-research` `State=running` on the old image, serving `2.1.258` from the F1 fast path. All four rollback tags present. Nothing pruned.

**outcome** -- **partial: fast path SUCCESS, rebuild HALTED at D4 per stop condition.** The PO's ask is delivered -- the running apex container is on 2.1.258. The rebuild reached a correctly-built base image and stopped at a gate that cannot pass as written. Awaiting Brunel's re-dispatched D4 (and D6, same defect). D5, D6, D7, D8 not run. Nothing mutated beyond the sanctioned F1, D1, D2, D3.

(*FR:Hopper*)

---

## 2026-09-02T16:26+03:00 -- S71 rebuild resumed: D4' PASS, D5 SUCCESS, D6' PASS -- **REBUILD COMPLETE THROUGH D6, STOPPED AS DISPATCHED**

**timestamp** -- 2026-09-02T16:26+03:00 (D4') through 2026-09-02T16:30+03:00 (D5 log audit complete, reported).

**tasker** -- Brunel, his 16:23 re-dispatch, correcting the D4/D6 gate defect I surfaced at 16:21. PO sanction for D1-D6 unchanged, relayed by Aen at his 16:05.

**dispatch summary** -- Re-run the two blocking version gates in a form that survives the image ENTRYPOINT, each paired with a control against the corresponding pre-build image, then build the apex image between them. The control is the correction: two different version strings from the two images prove the command discriminates, so both pass and fail are reachable. Brunel's revised failure path for both gates replaces the original: on any unexpected result, STOP and surface, and do NOT restore, because a restore is only correct once the image itself is shown bad and no gate result alone establishes that.

**tier classification + sanction status** --

- **D4', D6' -- Tier R**, default-permitted. Both are `docker run --rm` reads with no persistence.
- **D5 -- Tier M**, PO-sanctioned via Aen, dispatched by Brunel: *"D5, Tier M, gated on R-C part 1 and on D4: `cd /home/dev/github/apex-migration-research && DOCKER_BUILDKIT=1 docker compose build`."* Both its gates were satisfied before execution: R-C part 1 (three-way fingerprint identical) at 16:11, and D4' at 16:26.
- **D7 NOT run** -- sanctioned but explicitly deferred by Brunel to immediately before the recreate, on the grounds that a backup taken early is a backup of the wrong state.
- **D8 NOT run and NOT sanctioned.**

**deployed-artifacts-read declaration** --

- **Layer 1 (FR design-as-shipped)** -- base `Dockerfile` at HEAD `057fab4` (read at D1). Not re-read.
- **Layer 2 (consumer-team operational copy)** -- `/home/dev/github/apex-migration-research` at `4d68b88`, unchanged; `Dockerfile.apex` lines 110-120 read directly from the build host during the post-build audit.
- **Layer 3 (running container state)** -- the running `apex-research` container probed for `/opt/warp-ca.pem` to establish whether that file is image-baked or runtime-mounted; new image contents probed via `docker run --rm --entrypoint sh`.
- **Audit-trail artifacts (this repo)** -- prior entries `T16:02`, `T16:06`, `T16:11`, `T16:16` in this file. R-C part 1 cited as D5's gate rather than re-probed.

**commands executed** (verbatim; RC host as `dev` via `ssh -T dev@100.96.54.170`) --

D4' as dispatched:
`docker run --rm --entrypoint claude ai-teams-claude:latest --version`
`docker run --rm --entrypoint claude ai-teams-claude:rollback-pre-2.1.258 --version`

D5 as dispatched: `cd /home/dev/github/apex-migration-research && DOCKER_BUILDKIT=1 docker compose build` (output redirected to `/tmp/d5-build.log`; rc captured directly, never through a pipe)

D6' as dispatched:
`docker run --rm --entrypoint claude apex-research-claude:latest --version`
`docker run --rm --entrypoint claude apex-research-claude:rollback-pre-2.1.258 --version`

Post-build audit, my own Tier R initiative, reading the whole build log rather than only the dispatched field: `grep -n "^#10"`, `grep -n "^#16"` and step-header greps over `/tmp/d5-build.log`; a failure-signature sweep across the entire log; `grep -niE "load metadata|ai-teams-claude"` to confirm what the base FROM resolved to; `sed -n '93,103p' /entrypoint-apex.sh` for the WARP CA step; `sed -n '110,120p' Dockerfile.apex`; `docker exec apex-research ls -l /opt/warp-ca.pem`; `readlink -f "$(command -v claude)"` inside the new image.

**outputs** (key lines) --

**D4' -- PASS, and it discriminates.** New base image `2.1.258 (Claude Code)` rc=0; control image `2.1.217 (Claude Code)` rc=0. Two different strings from the two images, which is the condition Brunel's original gate lacked entirely.

**D5 -- SUCCESS, rc=0**, 91 seconds (16:26:53 to 16:28:24). New apex image `ca42f7787444`, created 16:28:17. `apex-research-claude:rollback-pre-2.1.258` still `fb99aee1887c`, untouched.

**Base lineage confirmed, which is exactly what Brunel said D4' was really for.** The build log shows `#8 [stage-0 1/15] FROM docker.io/library/ai-teams-claude:latest@sha256:ebef9b7b8ed9ca9322f94937311ad6f21fb27e34860310f386b1c2c7ca777615`. That digest is the image D3 produced, so `:latest` did resolve to the new base and the D2 tag moves did not misdirect it.

**D6' -- PASS, and it discriminates.** New apex image `2.1.258 (Claude Code)` rc=0; control `2.1.217 (Claude Code)` rc=0. Independent corroboration inside the new apex image: package.json `"version": "2.1.258"`, `node v22.14.0` (apex's own Node 22 overlay, so the base's Node 18 is not inherited at this layer).

**THREE FINDINGS FROM READING THE WHOLE BUILD LOG. None of them blocks; all are reported, none acted on.**

1. **The native-install layer fails at build time and its failure is masked -- my S70 inference now confirmed with the mechanism visible.** Layer `#16` is `RUN gosu ai-teams bash -c 'curl --insecure -fsSL https://claude.ai/install.sh | bash' 2>&1 | tail -5`. It emitted `curl failed to verify the legitimacy of the server and therefore could not establish a secure connection to it` and then reported `#16 DONE 0.8s`. The trailing `| tail -5` makes the layer's exit status that of `tail`, so a failed install cannot fail the build. `/home/ai-teams/.local/bin/claude` is absent from the newly built image, confirming nothing landed. **The apex image's `claude` is entirely inherited from the base:** `readlink -f "$(command -v claude)"` returns `/usr/local/lib/node_modules/@anthropic-ai/claude-code/bin/claude.exe` and the symlink is dated Sep 2 16:19, which is the D3 base-build time, not the D5 apex-build time.

   **Mechanism, stated as observation then inference.** OBSERVED: `/opt/warp-ca.pem` does not exist in the built image, and entrypoint Step 0b installs it into the system CA store only `if [ -f "$WARP_CA" ]` at container start; in the running container it exists as a bind-mount dated Feb 13 2026. So there is no WARP CA in the filesystem during a build. INFERRED, not proven: the outer `curl` carries `--insecure` and so is not the failing fetch; the TLS failure is most likely `install.sh`'s own internal download, which does not inherit that flag. The Dockerfile comment at that layer reads *"Uses --insecure for WARP TLS interception during build"*, so the intent was to cover exactly this and it covers only the first hop.

2. **A second masked failure, same class, in layer #10.** `... && npm install -g npm@latest 2>&1 | tail -1 && ...` printed `npm error A complete log of this run can be found in: /home/ai-teams/.npm/_logs/2026-09-02T13_27_13_764Z-debug-0.log` and the layer reported `#10 DONE 19.0s`. Node itself installed correctly (`v22.14.0` printed on the preceding line), so the failure is confined to the npm self-upgrade and npm remains at the version shipped in the Node tarball. Same trailing-pipe masking as finding 1, and the same class as the base-image defect Aen's assertion commit closed earlier today at `Dockerfile:69`. `Dockerfile.apex` has no equivalent assertion on any of its layers.

3. **The remaining log noise is benign** -- `debconf: unable to initialize frontend: Dialog/Readline` and `invoke-rc.d: policy-rc.d denied execution of start`, both normal for non-interactive apt inside a container.

**outcome** -- **success; rebuild complete through D6 and stopped there as dispatched.** Both blocking gates now pass with a working discriminating control, the apex image ships 2.1.258, and its base lineage traces to the image D3 built. The fast path from Phase 1 and the durable rebuild now agree, which discharges the reporting obligation noted in the `T16:16` entry: the upgrade is durable, not just live. **D7 and D8 not run.** Nothing pruned, including the fifth apex tag and the two dangling images D3 and D5 created by moving `:latest`. The running container is still on the OLD image `fb99aee1887c` and continues to serve 2.1.258 from the F1 in-place upgrade; only a recreate (D8, unsanctioned) would move it onto `ca42f7787444`.

(*FR:Hopper*)

---

## 2026-09-02T16:33+03:00 -- S71 addendum to `T16:26`: recreate-safety claim VERIFIED by measurement, and one leg of its stated support does NOT hold (Tier R)

**timestamp** -- 2026-09-02T16:33+03:00. Addendum to the `2026-09-02T16:26+03:00` entry; that entry stands unedited per append-only discipline.

**tasker** -- Brunel, his 16:32 message. He retracted a warning he had given team-lead and the PO three times today -- that any recreate would silently downgrade apex to 2.1.217 until D8 landed -- and asked that the corrected claim go into this log.

**dispatch summary** -- Verify, rather than record on his word, the claim now reaching the PO: that the apex container is safe under every lifecycle event as of D5, so D8 is completing rather than protective and the PO may pick its moment freely. The claim changes what the PO believes about risk, so it is measured here rather than relayed.

**tier classification + sanction status** -- **Tier R, default-permitted.** `docker compose config`, `grep`, `docker images`, `docker inspect`, `docker run --rm`, `docker exec` reads. Nothing mutated. Self-originated verification of a claim I was asked to record is within the reporting duty of the role, not a self-tasked operation.

**deployed-artifacts-read declaration** --

- **Layer 2 (consumer-team operational copy)** -- `/home/dev/github/apex-migration-research/docker-compose.yml` raw keys, and the rendered `docker compose config` for the `apex-research` service. This is the layer the claim actually depends on and the one Brunel explicitly did NOT read from our mirror.
- **Layer 3 (running container state)** -- `docker inspect apex-research` for both `.Config.Image` and `.Image`; `docker inspect apex-research-claude:latest` for its current digest; version probes of the tag's current target and of the running container's overlay.
- **Layer 1** -- not read; the claim is about operational resolution, which Layer 1 cannot answer.

**commands executed** (verbatim, RC host as `dev`) -- `cd /home/dev/github/apex-migration-research && docker compose config | grep -nE "image:|build:|pull_policy:|container_name:"`; `grep -nE "image:|build:|pull_policy:|container_name:" docker-compose.yml`; `docker images --no-trunc --format '{{.Repository}}:{{.Tag}} {{.ID}}' | grep apex-research-claude:latest`; `docker inspect apex-research --format 'Config.Image={{.Config.Image}}'`; `docker inspect apex-research --format 'RunningDigest={{.Image}}'`; `docker inspect apex-research-claude:latest --format '{{.Id}}'` compared against the running digest; `docker run --rm --entrypoint claude apex-research-claude:latest --version`; `docker exec apex-research sh -c 'claude --version; ls -l /usr/local/bin/claude'`.

**outputs** --

**The claim is CONFIRMED.** The operational compose declares `image: apex-research-claude:latest` (raw line 36) alongside its `build:` block, with **no `pull_policy`**, so `up` uses the local tag. That tag resolves right now to `sha256:ca42f7787444...`, which ships `2.1.258 (Claude Code)`. So a recreate brings up 2.1.258. The restart path is independently safe: the running container's overlay still carries F1's install, `claude --version` inside it returns 2.1.258 and the symlink is dated Sep 2 16:17. **Both lifecycle events land on 2.1.258; the downgrade warning is correctly retracted, and it stopped being true at D5 as Brunel says.**

**ONE LEG OF THE STATED SUPPORT DOES NOT HOLD, and it should not be carried forward.** Brunel offered two independent observations: that D5 produced the tag from the operational compose, and that the running container's `Config.Image` is that same tag. **The second is not evidence for the conclusion.** `Config.Image` is the image REFERENCE AS WRITTEN AT CREATION TIME -- a static string, not a digest. It reads `apex-research-claude:latest` regardless of where that tag currently points, and it would read exactly the same if the tag still pointed at the old image or at nothing at all. It cannot distinguish the safe case from the unsafe one, so it cannot support either.

The conclusion survives on the first leg plus the tag's current resolution, which is why this is a correction to the reasoning and not to the result.

**The discriminating field is `.Image`, and it currently shows a live divergence:**

- `Config.Image` = `apex-research-claude:latest`
- `.Image` (running digest) = `sha256:fb99aee1887c...`
- tag `apex-research-claude:latest` now = `sha256:ca42f7787444...`

**So the container is NOT running the image its own `Config.Image` names.** D2 and D5 moved the tag underneath a live container. Anyone reading `docker inspect ... Config.Image` today would conclude apex runs `ca42f778`; it runs `fb99aee1`. The divergence is benign in version terms, because both ship 2.1.258 by different routes -- the old image plus F1's overlay mutation, versus the new image natively -- but it is a real observability trap for the window between the build and the recreate.

**outcome** -- **success; claim verified, one supporting leg withdrawn, one new observability finding recorded.** The recreate-safety conclusion reaching the PO is correct and now rests on measurement rather than relay. **D8 is completing rather than protective**, so the PO may choose its timing freely; what D8 buys is alignment between what runs and what the build produced, plus the end of the `Config.Image` divergence above. Nothing mutated. D7 still parked for immediately before the recreate; D8 still unsanctioned.

(*FR:Hopper*)

---

## 2026-09-02T16:43+03:00 -- S71 D7 (Tier M) + **D8 (TIER D, force-recreate) EXECUTED** + D9 (Tier R): apex-research now RUNS the new image

**timestamp** -- 2026-09-02T16:43+03:00 (moment-of-use re-validation) through 2026-09-02T16:46+03:00 (D9 investigation complete).

**tasker** -- Aen (team-lead), relaying PO sanction of 16:40 and Brunel's package verbatim at 16:46, after I refused at 16:41 with `[SANCTION-INCOMPLETE]`.

**dispatch summary** -- Complete the upgrade: back up `.claude.json` to the persistent volume, force-recreate the container so it adopts the image built at D5, then verify post-recreate.

**tier classification + sanction status** --

- **Re-validation, D9 -- Tier R**, default-permitted.
- **D7 -- Tier M.** Tasker-ack quoted verbatim: *"D7 Tier M, REQUIRED -- `docker exec apex-research bash -c 'mkdir -p /home/ai-teams/.claude/backups && cp -a /home/ai-teams/.claude.json /home/ai-teams/.claude/backups/.claude.json.backup.$(date +%Y%m%d-%H%M%S) && ls -l /home/ai-teams/.claude/backups/'` The destination is on the `~/.claude` VOLUME, which is what makes it survive the recreate."*
- **D8 -- TIER D. Sanction VALIDATED COMPLETE before execution; all three components present verbatim.** (a) EXACT COMMAND: *"`cd /home/dev/github/apex-migration-research && docker compose up -d --force-recreate`"*. (b) REASON: *"a rebuilt image under an unchanged compose is NOT adopted by plain `up -d`. Without `--force-recreate` the container keeps running the old image and the entire rebuild delivers nothing."* (c) EXPECTED OUTCOME: *"the container is recreated on the new image and reaches a running state; `docker ps` shows apex-research up; the entrypoint log reports KEY_COUNT=3; the courier and dashboard are running again within the supervisor's relaunch interval; the CLI reports 2.1.258 to the ai-teams user."* ROLLBACK: *"`docker tag apex-research-claude:rollback-pre-2.1.258 apex-research-claude:latest && docker compose up -d --force-recreate`"*. DESTROYS/PRESERVES lists supplied and quoted in the 16:46 relay. **PO sanction 16:40, relayed by Aen.**
- **PRIOR REFUSAL, recorded because it is the audit point.** At 16:41 I issued `[SANCTION-INCOMPLETE]` and did not execute: I held only the exact command; the reason, expected outcome, rollback and Brunel's revised blast radius had never transited to me (his 16:13 dispatch states D8 "is NOT sanctioned and is not in this dispatch"), and D9 had never reached me in any message. Both gaps were filled at 16:43 and 16:46 and execution followed. Justification for refusing rather than inferring: **in this same package four steps earlier, Brunel's pre-written D4 failure path asserted a gate failure meant a bad image and instructed a restore; that premise was false and following it mechanically would have destroyed a correct build.** A pre-written Tier D expected-outcome and rollback can be wrong, which is why the text must be read rather than assumed.
- **Aen's amendments to Brunel's text, applied:** the "failure mode avoided" clause predates Brunel's 16:32 retraction and the downgrade hazard is closed, so D8 was sanctioned as completing rather than protective; D9 gains a check that the running digest equals the tag's; **and the D8 rollback is conditioned on the container being BAD after recreate, not on any single gate line -- on an unexpected D9 result, STOP and surface BEFORE rolling back.** That third amendment is the correction I asked for at 16:41 and it governed my handling of the KEY_COUNT miss below.

**deployed-artifacts-read declaration** --

- **Layer 1** -- not re-read; the L1/L2 entrypoint drift recorded at S70 is cited below as the explanation for the KEY_COUNT miss.
- **Layer 2** -- `/home/dev/github/apex-migration-research` compose used by D8; the running `/entrypoint-apex.sh` grepped in-container for `claude.json` handling.
- **Layer 3** -- pre- and post-recreate `docker inspect` (state, `.Image`, `.Config.Image`, mount table), entrypoint logs, in-container process table, `~/.ssh` contents and fingerprints, `~/.claude` volume contents.
- **Audit-trail artifacts (this repo)** -- entries `T16:02`, `T16:06`, `T16:11`, `T16:16`, `T16:26`, `T16:33` in this file.

**commands executed** (verbatim, RC host as `dev`) -- moment-of-use re-validation (tag resolution, running digest, container state, quiescence via `pgrep -x` and a `/proc/*/exe` scan, service inventory, tmux clients, `.claude.json` existence) with hard abort branches on tag drift, non-running state, or a missing backup source; then D7 verbatim; then a verification of D7 (see outputs); then D8 verbatim with rc captured directly and output to `/tmp/d8.log`; then D9's three dispatched probes plus Aen's digest-equality amendment, plus my own cross-checks and the follow-up investigation.

**outputs** (key lines) --

**Re-validation, 16:43:41.** Tag `apex-research-claude:latest` -> `sha256:ca42f778...` (the D5 image, unchanged since the build); running digest `sha256:fb99aee1...`; state `running`; tag ships `2.1.258`. Quiescence confirmed: `pgrep -x claude` rc=1 and the exe-scan found nothing. Services present as the blast radius predicts. **GATES PASS.**

**D7 -- rc=0, but its own verification step could not show its own result.** The sanctioned command ends `ls -l /home/ai-teams/.claude/backups/`, which printed `total 0`. **The backup filename begins with a dot, so plain `ls -l` cannot list it.** I did not accept rc=0 as proof of a backup that is the entire safety net for a Tier D recreate. `ls -la` shows `.claude.json.backup.20260902-164341`, 55734 bytes, and `md5sum` makes it byte-identical to the source: both `6f3c1370749377d0f2494019172025f0`. **Backup verified real.** (Five older CLI-generated backups with epoch-ms names were already present.)

**D8 -- SUCCESS, rc=0.** `Container apex-research Recreate / Recreated / Starting / Started`. Pre-state image `sha256:fb99aee1...` started 2026-08-27; post-state image **`sha256:ca42f7787444...`** started 2026-09-02T13:44:30Z, state `running`. **The container now runs the image D5 built.**

**D9 -- PASS on every substantive check; ONE expected-outcome line did not appear.**

- CLI: `2.1.258 (Claude Code)`; two identical `claude is /usr/local/bin/claude` lines; `.local/bin` mentions **0**. Same pass condition as F2, met.
- `~/.ssh` re-seeded by entrypoint Step 7b: `authorized_keys`, `stationmaster_apex`, `stationmaster_known_hosts`, all dated 16:44.
- **Courier key survived and is unchanged:** `256 SHA256:NBq5a/r3GsTuIGME1BzsklC9Sr+6VrltsxoSfW4QsaE apex-research (ED25519)` -- identical to R-C. Hub authentication is preserved.
- Courier and dashboard relaunched by the supervisor within ~3s (pids 1441/1448/1475/1476).
- **Aen's amendment satisfied -- the metadata divergence is CLOSED:** running digest `sha256:ca42f778...` now equals the tag's resolution, and `Config.Image` agrees.
- Stale-lock handling worked: the boot cleared the prior lock and the new courier wrote a fresh one at 16:44.
- Volume preservation confirmed: `.credentials.json` (OAuth) intact, `teams/apex-research` intact, and the D7 backup intact on the volume.

**THE MISS, and why it is NOT a rollback trigger.** Brunel's expected outcome says *"the entrypoint log reports KEY_COUNT=3"*. **No such line exists.** The whole log is 40 lines, so `--tail 80` covered it entirely and the window was not the problem; a case-insensitive search for `key_count`, `key count`, `keys installed`, `SSH_PUBLIC_KEY` and `authorized` returns nothing.

**Ground truth was then measured directly rather than inferred, and the underlying condition IS met.** `authorized_keys` holds **3 non-blank lines**, and `ssh-keygen -lf` identifies them: `mihkel.putrinsh@evr.ee apex-research`, `ghost-bridge@aleksandr-2026-05-15`, and `rc-connect` -- exactly the three keys recorded for this substrate. `sshd` is listening on 2222. So the state KEY_COUNT=3 was a proxy for is verified true by a better instrument than the log line.

Explanation, labelled as inference: the running entrypoint is the **Layer 2** copy (25805 bytes, Jun 16) and the **Layer 1** copy is 32823 bytes (Jul 23) -- the 7 KB L1/L2 drift recorded at S70. Brunel's expected outcome was almost certainly written against the L1 text, which emits the line. Well-supported, not measured.

Per Aen's amendment 3 I did **not** roll back. Rolling back on a failed check whose underlying reality is verified sound would repeat the D4 error exactly.

**TWO FINDINGS SURFACED, NEITHER ACTED ON.**

1. **`/home/ai-teams/.claude.json` no longer exists.** The mount table confirms only three volumes -- `~/.claude`, `~/workspace`, `~/source-data` -- so this file lived on the container overlay and the recreate destroyed it, precisely the loss D7 was required to cover. A grep of the running entrypoint for `claude.json` returns nothing, confirming it neither creates nor restores it. **My D7 backup on the volume is now the only copy.** No step in D1-D9 restores it, and restoring is a mutation outside this dispatch, so the decision belongs to Brunel and the PO. OAuth is unaffected -- `.credentials.json` lives on the volume and is intact.
2. **The source-data pull failed with HTTP 403** during boot: `fatal: unable to access 'https://github.com/Eesti-Raudtee/vjs_apex_apps.git/': The requested URL returned error: 403`, followed by `[entrypoint] WARNING: git pull failed for source-data. Using existing state.` The entrypoint degraded gracefully and its later gate reports `OK: vjs_apex_apps source data` from the preserved volume, so the data is present but not refreshed. A 403 points at token scope or expiry. Pre-existing in character and not caused by the recreate, but it is now visible on a fresh boot. The `WARN: DB tunnel down` line is expected -- those are reverse-forwards from the Windows workstation.

Entrypoint reached `[entrypoint] All gates passed. Starting...` and both supervisors launched.

**A defect of my own, recorded so the number is not trusted.** In my investigation script I wrote `echo "(rc=$?)"` after a `grep ... | head` pipeline, which reports `head`'s status and printed `rc=0` under a grep that matched nothing. I did not rely on it -- the empty output carried the conclusion -- but it is my own documented trailing-pipe gotcha committed again inside a diagnostic, and the printed `rc=0` is meaningless.

**outcome** -- **success. The apex CLI upgrade is COMPLETE end to end.** The container runs the newly built image, serves 2.1.258, has its three SSH keys and its unchanged courier key, and its courier and dashboard are supervised and running. All three named volumes survived. The metadata divergence is closed. Nothing was rolled back and nothing was pruned. Two items are open for Brunel and the PO: whether to restore `.claude.json` from the D7 backup, and the 403 on the source-data pull.

(*FR:Hopper*)

---

## 2026-09-02T16:50+03:00 -- S71 addendum to `T16:43`: D9 reconciled against Brunel's SUPERSEDING rewritten D9; one uncovered check run and PASSED (Tier R)

**timestamp** -- 2026-09-02T16:50+03:00. Addendum to `2026-09-02T16:43+03:00`; that entry stands unedited.

**tasker** -- Brunel's 16:43 message (rewritten D9), which Aen's 16:49 message declares supersedes his own 16:46 forward wherever they differ. Both arrived AFTER D7/D8/D9 had already run against the 16:46 forward.

**dispatch summary** -- Reconcile what I actually executed against the superseding D9 and close any gap. Brunel rewrote D9 after finding, while writing it out, that his original contained `pgrep -af "courier|vite"` -- the same self-matching defect I caught in F0. His rewrite asserts OUTCOMES rather than process names, so no self-match can defeat it.

**tier classification + sanction status** -- **Tier R throughout, default-permitted.** No mutation. No rollback (Brunel: rollback is not free -- it returns apex to 2.1.217 and, since D8 already destroyed F1's overlay copy, loses the whole day's upgrade; Aen: rollback comes only through him).

**deployed-artifacts-read declaration** -- Layer 3 only: in-container HTTP probe of the dashboard, courier lock mtime with full ISO precision, courier log, container status and restart counters, host clock. Layers 1 and 2 not re-read; nothing in this addendum depends on them.

**commands executed** -- `docker exec apex-research bash -c 'curl -s -o /dev/null -w "http_%{http_code}\n" http://127.0.0.1:5173/ || echo CURL_FAILED'`; `ls -l --time-style=full-iso .../stationmaster-state/courier.lock`; `docker inspect apex-research --format '{{.State.StartedAt}}'`; `ls -l` and `tail` of both candidate courier-log paths; `docker ps --filter name=apex-research --format '{{.Status}}'`; `docker inspect apex-research --format 'RestartCount={{.RestartCount}} Restarting={{.State.Restarting}} OOMKilled={{.State.OOMKilled}}'`; `date` on both hosts.

**outputs** --

**Reconciliation. Five of Brunel's six rewritten checks were already covered by what I ran at 16:45, with equal or stronger evidence. ONE was not: D9d.**

- **D9d, dashboard alive by outcome -- NOT PREVIOUSLY RUN, now PASS: `http_200`.** I had confirmed the vite processes were up but never confirmed the dashboard actually serves. That distinction is precisely why Brunel wrote the check as an outcome, and he was right that a running process is not a serving service. This was a real gap in my D9 and it is now closed.
- **D9c, courier alive by outcome (his failure-mode #1, "the one to check first") -- PASS.** Lock mtime `2026-09-02 16:44:39.502763324 +0300`; container `StartedAt` `2026-09-02T13:44:30.960494033Z`, i.e. 16:44:30 EEST. **The lock is 9 seconds AFTER the recreate**, so the entrypoint cleared the prior lock and the new courier claimed a fresh one. Stronger evidence than the lock alone also exists in the courier log: `2026-09-02T13:44:39Z INFO courier up: team=apex-research target=sm@10.100.136.162 interval=30.0s outboxes=['framework-research-courier'] inject->team-lead` -- the courier logging its own clean start after the recreate, naming hub target and outbox.
- **Path discrepancy in D9c, minor, reported not fixed:** his command reads `.../stationmaster-state/courier.log`, which **does not exist**. The courier log is at `/home/ai-teams/.claude/logs/courier.log`, where entrypoint Step 9e's `supervise()` redirects it. The lock half of D9c is at the path he gives; the log half is not.
- D9a version, D9b digest equality, D9e keys, D9f status: already covered at 16:45 and recorded in `T16:43`.
- **D9f restart counters, added here:** `Up 5 minutes`, `RestartCount=0`, `Restarting=false`, `OOMKilled=false`. Failure mode 3 (restart-looping) negative.

**AUDIT NOTE ON TIMESTAMP ORDERING, recorded because it would otherwise read as a sanction violation.** Teammate message timestamps are self-reported and the agents' clocks are not synchronised: Brunel's superseding package is stamped 16:43 and Aen's forward 16:46, while my host-side execution stamps read 16:43:41 (re-validation) and 16:44:20 (D8). **Execution followed receipt in my own conversation order** -- I received Aen's complete verbatim package, validated all three Tier D components present, and only then executed. The RC host and my workstation clocks agree exactly (both `16:50:27`), so the host-side stamps in `T16:43` are sound; it is the inter-agent message stamps that cannot be used to order events against them.

**outcome** -- **success; D9 complete under the superseding dispatch.** All six checks pass. The one check my execution had not covered was found by reconciling rather than by assuming equivalence, and it passed. No rollback, no mutation, nothing pruned. The two open items from `T16:43` are unchanged and still belong to Brunel and the PO: whether to restore `.claude.json` from the D7 backup, and the HTTP 403 on the source-data pull.

(*FR:Hopper*)

---

## 2026-09-02T16:55+03:00 -- S71 **CORRECTION to `T16:43`: my KEY_COUNT explanation was WRONG** (Tier R); and restore Step 1 STOPS on Brunel's own stop condition

**timestamp** -- 2026-09-02T16:55+03:00. Correction to the `2026-09-02T16:43+03:00` entry, which stands unedited per append-only discipline. The correction is to my **explanation**, not to that entry's outcome.

**tasker** -- Brunel, his 16:50 message: a correction of my KEY_COUNT inference plus a two-step `.claude.json` restore dispatch, the Tier M half sanctioned by team-lead.

### PART 1 -- WITHDRAWING MY OWN INFERENCE

**In `T16:43` I explained the absent `KEY_COUNT=3` line as L1/L2 entrypoint drift, labelled inference. THAT EXPLANATION IS FALSE AND IS WITHDRAWN.**

`KEY_COUNT` is a **shell variable, never a logged literal**. Confirmed by me against the **running L2 entrypoint** rather than accepted on Brunel's L1 grep: `223:KEY_COUNT=0`, `229: KEY_COUNT=$((KEY_COUNT + 1))`, `233:if [ "$KEY_COUNT" -gt 0 ]; then`, and the emitting line `243: echo "[entrypoint] ${KEY_COUNT} SSH public key(s) installed for michelek + ai-teams."`. **The string `KEY_COUNT` cannot appear in log output from any version**, so the grep returned a true negative and no read of L2 was ever needed to settle it.

**Why the false explanation is worse than the miss it explained.** It would have entered the L1/L2 drift record as a supporting instance. It is exactly the kind of inference that gets adopted because it fits the observation, and the observation is equally consistent with the string never existing. **An explanation that fits is not an explanation that is sourced.** I labelled it as inference, which was right, and it was still wrong; labelling limits the damage but does not substitute for reading the source.

**Provenance of the error, per Brunel:** my own May-2026 scratchpad line *"KEY_COUNT=3 confirmed in entrypoint logs"* was shorthand for *the count was 3*. He read it as a log literal and built a grep string from it six months later. **A variable name in a note became an expected output.** The note was mine; the expectation was his.

**POSITIVE CLOSE RUN, so this ends as a confirmation rather than an explained absence.** `docker logs apex-research 2>&1 | grep -i 'SSH public key'` returns:
`[entrypoint] 3 SSH public key(s) installed for michelek + ai-teams.`
**The count is 3.** The `T16:43` conclusion is unchanged and now rests on the entrypoint's own log line as well as on the three fingerprints measured there. (`PIPESTATUS[1]` used for the exit status, not `$?` after the pipe -- the trailing-pipe trap I recorded against myself in `T16:43`.)

### PART 2 -- RESTORE STEP 1 (Tier R): STOPPED

**tier / sanction** -- Step 1 Tier R, default-permitted. Step 2 is Tier M, sanctioned by team-lead, and requires a single literal filename carried from Step 1. **Step 2 NOT executed.**

**dispatched command** -- `docker exec apex-research bash -c 'ls -l /home/ai-teams/.claude.json 2>&1; echo ---BACKUPS---; ls -l /home/ai-teams/.claude/backups/; echo ---CLAUDE-PROCS---; ls -l /proc/[0-9]*/exe 2>/dev/null | grep -c claude.exe; echo ---PS---; ps -eo pid,etimes,args --no-headers'`

**outputs** --

- `.claude.json` **absent**, as expected. Read at the moment of use, not inherited.
- claude-process count **0**; the full process table confirms it independently (bash, sshd, two entrypoint shells, courier 1448, vite 1441/1475/1476, esbuild 1487).
- **`ls -l` on the backups directory printed `total 0`.** Same dotfile-hiding defect as D7's verification step, which I reported to Brunel at 16:51; the dispatched command repeats it. **Run verbatim and stopped there, Step 1 reports NO BACKUP AT ALL** -- a false negative that would read as "the only copy is gone" and make the restore look impossible.
- `ls -la` shows **SIX** backups, not one:

| file | bytes | mtime |
|---|---|---|
| `.claude.json.backup.1788349916567` | 56062 | Sep 2 14:51 |
| `.claude.json.backup.1788350028870` | 56062 | Sep 2 14:53 |
| `.claude.json.backup.1788350334115` | 56062 | Sep 2 14:58 |
| `.claude.json.backup.1788350492391` | 56065 | Sep 2 15:01 |
| `.claude.json.backup.1788350805653` | 56065 | Sep 2 15:06 |
| **`.claude.json.backup.20260902-164341`** | **55734** | **Sep 2 15:07** |

**STOP CONDITION FIRED.** Brunel's Step 1 says *"STOP AND SURFACE if: the backup count is anything other than 1"*. It is 6. The five epoch-ms files are CLI-generated and predate today's work; they were recorded in `T16:43` but were not pushed to him directly, so he wrote the expectation without them.

**Not executing Step 2, and the reason is structural rather than formal.** Step 2 requires substituting *"the ONE literal filename from step 1"*. There is no one filename. **The two-step shape exists precisely so the executor does not choose the file, and choosing is what proceeding would require.** I hold the evidence that identifies the right one -- `.claude.json.backup.20260902-164341` is the D7 backup, verified byte-identical to the pre-recreate original at `T16:43` (both md5 `6f3c1370749377d0f2494019172025f0`), while the five others differ in size and content and represent older states -- but supplying it from my own judgement is the substitution the split was designed to prevent. **Brunel names the literal in a re-issued Step 2 and I execute it.**

**outcome** -- **partial. Part 1 closed: my inference withdrawn, the corrected positive check run and passed at 3 keys. Part 2 stopped at Step 1 on the dispatcher's own stop condition; Step 2 not run, nothing mutated, `.claude.json` still absent and all six backups untouched.** Restoring remains available and costs one line from Brunel.

(*FR:Hopper*)

---

## 2026-09-02T16:59+03:00 -- S71 `.claude.json` restore Step 2 (Tier M): **VERIFIED BYTE-IDENTICAL**; last open item between Brunel and me CLOSED

**timestamp** -- 2026-09-02T16:59+03:00.

**tasker** -- Brunel, his 16:58 re-issue of Step 2 carrying the literal filename, after my 16:56 STOP on his own stop condition (six backups, not one). Tier M sanctioned by team-lead.

**dispatch summary** -- Restore `/home/ai-teams/.claude.json`, destroyed by the D8 recreate because it lives on the container overlay rather than on a volume, from the D7 backup on the `~/.claude` volume.

**tier classification + sanction status** -- **Tier M.** Tasker text quoted verbatim: *"cp -a /home/ai-teams/.claude/backups/.claude.json.backup.20260902-164341 /home/ai-teams/.claude.json; md5sum ...; ls -la ..."* with **EXPECTED OUTCOME** *"two md5 lines, both `6f3c1370749377d0f2494019172025f0` ... `ls -la` shows the file owned `ai-teams:ai-teams`, 55734 bytes, mtime Sep 2 15:07"*, **STOP** *"if: the hashes differ from each other or from `6f3c1370...`, or the size is not 55734"*, **ROLLBACK** *"`rm /home/ai-teams/.claude.json`, returning the container to its current state. Do not delete any backup, including the five CLI ones."* The literal filename removes the selection I refused to make at 16:56; no variable and no glob transits the SSH-to-docker-exec-to-bash chain, which is the A.2 transit hazard Brunel deliberately designed around.

**deployed-artifacts-read declaration** -- Layer 3 only: pre-check of process state and both file paths at the moment of use; post-write verification of hash, size, ownership, mtime and the backup directory. No Layer 1 or Layer 2 read is implicated by a file copy inside the container.

**commands executed** -- Pre-check, my own Tier R initiative with three abort branches (claude-process count non-zero; target already existing, which would make overwriting a different decision; source missing or zero bytes). Then the sanctioned command verbatim. Then verification with `--time-style=full-iso` and a full `ls -la` of the backups directory.

**outputs** --

Pre-check at 16:59:21: claude processes **0**; target absent; source present at 55734 bytes. **PASS.** The ordering matters and is the point of the check -- a running CLI would rewrite the target, so the restore must precede any CLI start.

**Sanctioned command, rc=0:**
`6f3c1370749377d0f2494019172025f0  /home/ai-teams/.claude/backups/.claude.json.backup.20260902-164341`
`6f3c1370749377d0f2494019172025f0  /home/ai-teams/.claude.json`
`-rw------- 1 ai-teams ai-teams 55734 Sep  2 15:07 /home/ai-teams/.claude.json`

**Every stop condition cleared.** The two hashes are identical to each other AND to the expected `6f3c1370...`, which is the same hash recorded at `T16:43` against the pre-recreate original. Size 55734. Owner `ai-teams:ai-teams`, so running as `-u ai-teams` avoided any ownership repair. Full-ISO mtime `2026-09-02 15:07:06.512087824 +0300`, exactly as predicted.

**All six backups present and untouched**, including the five CLI-generated ones. Nothing deleted.

**SUBSTRATE FACT worth carrying, from Brunel's reading of my 16:56 listing.** The five epoch-ms files are written by Claude Code itself into `~/.claude/backups/`, which is **on the volume**, so they survived the recreate and `.claude.json` was never strictly unrecoverable. **But the D7 copy was still the right one to restore, for a better reason than authorship:** the CLI writes its backup *before* each write, so its newest copy is the state *preceding* the last write, and **D7's is the only copy of the final state.** The size step from 56065 down to 55734 is that last write. Consequence for future dispatches: **the CLI's own backups are a real safety net but always trail by one write, so a pre-recreate capture is still required.** Brunel is revising his entrypoint recommendation to team-lead on this.

**The name-versus-mtime disagreement is correct behaviour, not a fault.** The D7 file's name encodes 16:43:41 (when the copy ran) while its mtime is 15:07 (when the CLI last wrote the source), because `cp -a` implies `--preserve=all`. The five CLI names decode to their own mtimes because those were written, not copied. **The disagreement is evidence the copy is faithful.** Recorded so a later reader does not chase it as a clock fault.

**outcome** -- **success.** `/home/ai-teams/.claude.json` restored byte-identical to its pre-recreate state, with per-project trust decisions and MCP approvals intact, so the next session in this container meets no prompts it should not. Nothing else mutated; no backup deleted. **This closes the first of the two items left open at `T16:43`.** The remaining item is the HTTP 403 on the source-data pull, which is the PO's.

(*FR:Hopper*)

---
