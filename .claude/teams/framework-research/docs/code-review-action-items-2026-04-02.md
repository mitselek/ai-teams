# Code Review Action Items — 2026-04-02

Four-reviewer parallel assessment of mitselek-ai-teams project.

## Critical

- [ ] **Fix plaintext credentials in .bashrc and mcp.json** — tokens written in cleartext to persistent volumes. Move to runtime env var reads or mounted secret files. (infra H1/H2)
- [ ] **Fix comms-dev test suite** — 38 failures, 173 skipped on Windows. Platform-gate UDS tests, fix or skip cleanly. (comms-dev #1)

## High

- [ ] **Extract shared entrypoint functions** — `clone_or_pull()`, volume ownership, SSH setup, .bashrc writing duplicated across 3 entrypoints. Create `lib-entrypoint.sh`. (infra M4)
- [ ] **Unify spawn_member.sh** — 4 diverging copies across teams. Maintain one canonical version. (infra M5)
- [ ] **Quote env var values in entrypoint .bashrc writing** — values with spaces/metacharacters will break. (infra H3)
- [ ] **Mark v1/v3 architecture status in comms-dev** — dual architecture with no deprecation path. Clarify which is target. (comms-dev #3)
- [ ] **Add TTL to hub seenIds** — unbounded memory growth in v3 hub server. (comms-dev #8)

## Medium

- [ ] **Add `topics/README.md`** — reading-order diagram and one-line summaries for 313K of interconnected content. (topics #4)
- [ ] **Add `designs/README.md`** — document design lifecycle (draft → reviewed → deployed → archived). (topics #5)
- [ ] **Clean up T02 opening** — remove brainstorm stubs answered by Finn/Herald content. (topics #1)
- [ ] **Move orphan prompts** — `lesseps.md`, `richelieu.md`, `strabo.md` out of `prompts/` into `designs/` or `reference/`. (configs I1)
- [ ] **Fix roster.json workDir** — path `mitselek/ai-teams` doesn't match actual `mitselek-ai-teams`. (configs I4)
- [ ] **Clean up stale inboxes** — remove inboxes for non-roster agents, resolve `monte.json` vs `montesquieu.json`. (configs I2)
- [ ] **Clean stale spawn scripts from /tmp** — `spawn_member.sh` never deletes temp files. Add trap cleanup. (infra M1)

## Low

- [ ] **Update common-prompt.md member list** — missing monte. (configs I6)
- [ ] **Prune Celes scratchpad** — 89/100 lines. (configs I3)
- [ ] **Complete T03 Protocol 4B** — label convention section truncated. (topics #2)
- [ ] **Extract T06 platform workarounds** — 68K file mixing protocol with troubleshooting. (topics #3)
- [ ] **Deduplicate backlog-triage prompts** — identical files in two locations. (topics #6)
- [ ] **Eliminate `as any` in comms-dev** — use WeakMap for socket auth, type UDS response. (comms-dev #2)
- [ ] **Unify package manager** — root uses npm, standards say pnpm. (comms-dev #4)
- [ ] **Add ESLint to comms-dev root** — v3 packages have it, src/ does not. (comms-dev #5)
- [ ] **Deduplicate stableStringify** — two implementations will drift. (comms-dev #6)
- [ ] **Unify statusline scripts** — 3 copies with minor variations, use env vars. (infra L1)
- [ ] **Remove deprecated `version: '3.9'`** from docker-compose.test.yml. (infra L4)

## Grades

| Area | Grade |
|---|---|
| Team configs & prompts | A- |
| Topics & designs | B+ |
| comms-dev code | B+ |
| Infrastructure | B+ |

(*FR:team-lead*)
