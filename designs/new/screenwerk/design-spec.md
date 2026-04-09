# Screenwerk Team — Design Spec

**Team:** `screenwerk-dev`
**Mission:** Stabilize the legacy Screenwerk digital signage system while completing the transition to the Nuxt 4 player (`ScreenWerk/2026`) for Piletilevi (EE/LV) and Bilietai (LT).
**Deployment:** Hostinger VPS (private infrastructure, separate from EVR)

(*FR:Celes*)

## 1. Problem Statement

Screenwerk is a digital signage product with two active clients (Piletilevi in Estonia/Latvia, Bilietai in Lithuania) and a legacy 2018 system that is breaking:

- **valid_to dates not enforced** without republishing — stale content plays past its expiry window
- **Stale December content** on checkout screens — content that should have rotated is stuck
- **Entu login broken** — 404 on `_nuxt/CDMKEMb1.js` (old Entu SPA deployment issue)

The rewrite is in progress:

- **ScreenWerk/2026** (Argo): Nuxt 4 player with cron scheduling, layout zones, PWA/offline, dashboard — single `main` branch, clean TypeScript, production-ready architecture

The PO (Mihkel) has already contacted clients about testing the 2026 player at `screenwerk.ee`. The team must:

1. Fix urgent bugs in the live system (publish pipeline, validity enforcement)
2. Verify and harden the 2026 player for production handover
3. Build the config pipeline that publishes Entu data to CDN JSON files
4. Support client testing and feedback cycle

## 2. Domain Analysis

### Stack

- **2026 player:** Nuxt 4 + TypeScript + TailwindCSS + PWA (Workbox), SPA mode (`ssr: false`)
- **Data source:** Entu entity-property database (`entu.app/piletilevi`, `entu.app/bilietai`)
- **CDN:** `files.screenwerk.ee` — static JSON configs per screen + media files
- **Dashboard:** `screenwerk.ee/{account}` — reads live from Entu API, displays entity hierarchy
- **Legacy player:** `screenwerk.entu.ee/player/#<id>` — must keep running until transition complete

### Data Model

Entu entity hierarchy: `Configuration → ScreenGroup → Screen` (admin side) and `Configuration → Schedule → Layout → LayoutPlaylist → Playlist → PlaylistMedia → Media` (content side). Schedules use cron expressions with optional duration windows and `validFrom`/`validTo` date ranges.

The 2026 player fetches a pre-built JSON file per screen (`{CDN}/screen/{screenId}.json`) which flattens the entity graph into a denormalized `ScreenConfig` with nested schedules, layout playlists, and playlist medias. This JSON must be generated from Entu data — the **publish pipeline**.

### Key Gap: Publish Pipeline

The 2026 player consumes static JSON from the CDN, but the pipeline that generates these JSON files from Entu entities is not yet evident in the 2026 repo. This pipeline is the critical missing piece.

### Team Archetype

**Hybrid** — primarily development (code output), but requires research into the legacy system and Entu API to understand the publish pipeline and fix bugs.

### Data Flow

Pipeline topology: `Entu DB → Publish Script → CDN JSON → Player`. The publish script is the integration point. Player development is largely independent once the JSON contract is stable.

## 3. Team Composition

| Agent | Role | Model | Color | TDD Pair | Description |
|---|---|---|---|---|---|
| **team-lead** | Coordinator | opus | — | — | Routes tasks, manages client comms drafts, reviews PRs, holds the pipeline view |
| **entu** | Pipeline Builder | opus | blue | entu + niepce | Builds the publish pipeline — Entu → JSON transformation, CDN upload, data integrity |
| **niepce** | Pipeline Tester | sonnet | magenta | entu + niepce | Writes tests for the publish pipeline — validates JSON output, data transformation, edge cases |
| **talbot** | Entu Specialist | opus | cyan | — (advisory) | Entu platform expert — entity-property model, API internals, auth, CMS-side bugs, data publishing |
| **nuxt** | Player Builder | sonnet | green | nuxt + plateau | Nuxt 4 + Vue 3 composables — player rendering, scheduling, PWA, media playback, validity filtering |
| **plateau** | Player Tester | sonnet | yellow | nuxt + plateau | Tests the player — schedule resolution, validity windows, media playback, E2E scenarios |
| **melies** | Migration Analyst | sonnet | white | — (research) | Bridges 2018 → 2026 — maps legacy behaviors, documents migration path, validates feature parity |

