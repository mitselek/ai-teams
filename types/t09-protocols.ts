/**
 * T09 Protocol Interfaces
 *
 * TypeScript interfaces for every communication protocol defined in
 * `topics/09-development-methodology.md`. Prose in T09 describes semantics;
 * the interfaces here describe shape. Each interface references the T09
 * section that is authoritative for its meaning.
 *
 * Strict typing throughout — no `any`, all fields explicit.
 *
 * Resolves issue #51 (T09: Formalize all comms protocols as TypeScript
 * interfaces — foundation for inter-team comms API).
 *
 * (*FR:Celes*)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A story identifier as understood by ARCHITECT and the pipeline.
 * Stories are the unit of ARCHITECT authority (one ARCHITECT scope = one story).
 */
export type StoryId = string;

/**
 * Position within a story's ordered test plan, as "N of M".
 * N is the 1-indexed position of the current test case; M is the total
 * number of test cases ARCHITECT planned for the story.
 */
export interface TestCasePosition {
  n: number;
  m: number;
  description: string;
}

/**
 * Git commit SHA. Used by GREEN, PURPLE, and Librarian provenance.
 */
export type CommitSha = string;

/**
 * A tiered scope classifier used by Knowledge Submission.
 * See T09 Part 2 → "The Four Capabilities" → decision matrix.
 */
export type KnowledgeScope = "agent-only" | "team-wide" | "cross-team";

/**
 * Urgency classifier used by Knowledge Submission and Knowledge Query.
 * Urgent submissions trigger the [URGENT-KNOWLEDGE] dual-hub routing
 * described in T09 Part 2 → "Dual-Hub Topology".
 */
export type KnowledgeUrgency = "urgent" | "standard";

/**
 * Confidence level for a Knowledge Submission. Two independent speculative
 * entries at high confidence auto-promote to confirmed, per T09 Part 2 →
 * "Protocol A: Knowledge Submission".
 */
export type KnowledgeConfidence = "high" | "medium" | "speculative";

/**
 * Category of knowledge entry. Determines the wiki destination
 * (`wiki/patterns/`, `wiki/gotchas/`, `wiki/decisions/`, `wiki/contracts/`,
 * or `wiki/references/`). See T09 Part 2 → "Protocol A: Knowledge Submission".
 */
export type KnowledgeType =
  | "pattern"
  | "gotcha"
  | "decision"
  | "contract"
  | "reference";

// ─────────────────────────────────────────────────────────────────────────────
// Part 1 — XP Pipeline Communication Protocol
// See topics/09-development-methodology.md § "Communication Protocol
// (Herald's Four Message Types)".
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TEST_SPEC (ARCHITECT → RED).
 *
 * ARCHITECT decomposes a story into an ordered test plan and hands RED one
 * test case at a time. RED may not modify the test plan; if a test case is
 * untestable as specified, RED escalates back to ARCHITECT.
 *
 * Source: T09 § "Communication Protocol" → "TEST_SPEC (ARCHITECT → RED)".
 */
export interface TestSpec {
  story: StoryId;
  testCase: TestCasePosition;
  /** What must be true before this test runs. */
  preconditions: string;
  /** What the test asserts. */
  expectedBehavior: string;
  /**
   * Boundaries ARCHITECT imposes on RED — e.g., "do not modify existing API
   * surface". Prevents scope creep within a single test case.
   */
  constraints: string[];
  /** Specific, testable conditions drawn from the story's acceptance criteria. */
  acceptanceCriteria: string[];
}

/**
 * GREEN_HANDOFF (GREEN → PURPLE).
 *
 * GREEN writes the minimum code to make the failing test pass, then hands
 * PURPLE an explicit map of the shortcuts it took. The `implementationNotes`
 * field solves the "refactorer lacks context" problem without requiring
 * PURPLE to reverse-engineer GREEN's decisions.
 *
 * Source: T09 § "Communication Protocol" → "GREEN_HANDOFF (GREEN → PURPLE)".
 */
export interface GreenHandoff {
  story: StoryId;
  testCase: TestCasePosition;
  /** Files GREEN modified to make the test pass. */
  filesChanged: string[];
  /**
   * Test result. "PASS" means all tests (not just the new one) are green —
   * the handoff is invalid if any test is red.
   */
  testResult: "PASS";
  /**
   * Shortcuts GREEN took, what is ugly, and what GREEN knows is suboptimal.
   * Critical field — this is the signal PURPLE needs to refactor effectively.
   */
  implementationNotes: string;
  commit: CommitSha;
}

/**
 * PURPLE_VERDICT (PURPLE → GREEN or PURPLE → ARCHITECT).
 *
 * PURPLE's ACCEPT/REJECT decision after refactoring. On REJECT, the verdict
 * includes concrete guidance for GREEN. On the third consecutive rejection,
 * the verdict escalates to ARCHITECT with the full rejection chain — this
 * is the three-strike authority-boundary signal.
 *
 * Source: T09 § "Communication Protocol" → "PURPLE_VERDICT" and
 * "PURPLE Veto: The Three-Strike Rule (Judicial Model)".
 */
