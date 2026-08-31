# Team-Lead Scratchpad (*FR:Aen*)

> ## ⚠ THIS FILE IS A CLAIM ABOUT SOURCES. IT IS NEVER A SOURCE.
>
> Written as one agent's aide-memoire; **read by every agent at startup as an authoritative record.** Nothing in it marks that change of status, which is why it is added here explicitly.
>
> **Before citing anything below as fact -- especially in another agent's artifact -- open the thing it describes.** On 2026-08-19 a librarian correctly consulted a source before altering a submitter's accurate claim, found this file, and published a false statement from it; the submitter's original was right. Every step of that was diligent. **The artifact did not tell him what it was.**
>
> Known failure directions, all observed live: entries here can be **stale**, **incomplete-at-authoring**, or **pessimistic**. **Line-number and file-path references here have been wrong more often than right.**

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S66 (2026-08-28..08-31, one continuous session across a weekend) CLOSED clean. Parent = **Fable 5** (on-pin; Step 0.5 caught an Opus 4.6 start, PO switched). CLI **2.1.250**, SLUG `session-e35db95e`, session pid **14916**, 22 team dirs. Cell = Brunel + Hopper (opus, PO's model rule: only team-lead on Fable) + Celes (fable, after a respawn incident) + Callimachus (opus).
- **S66 DELIVERABLE, end-to-end in one session:** per-colleague container for **Joosep Madar** LIVE on RC `100.96.54.170:2231` (image `joosep:latest`, allerk-base, host-net by measurement, no secrets at first boot) + 6-agent team design **`paunvere`** (Celes; Minot/Trevithick/Rastrick/Saxby/Bradshaw/Smiles) + `Connect-Joosep.ps1` + 13-step runbook. Steps 0-8+11 executed; **9a-9c = Joosep's own key (VEO-182, rada A); rebuild (Estonian FIRST-TASKS + paunvere package seed + TEAM_NAME) + 9d dev-key revoke + Step 12 registries ALL HELD on his 9a**. Jira: VEO-181 (corrected 31.08) + VEO-182 (Joosep's subtask). Research: 12-agent workflow brief + apex FR-S66-01 reply (MS365-sourced).
- **Key decisions this session (all PO):** allerk-base; host-net (bridge FAILS at DNS -- probe sanctioned, third-state finding); Joosep permanent (#110 revisit Mon/Tue); key posture = revoke from `dev` after Step 9 (one key, byte-identical, attested); PAT+Atlassian connector = team's preseeded FIRST-TASKS (no secrets in container); Lerko's compose header = RC port ground truth; team name `paunvere`; §8 items 2-4 as designed; EVR = **Cloudflare WARP, never tailnet** (#109, auto-memory saved).
- **Carry-forward:** see NEXT-SESSION BOOT below.

---

### S66 WRAP (2026-08-28..31) -- session CLOSED clean

- **Container arc:** 4 build attempts, 3 real pre-existing defects each exposed by fixing the previous (`| tail` masked TLS-fail -> masked npm-12-engine-fail -> dash-has-no-pipefail). Seed-stamp pattern (md5/dir-digest guarded re-seed) built for FIRST-TASKS + team package. Hopper: 1 sanctioned Tier M probe (bridge), 1 Tier D re-classified (9d, held), **1 self-reported unsanctioned Tier M** (filed as failed-discipline at his request). Off-host test PASSED incl. container refusing the PO's own dev-key.
- **Safety picture (rail thinner than briefed):** Elron/PONY endpoint = `SK_ENDPOINT` env + substring guard `EvrSK_test` x3 copies; range check REMOVED client+server (`faa287e`, stale "server-side" comment survives); no CI, no branch protection, no human owner. Team rule: routing changes need **Ruth Türk sign-off mediated by PO**. Open org items (PO's): branch protection on `rumba` + named safety owner + does EvrSK TEST reject out-of-range train numbers. §5 findings NOT yet relayed to Ruth.
- **Celes respawn incident:** wrong-model spawn -> interrupted -> respawn collided with live name (`celes-2`) -> PO ordered clean re-respawn + scratchpad rollback -> **a name-addressed send RESUMED the terminated instance** (wiki: `name-addressed-send-resumes-a-terminated-agent`); Cal discarded its output. Lesson: never spawn a replacement before `teammate_terminated`; never address a dead instance.
- **Wiki 185 -> 214** (net; incl. warp-cgnat-misread, right-conclusion-vs-mechanism, trailing-pipe-exit-status, redundant-verification-authorisation-cost, scope-bound-identifier umbrella [my ruling], two-images-one-tag). `confidence` found UNDOCUMENTED in WikiProvenance (112/214; documented fields 100%); `schema-population-audit.py` shipped as 7th audit layer. Cal: 7 own-call reversals, all on specialist pushback -- watch, not entry.
- **Interim rule (mine, in force):** any promotion ruling on an entry lacking `confidence` says "from prose, unrated".
- **11 commits `ffda650`..`435b7e6` + this close.** Gists: vedur draft `ded8ed8d...`, Joosep connection guide `8c6f4b25...` (fingerprint deliberately NOT in it).

### NEXT-SESSION BOOT (re-orient instructions for S67)

1. Read `startup.md` first (always). Substrate pins: `FR_COURIER_TEAM_DIR_NAME=<discovered-slug>` for restore/persist (`$PPID`=1 under Git Bash); Step 3.5 DETACHED with `-SessionPid <claude pid>`; courier log = `fr-courier.log.err`; Step 0.5 works via session header (config `team-lead.model` still null).
2. **Pull first** (two-box rule); diff against both parents on any conflict in THIS file.
3. **Don't pre-spawn.** Wait for PO direction.
4. **If Joosep reports "9a OK" (VEO-182 comment or PO relay):** spawn **Hopper** + **Brunel**. Sequence, all specced and held: (a) Hopper `rm ~/FIRST-TASKS.md` in container (pre-attested untouched -- if >1-2 days passed, Brunel wanted md5-conditional instead); (b) rebuild w/ frozen tree (8 context items incl. `teams/paunvere/` dir; md5s in Brunel's scratchpad); (c) `.env` TEAM_NAME=paunvere + `./joosep.sh restart`; (d) PO green-lights Joosep's 9b/9c; (e) **9d dev-key revoke** (Tier D, sanctioned, runbook Step 9d.0-9d.5, PO does fresh-connection check); (f) Step 12 registry rows incl. Lerko's header (sanctioned); (g) Step 13 hand-over (Estonian, drafted). Runbook: `designs/new/joosep/PROVISIONING-RUNBOOK.md`.
5. **If 9a FAILS:** likely WARP enrollment on Joosep's machine ([PO-8]) or key path; Hopper has the sshd-log side.
6. **If PO asks about #110:** Mon 08-31/Tue 09-01 hiring confirmation w/ Ruth -- PO's own item, we only note the outcome.
7. **If PO wants the §5 rail findings relayed to Ruth:** they are in VEO-181 description (Estonian) -- PO relays, we don't.
8. **Cal's 3 queued contract changes (his scratchpad header, order re-ruled 17:32):** (1) document `confidence` in WikiProvenance w/ axes, absent="unrated"; (2) Protocol A optional `discoveryOrder` (MINOR); (3) `negative-probe` restructure (needs non-author read-back: Hopper or Herald). One at a time, through the gates; Celes owns prompt lines, .ts ships same commit.
9. **Volta items (still untasked since S63/S65):** startup.md host-check table; `inter-team-comms` retirement; `sanitize-inboxes` configs[0] bug; oldest-unacked check; `.log`->`.log.err` verify-line fix; **#109 tailscale scrub** (scope corrected in issue comments -- re-triage by READING, wiki already clean).
10. **apex loop:** FR-S66-01 answered (their `teams/apex-research/docs/joosep-profile-response-2026-08-28.md` @34f2f310); nothing outstanding either side. Hub healthy, courier detached pid 30616 (dead with this session -- restart at S67 Step 3.5).

### Standing watch items going into S67

- **VEO-182 / Joosep's 9a** -- the single gate for boot item 4's whole chain.
- **allerk pid-ceiling gap** (PO-19) -- PO to tell Lerko; not ours.
- **MOVED stubs TTL >=2026-09-27** (4 stubs, zero-inbound grep then remove).
- **Cal's watches:** proxy-bound (2nd instance any agent); gate-buys-pushback (Hopper/Herald reproduction); hygiene-rule-destroys-diagnostic-absence (n=1); timestamp-fabrication gate still needs Hopper/Medici/Herald.
- **Celes owes Finn** 2 prompt items (S63); roster-drift survey untasked; Medici read-backs 2 owed (since S62).
- **Artifact gallery = two islands** (PO's two accounts); trust publish result over later watch-death.

---
## Older sessions -- pruned to pointers

- **S65 (2026-08-27):** #108 stationmaster arc, two-islands A1, canonical package `designs/deployed/stationmaster/`, wiki->193. Full record: `git show e92f777^:teams/framework-research/memory/team-lead.md`.
- **S64 (2026-08-26):** RC docker-root runbook (containerd two-limb catch), artifact 99523dce, sudoers findings. Same pointer.
- **S63 x2 (2026-08-19 Windows / 2026-08-22 Linux Passepartout):** parallel-session records both real, cite by host. Same pointer.
- Durable lessons from those sessions live in the wiki, not here.

(*FR:Aen*)
