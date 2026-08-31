#!/usr/bin/env bash
# entrypoint.sh -- joosep personal workbench (*FR:Brunel*)
#
# Runs as root, prepares the container, then drops to `joosep` via gosu.
#
# Steps:
#   0  hostname resolution (host-networking only)
#   1  WARP CA into the system store
#   2  volume ownership (Docker creates named volumes as root)
#   3  env vars into .bashrc (compose env does not reach SSH shells)
#   4  git identity
#   5  clone/pull repos -- ALL NON-FATAL
#   7  ~/.claude/settings.json (no mcp.json -- Atlassian is the EVR connector)
#   8  ~/.claude.json durable backup/restore
#   9  tmux config + the joosep-session launcher
#   9b seed ~/FIRST-TASKS.md          (seed-stamp: re-seed only while untouched)
#   9c seed ~/work/<team>/            (same discipline, directory digest) + local git
#   9c2 generate ~/work/CLAUDE.md     (points the parent session at the team)
#  10  sshd host keys (persistent volume) + sshd start
#  11  validation gates
#  12  drop privileges and exec
#
# Step 6 (Jira MCP server build) was REMOVED when the EVR Atlassian connector
# replaced the local stdio server. Numbering is left with the gap rather than
# renumbered, so existing references in the runbook stay valid.
#
# DESIGN NOTE -- what is deliberately ABSENT: the `.bashrc` auto-tmux hook used
# by backlog-triage/hr-devs. That hook fires on `[ -z "$TMUX" ] && [ -n
# "$SSH_CONNECTION" ]` and ends in `exec tmux attach`, which hijacks EVERY
# interactive login and makes a bare shell unreachable by construction. This
# container must offer BOTH modes (bare = shell, -Session = inside Claude), so
# the session is entered by an explicit remote command instead (Step 9).
# Adding the hook on top would defeat the switch silently -- it produces a
# successful-looking session, not an error.
set -e

CONTAINER_USER="joosep"
CONTAINER_UID="1000"
CONTAINER_GID="1000"
HOME_DIR="/home/joosep"
CLAUDE_DIR="${HOME_DIR}/.claude"
WORK="${HOME_DIR}/work"
HOSTKEY_DIR="/etc/ssh/keys"

# No TOOLKIT_DIR / JIRA_MCP_DIR / ATLASSIAN_* here by design -- Atlassian access
# is the EVR connector, authenticated at first run, not a local MCP server with
# an API token. See the Step 7 comment.

# ── Helper: clone or pull, never fatal ────────────────────────────────────────
# Boot must never abort on a repo fetch. A GitHub SSO lapse or a network blip
# would otherwise stop the container BEFORE sshd starts (Step 10), leaving no
# way in to diagnose it and a Docker restart-loop on top. Inherited from the
# apex entrypoint, where exactly this cost a crash-loop.
clone_or_pull() {
    local repo_url="$1" target_dir="$2" label="$3" auth_url
    [ -z "$repo_url" ] && return 0
    auth_url=$(echo "$repo_url" | sed "s|https://|https://${GITHUB_TOKEN}@|")

    if [ -d "${target_dir}/.git" ]; then
        gosu "${CONTAINER_USER}" git -C "${target_dir}" remote set-url origin "${auth_url}" || true
        if gosu "${CONTAINER_USER}" git -C "${target_dir}" pull --ff-only 2>&1 | tail -1; then
            echo "[entrypoint] ${label}: pulled."
        else
            echo "[entrypoint] WARNING: ${label}: pull failed (non-fast-forward or network); using existing state."
        fi
    else
        echo "[entrypoint] ${label}: first run, cloning..."
        rm -rf "${target_dir}"
        mkdir -p "${WORK}"
        chown "${CONTAINER_UID}:${CONTAINER_GID}" "${WORK}"
        cd /
        if gosu "${CONTAINER_USER}" git clone --quiet "${auth_url}" "${target_dir}"; then
            echo "[entrypoint] ${label}: cloned."
        else
            echo "[entrypoint] WARNING: ${label}: clone failed (GitHub SSO/network/token scope); continuing without it."
        fi
    fi
}

# ── Step 0: hostname resolution ───────────────────────────────────────────────
# Only needed under host networking, where Docker writes no entry for the
# container's own hostname. Harmless under bridge. (compose `extra_hosts` should
# already cover this; belt and braces, and idempotent.)
if ! grep -q 'joosep' /etc/hosts 2>/dev/null; then
    echo "127.0.0.1 joosep" >> /etc/hosts
