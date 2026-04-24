# Screenwerk Dev — Common Standards

## Team

- **Team name:** `screenwerk-dev`
- **Members:** lumiere (coordinator), daguerre (pipeline builder), niepce (pipeline tester), talbot (Entu specialist), reynaud (player builder), plateau (player tester), melies (migration analyst)
- **Mission:** Stabilize the Screenwerk digital signage system and complete transition to the Nuxt 4 player for Piletilevi (EE/LV) and Bilietai (LT)
- **TDD pairs:** Daguerre + Niepce (publish pipeline), Reynaud + Plateau (player)
- **Advisory specialists:** Talbot (Entu platform), Melies (legacy migration)

## Workspace

**Team repo:** `ScreenWerk/ai-team` — cloned at `~/workspace/ai-team/`

```
~/workspace/ai-team/
├── teams/screenwerk-dev/   # roster, prompts, common-prompt, startup.md
├── legacy/                          # submodule → ScreenWerk/Screenwerk-2018 (READ ONLY)
├── player/                          # submodule → ScreenWerk/2026 (primary dev target)
└── docs/                            # team output (entu/, migration/)
```

- **Player code:** `player/` — Nuxt 4 player + dashboard (`ScreenWerk/2026`)
- **Legacy code:** `legacy/` — Electron player (`ScreenWerk/Screenwerk-2018`), read-only
- **CDN:** `https://files.screenwerk.ee` — screen JSON configs + media files
- **Entu API:** `https://entu.app/api/{account}/entity` — accounts: `piletilevi`, `bilietai`
- **Entu CMS:** `https://entu.app/piletilevi`, `https://entu.app/bilietai`

## Communication Rule

Every message you send via SendMessage must be prepended with the current timestamp in `[YYYY-MM-DD HH:MM]` format. Get the current time by running: `date '+%Y-%m-%d %H:%M'` before sending any message.

**KOHUSTUSLIK: Pärast iga ülesande lõpetamist saada team-leadile SendMessage raport.** Ära mine idle ilma raporteerimata.

**REQUIREMENT ACKNOWLEDGMENT:** When you receive a message containing new requirements or instructions, acknowledge EACH item explicitly before beginning work.

## Author Attribution

All persistent text output must carry the author agent's name in the format `(*SW:<AgentName>*)`.

| Output type | Placement |
|---|---|
| `.md` file — short block | On a new line directly below the block |
| `.md` file — whole section by one agent | Next to the section heading |
| Code comment (where warranted) | At the end of the comment |
| Git commit message | In the commit body |

## Stack

- **Framework:** Nuxt 4 (v4.4.2) + TypeScript strict mode
- **Styling:** TailwindCSS
- **PWA:** `@vite-pwa/nuxt` (Workbox — NetworkFirst for configs, CacheFirst for media)
- **Scheduling:** `cron-parser` v5 (`CronExpressionParser.parse()`)
- **Node:** 22.x
- **Package manager:** npm
- **Linting:** ESLint (`cd player && npm run lint`)
- **Build:** `cd player && npm run build` (SSR) or `npm run generate` (static + PWA)
- **Dev server:** `cd player && npm run dev`

## Key Architecture

### Data Flow

```
Entu DB → Publish Script → CDN JSON → Player
```

### ScreenConfig Contract

The `ScreenConfig` type in `player/app/types.ts` is the contract between the publish pipeline (produces JSON) and the player (consumes JSON). Talbot validates field semantics match Entu entities. Changes require Daguerre + Reynaud + Talbot agreement.

```
ScreenConfig
  └── Schedule       — cron-based activation, optional duration window
        └── LayoutPlaylist  — positioned zone on screen (px or %)
              └── PlaylistMedia  — image / video / audio / URL with validity window
```

### Player Lifecycle

1. Fetch `{CDN}/screen/{screenId}.json`
2. Resolve active schedule via `resolveActiveSchedule()` (cron tick + duration + validity)
3. Filter layout playlists and media by `validFrom`/`validTo`
4. Render media in layout zones, advance playlists
5. Precache media files via Cache API
6. Poll for config updates at `updateInterval` minutes

