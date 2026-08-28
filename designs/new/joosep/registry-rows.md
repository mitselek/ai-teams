# Registry rows for `joosep` -- four places, not one (*FR:Brunel*)

Port **2231**, menu char **`j`**, host RC `100.96.54.170`, user `joosep`.

**Why four.** There is no single fleet registry. Hopper's survey found three records that disagree,
and the one that actually matches the host is a comment in another team's compose file. Registering in
only one guarantees the next person repeats the lookup.

| # | File | Owner | Status |
|---|---|---|---|
| 1 | `/home/dev/allerk/docker-compose.yml` header comment (RC) | Lerko's file, on the host | **The only record that matches the host.** Tier M -- needs sanction |
| 2 | `~/bin/rc-deployments.json` | PO's live personal registry -- this is what `rc-connect` actually reads | PO applies |
| 3 | `~/Documents/github/dev-toolkit/tools/rc-deployments.json` | shared reference copy | PO applies, per the `rc-connect` skill ("always update both") |
| 4 | `mitselek-ai-teams/registry.json` | Aen's file, in-repo | Aen applies |

---

## 1. allerk's compose header (RC host) -- Tier M

Add one line to the existing table in `/home/dev/allerk/docker-compose.yml`, lines 12-15. The table
currently reads:

```
#   2222 apex-research   2223 polyphony-dev   2224 entu-research
#   2226 backlog-triage  2228 uikit-dev       2230 allerk  (this file)
```

Add:

```
#   2231 joosep
```

**This edits another person's file.** It is a comment-only change to a live compose file, but it is
still a host mutation on an artifact we do not own. Route it for sanction; do not fold it into the
provisioning steps as if it were ours. If the PO would rather Lerko make the edit himself, the
provisioning runbook's step for it can simply be skipped -- nothing breaks, the record just stays
incomplete.

## 2 + 3. Both `rc-deployments.json` copies

Insert into the `deployments` array. Formatting matches the surrounding rows (aligned columns):

```json
    { "num": "j", "name": "joosep",               "hostAlias": "rc",       "port": 2231, "user": "joosep",   "key": "~/.ssh/id_ed25519_joosep",    "tmux": "joosep", "status": "live" },
```

The `"tmux": "joosep"` key is what makes the fleet menu land **inside the session** rather than at a
shell -- it is the same shell-vs-session distinction `Connect-Joosep.ps1` exposes as `-Session`, in its
config form. `rc-connect.ps1:162-165` is the branch that consumes it.

**While you are in these files, two pre-existing gaps** (`[PO-9]`, unrelated to Joosep):

```json
    { "num": "L", "name": "allerk",               "hostAlias": "rc",       "port": 2230, "user": "allerk",   "key": "~/.ssh/id_ed25519_allerk",    "tmux": "allerk", "status": "live" },
```

`allerk` is live on RC:2230 and appears in **neither** registry. The key path above is a guess -- ask
Lerko or read `/home/dev/allerk/authorized_keys` before committing it. And the existing apex row's
`"tmux": "apex"` does not match the session its own container launcher manages (`apex-research`, per
`entrypoint-apex.sh:428-432`), so selecting apex from the menu can land in an empty second session.
Both are separate tickets; listed here only because these are the files where they live.

## 4. `mitselek-ai-teams/registry.json`

Shape differs from the personal registry -- this file uses `teamName`/`location`/`accessMethod`:

```json
    {
      "num": "j",
      "teamName": "joosep",
      "host": "100.96.54.170",
      "port": 2231,
      "user": "joosep",
      "sshKey": "~/.ssh/id_ed25519_joosep",
      "location": "RC",
      "accessMethod": "direct-ssh",
      "containerName": "joosep",
      "status": "live"
    },
```

Note this file has **no `tmux` field at all**, so it cannot express the session-vs-shell distinction.
That is a schema gap rather than a missing value; recording it rather than inventing a field.

This file is also missing `uikit-dev` (RC:2228) and `allerk` (RC:2230), and carries a `(reserved)` row
for RC:2221 that nothing uses. Aen's to reconcile.

---

## A caveat on port reasoning, since it was wrong twice

**Ports are a per-host namespace.** Earlier drafts of the design treated 2230 as "double-booked"
because `registry.json` assigns it to `screenwerk` on *shipyard* while `allerk` holds it on *RC*. Those
do not conflict. There is likewise **no fleet-wide uniqueness invariant** to protect -- prod-llm and RC
both already run something on 2226.

So 2231 is not the "next legal" number; it is simply the next unused one on RC, chosen because it reads
unambiguously to a human scanning the table. 2229 would have been equally correct. Nothing about this
choice is load-bearing, and **port choice is not a security control here** -- RC has no host ingress
filtering at all (`iptables -L`: INPUT policy ACCEPT, no rules; ufw/nftables/firewalld inactive).

(*FR:Brunel*)
