# Hermes Python Install Approval Gate v1

## Purpose

Factory Hermes Python Install Approval Gate v1 converts a ready Python Install Strategy into an approval receipt and an approved Python install envelope for a future runtime adapter.

It is a human approval boundary. It does not install Python dependencies, execute `uv`, execute `pip`, run `setup.py`, create a venv, execute Hermes, run Hermes scripts, call models, read credentials, deploy, or mutate JEFE package files.

## Strategy vs Approval vs Runtime

Python Strategy identifies the Python surfaces and recommends an isolated future install method.

Python Approval reviews that strategy, records human approval, and scopes the future runtime candidate.

Python Runtime, if later authorized, is the only block that may perform a controlled Python dependency operation under the approved envelope.

## What This Gate Approves

- An `approvalReceipt` for `hermes_python_install_runtime_candidate`.
- An `approvedPythonInstallEnvelope` for the audited Hermes source and isolated `.codex-temp` Python env root.
- A method scope derived from `managerDecision`.

## What This Gate Does Not Approve

- Installing Python dependencies now.
- Executing `uv`, `pip`, `setup.py`, Hermes, Hermes scripts, Codex, models, deploys or publish steps.
- Reading `.env` or credentials.
- Mutating `package.json`, `package-lock.json`, JEFE runtime, UI, IPC, databases or generated projects.

## Approval Receipt

The receipt records `approvalId`, `toolId`, `auditedHead`, reviewer identity, `humanApprovalRef`, decision, scope, method scope, limitations and not-authorized actions.

Not-authorized actions include Python install now, `uv`, `pip`, venv creation, `setup.py`, global pip, Hermes execution, Hermes scripts, package mutation, `.env`, credentials, model calls, deploy, publish and Codex execution.

## Approved Python Install Envelope

The envelope records audited source refs, install root, `pythonEnvRootRef`, `managerDecision`, method scope, strategy plan ref, strategy summary and validation state.

All runtime statuses remain closed:

- `pythonInstallStatus: not_installed`
- `venvStatus: not_created`
- `uvStatus: not_executed`
- `pipStatus: not_executed`
- `setupPyStatus: not_executed`
- `hermesExecutionStatus: not_allowed`
- `scriptsStatus: not_allowed`
- `credentialsStatus: not_allowed`
- `modelCallStatus: not_allowed`
- `projectMutationStatus: not_allowed`
- `deployStatus: not_allowed`

## Manager Decision And Method Scope

`prefer_uv_lock` maps to `uv_lock_isolated_only`.

`prefer_venv_pip` maps to `venv_pip_isolated_only`.

`require_manual_python_review` remains `human_review_required`.

Any direct install, execution, credential, model or project mutation flag blocks approval.

## Why It Does Not Install

Approval and runtime are separate safety boundaries. This gate records authorization intent and limitations only. The future runtime adapter must independently enforce the envelope, use isolated paths, keep `shell: false` where commands are required, and produce verification evidence.

## Future Relationship

The next authorized block is Factory Hermes Python Install Runtime Adapter v1 if Lean explicitly approves controlled installation. After that, a Python Install Verification Gate must verify artifacts before any Hermes runtime planning continues.
