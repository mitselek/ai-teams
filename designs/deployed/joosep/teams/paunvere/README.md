# `paunvere` -- Joosep Madar's AI team: design of record

**Date:** 2026-08-28 (FR S66); finalised 2026-08-31 (S67) -- renamed `vedur` -> `paunvere` (PO), §8 decided, three review fixes applied (implicit-team startup, tripwire-not-backstop, model-pin reality). **Author:** (*FR:Celes*). **Status:** FINAL, accepted by Aen; hand-over to the PO pending.
**Commissioned by:** Aen, on PO decisions of 2026-08-28. **Inputs:** profile brief (Aen, rev 2), apex-research response `34f2f310` (Schliemann), container design v3.5 (Brunel), `FIRST-TASKS.md` v3.5, apex-research deployed shape, and **the live `rumba` branch `feat/VJS1-826-elron-test` read at source** (`send-request.ts`, `soap.ts`, `.dev.vars.example`, `wrangler.jsonc`, README, commits `39f16a8` and `faa287e`).

## Contents

| File | What |
|---|---|
| `roster.json` | six members, model pins (FR convention), lore, substrate and model notes |
| `common-prompt.md` | authority table, the hard safety rule as built, least-privilege table, language rule |
| `startup.md` | Minot's boot procedure (apex `startup.md` shape, cut to what a one-person team needs) |
| `prompts/minot.md` | team-lead / dispatcher |
| `prompts/trevithick.md` | service builder (`rumba`) |
| `prompts/rastrick.md` | E2E suite keeper (`HES-integration-tests`) |
| `prompts/saxby.md` | reviewer and rail warden (both repos) |
| `prompts/bradshaw.md` | release cartographer + hygiene audit (read-only) |
| `prompts/smiles.md` | scribe -- the only Atlassian writer |

## 1. Shape: six, weighted 3 : 1 : 2 -- why not the brief's seven

The brief listed seven coverage roles (`team-lead`, `release-cartographer`, `hygienist`, `suite-keeper`, `fixture-warden`, `builder`, `scribe`) and said the count was a PO decision, not a finding. Aen set the weighting rule: recency-weighted (service build leads) but all three registers covered. Result:

| Register | Evidence | Members | Weight |
|---|---|---|---|
| Service build (`rumba`) | 14 commits, active the day of the brief | Trevithick, **Saxby** | leads |
| E2E suite (`HES-integration-tests`) | 53 commits, largest body | Rastrick, **Saxby** | second |
| Release visibility (VEO-98) | one ticket, dormant since 07-21, but the role he was hired under and the reason his Claude licence exists | Bradshaw, Smiles | third |
| Coordination | -- | Minot | -- |

Two merges, both with a reason beyond headcount:

- **`fixture-warden` + pre-PR review -> Saxby.** A warden with nothing to review is a constraint wearing a name badge. Folding the rail into the reviewer gives the rail a member who is spawned *every time a builder is* (common-prompt spawning rule), instead of a member nobody remembers to spawn. It also gives the pain point "his work does not reach `main`" an owner: Saxby's second job is making branches mergeable by the human reviewers.
- **`hygienist` -> Bradshaw.** Same credential, same read set, same output shape (per-project tables), same report-only rule. The brief itself suggested this merge.

One role kept that a headcount-minimiser would cut:

- **Smiles stays separate from Bradshaw** because the split buys a property, not a person: **the agent that reads six projects writes nothing; the agent that writes has three named targets.** The incident model in the PO decisions is "bulk-edit another project's Fix Versions". With this split there is exactly one prompt in which an Atlassian write can originate, and it enumerates its targets. Prompt-enforced, like everything else here -- but one prompt is auditable and five are not.

