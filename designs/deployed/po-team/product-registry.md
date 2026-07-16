# Product Registry -- product-owners team

*(*FR:Celes*) -- the per-product, **PO-team-facing** product map. **Henry (team-lead) owns this file**; it changes only through the add-a-PO / retire-a-PO procedures (see `prompts/henry.md`). One row per product = one PO's instance-parameter set. Each PO reads only its own row.*

**Relationship to `registry.json` (the infra/ssh substrate registry, Herald `protocols.md` §4).** The raw ssh connection shape -- `host`, `port`, `user`, `sshKey`, `accessMethod` (direct-ssh / proxyjump), `containerName` -- lives in `registry.json`, keyed by `teamName`, and is owned by the infra/registry keeper (not duplicated here). This map holds the **PO-team-facing** fields and points at the `registry.json` row via `remote-teamName`. `remote-teamName` serves two roles: in normal operation it is the **hub routing name** the PO's comms `send(to: <agent>@<team>)` targets; as the `registry.json` key it resolves host/port/key/container for the persistence layer. *Emergency access note:* by the standing convention (`protocols.md` §1.7 `[CONV]`), **tmux session name == `teamName` == `containerName`** -- relevant only when attaching to the persistence layer, never in normal operation.

## Schema

| Field | Meaning | Source |
|---|---|---|
| `product-slug` | Canonical short id; the PO's `{{PRODUCT_SLUG}}` and the `product:<name>` label value (`issue-standard.md` §2) | intake |
| `po-agent` | The PO agent driving it (roster `name`) | roster |
| `github-repo` | `owner/name`; the durable work channel. **Must have issue-write** for the remote-side account | Mihkel; verify at step 2 |
| `local-clone-path` | Reference-only clone location; the PO's `{{LOCAL_CLONE_PATH}}` | provisioned at step 4 |
| `remote-teamName` | The `registry.json` key for the remote team; it **is** the PO's `{{REMOTE_TEAM}}` comms address on the hub, and resolves `{{REMOTE_HOST}}` (host/port/key/accessMethod/container -- emergency access only); the tmux session name (persistence-layer data) derives from it via the `[CONV]` | `registry.json` (PENDING until added) |
| `remote-teamlead` | The remote lead the PO corresponds with -- receiving-side/reporting information only (V1 agent-level routing lands all mail in `team-lead.json` anyway) | remote team's roster |
| `last-liveness` | ISO date of the last confirmed hub-comms liveness (the `protocols.md` §4 item 7 end-to-end comms acceptance test, or an equivalent deposit + collect proven both directions via the stationmaster hub). ssh reachability is emergency-access/persistence-layer only, not the liveness measure | Henry, per onboarding/refresh |

**Live infra (2026-07-15/16):** the PO team runs in the `po-team` container on **sagres** (tailnet `100.102.133.125`), sharing the box with the stationmaster hub; the container is portless -- reached by `docker exec`, not ssh. Product containers live on **shipyard** (tailnet `100.103.189.3`): `registry.json` row **10** = `mvox` (ssh port 2229, volume `mvox-home`, live) and row **11** = `screenwerk` (ssh port 2230, volume `screenwerk-home`, live). Both currently carry the operator tailnet key (`id_ed25519_tailnet`); per-team keys are pending hub onboarding. Access details are authoritative in `wiki/references/boxes-and-access.md`.

**Still PENDING:** the `registry.json` rows for **bigbook**, **ad-auto** and **field-network** do not exist yet -- adding them is step 1 of the growth protocol (`protocols.md` §4). `github-repo` write-scope must be *verified*, not assumed (the pull-only-account gotcha blocks epic creation -- STOP and escalate if a repo is pull-only for the remote-side account). A PO with a PENDING `remote-teamName` can still draft epics on GitHub but cannot run the live liaison channel until hub onboarding lands for that team (per-team key issued, grant in place, courier daemon live, round-trip proven -- as recorded in `last-liveness`). The `registry.json` row remains a prerequisite for the persistence layer / emergency access only.

## Initial four products

Canonical `product-slug` values (confirmed to Herald for the `product:<name>` label family): **`mvox`**, **`bigbook`**, **`ad-auto`**, **`field-network`** ("mikrotik" is field-network's domain context, not the slug).

| product-slug | po-agent | github-repo | local-clone-path | remote-teamName | remote-teamlead | last-liveness |
|---|---|---|---|---|---|---|
| **mvox** | gama | `PENDING` (exp. `mitselek/mvox`) | `PENDING` | `mvox` (registry row 10: shipyard:2229, container `mvox`, volume `mvox-home`) | `PENDING` | 2026-07-16 (comms proven both directions via hub) |
| **bigbook** | pacheco | `PENDING` (exp. `mitselek/bigbook`) | `PENDING` | `PENDING` (exp. `bigbook-dev`) | `PENDING` (bigbook-dev has team-lead `plantin`) | -- |
| **ad-auto** | albuquerque | `PENDING` | `PENDING` | `PENDING` (exp. `ad-auto-dev`) | `PENDING` | -- |
| **field-network** | magellan | `PENDING` | `PENDING` | `PENDING` (exp. `field-network-dev`) | `PENDING` | -- |

*Notes:* bigbook already has a deployed dev team (`designs/deployed/bigbook-dev/`, team-lead `plantin`) -- its `remote-teamlead` likely resolves to that team's lead once the `registry.json` row is confirmed. mvox is live: the `mvox` container on shipyard (registry row 10) supersedes the earlier non-FR-substrate expectation. The other remote teams are provisioned by Mihkel; the PO team neither spawns nor owns them (separate substrate; heterogeneous ownership). Substrate ownership note: a PO cannot assume FR owns its remote host. `screenwerk` (registry row 11, shipyard:2230, volume `screenwerk-home`) is live on the same box but is not one of the four PO products. `expected` values are hints for intake, not commitments.

## Security note

In normal operation the channel identity is the **per-team hub key** (`~/.ssh/sm_<team>`): the hub authenticates each exchange by that key and its `grant` allow-list scopes, per team, who may deposit to whom. A PO's reach is therefore bounded by the hub's grants, not by ssh authorization -- tmux is never an operational channel a PO is authorized onto. The per-row ssh-key scoping (`id_ed25519_<team>`, not a shared key -- `protocols.md` §6 Q7) survives only for the layer-4 persistence substrate: explicitly-labeled emergency access to a team's own row (`protocols.md` §1.7 Appendix A), never any other host. Issuing per-team keys -- hub and emergency-access alike -- is Mihkel's infra call.
