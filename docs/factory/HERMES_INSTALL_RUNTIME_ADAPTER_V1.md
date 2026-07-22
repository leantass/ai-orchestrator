# Factory Hermes Install Runtime Adapter v1

## Purpose

Factory Hermes Install Runtime Adapter v1 performs a controlled, isolated and auditable Hermes installation step under `.codex-temp`, limited to the audited Hermes HEAD and approved install envelope.

## Install Approval vs Install Runtime

Install Approval prepares an envelope. Install Runtime materializes the audited source into an isolated install root and may run only allowlisted install commands.

## What v1 Installs

V1 may run Node dependency installation only with:

```text
npm ci --ignore-scripts --no-audit --no-fund
```

This is allowed only inside the isolated copied source under `.codex-temp/external-tools/hermes-agent/install/<auditedHead-short>/source` when `package-lock.json` exists.

## What v1 Blocks

- `npm install`
- `pnpm install`
- `yarn install`
- `pip install`
- `setup.py`
- venv creation
- install scripts
- Hermes execution
- model calls
- credentials
- JEFE package mutation
- global install
- deploy

## Source Copy

The adapter copies the audited Hermes source to the install root and excludes `.git`, pre-existing `node_modules`, caches and `website/i18n`.

## Install Root

Expected root:

`.codex-temp/external-tools/hermes-agent/install/75b300f/`

## Manifest

The adapter writes:

- `install-manifest.json`
- `install-result.json`

Both are under the install root and ignored from version control.

## Command Allowlist

Only these command kinds are implemented:

- `git rev-parse HEAD`
- `node --version`
- `npm --version`
- `npm ci --ignore-scripts --no-audit --no-fund`
- `python --version` for detection only

Commands run with `shell: false`.

## Python

Python install is blocked in v1. If Python surfaces are detected, status is `blocked_requires_python_install_strategy`.

## Next Steps

- Hermes Install Verification Gate.
- Hermes Python Install Strategy Gate if Python installation is required.
- Hermes Research Runtime Adapter in a future block.