export type PurpleVerdict =
  | PurpleVerdictAccept
  | PurpleVerdictReject
  | PurpleVerdictEscalate;

/**
 * ACCEPT branch of `PurpleVerdict`. Routes to the next test case in the
 * cycle. `changesMade` describes the refactoring actions PURPLE performed.
 */
export interface PurpleVerdictAccept {
  verdict: "ACCEPT";
  story: StoryId;
  testCase: TestCasePosition;
  rejectionCount: number;
  changesMade: string[];
  commit: CommitSha;
}

/**
 * REJECT branch of `PurpleVerdict` (rejection count 1 or 2).
 * Routes back to GREEN with concrete guidance — "extract the validation
 * into a shared function at X", not "make it better".
 */
export interface PurpleVerdictReject {
  verdict: "REJECT";
  story: StoryId;
  testCase: TestCasePosition;
  /** Always 1 or 2. On 3, the verdict escalates instead. */
  rejectionCount: 1 | 2;
  /** Specific structural issue that cannot be refactored without reimplementation. */
  rejectionReason: string;
  /** Concrete direction for GREEN's next attempt. */
  guidanceForGreen: string;
}

/**
 * Third-strike escalation branch of `PurpleVerdict` (rejection count 3).
 * Routes to ARCHITECT, not GREEN. ARCHITECT can rewrite the test plan item,
 * split it, or override PURPLE and accept with a documented tech debt marker.
 */
export interface PurpleVerdictEscalate {
  verdict: "REJECT";
  story: StoryId;
  testCase: TestCasePosition;
  rejectionCount: 3;
  rejectionReason: string;
  /** Full rejection chain summary for ARCHITECT's re-evaluation. */
  escalationChain: string;
  /** PURPLE's proposed resolution path. ARCHITECT decides. */
  proposedResolution:
    | "rewrite-test-plan"
    | "split-test-case"
    | "accept-with-tech-debt";
}

/**
 * CYCLE_COMPLETE (PURPLE → ARCHITECT).
 *
 * Sent when PURPLE has ACCEPTed the current test case and the cycle for
 * that test case is fully closed. `qualityNotes` feeds the slow feedback
 * loop: ARCHITECT sees structural consequences at the end of each cycle
 * and can adjust decomposition for future stories.
 *
 * Source: T09 § "Communication Protocol" → "CYCLE_COMPLETE (PURPLE → ARCHITECT)".
 */
