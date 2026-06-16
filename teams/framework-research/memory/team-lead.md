# Team-Lead Scratchpad (*FR:Aen*)

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S53 closed 2026-06-16 -- **CCR (Coordinated Container Rebuild) protocol DESIGNED -> SHIPPED -> first instance PROVEN.** The framework's deployment-lifecycle layer: teams own content (their repo), FR gates activation (windowed rebuild). apex reference instance #1 rebuilt end-to-end (img 1786c34, all 9 stateful paths survived, identity stable, no rollback). Also S53: FR's OWN courier made persistent (Windows Task `FrameworkResearch-Courier`).
- **Deliverables (all on origin/main):** `topics/11-deployment-lifecycle.md` (protocol) · `types/t10-ccr-contracts.ts` + `poc/ccr/validate-manifest.ts`(+test 5/5) · `playbooks/ccr-{review-checklist,rebuild-execution}.md` · `poc/ccr/ccr-rebuild.sh` (operator tooling; also rc host /home/dev/bin/) · spec `docs/ccr-protocol-spec-2026-06-16.md` (gist c81d69e) · skill `inter-team-comms` (~/.claude/skills/) · FR courier persistence spec+scripts (poc/ghost-bridge/).
- **Live correction (empirical beats inference, AGAIN):** `.claude.json` IS depended-on by Claude Code (PO attach proved it; the static gap-analysis "non-issue" call was WRONG). Wiped on rebuild ($HOME root, ephemeral); restorable from `~/.claude/backups/`. Now a CONFIRMED must-fix in apex's follow-up.
- **apex is DRIVING the deploy-surface follow-up** (5 items incl. .claude.json restore) -- FR reviews when it lands. NOT FR queued work.
- **Carry-forward:** see NEXT-SESSION BOOT + Standing watch below.

---

### SESSION 53 WRAP -- 2026-06-16 (CCR protocol shipped + apex instance #1 proven)

- [MILESTONE] **CCR protocol** -- the "larger engineering opportunity" PO spotted: stop hand-rolling per-team container-persistence one-offs; formalize ONE repeatable procedure (PR-as-contract + hub-coordinate; thin `deploy/` surface = Dockerfile stable-path payload + typed MANIFEST). Designed (brainstorm -> spec v2, apex 6-pt review folded in) -> built subagent-driven on branch fr/ccr-protocol (8 commits, final review 7/7, validator 5/5) -> merged 0db208c.
- [MILESTONE] **apex reference instance #1 PROVEN** -- apex authored PR #166 (deploy/ surface + typed REBUILD-REPORT + courier-independent send-quiescent.sh); FR reviewed via the live checklist (which caught its OWN tsx-e tooling false-green -> fixed 84264f8; and drove apex's ephemeral-audit -> found .credentials.json + projects/). #165 (FR hardening + durable-logs ce181ed6) + #166 merged -> origin/main 4d68b88 -> rebuilt (Hopper via dev@rc-host docker-exec): all 9 stateful survived, identity stable, courier fp unchanged, DEGRADED(ea-model /tmp only) -> NOT FAILED -> no rollback.
- [DECISION -- PO] teams own content / FR gates activation (Monte: legislative team / judicial+executive FR). Manifest TYPED (YAML frontmatter + t10 schema). Risk-tiered gates. Finish-design-before-instance.
- [LEARNED] **Empirical beats inference, TWICE this session:** (1) `claude "x"` positional DOES pre-seed an interactive session that stays live (contradicts claude-code-guide docs); (2) `.claude.json` IS depended-on (live PO attach contradicted the static "non-issue" gap-analysis). The team's recurring lesson, reinforced hard.
- [LEARNED] **The manifest does its job** -- declaring stateful paths FORCED apex's ephemeral-audit, surfacing 2 missed must-keeps. The typed contract makes "what must survive" explicit, not hoped-for.
- [LEARNED] **Build-source drift caught AGAIN** (rc clone on stale FR branch, no deploy/) -- Hopper hard-gate-aborted pre-build, ff'd to main (resolves the S52 build-source carry-forward). The L1<->L2 transit-gap class.
- [GOTCHA] apex entrypoint does NOT invoke deploy/startup on headless `up` -> REBUILD-REPORT doesn't auto-fire + no tmux/claude auto-launch (only on SSH-login). Container PID 1 = the exec'd CMD bash. -> follow-up items 3+4.
- mitselek-ai-teams: many S53 commits culminating 29f458b. apex repo: #165 ce181ed6 + #166 -> main 4d68b88.

