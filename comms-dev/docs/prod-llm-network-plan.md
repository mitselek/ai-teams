# PROD-LLM Network & Infrastructure Plan

## Network

Allocated by IT (2026-03-23, Ain Simsalu):

| Parameter | Value |
|-----------|-------|
| Name | PROD-LLM |
| VLAN | 1320 |
| Subnet | 10.100.136.160/29 |
| Gateway | 10.100.136.161 |
| Usable IPs | .162 – .166 (5 hosts) |
| Firewall (inbound) | SSH (22), HTTP (5173) |
| Firewall (outbound) | HTTPS to github.com, api.anthropic.com, api.cloudflare.com |

## Host

| Parameter | Value |
|-----------|-------|
| OS | Debian |
| CPU | 4+ cores |
| RAM | 16+ GB |
| Disk | 200+ GB SSD |
| User | michelek (sudo, key-only SSH) |
| Software | Docker, Docker Compose, Git, tmux, Claude Code CLI |

Azure Arc integration with Defender/Sentinel. May need lighter policy group for AI agent processes.

## Architecture

```
10.100.136.160/29
├── .161  gateway
├── .162  main host — Docker, all team containers, master dashboard (:5173)
│         ├── apex-research     (SSH :2222)
│         ├── polyphony-dev     (SSH :2223)
│         ├── entu-research     (SSH :2224)
│         ├── hr-devs           (SSH :2225)
│         ├── backlog-triage    (SSH :2226)
│         └── master-dashboard  (:5173, aggregates all team dashboards)
├── .163  comms-dev — comms hub / chat server for inter-team communication
│         └── separate IP because comms-dev serves all other teams
├── .164  (reserve)
├── .165  (reserve)
└── .166  (reserve)
```

### Design Rationale

- **All teams share one Docker host** (.162) — containers use internal networking, only the host IP is exposed.
- **comms-dev gets a dedicated IP** (.163) — the comms hub handles inter-team message routing and must be reachable as a distinct network identity, not just another container behind the main host.
- **Master dashboard** on port 5173 replaces per-team dashboard ports (5173, 5175, 5176, 5177).
- **3 reserve IPs** for future needs (dedicated build server, monitoring, etc.).

## Migration from RC Server

The RC server (dev@100.96.54.170 via Tailscale) is the interim host. When PROD-LLM is delivered:

1. Provision Debian host at .162, install Docker + tooling
2. Migrate container images and volumes from RC server
3. Deploy comms-dev on .163
4. Update `rc-connect.ps1` with PROD-LLM addresses
5. Decommission Tailscale-based access (or keep as fallback)

## IT Ticket History

- **2026-03-18** — Mihkel submitted request (Ubuntu 24.04 originally)
- **2026-03-19** — Roland (IT): asked about Ubuntu licensing, Azure Arc, Defender. Mihkel confirmed Debian is fine.
- **2026-03-23** — Ain Simsalu: network allocated (PROD-LLM, VLAN 1320, 10.100.136.160/29). Roland: requested port 5173 open.