fi

# ── Step 1: WARP CA ───────────────────────────────────────────────────────────
# Cloudflare WARP intercepts HTTPS and re-signs with a corporate CA. Without it
# in the system store, curl/apt/git inside the container fail. Node does NOT use
# the system store -- NODE_EXTRA_CA_CERTS (set in compose) covers it separately.
# Bind-mounted from the host [PO-13] so a CA rotation is picked up on restart
# rather than going stale invisibly inside a baked image layer.
WARP_CA="/opt/warp-ca.pem"
if [ -f "$WARP_CA" ]; then
    if cp "$WARP_CA" /usr/local/share/ca-certificates/warp-ca.crt \
        && update-ca-certificates --fresh > /dev/null 2>&1; then
        echo "[entrypoint] WARP CA added to system CA store."
    else
        echo "[entrypoint] WARNING: WARP CA install failed; HTTPS may fail. Continuing to sshd."
    fi
else
    echo "[entrypoint] WARNING: no WARP CA at ${WARP_CA}. If this host is WARP-protected, HTTPS will fail."
    echo "[entrypoint]          Check the bind mount in docker-compose.yml against the host path."
fi

# ── Step 2: volume ownership ──────────────────────────────────────────────────
# Docker creates named volumes owned by root. Fix before dropping privileges.
for DIR in "$HOME_DIR" "$WORK" "$CLAUDE_DIR"; do
    if [ -d "$DIR" ]; then
        [ "$(stat -c '%u' "$DIR")" = "0" ] && chown "${CONTAINER_UID}:${CONTAINER_GID}" "$DIR"
    else
        mkdir -p "$DIR"
        chown "${CONTAINER_UID}:${CONTAINER_GID}" "$DIR"
    fi
done

# ── Step 3: env vars into .bashrc ─────────────────────────────────────────────
# Compose env does not propagate to SSH or `sudo su` shells; agents need these
# in every shell.
#
# SECURITY NOTE, read before adding anything here: this file is written in
# CLEARTEXT and is readable by the container user -- who IS Joosep. That is
# correct ONLY because every credential below is his own (his fine-grained PAT,
# his Atlassian token). Never inject a credential belonging to someone else
# through this mechanism. The remedy for a shared credential is a per-person
# credential, NOT removing this step, which would break the shells it serves.
BASHRC="${HOME_DIR}/.bashrc"
touch "$BASHRC"

if ! grep -q '\.local/bin' "$BASHRC" 2>/dev/null; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$BASHRC"
fi

declare -A SHELL_VARS=(
    [HOME]="${HOME_DIR}"
    [TZ]="Europe/Tallinn"
    [LANG]="en_US.UTF-8"
    [LC_ALL]="en_US.UTF-8"
    [CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS]="${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-1}"
    [TEAM_NAME]="${TEAM_NAME:-paunvere}"
    [CLAUDE_ENV_ID]="${CLAUDE_ENV_ID:-JOOSEP}"
    [GITHUB_TOKEN]="${GITHUB_TOKEN:-}"
    [TERM]="xterm-256color"
)
# Note: the loop below skips EMPTY values, so an absent GITHUB_TOKEN simply
# writes nothing rather than exporting an empty string that would make `gh`
# fail in a confusing way (an empty token reads as "authenticated with nothing"
# rather than "not authenticated").
[ -n "${NODE_EXTRA_CA_CERTS:-}" ] && SHELL_VARS[NODE_EXTRA_CA_CERTS]="${NODE_EXTRA_CA_CERTS}"

for var in "${!SHELL_VARS[@]}"; do
    val="${SHELL_VARS[$var]}"
    if [ -n "$val" ]; then
        sed -i "/^export ${var}=/d" "$BASHRC"
        echo "export ${var}=${val}" >> "$BASHRC"
    fi
done
chown "${CONTAINER_UID}:${CONTAINER_GID}" "$BASHRC"

# ── Step 4: git identity ──────────────────────────────────────────────────────
gosu "${CONTAINER_USER}" git config --global user.name  "${GIT_USER_NAME:-Joosep Madar}"
gosu "${CONTAINER_USER}" git config --global user.email "${GIT_USER_EMAIL:-joosep.madar@evr.ee}"
gosu "${CONTAINER_USER}" git config --global credential.helper store

