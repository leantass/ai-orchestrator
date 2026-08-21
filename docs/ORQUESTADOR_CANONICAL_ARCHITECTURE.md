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

## Preview

La resolución segura está implementada. Un protocolo Electron dedicado no fue registrado en este escalón; por tanto no hay iframe integrado completo, evidencia visual, comparación visual ni aprobación visual automatizada.

## MEMORIA integrada (Escalón 2B)

Los productores canónicos son creación, versión/cambio, aprobación local, restauración, entrega local y fallo de lifecycle. Cada entrada de versión conserva `projectId/runId/versionId`; manifests y ledger físicos mandan y MEMORIA nunca los reemplaza. Aprobación local es la única fuente de actor Lean/autoridad humana; los resultados, correcciones y fallos derivados son técnicos y sanitizados.

La outbox por proyecto soporta `synced`, `pending` y `failed`, con reapertura y reconciliación idempotentes. Las colisiones incompatibles no se fusionan. Snapshot y timeline son de sólo lectura; timeline limita 1–50 entradas, ordena determinísticamente y usa cursor opaco ligado al proyecto. IPC/preload permiten sólo operaciones semánticas allowlisted, sin append genérico, paths, roots, filesystem ni `ipcRenderer` expuesto.

`ESCALON_2_STATUS=IN_PROGRESS`; `ESCALON_2A_STATUS=COMPLETED`; `ESCALON_2B_STATUS=COMPLETED`; `ESCALON_2C_STATUS=NOT_STARTED`; `ESCALON_2D_STATUS=NOT_STARTED`. No hay UI de MEMORIA, paquetes/consumo para agentes, aprendizaje, búsqueda vectorial, resolución humana de conflictos, compactación/retención final, QA visual ni deploy.
