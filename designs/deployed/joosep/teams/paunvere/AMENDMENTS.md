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
2. Confirm your scratchpad summary header is current, and record `A1` in it.
3. One row in Saxby's rail register: **rule revision**, decided 08-31, delivered 09-03, VEO-181 c.243424 -- not a diff
   verdict but a change to the rule the register is kept under.
4. Do not re-litigate 2026-09-03. Those decisions stand as made.
5. Tell Joosep, in one line: *"Reeglimuudatus: marsruudimuudatuse otsustad sina rakenduse omanikuna, Ruth Türgiga nõu pidades, kui kahtled -- vahendatud kord (Ruth -> Mihkel) on ära. Ohutusreegel ise ei muutunud, tänahommikused otsused jäävad kehtima."*

**Next time, never silently:** applied by our operator, Joosep told beforehand, landing as the amended files plus an entry
here plus a new level in `startup.md`. When that stamp disagrees with your header, read this file first. **A second, larger
revision is in preparation** -- prompt-set fixes from a review of the text as written, arriving the same way as `A2`.

-- the framework-research team, who wrote your prompts (*FR:Celes*)
