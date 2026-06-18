# V1.6 Post-Execution Review

## Objective

V1.6 adds the first post-execution review layer for manual supervised external execution in JEFE / AI Orchestrator.

The review consumes a V1.5 manual supervised session plus its evidence intake and decides whether the human-provided result can pass, needs revision, is blocked, is missing evidence or is outside approved scope.

It does not execute external tools.

## Flow

```text
manual supervised session
-> evidence intake
-> post-execution review
-> classify outcome safely
-> write formal review artifact
-> leave next human action explicit
```

## What It Does

- Reads a V1.5 session artifact.
- Reads a manual evidence intake artifact.
- Preserves `executionAllowed=false`, `automaticExecutionAllowed=false` and `externalToolExecutedByJefe=false`.
- Produces a formal review decision with `decisionSummary`, `decisionRationale` and `nextAction`.
- Distinguishes five outcomes: `pass`, `needs_revision`, `blocked`, `missing_evidence`, `invalid_scope`.
- Treats missing expected evidence as revision work, not as automatic success.
- Treats scope/path deviations such as build outputs, package manifests or forbidden directories as `invalid_scope`.
- Treats sensitive content or blocked session conditions as `blocked`.

## What It Does Not Do

- It does not open Blender.
- It does not open Unity.
- It does not invoke MCP.
- It does not run external tool commands.
- It does not install dependencies or addons.
- It does not accept `.env`, credentials, package changes, build outputs or production scope writes.

## CLI

Create a post-execution review:

```bash
node scripts/orchestrator-external-tool-post-execution-review.mjs \
  --mode review \
  --session ".codex-temp/manual-supervised-external-execution-real-trial-v01/blender-asset-create/manual-supervised-execution-session.json" \
  --intake ".codex-temp/manual-supervised-external-execution-real-trial-v01/blender-asset-create/evidence-intake/manual-evidence-intake.json" \
  --reviewer "Lean" \
  --role "Human Reviewer" \
  --notes "Reviewing human evidence after manual supervised execution." \
  --output ".codex-temp/post-execution-review-real-trial-v01/blender-asset-create" \
  --summary \
  --json
```

Read status from an existing review artifact:

```bash
node scripts/orchestrator-external-tool-post-execution-review.mjs \
  --mode status \
  --review ".codex-temp/post-execution-review-real-trial-v01/blender-asset-create/external-tool-post-execution-review.json" \
  --summary
```

Or derive status directly from session plus intake without writing a new artifact:

```bash
node scripts/orchestrator-external-tool-post-execution-review.mjs \
  --mode status \
  --session ".codex-temp/manual-supervised-external-execution-real-trial-v01/blender-asset-create/manual-supervised-execution-session.json" \
  --intake ".codex-temp/manual-supervised-external-execution-real-trial-v01/blender-asset-create/evidence-intake/manual-evidence-intake.json" \
  --summary
```

## Review Statuses

- `pass`: evidence exists, matches the declared contract and no blocking or scope findings are detected.
- `needs_revision`: evidence exists but is incomplete or does not satisfy the expected contract.
- `blocked`: the session was already blocked/aborted or sensitive findings were detected.
- `missing_evidence`: no reviewable evidence intake exists yet.
- `invalid_scope`: evidence points to forbidden paths, build outputs, package artifacts or other out-of-scope structures.

## Decision Mapping

- `accepted_for_review` intake with valid session invariants becomes `pass`.
- `invalid_evidence` intake becomes `needs_revision`.
- `missing_evidence` intake becomes `missing_evidence`.
- Intake blocked by build/package/path scope becomes `invalid_scope`.
- Intake blocked by credentials, secrets or session hard blockers becomes `blocked`.

## Artifacts Written

- `external-tool-post-execution-review.json`
- `post-execution-review-summary.md`
- `post-execution-review-findings.md`
- `README.md`

## Security Invariants

- `executionAllowed=false`
- `automaticExecutionAllowed=false`
- `externalToolExecutedByJefe=false`
- no Blender launch by JEFE during review
- no Unity launch by JEFE during review
- no MCP invocation by JEFE during review

## Next Steps

- V1.7 session UI for manual execution sessions and reviews.
- Stronger visual presentation of review states inside the dashboard.
- Future evidence-specific review heuristics only after scope-safe inputs remain stable.