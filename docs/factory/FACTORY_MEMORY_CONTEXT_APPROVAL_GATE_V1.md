# Factory Memory Context Approval Gate v1

## Purpose

Factory Memory Context Approval Gate v1 reviews a `FactoryMemoryContextAssemblyResult` and decides whether its `contextPackageCandidate` may advance as an approved context handoff candidate.

It is a pure module. It does not read files, write files, create a database, create embeddings, create Codex Tasks, execute Codex, execute Hermes, create projects, create repositories, deploy, call models, or build a final prompt.

## Context Assembly vs Context Approval

Context Assembly builds a minimized candidate package from safe memory read results.

Context Approval reviews that candidate, checks reviewer and human approval context, and emits an approval receipt plus an approved context envelope if the package is safe.

## What It Approves

It approves only a context package candidate for future evaluation by a downstream gate.

It does not approve a Codex Task, Codex execution, embeddings, deployment, project creation, repository creation, or prompt finalization.

## Approval Receipt

The receipt records:

- reviewer identity;
- human approval reference;
- source assembly/read runtime/read admission ids;
- context purpose;
- decision;
- limitations;
- not authorized actions.

Not authorized actions include creating a Codex Task, executing Codex, creating embeddings, creating projects or repositories, deploy, publish, accessing secrets, calling models, and assembling a final prompt.

## Approved Context Envelope

The envelope contains the approved package candidate and a validation result. Runtime and downstream statuses remain non-executable:

- `contextRuntimeStatus: not_executable`
- `codexTaskStatus: not_allowed`
- `codexExecutionStatus: not_allowed`
- `embeddingsStatus: not_allowed`
- `projectStatus: not_created`
- `repositoryStatus: not_created`
- `deployStatus: not_allowed`

## Human Approval

Human approval is required by default. `codex_task_context_candidate` also requires explicit human approval, but approval still does not create or authorize a Codex Task.

## Restrictions

The gate blocks packages with:

- package blockers;
- item blockers;
- full memory record flags;
- canonical payload;
- raw evidence;
- secrets;
- prompt instructions;
- dangerous downstream capabilities;
- budget violations.

## Future Relationships

This gate can feed a future Codex Task Contract Gate or Context Repair flow. That future gate must independently decide whether a task contract can be created.

## Example

```json
{
  "approvalKind": "factory-memory-context-approval",
  "approvalVersion": "1.0",
  "decision": "approve_context_package_for_handoff_candidate",
  "status": "approved_context_candidate",
  "approvedContextEnvelope": {
    "contextApprovalStatus": "approved_candidate",
    "codexTaskStatus": "not_allowed",
    "codexExecutionStatus": "not_allowed",
    "embeddingsStatus": "not_allowed"
  },
  "canCreateCodexTask": false,
  "canExecuteCodex": false
}
```

## Next Steps

- Context Repair flow.
- Codex Task Contract Gate v1.
- Separate prompt assembly approval, if ever required.

