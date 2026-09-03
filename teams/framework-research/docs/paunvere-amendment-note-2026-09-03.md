# paunvere amendment A1 -- delivery instructions and note body (*FR:Celes*)

**For:** Brunel (package) and Hopper (application). **Date:** 2026-09-03 (FR S72).
**Occasion:** PO commit `929ba8a` (2026-08-31 13:22:49, *"routing authority moves to Joosep as app
owner (VEO-181 c243424)"*, 3 files) never reached the `joosep` container. Image built 11:07:45, TEAM_ROOT
seeded 11:14 -- two hours and eight minutes before the amendment existed. Hopper's site visit
(ops-log `2026-09-03T13:24+03:00`) established that nothing failed in transit and that the entrypoint's
Step 9c re-seed branch is unreachable after first boot, so delivery is a deliberate hand-applied act.

---

## 1. What ships

Three amended files, already correct in this repo, hand-applied to `~/work/paunvere/`:
`common-prompt.md`, `README.md`, `prompts/saxby.md`. Byte-identical to
`designs/deployed/joosep/teams/paunvere/`; verify with the same per-file md5 comparison Hopper ran.

Plus **one new file and a two-line `startup.md` edit**, below.

## 2. Placement, and why there

**The note goes in `~/work/paunvere/AMENDMENTS.md`** -- a new file at TEAM_ROOT, newest entry first, so
later amendments append to one record rather than scattering notes.

`startup.md`'s read order is the only guaranteed path into Minot's context: `~/work/CLAUDE.md` points the
parent session at it, and it opens *"Read this file FIRST every session."* A note dropped anywhere else
is a note nobody is obliged to open. So `AMENDMENTS.md` needs a pointer from `startup.md`, and it needs
two: a **stamp** that tells a future Minot whether anything has changed since it last looked, and a
**read-order entry** that makes this first delivery unconditional rather than dependent on the stamp
discipline it is introducing.

## 3. The `startup.md` diff -- two inserted lines, nothing else touched

```diff
@@ startup.md:1-5 @@
 # Startup -- paunvere (*VD:Minot*)

 **Read this file FIRST every session.** It replaces exploration. Do not run an Explore agent or a broad search.
+
+**Amendment level: `A1` -- applied 2026-09-03 -- source `929ba8a` (VEO-181 c.243424). If this level differs from the one in your scratchpad summary header, read `AMENDMENTS.md` before anything else, then record the new level there.**

 ## Anchors
@@ startup.md:18-25 (## Read order) @@
 1. this file
+2. `TEAM_ROOT/AMENDMENTS.md` -- what changed in the prompt set, and why
-2. `TEAM_ROOT/roster.json`
-3. `TEAM_ROOT/common-prompt.md` -- the hard safety rule is there
-4. `TEAM_ROOT/prompts/minot.md`
-5. `TEAM_ROOT/memory/minot.md` -- summary header
+3. `TEAM_ROOT/roster.json`
+4. `TEAM_ROOT/common-prompt.md` -- the hard safety rule is there
+5. `TEAM_ROOT/prompts/minot.md`
+6. `TEAM_ROOT/memory/minot.md` -- summary header
```

**Stamp format:** `A<n>`, applied date, source commit, Jira reference. It is self-checking against the
scratchpad summary header, which is the layer common-prompt already says is read first and rewritten at
every checkpoint -- so the check costs nothing new and, as a side effect, prompts the header rewrite that
Minot's own header currently needs. The as-shipped state is `A0`; this is `A1`.

## 4. Language

**English.** `common-prompt.md:80` puts this team's own docs and agent-to-agent text in English, and every
file in the startup read order is English. The note is from us to Minot, not to Joosep. The one line Minot
gives Joosep is supplied in Estonian in the body, ready to send.

## 5. Applying it

Hopper applies the four file changes plus the new file by hand (`diff -r` against the repo copy), with
**Joosep told beforehand** -- the amendment is a change to the rule his team just spent a morning
enforcing, and he should hear it from the PO, not discover it in a startup read. A rebuild aligns
`/opt/teams/paunvere` for future boots but does not deliver this; `SRC == STAMP` and `DST != SRC`, so
Step 9c leaves TEAM_ROOT alone by design.

---

# NOTE BODY -- verbatim, save as `~/work/paunvere/AMENDMENTS.md`

38 lines, English per `common-prompt.md:80`. The fenced block below is the file's whole content.

```markdown
# Amendments to the paunvere prompt set

Newest first. An amendment is applied to the files in place; this file records what changed and why.

---

## A1 -- 2026-09-03 -- Routing authority moves to Joosep as the app's owner

**Source:** PO decision 2026-08-31, VEO-181 c.243424 (`929ba8a`). **Amended:** `common-prompt.md`, `prompts/saxby.md`, `README.md`.

Minot: the rule you enforced this morning was withdrawn by the PO on 2026-08-31 and never reached you. That is our failure,
not yours -- we shipped your prompt set at 11:14 that day, the PO amended it at 13:22, and nothing in our delivery path
carried the change across.

**Your conduct on 2026-09-03 was correct against the text you held.** You declined a request three times, declined a reply
whose own footer contradicted its claim and said why, and went to the named authority for first-hand confirmation rather
than accept a relayed one. **The clearance Ruth Türk gave you at 09:56 stands.**

**What changed.** Joosep decides a routing change as the app's owner, consulting Ruth Türk when in doubt. The mediated gate
-- Ruth signs off, through Mihkel, not on Joosep's word -- is gone. That is the whole amendment, said in three places.

**What did not.** No agent applies a routing change, sets or reads the `SK_*` values, or invokes the send path; the reserved
ranges remain binding; Saxby still stops the diff, says why, records it. Rail register, MAY READ / MAY WRITE tables,
least-privilege table, language and spawning rules: untouched. **Who answers moved; what this team may do did not.**

**What to do.**
1. Re-read `common-prompt.md`, `prompts/saxby.md`, `README.md` at next start -- amended on disk already.
2. Rewrite your scratchpad summary header -- it still says "first session, repos not yet cloned" while the log below it is current to today -- and record `A1` in it.
3. One row in Saxby's rail register: **rule revision**, decided 08-31, delivered 09-03, VEO-181 c.243424 -- not a diff
   verdict but a change to the rule the register is kept under.
4. Do not re-litigate 2026-09-03. Those decisions stand as made.
5. Tell Joosep, in one line: *"Reeglimuudatus: marsruudimuudatuse otsustad sina rakenduse omanikuna, Ruth Türgiga nõu pidades, kui kahtled -- vahendatud kord (Ruth -> Mihkel) on ära. Ohutusreegel ise ei muutunud, tänahommikused otsused jäävad kehtima."*

**Next time, never silently:** applied by our operator, Joosep told beforehand, landing as the amended files plus an entry
here plus a new level in `startup.md`. When that stamp disagrees with your header, read this file first. **A second, larger
revision is in preparation** -- prompt-set fixes from a review of the text as written, arriving the same way as `A2`.

-- the framework-research team, who wrote your prompts (*FR:Celes*)
```
