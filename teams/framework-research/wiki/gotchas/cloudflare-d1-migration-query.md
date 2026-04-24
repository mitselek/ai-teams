---
source-agents:
  - finn
discovered: 2026-04-10
filed-by: librarian
last-verified: 2026-04-10
status: active
source-files:
  - hr-platform/teams/hr-devs/memory/sven.md
  - hr-platform/teams/hr-devs/memory/dag.md
  - hr-platform/teams/hr-devs/memory/finn.md
source-commits: []
source-issues:
  - "hr-platform#36"
  - "dev-toolkit#38"
  - "hr-platform#237"
ttl: 2026-10-10
---

# Cloudflare D1 Migration and Query Gotchas

10 consolidated gotchas from hr-devs deployment experience. Stack-level traps that apply to any Cloudflare D1 project. Gotcha #1 caused actual data loss. Gotcha #10 caused a $5K incident.

## 1. PRAGMA foreign_keys = OFF is a no-op on D1

DROP TABLE on a parent fires CASCADE deletes into children regardless. `PRAGMA defer_foreign_keys = ON` also does not help — it only defers constraint *checks*, not CASCADE *actions*. **Root cause of actual data loss in hr-platform.**

## 2. Safe migration pattern: `_new` table rename

The only safe migration pattern for table rebuilds:

1. Create ALL `_new` tables with FKs referencing `_new` parents (not old tables)
2. Copy all data from old to `_new`
3. Drop old tables **parent-first** (CASCADE fires into old children, but data is safe in `_new`)
4. Rename `_new` to final names

Drop order matters: parent-first, not leaf-first. Dropping children first causes "no such table" errors when CASCADE tries to fire into already-dropped children.

## 3. D1 BLOB handling is treacherous

- SQL statement limit ~100KB — hex literals like `X'...'` fail for any file >50KB
- D1 REST API bind params are always TEXT, not BLOB — passing a base64 string as a parameter stores it as TEXT (`typeof(data) = 'text'`)
- `{"base64": "..."}` format stores `[object Object]` — this format is Workers runtime only, not REST API
- **Solution:** `INSERT ... VALUES (?, unhex(?), ...)` with hex-encoded string bind params to get actual BLOB type

## 4. UNIQUE constraint silently drops INSERT OR IGNORE rows

Partial unique indexes (e.g., `UNIQUE ... WHERE deleted_at IS NULL`) interact badly with `INSERT OR IGNORE` — rows with duplicate key on the partial index are silently skipped with no error. Always use distinct key values in test seeds.

## 5. INSERT OR IGNORE + NOT NULL silently drops rows

If a NOT NULL column is omitted from an INSERT OR IGNORE statement, the row is silently dropped instead of raising an error. Always check `PRAGMA table_info(table)` for NOT NULL columns before bulk inserts.

## 6. NOT NULL columns cannot be set to NULL via UPDATE

`UPDATE SET column = NULL` fails on NOT NULL columns (as expected), but the workaround is not obvious: use DELETE + re-INSERT instead of trying to null out corrupted values.

## 7. Failed migration still recorded in d1_migrations

When a migration fails (e.g., NOT NULL violation), the migration name is recorded but marked failed. Future `wrangler d1 migrations apply` will not retry it. **Fix:** run corrected SQL manually via `--command`, then `INSERT OR REPLACE INTO d1_migrations` to mark as applied.

## 8. Migration runner executes each statement in separate context

PRAGMA directives set in one statement have no effect on subsequent statements in the same migration file when run through `wrangler d1 migrations apply`. **Workaround:** write full SQL (with PRAGMA) to a standalone file, run via `wrangler d1 execute --file=path.sql` which batches all statements in one connection.

## 9. ON CONFLICT does not work with partial unique indexes

SQLite's `ON CONFLICT(col1, col2)` only works with simple UNIQUE constraints, not partial unique indexes created with WHERE clauses. Replacing a simple UNIQUE constraint with partial indexes breaks all existing ON CONFLICT clauses. **Use SELECT-then-INSERT/UPDATE pattern instead.**

## 10. workers-bindings MCP d1_database_query has no read-only mode

It hits production DB with full write access. **Real incident: a WHERE-less UPDATE via the MCP tool cost $5K.** Do NOT use workers-bindings MCP for D1 database access. Use local miniflare for development instead.

## Provenance

- hr-platform#36 / dev-toolkit#38: gotchas 1, 2, 3 (canonical issues)
- hr-devs Sven scratchpad (lines 59-93): gotchas 4, 5, 6, 7
- hr-devs Dag scratchpad (lines 33-46): gotcha 8
- hr-platform#237: gotcha 9
- hr-devs Finn scratchpad (line 135): gotcha 10
- hr-platform CLAUDE.md "D1 Migration Patterns" section: condensed versions of gotchas 1, 4, 8

(*FR:Callimachus*)
