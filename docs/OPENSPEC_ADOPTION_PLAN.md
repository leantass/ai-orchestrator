# OpenSpec Adoption Plan for JEFE / AI Orchestrator

## Objective

Define a safe and incremental way to adopt OpenSpec as a planning and change-tracking layer for JEFE / AI Orchestrator without changing runtime behavior, package dependencies, or current safety contracts.

This document began as a design proposal. The current repo state now includes a manual `openspec/` trial subtree without CLI installation, package changes, or runtime behavior changes.

## Current Status

- Root `AGENTS.md` now recognizes `openspec/` as a repo-local planning subtree.
- `openspec/specs/` contains seeded behavior contracts for current JEFE safety and workflow surfaces.
- `openspec/changes/v1-7-session-ui/` exists as the first manual change scaffold.
- OpenSpec remains planning-only in this repo: no CLI integration, no runtime dependency, no replacement of existing validation.

## Why It Fits This Repo

JEFE already works in bounded delivery blocks with explicit validation, CI, documentation, and closure criteria.

OpenSpec fits that shape well because it is:

- brownfield-first, which matches this repo;
- spec-delta oriented, which fits incremental V1.x and V2 blocks;
- compatible with multi-agent work, which fits Lean + JEFE + Codex;
- useful when chat context is not enough to preserve intent across long-running work.

## What OpenSpec Should Mean Here

If adopted, OpenSpec should become the change-planning layer for repo work.

It should answer:

- what change is proposed;
- what observable behavior changes;
- what the technical approach is;
- what tasks remain;
- what should be verified before archive or release.

It should not replace:

- AGENTS.md repo contracts;
- Git and CI discipline;
- local smoke validation;
- JEFE runtime safety gates;
- human approval rules for risky work.

## Proposed Separation of Responsibilities

### AGENTS.md

- Durable repo operating rules.
- Safety boundaries.
- Validation discipline.
- User workflow preferences.

### OpenSpec

- One folder per meaningful change.
- Proposal, spec delta, design, tasks, and archive trail.
- Durable intent for future sessions and future agents.

### Existing docs/

- Release notes, audits, runbooks, and milestone evidence.
- User-facing or block-facing narrative documentation.

### Context Hub

- Cross-project or long-lived memory outside this repo.
- Not the owner of repo-local implementation artifacts.

## Suggested OpenSpec Scope for JEFE

If the repo adopts OpenSpec, start with repo-local planning only.

Suggested initial domains under `openspec/specs/`:

- `orchestrator-core/`
- `approvals-and-permits/`
- `external-tool-safety/`
- `manual-supervised-execution/`
- `post-execution-review/`
- `workers-and-smokes/`
- `ui-dashboard/`
- `context-hub-integration/`

The goal is not to spec every internal function. The goal is to describe stable observable behavior and safety contracts.

## Suggested Change Naming

Examples that fit current JEFE block structure:

- `v1-7-session-ui`
- `v1-8-context-hub-integration-design`
- `v2-controlled-autonomy-allowlisted-runners`
- `external-tool-review-evidence-contract-hardening`
- `worker-registry-policy-tightening`

## Suggested Workflow for Lean + Codex

### 1. Frame the block

Lean defines the block goal and constraints.

### 2. Create a change

OpenSpec change captures:

- intent;
- in-scope and out-of-scope;
- safety assumptions;
- affected surfaces.

### 3. Write or refine spec deltas

Define the observable contract change.

Examples for JEFE:

- new session states;
- new review outcomes;
- new approval invariants;
- UI behavior visible to operators;
- validation/reporting expectations.

### 4. Design the implementation slice

Design should point to:

- expected module(s);
- CLI surface if any;
- smoke coverage;
- UI impact;
- documentation impact;
- Git and CI expectations.

### 5. Break into tasks

Tasks should map cleanly to real repo work:

- module;
- CLI;
- smoke;
- UI;
- docs;
- validation;
- Git audit.

### 6. Implement and validate

Codex implements against the change artifacts and validates with the repo's existing commands.

### 7. Archive after green validation

Archive only after local validation and remote CI success for the block.

## Recommended Adoption Path

### Phase 0: Design and repo-local decision

- Keep this document as the adoption baseline.
- Do not install packages.
- Keep OpenSpec repo-local unless a later approved block expands the scope.
- Do not change runtime behavior or current safety workflow.

### Phase 1: Manual structure trial (active)

- Maintain the seeded `openspec/` subtree manually.
- Use the OpenSpec artifact pattern without installing the CLI.
- Trial bounded future blocks such as V1.7 or V1.8 through change folders before considering broader rollout.

### Phase 2: Optional CLI evaluation

- Only with explicit approval.
- Evaluate `openspec init` and generated skills in a controlled branch or sandbox.
- Check whether it improves Codex/Copilot workflow without polluting repo conventions.

### Phase 3: Standardize for larger work

- Use OpenSpec for medium and large blocks.
- Keep tiny fixes out of OpenSpec unless they affect durable contracts.
- Align AGENTS.md, OpenSpec changes, and release docs so each serves a separate purpose.

## Guardrails for This Repo

If OpenSpec is adopted here, keep these guardrails:

- No package installation without explicit approval.
- No runtime dependency on OpenSpec.
- No replacement of existing smokes, lint, build, or CI checks.
- No weakening of AGENTS.md safety rules.
- No automatic external tool execution just because a spec exists.
- No archive of a change before the repo's real validation path is green.

## Good First Trial

The best first OpenSpec trial for this repo is likely a future bounded block such as:

- V1.7 session UI;
- V1.8 Context Hub integration design;
- a focused hardening pass on external-tool review contracts.

Those are large enough to benefit from structured change artifacts, but still constrained enough to evaluate whether OpenSpec improves the workflow.

## Recommendation

Adopt OpenSpec experimentally and incrementally, not as a repo-wide hard dependency.

For JEFE, the right model is:

- AGENTS.md for durable repo rules;
- OpenSpec for change-level planning and intent preservation;
- existing docs for release/runbook/audit narrative;
- CI and smoke scripts for actual technical truth.