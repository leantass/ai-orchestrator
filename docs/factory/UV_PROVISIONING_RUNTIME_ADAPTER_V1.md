# UV Provisioning Runtime Adapter v1

## Purpose

UV Provisioning Runtime Adapter v1 provisions the governed `uv` binary for JEFE under `.codex-temp/external-tools/uv/` or verifies an existing `uv.exe` on PATH.

## Relationship With UV Tool Profile

The UV Tool Profile declares allowed future commands and forbidden commands. This runtime uses only the version-check command: `uv --version`.

## Relationship With Provisioning Approval

The runtime requires an approved External Tool Provisioning Approval result and approved tool provisioning envelope for `uv`.

## Supported Methods

- `system_path_existing_uv`: passive PATH detection, followed by `uv --version` with `shell:false`.
- `local_uv_binary_under_codex_temp`: official release download, checksum verification, safe ZIP extraction and `uv --version`.

## Platform Support

v1 supports Windows x64 only. Other platforms block before download or execution.

## Official Sources And Checksum

The runtime uses GitHub Releases metadata for `astral-sh/uv`, selects `uv-x86_64-pc-windows-msvc.zip`, requires `uv-x86_64-pc-windows-msvc.zip.sha256`, and verifies SHA256 before extraction.

Allowlisted HTTPS hosts are exact only: `api.github.com`, `github.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com`, and `releases.astral.sh`. `release-assets.githubusercontent.com` is allowed only as a GitHub Release asset redirect/download host for the artifact and checksum; it does not authorize commands, credentials, shell, curl/wget, global install, or PATH mutation.

## Safe Extraction

ZIP extraction is local Node code with minimal ZIP64 support for the official uv artifact. It reads ZIP64 EOCD locator/record and ZIP64 extra field `0x0001` for sizes and local header offsets, rejects multi-disk archives, encrypted entries, path traversal, absolute paths, symlinks, oversized entries and unsupported compression methods. It extracts only `uv.exe` and optional `uvx.exe` into `.codex-temp/external-tools/uv/bin/`.

## Sanitized Environment

The runtime removes secret-shaped variables and keeps only minimal OS temp/path variables. It adds `UV_NO_PROGRESS=1` and `PYTHONNOUSERSITE=1`.

## Only Allowed Command

- `uv --version`

## Forbidden Commands

- `uv venv`
- `uv sync`
- `uv run`
- `uv pip`
- `pip`
- `python`
- `setup.py`
- Hermes commands or scripts

## Manifest And Result

The runtime writes `.codex-temp/external-tools/uv/provisioning-manifest.json` and `.codex-temp/external-tools/uv/provisioning-result.json`.

## Next Steps

Run UV Provisioning Verification Gate v1. Hermes Python Runtime retry must be a separate future block after verification.

UV Provisioning Verification Gate v1 now performs the follow-up verification by reading the manifest/result artifacts and rechecking only `uv --version`; it does not download or extract again.
