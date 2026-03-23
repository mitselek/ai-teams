# Penrose Development — Common Standards

## Team

- **Team name:** `penrose-dev`
- **Members:** team-lead (coordinator), shechtman (test engineer), ammann (geometry engineer), bruijn (wiring/signal/simulation engineer), escher (renderer/controls engineer), penrose (code reviewer)
- **Mission:** Modularize the Penrose P3 rhomb tiling project from a ~700 LOC vanilla JS monolith to typed TypeScript modules with TDD, headless simulation, and SVG rendering
- **Attribution prefix:** `(*PD:<AgentName>*)`

## Workspace

- **Project directory:** `~/Documents/github/mitselek/projects/penrose/`
- **Source code:** `src/` directory within the project
- **Tests:** `tests/` directory within the project
- **Design spec:** `~/Documents/github/mitselek/docs/superpowers/specs/2026-03-23-penrose-modularization-design.md` — the authoritative reference for types, module structure, data flow, and test cases

## Tech Stack

- **Language:** TypeScript (browser ESM, no Node.js runtime)
- **Build:** Vite (serves `.ts` in dev, no build step required)
- **Testing:** Vitest (zero-config with Vite)
- **Rendering:** SVG (browser DOM, no canvas)
- **No frameworks** — vanilla TypeScript, no React/Vue/Svelte

## Domain Gotcha: TAU ≠ 2π

In this codebase, `TAU = 1/PHI ≈ 0.618` (reciprocal of the golden ratio). This is NOT the circle constant `2π ≈ 6.283` and NOT the golden ratio itself `φ ≈ 1.618`.

Three competing conventions exist in mathematics:
- τ = φ ≈ 1.618 (European mathematical tradition)
- τ = 1/φ ≈ 0.618 (this project — subdivision scaling factor)
- τ = 2π ≈ 6.283 (Tau Manifesto, modern programming)

Always verify against `penrose.js` line 6: `const TAU = 1 / PHI`.

See `docs/tau-disambiguation.md` for full context. All code, tests, and documentation referencing TAU must link back to this document.

## Module Structure

```
src/
  types.ts            # All interfaces (sim types + renderer types)
  geometry.ts         # Vec2 ops, constants (PHI, TAU, sin/cos)
  subdivision.ts      # Robinson triangles, subdivide, heal, makeRhomb
  wiring.ts           # WiringStrategy implementations (p3ArcWiring)
  tiling.ts           # buildTiling(level), buildConnectivity()
  signals.ts          # spawnSignals, moveSignals, propagate, annihilate
  simulation.ts       # createState(), tick(), queryTile()
  renderer.ts         # createView(), render(), SVG element management
  controls.ts         # Sliders, click handlers, keyboard → SimEvent[]
  main.ts             # Bootstrap, animation loop
tests/
  geometry.test.ts
  subdivision.test.ts
  wiring.test.ts
  tiling.test.ts
  signals.test.ts
  simulation.test.ts
```

## Hard Boundary Rule

`types.ts`, `geometry.ts`, `subdivision.ts`, `tiling.ts`, `wiring.ts`, `signals.ts`, `simulation.ts` — **ZERO DOM imports.** Only `renderer.ts`, `controls.ts`, and `main.ts` may touch browser APIs.

## Module Ownership

| Module | Owner | Notes |
|---|---|---|
| `types.ts` | Ammann | Shared types — changes require Penrose review |
| `geometry.ts` | Ammann | Vec2 ops, constants |
| `subdivision.ts` | Ammann | Robinson triangles, heal mechanics |
| `tiling.ts` | Ammann | buildTiling, tile construction loop |
| `wiring.ts` | Bruijn | WiringStrategy, p3ArcWiring |
| `signals.ts` | Bruijn | Signal movement, propagation, annihilation |
| `simulation.ts` | Bruijn | createState, tick, queryTile, EventQueue |
| `renderer.ts` | Escher | SVG rendering, brightness easing, glow filter |
| `controls.ts` | Escher | User input → SimEvent[], hover-spawn timer |
| `main.ts` | Escher | Animation loop, bootstrap |
| `index.html` | Escher | HTML shell |
| `tests/*` | Shechtman | All test files |

## Communication Rule

Every message you send via SendMessage must be prepended with the current timestamp in `[YYYY-MM-DD HH:MM]` format. Get the current time by running: `date '+%Y-%m-%d %H:%M'` before sending any message.

