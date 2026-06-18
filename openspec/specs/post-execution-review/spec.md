# Post-Execution Review Specification

## Purpose

Behavior contract for reviewing evidence produced by a manual supervised external execution session.

## Requirements

### Requirement: Review must classify evidence into explicit outcomes
The system SHALL review a manual supervised session and its evidence intake and classify the result into an explicit review status.

#### Scenario: Complete and safe evidence passes
- GIVEN a valid manual supervised session and accepted safe evidence
- WHEN JEFE runs post-execution review
- THEN the review status is `pass`
- AND the result includes a decision summary, rationale, and next action

#### Scenario: Incomplete evidence requires revision
- GIVEN a valid manual supervised session and incomplete evidence
- WHEN JEFE runs post-execution review
- THEN the review status is `needs_revision`

#### Scenario: Missing evidence stays incomplete
- GIVEN a valid manual supervised session and no usable evidence intake
- WHEN JEFE runs post-execution review
- THEN the review status is `missing_evidence`

#### Scenario: Out-of-scope evidence is rejected
- GIVEN a valid manual supervised session
- WHEN evidence points to forbidden or out-of-scope paths or artifacts
- THEN the review status is `invalid_scope`

#### Scenario: Sensitive findings block the review
- GIVEN a manual supervised session or intake with hard safety findings
- WHEN JEFE runs post-execution review
- THEN the review status is `blocked`

### Requirement: Review must not execute tools
The system SHALL review only artifacts and must not execute external tools during post-execution review.

#### Scenario: Review remains artifact-only
- GIVEN a post-execution review request
- WHEN JEFE processes it
- THEN JEFE does not launch Blender or Unity
- AND JEFE does not invoke MCP
- AND `externalToolExecutedByJefe` remains false