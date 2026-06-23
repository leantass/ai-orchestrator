# Project Operations Loop Specification

## Purpose

Behavior contract for JEFE as an end-to-end project operations orchestrator.

## Requirements

### Requirement: JEFE must manage a project request as a bounded operating loop
The system SHALL treat a user request as a multi-step operating loop instead of as a single chat response.

#### Scenario: End-to-end local request loop
- GIVEN a user asks JEFE to continue or create work in a project
- WHEN JEFE processes the request
- THEN JEFE identifies the project, objective, and risk
- AND JEFE inspects repo state, project context, and prior artifacts
- AND JEFE produces a plan, controlled execution path, validation path, and explicit next step

### Requirement: JEFE must distinguish local reasoning from escalated intelligence
The system SHALL use deterministic local logic when it is sufficient and escalate to the repo's existing OpenAI client only when advanced judgment is needed.

#### Scenario: Local logic is enough
- GIVEN the request only requires deterministic checks, parsing, validation routing, or obvious classification
- WHEN JEFE evaluates the task
- THEN JEFE stays on local logic
- AND JEFE does not pretend OpenAI evaluation occurred

#### Scenario: Advanced judgment is required
- GIVEN the request requires ambiguous product judgment, architecture tradeoffs, design review, or correction planning beyond local heuristics
- WHEN JEFE evaluates the task
- THEN JEFE routes through the existing OpenAI client
- AND JEFE reports clearly if the OpenAI client is not configured

### Requirement: JEFE must route execution through the correct worker path
The system SHALL choose the appropriate execution path between local handling, Codex, a worker, or human approval.

#### Scenario: Safe local implementation path
- GIVEN the work can be resolved inside approved local boundaries
- WHEN JEFE schedules execution
- THEN JEFE may route the work to Codex or an allowed worker
- AND the route stays inside repo safety constraints

#### Scenario: Risky or prohibited path
- GIVEN the work requires secrets, prohibited paths, dependency installation, deploy, or unauthorized external execution
- WHEN JEFE evaluates execution routing
- THEN JEFE requires approval or blocks the request
- AND JEFE does not continue as if the task were safely executable

### Requirement: JEFE must validate and review before delivery
The system SHALL validate technical correctness and review quality before calling work complete.

#### Scenario: Technical checks pass and quality is acceptable
- GIVEN implementation work has been produced
- WHEN JEFE completes validation and review
- THEN JEFE marks the work ready for delivery
- AND JEFE includes evidence, status, and next step

#### Scenario: Technical checks pass but quality is not acceptable
- GIVEN implementation work passes technical checks but still fails product, UX, or design intent
- WHEN JEFE reviews the result
- THEN JEFE opens a revision round
- AND JEFE does not deliver the work as final

### Requirement: JEFE must use bounded revision loops
The system SHALL retry within a bounded number of correction rounds and stop with an explicit blocked state when the limit is reached.

#### Scenario: Revision succeeds within retry budget
- GIVEN a task needs correction
- WHEN JEFE iterates within the allowed retry budget
- THEN JEFE revalidates after each correction
- AND JEFE can complete the work if criteria are satisfied

#### Scenario: Revision exceeds retry budget
- GIVEN a task still fails after the allowed retry budget
- WHEN JEFE reaches the retry limit
- THEN JEFE reports `blocked_after_retries`
- AND JEFE states what was attempted, what remains unsafe or unresolved, and what the human must decide

### Requirement: JEFE must track explicit work states
The system SHALL represent the lifecycle of a work block through explicit states rather than implicit chat-only progress.

#### Scenario: Work state transitions are visible
- GIVEN a request moves through planning, execution, validation, review, and delivery
- WHEN JEFE reports progress
- THEN JEFE uses explicit states such as `planned`, `in_progress`, `requires_openai`, `running_codex_worker`, `validating`, `needs_revision`, `blocked`, `completed_local`, `ci_pending`, `ci_failed`, `ci_success`, and `accepted`

### Requirement: JEFE must deliver honest closure
The system SHALL only deliver final work when completion criteria are met or a real blocking condition exists.

#### Scenario: Completed delivery
- GIVEN the functional objective is met and required validation passes
- WHEN JEFE delivers the result
- THEN JEFE reports what was done, what evidence exists, repo and CI status, and the next logical step

#### Scenario: Blocked delivery
- GIVEN the work cannot be safely or fully completed
- WHEN JEFE closes the block
- THEN JEFE reports the blocker, what was tried, what remains incomplete, what stayed safe, and what the human must provide or approve