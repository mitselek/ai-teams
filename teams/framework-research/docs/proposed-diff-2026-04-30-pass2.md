# Proposed diff — Pass 2 (2026-04-30)

**Status:** Proposal only — review-first per PO direction. No live edits applied. After PO greenlights individual NY/ND items, Brunel applies them in a single deliberate pass with re-read-before-edit discipline.

**Scope of this pass:** NY2 (speculative pruning) + NY5 (Delinea citation parity) + ND (cosmetics).

**Out of scope:**

- **NY1 (team-name framing) — RESOLVED by PO directly.** PO kept option (i) "VJS2 meeskond" approach. PO has also edited the live tracking issue's Eesmärk paragraph in parallel (resulting in `VJS 2 meeskond` with space appearing on line 19 — see ND8 below for the new spelling-inconsistency cosmetic this introduced).
- **Deferred to a later pass:** NY3 (API token field), NY4 (Field 8 multi-select), NY6 (Field 6/6c VPN interaction).

---

## NY2 — `[speculative]` marker pruning

Inventory of every `[speculative]` marker currently in the 3 files, with KEEP / REMOVE recommendation. Goal: cut markers down so the remaining ones carry actual signal.

**Note on count:** team-lead brief said "19 standard + 2 intake + 2 tracking". Actual count after re-reading: **16 standard + 4 intake + 2 tracking = 22 total**. Three of the standard's "speculative-tagged bullets" (lines 21-23) are sub-fragments of one paragraph that I formatted as a bullet list — they read as a single block; recommendation collapses them.

### Standard file (`evr-sisene-konteinerite-standard-v0.1.md`)