# ── Step 5: repos ─────────────────────────────────────────────────────────────
# Narrowed per the research brief to the two repos he has actually committed to.
# Do NOT mirror the 40+ repos his org grants reach; expand on demand.
#
# GITHUB_TOKEN IS EXPECTED TO BE ABSENT ON FIRST BOOT (PO decision 2026-08-28):
# creating the fine-grained PAT is Joosep's team's OWN first task, not something
# the PO hands over. So an unset token is the NORMAL first-boot state, not a
# fault -- the message below is deliberately not a WARNING, because a warning
# would train the operator to ignore real ones.
#
# Adding the token later needs NO REBUILD: edit .env, then `./joosep.sh restart`
# (which is `up -d --force-recreate` -- compose only re-reads .env on recreate,
# NOT on a plain `docker restart`). This block then clones on that next boot.
if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "[entrypoint] No GITHUB_TOKEN yet -- skipping clones. This is expected on first boot."
    echo "[entrypoint]   The PAT is task 1 in ~/FIRST-TASKS.md. Once it exists:"
    echo "[entrypoint]   add GITHUB_TOKEN to .env on the host, then ./joosep.sh restart"
else
    clone_or_pull "${REPO_1_URL:-}"  "${WORK}/HES-integration-tests" "HES-integration-tests"
    clone_or_pull "${REPO_2_URL:-}"  "${WORK}/rumba"                 "rumba"
fi

# ── Step 7: Claude settings + MCP config (first run only) ─────────────────────
# Not overwritten if present -- the volume persists user customisation.
install -d -m 700 -o "${CONTAINER_UID}" -g "${CONTAINER_GID}" "${CLAUDE_DIR}"

SETTINGS_FILE="${CLAUDE_DIR}/settings.json"
if [ ! -f "$SETTINGS_FILE" ]; then
    cat > "$SETTINGS_FILE" << 'SETTINGS_EOF'
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "includeCoAuthoredBy": false,
  "permissions": {
    "defaultMode": "default",
    "allow": [
      "Read", "Glob", "Grep", "Edit", "Write", "Bash",
      "WebFetch(domain:github.com)",
      "WebFetch(domain:raw.githubusercontent.com)",
      "WebFetch(domain:eestiraudtee.atlassian.net)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(git push --force:*)",
      "Bash(git push:*origin main*)",
      "Bash(git reset --hard:*)"
    ]
  }
}
SETTINGS_EOF
    chown "${CONTAINER_UID}:${CONTAINER_GID}" "$SETTINGS_FILE"
    echo "[entrypoint] settings.json created."
fi

# NO mcp.json IS SEEDED -- deliberately (PO decision 2026-08-28).
#
# Earlier drafts seeded a local stdio Jira MCP server from dev-toolkit, driven
# by ATLASSIAN_* env vars, and carried a known gap: it covered Jira only, not
# Confluence. The PO's ruling replaces that whole path with the **EVR Atlassian
# connector**, authenticated interactively by Joosep at first run (task 2 in
# ~/FIRST-TASKS.md). The connector covers Jira AND Confluence, which closes the
# gap rather than working around it.
#
# Three consequences, recorded so nobody "restores" the old path:
#   1. No ATLASSIAN_* env vars anywhere. No API token on disk, in .env, or in
#      this container's .bashrc. There is nothing here to leak.
#   2. dev-toolkit is no longer cloned -- it was pulled in ONLY as the source of
#      that MCP server. Dropping it also tightens the PAT scope to exactly the
#      two repos the research brief named.
#   3. mcp.json is left ABSENT rather than seeded empty, so the connector's own
#      configuration is the only thing present and there is no stale entry to
#      confuse it.

# ── Step 8: ~/.claude.json backup/restore ─────────────────────────────────────
# Under this layout the whole $HOME is a volume, so the home-root ~/.claude.json
# already persists -- unlike apex, where it sat outside the .claude volume and a
# recreate wiped it. Kept anyway as a cheap guard against CORRUPTION rather than
# absence: restore only a backup that is non-empty AND parses as JSON, so a
# half-written file is skipped rather than stickily restored.
CLAUDE_JSON="${HOME_DIR}/.claude.json"
BACKUP_DIR="${CLAUDE_DIR}/backups"
install -d -m 700 -o "${CONTAINER_UID}" -g "${CONTAINER_GID}" "${BACKUP_DIR}"
if [ -f "$CLAUDE_JSON" ] && [ -s "$CLAUDE_JSON" ]; then
    DEST="${BACKUP_DIR}/.claude.json.backup.$(date +%s)"
    if cp "$CLAUDE_JSON" "$DEST" 2>/dev/null; then
        chown "${CONTAINER_UID}:${CONTAINER_GID}" "$DEST"; chmod 600 "$DEST"
        find "${BACKUP_DIR}" -maxdepth 1 -type f -name '.claude.json.backup.*' 2>/dev/null \
            | sort | head -n -10 | while IFS= read -r f; do rm -f "$f"; done || true
    fi
