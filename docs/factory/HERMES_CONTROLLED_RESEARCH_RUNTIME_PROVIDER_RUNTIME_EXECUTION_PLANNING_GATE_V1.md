# Factory Hermes Controlled Research Runtime Provider Runtime Execution Planning Gate v1

Status: implemented and validated as planning-only.

This gate creates the first provider-direct runtime execution plan candidate for a later approval gate. It accepts the Provider Runtime Approval result, Provider Runtime Planning result, Mock E2E Review result, Alternate Safe Runtime Verification result, and Runtime Selection decision as read-only inputs.

It does not execute provider runtime, call models, use network, resolve DNS, read credentials, read process.env, read `.env`, pass a prompt to a provider, create provider-runtime execution artifacts, ingest output, promote findings, or unblock Hermes CLI.

## Result

- status: `controlled_research_runtime_provider_runtime_execution_plan_created`
- decision: `factory_owned_provider_direct_runtime_execution_plan_created_for_approval`
- providerRuntimeExecutionPlanningStatus: `plan_candidate_created`
- selectedAlternateRuntimeStrategy: `factory_owned_no_tool_model_provider_direct_research_adapter`
- selectedProvider: `openai`
- selectedModel: `gpt-4o-mini`
- selectedCredentialRef: `OPENAI_API_KEY`
- selectedHost: `api.openai.com`
- safeFallbackStrategy: `keep_hermes_research_blocked`
- canProceedToProviderRuntimeExecutionApproval: `true`
- canProceedToProviderRuntimeExecution: `false`
- canRunResearchNow: `false`

## Plans Built

- `providerRuntimeApprovalAcceptanceForExecutionPlanning`
- `providerRuntimeExecutionScopePlan`
- `providerPromptArtifactCreationPlan`
- `providerOutputContractCreationPlan`
- `providerRuntimeInputArtifactPlan`
- `providerCredentialReadExecutionPlan`
- `providerNetworkModelExecutionPlan`
- `providerRequestEnvelopeExecutionPlan`
- `providerNoToolExecutionPlan`
- `providerTimeoutKillSwitchExecutionPlan`
- `providerOutputCaptureRedactionExecutionPlan`
- `providerRuntimeAuditPlan`
- `providerRuntimeReviewPlan`
- `outputIngestionPostRuntimePlan`
- `findingsPostRuntimePlan`
- `providerRuntimeExecutionPlanningRiskRegister`
- `providerRuntimeExecutionApprovalEnvelope`

## Future Provider Runtime Artifacts

The gate plans these future artifacts under `.codex-temp/external-tools/hermes-agent/install/75b300f/provider-runtime/`, but does not create them:

- `PROVIDER_PROMPT_ARTIFACT.json`
- `PROVIDER_OUTPUT_CONTRACT.json`
- `PROVIDER_RUNTIME_INPUT.json`
- `PROVIDER_RUNTIME_REQUEST_ENVELOPE_REDACTED.json`
- `PROVIDER_RUNTIME_OUTPUT_RAW.json`
- `PROVIDER_RUNTIME_OUTPUT_REDACTED.json`
- `PROVIDER_RUNTIME_AUDIT.json`
- `PROVIDER_RUNTIME_REVIEW_CANDIDATE.json`

## Next Gate

The next allowed gate is `Factory Hermes Controlled Research Runtime Provider Runtime Execution Approval Gate v1`.

That next gate may review the execution planning result and decide whether a future Provider Runtime Execution Gate may proceed. Even that approval gate remains forbidden from executing provider runtime, calling a model, using network, resolving DNS, reading credentials, reading process.env, passing a prompt to provider, ingesting output, promoting findings, executing Hermes, or unblocking Hermes CLI.
## Downstream Execution Approval Gate

Provider Runtime Execution Planning is followed by `Factory Hermes Controlled Research Runtime Provider Runtime Execution Approval Gate v1`. That downstream gate reviews this planning result and may create an execution gate envelope, but remains approval-only and does not execute provider runtime.
## Provider Runtime Execution Gate

The approved execution plan is consumed by `Factory Hermes Controlled Research Runtime Provider Runtime Execution Gate v1`, which may create provider-runtime artifacts and perform one provider-direct request only after execution approval. Review, output ingestion and findings remain separate downstream gates.
## Review After Execution

Provider Runtime Review is the first downstream gate after execution. It may accept an invalid provider output for retry planning only, while output ingestion and findings remain blocked.
## Retry Planning Chain

Retry Planning may occur after a reviewed invalid provider output. It keeps credentials, network, model calls and findings blocked until later gates.
## Retry Approval Chain

Provider Runtime Retry Approval may follow retry planning and grant only a future retry execution gate. It remains non-executing and does not read process.env, credentials or `.env`.
## Retry Execution Result

The retry execution gate is the only later retry gate allowed to read `process.env.OPENAI_API_KEY` and call the provider once. It keeps Hermes, output ingestion and findings blocked.
