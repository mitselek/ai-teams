# Apex Keys Diff -- backup `.env` (2026-04-29) vs running container Config.Env (2026-05-20)

**Author:** (*FR:Hopper*)
**Built:** 2026-05-20T18:44+03:00
**Dispatch:** Aen-direct, P2 Tier R probe-only (NO `.env` composition, NO design draft); PO-directed for raw diff, no pre-chewing
**Operations-log reference:** entry timestamped 2026-05-20T18:46+03:00 (this file's catalyzing dispatch)

## Sources

| Side | Source | Capture method | Capture timestamp |
|---|---|---|---|
| LEFT (backup) | `/home/dev/github/apex-migration-research.pre-fresh-clone-2026-04-29/.env` on RC bare-metal host | `ssh -T dev@100.96.54.170 "cat '<path>'"` via base64-transit | 2026-05-20T18:42+03:00 |
| RIGHT (Config.Env) | running apex-research container's effective env at create-time | `ssh -T dev@100.96.54.170 "docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}'"` via base64-transit | 2026-05-20T18:42+03:00 |

Both ssh exit codes 0; pure Tier R; no mutations.

## Redaction policy

- **SSH_PUBLIC_KEY* values:** verbatim (public-by-definition).
- **All other token values** (`GITHUB_TOKEN`, `GH_TOKEN`, `ATLASSIAN_API_TOKEN`, `TUNNEL_TOKEN`, `ANTHROPIC_API_KEY`): first-4-chars + `...` + total-length-in-chars. This preserves the diff (different first-4-chars or different lengths surface as different values) while suppressing the secret content. Non-secret config strings (`ATLASSIAN_EMAIL`, `ATLASSIAN_BASE_URL`) verbatim.
- **Quoting differences:** the backup `.env` uses double-quotes around some values; Config.Env (post-compose-resolution) drops the quotes. This is a docker-compose post-processing detail, not a diff. Where both sides have the same logical value but differ only in surrounding quotes, marked `= (quoted vs unquoted)`.

## Key-set scope

Per Aen 18:40 dispatch -- `SSH_PUBLIC_KEY*`, `GITHUB_TOKEN`, `ATLASSIAN_*`, `TUNNEL_TOKEN`, `ANTHROPIC_API_KEY`. Docker-injected runtime vars (`PATH`, `HOSTNAME`, `LANG`, `LC_ALL`, `TERM`, `HOME`, `NODE_EXTRA_CA_CERTS`) and apex-specific config that isn't a credential (`SOURCE_REPO_URL`, `REPO_URL`, `TEAM_NAME`, `CLAUDE_CODE_*`) are out of the diff scope. One observation in the table footer about `GH_TOKEN` which is filter-adjacent.

## Diff table

| Key | LEFT -- backup `.env` (2026-04-29) | RIGHT -- Container Config.Env | Diff |
|---|---|---|---|
| `SSH_PUBLIC_KEY` (slot 1) | `"ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKR5R4Ob4zeW4H1p8rhjYajOa+mzqyjITzB6RmY4iBp/ mihkel.putrinsh@evr.ee apex-research"` | *(empty: `SSH_PUBLIC_KEY=`)* | **≠** -- backup has PO pubkey in slot 1; container has slot 1 empty. PO pubkey appears in slot 2 on the container side (next row). |
| `SSH_PUBLIC_KEY_2` (slot 2) | *(no entry; key absent from backup)* | `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKR5R4Ob4zeW4H1p8rhjYajOa+mzqyjITzB6RmY4iBp/ mihkel.putrinsh@evr.ee apex-research` | **→only** -- slot 2 is in container Config.Env only; the value is the same pubkey that backup has in slot 1. (Slot-migration evidence: PO pubkey moved from slot 1 → slot 2 sometime between this backup and current container-create.) |
| `SSH_PUBLIC_KEY_3` (slot 3) | `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIO2fgnCIWJjcNpgo/rjGmF5e0fr35qupLHAFk57qU6tB rc-connect` | *(no entry; key absent from Config.Env)* | **←only** -- slot 3 is in backup only; container Config.Env has no `SSH_PUBLIC_KEY_3` key. (The value is the `rc-connect` wrapper's pubkey.) |
| `GITHUB_TOKEN` | `gho_...` (40 chars) | `gho_...` (40 chars) | **=** -- same first-4-chars and same length on both sides; values agree to the precision the redaction preserves. |
| `ATLASSIAN_EMAIL` | `"mihkel.putrinsh@evr.ee"` | `mihkel.putrinsh@evr.ee` | **= (quoted vs unquoted)** -- same value; compose-resolution dropped the quotes. |
| `ATLASSIAN_API_TOKEN` | `"ATAT...=80E79C65"` (192 chars including trailing checksum-shape) | `ATAT...=80E79C65` (192 chars including trailing checksum-shape) | **= (quoted vs unquoted)** -- same first-4-chars, same length, same trailing 8 chars; values agree. |
| `ATLASSIAN_BASE_URL` | `"https://eestiraudtee.atlassian.net"` | `https://eestiraudtee.atlassian.net` | **= (quoted vs unquoted)** -- same value. |
| `TUNNEL_TOKEN` | `eyJh...` (217 chars) | *(no entry; key absent from Config.Env)* | **←only** -- TUNNEL_TOKEN is in backup only; container Config.Env has no entry. |
| `ANTHROPIC_API_KEY` | *(empty: `ANTHROPIC_API_KEY=`)* | *(empty: `ANTHROPIC_API_KEY=`)* | **=** -- both empty. |

## Observations (descriptive, NOT interpretation)

1. **Slot 1 ↔ Slot 2 migration**: the PO pubkey at `mihkel.putrinsh@evr.ee apex-research` is identical byte-for-byte in backup slot 1 vs container slot 2. The migration is a slot-rename, not a key change.
2. **Slot 3 dropout**: the `rc-connect` pubkey present in backup slot 3 is absent from container Config.Env. Either compose-yml resolution dropped it at create-time (value-empty default), or the slot was populated some-other-way at backup-time but never made it into a subsequent container-create.
3. **TUNNEL_TOKEN dropout**: `TUNNEL_TOKEN` present in backup, absent from container Config.Env. Same dropout pattern as slot 3.
4. **GITHUB_TOKEN + ATLASSIAN_* (3 vars) + EMAIL + BASE_URL**: all present and same on both sides (within redaction precision).
5. **ANTHROPIC_API_KEY**: empty on both sides.
6. **GH_TOKEN (filter-adjacent, surfaced for completeness)**: Container Config.Env also has `GH_TOKEN=gho_...` with the SAME first-4-chars and length as `GITHUB_TOKEN`. This var was NOT in the backup `.env`. It appears to be a docker-side mirror of `GITHUB_TOKEN` (possibly set by entrypoint or compose), but the dispatch's filter didn't include `GH_TOKEN` so it's outside the strict diff scope. Surfacing as a footnote because it's filter-adjacent and may matter for the slot-migration interpretation.

## Summary counts

- **=** (same): 4 vars (`GITHUB_TOKEN`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`, `ATLASSIAN_BASE_URL`, `ANTHROPIC_API_KEY` -- counting via redaction-precision-equality; `=` and `= (quoted vs unquoted)` collapsed)
- **≠** (different): 1 var (`SSH_PUBLIC_KEY` slot 1: backup populated, container empty)
- **←only** (backup-only): 2 vars (`SSH_PUBLIC_KEY_3`, `TUNNEL_TOKEN`)
- **→only** (container-only): 1 var (`SSH_PUBLIC_KEY_2`)
- **filter-adjacent** (out of strict scope, surfaced anyway): 1 var (`GH_TOKEN`)

## Hard-gate validation

Config.Env's `SSH_PUBLIC_KEY_2` value at this 2026-05-20T18:42 capture equals (byte-for-byte) the PO pubkey extracted at P1.1 (2026-05-20T17:14, dispatch start) and confirmed at P1.2c Probe 1 (2026-05-20T17:28). Substrate state is unchanged across the dispatch arc. No substrate-state-changed-since-dispatch finding to surface back.
