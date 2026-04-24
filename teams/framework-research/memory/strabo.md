# Strabo scratchpad

## Session: 2026-03-25

[REGISTRY] registry.json created at VJS2-AI-teams/registry.json. 7 entries. configHash fields all null — first draft from known fleet state (Brunel scratchpad + prompt).

[REGISTRY] hr-devs PROD-LLM config location: /home/ai-teams/team-config/ (NOT /root/teams/hr-devs — that's only created after entrypoint runs on team startup)

[GOTCHA] PROD-LLM containers use docker-exec, NOT direct SSH. Access pattern: `ssh michelek@10.100.136.162 "sudo docker exec hr-devs cat <path>"`

[GOTCHA] ProxyJump pattern for direct SSH into PROD-LLM containers: `ssh -o "ProxyCommand=ssh -i ~/.ssh/id_ed25519_apex -W %h:%p michelek@10.100.136.162" -p PORT ai-teams@localhost`

[CHECKPOINT] Task 2 complete 2026-03-25. Pushed team-lead.md, marcus.md, common-prompt.md to hr-devs PROD-LLM. Log at docs/propagation-log.md. Registry configHash updated.

[GOTCHA] docker cp broken on PROD-LLM host (fails with /proc/self/fd error). Use base64 pipe method: `base64 <file> | ssh michelek@10.100.136.162 "base64 -d | sudo docker exec -i <container> bash -c 'cat > <path>'"`.

[GOTCHA] Prior broken push (2026-03-23) left team-lead.md, marcus.md, common-prompt.md as dangling symlinks to /proc/self/fd/0. Had to rm symlinks first. Check for symlinks before any future push: `docker exec hr-devs ls -la /home/ai-teams/team-config/`.

[CHECKPOINT] polyphony-dev, entu-research: repoConfigPath unknown — configs likely in mitselek/ai-teams or hr-platform repo. backlog-triage: no team-config dir baked in VJS2 dockerfiles.

## Session: 2026-03-30

[CHECKPOINT] Created deployment registry at mitselek-ai-teams repo root:

- `deployments.md` — human-readable fleet reference with connection commands, ProxyJump syntax, docker operations
- `registry.json` — machine-readable fleet data, 9 entries (including reserved slot and host-access entries)
- Source: `~/bin/rc-connect.ps1` (canonical)
- Added "Deployment Registry" section to common-prompt.md (after Workspace, before Communication Rule)

[REGISTRY] BT-TRIAGE containerName = "backlog-triage" (display name differs from container name)

[DEFERRED] configHash fields not populated in mitselek-ai-teams/registry.json — need live SSH access to compute hashes
[DEFERRED] Drift detection run against live containers — not attempted this session

(*FR:Strabo*)
