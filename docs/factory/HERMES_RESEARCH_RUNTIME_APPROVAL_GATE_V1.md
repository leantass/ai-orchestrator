# Hermes Research Runtime Approval Gate v1

## Purpose

Factory Hermes Research Runtime Approval Gate v1 reviews the Hermes Research Runtime Boundary Contract and approves only a future adapter candidate.

It does not create a runtime and does not execute Hermes.

## Relationship With Boundary Contract

The Boundary Contract defines filesystem, command, network, credential, model, IO and safety limits for the selected `hermes` interface. This approval gate confirms that the boundary is strict enough for a later adapter gate.

## What It Approves

- A future `Factory Hermes Research Runtime Adapter v1` may be built under the existing boundary.
- The adapter must use the selected interface only under boundary controls.
- The adapter must preserve `shell:false`, timeout, kill switch, process-tree kill, bounded cwd, bounded filesystem writes, sanitized stdout/stderr, result ingestion and JEFE review.

## What It Does Not Approve

- Direct Hermes execution.
- Runtime creation in this gate.
- Python, uv, pip or setup.py execution.
- Network, scraping, credentials or model calls.
- Project mutation or deploy.

## Approval Receipt

The receipt records the human approval reference, selected candidate, decision, scope and not authorized actions.

## Adapter Envelope

The envelope carries the selected interface, boundary summary, adapter readiness status and required adapter controls into the next gate.

Its execution scope is `future_runtime_adapter_only`.

## Future Adapter Authorization vs Direct Execution

This approval allows only the next adapter block to construct a governed runtime candidate. It is not a permission to invoke `hermes.exe` or the selected interface now.

## Restrictions

Network, credentials and model calls remain blocked by default and require separate future approvals.

## Next Steps

- Factory Hermes Research Runtime Adapter v1
- Factory Hermes Research Result Ingestion Gate v1
- Factory Hermes Research JEFE Review Gate v1

## Adapter V1 Output

The next adapter may run only `hermes.exe --help` in `help_probe_only` mode under the approved boundary. The help probe is not a research result and cannot use network, credentials or model calls.

Adapter output, including controlled blocks, must pass through Factory Hermes Research Result Ingestion Gate v1 before JEFE Review.