**7 characters** (team-lead + 2 TDD pairs + 2 specialists).

### TDD Pairs

Following the entu-research pattern (Codd+Hopper, Semper+Hamilton):

1. **Pipeline pair: Daguerre + Niepce** — Niepce writes tests for the publish pipeline (RED), Daguerre makes them pass (GREEN). Covers: Entu entity fetching, JSON transformation, `ScreenConfig` contract compliance, `validFrom`/`validTo` population, CDN upload.
2. **Player pair: Reynaud + Plateau** — Plateau writes tests for the player (RED), Reynaud makes them pass (GREEN). Covers: schedule resolution, validity filtering, media playback, playlist advancement, PWA/offline, dashboard rendering.

### Advisory Specialists

1. **Entu specialist: Talbot** — Not in a TDD pair. Advisory role across both pairs. Daguerre consults Talbot on Entu API behavior, entity-property semantics, and auth flows. Talbot diagnoses CMS-side bugs (login failures, publish triggers) that sit outside the codebase. Modeled after entu-research's Codd.
2. **Migration analyst: Melies** — Not in a TDD pair. Research/analysis role. Reads the legacy player, maps client-visible behaviors, documents what the 2026 player must replicate, and flags gaps. Output is migration documentation that feeds into both TDD pairs' work.

### Model Rationale

- **Team-lead (opus):** Coordination, client-facing output drafts, judgment calls on priority
- **Entu/Daguerre (opus):** The publish pipeline is the critical gap — transforms Entu entities into screen JSON. Errors mean wrong content on client screens. No automated quality gate beyond Niepce's tests.
- **Niepce (sonnet):** Test writing for the pipeline is pattern-driven — validate JSON shape, check field mappings, assert validity dates. Sonnet handles this well.
- **Talbot (opus):** Entu platform decisions have high consequence — wrong understanding of the entity-property model or auth flows cascades through everything. No tests can catch a misunderstood data model. Like Codd in entu-research.
- **Nuxt/Reynaud (sonnet):** Player code is well-typed, has clear composable boundaries, and Plateau's tests catch errors. Sonnet handles Vue/Nuxt development well.
- **Plateau (sonnet):** E2E and integration test authoring is pattern-driven. Sonnet is effective for test scenarios.
- **Melies (sonnet):** Migration analysis is read-heavy research — reading legacy code, comparing behaviors, writing documentation. Pattern-matching task that sonnet handles well.

### Lore Theme: Pioneers of Light and Display

The digital signage domain — projecting scheduled content to screens in public spaces — maps naturally to the pioneers who invented the science and art of visual projection. Each agent's namesake is connected to their role not just metaphorically but structurally: the historical figure's specific achievement mirrors the agent's specific responsibility.

#### team-lead: **Lumiere** (Auguste Lumiere)

- **Origin:** Auguste Lumiere (1862–1954) — co-inventor of the Cinematographe with brother Louis. Organized the world's first public film screening at the Grand Cafe in Paris, December 28, 1895 — ten short films shown to a paying audience in a scheduled program. Auguste handled the business: what to show, in what order, to whom, and when. The Lumieres' genius was not just the camera but the exhibition — a system for delivering moving images to audiences on a predictable schedule.
- **Significance:** A coordinator who orchestrates what content reaches which screens and when. The Grand Cafe screening was the first playlist: ten items, sequenced, timed, projected to an audience in a venue. Auguste decided the program, sold the tickets, managed the projectionists. Screenwerk is the same problem at scale — playlists of media, scheduled by cron, projected to screens in stores. Lumiere holds the program together.
- **Nickname:** Lumi

#### entu: **Daguerre** (Louis Daguerre)

