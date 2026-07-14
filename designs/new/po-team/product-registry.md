# Product Registry -- product-owners team

*(*FR:Celes*) -- the per-product, **PO-team-facing** product map. **Henry (team-lead) owns this file**; it changes only through the add-a-PO / retire-a-PO procedures (see `prompts/henry.md`). One row per product = one PO's instance-parameter set. Each PO reads only its own row.*

**Relationship to `registry.json` (the infra/ssh substrate registry, Herald `protocols.md` §4).** The raw ssh connection shape -- `host`, `port`, `user`, `sshKey`, `accessMethod` (direct-ssh / proxyjump), `containerName` -- lives in `registry.json`, keyed by `teamName`, and is owned by the infra/registry keeper (not duplicated here). This map holds the **PO-team-facing** fields and points at the `registry.json` row via `remote-teamName`. By the standing convention (`protocols.md` §1.1 `[CONV]`), **tmux session name == `teamName` == `containerName`**, so the PO's `{{REMOTE_SESSION}}` is derived from `remote-teamName`, not separately stored.

## Schema

| Field | Meaning | Source |
|---|---|---|
| `product-slug` | Canonical short id; the PO's `{{PRODUCT_SLUG}}` and the `product:<name>` label value (`issue-standard.md` §2) | intake |
| `po-agent` | The PO agent driving it (roster `name`) | roster |
| `github-repo` | `owner/name`; the durable work channel. **Must have issue-write** for the remote-side account | Mihkel; verify at step 2 |
| `local-clone-path` | Reference-only clone location; the PO's `{{LOCAL_CLONE_PATH}}` | provisioned at step 3 |
| `remote-teamName` | The `registry.json` key for the remote team; resolves `{{REMOTE_HOST}}` (host/port/key/accessMethod/container) **and** `{{REMOTE_SESSION}}` (== teamName) | `registry.json` (PENDING until added) |
| `remote-teamlead` | The remote team-lead the PO liaises with; the PO's `{{REMOTE_TEAMLEAD}}` | remote team's roster |
| `last-liveness` | ISO date of the last confirmed ssh+tmux reachability check (`protocols.md` §4 item 7 acceptance test) | Henry, per onboarding/refresh |

**PENDING until Mihkel's infra hand-off:** the `registry.json` rows for the four products (host/port/key/container) do not exist yet -- adding them is step 1 of the growth protocol (`protocols.md` §4). `github-repo` write-scope must be *verified*, not assumed (the pull-only-account gotcha blocks epic creation -- STOP and escalate if a repo is pull-only for the remote-side account). A PO with a PENDING `remote-teamName` can still draft epics on GitHub but cannot run the live liaison channel until its `registry.json` row and acceptance test land.

## Initial four products

Canonical `product-slug` values (confirmed to Herald for the `product:<name>` label family): **`mvox`**, **`bigbook`**, **`ad-auto`**, **`field-network`** ("mikrotik" is field-network's domain context, not the slug).

| product-slug | po-agent | github-repo | local-clone-path | remote-teamName | remote-teamlead | last-liveness |
|---|---|---|---|---|---|---|
| **mvox** | gama | `PENDING` (exp. `mitselek/mvox`) | `PENDING` | `PENDING` (exp. `mvox-dev`) | `PENDING` | -- |
| **bigbook** | pacheco | `PENDING` (exp. `mitselek/bigbook`) | `PENDING` | `PENDING` (exp. `bigbook-dev`) | `PENDING` (bigbook-dev has team-lead `plantin`) | -- |
| **ad-auto** | albuquerque | `PENDING` | `PENDING` | `PENDING` (exp. `ad-auto-dev`) | `PENDING` | -- |
| **field-network** | magellan | `PENDING` | `PENDING` | `PENDING` (exp. `field-network-dev`) | `PENDING` | -- |

*Notes:* bigbook already has a deployed dev team (`designs/deployed/bigbook-dev/`, team-lead `plantin`) -- its `remote-teamlead` likely resolves to that team's lead once the `registry.json` row is confirmed. The other three remote teams are provisioned by Mihkel; the PO team neither spawns nor owns them (separate substrate; heterogeneous ownership -- mvox is a non-FR substrate per Finn). Substrate ownership note: a PO cannot assume FR owns its remote host. `expected` values are hints for intake, not commitments.

## Security note

Each PO's ssh access is **scoped to its own row's `registry.json` key** -- a PO may not ssh or tmux against any host but its own (`protocols.md` §1.5). Per-team keys (`id_ed25519_<team>`), not a shared key, are the convention (`protocols.md` §6 Q7). Authorizing ssh from the PO-team host into the four remote hosts, and issuing per-team keys, is Mihkel's infra call.
