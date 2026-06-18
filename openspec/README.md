# OpenSpec manual trial for JEFE / AI Orchestrator

This repo now contains a manual OpenSpec trial structure.

The goal is to preserve change intent, safety contracts, and future implementation plans inside the repository without installing the OpenSpec CLI or changing package dependencies.

## Current mode

- Manual only.
- No CLI integration.
- No generated skills.
- No runtime dependency.
- No replacement of Git, CI, smokes, or existing docs.

## Structure

```text
openspec/
├── AGENTS.md
├── README.md
├── specs/
│   ├── external-tool-safety/
│   ├── manual-supervised-execution/
│   ├── post-execution-review/
│   └── ui-dashboard/
└── changes/
    └── v1-7-session-ui/
```

## How to use this subtree

Use `openspec/specs/` for stable behavior contracts.

Use `openspec/changes/` for a single coherent block of work:

- `proposal.md` for intent, scope, and non-goals
- `design.md` for technical approach
- `tasks.md` for implementation and validation steps
- `specs/.../spec.md` for delta-style behavior changes

## Guardrails

- Do not install OpenSpec packages without explicit approval.
- Do not treat OpenSpec as a runtime feature.
- Do not archive a change just because artifacts are complete; the repo's real validation path must still be green.
- Keep this subtree aligned with AGENTS.md and the actual repo state.