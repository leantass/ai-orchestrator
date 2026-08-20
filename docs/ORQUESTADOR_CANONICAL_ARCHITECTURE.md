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

## Compatibilidad y exclusiones

Los aliases de generación heredada permanecen sólo para no romper callers y rechazan ejecución. Los scripts de fixtures y mocks viven en pruebas/smokes, no se cargan en el recorrido comercial runtime. No existe una segunda persistencia o bridge de paths libre dentro del flujo canónico.

## Preview

La resolución segura está implementada. Un protocolo Electron dedicado no fue registrado en este escalón; por tanto no hay iframe integrado completo, evidencia visual, comparación visual ni aprobación visual automatizada.
