# Semantic Runtime Bootstrap V1

Web and Electron now compose the same semantic correction stack through `createSemanticRuntimeComposition`:

```text
Web HTTP API ─┐
              ├─ semantic runtime adapter ─ correction lifecycle ─ real generation ─ quality ─ promotion
Electron IPC ┘
```

The bootstraps only wire dependencies. Runtime requests accept semantic IDs and an optional idempotency key; execution packages, plans, paths and quality reports remain backend-owned. A rejected human preview is the source for the correction input, and promotion creates a canonical new `ProjectVersion` with its own preview and pending Human Gate state.

Provider enablement is unchanged. The isolated bootstrap smokes inject only a synthetic decision dependency and perform zero provider calls. Normal runtime configuration does not accept arbitrary plans or test candidates.

Validation status: Semantic Runtime Adapter PASS; Semantic Runtime Bootstrap PASS; Interactive Human Review NOT_YET_VALIDATED. Full interactive browser QA and Human Gate parity remain outside this checkpoint.