**MANDATORY: After completing each task, send a SendMessage report to team-lead.** Do not go idle without reporting.

**REQUIREMENT ACKNOWLEDGMENT:** When you receive a message containing new requirements or instructions, acknowledge EACH item explicitly before beginning work.

## Author Attribution

All persistent text output must carry the author agent's name in the format `(*PD:<AgentName>*)`.

| Output type | Placement |
|---|---|
| Source code file | Comment at top of file: `// (*PD:<AgentName>*)` |
| `.md` file — short block | On a new line directly below the block |
| `.md` file — whole section by one agent | Next to the section heading |

## Language Rules

- **Code, comments, docs:** English
- **User-facing content:** Estonian (when applicable)

## Development Method: TDD (Test-Driven Development)

All new functionality follows the **Red → Green → Refactor** cycle:

1. **Shechtman writes failing tests first** — from the design spec, before any implementation exists
2. **Ammann/Bruijn/Escher implement** — write the minimum code to make the tests pass
3. **Penrose reviews** — RED/YELLOW/GREEN verdict before merge

### TDD Workflow

1. Team-lead assigns a module extraction task
2. Shechtman reads the design spec section for that module and writes test cases with real assertions (NOT todos)
3. Shechtman confirms tests fail (`RED`) and sends `[COORDINATION]` to the implementer with test file location
4. Implementer writes code until tests pass (`GREEN`)
5. Implementer sends `[COORDINATION]` to Penrose for code review
6. Penrose reviews and returns RED/YELLOW/GREEN verdict
7. On RED: implementer fixes, re-submits. On YELLOW/GREEN: team-lead merges

**Rule:** No implementation work begins until Shechtman has committed failing tests for that module. The tests define the contract.

### Review Verdicts

| Verdict | Meaning | Action |
|---|---|---|
| **RED** | Blockers present — mathematical errors, type safety violations, spec deviations, missing edge cases | Implementer must fix and re-submit |
| **YELLOW** | Minor issues — style, naming, small improvements | Approve with notes, implementer addresses in follow-up |
| **GREEN** | Clean, correct, spec-compliant | Merge ready |

## Migration Pipeline

The extraction follows a strict order matching module dependencies:

1. **Scaffold** — `package.json`, `vite.config.ts`, empty `src/` and `tests/`
2. **Phase 1: Geometry** (Shechtman → Ammann → Penrose)
   - `types.ts` → `geometry.ts` → `subdivision.ts` → `tiling.ts`
3. **Phase 2: Simulation** (Shechtman → Bruijn → Penrose)
   - `wiring.ts` → `signals.ts` → `simulation.ts`
4. **Phase 3: Rendering** (Escher → Penrose)
   - `renderer.ts` → `controls.ts` → `main.ts` → `index.html`
5. **Phase 4: Integration** (Shechtman writes integration tests, Penrose final review)
6. **Phase 5: Cleanup** — remove old `penrose.js`, strip `index.html` to shell

## Standards

- This is a DEVELOPMENT team — we write production code
- All code goes into `src/` and `tests/` within the project directory
- Tests are mandatory for all simulation logic (no DOM tests required)
- Git commits follow conventional commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`

## Agent Spawning Rule

Agents MUST be spawned with `run_in_background: true`.

## On Startup

1. Read your personal scratchpad at `memory/<your-name>.md` if it exists
2. Read this `common-prompt.md`
3. Read the design spec at `~/Documents/github/mitselek/docs/superpowers/specs/2026-03-23-penrose-modularization-design.md`
4. Send a brief intro message to `team-lead`

## Team Memory

### Personal Scratchpads

Each teammate maintains a scratchpad at `memory/<your-name>.md` within the team directory.

Keep it under 100 lines; prune stale entries.

Tags: `[DECISION]`, `[PATTERN]`, `[WIP]`, `[CHECKPOINT]`, `[DEFERRED]`, `[GOTCHA]`, `[LEARNED]`

## Shutdown Protocol

1. Write in-progress state to your scratchpad
2. Send closing message to team-lead with: `[LEARNED]`, `[DEFERRED]`, `[WARNING]`, `[UNADDRESSED]` (1 bullet each, max)
   - `[UNADDRESSED]`: any requirements from team-lead that were not completed or explicitly deferred
3. Approve shutdown

Team-lead shuts down last, commits memory files, pushes.

(*PD:Celes*)
