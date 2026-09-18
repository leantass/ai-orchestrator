# Hermes Controlled Research Runtime Planning Gate v1

## Purpose

Factory Hermes Controlled Research Runtime Planning Gate v1 plans the first controlled Hermes research runtime using the prepared adapter, wrapper boundary, runtime selection, and approval chain.

This gate is planning-only. It does not execute research, adapter, wrapper, Hermes, `hermes.exe`, or `--oneshot`.

## Result

- `status`: `controlled_research_runtime_plan_created`
- `decision`: `hermes_controlled_research_runtime_plan_created_for_approval`
- `runtimePlanningStatus`: `plan_candidate_created`
- `selectedWrapperStrategy`: `wrapper_temp_config_no_toolsets`
- `canProceedToControlledResearchRuntimeApproval`: `true`
- `canProceedToControlledResearchRuntimeExecution`: `false`
- `canRunResearchNow`: `false`

## Plans

The gate creates policy plans for:

- controlled runtime boundary
- temp config creation
- run root creation
- credential access
- prompt passing
- model and network use
- toolset disable strategy
- timeout and kill switch
- output ingestion and findings review

## Not Authorized

- execute research, adapter, wrapper, Hermes, `hermes.exe`, or `--oneshot`
- create live temp config or run root
- send prompts
- call models
- use network, DNS, or endpoints
- read `.env`, env secrets, or credential values
- enable toolsets
- ingest real output or promote findings
- mutate Hermes source
- run uv, Python, pip, or setup.py

## Artifact

`.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-planning-result.json`

## Next Gate

Factory Hermes Controlled Research Runtime Approval Gate v1.

The approval gate may only decide whether the plan is ready for Controlled Research Runtime Preparation. It cannot prepare runtime or execute Hermes, adapter, wrapper, prompts, models, network, credentials, toolsets, temp config, run roots, ingestion, or findings.

Controlled Research Runtime Preparation may materialize only non-executable manifests and virtual/path-string candidates for review. Live runtime preparation and execution remain blocked.

Controlled Research Runtime Preparation Review may route only to Live Artifact Planning. It cannot create live artifacts or execute runtime.
