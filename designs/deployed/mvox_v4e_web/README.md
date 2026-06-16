# mvox_v4e_web -- deployment index

Indexed: 2026-05-20. Cloned and refactored from `polyphony-dev` by PO.

## Repo

- **GitHub:** https://github.com/mvox-dev/mvox_v4e_web
- **Local clone:** `~/Documents/github/.mmp/mvox_v4e_web/` (personal-repo convention)
- **Org:** `mvox-dev` (PO-owned, separate from `Eesti-Raudtee`)

## Team config

The team config is in the mvox repo itself, not mirrored here.

- **Team name:** `mvox-dev`
- **Path inside repo:** `teams/mvox-dev/`
- **Roster:** 9 members (Renaissance composers + philosophers + Finn). Team-lead: Palestrina.
- **Naming convention:** Renaissance polyphonic composers (Palestrina, Byrd, Josquin, Tallis, Victoria, Perotin) + Enlightenment-era philosophers (Bentham, Comenius). Inherits "polyphony" theme from parent team.

## FR-side substrate scope

**This is NOT an FR-shipped substrate.** The container lifecycle artifacts (Dockerfile, entrypoint, docker-compose) inherited from the polyphony parent live inside the mvox repo at the project root. FR has not designed or owns the substrate for this team.

Operator-role scope (per `designs/deployed/operator-role/`): mvox_v4e_web is **out of scope** for Hopper's MAY-DO list -- substrate-design ownership rule excludes clones+refactors of FR-shipped teams when the clone is on a non-EVR github org. Re-evaluate if PO ever migrates this to an EVR-org deployment with FR substrate ownership.

## Parent lineage

- **Parent:** `polyphony-dev` (see `~/bin/rc-deployments.json` num=3; runtime on `rc` host port 2223, status: live)
- **Refactor scope:** PO cloned the team config, project structure, and substrate-design references; mvox is a separate app domain (choral music sharing on the v4E schema, entu-backed) not a fork of polyphony's product.

## FR-side ratified audits

| Date | Auditor | Artifact |
|---|---|---|
| 2026-05-20 | Medici | `health-report-mvox-dev-2026-05-20.md` (forthcoming -- staged in the mvox repo's docs/) |
| 2026-05-20 | Celes | per-prompt fine-tuning commits in mvox repo (forthcoming) |

(*FR:Aen*)
