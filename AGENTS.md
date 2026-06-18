# DOX framework

## Purpose

- This root AGENTS.md is the repo-wide operating contract for JEFE / AI Orchestrator.
- It exists to keep project memory, safety rules, validation discipline, and durable workflow guidance inside the repository instead of leaving them only in chat history.
- Follow this file before editing any path in the repo. If child AGENTS.md files are added later, the nearest one refines local behavior without weakening this root contract.

## Ownership

- The root AGENTS.md owns repo-wide workflow rules, safety boundaries, Git and CI discipline, and the top-level Child DOX Index.
- Feature modules, scripts, UI areas, and documentation may gain child AGENTS.md files over time when they become durable boundaries with their own contracts.
- This root file should stay concise and operational. It should describe how the repo is meant to be worked on, not narrate historical change logs.

## Local Contracts

- AGENTS.md files are binding work contracts for their subtrees.
- Before editing, read the root AGENTS.md, identify target paths, and read every AGENTS.md on the route to those paths.
- Re-read the applicable AGENTS.md chain in the current session before editing. Do not rely on memory for active repo contracts.
- For a new work block or when resuming after interruption, run a repo preflight before stacking more changes.
- Preflight should confirm current branch, HEAD, cleanliness or existing local deltas, and whether remote CI is green or still pending for the block you want to extend.
- If the repo contains unexpected local changes, unexpected HEAD drift, or pending CI for the same line of work, stop and clarify before stacking more work.
- Do not touch these without explicit user approval: `.env`, `web-prueba`, `node_modules`, `Dockerfile`, `docker-compose*`, deploy/infrastructure paths, credentials, `package.json`, `package-lock.json`, `electron/main.cjs`, production databases, external paid services, or files outside this repo.
- Do not run `git add .`, dependency installation, deploy, Docker, real Blender/Unity/MCP execution, or other risky external operations unless the user explicitly asks for that exact step.
- Keep external execution simulated, manual, or artifact-driven unless the active block explicitly changes that contract.
- Use `.codex-temp/` for generated evidence, local QA artifacts, and throwaway work products that should stay outside versioned source.
- Keep commits small and single-purpose. Do not stack new work over in-progress CI for the same branch.
- Update the closest owning AGENTS.md when a change affects durable structure, rules, scope, responsibilities, required artifacts, verification practices, or user workflow preferences.

## Work Guidance

- Work brownfield-first. Inspect the real repo state before changing code and anchor edits to the owning module, script, test, or UI surface.
- Prefer focused implementation plus real validation over broad speculative refactors.
- Keep JEFE's safety posture explicit: approvals, permit bundles, manual supervision, local sandboxes, and no hidden external execution.
- Treat Context Hub as a separate project. Do not modify it unless the user explicitly asks to work there.
- Treat OpenSpec, if adopted, as a planning and change-tracking layer. It should complement JEFE's existing repo discipline, not replace runtime safety or CI validation.
- Build the DOX tree incrementally. Do not block normal repo work on full-repo indexing. Add child AGENTS.md files when a folder has stable local rules worth preserving.
- When adding a child AGENTS.md, make the parent Child DOX Index point to it and keep the child focused on that subtree's purpose, contracts, guidance, and verification.
- Keep docs concise, current, and operational. Delete stale rules instead of explaining why they became stale.

## Verification

- Validate the smallest relevant slice first, then widen only as needed.
- For code changes, prefer this progression when available: targeted smoke or behavior check, targeted syntax/type/lint check, broader repo validation, Git audit.
- Common repo validations include `npm run lint`, `npm run build`, `npm run quality:ci`, and `node scripts/v1-release-smoke.mjs`.
- Use Git audit commands before handoff or commit: `git diff --check`, `git status --short`, `git status -sb`, `git diff --stat`, and `git diff --name-status`.
- Report validation honestly. If something was not run, say so.

## User Preferences

- Lean defines product direction and expects disciplined repo-first execution.
- Use real repo inspection, real validation commands, and explicit Git/CI reporting.
- Prefer ordered final reports with baseline, validations, Git audit, changed files, and final status.
- Stop on real risk instead of improvising through it.

## Child DOX Index

- `docs/`
	Product docs, release audits, runbooks, milestone notes, and adoption/design documents.
- `openspec/`
	Manual OpenSpec trial structure for repo-local specs, change proposals, design notes, and task tracking.
- `electron/`
	Core orchestration modules, safety gates, workers, approvals, permit bundles, delivery review flow, and external-tool control surfaces.
- `scripts/`
	Repo CLIs, smoke tests, release checks, and quality orchestration.
- `src/`
	React application UI, dashboards, panels, and operator-facing presentation.
- `public/`
	Static web assets served by the Vite app.
- `executor-bridge/`
	Auxiliary bridge code and supporting runtime integration surfaces.
- `.github/`
	CI, automation, and repository service configuration.
- Root-owned support files
	`README.md`, Vite/TypeScript/eslint config, and other repo-wide metadata stay governed by this root contract until a narrower child AGENTS.md exists.