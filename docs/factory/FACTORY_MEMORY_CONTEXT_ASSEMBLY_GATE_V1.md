# Factory Memory Context Assembly Gate v1

## Purpose

Factory Memory Context Assembly Gate v1 converts a successful `FactoryMemoryReadRuntimeResult` into a minimized, traceable context package candidate.

It is a pure module. It does not read files, write files, call models, create embeddings, create Codex Tasks, execute Codex, create projects, create repositories, or deploy.

## Read Runtime vs Context Assembly

Memory Read Runtime Adapter reads governed memory records from a controlled runtime boundary and returns `safeMemoryRecord` data.

Context Assembly Gate only decides which already-read safe fields can be carried forward into a context package candidate. It is not a prompt builder and it is not an execution handoff.

## What It Builds

- Context item candidates.
- A context package candidate.
- Safe references.
- Lineage, freshness, retention, priority and approximate size metadata.
- A recommendation for a future Context Approval Gate or Codex Task Contract Gate.

## What It Does Not Build

- It does not build a final Codex prompt.
- It does not create a Codex Task.
- It does not execute Codex.
- It does not call OpenAI or any model.
- It does not create embeddings.
- It does not write memory or create a database.

## Context Purposes

Supported purposes:

- `jefe_review_context`
- `factory_planning_context`
- `memory_audit_context`
- `codex_task_context_candidate`
- `human_review_context`

`codex_task_context_candidate` still only creates a package candidate. It requires human review and does not authorize a Codex Task.

## Context Item Candidates

Each item keeps:

- source read item id;
- memory record identity;
- namespace and project namespace;
- fingerprint and idempotency key;
- minimized facts;
- safe references;
- lineage;
- freshness and retention;
- priority and approximate size.

Each item explicitly keeps disabled:

- Codex Task creation;
- Codex execution;
- embeddings;
- project creation;
- repository creation;
- deploy.

## Minimization

The gate accepts only selected fields from `safeMemoryRecord`:

- `title`
- `summary`
- `canonicalFacts`
- `references`
- `lineage`
- `tags`
- `retentionPolicy`
- `promotionPolicy`
- `stalePolicy`

It does not include full memory records, canonical payloads, raw evidence, secrets, prompt instructions, metadata dumps, or absolute filesystem paths.

## Safe References

References are logical and audit-oriented. They may include logical targets, metadata logical targets, fingerprint, idempotency key, source read item id, source read admission id, and source read runtime id.

Absolute paths and traversal references are not included.

## Lineage, Freshness and Retention

Lineage preserves the source memory record, read item, read admission, and read runtime ids. Freshness and retention are inherited when available and kept as minimized metadata.

## Budget

The package applies:

- `maxItems`;
- `maxApproxChars`.

If a budget is hit, whole items are omitted and a `context_budget_applied` warning is added.

## Future Relationships

This gate feeds a future Context Approval Gate. A Codex Task Contract Gate may later consume an approved context candidate, but this v1 gate does not authorize that handoff.

## Example

```json
{
  "assemblyKind": "factory-memory-context-assembly",
  "assemblyVersion": "1.0",
  "contextPurpose": "jefe_review_context",
  "decision": "approve_context_package_candidate",
  "status": "context_package_candidate_ready",
  "packageCandidate": {
    "contextAssemblyStatus": "candidate_not_approved",
    "codexTaskStatus": "not_allowed",
    "codexExecutionStatus": "not_allowed",
    "embeddingsStatus": "not_allowed"
  },
  "canCreateCodexTask": false,
  "canExecuteCodex": false
}
```

## Next Steps

- Context Approval Gate v1.
- Codex Task Contract Gate v1.
- Runtime context review surface, still without direct Codex execution.

