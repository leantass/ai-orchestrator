# Factory Hermes Install Verification Gate v1

## Purpose

Factory Hermes Install Verification Gate v1 performs a read-only audit of the isolated Hermes install artifacts under `.codex-temp`.

It does not install dependencies, execute Hermes, run Hermes scripts, run npm/pnpm/yarn/pip, execute `setup.py`, create a venv, call models, use credentials, mutate JEFE package files, create Codex Tasks or deploy.

## Install Runtime vs Install Verification

Install Runtime materialized the audited source and ran the allowlisted Node dependency install. Install Verification confirms that the resulting artifacts are known, auditable and safe.

## Verification Scope

The gate verifies:

- install root containment under `.codex-temp`;
- source copy exists and has no `.git`;
- `install-manifest.json` exists and parses;
- `install-result.json` exists and parses;
- audited HEAD and `audited_head_only` scope;
- npm command was `node <npm-cli.js> ci --ignore-scripts --no-audit --no-fund`;
- all commands used `shell:false`;
- no `cmd.exe`, PowerShell, `npm install`, `pip install` or `setup.py`;
- Hermes execution stayed disabled;
- Hermes scripts stayed not executed.

## Expected Partial State

Python install remains blocked in v1:

`blocked_requires_python_install_strategy`

This produces:

- decision: `verified_node_install_python_strategy_required`
- status: `verified_partial`

This is a PASS for the gate.

## Next Steps

- Factory Hermes Python Install Strategy Gate v1.
- Hermes Research Runtime Adapter only after install is complete, verified and approved.
