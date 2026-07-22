# Hermes Python Install Runtime Retry Gate v1

## Purpose

Hermes Python Install Runtime Retry Gate v1 retries only the previously blocked Hermes Python install path after uv has been provisioned and verified by JEFE.

## Preconditions

- Hermes install root exists under `.codex-temp/external-tools/hermes-agent/install/75b300f/`.
- Hermes source root contains `pyproject.toml` and `uv.lock`.
- UV Provisioning Verification Gate v1 produced a verified result.
- The local uv executable is `.codex-temp/external-tools/uv/bin/uv.exe`.

## Allowed Commands

- `.codex-temp/external-tools/uv/bin/uv.exe --version`
- `.codex-temp/external-tools/uv/bin/uv.exe venv .codex-temp/external-tools/hermes-agent/install/75b300f/python-env/`
- `.codex-temp/external-tools/uv/bin/uv.exe sync --locked --no-install-project --no-dev --project .codex-temp/external-tools/hermes-agent/install/75b300f/source`

All commands must use `shell:false` and a sanitized environment.

## Forbidden Actions

The retry gate does not run `uv run`, `uv pip`, `uv tool`, `pip`, Python directly, `setup.py`, Hermes, Hermes scripts, model calls, deployments or credential access.

## Artifacts

The runtime writes:

- `.codex-temp/external-tools/hermes-agent/install/75b300f/python-install-manifest.json`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/python-install-result.json`

These artifacts record uv verification, command summaries, Python env root, status fields and the next required gate.

## Next Step

After success, proceed to Factory Hermes Python Install Verification Gate v1. Hermes execution remains forbidden.

## Post-Runtime State

After a successful retry, `.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/` exists by design. Earlier planning smokes must treat that directory as a later runtime artifact, not as evidence that Strategy created or authorized runtime work.

## Idempotency

The retry gate is idempotent after success. If `python-env` already exists with a successful `python-install-result.json`, it rechecks only verified local `uv --version`, reuses the existing success, and does not run `uv venv` or `uv sync` again. If the env exists but the result is missing or non-success, the gate may skip `uv venv` and confirm the existing env with locked `uv sync`; it never deletes, clears or recreates the env.

## Verification Gate

The required follow-up is Factory Hermes Python Install Verification Gate v1. That verifier is read-only and checks the env, manifest/result and UV verification before JEFE review.
