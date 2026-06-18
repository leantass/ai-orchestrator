# V1.5 Manual Supervised External Execution

## Objective

V1.5 adds the first manual supervised external execution runner for JEFE / AI Orchestrator.

The runner prepares and records a controlled manual session from an `execution permit bundle`. It does not execute external tools.

## Flow

```text
permit bundle
-> validate readiness
-> create manual supervised session
-> generate operator runbook
-> define expected evidence
-> define execution checklist
-> define abort conditions
-> record human-provided evidence
-> validate evidence structure safely
-> leave session ready for future post-execution review
```

## What It Does

- Reads an existing execution permit bundle.
- Derives whether a manual supervised session is ready.
- Generates an operator runbook.
- Writes a manual operator checklist.
- Writes an evidence contract.
- Writes abort and rollback notes.
- Validates human-provided evidence folders.
- Blocks evidence with `.env`, credentials, `node_modules`, `web-prueba`, Docker/deploy artifacts, package changes or paths outside approved scope.
- Keeps `executionAllowed=false`, `automaticExecutionAllowed=false` and `externalToolExecutedByJefe=false`.

## What It Does Not Do

- It does not open Blender.
- It does not open Unity.
- It does not invoke MCP.
- It does not run external tool commands.
- It does not install dependencies or addons.
- It does not generate builds.
- It does not deploy.
- It does not use real credentials.
- It does not touch production databases or real external services.

## CLI

Prepare a manual supervised session:

```bash
node scripts/orchestrator-external-tool-manual-supervised-runner.mjs \
  --mode prepare \
  --permit-bundle ".codex-temp/external-tool-execution-permit-bundles-real-trial-v01/blender-asset-create/external-tool-execution-permit-bundle.json" \
  --operator "Lean" \
  --role "Human Owner" \
  --output ".codex-temp/manual-supervised-external-execution-real-trial-v01/blender-asset-create" \
  --summary \
  --json
```

Record evidence provided later by a human operator:

```bash
node scripts/orchestrator-external-tool-manual-supervised-runner.mjs \
  --mode record-evidence \
  --session ".codex-temp/manual-supervised-external-execution-real-trial-v01/blender-asset-create/manual-supervised-execution-session.json" \
  --evidence-dir ".codex-temp/manual-supervised-external-execution-real-trial-v01/blender-asset-create/evidence" \
  --operator "Lean" \
  --notes "Human provided evidence for future review." \
  --output ".codex-temp/manual-supervised-external-execution-real-trial-v01/blender-asset-create/evidence-intake" \
  --summary \
  --json
```

Abort a session without deleting artifacts:

```bash
node scripts/orchestrator-external-tool-manual-supervised-runner.mjs \
  --mode abort \
  --session ".codex-temp/manual-supervised-external-execution-real-trial-v01/blender-asset-create/manual-supervised-execution-session.json" \
  --notes "Operator aborted before external tool use." \
  --output ".codex-temp/manual-supervised-external-execution-real-trial-v01/blender-asset-create/aborted" \
  --summary
```

Read status:

```bash
node scripts/orchestrator-external-tool-manual-supervised-runner.mjs \
  --mode status \
  --session ".codex-temp/manual-supervised-external-execution-real-trial-v01/blender-asset-create/manual-supervised-execution-session.json" \
  --summary
```

## Session Statuses

- `ready_for_manual_operator`: permit bundle is ready and the session can be handed to a human operator.
- `not_ready_missing_inputs`: planning, inputs, outputs or scopes are incomplete.
- `requires_human_approval`: approval is missing, expired, denied or not usable.
- `blocked`: hard safety issue is present.
- `missing_artifacts`: permit bundle or critical artifact is missing.
- `evidence_pending`: ready session still needs human evidence.
- `evidence_submitted`: evidence intake was accepted for future review.
- `evidence_invalid`: evidence exists but does not satisfy the contract.
- `aborted`: operator or safety process aborted the session.

## Evidence Intake

Evidence intake validates structure and safety only. It does not inspect binary asset quality deeply.

Accepted evidence must:

- exist as a directory;
- live inside `.codex-temp` or an approved scope from the permit bundle;
- avoid `.env`, credentials, `node_modules`, `web-prueba`, Docker/deploy artifacts, package changes and build outputs;
- contain expected evidence files when the session declares them.

## Tool Rules

### Blender

- The human operator opens Blender manually.
- Expected evidence: screenshots/previews, exported file placeholder if applicable, manual notes/logs.
- Forbidden: addons, unapproved paths, `.env`, credentials, unapproved exports.

### Unity

- The human operator opens Unity manually in an approved project/sandbox.
- Expected evidence: screenshots, import log, prefab/scene report if applicable, test report if applicable.
- Forbidden: builds, productive scenes, deleting assets, paths outside scope.

### MCP

- JEFE does not invoke MCP in V1.5.
- Any future MCP action must be human-supervised and separately approved.
- Expected evidence: redacted payload, scopes used, redacted response if applicable.
- Forbidden: real credentials and network calls from JEFE.

## Security Invariants

- `executionAllowed=false`
- `automaticExecutionAllowed=false`
- `externalToolExecutedByJefe=false`
- no Blender launch by JEFE
- no Unity launch by JEFE
- no MCP invocation by JEFE

## Next Steps

- Post-execution review for accepted evidence.
- Controlled real external tool runner only after explicit scope and approval hardening.
- MCP scoped execution with redacted payloads and permission boundaries.
