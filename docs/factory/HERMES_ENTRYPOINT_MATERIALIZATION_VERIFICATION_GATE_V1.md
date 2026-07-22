# Hermes Entrypoint Materialization Verification Gate v1

## Purpose

This read-only gate verifies that `python-env/Scripts/hermes.exe` was materialized by the approved Entrypoint Materialization Runtime Retry Gate.

It does not execute `hermes.exe`, Hermes, uv, pip, Python, setup.py, network, credentials, models, or the research adapter.

## Verification

The gate checks:

- Runtime Retry result and manifest are present.
- Runtime Retry completed with `hermes_entrypoint_materialized_after_cache_verified_retry`.
- `hermes.exe` exists under the governed Python env `Scripts` directory.
- `hermes.exe` size is greater than zero.
- `hermes.exe` SHA256 is recorded.
- source key hashes remain unchanged.
- known source warnings are warning-only.

## Outputs

- `entrypointMaterializationVerificationReceipt`
- `hermesEntrypointMaterializationVerificationRecord`
- `approvedResearchRuntimeAdapterRetryEnvelope`

The envelope only authorizes a future `Factory Hermes Research Runtime Adapter Retry Gate v1`. It keeps `retryAllowedNow: false` and permits only a future help probe envelope with `["--help"]`, `shell:false`, sanitized output, no network, no credentials, and no model calls.

## Next Steps

- Factory Hermes Research Runtime Adapter Retry Gate v1
- Factory Hermes Research Result Ingestion Gate v2
- Factory Hermes Research JEFE Review Gate v2

## Adapter Retry Handoff

The verification envelope is consumed by Factory Hermes Research Runtime Adapter Retry Gate v1. That retry may execute only `hermes.exe --help` with `shell:false`; it does not authorize research prompts, network, credentials, model calls, uv, pip, direct Python, setup.py, Hermes scripts, or project mutation.
