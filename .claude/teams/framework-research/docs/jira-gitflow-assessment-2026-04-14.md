# Eesti Raudtee Jira + GitFlow Pipeline Assessment — Read-and-Digest Pass

*(*FR:Finn*) — 2026-04-14*

Phase 1 read-and-digest of two Confluence pages in the VJS2 space that together describe Eesti Raudtee's current Jira workflow and GitFlow release process. Strictly read-only on Confluence. No patterns/gotchas classification yet — that is Phase 2, post-team-lead-review.

## Source 1: Arendusprotsessi Workflow (JIRA) — page 1163755527

### Raw Summary (faithful to source, Estonian terms preserved)

The page defines how work flows through Jira in "this" project (the page does not name the project, but it lives in the VJS2 space). The unit of planning is a **Story**, which is decomposed into up to three **alam taskid** (sub-tasks): **analüüs** (analysis, optional), **arendus** (development), and **testimine** (testing). A story can only be closed once **all** sub-tasks are done, and the story's own status is owned by the **toote omanik** (product owner) or **projektijuht** (project manager).

If analysis reveals the development sub-task is too large, the story is split into smaller stories with their own arendus sub-tasks.

**Bug handling distinguishes two cases:**

1. Bug is *directly tied* to the story's work ("paint the button red" → button is not red): reopen the developer's sub-task and hand it back. No new issue is created.
2. Bug is a *side effect* or only surfaces later ("paint the button red" → button is red, but pressing it crashes the app): the existing arendus sub-task is still marked done (with testimist läbinud), and a **new Bug-type task** is created separately.

The story moves through four statuses: **OPEN (Backlog) → TODO → INPROGRESS → DONE**. The page frames a 6-phase lifecycle around these statuses: Backlogi haldus → Planeerimine → Arendus → Testimine → Demo & Release info → Release.

New stories enter as **OPEN**. Backlog must be kept **prioriteedi järgi sorteeritud** (priority-sorted). Developers are expected to scan the top **10–15** backlog items regularly to spot questions and dependencies early.

Planning moves stories **OPEN → TODO** one week ahead. Every story must have an **estimate**; max is **2 tööpäeva** (2 working days). If the estimate exceeds 2 days the story must be split **before** it can leave OPEN.

Work start: **TODO → INPROGRESS**. When the arendus sub-task is complete **and** the changes are **deploy'tud develop keskkonda** (deployed to the develop environment), the arendus sub-task transitions **INPROGRESS → DONE**. Note: the DONE transition is gated on deploy to the develop environment, not merely on merge.

**Cross-system stories:** if a story needs changes in **another system / another repository**, a **separate alam task** must be created per affected system.

**Testing** has its own sub-task state machine (TODO → INPROGRESS → DONE). If a story needs a separate QA/manual pass and that pass succeeds, the story can advance into a release and onward to **Staging**. If testing fails: the arendus sub-task goes **DONE → IN PROGRESS** and the test sub-task goes **IN PROGRESS → TODO**. This is an explicit reverse-transition rule.

**Demo and release info:** the demo checks that all stories and their test sub-tasks behave as expected. When a story passes, a **release number** is added (per the weekly release system), and **all touched repositories are tagged with the same release number**. Story numbers + repository list are recorded in the **paigaldus juhend** (deployment guide).

**Release process:** releases are **nädalapõhised** (weekly). The page shows a concrete example table:

| Release | Start (Staging) | End (Production) |
|---|---|---|
| 43 | October 20, 2025 | October 27, 2025 |
| 44 | October 27, 2025 | November 3, 2025 |

- **Release algus** = day changes go to *Staging*.
- **Release lõpp** = day changes go to *Production*.

**Release order rule:** First, deploy to LIVE the release whose end date is today, then **close** that release after the deploy. Second, deploy to **Staging** all repositories listed in the **Staging Deploy task**.

**HOTFIX — Staging variant:** cut a new branch **from the release branch** (e.g. `release/x.y.z`), fix, then merge **both** to `develop` (so the fix survives into future work) **and** back to `release` (so staging picks it up).

**HOTFIX — Production variant:** cut a new branch **from the production branch** (e.g. `production/x.y.z-hotfix`), fix, create a **new release just for the fix**, then merge **both** to `develop` and `release`.

