# Arquitectura canónica

## Autoridades únicas

## Estado vigente de cierre documental

`ESCALON_6_STATUS=VERIFIED_CLOSED`; `ESCALON_7_STATUS=NOT_STARTED`. El cierre se basa en evidencia visual v4-final aprobada externamente, sobre `factory-qa-electron` (`factory_typed`); no habilita proyecto comercial, proveedores reales, red, deploy ni publicaciÃ³n.

## Escalon 5 implementado

La via canonica de ejecucion vive en `electron/orchestrator-canonical-execution-contract.cjs`, `electron/orchestrator-canonical-execution-persistence.cjs` y `electron/orchestrator-canonical-execution-service.cjs`. Planner entrega el plan cerrado; el executor deriva permisos desde el registro confiable, valida baseline/worktree y persiste antes del append tecnico a MEMORIA. No existe shell generico ni IPC de ejecucion.

| Área | Autoridad canónica | Límite |
|---|---|---|
| Identidad/contrato | `electron/jefe-project-contract.cjs` | IDs y paths se normalizan dentro de roots explícitos. |
| Creación | `electron/jefe-project-creation.cjs` | `createFirstVersionFromRun` es la entrada pública; el adaptador legacy no crea otra identidad. |
| Materialización | `electron/jefe-real-generation.cjs` | Staging + rename local; aliases legacy devuelven `not_available`. |
| Persistencia | `electron/jefe-project-persistence.cjs` | Manifests por versión; índice reconstruible no es fuente de verdad. |
| Ciclo | `electron/jefe-project-lifecycle.cjs` | Ledger físico, aprobación, restauración y entrega. |
| IPC/preload | `electron/jefe-project-ipc.cjs` y `electron/preload.cjs` | Canales semánticos allowlisted; renderer no entrega paths ni canales. |
| Preview | `electron/jefe-project-preview.cjs` | Recurso declarado + MIME allowlist; sin `file://` arbitrario. |
| UI | `src/commercial/*` | Consume bridge y snapshots físicos; `localStorage` sólo guarda preferencias/borrador. |
| MEMORIA | `electron/jefe-context-contract.cjs`, `electron/jefe-context-persistence.cjs` y `electron/jefe-context-integration.cjs` | Eventos locales validados e inmutables, derivados después de manifests/ledger; outbox durable e IPC semántico, sin UI ni agentes. |
| Investigación supervisada | `electron/jefe-supervised-research-orchestrator.cjs` y persistencias de sesión/caso | Correlaciona requests y receipts; sólo el orquestador promueve evidencia aceptada a MEMORIA. |
| Runtime de conectores | `electron/jefe-research-connector-contract.cjs`, persistencia, coordinador y runtime | Intenta adapters confiables locales bajo política fija; no habilita red, providers reales ni autoridad del caller. |
| Planner (4A–4C) | `electron/jefe-planner-contract.cjs`, `jefe-planner-persistence.cjs`, `jefe-planner-orchestrator.cjs` y `jefe-planner-gate.cjs` | Cierra, persiste y gatea solicitud/plan local desde puertos correlacionados de 3C y paquete de Planner; no ejecuta, no decide autoridad humana y retorna a discovery cuando evidencia o contexto no cierran. |

## Compatibilidad y exclusiones

Los aliases de generación heredada permanecen sólo para no romper callers y rechazan ejecución. Los scripts de fixtures y mocks viven en pruebas/smokes, no se cargan en el recorrido comercial runtime. No existe una segunda persistencia o bridge de paths libre dentro del flujo canónico.

## Resultados de agente (Escalón 2C-C2)

`electron/jefe-agent-result-ingestion.cjs` es la autoridad unica de ingesta desde intentos C1 hacia MEMORIA. Revalida resultado e identidad, deriva IDs deterministas y escribe eventos no autoritativos. Retry/reconciliacion son acotados e idempotentes; colisiones incompatibles quedan `ingestion_failed` y no se resuelven. El modulo no tiene lifecycle, IPC, UI, red, runners ni capacidad de ejecutar otro agente.

## Recuperacion y conflictos (Escalón 2D)

`electron/jefe-context-recovery.cjs` diagnostica y recupera solo proyecciones o trabajo compatible mediante planes cerrados. `electron/jefe-context-conflict-resolution.cjs` agrega resoluciones humanas append-only sin sobrescribir entradas ni alterar lifecycle. No hay autenticacion de operador ni UI: la autoridad semantica esta preparada internamente, no verificada end-to-end. `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`.

## Roadmap posterior

La arquitectura posterior está definida exclusivamente en `ORQUESTADOR_CANONICAL_ROADMAP.md`. `ESCALON_5_STATUS=VERIFIED_CLOSED`: 3A–3C, 4A–4D y 5A–5D están completos únicamente como fundaciones locales supervisadas, contratos y ejecución segura sin proveedor conectado. `jefe-planner-recovery.cjs` sólo recupera índices derivados de Planner mediante un plan explícito. QA/security del Escalón 6 está implementado y cerrado documentalmente con evidencia v4-final aprobada; preview, entrega, observabilidad, centro comercial, integración y governance siguen siendo escalones dependientes, no capacidades ya conectadas.