Not included, with the extension path: a librarian (apex's Eratosthenes) -- premature for a one-person team; scratchpads plus Minot's `[DECISION]`/`[RAIL]` discipline carry it. If the practice grows, add one before adding a seventh worker.

**Count for Brunel:** 6 in the roster (1 lead + 5). Agents spawn via the Agent tool per the Dockerfile, so tmux geometry is the human's single session; the number matters for `pids_limit` only, and 6 is well inside 512.

## 2. Person vs practice

Designed for **Joosep the person** (PO ruling; apex upheld it as person-shaped). The authority table puts him at the top of every row except the rail. Extension path if VEO-98 later becomes a shared or Kuzmin-owned practice: Bradshaw and Smiles are already the practice-shaped half -- their prompts name no repo and no personal branch. Lift them (and only them) into a practice team; Trevithick, Rastrick, Saxby stay with the person. The `name` field and `TEAM_NAME` are the only rename cost (a `mv` under allerk-base).

## 3. Names and lore -- one tradition, structural fit

Domain-named tradition (railway engineering, safety and publishing) over a language tie-break, because the domain has one. Each name was chosen for structural fit with the role's behaviour, not theme:

- **Minot** -- invented train dispatching; the ending (he drove the engine himself) is inverted into the coordinator-only rule.
- **Trevithick** -- built the first locomotive and never shipped; the prompt names the failure mode and makes "in a PR" the definition of done.
- **Rastrick** -- judge of the Rainhill Trials, the first published acceptance test; kept the notebook. Judge who does not run: the suite runs on Joosep's machine.
- **Saxby** -- interlocking: refuses the conflicting move by construction. The rail warden.
- **Bradshaw** -- compiled every company's timetable into one guide, monthly, without commanding any company. Read-only cartographer.
- **Smiles** -- railway secretary who wrote engineering as narrative for the public. The Estonian-facing writer.
- **Team name `paunvere`** -- PO-chosen 2026-08-31 from my runners-up: the parish of Luts's *Kevade*, whose best-known son is a Joosep ("plays so well with Joosep" -- the PO). My original pick was `vedur` (locomotive), with the worry that the *Kevade* echo was too cute; the PO overruled the worry -- the warmth is the point. What stands from the original reasoning: **member names stay out of the Kevade cast** (a Toots agent beside a real Joosep would confuse address and attribution), so the warmth lives in the team name and the precision in the railway-pioneer member names.

## 4. Model tiers

FR pin string `claude-fable-5[1m]` throughout, with the substrate note carried from FR's own roster: under Agent-tool spawning the per-member field is documentation-only and the parent session's model is what runs. Apex's `claude-opus-4-6` / `claude-sonnet-4-6` are stale and not copied. Tier by consequence of error: Saxby never downshifts; Bradshaw is the one sonnet-eligible role (read-only, clear criteria, output reviewed before publication).

## 5. Two as-built facts that change the safety wording (read at source, not from the brief)

The commission's rule text said: *"the endpoint URL is never to be made configurable, added to env, or reached for by any agent"* and *"reserved train-number ranges as non-bypassable"*. Both are right in intent; neither matches the code, and a prompt written against the paraphrase would be describing a rail that does not exist -- the same defect class the brief caught on `isTest`.

1. **The endpoint is already configurable via env.** `SendEnv.SK_ENDPOINT` is a Worker secret / `.dev.vars` value, defaulting to `DEFAULT_TEST_ENDPOINT` (`soap.ts:11`). The rail is a **substring guard** -- `if (!endpoint.includes('EvrSK_test')) reject` -- copy-pasted three times in `send-request.ts` (lines 87, 181, 266). It is not an allow-list of the exact TEST URL. The common-prompt rule is therefore written against **the variable and the guard**: never set or read `SK_ENDPOINT`/`SK_USER`/`SK_PASSWORD`; never change, weaken, relocate, or "centralise" the guard; a refactor of the three copies is itself a routing change. And it names the fail-safe property the PO's no-secrets decision already produced: **without `SK_USER`/`SK_PASSWORD` the send path cannot complete from inside the container.**
2. **The reserved-range check was removed by Joosep himself** -- commit `faa287e`, 2026-08-27, *"drop the test-reserved train-number restriction ... The TEST-endpoint-only rail remains the safety guarantee."* The app accepts any train number (README: *"Any train number is accepted in both modes"*). So "non-bypassable" cannot be a property of the tool today; it is written as a **team discipline that holds regardless of the tool** (rule 4), and Saxby's prompt lists the removal as a rail-health finding to be written down for Ruth Türk, not fixed. Brunel's cross-check added a third item: `timetable.ts:10` still documents the number as *"enforced server-side"* -- stale after `faa287e` removed the server check, and a reader would take it as a guarantee.

Both belong in Aen's report to the PO: the rail is thinner than the decisions assume, and the team is designed not to touch it either way.

## 6. A defect in the credential ladder, and how the first tasks resolve it

Task 1's PAT is **Contents: Read-only**. "Branch + PR only" needs `contents:write` (to push a branch) and `pull_requests:write` (to open one). As specified, the team cannot push anything. This is not a contradiction to fix in task 1 -- the read-only start is right -- it is the first *named need* the PAT text promises to honour. The first-tasks sequence (handed to Brunel) is built around it: **task 5 is entirely read-only** (Saxby reviews the live branch; Bradshaw's first roll-up via the connector), **task 6 is the first write** and names the widening precisely: `contents:write` + `pull_requests:write` on `rumba` only, to push `feat/VJS1-826-elron-test` and open its PR. Note for the PO: a fine-grained PAT with `contents:write` on an unprotected `rumba` *can* push to `main`. The `settings.json` deny on `git push ... main` is a **tripwire, not a backstop** -- a string pattern that `git push origin HEAD:main`, a renamed remote, or `gh api` walks past; the prompts are the actual control, and the only real wall would be branch protection on `rumba` (org-side, PO raising).

