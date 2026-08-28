# Joosep Madar — profile brief for AI-team design

**Date:** 2026-08-28
**Subject:** Joosep Madar, Eesti Raudtee, stated role "release management"
**Purpose:** input to the design of a dedicated AI agent team + container (apex-research-shaped) for him
**Author:** (*FR:Aen* -- workflow synthesis)
**Method:** merge of 5 read-only source sweeps (apex-research stakeholder dashboard; Jira via Atlassian MCP; Confluence+Jira via Atlassian MCP; Eesti-Raudtee GitHub org via `gh`; local git clones), then **revised in a second pass** against an adversarial critic review and 4 targeted gap-fill sweeps. No system was modified in either pass.
**Status: REVISED 2026-08-28 — twelve claims corrected, one open question closed, three new ones opened. See §8 for the full change list.** Struck text is left visible with its correction rather than deleted.

**Source labels used below:** `[S1]` dashboard · `[S2]` Jira sweep · `[S3]` Confluence+Jira sweep · `[S4]` GitHub sweep · `[S5]` local clones.
**Revision labels (2026-08-28, second pass):** `[R1]` GitHub branch-by-branch re-enumeration (10 repos, 53 branches, direct API — not the search index) · `[R2]` Jira ITSD contract-renewal query · `[R3]` Valeri Kuzmin role investigation (Jira + Confluence) · `[R4]` Jira comment-axis sweep. See §8.

---

## 0. Headline (read this first)

Three findings dominate every design decision below and are stated up front because they change the shape of the deliverable:

1. **His engagement may already be over.** He is contracted on a *käsundusleping* (mandate contract), record 21734, **valid 28.07.2026–31.08.2026** — three days after this brief's date `[S3: ITSD-40047]`. Alongside/preceded by an internship 29.06.2026–28.08.2026 `[S3: ITSD-39397]`. **A targeted re-query found no renewal, extension, or offboarding ticket** in the ITSD HR-routing shape between 2026-08-01 and 2026-08-28 `[R2]` — absence of evidence, *not* confirmed non-renewal. **Counter-signal:** he was still committing code on **2026-08-28 08:46Z**, the day of this brief `[R1]`. Building a dedicated container for him without confirming renewal is still a live risk.
2. **The evidenced release-management remit is one ticket; the evidenced output is engineering.** VEO-98 (status *Evaluation*, no activity since 2026-07-21) is the entire release-management assignment found. His measured output is **21 of 27 live Jira issues** in E2E test automation `[S2]` and **67 GitHub commits across two repos** — 53 in `HES-integration-tests` (Nightwatch E2E) and 14 in `rumba` (a new SvelteKit/Cloudflare-Worker app) `[R1]`.
   - **[INFERENCE — corrected in revision]** The earlier phrasing *"release management is a task he holds, not a function he performs"* was stated as fact. It is an inference from absence, and the five sweeps **structurally cannot observe** release coordination done in meetings, email, or Teams (§7.2). A comment-axis Jira sweep `[R4]` found no participation either, but that query tests comment *text* for his name, not comment *authorship* — it is a weak instrument (see §8). Treat the claim as **unresolved**, leaning unevidenced.
3. **No release-gate artifacts exist under his name anywhere.** No git tags, no GitHub Releases, no CI workflows in `HES-integration-tests`, no release calendar, no approval checklist, no environment-promotion procedure `[S3] [S4] [R1]`. **[INFERENCE]** *"He is not gating deployments"* follows only if the gate would leave a digital trace in Jira/Confluence/GitHub — unverified.

---

## 1. Who he is

| Attribute | Value | Evidence |
|---|---|---|
| Name | Joosep Madar | all sources |
| Email | joosep.madar@evr.ee | `[S1] [S2] [S4]` |
| Atlassian accountId | `712020:9fc49d6c-35dc-44a3-a14e-af46c541d027` | `[S1] [S2]` |
| Second Atlassian account (apparently inactive, zero issues) | `712020:ea2680f2-2e47-4bb2-ac3b-600f5db98477` | `[S2]` |
| GitHub login | `JoosepM-565`, name "Joosep Madar" (user id 298247088), company `@Eesti-Raudtee`, Tallinn; account created **2026-06-30**, 0 public repos | `[S4]`, identity re-confirmed via `gh api users/JoosepM-565` `[R1]` |
| Employment form | Intern (*praktikant*), employee record 21719, internship 29.06.2026–28.08.2026 `[S3: ITSD-39397]`; *käsundusleping* record 21734, **28.07.2026–31.08.2026** `[S3: ITSD-40047]` | `[S3]` |
| Structural unit | **VJS2 grupp** — the contracting unit, stated in ITSD-40047's own summary: *"Käsunduslepingu sõlmib struktuurüksus: VJS2 grupp"*. Internship ticket places him in *"IT teenuste haldusosakond, VJS2 grupp"* | `[S3: ITSD-39397, ITSD-40047]` |
| Sponsor / manager | Ruth Türk (ruth.tyrk@evr.ee), VJS2 group head | `[S1] [S2] [S3]` |
| Security posture | Issued a FIDO2 hardware key (Yubikey USB-C + NFC) by ITOps | `[S3: Confluence page 698646563, space ITOps]` |

**~~Converted~~ — struck in revision.** The first pass said the internship was *"converted to"* a käsundusleping. ITSD-40047 says only *"Edastame praktikandiga käsunduslepingu sõlmimise info"* (notice that a mandate contract is being concluded with the intern). "Converted" was the brief's own inference and sits badly with its own dates: the internship (29.06–28.08) and the mandate contract (28.07–31.08) **overlap by a month**, which a conversion would not normally do. **Two concurrent instruments is at least as plausible a reading.** Both readings kept; neither evidenced. Corroborating detail: on **2026-08-25** he still described himself in his own ITSD ticket as *"praktikant"* — *"Õigused on väljastatud praktikant Joosep Madar"* `[R2: ITSD-40449]`.

**Role label contradiction — flagged, both kept.**
`[S1]` lists him on the apex-research stakeholder dashboard under **"IT teenistus"** with role label simply **"release management"**, no sub-group and no phone (unlike his IT-teenistus peers, who have both). `[S1]` itself marks his exact unit and formal title as **explicitly unconfirmed**, noting role-misclassification is a known 3-strike pattern in that corpus.
`[S3]` supplies the HR-ticket answer `[S3]` could not: *IT teenuste haldusosakond, VJS2 grupp*, as an intern/contractor.
These are reconcilable if "IT teenistus" is the parent service and "IT teenuste haldusosakond / VJS2 grupp" the nested unit — but note that VEO-98's own title says **"Haldusteenistuse"** (Administration Service), a *different* word from *IT teenuste haldusosakond*. `[S3]` flags this same ambiguity as unresolved.

**Narrowed in revision.** The first pass presented the unit question as wholly open. It is not: ITSD-40047's summary field names the contracting unit outright — **VJS2 grupp**. Only the **parent-service label above it** (*IT teenistus* vs *IT teenuste haldusosakond* vs *Haldusteenistus*) is genuinely unresolved. Note also that *"Haldusteenistuse"* in VEO-98's title describes the **subject of the release overview** (whose applications are being rolled up), not necessarily his own home unit.

**Absent:** phone number (not found in any sweep) `[S1]`. Formal job title as printed on a contract: absent everywhere. `[S5]` found zero occurrences of his name in any local clone.

**~~Documentation-invisible~~ — qualified in revision.** The first pass concluded he is invisible to Confluence because CQL `text ~ "Madar"` returns 0 of 0. That zero was reproduced — but **his own authored page 1928429583 also fails to appear in that same search, because CQL does not index drafts** `[critic]`. The zero-hit result is therefore at least partly a **search-scope artifact** and cannot carry an organizational conclusion on its own. What survives: no *published* Confluence page, RACI table, or org chart naming him was found.

