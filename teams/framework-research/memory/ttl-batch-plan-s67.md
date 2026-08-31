# TTL Batch Re-verification Plan — S67 draft (2026-08-31)

Authored by Callimachus (delivered via SendMessage 09:30); recorded durable by Aen — `docs/` and `wiki/` are outside the author's write scope and this is a work plan, not knowledge. Execution scheduling is the PO's. Nothing here has run yet.

## Corrections that shaped this plan

- **Count: 12 entries in the 09-06 → 09-18 window, not 8.** Cal's 09:26 intro undercounted twice (internally inconsistent enumeration; five 09-18 gotchas, not four). Aen carried the 8 into a [DECISION] within one minute — the S66 "false claim sets a work order" lesson in miniature.
- **Urgency framing: pin → now, not last-session → now.** Entries are pinned to CLI 2.1.170/2.1.173/2.1.178-179/2.1.181; live CLI measures **2.1.251** — 70-81 versions past every pin. The TTL dates were a proxy for "a version will have moved"; the proxy was overtaken months ago.
- **Three trigger classes, not two:** CLI-version-coupled, calendar/external-drift-bound, and *resolved-by-our-own-fix-landing*.

## Groups

### Group 1 — inbox/drain substrate (3 entries, ONE probe) — RUN FIRST
`gotchas/inbox-retention-flip-pending-only-queue` (09-10) · `references/inbox-substrate-properties-2.1.170` (09-10) · `references/drain-on-delivery-datapoint-2.1.173` (09-15)
- Method: re-run probe-1b against 2.1.251 (delivered message removed from inbox file, or retained?). Assets verified in tree: `poc/ghost-bridge/HOW-TO-REPRODUCE.md`, `TRUTHS.md`, six `evidence-probe-*-watch.log`.
- Why first: the Drain row is the only corpus row with a demonstrated history of flipping unannounced between adjacent versions, and the courier's inbound verify-empty → exclusive-create design rests on it.
- Who: Brunel or Hopper.

### Group 2 — implicit-teams / lifecycle substrate (6 entries, one probe pass)
`references/teams-substrate-2.1.179-implicit-teams` (09-17, ANCHOR) · `references/claude-code-hook-wake-primitives` (09-17) · `gotchas/no-teamdelete-stale-session-dirs-accumulate` (09-17) · `gotchas/cold-start-discovery-false-negative-config-before-sessions-json` (09-18) · `gotchas/sessions-pid-json-not-gc-status-idle-lingers` (09-18) · `gotchas/courier-restart-needs-inboxes-dir-step25-before-step3` (09-18, dual trigger — also resolved-by-design)
- The batch pre-exists: four satellites name the 2.1.179 sheet's TTL as their re-confirm moment; co-expiry 09-17/09-18 is design, not coincidence.
- Method: one throwaway-container probe. Anchor sheet's TTL section names the questions (team name still `session-<id>`? external inbox-write wakes bare session? `members[]` injection routes?) + four substrate reads (sessions/<pid>.json GC? config-before-sessions ordering? inboxes/ lazy-create? TeamDelete still absent?). Hook primitives = cheap separate check riding the same container.
- Who: Volta (lifecycle semantics) + Brunel (container); Hopper authored the 2.1.181 V3 probes behind four of these.

### Group 3 — fix-landing-coupled (2 entries) — records check, NO probe, cheapest, possibly just closable
`gotchas/explicit-courier-config-hardcoded-path-stale-on-2.1.181` (09-18) · `gotchas/orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim` (09-18)
- Question: did our own fix validate (task #7 end-to-end), and should `status` move. First entry records fixes RATIFIED/LANDED in S58.
- Who: courier owner — Brunel or Hopper.

### Group 4 — external-drift bound (1 entry) — FIRST HARD DATE: 09-06
`contracts/entu-competency-index-schema`
- Scope limit per the entry: schema shape does NOT expire; TTL fires re-verification of §3 evidence-ref formats only (re-drift guard since Finn's S44 grounding digest).
- Method: re-check §3 ref formats against entu/api#42, entu/api#41, entu/www#12.
- Who: Finn (ran the S44 digest).

### Folded in — 13th entry, outside the window
`references/model-inventory-baseline` (09-30, owner **team-lead**). Previous TTL went 40 days overdue and unactioned across three sessions; folded into this batch at zero marginal cost.

## Recommended sequencing (Cal)
1. Group 4 by 09-06 (hard date, different runner, blocks nothing).
2. Group 3 next (cheapest, may close two entries outright).
3. Groups 1+2 as a single container session — two probes, one spawn.

## Side result
S66 stationmaster relocation verified clean: `poc/ghost-bridge/stationmaster-onboarding.md` is a proper 3-line forwarding stub → `designs/deployed/stationmaster/`. Stub retirement still ≥2026-09-27.

(*FR:Callimachus*, recorded by *FR:Aen*)
