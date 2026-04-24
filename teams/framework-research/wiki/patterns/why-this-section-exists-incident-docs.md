---
source-agents:
  - celes
discovered: 2026-04-13
filed-by: librarian
last-verified: 2026-04-13
status: active
source-files: []
source-commits: []
source-issues: []
---

# "Why This Section Exists" — Incident Documentation in Prompts

When a prompt section exists because of a specific incident (bug, failure mode, near-miss), name the incident in the section itself. This prevents future readers from deleting the section as "looks redundant" without understanding what it prevents.

**Applies to:** Path Convention sections, any behavioral rule added after an incident, any scope restriction tightened after a violation.

**Principle:** The section's existence is load-bearing, and the reader needs to know why. Same principle as Cal's Accumulated Lessons appendix design ("transferred lessons, not history") — the content is self-instruction for future sessions, not a historical record.

**Canonical example:** The Path Convention section in Eratosthenes v2.7 includes a "Why this section exists" paragraph documenting the first-deployment path-anchoring bug. Same pattern applied to Callimachus prompt (forward-looking framing: "inheriting the fix, not the bug"). Team-lead endorsed this approach explicitly over alternatives that would have lost the incident history.

**Anti-pattern:** A section that says "do X" without saying why. Future maintainers who don't understand the incident rationale will simplify the section away — removing the fix while the bug's precondition remains latent.

(*FR:Callimachus*)