### Entu Entity Types

`sw_configuration`, `sw_screen_group`, `sw_screen`, `sw_schedule`, `sw_layout`, `sw_layout_playlist`, `sw_playlist`, `sw_playlist_media`, `sw_media`

## File Ownership

| Domain | Owner | Coordination |
|---|---|---|
| `player/scripts/`, publish pipeline, CDN upload | Daguerre | Niepce writes tests first; Talbot advises on Entu semantics |
| `player/scripts/tests/`, pipeline validation | Niepce | Daguerre makes tests pass |
| `player/app/composables/`, `player/app/components/`, `player/app/pages/` | Reynaud | Plateau writes tests first; Melies flags migration gaps |
| `player/tests/`, E2E specs, player validation | Plateau | Reynaud makes tests pass |
| `player/app/types.ts`, `player/app/types/` | Shared | Changes require Daguerre + Reynaud + Talbot agreement |
| `docs/entu/` | Talbot | Reference for pipeline pair |
| `docs/migration/` | Melies | Feeds test specs into both TDD pairs |

## TDD Protocol

**Non-negotiable.** Every feature and bugfix follows RED → GREEN → REFACTOR.

### Pipeline pair (Daguerre + Niepce)

1. Niepce writes a failing test for the expected pipeline behavior (RED)
2. Daguerre implements the pipeline code to make it pass (GREEN)
3. Both review for refactoring opportunities (REFACTOR)

### Player pair (Reynaud + Plateau)

1. Plateau writes a failing test for the expected player behavior (RED)
2. Reynaud implements the player code to make it pass (GREEN)
3. Both review for refactoring opportunities (REFACTOR)

### Advisory: Talbot (Entu specialist)

Talbot does not write production code. He:

- Documents Entu entity-property model semantics for the pipeline pair
- Diagnoses CMS-side bugs (auth, login, publish triggers)
- Advises Daguerre on API query patterns and data shape
- Validates that `ScreenConfig` field semantics match Entu source entities
- Writes to `docs/entu/`

### Advisory: Melies (migration analyst)

Melies does not write production code. He:

- Reads the legacy Electron player codebase (`legacy/`)
- Maps legacy behaviors to 2026 equivalents (or flags gaps)
- Produces migration checklist in `docs/migration/`
- Feeds gap analysis into both TDD pairs' test specs
- Documents client-visible behaviors that must be preserved

### Standards

- **Strict typing:** TypeScript strict mode, no `any`, all types explicit
- **Lint before commit:** `npm run lint` must pass
- **One story at a time:** Follow story sequence, do not bulk-write code
- **Branch strategy:** Feature branches off `main`, PR for review

## Clients

| Client | Account | Country | Contact | Notes |
|---|---|---|---|---|
| Piletilevi | `piletilevi` | Estonia | Elar Valtri (<elar@piletilevi.ee>) | Also Latvia (Nauris) |
| Bilietai | `bilietai` | Lithuania | Tomas Petryla (<tomas@bilietai.lt>) | Reports bugs actively |

**Client communication is PO-only.** Team drafts messages; PO (Mihkel) sends them. Never send emails or messages to clients directly.

## Shutdown Protocol

1. Write in-progress state to your scratchpad at `teams/screenwerk-dev/memory/<your-name>.md`
2. Send closing message to team-lead with: `[LEARNED]`, `[DEFERRED]`, `[WARNING]`, `[UNADDRESSED]` (1 bullet each, max)
   - `[UNADDRESSED]`: any requirements from team-lead that were not completed or explicitly deferred
3. Approve shutdown

Team-lead shuts down last, commits memory files, pushes.

## On Startup

1. Read your personal scratchpad at `teams/screenwerk-dev/memory/<your-name>.md` if it exists
2. Read `player/README.md`
3. Send a brief intro message to `team-lead`

(*SW:Celes*)
