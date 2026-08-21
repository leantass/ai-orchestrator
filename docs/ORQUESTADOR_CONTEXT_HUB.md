# MEMORIA / Context Hub canónico (2A–2B)

`ESCALON_2A_STATUS=COMPLETED`. MEMORIA es un registro local append-only de entradas validadas, no un chat, un archivo libre ni una base vectorial. La fuente de verdad son los eventos; el snapshot se reconstruye desde ellos y no es editable como autoridad.

## Contrato y autoridad

Los alcances son `orchestrator`, `project`, `run` y `version`; cada uno exige exactamente la identidad correspondiente. Los tipos registran objetivo, requisito, restricción, preferencia, decisión, evidencia, supuesto, riesgo, pregunta, validación, resultado, fallo y corrección. Actores permitidos: Lean, Cerebro, Radar, Hermes, Scout, JEFE, Planner, Codex, QA y system. Las autoridades distinguen decisión humana, evidencia verificada, resultado técnico, inferencia de agente y evento de sistema.

Una inferencia no puede reemplazar una decisión humana: todo reemplazo, resolución, invalidación o conflicto referencia explícitamente la entrada anterior y conserva historia. El snapshot expone entradas vigentes, pendientes, conflictos, próximo responsable y asuntos que requieren a Lean.

## Persistencia y límites

Cada entrada se valida, serializa de modo determinista y se escribe atómicamente como evento inmutable bajo un root autorizado. La idempotencia acepta el mismo `entryId` con el mismo contenido y rechaza colisiones diferentes. Índice/snapshot corruptos se reconstruyen; eventos corruptos se aíslan y reportan. No se consultan URLs ni se ejecutan/copían archivos de evidencia.

Se rechazan paths externos, traversal, campos sensibles evidentes y metadata/textos fuera de límite. Esta protección no detecta secretos ocultos en lenguaje natural. No hay embeddings, búsqueda semántica, UI, IPC ni integración con agentes en 2A.

## Escalón 2B: productores, reconciliación y frontera semántica

`ESCALON_2_STATUS=VERIFIED_CLOSED`; `ESCALON_2A_STATUS=COMPLETED`; `ESCALON_2B_STATUS=COMPLETED`; `ESCALON_2C_STATUS=COMPLETED`; `ESCALON_2C_C1_STATUS=COMPLETED`; `ESCALON_2C_C2_STATUS=COMPLETED`; `ESCALON_2D_STATUS=COMPLETED`; `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`.

Los manifests por versión y el ledger físico siguen siendo la fuente de verdad. Tras una creación, cambio, aprobación local, restauración, entrega local o fallo relevante, `jefe-context-integration.cjs` deriva entradas técnicas sólo después del resultado físico. La identidad de una versión conserva exactamente `projectId`, `runId` y `versionId`. Restauración crea una versión física nueva; entrega sólo declara preparación local aprobada, nunca deploy, publicación, hosting, URL pública ni CI.

La autoridad humana sólo procede del evento físico de aprobación local. Las demás entradas derivadas usan actor/procedencia técnica; el renderer no puede forjar actor, autoridad, procedencia, origen, IDs físicos ni paths. No se fabrican QA visual, validación técnica, aceptación comercial o conformidad de entrega.

La outbox durable distingue `synced`, `pending` y `failed`. Una interrupción posterior a la materialización puede reabrirse y reconciliarse de modo idempotente desde manifests/ledger; una colisión incompatible conserva la historia y permanece `failed` con código estructurado. Locks y cola se liberan, y el estado se calcula por proyecto para aislar A/B.

Snapshot, timeline limitado/paginado, preview y comparación son lecturas puras. Timeline usa límite entero 1–50, orden determinista y cursor opaco ligado al proyecto. IPC/preload exponen únicamente snapshot, timeline, estado y reconciliación contextuales semánticos; no hay append genérico, filesystem, roots, paths libres ni `ipcRenderer` expuesto.

El smoke `jefe-context-lifecycle-ipc-smoke.mjs` cubre 42/42 casos de 2B junto con recuperación, colisiones y aislamiento.

Estado prevalente: `ESCALON_2_STATUS=VERIFIED_CLOSED`; `ESCALON_2C_STATUS=COMPLETED`; `ESCALON_2D_STATUS=COMPLETED`; `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`. El roadmap canónico no define todavía un nombre único para el siguiente escalón.

## Pendientes

2C completa paquetes, adapters, handoff durable e ingesta canónica de resultados. 2D completa diagnóstico, recuperación compatible, conflictos internos y política de retención conservadora. Siguen fuera de alcance UI de MEMORIA, autenticación humana end-to-end, aprendizaje entre proyectos, búsqueda semántica/vectorial, QA visual, deploy y agentes reales.
