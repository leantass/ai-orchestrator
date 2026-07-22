# UV Provisioning Verification Gate v1

## Purpose

UV Provisioning Verification Gate v1 verifies the already provisioned local uv binary before any future Hermes Python Runtime retry.

## Relationship With UV Provisioning Runtime

The runtime downloads, checksum-verifies, extracts and version-checks uv. This verification gate reads the runtime manifest/result and rechecks only `uv.exe --version`.

## What It Verifies

- `provisioning-manifest.json` exists and parses.
- `provisioning-result.json` exists and parses.
- uv provisioning status is success.
- checksum fields are present and equal for downloaded artifacts.
- local `uv.exe` is contained under `.codex-temp/external-tools/uv/bin/uv.exe`.
- previous and current command results use `shell:false`.
- no uv project operation, pip, Python, setup.py or Hermes command was run.

## What It Does Not Do

It does not download, extract, provision, install globally, mutate PATH, execute uv project operations, run pip, run Python, run setup.py, execute Hermes or retry Hermes Python Runtime.

## Artifacts Read

- `.codex-temp/external-tools/uv/provisioning-manifest.json`
- `.codex-temp/external-tools/uv/provisioning-result.json`

## Version Recheck

The only allowed command is `.codex-temp/external-tools/uv/bin/uv.exe --version` with `shell:false` and a sanitized environment.

## Next Steps

Hermes Python Install Runtime Retry Gate v1 may consume this verification result and run only verified local `uv --version`, `uv venv` and locked `uv sync` for the isolated Hermes Python environment. After that, run Python Install Verification Gate before Research Runtime planning.

Hermes Python Install Verification Gate v1 verifies that consumption after retry without running uv project operations, pip, Python, setup.py or Hermes.