---

### NEXT-SESSION BOOT (re-orient instructions for S54)

1. Read `startup.md` first. Steps 1-5 (Sync -> Reset team state -> Restore inboxes -> wait for PO before spawning). Pull `mitselek-ai-teams`.
2. **Don't pre-spawn any agent.** Wait for PO direction.
3. **If apex sends the deploy-surface follow-up PR (likely next contact):** apex-authored; FR REVIEWS via `playbooks/ccr-review-checklist.md`. 5 expected items: (1) health-report enumerate ALL 11 manifest paths (was 6/11); (2) fix trigger detection under host-net (samples host uptime, never <120s); (3) entrypoint invoke deploy/health-report on boot (auto-fire headless); (4) .bashrc auto-tmux for zero-friction SSH->Claude; (5) **`.claude.json` declare-stateful + restore-from-`~/.claude/backups/`-on-boot** (CONFIRMED must-fix, the resurrected fix #3). Touches stateful/secret => HIGH-RISK gates. Spawn Brunel(review)+Hopper(rebuild on PO go). `ccr-rebuild.sh` mechanizes the rebuild now.
4. **If PO wants the SHARED-courier fixes** (separate track, shared `stationmaster-courier.py`): spawn Herald+Brunel. (1) lock-staleness boot_id->PID-1-starttime (spec `docs/courier-lock-staleness-fix-spec-2026-06-15.md`, impl-ready); (2) inject down-agent occupied-inbox; (4) partition-by-`read` in inject_batch (DORMANT on our Windows substrate, latent for the read:true regime). Land via PR.
5. **If PO wants Cal spawned:** large file-queue -- CCR protocol + the 2 empirical-beats-inference corrections (.claude.json, positional-claude) + manifest-forces-ephemeral-audit pattern + verified-CLI-launch-facts + build-source-drift gotcha + the 7 parked S52 items.
6. **If PO gives go on GitHub retention-flip:** draft from TRUTHS.md I-1 + version bracket; PO reviews before filing.

### Standing watch items going into session 54

- **CCR protocol is LIVE + proven** -- other teams (hr-devs, future) can adopt; `ccr-rebuild.sh` + the 2 playbooks + t10 contracts are the reusable kit. Framework scaled to the deployment-lifecycle layer.
- **VERIFIED CLI launch facts (reusable, all container teams):** `--prompt` INVALID; `claude -p "x"` headless prints+exits; `claude "x"` positional = interactive+pre-seeded+stays-live; `--permission-mode dontAsk --allowedTools "..."` = unattended tools no-hang (bypassPermissions refuses root); fresh session default (no --continue/--resume in entrypoint); hr-devs lazy-SSH autostart = .bashrc gated on $SSH_CONNECTION -> create-or-attach tmux + send-keys claude.
- **apex container fp** `SHA256:z1/fXAE8...mh4vA` -- persisted across this rebuild. If it CHANGES on a future rebuild -> host-key persist regressed.
- **FR courier** `FrameworkResearch-Courier` Windows Scheduled Task running persistently (logon/reboot/resume triggers). Nonblocking: pkill-vs-session-launcher guard on start-fr-courier.ps1.
- **3 ccr-rebuild.sh hardening minors** (optional): gates-confirmed tripwire; report-warn-not-die (don't wire into exit==health automation); status grep->json-parser.
- **Running Opus 4.8** (roster pins fable-5; documentation-only deviation per roster _substrate_note, carried since S51).
- **Unchanged carries:** GitHub retention-flip (PO go), A1 audit overdue (S44), hr-devs 3rd-customer, phantom-brunel, ELEX, Entu #42. Hub-admin access needs `~/.ssh/id_ed25519_apex` (michelek@).

(*FR:Aen*)

---
*Earlier sessions pruned 2026-06-16 per the 100-line discipline. Full history in git; durable knowledge in `wiki/`. S52 = apex container hardening (PR #165, 6 commits). S51 = FR courier daemon LIVE + stationmaster docs FINAL.*

(*FR:Aen*)
