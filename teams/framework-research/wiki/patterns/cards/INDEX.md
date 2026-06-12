# patterns/ — Card Index

85 cards. Each card is a ~30-line extractive summary (TLDR + Key ideas) of the full entry one level up at `patterns/<name>.md`. Cards are queryable summaries; the full entries are evidentiary. (*FR:Callimachus*)

**Stage-2-confirms gate** (#70, `wiki/process/stage-2-confirms-filing-gate.md`): each card carries a `stage-2` frontmatter field (`confirmed` / `partial` / `pending`). patterns/ — **52 confirmed, 1 partial, 32 pending**. Three-bucket rule (team-lead-approved): single-source-agent entries (solo-author-is-filer, battle-tested) + documented S36+ joint read-backs = `confirmed`; multi-author entries with no documented co-author read-back = `pending` (gate applies going-forward, advances as read-backs land). Audit: `grep -rl 'stage-2: pending' patterns/cards/`.

| Card | Full entry |
|---|---|
| agentType vs backendType — Two Orthogonal Type Fields | [card](agenttype-vs-backendtype-separation.md) · [full](../agenttype-vs-backendtype-separation.md) |
| API Gateway Error vs Actual Server State | [card](api-gateway-error-vs-actual-server-state.md) · [full](../api-gateway-error-vs-actual-server-state.md) |
| Audit-Trail for Rejection Rationale | [card](audit-trail-for-rejection-rationale.md) · [full](../audit-trail-for-rejection-rationale.md) |
| Bootstrap-Preamble as In-Band Signal Channel | [card](bootstrap-preamble-as-in-band-signal-channel.md) · [full](../bootstrap-preamble-as-in-band-signal-channel.md) |
| Bottleneck Determines Adoption (Cross-Domain) | [card](bottleneck-determines-adoption.md) · [full](../bottleneck-determines-adoption.md) |
| Cadence-Crossing DYAD Variant + Asymmetric-Cross 3-Vector | [card](cadence-crossing-dyad-variant-with-asymmetric-cross-vector-framework.md) · [full](../cadence-crossing-dyad-variant-with-asymmetric-cross-vector-framework.md) |
| Canonical-Taxonomy Check Before Naming | [card](canonical-taxonomy-check-before-naming.md) · [full](../canonical-taxonomy-check-before-naming.md) |
| Cathedral Tier Trigger for Quality Teams | [card](cathedral-trigger-quality-teams.md) · [full](../cathedral-trigger-quality-teams.md) |
| Citation-Backed Beats Posture-Backed When Fact Is Non-Atomic | [card](citation-backed-beats-posture-backed-when-fact-is-subtle.md) · [full](../citation-backed-beats-posture-backed-when-fact-is-subtle.md) |
| Claude-Specific Infrastructure Dependencies | [card](claude-infrastructure-dependencies.md) · [full](../claude-infrastructure-dependencies.md) |
| .claude/startup.md as Cross-Team Handoff Bootstrap | [card](claude-startup-md-as-cross-team-handoff.md) · [full](../claude-startup-md-as-cross-team-handoff.md) |
| Cluster-Decomposition Meta-Principle | [card](cluster-decomposition-meta-principle.md) · [full](../cluster-decomposition-meta-principle.md) |
| Convention-as-Retroactive-Telemetry | [card](convention-as-retroactive-telemetry.md) · [full](../convention-as-retroactive-telemetry.md) |
| Coordination-Loop Self-Correction | [card](coordination-loop-self-correction.md) · [full](../coordination-loop-self-correction.md) |
| Correlated Failure in Single-Provider Enforcement Stack | [card](correlated-failure-single-provider.md) · [full](../correlated-failure-single-provider.md) |
| Credential Handoff via Temp-File Context-Firewall | [card](credential-handoff-via-temp-file-context-firewall.md) · [full](../credential-handoff-via-temp-file-context-firewall.md) |
| Cross-Host Atomic Inbox-Write Primitive | [card](cross-host-atomic-inbox-write-primitive.md) · [full](../cross-host-atomic-inbox-write-primitive.md) |
| Decorative Polling Interval Anti-Pattern | [card](decorative-polling-interval-anti-pattern.md) · [full](../decorative-polling-interval-anti-pattern.md) |
| Discriminator Anchored on a Sub-Canonical Source | [card](discriminator-anchored-on-sub-canonical-source.md) · [full](../discriminator-anchored-on-sub-canonical-source.md) |
| Discriminator Field-Name Consistency Over Uniqueness | [card](discriminator-field-name-consistency-over-uniqueness.md) · [full](../discriminator-field-name-consistency-over-uniqueness.md) |
| Dispatch Granularity Matches Recovery-Handler | [card](dispatch-granularity-matches-recovery-handler.md) · [full](../dispatch-granularity-matches-recovery-handler.md) |
| Documentation-vs-Substrate-Truth Divergence (Authoring Tier) | [card](documentation-vs-substrate-truth-divergence.md) · [full](../documentation-vs-substrate-truth-divergence.md) |
| Field-Level Overlap: One Truth, Not Mirror | [card](field-level-overlap-one-truth-not-mirror.md) · [full](../field-level-overlap-one-truth-not-mirror.md) |
| First-Use Recursive Validation | [card](first-use-recursive-validation.md) · [full](../first-use-recursive-validation.md) |
| Five-Layer Provider Lock-In Model | [card](five-layer-provider-lock-in.md) · [full](../five-layer-provider-lock-in.md) |
| Framework-Participating Roles vs. Service Roles | [card](framework-participating-vs-service-roles.md) · [full](../framework-participating-vs-service-roles.md) |
| Ghost-Member as Universal Integration Surface | [card](ghost-member-as-universal-integration-surface.md) · [full](../ghost-member-as-universal-integration-surface.md) |
| Governance-Staging as the Write Path for Agent Writes | [card](governance-staging-for-agent-writes.md) · [full](../governance-staging-for-agent-writes.md) |
| In-Process Agent Respawn (No tmux) | [card](in-process-respawn.md) · [full](../in-process-respawn.md) |
| Integration, Not Relay | [card](integration-not-relay.md) · [full](../integration-not-relay.md) |
| Integration Seam Determines Governance Impact | [card](integration-seam-governance-impact.md) · [full](../integration-seam-governance-impact.md) |
| Layer-0 Library-First — PRE-DRAFT Discipline | [card](layer-0-library-first-pre-draft-discipline.md) · [full](../layer-0-library-first-pre-draft-discipline.md) |
| Layer-0 Library-First Recurrence | [card](layer-0-library-first-recurrence.md) · [full](../layer-0-library-first-recurrence.md) |
| Live-Inject + Dockerfile-Bake Dual-Track | [card](live-inject-plus-dockerfile-bake-dual-track.md) · [full](../live-inject-plus-dockerfile-bake-dual-track.md) |
| Lossless Independent Convergence | [card](lossless-independent-convergence.md) · [full](../lossless-independent-convergence.md) |
| Cross-Team Model Inventory Baseline | [card](model-inventory-baseline.md) · [full](../model-inventory-baseline.md) |
| Model Tiering by Consequence of Error | [card](model-tiering-by-consequence.md) · [full](../model-tiering-by-consequence.md) |
| Multi-Provider Integration Seams | [card](multi-provider-integration-seams.md) · [full](../multi-provider-integration-seams.md) |
| Multi-Repo Maintenance Team XP Composition | [card](multi-repo-xp-composition.md) · [full](../multi-repo-xp-composition.md) |
| Named Concepts Beat Descriptive Phrases | [card](named-concepts-beat-descriptive-phrases.md) · [full](../named-concepts-beat-descriptive-phrases.md) |
| Design From Observation, Not Anticipation (no-future-proofing) | [card](no-future-proofing.md) · [full](../no-future-proofing.md) |
| Operational Team Archetype | [card](operational-team-archetype.md) · [full](../operational-team-archetype.md) |
| OSS Thin-Integration as Anti-Extension Signal | [card](oss-thin-integration-anti-extension-signal.md) · [full](../oss-thin-integration-anti-extension-signal.md) |
| Pass 1 / Pass 2 Separation for Renames | [card](pass1-pass2-rename-separation.md) · [full](../pass1-pass2-rename-separation.md) |
| Path-Namespace as Federation Primitive | [card](path-namespace-as-federation-primitive.md) · [full](../path-namespace-as-federation-primitive.md) |
| Per-Connection Forced-Command Shell Over a Resident Daemon | [card](per-connection-forced-command-shell-over-resident-daemon.md) · [full](../per-connection-forced-command-shell-over-resident-daemon.md) |
| Per-Message color Overrides Registered-Member Color | [card](per-message-color-overrides-registered-default.md) · [full](../per-message-color-overrides-registered-default.md) |
| Platform Lock-In vs Provider Lock-In | [card](platform-vs-provider-lock-in.md) · [full](../platform-vs-provider-lock-in.md) |
| Poll-Only Substrate + Sidecar Derivation | [card](poll-only-substrate-sidecar-derivation.md) · [full](../poll-only-substrate-sidecar-derivation.md) |
| Prompt-to-Artifact Cross-Verification | [card](prompt-to-artifact-cross-verification.md) · [full](../prompt-to-artifact-cross-verification.md) |
| Protocol-Completeness Across Surfaces | [card](protocol-completeness-across-surfaces.md) · [full](../protocol-completeness-across-surfaces.md) |
| Protocol Interpretation Variance | [card](protocol-interpretation-variance.md) · [full](../protocol-interpretation-variance.md) |
| Protocol Shapes Are Typed Contracts, Not Prose | [card](protocol-shapes-are-typed-contracts.md) · [full](../protocol-shapes-are-typed-contracts.md) |
| Read-Flag-Replication Discipline for External-CLI | [card](read-flag-replication-discipline-for-external-cli.md) · [full](../read-flag-replication-discipline-for-external-cli.md) |
| Recursive Citation as Canonical Validation | [card](recursive-citation-as-canonical-validation.md) · [full](../recursive-citation-as-canonical-validation.md) |
| Recursive-Narrowing Substrate-Truth-Evidence Discipline | [card](recursive-narrowing-substrate-truth-evidence-discipline.md) · [full](../recursive-narrowing-substrate-truth-evidence-discipline.md) |
| Relay-to-Primary-Artifact Fidelity Discipline | [card](relay-to-primary-artifact-fidelity-discipline.md) · [full](../relay-to-primary-artifact-fidelity-discipline.md) |
| Repo as Durable Store + TeamDelete as Release Primitive | [card](repo-as-durable-store-teamdelete-as-release-primitive.md) · [full](../repo-as-durable-store-teamdelete-as-release-primitive.md) |
| Rule-Erosion via Reasonable Exceptions | [card](rule-erosion-via-reasonable-exceptions.md) · [full](../rule-erosion-via-reasonable-exceptions.md) |
| Same-Volume Startup Gate for Rename-Based Atomicity | [card](same-volume-startup-gate-for-rename-atomicity.md) · [full](../same-volume-startup-gate-for-rename-atomicity.md) |
| Scope-Block Drift — Letter Lags Practice | [card](scope-block-drift-from-practice.md) · [full](../scope-block-drift-from-practice.md) |
| SemVer-Strict-Typed-Contract Discipline | [card](semver-strict-typed-contract-discipline.md) · [full](../semver-strict-typed-contract-discipline.md) |
| Service-Team Topology — Members are Ghosts of Consumers | [card](service-team-topology.md) · [full](../service-team-topology.md) |
| Single-Channel Saturation via Mode Partition | [card](single-channel-saturation-via-mode-partition.md) · [full](../single-channel-saturation-via-mode-partition.md) |
| Snapshot-State Mis-Names Path-to-End-State | [card](snapshot-state-mis-names-path-to-end-state.md) · [full](../snapshot-state-mis-names-path-to-end-state.md) |
| Structural Match Beats Free-String for Protocol Filters | [card](structural-match-beats-free-string-for-protocol-filters.md) · [full](../structural-match-beats-free-string-for-protocol-filters.md) |
| Sub-Shape E at the Design Domain | [card](sub-shape-e-at-design-domain.md) · [full](../sub-shape-e-at-design-domain.md) |
| Substrate-Invariant Mismatch (prototype) | [card](substrate-invariant-mismatch.md) · [full](../substrate-invariant-mismatch.md) |
| Substrate-Shape vs Authority-Shape Orthogonality | [card](substrate-shape-vs-authority-shape-orthogonality.md) · [full](../substrate-shape-vs-authority-shape-orthogonality.md) |
| Substrate-vs-Framework Boundary as Named Primitive | [card](substrate-vs-framework-boundary-primitive.md) · [full](../substrate-vs-framework-boundary-primitive.md) |
| Surfacing Cost-Asymmetry Under Stale Context | [card](surfacing-cost-asymmetry-stale-context.md) · [full](../surfacing-cost-asymmetry-stale-context.md) |
| TaskGet Before Classifying a Task-Assignment as Noise | [card](taskget-before-classify-as-noise.md) · [full](../taskget-before-classify-as-noise.md) |
| Three-Layer Substrate-Truth Discipline | [card](three-layer-substrate-truth-discipline.md) · [full](../three-layer-substrate-truth-discipline.md) |
| Three-Role Discipline-Stacking Within Dispatch Arc | [card](three-role-discipline-stacking-within-dispatch-arc.md) · [full](../three-role-discipline-stacking-within-dispatch-arc.md) |
| Timestamp-Crossed Messages | [card](timestamp-crossed-messages.md) · [full](../timestamp-crossed-messages.md) |
| tmux pane-border-format for Agent Team Layouts | [card](tmux-pane-border-format-for-teams.md) · [full](../tmux-pane-border-format-for-teams.md) |
| Two-Consumer Pattern: Direct-MCP vs Synthesized-Snapshot | [card](two-consumer-pattern.md) · [full](../two-consumer-pattern.md) |
| "Why This Section Exists" — Incident Docs in Prompts | [card](why-this-section-exists-incident-docs.md) · [full](../why-this-section-exists-incident-docs.md) |
| Wiki Cross-Link Convention | [card](wiki-cross-link-convention.md) · [full](../wiki-cross-link-convention.md) |
| Windows User-Context Persistent Bridge | [card](windows-user-context-persistent-bridge.md) · [full](../windows-user-context-persistent-bridge.md) |
| Within-Document Rename Hygiene — Grep Before Editing | [card](within-document-rename-grep-discipline.md) · [full](../within-document-rename-grep-discipline.md) |
| Worktree Isolation for Parallel Agents | [card](worktree-isolation-for-parallel-agents.md) · [full](../worktree-isolation-for-parallel-agents.md) |
| Worktree-Spawn Asymmetry in Message Delivery | [card](worktree-spawn-asymmetry-message-delivery.md) · [full](../worktree-spawn-asymmetry-message-delivery.md) |
| World-State-on-Wake — Self-Orientation After Compaction | [card](world-state-on-wake.md) · [full](../world-state-on-wake.md) |
| XP Cycle Applies to Infrastructure Stories | [card](xp-cycle-for-infrastructure.md) · [full](../xp-cycle-for-infrastructure.md) |
