# Factory Hermes Runtime Boundary Contract v1

## Purpose

Factory Hermes Runtime Boundary Contract v1 defines the future execution boundary for Hermes Agent before any install or runtime adapter can exist. It is a pure, versioned, serializable contract. It does not install Hermes, execute Hermes, run Hermes scripts, create a runtime, call models, use credentials, mutate JEFE package files, create Codex Tasks or deploy.

## Installation Plan vs Runtime Boundary

The Installation Plan Gate describes what a future installation would need. The Runtime Boundary Contract describes the sandbox, policies, kill switches, adapter requirements and result contract that must exist before that future installation or execution can be considered.

## HEAD Mismatch

- Audited HEAD: `75b300f13af40878ad6482b2ecb39c55c86679fe`
- Remote HEAD observed by the installation plan: `cf52edbb595638fd6c9d7286ce4ff081fa95129b`

The boundary may be approved only for the audited HEAD. If the current remote HEAD is desired, Hermes must be re-audited before any install runtime approval.

## Filesystem Boundary

Future allowed roots:

- Install root: `.codex-temp/external-tools/hermes-agent/install/<auditedHead-short>/`
- Runtime root: `.codex-temp/external-tools/hermes-agent/runtime/<auditedHead-short>/`
- Input root: `.codex-temp/external-tools/hermes-agent/inputs/`
- Output root: `.codex-temp/external-tools/hermes-agent/outputs/`
- Logs root: `.codex-temp/external-tools/hermes-agent/logs/`

Forbidden roots include `.env`, credentials files, JEFE `node_modules`, `web-prueba`, `package.json`, `package-lock.json`, `src/App.tsx`, `electron/main.cjs`, preload, IPC and production paths.

## Network Boundary

Network is disabled by default. Future runtime requires an allowlist and separate approval. Arbitrary browsing and credentialed external calls are not allowed by this contract.

## Environment Boundary

Environment injection is disabled. Allowed env names are empty by default. Forbidden patterns include `SECRET`, `TOKEN`, `API_KEY`, `PASSWORD`, `PRIVATE`, `OPENAI` and `GITHUB_TOKEN`.

## Credential Boundary

Credentials are not allowed. Credential stores are not allowed. `.env` reads are not allowed. Any future credential use requires a separate approval gate.

## Execution Policy

The boundary keeps these disabled:

- install
- execution
- scripts
- command execution
- model calls
- project mutation
- deploy

Future runtime suggestions include max runtime seconds, max output bytes and mandatory kill switch checks.

## Logging Policy

Logs may only be written to `.codex-temp/external-tools/hermes-agent/logs/` in a future approved runtime. Logs must redact secrets and cannot include raw credentials. Structured results are required.

## Kill Switches

All kill switches default false:

- `globalHermesEnabled`
- `hermesInstallEnabled`
- `hermesRuntimeEnabled`
- `hermesNetworkEnabled`
- `hermesCredentialsEnabled`

## Adapter Requirements

Future execution requires:

- Hermes Research Runtime Adapter
- Hermes Result Ingestion
- JEFE Evidence Review
- result schema
- timeout enforcement
- kill switch check before runtime

Hermes never approves its own output.

## Result Contract

Future Hermes results must include request id, tool version, audited head, sources, claims, evidence, confidence, risks, unresolved questions, citations and recommended next step. Raw secrets and direct project mutation are forbidden.

## What This Does Not Do

- Does not install Hermes.
- Does not execute Hermes.
- Does not execute Hermes scripts.
- Does not create a real runtime.
- Does not call models.
- Does not use credentials.
- Does not mutate `package.json` or `package-lock.json`.
- Does not create Codex Tasks.
- Does not execute Codex.
- Does not deploy.

## Future Relations

This contract gates:

- Factory Hermes Install Runtime Adapter v1
- Factory Hermes Research Runtime Adapter v1
- Hermes Result Ingestion
- JEFE Evidence Review

## Next Step

Create Factory Hermes Install Runtime Adapter v1 only after explicit approval, or re-audit Hermes remote HEAD before any installation if the current remote version should be used.
