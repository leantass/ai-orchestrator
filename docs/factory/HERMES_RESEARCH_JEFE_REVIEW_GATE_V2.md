# Hermes Research JEFE Review Gate v2

## Purpose

Factory Hermes Research JEFE Review Gate v2 consumes Research Result Ingestion Gate v2 output and produces a formal JEFE review of the successful help probe.

It approves only future research execution planning. It does not run Hermes, pass prompts, call models, use network, read credentials, run uv, pip, Python or setup.py.

## Relationship With Ingestion v2

The reviewed input must be:

- `status: ingested`
- `classification: controlled_help_probe_success`
- `normalizedOutcome: hermes_help_probe_succeeded`
- `canTreatAsResearchResult: false`
- `canUseFindings: false`

The help probe proves the CLI is callable under boundary. It does not prove research quality and cannot become findings.

## What It Approves

- Factory Hermes Research Execution Planning Gate v1.

The planning envelope lists questions about command shape, prompt boundaries, model/network/credential needs, output contract, timeout limits and the first harmless research task.

## What It Does Not Approve

- No research runtime.
- No direct Hermes execution.
- No prompt passing.
- No network, credentials or model calls.
- No uv, pip, Python or setup.py.
- No project mutation or deploy.

## Next Steps

- Factory Hermes Research Execution Planning Gate v1.
- Factory Hermes Research Execution Approval Gate v1.
- Factory Hermes Research Execution Boundary Gate v1.
- Factory Hermes Research Execution Runtime Adapter v1.
- Factory Hermes Research Execution Result Ingestion Gate v1.
- Factory Hermes Research Execution JEFE Review Gate v1.
## Output To Research Execution Planning

JEFE Review v2 routes only to Factory Hermes Research Execution Planning Gate v1. The planning gate may inspect help/source evidence read-only and decide whether a future command approval candidate exists. JEFE Review v2 still does not authorize prompt passing, research execution, network, credentials or model calls.
## Follow-Up: Research Execution Policy Chain

Research JEFE Review v2 can feed Research Execution Planning, but it does not authorize real Hermes research execution. When execution planning requires manual command review, the next safe step is Factory Hermes Research Execution Policy Chain Planning Gate v1.