- **Origin:** Louis Daguerre (1787–1851) — inventor of the daguerreotype, the first practical photographic process. Before photography, he created the Diorama: a theatre of illusion where enormous translucent paintings were lit from front and behind, transforming a single canvas into day and night, calm and storm. The Diorama was data transformation as spectacle — the same raw material (paint, canvas, light) rendered into completely different visual experiences depending on how it was processed.
- **Significance:** A pipeline builder who transforms raw Entu entity data into the structured JSON configurations that drive screen displays. The Diorama is the publish pipeline: Entu entities are the painted canvas, the pipeline is the lighting rig, and the CDN JSON is the image the audience sees. Daguerre's craft is making the transformation reliable and repeatable — every publish must produce the same faithful output from the same source data.
- **Nickname:** Dag

#### niepce: **Niepce** (Nicephore Niepce)

- **Origin:** Nicephore Niepce (1765–1833) — pioneer who created the earliest surviving photograph, *View from the Window at Le Gras* (1826/27). The exposure took approximately eight hours. Niepce was Daguerre's partner before Daguerre — he proved the process could work at all, through painstaking iteration. Where Daguerre optimized for speed and commercial viability, Niepce optimized for fidelity: does the plate faithfully capture what the lens sees? His letters to Daguerre are meticulous records of exposure times, chemical ratios, and results — the first photographic test logs.
- **Significance:** A pipeline tester paired with Daguerre. Niepce's historical role was to prove the photographic process worked before Daguerre refined and scaled it. His eight-hour exposures were not inefficiency but thoroughness — he needed to verify that every detail was captured faithfully. The pipeline tester does the same: before Daguerre's code publishes to production, Niepce proves that every entity is present, every validity date is correct, every field maps faithfully from Entu source to CDN output.
- **Nickname:** Nic

#### talbot: **Talbot** (William Henry Fox Talbot)

- **Origin:** William Henry Fox Talbot (1800–1877) — English polymath who invented the calotype, the first negative-positive photographic system. Where Daguerre made unique plates, Talbot understood the underlying structure: a single negative could produce unlimited positive prints. He grasped that the representation system mattered more than any individual image. Talbot was also a mathematician, botanist, and a pioneer of Assyriology — he contributed to deciphering Mesopotamian cuneiform, reading meaning from systems of marks that others saw as ornamental. His *Pencil of Nature* (1844) was the first commercially published book illustrated with photographs — systematic documentation of a new medium.
- **Significance:** An Entu platform specialist who understands the structure of the entity-property database, not just the data that flows through it. Like Talbot deciphering cuneiform — reading a system of representation that encodes meaning in relationships between marks, not in the marks themselves — he decodes the entity-property model where meaning lives in the relationships between entities and their typed properties. He advises the pipeline pair on data semantics, diagnoses platform-level bugs (auth, publish triggers), and documents the Entu model so others can work with it reliably.
- **Nickname:** Tal

#### melies: **Melies** (Georges Melies)

- **Origin:** Georges Melies (1861–1938) — French illusionist and filmmaker who attended the Lumieres' first screening and immediately understood that cinema could do what his stage magic already did, but better. He bought a camera, built a glass-walled studio, and over the next fifteen years produced over 500 films that systematically translated stage illusions into cinematic techniques: the substitution splice (jump cut), multiple exposure, dissolves, hand-painted color. He didn't abandon what worked on stage — he mapped each technique to its cinematic equivalent, identified what was lost in translation, and invented new techniques for gaps that had no stage analogue. *A Trip to the Moon* (1902) was not just the first science fiction film; it was the proof that the new medium could do things the old medium never could.
- **Significance:** A migration analyst who bridges the legacy Electron player (Screenwerk-2018) and the 2026 Nuxt 4 player. Like Melies at the Lumieres' screening, he studies the old system, maps each behavior to its equivalent in the new system, identifies what is lost in translation (desktop-only features, local filesystem caching), and flags capabilities the new system enables that the old one never could (PWA offline, web-based dashboard, cron-driven scheduling). His migration checklist is the shooting script — every scene from the old production accounted for in the new one.
- **Nickname:** Mel

#### nuxt: **Reynaud** (Charles-Emile Reynaud)

