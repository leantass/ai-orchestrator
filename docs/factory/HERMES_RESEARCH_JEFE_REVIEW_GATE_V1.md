# Hermes Research JEFE Review Gate v1

## Purpose

Factory Hermes Research JEFE Review Gate v1 reviews the ingested Adapter V1 controlled block and decides only the next planning gate.

It does not materialize `hermes.exe`, install Hermes as a package, retry the adapter, execute Hermes, run uv, run Python, run pip, use network, use credentials or call models.

## Relationship With Result Ingestion

Result Ingestion classified `blocked_executable_missing` as `controlled_adapter_block` with `normalizedOutcome: entrypoint_executable_missing`.

JEFE Review accepts that controlled block as valid evidence that the selected package entrypoint wrapper is missing.

## Not A Research Result

The adapter did not execute Hermes and did not run a research prompt. The review therefore keeps `canTreatAsResearchResult` and `canUseFindings` false.

## No Automatic Repair

This gate approves only Factory Hermes Entrypoint Materialization Planning Gate v1. It does not authorize materialization, adapter retry or project installation.

## Review Receipt

The receipt records the human approval reference, adapter decision, classification, normalized outcome, scope and not authorized actions.

## Review Record

The review record documents JEFE's assessment, root cause and safety conclusion.

## Materialization Planning Envelope

The envelope carries the missing executable ref, source root, python env root, current install method and required planning questions into the next gate.

## Next Steps

- Factory Hermes Entrypoint Materialization Planning Gate v1.
- Factory Hermes Entrypoint Materialization Approval Gate v1.
- Factory Hermes Entrypoint Materialization Runtime Adapter v1.
- Factory Hermes Entrypoint Materialization Verification Gate v1.
- Factory Hermes Research Runtime Adapter Retry Gate v1.

## Planning Gate Output

Factory Hermes Entrypoint Materialization Planning Gate v1 consumes the planning envelope and may create a plan candidate only. It does not authorize uv sync, project install, wrapper creation or adapter retry.
