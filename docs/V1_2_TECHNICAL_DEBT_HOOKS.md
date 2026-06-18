# V1.2 Technical Debt - Hook Warnings Cleanup

## Baseline

- Branch: `main`
- Base commit: `056ad8f polish: refine V1 orchestrator interface`
- Scope: `src/App.tsx`
- Goal: remove historical `react-hooks/exhaustive-deps` warnings without changing product behavior.

## Initial Warnings

`npm run lint` reported 8 warnings in `src/App.tsx`:

1. `useEffect` near line 15030 was missing dependencies from `plannerExecutionMetadata`.
2. `handleWizardNext` changed identity on each render and was used by the dev/test bridge effect.
3. `handleWizardGeneratePlan` changed identity on each render and was used by the dev/test bridge effect.
4. `handleWizardExecute` changed identity on each render and was used by the dev/test bridge effect.
5. `handleApproveOnce` changed identity on each render and was used by the dev/test bridge effect.
6. `handleRejectApproval` changed identity on each render and was used by the dev/test bridge effect.
7. `handleResetSessionMemory` changed identity on each render and was used by the dev/test bridge effect.
8. `buildJefeDevTestBridgeState`, returned by `useEffectEvent`, was incorrectly listed in the dev/test bridge effect dependency array.

## Classification

| Warning | Classification | Reason |
| --- | --- | --- |
| Planner materialization debug dependencies | SAFE_FIX | The effect only emits debug/readiness snapshots and already reads those metadata fields. Adding dependencies keeps the snapshot accurate without changing planner behavior. |
| Wizard and approval handlers in `__JEFE_TEST__` bridge | SAFE_FIX | The warning was caused by the bridge effect depending on render-scoped handlers. The UI still uses the original handlers; the bridge now calls stable `useEffectEvent` wrappers that always dispatch to the latest handler implementation. |
| `buildJefeDevTestBridgeState` in dependency array | SAFE_FIX | React hook lint explicitly requires `useEffectEvent` return values to stay out of dependency arrays. Removing it matches the intended pattern already used by the bridge state reader. |

## Corrections Applied

- Added the missing `plannerExecutionMetadata` fields to the debug effect dependency list:
  - `detectedVertical`
  - `materializationPlan?.contractDefinition?.contractKind`
  - `materializationPlan?.projectRoot`
  - `selectedContractKind`
  - `selectedDomain`
  - `sourceRoot`
  - `targetRoot`
- Added bridge-only `useEffectEvent` wrappers for:
  - `handleWizardNext`
  - `handleWizardGeneratePlan`
  - `handleWizardExecute`
  - `handleApproveOnce`
  - `handleRejectApproval`
  - `handleResetSessionMemory`
- Updated the development `window.__JEFE_TEST__` bridge to expose those wrappers.
- Removed `useEffectEvent` return values and unstable handlers from the bridge effect dependency array.

## Remaining Hook Debt

None after this cleanup. `npm run lint` completes without `react-hooks/exhaustive-deps` warnings.

## Risk Notes

- No planner, approval, materialization, worker, Context Hub, or external tool logic was changed.
- No user-facing UX flow was changed.
- The bridge behavior remains development/test-only and still resolves current state through `useEffectEvent`.
- The safest future follow-up is to keep `src/App.tsx` from growing further by extracting isolated panels or hooks in a separate refactor, not as part of V1.2.

## Validation Recommendation

For this cleanup, keep validation broad enough to catch behavior drift:

- `npm run lint`
- `npm run build`
- `npm run quality:ci`
- `node scripts/v1-release-smoke.mjs`
- External tool and worker smoke scripts