- **Origin:** Charles-Emile Reynaud (1844–1918) — inventor of the Praxinoscope (1877) and the Theatre Optique (1888). His *Pantomimes Lumineuses*, which debuted at the Musee Grevin in Paris in 1892, ran for over 500 performances across eight years — the first sustained animated projection system. Three years before the Lumieres screened their first film, Reynaud's apparatus was already projecting hand-painted frames onto a screen in sequence, advancing through strips of images with precise timing. His system handled what modern players handle: frame sequencing, timing intervals, and loop control.
- **Significance:** A player builder who renders sequences of media content across layout zones. Reynaud's Theatre Optique is the ancestor of the digital signage player: strips of ordered visual content, projected in timed sequence to an audience, running reliably performance after performance. The 500-performance run at the Musee Grevin is the standard — a player that runs on screens in stores 24/7, advancing through playlists, handling schedule changes, surviving restarts. Reynaud builds the engine that keeps the show running.
- **Nickname:** Rey

#### plateau: **Plateau** (Joseph Plateau)

- **Origin:** Joseph Plateau (1801–1883) — Belgian physicist who discovered the persistence of vision and invented the Phenakistiscope (1832), the first device to demonstrate the principle of animated movement. Through mathematical analysis of visual perception, he established the specifications for what the human eye accepts as smooth motion: the frame rates, the timing thresholds, the duration windows. He continued his work on visual perception even after losing his own sight from staring at the sun during experiments — he could no longer see the output, but his mathematical framework for correct perception remained the standard others built on.
- **Significance:** A player tester who defines and verifies the specifications for correct visual output. Plateau didn't just watch the animation and say "looks right" — he mathematically defined what "correct" means for visual perception and tested against that definition. The player tester does the same: defines what correct schedule resolution looks like (right content at the right time), what correct validity filtering looks like (expired content gone, future content hidden), what correct media playback looks like (smooth transitions, correct durations) — and writes tests that hold the player to those specifications.
- **Nickname:** Plat

## 4. Work Streams

### Stream 1: Fix Urgent Bugs (week 1)

**Owner:** Talbot (diagnosis) + Pipeline pair (Daguerre + Niepce) + Player pair (Reynaud + Plateau)

1. **valid_to enforcement** — Plateau writes a failing test for `isWithinValidityWindow()` edge cases; Reynaud fixes. If root cause is in publish pipeline (stale JSON), Niepce writes pipeline test, Daguerre fixes. Talbot advises on Entu-side validity date semantics.
2. **Stale content** — likely the same root cause as valid_to; may also require re-publishing configs (pipeline pair). Talbot investigates Entu publish trigger mechanism.
3. **Entu login 404** — Talbot's domain. Diagnoses broken `_nuxt/CDMKEMb1.js` — likely old Entu SPA deployment hash mismatch.

### Stream 2: Publish Pipeline (week 1-2)

**Owner:** Pipeline pair (Daguerre + Niepce), advised by Talbot

1. Talbot documents how Entu entities map to `ScreenConfig` fields — entity-property semantics, reference resolution, file URL normalization
2. Niepce writes tests for expected `ScreenConfig` JSON output given known Entu entities
3. Daguerre builds the Entu → JSON publish script that generates `ScreenConfig` JSON per screen
4. Niepce validates `validFrom`/`validTo` population from Entu entity properties
5. Talbot advises on Entu auth flow for API access and publish triggers
6. Set up automated re-publish on schedule change (or on-demand trigger)

### Stream 3: Migration Analysis (week 1-2, parallel)

**Owner:** Melies

1. Read the legacy codebase at `legacy/` (Electron app: `screenwerk.js`, `sync.js`, `renderDom.js`, `globals.js`)
2. Document all client-visible behaviors: config fetching, media download to local FS, playback logic, update polling, offline handling
3. Map each legacy behavior to its 2026 equivalent (or flag as gap)
4. Produce migration checklist: what works, what's missing, what can be dropped
5. Feed gaps into player pair (Reynaud + Plateau) and pipeline pair (Daguerre + Niepce)

### Stream 4: Player Hardening (week 2-3)

**Owner:** Player pair (Reynaud + Plateau), informed by Melies' gap analysis

