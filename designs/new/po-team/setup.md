# PO-team setup — territory log

Operational record of standing up the product-owners team and its remote-team boxes.
Companion to the design package in this directory; scope thinking lives in the comms
gist (`comms-scope.md`, secret gist). Updated as work happens. Started 2026-07-15.

## Boxes

Two existing Hostinger KVM 2 VPSes (one dedicated IPv4 each; no extra IPs purchasable
— not needed, teams are distinguished by port and identified by ssh key):

| Box | Tailnet name / IP | Public IP | Role (decided 2026-07-15) |
|---|---|---|---|
| ai.mvox.eu (VM 1368259) | ai-mvox-eu / 100.102.133.125 | 187.77.70.91 | **future hub + PO team** (freed by migration) |
| ai.screenwerk.ee (VM 1559865) | ai-screenwerk-ee / 100.103.189.3 | 168.231.126.68 | **product-team containers** |

Rationale: zero new spend; build on the near-empty box, cut the busy one over at an
idle seam. Scale later by plan upgrade or fresh box (compare upgrade-renewal pricing
vs new-customer promo — upgrades renew expensive).

Hostinger API in use for snapshots/metrics (token in `~/.config/hostinger/token` on
the operator Mac, mode 600, never in a repo). Snapshots expire 24 h after creation —
re-snapshot before any risky step.

## Container pattern (ai-screenwerk-ee)

Build context on the box: `/opt/ai-teams/` (Dockerfile, entrypoint.sh,
docker-compose.yml). Image `ai-team:latest`:

- ubuntu 24.04, node 22 (binary), claude-code (npm global), gh (binary), git, jq,
  tmux, sshd
- user `ai-teams` uid 1000 (stock ubuntu user renamed)
- sshd: key-only, no root, no passwords; port 22 inside
- entrypoint: fixes home-volume ownership, seeds `authorized_keys` from
  `AUTHORIZED_KEYS` env on first run, then execs sshd

Deviation from the apex fleet pattern, deliberate: **one named volume per team holding
the whole `/home/ai-teams`** (not split .claude/workspace volumes) — this is a
migration of existing homes; auth state, workspace, and dotfiles travel as one unit.

| Container | ssh | Volume | State |
|---|---|---|---|
| mvox | 100.103.189.3:**2229** (tailnet only) | `mvox-home` | migrating |
| screenwerk | 100.103.189.3:**2230** (tailnet only) | `screenwerk-home` | **migrated ✓** |

Ports bound to the tailnet IP only — nothing listens on the public interface.
2228 skipped (reserved for planned ruth-team in `deployments.md`).

Access: `ssh -i ~/.ssh/id_ed25519_tailnet -p 2229 ai-teams@100.103.189.3`
(per-team keys to be issued at hub onboarding; operator tailnet key seeded for now).

## Migration log (2026-07-15)

1. Both VPSes snapshotted (via hPanel, 05:38 UTC; 24 h expiry).
2. screenwerk workspace committed + pushed (`ScreenWerk/ai-team` @ `bd7b51f`).
3. mvox box swept: stale June dev servers (vite/wrangler/esbuild/workerd) and
   leftover claude daemon killed; all repos verified 0 uncommitted.
   Gotcha: `pkill -f claude` over ssh kills the ssh session itself (pattern matches
   the remote shell's own argv) — use `[c]laude`-style patterns or PIDs.
4. docker 29.6.1 + compose v5.3.1 installed on ai-screenwerk-ee (get.docker.com).
5. Image built; both containers up.
6. screenwerk home (1.4 G) copied into `screenwerk-home` (tar pipe, --exclude .cache
   .npm), ownership normalized to 1000:1000, workspace verified at `bd7b51f`.
   Gotcha: whole-home copy overwrites the seeded `authorized_keys` — re-append the
   access key after any home migration.
7. mvox home (~12 G) streaming box-to-box over tailnet via temporary migration key
   (screenwerk-root → mvox; to be removed after) — **IN FLIGHT**.

## mvox identity flip (michelek → ai-teams)

mvox is the only team whose historical unix user is `michelek`; fleet convention is
`ai-teams`. The container flips it. Map:

- **Clean by construction:** uid 1000 = uid 1000; claude OAuth, gh auth, git
  credential store are $HOME-relative; npm-global shebangs use `env node`.
- **Needs translation** (literal `/home/michelek` baked in): `~/.claude.json`
  project keys; `~/.claude/projects/-home-michelek-*` transcript dir names;
  possibly PATH lines and box scripts (`mvox-up.sh`, `apply-layout.sh`,
  `spawn_member.sh`). Definitive list = grep after transfer; translate from the
  grep, not from prediction.
- **Conscious notes:** michelek's personal ssh keypair now lives inside the mvox
  container (revisit at hub onboarding — per-team keys); `.gitconfig` authorship
  (`mitselek`) is decoupled from the unix user and stays.

## Pending

- [ ] mvox transfer completes → grep `/home/michelek` → translate → verify
- [ ] remove temp migration key from mvox box `authorized_keys`
- [ ] register mvox:2229 / screenwerk:2230 in `deployments.md` + `registry.json`
- [ ] free ai-mvox-eu (old home archived or cleared) → hub + PO team deploy
- [ ] per-team ssh keys at hub onboarding (comms gap 8)

(*PO territory log — maintained by Aen with Mihkel*)