---

## 2. What he does

### 2.1 The release-management remit — one ticket, still in Evaluation

- **VEO-98** *"Haldusteenistuse terviklik release management ülevaade rakenduste üleselt Jirast"* — Task (id 125344), project **VEO** (id 10554, display name "VJS2"), status **Evaluation** (category *In Progress*), resolution null, created 2026-07-06T10:33:57+0300, reporter **Ruth Türk** (ruth.tyrk@evr.ee), assignee **Joosep Madar** `[S1] [S2] [S3]`, every field re-verified `[critic]`.
- **It has been dormant for five weeks.** `updated = 2026-07-21T12:15:47` — zero activity since his single comment `[critic]`. State this plainly: the release-management assignment has not moved since July.
- Brief, verbatim: *"Uurida, kuidas koondada haldusteenistuse eri rakenduste release'id ühte automaatselt uuenevasse pilti juhtkonna jaoks, kus release'i staatus (töös / hilineb / valmis) tuleneb Jira andmetest ja arvestab, et tegelik release toimub GitHubis."* — investigate how to roll up release status (in progress / late / done) across applications into an auto-updating leadership picture, where Jira carries scope/business info and **the actual release happens in GitHub** `[S3]`.
- Current-state pain the ticket exists to fix, verbatim: *"Praegu tuleb release-koondpilt iga kord käsitsi kokku panna — soovime, et see tekiks olemasolevatest piletitest ja püsiks ise ajakohane."* — the roll-up is assembled by hand every single time `[S3]`.
- **Scope: 6 applications / 6 Jira projects, each with its own GitHub repo** — VJS1, VJS2, HES, FSM, PONY, D365 `[S2] [S3]`. In his own words: *"oleks vaja teha kõrgem leht mis kondab kokku 6 projekti (VJS1, VJS2, FSM, HES, D365, PONY), et anda juhtkonnale infot release-de kohta"* `[S2: ITSD-39812 comment, 2026-07-20]`.
- **Expected output as scoped by his manager:** short written analysis + proposed design + a small prototype (real Jira dashboard/timeline with sample data, or a visual mockup) + a list of data-hygiene preconditions; explicitly including investigation of the **GitHub-for-Jira** integration (issue keys in branch/commit/PR names feeding the dev panel and Release Hub back into Jira) `[S3: VEO-98 "Uurimissuunad" pt 2, "Oodatav väljund"]`.
- **Deliverables produced (2026-07-21):**
  - A live **Jira Plans (Advanced Roadmaps) timeline named "Juhtkonnale"** (For Management) — `plans/1331/scenarios/1334/timeline?vid=1487` `[S1] [S2] [S3]`.
  - A **Confluence draft**, page id **1928429583**, *"Andmete ühtluse ja puhtuse soovitused – kuue projekti plaan (Jira Timeline)"* `[S3]`. **Still in DRAFT status** (confirmed), filed under parent page 486179010 (*"FSM kodu"*, the FSM space home — an organizational filing location, topically unrelated) `[R3]`.
    - **~~Authored solely by him~~ — CONTRADICTED, corrected in revision.** Page metadata: `createdAt 2026-07-21T06:38:18Z`, authorId/ownerId = Joosep. But **version 1 — the current and only version — was saved 2026-08-06T10:05:42Z by `712020:84a1b5ab-8627-4a1e-a50a-e4cc3167a890` = Valeri Kuzmin (valeri.kuzmin@evr.ee)**, two weeks after Joosep's comment `[critic] [R3]`. Draft status holds; sole authorship does not. **His only analytical artifact has a second hand on it.** See §4.
  - A Jira dashboard *"Release-ülevaade juhtkonnale"* which he wanted to extend with a custom gadget `[S2: ITSD-39812]`.
- **His own analytical contribution — the numbers.** The draft quantifies Jira data-hygiene divergence across the six projects, all figures verified present and correct in page 1928429583 `[critic]`:
  - **Due dates populated:** HES 252 · PONY 32 · VJS1 18 · FSM 15 · D365 10 · **VJS2 0**.
  - **Issue types:** five of six projects use standard *Task*; **VJS1 uses *"Ülesanne"*** on 236 issues.
  - **Components:** D365 329 · PONY 262 · FSM 124 · HES 32 · **VJS1 and VJS2 zero**.
  - **Versions:** VJS2 has **no Fix Versions at all**.
  - The first pass under-reported these and over-credited the conclusion; the counts are the substantive contribution and are restored here in full.
- **~~"See on tavaliselt suurim takistus, mitte tööriist ise" — MISATTRIBUTED, struck in revision.~~** The first pass credited this sentence to him as *"his conclusion"* and *"the most substantive analytical output evidenced"*. **The string does not appear anywhere in page 1928429583.** It is in **VEO-98's own description, section *"Uurimissuunad"* pt 5 — authored by Ruth Türk** `[critic]`. It is therefore **the manager's framing handed to him as a research direction, not his finding**. `[S1]`'s echo of it is not independent corroboration (see §7.1 note on `[S1]`'s derivation).

### 2.2 The largest single body of work: E2E test automation

> *Heading revised — v1 called this "the bulk of his work" on the strength of the 53/53 figure. It is the largest single body, not the whole of it (§2.3), and not the most recent.*

- **21 of 27** Jira issues he touched in the last 12 months are as **assignee on project VJS1 ("VJS 1.0") E2E test stories/epics** — everything except VEO-98. On several he is **both reporter and assignee**, i.e. he originates and executes this backlog himself `[S2]`. `[S3]` independently counts "roughly 20 E2E Story tickets".
- Example titles: *"E2E: GPS simulatsioon (asukoha jagamine, indikaator, edastus VJS-i)"*, *"E2E: Offline režiim"*, *"E2E: Rongi lisamine ja muutmine"*, *"E2E: Liikluskorraldaja vaade (VJS APEX)"*, *"HES automaatsed E2E testid"* (Epic), *"E2E tugi: Lokaalne testijuhtimispaneel + nutikas 'jooksuta kõik'"*, *"E2E tugi: Elroni testsõnumite saatja Cloudflare'i peal"* `[S2] [S3]`.
- **~~100% of his GitHub commits org-wide (53 of 53) are in one private repo~~ — FALSE, corrected in revision.**
  - **Root cause of the error:** `gh api search/commits?q=repo:…+author:JoosepM-565` returns `total_count 0` for `rumba` because **GitHub's commit-search index covers default branches only**. The 53/53 figure was a method artifact, not a fact about him.
  - **Corrected ground truth** `[R1]` — branch-by-branch enumeration via the direct commits API across **10 repos / 53 branches** reachable through his three teams: **67 commits total, in exactly 2 repos.**

| Repo | Branch | Commits | Window |
|---|---|---|---|
| `HES-integration-tests` | `main` (direct pushes, no PR) | **53** | 2026-07-23 → 2026-08-25 |
| `rumba` | `feat/VJS1-826-elron-test` (live on remote) | **14** | 2026-08-26 08:40Z → **2026-08-28 08:46Z** |
| 8 other repos + 51 other branches | — | **0** | — |

  - In `HES-integration-tests` he remains the dominant contributor — 53 of ~61 commits (~87%), vs 6 by `siimliimand` and 2 by `deniss-labunets` `[S4]`.
  - **This correction is load-bearing.** It invalidated headline finding #2's numbers and the §6.1 roster sizing, and it shows a **second register of work** (see §2.3) that the "he is an E2E test engineer" framing suppressed.
