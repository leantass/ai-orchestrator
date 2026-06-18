# Design: V1.7 Session UI

## Technical Approach

Add a bounded UI slice that surfaces manual supervised session and post-execution review information already modeled in V1.5 and V1.6.

The first version should stay static or fixture-driven if necessary. The main goal is to prove the information architecture before adding more dynamic loading.

## Expected Surfaces

- `src/components/V1ClosureDashboard.tsx` or a child component extracted from it
- optional helper view-model mapping if the dashboard needs simplification
- docs update if the operator surface changes meaningfully
- smoke or build validation only if the UI structure changes

## UI Goals

- show session state;
- show evidence intake state;
- show review state;
- show next action;
- preserve strong safety wording;
- make manual-only execution obvious.

## Guardrails

- no hidden execution triggers;
- no real external tool launch;
- no weakening of `executionAllowed=false` semantics;
- no dependency or package changes.