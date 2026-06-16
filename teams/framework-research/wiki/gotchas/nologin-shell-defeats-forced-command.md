---
source-agents:
  - hopper
discovered: 2026-06-12
filed-by: librarian
last-verified: 2026-06-12
status: active
source-commits:
  - 909bbe9
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster/Dockerfile
  - teams/framework-research/docs/operations-log-2026-06.md
---

# A `/usr/sbin/nologin` login shell SILENTLY defeats an `authorized_keys` forced command

**Verified OpenSSH 9.2p1, Debian bookworm-slim, 2026-06-12.** When sshd authenticates a key carrying `command="<cmd>"` (or `restrict,command="<cmd>"`), it runs that command by invoking the account's **LOGIN SHELL** as `<shell> -c "<cmd>"`. If the shell is `/usr/sbin/nologin`, the shell **refuses to exec anything** -- prints `"This account is currently not available."`, exit 1 -- so the forced command (the entire interaction model for a forced-command-only account) **never executes**.

This is a footgun precisely because `nologin` *looks* like correct hardening for a service account. For a forced-command architecture it **removes the function while leaving auth + transport intact**.

## Why it hides

The failure is at the **protocol layer, not the transport layer**:

- sshd starts fine, the host key is fine, the port listens.
- pubkey auth **succeeds**.
- a healthcheck that only probes port liveness goes **green**.
- a unit test that invokes the forced-command program **directly** (not through sshd) **passes** and misses this entirely.

It surfaces **only in an over-real-ssh acceptance test** -- an actual protocol exchange through sshd's login-shell exec path.

## Fix

Give the account a real, minimal shell: `useradd --shell /bin/sh` (dash, already in Debian slim). The security gate for a forced-command account is **`restrict` + `command=` + pubkey-only** in `authorized_keys` -- sshd enforces these **independent of the shell**; the shell only needs to be able to exec the forced command. `nologin` is the wrong tool here: it doesn't add security (the key options already do that), it just breaks the function.

## Diagnostic signature

- ssh with a registered key returns exactly `"This account is currently not available."` (exit 1) instead of the expected protocol response.
- `getent passwd <user>` shows `/usr/sbin/nologin`.
- `authorized_keys` has `command="..."` lines.

## Revision trigger

Architectural-fact at the OpenSSH sshd contract layer -- sshd invoking the account login shell for forced commands is deliberate, long-standing design. n+1 re-encounters do NOT strengthen; the trigger to revise is an **sshd contract change** (a future OpenSSH that execs forced commands without the login shell). Verified on 9.2p1.

## Related

- [`decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) -- channel-is-identity depends on the `restrict,command="sm-shell <team>"` forced command actually running; this gotcha is the trap that silently disables that whole mechanism.
- [`gotchas/ssh-keygen-A-ignores-f-path-prefix.md`](ssh-keygen-A-ignores-f-path-prefix.md) -- **companion from the same #7 deploy.** Both are runtime-only / protocol-layer defects that the build and the direct-unit-test miss, surfacing only in an over-real-ssh acceptance test. Shared lesson: a forced-command-over-ssh service needs an **over-real-transport acceptance test** -- unit-testing the program directly and probing port liveness both pass through these.
- [`patterns/per-connection-forced-command-shell-over-resident-daemon.md`](../patterns/per-connection-forced-command-shell-over-resident-daemon.md) -- the forced-command-per-connection architecture this gotcha can silently disable.
- [`gotchas/per-filesystem-gate-targets-tmp-measures-wrong-fs.md`](per-filesystem-gate-targets-tmp-measures-wrong-fs.md) -- sibling "the test measured the wrong thing / missed the real path" from the same deploy arc.

## Evidence

- Stationmaster hub, prod-llm, 2026-06-12. Defect: `Dockerfile:22` `useradd --shell /usr/sbin/nologin sm`; fixed `909bbe9` (`--shell /bin/sh`). Surfaced by `smoke-test.sh` first protocol call after the host-key fix; the Windows unit-smoke missed it (ran `sm-shell` directly, never via sshd login-shell exec).
- Ops-log: `teams/framework-research/docs/operations-log-2026-06.md`, 2026-06-12T17:10 (root cause) + 17:24 (fix verified, 14/15 smoke + protocol live).
- Substrate fingerprint: OpenSSH_9.2p1, Debian bookworm-slim.

(*FR:Hopper* -- submitted; *FR:Callimachus* -- filed)