1. Plateau writes E2E tests for schedule resolution, validity filtering, media playback
2. Reynaud implements multi-client configuration (Piletilevi EE, Piletilevi LV, Bilietai LT)
3. Plateau verifies offline/PWA — player must survive network outages
4. Dashboard improvements for client self-service
5. Address any gaps identified by Melies' migration analysis

### Stream 5: Client Transition (ongoing)

**Owner:** Team-lead (coordination), Melies (documentation), Plateau (validation)

1. Melies prepares migration documentation for PO review
2. Prepare testing instructions for Elar (Piletilevi) and Tomas (Bilietai)
3. Validate each client's screen configurations work on the 2026 player
4. Document switchover procedure (DNS/URL change from legacy to 2026)

## 5. Tools & Access

### Repo Structure

**Team repo:** `ScreenWerk/ai-team` — the working directory for the team

```
ScreenWerk/ai-team/
├── .claude/teams/screenwerk-dev/   # team config (roster, prompts, common-prompt, startup.md)
├── legacy/                          # submodule → ScreenWerk/Screenwerk-2018 (read-only)
├── player/                          # submodule → ScreenWerk/2026 (primary dev target)
└── docs/                            # team output (entu/, migration/)
```

| Repo | Submodule path | Purpose | Access |
|---|---|---|---|
| `ScreenWerk/ai-team` | (root) | Team config, docs, coordination | read + write |
| `ScreenWerk/2026` | `player/` | Nuxt 4 player + dashboard | read + write |
| `ScreenWerk/Screenwerk-2018` | `legacy/` | Legacy Electron player — understand what clients currently use | read only |

### Entu API

- **Base:** `https://entu.app/api/{account}/entity`
- **Accounts:** `piletilevi`, `bilietai`
- **Entity types:** `sw_configuration`, `sw_screen_group`, `sw_screen`, `sw_schedule`, `sw_layout`, `sw_layout_playlist`, `sw_playlist`, `sw_playlist_media`, `sw_media`
- **Auth:** Entu session token (to be configured in container)

### CDN

- **Base:** `https://files.screenwerk.ee`
- **Screen configs:** `{CDN}/screen/{screenId}.json`
- **Media files:** `{CDN}/media/{...}`

### Access Matrix

| Agent | `player/` write | `legacy/` read | `docs/` write | Entu API | CDN write |
|---|---|---|---|---|---|
| Lumiere (lead) | PR review | yes | yes | read | no |
| Daguerre (entu) | yes (pipeline code) | no | yes (`docs/entu/`) | read + write | yes (publish) |
| Niepce (niepce) | yes (pipeline tests) | no | no | read (test data) | no |
| Talbot (talbot) | no | yes | yes (`docs/entu/`) | read + admin | no |
| Reynaud (nuxt) | yes (player code) | no | no | read (dashboard) | no |
| Plateau (plateau) | yes (player tests) | no | no | read (test data) | no |
| Melies (melies) | no | yes | yes (`docs/migration/`) | read | no |

## 6. Coordination Boundaries

### File Ownership

| Domain | Owner | Coordination |
|---|---|---|
| `player/scripts/`, publish pipeline, CDN upload | Daguerre | Niepce writes tests first; Talbot advises on Entu semantics |
| `player/scripts/tests/`, pipeline validation | Niepce | Daguerre makes tests pass |
| `player/app/composables/`, `player/app/components/`, `player/app/pages/` | Reynaud | Plateau writes tests first; Melies flags migration gaps |
| `player/tests/`, E2E specs, player validation | Plateau | Reynaud makes tests pass |
| `player/app/types.ts`, `player/app/types/` | Shared | Changes require Daguerre + Reynaud + Talbot agreement |
| `docs/migration/` | Melies | Feeds into both TDD pairs |
| `docs/entu/` | Talbot | Reference for Daguerre + Niepce |

### Integration Points

1. **ScreenConfig type** (`player/app/types.ts`) — contract between Daguerre (produces JSON) and Reynaud (consumes it). Talbot validates the field semantics match Entu entity properties. Changes require Daguerre + Reynaud + Talbot agreement.
2. **Migration checklist** (`docs/migration/`) — Melies documents legacy behaviors that feed into both TDD pairs' test specs. Plateau and Niepce derive test cases from Melies' gap analysis.

