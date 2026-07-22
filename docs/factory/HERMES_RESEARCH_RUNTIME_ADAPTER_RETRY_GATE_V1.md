# Hermes Research Runtime Adapter Retry Gate v1

## Purpose

Factory Hermes Research Runtime Adapter Retry Gate v1 consumes the verified entrypoint materialization result and performs the bounded retry of the selected Hermes interface.

The only command authorized by this gate is:

`.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/Scripts/hermes.exe --help`

The command is executed with `shell:false`, from the governed Hermes source root, with sanitized output capture.

## Prerequisite

This gate requires `Factory Hermes Entrypoint Materialization Verification Gate v1` to have emitted an approved retry envelope for `pyproject-console-script-1`:

- `commandName: hermes`
- `pythonEntrypoint: hermes_cli.main:main`
- executable under `.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/Scripts/hermes.exe`
- args exactly `["--help"]`
- no network, credentials, or model calls

## What It Does

- Verifies the materialized executable still exists.
- Verifies the executable hash matches the verification result.
- Executes only the help probe with `execFile` and `shell:false`.
- Captures sanitized and truncated stdout/stderr previews.
- Writes a manifest and result under `.codex-temp`.
- Allows progression only to `Factory Hermes Research Result Ingestion Gate v2`.

## What It Does Not Do

- No research request.
- No prompt assembly.
- No model calls.
- No network or credentials.
- No uv, pip, direct Python, setup.py, or Hermes scripts.
- No materialization retry.
- No cache runtime retry.
- No project mutation or deploy.

Help output is interface evidence only. It must not be treated as research findings.

## Controlled Failure

If the help probe fails, times out, or shows a boundary concern, the gate writes a controlled failure result for ingestion. It does not fallback to another interface, shell, Python, uv, pip, or setup.py.

## Outputs

- `research-runtime-adapter-retry-manifest.json`
- `research-runtime-adapter-retry-result.json`

The result records command status, sanitized previews, safe execution flags, and the next required gate.

## Next Steps

- Factory Hermes Research Result Ingestion Gate v2.
- A future JEFE review before any research runtime execution.

## Result Ingestion v2

The retry result must be consumed by Factory Hermes Research Result Ingestion Gate v2. That gate classifies `--help` output as operational health evidence only, not as research findings.

After ingestion, Factory Hermes Research JEFE Review Gate v2 must review the evidence before any Research Execution Planning. The retry gate never authorizes direct research runtime.
## Planning Use Of Help Probe

The sanitized help output from the retry may be used by Research Execution Planning to identify candidate command shapes. That planning use remains read-only and does not authorize running `--oneshot`, passing prompts, enabling network, credentials or model calls.
