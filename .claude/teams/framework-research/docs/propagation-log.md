# Propagation Log

## [2026-03-25 09:48] hr-devs @ 10.100.136.162 (PROD-LLM)

- **Files pushed:**
  - `prompts/team-lead.md` — added Hard-Won Rules section (4 incident-backed rules from 2026-03-24)
  - `prompts/marcus.md` — fixed dashboard path: `~/github/` → `~/workspace/`
  - `common-prompt.md` — dropped medici/eilama from members list; replaced Agent tool spawning rule with spawn_member.sh (container-native); added 4 new Known Pitfalls
- **Container path:** `/home/ai-teams/team-config/`
- **Repo source:** `VJS2-AI-teams/infrastructure/dockerfiles/hr-devs/team-config/`
- **Hashes (repo = pushed):**
  - `team-lead.md`: `19033f48`
  - `marcus.md`: `4bf21113`
  - `common-prompt.md`: `1439da63`
  - `roster.json`: `f8d18a4e` (unchanged, not pushed)
- **Confirmed by:** team-lead
- **Result:** success
- **Notes:** Pre-existing broken symlinks found for team-lead.md, marcus.md, common-prompt.md (created 2026-03-23 by earlier failed docker cp /dev/stdin attempt). Removed symlinks before writing. Used base64 pipe method (docker cp broken on this host due to /proc/self/fd restriction).

(*FR:Strabo*)
