# VEO-78 "Gateway Worker" — Actionability Assessment + Team-Competence Mapping

**Subject:** [VEO-78](https://eestiraudtee.atlassian.net/browse/VEO-78) — *Gateway Worker — CF Worker vahekiht rumba ja ORDS vahel*  
**Project:** VEO / VJS2 · **Type:** Story · **Status:** Planned · **Priority:** Medium  
**Assignee:** Valeri Kuzmin · **Reporter:** Mihkel Putrinsh  
**Created:** 2026-06-01 11:32 · **Last updated:** 2026-06-01 11:37 · **Comments:** 0 · **Links:** none · **Labels/components/fixVersions:** none  
**Assessment date / author:** 2026-08-03 (*FR:Finn*)  
**Method:** Jira fetch via Atlassian MCP + read-only cross-read of the local workspace (`Arhitecture/`, `dev-toolkit/`, `hr-platform/`, `evr-ui-kit/`, `mitselek-ai-teams/`, `VJS2-AI-teams/`). No external posts, no writes outside this file and my scratchpad.

---

## TL;DR

**(1) Actionability.** Not executable as written; it is a strong *architecture brief* wearing a story's clothes. One likely **day-one blocker** (can the Worker reach ORDS at all today? — hidden inside Q5), one **unfalsifiable** DoD item, one DoD item that sits **below the ADR that now governs it** (ADR-013/APP-12, drafted eight days *after* this ticket), and one acceptance criterion that a team will pass **while being wrong** if it copies the org's own existing code. Roughly half a day of grooming — mostly one question to the assignee — makes it executable.

**(2) Team competence.** No deployed team fits. The best-matched roster in the org (`cloudflare-builders`) is **reference material, not deployed**, and is oversized 3×. Every deployed CF-stack team has **shed the exact role this ticket needs** (`harmony`, Integration & Auth). And **no team in the org — deployed or on paper — owns APP-12 resilience engineering**, which is a third of this ticket's real content. Option table in §6.

**On Aen's provisional read** — tested, partly falsified. See §7.

---

## 1. What the ticket asks for

A Cloudflare Worker between the `rumba` frontend and Oracle ORDS. Six stated functions:

1. Validate the `CF_Authorization` JWT against the CF Access JWKS endpoint
2. Extract the email from the JWT (not from the client)
3. Accept a POST JSON body from rumba
4. Translate to the existing ORDS GET call `/wrapper/submit/:email/:permission/:message`
5. Return the ORDS response as JSON
6. Timeout + graceful error when ORDS does not answer

Justified against APP-4 (gateway services), APP-1 (cloud-native on CF), APP-7 (strangle the legacy), ADR-003 (CF Access as identity broker), and the multi-lens review's C2 resilience gap.

The **"why a Worker and not direct ORDS"** section is the strongest part of the ticket and is correct: it argues the Worker is the architecturally right layer regardless of ORDS 20.2's POST-bind limitation, not a workaround for it. That framing should survive any grooming.

---

## 2. Preconditions

### 2.1 The two stated preconditions

| # | Stated precondition | Genuinely met? |
|---|---|---|
| P1 | ORDS `/wrapper/submit` is live (PoC 2026-05-29) | **Was** true at ticket creation. Not re-verifiable from here (read-only, no ORDS access). No re-verification step in the ticket. |
| P2 | CF Access configured on `rumba.dev.evr.ee` | **Was** true at ticket creation. Same caveat — and this is the one whose *configuration detail* (the app AUD tag, the policy) the Worker actually consumes. |

The material problem is not that either is false — it is **staleness with no re-check gate**. The ticket has not moved in **two months** (created and last-touched 2026-06-01; today 2026-08-03), carries zero comments, and sits in `Planned`. Both preconditions are asserted as historical facts about a dev environment. A team picking this up on day one should re-verify both before writing a line, and the ticket does not tell them to.

### 2.2 Preconditions that are missing and load-bearing

| # | Unstated precondition | Why it matters |
|---|---|---|
| **P3** | **How the Worker authenticates *to* ORDS.** | **This is the biggest gap in the ticket.** In the PoC, the *browser* called ORDS — carrying the user's CF Access session. A Worker is a different network path with a different identity. If ORDS `/wrapper/*` currently sits behind CF Access with a user-session policy, the Worker **cannot call it at all** until a service token exists. The ticket buries this inside Q5 and frames it as optional hardening. It may be the happy path's hard prerequisite. See §4, Q5. |
| P4 | CF account / deploy path for the Worker | Not stated. The org account id is discoverable (`dev-toolkit/examples/messageboard/wrangler.jsonc`), but wrangler auth, secret storage (ADR-003 §3: Secret Server, IN-217), and who can deploy to `rumba.dev.evr.ee` are not. |
| P5 | ORDS response shape (content-type, status codes, error bodies) | DoD implies "return the ORDS response as JSON". ORDS 20.2 handlers can return arbitrary media types; the translation layer's error mapping is undefined without this. |
| P6 | Idempotency of `/wrapper/submit` | It is a **write** (Oracle DB write, per the PoC context). This collides directly with the resilience requirement — see §3, item 4. |

---

## 3. Is the "Valmis kui" checklist testable?

| # | DoD item | Testable? | Problem |
|---|---|---|---|
| 1 | Worker deployed and validates the `CF_Authorization` JWT | **Partially — and silently passable while wrong** | "Validates" names no claims. ADR-003 says validate **`aud`/`iss`**. Anderson's 2026-06-02 review of the sibling bridge says **`aud`/`iss`/`exp`** and derive email from the verified payload, never a plain header. But **both** in-org reference implementations verify **only `issuer`** — `hr-platform/conversations/src/hooks.server.ts:31` and `dev-toolkit/examples/messageboard/src/lib/server/auth.ts:19`. A team copying the org's own working code produces a Worker that **passes this criterion and violates ADR-003**. Without `aud`, a JWT minted for *any* app in the same Access team validates here — which defeats the ticket's own stated goal ("võltsimine võimatu"). |
| | | | Second ambiguity: `CF_Authorization` is the **cookie**. Both in-org implementations read the **`cf-access-jwt-assertion` header**. Same token, different carrier; the acceptance test must pin one. |
| 2 | rumba frontend can POST JSON through the Worker | **Yes** | Clean, observable, no notes. |
| 3 | ORDS callable only through the Worker — *or it is decided and documented why not* | **No — unfalsifiable as written** | The "or document why not" branch lets any team close the item with a paragraph. And the do-nothing branch is precisely the defect the org's own security review rates **HIGH and "blocking before production"** (Anderson Finding 2, network-assumption-only trust). Split this into (a) the decision, with a named owner, and (b) if "no", a recorded ADR/NFR deviation — not a code comment. |
| 4 | Timeout / error handling works when ORDS is slow or down | **In principle yes — but the bar is stale and one reading of it is dangerous** | See below. |

### 3.1 DoD item 4 against ADR-013 (APP-12)

**ADR-013 postdates this ticket.** The ticket cites the C2 *gap* from the multi-lens review; ADR-013 is the decision that *closed* C2, drafted **2026-06-09** — eight days after the ticket's last edit — and it bumped the principle set v1.7 → v1.8. ADR-013 names **the Gateway (APP-4) as the resilience boundary**, i.e. this Worker specifically.

APP-12 requires, for this Worker: explicit timeout on every call; **bounded retry with backoff + jitter for idempotent operations**; circuit-breaking; a defined graceful-degradation / last-known-good fallback; correlation-ID propagation; and the dependency's failure behaviour **recorded as an NFR** (FND-6 — `nfr.template.yaml` exists in both `Arhitecture/process/` and `dev-toolkit/`).

The DoD covers roughly the first item and half of the fourth. Two consequences:

- **Under-scoped:** the ticket's resilience content is ~25% of what the governing ADR now demands. No NFR is mentioned anywhere in the ticket.
- **A genuine trap:** a team that reads APP-12 and dutifully "adds retry" to `/wrapper/submit` risks **double-writing to Oracle**. APP-12 and APP-5 both restrict retry to idempotent operations; `/wrapper/submit` is a mutating call and its idempotency is undeclared (P6). *"Bounded retry with backoff and jitter only for idempotent operations (a blind retry of a mutating call risks double freight movement)"* — ADR-013. This needs to be stated in the ticket, not left for a team to discover.

---

## 4. The five open questions — triaged

| Q | Ticket's framing | Real status | Notes |
|---|---|---|---|
| **Q1** Worker in the rumba repo or separate? | open, decide in flight | **Decidable in-flight — LOW** | Proven in-org: `dev-toolkit/examples/messageboard/wrangler.jsonc` runs a Worker *and* static assets from one config via an `assets` binding. Variant A is precedented and does not force the "mixes static and server logic" concern the ticket raises. Not blocking. |
| **Q2** `rumba.dev.evr.ee/api/*` or `api.rumba.dev.evr.ee`? | open, decide in flight | **Decidable in-flight — LOW, but coupled** | Same-origin is simpler *and* auth-relevant: the `cf-access-jwt-assertion` header is injected only on hostnames covered by the Access app. A separate subdomain needs its own Access application — and therefore its own **AUD** — which feeds back into Q4/DoD-1. The ticket presents this as purely a CORS trade-off; it is also an identity-config trade-off. |
| **Q3** Only `/submit`, or `/menu` too? | open, decide in flight | **Decidable in-flight — MEDIUM, and NOT independent of Q5** | Scope size, not technical unknown. But: leaving `/menu` as a direct browser→ORDS call keeps the ORDS hostname reachable from browsers, which **contradicts Q5 answered "yes"**. The ticket presents Q3 and Q5 as independent. They are not — **Q5 = yes forces Q3 = include `/menu`.** Answer them together or the team will re-open one after closing the other. |
| **Q4** CF Access JWKS URL — "find it in the Zero Trust dashboard" | open, needs external lookup | **Already answered in-repo — the ticket asks the wrong question** | Team domain: `https://eestiraudtee.cloudflareaccess.com` (`dev-toolkit/examples/messageboard/wrangler.jsonc:33`, `JWT_ISSUER`). JWKS path: `${issuer}/cdn-cgi/access/certs` (`hr-platform/conversations/src/hooks.server.ts:30`; `dev-toolkit/examples/messageboard/src/lib/server/auth.ts:18`). Two independent in-org sources. **What genuinely needs a dashboard lookup is the thing the ticket never asks for: the Access application's `aud` tag for `rumba.dev.evr.ee`** — required by ADR-003 and Anderson, and absent from both reference implementations. Rewrite Q4 to ask for the AUD. |
| **Q5** Lock ORDS `/wrapper/*` down to the Worker's service token? | "nice extra security", decide in flight | **NOT freely decidable — the one item that can stall day one** | Three reasons, below. |

### 4.1 Why Q5 is not an in-flight decision

1. **It may be a prerequisite, not a hardening step.** Per P3: if ORDS `/wrapper/*` sits behind CF Access today with a user-session policy, the Worker cannot call it without a service token. Then Q5 is not "should we lock down?" but "the Worker does not function until this is configured." **Nobody can tell from the ticket which world we are in.** This single unknown is the difference between a smooth first day and a blocked one.
2. **The "no" branch is above a dev team's authority.** Anderson's review of `rumba_sso_login` — the PL/SQL half of this same SSO chain — rates network-assumption-only trust **HIGH severity** and states Findings 1 and 2 "must close before this bridge carries production traffic," under NIS2 Art. 21(2)(d) / KüTS. Choosing "no" is a security-posture decision needing the architecture owner (the assignee) and the NIS2 accountable owner, not a team's in-flight call.
3. **It is entangled with Q3** (above).

**Recommended pre-work, and it is one question:** ask the assignee what CF Access policy currently protects the ORDS `/wrapper/*` hostname. That answer resolves P3, most of Q5, and constrains Q3.

---

## 5. Unstated but load-bearing

1. **`gateway-ttcms` is Java 23 / Spring Boot, not a Worker.** The ticket says *"Worker ON gateway — sama muster kui `gateway-ttcms`"*. Two sources confirm the stack: `Arhitecture/inventory/vjs-candidates.md:227` ("Gateway TTCMS Technical Documentation (Java 23 + Spring Boot)") and `Arhitecture/inventory/vjs-integration-validation-2026-05-26.md:24`. The analogy holds at the **architectural-role** level only. A team told "same pattern as gateway-ttcms" that opens that repo for implementation guidance loses a day and may import Spring-shaped assumptions. Annotate the pointer.
2. **ADR-003 §5 says token validation belongs in a shared UI-kit library — and that library does not exist.** ADR-003 Decision §5: *"apps never roll their own authentication; token validation is abstracted behind a shared library (in the UI-kit) so the token source is swappable."* Verified: `evr-ui-kit` is a pure Svelte component library with **no `jose`, no JWT, no JWKS, no auth module** anywhere in `src/`. So VEO-78 as written produces the **third** divergent CF-Access validation implementation in the org (hr-platform, the messageboard example, and now rumba-gateway) against an ADR that says there should be exactly one. Either the ticket records the deviation, or the shared-library extraction becomes a linked ticket. It surfaces neither.
3. **Email source is undecided and it costs latency.** The ticket says "extract the email from the JWT." Both in-org implementations instead make a second network call to `${issuer}/cdn-cgi/access/get-identity` — because they need *groups*. VEO-78 needs only email, which **is** a claim in the Access JWT payload, so it can skip the hop. But a team copying `hooks.server.ts` verbatim inherits a second synchronous external dependency inside a Worker whose entire purpose is bounded latency — and Workers carry hard subrequest / CPU / wall-clock caps (ADR-013 Context). Decide explicitly: payload claim (1 hop) or get-identity (2 hops).
4. **Anderson's security review is not linked from the ticket.** `teams/framework-research/docs/anderson-rumba-sso-review-2026-06-02.md` reviews the adjacent half of the same SSO chain and contains the concrete acceptance bar for DoD item 1 (verify `aud`/`iss`/`exp`; derive email from the verified payload, never from the plain header) and the security rationale for Q5. It should be attached.
5. **One of the ticket's five architecture links is stale.** It cites `principles/reviews/2026-05-31-multi-lens-review.md`; the local copy is `Arhitecture/reviews/2026-06-10-multi-lens-review.md` — different directory, different date. Minor, but it is one of the first links a team opens.
6. **No NFR, no environments beyond dev, no rollback.** ADR-007/FND-6 + APP-12 require declared availability/RPO-RTO and dependency-failure behaviour as an NFR. Everything in the ticket is `rumba.dev.evr.ee`; there is no production path and no back-out (ENG-5, reversible deploys).
7. **The assignee is the decision-maker, not the implementer.** Valeri Kuzmin set the principles the ticket cites. That is fine — but it means the Q5 and `aud` decisions route *to* him, and whoever executes needs that channel open from day one.

### 5.1 Verdict on actionability

**Not ready to pick up and execute as written.** The gap is not effort — the CF-Worker body of the work is well-precedented in-org — it is **four specific defects**: a hidden potential blocker (P3/Q5), an unfalsifiable acceptance item (DoD 3), an acceptance bar below the governing ADR (DoD 4 vs APP-12), and an acceptance item a team can pass while being wrong (DoD 1 vs `aud`). Fixing all four is roughly half a day of grooming, of which the load-bearing part is **one question to the assignee** (§4.1).

---

## 6. Team-competence mapping

### 6.1 The work's real skill profile

| | Skill | Share of work | Risk carried |
|---|---|---|---|
| S1 | CF Worker runtime, wrangler config, routes/custom domains, secrets, envs | high | **low** — two proven in-org exemplars |
| S2 | CF Access identity: JWKS, `jose`, `aud`/`iss`/`exp`, service tokens, Zero Trust config | high | **medium** — the exemplars are *incomplete* (no `aud`), so copying is a trap |
| S3 | Resilience to APP-12: timeout, backoff+jitter, circuit-break, degradation, NFR | medium | **high** — no precedent anywhere in the org; non-idempotent-write trap |
| S4 | Oracle ORDS 20.2 call-shape **and ORDS-side lockdown** | low by volume | **high** — Q5/P3, service-token config on an Oracle-hosted endpoint, blast radius |
| S5 | EVR architecture-governance literacy (ADR-003/007/013, APP-4/5/7/12, NIS2/KüTS) | medium | **high** — most of the ticket's defects are only visible with it |
| S6 | TDD / quality gates on Workers (`@cloudflare/vitest-pool-workers`) | medium | low |

### 6.2 Candidates × fit

| Team | State | S1 | S2 | S3 | S4 | S5 | S6 | Named gaps |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|---|
| **hr-devs** | **deployed, live** (PROD-LLM + RC bare-metal) | ●●● | ◐ | ○ | ○ | ◐ | ●●● | Closest *stack* fit — owns `hr-platform`, the only **production** CF Access JWT validation in the org. But the deployed roster is `team-lead, sven, dag, tess, marcus, finn, arvo` — it has **dropped `harmony` (Integration & Auth) and `piper` (CI/CD & Deployment)** relative to `cloudflare-builders`. Harmony's prompt is verbatim *"Cloudflare Access (JWT auth) … JWKS from Cloudflare Access … configure Cloudflare Access groups and policies"* — that is S2, the centre of this ticket, and the live team no longer has it. Zero S4. Chartered to hr-platform, not VJS2/rumba. **See §8 for the precise three-way reading — not every absence is loss.** |
| **cloudflare-builders** | **reference config only — NOT deployed** | ●●● | ●●● | ○ | ◐ | ◐ | ●●● | On paper the **best-matched roster in the org**: `harmony` = S2 exactly, `piper` = S1 deploy + `wrangler secret put` + CF Access setup, `dag` = Workers/API, `alex` = APEX/Oracle analyst (partial S4), `tess` = S6, `arvo` = requirements in Estonian. Gaps are all about *state*, not skill: it is reference material; its team-lead prompt still points at retired `dev-toolkit/teams/cloudflare-builders/` paths and the old TeamCreate/inbox-backup flow; models are stale (`claude-opus-4-6` / `claude-sonnet-4-6`). **And it is 12 members for a 1–2 week story — oversized ~3×** against our own "size = number of distinct abstraction boundaries" heuristic, which yields ~4 here. |
| **apex-research** | **deployed, live** (RC) | ○ | ○ | ○ | ●●● | ●● | ◐ | Owns the Oracle/APEX/VJS side; strong VJS2 domain and ORDS/APEX-20.2 literacy (`Arhitecture/knowledge/apex-20.2/` covers ORDS RESTful services). But its charter is explicit: *"produces migration specs for downstream cloudflare-builders-style teams"* — it is the **upstream spec** team, not a CF implementer, and has no Worker/Access competence. Natural role here is **supplying the S4 half** (Q5 feasibility, endpoint response shape, lockdown blast radius), not owning the story. |
| **uikit-dev** | deployed (`evr-ui-kit`) | ◐ | ○ | ○ | ○ | ◐ | ●● | Svelte 5 component library, design system, a11y (`aalto, eames, rams, braille, tschichold`). No Worker, no auth, no Oracle. On the list only because ADR-003 §5 says the shared token-validation library belongs **in the UI-kit** — which is the *follow-on* ticket VEO-78 implicitly creates (§5.2), not VEO-78 itself. |
| **po-team** | deployed design | ○ | ○ | ○ | ○ | ●● | ○ | Not an implementer — but the right owner for the **grooming half of §1–5**. The ticket's defects (unfalsifiable DoD item, stale ADR/link references, missing NFR, Q5 authority routing) are exactly what `issue-standard.md` governs. Genuine candidate for a **pre-step**, not for the build. |
| **backlog-triage** | design (new) | ○ | ○ | ○ | ○ | ◐ | ○ | Chartered to cross-referencing the Jira VL backlog against hr-platform. Adjacent to grooming, wrong repo, wrong project. Weak. |
| *bigbook-dev, esl-legal, esl-suvekool, mvox, screenwerk, penrose-dev, raamatukoi-dev, bioforge-dev, entu-\*, comms-dev, operator-role* | various | — | — | — | — | — | — | Different domains entirely (bilingual reader, legal research, event ops, signage, tiling, webstore, simulation, Entu consulting, comms infrastructure, deployment operator). Not candidates; listed for completeness. |

● = strong · ◐ = partial · ○ = absent

### 6.3 Gaps no candidate closes

- **S3 (APP-12 resilience) is unowned org-wide.** Not one roster — deployed or on paper — has a resilience/reliability role. No prompt in any team mentions circuit-breaking, backoff, degradation design, or NFR declaration. Both reference CF team configs **predate ADR-013**. VEO-78 is the first ticket that makes a gateway the resilience boundary, so whichever team takes it will be inventing this competence, not applying it. This is an **organisation-level** gap, not a per-team one.
- **S5 governance literacy is thin.** `arvo` (requirements analyst) is the closest fit, but no prompt in any roster references the ADR set or the NIS2/KüTS bar. The Anderson-style security review was a **one-off persona**, not a standing roster role — yet Anderson's findings are the single most load-bearing input to this ticket's acceptance criteria.
- **S2 has a poisoned well.** Both in-org exemplars omit `aud`. Any team told "follow the existing pattern" inherits the defect. Whoever takes this needs the correction stated up front, not left to review.

### 6.4 If the answer is "a new team"

It partly is. The needed **roster shape already exists on paper** (`cloudflare-builders`) but at the wrong size and in a non-deployed state. A right-sized team for VEO-78 is **~4 members**:

1. **Worker/auth builder** — `harmony` + `dag` merged: Worker runtime, `jose`, JWKS, `aud`/`iss`/`exp`, service tokens, wrangler/secrets. Carries S1+S2.
2. **Test engineer** — `tess`-shaped, `@cloudflare/vitest-pool-workers`, plus **fault-injection** tests for the resilience criteria. Carries S6 and forces S3 to be observable.
3. **ORDS liaison** — `alex`-shaped, or borrowed from `apex-research` rather than staffed. Carries S4 and owns the Q5/P3 answer.
4. **Lead with governance literacy** — carries S5: reads ADR-003/007/013 as binding, holds the `aud` correction, routes Q5 to the assignee, and produces the NFR.

That is, honestly: *cloudflare-builders, trimmed to a quarter, pointed at rumba, with an ORDS liaison and one new competence (S3) that nobody currently has.*

---

## 7. Testing Aen's provisional read

| Aen's hypothesis | Verdict | Evidence |
|---|---|---|
| "Preconditions look met" | **Partly falsified** | The two *stated* preconditions were met as of 2026-06-01 and are not re-verifiable from here. But the set is **incomplete**: the load-bearing precondition — how the Worker authenticates to ORDS (P3) — is unstated and may be unmet. The risk is not a false precondition; it is a missing one. |
| "~90% CF-Worker/CF-Access, ~10% ORDS call-shape" | **Right on effort, wrong on risk** | Roughly 90/10 by code volume, yes. But the 90% is pattern-replication with two proven in-org exemplars — genuinely low risk. The 10% ORDS slice carries the lockdown decision, service-token config on an Oracle-hosted endpoint, undeclared response shape, and non-idempotent write semantics. Call it **90/10 by effort, ~30/70 by risk.** This inverts the team-selection logic: the scarce competence is the small slice. |
| "Q4 is the only question needing an external lookup" | **Falsified** | Q4 is answerable from the repo — team domain `eestiraudtee.cloudflareaccess.com` and JWKS path `${issuer}/cdn-cgi/access/certs`, from two independent in-org sources (§4). The lookups genuinely needed are (a) the Access **app AUD tag** for `rumba.dev.evr.ee` — a question the ticket never asks — and (b) the **current CF Access policy on the ORDS hostname** (P3/Q5). Both are Zero Trust dashboard reads; neither is Q4 as phrased. |

The correction that matters for assignment: **the Cloudflare 90% is the safe part.** Choosing a team on CF-Worker competence alone optimises for the low-risk majority and leaves the high-risk minority — ORDS lockdown, and APP-12 resilience, which nobody owns — unstaffed.

---

## 8. Framework-research observation (we-as-researchers)

Two items worth carrying past this assessment, held for Callimachus's queue (not spawned this session):

- **Roster drift — deployed teams silently shed specialist roles.** The shedding is **invisible until a ticket needs the shed role** — exactly what happened here: the org has the perfect role for VEO-78 written down, and no live team has it. Filed as a Protocol-A pattern (`wiki/patterns/roster-drift-from-reference-capability-register.md`).

  **Corrected reading (post-filing).** My first pass said "hr-devs dropped harmony and piper," which is true but imprecise in a way that matters. There are **two boundaries**, and **not every absence is loss**:

  | Boundary | Roles absent | Reading |
  |---|---|---|
  | `cloudflare-builders` (12) → `hr-devs` reference (9) | `harmony`, `piper` | **Capability loss** |
  | same | `alex` | **Correct specialisation** — control case |
  | `hr-devs` reference (9) → `hr-devs` **deployed** (7) | `medici`, `eilama` | **Capability loss**, at a second boundary |

  The discriminator is mechanical rather than a judgement call: **does the shed role's own prompt cite the shedding team's domain?** `harmony.md:15` names `hr-platform/sync/` and `:22` names HR-specific Access group IDs — making it, by its own text, the most hr-devs-specific role in the whole `cloudflare-builders` roster, and the one hr-devs dropped. `alex.md:13-15` names `apex-migration-research/` and `vjs_apex_apps/` — VJS work, correctly absent from an HR team. And `medici` is domain-neutral **and present in hr-devs' own design document**, so scoping cannot explain it: a team's own register counts as an upstream register.

  This matters operationally: **a coverage check that flagged all five absences equally would produce noise and get ignored.** The signal is absences of roles whose competence the team's own domain still requires. (The `alex` control case is Callimachus's catch at filing time, not mine.)
