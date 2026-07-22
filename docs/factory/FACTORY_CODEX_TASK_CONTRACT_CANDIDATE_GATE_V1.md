# Factory Codex Task Contract Candidate Gate v1

## Purpose

Factory Codex Task Contract Candidate Gate v1 receives an approved memory context envelope plus an explicit JEFE task intent and creates a non-executable Codex task contract candidate.

It does not create a final prompt, create an executable Codex Task, execute Codex, call models, modify files, run commands, read filesystem, write files, create projects, create repositories, deploy, create embeddings, or access secrets.

## Context Approval vs Task Contract Candidate

Context Approval approves a context package for future handoff consideration.

This gate turns that approved context and a governed task intent into a structured task contract candidate. The candidate is still not approved for execution.

## What It Creates

- A contract candidate.
- Safety boundaries.
- Declarative validation plan.
- Response requirements.
- Stop conditions.
- Evidence requirements.
- Handoff notes.

## What It Does Not Create

- No final Codex prompt.
- No executable Codex Task.
- No Codex execution.
- No file mutation.
- No command execution.
- No model call.

## Task Intent

Task intent must include objective, non-goals, acceptance criteria, constraints, allowed surfaces, forbidden actions, validation plan, evidence requirements, response requirements, stop conditions, risk level, requester and timestamp.

## Task Kinds

- `analysis_only`
- `planning_only`
- `documentation_update_candidate`
- `test_generation_candidate`
- `code_change_candidate`
- `repair_plan_candidate`
- `factory_project_materialization_candidate`

All are candidates in v1. None authorize execution.

## Safety Boundaries

The candidate includes boundaries for no prompt finalization, no Codex execution, no file mutation, no command execution, no secret access, no external network, no project/repository creation, no deploy, and future approval/adapter requirements.

## Validation Plan

The validation plan is declarative. Proposed commands may be listed as text, but `commandsExecuted` remains false and a future runner is required.

## Response Requirements

The candidate can require future execution reports such as result summary, modified files, validations, risks, Git audit, commit/push status, per-file summary, and blockers.

## Stop Conditions

Stop conditions define when a future runner must stop and report instead of continuing.

## Not Authorized Actions

The forbidden action set includes final prompt assembly, executable task creation, Codex execution, file modification, command execution, secret access, network calls, project creation, repository creation, deploy, publish, and model calls.

## Future Relationships

Future gates may include:

- Codex Task Contract Approval Gate.
- Codex Prompt Assembly Gate.
- Codex Execution Adapter.

Those future blocks must independently authorize each step.

## Example

```json
{
  "candidateGateKind": "factory-codex-task-contract-candidate",
  "decision": "approve_codex_task_contract_candidate",
  "status": "codex_task_contract_candidate_ready",
  "contractCandidate": {
    "status": "candidate_not_approved",
    "promptAssemblyStatus": "not_generated",
    "codexTaskStatus": "not_created",
    "codexExecutionStatus": "not_allowed",
    "canExecuteCodex": false
  }
}
```

## Next Steps

Create a Codex Task Contract Approval Gate before any prompt assembly or executable task can exist.

