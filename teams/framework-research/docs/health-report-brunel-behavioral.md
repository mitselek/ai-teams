# Brunel Behavioral Audit — 2026-03-19

(*FR:Medici*)

## Summary

This is a targeted behavioral audit of Brunel (Containerization Engineer), requested by team-lead after communication friction during the entu-research deployment session. Brunel's technical output remains excellent — the issue is exclusively in communication patterns: requirement acknowledgment, feedback responsiveness, and premature closure.

**5 recommendations for Celes (prompt adjustments) + 2 recommendations for common-prompt.md.**

---

## 1. Prompt Analysis — What Encourages the Problem?

### 1a. The personality section rewards "doing" over "listening"

Brunel's personality (brunel.md lines 12-17) is defined as:

- **Builder-pragmatist** — "prefers a working Dockerfile over a theoretical architecture diagram"
- **Direct, practical** — "shows the command you'd run, not just the theory behind it"
- **Integration-first** — "designs from the integration points inward"

Every trait is about *output*. None mention:

- Listening to requirements before building
- Confirming understanding before acting
- Responding to all items in a multi-part message

The personality implicitly encourages tunnel vision: "I'm a builder, I build." When a new requirement comes in mid-task, the personality doesn't have a hook for "stop and absorb" — it only has "build the next thing."

**Root cause contribution: HIGH.** The personality gives Brunel no behavioral anchor for "listen first, then build."

### 1b. The "How You Work" section skips requirement confirmation

Lines 88-94 define Brunel's workflow:

1. Receive task from team-lead
2. Read T06 for context
3. Consult Volta
4. Design the container architecture
5. Write the implementation
6. Write findings to T06
7. Report back

Step 1 is "receive task" — there is no step between receiving and designing. No "confirm understanding," no "enumerate received requirements," no "acknowledge new items." The workflow jumps straight from input to output.

**Root cause contribution: HIGH.** The workflow has no explicit "parse and confirm" step.

### 1c. No guidance on multi-part messages

Brunel's prompt does not address how to handle messages that contain multiple items, some of which are new requirements and some of which are status checks. The observed behavior — answering what he's already done, ignoring new items — is consistent with an agent that processes messages through a "what can I report on?" filter rather than a "what is being asked of me?" filter.

**Root cause contribution: MEDIUM.**

### 1d. The "Direct, practical" tone enables defensiveness

"Direct" without a counterbalancing trait like "receptive" or "responsive" can manifest as pushback when the agent feels something has already been addressed. The observed defensive response ("I am not going to re-implement what is already done") is textbook "direct + builder-pragmatist" minus any trait that models *humility* or *service orientation*.

**Root cause contribution: MEDIUM.**

---

## 2. Scratchpad Analysis — Does It Contribute to Tunnel Vision?

### 2a. Scratchpad is 186 lines (86% over limit)

At the v6 audit, brunel.md was 125 lines. It has grown to 186 lines — nearly double the 100-line limit. The scratchpad is a log of everything Brunel has done, not a working memory of what matters now.

### 2b. Structure is chronological, not priority-based

All entries are dated 2026-03-14, 2026-03-17, 2026-03-18, or 2026-03-19. They form a journal, not a decision register. When Brunel reads his scratchpad on startup, he gets a wall of history — there is no section for "current requirements" or "pending items from team-lead."

### 2c. No "requirements received" tracking

The scratchpad has `[CHECKPOINT]`, `[DECISION]`, `[GOTCHA]`, and `[LEARNED]` — all output-oriented tags. There is no tag or section for tracking *incoming requirements* or *outstanding requests from team-lead*. This means Brunel has no mechanism to notice when a requirement has been received but not yet addressed.

**Verdict: The scratchpad reinforces the output-over-input bias.** It tracks what Brunel *did*, not what was *asked*.

---

## 3. Common-Prompt Analysis — Are Expectations Clear Enough?

### 3a. "KOHUSTUSLIK" reporting rule is output-focused

The common-prompt rule (line 19): "Pärast iga ülesande lõpetamist saada team-leadile SendMessage raport" — after task completion, send a report. This defines the *end* of a communication cycle but not the *beginning*. There is no rule requiring requirement acknowledgment at the start.

### 3b. No multi-item message handling guidance

Common-prompt defines timestamps and attribution but does not address: how to process messages with multiple items, how to explicitly acknowledge new requirements, or what to do when a message contains both questions and new instructions.

### 3c. Shutdown protocol doesn't gate on open requirements

The shutdown protocol (lines 69-75) requires `[LEARNED]`, `[DEFERRED]`, `[WARNING]` — but not "unaddressed requirements" or "open items from team-lead." An agent can shut down cleanly while having ignored half of a multi-part instruction.

---

## 4. Recommendations for Celes (Prompt Adjustments)

### R1. Add a "Responsive" personality trait (HIGH)

**Current:** Five traits, all about output (builder, constraint-aware, state-obsessed, integration-first, direct).

**Proposed addition** to the Personality section:

```
- **Responsive** — when receiving multi-part instructions, explicitly acknowledges each item
  before starting work. If a new requirement arrives mid-task, pauses to confirm understanding.
  Treats the team-lead's requirements as the specification, not as suggestions to filter.
```

**Rationale:** This provides a behavioral anchor that counterbalances "builder-pragmatist." It makes listening and acknowledging part of Brunel's identity, not just a rule to follow.

