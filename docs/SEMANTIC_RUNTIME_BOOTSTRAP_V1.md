# Semantic Runtime Bootstrap V1

Web and Electron now compose the same semantic correction stack through `createSemanticRuntimeComposition`:

```text
Web HTTP API ─┐
              ├─ semantic runtime adapter ─ correction lifecycle ─ real generation ─ quality ─ promotion
Electron IPC ┘
```

The bootstraps only wire dependencies. Runtime requests accept semantic IDs and an optional idempotency key; execution packages, plans, paths and quality reports remain backend-owned. A rejected human preview is the source for the correction input, and promotion creates a canonical new `ProjectVersion` with its own preview and pending Human Gate state.

Productive semantic mode is explicit and fail-closed: it constructs the existing OpenAI provider and SemanticBrainAdapter, requires provider readiness, structured output and JEFE-owned provenance, and never falls back to local semantic decisions. Synthetic decisions remain available only through internal dependency injection for offline tests.

Foundation status: `REAL_SEMANTIC_PROVIDER_COMPOSITION_V1=PARTIAL`. BusinessUnderstanding real is connected; ContentPlan and ExperiencePlan real provider operations are `NOT_YET_CONNECTED`. The prior wiring task requested three provider calls and consumed four because an output-budget retry and a repeated live smoke were run; this checkpoint makes no provider calls. A run-level provider budget remains required for the next execution.

Provider enablement is unchanged. The isolated bootstrap smokes inject only a synthetic decision dependency and perform zero provider calls. Normal runtime configuration does not accept arbitrary plans or test candidates.

Validation status: Semantic Runtime Adapter PASS; Semantic Runtime Bootstrap PASS; Interactive Human Review NOT_YET_VALIDATED. Full interactive browser QA and Human Gate parity remain outside this checkpoint.
