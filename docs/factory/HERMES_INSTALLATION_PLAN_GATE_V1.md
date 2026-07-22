# Factory Hermes Installation Plan Gate v1

## Purpose

Factory Hermes Installation Plan Gate v1 converts the passive Hermes source checkout audit into a declarative future installation plan. It does not install Hermes, execute Hermes, run repository scripts, mutate JEFE package files, fetch dependencies, create virtual environments, or connect Hermes to JEFE runtime.

## Checkout Audit vs Installation Plan vs Runtime

- Source checkout audit answers: what source was inspected?
- Installation plan answers: what would need approval before a future install?
- Install runtime would perform installation later, in an isolated root, after approval.
- Execution runtime would run Hermes later, only after a runtime boundary and adapter exist.

Downloading source does not imply installing. Installing would not imply executing. Executing would not imply approving results.

## HEAD State

- Audited checkout HEAD: `75b300f13af40878ad6482b2ecb39c55c86679fe`
- Current remote HEAD observed during this gate: `cf52edbb595638fd6c9d7286ce4ff081fa95129b`
- Heads match: no

The plan is therefore valid only for the audited checkout HEAD unless a new source audit is performed. The recommended version policy is `allow_install_plan_for_audited_head_only`, with a warning to re-audit remote HEAD before any install runtime approval.

## Surfaces Detected

- Node: `package.json`, `package-lock.json`, npm scripts and workspaces.
- Python: `pyproject.toml`, `setup.py`, `uv.lock`, Python CLI/runtime files.
- Shell/scripts: `scripts/install.ps1`, `scripts/install.sh`, `setup-hermes.sh`.
- Docs: `README.md`, `docs/`, `website/docs/`.

These are install and runtime surfaces for future review. They are not executed by this gate.

## Declarative Install Plan

The plan proposes future steps only:

1. Pin the audited source version.
2. Prepare an isolated install root under `.codex-temp/external-tools/hermes-agent/install/<auditedHead-short>/`.
3. Inspect package manager and lockfile surfaces.
4. Prepare dependency install commands for a later approval gate.
5. Defer any Hermes smoke or command execution until a runtime boundary exists.

## Future Validation Plan

Future gates should verify:

- the installed source resolves to the pinned audited commit;
- JEFE `package.json` and `package-lock.json` remain unchanged;
- no credentials or `.env` are required;
- no Hermes script runs before runtime approval;
- all Hermes output returns through result ingestion and JEFE review.

## What This Gate Does Not Do

- Does not install Hermes.
- Does not execute Hermes.
- Does not run Hermes scripts.
- Does not execute npm, pnpm, yarn, pip or uv.
- Does not create a virtual environment.
- Does not mutate JEFE package files.
- Does not create a Codex Task.
- Does not execute Codex.
- Does not create projects, repositories, databases, embeddings or deployments.

## Future Relationship

The next safe blocks are:

- Factory Hermes Runtime Boundary Contract v1.
- Factory Hermes Install Runtime Adapter v1, only after explicit approval.
- Hermes Research Request Runtime Adapter v1, only after install and runtime boundaries are approved.
- Hermes Result Ingestion + JEFE Evidence Review.

## Example JSON

```json
{
  "decision": "approve_installation_plan_for_future_gate",
  "status": "install_plan_ready_for_audited_head",
  "toolId": "hermes_agent",
  "auditedHead": "75b300f13af40878ad6482b2ecb39c55c86679fe",
  "remoteHead": "cf52edbb595638fd6c9d7286ce4ff081fa95129b",
  "headsMatch": false,
  "versionPolicyDecision": "allow_install_plan_for_audited_head_only",
  "installAllowedNow": false,
  "executionAllowedNow": false,
  "dependenciesInstalled": false,
  "scriptsExecuted": false
}
```

## Next Step

Pin the audited Hermes HEAD or re-audit the current remote HEAD, then create Factory Hermes Runtime Boundary Contract v1 before any future installation runtime.
