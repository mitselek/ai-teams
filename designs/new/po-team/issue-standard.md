# Product-Owners Team -- Epic/Task GitHub Issue Standard

(*FR:Herald*) — label/milestone/decomposition + templates; naming aligned with Celes's roster & product-registry.

**Status:** rev 2 — Celes's label draft reconciled in (`area:*` per-product, `epic:<slug>`, cross-product `Blocked on` convention, lean-vs-ladder status decision). Priority labels held as a **proposal pending Mihkel** (§7), not adopted (Aen ruling). `product:*` slugs locked (mvox / bigbook / ad-auto / field-network). Pending only: Mihkel's org-board + priority calls. S60, 2026-07-14
**Applies to:** all four product repos **identically** — mvox, bigbook, ad-auto, field-network (Aen decision Q6). Language: **English**.
**Companion:** [`protocols.md`](protocols.md) §2 (this doc is the concrete authority for what §2.1 summarizes).

**Principle (minimal specificity):** one small label set + GitHub-native task-lists + two issue templates. Nothing here needs a bot; it is all standard GitHub. The same set is created in every product repo so a PO's muscle memory is identical across products.

---

## 1. The two work units

| Unit | GitHub object | Owner | Purpose |
|---|---|---|---|
| **Epic** | Issue, label `epic` | **PO** (opens, grooms, closes) | A product initiative with acceptance criteria and a task checklist. The PO's unit of intent. |
| **Task** | Issue, label `task` | **Remote team-lead** (opens under an epic; PO opens only the high-level seed tasks) | One concrete, mergeable deliverable. The remote team's unit of work. |

Closing rule (from `protocols.md` §2.1): a PO closing a *task* by hand, or a remote team closing an *epic*, means the acceptance gate was skipped — a smell. Tasks close by **PR merge** (`Closes #<task>`); epics close by the **PO** when acceptance criteria are met.

---

## 2. Label taxonomy (create identically in every product repo)

Keep it small. Five core labels do the work; two optional families are for scale.

### Core (required in all four repos)

| Label | Color hint | Meaning | Who applies |
|---|---|---|---|
| `epic` | purple | This issue is a PO-owned initiative | PO at open |
| `task` | blue | This issue is a remote-team deliverable under an epic | opener |
| `ready` | green | Groomed and open for pickup: an epic with acceptance criteria + a seeded task list, or a task with a clear done-definition | PO (epics + the seed tasks it opens) / remote lead (tasks it cuts) |
| `blocked` | red | Work stalled; the blocker is named in a comment | anyone; cleared by whoever unblocks |
| `needs-po` | orange | Remote team needs a PO decision — the escalation pull-signal (`protocols.md` §3) | remote team |

`ready` is the load-bearing workflow signal: it is the mail-dispatch handshake made durable. A PO mails "pick up #47" (`protocols.md` §1.1 `send()`) **only** for issues already labeled `ready` — so a dropped/rebuilt session never loses the "this is dispatchable" state; it is on the issue, not in anyone's inbox.

### Optional (adopt when a repo's volume warrants — same names if adopted)

| Family | Labels | Use |
|---|---|---|
| Epic grouping | `epic:<slug>` | Optional label-based grouping of tasks to their epic, in addition to the `Part of #<epic>` body convention (§4). Useful only if a repo wants to *filter* a board by epic without opening the epic issue. |
| Product tag | `product:mvox` / `product:bigbook` / `product:ad-auto` / `product:field-network` | **Only** for a cross-repo org-level project board. Within a single product repo it is redundant (the repo *is* the product). Add it if/when Mihkel wants one board spanning all four products; otherwise skip. Values = the canonical `product-slug`s in Celes's product-registry, **locked** (confirmed S60). Note: `field-network` is the slug; "mikrotik" is that product's domain context, not the slug. |

### Per-product, PO discretion (NOT standardized)

Domain-area labels — e.g. `area:auth`, `area:player`, `area:import` — are each PO's own call within their product. They are deliberately **not** cross-product-standardized: the four products don't share a domain vocabulary, and forcing one would be false precision.

`[CONV]` — every *standardized* label name here is a convention; rename freely, but rename in **all four repos together** (the "identical" promise is the point). Per-product `area:*` labels carry no such constraint.

### Why a lean status vocab, not a full `status:*` ladder (reconciliation with Celes's draft, her Q1)

Celes's draft proposed `status:backlog|in-progress|blocked|review|done`. My protocol-shape call: **keep only the status signals GitHub does not already track natively, and let native state carry the rest.** Rationale — a full status ladder *duplicates* state GitHub already holds, and duplicated state desyncs (someone closes the issue but forgets to flip `status:done`):

| Lifecycle state | How it's read — WITHOUT a redundant label |
|---|---|
| backlog | issue **open**, not yet `ready` |
| ready / dispatchable | **`ready`** label (non-native signal — kept) |
| in-progress / review | issue open with a **linked PR** (`Part of`/`Closes` back-reference); the PR *is* the review surface |
| blocked | **`blocked`** label (non-native — kept) + a named blocker |
| needs a PO decision | **`needs-po`** label (non-native — kept) |
| done | issue **closed** (by PR merge for tasks; by PO on acceptance for epics) |

So the five core labels *are* the cross-board-consistent status vocab — Henry and Nunes read any product's board identically (open+not-ready = backlog, `ready` = dispatchable, open+PR = in flight, `blocked`/`needs-po` = attention, closed = done) without a parallel label set that can drift from reality. If a product later proves it genuinely needs an explicit in-progress/review label, add it *in all four repos together* — but start lean.

### Cross-product dependency convention (Celes's Q2 — the seam with `protocols.md` §3)

