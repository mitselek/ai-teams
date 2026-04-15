---
source-agents:
  - volta
discovered: 2026-04-15
filed-by: librarian
last-verified: 2026-04-15
status: active
scope: team-wide
source-files:
  - .claude/teams/framework-research/restore-filter.jq
  - .claude/teams/framework-research/restore-inboxes.sh
source-commits:
  - 88ced06
source-issues: []
---

# jq file parser vs command-line arg parser escape divergence

When extracting an inline jq filter from a bash command-line argument into a standalone `.jq` file, regex escape sequences that worked inline may break in the file.

## The gotcha

`\s` (regex whitespace) in a bash single-quoted command-line jq argument works:

```bash
jq '[.[] | select(.message | test("\"type\"\\s*:\\s*\"shutdown_request\"") | not)]' file.json
```

Bash passes the literal characters `\s` to jq's argument parser. jq interprets the `\\` as an escaped backslash producing `\`, then `s` is treated as part of the regex `\s`.

The same `\s` literal inside a `.jq` file fails:

```jq
# restore-filter.jq — BROKEN if using \s
[.[] | select(.message | test("\"type\"\\s*:\\s*\"shutdown_request\"") | not)]
```

In a `.jq` file, jq's file parser reads `\s` as an invalid string escape (jq strings only recognize `\n`, `\t`, `\r`, `\\`, `\"`, `\/`, `\uXXXX`). The fix is to double the backslash in the file content:

```jq
# restore-filter.jq — CORRECT
[.[] | select(.message | test("\"type\"\\\\s*:\\\\s*\"shutdown_request\"") | not)]
```

## Root cause

jq has two distinct string-parsing paths:

1. **Command-line arg parser:** receives the string after bash has processed it. Bash single quotes preserve all characters literally, so `\\s` in the shell becomes `\s` in jq's regex.
2. **File parser:** reads the `.jq` file directly. `\s` in the file is a jq string escape, not a regex escape. jq's string parser does not recognize `\s`, so it either errors or silently drops the backslash (behavior varies by jq version).

The extraction from inline to file changes which parser processes the string, shifting the escape context without any visible change to the filter logic.

## Detection

If a `.jq` file contains regex patterns with `\s`, `\d`, `\w`, or other regex-class escapes that are not valid jq string escapes, the file parser will reject or silently mangle them. Grep for single-backslash regex escapes in `.jq` files:

```bash
grep -P '(?<!\\)\\[sdwSDW]' *.jq
```

## Cross-reference

Discovered during F1 (jq filter extraction, commit `88ced06`). The simpler uikit-dev filter (no `\s` in the pattern) masked this portability bug — it used a free-string match that did not require regex character classes.

(*FR:Callimachus*)
