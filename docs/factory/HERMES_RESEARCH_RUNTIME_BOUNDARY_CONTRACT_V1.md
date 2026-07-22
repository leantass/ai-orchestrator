# Hermes Research Runtime Boundary Contract v1

## Purpose

Factory Hermes Research Runtime Boundary Contract v1 defines the future runtime boundary for the selected Hermes research interface.

It is a contract only. It does not create a runtime and does not approve execution.

## Relationship With Interface Selection

Interface Selection Gate v1 selected `pyproject-console-script-1`:

- commandName: `hermes`
- pythonEntrypoint: `hermes_cli.main:main`
- future executable candidate: `.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/Scripts/hermes.exe`

The boundary contract constrains how a later runtime approval and adapter may use that interface.

## Filesystem Boundary

Future read roots are limited to the Hermes source and isolated Python env under `.codex-temp`.

Future write roots are limited to:

- `.codex-temp/external-tools/hermes-agent/install/75b300f/research-runtime-output/`
- `.codex-temp/external-tools/hermes-agent/install/75b300f/research-runtime-temp/`

Project mutation is forbidden by default.

## Command Boundary

No commands are allowed now.

The future command candidate is `python-env/Scripts/hermes.exe` with:

- `shell: false`
- bounded cwd
- bounded args policy
- timeout required
- controlled or disabled stdin
- captured, sanitized, truncated stdout/stderr

Forbidden commands include shell, cmd.exe, PowerShell, pip, `python -m pip`, setup.py, `uv pip`, unrestricted `uv run`, curl, wget and arbitrary scripts.

## Network Boundary

Network is blocked now and blocked by default for future runtime. Any future network requires a separate approval.

## Credential Boundary

Credentials and `.env` reads are blocked now and blocked by default for future runtime. Any future secret use requires a separate approval.

## Model Boundary

Model calls are blocked now and blocked by default for future runtime. Any provider/model use requires a separate approval.

## IO Boundary

Future input must define research question, allowed sources, forbidden sources, constraints, max runtime and output schema.

Future output must include structured findings, evidence, warnings, confidence, sanitized raw logs and exit status.

## Safety Boundary

The future runtime requires timeout, kill switch, process-tree kill, log sanitization, result ingestion and JEFE review.

## What It Does Not Authorize

It does not authorize Hermes execution, selected interface execution, Python, uv, pip, setup.py, network, scraping, credentials, model calls, runtime creation, deployment or project mutation.

## Next Steps

- Factory Hermes Research Runtime Approval Gate v1
- Factory Hermes Research Runtime Adapter v1
- Factory Hermes Research Result Ingestion Gate v1
- Factory Hermes Research JEFE Review Gate v1

## Approval Gate Output

Factory Hermes Research Runtime Approval Gate v1 consumes this boundary contract and may approve only a future adapter candidate. It still does not create runtime, execute Hermes, use network, credentials or models.

## Adapter V1 Help Probe

Factory Hermes Research Runtime Adapter v1 may execute only the selected interface help probe, `hermes.exe --help`, with `shell:false`, bounded cwd, sanitized stdout/stderr and no research prompt.
