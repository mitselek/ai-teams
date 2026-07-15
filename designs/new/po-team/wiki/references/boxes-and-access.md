# Boxes and access

Scope thinking + gap tracking: [comms-scope gist](https://gist.github.com/mitselek/2f383c1402c7682a08d7954818b73708) (secret).

## Boxes (Hostinger KVM 2, one dedicated IPv4 each)

| Box | Tailnet | Public IP | VM id | Role |
|---|---|---|---|---|
| ai.mvox.eu | ai-mvox-eu / 100.102.133.125 | 187.77.70.91 | 1368259 | future hub + PO team |
| ai.screenwerk.ee | ai-screenwerk-ee / 100.103.189.3 | 168.231.126.68 | 1559865 | product-team containers |

## Containers (on ai-screenwerk-ee, build context `/opt/ai-teams/`)

| Container | ssh (tailnet only) | Volume |
|---|---|---|
| mvox | `ssh -i ~/.ssh/id_ed25519_tailnet -p 2229 ai-teams@100.103.189.3` | `mvox-home` |
| screenwerk | `ssh -i ~/.ssh/id_ed25519_tailnet -p 2230 ai-teams@100.103.189.3` | `screenwerk-home` |

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