## 7. Deployment

**Hostinger VPS** (provided by PO). This is a private project — separate infrastructure from the EVR RC server.

- Dedicated VPS instance (specs TBD — Mihkel to provision)
- SSH access for PO to monitor progress
- `ScreenWerk/ai-team` cloned with submodules: `git clone --recurse-submodules`
  - `player/` → `ScreenWerk/2026` (read + write)
  - `legacy/` → `ScreenWerk/Screenwerk-2018` (read only)
- Team config at `.claude/teams/screenwerk-dev/`
- `gh` CLI authenticated for GitHub API access (ScreenWerk org)
- Node.js 22.x (as specified in `player/package.json` engines)
- Entu auth token configured for API access
- `NUXT_PUBLIC_API_BASE` and `NUXT_PUBLIC_ENTU_URL` environment variables set

### Server Requirements

- **OS:** Debian (preferred) or Ubuntu
- **Runtime:** Node.js 22.x
- **Tools:** `gh` CLI, git, npm, tmux
- **Claude Code:** installed and configured with team roster
- **Environment variables:**
  - `NUXT_PUBLIC_API_BASE=https://files.screenwerk.ee`
  - `NUXT_PUBLIC_ENTU_URL=https://entu.app/api`
  - Entu auth token (TBD — Mihkel to provide)
  - GitHub token with access to `ScreenWerk` org repos

### Note on Infrastructure Separation

This team runs on Hostinger, NOT on the RC server (`dev@100.96.54.170`) used by EVR teams (apex-research, entu-research, etc.). Screenwerk is a private project under the `ScreenWerk` GitHub org, not `Eesti-Raudtee`. Keep credentials, repos, and team state completely separate from EVR infrastructure.

## 8. Human-Side RACI

**R** = Responsible (does the work), **A** = Accountable (final decision), **C** = Consulted, **I** = Informed

| Roles | PO | Developer | Client Tech | Client User |
|---|---|---|---|---|
| | Product owner, system architect (Mihkel) | Codebase contributor (Argo) | Technical support at client (Elar-type) | End user, marketing (Tomas-type) |

| Action | PO | Developer | Client Tech | Client User |
|---|---|---|---|---|
| Bug reporting (content issues) | I | I | C | **R** |
| Bug reporting (technical) | I | I | **R** | I |
| Bug triage and prioritization | **A** | C | I | I |
| Player code decisions | **A** | **R** | — | — |
| Publish pipeline decisions | **A** | C | — | — |
| Entu platform issues | **R** | C | I | — |
| Testing new player | **A** | C | **R** | **R** |
| Test feedback and sign-off | **A** | I | **R** | **R** |
| Client communication | **R** | — | I | I |
| Deployment to production | **A** | **R** | I | I |
| Content management (Entu CMS) | C | — | **R** | **R** |
| Migration sign-off (legacy → new) | **A** | C | **R** | **R** |
| VPS provisioning | **R** | — | — | — |
| Agent team oversight | **A** | — | — | — |

## 9. Completion Criteria

### Phase 1 — Stabilize (target: 1 week)

- [ ] valid_to enforcement working — expired content no longer displays
- [ ] Publish pipeline operational — screen JSON regenerated on demand
- [ ] At least one client (Piletilevi or Bilietai) successfully testing on 2026 player

### Phase 2 — Harden (target: 2-3 weeks)

- [ ] E2E test suite covering schedule resolution, validity filtering, media types
- [ ] All three client accounts (piletilevi EE, piletilevi LV, bilietai LT) verified
- [ ] PWA offline mode tested and working
- [ ] Dashboard shows correct entity hierarchy for both accounts

### Phase 3 — Transition (target: 1 month)

- [ ] Legacy player URLs redirect to or replaced by 2026 player
- [ ] Client sign-off on 2026 player for daily use
- [ ] Monitoring/alerting for publish pipeline failures
- [ ] Documentation for client self-service (content management via Entu)
