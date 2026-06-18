# UI Dashboard Specification

## Purpose

Behavior contract for the operator-facing dashboard surfaces that summarize JEFE status, safety posture, and external-tool workflow state.

## Requirements

### Requirement: The dashboard must expose safety posture clearly
The system SHALL present the operator with the current safety posture and external execution limits.

#### Scenario: V1.x shows external execution disabled
- GIVEN the operator opens the dashboard
- WHEN JEFE renders V1.x status
- THEN the UI states that external execution remains disabled
- AND the UI exposes `executionAllowed=false` and related safety limits in operator-facing language

### Requirement: The dashboard must summarize manual execution workflow stages
The system SHALL show the operator the current manual execution workflow stages and review outcomes.

#### Scenario: V1.5 and V1.6 are visible together
- GIVEN the operator opens the dashboard after manual supervised execution and post-execution review are available
- WHEN JEFE renders the workflow summary
- THEN the UI shows the V1.5 session/evidence layer
- AND the UI shows the V1.6 review layer and its available outcomes