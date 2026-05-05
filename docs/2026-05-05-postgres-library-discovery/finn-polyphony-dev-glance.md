# Polyphony glance — Brilliant / xireactor / KB-federation references

Light read-only glance at `mvox-dev/polyphony` for KB-federation references that could short-circuit phase A's re-derivation. Cloned to `_external/polyphony` (567 files).

(*FR:Finn*)

## Top-line (3 bullets)

- **Zero matches for `brilliant` or `xireactor` anywhere in the repo.** Polyphony does not reference Brilliant as inspiration, prior art, or comparison.
- **Polyphony's "federation" is product-domain (choir-to-choir score sharing via Handshake), NOT AI-team-KB federation.** The two-tier `Registry + Vault` architecture is for choral music, not for librarian replication or knowledge-base federation.
- **Phase 2 P2P federation is explicitly DEFERRED with no design done.** GLOSSARY.md, ROADMAP.md, and CONCERNS.md all flag federation/Handshake as "future phase, current focus is single-vault." If PO cited polyphony-dev as "battle-proof for Topology B" they may have meant the *Registry-as-discovery + Vault-as-data* shape, which is real and shipped — but is **not** the librarian-replication / cross-team-KB pattern issue #64 is exploring.

## Source paths checked

- `CLAUDE.md` (repo root) — project overview only
- `README.md` — phase plan; "Phase 2: Federation _(Deferred)_"
- `docs/ARCHITECTURE.md` — system diagram with note "Federation (P2P sharing) is deferred to future phase"
- `docs/ROADMAP.md` line 426 — "Federation (Deferred)"
- `docs/GLOSSARY.md` lines 67-89 — "DEFERRED: Federation and Handshake features are planned for a future phase"
- `docs/CONCERNS.md` lines 36-108 — open questions about federation, all marked deferred
- `docs/LEGAL-FRAMEWORK.md` lines 56, 230, 284 — federation as a *legal/trust* concept (Handshake = explicit mutual-trust contract between choirs)
- `docs/SCORE-LIBRARY-DESIGN.md` line 353 — open design question: "Multi-vault federation: How do shared editions work across trusted vaults?" (no answer)
- `docs/UMBRELLA-ORGANIZATIONS.md` — umbrella orgs are *Registry-level metadata only*, NOT a separate vault; affiliate vaults fetch shared content via Registry API
- `docs/SCHEMA-V2-EVOLUTION.md` — Zero-Storage Registry pattern
- `apps/vault/docs/roles.md` — `librarian` role exists but is the **score-library curator** role, not knowledge-base librarian
- `apps/registry/messages/en.json` — public marketing copy: "Polyphony — Federated Choral Music Sharing"
- `teams/polyphony-dev/CLAUDE.md` (root `.claude/CLAUDE.md`) — team-lead startup procedure (Palestrina) — no Brilliant references
- `teams/polyphony-dev/common-prompt.md` — team-wide standards; no Brilliant references
- `teams/polyphony-dev/brainstorm.md` — **agent memory persistence design**, not KB-federation. Discusses team scratchpads, context compaction, session death; uses agent names from a different historical roster (sven, dag, arvo, tess) and is flagged "Historical document"
- `teams/polyphony-dev/memory/team-lead.md` — recent autonomous-night-shift work (i18n, sections, security); no design discussion of Brilliant or KB federation
- `teams/polyphony-dev/memory/{bentham,byrd,comenius,finn,josquin,tallis,victoria}.md` — agent scratchpads on i18n, tests, copy, accessibility; no Brilliant references
- No `wiki/` directory in `teams/polyphony-dev/`

## Quotes worth lifting (with file:line)

**On Registry-as-discovery (the closest thing to a federation pattern):**
> "Registry stores no files — queries Vault APIs for directory and PD catalog" (`README.md:138`)
> "Zero-Storage Registry: Handles auth and discovery only. Queries Vault public APIs. Does NOT store org/user/score data." (`docs/SCHEMA-V2-EVOLUTION.md:14`)

**On federation being deferred:**
> "Federation (P2P sharing) is deferred to future phase" (`docs/ARCHITECTURE.md:49`)
> "DEFERRED: Federation and Handshake features are planned for a future phase. Current focus is on single-vault functionality and umbrella organization support." (`docs/GLOSSARY.md:69`)
> "Multi-vault federation: How do shared editions work across trusted vaults?" — listed as **open question, not answered** (`docs/SCORE-LIBRARY-DESIGN.md:353`)

**On the federation model that IS there (legal/trust, not data-replication):**
> "Federation extension: When two choirs establish a Handshake, they form an extended private circle based on mutual trust and shared purpose (choral practice)." (`docs/LEGAL-FRAMEWORK.md:56`)
> "Federation requires explicit Handshake (no passive sharing)" (`docs/LEGAL-FRAMEWORK.md:230`)
> "Does Registry route federated traffic? → No, introduces only. Vaults talk P2P." (`docs/CONCERNS.md:45`) — answers a design question but the P2P traffic itself is unimplemented.

## Unattributed-claims list

1. **PO claim "battle-proof for Topology B"** — not directly substantiated in the repo. The Registry-as-discovery + Vault-as-data shape *is* shipped and battle-tested for the choral domain, but the **inter-vault federation layer** Topology B implies (per-team libraries with central federation that lets team A query team B's content) is **explicitly deferred with no implementation and no concrete design**.
2. **No prior art for AI-team-KB-federation in this repo.** The `librarian` role exists but is a music-curator role; the `wiki/` convention does not exist in `teams/polyphony-dev/`; the brainstorm doc on durable knowledge is about per-agent scratchpads, not cross-team replication.
3. **Patterns that DO transfer if we look past the domain mismatch**: (a) zero-storage discovery layer that holds no business data and queries authoritative stores at runtime — directly maps to a federation gateway that holds no entries and queries per-team libraries; (b) Handshake as an explicit-trust contract before any cross-tenant data exchange — directly maps to per-team-librarian opt-in for cross-team query exposure; (c) `librarian` as a distinct role separate from `admin` (curator-without-membership-management) — clean role taxonomy precedent.

**[WARNING]** If phase A wants to "re-derive polyphony's federation architecture", the architecture available to lift is the **shipped Registry+Vault pattern**, not a federation P2P layer. The federation P2P layer is only sketched. PO should confirm whether Topology B citation referred to (a) the shipped Registry+Vault discovery shape, or (b) something else entirely (perhaps a different repo).

(*FR:Finn*)
