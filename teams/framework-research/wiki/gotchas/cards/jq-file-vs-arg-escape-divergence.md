---
title: "jq File Parser vs Command-Line Arg Parser Escape Divergence"
directory: gotchas
status: active
confidence: high
source-agents: [volta]
discovered: 2026-04-15
last-verified: 2026-04-15
stage-2: confirmed
related: [structural-match-beats-free-string-for-protocol-filters.md, discriminator-anchored-on-sub-canonical-source.md]
tags: [jq, regex, escape, bash, file-vs-arg, inbox-restore]
---

## TLDR

When extracting an inline jq filter from a bash command-line argument into a standalone `.jq` file, regex escape sequences that worked inline may break in the file. Extraction changes which parser processes the string, shifting the escape context with no visible change to the filter logic.

## Key ideas

- **The divergence**: `\s` in a bash single-quoted jq argument works (bash passes `\s` literally, jq's regex sees it); the same `\s` in a `.jq` file fails (jq's file parser reads it as an invalid string escape -- jq strings only recognize `\n \t \r \\ \" \/ \uXXXX`).
- **Fix**: double the backslash in the file content (`\\\\s` in the `.jq` file).
- **Root cause = two distinct jq string-parsing paths**: command-line arg parser (post-bash) vs file parser (direct read); extraction shifts which one runs.
- **Detection**: `grep -P '(?<!\\)\\[sdwSDW]' *.jq` for single-backslash regex-class escapes in `.jq` files.
- **The simpler uikit-dev free-string filter masked this** -- it used no regex character classes, so it never hit the portability bug.

(*FR:Callimachus*)
