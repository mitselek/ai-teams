# Grady Booch -- Architectural Review, [dev-toolkit PR #46](https://github.com/Eesti-Raudtee/dev-toolkit/pull/46) (NFR convention)

**Verdict: Approve with conditions.** The shape is sound and the canonical-home decision is right. Two structural issues to fix before merge, three to track. No competency gaps -- I read [ADR-007](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-007-nfr-declaration.md), [ADR-008](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-008-reconcile-fnd6-with-nfr-catalogue.md), [T-43](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/tasks/T-43-nfr-yaml-convention-aggregator.md), *and* the [canonical catalogue](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/docs/sp-uldised-nfr-2026-05.md) directly.

Schema-shape arbitration is mine; I defer safety `security_level` mapping to Leveson and SEC-cluster target content to Anderson.

---

## What this is, structurally

A per-repo `nfr.yaml` (validated by a 135-line JSON Schema) that makes FND-6 self-checking next to the code, rolled up into a 6-monthly board dashboard. This is the correct architecture: one machine-readable contract per deployable, no Confluence drift. The C4 story is clean -- the schema is the *interface*, the [canonical catalogue](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/docs/sp-uldised-nfr-2026-05.md) is the *upstream model*, the aggregator is the *consumer*. Good separation.

---

## Verified against the canonical catalogue -- the shape matches, with one defect

The [catalogue](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/docs/sp-uldised-nfr-2026-05.md) (read directly) has **13 numbered chapters, chapter 11 unused**, so **12 active chapters**: Security, Performance, Integration, Software packaging, Batch processing, Documentation, Backup & Archiving, Configurability, Logging, Monitoring, Database Design (ch.12), WEB UI (ch.13). The schema's 12 `nfrs` keys map 1:1 to these. **The "12 chapters" claim is correct.** Confirmed, not flagged.

