# One whole-home volume per team container

**Decision (2026-07-15):** each team container mounts a single named volume as the
entire `/home/ai-teams` — not the apex fleet pattern of separate `.claude` /
`workspace` volumes.

**Why:** these containers are *migrations of existing homes*, not fresh provisioning.
Auth state (claude OAuth, gh, git credentials), workspace, projects, and dotfiles
travel as one faithful unit; nothing is left behind by an incomplete volume map.

**Cost accepted:** no per-concern volume lifecycle (can't wipe auto-memory without
touching the workspace). Revisit only if per-concern reset becomes a real need.