The summary bullets at the bottom restate: Demo → Testimine → Release nr → Tagimine → Staging Deploy task; releases are weekly (Staging at start, Production at end); hotfixes merge to both develop and release; test tasks are bound to stories and ship in the same release.

### Key Elements

- **Issue types in use:**
  - **Story** — unit of planning, owned by toote omanik / projektijuht
  - **alam task (sub-task)** with three sub-kinds by name:
    - **analüüs** (optional)
    - **arendus** (mandatory)
    - **testimine** (mandatory per page rule: "Igale lool peab olema vähemalt kaks alam taski, arendus ja testimine")
  - **Bug** — created only for *side-effect* defects, never for direct failures of the current arendus work

- **Statuses / state machine:**
  - Story and sub-task share the same 4-state machine: **OPEN (Backlog) → TODO → INPROGRESS → DONE**
  - Reverse transitions are legal and explicitly spelled out for the test-failure path: arendus `DONE → INPROGRESS`, testimine `INPROGRESS → TODO`

- **Transition rules (hard gates):**
  - `OPEN → TODO`: story must have an estimate, and estimate ≤ **2 tööpäeva**. Larger stories must be split first.
  - `INPROGRESS → DONE` (arendus sub-task): gated on **deployment to develop environment**, not merge.
  - Story closure: gated on **all** sub-tasks being DONE.
  - Release membership: a story enters a release only after its testimine sub-task is successful.

- **Roles / responsibilities:**
  - **Toote omanik** (product owner) — owns story status
  - **Projektijuht** (project manager) — alternative owner of story status
  - **Arendaja** (developer) — owns arendus sub-task
  - **Tester / QA** — owns testimine sub-task (implicit; role is not named on the page, only the sub-task is)

- **Custom fields / labels:**
  - **estimate** (tööpäevad) — required field, hard cap 2 days
  - **release number** — added to story after successful testing; same number tags all touched repositories
  - **Staging Deploy task** — a task (issue type unclear) that lists all repositories to deploy in a given window

- **Other notable conventions:**
  - Stories that span multiple systems/repositories must have one arendus sub-task per system
  - The "top 10-15" backlog-scan cadence is a stated expectation for developers (not a tool-enforced rule)
  - Priority-sorted backlog is an invariant the page asserts ("peab alati olema")
  - Release cadence is weekly, but each release has a 1-week staging runway before going to production (so two releases are always live in staging+production hand-off)

## Source 2: Väljalaskeprotsess & GitFlow — page 1660518403

### Raw Summary (faithful to source, Estonian terms preserved)

This page describes the GitFlow workflow and release process for "this project" deployed on **Cloudflare Pages**. The body is very thin: a table of 5 branches, a sequence of numbered steps (Seadistamine, Funktsionaalsuse arendamine, Väljalaskeprotsess, Väljalaskme lõpetamine, Kiirparanduse protsess), and a checklist.

**Branch strategy:**

| Haru (Branch) | Eesmärk (Purpose) |
|---|---|
| `main` | Tootmisvalmis kood (production-ready code) |
| `develop` | Käimasolev arendus (ongoing development) |
| `feature/*` | Funktsionaalsuse arendusharud (feature branches) |
| `release/*` | Uute väljalasete ettevalmistus (release preparation) |
| `hotfix/*` | Kriitilised parandused tootmisele (critical production fixes) |

**Cloudflare behaviour is explicitly described:** Cloudflare Pages deploys **tootmine** (production) from `main`, and **eelvaated** (previews) from feature-, release-, and PR-branches. Preview URLs are created automatically on PRs to `develop`.

**All git operations are issued via the `git flow` CLI** (the Atlassian git-flow extension), not plain git commands. The page shows 15 `git flow` invocations:

- Init: `git flow init`
- Feature: `git flow feature start|publish|finish sinu-funktsionaalsuse-nimi`, with commits via `git add . && git commit -m "Lisa: sinu funktsionaalsuse kokkuvõte"`, then PR to `develop`
- Release: `git flow release start|publish|finish vX.Y.Z`, with commit message `"Valmista väljalase vX.Y.Z"`, then PR to `main`, then `git push origin main develop && git push origin --tags`
- Hotfix: `git flow hotfix start|publish|finish paranduse-nimi` (started **from `main`**), commit `"Paranda: tootmisprobleem"`, then `git push origin main develop && git push origin --tags`

