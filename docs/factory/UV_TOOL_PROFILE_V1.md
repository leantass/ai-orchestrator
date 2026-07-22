# UV Tool Profile v1

## Purpose In JEFE

uv is governed as an external Python package manager runtime. Its first factory use is isolated Python environment provisioning for Hermes.

## Why Hermes Needs uv

Hermes Python Install Runtime Adapter v1 uses an approved `uv_lock_isolated_only` envelope. The runtime correctly blocked when `uv` was not available on PATH and did not fall back to pip, setup.py, shell, cmd.exe or PowerShell.

## Current Status

- Status: `missing_from_path_based_on_previous_runtime`
- Source: Factory Hermes Python Install Runtime Adapter v1 result
- Decision: `blocked_uv_executable_not_found`

## Future Allowlisted Commands

- `uv --version`
- `uv venv <envRoot>`
- `uv sync --locked --no-install-project --no-dev --project <sourceRoot>`

## Forbidden Commands

- `uv run`
- `uv pip install`
- `uv tool`
- `pip`
- `python -m pip`
- `setup.py`
- shell/cmd/PowerShell
- curl/wget/irm/iwr
- any Hermes script

## Candidate Methods

1. `system_path_existing_uv`: use only if uv already exists on PATH and passes a future verification gate.
2. `local_uv_binary_under_codex_temp`: future local binary under `.codex-temp/external-tools/uv/`, requiring official source, checksum and runtime approval.
3. `blocked_no_uv_available`: current known blocked state.

## Future Install Roots

- `.codex-temp/external-tools/uv/`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/`

## Future Verification

A future verification gate must confirm official source, checksum strategy, executable identity, command allowlist and install roots before uv can be used.

## Runtime Adapter v1

UV Provisioning Runtime Adapter v1 may verify an existing `uv.exe` on PATH or provision `uv.exe` under `.codex-temp/external-tools/uv/bin/uv.exe` from the official Windows x64 release artifact after checksum verification.

The only runtime command allowed by this adapter is `uv --version`.

GitHub Release asset redirects may use `release-assets.githubusercontent.com` as an exact HTTPS host for official artifact/checksum downloads only. No wildcard GitHub/GitHubusercontent hosts are authorized.

UV Provisioning Verification Gate v1 verifies the local runtime manifest/result, checksum status, executable containment and `uv --version` recheck before uv may support a future Hermes Python Runtime retry.

## Hermes Retry Relationship

Hermes Python Install Runtime must not be retried directly. The next step is UV Provisioning Approval/Runtime, followed by uv verification, then a separately approved Hermes Python Runtime retry.
