# Hermes Research Runtime Adapter Gate v1

## Purpose

Factory Hermes Research Runtime Adapter Gate v1 prepares the Hermes research runtime adapter as a code-only, non-executable boundary using the approved wrapper no-tool mode evidence.

It does not execute the adapter, wrapper, Hermes, `hermes.exe`, or `--oneshot`.

## Inputs

- `research-runtime-adapter-approval-retry-result.json`
- `wrapper-no-tool-mode-verification-review-result.json`
- `wrapper-no-tool-mode-verification-result.json`
- `research-runtime-adapter-approval-result.json`
- `runtime-selection-decision-result.json`
- `final-execution-approval-result.json`

## Prepared Result

- `status`: `research_runtime_adapter_prepared`
- `decision`: `hermes_research_runtime_adapter_prepared_with_wrapper_boundary_for_execution_approval_retry`
- `adapterStatus`: `prepared_code_only_not_executed`
- `selectedWrapperStrategy`: `wrapper_temp_config_no_toolsets`
- `wrapperBoundaryIntegrated`: `true`
- `adapterCommandEnvelopeBuilt`: `true`
- `adapterSafetyManifestBuilt`: `true`
- `canProceedToResearchExecutionApprovalRetry`: `true`

## Adapter Boundary

The adapter integrates the wrapper as a code-only boundary. It does not use direct Hermes CLI defaults, does not claim that real Hermes runtime accepts no-tool mode, and does not build a runnable command.

The command envelope has:

- `commandString: null`
- `argv: []`
- `env: {}`
- `prompt: null`
- `tempConfigPath: null`
- `runRoot: null`

## Not Authorized

- execute adapter, wrapper, Hermes, `hermes.exe`, or `--oneshot`
- create live temp config or run root
- pass prompt
- call model
- use network, DNS, or endpoints
- read `.env`, env secrets, or credential values
- enable toolsets
- execute research
- ingest output or promote findings
- run uv, Python, pip, or setup.py

## Artifact

Runtime writes only:

`.codex-temp/external-tools/hermes-agent/install/75b300f/research-runtime-adapter-result.json`

## Next Gate

Factory Hermes Research Execution Approval Retry Gate v1.

The retry gate may only decide whether to proceed to the final Research Execution Approval Gate. It cannot execute the adapter, wrapper, Hermes, prompts, models, network, credentials, toolsets, run roots, research, or findings.

Research Execution Approval can only route to Controlled Research Runtime Planning; it is not runtime execution.

Controlled Research Runtime Planning must keep the adapter non-executable and plan wrapper-boundary runtime controls only.

Controlled Research Runtime Approval can accept those planned controls only for a future preparation gate. It does not execute the adapter, wrapper, Hermes, prompts, models, network, credentials, toolsets, run roots, research, ingestion, or findings.

Controlled Research Runtime Preparation can only prepare non-executable review artifacts from the adapter/planning/approval chain. It still cannot execute the adapter, wrapper, Hermes, prompts, models, network, credentials, toolsets, run roots, research, ingestion, or findings.

Controlled Research Runtime Preparation Review can only review those artifacts for later Live Artifact Planning. Adapter execution and Hermes execution remain blocked.

Controlled Research Runtime Live Artifact Planning does not change the adapter boundary. Adapter execution and Hermes execution remain blocked.
## Controlled Runtime Execution Planning Use

Factory Hermes Controlled Research Runtime Execution Planning Gate v1 consumes `research-runtime-adapter-result.json` as prepared adapter evidence only. Adapter execution, Hermes execution, wrapper execution, prompts, credentials, model calls, network, toolsets, ingestion, and findings remain blocked.

Factory Hermes Controlled Research Runtime Execution Approval Gate v1 continues treating the adapter as prepared code only, not executed runtime behavior.