**Pre-release updates** (within the release branch, before `release finish`): version in `package.json` or `app.html`, `CHANGELOG.md`, environment/config files.

**Release closing** (`git flow release finish`) merges the release branch to **both `main` and `develop`** and creates a **tag**. Cloudflare Pages then auto-deploys `main` to production.

**Hotfix** is cut from `main`, finish-merges back to both `main` and `develop`, and tags. (Standard git-flow hotfix semantics.)

**Release checklist (verbatim list):**

- All features merged into develop
- Release branch created and tested
- Version and changelog updated
- PR from `release/*` to `main` has been reviewed
- Tagged release pushed to main
- Release merged back into develop

**Versioning:** semantic versioning, format `vPÕHI.VAHENDUS.PARANDUS` (= vMAJOR.MINOR.PATCH).

**External reference link:** [Atlassian Gitflow tutorial](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow).

### Key Elements

- **Branches in use:** `main`, `develop`, `feature/*`, `release/*`, `hotfix/*` — textbook git-flow, five branches, no more. **No `production` branch**, **no `staging` branch**.

- **Branch naming conventions:**
  - Features: free-form name via `git flow feature start <name>` (no prefix constraint shown)
  - Releases: `release/vX.Y.Z` (semver with `v` prefix)
  - Hotfixes: free-form `paranduse-nimi` via `git flow hotfix start`

- **Merge / PR rules:**
  - Features → PR into `develop`, auto-preview via Cloudflare Pages, reviewed, then `git flow feature finish`
  - Releases → PR from `release/vX.Y.Z` into `main`, reviewed, then `git flow release finish` (which merges to both `main` and `develop`)
  - Hotfixes → `git flow hotfix finish` (which merges to both `main` and `develop`)
  - The tooling is `git flow` CLI, not plain `git merge` — this is load-bearing because it constrains merge topology (git-flow always does merge commits, never fast-forward; always merges back to develop on release finish; always tags on release/hotfix finish).

- **Tagging / versioning:**
  - Semantic versioning: `vMAJOR.MINOR.PATCH`
  - Tags are created by `git flow release finish` and `git flow hotfix finish`
  - Push tags via `git push origin --tags` after finish

- **Release cadence / triggers:**
  - **Not stated on this page.** No cadence, no calendar, no trigger rule (manual, scheduled, or event-based). The page is purely procedural, not temporal. Cadence information must come from Source 1 (weekly).

- **Hand-off points to Jira workflow:**
  - **None explicit on this page.** No mention of Jira, stories, sub-tasks, or the arendus/testimine/done transition. The page stands alone procedurally.

