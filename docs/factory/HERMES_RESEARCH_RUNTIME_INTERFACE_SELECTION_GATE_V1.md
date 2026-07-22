# Hermes Research Runtime Interface Selection Gate v1

## Purpose

Factory Hermes Research Runtime Interface Selection Gate v1 consumes the Research Runtime Planning result, the manual interface selection dossier, and the explicit Lean/JEFE selected candidate id.

It produces an interface selection receipt and a selected interface envelope for the next boundary contract.

## Relationship With Planning And Dossier

The Planning Gate stopped at `manual_selection_required` because it detected multiple interface candidates. The dossier reviewed those candidates read-only and recommended `pyproject-console-script-1`.

This gate records that explicit selection. It does not reinterpret the source as permission to run Hermes.

## Selected Candidate

- selectedCandidateId: `pyproject-console-script-1`
- interfaceType: `package_entrypoint`
- commandName: `hermes`
- pythonEntrypoint: `hermes_cli.main:main`
- sourceDeclarationRef: `pyproject.toml [project.scripts]`
- futureExecutableCandidateWindows: `.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/Scripts/hermes.exe`

## Evidence

The dossier and source inspection found the package script declaration:

```text
hermes = "hermes_cli.main:main"
```

The README also documents `hermes` as the interactive CLI entry point.

## What It Does Not Do

This gate does not execute Hermes, Hermes scripts, Python, uv, pip, setup.py, network, model calls, credentials, deploys or project mutation.

It does not verify or execute the future executable candidate. The path is only a textual candidate for the next boundary contract.

## Receipt

The interface selection receipt records:

- selected candidate id;
- selected interface type;
- human approval reference;
- approved next gate;
- limitations;
- not authorized actions.

## Envelope

The selected interface envelope records:

- selected interface;
- source/install/python env refs;
- planning result ref;
- dossier ref;
- status `selected_for_boundary_only`;
- all execution, network, credential, model, deploy and mutation statuses as `not_allowed`.

## Why Hermes Is Still Not Executed

Selecting an interface only answers "which interface should a future boundary design around?" It does not answer whether runtime execution is safe. That requires the Research Runtime Boundary Contract v1 and later approval/runtime gates.

## Next Steps

- Factory Hermes Research Runtime Boundary Contract v1.

## Boundary Contract Output

Factory Hermes Research Runtime Boundary Contract v1 consumes this selected interface envelope and defines the future filesystem, command, network, credential, model, IO and safety boundaries.

The boundary contract still does not execute Hermes or approve runtime creation.
