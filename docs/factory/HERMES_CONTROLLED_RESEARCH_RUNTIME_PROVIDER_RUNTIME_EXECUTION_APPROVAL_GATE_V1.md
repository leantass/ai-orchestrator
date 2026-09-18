# Factory Hermes Controlled Research Runtime Provider Runtime Execution Approval Gate v1

Status: implemented and validated as approval-only.

This gate reviews the Provider Runtime Execution Planning result and approves or blocks the next `Factory Hermes Controlled Research Runtime Provider Runtime Execution Gate v1`.

It does not execute provider runtime, call models, use network, resolve DNS, read credentials, read process.env, read `.env`, pass a prompt to a provider, create provider-runtime execution artifacts, ingest output, promote findings, or unblock Hermes CLI.

## Result

- status: `controlled_research_runtime_provider_runtime_execution_approval_granted`
- decision: `factory_owned_provider_direct_runtime_execution_approved_for_execution_gate`
- providerRuntimeExecutionApprovalStatus: `approved_for_provider_runtime_execution_gate_only`
- selectedAlternateRuntimeStrategy: `factory_owned_no_tool_model_provider_direct_research_adapter`
- selectedProvider: `openai`
- selectedModel: `gpt-4o-mini`
- selectedCredentialRef: `OPENAI_API_KEY`
- selectedHost: `api.openai.com`
- safeFallbackStrategy: `keep_hermes_research_blocked`
- providerRuntimeExecutionGateAllowed: `true`
- canProceedToProviderRuntimeExecution: `true`
- canProceedToOutputIngestionPlanning: `false`
- canProceedToControlledResearchRuntimeExecution: `false`
- canRunResearchNow: `false`

## Reviews Accepted

- `providerRuntimeExecutionPlanReadinessReview`
- `providerRuntimeApprovalAcceptanceReview`
- `providerRuntimeExecutionScopePlanReview`
- `providerPromptArtifactCreationPlanReview`
- `providerOutputContractCreationPlanReview`
- `providerRuntimeInputArtifactPlanReview`
- `providerCredentialReadExecutionPlanReview`
- `providerNetworkModelExecutionPlanReview`
- `providerRequestEnvelopeExecutionPlanReview`
- `providerNoToolExecutionPlanReview`
- `providerTimeoutKillSwitchExecutionPlanReview`
- `providerOutputCaptureRedactionExecutionPlanReview`
- `providerRuntimeAuditPlanReview`
- `providerRuntimeReviewPlanReview`
- `outputIngestionPostRuntimePlanReview`
- `findingsPostRuntimePlanReview`

## Execution Gate Envelope

The approval creates `providerRuntimeExecutionGateEnvelope` for the next execution gate only. That next gate is the first point where provider-direct execution may occur under strict controls.

Allowed only in the next gate:

- create provider prompt, output contract and runtime input artifacts under `.codex-temp/.../provider-runtime/`
- read `process.env.OPENAI_API_KEY` only inside the execution gate
- build a redacted request envelope
- execute one provider-direct request to `api.openai.com` using `gpt-4o-mini`
- capture raw output, redacted output, audit and provider runtime review candidate under `.codex-temp`

Still forbidden here:

- provider runtime execution
- credential reads
- process.env reads
- `.env` reads
- model calls
- network or DNS
- output ingestion
- findings promotion
- Hermes CLI execution or unblocking
## Downstream Provider Runtime Execution Gate

This approval gate feeds `Factory Hermes Controlled Research Runtime Provider Runtime Execution Gate v1`. The downstream execution gate is the first gate that may read `process.env.OPENAI_API_KEY` and make one provider-direct request; it still cannot execute Hermes, use tools, read `.env`, persist credentials, ingest output or promote findings.
## Downstream Review After Execution

After Provider Runtime Execution, Provider Runtime Review must inspect the captured artifacts before any retry planning or output ingestion planning. Review does not execute provider runtime again.
## Retry Planning Chain

Provider Runtime Retry Planning is downstream of execution review. It plans remediation only and does not grant a second provider call.
## Retry Approval Chain

Provider Runtime Retry Approval is downstream of retry planning. It is approval-only and grants only the future retry execution gate; no second provider call or credential/env/network/model access occurs in approval.
## Retry Execution Result

The later retry execution gate used the retry approval envelope to run one provider-direct request only; all output ingestion and findings gates remain downstream.
## Retry Review Result

Retry Review is downstream of retry execution and may permit only output ingestion planning.
