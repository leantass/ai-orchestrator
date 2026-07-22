# Hermes Entrypoint Materialization Runtime Adapter v1

## Purpose

Factory Hermes Entrypoint Materialization Runtime Adapter v1 consumes the approved materialization envelope and attempts to generate the missing `hermes.exe` console script wrapper inside the existing Hermes Python env.

This adapter may run only the approved `uv sync` command. It does not execute Hermes, `hermes.exe`, Python directly, pip, setup.py directly, Hermes scripts, network clients, credentials or models.

## Approval Gate Relationship

The runtime requires `entrypoint-materialization-approval-result.json` with:

- status `approved_for_runtime_candidate`
- decision `hermes_entrypoint_materialization_approved_for_runtime_candidate`
- selected method `uv_sync_install_project_locked_existing_env`
- setup.py/build backend risk accepted only for bounded `uv sync`

## Command

The only command is:

`uv sync --locked --no-dev --project .codex-temp/external-tools/hermes-agent/install/75b300f/source`

The command is executed with `shell:false`, `cwd` set to the source root, and `UV_PROJECT_ENVIRONMENT` set to the existing Python env.

The command must not include `--no-install-project`.

## Environment

The runtime uses a sanitized environment. It adds:

- `UV_PROJECT_ENVIRONMENT`
- `UV_CACHE_DIR`
- `UV_NO_PROGRESS=1`
- `UV_OFFLINE=1`
- `PYTHONNOUSERSITE=1`
- `PIP_CONFIG_FILE=NUL`
- `NO_COLOR=1`
- `HERMES_NO_NETWORK=1`
- `HERMES_NO_MODEL_CALLS=1`
- `HERMES_NO_CREDENTIALS=1`

It does not print the full environment.

## Allowed Writes

- existing Hermes `python-env`
- `.codex-temp/external-tools/uv/cache/`
- entrypoint materialization logs
- materialization manifest/result JSON

No project files outside the approved roots may be mutated by JEFE.

## Build Backend Risk

Hermes uses `setuptools.build_meta` and has `setup.py` present. This runtime accepts that only through the approved `uv sync` project install path. Direct `setup.py`, pip or Python execution remains forbidden.

## Artifacts

- `.codex-temp/external-tools/hermes-agent/install/75b300f/entrypoint-materialization-runtime-manifest.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/entrypoint-materialization-runtime-result.json`

## Next Steps

- Factory Hermes Entrypoint Materialization Verification Gate v1.
- Factory Hermes Research Runtime Adapter Retry Gate v1 only after verification.

If runtime ends in `blocked_network_required` because a build dependency is missing from the offline uv cache, the result must be ingested by Factory Hermes Entrypoint Materialization Result Ingestion Gate v1 before any repair or dependency-cache planning.
## Controlled Cache Miss Handoff

If the runtime blocks because `UV_OFFLINE=1` cannot satisfy a build dependency such as `setuptools>=77,<83`, the result must be ingested and reviewed before any cache planning. The runtime adapter itself does not enable network, populate cache, retry materialization or execute Hermes.

Build Dependency Cache Planning keeps this runtime offline. Any future cache runtime must populate and verify the governed uv cache before this materialization runtime can be retried with `UV_OFFLINE=1`.
## Runtime Retry Path

The first materialization runtime can fail when the build backend dependency is missing from the offline cache. After Build Dependency Cache Runtime and Verification complete, `Factory Hermes Entrypoint Materialization Runtime Retry Gate v1` retries the project install with the verified cache and `UV_OFFLINE=1`.
