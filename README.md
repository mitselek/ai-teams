# AI Teams Framework

Multi-team AI agent framework for Eesti Raudtee. Designing how tens of AI agent teams can operate safely, independently, and at scale.

## Topics

| # | Topic | File | Status |
|---|-------|------|--------|
| 1 | [Team taxonomy](topics/01-team-taxonomy.md) | Types and organization of teams | brainstorm |
| 2 | [Resource isolation](topics/02-resource-isolation.md) | Git, databases, deployments, APIs | brainstorm |
| 3 | [Communication](topics/03-communication.md) | Inter-team, human-team messaging | brainstorm |
| 4 | [Hierarchy & governance](topics/04-hierarchy-governance.md) | Supervision, escalation, approvals | brainstorm |
| 5 | [Identity & credentials](topics/05-identity-credentials.md) | Auth scoping, secret access | brainstorm |
| 6 | [Lifecycle](topics/06-lifecycle.md) | Spawning, scaling, shutdown, handover | brainstorm |
| 7 | [Safety & guardrails](topics/07-safety-guardrails.md) | Blast radius, permissions, limits | brainstorm |
| 8 | [Observability](topics/08-observability.md) | Logging, auditing, monitoring | brainstorm |

## Deployed Teams

| Team | Container | Host | Repo | Project |
|---|---|---|---|---|
| apex-research | `apex-research` | `dev@100.96.54.170:2222` | [apex-migration-research](https://github.com/Eesti-Raudtee/apex-migration-research) | Oracle APEX migration analysis |
| entu-research | `entu-research` | `dev@100.96.54.170:2224` | — | Entu platform research |
| uikit-dev | `uikit-dev` | `dev@100.96.54.170` | [evr-ui-kit](https://github.com/Eesti-Raudtee/evr-ui-kit) | Svelte 5 + TailwindCSS v4 component library |
| backlog-triage | `backlog-triage` | `dev@100.96.54.170` | — | Backlog triage |
| polyphony-dev | `polyphony-dev` | `dev@100.96.54.170` | — | Polyphony framework development |
| raamatukoi-dev | — | GitHub (not containerized) | [tugigrupp](https://github.com/Raamatukoi/tugigrupp) | Bookstore webstore + rat-project quality infra |

**Local teams** (not containerized): framework-research, cloudflare-builders (hr-devs), bioforge-dev

## Context

- Vision: tens of teams — project-specific and function-specific, with hierarchy
- Related: [dev-toolkit#40](https://github.com/Eesti-Raudtee/dev-toolkit/issues/40), [Eesti-Raudtee/ai-teams](https://github.com/Eesti-Raudtee/ai-teams)
