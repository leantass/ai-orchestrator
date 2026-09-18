# Hermes Controlled Research Runtime Live Artifact Verification Gate v1

## Purpose

Factory Hermes Controlled Research Runtime Live Artifact Verification Gate v1 verifies the previously created `.codex-temp` live artifacts before any runtime execution approval planning.

This gate reads `config.yaml`, `RUN_MANIFEST.json`, and prior gate receipts only. It performs path containment, symlink, secret, env dump, prompt body, executable command, runtime safety, and directory inventory checks.

It does not execute Hermes, execute `hermes.exe`, execute `--oneshot`, execute wrapper against Hermes, pass prompts, call models, use network, read `.env`, read credential values, enable toolsets, ingest output, or promote findings.

## Inputs

- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-live-artifact-creation-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-live-artifact-approval-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-live-artifact-planning-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-preparation-review-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-preparation-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/runtime-selection-decision-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/wrapper-configs/no-tool-mode/hermes-first-controlled-run-001/config.yaml`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/hermes-first-controlled-run-001/RUN_MANIFEST.json`

## Result

- `status`: `controlled_research_runtime_live_artifacts_verified`
- `decision`: `hermes_controlled_research_runtime_live_artifacts_verified_for_review`
- `liveArtifactVerificationStatus`: `verified_with_limitations`
- `selectedWrapperStrategy`: `wrapper_temp_config_no_toolsets`
- `canProceedToControlledResearchRuntimeLiveArtifactVerificationReview`: `true`
- `canProceedToControlledResearchRuntimeExecution`: `false`
- `canRunResearchNow`: `false`

## Evidence

The gate produces:

- `controlledResearchRuntimeLiveArtifactVerificationReceipt`
- `hermesControlledResearchRuntimeLiveArtifactVerificationResultRecord`
- `liveTempConfigVerificationResult`
- `liveRunRootManifestVerificationResult`
- `liveArtifactPathContainmentVerificationResult`
- `liveArtifactSymlinkVerificationResult`
- `liveArtifactSecretScanResult`
- `liveArtifactRuntimeSafetyScanResult`
- `liveArtifactVerificationEvidenceManifest`
- `controlledRuntimeLiveArtifactVerificationReviewEnvelope`

## Limitations

- `config_schema_partially_unknown`
- `empty_toolsets_support_unknown`
- `no_real_hermes_execution_tested`
- `no_model_network_or_provider_tested`
- `verification_does_not_prove_runtime_success`
- `verification_does_not_approve_execution`

## Next Gate

Factory Hermes Controlled Research Runtime Live Artifact Verification Review Gate v1.

## Review Gate Handoff

The live artifact verification result is now reviewed by `Factory Hermes Controlled Research Runtime Live Artifact Verification Review Gate v1`.

The review gate may allow controlled runtime execution planning only. It keeps actual Hermes execution, `hermes.exe`, `--oneshot`, wrapper execution against Hermes, prompts, models, network, credentials, toolsets, ingestion, and findings blocked.

Execution planning must still emit a non-runnable command envelope and defer execution approval to `Factory Hermes Controlled Research Runtime Execution Approval Gate v1`.

Execution approval may allow only the final execution gate; it is not itself runtime execution.
