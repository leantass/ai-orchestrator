# Implementation Map: V1.8 Project Operations Loop

## Goal of this map

Turn the V1.8 product vision into a concrete repo map:

- what pieces already exist;
- where they live;
- what is still fragmented;
- what first implementation slice is realistic without widening risk too early.

## Current module map

### 1. Request intake, planning, and project/risk interpretation

Primary owner:

- `electron/main.cjs`

Observed surfaces already present:

- `buildLocalStrategicBrainDecision(...)`
- intent detection for safe-first, scalable delivery, fullstack local, project phases, module expansion, approvals, and continuation
- project/workspace inference and continuation routing
- decision finalization and approval shaping

What this already gives JEFE:

- request classification;
- project continuity detection;
- local planning heuristics;
- risk and approval shaping;
- routing hints for later execution.

Current limitation:

- this logic is powerful but concentrated in one large module;
- it behaves like a strategic brain, but not yet like an explicit work-block state machine.

### 2. OpenAI escalation and fallback behavior

Primary owner:

- `electron/main.cjs`

Observed surfaces already present:

- `createOpenAIStrategicBrainProvider()`
- `createStrategicBrainProviderRegistry()`
- `buildResponsiveLocalStrategicBrainFallbackResult(...)`
- explicit `OPENAI_API_KEY` config checks
- generated-domain contract observation path using the OpenAI-backed provider when needed

What this already gives JEFE:

- a real distinction between local-rules and OpenAI-backed reasoning;
- honest fallback behavior when OpenAI is unavailable;
- config reporting instead of fake intelligence.

Current limitation:

- escalation exists for the strategic brain path, but not yet as a universal project-loop policy visible across all work states.

### 3. Worker routing and controlled execution

Primary owners:

- `electron/generated-domain-delivery-worker-handoff.cjs`
- `electron/orchestrator-tool-worker-registry.cjs`
- `electron/orchestrator-local-smoke-worker.cjs`
- `electron/orchestrator-supervised-worker-workflow.cjs`

Observed surfaces already present:

- worker capability registry and task envelopes;
- manual Codex correction handoff construction;
- hard forbidden actions and allowed validation commands;
- supervised workflow for corrected evidence.

What this already gives JEFE:

- a controlled route from review output to technical worker execution;
- explicit constraints and validation commands;
- safe worker orchestration for bounded cases.

Current limitation:

- worker routing is strong for generated-domain correction and supervised flows, but not yet unified as the default execution model for any project block.

### 4. Technical validation and release-quality truth

Primary owners:

- `scripts/ai-quality.mjs`
- `scripts/ai-release-smoke.mjs`
- `scripts/ai-operator-e2e-smoke.mjs`
- `scripts/v1-release-smoke.mjs`

Observed surfaces already present:

- syntax checks across orchestration modules;
- lint, TypeScript, planner smoke, release smoke, operator E2E;
- generated-domain and worker orchestration smokes;
- V1 release smoke already treated as a real quality gate.

What this already gives JEFE:

- strong technical truth before delivery;
- repeatable validation sections;
- artifact-backed quality gates instead of informal claims.

Current limitation:

- validation is strong, but the project loop does not yet expose a single work-block summary state like `validating`, `ci_pending`, or `accepted` across every route.

### 5. Review, correction, and multi-round delivery loop

Primary owners:

- `electron/generated-domain-delivery-review-evidence.cjs`
- `electron/generated-domain-delivery-codex-task.cjs`
- `electron/generated-domain-delivery-correction-selector.cjs`
- `electron/generated-domain-delivery-roundtrip.cjs`
- `electron/generated-domain-delivery-supervised-workflow.cjs`
- `electron/generated-domain-delivery-history-ledger.cjs`
- `electron/generated-domain-delivery-review.cjs`

Observed surfaces already present:

- `pass`, `needs_revision`, and `blocked` review outputs;
- correction task generation;
- follow-up review loops;
- progress summaries, resolved issues, remaining issues;
- ledger status derivation such as `completed_pass`, `awaiting_manual_correction`, `blocked_requires_human`, and `needs_more_revision`.

What this already gives JEFE:

