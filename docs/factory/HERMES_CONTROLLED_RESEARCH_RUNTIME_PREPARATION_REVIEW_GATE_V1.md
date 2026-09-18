# Hermes Controlled Research Runtime Preparation Review Gate v1

## Purpose

Factory Hermes Controlled Research Runtime Preparation Review Gate v1 reviews the non-executable preparation artifacts for the first controlled Hermes research runtime.

It does not prepare live runtime, create live temp config, write `config.yaml`, create a real run root, execute Hermes, execute `hermes.exe`, execute `--oneshot`, execute a wrapper against Hermes, pass prompts, call models, use network, read credentials, enable toolsets, ingest output, or promote findings.

## Result

- `status`: `controlled_research_runtime_preparation_review_completed`
- `decision`: `hermes_controlled_research_runtime_preparation_review_accepted_for_live_artifact_planning`
- `preparationReviewStatus`: `accepted_with_limitations`
- `selectedWrapperStrategy`: `wrapper_temp_config_no_toolsets`
- `controlledRuntimeLiveArtifactPlanningAllowed`: `true`
- `canProceedToControlledResearchRuntimeLiveArtifactPlanning`: `true`
- `canProceedToControlledResearchRuntimeLiveArtifactCreation`: `false`
- `canProceedToControlledResearchRuntimeExecution`: `false`
- `canRunResearchNow`: `false`

## Reviewed Artifacts

- preparation artifacts review
- virtual temp config candidate review
- run root path validation review
- credential reference boundary review
- prompt reference policy review
- model/network allowlist review
- toolset disable proof requirements review
- timeout/kill switch envelope review
- output ingestion contract review
- limitations carry-forward
- risk disposition register
- live artifact planning envelope

## Next Gate

Factory Hermes Controlled Research Runtime Live Artifact Planning Gate v1.

Live Artifact Verification carries this review boundary forward by reading preparation-review lineage only; it does not convert preparation review into runtime execution approval.

The live artifact planning gate may only plan future artifact creation boundaries. It cannot create `config.yaml`, create run roots, execute Hermes, use network, read credentials, enable toolsets, ingest output, or promote findings.
