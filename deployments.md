# Deployment Registry

Canonical reference for all live AI team deployments. Source of truth: `~/bin/rc-connect.ps1`.

## Hosts

| Alias | IP | Role |
|---|---|---|
| RC | 100.96.54.170 | Remote Claude server (containers + bare metal) |
| PROD-LLM | 10.100.136.162 | Production LLM server (containers, firewalled) |

## Fleet

| # | Name | Host | Port | User | SSH Key | Status |
|---|---|---|---|---|---|---|
| 1 | (reserved) | RC | 2221 | -- | -- | -- |
| 2 | apex-research | RC | 2222 | ai-teams | id_ed25519_apex | live |
| 3 | polyphony-dev | RC | 2223 | ai-teams | id_ed25519_polyphony | live |
| 4 | entu-research | RC | 2224 | ai-teams | id_ed25519_entu | live |
| 5 | hr-devs | PROD-LLM | 2225 | ai-teams | id_ed25519_apex | live |
| 6 | BT-TRIAGE | PROD-LLM | 2226 | ai-teams | id_ed25519_apex | live |
| 7 | comms-dev | PROD-LLM | 2227 | ai-teams | id_ed25519_apex | live |
| 0 | hr-devs (bare metal) | RC | 22 | dev | (default) | live |
| 9 | PROD-LLM (host) | PROD-LLM | 22 | michelek | id_ed25519_apex | live |

## Connection Commands

### RC Server Containers (direct SSH)

```bash
# apex-research
ssh -t -i ~/.ssh/id_ed25519_apex -p 2222 ai-teams@100.96.54.170

# polyphony-dev
ssh -t -i ~/.ssh/id_ed25519_polyphony -p 2223 ai-teams@100.96.54.170

# entu-research
ssh -t -i ~/.ssh/id_ed25519_entu -p 2224 ai-teams@100.96.54.170
```

### PROD-LLM Containers (ProxyJump required)

PROD-LLM (10.100.136.162) is behind a firewall that only exposes port 22. Container ports (2225-2227) are reachable only via ProxyJump through the host.

```bash
# hr-devs (port 2225)
ssh -t -i ~/.ssh/id_ed25519_apex \
  -o "ProxyCommand=ssh -i ~/.ssh/id_ed25519_apex -W %h:%p michelek@10.100.136.162" \
  -p 2225 ai-teams@localhost

# BT-TRIAGE (port 2226)
ssh -t -i ~/.ssh/id_ed25519_apex \
  -o "ProxyCommand=ssh -i ~/.ssh/id_ed25519_apex -W %h:%p michelek@10.100.136.162" \
  -p 2226 ai-teams@localhost

# comms-dev (port 2227)
ssh -t -i ~/.ssh/id_ed25519_apex \
  -o "ProxyCommand=ssh -i ~/.ssh/id_ed25519_apex -W %h:%p michelek@10.100.136.162" \
  -p 2227 ai-teams@localhost
```

### Host Access

```bash
# RC server (bare metal)
ssh dev@100.96.54.170

# PROD-LLM host
ssh -i ~/.ssh/id_ed25519_apex michelek@10.100.136.162
```

### Docker Operations on PROD-LLM

After SSH to the PROD-LLM host:

```bash
# List running containers
sudo docker ps

# Read a file inside a container
sudo docker exec <container-name> cat <path>

# Copy file into container (if docker cp works)
sudo docker cp <local-path> <container-name>:<container-path>

# Fallback: base64 pipe (if docker cp fails with /proc/self/fd error)
base64 <file> | ssh michelek@10.100.136.162 "base64 -d | sudo docker exec -i <container> bash -c 'cat > <path>'"
```

(*FR:Strabo*)
