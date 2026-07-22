# Hermes Research Runtime Planning Gate v1

## Purpose

Factory Hermes Research Runtime Planning Gate v1 consumes the Python Install JEFE Review readiness envelope and produces a research runtime plan candidate.

## Relationship With JEFE Review

The JEFE Review Gate approves Python install readiness for planning only. This planning gate is the next step and still does not execute Hermes.

## What It Inspects

It reads local Hermes source metadata as text, including `pyproject.toml`, README files and known source folders, to identify possible runtime interface candidates.

## What It Does Not Do

It does not execute Hermes, Python, uv, pip, setup.py, scripts, Codex, model calls, network requests, scraping, credentials, deployment or project mutation.

## Plan Candidate

The plan candidate proposes filesystem boundaries, command policy, network policy, credential policy, model policy, input/output contracts, safety requirements and required next gates.

## Interface Candidate Handling

If exactly one interface candidate is identified, the gate may create a plan candidate ready for the boundary contract. If multiple or unclear candidates exist, it records `manual_selection_required`.

## Manual Selection Resolution

Manual selection is resolved by Factory Hermes Research Runtime Interface Selection Gate v1. That gate records Lean/JEFE selection of `pyproject-console-script-1` as the package entrypoint candidate for boundary design only.

The selection gate still does not execute Hermes or authorize runtime.

## Next Steps

- Factory Hermes Research Runtime Boundary Contract v1
- Factory Hermes Research Runtime Approval Gate v1
- Factory Hermes Research Runtime Adapter v1
- Factory Hermes Research Result Ingestion Gate v1
- Factory Hermes Research JEFE Review Gate v1
