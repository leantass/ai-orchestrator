# Hermes Controlled Research Runtime Live Artifact Approval Gate v1

## Purpose

Factory Hermes Controlled Research Runtime Live Artifact Approval Gate v1 reviews the live artifact planning result and may approve only the next live artifact creation gate.

It does not create live artifacts, write `config.yaml`, create run root, execute Hermes, execute `hermes.exe`, execute `--oneshot`, execute wrapper against Hermes, pass prompts, call models, use network, read credentials, enable toolsets, ingest output, or promote findings.

## Result

- `status`: `controlled_research_runtime_live_artifact_approval_granted`
- `decision`: `hermes_controlled_research_runtime_live_artifact_approved_for_creation_gate`
- `liveArtifactApprovalStatus`: `approved_for_creation_gate_only`
- `selectedWrapperStrategy`: `wrapper_temp_config_no_toolsets`
- `canProceedToControlledResearchRuntimeLiveArtifactCreation`: `true`
- `canProceedToControlledResearchRuntimeExecution`: `false`
- `canRunResearchNow`: `false`

## Next Gate

Factory Hermes Controlled Research Runtime Live Artifact Creation Gate v1.

The later Live Artifact Verification Gate must re-read this approval result and confirm creation was approved only for `.codex-temp` artifact creation, not runtime execution.

The creation gate may write only approved `.codex-temp` artifacts for verification. It cannot execute runtime.
## Downstream Verification Review

Factory Hermes Controlled Research Runtime Live Artifact Verification Review Gate v1 requires the live artifact creation approval evidence to remain granted while preserving `controlledRuntimeExecutionAllowedNow: false` and `canRunResearchNow: false`.
