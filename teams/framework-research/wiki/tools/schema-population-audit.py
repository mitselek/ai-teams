#!/usr/bin/env python
"""Seventh layer of the librarian's consistency pass: schema population.

The other six layers check the wiki's layers AGAINST EACH OTHER -- entries =
cards = subdir INDEX rows = subdir headers = index.md rows = declared total.
All six can pass at 100% while frontmatter silently fails to conform, because
nothing in a cross-layer check ever looks at a field's contents.

That happened: on 2026-08-28 a census found `confidence` present on 112 of 214
entries with no correlation to anything, and nobody had noticed across months of
passes. The documented fields turned out to be at 100% -- `confidence` simply is
not in the documented schema. This script makes both facts visible on every run.

Added by team-lead ruling 2026-08-28 ("the instrument fix; the number stops
being invisible"). Run from the wiki root.

(*FR:Callimachus*)
"""
import io
import os
import re
import sys

SUBDIRS = "patterns gotchas decisions contracts references process observations findings".split()

# Required by WikiProvenance as documented in prompts/callimachus.md.
REQUIRED = ["source-agents", "discovered", "filed-by", "last-verified", "status"]
# Documented as optional -- reported for visibility, never enforced.
OPTIONAL = ["source-team", "source-files", "source-commits", "source-issues", "ttl"]
# In active use but NOT in the documented schema. Tracked so the gap stays
# visible until Protocol C closes it.
#
# CORRECTION 2026-08-31: this line previously read `absent means "unrated"`.
# That was FALSE and the script printed it on every run. Measured 2026-08-31
# (dated, so it does not rot -- an undated current-state count would): all
# 214 cards then present carried `confidence`, 112 entries also carried it,
# and of those 112 the entry and card values agreed in every single case. So the entry-side field is
# a half-populated mirror of a fully-populated card field -- an entry without
# it is rated on its card, never unrated. No entry in this wiki is unrated.
# The remedy (formalise the mirror vs cards-only, per the S63 `stage-2`
# ruling) is team-lead's + Celes's call; the filer is recused. Until then this
# script reports the count and asserts no semantic for absence.
UNDOCUMENTED = ["confidence"]


def frontmatter(text):
    return text.split("---")[1] if text.startswith("---") else ""


def has(fm, field):
    return bool(re.search(r"^" + re.escape(field) + r":", fm, re.M))


def main():
    counts = {f: 0 for f in REQUIRED + OPTIONAL + UNDOCUMENTED}
    total = 0
    defects = []

    for d in SUBDIRS:
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            if not name.endswith(".md") or name == "INDEX.md":
                continue
            path = os.path.join(d, name)
            if not os.path.isfile(path):
                continue
            fm = frontmatter(io.open(path, encoding="utf-8").read())
            total += 1
            missing = []
            for field in counts:
                if has(fm, field):
                    counts[field] += 1
                elif field in REQUIRED:
                    missing.append(field)
            if missing:
                defects.append((path, missing))

    if not total:
        print("no entries found -- run this from the wiki root")
        return 1

    print("SCHEMA POPULATION -- %d entries\n" % total)
    print("required (documented):")
    for f in REQUIRED:
        print("  %-16s %3d/%d  %d%%" % (f, counts[f], total, 100 * counts[f] // total))
    print("\noptional (documented, reported not enforced):")
    for f in OPTIONAL:
        print("  %-16s %3d" % (f, counts[f]))
    print("\nUNDOCUMENTED but in use -- gap open until Protocol C closes it:")
    for f in UNDOCUMENTED:
        print("  %-16s %3d/%d  %d%%   (every card carries it; absence here is"
              " NOT unrated -- see CORRECTION note in source)"
              % (f, counts[f], total, 100 * counts[f] // total))

    print("\nentries missing >=1 required field: %d" % len(defects))
    for path, missing in defects:
        print("  DEFECT %s -- missing %s" % (path, ", ".join(missing)))

    # Populate on-touch only. A non-zero count is NOT a licence to sweep:
    # sweeps across durable entries are a known housekeeping pathology (S62).
    return 1 if defects else 0


if __name__ == "__main__":
    sys.exit(main())
