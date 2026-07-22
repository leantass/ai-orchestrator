# Hermes Python Install Verification Gate v1

## Purpose

Factory Hermes Python Install Verification Gate v1 verifies the Hermes Python environment created by the Runtime Retry Gate.

It is a read-only artifact and filesystem verifier. It does not reinstall, resync, execute Python or execute Hermes.

## Relationship With Runtime Retry

Runtime Retry creates or reuses `.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/` using verified local uv. This gate verifies that result before JEFE review.

## What It Verifies

- Hermes install root and source root exist.
- `pyproject.toml` and `uv.lock` exist.
- `python-env` exists under `.codex-temp`.
- `pyvenv.cfg` exists and has non-empty content.
- Windows `Scripts/python.exe` exists but is not executed.
- Windows `Lib/site-packages/` exists.
- `python-install-manifest.json` and `python-install-result.json` parse and match the audited Hermes head.
- UV Provisioning Verification result is verified.
- Python install result is success with verified uv statuses.
- No forbidden command kinds or shell execution were recorded.

## What It Does Not Do

- No `uv venv`.
- No `uv sync`.
- No `uv run`.
- No `uv pip`.
- No pip.
- No direct Python execution.
- No `setup.py`.
- No Hermes execution.
- No Hermes scripts.
- No downloads or extraction.
- No package file mutation.

## Artifacts Read

- `.codex-temp/external-tools/hermes-agent/install/75b300f/python-install-manifest.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/python-install-result.json`
- `.codex-temp/external-tools/uv/provisioning-verification-result.json`

## Artifact Written

- `.codex-temp/external-tools/hermes-agent/install/75b300f/python-install-verification-result.json`

## Next Steps

Proceed to Factory Hermes Python Install JEFE Review Gate v1. After review, plan Research Runtime Planning Gate v1. Hermes execution is not authorized directly by this gate.

The JEFE Review Gate consumes this verification result and may approve only Research Runtime Planning readiness, not Hermes execution.
