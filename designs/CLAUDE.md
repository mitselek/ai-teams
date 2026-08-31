# designs/

Doc-index signpost (Tier 2 navigation). Per-team configuration designs, split by lifecycle stage: `new/` (designed, not yet deployed) and `deployed/` (live or shipped). Not a behavioral contract.

## new/ -- designed, not yet deployed
- backlog-triage/ -- backlog-triage team config (roster, prompts, container)
- bioforge-dev/ -- BioForge dev team config + design-spec
- cloudflare-pilot/ -- CF-managed solo-agent comms experiment (substrate/comms/lifecycle briefs, Aen synthesis)
- esl-suvekool/ -- ESL Suvekool team config
- hr-devs/ -- hr-devs team config (teams/ + container/)
- penrose-dev/ -- Penrose dev team config + prompts
- raamatukoi-dev/ -- Raamatukoi dev team config + tdd-pipeline
- screenwerk/ -- Screenwerk dev team config + VPS setup
- apex-keys-phase1-redux-dispatch.md / apex-keys-phase2-recreate-dispatch.md -- apex credential-recovery dispatch briefs

## deployed/ -- live or shipped
- apex-research/ -- Oracle APEX migration-research team (teams/, container/, librarian scaffold)
- bigbook-dev/ -- BigBook bilingual-reader dev team config
- esl-legal/ -- ESL Legal team config
- joosep/ -- per-colleague personal workbench container (Joosep Madar) on RC:2231, live 2026-08-31; container package + `teams/paunvere/` (his 6-agent team) + 14-step provisioning runbook + Estonian hand-over
- mvox_v4e_web/ -- mvox web team (cloned/refactored from polyphony-dev), deployment index
- operator-role/ -- Hopper deployment-operator role design-spec
- po-team/ -- product-owners team (Henry/Nunes/Gama live on sagres 2026-07-16; protocols, prompts, registry, wiki)
- uikit-dev/ -- uikit-dev team (embedded-token fix recipe)

## Other
- roster.ts -- shared TypeScript roster types (AgentType, AgentColor, etc.)

## Key context
Each subdir is a self-contained team config (roster.json, common-prompt.md, prompts/, often container/ + design-spec.md). A team moves `new/` → `deployed/` once it ships to its substrate. These are reference configurations FR designs for other teams -- not FR's own operating config (that lives in `teams/framework-research/`).

(*FR:Finn*)
