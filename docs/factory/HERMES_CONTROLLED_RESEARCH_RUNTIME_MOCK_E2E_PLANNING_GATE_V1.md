# Factory Hermes Controlled Research Runtime Mock E2E Planning Gate v1

Status: implemented.

This gate creates a planning-only candidate for a future mock-only E2E path using the verified controlled research runtime contracts and verified mock runtime. It accepts the Alternate Safe Runtime Verification Gate v1 result only for mock E2E planning review.

It does not execute mock E2E, mock runtime, provider runtime, real research, Hermes, hermes.exe, wrappers, adapter runtime, model calls, network, DNS, endpoint tests, credential reads, `.env`, `process.env`, prompt passing, toolsets, output ingestion, or findings promotion.

## Inputs

- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-alternate-safe-runtime-verification-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-alternate-safe-runtime-verification-approval-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-alternate-safe-runtime-implementation-result.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/runtime-selection-decision-result.json`

## Output

- `.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-mock-e2e-planning-result.json`

## Planned Candidate

The plan candidate includes:

- alternate safe runtime verification acceptance for mock E2E planning;
- mock E2E scope plan;
- mock prompt artifact plan;
- mock output contract plan;
- mock runtime input plan;
- mock execution boundary plan;
- mock no-tool evidence plan;
- mock output capture/redaction plan;
- mock output review plan;
- mock findings block plan;
- nested smoke EPERM verification note;
- risk register;
- mock E2E approval envelope.

Future planned artifacts are referenced under `.codex-temp/external-tools/hermes-agent/install/75b300f/mock-e2e/`, but this gate does not create them.

## Decision

When accepted, the gate returns:

- `status: controlled_research_runtime_mock_e2e_plan_created`
- `decision: factory_owned_mock_runtime_e2e_plan_created_for_approval`
- `mockE2EPlanningStatus: plan_candidate_created`
- `canProceedToMockE2EApproval: true`
- `canProceedToMockE2EExecution: false`
- `canProceedToProviderRuntimePlanning: false`
- `canProceedToControlledResearchRuntimeExecution: false`
- `canRunResearchNow: false`

## Safety Manifest

Hermes CLI remains blocked. This is mock E2E planning only. Mock execution, provider runtime, controlled runtime execution, research, Hermes, prompts, model calls, network, DNS, credentials, env reads, toolsets, output ingestion, and findings remain blocked.

The nested smoke EPERM observation from the previous verification gate is recorded as `nestedSmokeEpermVerificationNote`. It is accepted for mock E2E planning because external allowed smokes passed, but it grants no runtime, provider runtime, output ingestion, or findings permission.

## Next Gate

Factory Hermes Controlled Research Runtime Mock E2E Approval Gate v1.
## Downstream Mock E2E Approval

Factory Hermes Controlled Research Runtime Mock E2E Approval Gate v1 now consumes this planning result. The approval gate may allow the next mock-only execution gate to proceed, but it does not execute mock E2E, create mock execution artifacts, approve provider runtime, ingest output, or promote findings.
## Mock E2E Execution Consumer

Factory Hermes Controlled Research Runtime Mock E2E Execution Gate v1 uses this plan only through the downstream approval gate. Execution is limited to deterministic local mock artifacts and the verified mock adapter; provider runtime and findings remain blocked.
## Mock E2E Review Consumer

Factory Hermes Controlled Research Runtime Mock E2E Review Gate v1 traces back to this planning gate to keep provider runtime planning separate from provider runtime execution.
