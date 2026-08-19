#!/usr/bin/env bash
#
# wiki-ref-audit.sh -- reference-integrity audit for the framework-research wiki.
#
# READ-ONLY. Writes nothing, creates no temp files, touches no network.
# Exists because wiki/patterns/wiki-cross-link-convention.md:81 says "Audit when the
# structure shifts" -- we had written the trigger and never built the instrument.
#
# Provenance, kept because it is the sharpest example this tool has of its own subject:
# these checks were first written as three throwaway scripts in /tmp on 2026-08-12 and
# used to produce the numbers in that day's reference-integrity report. /tmp is class C7
# -- a volatile location -- the same class is_volatile() below flags as a defect. The
# audit lived in the location the audit forbids, and the author was killed by a session
# limit minutes later with the scripts still there. They survived only because someone
# else copied them out by hand. A finding you can state and still not apply to yourself
# is the normal case, not the embarrassing exception; that is why it is written down here
# rather than remembered.
#
# Two layers are checked, because they have DIFFERENT correct bases:
#
#   1. prose links  `[text](path.md)`  -- resolved relative to the CITING FILE's dir.
#   2. frontmatter  `related:` / `source-files:` -- resolved under a base PRECEDENCE,
#      canonical first. Canonical is REPO-ROOT-RELATIVE (S62 decision 1): it is what
#      :81 already prescribes, and it is the only one of the four observed bases that
#      can express a cross-repo target at all.
#
# Cross-repo notation (S62 decision 1): `<repo>:<repo-root-relative-path>`, e.g.
# `hr-platform:src/foo.ts`. A bare path means THIS repo. Cross-repo refs are reported
# as UNVERIFIED, not broken -- we cannot resolve another repo from here and must not
# pretend otherwise.
#
# Default mode accepts all four bases and flags non-canonical ones as DRIFT (advisory).
# That is what makes "normalise on touch only" (S62 decision 2) viable rather than a
# decade-long limp -- a mass sweep across durable citations is the very pathology
# wiki/gotchas/citation-orphaning-by-housekeeping-sweep.md warns about.
#
#   --strict   DRIFT becomes a failure. Only canonical frontmatter refs pass.
#   --quiet    counts only, no per-finding lines.
#
# Exit: 0 clean (DRIFT allowed unless --strict), 1 findings, 2 usage/environment error.
#
# (*FR:Finn*)

set -uo pipefail

STRICT=0
QUIET=0
for arg in "$@"; do
  case "$arg" in
    --strict) STRICT=1 ;;
    --quiet)  QUIET=1 ;;
    # Header block only, delimited by content rather than line numbers: a fixed range
    # silently truncates the help text the next time anyone edits the comment above.
    -h|--help) sed -n '3,/^# (\*FR:/p' "$0"; exit 0 ;;
    *) printf 'unknown option: %s\n' "$arg" >&2; exit 2 ;;
  esac
done

REPO=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "not a git repo" >&2; exit 2; }
cd "$REPO" || exit 2
WIKI="teams/framework-research/wiki"
[ -d "$WIKI" ] || { echo "no $WIKI under $REPO" >&2; exit 2; }

broken=0; drift=0; volatile=0; unexpanded=0; crossrepo=0; placeholder=0; ok=0

say() { [ "$QUIET" -eq 1 ] || printf '%s\n' "$1"; }

# A ref we must not treat as a real target. Template placeholders are documentation
# OF the syntax (wiki-cross-link-convention.md documents its own form) and the
# convention's own line 52 already carves out example text. Classifying these as
# broken is the single largest false-positive source -- 3 of 10 on first run.
is_placeholder() {
  case "$1" in
    *'<'*|*'>'*)            return 0 ;;
    entry-name.md)          return 0 ;;
    *NN-topic-name.md)      return 0 ;;
    *your-entry*|*foo.md)   return 0 ;;
  esac
  return 1
}

# Locations that are unreachable for anyone but the author, or that expire.
# This is apex's class C7. Keep the check honest: a file:// or /tmp path is a defect
# even when it resolves on THIS machine, which is exactly why it is a defect.
is_volatile() {
  case "$1" in
    file://*|/tmp/*|*://localhost*|*://127.0.0.1*|blob:*) return 0 ;;
  esac
  return 1
}

# ---------------------------------------------------------------- layer 1: prose
say "== prose links (base = citing file's directory) =="

# Collected into a variable, then consumed by a `while` in THIS shell. A `find | while`
# pipeline runs the loop in a subshell where counter increments are discarded -- and a
# counter that silently stays 0 is exactly the "signal that cannot distinguish two
# states" failure this team keeps filing. Correctness over cleverness.
prose_report=$(
  while IFS= read -r f; do
    d=${f%/*}
    grep -o '](\([^)]*\.md\)[^)]*)' "$f" 2>/dev/null \
    | sed 's/^](//; s/)$//; s/#.*//' \
    | while IFS= read -r t; do
        [ -n "$t" ] || continue
        case "$t" in http://*|https://*) continue ;; esac
        if is_volatile "$t";    then printf 'VOLATILE|%s|%s\n' "$f" "$t"; continue; fi
        if is_placeholder "$t"; then printf 'PLACEHOLDER|%s|%s\n' "$f" "$t"; continue; fi
        if [ -e "$d/$t" ]; then printf 'OK|%s|%s\n' "$f" "$t"
        else printf 'BROKEN|%s|%s\n' "$f" "$t"; fi
      done
  done < <(find "$WIKI" -name '*.md')
)

while IFS='|' read -r verdict f t; do
  [ -n "${verdict:-}" ] || continue
  case "$verdict" in
    BROKEN)      broken=$((broken+1));      say "  BROKEN      $f -> $t" ;;
    VOLATILE)    volatile=$((volatile+1));  say "  VOLATILE    $f -> $t   (C7)" ;;
    PLACEHOLDER) placeholder=$((placeholder+1)) ;;
    OK)          ok=$((ok+1)) ;;
  esac
