# Hermes Controlled Research Runtime Preparation Gate v1

## Purpose

Factory Hermes Controlled Research Runtime Preparation Gate v1 prepares non-executable artifacts and manifests for the first controlled Hermes research runtime.

It does not prepare a live runtime, create a live temp config, create a real run root, execute Hermes, execute `hermes.exe`, execute `--oneshot`, execute a wrapper against Hermes, pass prompts, call models, use network, read credentials, enable toolsets, ingest real output, or promote findings.

## Result

- `status`: `controlled_research_runtime_prepared`
- `decision`: `hermes_controlled_research_runtime_prepared_for_preparation_review`
- `preparationStatus`: `prepared_non_executing_runtime_artifacts`
- `selectedWrapperStrategy`: `wrapper_temp_config_no_toolsets`
- `canProceedToControlledResearchRuntimePreparationReview`: `true`
- `canProceedToControlledResearchRuntimeExecution`: `false`
- `canRunResearchNow`: `false`

## Prepared Artifacts

- runtime preparation manifest
- virtual temp config candidate
- run root path validation manifest
- credential reference boundary
- prompt reference policy
- model/network allowlist policy
- toolset disable proof requirements
- timeout/kill switch envelope
- output ingestion contract
- preparation risk register
- preparation review envelope

## Non-Execution Boundary

The temp config candidate is virtual only and no `config.yaml` is written. The run root is a path string only and no directory is created. Credential handling is by reference only and no `.env`, process env, or credential value is read.

## Artifact

`.codex-temp/external-tools/hermes-agent/install/75b300f/controlled-research-runtime-preparation-result.json`

## Next Gate

Factory Hermes Controlled Research Runtime Preparation Review Gate v1.

The review gate may only decide whether these non-executable artifacts support Live Artifact Planning. It cannot create live config, create a real run root, execute Hermes, pass prompts, use network, read credentials, enable toolsets, ingest output, or promote findings.

Live Artifact Planning remains planning-only and cannot create live artifacts or execute runtime.
