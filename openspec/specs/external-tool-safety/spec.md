# External Tool Safety Specification

## Purpose

Safety contract for JEFE behavior around Blender, Unity, MCP, and other external tools.

## Requirements

### Requirement: JEFE must not execute external tools automatically in V1.x
The system SHALL keep external tool execution disabled unless a future milestone explicitly changes that contract.

#### Scenario: Blender remains manual only
- GIVEN a task that references Blender
- WHEN JEFE prepares planning, approvals, packets, sessions, or reviews
- THEN JEFE does not launch Blender
- AND the workflow remains manual or artifact-driven

#### Scenario: Unity remains manual only
- GIVEN a task that references Unity
- WHEN JEFE handles the request
- THEN JEFE does not launch Unity
- AND the workflow remains manual or artifact-driven

#### Scenario: MCP remains non-executed in V1.x
- GIVEN a task that references MCP
- WHEN JEFE handles the request
- THEN JEFE does not invoke MCP automatically
- AND any future MCP use requires separate scope and approval design

### Requirement: Sensitive or prohibited scopes must stay blocked
The system SHALL block unsafe paths, credentials, deploy behavior, and other prohibited surfaces unless explicitly re-scoped in a future approved block.

#### Scenario: Protected files remain blocked
- GIVEN a workflow that targets `.env`, `web-prueba`, package manifests, Docker/deploy paths, or production surfaces
- WHEN JEFE validates or prepares work
- THEN the workflow is blocked or requires human clarification

#### Scenario: Credentials remain forbidden
- GIVEN evidence, packets, or operator notes containing secrets or credentials
- WHEN JEFE validates the artifacts
- THEN the result is blocked
- AND JEFE does not continue as if the evidence were safe