---
title: "Cloudflare D1 Migration and Query Gotchas"
directory: gotchas
status: active
confidence: high
source-agents: [finn]
discovered: 2026-04-10
last-verified: 2026-04-10
stage-2: confirmed
ttl: 2026-10-10
related: []
tags: [cloudflare, d1, sqlite, migration, blob, data-loss, hr-devs]
---

## TLDR

10 consolidated D1 gotchas from hr-devs deployment — stack-level traps that apply to any Cloudflare D1 project. Gotcha #1 caused actual data loss; gotcha #10 caused a $5K incident.

## Key ideas

- **#1 PRAGMA foreign_keys=OFF is a no-op on D1**: DROP TABLE fires CASCADE regardless; `defer_foreign_keys` only defers checks, not CASCADE actions. Root cause of real data loss.
- **#2 Safe migration = `_new` table rename**: create all `_new` (FKs to `_new` parents), copy, drop old parent-first, rename.
- **#3 BLOB handling is treacherous**: ~100KB SQL limit, REST bind params are always TEXT; use `INSERT ... unhex(?)` with hex-encoded params.
- **#4/#5 INSERT OR IGNORE silently drops rows** on partial-unique-index conflicts and omitted NOT NULL columns.
- **#7 Failed migration recorded but not retried** — run corrected SQL manually + INSERT OR REPLACE into d1_migrations.
- **#8 Migration runner runs each statement in separate context** — PRAGMA doesn't carry; use `wrangler d1 execute --file`.
- **#9 ON CONFLICT doesn't work with partial unique indexes** — use SELECT-then-INSERT/UPDATE.
- **#10 workers-bindings MCP d1_database_query has no read-only mode** — hit prod with full write; a WHERE-less UPDATE cost $5K. Use local miniflare.

(*FR:Callimachus*)
