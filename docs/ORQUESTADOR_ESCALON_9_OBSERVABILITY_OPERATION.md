# Escalón 9 — Observabilidad y operación

## Estado vigente

- `ESCALON_8_STATUS=VERIFIED_CLOSED`
- `ESCALON_9_STATUS=IN_PROGRESS`
- `ESCALON_9A_STATUS=COMPLETED`
- `ESCALON_9B_STATUS=COMPLETED`
- `ESCALON_9C_STATUS=NOT_STARTED`
- `ESCALON_9D_STATUS=NOT_STARTED`
- `NEXT=ESCALON_9C_RUNTIME_INGESTION_AND_OPERATIONAL_VIEWS`

9A define el contrato y la política de observabilidad sin agregar persistencia compleja, red ni terceros. `electron/jefe-observability-contract.cjs` implementa `jefe-observation-event/v1`, `jefe-observability-signal/v1`, `jefe-health-snapshot/v1`, `jefe-operational-incident/v1` y `jefe-operation-summary/v1`.

## ObservationEvent

Cada evento tiene taxonomía cerrada, `correlationId`, `causationId` opcional, source trusted, severidad, outcome, sujeto y `evidenceRefs`. Los tipos de fuente y eventos desconocidos se rechazan. Attributes se sanitizan; no se conservan tokens, credenciales, secretos ni paths sensibles. Un evento `human.approval.recorded` documenta una decisión humana pero no deriva un incidente por sí mismo.

## Health, readiness y quality

Son dimensiones separadas. `HealthSnapshot` no inventa métricas: los valores numéricos requieren evidencia y fuente. Sin evidencia suficiente cada dimensión queda en `unknown`. `productionReady` permanece `false` en 9A. El estado histórico del canary 8C se representa como:

- Git mechanism health: `healthy`, `operational=true`;
- Remote CI quality: `failing` / degraded por la falla real de `quality:ci`;
- Release readiness: `blocked`;
- `productionReady=false`.

La deuda histórica documentada continúa siendo `306` errores de lint en `src/factory/*`; 9A no la corrige ni baja reglas.

## Incidentes y operación

Los incidentes se derivan de eventos y snapshots verificables, con categorías cerradas, severidad, deduplication key, evidencia, estado (`open`, `acknowledged`, `resolved`, `suppressed`) y resolución. La deduplicación es determinista por categoría, correlación y evidencia. `summarizeOperation()` separa health/readiness/quality y cuenta sólo incidentes derivados. No se generan alertas, porcentajes ni métricas sin evidencia.

La integración con 8D es read-only mediante `releaseHealth()`: flows bloqueados, CI fallida, corrupciones e incertidumbres alimentan el snapshot, pero 9A no muta recovery stores. No se integran OpenTelemetry, Prometheus, Grafana, Loki, Sentry, Datadog, New Relic ni ningún proveedor.

## 9B — persistencia durable local

`electron/jefe-observability-persistence.cjs` mantiene stores separados bajo `<physical-root>/.jefe-observability`: eventos append-only, metadata de secuencia, incidentes base, transiciones append-only, health snapshots, summaries e índices derivados. Los writes usan stage/rename atómico; los locks son por physical root dentro del proceso (`MULTIPROCESS_LOCKING=false`). No hay TTL, rotación destructiva ni retención automática: `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`.

`electron/jefe-observability-orchestrator.cjs` expone `recordEvent()`, `deriveAndPersistIncidents()`, `recordHealthSnapshot()`, `buildOperationSummary()` y rebuild de índices. Replay por identidad es idempotente; colisiones se rechazan. Timeline usa secuencia persistida, filtros por proyecto/correlación/tipo, cursor estable y límite máximo. Causalidad exige que el evento referenciado exista. Incidentes aplican CAS local con revisiones y transiciones allowlisted; `resolved` exige razón, timestamp y evidencia posterior compatible. Decisions humanas se conservan como eventos y no se convierten en incidentes.

`scanDetailed()` conserva records corruptos físicamente, los reporta y los excluye de índices. Los índices pueden reconstruirse desde records válidos. Snapshots son inmutables y equivalentes por evidencia no generan spam de reloj; summaries quedan ligados a snapshot e incidentes. El smoke `scripts/jefe-observability-persistence-smoke.mjs` cubre restart, replay, collision, timeline/pagination, CAS, history, resolución, corruption isolation, rebuild, failure injection, concurrencia, causalidad, aislamiento A/B y fixture histórica del canary 8C.

## Validación

`scripts/jefe-observability-contract-smoke.mjs` cubre taxonomía, correlación/causación, evidencia trusted, sanitización, unknown-by-default, separación de dimensiones, señales sin métricas inventadas, derivación/deduplicación/resolución de incidentes, decisiones humanas y la fixture histórica del canary 8C.
