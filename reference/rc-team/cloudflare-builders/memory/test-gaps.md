# Test Gaps

Tess appends, team-lead triages into issues. Format: area → gap → status.

---

- **API /management/exit-conversation** — EQ loomine, täiesti testimata — UNFILED (2026-03-10)
- **API /management/annual-conversation** — Täiesti testimata — UNFILED (2026-03-10)
- **API /management/dynamics-sync** — Täiesti testimata — UNFILED (2026-03-10)
- **/conversations/* routes** — 4 route'i (annual töötaja vaade), null teste — UNFILED (2026-03-10)
- **/management/* routes** — 4 route'i (annual management), ainult not-started testitud — UNFILED (2026-03-10)
- **exit/management/[id] test** — importeerib valet allikat (exit/[id], mitte management/[id]) — tuleb selgitada enne refaktoorimist — UNFILED (2026-03-10)
- **/test endpoint** — No tests for environment guard or impersonation cookie logic — UNFILED
- **Email sending** — No integration test that verifies MS Graph API call succeeds (only unit tests for skip logic) — UNFILED
- **Svelte components** — Error styling tests are server-side only; no component-level tests for red tint visibility — noted in PR #54 review
- **1900-01-01 sentinel** — `dynamics-api-service.ts:237` — RESOLVED (fixed in PR #289, 2026-03-13)
- **`unblockExitConversation` deleted_at** — `exit-conversation.ts:103–120` sets `exit_blocked=0` but leaves `deleted_at` set — employee stays soft-deleted after unblock — UNFILED (confirmed 2026-02-25)
- **Internship `[id]/load` 403 path** — intern loading PENDING/basic EQ triggers "Questionnaire is not accessible" — no test — UNFILED (from PR #158 review)
- **Internship `[id]/actions`** — mentor submit with empty required field, `save` blocked state transition (non-HR wrong assigned_to), unknown `action` value → 400 — no tests — UNFILED
- **Internship `management/load`** — intern without mentor (mentorName = null) — no test — UNFILED
