# Controlled Research Runtime Provider Direct Adapter v1

Status: `done_local_uncommitted` when smoke succeeds.

Pure code-only provider-direct adapter core. It builds a non-executing request envelope with `runnableNow: false` and explicit evidence that no credential value, network call, model call, prompt send, or tool declaration is included.

This module does not execute runtime, call models, use network, read credentials, read env, pass prompts to a provider, ingest output, or promote findings.

Verification Planning Gate v1 plans non-executing envelope verification and static safety scans for this module.

Verification Approval Gate v1 approves only verification of this non-executing adapter core.

Verification Gate v1 completed code-only/static verification for this adapter core.
## Mock E2E Planning Usage

Factory Hermes Controlled Research Runtime Mock E2E Planning Gate v1 records the provider-direct adapter as available but not executable. Provider runtime planning and execution remain blocked.
## Provider Runtime Planning Usage

Factory Hermes Controlled Research Runtime Provider Runtime Planning Gate v1 plans future use of the provider-direct adapter. The adapter is not executed in the planning gate.
## Provider Runtime Approval Usage

Provider Runtime Approval Gate v1 reviews the future provider-direct adapter plan but does not execute the adapter.
## Provider Runtime Execution Planning

The Provider Runtime Execution Planning Gate references the provider-direct adapter as a future execution component only. The planning gate does not invoke the adapter runtime, pass prompts, read credentials, use network, or create provider-runtime request/output artifacts.
## Execution Approval Gate Reference

The Provider Runtime Execution Approval Gate references the provider-direct adapter only as the future execution component. The approval gate itself does not invoke the adapter runtime, pass prompts, read credentials, use network, or create provider-runtime request/output artifacts.
## Runtime Execution Gate Use

The Provider Runtime Execution Gate performs the first controlled provider-direct call shape: OpenAI, `gpt-4o-mini`, `api.openai.com`, no tools, bounded output, no retry, no streaming, and artifacts under `.codex-temp`.
## Provider Runtime Review

Provider Runtime Review inspects artifacts produced by the provider-direct execution gate. It does not invoke the adapter or call the provider again.
## Retry Planning Reference

Retry Planning references the provider-direct adapter only as a future retry execution component. It does not invoke the adapter.
## Retry Approval Reference

Retry Approval references the provider-direct adapter only as the future retry execution component. It does not invoke the adapter, read credentials, pass prompts, use network, call models or create retry runtime artifacts.
## Retry Execution Usage

Retry Execution uses the provider-direct runtime shape for exactly one OpenAI request with no tools, no streaming and no automatic retry. Output remains review-only and is not findings.
## Retry Review Usage

Retry Review inspects provider-direct retry artifacts without invoking the adapter again. It can permit output ingestion planning only.
## Output Ingestion Planning Reference

Output Ingestion Planning references provider-direct retry artifacts as reviewed sources only. It does not invoke the adapter.
## Output Ingestion Approval Reference

Output Ingestion Approval does not invoke the provider-direct adapter; it approves only candidate artifact creation in a future gate.