El alcance normativo de QA, seguridad y correction loop está documentado en [ORQUESTADOR_ESCALON_6_QA_SECURITY.md](ORQUESTADOR_ESCALON_6_QA_SECURITY.md). La implementación automatizada consume la salida aislada del Escalón 5 y produce evidencia local clasificada, findings sanitizados, gates persistidos, retornos explícitos y una superficie QA/IPC semántica; el cierre documental queda en `ESCALON_6_STATUS=VERIFIED_CLOSED` y no inicia Escalón 7.

## Intake supervisado (Escalón 3A)

`jefe-discovery-contract`, `jefe-discovery-persistence` y `jefe-discovery-orchestrator` son la única fundación de intake. Reutilizan MEMORIA y paquetes 2C, mantienen actores no conectados y no crean memoria, handoff ni outbox paralelos.

## Preview

La resolución segura está implementada. Se capturó evidencia visual real separada mediante Chrome/CDP local, pero no existe un protocolo Electron dedicado ni gate visual integrado: no hay iframe completo, comparación visual ni aprobación visual automatizada.

## MEMORIA integrada (Escalón 2B)

Los productores canónicos son creación, versión/cambio, aprobación local, restauración, entrega local y fallo de lifecycle. Cada entrada de versión conserva `projectId/runId/versionId`; manifests y ledger físicos mandan y MEMORIA nunca los reemplaza. Aprobación local es la única fuente de actor Lean/autoridad humana; los resultados, correcciones y fallos derivados son técnicos y sanitizados.

La outbox por proyecto soporta `synced`, `pending` y `failed`, con reapertura y reconciliación idempotentes. Las colisiones incompatibles no se fusionan. Snapshot y timeline son de sólo lectura; timeline limita 1–50 entradas, ordena determinísticamente y usa cursor opaco ligado al proyecto. IPC/preload permiten sólo operaciones semánticas allowlisted, sin append genérico, paths, roots, filesystem ni `ipcRenderer` expuesto.

`ESCALON_2_STATUS=VERIFIED_CLOSED`; `ESCALON_2A_STATUS=COMPLETED`; `ESCALON_2B_STATUS=COMPLETED`; `ESCALON_2C_STATUS=COMPLETED`; `ESCALON_2C_A_STATUS=COMPLETED`; `ESCALON_2C_B_STATUS=COMPLETED`; `ESCALON_2C_C_STATUS=COMPLETED`; `ESCALON_2C_C1_STATUS=COMPLETED`; `ESCALON_2C_C2_STATUS=COMPLETED`; `ESCALON_2D_STATUS=COMPLETED`. No hay UI de MEMORIA, agentes reales, aprendizaje, búsqueda vectorial, autenticación humana end-to-end, QA visual ni deploy.

## Paquetes de contexto (Escalón 2C-A)

`jefe-context-package-contract.cjs` y `jefe-context-package-builder.cjs` consumen sólo snapshots validados y estado de sincronización. Producen paquetes por agente/propósito allowlisted con identidad física, disposición, presupuesto, omisiones e integridad deterministas. Los adapters 2C-B revalidan y congelan el handoff con política fija; no persisten paquetes, no usan IPC ni crean permisos y su registro productivo responde `not_connected`.

2C-C1 persiste intentos y resultados no ingeridos bajo root inyectado, con correlación determinista y sin exponer paths. `completed_uningested` no escribe MEMORIA ni eleva autoridad; C2 reserva ingesta/reconciliación.

## Escalón 3B — investigación supervisada

`ESCALON_3B_STATUS=COMPLETED`; `ESCALON_3B_R1_STATUS=COMPLETED`. Registro no equivale a conexión, receipt no equivale a evidencia y evidencia aceptada no equivale a verdad absoluta. El modelo por request queda subordinado al caso agregado determinista. `receiveContribution` valida el receipt contra su request/provider y reconstruye corroboración sólo desde receipts persistidos; contradicciones permanecen `requires_human`. MEMORIA recibe un único append determinista desde el orquestador después de `accepted_for_context`.

## Escalón 3C-A — runtime seguro de conectores

`STATUS=ESCALON_3C_A_COMPLETED`; `ESCALON_3_STATUS=IN_PROGRESS`; `ESCALON_3C_A_STATUS=COMPLETED`. El contrato cierra identidad, provider y operación. La persistencia atómica conserva intentos, reservas, lineage de retry y estado durable de circuit breaker; el coordinador limita concurrencia y cancelación; el runtime aplica política confiable, timeout de adapter y reconciliación determinista. Coordinación y locks son locales al proceso en esta fundación sin providers reales.

Un adapter inyectado sólo produce un candidato no confiable. Después de sanitizarlo, el runtime llama exclusivamente `receiveContribution`; no puede forjar provider, aceptación, autoridad humana, IDs o escritura a MEMORIA. El smoke acredita 52/52 casos conductuales reales en cinco ejecuciones. `NETWORK=DISABLED`; `REAL_NETWORK_CONNECTORS=NOT_CONNECTED`. No hay DNS, fetch, shell, navegador, Electron, provider real, generación, preview, publicación ni deploy. UI, autenticación humana end-to-end y QA visual siguen pendientes; JEFE no está release-ready y `PUSH=NO`.
## Errata de estado vigente 2026-08-26

Las referencias históricas de Escalón 6 como formalizado pero no implementado quedan superseded por el cierre vigente: `ESCALON_6_STATUS=VERIFIED_CLOSED`; `ESCALON_7_STATUS=NOT_STARTED`, con evidencia v4-final aprobada externamente sobre `factory-qa-electron` (`factory_typed`).
