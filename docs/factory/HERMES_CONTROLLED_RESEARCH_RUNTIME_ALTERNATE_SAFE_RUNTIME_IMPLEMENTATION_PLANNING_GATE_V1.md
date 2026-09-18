# Hermes Controlled Research Runtime Alternate Safe Runtime Implementation Planning Gate v1

Status: `done_local_uncommitted` when the smoke succeeds.

This gate creates a planning-only candidate for a Factory-owned no-tool provider-direct research adapter, an optional mock-only research runtime, and shared runtime contracts. It keeps Hermes CLI blocked and does not implement or execute any runtime.

## Decision

- Status: `alternate_safe_runtime_implementation_plan_created` or `alternate_safe_runtime_implementation_plan_blocked`.
- Success decision: `factory_owned_provider_direct_runtime_implementation_plan_created_for_approval`.
- Blocked decision: `factory_owned_provider_direct_runtime_implementation_plan_blocked_no_safe_plan`.
- Selected strategy on success: `factory_owned_no_tool_model_provider_direct_research_adapter`.
- Fallback: `keep_hermes_research_blocked`.

## Planning Scope

The plan covers future implementation scope, file allowlist, provider-direct adapter architecture, mock runtime architecture, shared contracts, prompt artifact and output contract model, credential/network/model boundaries, no-tool enforcement, timeout and kill switch handling, output capture/redaction/review, findings gating, verification, mock E2E, and provider runtime roadmap.

It explicitly excludes adapter implementation, mock runtime implementation, Hermes execution, prompt passing, network, model calls, credential reads, output ingestion, and findings promotion.

## Required Boundaries

- Adapter core must remain pure and credential-free.
- Provider runtime can only be considered in a later final provider execution gate.
- Credential reference is `OPENAI_API_KEY`; credential values are not read here.
- Provider/model/host references remain `openai`, `gpt-4o-mini`, and `api.openai.com`.
- Tool declarations, function tools, MCP/browser/file/shell/external tools, and tool-use claims must fail closed.
- Raw output is never findings.

## Artifacts

- Source module: `src/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning/`.
- Read-only runtime: `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning/`.
- Smoke: `scripts/factory-hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning-smoke.mjs`.
- Ignored result: `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-alternate-safe-runtime-implementation-planning-result.json`.
- Ignored report: `.codex-temp/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning-v1/reports/IMPLEMENTATION_REPORT.md`.

## Next Gate

`Factory Hermes Controlled Research Runtime Alternate Safe Runtime Implementation Approval Gate v1`.

## Approval Gate Result

The follow-on Implementation Approval Gate v1 reviews this plan and may approve only the next code-only implementation gate. It keeps runtime execution, research, Hermes, prompts, credentials, network, model calls, output ingestion, and findings blocked.

Implementation Gate v1 uses this plan to create only non-executing code modules and a verification-planning envelope.

Verification Planning Gate v1 must treat obsolete “provider adapter not implemented” smoke assertions as stale post-implementation checks.
