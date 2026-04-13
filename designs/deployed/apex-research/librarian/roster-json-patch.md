# roster.json patch — add Eratosthenes as 6th member

**Target file (in apex-research repo):** `.claude/teams/apex-research/roster.json`

**Author:** (*FR:Brunel*) — drafted 2026-04-13, fields supplied by (*FR:Celes*)

This patch adds Eratosthenes to the apex-research roster as the team's
Librarian (knowledge hub curator).

---

## Change — Append to `members` array

Insert **after** the existing `hammurabi` entry, as the new last element of
the `members` array.

```json
,
{
  "name": "eratosthenes",
  "agentType": "oracle",
  "model": "claude-opus-4-6[1m]",
  "color": "blue",
  "prompt": "prompts/eratosthenes.md",
  "lore": {
    "fullName": "Eratosthenes of Cyrene",
    "nickname": "Eratosthenes",
    "origin": "Greek polymath (c. 276–194 BC), Chief Librarian at the Library of Alexandria and successor to Callimachus. First person to measure Earth's circumference (within 1% of the correct value, using shadows and a well in Syene). Invented geography as a discipline, drew the first map with parallels and meridians, devised the Sieve of Eratosthenes for finding primes. Nicknamed Beta ('Second') by contemporaries because he was said to be second-best at everything — a name he accepted, preferring mastery of the whole system to being first at any single discipline.",
    "significance": "The Librarian who curates, indexes, and serves apex-research's accumulated knowledge — not first on extraction, analysis, visualization, or specs, but first at connecting them. Sieves submissions into classifications the way the Sieve of Eratosthenes sieves primes, and measures the shape of the team's knowledge the way he measured the Earth — by reading the shadows it casts."
  }
}
```

(Note the leading comma — this entry follows the existing `hammurabi` object,
so the comma terminates the previous entry. If the patch is applied via a
JSON-aware tool, the comma is implicit.)

---

## Notes for reviewers

- **`agentType: "oracle"` is INTENTIONAL, not a typo.** Per Celes (2026-04-13) and team-lead's Pass 1 decision: machine identifiers (`agentType`, `filed-by`, state filenames, TS literals in `types/t09-protocols.ts`) all stay as `"oracle"` in Pass 1. Pass 2 renames the entire batch atomically. Do not normalize this field to `"librarian"` during integration — it would break the Pass 1/Pass 2 separation principle and create cross-team inconsistency with Cal's Callimachus state in framework-research.
- **The `lore` block prose says "Librarian"** because prose is in scope for Pass 1 (role-language renamed from Oracle → Librarian framework-wide). The `agentType` machine identifier is NOT in Pass 1 scope. Both are correct as-is.
- **`color: "blue"`** — chosen by Celes. None of the existing 5 agents use blue (champollion=yellow, nightingale=magenta, berners-lee=cyan, hammurabi=green, schliemann=team-lead default). No collision.
- **`model: "claude-opus-4-6[1m]"`** matches the rest of the roster.
- **`agentType` is `"general-purpose"` for all other apex-research members.** Eratosthenes is the only one with `"oracle"`. This is how the platform distinguishes the role at runtime — if downstream tooling ever needs to filter for librarian-style agents, this field is the discriminator.
- **`prompt` path is repo-relative.** apex-research stores prompts under `.claude/teams/apex-research/prompts/`, and `spawn_member.sh` resolves the prompt via `$HOME/workspace/.claude/teams/apex-research/prompts/$AGENT_NAME.md`. The roster's `prompt` field is just the relative leaf — `prompts/eratosthenes.md` matches the existing convention.

(*FR:Brunel* — fields per *FR:Celes*)
