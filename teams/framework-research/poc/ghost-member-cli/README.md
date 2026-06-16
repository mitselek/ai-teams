# ghost-chat -- RFC #66 cross-host PoC

Sketch-grade reference implementation validating the ghost-member pattern
proposed in [RFC #66](https://github.com/mitselek/ai-teams/discussions/66)
on a Windows-local-dev ↔ apex-research-on-Linux substrate pair via SSH.
Lets a Windows-side human inject into and read from a remote Linux-host
team's mailbox as a registered-but-not-spawned "ghost" teammate.

## Verdict

Substrate gate cleared cross-host. All four RFC #66 functional claims hold:

- **F1** -- ghost registration accepted by the remote team (one-sided ACL).
- **F2-outbound** -- `ssh`-based write into the remote agent's inbox wakes
  the apex agent's poll loop reliably.
- **F2-inbound** -- apex `SendMessage` lands in the ghost's inbox with
  real-time delivery under the Python implementation.
- **F3** -- apex agents treat the ghost as a normal teammate (addressing,
  reply-to, color rendering).

## Substrate sub-findings

- **SF-1** -- inbox-slot acceptance is decoupled from `members[]` validation;
  registration is a one-sided ACL property of the receiving team.
- **SF-2** -- `agentType` vs `backendType` separation emerged as a richer
  registration shape than the RFC's example sketch.
- **SF-3** -- per-message `color` override beats registered-member color;
  message-level metadata wins over registry-level metadata.
- **SF-4** -- single persistent `ssh` + Python + `fcntl.flock` works as a
  serviceable cross-host atomic-write primitive.

## File inventory

- `ghost-chat.py` -- canonical Python implementation.
  Usage: `python ghost-chat.py --name <ghostname>`.
  Down-arrow opens modal target picker; Up/Down navigate, Enter commit,
  Esc cancel. `/exit` quits.
- `ghost-chat.ps1.deprecated` -- original PowerShell sketch, preserved for
  contrast. PowerShell-specific quirks (UTF-8 console wiring, manual
  non-blocking input, value-leak) motivated the Python rewrite; sub-findings
  stand across both implementations.

## Status

Sketch-grade reference implementation, NOT for production. Substrate
validation complete; library-team architecture design unblocked.

*(FR:Brunel coord. / user impl.)* 2026-05-12 S31