- Technology: **Nightwatch / WebDriver** E2E suites against two internal train-operations apps — **HES** (driver-facing mobile app: login, day view, warnings/*hoiatused* confirmation, GPS, offline mode) and **VJS** (traffic-controller / reserve-locomotive / readiness board), plus cross-system VJS↔HES checks, integration with the **PONY** warning-sender, Excel/PDF report verification (RL-12), chromedriver/Nightwatch config maintenance, credential-variable refactors, and timestamped suite logging he introduced as a "house rule" `[S4]`. Also in the 53: Smart-ID / Mobiil-ID / Microsoft login flows, warning-confirmation flows, train editing, an aggregated multi-window run report with failure screenshots, and CI report tooling `[R1]`. Commit messages mix Estonian and English and are consistently tagged with Jira keys in the VJS1-76x / 77x / 82x / 84x range `[R1]`.
- **QA tooling he built himself:** a local Express **test control panel** (`scripts/server.js` + `start.bat`) to run/stream/stop the suite, and a **"smart run-all" orchestrator** (`scripts/run-all-smart.js`) that provisions *one* shared active train + *one* shared PONY warning reused across dependent tests to cut slow setup. He fixed a Stop button that killed only the log stream while Chrome and the tests kept running — now `taskkill /T /F` on the whole process tree `[S2: VJS1-844]`.
- **He finds product defects, not just test failures.** Commit `910f15b` (2026-08-04) captured an instructor test account receiving HTTP 400 *"Kasutajakonto seos tööandjaga vigane"* from the backend via API-response assertions, and he **deliberately left the suite RED to keep the defect visible**: *"The suite is RED on purpose, and that is the finding"* `[S4]`.

### 2.3 The second register of work — a real build, on a live branch (contradiction largely RESOLVED)

- **VJS1-826 / `apps/elron-test`**: a standalone **SvelteKit + Cloudflare Worker** app titled *"Elron testsõnumite saatja"* (Elron test-message sender) that generates and sends **Elron** (Estonian passenger-rail operator) test SOAP/XML messages (`intercity_train.xsd`/`.xml`), built inside the **`rumba`** monorepo on branch `feat/VJS1-826-elron-test` `[S2] [S4]`.
- **Content of the 14 commits** `[R1]` — a compressed 3-day burst, 2026-08-26 08:40Z → 2026-08-28 08:46Z: scaffold SvelteKit + Cloudflare Worker (`4e921b8`), vendored XSD contracts, a **byte-preserving XML transform with vitest coverage**, a station registry, a SOAP `registerXml` sender, a message-picker UI, Worker-secret handling, README, CI wiring, and finally *"feat(elron-test): wagons per timetable train + auto/optional operation station (VJS1-826)"* (`b3c6e94`, 2026-08-28 08:46:48Z).
- **This is a materially different register from the Nightwatch E2E work** — contract vendoring, transform correctness under test, secret handling, an explicit safety rail. `[R1]` flags it as weakening the first pass's *"his actual output is E2E test automation"* framing. **He builds services, not only tests.**
- **~~CONTRADICTION~~ — substantially resolved in revision.**
  - What the first pass had right, verbatim-exact on every field `[critic]`: `rumba#10` (*"feat(elron-test): Elron testsõnumite saatja (VJS1-826)"*) — author `JoosepM-565`, `createdAt 2026-08-26T11:30:25Z`, `closedAt 2026-08-26T11:32:20Z`, `mergedAt null`, state CLOSED, `comments 0`, `review_comments 0`, no reviewers, head `feat/VJS1-826-elron-test` → base `main`.
  - What the first pass got wrong: it inferred the work might be *"local-only"* or lost. **It is neither.** The branch `feat/VJS1-826-elron-test` **still exists on the remote** and carries all 14 authored commits, eight of which landed *after* the PR was closed `[R1]`. **The work is real, current, and on a live branch — only the PR was withdrawn.**
  - Residual unknown: *why* the PR was opened and pulled two minutes later. Most parsimonious reading, **[INFERENCE]**: opened prematurely against `main` while the branch was still in active development, and withdrawn to keep working. His Jira comment *"apps/elron-test on rumba monorepos valmis... Testid rohelised (svelte-check 0 viga, vitest 11/11)"* `[S2]` is consistent with the branch state, not with `main`.
  - **Relevant to the "he doesn't gate releases" question:** he is **not a member of `vjs-code-reviewers`** — a distinct, separately-gated org team (members: `verbatium`, `vershinin`, `valerikevr`, `deniss-labunets`, `elenderik-dolm`) `[R1]`. He cannot approve merges to `rumba`'s `main`.
- The architecture review he was working to came from **Mihkel Putrinsh**, signed *"S. Pepys / per procurationem M. Putrinš"* (i.e. delivered through an AI agent) — verdict: *"Piloot -- iseseisev tööriist Rumba konventsioonide peal... kood elagu rumba monorepos oma rakendusena"*, with a data-access indirection layer deferred as **VEO-167** `[S2]`. **Note for team design: he is already a consumer of AI-agent-delivered code review.**

### 2.4 Test-data safety discipline (a genuine strength, and a genuine hazard)

- Synthetic trains registered into VJS must fall **only** inside fixed ranges — **4020–4029, 4040–4049, 4120–4129, 4140–4149** — across all generators, so automated tests never collide with real production train numbers: *"Loodavad (VJS-i registreeritavad) rongid tohivad olla AINULT vahemikes... Muid numbreid ei looda."* `[S2: VJS1-845]`.
- The review of the message-replay tool named the residual hazard explicitly: *"Kordustööriist, mis suudab vaikselt tootmislipuga sõnumeid saata, on ainus päris oht selles disainis"* — a replay tool that can silently send production-flagged messages is the one real danger in the design `[S2: VJS1-826 review]`.
- **The `isTest` mechanism no longer exists — corrected in revision.** He answered that review by **removing the flag entirely**. Commit **`39f16a8342c8a386fb38a8de98bd2a6dd8852702`** (2026-08-26): *"Remove the toggle and the hidden field; the server now always sends `isTest=false`. Safety is unchanged — it stays the TEST-endpoint-only hard rail, never `isTest`."* The README commit `d1bc28d0` says the same `[critic]`.
- **The as-built safety guardrail is therefore: TEST-endpoint-only routing, not an `isTest` flag.** This matters directly — the first pass's §6.4 constraint 1 was specified against a mechanism that had already been deleted, which would have left a team believing it was protected by a flag hard-coded to `false`. Corrected in §6.4.
- **This is a production-railway-safety boundary and must be encoded as a hard constraint in any team built for him.** See §6.

---

## 3. Systems & tools he touches

### Jira (Eesti Raudtee, `eestiraudtee.atlassian.net`)

| Project key | Display name | His relation | Evidence |
|---|---|---|---|
| **VJS1** | VJS 1.0 | Primary — ~21 issues as assignee, several as reporter | `[S2] [S3] [S4]` |
| **VEO** | **"VJS2"** (key ≠ name) | VEO-98 assignee; VEO-167 deferred item | `[S2] [S3]` |
| **HES** | — | Named in release scope; E2E epic *"HES automaatsed E2E testid"* | `[S2] [S3]` |
| **PONY** | — | Named in release scope; PONY warnings used as test fixtures; has own dev account | `[S2] [S3]` |
| **FSM** | — | Named in release scope only — **no issues of his found** | `[S2]` |
| **D365** | — | Named in release scope only — **no issues of his found** | `[S2]` |
| **ITSD** | IT service desk | 6+ self-service requests | `[S2] [S3]` |

**Key/name trap — flag for access configuration:** project key **`VEO`** carries display name **"VJS2"** (id 10554). Separately there exist `VJS` (id 10029, "VJS", category Arendusprojekt), `VJS1` (id 10255, "VJS 1.0"), `VJS2OLD` (id 10387, "VJS 2_OLD", service_desk), `VJSA` (id 10060, "VJS Arhiiv") `[S2]`. Granting "VJS2" by name will grant the wrong project.

**Jira features specifically:** Fix Versions, due dates, **Release Hub**, **Plans / Advanced Roadmaps** (plan 1331 / scenario 1334, "Juhtkonnale"), dashboards + gadgets, cross-project JQL `[S1] [S2] [S3]`.

### Confluence

- Space **VJS2** — access granted `[S3: ITSD-39616]`. Contains *"Väljalaskeprotsess & GitFlow"* (page 1660518403), the VJS2 release process he would need to plug into `[S3] [S5]`.
- Page **1928429583** — the cross-project data-hygiene draft, unpublished; created by him, **last saved by Valeri Kuzmin** `[S3] [R3]`. Parent: page 486179010 *"FSM kodu"* `[R3]`.
- Space **ITOps** — page 698646563 lists his FIDO2 key `[S3]`.
- **Note, qualified in revision:** CQL `text ~ "Madar"` returns 0 of 0 — but that search **does not index drafts**, and his own draft is invisible to it too `[critic]`. The zero is partly a search-scope artifact. What holds: no *published* page names him.

### GitHub (`github.com/Eesti-Raudtee`, private org)

- Member of exactly **three teams: `hes`, `vjs`, `vjs2`** — re-confirmed via the org membership API `[R1]`. **Not** in `vjs-code-reviewers`, `tms`, `archi`, `infoturve`, `linux`, `network`, `solutional`, `evr` `[S4] [R1]`.
- **Team → repo grants** `[R1]`: `hes` → 8 repos (`azure-test-container`, `infra-beacon`, `gateway-ttcms`, `hes-db-demo`, `HES-frontend`, `HES-backend`, `HES-database`, `train-tracking-service`); `vjs` → 33 repos (a superset including the `HES-*` repos, the `vjs_db_*` Oracle/PLSQL ecosystem, `vjs_apex_apps`, `HES-integration-tests`, `stations-scheduler-js`, `pdf-generaator`, `wso2`, `db_template`); `vjs2` → 6 repos (`apex-migration-research`, `oracle-ords`, `evr-ui-kit`, `ords-ias`, `Arhitecture`, `rumba`).
- **Access-scoping note for team design:** all of his actual commit activity falls in repos reachable via **`vjs`** (`HES-integration-tests`) and **`vjs2`** (`rumba`). **None** falls in repos unique to `hes`-team access `[R1]` — the `hes` grant is unexercised and need not be mirrored into the container.
- **`HES-integration-tests` has no `.github/workflows`, no CHANGELOG, no tags, no Releases, and no PR history at all** — every commit, including his, goes directly to `main` `[S4] [R1]`.
- **Zero-comment claim — RE-VERIFIED by a sounder method.** The first pass derived this from `gh search`, the same index that missed 14 commits. Re-run against the direct `issues/comments` and `pulls/comments` endpoints across all 10 repos `[R1]`: **zero issue comments, zero PR review-thread comments, zero issues authored, anywhere.** He has authored **exactly one PR org-wide** — `rumba#10`, closed unmerged, 0 comments, 0 review comments. *Residual gap:* PR **review actions** (approve / request-changes submitted via the `reviews` endpoint, distinct from review-thread comments) were not checked `[R1]`.

### Other systems / environments

- **Cloudflare Workers / Pages** — `apps/elron-test` target; VJS2's own release path is GitFlow → Cloudflare Pages `[S2] [S3]`.
- **Docker Desktop** — requested and installed via Company Portal `[S2: ITSD-39553]`.
- **Nightwatch / WebDriver / chromedriver, vitest, svelte-check, SvelteKit/Svelte** `[S2] [S4]`.
- **HES production/test app** — Azure AD conditional-access gated `[S2: ITSD-40306]`.
- **Claude / Anthropic license + group** — granted `[S3: ITSD-39591, ITSD-39589]`. Justification, verbatim: *"Palun lisada Joosep Madarile samuti Claude litsents ja grupp - üks tema järgmistest ülesannetest on teha ettepanek Jira's projektide ülese visuaali loomiseks."* **He already has a Claude licence, tied to exactly this task.**
- **Shared root `.env`** holding `HES_` / `VJS_` / `PONY_` test credentials — *"HES ja VJS test-kasutaja on sama konto"* `[S2: VJS1-845]`.
- **EvrSK WSDL** — SOAP contract he needed confirmed for the Elron sender `[S2]`.
- **HES portal test account `T_INTELLIJ_TESTER`** — created for his automated tests; he filed the request himself and it was closed. *"HES automaat testide jaoks portalis on loodud kasutaja: T_INTELLIJ_TESTER … Õigused on väljastatud praktikant Joosep Madar"* `[R2: ITSD-40449, created 2026-08-25]`. Added in revision — a live test-system credential tied to his name.

---

## 4. Collaborators / stakeholders

| Person | Relation | Evidence |
|---|---|---|
| **Ruth Türk** (ruth.tyrk@evr.ee) | **Primary.** VJS2 group head / team lead; reporter and assigner of VEO-98; sponsor on every one of his onboarding and access tickets; project-admin on the VEO board (since 2026-08-11) | `[S1] [S2] [S3]` |
| **Valeri Kuzmin** (valeri.kuzmin@evr.ee, `712020:84a1b5ab-8627-4a1e-a50a-e4cc3167a890`) | **Promoted to top-three in revision.** He is the **last (and only) editor of the current version of page 1928429583**, Joosep's sole analytical artifact — saved 2026-08-06, two weeks after Joosep's VEO-98 comment. Independently authored *"Väljalaskeprotsess & GitFlow"* (page 1660518403, space VJS2, 2026-04-13) — the VJS2 release process, written **three months before VEO-98 was filed**. Also assignee on **VEO-144** (Cloudflare setup for the apex-research knowledge base, *In Progress*). Jira account active. | `[critic] [R3]` |
| **Mihkel Putrinsh** | Reviews his architecture/implementation on the `rumba` elron-test work — delivered via AI agent ("S. Pepys / per procurationem") | `[S2]` |
| **Aleksandr Lerko** | Second VEO board project-admin (from 2026-08-11) | `[S1]` |
| **siimliimand** (Siim Liimand) | 6 commits in `HES-integration-tests`; **not in the fetched org member list** — hidden member, contractor, or unrelated. Unresolved | `[S4]` |
| **deniss-labunets** | 2 commits in `HES-integration-tests`; likely the "Deniss" he names as WSDL SME | `[S2] [S4]` — *inference on the identity match* |
| ~~**"Valeri"**~~ | Struck — resolved to Valeri Kuzmin above. Joosep's VJS1-826 comment credits *"Manuaalne timeline / journey-stepper (Valeri idee...)"* `[S2]`; **[INFERENCE]** same person as Valeri Kuzmin, on first-name + topic match, not directly evidenced | `[S2]` |
| **Märten Olli** | IT — Cloud / Claude licence & group admin | `[S3]` |
| **Janika Salmanis** | IT — account provisioning; fixed his HES access via group membership | `[S2] [S3]` |
| **Raini Raal** | IT — Jira/Confluence access grants | `[S3]` |
| **Anna Voronina** | IT — VJS developer rights | `[S2]` |
| **Andrei Popov** | IT — PONY developer account | `[S2]` |
| **Kristi Rand** | HR — intern/contract paperwork | `[S3]` |
| **Darja Hutorovskaja** | HR/IT — contract-change processing, Docker ticket | `[S2] [S3]` |
| **Jüri Schkiperov** | CC'd on the Claude-licence ticket | `[S3]` |
| **"juhtkond" (leadership)** | The **consumer** of his release overview — named audience, never named individually | `[S1] [S2] [S3]` |

**How far the Kuzmin finding goes — bounded, in revision.** He edited the working document; he did **not** touch the ticket. A JQL full-text search for *"Kuzmin"* across VEO, VJS1 and HES returned 9 issues (VEO-180, VJS1-447, VEO-144, VEO-167, VEO-94, VEO-81, VEO-85, VJS1-487, VEO-16) — **VEO-98 is not among them**; his name appears nowhere in VEO-98's indexed summary, description, or comment `[R3]`. His *"Väljalaskeprotsess & GitFlow"* page is a **different subject** from VEO-98 — single-repo git branching and tag mechanics for a Cloudflare-Pages deploy, with no mention of Jira Timeline, Fix Version rollups, or cross-project dashboards; the shared word *release/väljalase* is a false friend `[R3]`. His broader Confluence footprint (25 most-recent contributions) is VJS2/IO/HES/ITOps technical and process pages — *"Arendusprotsessi Workflow (JIRA)"*, NFR templates, SRS, *"EVR IT-arhitektuuri põhimõtted"* — **nothing on cross-application release visibility for management** `[R3]`.
**Reading, [INFERENCE]:** Kuzmin is the **release-process/architecture standing authority in VJS2** and reviewed or tidied Joosep's draft, rather than being a co-owner of the VEO-98 assignment. But *someone else's hand on the only artifact* is a stakeholder fact regardless, and it means VEO-98 may already be a two-person effort. **Feeds open question #2 directly.**

**Absent:** no evidence of him interacting with release/deployment approvers, change-advisory boards, or ops/on-call staff. No meeting, email, or chat sources were in scope for any sweep.

---

## 5. Pain points & opportunities

### Evidenced pain points

1. **The leadership release picture is hand-assembled every time** — his own ticket's stated problem `[S3: VEO-98]`.
2. **Cross-project Jira data hygiene is named as the blocker, not tooling.** **Attribution corrected in revision:** the *claim* is **Ruth Türk's**, stated in VEO-98's own research brief (*"See on tavaliselt suurim takistus, mitte tööriist ise"*, §*Uurimissuunad* pt 5) — not his conclusion `[critic]`. **His contribution is the measurement**: due dates HES 252 / PONY 32 / VJS1 18 / FSM 15 / D365 10 / VJS2 0; VJS1's 236 issues on non-standard type *"Ülesanne"*; components D365 329 / PONY 262 / FSM 124 / HES 32 / VJS1 0 / VJS2 0; VJS2 zero Fix Versions `[S3, page 1928429583]`. `[S1]` does **not** corroborate this independently — it derives from the same ticket (§7.1).
3. **Access friction is chronic.** Six-plus ITSD tickets just to obtain baseline tooling, several open for days to weeks: Docker (ITSD-39553), VJS developer rights (ITSD-39565), PONY dev account (ITSD-39614), HES blocked by Azure AD conditional access — *"AADSTS50105: ...blocked because they are not a direct member of a group with access"*, open 2026-08-14→17 (ITSD-40306) `[S2] [S3]`.
4. **Jira admin rights, requested specifically to build his own dashboard gadget, are still unresolved** — ITSD-39812, status *Analysis* as of the search window `[S2] [S3]`. He is blocked or working around it.
5. **His main repo has no release machinery at all** — no CI, no tags, no Releases, no PRs; direct-to-`main` pushes `[S4]`. The person tasked with cross-app release visibility works in the org's least release-instrumented repo.
6. **~~The one PR he opened died in two minutes with no trail~~ — OVERSTATED, corrected in revision.** There *is* a full trail: the branch `feat/VJS1-826-elron-test` is live on the remote with 14 commits, 8 of them after the PR closed `[R1]`. The real finding is narrower and more useful: **his work does not reach `main`, and he has no route to put it there** — one PR ever, closed unmerged, zero review interaction anywhere `[R1]`, and he is not in `vjs-code-reviewers` `[R1]`. **He is building outside the merge path.**
7. **Test-data safety is a live production hazard** — reserved train-number ranges `[S2]`. **Corrected:** the `isTest` flag no longer exists; he removed it (commit `39f16a83`) and the guardrail is now **TEST-endpoint-only routing** `[critic]`. The hazard is unchanged in kind; the mechanism to protect is different (§6.4).
8. **He is thinly documented.** No *published* Confluence page, org chart, or RACI names him `[S3]`; his only analytical artifact is an unpublished draft, and its current version was last saved by someone else `[R3]`; the apex-research stakeholder registry in local clones does not list him or any release-management role `[S5]`. **Weakened in revision:** the "zero Confluence hits" figure is partly a CQL drafts-indexing artifact and cannot alone support "documentation-invisible" `[critic]`.

### Opportunities for an AI team — *all of §5 below is INFERENCE*

- **[INFERENCE]** The highest-value, lowest-risk automation is exactly VEO-98's unfinished half: a **standing, read-only cross-project Jira/GitHub release roll-up** that regenerates the "Juhtkonnale" picture instead of him rebuilding it by hand. The design work is already done by him; what is missing is a thing that runs.
- **[INFERENCE]** A **data-hygiene auditor** that continuously reports the six projects' field-completeness deltas (due dates, Fix Versions, Components, issue types) turns his one-off draft §§1–6 into a recurring signal — and gives him the evidence to negotiate hygiene changes with five other project owners, which is otherwise a political task he has no authority for as a contractor.
- **[INFERENCE]** An agent that **drafts the release narrative for leadership** from Jira + GitHub state (what shipped, what slipped, why) addresses the actual consumer need — *juhtkond* wants a story, not a timeline widget.
- **[INFERENCE]** A **QA/E2E co-worker** matches where his time actually goes: maintaining Nightwatch suites, triaging red runs, distinguishing product defects from test flakiness (he already does this deliberately — the RED-on-purpose commit).
- **[INFERENCE]** Because his `HES-integration-tests` repo has no CI, a **first-CI-workflow** contribution is unusually high-leverage and unusually safe (tests only, no deploys).
- **[INFERENCE]** Given §2.3, a **service-build co-worker** (SvelteKit / Cloudflare Worker / SOAP-XML contract work) is at least as well matched to his real output as a QA co-worker. The first pass did not see this half of his work.
- **[INFERENCE, counter-argument, must be weighed]** He already **has a Claude licence** `[S3]`, and the review he receives on his code is already AI-delivered `[S2]`. A dedicated container may be less valuable to him than to the *practice*. **Attribution corrected:** the phrase *"release-management practice owner-in-the-making"* is **`[S1]`'s own AI-generated framing of him**, self-flagged there as unverified `[critic]` — it is a quotation of a derived summary, not evidence about him, and should not be leaned on. The underlying argument still stands on its own: **if his contract is not renewed, the artifact worth building is the release-visibility service, not a team for him.**

---

## 6. TEAM-DESIGN INPUTS

> **Precondition, not a caveat:** confirm with Ruth Türk or HR that his engagement extends past **31.08.2026** `[S3]` before provisioning anything. A targeted ITSD re-query found **no renewal ticket** `[R2]`; this did not resolve the question, it only failed to answer it. If the answer is no, re-scope to §5's counter-argument.

### 6.1 Proposed roles

> **~~Sized against the evidenced work split (≈75% QA/E2E, ≈25% release reporting)~~ — WITHDRAWN in revision.** That ratio came from Jira **ticket counts** (21 of 27), which measure ticket volume, not effort or time `[critic]`. VEO-98 is *one* ticket spanning six projects that produced three artifacts (a Plans timeline, a Confluence analysis, a dashboard); the ~20 E2E stories are individually much smaller. **No time, worklog, or commit-weighted evidence supports any split.** The `[R1]` commit correction cuts the same way — 14 of his 67 commits are service-build, not test work.
>
> **The roster below is therefore not evidence-sized.** It is a *coverage* proposal: one role per distinct kind of work observed. Treat headcount and weighting as an open PO decision (open question #9), not a finding. Two roles are newly justified by the revision (`builder`), and two of the six now look thinner than the first pass implied.

| Role | Remit (one line) |
|---|---|
| **team-lead** | Owns the VEO-98 narrative end to end: turns his draft analysis into a delivered, standing release-visibility service and reports its state to Ruth Türk / *juhtkond*. |
| **release-cartographer** | Builds and maintains the cross-project roll-up across VJS1 / VEO(VJS2) / HES / FSM / PONY / D365 — Fix Versions, due dates, Release Hub, Plans "Juhtkonnale", GitHub-for-Jira dev-panel linkage. |
| **hygienist** | Continuously audits the six projects' Jira field discipline (his draft §§1–6 as the spec) and reports deltas + the concrete remediation list per project owner. |
| **suite-keeper** | Maintains and extends the Nightwatch/WebDriver E2E suites in `HES-integration-tests`, triages red runs, and separates product defects from test flakiness. |
| **fixture-warden** | Owns test-data safety: enforces the reserved train ranges (4020-4029, 4040-4049, 4120-4129, 4140-4149) and **the TEST-endpoint-only routing rail** (revised — *not* an `isTest` flag, which no longer exists `[critic]`), and reviews anything that can emit messages into a live system. |
| **builder** *(new in revision)* | Co-works the service-build register the first pass missed: SvelteKit + Cloudflare Worker apps, vendored XSD/SOAP contracts, byte-preserving transforms under vitest, Worker-secret handling — the `apps/elron-test` shape `[R1]`. |
| **scribe** | Publishes — moves his work out of personal drafts into the VJS2 Confluence space and keeps VEO-98's trail current. *Revised justification:* the driver is not "documentation invisibility" (a partly artefactual finding) but the concrete fact that **VEO-98 has been dormant since 2026-07-21** and its only artifact is an unpublished draft. |

*(The apex-research shape is six roles: `roster.json` + `common-prompt.md` + `prompts/*.md` at `designs/deployed/apex-research/teams/apex-research/` `[S5]`. This list is now seven — trim to six by the PO's answer on question #9, most plausibly by merging `hygienist` into `release-cartographer`.)*

### 6.2 Required integrations / MCPs / credentials

- **Atlassian MCP — Jira, read-scoped.** Projects: `VJS1`, `VEO`, `HES`, `PONY`, `FSM`, `D365`, `ITSD`. **Grant by key, not by display name** — `VEO` displays as "VJS2" `[S2]`. Must reach Fix Versions, Release Hub, Plans/Advanced Roadmaps (plan 1331), and cross-project JQL.
  - *Connector note:* the `claude.ai Atlassian` connector returned **404 "Server not found"** across two independent sessions `[S3] [S4]`; only `plugin_atlassian_atlassian` worked `[S2] [S3]`. Pin the working connector in the container config.
- **Atlassian MCP — Confluence, read + write-to-VJS2-space.** Spaces: `VJS2` (incl. page 1660518403 GitFlow), and his draft 1928429583.
- **GitHub, read-scoped** (`gh` CLI or MCP) over org `Eesti-Raudtee`. His own access ceiling is a sensible ceiling for the team `[S4]` — but **narrow it further, per the revision:** the only repos he has ever committed to are **`HES-integration-tests`** (via team `vjs`) and **`rumba`** (via team `vjs2`); the entire **`hes`-team grant is unexercised** `[R1]`. Start from `{HES-integration-tests, rumba}` plus read on the `HES-*` repos the E2E suite tests against, and expand on demand rather than mirroring all 40+ granted repos.
  - **Branch enumeration, not the search index.** `gh search commits|prs|issues` only indexes **default branches** and demonstrably missed 14 of his 67 commits `[R1]`. Any tooling this team uses to survey activity must enumerate branches via `repos/{owner}/{repo}/branches` + `repos/{owner}/{repo}/commits?sha=<branch>`. **Encode this in the team's prompts.**
- **GitHub-for-Jira integration data** (dev panel, branch/commit/PR ↔ issue-key linkage) — named explicitly in VEO-98's investigation threads `[S3]`.
- **Anthropic API credential** — he already holds a licence and group `[S3: ITSD-39589, ITSD-39591]`; reuse rather than re-request.
- **Container shape reference (already local):** `designs/deployed/apex-research/container/{Dockerfile.apex, entrypoint-apex.sh, docker-compose.yml, .env.example}`; registry pattern in `mitselek-ai-teams/registry.json` (apex-research: team 2, host `100.96.54.170`, port 2222, user `ai-teams`, key `~/.ssh/id_ed25519_apex`, direct-ssh, live) `[S5]`.

### 6.3 What the container must reach (network)

- `eestiraudtee.atlassian.net` (Jira + Confluence, HTTPS).
- `api.github.com` + `github.com` (private org, HTTPS).
- `api.anthropic.com`.
- The stationmaster/courier hub host if the team is to be federated (`100.96.54.170` in the current registry) `[S5]`.
- **Explicitly NOT required:** anything reaching HES/VJS/PONY *runtime* systems, Cloudflare deploy endpoints, or Azure AD app endpoints. See 6.4.

### 6.4 What the team must NOT be given

Ranked by consequence.

1. **No write path to any VJS / HES / PONY runtime or test environment, and no ability to send messages into them.** The Elron/PONY message tooling can emit traffic into a live railway dispatch system — the review already named this *"the one real danger in this design"* `[S2]`. The reserved train ranges 4020-4029 / 4040-4049 / 4120-4129 / 4140-4149 exist because collisions with real train numbers are the failure mode.
   - **~~If any capability here is ever granted, `isTest` must default true and range enforcement must be non-bypassable.~~ — REWRITTEN in revision. The original text specified the single most safety-critical constraint against a mechanism that no longer exists.** Commit `39f16a83` (2026-08-26) **removed the `isTest` toggle and hidden field entirely; the server now always sends `isTest=false`** `[critic]`. A team implementing the original wording would believe it was protected by a flag that is hard-coded to the unsafe value.
   - **Correct constraint, as-built:** the guardrail is **TEST-endpoint-only routing** — the tool can physically reach only the test endpoint, and the endpoint URL must not be configurable from inside the container. **Range enforcement must be non-bypassable.** Do not reference `isTest` in any prompt, roster, or policy file.
2. **No Cloudflare deploy credentials.** VJS2 releases to Cloudflare Pages via GitFlow with PR review as the approval gate `[S3]`. The team observes and reports on that gate; it must not be able to pass through it.
3. **No merge/push rights to `main` on any repo.** `HES-integration-tests` accepts direct-to-`main` pushes with no PR history `[S4] [R1]` — the absence of a guardrail is not permission. Branch + PR only. **Reinforced in revision:** he is **not a member of `vjs-code-reviewers`** `[R1]`, the separately-gated team that can approve merges. The team must not exceed its principal — it cannot approve, and must not be given a path that lets it merge.
4. **No Jira admin rights.** He requested them (ITSD-39812) and does not have them `[S2] [S3]`; the team must not exceed its principal's own authority. Read + comment on issues he owns; no schemes, workflows, permissions, or project configuration.
5. **No Jira/Confluence write outside VEO-98, his own VJS1 issues, and the VJS2 space.** He is a contractor in one group; the roll-up touches five projects he does not own. **Hygiene findings are reported, never applied** — bulk-editing another project's Fix Versions or due dates is the single most plausible way this team causes an incident.
6. **No HR/ITSD/identity systems** — his ITSD tickets contain employment-record numbers, contract dates, and Azure AD group facts `[S3]`. Read-only ITSD access at most, and only if a concrete need is named.
7. **No credential store access.** The shared root `.env` holds live `HES_`/`VJS_`/`PONY_` test-user secrets on a shared account `[S2]`. Keep it out of the container.
8. **No `vjs_apex_apps`** — read-only reference by workspace policy `[CLAUDE.md]`, and outside his remit.

---

## 7. Source reachability, gaps, open questions

### 7.1 Reachability

| # | Source | Reachable | Method / caveat | Yield |
|---|---|---|---|---|
| S1 | apex-research stakeholder dashboard, `http://100.96.54.170:5173/stakeholders/joosep-madar-release-management` | Yes | **WebFetch failed** on all URLs — SSL `WRONG_VERSION_NUMBER`, because it force-upgrades `http://`→`https://` against a plain-HTTP Vite dev server. Retrieved via claude-in-chrome fallback. **NOT AN INDEPENDENT SOURCE — see note below.** | Role label, VEO-98 framing, Ruth Türk link, TTL 2026-11-11 |
| S2 | Jira via Atlassian MCP (`plugin_atlassian_atlassian`) | Yes | Read-only; 12-month window; both accountIds searched | Richest source — 27 issues, verbatim quotes, collaborators |
| S3 | Confluence + Jira via Atlassian MCP | Yes | `claude_ai_Atlassian` connector **404 all session**; plugin variant used | Employment facts, unit, data-hygiene draft, FIDO2, GitFlow |
| S4 | `github.com/Eesti-Raudtee` via `gh` (auth: mitselek) | Partly — **method defect** | Used `gh search`, which indexes **default branches only**. **Missed 14 commits.** Its derived percentages were unsound; superseded by `[R1]` | Team & repo access map (sound); commit counts (superseded) |
| S5 | Local clones under `Documents\github\` | Yes | Read-only Grep/Glob/Read | **Zero evidence of him.** Value is the container reference shape only |
| R1 | GitHub, branch-by-branch via direct API (10 repos, 53 branches) + `issues/comments` / `pulls/comments` endpoints | Yes | Avoided the search index entirely; `per_page=100` cap not hit on any branch (max 53) | **Corrected commit ground truth (67, 2 repos); re-verified zero-comments; team→repo grant map** |
| R2 | Jira ITSD, `project = ITSD AND text ~ "Madar" AND created >= 2026-08-01` | Yes | One query, as specified | **Negative result on contract renewal**; found ITSD-40449 |
| R3 | Jira (`text ~ "Kuzmin"` in VEO/VJS1/HES) + Confluence (`contributor = <Kuzmin>`, pages 1928429583 / 1660518403 / 486179010) | Yes | Confluence contributor list capped at 25 most-recent | **Kuzmin identified and bounded**; draft version-authorship |
| R4 | Jira comment-axis sweep — `comment ~ "Joosep" AND updated >= -12w`; `project in (FSM,D365,HES,PONY) AND text ~ "release" AND updated >= -26w` | Yes | **Weak instrument** — see §7.2 | Null; does not settle the question |

**`[S1]` is not independent evidence — flagged in revision.** The first pass repeatedly used it to corroborate `[S2]`/`[S3]` (*"`[S1]` independently confirms…"*). It cannot: `[S1]` is an **AI-generated stakeholder dashboard that itself derives from VEO-98** and self-flags its role label as unverified `[critic]`. It is a derived secondary source restating the same primary ticket. All *"`[S1]` corroborates"* constructions above have been struck or requalified.

### 7.2 Gaps (absent evidence — stated as absent, not inferred)

- **Formal job title:** absent from all five sources. "Release management" is a dashboard label `[S1]`, self-flagged there as unverified.
- **Unit name resolution:** *IT teenistus* `[S1]` vs *IT teenuste haldusosakond, VJS2 grupp* `[S3]` vs *Haldusteenistus* (VEO-98 title) — nesting unconfirmed `[S3]`.
- **Contract renewal past 31.08.2026:** **still unknown after a targeted re-query** `[R2]`. ITSD-40047 establishes that HR files every contract event as an `ape.evr.ee` *"Töötaja andmed"* routing ticket (Kristi Rand / Darja Hutorovskaja) with validity dates written into the summary line. **No such ticket exists for him between 2026-08-01 and 2026-08-28.** Four readings, none excluded: (a) no event yet; (b) HR has not filed yet; (c) a ticket exists but does not contain the literal string *"Madar"* (employee ID or department only); (d) filed before 2026-08-01. The query was ITSD-only and text-matched — a renewal filed in another project, or referenced only through a linked-issue field, would not surface `[R2]`.
- **VEO-98 current status:** last seen *Evaluation*, one comment (2026-07-21). Whether it concluded, was handed off, or what was approved: unknown `[S1] [S3]`.
- **ITSD-39812 (Jira admin rights):** last seen *Analysis*, unresolved `[S2] [S3]`.
- **FSM and D365:** named by him in scope, **zero issues of his found in either** `[S2]`, and a second sweep across FSM/D365/HES/PONY for release-related issues in the last 26 weeks returned 7 issues (FSM-442, FSM-254, PONY-436, FSM-340, HES-477, HES-471, HES-470) with **no occurrence of "Joosep" in any field or comment** `[R4]`. `D365` confirmed a live, valid project key, so the null is genuine, not a broken filter `[R4]`. **His involvement in FSM and D365 remains unevidenced — withhold access until a need is named (§6.2).**
- **Release/deployment procedures for HES, PONY, FSM, D365:** unexamined; only VJS2's GitFlow page was read `[S3]`.
- **Tenure before ~2025-08-28:** outside the 12-month window; the 2026-06-29 internship start makes pre-history likely nil, but this is not confirmed `[S2]`.
- **"Valeri":** resolved — Valeri Kuzmin `[R3]`. **"Deniss":** first name only; plausibly `deniss-labunets`, unconfirmed `[S2] [S4]`.
- **Kuzmin's own status:** job title, team, and whether he is EVR staff or a contractor could not be determined from Jira/Confluence; his `@evr.ee` Atlassian account is `active`, which is the only signal available `[R3]`. Whether he and Joosep actually communicated about the draft (vs. an unprompted edit) is unknown — the draft's inline and footer comments were not fetched `[R3]`.
- **`siimliimand`:** not in the fetched org member list `[S4]`.
- **Comment-authorship axis — attempted, NOT closed.** `[R4]` ran the specified sweep and found nothing, but the instrument is weak: **JQL `comment ~ "Joosep"` searches comment *body text*, not comment *author***. It catches other people naming him; it would **not** catch comments he authored on issues he does not own — the exact signal needed to test headline #2. The single hit (VJS1-558) is a false positive: a train driver named *"Georg Joosep Kõima"* in QA test data `[R4]`. **The proper query — per-issue comment retrieval filtered on his accountId `712020:9fc49d6c-…` — was not run.** This remains the cheapest available test of headline finding #2.
- **PR review actions** (approve / request-changes via the `reviews` endpoint) never checked `[R1]`.
- **Other GitHub orgs / repos outside the 10 team-granted candidates:** not checked `[R1]`.
- **Never queried at all:** email, calendar, Teams/Slack, ServiceNow, meeting notes `[S3] [S4]`. **These are exactly the channels in which release coordination would happen**, which is why headline #2 must stay an inference.
- **Not crawled:** the dashboard's `/decisions`, `/qna`, `/changelog` sections `[S1]`.

### 7.3 Open questions for the PO

1. **Is his contract renewed past 31.08.2026?** Everything below is contingent on this. **Still open after `[R2]`** — no HR routing ticket found, which is not the same as no renewal. **Ask Ruth Türk or HR directly; do not try to answer this from Jira again.** Note the counter-signal: he committed code on 2026-08-28 `[R1]`.
2. **Is the team being built for Joosep the person, for a pair, or for the release-visibility practice?** **Sharpened in revision.** The one analytical artifact behind VEO-98 was **last edited by Valeri Kuzmin** `[R3]`, who separately authored the VJS2 release-process page three months earlier. VEO-98 may already be a two-person effort, and Kuzmin may be the durable owner of the topic. *(Note: the first pass's supporting quote for this question — "practice owner-in-the-making" — was an AI summary, not evidence `[critic]`; the question stands on the Kuzmin finding instead.)*
3. **What is the parent service above VJS2 grupp** — *IT teenistus* / *IT teenuste haldusosakond* / *Haldusteenistus*? **Narrowed in revision:** the contracting unit is settled — **VJS2 grupp**, per ITSD-40047's summary. Only the label above it is open. Confirm with Ruth Türk. `[S1] [S3]`
4. ~~**Where did `rumba` PR #10 go?**~~ **CLOSED in revision.** The branch `feat/VJS1-826-elron-test` is live on the remote with 14 commits, 8 pushed after the PR was closed; the work is neither local-only nor lost `[R1]`. Residual, minor: why the PR was opened and withdrawn inside two minutes.
5. **Did he ever get Jira admin (ITSD-39812)?** Determines whether "build the gadget" is even available to the team. Last seen *Analysis*. `[S2] [S3]`
6. **Should the team's mandate include the five projects he does not own?** The hygiene work necessarily touches HES, FSM, PONY, D365 owners. Without a mandate this is a contractor asking five teams to change their conventions. **Reinforced:** `[R4]` found no trace of him in FSM or D365 at all.
7. **What is he actually — QA engineer, service builder, or reporting analyst?** **Revised.** The first pass offered a two-way choice (QA vs. release management) on the strength of a 53/53 commit figure that was wrong. With `[R1]`'s correction there are **three** registers of evidenced work: Nightwatch E2E (53 commits), SvelteKit/Worker service build (14 commits, and the most recent activity), and Jira release reporting (one dormant ticket). The roster must be re-weighted against whichever the PO confirms — not against ticket counts.
8. **Which Atlassian connector should the container pin?** `claude_ai_Atlassian` failed in two independent sessions **and again during this revision pass** (404 *"Server not found"*); `plugin_atlassian_atlassian` worked throughout. Is the working one adequately scoped? `[S3]`
9. **How many roles, and weighted how?** The §6.1 sizing basis was withdrawn (no time/worklog/effort evidence exists). Seven candidate roles are now listed against a six-role reference shape. **PO decision, not a finding.**
10. **Should the run-a-proper-comment-authorship-query be commissioned before design?** It is the one cheap test left that could overturn headline #2 — per-issue comment retrieval filtered on accountId `712020:9fc49d6c-35dc-44a3-a14e-af46c541d027`. `[R4]`'s text-match query does not substitute for it.

---

## 8. Revision note

**Revised 2026-08-28 (same day, second pass) by (*FR:Aen*)** after an adversarial critic review plus four targeted gap-fill sweeps `[R1]`–`[R4]`. Read-only throughout; nothing was modified in any external system.

**What changed — material corrections:**

| # | Claim in v1 | Status | Effect |
|---|---|---|---|
| 1 | *"53 of 53 GitHub commits"* / *"100% in one repo"* (§0.2, §2.2) | **FALSE — method artifact.** `gh search/commits` indexes default branches only. True figure: **67 commits, 2 repos** `[R1]` | Invalidated headline #2's numbers, §6.1 sizing, and the "he only writes E2E tests" framing. Surfaced a whole second register of work (§2.3) |
| 2 | *"See on tavaliselt suurim takistus, mitte tööriist ise"* as **his** conclusion (§2.1, §5.2) | **MISATTRIBUTED.** Absent from his draft; it is in **Ruth Türk's** VEO-98 description | His real contribution (the hygiene counts) restored in full; the inflation removed |
| 3 | Draft 1928429583 *"authored solely by him"* (§2.1) | **CONTRADICTED.** Current version saved 2026-08-06 by **Valeri Kuzmin** | Kuzmin promoted from "unverified first name" to top-three stakeholder; reframes open question #2 |
| 4 | §6.4 constraint 1: *"`isTest` must default true"* | **CONTRADICTS AS-BUILT CODE.** Commit `39f16a83` deleted the flag; server always sends `isTest=false` | The most safety-critical constraint rewritten to the real rail: **TEST-endpoint-only routing** |
| 5 | *"Release management is a task he holds, not a function he performs"*; *"He is not gating deployments"* (§0.2, §0.3) | **INFERENCE STATED AS FINDING.** Rests on absence across five sweeps that structurally cannot see meetings/email/Teams | Both re-marked `[INFERENCE]`; headline #2 restated as unresolved |
| 6 | ≈75% / 25% work split (§6.1) | **UNSUPPORTED.** Derived from ticket counts, which measure volume not effort | Sizing basis withdrawn; roster restated as a coverage proposal; new open question #9 |
| 7 | *"He is documentation-invisible"* (§3, §5.8) | **OVER-READ.** CQL does not index drafts — his own page fails the same search | Weakened to "no *published* page names him" |
| 8 | *"Converted to käsundusleping"* (§1) | **UNSUPPORTED WORD.** ITSD-40047 says only that a mandate contract is being concluded; the two terms overlap by a month | Two concurrent instruments offered as an equally plausible reading |
| 9 | Unit question wholly open (§1, §7.2) | **OVERSTATED.** ITSD-40047's summary names the contracting unit: **VJS2 grupp** | Narrowed to the parent-service label only |
| 10 | *"`[S1]` independently confirms…"* (§2.1, §5.2, §5 counter-argument) | **CIRCULAR.** `[S1]` is an AI-generated dashboard derived from VEO-98, self-flagged unverified | All corroboration-by-`[S1]` struck; §7.1 note added |
| 11 | *"Zero PRs reviewed / zero comments"* (§3) | **Suspect by association** (same defective method) → **re-verified sound** via direct `issues/comments` + `pulls/comments` endpoints `[R1]` | Claim survives, now properly evidenced. PR *review actions* remain unchecked |
| 12 | Open question #4, *"Where did PR #10 go?"* | **CLOSED.** Branch live on remote, 14 commits, 8 after PR closure `[R1]` | §2.3 rewritten; §5 pain-point 6 narrowed to "his work does not reach `main`" |

**What the gap-fill added that v1 did not have:** the `apps/elron-test` build detail and its 2026-08-28 activity `[R1]`; the team→repo grant map and the finding that his `hes`-team access is unexercised `[R1]`; non-membership of `vjs-code-reviewers` `[R1]`; VEO-98's five-week dormancy `[critic]`; ITSD-40449 and the `T_INTELLIJ_TESTER` account `[R2]`; Kuzmin's bounded footprint `[R3]`; confirmation that FSM/D365 involvement is genuinely nil `[R4]`.

**What the gap-fill tried and failed to settle:** contract renewal `[R2]` — negative result only; comment-authorship participation `[R4]` — the specified JQL tests comment *text*, not *author*, so headline #2 is untested rather than confirmed.

**Confidence after revision:** high on systems, access, collaborators, and the corrected GitHub ground truth; **medium** on what his job actually is; **low** on whether he will still be employed when a container could be built.
