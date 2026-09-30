# JEFE - Release Operations Runbook

This runbook is a read-only operational policy. It explains evidence and safe next actions; it never approves, authorizes, pushes, tags, releases, deploys, or runs recovery automatically.

## Classification

| Case | Classification | Operator message | Safe next action | Automatic | Human | Owner |
|---|---|---|---|---|---|---|
| Historical lint debt | global blocker | Remote CI quality is blocked by historical lint debt. | Fix local quality debt. | No | No | quality-owner |
| Remote CI failed | blocker/evidence | Remote CI failed for the bound commit. | Review CI failure. | No | Yes | release-operations |
| Remote CI unavailable | unknown/unavailable | Remote CI evidence is unavailable. | Retry observation when explicitly requested. | No | Yes | release-operations |
| Repository stale | blocker | Repository baseline changed after evidence capture. | Create a new repository baseline. | No | Yes | release-recovery |
| Delivery tampered | incident/blocker | Delivery integrity does not match its evidence. | Create a new delivery; preserve the old evidence. | No | Yes | e2e-recovery |
| Human rejection | blocker | Human gate requested changes. | Create a correction. | No | Yes | human-gate |
| QA failed | blocker | The current version did not pass QA. | Repair and repeat QA. | No | Yes | qa-owner |
| Remote authorization missing/expired/revoked | blocker | The requested remote action has no usable authorization. | Obtain explicit authorization. | No | Yes | release-governance |
| Governance decision stale | blocker | Governance evidence changed after the decision. | Create a new governance snapshot. | No | Yes | governance-recovery |
| E2E/release/governance recovery required | incident | Durable evidence needs diagnosis or reconciliation. | Run the named recovery module. | No | Yes | owning recovery module |
| Deploy not connected | capability unavailable | No deploy adapter is connected. | Treat production as not ready. | No | Yes | platform |

## State semantics

- `unknown`: evidence is absent.
- `blocked`: evidence proves that progression is not allowed.
- `unavailable`: a source or capability is not connected.
- `failed`: an attempted operation failed.
- `stale`: evidence was once valid but is no longer current.
- `waiting_human` and `waiting_authorization` are normal blockers, not incidents.

## Evidence navigation

Start with `projectId` and `versionId`, then follow the current-version binding to E2E flow, QA, Human Gate, delivery, ReleaseRequest, ReleaseFlow, CI evidence, governance decisions, incidents, and recovery status. The Operations read model is a projection only; the durable stores remain authoritative.

## Safety boundaries

The operation surface is read-only. Recovery is backend-owned and explicit. No action in this runbook creates authority, fabricates evidence, retries an ambiguous mutation, or changes remote Git state. Secrets, headers, credential output, absolute paths, and provider payloads must not be displayed.

Retention remains `CONSERVATIVE_NO_AUTOMATIC_DELETION`. `MultiprocessLocking=false` and `DistributedExactlyOnce=false` remain explicit operational limits.
