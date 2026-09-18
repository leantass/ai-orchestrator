# Factory Hermes Controlled Research Runtime Provider Runtime Approval Gate v1

Status: implemented.

This gate reviews the provider runtime plan and approves only the Provider Runtime Execution Planning Gate v1. It does not execute provider runtime, call models, use network, resolve DNS, read credentials, read `.env`, read `process.env`, pass prompts to a provider, ingest output, or promote findings.

## Output

- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-provider-runtime-approval-result.json`

## Decision

When granted, the gate returns `controlled_research_runtime_provider_runtime_approval_granted` and allows only provider runtime execution planning.

## Next Gate

Factory Hermes Controlled Research Runtime Provider Runtime Execution Planning Gate v1.
## Downstream Execution Planning Gate

This approval gate now feeds `Factory Hermes Controlled Research Runtime Provider Runtime Execution Planning Gate v1`. The downstream gate is planning-only and does not execute provider runtime, read credentials, read process.env, use network, call models, ingest output, promote findings, execute Hermes, or unblock Hermes CLI.
## Downstream Provider Runtime Execution Approval

Provider Runtime Approval feeds execution planning, then execution approval. Execution approval may allow the next execution gate to proceed, but it still does not read credentials, use process.env, use network, call models, pass prompts, ingest output, promote findings, execute Hermes, or unblock Hermes CLI.
## Provider Runtime Execution Chain

Provider Runtime Execution Approval now feeds the Provider Runtime Execution Gate. The execution gate may perform one provider-direct request under strict controls, while Hermes CLI, output ingestion and findings remain blocked.
## Review And Retry Chain

Provider Runtime Review accepts failed provider output only for retry planning when safety boundaries remain clean. It does not approve retry execution, output ingestion or findings.
## Retry Planning Chain

Retry Planning is not retry execution. It prepares prompt-contract remediation and requires a later retry approval gate.
## Retry Approval Chain

Provider Runtime Retry Approval grants only the future retry execution gate. It does not execute the retry, read credentials, use network, call models, ingest output or promote findings.
## Retry Execution Result

Provider Runtime Retry Execution consumed the later retry approval and produced review-only retry artifacts. It does not change this gate's original approval-only scope.
