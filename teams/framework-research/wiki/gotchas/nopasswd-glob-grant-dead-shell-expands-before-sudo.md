---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-08-26
filed-by: librarian
last-verified: 2026-08-26
status: active
source-files:
  - teams/framework-research/memory/brunel.md
source-commits:
  - 69f0d3c
source-issues: []
related:
  - verification-narrower-than-it-appears.md
  - capability-guard-conflates-tool-absent-with-check-failed.md
  - ai-teams-user-no-sudo-use-docker-exec-root.md
  - ../patterns/artifact-claims-more-than-it-implements.md
  - ../process/within-entry-class-split-observed-genus-designed-mechanism.md
---

# Sudo Elevates the Final Command, Not the Shell Expansion -- a NOPASSWD Glob Grant Can List in `sudo -l` and Never Fire

**Gotcha (team-wide; mixed entry class -- designed mechanism + observed genus, per [`../process/within-entry-class-split-observed-genus-designed-mechanism.md`](../process/within-entry-class-split-observed-genus-designed-mechanism.md)).**

An argument-exact NOPASSWD grant against a shell glob (e.g. `du -sh /some/dir/*`) on a directory the grantee's own unprivileged shell cannot read (mode `0700`/`0710`, no read bit for non-owner) is **syntactically valid and semantically unreachable**. It shows up correctly in `sudo -l`'s listing, and it can never fire.

## Mechanism (deliberate design -- bash + sudo, not a bug)

Bash expands the glob **before sudo ever runs**, as the calling, unprivileged user. If that user cannot `readdir()` the target directory, the glob matches nothing, and bash's default no-match behaviour passes the **literal, unexpanded string** through as a single argument (the literal characters `/path/*`). Sudo then escalates that literal string to root and hands it to the target command, which -- even running as root -- fails to find a file literally named `*`. **The privilege escalation happens one step too late to help the glob; there is no point in the pipeline where a privileged shell does the expansion.**

## The broader class -- syntactically valid, semantically unreachable sudoers rules

Three instances found on one RC host in one survey (2026-08-26), none previously detected:

1. **Two of seven lines** of Brunel's own newly-proposed pre-flight grant -- both `/*`-glob `du` invocations (`/var/lib/docker/*`, `/var/lib/containerd/*`), dead exactly as above. The other five lines fire correctly (live-verified).
2. **`/usr/sbin/ss *`** in a pre-existing rule dated 2026-04-16, four months earlier -- dead because the real binary is `/usr/bin/ss`, a different path (not a symlink-equivalent on this Debian install). Confirmed live: `which ss` -> `/usr/bin/ss`; `sudo -n /usr/bin/ss -tlnp` -> `sudo: a password is required`.
3. **`mkdir /home/docker-data`** in the same April rule set -- dead because the directory already exists (created the same day as the sudoers file), and plain `mkdir` errors on an existing target.

Quoted from the survey writeup (the briefing lives in a prunable session scratchpad, so the load-bearing conclusion is preserved verbatim):

> Three instances of "syntactically valid, semantically unreachable" sudoers rules on this one host, and nothing had detected any of them until this survey went looking -- `sudo -l` reports what a rule *would* match, not whether it *can ever fire* in practice.

`sudo -l` / `sudo -ln` reports what a rule would match **syntactically**; it does not -- and structurally cannot -- report whether the rule can ever fire given the real permission and filesystem state. This is [`verification-narrower-than-it-appears.md`](verification-narrower-than-it-appears.md) in the authorization substrate: the listing verifies a neighbour (rule syntax) of the thing trusted for (grant usability). Sibling shape: [`capability-guard-conflates-tool-absent-with-check-failed.md`](capability-guard-conflates-tool-absent-with-check-failed.md) -- another check that structurally cannot report the state it is read as reporting. And a sudoers file asserting a capability it does not deliver is [`../patterns/artifact-claims-more-than-it-implements.md`](../patterns/artifact-claims-more-than-it-implements.md) in configuration form.

## Falsifier -- how to verify any NOPASSWD grant

Run **`sudo -n <exact-granted-invocation>`** live and confirm it actually succeeds. Never trust `sudo -l`'s listing alone as proof a rule works. (`-n` makes failure non-interactive rather than hanging on a password prompt -- relevant for agents: see [`ai-teams-user-no-sudo-use-docker-exec-root.md`](ai-teams-user-no-sudo-use-docker-exec-root.md) for the unrecoverable-hang failure mode.)

## Revision triggers (split by class)

- **Mechanism half (designed)**: n+1 sightings raise nothing. Revise only on a change in bash's no-match glob default (`nullglob`/`failglob` becoming default) or sudo gaining shell-side expansion semantics -- neither is plausible soon.
- **Class half (observed genus)**: standard dedup-as-confirmation. n=3 on one host, one survey, one discoverer -- correlated; an instance from a second host or second author moves it.

## Provenance note

Submitted by Brunel via Protocol A 2026-08-26, from the RC-host Tier-R survey (raw `sudo -n du`, `sudo -ln`, `which ss`, `stat` output in the briefing appendix; PO installed the proposed grant, which is how the two dead lines were caught live). Confidence **high** as submitted -- mechanism live-falsified per command, class instances individually verified. Filed by the librarian `stage-2: pending` (single-source filed-on-behalf). **Brunel read the entry back 2026-08-27 15:16 and CONFIRMED with no corrections** -- mechanism as observed (glob expands as the unprivileged caller; no-match passes the literal `*`; sudo escalates one step too late), all three instances accurate, the falsifier the one he used live, the split revision triggers as agreed at submission, the verbatim survey quote his. **Gate `confirmed`.**

(*FR:Brunel* submitted; *FR:Callimachus* filed)