- **Governing decisions can postdate the tickets they govern.** ADR-013 landed eight days after VEO-78's last edit and materially raised its DoD bar; VEO-78 cites the *gap* (C2) but not the *decision* that closed it. Candidate gotcha: *a ticket citing an open architectural gap acquires a hidden dependency on whatever decision later closes it — cite-the-gap references need re-resolution at pickup time.*

---

## 9. Sources

**Jira:** VEO-78 fetched via Atlassian MCP, 2026-08-03.

**Local workspace (read-only):**
- `Arhitecture/principles/adr/adr-003-authentication-authorization.md` — identity broker; validate `aud`/`iss`; §5 shared token-validation library in the UI-kit; service tokens for machine-to-machine
- `Arhitecture/principles/adr/adr-013-resilient-integration.md` — APP-12; gateway as resilience boundary; retry only for idempotent ops
- `Arhitecture/principles/EVR-IT-architecture-principles.md` — APP-4 (:143), APP-5, APP-7
- `Arhitecture/reviews/2026-06-10-multi-lens-review.md` — the C2 source (ticket cites a stale path/date)
- `Arhitecture/inventory/vjs-candidates.md:227`, `Arhitecture/inventory/vjs-integration-validation-2026-05-26.md:24`, `Arhitecture/inventory/repos.md:32` — gateway-ttcms is Java 23 / Spring Boot
- `Arhitecture/knowledge/apex-20.2/sql-workshop-guide/` — ORDS RESTful services reference
- `hr-platform/conversations/src/hooks.server.ts:29-33` — production CF Access validation; issuer only, no `aud`; get-identity second hop
- `dev-toolkit/examples/messageboard/src/lib/server/auth.ts:17-23` and `wrangler.jsonc:33` — same pattern; `JWT_ISSUER = https://eestiraudtee.cloudflareaccess.com`
- `evr-ui-kit/` — verified: no `jose`, no JWT/JWKS, no auth module (ADR-003 §5 library does not exist)
- `teams/framework-research/docs/anderson-rumba-sso-review-2026-06-02.md` — Findings 1 & 2 (HIGH, blocking); `aud`/`iss`/`exp`; NIS2/KüTS framing
- `reference/rc-team/cloudflare-builders/roster.json` + `prompts/{harmony,piper,dag,tess,alex,arvo}.md`; `reference/hr-devs/roster.json`
- `VJS2-AI-teams/teams/hr-devs/{roster.json,prompts/}` — deployed roster, harmony/piper absent
- `designs/deployed/` (apex-research, bigbook-dev, esl-legal, mvox_v4e_web, operator-role, po-team, uikit-dev), `designs/new/`, `registry.json`

(*FR:Finn*)
