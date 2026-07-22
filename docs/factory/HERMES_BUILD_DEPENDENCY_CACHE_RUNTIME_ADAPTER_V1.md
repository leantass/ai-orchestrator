# Factory Hermes Build Dependency Cache Runtime Adapter v1

## Purpose

This runtime adapter performs the approved cache prefetch for the missing Hermes build dependency `setuptools==81.0.0` / `setuptools>=77,<83`.

## Approval Boundary

It consumes `build-dependency-cache-approval-result.json` and may use network only for `cache_prefetch_only`. It does not authorize network for materialization.

## Command

The only external command is verified `uv.exe` with:

`sync --locked --no-dev --project .codex-temp/external-tools/hermes-agent/install/75b300f/source`

The command runs with `shell:false`, `UV_PROJECT_ENVIRONMENT` pointed at `build-dependency-cache-temp-env`, and `UV_CACHE_DIR` pointed at the governed uv cache.

## Metadata

The runtime writes command summaries, source/cache snapshots, lock-derived hashes/URLs and result metadata under `.codex-temp`.

## What It Does Not Do

It does not execute Hermes, materialize `hermes.exe`, retry materialization, retry the research adapter, run `uv run`, run `uv pip`, run `uv venv`, execute pip, execute Python directly, execute setup.py directly, use credentials, call models or mutate package files.

## Next Steps

1. Factory Hermes Build Dependency Cache Verification Gate v1
2. Factory Hermes Entrypoint Materialization Runtime Retry Gate v1
## Verification Handoff

The runtime adapter hands off to `Factory Hermes Build Dependency Cache Verification Gate v1` after `hermes_build_dependency_cache_prefetch_completed`. The verification gate is read-only and confirms cache metadata, key source hashes, safety flags, and absence of materialized `python-env/Scripts/hermes.exe` before any future Entrypoint Materialization Runtime Retry Gate.
## Retry Consumer

The cache produced by this runtime is consumed by `Factory Hermes Entrypoint Materialization Runtime Retry Gate v1` only after Cache Verification passes. The retry uses offline UV cache scope and does not reopen network access.