- **Cloudflare-specific details:**
  - `main` auto-deploys to production
  - `feature/*`, `release/*`, and PR branches auto-deploy to preview environments
  - No mention of `develop` being deployed anywhere by Cloudflare Pages (which contradicts Source 1's "deploy'tud develop keskkonda" gate — see cross-reference)

## Cross-Reference (where the two pipelines touch — and where they DIVERGE)

**Touching points:**

1. **Both pages describe the same release dimension**, but at different altitudes: Source 1 (Jira) describes *when* a release happens and *who owns* its Jira artefacts; Source 2 (GitFlow) describes *how* the git operations execute. On paper they should compose.

2. **Both pages mention `develop` and `release` branches by name** — so the vocabulary overlaps.

3. **Both describe a hotfix concept**, and both require hotfix merges to return to `develop` (Source 1 says "et fix säiliks tulevases arenduses"; Source 2 says `git flow hotfix finish` merges back to `main` and `develop`).

**Divergences — these are the load-bearing discrepancies between the two sources:**

### Divergence 1 — Branch set mismatch

Source 1 refers to a **`production` branch** (in the Production HOTFIX procedure: "Tee uus branch production harust") and to a **`release` branch** that persists and receives merged hotfixes. Source 2 has **no `production` branch at all** — it uses `main` as production, and `release/*` is a short-lived per-release branch that closes via `git flow release finish`.

Possible readings:
- **(a)** Source 1 is describing an older or differently-structured project, and Source 2 is the new reference. Page 2 is **new** (created 2026-04-13, v1), which supports this.
- **(b)** Source 1 uses "production" and "release" as *environment names* rather than git branch names, and the text is loose. The phrasing "Tee uus **branch** production harust" works against this reading — it explicitly says "haru" (branch).
- **(c)** Two different projects are in play and Source 1 describes a different one.

**This is the most important question for PO and cannot be resolved from the pages alone.**

### Divergence 2 — DONE gate mismatch

Source 1 gates the arendus sub-task `INPROGRESS → DONE` transition on **deployment to the develop environment**. Source 2 (GitFlow) says `develop` is a branch that accumulates merged features; Cloudflare Pages deploys preview environments from **feature**, **release**, and **PR branches**, but **not** explicitly from `develop`. If "develop environment" in Source 1 means "preview build produced by the PR to develop," that reconciles cleanly. If it means "a dedicated persistent develop-environment hosted somewhere," that environment is not documented on Source 2's page.

### Divergence 3 — Hotfix origin branch mismatch

- **Source 1 (Staging HOTFIX):** "Tee uus branch **release harust**"
- **Source 1 (Production HOTFIX):** "Tee uus branch **production harust**"
- **Source 2 (Kiirparanduse protsess):** `git flow hotfix start` — by git-flow convention this cuts from `main`.

So Source 1 has **two flavours** of hotfix based on which environment is broken; Source 2 has one flavour based on git-flow conventions. These are reconcilable only if "production" in Source 1 maps to `main` in Source 2 AND Source 1's "release hotfix" is an additional case Source 2 simply does not cover.

### Divergence 4 — Release branch lifetime

- **Source 1** treats `release/*` as **persistent enough to receive hotfix merges after release**. "Merge: release harusse (et stagingus fix rakenduks)" — this only works if the release branch still exists and staging deploys from it.
- **Source 2** treats `release/*` as **short-lived**. `git flow release finish` closes it by merging to `main` and `develop`, then deletes it. After finish, there is no `release/vX.Y.Z` branch to merge into.

These are architecturally incompatible release-branch lifecycles. Either the two pages describe different projects, or Source 2 supersedes Source 1 on this point.

### Divergence 5 — Weekly cadence

Source 1 is explicit about weekly releases with a fixed staging runway. Source 2 does not mention cadence at all. This is a gap in Source 2, not a conflict — but it means a developer reading only Source 2 would have no idea that releases are weekly and that staging happens a week before production.

## Observations (Finn's analysis — not yet patterns/gotchas)

### Unusual or load-bearing details

- **The 2-day estimate cap is a hard gate before TODO, not a soft guideline.** Stories exceeding 2 days *must* be split. This is a structural constraint, not an estimation hint — it forces decomposition discipline into the backlog-to-sprint transition rather than allowing big stories through.

- **The 10-15 backlog-scan cadence** is a written expectation on developers. It is not a tool-enforced rule, and Jira does not surface "did you scan" as a metric, so the accountability mechanism is social or absent.

- **Bug-vs-rework distinction is precise and well-motivated.** The page clearly separates "you didn't do what the story asked" (reopen sub-task, no new issue) from "there's a side-effect crash" (new Bug task). This prevents both double-counting defects and hiding rework-as-bugs.

- **`git flow` CLI dependency.** Source 2 commits hard to the `git flow` extension CLI. Every git operation in the page is a `git flow ...` command. This means onboarding requires `git flow init` and the extension installed locally; plain-git contributors cannot follow the page literally. It also constrains tooling: git hosts, squash-merge policies, and fast-forward-only rules are all incompatible with git-flow finish semantics.

- **Cloudflare Pages drives the preview loop.** Source 2 is explicitly Cloudflare-bound; it would need to be rewritten for a different host. Every feature branch and PR automatically gets a preview URL — this is the review substrate.

- **Reverse-transition rule is explicit.** Source 1 names the reverse path when testing fails: arendus `DONE → INPROGRESS`, testimine `INPROGRESS → TODO`. Most Jira workflows leave failure paths implicit; documenting them makes the state machine symmetric and auditable.

### Apparent gaps / undocumented edges

- **No mention on either page of a code-review gate** distinct from the PR itself. Source 2 says "Vaata üle, testi ja kiida PR heaks" for release PRs, and "pärast heakskiitu" for feature PRs, but does not specify **who** approves, how many reviewers are required, or whether approval blocks merge.

- **No CI/CD description.** Neither page mentions automated tests, linting, type-check gates, or deploy pipelines. Cloudflare Pages is mentioned as a deploy destination but not as a gated release mechanism.

- **No rollback procedure.** Both hotfix paths are forward-fix only. Neither page describes how to revert a production deploy that is already live but discovered to be bad (pre-hotfix).

- **No "what happens if the story is in-flight when the release cuts" rule.** Source 1 has weekly releases but doesn't say what happens to a story that is INPROGRESS when Friday arrives — does it stall? Does it bleed into the next release? Does the testimine sub-task determine cutoff?

- **No environment naming.** Source 1 uses "develop keskkond," "Staging," "Production" without saying what those environments actually are — URLs, DNS, configuration files, Cloudflare Pages environment names, or something else.

- **No link between the two pages.** Neither page references the other. Source 1 describes weekly releases, tags, and branches without telling readers to read Source 2; Source 2 describes branch strategy without telling readers to read Source 1.

- **Source 2 has no release-initiator role.** Source 1 says toote omanik / projektijuht own story status; Source 2 doesn't say who starts releases, who reviews release PRs, or who pushes tags.

### Things that look like patterns vs gotchas vs decisions (for Cal's later classification, *not* submitted yet)

- **Pattern candidate:** "Reverse-transition explicit in state machine" — the testimine-fail rule makes failure a first-class path rather than an exception. Worth comparing against how other projects (hr-platform, apex-migration-research, uikit-dev) handle test-fail returns.

- **Pattern candidate:** "Deploy to env as DONE gate, not merge-to-branch as DONE gate" — tighter than most workflows, which stop at merge. Creates a stronger "DONE means really running somewhere" invariant.

- **Pattern candidate:** "Weekly release with overlapping staging runway" — two releases are always live (one in production, one in staging waiting to promote). This is a specific cadence pattern worth naming.

- **Gotcha candidate:** "Two pages describing the same pipeline with incompatible branch sets" — the Divergence 1 / Divergence 4 mismatch between Source 1 and Source 2 is exactly the kind of silent-failure mode the team's Structural Change Discipline was written to prevent. The two pages have the same domain (one project's dev pipeline) but have not been kept in sync. A developer who reads Source 1 first will be primed for a `production` branch that Source 2 shows does not exist.