- a real quality loop in one important domain;
- artifact-backed correction rounds;
- historical trace of review outcomes and next actions.

Current limitation:

- this loop is currently domain-specific rather than the canonical product-wide work-loop abstraction;
- retry budgeting is implicit and domain-shaped, not yet generalized as `blocked_after_retries`.

### 6. Manual approval and external-tool governance

Primary owners:

- `electron/orchestrator-external-tool-approval-gates.cjs`
- `electron/orchestrator-external-tool-dry-run-planner.cjs`
- `electron/orchestrator-external-tool-readiness-review.cjs`
- `electron/orchestrator-external-tool-manual-execution-packet.cjs`
- `electron/orchestrator-external-tool-human-approval-record.cjs`
- `electron/orchestrator-external-tool-execution-permit-bundle.cjs`
- `electron/orchestrator-external-tool-manual-supervised-runner.cjs`
- `electron/orchestrator-external-tool-post-execution-review.cjs`

What this already gives JEFE:

- a mature supervised path for risky external work;
- manual-only execution contracts;
- evidence intake and post-execution review.

Current limitation:

- this is the strongest governed loop in the repo, but it is still a subsystem, not yet the universal model for all project work.

### 7. Memory, status, and history signals

Primary owners:

- `electron/context-hub-client.cjs`
- `electron/context-hub-events.cjs`
- `electron/context-hub-event-status.cjs`
- `electron/project-context.cjs`
- `electron/generated-domain-delivery-history-ledger.cjs`

What this already gives JEFE:

- repo/project context gathering;
- event emission to Context Hub;
- status payloads that already include routing and approval hints;
- history-like ledger behavior for delivery loops.

Current limitation:

- history exists in pieces, but there is not yet one normalized project operations record that spans intake, routing, execution, validation, review, and closure.

### 8. Operator visibility

Primary owners:

- `src/components/V1ClosureDashboard.tsx`

Observed surfaces already present:

- V1.5 manual supervised execution summary;
- V1.6 post-execution review summary;
- ledger and milestones section;
- explicit "known limits" section.

What this already gives JEFE:

- the operator can already understand important V1 subsystems;
- the UI is starting to act like an operations console rather than a result dump.

Current limitation:

- V1.7 still needs to surface session/intake/review as a clearer operational loop;
- V1.8 still needs higher-level work-block state visibility.

## Synthesis

The repo already contains most of the ingredients of the target product:

- planning brain;
- OpenAI escalation path;
- worker routing;
- approval gates;
- validation truth;
- review/correction loops;
- partial history;
- partial operator visibility.

The main missing piece is not raw capability.

The main missing piece is a unifying work-block model that makes those capabilities behave like one governed project operations loop.

## Recommended first implementation slice

### Slice name

`project-operations-run-envelope`

### Why this slice first

It gives JEFE one explicit operating record without yet trying to increase runtime power.

That keeps the next step aligned with the product vision and avoids prematurely expanding autonomy.

### Scope of the slice

Create one normalized work-block envelope that records:

- request metadata;
- project resolution result;
- repo preflight result;
- routing decision;
- chosen execution path;
- validation summary;
- review summary;
- current state;
- retry count;
- next action;
- blocker reason when present.

### Suggested first state set for implementation

- `planned`
- `in_progress`
- `requires_openai`
- `requires_human_approval`
- `running_codex_worker`
- `validating`
- `needs_revision`
- `blocked`
- `completed_local`

### Suggested first owning surfaces

- orchestration state builder in `electron/`
- artifact writer in `electron/` or `scripts/`
- UI read-only presentation in `src/components/`
- Context Hub event payload extension only if it stays compatible with current ownership boundaries

### Explicitly deferred from the first slice

- automatic push/CI reaction loop;
- generalized `blocked_after_retries` across all domains;
- autonomous external-tool execution;
- expanding permissions or touching prohibited paths.

## Recommendation for sequencing

1. Keep V1.7 Session UI as the visibility layer for the existing V1.5/V1.6 loop.
2. Start V1.8 with the run-envelope state model.
3. After that envelope exists, connect broader correction/retry policy and richer operator status.

That sequence keeps the product understandable while it becomes more powerful.