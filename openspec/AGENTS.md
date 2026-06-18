# OpenSpec subtree

## Purpose

- This subtree holds the manual OpenSpec trial structure for JEFE / AI Orchestrator.
- It is the repo-local planning and change-tracking layer only.
- It does not control runtime behavior by itself.

## Ownership

- `openspec/specs/` owns behavior-level specs and stable safety contracts.
- `openspec/changes/` owns active change proposals, design notes, and task lists.
- The root AGENTS.md still owns repo-wide safety rules, Git discipline, and validation expectations.

## Local Contracts

- Keep OpenSpec artifacts lightweight and behavior-first.
- Specs describe observable behavior and safety contracts, not internal implementation trivia.
- Changes should be scoped to one coherent block of work.
- Do not treat OpenSpec artifacts as a replacement for tests, smokes, CI, or human approvals.
- Until Lean explicitly approves a package install, this subtree stays manual: no `openspec init`, no generated skills, no dependency changes.
- Archive or mark a change complete only after the real repo validation path is green for that block.

## Work Guidance

- Prefer one change folder per meaningful block, not per tiny fix.
- Use proposal for intent and scope, design for technical approach, tasks for implementation checklist, and delta specs for behavior changes.
- Keep names aligned with JEFE milestone language such as `v1-7-session-ui` or `v1-8-context-hub-integration-design`.
- When behavior changes, update the matching spec or delta in the same work block.
- If a change grows into different work, start a new change instead of stretching one folder too far.

## Verification

- OpenSpec artifacts should stay consistent with repo docs and implementation.
- Before handoff, check that proposal, design, tasks, and related specs still tell the same story.
- For implementation blocks, validate with the repo's real commands, not only with artifact updates.

## Child DOX Index

- `specs/`
  Source-of-truth behavior specs for JEFE domains.
- `changes/`
  Active and future change folders with proposal, design, tasks, and delta specs.