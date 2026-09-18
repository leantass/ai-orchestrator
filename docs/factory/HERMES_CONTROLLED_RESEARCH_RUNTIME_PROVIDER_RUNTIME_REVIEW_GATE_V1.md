# Factory Hermes Controlled Research Runtime Provider Runtime Review Gate v1

Status: implemented and validated as review-only.

This gate reviews the first real provider-direct runtime output already captured by Provider Runtime Execution Gate v1. The execution result is accepted as a safe failure for retry planning because the provider output failed contract validation while secrets, credential leakage and tool metadata remained absent.

This gate does not execute provider runtime again, call models, use network, resolve DNS, read credentials, read process.env, read `.env`, pass prompts to provider, ingest output or promote findings.

## Result

- status: `controlled_research_runtime_provider_runtime_review_completed`
- decision: `factory_owned_provider_direct_runtime_review_accepted_invalid_output_for_retry_planning`
- providerRuntimeReviewStatus: `accepted_invalid_output_not_ingested`
- providerRuntimeRetryPlanningAllowedNow: `true`
- canProceedToProviderRuntimeRetryPlanning: `true`
- canProceedToOutputIngestionPlanning: `false`
- canRunResearchNow: `false`

## Review Conclusion

The failure is treated as `invalid_output_contract`, not as a safety boundary failure.

Accepted evidence:

- provider runtime attempted exactly once in the previous execution gate
- output schema was invalid
- output contains no detected secrets
- output contains no detected tool metadata
- credential boundary remained clean
- network/model boundary was the approved OpenAI host and model
- output ingestion remains blocked
- findings remain blocked

## Next Gate

`Factory Hermes Controlled Research Runtime Provider Runtime Retry Planning Gate v1`.

Retry planning may plan a second attempt, but may not execute it, call models, use network, read credentials, read process.env, ingest output or promote findings.
## Downstream Retry Planning

Provider Runtime Retry Planning uses the accepted invalid-output review to plan prompt and contract remediation. It does not execute a second provider call.
## Downstream Retry Approval

Provider Runtime Retry Approval reviews the retry plan and may allow only the next retry execution gate. It does not execute a second provider call, use network, read process.env or credentials, ingest output or promote findings.
## Downstream Retry Execution

Provider Runtime Retry Execution performs the single approved second provider-direct request and returns a retry review envelope. Review remains required before any output ingestion planning.
## Downstream Retry Review

Provider Runtime Retry Review consumes the retry review envelope and may allow output ingestion planning only, not output ingestion execution or findings use.
## Output Ingestion Planning Result

Output Ingestion Planning consumes the retry review result and prepares a future controlled candidate path while keeping findings blocked.
## Output Ingestion Approval Result

Output Ingestion Approval may allow candidate artifact creation in the next gate only; provider runtime review boundaries remain closed.