done <<< "$prose_report"

# ---------------------------------------------------------- layer 2: frontmatter
say ""
say "== frontmatter refs (base precedence: repo-root [canonical] > wiki-root > citing-dir) =="

fm_report=$(
  while IFS= read -r f; do
    d=${f%/*}
    # only the first --- ... --- block; only list items ending in .md
    awk '/^---[[:space:]]*$/{n++; next} n==1 && /^[[:space:]]*-[[:space:]]+.*\.md[[:space:]]*$/{print} n>1{exit}' "$f" 2>/dev/null \
    | sed 's/^[[:space:]]*-[[:space:]]*//; s/[[:space:]]*$//' \
    | while IFS= read -r t; do
        [ -n "$t" ] || continue
        case "$t" in http://*|https://*) continue ;; esac
        case "$t" in
          '$REPO/'*|'${REPO}/'*) printf 'UNEXPANDED|%s|%s\n' "$f" "$t"; continue ;;
        esac
        if is_volatile "$t";    then printf 'VOLATILE|%s|%s\n' "$f" "$t"; continue; fi
        if is_placeholder "$t"; then printf 'PLACEHOLDER|%s|%s\n' "$f" "$t"; continue; fi
        # cross-repo notation <repo>:<path> -- a colon before any slash
        case "$t" in
          */*) head=${t%%/*} ;;
          *)   head=$t ;;
        esac
        case "$head" in
          *:*) printf 'CROSSREPO|%s|%s\n' "$f" "$t"; continue ;;
        esac
        # Canonical is REPO-ROOT-RELATIVE -- the BASE, not any particular prefix.
        # A ref to `topics/05-foo.md` or `designs/new/x.md` is just as canonical as one
        # to `teams/framework-research/wiki/...`; :81's example is a wiki path but the
        # rule it states is about the base it resolves from.
        if   [ -e "./$t" ];     then printf 'CANON|%s|%s\n' "$f" "$t"
        elif [ -e "$WIKI/$t" ]; then printf 'DRIFT-wikiroot|%s|%s\n' "$f" "$t"
        elif [ -e "$d/$t" ];    then printf 'DRIFT-citingdir|%s|%s\n' "$f" "$t"
        else printf 'BROKEN|%s|%s\n' "$f" "$t"; fi
      done
  done < <(find "$WIKI" -name '*.md')
)

fm_canon=0
while IFS='|' read -r verdict f t; do
  [ -n "${verdict:-}" ] || continue
  case "$verdict" in
    CANON)       fm_canon=$((fm_canon+1)) ;;
    DRIFT-*)     drift=$((drift+1));           say "  DRIFT       $f -> $t   (resolves via ${verdict#DRIFT-}, not canonical)" ;;
    BROKEN)      broken=$((broken+1));         say "  BROKEN      $f -> $t   (resolves under NO base)" ;;
    UNEXPANDED)  unexpanded=$((unexpanded+1)); say "  UNEXPANDED  $f -> $t   (literal variable committed; use <repo>:<path>)" ;;
    VOLATILE)    volatile=$((volatile+1));     say "  VOLATILE    $f -> $t   (C7)" ;;
    CROSSREPO)   crossrepo=$((crossrepo+1));   say "  CROSS-REPO  $f -> $t   (UNVERIFIED from here -- not a defect)" ;;
    PLACEHOLDER) placeholder=$((placeholder+1)) ;;
  esac
done <<< "$fm_report"

# ----------------------------------------------------------------------- summary
cat <<SUMMARY

== summary ==
  prose links resolved      : $ok
  frontmatter canonical     : $fm_canon
  frontmatter DRIFT         : $drift        (non-canonical base; advisory unless --strict)
  BROKEN (no base resolves) : $broken
  VOLATILE (C7)             : $volatile
  UNEXPANDED variable       : $unexpanded
  CROSS-REPO (unverified)   : $crossrepo
  placeholders skipped      : $placeholder

  mode: $([ "$STRICT" -eq 1 ] && echo strict || echo transitional)
SUMMARY

# What this tool does NOT check, stated so absence of output is never read as health:
cat <<'LIMITS'

  NOT CHECKED -- do not read a clean run as "references are fine":
    - whether a resolving link still says what the citing text CLAIMS
      (the 2.1.177-pin case: link resolves, claim expired). Semantic, needs a reader.
    - out-of-repo citations INTO this repo (Jira, other repos citing us) -- no symptom here.
    - document-local IDs (C1/C2/C3-style finding numbers) reused across documents.
    - section anchors / heading slugs (apex class C8).
LIMITS

fail=$((broken + volatile + unexpanded))
[ "$STRICT" -eq 1 ] && fail=$((fail + drift))
[ "$fail" -gt 0 ] && exit 1
exit 0
