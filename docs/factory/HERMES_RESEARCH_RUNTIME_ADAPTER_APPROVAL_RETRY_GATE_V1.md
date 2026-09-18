# Hermes Research Runtime Adapter Approval Retry Gate v1

## Purpose

Factory Hermes Research Runtime Adapter Approval Retry Gate v1 retries adapter approval using the accepted Wrapper No-Tool Mode Verification Review evidence.

The approval is only for the next Factory Hermes Research Runtime Adapter Gate v1. It is not runtime execution approval.

## Inputs

- `wrapper-no-tool-mode-verification-review-result.json`
- `wrapper-no-tool-mode-verification-result.json`
- `wrapper-no-tool-mode-verification-approval-result.json`
- `wrapper-no-tool-mode-implementation-result.json`
- `research-runtime-adapter-approval-result.json`
- `runtime-selection-revision-planning-result.json`
- `toolset-disable-verification-approval-result.json`

## Decision

Accepted result:

- `status`: `research_runtime_adapter_approval_retry_granted`
- `decision`: `hermes_research_runtime_adapter_approval_retry_approved_with_wrapper_boundary`
- `adapterApprovalRetryStatus`: `approved_for_runtime_adapter_gate_only`
- `selectedWrapperStrategy`: `wrapper_temp_config_no_toolsets`
- `canProceedToResearchRuntimeAdapter`: `true`

Blocked result:

- `status`: `research_runtime_adapter_approval_retry_blocked`
- `decision`: `hermes_research_runtime_adapter_approval_retry_blocked_wrapper_evidence_insufficient`
- `adapterApprovalRetryStatus`: `blocked`
- `canProceedToKeepHermesResearchBlockedDecision`: `true`

## Evidence Boundary

The wrapper evidence is code-only. It proves a non-executing wrapper boundary, serializer, command envelope, virtual temp config candidate, and no-Hermes-execution checks. It does not prove real Hermes runtime behavior.

The retry carries forward these limitations:

- `no_real_hermes_execution_tested`
- `no_model_network_or_provider_tested`
- `config_schema_partially_unknown`
- `empty_toolsets_support_unknown`
- `hidden_defaults_may_still_exist_in_real_cli_runtime`
- `wrapper_verified_only_as_code_boundary`

## Not Authorized

- execute the adapter, Hermes, `hermes.exe`, or `--oneshot`
- execute wrapper against Hermes
- create live temp config or runtime run root
- pass prompts, call models, use network, resolve DNS, or test endpoints
- read `.env`, env secrets, or credential values
- enable toolsets
- execute research
- ingest real output or promote findings
- run uv, Python, pip, or setup.py
- modify package files, UI, IPC, preload, Hermes source, python-env, or cache

## Artifact

Runtime writes only the ignored artifact:

`.codex-temp/external-tools/hermes-agent/install/75b300f/research-runtime-adapter-approval-retry-result.json`

## Next Step

If granted: Factory Hermes Research Runtime Adapter Gate v1.

If blocked: Factory Hermes Keep Hermes Research Blocked Decision Gate v1.

The adapter gate may prepare only non-executable adapter manifests and a research execution approval retry envelope. It still cannot execute the adapter, wrapper, Hermes, prompts, models, network, credentials, toolsets, run roots, research, or findings.

Research Execution Approval Retry remains separate and can only open the final approval gate; it cannot approve execution now.

Research Execution Approval itself can only open controlled runtime planning, not immediate runtime execution.

Controlled Research Runtime Planning remains planning-only and must not create temp config, run root, prompts, model calls, network access, credential reads, toolsets, Hermes execution, research execution, ingestion, or findings.