elif [ ! -f "$CLAUDE_JSON" ]; then
    LATEST=$(find "${BACKUP_DIR}" -maxdepth 1 -type f -name '.claude.json.backup.*' 2>/dev/null | sort | tail -1 || true)
    if [ -n "$LATEST" ] && [ -s "$LATEST" ] && node -e 'JSON.parse(require("fs").readFileSync(process.argv[1]))' "$LATEST" 2>/dev/null; then
        cp "$LATEST" "$CLAUDE_JSON"
        chown "${CONTAINER_UID}:${CONTAINER_GID}" "$CLAUDE_JSON"; chmod 600 "$CLAUDE_JSON"
        echo "[entrypoint] restored ~/.claude.json from ${LATEST}."
    fi
fi

# ── Step 9: tmux config + the session launcher ────────────────────────────────
cat > "${HOME_DIR}/.tmux.conf" << 'TMUX_EOF'
set -g default-terminal "tmux-256color"
set -gq utf8 on
set -gq status-utf8 on
set -g mouse on
set -g history-limit 50000
set -g status-interval 5
TMUX_EOF
chown "${CONTAINER_UID}:${CONTAINER_GID}" "${HOME_DIR}/.tmux.conf"

# The -Session half of Connect-Joosep.ps1. Invoked as an ssh remote command:
#   ssh -t -p 2231 joosep@<host> joosep-session
# Attach if the session exists, otherwise create it and start Claude.
# Lives in /usr/local/bin (the entrypoint runs as root, so it can write there).
cat > /usr/local/bin/joosep-session << 'LAUNCHER_EOF'
#!/usr/bin/env bash
# joosep-session -- attach to the team's Claude session, creating it if absent.
# Detaching (Ctrl-b d) or dropping the connection leaves Claude running.
#
# Session name is FIXED to the container name and deliberately NOT ${TEAM_NAME}.
# The tmux session is the human's entry point to this container; the team name
# is an internal detail that may change (see the design doc 0.1 -- under the
# person-shaped layout a team rename is a `mv`). Deriving the session name from
# TEAM_NAME couples them, and a later rename would silently desynchronise this
# launcher from the `tmux` field in rc-deployments.json -- which is exactly the
# live defect filed as [PO-9] against apex ("tmux": "apex" in the registry vs a
# session named apex-research managed by its own launcher; the menu can land in
# an empty second session). Fixed name, one place to change, no drift.
S="joosep"
if tmux has-session -t "$S" 2>/dev/null; then
    exec tmux -u attach -t "$S"
fi
echo "No session '$S' -- creating one and starting Claude."
tmux new-session -d -s "$S" -c "$HOME/work"
tmux send-keys -t "$S" "claude" Enter
exec tmux -u attach -t "$S"
LAUNCHER_EOF
chmod 0755 /usr/local/bin/joosep-session

