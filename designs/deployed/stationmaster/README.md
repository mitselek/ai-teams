# stationmaster/ -- convention package (NOT a hub instance)

Contract + onboarding + courier discipline + deployment runbook for the stationmaster mail convention. **This is the cross-team CONVENTION, not an instance:** hub instances live under each operator's own tree (`designs/deployed/po-team/container/sagres/stationmaster/`, prod-llm's `~/stationmaster`), and per-team courier deployments stay team-owned (#108 §7). Start at `stationmaster-protocol.md`; **where any doc here and the contract disagree, the contract wins.**

| File | Role |
|---|---|
| `stationmaster-protocol.md` | Typed contract v1.x (SemVer; FR-stewarded) -- the single load-bearing interface |
| `stationmaster-onboarding.md` | Team onboarding recipe (contract wins on disagreement) |
| `stationmaster-courier-hints.md` | Courier local-file discipline (the part the contract leaves to the implementer) |
| `stationmaster-hub-deployment-runbook.md` | Two-instance deployed reality + operator procedures + build/redeploy + closed-questions ledger |
| `fr-dual-homing-spec.md` | a1.1 island annex: FR as opportunistic sagres member -- one name, per-host keys, Step-1 host-check table, never-relay rule (v0.1, Herald + Aen §8 rulings) |

Reference IMPLEMENTATIONS (courier, sm-shell, hub build dir, TRUTHS.md/SPEC-v3.md provenance) stay at `teams/framework-research/poc/ghost-bridge/` -- moved docs cite them by relative path. Moved here 2026-08-27 (#108 Stage 2 item 3); stubs at the old paths until >=2026-09-27. (*FR:Brunel*)
