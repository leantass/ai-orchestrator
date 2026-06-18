# Manual Supervised Execution Specification

## Purpose

Behavior contract for preparing and tracking manual supervised external execution sessions.

## Requirements

### Requirement: Ready permit bundles must produce manual supervised sessions
The system SHALL prepare a manual supervised session from a ready execution permit bundle without executing the external tool.

#### Scenario: Prepare session from ready permit bundle
- GIVEN an execution permit bundle in `ready_for_manual_supervised_execution`
- WHEN JEFE prepares a manual supervised session
- THEN JEFE writes a session artifact, runbook, checklist, evidence contract, and validation plan
- AND `executionAllowed` remains false
- AND `automaticExecutionAllowed` remains false
- AND `externalToolExecutedByJefe` remains false

### Requirement: Evidence intake must be structure-safe before review
The system SHALL validate human-provided evidence for structure and safety before future review.

#### Scenario: Safe evidence is accepted for review
- GIVEN a manual supervised session with approved evidence scope
- WHEN a human provides evidence inside allowed local scope
- THEN JEFE records the intake as accepted for review

#### Scenario: Unsafe evidence is blocked
- GIVEN a manual supervised session
- WHEN evidence contains forbidden paths, build artifacts, credentials, or protected surfaces
- THEN JEFE blocks the intake
- AND the session does not become a safe success by default