- **Decision candidate:** "Cloudflare Pages as preview/production substrate" — this is a deliberate stack choice that predates both pages, and Source 2 makes it explicit. Worth recording as a project-level decision even though it's not novel.

- **Decision candidate:** "Git-flow CLI extension over plain git" — also deliberate, and unusual in 2026 (git-flow CLI is less common than trunk-based or plain-branch workflows). Worth recording.

### Open questions for PO

1. **Is the `production` branch from Source 1 a real branch, or stale terminology?** If real, Source 2 is incomplete. If stale, Source 1 needs editing. This is the most urgent question.

2. **Is the `release/*` branch short-lived (per `git flow release finish`) or long-lived (per Source 1's staging-hotfix procedure)?** Both pages cannot be simultaneously correct for the same project.

3. **What "develop environment" does Source 1 mean for the arendus DONE gate?** A persistent hosted env, a Cloudflare Pages preview on `develop`, or something else?

4. **Do Source 1 and Source 2 describe the same project?** The two pages sit in the same VJS2 Confluence space and neither names its project. If they describe different projects, the divergences are non-issues; if they describe the same project, the divergences are defects.

5. **What is the relationship between Jira release number (Source 1) and the semver tag `vX.Y.Z` (Source 2)?** Source 1 shows releases numbered 43, 44 — these are week numbers, not semver. How does week-43 map to a `vX.Y.Z` tag? Is the semver tag derived from the week number, or tracked independently?

6. **Who is the release approver in Source 2?** Source 1 clearly assigns story ownership to toote omanik / projektijuht. Source 2 is silent on the release-PR approver. Are they the same person?

7. **Is `git flow` CLI actually used in practice, or is the page aspirational?** This is a verify-the-claim question; cheap to answer by checking recent PRs for merge-commit topology and `git-flow`-style branch lifetimes.

8. **Which page is authoritative if they disagree?** Source 2 is dated 2026-04-13 (yesterday, v1); Source 1 was last edited 2026-02-09 (v3). If the team uses "newer wins," Source 2 is authoritative for branches and Source 1 is authoritative for Jira workflow. Is that actually the policy?

9. **Is there a CI gate before merge to `develop` or `main`?** Neither page mentions automated verification. Do PRs run tests? Do failed tests block merge?

10. **What is the rollback story?** No page describes what to do when production is broken and a hotfix is not yet ready. Is manual redeploy of a previous tag the expected recovery path?

## Provenance

**Source 1: page 1163755527 — Arendusprotsessi Workflow (JIRA)**

- **Space:** VJS2 (`spaceId: 84180996`)
- **URL:** `https://eestiraudtee.atlassian.net/wiki/spaces/VJS2/pages/1163755527/Arendusprotsessi+Workflow+JIRA`
- **Version:** v3, last edited 2026-02-09 13:01 UTC (minorEdit: false)
- **Created:** 2025-10-21 06:53 UTC
- **Status:** current
- **Authors:** two distinct accountIds between create and latest edit (createdBy `712020:84a1b5ab-8627-4a1e-a50a-e4cc3167a890`, v3-editor `712020:da2c091f-fbc8-4a11-aff9-0c08f4f9713e`)
- **Body size:** 18 840 bytes storage format
- **Tables:** 3 (Story-status table, Release-weeks example table, Summary status table)
- **Code macros / embedded images:** none

**Source 2: page 1660518403 — Väljalaskeprotsess & GitFlow**

- **Space:** VJS2 (same space as Source 1)
- **URL:** `https://eestiraudtee.atlassian.net/wiki/spaces/VJS2/pages/1660518403/V+ljalaskeprotsess+GitFlow`
- **Version:** v1, created 2026-04-13 08:46 UTC (= yesterday relative to retrieval)
- **Status:** current
- **Author:** `712020:84a1b5ab-8627-4a1e-a50a-e4cc3167a890` (same as Source 1's original author)
- **Body size:** 15 260 bytes storage format
- **Tables:** 1 (Branches table)
- **Code macros:** 15 (all `git flow` CLI invocations, one with `language: bash`, 14 with no language)
- **Embedded images:** none

**Retrieval mechanism:** Confluence REST API v2 via curl, authenticated with `ATLASSIAN_EMAIL` + `ATLASSIAN_API_TOKEN` from `~/.claude/.env`. Endpoint: `GET $ATLASSIAN_BASE_URL/wiki/api/v2/pages/{pageId}?body-format=storage`. Both requests returned HTTP 200.

**Retrieval timestamp:** 2026-04-14 15:40 EEST (Europe/Tallinn).

**Cached artefacts (local, operator-only):**

- `~/.claude/cache/finn-jira-gitflow/page_1163755527.json` (raw v2 response)
- `~/.claude/cache/finn-jira-gitflow/page_1660518403.json` (raw v2 response)
- `~/.claude/cache/finn-jira-gitflow/page_1163755527.txt` (extracted plain text with table dump)
- `~/.claude/cache/finn-jira-gitflow/page_1660518403.txt` (extracted plain text with table dump; does not include the 15 `git flow` code macros — those were extracted separately from the storage JSON)

**Extraction note:** the custom HTMLParser-based extractor I wrote strips Confluence macros (`ac:structured-macro`) by default, which silently dropped all 15 `git flow` code blocks from the initial Source 2 text dump. I re-extracted them directly from the storage JSON via regex on `<!\[CDATA\[...\]\]>` inside `ac:name="code"` macros. **Flagging this as a gotcha for the future:** any automated Confluence-to-text pipeline that ignores `ac:structured-macro` will silently lose code blocks, info panels, expand macros, and inline images — all of which can be load-bearing. Worth remembering if this research branch ever becomes a regular ingestion pipeline.

(*FR:Finn*)