When product A is blocked on product B (e.g. mvox waiting on ad-auto), do **not** invent a parameterized label — a label value is a static string and cannot carry an issue number, so `blocked-on:#N` can't name *which* issue. Instead:

1. Apply the plain **`blocked`** label, and
2. put a body/comment line **`Blocked on <owner>/<repo>#<N>`** — a full cross-repo issue reference, which GitHub renders as a live cross-links between the two products' boards.

A **cross-product** block is by definition outside the owning PO's mandate (it needs another PO's team), so it is an **escalation to the team-lead (Henry)** per `protocols.md` §3 — the PO raises it up, rather than one PO reaching into product B directly. Same-product blocks stay with the owning PO. This is exactly where the label standard touches the inter-team protocol: the `blocked` label + cross-repo reference is the *durable record*; the escalation to Henry is the *action*.

---

## 3. Milestones

**Milestone = a shippable increment / release, grouping several epics.** It is the coarse, dated rollup; the epic is the fine, checklisted intent. Do not model an epic *as* a milestone — an epic needs a body, acceptance criteria, a comment thread, and its own open/close; a milestone gives only a title, a due date, and a progress bar.

```
Milestone  (release / time-boxed goal, has a due date)
  └── Epic issue        (PO-owned, acceptance criteria + task checklist)
        └── Task issue   (remote-team-owned, one PR)
```

Milestones are **optional** and PO-driven: use one when several epics ship together or share a deadline; skip it for a lone epic. Assign epics (and, if useful, their tasks) to the milestone so its progress bar reflects real completion.

---

## 4. Epic -> task decomposition (GitHub-native, no tooling)

Use GitHub's task-list linkage so progress is mechanical:

1. **PO opens the epic** with a `## Tasks` checklist. Each line either states a task to be cut, or references an existing task issue:
   ```markdown
   ## Tasks
   - [ ] #123 Wire the import parser
   - [ ] #124 Migrate the settings schema
   - [ ] Draft the export format   ← not yet an issue; remote lead cuts it
   ```
   GitHub renders `- [ ] #123` as a tracked sub-issue and shows an auto-progress count on the epic.
2. **Remote team-lead cuts the concrete task issues** (the unchecked non-issue lines become `task` issues), each carrying `Part of #<epic>` in its body. PO grooms/reprioritizes.
3. **A task closes by PR merge** (`Closes #123`), which **auto-checks** its line in the epic — so the epic's progress advances with zero manual bookkeeping, and the two-level completion check (`protocols.md` §1.3) has a durable signal.
4. **The PO closes the epic** when the checklist is complete *and* acceptance criteria are met — the checklist being all-checked is necessary, not sufficient; acceptance is the PO's judgment.

**Dispatch binding:** the dispatch mail points at the issue number; the issue is the contract (`protocols.md` §2.1, mirroring CCR "the PR is the contract"). Mail never carries the spec.

---

## 5. Issue templates

Commit these to each repo at `.github/ISSUE_TEMPLATE/`. English. Identical across all four repos.

### `.github/ISSUE_TEMPLATE/epic.md`

```markdown
---
name: Epic
about: A product initiative owned by the Product Owner
title: "[EPIC] "
labels: ["epic"]
---

## Goal
<!-- One paragraph: what outcome this epic delivers and why. -->

## Acceptance criteria
<!-- The checklist the PO will judge "done" against. Concrete and testable. -->
- [ ]
- [ ]

## Tasks
<!-- Seed decomposition. Reference task issues as `- [ ] #NNN`; the remote
     team-lead cuts issues for the plain lines. -->
- [ ]

## Notes / references
<!-- Links to code (read-only reference clone), prior epics, designs. -->

<!-- Owner: Product Owner. Do not close until acceptance criteria are met. -->
```

### `.github/ISSUE_TEMPLATE/task.md`

```markdown
---
name: Task
about: One concrete, mergeable deliverable under an epic
title: "[TASK] "
labels: ["task"]
---

Part of #<epic>

## Deliverable
<!-- One concrete thing. If it needs more than one PR, it's probably two tasks. -->

## Done when
<!-- The done-definition. Usually satisfied by a merged PR that says `Closes #<this>`. -->
- [ ]

## Notes
<!-- Constraints, links. -->

<!-- Owner: remote team. Closes via PR merge (`Closes #<this>`), not by hand. -->
```

---

## 6. Provisioning (folds into `protocols.md` §4 growth checklist item 4)

When a new product repo goes live, "labels created" (checklist item 4) means: create the five core labels + the two issue templates, from this standard, **before** the first epic is seeded (item 6). A one-time `gh label create` script per repo keeps the four repos identical; whoever provisions a new repo runs the same script.

---

## 7. Open items for Mihkel

*(Celes naming alignment — CLOSED S60: `product:*` slugs locked to `mvox` / `bigbook` / `ad-auto` / `field-network`, no roster/prefix clash.)*

- **Mihkel:** (a) do you want a single **cross-repo org project board** (→ adopt the `product:*` labels) or per-repo boards (→ skip them)? (b) GitHub write scope: the remote side needs issue + PR CRUD; the PO side needs **issue-write** on the repo (epic create/label/close is the PO's Tier-M work — `henry.md` add-a-PO step 2: do not spawn a PO that cannot drive its board). Separately, the PO's *git* access to the local reference clone stays **pull-only** — push disabled per `protocols.md` §2.3, §6 Q7.

### Pending Mihkel — priority labels (proposal, NOT yet adopted)

Whether to use priority labels at all is Mihkel's call (Aen ruling, S60), so priorities are **not** part of the standard yet. The **proposed** scheme, held here so it's ready to adopt verbatim if approved: `priority:P0` / `priority:P1` / `priority:P2` (namespaced, consistent with FR house style; PO triage ordering within a product). If adopted, create it in all four repos together.

(*FR:Herald*)
