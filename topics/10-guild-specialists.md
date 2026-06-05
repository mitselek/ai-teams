# Guild Specialists — Shared Expert Pool with Competency Backend

Specialist agent personas maintained as a shared resource across teams, dispatched on demand with verified competency backing and a self-correcting feedback loop.

## Problem statement

At 1-3 teams, every team can embed its own security reviewer, safety engineer, or architecture coherence checker. At 10+ teams, this doesn't scale — duplicating every specialist on every team multiplies maintenance cost, fragments competency quality, and produces inconsistent review standards. A team that needs Anderson-grade security review once a quarter shouldn't maintain its own Anderson year-round.

## Design

Four components, each with a distinct owner:

| Component | What it is | Who owns it |
|---|---|---|
| **Retainer repository** | Catalogue of specialist personas with defined competencies, synergy maps, and known gaps | Consultancy team |
| **Consultancy team** | Matchmaker that takes a client brief, selects the right specialist composition, re-engineers prompts for the engagement, and dispatches | Dedicated team (Celes-shaped role) |
| **Competency backend** | Documented source-of-truth backing for each persona's domain claims — MCP servers, indexed doc repos, ratified ADRs | Consultancy team maintains; domain owners populate |
| **Gap-detection feedback loop** | When a hired specialist must derive any prompt-claimed competency from training data: (a) flag it in the output artifact with `[GAP]`, (b) file an issue at the consultancy about the backing gap | Specialist executes; consultancy triages |

### How it works

```
Client team                    Consultancy                     Retainer pool
    │                              │                               │
    ├─ "Review these PRs" ────────>│                               │
    │                              ├─ Match problem to personas    │
    │                              ├─ Check competency backing     │
    │                              ├─ Re-engineer for engagement   │
    │                              ├─ Dispatch ───────────────────>│
    │                              │                               ├─ Read backing docs
    │                              │                               ├─ Review / deliver
    │                              │                               ├─ Flag [GAP]s
    │<─────────────── Deliverable ─┤<──────────── Report ──────────┤
    │                              ├─ Triage gap issues            │
    │                              ├─ Update competency profiles   │
    │                              │                               │
```

### The feedback loop in detail

The gap-detection loop is what makes this framework-grade rather than "a folder of prompts":

1. **Specialist encounters unbacked claim** — their prompt says they have security/safety/architecture expertise, but `search_docs` returns nothing for the specific standard, regulation, or pattern they need to cite.
2. **Specialist flags in output** — `[GAP] EN 50716:2023 source text is not available; I cannot cite specific clauses. The following is from training knowledge and must be verified.`
3. **Specialist files issue** — back at the consultancy/retainer repository: "Leveson persona claims EN 50716 expertise but source text is absent. Obtain and index."
4. **Consultancy triages** — either (a) obtain the backing doc and index it (MCP auto-picks it up), or (b) document it as a known gap in the persona's competency profile so future dispatches include the caveat.
5. **Next engagement** — the specialist's competency profile is more honest. If the doc was obtained, the gap is closed and citations are real. If not, the gap is documented and the flag fires automatically.

Over time, the retainer pool's competency claims converge toward truth — each engagement either validates or exposes gaps, and the feedback loop closes them or documents them.

## Relationship to team taxonomy

This is a **fourth team archetype** alongside the three defined in [01-team-taxonomy.md](01-team-taxonomy.md):

| Archetype | Primary output | Lifecycle | Members |
|---|---|---|---|
| Research | Design docs, frameworks | Persistent | Permanent roster |
| Development | Working software | Persistent or mission-scoped | Permanent roster |
| Hybrid | Research + internal tooling | Mission-scoped | Permanent roster |
| **Consultancy / Guild** | Reviews, audits, assessments delivered to client teams | **Persistent pool, per-engagement dispatch** | **Retainers (dormant until summoned)** |

Key differences from other archetypes:
- **No permanent team instances** — the guild is a pool, not a running team. Specialists are dormant between engagements.
- **Client-driven activation** — a client team requests expertise; the consultancy matches and dispatches. No standing work.
- **Cross-team by design** — retainers serve any team that needs their domain. Their competency backend is shared infrastructure.
- **Quality feedback is structural** — the gap-detection loop is built into the engagement protocol, not an afterthought.

## Evidence — S41 proof-of-concept

The framework-research team (S41) ran a controlled trial of this pattern:

- **Retainer repository:** [Eesti-Raudtee/Arhitecture `.claude/agents/`](https://github.com/Eesti-Raudtee/Arhitecture/tree/master/.claude/agents) — 13 personas
- **Consultancy role:** Celes (FR agent) — produced [synergy map](https://github.com/Eesti-Raudtee/Arhitecture/issues/3), selected 5 personas, re-engineered prompts with competency gates + synergy wiring
- **Competency backend:** [arch-docs MCP](https://arch-docs.dev.evr.ee) (498 indexed docs) + ratified ADRs in [Arhitecture](https://github.com/Eesti-Raudtee/Arhitecture) repo
- **Client engagement:** Review [dev-toolkit PR #45](https://github.com/Eesti-Raudtee/dev-toolkit/pull/45) and [PR #46](https://github.com/Eesti-Raudtee/dev-toolkit/pull/46)
- **Gap-detection results:** all 5 personas flagged `[GAP]` correctly (EN 50716, NIS2/ISO/KüTS, Workers failure modes, missing kata). Zero fabricated citations. 5 atomic issues filed ([#4](https://github.com/Eesti-Raudtee/Arhitecture/issues/4)–[#8](https://github.com/Eesti-Raudtee/Arhitecture/issues/8)) for persona improvements.
- **Synergy results:** designed pairings (Beck⟷Bach, Leveson⟷Anderson) produced consensus findings neither lens would reach alone. Full trial: [review gist](https://gist.github.com/mitselek/a20d0be7ae193c8266725880005aa4a6).

## Open questions

- **Competency backend ownership at scale:** who pays the cost of obtaining and indexing external source docs (EN 50716, NIS2 directive text, ISO 27001 Annex A)? The domain owner? The consultancy? The client who needs the gap closed?
- **Retainer quality assurance:** who reviews the retainer prompts themselves? The consultancy (Celes-role) is the natural owner, but marking your own homework is a governance gap.
- **Pricing / priority model:** when 3 teams want Anderson simultaneously, who queues? First-come or criticality-based?
- **Retainer independence vs team culture:** a retainer dispatched to different teams must adapt to different communication protocols, commit conventions, and quality bars. How much adaptation is the consultancy's job vs the retainer's?
- **Competency backend as shared infrastructure:** the MCP server pattern ([arch-docs.dev.evr.ee](https://arch-docs.dev.evr.ee)) works for one repo. At 10+ repos with 10+ retainers, is there one MCP per domain or a federated query layer?

(*FR:Aen*)
