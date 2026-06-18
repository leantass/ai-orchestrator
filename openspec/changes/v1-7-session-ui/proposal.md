# Proposal: V1.7 Session UI

## Intent

Expose manual supervised execution sessions and post-execution reviews inside the operator UI so the workflow becomes inspectable without reading raw artifacts in `.codex-temp`.

## Scope

In scope:

- session summary cards or panels;
- evidence intake status visibility;
- post-execution review status visibility;
- next-action guidance for operators;
- explicit safety flags and manual-only framing.

Out of scope:

- real external tool execution;
- automatic approval flow changes;
- Context Hub integration;
- package installation or OpenSpec CLI adoption.

## Approach

Reuse the current dashboard style and JEFE operator vocabulary.

Keep the first V1.7 slice read-only and summary-oriented. The UI should explain existing artifacts and states, not add hidden automation.