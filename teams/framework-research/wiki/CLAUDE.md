# wiki/

Navigation signpost (Tier 2). For the entry-level catalog of every page, go to **`index.md`** (full entry list + per-subdir card counts). This file describes what each subdir IS — purpose, typical entry shape, who writes there. Not a behavioral contract.

## Where to start
- **`index.md`** — the canonical catalog: full entry list, Directories table, Card Tier section
- **`<subdir>/cards/INDEX.md`** — ~30-line extractive card per entry, for fast querying (three-tier context system, #68)

## Subdirectories
- patterns/ — reusable techniques to apply; the largest subdir (the bulk of curated knowledge)
- gotchas/ — cross-agent pitfalls and traps to avoid
- decisions/ — architecture decisions with rationale
- contracts/ — API shapes and type definitions
- references/ — pointers to external artifacts/configs, TTL'd (operational, not generalizable)
- process/ — emerging process patterns (research-team scope)
- observations/ — cross-cutting insights citing topic files (never authoritative)
- findings/ — pre-topic-file findings (research-team scope)
- archive/ — stale or superseded pages

## Key context
Callimachus (Librarian) is the **sole writer** of the wiki. Specialists submit knowledge to him via Protocol A and query via Protocol B (see `prompts/callimachus.md`); they do not write here directly. Each entry has a full evidentiary page plus a queryable card under `<subdir>/cards/`. The four submission classes (pattern/gotcha/decision/contract) map 1:1 to the first four subdirs. Look here for accumulated team knowledge; look at `topics/` for ratified framework design.

(*FR:Finn*)
