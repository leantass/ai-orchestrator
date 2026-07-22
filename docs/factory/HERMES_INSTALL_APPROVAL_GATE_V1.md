# Factory Hermes Install Approval Gate v1

## Purpose

Factory Hermes Install Approval Gate v1 reviews a Hermes Installation Plan and Hermes Runtime Boundary Contract, then produces an approval receipt and approved install envelope for a future controlled install runtime candidate.

It does not install Hermes, execute Hermes, run scripts, download dependencies, create virtual environments, call models, use credentials, mutate package files, create Codex Tasks or deploy.

## Installation Plan vs Runtime Boundary vs Install Approval

- Installation Plan describes how Hermes could be installed in the future.
- Runtime Boundary defines where and under which limits Hermes could live.
- Install Approval decides whether those documents are sufficient to prepare a future install-runtime candidate.

Approval is not installation. Installation is not execution. Hermes never approves its own installation or output.

## What It Approves

It approves only an in-memory `approvedInstallEnvelope` scoped to:

- tool: `hermes_agent`
- version: audited HEAD only
- future install runtime candidate
- isolated install/runtime roots from the boundary contract

## What It Does Not Approve

- install now
- execute Hermes
- run Hermes scripts
- install global dependencies
- mutate JEFE package files
- read `.env`
- access credentials
- call models
- use external network runtime
- deploy or publish
- execute Codex

## Approval Receipt

The receipt records reviewer identity, human approval reference, audited head, remote head, decision, scope, limitations and not-authorized actions.

## Approved Install Envelope

The envelope carries:

- installation plan reference;
- runtime boundary reference;
- install/runtime/output/log roots;
- boundary summary;
- install plan summary;
- validation status;
- `installStatus: not_installed`;
- `executionStatus: not_allowed`;
- `scriptsStatus: not_allowed`;
- `credentialsStatus: not_allowed`.

## Audited HEAD vs Remote HEAD

Current known state:

- Audited HEAD: `75b300f13af40878ad6482b2ecb39c55c86679fe`
- Remote HEAD: `cf52edbb595638fd6c9d7286ce4ff081fa95129b`

Because these differ, approval is limited to `installVersionScope: audited_head_only`. Installing the remote HEAD requires re-audit.

## Why It Does Not Install

This gate is governance, not runtime. Actual installation needs a future Hermes Install Runtime Adapter, explicit authorization, isolated roots, evidence capture and JEFE review.

## Future Relations

Next blocks may include:

- Factory Hermes Install Runtime Adapter v1;
- Factory Hermes Install Verification Gate v1;
- Hermes Research Runtime Adapter v1;
- Hermes Result Ingestion;
- JEFE Evidence Review.

## Next Step

Proceed to Factory Hermes Install Runtime Adapter v1 only if Lean explicitly authorizes controlled installation. Hermes execution remains disabled.