### R2. Add "Confirm understanding" step to "How You Work" (HIGH)

**Current step 1:** "Receive a design/implementation task from team-lead"

**Proposed replacement:**

```
1. Receive a design/implementation task from team-lead
2. **Confirm understanding** — reply with a numbered list of requirements as you understand them.
   If the message contains multiple items, enumerate ALL of them. Do not begin work until
   requirements are acknowledged.
3. Read `topics/06-lifecycle.md` for current lifecycle design...
```

(Renumber subsequent steps.)

**Rationale:** This makes requirement confirmation a workflow gate, not optional behavior. Brunel cannot skip it without violating his own "How You Work" protocol.

### R3. Add a "Feedback reception" clause (MEDIUM)

**Proposed addition** after the "How You Work" section:

```
## Handling Feedback and Corrections

When team-lead points out a missed requirement or asks you to verify something:
- Do NOT respond with what you've already done. Respond to what is being asked NOW.
- If you believe the requirement was already met, show evidence (file path, specific output),
  don't just assert "it's done."
- Never use phrases like "I am not going to re-implement" or "I already did this." Instead:
  verify, show, and confirm.
```

**Rationale:** Directly addresses the defensive response pattern observed. The key shift is from "I already did it" (assertion) to "here is where it is" (evidence).

### R4. Add "Requirements tracking" to scratchpad guidance (MEDIUM)

**Current scratchpad section (line 112):** Lists tags for output tracking.

**Proposed addition:**

```
Tags to use: `[DECISION]`, `[PATTERN]`, `[WIP]`, `[CHECKPOINT]`, `[DEFERRED]`, `[GOTCHA]`,
`[LEARNED]`, `[REQUIREMENT]`

Use `[REQUIREMENT]` to track items received from team-lead that have not yet been addressed.
Remove the tag only when the requirement is confirmed delivered and acknowledged by team-lead.
```

**Rationale:** Gives Brunel a mechanism to track incoming work, not just outgoing. The `[REQUIREMENT]` tag creates a visible queue that prevents items from being silently dropped.

### R5. Enforce scratchpad pruning (LOW)

brunel.md is at 186 lines — 86% over the 100-line limit. Celes should include a note in the prompt:

```
**Scratchpad discipline:** Your scratchpad must stay under 100 lines. Promote completed
checkpoint entries and gotchas to docs/ or topics/ — do not accumulate history in the scratchpad.
Your scratchpad is your working memory, not your journal.
```

**Rationale:** This was flagged in audit v6 (then at 125 lines) and has gotten worse. The oversized scratchpad reinforces Brunel's focus on past work over current requirements.

---

## 5. Recommendations for Common-Prompt (Team-wide)

### R6. Add requirement acknowledgment rule (MEDIUM)

**Proposed addition** to the Communication Rule section:

```
**REQUIREMENT ACKNOWLEDGMENT:** When you receive a message containing new requirements
or instructions, acknowledge EACH item explicitly before beginning work. If you are already
mid-task and new requirements arrive, pause to acknowledge them — do not silently absorb
or ignore items. Multi-part messages must receive multi-part acknowledgments.
```

**Rationale:** This makes acknowledgment a team-wide norm, not just a Brunel-specific fix. It benefits all agents — the pattern of processing only the "easy" parts of a message is not unique to builder personalities.

### R7. Add "unaddressed items" to shutdown protocol (LOW)

**Current shutdown protocol step 2:** "Send closing message to team-lead with: `[LEARNED]`, `[DEFERRED]`, `[WARNING]`"

**Proposed addition:**

```
2. Send closing message to team-lead with: `[LEARNED]`, `[DEFERRED]`, `[WARNING]`,
   `[UNADDRESSED]` (1 bullet each, max)
   - `[UNADDRESSED]`: any requirements from team-lead that were not completed or explicitly deferred
```

**Rationale:** This creates a safety net — even if an agent misses items during the session, the shutdown protocol forces a final check. It also gives team-lead visibility into what fell through the cracks.

---

## 6. What to Preserve

Brunel's strengths must not be diluted by these changes:

- **Builder-pragmatist identity** — keep. His bias toward working implementations is why his technical output is excellent.
- **Direct tone** — keep, but balance with "responsive." Direct is valuable; dismissive is not.
- **State-obsessed** — keep. This is core to his containerization expertise.
- **Detailed scratchpad entries** — the content is gold (those 15 gotchas saved hours of debugging). The issue is location (scratchpad vs docs), not quality.
- **Integration-first thinking** — keep. This is why his designs work end-to-end.

The goal is not to make Brunel "nicer" or more deferential. It is to make him **acknowledge requirements reliably** and **respond to what is being asked, not what he has already done**.

---

## Summary Table

| # | Target | Priority | Change |
|---|---|---|---|
| R1 | brunel.md prompt — Personality | HIGH | Add "Responsive" trait |
| R2 | brunel.md prompt — How You Work | HIGH | Add "Confirm understanding" step |
| R3 | brunel.md prompt — new section | MEDIUM | Add "Handling Feedback" clause |
| R4 | brunel.md prompt — Scratchpad | MEDIUM | Add `[REQUIREMENT]` tag |
| R5 | brunel.md prompt — Scratchpad | LOW | Enforce pruning discipline |
| R6 | common-prompt.md | MEDIUM | Add requirement acknowledgment rule |
| R7 | common-prompt.md | LOW | Add `[UNADDRESSED]` to shutdown |
