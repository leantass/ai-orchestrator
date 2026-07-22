# Hermes Research Result Ingestion Gate v2

## Purpose

Factory Hermes Research Result Ingestion Gate v2 consumes the Research Runtime Adapter Retry result and classifies the `hermes.exe --help` probe as operational health evidence only.

It does not execute Hermes, rerun the adapter retry, pass prompts, call models, use network, read credentials, run uv, pip, direct Python or setup.py.

## Relationship With Adapter Retry

The required input is `research-runtime-adapter-retry-result.json` produced by Factory Hermes Research Runtime Adapter Retry Gate v1. The only ingestable success path is:

- `decision: hermes_research_runtime_adapter_retry_help_probe_succeeded`
- command args exactly `["--help"]`
- `shell:false`
- `canTreatAsResearchResult: false`
- `canUseFindings: false`

## Classification

For a successful help probe, v2 emits:

- `classification: controlled_help_probe_success`
- `normalizedOutcome: hermes_help_probe_succeeded`
- `decision: hermes_research_result_ingested_help_probe_success`

The help output proves the entrypoint can respond to the help command. It is not research content and cannot become findings.

## Receipt And Record

The receipt records the ingestion boundary, approved next gate, limitations and not-authorized actions.

The record stores normalized evidence such as command args, shell mode, sanitized preview status and truncation flags. It intentionally does not store full stdout/stderr, environment dumps, secrets or credentials.

## Next Steps

- Factory Hermes Research JEFE Review Gate v2.

Any future research runtime still requires a separate JEFE review and runtime approval boundary.

## JEFE Review v2

Factory Hermes Research JEFE Review Gate v2 consumes this result and may approve only Research Execution Planning. It cannot authorize immediate research runtime or treat help output as findings.
## Downstream Planning Boundary

The ingested help probe can support JEFE Review v2 and later Research Execution Planning only as operational evidence. It must not be treated as findings, and it does not authorize direct Hermes execution, prompt passing, network, credentials or model calls.
