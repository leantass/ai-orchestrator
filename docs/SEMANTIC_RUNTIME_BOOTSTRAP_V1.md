# Semantic Runtime Bootstrap V1

Web and Electron now compose the same semantic correction stack through `createSemanticRuntimeComposition`:

```text
Web HTTP API ─┐
              ├─ semantic runtime adapter ─ correction lifecycle ─ real generation ─ quality ─ promotion
Electron IPC ┘
```

The bootstraps only wire dependencies. Runtime requests accept semantic IDs and an optional idempotency key; execution packages, plans, paths and quality reports remain backend-owned. A rejected human preview is the source for the correction input, and promotion creates a canonical new `ProjectVersion` with its own preview and pending Human Gate state.

Productive semantic mode is explicit and fail-closed: it constructs the existing OpenAI provider and SemanticBrainAdapter, requires provider readiness, structured output and JEFE-owned provenance, and never falls back to local semantic decisions. Synthetic decisions remain available only through internal dependency injection for offline tests.

Foundation status: `COMPLETE_REAL_SEMANTIC_PLAN_WIRING_V1=IMPLEMENTED_PENDING_LIVE_VALIDATION`. Productive composition coordinates BusinessUnderstandingV2, ContentPlanV2 and ExperiencePlanV2 through the same SemanticBrainAdapter/provider boundary; deterministic code only validates and maps the resulting plans. The prior wiring task requested three provider calls and consumed four because an output-budget retry and a repeated live smoke were run; this block adds a shared run-level budget and makes no live calls by default.

All provider-capable smokes default to offline. A live smoke requires the explicit process flag `JEFE_SEMANTIC_LIVE_TEST=1`; credential presence alone never enables network calls. `ProviderRunBudget` is shared by the composition and its provider instances, so retries, concurrent reservations and new adapters consume the same hard ceiling.

Output budgets are operation-specific and leave headroom for reasoning plus visible JSON: the normal BU + ContentPlan + ExperiencePlan path expects three calls, while one output retry per operation has a six-call theoretical worst case. This output budget is separate from the run-level provider ceiling.

Productive semantic plans request Background Mode explicitly from the provider. The provider uses `background=true` and `store=false`, polls only bounded `queued`/`in_progress` responses, classifies deadline/cancellation separately, and reports generation calls independently from poll and cancel HTTP requests. Probes remain foreground. Background live validation is opt-in and is not run by normal offline smokes.

The real-plan verification report validator accepts only the exact BU, ContentPlan and ExperiencePlan schema versions, provider source, completion state, provenance flags and generation accounting. Prior live evidence remains metadata-only; content and experience quality gates are `NOT_REPLAYABLE_FROM_CURRENT_SAFE_EVIDENCE` unless safe structured payloads are explicitly retained.

Provider enablement is unchanged. The isolated bootstrap smokes inject only a synthetic decision dependency and perform zero provider calls. Normal runtime configuration does not accept arbitrary plans or test candidates.

Validation status: Semantic Runtime Adapter PASS; Semantic Runtime Bootstrap PASS; Interactive Human Review NOT_YET_VALIDATED. Full interactive browser QA and Human Gate parity remain outside this checkpoint.
