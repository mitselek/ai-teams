# Audit — EVR sisene konteinerite standard v0.1 (Stage-0 publish-readiness)

**Date:** 2026-04-30
**Auditor:** Medici (knowledge-health, framework-research)
**Scope:** Independent quality check of 3 Brunel drafts + Finn's harvest as input baseline.

**Artifacts audited:**

- `evr-sisene-konteinerite-standard-v0.1.md` (Brunel)
- `evr-konteinerite-intake-template-v0.1.md` (Brunel)
- `evr-konteinerite-tracking-issue.md` (Brunel)
- `hello-world-corp-pipeline-harvest-2026-04-30.md` (Finn — input baseline, not under audit)

---

## Verdict

**Publish-ready with 4 minor edits.**

The 3 drafts are coherent with each other, faithfully mirror the Linux standard's structural fingerprint, propagate Finn's harvest findings cleanly, and meet all hard structural requirements (3-tier model, 4-role RACI, exception clause, single-ET prose, ITOps space target, 9-field intake, measurable acceptance criteria). No red findings. No cross-doc contradictions. Drift items are cosmetic or minor framing.

---

## Findings (severity-ordered)

### GREEN — verified consistent

- **G1.** Tier definitions consistent across standard (lines 13-15) and intake (lines 27-29). Tracking uses tier names only (line 26) — no contradiction.
- **G2.** 4-role RACI consistent across all 4 docs. Harvest (line 27), standard (lines 49-52), tracking (line 28), intake (closing-flow step 4). Same role names: IT/Cloudflare admin, Sysops/Infra, Tech lead, Developer.
- **G3.** TBD placeholder pattern consistent — "TBD — Stage 1 käigus identifitseeritav" used uniformly in standard (lines 43, 50, 54), intake (lines 3, 94), tracking criterion 1 (line 65).
- **G4.** Cross-references valid — V2 space id `1115095052` (tracking line 47), ITOps space `I` (standard line 1, tracking lines 21/55/67/75), Linux standard page id `1335984130` (tracking line 75), TPS board 90 (tracking line 3), Roland Kilusk (tracking line 54), Ruth Türk (tracking lines 4/51), RFC #2 (tracking lines 57-59 → `Eesti-Raudtee/hello-world-container` PR #2). All match Finn's harvest.
- **G5.** Banner text consistent — standard preamble (line 1) and tracking criterion 3 (line 67) describe identical post-Stage-2 outcome (move to `I`, v1.0, banner removed).
- **G6.** Standard mirrors Linux standard's structural fingerprint faithfully — title `EVR sisene <X> standard`, no frontmatter, opening scope statement with exception clause, H2 sections (Baasturvalisus, IAM/PAM, Monitooring, Logimine, Automatiseerimine), single H4 sub ("Uute konteinerite juurutus" mirrors "Uute masinate juurutus"). Section names adapted appropriately for container domain.
- **G7.** Single-ET prose with EN product nouns inline confirmed — `Docker Swarm`, `Cloudflare Tunnel`, `STIG`, `CIS`, `Delinea Secret Server`, `Prometheus`, `cloudflared access ssh` etc. embedded in Estonian sentences. No parallel EN block.
- **G8.** Exception clause present in preamble (standard line 5) — adapted from Finn's recommended Linux-standard pattern (harvest line 165), with concrete enumeration of what to document (deviation, why, alternatives, security risks, owner, expected lifetime).
- **G9.** 9-field intake form complete; closing flow is 4 accurate steps (file → review → provision → close-with-RACI, lines 92-97).
- **G10.** Apex-research example concrete and consistent throughout intake fields 1, 2, 4, 6, 7, 8, 9 — aligns with harvest's `apex-research.dev.evr.ee` and `ssh-apex-research.dev.evr.ee` references.
- **G11.** Tracking acceptance criteria all measurable (line 65-68): 4 checkboxes, each verifiable (named team / configured assignee / page moved to `I` v1.0 / RFC #2 review closed).
- **G12.** Stage-1 3-step ask of Ruth (tracking lines 51-55) is operationally clear: review → escalate to ITOps via Roland Kilusk's chain → identify receiving subteam.
- **G13.** RFC #2 bridge text accurate — closing the tracking issue closes RFC #2 by review status; PR remains open with `do not merge` label per its design (harvest line 17 confirms).
- **G14.** Scope in/out lists in tracking (lines 25-37) are crisp and well-bounded — 6-in (tier model, baseline, IAM/PAM, monitor/log, automation, RACI, intake form, exceptions); 4-out (full Kubernetes, VM migration, CF licensing, app-level code quality).
- **G15.** Internal severity logic consistent — "keelatud / soovimatu / soovituslik / aktsepteeritav" gradation tracks tier severity uniformly across standard sections.

### YELLOW — minor, recommend fix before publish

- **Y1. ET typo in standard line 35** — `stdere-i` should be `stderr-i`. Evidence: `evr-sisene-konteinerite-standard-v0.1.md:35` ("sshd logid suunatakse `-e` lipuga stdere-i"). Mechanical typo, missing `r`.
- **Y2. ET grammar in standard line 50** — `lokaalne registr` should be `lokaalne register` (or context-appropriate `lokaalse registri`). Evidence: `evr-sisene-konteinerite-standard-v0.1.md:50` (Sysops/Infra row). Estonian noun missing final vowel.
- **Y3. EN word in intake field 3 label** — `Sensitivity tier (0/1/2)` mixes EN ("Sensitivity") into otherwise pure-ET field labels. Evidence: `evr-konteinerite-intake-template-v0.1.md:23`. Recommend `Tier (kriitilisuse tase)` or `Kriitilisuse tase (0/1/2)` to align with standard line 11 framing ("Jälgime 3-tieri süsteemi") which frames tier as criticality, not sensitivity.
- **Y4. Word count slightly over harvest target** — standard is ~1015 words vs. Finn's observed Linux-standard ~700 (harvest line 163). 45% over. Acceptable given the container domain has more moving parts (Swarm secrets, registry, runner, tunnel), but Brunel could trim the Baasturvalisus paragraph (lines 19-21) — the kuvand-detail bullets are the densest content and overlap with WALKTHROUGH.md (which the standard was supposed to delegate to per harvest line 164). Optional.

### Drift / framing — non-blocking

- **D1. Citation accuracy for DEPLOYMENT-ROLES.md** — standard line 45 cites "`Eesti-Raudtee/hello-world-container` PR #2 (`docs/DEPLOYMENT-ROLES.md`)". Finn flagged (harvest line 73) that the file does NOT appear in v1.2.0 tag's filesystem; the RACI table currently lives only in the open PR's narrative description. The cite reads as if pointing to a stable file. Suggest softening to "`Eesti-Raudtee/hello-world-container` PR #2 narratiivne RACI tabel (kavandatav fail `docs/DEPLOYMENT-ROLES.md`)" or similar. Minor — the citation is directionally correct.
- **D2. Tier 2 deviation framing could mislead** — standard line 15 says "Standardist kõrvalekaldumine on Tier 2-s aktsepteeritav, kui see on dokumenteeritud". As written, this could be read as "Tier 2 can opt out of the standard entirely". Brunel's intent is clearly "Tier 2 has relaxed RACI/monitoring per its tier description, but the intake form is still mandatory". One additional clause would close the gap: "(intake-vorm on siiski kohustuslik)".
- **D3. Stage-1 step 3 is the outcome, not Ruth's action** — tracking lines 51-55 list 3 numbered items, but step 3 describes the post-acceptance result ("kui ITOps võtab vastu, liigub leht..."), not something Ruth does. Reads cleaner as "Ruth's actions: 1+2; outcome: 3". Cosmetic.
- **D4. Per-intake approval audit trail not specified** — Finn's harvest item (e) on governance flagged "what gets logged". The tracking issue is the audit trail for the standard's adoption itself, but the intake form/standard don't specify whether each future intake approval is logged in Jira (TPS) or anywhere else. Probably implicit (each intake = a Jira issue with audit history), but not stated. Defer to Stage-1 if PO wants tightening.

### RED — blockers for publish

**None.**

---

## Drift detection — Finn's harvest items NOT in Brunel's drafts

- **Item (e) governance/logging** (harvest line 81) — only partially propagated. Approval-side governance (ITOps signs off on exceptions) is in standard. Logging-side ("what gets logged") is implicit, not explicit. → D4 above.
- **All other harvest items propagated cleanly:** RACI ✓, intake workflow ✓, ET prose ✓, tier model ✓, exception clause verbatim from Linux standard ✓, ITOps space `I` as eventual home ✓, mirror structure of Linux standard ✓.

---

## Recommended action

**Apply Y1 + Y2 + Y3 + D2 (one-clause clarification) before Stage-0 publish.** These are 4 mechanical edits, ~5 min for Brunel. Y4, D1, D3, D4 are optional polish — defer to Stage-1 review or PO discretion.

After those 4 edits, drafts are publish-ready for V2 Confluence space.

(*FR:Medici*)

---

# Re-audit pass — 2026-04-30 15:30

**Trigger:** team-lead requested re-audit after substantive content changes since pass 1. Time budget ~15-20 min.

**Changes since pass 1 (from team-lead brief):**

1. Pass-1 fixes applied (Y1 stderr, Y2 register, Y3 Kriitilisuse tase, D2 Tier 2 parenthetical) — verified.
2. `[speculative]` markers added — actual count 25 across 3 files (19 standard / 4 intake / 2 tracking; brief estimated 17 — Brunel may have added more after the brief).
3. Intake field 6 split into 6 (HTTP/dashboard with DNS+port+exposure), 6b (interactive shell), 6c (auth-mechanism per channel). 9 → 11 fields.
4. EntraID anchor (Microsoft Azure AD) substituted for WSO2 throughout standard + intake. Confluence cite: FSM page `536248326` `UAM - SSO and EntraID User Provisioning`.
5. Standard IAM/PAM section split into "Interaktiivne shell-ligipääs" + "Avalikustatud web-UI / dashboard" channels.
6. Apex-team worked example added to intake template — Tier 1 calibration, dashboard at `dashboard.apex-research.dev.evr.ee`, SSH at `ssh-apex-research.dev.evr.ee`, acceptance criteria encode migration off `100.96.54.170:5173/2222`.
7. VL/Vestluslahendus refs stripped, replaced with VJS2 framing.

## Re-audit verdict

**Publish-ready with 6 minor issues.** No new RED, no contradictions introduced. Pass-1 GREEN findings still hold. New content (channel-split IAM/PAM, EntraID anchor, apex worked example) is coherent, well-cited, and faithfully reflects EVR's actual SSO practice. Speculative-marker discipline is honest but slightly over-applied — the standard reads as a heavy proposal with many caveats rather than a confident draft. Word count nearly doubled (~1015 → ~1448 standard) due to inline speculative prose; this is acceptable for Stage-0 but speculatives must be resolved and removed before v1.0.

## Re-verified GREEN (pass-1 findings still hold)

- **G1 (tier defs)** still consistent across standard / intake / tracking.
- **G2 (4-role RACI)** unchanged, still consistent.
- **G3 (TBD placeholders)** unchanged, still consistent.
- **G4 (cross-refs)** all still valid; new EntraID cite (FSM `536248326`) added consistently to standard line 33 + intake line 75.
- **G5 (banner)** unchanged on standard line 1, tracking line 67.
- **G6-G8 (structural mirror, ET prose, exception clause)** still good.
- **G11-G14 (acceptance criteria measurable, Stage-1 ask clear, RFC #2 bridge accurate, scope crisp)** still good.
- **Pass-1 Y1/Y2/Y3/D2 fixes verified applied** — `stderr-i` (line 44), `lokaalne register` (line 60), `Kriitilisuse tase` (intake line 23), `(intake-vorm on siiski kohustuslik)` (line 15).
- **VL leakage:** zero hits across all 3 docs (`grep VL|Vestlus|vestlus` clean). Brief's strip is complete.

## New GREEN findings (changes made since pass 1)

- **NG1.** Channel-split IAM/PAM is sensible — shell vs. web-UI are genuinely different auth surfaces (key-based public-key infra vs. user-facing SSO). Cloudflare-Access-as-stopgap framed clearly: "**Cloudflare Access** ... aktsepteeritav vahepealne lahendus, kui EntraID-rakenduse seadistus ei ole jõudnud valmis, aga see ei ole pikemaks." (`evr-sisene-konteinerite-standard-v0.1.md:33`). Direction clear.
- **NG2.** EntraID anchor cited correctly in both standard (line 33) and intake (line 75) — same FSM `536248326` page. ServiceNow / Delinea / FSM listed as peer EVR services using the same SSO. Anchor is solid.
- **NG3.** Apex-team Tier 1 calibration is sound. Standard's Tier 1 description on line 14 explicitly names "apex-research" as a Tier 1 example; apex-team's 8-month lifetime + multi-operator team dependency clearly fail Tier 2's ≤4-week / single-developer-PoC tests. Brunel's reasoning matches standard's published examples. Speculative caveat at intake line 129 is appropriate hedging.
- **NG4.** Apex-team worked example is internally complete — covers all 11 fields (1, 2, 3, 4, 5, 6, 6b, 6c, 7, 8, 9), each cell concrete and consistent with the field-set above. Acceptance criteria are 5 measurable bullets with the `:5173` migration encoded as a final must-decommission/migrate condition.
- **NG5.** Field 6/6b/6c subdivision is coherent — web service + shell channel + per-channel auth are distinct concerns, cleanly separated. Forward reference from 6 to 6c ("autentimismehhanism välja 6c") works.

## YELLOW — new issues from re-audit

- **NY1. VJS2 vs. V2 team-name ambiguity.** Tracking line 19/74 + intake line 15/117 use "VJS2 meeskond (juht: Ruth Türk)". Per Finn's harvest superseded note (line 184), **VJS2** = legacy product space (original VJS team), **V2** = "VJS 2" (with space) = Ruth's collaboration space (id `1115095052`). Calling Ruth's team "VJS2 meeskond" (no space) reads as the legacy team. Recommend "V2 meeskond" or "VJS 2 meeskond" (with space) to disambiguate. **PO confirmation needed** — this is a deliberate naming choice by Brunel after VL strip, but may mislead Ruth or ITOps reviewers.
  - Evidence: `evr-konteinerite-tracking-issue.md:19,74`, `evr-konteinerite-intake-template-v0.1.md:15,117`. Cross-check: tracking line 47 correctly says "V2 (VJS 2) Confluence ruumi" but the team-name usage elsewhere drops the space.

- **NY2. Speculative-marker over-application** (3 sub-cases).
  - **NY2a.** Standard line 11 parent marker already qualifies all 3 tier definitions as Brunel-proposed. Markers on lines 13, 14, 15 are redundant with line 11's "tier-ide *sisuline kohandus*" caveat. Remove individual tier markers OR remove parent marker — pick one.
  - **NY2b.** Standard lines 21-23: `:latest` ban + `--privileged` ban (line 25) are CIS Docker Benchmark explicit recommendations, not Brunel speculation. Marking as speculative dilutes the signal of genuinely speculative items. Suggest unmarking these (or referencing CIS as the source rather than calling them speculative).
  - **NY2c.** Total 19 markers on a ~1448-word standard = ~1 marker per 76 words, which makes the document read as a heavy hedged proposal. After ITOps Stage-1 review, speculatives must be resolved and removed before v1.0 — flag as explicit Stage-1 deliverable.

- **NY3. Field 6c auth-mechanism options gap.** The 4 listed options (EntraID, CF Access, mTLS, Open) cover human-facing UIs and pure M2M. **Missing:** programmatic API consumption with bearer/API tokens (e.g., internal scripts hitting an apex-research API with a static token). Field 6 explicitly mentions "API endpoint" as a candidate service. Recommend adding "API token / bearer token (Tier 2 only, dokumenteeritud)" OR a note that programmatic API access uses mTLS by default. Evidence: `evr-konteinerite-intake-template-v0.1.md:73-82`.

- **NY4. Field 8 "Vali üks" doesn't accommodate hybrid secret routing shown in apex example.** Field 8 is single-select; apex example (line 126) splits secrets across GitHub Secrets (CLIENT_ID, TENANT_ID, tunnel token, SSH keys) AND Delinea (CLIENT_SECRET via GitHub Actions secret reference). This is the right real-world pattern but contradicts the field's "choose one" framing. Recommend changing field 8 to multi-select OR adding "kombinatsioon (täpsusta jaotus)" option.

- **NY5. INFOSEC page `851607559` (Delinea) cited in brief but not in drafts.** Standard line 36 mentions "keskse PAM-i (Delinea Secret Server)" without a link; intake line 126 mentions "Delinea Secret Server-isse" without a link. The EntraID anchor cites FSM `536248326`; for consistency with the cite-your-source pattern, recommend adding the INFOSEC `851607559` cite next to Delinea references in standard line 36 and intake line 126.

- **NY6. Field 6 + 6c interaction undefined for VPN-only services.** Field 6 lists "VPN" as an exposure scope (HTTP-level network access), and 6c specifies HTTP-level auth. If a service is VPN-only (no CF Tunnel), is 6c still applicable? Reading suggests no (VPN itself is the auth tier for that scope), but the form doesn't say. One sentence: "Kui Avatuse ulatus = Sisevõrk või VPN, võib autentimismehhanism (6c) olla rakenduse-tasandi (mitte tunneli-tasandi); märgi N/A kui rakenduse autentimine pole vajalik." would close the gap.

## Drift / framing — non-blocking

- **ND1.** Standard line 9: typo "kas seda lukustada ainsa lubatud orkestraatori **ehk** võimaldada laiem ring" — `ehk` reads as "or rather / i.e."; intended sense is alternation, should be **või** ("or"). Mechanical typo.
- **ND2.** Standard line 19: trailing period missing before the bullet list begins ("(Tier 2 aktsepteeritav)" → no period → bullet list). Same paragraph: bullets on lines 21-23 mix `[speculative]` markers with bullet content awkwardly. Bullet structure after the speculative-marker pass is rough — consider lifting the `[speculative]` markers out as footnote-style annotations rather than mid-bullet inserts.
- **ND3.** Standard line 33 IAM/PAM section uses **bold inline labels** ("**Interaktiivne shell-ligipääs:**" / "**Avalikustatud web-UI / dashboard:**") rather than H3/H4 sub-headings. Linux standard's mirror pattern (per Finn's harvest line 156) uses H4 sub-sections. Cosmetic — bold labels keep the doc compact, but slightly diverges from the structural mirror. Defer to PO/Brunel preference.
- **ND4.** Standard line 40: backticks around the English word `native` (`Docker Swarm-i 'native' 'healthcheck'-i`) — `native` isn't a code identifier, just an English word in Estonian prose. Drop backticks.
- **ND5.** Standard line 15 Tier 2 lifetime clarification ("Samuti on algusest peale kokku lepitud konteineri eluiga, mille lõppedes ta kas kustutatakse või edutatakse Tier 1") is good — adds explicit lifetime-end disposition. New, not from pass 1. GREEN-leaning but worth noting it expands the Tier 2 contract.
- **ND6.** Word count growth (standard: ~1015 → ~1448, +43%) is mostly inline speculative prose. Once Stage-1 ITOps confirms or rejects speculative claims, the markers and their parenthetical text can be stripped, dropping word count back toward Linux-standard's ~700. **Pre-v1.0 deliverable:** resolve all 19 speculative markers in standard.

## RED — blockers

**None.**

## Recommended action

Stage-0 publish can proceed. Apply NY1 (team-name disambiguation, but only after PO call) + NY2 (consolidate over-applied speculative markers) + NY5 (Delinea citation) before publish if Brunel has 5-10 min. NY3 + NY4 + NY6 are intake-form refinements that can wait for first-real-use feedback. ND items are cosmetic.

**Pre-v1.0 (Stage-2) deliverable:** all 19 standard speculative markers resolved (confirmed → removed, or rejected → deleted). Stage-1 ITOps review is the natural decision point.

(*FR:Medici*)
