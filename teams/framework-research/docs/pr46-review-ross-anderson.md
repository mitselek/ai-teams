# Review -- [dev-toolkit PR #46](https://github.com/Eesti-Raudtee/dev-toolkit/pull/46) (`nfr.yaml` convention), security lens -- Ross Anderson

[GAP] NIS2 Directive 2022/2555 text, ISO 27001:2022 Annex A control catalogue, KüTS consolidated text, and GDPR article text are NOT in the [Arhitecture](https://github.com/Eesti-Raudtee/Arhitecture) repo. Regulatory references below are from training knowledge and the EVR posture/ADR docs and **must be verified** against source before anyone relies on a quoted article or control number. I cite what EVR *does* from the [posture doc](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/docs/evr-infosec-nis2-posture.md) and [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md); I do not quote Annex A IDs as if from source.

A second standing caveat: **[ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md) and the SEC-7..SEC-11 cluster are Proposed, not ratified** (status line: "Proposed -- draft for Infoturbeosakond review", 2026-06-02). Every binding I assert below inherits that "Proposed" status -- none of SEC-8..SEC-11 is a ratified obligation yet, and this PR must not read as if they were.

---

## 1. Regulatory grounding

EVR is, on the evidence in the [posture doc](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/docs/evr-infosec-nis2-posture.md) and the [audited 2025 annual report](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/docs/sp-iso27001-audit-2024.md), an **essential entity / elutähtsa teenuse osutaja** in a NIS2 Annex I high-criticality sector (rail), transposed through the updated **KüTS** (RIA competent authority, CERT-EE the CSIRT). The Art. 21 risk-management measures that bear on this PR are: (b) incident handling, (c) business continuity / backup / DR, (d) supply-chain security, (e) secure development + vulnerability handling, (h) cryptography/encryption, plus the GDPR overlay on PII. [GAP -- article letters from training knowledge + [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md) Appendix A, verify against KüTS/NIS2 source.]

The PR's value proposition is exactly right at the regulatory level: it turns FND-6 ("declare measurable NFRs") into a self-checking, in-repo, CI-gated discipline. For an essential entity facing Art. 21(f) "policies to assess effectiveness," a machine-readable, aggregable declaration that lands next to the code is materially stronger evidence than Confluence prose. That is a genuine compliance asset, and I want to say so before the ACTION items.

## 2. Control-to-principle mapping (the SEC cluster I own)

I checked each SEC-cluster target in `nfr.template.yaml`'s `security:` and `backup_archiving:` chapters against the Art. 21 measure it claims and against the EVR artefact [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md) binds it to.

**Strong, correctly bound (positive -- see §4):**
- `immutable_copy` + `restore_drill: quarterly` → SEC-8 / Art. 21(c). Correctly captures the *two named deltas* [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md) (Proposed) identifies: the ransomware-resilient copy and the rehearsed cadence. The template comment "a backup that has never been restored is a hypothesis" is the right doctrine.
- `secrets_store: delinea` + `key_custody` → SEC-9 / Art. 21(h). Binds the live Delinea EU tenant and surfaces the key-custody (CF-managed vs customer-held) decision [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md) calls a data-sovereignty lever. Correct.
- `sbom: cyclonedx-per-build` → SEC-10 / Art. 21(d). This is the *genuine net-new* control per both the [posture doc](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/docs/evr-infosec-nis2-posture.md) and [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md), and the template names it concretely.
- `patch_sla` → INF-4. The values (Crit 24–72h / High 7d / Med 30d / Low 90d) match the INFOSEC *Haavatavuste halduse protseduur* verbatim. Correctly bound.
- `pii_lawful_basis` + `pii_residency: EU` → SEC-11 / GDPR overlay. Captures the privacy+residency axis 765/1 lacks. Good.

**Measurability -- FND-6's own test (this is where it weakens):**
[ADR-007](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-007-nfr-declaration.md) / FND-6 requires *measurable* NFRs, and the convention itself preaches "numbers, not adjectives." Several SEC targets fail that test as written:
- `ir_readiness: tested-plan`, `restore_drill: quarterly`, `sbom: cyclonedx-per-build` are **process assertions, not measurements**. They state an intent, not a verifiable result. `restore_drill: quarterly` is a cadence; the measurable fact is *did the last drill pass and when* ([ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md) SEC-8: "the drill result is the evidence"). A system can write `restore_drill: quarterly` and never have run one.
- `patch_sla: "crit 24-72h / high 7d ..."` is a **restatement of the policy**, not this system's *conformance* to it. [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md)'s FND-6 delta explicitly asks for "patch-remediation SLA **conformance**" -- a measured number -- not a copy of the SLA table.
- This matters because the schema's free-form `additionalProperties` (string|number|boolean scalars) lets a team satisfy CI with a string that looks like a target but commits to nothing.

## 3. Threat assessment -- the self-certification hole

This is my primary concern and it is a [CONSENSUS] point with the panel.

**The convention lets a delivery team self-certify security compliance by filling in a YAML string, with no evidence binding.** Concretely:
- `verification:` is `minLength: 1` free text. `verification: "trust me"` passes CI. The schema validates *shape*, never *truth*.
- Every SEC target is a self-asserted scalar. `immutable_copy: true`, `restore_drill: quarterly`, `sbom: cyclonedx-per-build`, `pii_residency: EU` are all unfalsifiable at validation time. A system under schedule pressure can assert the strong answer and CI is green.
- The [posture doc](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/docs/evr-infosec-nis2-posture.md)'s own S2 hazard -- "self-classifying *out* of a control under schedule pressure" -- has a sibling here: **self-classifying *into* a control you haven't implemented.** The board-review dashboard will aggregate these self-assertions; if they are unverified, the dashboard launders intent into apparent compliance. For an essential entity that is an Art. 20 board-accountability risk, not a cosmetic one.

This is a v1 convention and I am **not** asking for a verification engine in this PR. I am asking that the document and schema be honest that v1 declarations are *claims pending evidence*, and that the highest-stakes SEC fields point at the evidence artefact (drill ticket, SBOM URL, exception-register entry) rather than asserting a bare boolean. The schema comment already foreshadows "structured (test_id, dashboard_url) deferred to v2" -- good, but the SEC cluster is where the v1/v2 gap is most dangerous.

**Crypto note (SEC-9):** `key_custody: cloudflare-managed` is a free string. [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md) (Proposed) makes key custody a *recorded decision per classification* with an INF-2 exit interaction. A bare enum-less string can't be reconciled against the classification -- it should at least be constrained, and ideally cross-checked against `scope.security_level`.

## 4. The `security_level` ↔ `safety_related` axis -- [CONSENSUS] with Leveson

I read `scope.security_level` as the **infosec turvatase** (765/1 K/T/S → L/M/H, confidentiality/integrity/availability). Leveson reads the *risk of conflation* with safety classification. The schema gets this **right and deserves explicit credit**: `security_level` and `safety_related` are two separate fields, and both the schema description and the template comment state, in terms, that they are independent and measure different risks ("a system can be High security + non-safety, or Low security + safety-related"). That is precisely the dangerous conflation avoided. [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md) keeps SEC-6 (EN 50716 safety boundary) distinct from SEC-11 (classification); this schema honours that separation.

My one caution for Leveson and Booch jointly: the *single* `safety_related: boolean` is a binary, whereas EN 50716 safety is a SIL spectrum. A boolean is the right v1 trigger ("triggers SEC-6 review"), but the dashboard must not let `safety_related: false` *read as* "safety-assessed and cleared." Same self-certification hazard as §3, applied to the safety axis -- flagging it so we don't conflate "field is false" with "safety was evaluated."

## 5. The unwired `security_level` filter -- NOT a gap

Per my brief and confirmed against the docs: the per-row security-level filter (only flag a chapter when its minimum turvatase ≤ the system's `security_level`) is **intentionally deferred** -- the `NFR_CONVENTION.md` in [dev-toolkit](https://github.com/Eesti-Raudtee/dev-toolkit) "Security-level filter (pending)" note and the schema comment both say it lands with the updated EVR catalogue, and the dashboard's "missing" column is explicitly informational until then. I treat this as **blocked on the updated catalogue, not missing.** I do **not** raise an omitted SEC chapter as a defect. The convention handles this honestly and I have no action here.

One small correctness flag for the authors, not a gate: the schema description and template both spell out the L/M/H ↔ max(K,T,S) thresholds and cite *protokoll 765/1, 2024-05-06*. That arithmetic is asserted from the kord; since 765/1 itself is not in any repo, label it as bound-from-765/1 rather than authoritative here, consistent with the [GAP] discipline.

## 6. ACTION items (security lens)

[ACTION-1] (HIGH) Make the document and schema state plainly that **v1 SEC declarations are self-asserted claims, not verified evidence**, and that the aggregated dashboard must surface them as such. The Art. 20 board-accountability framing makes "looks compliant" actively harmful if it isn't.

[ACTION-2] (HIGH) For the highest-stakes SEC fields -- `restore_drill`, `sbom`, `ir_readiness`, `patch_sla` -- shift from process-assertion to **evidence-or-result**: e.g. `restore_drill` records the *last drill date + pass/fail* (the drill result is the evidence, per SEC-8 Proposed), `patch_sla` records measured *conformance* not the policy text (per [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md)'s FND-6 "SLA conformance" delta). At minimum, require these point at an evidence artefact in `verification` / `notes`.

[ACTION-3] (MEDIUM) Constrain `key_custody` to a controlled vocabulary (cloudflare-managed | customer-held | byok) and note it must be recorded *against* `scope.security_level` (SEC-9 Proposed). A free string can't be reconciled to classification.

[ACTION-4] (MEDIUM) Add a one-line caveat in `NFR_CONVENTION.md` in [dev-toolkit](https://github.com/Eesti-Raudtee/dev-toolkit) that the SEC chapter's bindings (SEC-7..SEC-11, INF-4 reword) are **Proposed under [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md), not ratified** -- so teams filling this in today don't treat draft principles as binding obligations, and so the field set can change when [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md) is ratified (it explicitly says these become catalogue rows on ratification).

[ACTION-5] (LOW) Label the 765/1 turvatase arithmetic and the patch-SLA numbers as bound-from-source (765/1, Haavatavuste halduse protseduur) rather than authoritative-in-repo, consistent with [GAP].

## 7. Positive observations (these matter)

- The whole mechanism -- declare → CI-validate → aggregate to board dashboard -- is the right architecture for Art. 21(f) effectiveness evidence. It is a real upgrade over Confluence prose.
- The SEC-8 backup chapter captures *exactly* the two [ADR-011](https://github.com/Eesti-Raudtee/Arhitecture/blob/master/principles/adr-011-nis2-security-compliance-cluster.md) deltas (immutable copy + rehearsed restore) and states the right doctrine.
- The `security_level` / `safety_related` independence is modelled correctly and explicitly -- the dangerous infosec↔safety conflation is avoided by design. Credit to the authors and a clean [CONSENSUS] with Leveson.
- SBOM and key-custody, the two genuine net-new controls, are both surfaced as first-class fields.
- The pending security-level filter is handled with intellectual honesty -- informational "missing" column, no false-defect signalling. That restraint is correct.

Net: **approve in direction, with HIGH actions ACTION-1/ACTION-2 before this becomes the org-wide default that new apps inherit.** The risk is not the schema shape (Booch's call) -- it is that a self-asserted YAML string aggregated to a board dashboard can manufacture the appearance of Art. 21 compliance for an essential entity. Fix the honesty-of-evidence framing and the strongest SEC fields, and this is a strong, ratifiable-direction convention.
