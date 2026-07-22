# Hermes Python Install Runtime Adapter v1

## Purpose

Factory Hermes Python Install Runtime Adapter v1 consumes an approved Python install envelope and performs the only allowed Python setup path for Hermes: an isolated `uv.lock` install under `.codex-temp`.

This runtime does not execute Hermes, run Hermes scripts, execute `setup.py`, call models, use credentials, mutate JEFE package files or deploy.

## Approval vs Runtime

Python Install Approval records human approval, method scope and envelope limits.

Python Install Runtime enforces that envelope against real paths and commands. It may create `.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/` and may execute only allowlisted `uv` commands with `shell:false`.

## Method Scope

Only `uv_lock_isolated_only` is supported in v1. Any other method scope blocks the runtime.

## Command Allowlist

Allowed commands:

- `uv --version`
- `uv venv <pythonEnvRoot>`
- `uv sync --locked --no-install-project --no-dev --project <sourceRoot>`

Forbidden commands include `uv run`, `uv pip install`, `pip`, `python -m pip`, `python setup.py`, `setup.py`, `run_agent.py`, `cli.py`, `install.sh`, `install.ps1` and any Hermes script.

## Sanitized Environment

The runtime removes secret-like variables and keeps only minimal process variables required to locate executables and temporary paths. It adds:

- `UV_PROJECT_ENVIRONMENT=<pythonEnvRoot>`
- `UV_NO_PROGRESS=1`
- `PYTHONNOUSERSITE=1`
- `PIP_CONFIG_FILE=NUL` on Windows or `/dev/null` on POSIX

It does not read `.env` or credential config.

## Why No pip Or setup.py

The approved scope is lockfile-driven `uv` setup only. `pip install`, `python -m pip`, global package installation and direct `setup.py` execution are outside the envelope and remain forbidden.

## Why No Hermes Execution

Python dependency installation is not Hermes runtime authorization. Hermes execution requires later runtime planning, verification and JEFE review gates.

## Manifest And Result

The runtime writes:

- `.codex-temp/external-tools/hermes-agent/install/75b300f/python-install-manifest.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/python-install-result.json`

These artifacts record the audited head, paths, command summary, status fields and next required gate.

## Next Steps

If the runtime succeeds, create Factory Hermes Python Install Verification Gate v1. Only after verification should Hermes Research Runtime Adapter planning begin.

## Retry After UV Verification

If the original runtime blocked because uv was unavailable, Hermes Python Install Runtime Retry Gate v1 is the only allowed retry path after UV Provisioning Verification Gate v1 passes. The retry uses the same isolated env and lockfile scope, still without pip, setup.py, Hermes scripts or Hermes execution.