# ── Step 9b: seed FIRST-TASKS.md into the home ────────────────────────────────
# The onboarding backlog for Joosep's own team: create the PAT, authenticate the
# EVR Atlassian connector, verify both, then roster onboarding. Baked into the
# image at /opt and copied out on first boot.
#
# GUARDED create, never overwrite: once Joosep or his agents start ticking items
# off, this becomes THEIR working file. A rebuild must not silently revert their
# progress. The pristine copy stays at /opt/FIRST-TASKS.md if they ever want to
# diff against it.
# FAIL LOUDLY if the pristine copy is missing (Hopper pre-flight, 2026-08-28).
# The original guard was `[ -f /opt/... ] && [ ! -f ~/... ]`, which SILENTLY
# skips seeding when the image lacks the file -- and the file is the container's
# entire onboarding path, so a silent skip hands Joosep a container with no
# instructions and no indication anything is wrong. The Dockerfile COPY makes
# absence a build failure today; this guards the case where someone later drops
# that COPY line and the failure would otherwise move from build-time to
# invisible. Loud, but still non-fatal: a missing onboarding doc must not stop
# sshd from coming up.
#
# RE-SEED ON A NEW VERSION IF UNTOUCHED (added 2026-08-31). The plain
# `[ ! -f ~/... ]` guard was correct about intent and wrong in practice: the
# FIRST boot that created ~/FIRST-TASKS.md was OUR smoke test, not Joosep. So
# the file it "protected" was an artifact of our own testing, and a rebuild
# shipping a corrected /opt version -- the Estonian translation, say -- would
# never have reached him. He would have read the superseded English copy
# indefinitely, with nothing anywhere reporting a problem.
#
# Discriminator: record the md5 of what we seeded, at seed time. On a later
# boot, if the user's copy still matches what we seeded, he has not touched it
# and a newer /opt version is safe to install. If it differs, he has edited it
# -- leave it alone and say a newer version exists. This distinguishes
# "seeded and untouched" from "seeded and edited", which the file's mere
# existence cannot.
SEED_STAMP="${CLAUDE_DIR}/.first-tasks.seeded.md5"
if [ ! -f /opt/FIRST-TASKS.md ]; then
    echo "[entrypoint] ERROR: /opt/FIRST-TASKS.md is MISSING from the image."
    echo "[entrypoint]        The Dockerfile should COPY it. Joosep has no onboarding path"
    echo "[entrypoint]        until this is fixed and the image rebuilt."
else
    OPT_MD5=$(md5sum /opt/FIRST-TASKS.md | cut -d' ' -f1)
    if [ ! -f "${HOME_DIR}/FIRST-TASKS.md" ]; then
        install -m 644 -o "${CONTAINER_UID}" -g "${CONTAINER_GID}" \
            /opt/FIRST-TASKS.md "${HOME_DIR}/FIRST-TASKS.md"
        printf '%s\n' "$OPT_MD5" > "$SEED_STAMP"
        chown "${CONTAINER_UID}:${CONTAINER_GID}" "$SEED_STAMP"
        echo "[entrypoint] seeded ~/FIRST-TASKS.md (first boot)."
    else
        HOME_MD5=$(md5sum "${HOME_DIR}/FIRST-TASKS.md" | cut -d' ' -f1)
        SEEDED_MD5=$(cat "$SEED_STAMP" 2>/dev/null || echo "")
        if [ "$HOME_MD5" = "$OPT_MD5" ]; then
            :   # already current, nothing to say
        elif [ -n "$SEEDED_MD5" ] && [ "$HOME_MD5" = "$SEEDED_MD5" ]; then
            install -m 644 -o "${CONTAINER_UID}" -g "${CONTAINER_GID}" \
                /opt/FIRST-TASKS.md "${HOME_DIR}/FIRST-TASKS.md"
            printf '%s\n' "$OPT_MD5" > "$SEED_STAMP"
            chown "${CONTAINER_UID}:${CONTAINER_GID}" "$SEED_STAMP"
            echo "[entrypoint] ~/FIRST-TASKS.md was untouched and a newer version shipped -- re-seeded."
        else
            # Edited by the user, OR seeded before this stamp existed and we
            # cannot tell. Both resolve the same way: never overwrite, say so.
            echo "[entrypoint] NOTE: ~/FIRST-TASKS.md differs from the shipped /opt/FIRST-TASKS.md"
            echo "[entrypoint]       and is not the version this container seeded, so it is being"
            echo "[entrypoint]       left alone. If you have not edited it, 'cp /opt/FIRST-TASKS.md ~/'"
            echo "[entrypoint]       takes the newer one; diff them first if unsure."
        fi
    fi
fi

# ── Step 9c: seed the team package into ~/work/ ───────────────────────────────
# Same seed-stamp discipline as FIRST-TASKS.md, applied to a DIRECTORY: record a
# digest of what we installed, re-seed only while the user's copy still matches
# it, never clobber edits. The prompts and roster are theirs to tune once work
# starts, and a rebuild must not revert that.
#
# The digest is a sorted md5 of every file, so it catches an edit to any prompt,
# not just a changed file count.
TEAM_SRC="/opt/teams/${TEAM_NAME:-paunvere}"
TEAM_DST="${WORK}/${TEAM_NAME:-paunvere}"
TEAM_STAMP="${CLAUDE_DIR}/.team-package.seeded.md5"

