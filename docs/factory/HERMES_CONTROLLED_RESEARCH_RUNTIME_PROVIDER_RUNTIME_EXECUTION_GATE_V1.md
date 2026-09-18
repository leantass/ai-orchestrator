# Factory Hermes Controlled Research Runtime Provider Runtime Execution Gate v1

Status: implemented as the first controlled provider-direct execution gate.

This gate may read `process.env.OPENAI_API_KEY` once inside the runtime CJS and may execute exactly one provider-direct request to `https://api.openai.com/v1/chat/completions` using provider `openai`, model `gpt-4o-mini`, no tools, no functions, no `tool_choice`, no MCP, no streaming and no retry.

The gate does not execute Hermes, does not use Hermes CLI, does not read `.env`, does not persist or log credentials, does not promote output to findings, and does not approve output ingestion.

## Artifacts

Provider runtime artifacts are written under `.codex-temp/external-tools/hermes-agent/install/75b300f/provider-runtime/`:

- `PROVIDER_PROMPT_ARTIFACT.json`
- `PROVIDER_OUTPUT_CONTRACT.json`
- `PROVIDER_RUNTIME_INPUT.json`
- `PROVIDER_RUNTIME_REQUEST_ENVELOPE_REDACTED.json`
- `PROVIDER_RUNTIME_OUTPUT_RAW.json`
- `PROVIDER_RUNTIME_OUTPUT_REDACTED.json`
- `PROVIDER_RUNTIME_AUDIT.json`
- `PROVIDER_RUNTIME_REVIEW_CANDIDATE.json`

The controlled result artifact is `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-provider-runtime-execution-result.json`.

## Outcomes

Completed:

- `status`: `controlled_research_runtime_provider_runtime_execution_completed`
- `decision`: `factory_owned_provider_direct_runtime_executed_for_review`
- `providerRuntimeExecutionStatus`: `executed_provider_direct_not_ingested`

Missing credential:

- `status`: `controlled_research_runtime_provider_runtime_execution_blocked`
- `decision`: `factory_owned_provider_direct_runtime_execution_blocked_missing_credential`
- `providerRuntimeExecutionStatus`: `blocked_before_provider_call`

Provider/network/model failure:

- `status`: `controlled_research_runtime_provider_runtime_execution_failed`
- `decision`: `factory_owned_provider_direct_runtime_execution_failed_for_review`
- `providerRuntimeExecutionStatus`: `failed_provider_direct_not_ingested`

## Safety

Output ingestion remains false. Findings use remains false. Provider runtime review is required before any output ingestion planning. Hermes CLI remains blocked.

Next gate: `Factory Hermes Controlled Research Runtime Provider Runtime Review Gate v1`.
## Downstream Provider Runtime Review

Provider Runtime Review Gate v1 reviews the captured provider runtime artifacts without making a second provider call. The invalid output is accepted as safe for retry planning only when secrets, credential leakage and tool metadata are absent.
## Retry Planning After Review

Retry Planning consumes the review of the failed provider-direct output and prepares a safer second-attempt plan. It keeps retry execution, output ingestion and findings blocked.
## Retry Approval After Planning

Retry Approval consumes the retry plan and grants only the future retry execution gate. It does not run provider runtime again, send prompts, call models, use network, read credentials, ingest output or promote findings.
## Retry Execution Result

Retry Execution now records the second provider-direct call under `.codex-temp/provider-runtime-retry/`. The retry output is not ingested or promoted to findings.
## Retry Review Result

Retry Review may accept the valid retry output for output ingestion planning only. It does not change the first execution gate's review-only boundary.
## Output Ingestion Planning Result

Output Ingestion Planning is downstream of retry review and does not run provider runtime or create findings.