The 765/1 `security_level` derivation (max(K,T,S): ≤1 Low / ≥2 Medium / ≥3 High) is internally consistent and matches what [ADR-008](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-008-reconcile-fnd6-with-nfr-catalogue.md) + [T-43](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/tasks/T-43-nfr-yaml-convention-aggregator.md) describe. The catalogue itself doesn't define the K/T/S→turvatase math (that's the 765/1 protokoll, a board protocol not in any repo), but the schema correctly attributes it and treats the filter as *pending* ([ADR-008](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-008-reconcile-fnd6-with-nfr-catalogue.md)'s honest-gap discipline). Acceptable.

### [DEFECT-1 -- structural, blocks the dashboard] Chapter 11 is the elephant in the schema.
The [catalogue](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/docs/sp-uldised-nfr-2026-05.md) reserves **chapter 11 for the pending Accessibility & Multilingual chapter** ([T-38](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/tasks/T-38-nfr-catalogue-accessibility-chapter.md), draft already prepared per the catalogue's "Known gap" + [nfr-catalogue-accessibility-chapter-proposal.md](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/docs/nfr-catalogue-accessibility-chapter-proposal.md)). The PR knows this -- it routes WCAG-AA and `multilingual-et-en` through `project_specific` "until [T-38](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/tasks/T-38-nfr-catalogue-accessibility-chapter.md) lands." That's the right *interim* call. But the schema's `additionalProperties: false` on `nfrs` means **the day ch.11 lands, every repo that declared accessibility under `project_specific` is now mis-filed against the catalogue**, and the aggregator can't tell a principled project-specific NFR from a soon-to-be-catalogue one. This is a known, dated, in-flight migration the schema is structurally blind to. Recommend: add a commented-out `accessibility` key placeholder in the schema (or a `# T-38` note) so the eventual addition is a one-line diff, not a fleet-wide re-classification. At minimum, `NFR_CONVENTION.md` in [dev-toolkit](https://github.com/Eesti-Raudtee/dev-toolkit) should name the migration path. *Architecture is the decisions that are hard to change -- this is one, and it's being deferred silently.*

---

## [DEFECT-2 -- cross-system consistency, blocks "one source of truth"] $id vs. fetch URL pin to a moving target.

The schema `$id` and the CI `curl` both point at `…/dev-toolkit/master/nfr.schema.json`. Canonical-home = [dev-toolkit](https://github.com/Eesti-Raudtee/dev-toolkit) is the **right** decision ([T-43](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/tasks/T-43-nfr-yaml-convention-aggregator.md) confirms it; resolves the dev-toolkit-vs-Arhitecture drift question -- there is no drift, [dev-toolkit](https://github.com/Eesti-Raudtee/dev-toolkit) is sole owner once this lands). But pinning every downstream repo's CI to `master` means **a breaking schema change auto-propagates to every repo's gate on next push, with no version pin**. That's not one source of truth, that's one *unversioned* source of truth -- a fleet-wide CI break is one bad merge away. The schema has no `version` field and the fetch has no tag/SHA pin. Recommend either (a) a `schema_version` field + tagged fetch (`…/v1/nfr.schema.json`), or (b) an explicit ADR note accepting `master`-tracking as deliberate. Pick one consciously; right now it's implicit.

---

## Tracked, non-blocking

**[FINDING-3 -- the no-op on-ramp is the right evolutionary choice, *with* a visibility hole.]** CI validates "when present, else echo + pass." For adoption that's correct -- you cannot gate repos that haven't declared yet without a fleet-wide flag-day, and [ADR-007](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-007-nfr-declaration.md)'s backfill (T-37) is explicitly honest follow-up, not a precondition. **Keep it.** But "no `nfr.yaml`" is currently indistinguishable at the CI layer from "adopted." The dashboard *does* track this via `inventory/nfr-sources.json` in [Arhitecture](https://github.com/Eesti-Raudtee/Arhitecture) (the allowlist names who *should* have one), so the silent-non-adoption hole is covered at the dashboard layer, not the CI layer. That split is acceptable -- just make sure the dashboard's "expected but absent" column is load-bearing, because CI green ≠ declared.

**[FINDING-4 -- complexity is proportional, not over-modeled.]** 135 lines for a 12-chapter catalogue + 5 scope dimensions + a project-specific escape hatch is *lean*. The `chapter` `$def` with `additionalProperties: {string|number|boolean}` (scalars only, structured targets deferred to v2) is exactly the right altitude for v1 -- it resists premature schema rigidity while still enforcing `verification`. No over-engineering. The deferred-to-v2 markers (structured targets, live fetch, conflict detection) are disciplined scoping.

**[FINDING-5 -- minor, schema/catalogue naming drift.]** Schema key `software_packaging` vs. [catalogue](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/docs/sp-uldised-nfr-2026-05.md) "Software packaging **and installation**"; `web_ui` vs. catalogue ch.13 "WEB UI." Harmless now, but the aggregator joins schema keys to catalogue chapters -- if that join is ever by-name rather than by-position, document the key↔chapter mapping table somewhere canonical (`NFR_CONVENTION.md` in [dev-toolkit](https://github.com/Eesti-Raudtee/dev-toolkit) is the place).

---

## Bottom line
The decisions that are hard to change are mostly made *well* here: [dev-toolkit](https://github.com/Eesti-Raudtee/dev-toolkit) as canonical home (right), scalar-only v1 targets (right), no-op on-ramp (right), `project_specific` escape hatch (right). The two things I'd block on are both *hard-to-change-later* gaps the PR is currently silent about: the **ch.11/[T-38](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/tasks/T-38-nfr-catalogue-accessibility-chapter.md) migration path** (DEFECT-1) and the **unversioned `master` schema pin** (DEFECT-2). Fix those two -- even just as documented, conscious decisions -- and this is a clean merge.

Deferring to Leveson on whether `safety_related` + `security_level` independence is the right safety model, and to Anderson on the SEC-cluster target content in the template.
