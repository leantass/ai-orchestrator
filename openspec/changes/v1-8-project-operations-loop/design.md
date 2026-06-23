# Design: V1.8 Project Operations Loop

## Technical Approach

Introduce an explicit orchestration layer that models a work block as a stateful lifecycle, not as a one-shot response.

The first slice should focus on product and orchestration semantics before trying to widen runtime power. That means the block should define state, routing, retry limits, and review criteria first, and only then wire implementation surfaces.

## Core Model

The work block should be represented with explicit stages such as:

- request intake;
- project/context resolution;
- repo/Git/CI preflight;
- planning;
- routing decision;
- execution;
- technical validation;
- quality review;
- revision loop;
- delivery closure;
- history and next step.

Expected state vocabulary for the first implementation slice:

- `planned`
- `in_progress`
- `needs_context`
- `requires_openai`
- `requires_human_approval`
- `running_codex_worker`
- `validating`
- `needs_revision`
- `blocked`
- `blocked_after_retries`
- `completed_local`
- `pushed`
- `ci_pending`
- `ci_failed`
- `ci_success`
- `accepted`

## Routing Policy

JEFE should choose between these paths:

1. local deterministic handling
2. existing OpenAI client for advanced reasoning
3. Codex or an allowed worker for controlled implementation work
4. human approval when the path is risky or explicitly gated

The routing decision must remain explainable and artifact-backed.

## Quality Loop

The quality loop should be explicit:

1. generate or modify result
2. run targeted validation
3. review quality and product fit
4. if needed, produce correction task
5. rerun validation
6. stop at success or `blocked_after_retries`

The first implementation slice should keep the retry budget bounded to three rounds per block.

## Delivery Report Expectations

The final closure surface should stay explicit and operator-facing.

Minimum expectations for a delivery report:

- explicit work state;
- concise summary of what JEFE did;
- concrete evidence pointers such as files, validations, scope, and limits;
- repo or Git status when a repository is detectable, otherwise an honest "not integrated" message;
- CI status when it is known, otherwise an explicit note that CI is outside the current local run;
- next logical step or human decision still required.

The report should not imply `accepted` only because local files exist. It should distinguish local completion from repo sync, CI, and final human acceptance.

## Likely Surfaces

- orchestration state and routing logic in `electron/`
- review and correction planning helpers in `electron/` or `scripts/`
- operator status presentation in `src/`
- Context Hub event/status integration without changing its separate-project ownership
- docs and OpenSpec specs for visible workflow rules

## First Implemented Slice

The first implemented slice is intentionally artifact-first, not runtime-central.

Implemented surfaces:

- `electron/project-operations-run-envelope.cjs`
- `electron/generated-domain-delivery-history-ledger.cjs`
- `scripts/project-operations-run-envelope.mjs`
- `scripts/project-operations-run-envelope-smoke.mjs`
- `scripts/generated-domain-delivery-history-ledger.mjs`
- `scripts/generated-domain-delivery-history-ledger-smoke.mjs`
- `src/components/V1ClosureDashboard.tsx`
- `scripts/ai-quality.mjs`

Current behavior of the slice:

- builds a normalized work-block envelope;
- derives explicit states from routing, execution, validation, review, and retry data;
- writes JSON and Markdown artifacts to safe output roots;
- supports `build` and `status` CLI modes;
- emits the envelope from a real existing workflow through the generated-domain history ledger path;
- exposes the first visible V1.8 state model in the operator dashboard;
- validates the first bounded state model without wiring into `electron/main.cjs` yet.

Intentional deferral:

- no runtime takeover of the central orchestrator path yet;
- no automatic CI reaction loop;
- no widening of permissions or approval bypasses.

## Relationship to V1.7

V1.7 Session UI still makes sense and should likely come first or in parallel as the visibility layer for V1.5 and V1.6.

V1.8 is the broader operating-loop contract that explains how JEFE should reason across all project work, not only manual external-tool sessions.

## Guardrails

- keep using the repo's existing OpenAI client only;
- do not touch `.env` or secrets;
- do not claim intelligent review happened if only heuristic local checks ran;
- do not bypass validation because a result "looks done";
- do not allow infinite retry loops;
- do not weaken current repo safety and approval rules.