# Hermes Toolset Disable Verification Approval Gate v1

## Purpose

Factory Hermes Toolset Disable Verification Approval Gate v1 reviews the Toolset Disable Verification Planning result and decides whether a future controlled probe can safely verify a Hermes no-tools mode.

This gate is approval-only. It does not execute Hermes, `hermes.exe`, `--oneshot`, Python, uv, pip, setup.py, model calls, network, DNS, endpoint tests, credentials, toolsets, run-root creation, ingestion, or findings promotion.

## Inputs

- `toolset-disable-verification-planning-result.json`
- `research-runtime-adapter-approval-result.json`
- related policy artifacts as references
- Hermes source files read as text for safety assessment

## Approval Criteria

A controlled probe can be approved only if source proves all of the following:

- the probe command does not require a prompt
- the probe cannot start provider/model execution
- the probe cannot read credentials
- the probe cannot use network
- toolset validation occurs before `AIAgent`/provider/model/network
- output is operational only, not findings
- timeout/no-retry/no-run-root/no-tool-enablement constraints are explicit
- exact command syntax is proven by source

If any requirement is missing, the gate blocks.

## Current Decision

The current conservative result is blocked:

- `status: toolset_disable_verification_approval_blocked`
- `decision: hermes_toolset_disable_verification_approval_blocked_no_safe_probe_shape`
- `approvalStatus: blocked`

The blocker exists because Hermes source proves `--toolsets` support and validation behavior, but does not prove a safe command shape that validates disabled toolsets without prompt/oneshot/provider/model/network risk. `no_mcp` is only an MCP sentinel, and `no_toolsets_text_only` is a policy label, not verified Hermes syntax.

## Next Gate

The blocked path proceeds to:

- Factory Hermes Runtime Selection Revision Planning Gate v1

The research runtime adapter remains blocked.

## Revision Planning Output

Factory Hermes Runtime Selection Revision Planning Gate v1 consumes the blocked approval and prepares manual revision options. The recommended conservative path is wrapper-enforced no-tool mode planning, not adapter retry.

Wrapper No-Tool Mode Planning can plan wrapper strategies after this block, but it cannot approve execution or implement wrapper code.
