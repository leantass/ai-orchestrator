# External Tool Provisioning Approval Gate v1

## Purpose

External Tool Provisioning Approval Gate v1 turns an approved external tool provisioning plan candidate into a human-approved runtime envelope candidate.

## Relationship With External Tool Provisioning Gate

The provisioning gate creates a non-executable plan candidate. This approval gate reviews that candidate and emits an approval receipt plus an approved tool provisioning envelope for a future runtime adapter.

## Candidate, Envelope, Runtime And Verification

- Plan candidate: declarative proposal with methods, refs, source policy, checksum policy and forbidden actions.
- Approval envelope: human-approved runtime candidate that still cannot install, download or execute.
- Runtime install: a future adapter that may act only after this envelope and explicit runtime authorization.
- Verification: a future gate that must verify source, checksum, executable identity and command scope.

## What It Approves

It approves only the future runtime candidate scope for external tool provisioning.

## What It Does Not Approve

It does not install uv, execute uv, download binaries, use shell/cmd/PowerShell, run curl/wget/irm/iwr, run pip, run setup.py, execute Hermes, retry Hermes Python Runtime, use credentials, call models, deploy or mutate JEFE package files.

## Approval Receipt

The receipt records reviewer, human approval ref, tool, target platform, approved methods, limitations and not authorized actions.

## Approved Tool Provisioning Envelope

The envelope carries the plan candidate into a future runtime with explicit statuses: `not_installed`, `not_executed`, `not_downloaded`, `not_allowed` for shell, credentials, model calls, project mutation and deploy.

## Applied To uv

For uv, the envelope approves `system_path_existing_uv` and `local_uv_binary_under_codex_temp` as future candidate methods only. It also forbids `install_uv_now` and `execute_uv_now`.

## Next Steps

1. UV Provisioning Runtime Adapter v1.
2. UV Provisioning Verification Gate v1.
3. Separate Hermes Python Runtime retry only after uv is approved, provisioned and verified.