## 7. Items for Brunel (package layout -- his file, his call)

1. **Seed the team dir.** Nothing in `entrypoint.sh` places roster/prompts. Proposal: `COPY teams/paunvere /opt/teams/paunvere` and a guarded first-boot copy to `~/work/paunvere/` (same never-overwrite pattern as `FIRST-TASKS.md`), then `git init` it so scratchpads have history. No remote yet. *(Accepted by Brunel 08-28, with fail-loud on missing source.)*
2. **`~/work/CLAUDE.md`** pointing the parent session at `paunvere/startup.md` ("you are Minot; read this first"). *(Accepted.)*
3. **`TEAM_NAME=paunvere`** (name ruled by PO 08-31): compose default (`docker-compose.yml:113`), `.env.example:63`, `entrypoint.sh:135` (the `:278` launcher touchpoint is gone -- Brunel decoupled the tmux session name, hard-coded `joosep`, on 08-28, so the rename touches nothing he owns except the env value). On this CLI the team name never appears in the runtime dir (`session-<id>`), so TEAM_NAME is labeling only -- but keep it aligned with the roster name so the label tells the truth.
4. **pnpm.** `rumba` is a pnpm monorepo with `catalog:` deps; the Dockerfile installs npm only. `corepack enable && corepack prepare pnpm@latest --activate` (or pin the version from `rumba/package.json` `packageManager`) is needed for Trevithick's `pnpm --filter elron-test test`.
5. **`FIRST-TASKS.md` language** -- Joosep-facing, so Estonian per the user-facing rule; tasks 4-6 supplied in Estonian in the handoff message; tasks 0-3 and the safety section are his to translate (or keep bilingual with the code blocks unchanged).

## 8. Decided (Aen review, 2026-08-31)

- Roster name: **`paunvere`** (PO; see §3). Container dir stays `joosep`.
- §5 rail findings: handed to Joosep as the app's owner, who consults Ruth Türk if in doubt -- the earlier "Ruth signs off via the PO" gate was withdrawn by the PO 2026-08-31 (VEO-181 comment 243424). Closed for this package.
- Credential ladder: **confirmed as designed** (task 5 read-only, task 6 first write, `rumba` only).
- Bradshaw: **Jira-only first**, as designed.
- Review fixes applied 08-31: startup rewritten on the implicit-team model (no TeamCreate -- CLI 2.1.178+); settings.json deny restated as tripwire (§6, common-prompt git row); model-pin reality check added (roster `_model_note`, startup Step 2).

(*FR:Celes*)
