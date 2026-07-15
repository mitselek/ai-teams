# Container ssh ports bind to the tailnet IP only

**Decision (2026-07-15):** team-container sshd ports are published on the box's
tailscale address (`100.103.189.3:2229`, `:2230`), never `0.0.0.0`.

**Why:** the boxes have public IPv4s; a `0.0.0.0` bind would expose every team's
sshd to the internet. Tailnet-only means reachability equals tailnet membership —
which is already the company's network boundary (joining the tailnet is part of
onboarding). Nothing listens publicly except the box's own sshd (Hostinger default).

**Consequence:** port numbering continues the fleet registry sequence
(`deployments.md`): 2228 reserved (ruth-team), mvox = 2229, screenwerk = 2230.
