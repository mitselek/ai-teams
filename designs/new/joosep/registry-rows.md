# Registry rows for `joosep` -- and the RC port ground-truth ruling (*FR:Brunel*)

Port **2231**, menu char **`j`**, host RC `100.96.54.170`, user `joosep`.

## PO ruling 2026-08-28 16:00 -- one record is authoritative for RC ports

> **`/home/dev/allerk/docker-compose.yml`'s header table is the ground-truth port registry for RC.**
> Hopper is sanctioned to add `2231 joosep` to it.

Everything else that lists an RC port is now a **convenience copy that points at it**, not a competing
claim. That inverts the previous situation, where three records disagreed and the accurate one was a
comment in another team's file that nobody was obliged to consult.

**Scope: RC only.** It is the only host with a maintained table, and inventing the same pattern for
prod-llm, shipyard or sagres would be creating a convention rather than recording one. Rows for other
hosts stay as they are.

**Why a comment in a compose file, rather than a JSON registry.** Because under `network_mode: host`
the port *is* a host-global fact, and the people claiming ports are editing compose files on that host
-- so the record lives where the claim is made. A registry a claimant never opens does not get updated;
this one did, for six containers, unprompted. Recording the reason so the ruling does not later look
arbitrary.

| # | File | Role after the ruling | Who applies |
|---|---|---|---|
| 1 | `/home/dev/allerk/docker-compose.yml` header table | **GROUND TRUTH for RC ports** | Hopper (sanctioned) |
| 2 | `~/bin/rc-deployments.json` | connection registry -- what `rc-connect` reads; **points at #1 for ports** | PO |
| 3 | `~/Documents/github/dev-toolkit/tools/rc-deployments.json` | shared copy of #2, same pointer | PO, per the `rc-connect` skill ("always update both") |
| 4 | `mitselek-ai-teams/registry.json` | FR's in-repo record; **`_note` pointer added below** | Brunel (Aen granted edit) |
| 5 | `deployments.md` | PO's prose deployment notes; same pointer line | PO |

**What "points at" means concretely:** each RC-scoped record carries one line saying that the
authoritative port list for `100.96.54.170` is the header table in
`/home/dev/allerk/docker-compose.yml`, and that a new RC port must be claimed **there first**. The
other files still carry the port for connection purposes -- they just stop implying they are the
place to check for collisions.

---

## 1. allerk's compose header (RC host) -- **SANCTIONED**, and now ground truth

Add one line to the existing table in `/home/dev/allerk/docker-compose.yml`, lines 12-15:

```
#   2222 apex-research   2223 polyphony-dev   2224 entu-research
#   2226 backlog-triage  2228 uikit-dev       2230 allerk  (this file)
#   2231 joosep
```

It still edits another person's file, and it is still comment-only. What changed is that the PO has
**sanctioned it and designated this table authoritative**, so it is no longer an optional courtesy that
could be skipped without consequence. Under the ruling, skipping it now means **2231 is not claimed at
all** for anyone checking correctly.

Suggested addition to the table's own header line, so the ruling is legible to whoever reads it next
(Lerko's wording to adjust as he sees fit):

```
# Host port allocation on this machine (network_mode: host, so these are the
# real host ports -- check here before claiming a new one). AUTHORITATIVE for
# RC: the rc-deployments registries carry ports for connection convenience and
# defer to this table for collisions.
```

## 2 + 3 + 5. The pointer line to add to every RC-scoped record

Each of `~/bin/rc-deployments.json`, the dev-toolkit copy, and `deployments.md` gets one line saying
where RC port truth lives. For the two JSON files, as a sibling of `hosts`:

```json
  "_rcPortAuthority": "Ports on RC (100.96.54.170) are claimed in the header table of /home/dev/allerk/docker-compose.yml on that host. Claim there FIRST; the ports below are for connection only and are not the collision record. RC only -- other hosts have no maintained table.",
```

For `deployments.md`, the same as a prose line under the RC section:

> **RC port claims:** the authoritative list is the header table in `/home/dev/allerk/docker-compose.yml`
> on the host. Claim a new RC port there first; ports recorded here are for connection convenience.

## 2 + 3. Both `rc-deployments.json` copies -- the joosep row

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
