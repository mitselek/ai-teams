# Team Taxonomy

Types and organization of AI agent teams.

## Open Questions

- What team types do we need? (project, function, specialty, temporary?)
- How do project teams differ from function teams?
- Can an agent belong to multiple teams?
- What defines a team's boundary — repo? domain? skill?
- How does team size scale — fixed roster or elastic?

## Known Team Types

### Project teams (e.g., current RC cloudflare-builders)

- Dedicated to a single project/repo
- Full-stack capability (frontend, backend, DB, tests)
- Long-lived, persistent across sessions

### Function teams (per dev-toolkit#40)

- Cross-project, organized by function
- Examples: QA team, Code Review team, Security team
- Spun up on-demand or persistent?

### Specialty teams

- Narrow expertise: data migration, compliance, performance
- Likely temporary — engaged per task

## Notes

## Patterns from Reference Teams (*FR:Finn*)

### Team composition in practice

**rc-team (cloudflare-builders) — 11 agents:**

- team-lead (opus-4-6), sven (frontend), dag (database), tess (testing), piper (CI/CD), harmony (integration/auth), alex (APEX migration), marcus (code review, opus-4-6), finn (research, sonnet), arvo (requirements), medici (health audit)
- Includes a project-specific specialist (alex) for APEX migration — added and can be removed when that workstream ends

**hr-devs — 9 agents:**

- team-lead, sven, dag, tess, marcus, finn, arvo, medici, eilama (local LLM scaffolding)
- Removed: piper (CI/CD), harmony (integration/auth), alex (APEX)
- Added: eilama (local Ollama daemon, not a Claude agent — code boilerplate factory)
- Evolution: leaner roster after removing project-complete specialists; eilama shows non-Claude agent integration

### Roster is machine-readable

Both teams define membership in `roster.json` — name, model tier, agentType, prompt file path, color. This enables:

- `spawn_member.sh` to auto-read model/color without hardcoding
- Team-lead to check "is X registered?" before spawning

### Agent types observed

| Type | Examples | Characteristic |
|---|---|---|
| team-lead | team-lead | Coordinates only, forbidden to touch source code |
| specialist | sven, dag, tess, piper, harmony, alex | Domain-specific, owns work end-to-end |
| cross-cutting support | finn, arvo, marcus, medici | Serve multiple specialists; no primary deliverable |
| non-Claude agent | eilama | Daemon, polls inbox, communicates via same message substrate |

### Team-lead role boundary is explicitly enforced

The team-lead's tool set is restricted by prompt (cannot edit .ts/.svelte, cannot run tests/build/git). Teammates are instructed to *call out* team-lead if they observe a violation. This is a governance mechanism baked into agent prompts, not enforced by infrastructure.

### Model tiering

Senior roles (team-lead, marcus/code review, sven/frontend) use opus-4-6 in hr-devs. Others use sonnet-4-6. Eilama uses codellama:13b-instruct via ollama (no API cost). Cost optimization is built into team design.

### Team configurations are named presets

Both teams define named spawn configurations:

- **"full"** — story work: finn + marcus + tess + sven (+ dag if needed)
- **"full-review"** (hr-devs only) — adds arvo for AC verification
- **"lite"** — quick fix: finn + sven only

This answers the "fixed roster vs elastic" question: roster is fixed (defines available agents), but active configuration is elastic (spawn subset per task type).