dir_digest() {
    find "$1" -type f -exec md5sum {} \; 2>/dev/null \
        | sed "s| $1/| |" | sort | md5sum | cut -d' ' -f1
}

if [ ! -d "$TEAM_SRC" ]; then
    echo "[entrypoint] ERROR: ${TEAM_SRC} is MISSING from the image."
    echo "[entrypoint]        The Dockerfile should COPY the team package. Joosep has an"
    echo "[entrypoint]        onboarding doc but no team to onboard until this is fixed."
else
    SRC_DIGEST=$(dir_digest "$TEAM_SRC")
    if [ ! -d "$TEAM_DST" ]; then
        install -d -m 755 -o "${CONTAINER_UID}" -g "${CONTAINER_GID}" "$TEAM_DST"
        cp -r "${TEAM_SRC}/." "${TEAM_DST}/"
        chown -R "${CONTAINER_UID}:${CONTAINER_GID}" "$TEAM_DST"
        printf '%s\n' "$SRC_DIGEST" > "$TEAM_STAMP"
        chown "${CONTAINER_UID}:${CONTAINER_GID}" "$TEAM_STAMP"
        echo "[entrypoint] seeded ${TEAM_DST} (first boot)."
    else
        DST_DIGEST=$(dir_digest "$TEAM_DST")
        SEEDED_DIGEST=$(cat "$TEAM_STAMP" 2>/dev/null || echo "")
        if [ "$DST_DIGEST" = "$SRC_DIGEST" ]; then
            :   # current
        elif [ -n "$SEEDED_DIGEST" ] && [ "$DST_DIGEST" = "$SEEDED_DIGEST" ]; then
            cp -r "${TEAM_SRC}/." "${TEAM_DST}/"
            chown -R "${CONTAINER_UID}:${CONTAINER_GID}" "$TEAM_DST"
            printf '%s\n' "$SRC_DIGEST" > "$TEAM_STAMP"
            chown "${CONTAINER_UID}:${CONTAINER_GID}" "$TEAM_STAMP"
            echo "[entrypoint] team package was untouched and a newer version shipped -- re-seeded."
        else
            echo "[entrypoint] NOTE: ${TEAM_DST} differs from the shipped ${TEAM_SRC} and is not the"
            echo "[entrypoint]       version this container seeded -- leaving it alone. Compare with"
            echo "[entrypoint]       'diff -r ${TEAM_SRC} ${TEAM_DST}' if you want the newer one."
        fi
    fi

    # Local git, no remote: gives the team a history of its own prompt edits and
    # makes 'what did we change' answerable without a server.
    if [ ! -d "${TEAM_DST}/.git" ]; then
        gosu "${CONTAINER_USER}" git -C "$TEAM_DST" init --quiet 2>/dev/null \
            && gosu "${CONTAINER_USER}" git -C "$TEAM_DST" add -A 2>/dev/null \
            && gosu "${CONTAINER_USER}" git -C "$TEAM_DST" -c commit.gpgsign=false \
                 commit -q -m "seed: team package as shipped" 2>/dev/null \
            && echo "[entrypoint] initialised local git in ${TEAM_DST} (no remote)."
    fi
fi

# ── Step 9c2: ~/work/CLAUDE.md -- points the parent session at the team ────────
# Generated, not COPYed, so it follows TEAM_NAME. Guarded-create: if Joosep has
# written his own, leave it.
WORK_CLAUDE="${WORK}/CLAUDE.md"
if [ ! -f "$WORK_CLAUDE" ]; then
    cat > "$WORK_CLAUDE" << CLAUDEMD_EOF
# CLAUDE.md -- ${TEAM_NAME:-paunvere}

