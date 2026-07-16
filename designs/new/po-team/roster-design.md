# Product-Owners Team -- Roster & Role Design

*(*FR:Celes*) -- S60, 2026-07-14. Design package for the new `product-owners` team. Output is a role-definition package; the team-lead decides whether to hire, and the PO (Mihkel) rules on the infra/authority items flagged at the end.*

> **SUPERSEDED (channel model) -- 2026-07-15.** The ssh + tmux/screen driving channel described throughout this document was superseded by the ratified inbox-based comms architecture (#90): GitHub remains the work of record; the live channel is now inbox mail via the stationmaster hub (`send()` / `read_mail()`); tmux is demoted to persistence only -- a PO never types into a remote pane in normal operation. **`protocols.md` rev 5 §1 is authoritative.** In this document the channel-bearing passages -- notably §0 fact 2 and its two boundary-discipline paragraphs, §1's add-a-PO checklist (registry/liveness steps) and registry schema, §2's template spec -- instance parameters, liaison duties, tool restrictions, and R/M/D gate -- §6's channel list, and §7 item 1 -- are the historical S60 design, preserved as a record; the live add-a-PO procedure and liveness measure are `prompts/henry.md` and `product-registry.md` (last-liveness = hub round-trip, not ssh reachability). `prompts/po-template.md` (seven slots; comms MCP `send()`/`read_mail()`; ssh/tmux = Tier D emergency-only) is the authoritative template.

---

## 0. The shape of the thing (read this first)

This team is a **layer of coordinators above other teams**. It contains no implementers of its own. Its members drive product development that physically happens inside **remote product-dev teams** on remote hosts.

```
                         Mihkel (human product authority)
                                    |
                          product-owners team-lead        <- portfolio coordinator ("coordinator of coordinators")
                          /      |        |       \    \
                        PO      PO       PO       PO    librarian   <- local: 1 PO per product (evergrowing) + 1 knowledge hub
                        |        |        |        |
        ================|========|========|========|=================  GitHub (durable async work channel)
                        |        |        |        |
                     [remote] [remote] [remote] [remote]              <- each PO's remote product-dev team,
                     team-ld  team-ld  team-ld  team-ld                  reached via ssh + tmux/screen + its own team-lead
```

Three facts drive every decision below:

1. **A PO is a driver, not an implementer.** No PO ever edits product code, commits, or pushes. Its output is *GitHub epic/task issues* and *directives to a remote team-lead*. (This is the standing "Agent PO is an anti-pattern -> the agent is a coordinator/requirements-driver, the human is the product authority" rule -- Mihkel remains the real PO; each agent PO is his driver-of-record for one product.)
2. **Three channels, three purposes** -- the load-bearing model of the PO role:
   | Channel | Direction | Purpose | Write? |
   |---|---|---|---|
   | **GitHub issues** (epics, task issues) | PO -> remote team | **Primary, durable, async** work-driving. This is where product intent lives. | PO writes (create/edit/label/comment/close) |
   | **ssh + tmux/screen** into the remote host -- **literal interactive CLI driving** (`send-keys` / `capture-pane`), NOT message-passing | PO <-> remote team-**lead** | **Live, ephemeral** liaison: nudge, unblock, status pull, "did you see epic #12". | PO types into the remote team-lead's Claude-prompt pane only (see the R/M/D gate in §2) |
   | **Local repo clone** | -- | **Reference only.** Ground epics in real file paths; review what shipped. | **Never** -- read-only, no edit/commit/push |
3. **Work syncs through GitHub, from the remote side.** The remote team commits and pushes; the PO's local clone is refreshed by `git pull` (read) to see the result. The PO's local clone is never a write path. This is what keeps "driver, not implementer" true even though the PO holds a clone.

**Remote-team boundary discipline:** a PO talks to the **remote team-lead**, never to the remote specialists directly (mirror of FR's dual-hub / coordination-boundary rule). The remote team-lead coordinates its own team; the PO coordinates *through* it. Over ssh/tmux the PO drives the remote lead's CLI literally -- `send-keys` to type a directive into the remote team-lead's **Claude-prompt** pane, `capture-pane` to read its replies -- and it does **not** open editors, run builds, or edit files on the remote host. The "driver, not implementer" line holds identically on the local and remote sides.

**Driving another team's live CLI is a high-consequence action** -- an errant `send-keys` can inject control characters, kill in-flight work, or land shell commands in a shell pane. The PO therefore carries a **tiered-risk (R/M/D) discipline adapted from FR's Hopper** (the closest role precedent, per Finn's research). See §2.

---

## 1. Team-lead role -- coordinator of coordinators

The team-lead runs the **portfolio**, not any single product. It never drives a product's epics itself -- that is each PO's job. Think Henry the Navigator at Sagres: he funded, dispatched, and coordinated the captains; he did not sail.

### Decides (kept at team-lead)
- **Portfolio composition** -- which products get a PO; when to onboard a new PO (the add-a-PO procedure below) and when to retire/pause one.
- **Cross-product arbitration** -- priority conflicts when two POs contend for the same scarce resource (Mihkel's attention, a shared remote host, a shared dependency). Cross-product dependencies (mvox needs an ad-auto capability) are brokered here.
- **Standards** -- the PO role template, the epic/task-issue conventions, the escalation rules to Mihkel, the reporting cadence up to Mihkel.
- **The product registry** -- owns `product-registry.md` (the per-product infra map: github-repo, local-clone-path, remote-teamName -- the hub comms address, doubling as the registry.json key resolving the emergency persistence host -- and last-liveness). Additions happen through the add-a-PO procedure. *(Field list updated 2026-07-15 to the ratified #90 schema; the S60 original carried ssh target / tmux session / remote-team-lead-name fields, now retired with the driving channel.)*

### Delegates (pushed down)
- **All product-specific judgment** -> the product's PO. Epic backlog, grooming, domain calls, remote-team liaison, "is this shippable" -- the PO owns it end to end and escalates to Mihkel (not the team-lead) on genuine product-authority questions.
- **Knowledge curation** -> the librarian (Protocol A/B; see §3).

### The add-a-PO procedure (the "evergrowing" requirement, designed in, not bolted on)

> **Superseded (2026-07-15, #90).** The 6-step checklist below is the historical S60 procedure -- six parameters including a tmux/screen session slot and a remote-team-lead-name slot, ssh/tmux liveness, remote-lead reachability over the pane. The ratified procedure is the **7-step checklist in `prompts/henry.md` ("Add-a-PO Procedure")**: seven slots (agent-name; remote-team as hub comms address; remote-host persistence-only), a "bring the comms stack live" step with STOP-and-escalate on grant/courier failure, and an end-to-end comms acceptance test (incl. E_NOGRANT and bounce paths); last-liveness = hub round-trip. Preserved here as a record.

Because the roster grows structurally, onboarding a PO is a **first-class, repeatable team-lead procedure**, not an ad-hoc event. One parameterized template (§2) + a fixed 6-step checklist:

1. **Intake** (team-lead + Mihkel). Capture the six instance parameters:
   `product-slug`, `github-repo` (owner/name), `local-clone-path`, `remote-host` (+ ssh target), `tmux/screen session name`, `remote-team-lead name`, plus a one-paragraph `domain-context`.
2. **Verify GitHub write scope.** Confirm the team's GitHub account has **issue-write** on `github-repo`. If the repo is pull-only for the account, the PO cannot create epics -> STOP and escalate to Mihkel (this is the `mitselek is pull-only on some repos` gotcha -- see Open Decisions).
3. **Provision the reference clone.** Clone `github-repo` to `local-clone-path` (reference-only; document that no write ever originates here).
4. **Instantiate the template.** Render `prompts/po-template.md` with the six parameters into `prompts/<name>.md`; assign a name + lore from the team tradition (§4).
5. **Register.** Add the `members[]` entry to `roster.json` and the row to `product-registry.md`. Confirm ssh + tmux/screen reachability to the remote host once (liveness check, recorded in the registry).
6. **Spawn + introduce.** Spawn the PO `run_in_background: true`; it introduces to team-lead + librarian, reads its scratchpad and the registry row, and confirms it can reach its remote team-lead. Done.

Retirement is the inverse: pause/close open epics per Mihkel, archive the scratchpad, drop the `members[]` entry **and** the registry row (the "dropping a role updates two files" gotcha -- here it is roster.json + registry, and the PO's row in any common-prompt member list).

---

## 2. PO role template -- one parameterized role, instantiated per product

**One template, filled per instance.** Everything below is common (lives in the template body / common-prompt) except the six-slot header, which is per-instance.

### Per-instance parameters (the only things that change)

```
{{PRODUCT_SLUG}}        e.g. mvox
{{GITHUB_REPO}}         e.g. mitselek/mvox
{{LOCAL_CLONE_PATH}}    e.g. $HOME/Documents/github/mvox      (reference only)
{{REMOTE_HOST}}         e.g. dev@100.x.x.x                    (ssh target)
{{REMOTE_SESSION}}      e.g. tmux session "mvox-dev"          (or screen -x mvox-dev)
{{REMOTE_TEAMLEAD}}     e.g. the mvox-dev remote team-lead's name
{{DOMAIN_CONTEXT}}      one paragraph: what the product is, its stakeholders, what "done" means
```

### Common to every PO (the template body)

**GitHub epic/task discipline** (the product-driving craft):
- **Epics are the unit of work-driving.** Each meaningful outcome is a GitHub **epic issue**: goal, acceptance criteria, links to the real file paths in the local clone, and the remote team-lead as the owner. Grooming (splitting, sequencing, closing) is the PO's daily work.
- **Task issues** decompose an epic only when the remote team needs finer-grained hand-off; default to epics, add task issues on demand.
- Conventions (labels, milestones, epic<->task linking) are team-standard, set by team-lead, applied by every PO -- so the librarian and team-lead can read any product's board the same way.
- The PO writes issue bodies; **Mihkel** signs off on scope/priority for anything that changes product direction (escalation, below).

**Remote-team liaison duties:**
- Reach the remote team **through its team-lead**, over ssh + tmux/screen. Attach to `{{REMOTE_SESSION}}` on `{{REMOTE_HOST}}`, send directives/nudges to `{{REMOTE_TEAMLEAD}}`'s pane, read its replies. Never address remote specialists directly.
- GitHub is the durable directive; ssh/tmux is the live nudge. If the two disagree, the **issue is the source of truth** -- reconcile the pane conversation back into the issue.
- Pull `{{LOCAL_CLONE_PATH}}` to observe what the remote team shipped; review against the epic's acceptance criteria; comment/close on GitHub.

**Local-clone-is-reference-only rule:**
- The clone exists to *understand and reference* the codebase (ground epics in real paths, review shipped work). **No edit, no commit, no push, ever originates locally.** All change flows GitHub -> remote team -> push -> your `git pull`.

**Escalation:**
- Product-authority questions (scope changes, priority reversals, "should we build this at all") escalate to **Mihkel**, not the team-lead. Coordination/resource conflicts with another product escalate to the **team-lead**. (Two reporting lines, same split as intake vs. arbitration above.)

**Reporting:** status to team-lead on the team cadence; knowledge to the librarian via Protocol A; queries to the librarian via Protocol B.

**Scratchpad:** `teams/product-owners/memory/<name>.md`, summary-header discipline per common-prompt.

### Tool restrictions -- coordinator, NOT implementer

This is the enforcement of fact #1. The restriction is the same shape as FR's read-only specialists, extended with the ssh/gh coordinator surface.

**MAY:**
- `Read` -- the local reference clone, the registry, own scratchpad.
- `Bash` -- **read-only git** on the clone (`pull`, `log`, `diff`, `status`); **ssh** to `{{REMOTE_HOST}}` **scoped to this PO's own registry entry/key**, and **tmux/screen `send-keys` / `capture-pane`** against `{{REMOTE_SESSION}}` (its own remote host only); **`gh` CLI** for issue create/edit/comment/label/close on `{{GITHUB_REPO}}`.
- `Write`/`Edit` -- **own scratchpad only**.

**MAY NOT:**
- Edit/Write any product source -- local *or* over ssh on the remote host.
- Any git **write** (commit/push/tag) on the local clone.
- `gh` on repos other than `{{GITHUB_REPO}}`; `gh` PR-merge (shipping is the remote team's act, ratified by Mihkel).
- ssh/tmux against any host but its own `{{REMOTE_HOST}}`; address remote specialists directly; run builds/editors on the remote host.
- **Any Tier-D remote CLI action without Mihkel's sanction** (see the R/M/D gate below).
- Spawn agents, edit roster/registry, touch another PO's clone or scratchpad.

### Remote-CLI driving -- tiered-risk (R/M/D) discipline

Adapted from FR's Hopper (Deployment Operator). Hopper *validates* a tasker's tier at dispatch; a PO **self-classifies its own originated actions**, because a PO is a driver, not an executor. The classification is by *effect on the remote team's live session*, and `capture-pane` (Tier R) must precede any `send-keys` to confirm the target really is the remote team-lead's Claude prompt and it is idle/ready -- Hopper's "read substrate-truth before acting," reduced to **capture-before-send**.

| Tier | What it is (on the remote CLI) | Sanction |
|---|---|---|
| **R -- read-only** | `capture-pane`, `tmux list-sessions/-windows`, ssh + read-only inspection (`git log/status`, `gh issue view`). Zero session mutation. | **Default-permitted.** The PO observes freely; this is how it knows remote state. |
| **M -- designed interaction** | Typing a directive/nudge into the remote team-**lead's Claude-prompt** pane and pressing Enter; `gh` epic/task issue create/edit/comment/close. The normal, designed way to drive. | **Self-confirm (single line in scratchpad/report).** No escalation; this is the PO's daily work. |
| **D -- destructive / non-designed** | Control characters (Ctrl-C/-D/-Z), kill/resize/destroy sessions/windows/panes, `send-keys` to a **shell** pane rather than the Claude prompt, anything that interrupts in-flight work or fights the remote team's posture -- no remote-side recovery. | **Explicit per-action Mihkel sanction, routed through team-lead: exact keystroke sequence + reason + expected outcome, quoted verbatim.** Missing any of the three -> refuse (`[SANCTION-INCOMPLETE]`), do not infer. A PO **cannot self-sanction Tier D** -- it originates, so the human product authority gates its destructive cross-team actions. |

**Pane-target asymmetry (the load-bearing check, mirrors Hopper's host/container split):** text to the remote team-lead's *Claude-prompt* pane is Tier M (designed channel); the same keystrokes to a *shell* pane, or any control character to any pane, is Tier D. So the PO always `capture-pane`s first to confirm which pane/prompt it is addressing -- a "Tier M" that turns out to target a shell is a mis-classified Tier D. On any mid-action surprise (pane not at the prompt, unexpected output, remote lead mid-task), **stop and surface back** rather than pressing on -- Hopper's hard-gate.

*(A worked instantiation -- `prompts/gama.md` for mvox -- is the template with the six slots filled and a name/lore header. Nothing else changes between instances.)*

---

## 3. Librarian -- mirror Callimachus, but simplified

**Recommendation: keep the dual-hub topology and the sole-writer + Protocol A/B core; strip the research-team apparatus.**

**Why keep it:** the team is *evergrowing*. The more POs, the more valuable a dedicated **knowledge hub that is not the team-lead** -- so the team-lead stays a pure work/arbitration hub and cross-PO operational knowledge (remote-access gotchas, epic conventions, per-product domain glossaries, "how to reattach a dead tmux session") accumulates in one curated place instead of scattering across scratchpads. This is exactly the load the dual-hub split was designed for.

**Keep (from Callimachus):**
- **Sole writer to `wiki/`.** POs submit (Protocol A) and query (Protocol B); they do not write the wiki.
- **Protocol A (submission) + Protocol B (query)**, same message shapes.
- **Provenance frontmatter** (source-agents, discovered, source-issues) and the classify-file-acknowledge-in-one-window discipline.
- **Dedup / classification** by a small decision matrix.

**Simplify / drop:**
- **Drop** the research-team subdirs (`observations/`, `findings/`) -- there are no topic files here. Wiki dirs are just: `patterns/`, `gotchas/`, `decisions/`, `references/` (registry pointers, per-product glossaries).
- **Drop** the Phase-2 gap-tracking / health-sensing machinery and the Medici boundary (no Medici on this team). At shutdown the librarian writes a plain session summary.
- Provenance is **issue-anchored**, not source-file-anchored (this team's evidence is GitHub issues + registry rows, not code it owns).

Net: the librarian is Callimachus with the research scaffolding removed -- roughly the same prompt minus ~40%. Model tier stays high (must hold the cross-product knowledge graph; wrong answers cascade into a PO's directive).

---

## 4. Naming & team lore

**Theme: the Portuguese Age of Discovery -- the Sagres enterprise.** Structural fit is exact:
- A **director who dispatches and coordinates captains but never sails himself** = a team-lead who directs POs but never implements.
- **Navigators, each owning one route/domain**, driving distant crews by written sailing-orders = POs driving remote teams by GitHub issues.
- A **royal cosmographer who curates and systematizes all the charts and logs the voyages bring back** = the librarian.

Distinct from FR's classical-polymath theme; each name domain-fitted to its product (my standing "lore-fit: structural beats thematic" rule).

| Role | Proposed name | Lore fit |
|---|---|---|
| **team-lead** | **Henry the Navigator** (Infante Dom Henrique, 1394-1460) -- nick "Henry" / "Infante" | Organized and funded the voyages of discovery from Sagres, coordinating captains who each explored a stretch of coast. *Never sailed himself.* The coordinator-of-coordinators archetype, exactly. |
| **PO -- mvox** | **Vasco da Gama** -- nick "Gama" | Opened the long, high-value sea route to India -- the sustained flagship route. mvox is the mature flagship product. |
| **PO -- bigbook** | **Duarte Pacheco Pereira** -- nick "Pacheco" / "Duarte" | Navigator *and author* of the *Esmeraldo de Situ Orbis*. The writer-navigator -- the natural fit for a **book** product (and it rhymes with bigbook-dev's own Plantin-the-printer lore). |
| **PO -- ad-auto** | **Afonso de Albuquerque** -- nick "Albuquerque" / "Afonso" | Built the *commercial network* of trading posts -- systematic, revenue-driving infrastructure. ad-auto = advertising/commercial automation. |
| **PO -- mikrotik / field-network** | **Fernao de Magalhaes (Magellan)** -- nick "Magellan" / "Magalhaes" | First circumnavigation -- connecting distant points into one global network. The obvious fit for a **field-network** product. |
| **librarian** | **Pedro Nunes** -- nick "Nunes" / "Pedro" | Royal cosmographer and mathematician who *systematized* navigational knowledge (loxodromes, the nonius). Keeper and server of the accumulated charts = the knowledge hub. |

**Alternates** (if team-lead/Mihkel prefer): team-lead -- *Prince Henry* is the strongest; fallback **Pero de Alenquer** (master pilot who guided the fleets) if a "hands-on lead" feel is wanted. Librarian -- fallback **Alberto Cantino** (the master-planisphere) but Nunes is stronger and cleaner. PO alternates: **Bartolomeu Dias** (frontier/breakthrough product), **Pedro Alvares Cabral** (unexpected-new-territory product), **Gil Eanes** (hard/experimental product) -- hold these for the 5th+ POs as the team grows.

**Team name:** `product-owners` (functional/deployable slug, matching the PO's commission and the roster-name convention of the other teams). **House name in lore: the School of Sagres** -- the promontory HQ from which the enterprise was directed. (Casa da India -- the crown clearinghouse for all voyages and their knowledge -- is an apt alternate house-name if a "clearinghouse" framing is preferred.)

---

## 5. roster.json draft

```json
{
  "name": "product-owners",
  "description": "A coordinator-of-coordinators team: an evergrowing roster of product owners, each driving one product's development through GitHub epic/task issues and inbox mail via the stationmaster hub (addressed to the remote product-dev team's team-lead), plus a local librarian. POs hold each product repo cloned locally for reference only; all work syncs through GitHub from the remote side. Human product authority is Mihkel; each agent PO is his driver-of-record for one product. Lore house: the School of Sagres.",
  "_substrate_note": "The per-member `model` field is documentation-only -- the parent CLI session model is stamped into runtime config.json regardless, and all spawned members inherit it. To pin the team to fable-5, switch the parent CLI via `/model claude-fable-5[1m]` BEFORE spawning. The Agent-tool spawn `model` param accepts only family-level overrides (opus/sonnet/haiku), not a specific pin. Spawn all members with run_in_background: true. Spawn order: librarian + team-lead first (service/knowledge hubs), then POs.",
  "commonPromptFile": "common-prompt.md",
  "workDir": "$HOME/Documents/github/ai-teams",
  "members": [
    {
      "name": "team-lead",
      "agentType": "team-lead",
      "model": "claude-fable-5[1m]",
      "prompt": "prompts/henry.md",
      "lore": {
        "fullName": "Infante Dom Henrique -- Henry the Navigator",
        "nickname": "Henry",
        "origin": "Portuguese prince (1394-1460) who directed the Age of Discovery from Sagres: funding, provisioning, and coordinating the captains who charted the African coast. Famously never sailed on the voyages he organized.",
        "significance": "Coordinator of coordinators. Runs the portfolio -- who gets a PO, cross-product arbitration, standards, the product registry, the add-a-PO procedure -- and never drives a single product's epics himself. Dispatches the navigators; does not sail."
      }
    },
    {
      "name": "gama",
      "agentType": "general-purpose",
      "model": "claude-fable-5[1m]",
      "color": "cyan",
      "prompt": "prompts/gama.md",
      "lore": {
        "fullName": "Vasco da Gama",
        "nickname": "Gama",
        "origin": "Portuguese navigator (c. 1460s-1524), first to reach India by sea, opening the long high-value maritime route.",
        "significance": "PO for mvox -- the mature flagship product, the sustained long-haul route."
      }
    },
    {
      "name": "pacheco",
      "agentType": "general-purpose",
      "model": "claude-fable-5[1m]",
      "color": "blue",
      "prompt": "prompts/pacheco.md",
      "lore": {
        "fullName": "Duarte Pacheco Pereira",
        "nickname": "Pacheco",
        "origin": "Portuguese navigator and cosmographer (c. 1460-1533), author of the Esmeraldo de Situ Orbis -- a navigator who was also a writer.",
        "significance": "PO for bigbook -- the writer-navigator for a book product; rhymes with bigbook-dev's own printer lore (Plantin)."
      }
    },
    {
      "name": "albuquerque",
      "agentType": "general-purpose",
      "model": "claude-fable-5[1m]",
      "color": "yellow",
      "prompt": "prompts/albuquerque.md",
      "lore": {
        "fullName": "Afonso de Albuquerque",
        "nickname": "Albuquerque",
        "origin": "Portuguese admiral (1453-1515) who built the networked chain of trading posts underpinning the commercial empire.",
        "significance": "PO for ad-auto -- systematic, revenue-driving commercial-automation infrastructure."
      }
    },
    {
      "name": "magellan",
      "agentType": "general-purpose",
      "model": "claude-fable-5[1m]",
      "color": "green",
      "prompt": "prompts/magellan.md",
      "lore": {
        "fullName": "Fernao de Magalhaes -- Magellan",
        "nickname": "Magellan",
        "origin": "Portuguese navigator (c. 1480-1521) who led the first circumnavigation, connecting distant points into one global route.",
        "significance": "PO for mikrotik / field-network -- connecting distributed field sites into one network."
      }
    },
    {
      "name": "nunes",
      "agentType": "general-purpose",
      "model": "claude-fable-5[1m]",
      "color": "gold",
      "prompt": "prompts/nunes.md",
      "lore": {
        "fullName": "Pedro Nunes",
        "nickname": "Nunes",
        "origin": "Portuguese royal cosmographer and mathematician (1502-1578) who systematized the science of navigation -- loxodromes, the nonius.",
        "significance": "Librarian / knowledge hub. Curates and serves cross-product operational knowledge (remote-access gotchas, epic conventions, per-product glossaries). Sole writer to the wiki; Protocol A/B."
      }
    }
  ]
}
```

*Note: `agentType` is only ever `team-lead` or `general-purpose` (per `designs/roster.ts`); the librarian is a `general-purpose` member whose sole-writer authority is enforced by prompt, matching how FR runs Callimachus. Colors follow the live-roster convention (`gold` for the librarian) even though `roster.ts`'s color union is descriptive, not enforced.*

---

## 6. Model + spawning notes (current substrate)

- **Parent-model inheritance is the load-bearing fact.** `roster.json`'s `model` field is **documentation-only**; TeamCreate/spawn stamps the *parent CLI session model* into runtime `config.json` and every spawned member inherits it. To run this team on Fable 5, switch the parent CLI to `claude-fable-5[1m]` **before** spawning. The Agent-tool spawn `model` param accepts only family-level overrides (`opus`/`sonnet`/`haiku`) and cannot pin a specific version. (`designs/roster.ts`'s `Model` union still lists 4-6-era ids and is stale; the live substrate is Fable 5, matching FR's roster.)
- **All members `run_in_background: true`** (team standing rule).
- **Implicit teams (CLI 2.1.178+):** the team is *discovered*, not created; there is no `TeamCreate`/`TeamDelete`; the Agent-tool `team_name` param is a cosmetic chat label, ignored on disk. Inbox persistence keys by **agent name** so it survives the per-session `session-<id>` dir rotation. (Full lifecycle: FR's `startup.md`.)
- **Model tier -- all members high (fable-5[1m]).** By consequence-of-error (my standing rule), not complexity: a PO's bad epic misdirects an entire remote team, and there is no automated gate to catch it; the librarian must hold the cross-product knowledge graph; the team-lead arbitrates with no safety net. None of these three roles has a test suite catching its errors, so none downgrades to sonnet. (If cost pressure appears later, the only plausible downshift is a *dormant* PO on a paused product -- team-lead's call, not a default.)
- **Spawn order:** librarian (Nunes) + team-lead first -- service/knowledge hubs, so inbox files exist before POs come online and submit knowledge on their intro cycle -- then the POs. (My standing "service roles spawn first" pattern.)
- **The remote teams are a separate substrate.** They are full Claude-Code teams on remote hosts, spawned and lived independently; the PO team does **not** spawn them and does not SendMessage them (different process/host). The only PO->remote channels are GitHub (async) and ssh+tmux/screen to the remote team-lead's pane (live). This is deliberate: it keeps the PO a driver, and it keeps the remote team's lifecycle owned by the remote team, not by us.

---

## 7. Decisions that belong to team-lead / Mihkel (not me)

**For Mihkel (product / infra / authority):**
1. **Remote infra values** -- the actual `remote-host` ssh targets, keys, and `tmux/screen` session names for the four remote teams. I provide the registry *schema*; Mihkel fills the values. Authorizing ssh from the PO-team host into four remote hosts is his call. *(Superseded 2026-07-15, #90: the infra values Mihkel now supplies are the hub grant pair + the remote team's comms address (`remote-teamName`); the per-team key `~/.ssh/sm_<team>` is the identity, and session names derive from teamName (`protocols.md` §1.7). Remote-host ssh is emergency persistence access only -- `henry.md` intake step 1.)*
2. **GitHub write scope** -- confirm the team's GitHub account has **issue-write** on `mitselek/mvox`, `bigbook`, `ad-auto`, and the mikrotik/field-network repo. If any is **pull-only** for the account (the known `mitselek is pull-only on some repos -> can't open issues by that route` gotcha, e.g. the Arhitecture repo), that PO cannot drive epics -> needs a write-capable account or a different route. **Flag before spawning.**
3. **Name approval** -- ratify the six proposed names (or pick from the alternates in §4).

**For team-lead (structure / standards):**
4. **Librarian scope** -- ratify "keep dual-hub but simplify" (§3), or decide to defer the librarian to a later session and run team-lead-as-sole-hub for v1. My recommendation is keep-but-simplified; the evergrowing requirement is what justifies the second hub.
5. **Epic/task-issue conventions** -- the concrete label/milestone/linking standard every PO applies. I've specified the *discipline*; the exact label taxonomy is a team-lead standard-setting call (and a good first item for Nunes's wiki `decisions/`).
6. **Model pin** -- operationally switch the parent CLI to `claude-fable-5[1m]` before the first spawn (§6).

**Next step from me:** on team-lead's go-ahead I write the four prompt files (`henry.md`, the `po-template.md` + one worked `gama.md`, and `nunes.md`) and the `product-registry.md` schema. This document is the design; the prompts are the build.

*(*FR:Celes*)*
