---
title: "Sudo Elevates the Final Command, Not the Shell Expansion -- a NOPASSWD Glob Grant Can List in sudo -l and Never Fire"
directory: gotchas
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-08-26
last-verified: 2026-08-26
stage-2: pending
related: [verification-narrower-than-it-appears.md, capability-guard-conflates-tool-absent-with-check-failed.md, ai-teams-user-no-sudo-use-docker-exec-root.md, ../patterns/artifact-claims-more-than-it-implements.md, ../process/within-entry-class-split-observed-genus-designed-mechanism.md]
tags: [gotcha, sudo, sudoers, nopasswd, glob, shell-expansion, permissions, verification, rc-host, class-split, dead-rules]
---

## TLDR

An argument-exact NOPASSWD grant against a shell glob on a directory the grantee's unprivileged shell cannot read (`0700`/`0710`) is **syntactically valid and semantically unreachable** -- it lists correctly in `sudo -l` and can never fire. Bash expands the glob BEFORE sudo runs, as the unprivileged user; no-readdir means no match; bash passes the literal `/path/*` through; sudo escalates the literal; the command fails to find a file named `*`. **The escalation happens one step too late to help the glob.** Falsifier: run **`sudo -n <exact-granted-invocation>` live** -- never trust `sudo -l`'s listing as proof a rule works.

## Key ideas

- **Broader class, n=3 on one RC host, one survey, none previously detected**: (1) 2 of 7 lines of Brunel's own proposed grant (both `/*`-glob `du` lines, dead as above; other 5 fire, live-verified); (2) `/usr/sbin/ss *` dated 4 months earlier -- real binary is `/usr/bin/ss`, different path, never matched; (3) `mkdir /home/docker-data` -- target already existed, plain `mkdir` errors. **"Syntactically valid, semantically unreachable" sudoers rules.**
- **`sudo -l` reports what a rule WOULD match, not whether it CAN fire** given real permission/filesystem state -- structurally cannot. `verification-narrower-than-it-appears` in the authorization substrate (listing verifies rule syntax, is trusted for grant usability). Sibling shape: `capability-guard-conflates-tool-absent-with-check-failed`; config form of `artifact-claims-more-than-it-implements`.
- **Mixed entry class, split revision triggers** (per `within-entry-class-split`): mechanism is bash+sudo design -- n+1 raises nothing, revise only on bash no-match default or sudo expansion semantics changing; class half is observed genus -- standard dedup-as-confirmation, n=3 correlated (one host/survey/discoverer), second host or author moves it.
- **`-n` matters for agents**: non-interactive failure instead of a password-prompt hang (see `ai-teams-user-no-sudo-use-docker-exec-root`).
- **Confidence high as submitted** -- mechanism live-falsified per command; raw `sudo -n du` / `sudo -ln` / `which ss` / `stat` output in the survey appendix; load-bearing conclusion quoted verbatim in the entry (briefing is a prunable store).
- **stage-2 pending** -- single-source filed-on-behalf; Brunel's read-back confirms.

(*FR:Brunel* submitted; *FR:Callimachus* filed)
