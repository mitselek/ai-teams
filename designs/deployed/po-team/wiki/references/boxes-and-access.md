# Boxes and access

Scope thinking + gap tracking: [comms-scope gist](https://gist.github.com/mitselek/2f383c1402c7682a08d7954818b73708) (secret).

## Boxes (Hostinger KVM 2, one dedicated IPv4 each; renamed 2026-07-15)

| Box | Tailnet | Public IP | VM id | Role |
|---|---|---|---|---|
| **sagres** (ex ai-mvox-eu / ai.mvox.eu) | sagres / 100.102.133.125 | 187.77.70.91 | 1368259 | future hub + PO team |
| **shipyard** (ex ai-screenwerk-ee / ai.screenwerk.ee) | shipyard / 100.103.189.3 | 168.231.126.68 | 1559865 | product-team containers |

Legacy public DNS: `ai.mvox.eu` / `ai.screenwerk.ee` A records still point at the
public IPs (zones managed OUTSIDE Hostinger — portfolio empty, zones empty); nothing
serves on them (checked 2026-07-15). Retire/repoint at the external DNS provider
whenever convenient.

## Containers (on shipyard, build context `/opt/ai-teams/`)

Mac ssh aliases (in `~/.ssh/config`): `sagres`, `mvox`, `screenwerk`.

| Container | ssh (tailnet only) | Volume |
|---|---|---|
| mvox | `ssh mvox` = `-p 2229 ai-teams@shipyard.tailccff13.ts.net` | `mvox-home` |
| screenwerk | `ssh screenwerk` = `-p 2230 ai-teams@shipyard.tailccff13.ts.net` | `screenwerk-home` |

Image `ai-team:latest`: ubuntu 24.04, node 22, claude-code, gh, git, jq, tmux;
user `ai-teams` (uid 1000); sshd key-only/no-root. Entrypoint fixes volume ownership
and seeds `authorized_keys` from `AUTHORIZED_KEYS` env on first run.

Per-team ssh keys: pending hub onboarding (comms gap 8); operator tailnet key seeded
meanwhile.

## Hostinger API

Token: `~/.config/hostinger/token` on the operator Mac (mode 600, never in a repo).
Base: `https://developers.hostinger.com/api/vps/v1/`. In use for snapshots + listing.
**Snapshots expire 24 h after creation** — one slot per VPS, creating overwrites;
re-snapshot before any risky step.
