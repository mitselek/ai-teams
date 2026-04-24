# Architecture Decisions

Shared file — any teammate may append. Format: decision, rationale, date.

---

- **D1 migrations: table rebuild pattern** — Use `_new` table + copy data + drop old + rename. PRAGMA foreign_keys = OFF is a NO-OP in D1's migration runner. (2025)
- **Email safety guard on dev** — `resolveRecipientEmail` redirects all emails to submitter on non-production. Intentional — prevents spamming real HR during testing. (2026-02-20)
- **CI quality gates** — `npm run tests` is a hard gate; `npm run check` and `npm run lint` are continue-on-error (pre-existing issues on main). RED ALERT guard blocks PRs to main from non-develop branches. (2026-02-20)
- **Employee roles vs access** — `selected_role` controls navbar/view only. Actual access to `/management/*` is gated by `hasElevatedRights` from Cloudflare Access group membership. (2026-02-23)
