# External Tool Provisioning Gate v1

## Purpose

External Tool Provisioning Gate v1 models how JEFE can approve a future provisioning plan for an external tool without installing, downloading or executing it.

## Relationship With External Tool Governance

External Tool Governance owns the registry and lifecycle posture for tools. This gate is narrower: it evaluates one tool profile, one policy and one provisioning plan candidate before any runtime adapter exists.

## Profile, Plan, Runtime And Verification

- Profile: declarative identity, purpose, allowed future commands, forbidden commands, candidate methods and known status.
- Provisioning plan candidate: a non-executable proposal that names future roots, executable refs, source policy, checksum policy, approvals and forbidden actions.
- Runtime install: a future adapter that may provision only after explicit approval.
- Verification: a future gate that must prove source, checksum, command allowlist and filesystem scope before any tool use.

## Why This Gate Does Not Install

This gate has no authority to mutate external tool roots, JEFE project files, global paths or package manifests. Approval of a plan candidate is not approval to install.

## Why This Gate Does Not Execute

Execution remains blocked because no runtime adapter or verification gate has approved the tool binary. Even an approved candidate keeps `canExecuteToolNow: false`.

## Not Authorized Actions

The gate forbids installing uv now, executing uv now, shell execution, cmd.exe, PowerShell, curl, wget, pip, setup.py, global install, project package mutation, credential access, model calls, deploy, Hermes execution and immediate Hermes Python Runtime retry.

## Applied To uv

The uv profile declares uv as the governed Python package manager runtime needed by Hermes Python Install Runtime Adapter v1. The known current status is `missing_from_path_based_on_previous_runtime`, sourced from the prior Hermes Python runtime result `blocked_uv_executable_not_found`.

## Next Steps

The next authorized block is UV Provisioning Approval/Runtime with source and checksum verification. Hermes Python Runtime must not be retried directly before uv provisioning is approved and verified.
