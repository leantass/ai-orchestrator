# Arquitectura canónica

## Autoridades únicas

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

## Compatibilidad y exclusiones

Los aliases de generación heredada permanecen sólo para no romper callers y rechazan ejecución. Los scripts de fixtures y mocks viven en pruebas/smokes, no se cargan en el recorrido comercial runtime. No existe una segunda persistencia o bridge de paths libre dentro del flujo canónico.

## Resultados de agente (Escalón 2C-C2)

`electron/jefe-agent-result-ingestion.cjs` es la autoridad unica de ingesta desde intentos C1 hacia MEMORIA. Revalida resultado e identidad, deriva IDs deterministas y escribe eventos no autoritativos. Retry/reconciliacion son acotados e idempotentes; colisiones incompatibles quedan `ingestion_failed` y no se resuelven. El modulo no tiene lifecycle, IPC, UI, red, runners ni capacidad de ejecutar otro agente.

## Recuperacion y conflictos (Escalón 2D)

`electron/jefe-context-recovery.cjs` diagnostica y recupera solo proyecciones o trabajo compatible mediante planes cerrados. `electron/jefe-context-conflict-resolution.cjs` agrega resoluciones humanas append-only sin sobrescribir entradas ni alterar lifecycle. No hay autenticacion de operador ni UI: la autoridad semantica esta preparada internamente, no verificada end-to-end. `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`.

## Roadmap posterior

La arquitectura posterior está definida exclusivamente en `ORQUESTADOR_CANONICAL_ROADMAP.md`. Escalón 3 inicia intake supervisado sin proveedores; Planner, ejecución, QA, preview, entrega, observabilidad, centro comercial, integración y governance son escalones dependientes, no capacidades ya conectadas.

## Intake supervisado (Escalón 3A)

`jefe-discovery-contract`, `jefe-discovery-persistence` y `jefe-discovery-orchestrator` son la única fundación de intake. Reutilizan MEMORIA y paquetes 2C, mantienen actores no conectados y no crean memoria, handoff ni outbox paralelos.

## Preview

La resolución segura está implementada. Un protocolo Electron dedicado no fue registrado en este escalón; por tanto no hay iframe integrado completo, evidencia visual, comparación visual ni aprobación visual automatizada.

## MEMORIA integrada (Escalón 2B)

Los productores canónicos son creación, versión/cambio, aprobación local, restauración, entrega local y fallo de lifecycle. Cada entrada de versión conserva `projectId/runId/versionId`; manifests y ledger físicos mandan y MEMORIA nunca los reemplaza. Aprobación local es la única fuente de actor Lean/autoridad humana; los resultados, correcciones y fallos derivados son técnicos y sanitizados.

La outbox por proyecto soporta `synced`, `pending` y `failed`, con reapertura y reconciliación idempotentes. Las colisiones incompatibles no se fusionan. Snapshot y timeline son de sólo lectura; timeline limita 1–50 entradas, ordena determinísticamente y usa cursor opaco ligado al proyecto. IPC/preload permiten sólo operaciones semánticas allowlisted, sin append genérico, paths, roots, filesystem ni `ipcRenderer` expuesto.

`ESCALON_2_STATUS=IN_PROGRESS`; `ESCALON_2A_STATUS=COMPLETED`; `ESCALON_2B_STATUS=COMPLETED`; `ESCALON_2C_STATUS=COMPLETED`; `ESCALON_2C_A_STATUS=COMPLETED`; `ESCALON_2C_B_STATUS=COMPLETED`; `ESCALON_2C_C_STATUS=COMPLETED`; `ESCALON_2C_C1_STATUS=COMPLETED`; `ESCALON_2C_C2_STATUS=COMPLETED`; `ESCALON_2D_STATUS=NOT_STARTED`. No hay UI de MEMORIA, agentes reales, aprendizaje, búsqueda vectorial, resolución humana de conflictos, compactación/retención final, QA visual ni deploy.

## Paquetes de contexto (Escalón 2C-A)

`jefe-context-package-contract.cjs` y `jefe-context-package-builder.cjs` consumen sólo snapshots validados y estado de sincronización. Producen paquetes por agente/propósito allowlisted con identidad física, disposición, presupuesto, omisiones e integridad deterministas. Los adapters 2C-B revalidan y congelan el handoff con política fija; no persisten paquetes, no usan IPC ni crean permisos y su registro productivo responde `not_connected`.

2C-C1 persiste intentos y resultados no ingeridos bajo root inyectado, con correlación determinista y sin exponer paths. `completed_uningested` no escribe MEMORIA ni eleva autoridad; C2 reserva ingesta/reconciliación.

## Escalón 3B — investigación supervisada

ESCALON_3B_STATUS=COMPLETED; registro no equivale a conexión, receipt no equivale a evidencia y evidencia aceptada no equivale a verdad absoluta. La red sigue deshabilitada y los proveedores reales no están conectados. Las sesiones de investigación son durables, con receipts inmutables, replay, recuperación de evidence_pending y corrupción aislada. El contenido externo permanece no confiable; la defensa SSRF es offline hasta 3C. El fallo C2 anterior no volvió a reproducirse; se corrigió una carrera real de staging de MEMORIA mediante secuencia monotónica local y regresión determinista.