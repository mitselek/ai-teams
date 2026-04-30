# Hello-world corp pipeline harvest — provenance for the EVR konteinerite standard

**Date:** 2026-04-30  
**Author:** Finn (research coordinator, framework-research)  
**Status (as of 2026-04-30 14:15):** Harvest informed PO's 4 confirms and Brunel's 3 drafts. Doc retained as **provenance** for Stage-2 reviewers — answers the "why ITOps, why TPS, why mirror Linux standard" questions that the drafts themselves do not justify inline.

## Outcomes (post-harvest convergences)

| Decision | Confirmed value | Provenance section |
|---|---|---|
| Eventual Stage-2 home | ITOps Confluence space `I` (peer to Linux + BYOD standards) | §3, §5 below |
| Tracking issue Jira project | **TPS** (ITOps), board 90 | §4 below |
| Standard title | "EVR sisene konteinerite standard" | §5 below (mirrors `EVR sisene <X> standard`) |
| Stage-0 publish location | V2 space, top-level sibling (option a) | §V2 below |
| Mirror target | "EVR sisene Linux standard" page `1335984130` | §5 below |

## Brunel's drafts (downstream artifacts)

- `evr-sisene-konteinerite-standard-v0.1.md`
- `evr-konteinerite-intake-template-v0.1.md`
- `evr-konteinerite-tracking-issue.md`

## Open questions surfaced by harvest, still pending

- **Tier 0/1/2 mapping** — Brunel inverted ordering vs original brief; matches Linux-standard convention (§5 below). Pending PO confirm.
- **Monitoring tool** — Linux standard hedges (Prometheus/Zabbix/PRTG candidates, "kaalume alternatiive"). Brunel's container standard inherits the same hedge. Pending org-level decision outside this team.

---

## §1 — RFC #2 (`Eesti-Raudtee/hello-world-container` PR #2)

- Title: "RFC: Full PoC review — container + tunnel + SSH + CI/CD"
- URL: <https://github.com/Eesti-Raudtee/hello-world-container/pull/2>
- State: OPEN, do-not-merge by design (review-base is empty branch for full-diff review). 1/2 reviewers approved (valerikevr 2026-04-08); deniss-labunets pending.
- **RACI contract** (4 unchecked roles in PR body): IT / Cloudflare admin (tunnel, DNS, Access policy); Sysops / Infra (runner, Swarm, registry); Tech lead (architecture approval); Developer (workflow confirmation). These four columns are the deployment-role contract Brunel formalised in the standard's RACI section.

## §2 — `hello-world-container` v1.2.0 (commit `14be25d`)

- 8 files: `Dockerfile`, `docker-compose.yml`, `entrypoint.sh`, `server.js`, `.gitignore`, `.github/workflows/deploy.yml`, `README.md` (8.8KB), `docs/WALKTHROUGH.md` (15.7KB).
- Architecture: Node app + cloudflared sidecar on Docker Swarm; CI/CD via self-hosted GitHub Actions runner on the Swarm host; tunnel token = versioned Swarm secret (per commit SHA, GC'd); SSH pubkey injected at runtime via env. No host ports exposed.
- README + WALKTHROUGH together cover ~80% of the technical content the standard needs. Standard fills the remaining 20%: governance, RACI, intake workflow, ET narrative, tier classification.
- **Caveat:** `docs/DEPLOYMENT-ROLES.md` is referenced by the PR but does NOT exist at tag `v1.2.0` (post-tag commit). Brunel pulled the RACI from the PR body, not the tag.

## §3 — Confluence DevOps space (eventual Stage-2 home — NOT used as Stage-2 home)

- Space: `DevOps` (id `1024622599`, type `knowledge_base`, created 2025-07-25).
- 4 pages total: GitLab tootekataloog (homepage + child) + 2 untouched Atlassian templates.
- Shape = product-catalog (page-per-product, ET-only, emoji H1s, table-heavy). NOT runbook-shaped.
- **Provenance for the "Stage-2 home = ITOps space `I`, NOT DevOps space" decision:** DevOps space is essentially empty + wrong shape for a procedure standard. ITOps space already hosts the structurally-similar Linux + BYOD standards.

## §4 — Jira project for tracking issue

| Rank | Key | Name | Result |
|---|---|---|---|
| Primary | **TPS** | ITOps | **PO confirmed** (board 90) |
| Backup | IT | IT osakond | unused |
| Alternative | IB | Infra Beacon | unused |

Excluded: ITSD (service-desk shape), AD (data ops), VL (out of scope per brief).

Rationale (preserved for Stage-2): ITOps owns the peer Confluence standards in space `I`; placing the tracker in TPS aligns the Jira-tracked rollout with the Confluence-published standard.

## §5 — Mirror target: "EVR sisene Linux standard"

- Page id: `1335984130` (ITOps space `I`, Roland Kilusk, last modified 2025-12-15).
- URL: <https://eestiraudtee.atlassian.net/wiki/spaces/I/pages/1335984130/EVR+sisene+Linux+standard>

### Structural fingerprint Brunel mirrored

- **Title pattern:** `EVR sisene <X> standard` → "EVR sisene konteinerite standard".
- **Frontmatter:** none. Opens with 1–2-paragraph scope statement + exception clause ("Kindlate erandite tegemine […] tuleb kõik dokumenteerida").
- **Tier model:** inline 3-tier list (`Tier 0 - KRIITILINE`, `Tier 1 - KESKMINE`, `Tier 2 - MADAL`) before section headers. **Brunel's container standard inherits this convention; the Tier mapping numerals were inverted vs the original brief to match — pending PO confirm.**
- **Section headers (ET, H2):** Baasturvalisus ja põhimõtted / Identiteedi ja ligipääsu haldus (IAM/PAM) / Monitooring / Logimine / Tööprotsesside automatiseerimine.
- **Language:** ET-only prose with English product nouns (`Oracle Linux`, `STIG`, `SELinux`, `Prometheus`, `Zabbix`, `Ansible`, `Azure Arc`) inline. No parallel EN block.
- **Length:** ~700 words / ~30 lines body. Compact, scope-and-direction, NOT procedure manual. Explicitly admits open items ("info lisamisel…", "kaalume alternatiive") — same pattern Brunel inherited for the monitoring-tool hedge.
- **Audience:** sysops who already know the named tools; standard sets policy and links out, does not explain concepts.

Secondary precedent: "BYOD isikliku seadme standard" (page `199557132`, same space, same single-ET pattern).

---

## §V2 — Stage-0 publish location

PO confirmed: **V2 space, top-level sibling (option a).**

- V2 space: id `1115095052`, key `V2`, name "VJS 2", type `collaboration`, created 2025-10-02 by Laura Voolain, owner Ruth Türk. Homepage id `1115095364`.
- 8 top-level children before the Proposal: Project Overview / Project Documents / Project Requirements / Meeting notes in space / Materjalid varasemastest kaardistustest ja analüüsidest + 3 untouched Atlassian default templates (Project plan / Decision documentation / Meeting notes).
- Banner recommended on the Proposal page: "Proposal — pending org adoption".

> Disambiguation note for future readers: V2 (`1115095052`, collaboration, project space) is NOT VJS2 (`84180996`, global, legacy product space). Names are confusingly close.

(*FR:Finn*)
