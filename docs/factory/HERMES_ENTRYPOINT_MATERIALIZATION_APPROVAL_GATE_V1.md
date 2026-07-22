# Hermes Entrypoint Materialization Approval Gate v1

## Purpose

Factory Hermes Entrypoint Materialization Approval Gate v1 reviews the planning candidate for generating the missing `hermes.exe` wrapper and approves only a future runtime envelope.

It does not materialize the entrypoint, run `uv sync`, run Python, pip, setup.py or Hermes, retry the adapter, use network, credentials or models.

## Input

The gate consumes `.codex-temp/external-tools/hermes-agent/install/75b300f/entrypoint-materialization-planning-result.json`.

The accepted planning candidate is:

- command: `hermes`
- Python entrypoint: `hermes_cli.main:main`
- method: `uv_sync_install_project_locked_existing_env`
- future executable: `.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/Scripts/hermes.exe`
- verified uv executable reference: `.codex-temp/external-tools/uv/bin/uv.exe`

## Risk Acceptance

Hermes source contains `setup.py` and uses `setuptools.build_meta`. This gate records explicit risk acceptance only for a future controlled `uv sync --locked --no-dev --project <sourceRoot>` materialization runtime.

Direct `setup.py` execution remains forbidden.

## Approval Receipt

The receipt records reviewer identity, human approval reference, selected method, setup.py/build backend risk acceptance and actions not authorized in this gate.

## Runtime Envelope

The envelope allows only the next gate, Factory Hermes Entrypoint Materialization Runtime Adapter v1, to attempt bounded materialization.

The future runtime command candidate is:

`uv sync --locked --no-dev --project <sourceRoot>`

with `shell:false`, sanitized environment policy and writes constrained to the Hermes Python env, uv cache and materialization logs under `.codex-temp`.

## Not Authorized

- materialize entrypoint now
- execute uv or uv sync now
- execute Python, pip or setup.py directly
- execute Hermes or Hermes scripts
- retry adapter now
- use network, credentials or models
- mutate project files outside the approved Python env
- deploy

## Next Steps

- Factory Hermes Entrypoint Materialization Runtime Adapter v1.
- Factory Hermes Entrypoint Materialization Verification Gate v1.
- Factory Hermes Research Runtime Adapter Retry Gate v1.

## Runtime Handoff

The approved envelope is consumed by Factory Hermes Entrypoint Materialization Runtime Adapter v1. That runtime may execute only `uv sync --locked --no-dev --project <sourceRoot>` with `shell:false`, `UV_OFFLINE=1` and `UV_PROJECT_ENVIRONMENT` pointing at the existing python-env.

Runtime results, including controlled offline cache misses, must be routed through Factory Hermes Entrypoint Materialization Result Ingestion Gate v1 before JEFE decides repair planning.
