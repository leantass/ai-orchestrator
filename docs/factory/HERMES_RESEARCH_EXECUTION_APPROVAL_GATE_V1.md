# Hermes Research Execution Approval Gate v1

## Purpose

Factory Hermes Research Execution Approval Gate v1 evaluates the approved retry, prepared runtime adapter, wrapper boundary evidence, and runtime selection record to decide whether the flow may proceed to controlled runtime planning.

It does not approve immediate runtime execution.

## Accepted Result

- `status`: `research_execution_approval_granted`
- `decision`: `hermes_research_execution_approval_granted_for_controlled_runtime_planning`
- `executionApprovalStatus`: `approved_for_controlled_runtime_planning_only`
- `selectedWrapperStrategy`: `wrapper_temp_config_no_toolsets`
- `controlledResearchRuntimePlanningAllowed`: `true`
- `canProceedToControlledResearchRuntimePlanning`: `true`
- `canRunResearchNow`: `false`

## Readiness Review

The gate records `executionReadinessReview` with:

- execution approval retry granted
- research runtime adapter prepared code-only
- wrapper boundary integrated
- adapter command envelope non-executable
- wrapper verification review accepted
- provider/model/credential ref/host known
- no live temp config
- no run root created
- no prompt available for execution
- no credential values available
- no network, model calls, or toolsets approved

## Not Authorized

- execute research, adapter, wrapper, Hermes, `hermes.exe`, or `--oneshot`
- create live temp config or run root
- pass prompt
- call models
- use network, DNS, or endpoints
- read `.env`, env secrets, or credential values
- enable toolsets
- ingest real output or promote findings
- mutate Hermes source
- run uv, Python, pip, or setup.py

## Artifact

`.codex-temp/external-tools/hermes-agent/install/75b300f/research-execution-approval-result.json`

## Next Gate

Factory Hermes Controlled Research Runtime Planning Gate v1.

Controlled runtime planning may only create policy and approval artifacts; it cannot prepare or execute runtime.

Controlled Research Runtime Approval may only approve the later Preparation Gate. It remains separate from execution and cannot create live runtime artifacts, pass prompts, use network, read credentials, call models, enable toolsets, ingest output, or promote findings.

Controlled Research Runtime Preparation remains non-executing: it prepares review artifacts and policies only, with no live config, run root, prompt, credential, network, model, toolset, output, findings, adapter, wrapper, or Hermes execution.
