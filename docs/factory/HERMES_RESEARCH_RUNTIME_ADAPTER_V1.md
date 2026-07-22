# Hermes Research Runtime Adapter v1

## Purpose

Factory Hermes Research Runtime Adapter v1 consumes the approved adapter envelope and performs the first controlled handshake with the selected Hermes interface.

The only command allowed in v1 is:

`.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/Scripts/hermes.exe --help`

## Relationship With Approval And Boundary

The adapter requires:

- Research Runtime Approval status `approved_for_adapter_candidate`.
- Boundary Contract status `boundary_contract_created`.
- Selected interface `pyproject-console-script-1`.
- `commandName: hermes`.
- `pythonEntrypoint: hermes_cli.main:main`.
- `shell:false`.

## Mode

The only supported mode is `help_probe_only`.

This mode verifies that the selected entrypoint exists and can return help or usage output. It is not a research request and its output must not be treated as findings.

## Runtime Controls

- `execFile` with `shell:false`.
- Args exactly `["--help"]`.
- CWD bounded to the Hermes source root.
- Timeout default `30000ms`, hard maximum `60000ms`.
- stdin closed.
- stdout/stderr captured, sanitized and truncated.
- Output and temp roots bounded under `.codex-temp`.

## Environment

The runtime passes a minimal sanitized environment and sets:

- `HERMES_FACTORY_MODE=help_probe_only`
- `PYTHONNOUSERSITE=1`
- `NO_COLOR=1`
- `HERMES_DISABLE_TELEMETRY=1`
- `HERMES_NO_NETWORK=1`
- `HERMES_NO_MODEL_CALLS=1`
- `HERMES_NO_CREDENTIALS=1`

It does not read `.env` and does not print the full environment.

## What This Adapter Does Not Do

- No research prompt.
- No interactive Hermes session.
- No Hermes scripts.
- No uv, pip, direct Python or setup.py.
- No network, credentials or model calls.
- No project mutation or deploy.

## Controlled Failure

If `hermes.exe` is missing, the adapter writes `research-runtime-adapter-result.json` with `decision: blocked_executable_missing`. This is a controlled result that can proceed to Result Ingestion as an error artifact, but it is not a research result.

This controlled block must be ingested by Factory Hermes Research Result Ingestion Gate v1 before any entrypoint materialization repair is planned.

## Next Steps

- Factory Hermes Research Result Ingestion Gate v1.
- Factory Hermes Research JEFE Review Gate v1.
- A future research task runtime only after separate approval.

## JEFE Review

After ingestion, Factory Hermes Research JEFE Review Gate v1 decides whether to approve entrypoint materialization planning. Adapter V1 does not authorize that repair directly.

## Materialization Planning

`blocked_executable_missing` is routed through JEFE Review into Entrypoint Materialization Planning. Planning does not rerun the adapter and does not create `hermes.exe`.
## Retry Prerequisite

Research Runtime Adapter retry is allowed only after `Factory Hermes Entrypoint Materialization Verification Gate v1` verifies the materialized `hermes.exe` and emits an approved adapter retry envelope.

## Retry Gate

Factory Hermes Research Runtime Adapter Retry Gate v1 consumes that envelope and retries only the bounded help probe. Its output is routed to Research Result Ingestion Gate v2 and must not be treated as research findings.