| # | Line | Subject | Keep / Remove | Rationale |
|---|------|---------|---------------|-----------|
| S01 | 9 | Orkestraator-keelud (Docker Swarm canonicalisation) | **KEEP** | EVR-tasandi tehnoloogia-lock-in is a real Stage-1 decision — not industry standard. |
| S02 | 11 | "Jälgime 3-tieri süsteemi" parent marker | **KEEP** (single-marker version) | The tier-system *adaptation* IS speculative. Acts as parent for S03/S04/S05 — collapse them. |
| S03 | 13 | Tier 0 KRIITILINE description | **REMOVE** | Redundant with S02 parent. |
| S04 | 14 | Tier 1 KESKMINE description | **REMOVE** | Redundant with S02 parent. |
| S05 | 15 | Tier 2 MADAL description | **REMOVE** | Redundant with S02 parent. |
| S06 | 17 | Section heading "Baasturvalisus ja konteineri kuvand" Linux-adapt note | **KEEP** | Section-name adaptation away from Linux standard's spine — Brunel inference, reviewers should see it. |
| S07 | 21 | Tier-jaotus saladuste-mehhanismile | **REMOVE** | Underlying claim ("no secrets baked into image") is industry-standard CIS Docker Benchmark; Tier-jaotus framing is minor. |
| S08 | 22 | Image-base list (`alpine`, `debian-slim`, `distroless`) | **REMOVE** | Industry standard ("minimal base image" recommendation) — anchored fact, not Brunel inference. |
| S09 | 23 | `:latest`-keeld | **REMOVE** | Industry-standard CIS Docker Benchmark item — not speculative. |
| S10 | 25 | `--privileged`-keeld + uid 1000 | **REMOVE** | Industry-standard CIS Docker Benchmark item — not speculative. |
| S11 | 25 (end) | Cloudflare Tunneli kohustuslikkus | **KEEP** | Org-tasandi mandate — Stage-1 ITOps may overrule (e.g., sisemine reverse-proxy). Real review point. |
| S12 | 33 | EntraID SSO mandate (with FSM cite) | **KEEP** | Big org-tasandi mandate, reviewers must validate the citation chain. |
| S13 | 35 | Secrets rotation ownership (tooteomanik vs ITOps) | **KEEP** | Real Stage-1 governance question. |
| S14 | 36 | Delinea / RBAC plan | **KEEP** | Linux-standard-lifted plan; conteineri-tasandi RBAC undefined. |
| S15 | 38 | Monitoring section whole-block marker | **KEEP** | Whole section is open per upstream Linux standard's "valimisel" status. |
| S16 | 44 | Logimise syslog mechanism | **KEEP** | Concrete log-driver/forwarder choice undefined; Stage-1 ITOps decides. |
| S17 | 45 | Tier 2 logimise auditi-vähendus | **REMOVE** | Reduced-scope claim follows directly from Tier-system parent (S02). |
| S18 | 49 | Commit-pealt-juurutuse Tier-eristus | **KEEP** | Tier-eristus is Brunel's calibration; bare commit-only-deploy is industry-standard. |
| S19 | 53 | Intake-form field-set | **KEEP** | Stage-1 ITOps may add/remove fields. |
| S20 | 55 | RACI table draft-state (RFC #2 review pending) | **KEEP** | Critical — entire RACI is upstream-pending. |

**Standard total: 16 → 10 (KEEP), 6 REMOVE.**

### Intake template (`evr-konteinerite-intake-template-v0.1.md`)

| # | Line | Subject | Keep / Remove | Rationale |
|---|------|---------|---------------|-----------|
| I01 | 23 | Field 3 "Kriitilisuse tase" inherits standard's tier markers | **REMOVE** | Standard's S02 parent already carries this; cross-document linkage is implicit via "vt standardi peatükis" reference. |
| I02 | 75 | Field 6c EntraID anchor + FSM citation | **KEEP** | Same big mandate as S12 — reviewers must validate it appears here too. |
| I03 | 107 | Field 9 acceptance-criteria checkpoint shape | **REMOVE** | "Konkreetne kogum sõltub teenusest" is a tautology, not speculation. |
| I04 | 129 | Apex-team Tier-1 calibration | **KEEP** | Brunel's calibration call — reviewers should see this is a judgment, not an anchored Tier value. |

**Intake total: 4 → 2 (KEEP), 2 REMOVE.**

### Tracking issue body (`evr-konteinerite-tracking-issue.md`)

| # | Line | Subject | Keep / Remove | Rationale |
|---|------|---------|---------------|-----------|
| T01 | 28 | RACI tabel scope-line (RFC #2 review pending) | **KEEP** | Critical upstream draft-state caveat. |
| T02 | 68 | Acceptance-criterion 4 (RFC #2 close-bridge) | **KEEP** | Bridge-logic is Brunel's interpretation of how this issue closes RFC #2 — Stage-1 may decouple. |

**Tracking total: 2 → 2 (KEEP), 0 REMOVE.**

### NY2 summary

| File | Before | After |
|---|---|---|
| Standard | 16 | 10 |
| Intake | 4 | 2 |
| Tracking | 2 | 2 |
| **Total** | **22** | **14** |

8 markers removed. Remaining 14 carry signal that Stage-1 reviewers should actually attend to.

---

## NY5 — Delinea citation parity with EntraID anchor

Currently the standard cites the FSM page (id `536248326`) for EntraID context but mentions Delinea Secret Server twice without a citation. Add INFOSEC page `851607559` Delinea citation in both loci to match the EntraID-anchor pattern. Same change in the intake-template's apex-team example row 8.

### Standard — line 36 (Cloudflare Access RBAC + Delinea note)

Before:

```text
Edaspidi on plaanis Cloudflare Access-i poliitikate haldus ja konteineri-tasandi RBAC liidestada keskse PAM-i (Delinea Secret Server) — info lisamisel `[speculative]` (Delinea-liidestuse plaan tõstetud Linux standardi IAM/PAM-sektsioonist; konteineri-tasandi RBAC-i kuju ei ole määratletud).
```

After:

```text
Edaspidi on plaanis Cloudflare Access-i poliitikate haldus ja konteineri-tasandi RBAC liidestada keskse PAM-i ([Delinea Secret Server](https://eestiraudtee.atlassian.net/wiki/spaces/INFOSEC/pages/851607559)) — info lisamisel `[speculative]` (Delinea-liidestuse plaan tõstetud Linux standardi IAM/PAM-sektsioonist; konteineri-tasandi RBAC-i kuju ei ole määratletud).
```

### Intake template — apex-team row 8 (Turvalise tagastuse kanal), line 126

Before:

```text
| **8. Turvalise tagastuse kanal** | **GitHub Secrets-i otse-seadistus** — vastuvõtja paneb `CLOUDFLARE_TUNNEL_TOKEN` (tunneli token), `SSH_PUBLIC_KEYS` (operaatorite võtmete loend) ning EntraID rakenduse `CLIENT_ID` + `TENANT_ID` repos otse. `CLIENT_SECRET` läheb Delinea Secret Server-isse, viidatud GitHub Actions secretiga. |
```

After:

```text
| **8. Turvalise tagastuse kanal** | **GitHub Secrets-i otse-seadistus** — vastuvõtja paneb `CLOUDFLARE_TUNNEL_TOKEN` (tunneli token), `SSH_PUBLIC_KEYS` (operaatorite võtmete loend) ning EntraID rakenduse `CLIENT_ID` + `TENANT_ID` repos otse. `CLIENT_SECRET` läheb [Delinea Secret Server](https://eestiraudtee.atlassian.net/wiki/spaces/INFOSEC/pages/851607559)-isse, viidatud GitHub Actions secretiga. |
```

**Note on intake-template Field 8 option list (line 98):** `EVR-sisene parooli-haldur (nt Delinea Secret Server, kui taotlejal on ligipääs)` — could also take the citation, but the option list reads as a brief enumeration; adding a hyperlink there changes the field's tone. **Brunel recommendation: leave the option-list mention as-is, cite only in narrative loci above (where readers expect citations).**

---

## ND — Cosmetic fixes

### ND1 — Author attribution syntax inconsistency

Two of the three files use `(*FR:Brunel*)` (bold), the third uses `(_FR:Brunel_)` (italic).

| File | Line | Before | After |
|---|---|---|---|
| `evr-konteinerite-tracking-issue.md` | 78 | `(_FR:Brunel_)` | `(*FR:Brunel*)` |

Rationale: matches the team's common-prompt format and the other two files.

### ND2 — Typo `nominaeritud`

Tracking issue line 65, acceptance-criteria checkbox 1.

Before:

```text
* [ ] **Vastuvõttev alamtiim ITOps-i sees on nominaeritud** ning kommunikeeritud (kas käesolevas issue-s kommentaarina või eraldi Confluence-i lehel)
```

After:

```text
* [ ] **Vastuvõttev alamtiim ITOps-i sees on nomineeritud** ning kommunikeeritud (kas käesolevas issue-s kommentaarina või eraldi Confluence-i lehel)
```

Rationale: ET typo; correct form is `nomineeritud`.

### ND3 — `neljarolline` → `neljaroleline`

Standard line 55.

Before:

```text
Standardisse kuulub ka neljarolline RACI tabel, mis on võetud üle ...
```

After:

```text
Standardisse kuulub ka neljaroleline RACI tabel, mis on võetud üle ...
```

Rationale: ET form for "four-role" — `roll` + `-line` adjectival ending → `neljaroleline`. (My v0.1 had `neljaroleline`; it was changed to the malformed `neljarolline` in a later edit pass — restoring.)

### ND4 — `Konteineri restartti` → `Konteineri restardil`

Intake template line 127, apex-team acceptance-criteria third bullet.

Before:

```text
• Konteineri restartti scratchpad-id (`teams/framework-research/memory/*.md`, `~/.claude/teams/...`) säilivad (volume-mount korrektne)
```

After:

```text
• Konteineri restardil scratchpad-id (`teams/framework-research/memory/*.md`, `~/.claude/teams/...`) säilivad (volume-mount korrektne)
```

Rationale: ET locative — "at restart" = `restardil`, not `restartti`.

### ND5 — `Swarm-i`native` `healthcheck`-i` extra inline-code wrap

Standard line 40.

Before:

```text
Konteinerite tervise monitooring toimub Docker Swarm-i `native` `healthcheck`-i kaudu — ...
```

After:

```text
Konteinerite tervise monitooring toimub Docker Swarm-i natiivse `healthcheck`-i kaudu — ...
```

Rationale: `native` was English in inline-code; mixing language and unnecessarily code-fenced. The whole sentence is ET, so use ET adjective `natiivse`.

### ND6 — `Otse-SSH avaliku porti kaudu` → `Otse-SSH avaliku pordi kaudu`

Intake template line 66, Field 6b option 4.

Before:

```text
* **Otse-SSH avaliku porti kaudu** — keelatud Tier 0/1 puhul; Tier 2 puhul lubatud erandina, vajab põhjendust
```

After:

```text
* **Otse-SSH avaliku pordi kaudu** — keelatud Tier 0/1 puhul; Tier 2 puhul lubatud erandina, vajab põhjendust
```

Rationale: ET genitive of `port` is `pordi`, not `porti`.

### ND7 — `agendite mälu` → `agentide mälu`

Intake template line 125, apex-team Field 7 row.

Before:

```text
| **7. Andmete klassifikatsioon** | **Sisemine.** Uurimis-scratchpadid, agendite mälu, agentide-vaheline komm. Ei ole klientide isikuandmeid ega ärisaladusi. |
```

After:

```text
| **7. Andmete klassifikatsioon** | **Sisemine.** Uurimis-scratchpadid, agentide mälu, agentide-vaheline komm. Ei ole klientide isikuandmeid ega ärisaladusi. |
```

Rationale: ET genitive plural of `agent` is `agentide`. `agendite` is malformed (missing `t`).

### ND8 — Team-name spelling consistency (NEW — surfaced by PO's parallel edits)

PO's earlier parallel edits introduced an inconsistency:

- Tracking issue line 19 (Eesmärk para): `**VJS 2 meeskond**` (with space)
- Tracking issue line 74 (Lisa info): `VJS2` (no space)
- Intake template line 15 (Field 1 example): `VJS2 meeskond` (no space)
- Intake template line 117 (apex-team row 1): `**VJS2 meeskond**` (no space)

**Brunel recommendation: pick one form and apply consistently across all 4 loci.** Since PO has explicitly chosen "option (i) — keep VJS2 meeskond", the consistent form should be `VJS2 meeskond` (no space) — which means line 19 of the tracking issue is the outlier and should be brought in line.

| File | Line | Before | After |
|---|---|---|---|
| `evr-konteinerite-tracking-issue.md` | 19 | `**VJS 2 meeskond**` | `**VJS2 meeskond**` |

Other 3 loci unchanged (already match `VJS2`).

**Alternative reading:** if PO's line-19 edit was deliberate (PO actually prefers `VJS 2` with space), the fix runs the other direction — change the 3 `VJS2` loci to `VJS 2`. Brunel cannot tell which was intended; flag for explicit confirmation. Recommendation pending PO confirmation.

---

## Application order if PO greenlights

If PO approves all of the above, Brunel applies in this order:

1. **NY2** — strip 8 markers (6 standard + 2 intake) per the table.
2. **NY5** — add 2 Delinea citations (1 standard + 1 intake).
3. **ND1-7** — apply 7 cosmetic fixes.
4. **ND8** — apply pending PO confirmation on which spelling is canonical.

Re-read each file fresh before each Edit call (file-collision discipline from earlier today). Single SendMessage report when all done.

(*FR:Brunel*)
