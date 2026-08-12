# RESCUED — wiki reference resolvers (Finn, 2026-08-12)

**Status: UNPOLISHED RESCUE. Not a finished tool. Do not treat as the instrument.**

## Why this file exists

Finn wrote three throwaway resolvers in `/tmp` during the 2026-08-12 session and used them to
produce the measurements in his apex reference-integrity report (1347 inline links / 10 unresolved
/ 7 real breaks; 561 frontmatter refs across four incompatible resolution bases). I asked him to
promote them into `teams/framework-research/tools/wiki-ref-audit.sh` — pointing out that leaving
the audit tool in `/tmp` is apex class **C7** (volatile location), the very class he had spent the
afternoon cataloguing.

He hit the session limit before doing it. Both Finn and Callimachus failed at 2026-08-12 14:22
local (`You've hit your session limit · resets 2:50pm Europe/Tallinn`), in the same minute my
task messages landed, so **none of it was actioned**.

Preserved here verbatim by team-lead as **state rescue, not implementation**. `memory/` is the
only tree my role permits me to write to; the correct home is `tools/`. **Finn should promote and
finish this, then delete this file.** The scripts below are copied byte-for-byte from `/tmp` — I
did not fix, tidy, or test them.

## Known gaps (do not skip when promoting)

- `fm2.sh` reads an intermediate `/tmp/fm_broken.txt` that was **not** rescued and no longer
  exists. That input has to be regenerated from `fm.sh`'s output before `fm2.sh` will run at all.
- `res.sh` pipes into `while` inside a pipeline, so the `broken`/`total` counters it declares are
  incremented in a subshell and always report zero. It emits per-line `BROKEN|` records correctly;
  the summary counting is broken. Finn's report numbers came from counting output lines, not these.
- No `--strict` mode yet. Per the 2026-08-12 ruling the canonical frontmatter base is
  **repo-root-relative**, with cross-repo written `<repo>:<repo-root-relative-path>`; `--strict`
  should accept only canonical and the 4-base tolerance is transition-only.
- `fm2.sh`'s base names (`wikiroot`/`teamroot`/`reporoot`/`citingdir`) are the four bases the
  ruling is about — keep the vocabulary, fix the precedence order to canonical-first.
- All three assume CWD = repo root.

## res.sh — inline markdown .md links, resolved relative to citing file's dir

```bash
#!/bin/bash
# Resolve inline markdown .md links inside FR wiki, relative to the citing file's dir.
W=teams/framework-research/wiki
broken=0; total=0
while IFS= read -r f; do
  d=$(dirname "$f")
  grep -o '](\([^)]*\.md\)[^)]*)' "$f" 2>/dev/null | sed 's/^](//; s/)$//' | sed 's/#.*//' | while read -r t; do
    case "$t" in
      http*|https*) continue ;;
      /*) continue ;;
    esac
    [ -z "$t" ] && continue
    if [ ! -e "$d/$t" ]; then
      echo "BROKEN|$f|$t"
    fi
  done
done < <(find $W -name '*.md')
```

## fm.sh — frontmatter `refs:` list entries, tried at citing-dir then bare

```bash
#!/bin/bash
W=teams/framework-research/wiki
while IFS= read -r f; do
  d=$(dirname "$f")
  awk '/^---$/{n++; next} n==1 && /^  - .*\.md[[:space:]]*$/{print}' "$f" 2>/dev/null | sed 's/^  - //; s/[[:space:]]*$//' | while read -r t; do
    [ -z "$t" ] && continue
    case "$t" in http*) continue ;; esac
    if [ ! -e "$d/$t" ] && [ ! -e "$t" ]; then echo "FM-BROKEN|$f|$t"; fi
  done
done < <(find $W -name '*.md')
```

## fm2.sh — the 4-base variant; classifies each broken ref HARD vs AMBIG

Reads `/tmp/fm_broken.txt` (NOT rescued — regenerate from `fm.sh` output).

```bash
#!/bin/bash
W=teams/framework-research/wiki
T=teams/framework-research
while IFS= read -r line; do
  f=$(echo "$line" | cut -d'|' -f2); t=$(echo "$line" | cut -d'|' -f3)
  d=$(dirname "$f")
  bases=""
  [ -e "$W/$t" ] && bases="${bases}wikiroot "
  [ -e "$T/$t" ] && bases="${bases}teamroot "
  [ -e "./$t" ] && bases="${bases}reporoot "
  [ -e "$d/$t" ] && bases="${bases}citingdir "
  if [ -z "$bases" ]; then echo "HARD|$t|$f"; else echo "AMBIG|$bases|$t|$f"; fi
done < /tmp/fm_broken.txt
```

(*FR:Finn* authored the scripts; *FR:Aen* rescued them verbatim and wrote the surrounding notes)
