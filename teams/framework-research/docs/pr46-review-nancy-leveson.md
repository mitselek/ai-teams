# Review of [dev-toolkit PR #46](https://github.com/Eesti-Raudtee/dev-toolkit/pull/46) -- `nfr.yaml` convention -- Nancy Leveson (safety / STAMP-STPA lens)

**[GAP] EN 50716:2023 source text is not available in the [Arhitecture](https://github.com/Eesti-Raudtee/Arhitecture) repo. I cannot cite specific clauses, SIL tables, or Annex references as if from the standard. Everything below that touches the standard's structure is from training knowledge and MUST be verified against the actual text before it is relied on.** (The [ISO-50716](https://github.com/Eesti-Raudtee/ISO-50716) repo, per [ADR-010](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-010-en50716-eng-adoption.md), holds the text but the EVR-specific files in it are flagged AI-generated drafts -- not canon.)

I read [ADR-010](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-010-en50716-eng-adoption.md) (Accepted, ratified 2026-05-29) and [ADR-016](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-016-system-hazard-analysis.md) (**Proposed**, 2026-06-02, not ratified) as backing. Verdict up front: **this is a careful piece of work and it does NOT repeat the conflation I came prepared to flag.** Approve with three findings, one of them HIGH.

---

## What it gets right (safety lens)

1. **The two axes are NOT conflated.** I arrived expecting `security_level` (765/1 turvatase) to be doing double duty as a safety classification. It is not. The schema carries `scope.security_level` (infosec K/T/S triple) AND a separate boolean `scope.safety_related`, and the description explicitly states they are independent -- "High security + non-safety (HR data) or Low security + safety-related (runbook viewer adjacent to a SIL system)." That is exactly the right separation. Anderson reads `security_level` as confidentiality/integrity; I read `safety_related` as the safety axis; **the schema gives us one field each, not one field for both.** This is the single most important thing it could have gotten right, and it did.

2. **Simplicity serves verifiability.** Scalars-only targets, one required `verification` line per chapter, no nested target objects in v1. "Complexity is the enemy of safety" -- a flat, scalar declaration is one whose satisfaction a reviewer can actually check. I endorse the v1 restraint.

3. **`safety_related: true` is wired to consequence**, not cosmetic -- the schema description says it "triggers stricter downstream validation and a board-review flag," and the template comment ties it to SEC-6 / EN 50716. Good intent.

---

## Findings

### HIGH -- `safety_related` is a self-asserted boolean the delivering team ticks. This is precisely the hazard [ADR-016](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-016-system-hazard-analysis.md) (Proposed) exists to close.

This is my central finding and I want it recorded sharply. The schema lets a delivery team set `safety_related: false` as a **checkbox in a file they author**, with no independent gate. [ADR-016](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-016-system-hazard-analysis.md)/SEC-12 (**Proposed, not ratified**) states the principle directly: *"safety classification ... is the output of [a hazard] analysis -- an independent, evidence-based gate owned by a safety authority independent of PO and Developer ... never a checkbox the delivering team ticks. ... out of safety scope only where a hazard analysis demonstrates no contribution. The default is unproven, therefore analyse."*

The schema's default posture is the inverse: `safety_related` defaults to absent/false, and nothing demands a hazard-contribution justification. A team can self-classify **out** of the safety regime by leaving a boolean false. That is the self-assertion [ADR-016](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-016-system-hazard-analysis.md) names as the missing top of the V-model.

**Caveat -- this is not yet a binding gap.** [ADR-016](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-016-system-hazard-analysis.md) is **Proposed, NOT ratified** (I say so every time): the independent-safety-authority model isn't EVR policy yet, so the schema can't be faulted for not enforcing an unratified principle. But the convention is being set in concrete now, and a boolean is going to be hard to retrofit into a gated, justified decision later.

**Recommendation (cheap, forward-compatible):** when `safety_related: true`, the schema should *require* an accompanying field -- e.g. `safety_classification_by` (the independent authority) and a `hazard_log` pointer -- so that asserting safety scope at least drags the evidence in with it. And treat *absent* `safety_related` not as a settled "false" but as **unclassified** on the dashboard, mirroring exactly how the PR already (correctly) treats an omitted `security_level`. The pattern for "missing = flag for classification" is already in this PR for the security axis; apply the same to the safety axis. **[GAP]** I cannot cite the EN 50716 clause that makes SIL the output of hazard analysis from the [Arhitecture](https://github.com/Eesti-Raudtee/Arhitecture) repo -- verify against EN 50126/CSM-RA, which [ADR-016](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-016-system-hazard-analysis.md) names as the upstream owner.

### MEDIUM -- The "security-level filter" note risks pulling safety into the security axis through the back door.

The `NFR_CONVENTION.md` in [dev-toolkit](https://github.com/Eesti-Raudtee/dev-toolkit) closing note and the schema description both say catalogue rows will be filtered by `scope.security_level` ("only rows whose minimum security_level ≤ system's apply"). That filter is **intentionally not wired yet** (the PR says the "missing" column is informational until the catalogue lands), so an omitted chapter is not yet a real gap -- I accept that framing.

My concern is forward-looking: if a safety-relevant NFR ever becomes a *catalogue chapter* gated by the `security_level` filter, then a Low-security-but-safety-related system (the exact example the schema itself gives -- the runbook viewer adjacent to a SIL system) could have a safety-relevant row filtered **out** because its security_level is Low. The two axes are cleanly separated in the *scope* fields but the *filter* mechanism only knows about `security_level`. **When that filter is implemented, `safety_related: true` must override the security_level filter for any safety-bearing row** -- otherwise the careful separation in finding #1 leaks back. Flag this to whoever builds the filter (post-catalogue). This is a note for the future, not a blocker on the PR.

### LOW -- `software_packaging` and `configurability` cite EN 50716 clause numbers in template comments.

The template comments read `§9.1.4` (self-identification) and `§7.3.4.13` (generic-vs-application-data), sourced via [ADR-010](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-010-en50716-eng-adoption.md). [ADR-010](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-010-en50716-eng-adoption.md) itself cites these, so the provenance is a ratified ADR, not a fabrication -- that's legitimate. **But [GAP]: I cannot verify these clause numbers against the EN 50716 text because it is not in the [Arhitecture](https://github.com/Eesti-Raudtee/Arhitecture) repo.** [ADR-010](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-010-en50716-eng-adoption.md) is downstream of an AI-assisted read of the standard (its own "Related" section flags the EVR-specific [ISO-50716](https://github.com/Eesti-Raudtee/ISO-50716) files as AI-generated drafts). Recommend: keep the citations (they trace to a ratified ADR) but anyone treating these as authoritative EN 50716 references must confirm against the actual standard text. Not a blocker.

---

## Cross-lens notes
- **To Anderson:** we share the `security_level` field and I confirm from the safety side that it is NOT carrying safety classification -- `safety_related` is the separate field. If you read `security_level` as purely infosec turvatase (765/1 K/T/S), we are not in conflict; the schema gave us one field each. Worth us jointly confirming the *filter* (MEDIUM finding) doesn't later merge the axes.
- **To Booch:** can the schema structurally express a safety NFR -- a SIL target or a safe-state response-time -- today? Right now safety-relevant numbers would land in `project_specific` or a generic chapter with no independent-gate semantics. Tell me whether a first-class `safety` chapter (gated by `safety_related`, not by `security_level`) is structurally coherent; I'll tell you whether it's safety-sufficient.

**Disposition: APPROVE.** The HIGH finding is a forward-compatibility ask against a Proposed (unratified) principle, not a defect in what the PR claims to do. Add the `safety_related`-requires-justification field and treat absent-safety-flag as unclassified, and this convention is ready to set in concrete without foreclosing SEC-12.