**Sina oled Minot**, tiimi \`${TEAM_NAME:-paunvere}\` juht. Loe esimese asjana
\`${TEAM_NAME:-paunvere}/startup.md\` -- seal on kogu käivitusprotseduur ja tiimi kirjeldus.

Joosepi enda juhend on \`~/FIRST-TASKS.md\`.

Ära spawni ühtegi agenti ilma ülesandeta.
CLAUDEMD_EOF
    chown "${CONTAINER_UID}:${CONTAINER_GID}" "$WORK_CLAUDE"
    echo "[entrypoint] created ${WORK_CLAUDE}."
fi

# ── Step 10: sshd host keys + start ───────────────────────────────────────────
# Keys live on the joosep_sshd volume so they survive image rebuilds. Without
# this, every rebuild regenerates them and the client hits REMOTE HOST
# IDENTIFICATION HAS CHANGED -- which trains the user to clear known_hosts,
# which is the habit that makes host-key pinning worthless.
install -d -m 700 -o root -g root "${HOSTKEY_DIR}"
for kt in ed25519 rsa; do
    if [ ! -f "${HOSTKEY_DIR}/ssh_host_${kt}_key" ]; then
        if ssh-keygen -q -t "${kt}" -N "" -f "${HOSTKEY_DIR}/ssh_host_${kt}_key"; then
            echo "[entrypoint] generated persistent sshd ${kt} host key (first boot)."
        else
            echo "[entrypoint] WARNING: ${kt} host key generation failed; continuing."
        fi
    fi
    chmod 600 "${HOSTKEY_DIR}/ssh_host_${kt}_key"     2>/dev/null || true
    chmod 644 "${HOSTKEY_DIR}/ssh_host_${kt}_key.pub" 2>/dev/null || true
done

if [ -s /opt/authorized_keys ]; then
    echo "[entrypoint] authorized_keys: $(grep -cE '^(ssh|ecdsa)' /opt/authorized_keys || echo 0) key(s) present."
    /usr/sbin/sshd -p 2231 && echo "[entrypoint] sshd started on port 2231."
else
    echo "[entrypoint] WARNING: /opt/authorized_keys empty or missing -- SSH access DISABLED."
    echo "[entrypoint]          Add a key to ./authorized_keys beside docker-compose.yml and restart."
fi

# ── Step 11: validation gates ─────────────────────────────────────────────────
echo "[entrypoint] Runtime validation:"
NODE_MAJOR=$(node --version 2>/dev/null | grep -oE '[0-9]+' | head -1)
if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 20 ]; then
    echo "  FAIL: Node.js < 20 -- aborting." >&2; exit 1
fi
echo "  OK: Node.js v${NODE_MAJOR}"

if gosu "${CONTAINER_USER}" bash -lc 'command -v claude' >/dev/null 2>&1; then
    echo "  OK: claude on PATH ($(gosu "${CONTAINER_USER}" bash -lc 'claude --version' 2>/dev/null | head -1))"
else
    echo "  WARN: claude not on PATH for ${CONTAINER_USER}."
fi

# The -Session path specifically: resolve `claude` the way sshd will, i.e.
# through SetEnv PATH and NOT through .bashrc. If this warns, -Session will
# fail while a bare login still works -- the exact split that is hard to chase.
if gosu "${CONTAINER_USER}" env -i PATH=/home/joosep/.local/bin:/usr/local/bin:/usr/bin:/bin \
        sh -c 'command -v claude' >/dev/null 2>&1; then
    echo "  OK: claude resolves on the sshd remote-command PATH (-Session will work)"
else
    echo "  WARN: claude does NOT resolve on the remote-command PATH -- check SetEnv in sshd_config."
fi

command -v gh >/dev/null 2>&1 && echo "  OK: gh $(gh --version 2>&1 | head -1)" || echo "  WARN: gh missing."

# Repo presence is reported against the CREDENTIAL STATE, not absolutely.
# Before the PAT exists, absent repos are the correct state and must not read as
# a fault -- otherwise the first-boot log is a wall of warnings that are all
# expected, which is how real warnings get ignored.
if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "  PENDING: repos not cloned (no PAT yet -- task 1 in ~/FIRST-TASKS.md)"
else
    [ -d "${WORK}/HES-integration-tests/.git" ] && echo "  OK: HES-integration-tests" || echo "  WARN: HES-integration-tests absent despite a token -- check PAT scope."
    [ -d "${WORK}/rumba/.git" ]                 && echo "  OK: rumba"                 || echo "  WARN: rumba absent despite a token -- check PAT scope."
fi

echo "  INFO: Atlassian is the EVR connector (task 2 in ~/FIRST-TASKS.md), not a local MCP server."

echo "[entrypoint] Ready. Shell: ssh -p 2231 joosep@<host> | Session: ssh -t -p 2231 joosep@<host> joosep-session"

# ── Step 12: drop privileges and exec ─────────────────────────────────────────
exec gosu "${CONTAINER_USER}" "$@"
