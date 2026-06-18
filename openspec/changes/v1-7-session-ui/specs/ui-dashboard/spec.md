# Delta for UI Dashboard

## ADDED Requirements

### Requirement: The operator UI must summarize manual execution artifacts
The dashboard SHALL summarize manual supervised execution session state, evidence intake state, and post-execution review state in one operator-facing flow.

#### Scenario: Operator sees the session pipeline
- GIVEN the operator opens the JEFE dashboard
- WHEN V1.7 session UI is present
- THEN the UI shows session, evidence, and review as connected stages
- AND the UI provides operator-facing next-action guidance

### Requirement: The operator UI must preserve manual-only framing
The dashboard SHALL make it explicit that JEFE does not execute Blender, Unity, or MCP directly in this workflow.

#### Scenario: External execution remains visibly disabled
- GIVEN the operator opens the session UI
- WHEN the dashboard renders the workflow
- THEN the UI states that execution remains manual only
- AND the UI keeps `executionAllowed=false` semantics visible