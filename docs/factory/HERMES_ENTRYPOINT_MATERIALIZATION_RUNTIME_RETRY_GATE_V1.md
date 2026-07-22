# Hermes Entrypoint Materialization Runtime Retry Gate v1

## Purpose

This gate retries only Hermes entrypoint materialization after the Build Dependency Cache Verification Gate confirms that the missing build dependency cache is ready.

The target artifact is:

`.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/Scripts/hermes.exe`

## Relationship With Cache Verification

The retry consumes `approvedEntrypointMaterializationRuntimeRetryEnvelope` from `Factory Hermes Build Dependency Cache Verification Gate v1`.

The cache verification must be `verified` or `warning_verified` and must confirm:

- `setuptools==81.0.0` cached for `setuptools>=77,<83`;
- `cacheStatus: prefetched`;
- `metadataStatus: written`;
- future retry must use UV offline;
- future retry must not use network, pip, Python direct execution, setup.py direct execution, or Hermes execution.

## Only Executed Command

Executable:

`.codex-temp/external-tools/uv/bin/uv.exe`

Arguments:

`sync --locked --no-dev --project .codex-temp/external-tools/hermes-agent/install/75b300f/source`

Runtime:

- `cwd`: `.codex-temp/external-tools/hermes-agent/install/75b300f/source`
- `shell`: `false`
- `UV_PROJECT_ENVIRONMENT`: `.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/`
- `UV_CACHE_DIR`: `.codex-temp/external-tools/uv/cache/`
- `UV_OFFLINE=1`

The retry must not include `--no-install-project`.

## Writes

The runtime may write only within:

- the existing Hermes `python-env`;
- the governed UV cache;
- retry logs under `.codex-temp`;
- retry manifest/result JSON files.

## Not Executed

- Hermes or `hermes.exe`;
- selected interface;
- Hermes scripts;
- uv run;
- uv pip;
- uv venv;
- pip;
- Python direct;
- setup.py direct;
- network access;
- model calls;
- credentials;
- research adapter retry.

## Source Warnings

Known warnings are allowed when key source hashes remain unchanged:

- `hermes_agent.egg-info`;
- nested `.codex-temp` from a repaired prior runtime attempt.

Blocking source mutations include changed key hashes, `dist/`, `build/`, or `.venv/`.

## Outputs

- `.codex-temp/external-tools/hermes-agent/install/75b300f/entrypoint-materialization-runtime-retry-manifest.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/entrypoint-materialization-runtime-retry-result.json`

## Next Steps

If `hermes.exe` is materialized, proceed to `Factory Hermes Entrypoint Materialization Verification Gate v1`.

After verification, a separate gate may authorize a controlled Research Runtime Adapter retry. This runtime retry does not authorize that retry.
## Verification Handoff

Successful Runtime Retry hands off to `Factory Hermes Entrypoint Materialization Verification Gate v1`. The verification gate inspects `hermes.exe` read-only and does not execute the entrypoint.
