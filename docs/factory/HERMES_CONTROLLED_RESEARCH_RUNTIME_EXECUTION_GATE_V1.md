# Hermes Controlled Research Runtime Execution Gate v1

## Purpose

Factory Hermes Controlled Research Runtime Execution Gate v1 performs the final preflight for a controlled Hermes research runtime run.

This implementation is fail-closed. It verifies the approval chain, package hashes, staged status, live artifact containment, prompt manifest, and guard decision. It blocks before credential access and runtime execution unless a safe runnable wrapper command shape is proven from the current artifacts.

## Inputs

- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-execution-approval-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-execution-planning-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-live-artifact-verification-review-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-live-artifact-verification-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-live-artifact-creation-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/research-runtime-adapter-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/runtime-selection-decision-result.json`
- verified `config.yaml`
- verified `RUN_MANIFEST.json`

## Blocked Result

Current expected result is blocked before runtime when `safe_command_shape_not_proven`:

- `status`: `controlled_research_runtime_execution_blocked`
- `decision`: `hermes_controlled_research_runtime_execution_blocked_final_guards_not_satisfied`
- `executionStatus`: `blocked_before_runtime`
- `singleControlledRunExecuted`: `false`
- `canProceedToControlledResearchRuntimeExecutionReview`: `true`
- `canUseFindings`: `false`

## Produced Evidence

- `controlledResearchRuntimeExecutionReceipt`
- `hermesControlledResearchRuntimeExecutionResultRecord`
- `finalRuntimePreflightResult`
- `verifiedArtifactStabilityResult`
- `finalPromptArtifactManifest`
- `finalCredentialAccessAudit`
- `finalRuntimeCommandEnvelope`
- `finalRuntimeGuardDecision`
- `controlledRuntimeTimeoutKillSwitchResult`
- `controlledRuntimeOutputCaptureResult`
- `controlledRuntimeNoToolEvidenceResult`
- `controlledRuntimePostRunSecretScanResult`
- `controlledRuntimePostRunGitAuditResult`
- `controlledRuntimeExecutionReviewEnvelope`

## Safety

When blocked before runtime, this gate does not read credential values, does not use network, does not call models, does not execute Hermes, does not execute wrapper against Hermes, and does not promote findings.

## Next Gate

Factory Hermes Controlled Research Runtime Execution Review Gate v1.

## Execution Review Handoff

Factory Hermes Controlled Research Runtime Execution Review Gate v1 accepts the fail-closed `safe_command_shape_not_proven` block and routes to safe command shape proof planning only.

The follow-up proof planning gate does not retry execution or prove the command shape. It can only create a future approval envelope for safe command shape proof.

The safe command shape proof approval gate may approve only the future proof gate. It cannot execute Hermes or convert the prior blocked runtime into findings.

The proof gate can prove only command shape or block. It cannot itself authorize controlled runtime execution.