export interface CycleComplete {
  story: StoryId;
  testCase: TestCasePosition;
  /** Count of GREEN → PURPLE round-trips for this test case. */
  totalCycles: number;
  finalCommit: CommitSha;
  /**
   * Structural observations for ARCHITECT — e.g., "growing coupling between
   * modules X and Y across test cases 3-5". Not a judgment; a pattern report.
   */
  qualityNotes: string;
  /** Whether the story is ready for its next test case (or reached the end). */
  readyForNextTestCase: boolean;
  /** If not ready, explanation of why the cycle must pause. */
  notReadyReason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Part 2 — Librarian Dual-Hub Routing
// See topics/09-development-methodology.md § "Dual-Hub Topology" and
// "[URGENT-KNOWLEDGE] message format".
// ─────────────────────────────────────────────────────────────────────────────

/**
 * [URGENT-KNOWLEDGE] (Librarian → Team-Lead → affected agent).
 *
 * The narrow routing exception to the dual-hub topology. The Librarian uses
 * this when new knowledge may invalidate another agent's in-flight work.
 * Team-lead's prompt treats the message as a priority interrupt, processed
 * before the next work dispatch — this bounds the damage window to one
 * team-lead dispatch cycle.
 *
 * Source: T09 § "Dual-Hub Topology" → "[URGENT-KNOWLEDGE] message format".
 */
export interface UrgentKnowledgeMessage {
  /** Always "Oracle" — the Librarian is the only sender of this message type. Machine identifier pending Pass 2 rename. */
  from: "Oracle";
  /** The agent whose current work may be invalidated. */
  affectsAgent: string;
  /** Short description of what the new knowledge is about. */
  topic: string;
  /** One-line summary of the new knowledge plus a link to the wiki entry. */
  newKnowledge: {
    summary: string;
    wikiEntry: string;
  };
  /** Which of the affected agent's current tasks may be invalidated. */
  affectedWork: string;
  /**
   * Librarian's recommendation. Team-lead makes the final call — "interrupt",
   * "queue for next handoff", or "informational only" are the three levers
   * team-lead can pull.
   */
  recommendation:
    | "interrupt-now"
    | "queue-for-next-handoff"
    | "informational-only";
}

// ─────────────────────────────────────────────────────────────────────────────
// Part 2 — Librarian Communication Protocols
// See topics/09-development-methodology.md § "Communication Protocols"
// (Protocol A: Knowledge Submission, Protocol B: Knowledge Query,
// Protocol C: Knowledge Promotion).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Protocol A — Knowledge Submission (Agent → Librarian).
 *
 * An agent explicitly submits a discovery to the Librarian. The agent makes
 * the initial scope classification (they have the domain context); the
 * Librarian may override during filing. Urgent submissions trigger
 * `UrgentKnowledgeMessage` routing through team-lead.
 *
 * Source: T09 § "Communication Protocols" → "Protocol A: Knowledge Submission".
 */
export interface KnowledgeSubmission {
  from: string;
  type: KnowledgeType;
  scope: KnowledgeScope;
  urgency: KnowledgeUrgency;
  /** Existing wiki page this relates to, or "none". */
  related: string | "none";
  confidence: KnowledgeConfidence;
  /** The discovery, with enough context to be useful to future agents. */
  content: string;
  /** Where observed — file paths, test names, session context. */
  evidence: {
    files?: string[];
    tests?: string[];
    sessionContext?: string;
    commits?: CommitSha[];
  };
}

/**
 * Protocol B (request) — Knowledge Query (Agent → Librarian).
 *
 * An agent asks the Librarian a question. `urgency` controls whether the
 * Librarian responds ahead of other work ("blocking") or folds the query
 * into normal curation flow ("background").
 *
 * Source: T09 § "Communication Protocols" → "Protocol B: Knowledge Query".
 */
export interface KnowledgeQuery {
  from: string;
  /** Natural-language question. */
  question: string;
  /** What the agent is trying to do. Gives the Librarian context to synthesize. */
  context: string;
  urgency: "blocking" | "background";
}

/**
 * Protocol B (response) — Knowledge Response (Librarian → Agent).
 *
 * The Librarian's reply to a `KnowledgeQuery`. On `not-documented` or `partial`,
 * the Librarian also creates a gap stub — an explicit record of what the team
 * doesn't know. Over time, gap stubs form a map of the team's ignorance.
 *
 * Gap stubs are collaborative requests: the response asks the querying
 * agent to submit the answer back if they find it (PO round 4).
 *
 * Source: T09 § "Communication Protocols" → "Protocol B: Knowledge Query"
 * (response half).
 */
export interface KnowledgeResponse {
  to: string;
  status: "found" | "partial" | "not-documented";
  /** Wiki pages the Librarian consulted to synthesize the answer. */
  sources: string[];
  /** Direct answer synthesized from wiki entries. */
  answer: string;
  /** Other wiki pages for additional context. */
  relatedEntries: string[];
  /**
   * Populated when `status` is "not-documented" or "partial". The Librarian
   * creates a stub marking this as a tracked team gap, and the stub
   * includes a request asking the querying agent to close the loop.
   */
  gapNoted?: {
    stubId: string;
    requestForAgent: string;
  };
}

/**
 * Protocol C — Knowledge Promotion (Librarian → Team-Lead → Common-Prompt).
 *
 * When a wiki entry matures enough to become a team rule, the Librarian
 * proposes promotion to common-prompt. Team-lead reviews: approved
 * promotions are written by team-lead (common-prompt is L1 team law).
 * Rejected promotions stay in the wiki as documented knowledge.
 *
 * Source: T09 § "Communication Protocols" → "Protocol C: Knowledge Promotion".
 */
export interface PromotionProposal {
  /** Path to the wiki page being proposed for promotion. */
  wikiSource: string;
  /** Target section in common-prompt.md. */
  proposedSection: string;
  /** Why this should be a team rule, not just documented knowledge. */
  justification: string;
  /** Exact text to add to common-prompt (Librarian drafts, team-lead edits). */
  proposedText: string;
  /** Incidents, submissions, and queries supporting the promotion. */
  evidence: {
    incidents: string[];
    submissions: string[];
    queries: string[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Part 2 — Wiki Provenance
// See topics/09-development-methodology.md § "Provenance, Source Linking,
// and Staleness".
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wiki entry frontmatter. Every wiki entry carries this metadata for
 * provenance, source linking, and the three-layer staleness detection net.
 *
 * Source links extend beyond files: wiki entries can point to commits,
 * issues, PRs, and specific functions (PO round 4). The wiki becomes a
 * knowledge overlay on the git graph.
 *
 * Source: T09 § "Provenance, Source Linking, and Staleness".
 */
export interface WikiProvenance {
  /** Agent that originally discovered this knowledge. */
  sourceAgent: string;
  /** ISO date when the knowledge was discovered. */
  discovered: string;
  /** Always "oracle" — the Librarian is the sole writer to the wiki. */
  filedBy: "oracle";
  /** ISO date when the entry was last verified as current. */
  lastVerified: string;
  status: "active" | "disputed" | "archived";
  /** Source files this entry describes. Used by automated staleness checks. */
  sourceFiles?: string[];
  /** Source commits this entry describes. */
  sourceCommits?: CommitSha[];
  /** Source issues or PRs this entry references (e.g., "#42"). */
  sourceIssues?: string[];
  /**
   * Time-based expiry for external-system knowledge (Entu, D1, Jira, APIs)
   * that has no source file to track. ISO date; the Librarian flags expired
   * entries for re-verification.
   */
  ttl?: string;
}
