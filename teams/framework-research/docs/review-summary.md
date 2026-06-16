# Dev-toolkit PR Reviews -- Multi-Persona Trial (FR S41)

## Overview

5 [Arhitecture](https://github.com/Eesti-Raudtee/Arhitecture) personas reviewed 2 [dev-toolkit](https://github.com/Eesti-Raudtee/dev-toolkit) PRs with Celes-engineered synergy wiring + competency gates. This is a research trial testing whether structural prompt additions (competency gates, synergy sections) measurably improve review quality.

Persona prompts live in [Arhitecture `.claude/agents/`](https://github.com/Eesti-Raudtee/Arhitecture/tree/master/.claude/agents). The synergy map that informed the pairings: [Arhitecture issue #3](https://github.com/Eesti-Raudtee/Arhitecture/issues/3). The competency gap audit: [Arhitecture issue #2](https://github.com/Eesti-Raudtee/Arhitecture/issues/2).

## PR #45 -- Human-authored test intent, characterization tests, review size (+36/-0, 3 files)

**PR:** [dev-toolkit #45](https://github.com/Eesti-Raudtee/dev-toolkit/pull/45)
**Panel:** Kent Beck + James Bach

| Reviewer | Verdict | Key findings |
|---|---|---|
| **Kent Beck** | Approve (F1 wording fix before merge) | F1: "human-verified" is unenforceable -- drop to "human-authored" or make the trace concrete [CONSENSUS w/ Bach]. F2: characterization-test guidance is correct but silent on pinning bugs [CONSENSUS w/ Bach]. F3: no checklist redundancy (passes YAGNI). [GAP]: no stack-specific kata in [dev-toolkit](https://github.com/Eesti-Raudtee/dev-toolkit). |
| **James Bach** | Approve with caveats | F1: characterization tests pin bugs-as-spec -- add the missing sentence [CONSENSUS w/ Beck]. F2: non-deterministic legacy needs seam-pinning first. F3: "small enough" uses size as proxy; real control is semantic density. F4: checklists convert investigation into compliance (illusion of quality). F5: missing ENG-8 contract-test step at the gateway seam ([ADR-015](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-015-contract-testing.md)). [GAP]: no Workers failure-mode doc in [Arhitecture](https://github.com/Eesti-Raudtee/Arhitecture). |

**Consensus finding:** Both independently hit "characterization tests pin bugs and the guidance never says so." Beck from the trace-must-be-checkable axis, Bach from the what-the-test-misses axis. Clean division of labor -- no overlap collision.

## PR #46 -- NFR yaml convention / FND-6 (+355/-2, 6 files)

**PR:** [dev-toolkit #46](https://github.com/Eesti-Raudtee/dev-toolkit/pull/46)
**Panel:** Grady Booch + Nancy Leveson + Ross Anderson

| Reviewer | Verdict | Key findings |
|---|---|---|
| **Grady Booch** | Approve with conditions | DEFECT-1: ch.11/[T-38](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/tasks/T-38-nfr-catalogue-accessibility-chapter.md) migration path gap (accessibility NFRs will be mis-filed). DEFECT-2: unversioned `master` schema pin = fleet-wide CI break risk. FINDING-3: no-op on-ramp is correct. FINDING-4: complexity proportional, not over-modeled. FINDING-5: minor schema/catalogue naming drift. |
| **Nancy Leveson** | Approve | HIGH: `safety_related` is a self-asserted boolean with no independent gate -- the exact hazard [ADR-016](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-016-system-hazard-analysis.md) (Proposed) exists to close. Recommends require evidence fields when `safety_related: true` + treat absent as "unclassified" not "false." MEDIUM: future `security_level` filter could pull safety into security axis. LOW: EN 50716 clause citations traceable to ratified [ADR-010](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-010-en50716-eng-adoption.md) but unverifiable without source text. [GAP]: EN 50716 not in [Arhitecture](https://github.com/Eesti-Raudtee/Arhitecture) repo. |
| **Ross Anderson** | Approve with HIGH actions | ACTION-1 (HIGH): State plainly that v1 SEC declarations are self-asserted claims, not evidence. ACTION-2 (HIGH): Shift highest-stakes SEC fields from process-assertion to evidence-or-result. ACTION-3 (MEDIUM): Constrain `key_custody` vocabulary. ACTION-4 (MEDIUM): Caveat that [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md) SEC-7..11 are Proposed, not ratified. [CONSENSUS] with Leveson: `security_level`/`safety_related` independence is correctly modelled. [GAP]: NIS2/ISO/KüTS source texts not in [Arhitecture](https://github.com/Eesti-Raudtee/Arhitecture) repo. |

**Consensus findings:**
1. **security_level / safety_related independence** -- Leveson and Anderson both confirm the schema correctly separates infosec and safety into two fields. The designed conflation check produced confirmation, not conflict. Credit to PR authors.
2. **Self-assertion hazard** -- emerged independently from both Leveson (safety boolean is uncheckable) and Anderson (SEC fields are unfalsifiable self-assertions that can manufacture compliance appearance on the board dashboard). Same structural defect, two domains.

## Competency gates -- all fired correctly
- Zero fabricated citations across all 5 reviews
- Every persona flagged the right gaps: Beck (missing kata in [dev-toolkit](https://github.com/Eesti-Raudtee/dev-toolkit)), Bach (Workers failure modes), Leveson (EN 50716 absent from [Arhitecture](https://github.com/Eesti-Raudtee/Arhitecture)), Anderson (NIS2/ISO/KüTS absent from [Arhitecture](https://github.com/Eesti-Raudtee/Arhitecture)), Booch (verified against [canonical catalogue](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/docs/sp-uldised-nfr-2026-05.md), no gaps)
- Nobody treated the intentionally-unwired `security_level` filter as a defect
- [ADR-016](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-016-system-hazard-analysis.md) and [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md) correctly called "Proposed" throughout (not presented as binding)

## Origin
Reviews generated by framework-research team (S41) as a research trial: Celes re-engineered 5 [Arhitecture](https://github.com/Eesti-Raudtee/Arhitecture) persona prompts with synergy wiring + competency gates, then the personas reviewed real [dev-toolkit](https://github.com/Eesti-Raudtee/dev-toolkit) PRs. Retro assessment pending.

(*FR:Aen*)
