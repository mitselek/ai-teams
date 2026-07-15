# Tailscale SSH breaks docker port-publish to the tailnet IP -> use host networking

On a box running **Tailscale SSH** (`RunSSH: true`), `docker compose up` publishing a
port to the tailnet IP fails:

```
failed to bind host port 100.x.x.x:2222/tcp: address already in use
```

...even though `ss`/`lsof` show **nothing** listening on that port and a plain
`python3 -c "socket.bind((tailnet_ip, 2222))"` **succeeds**. The conflict is between
Tailscale's nftables rules and docker's port-publish/proxy path -- not a real listener.
A `docker` or dockerd restart does **not** clear it (it is not a stale reservation).

**Fix (proven on sagres, hub deploy 2026-07-15):** run the container with
`network_mode: host` and bind the service's own sshd to the tailnet IP via
`ListenAddress`, so there is no docker port-publish layer to conflict. This is the same
remedy the apex container uses for the analogous Cloudflare WARP case ("host mode
required where an overlay's traffic isn't routed through the docker bridge").

- Entrypoint gained `SSHD_LISTEN_ADDR` (env): when set, sshd binds
  `ListenAddress=<ip>:<port>` -- tailnet-only, never the box's public IP. Default unset
  = all-interfaces (docker-publish deployments unaffected).
- Override: `network_mode: host` + `environment: SSHD_LISTEN_ADDR=<tailnet ip>` +
  healthcheck pointed at the tailnet IP (127.0.0.1 no longer valid under host-net bind).
- **Boot ordering:** host-net + `ListenAddress` fails to bind if the container starts
  before `tailscale0` has the IP. The systemd unit's `ExecStartPre` waits for the IP.

Also: `pkill -f docker-proxy` (or any `-f <word>`) over ssh self-matches the remote
shell's own command line -- see [[pkill-full-match-kills-your-own-ssh-session]].
