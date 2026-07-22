# Factory Memory Read Runtime Adapter v1

## Propósito

Ejecuta la lectura controlada de candidates aprobados por Memory Read Admission. Admission decide qué puede leerse; este adapter resuelve referencias lógicas, lee record y metadata bajo un root autorizado y devuelve una representación minimizada.

## Frontera Node y containment

Tipos, defaults, validadores y serialización viven en `src/factory/memory-read-runtime/` sin imports Node. El acceso mediante `node:fs/promises` y `node:path` vive exclusivamente en `electron/factory/memory-read-runtime/`, sin integración con `electron/main.cjs`, preload o IPC.

`storageRoot` debe estar dentro de `.codex-temp`. Los targets deben ser relativos, carecer de traversal y comenzar con `factory-memory/projects/`. Record y metadata resueltos deben permanecer dentro del root.

## Read flow

El executor exige admission aprobada y candidates project-scoped. Lee record y metadata, compara identidad, namespace, fingerprint, idempotency y flags. Missing files, mismatches, contenido sensible o referencias inseguras bloquean el item de forma fail-closed.

## Safe memory record

La salida conserva solamente identidad, title, summary, canonical facts seguros, referencias lógicas, lineage, tags y políticas de retention/promotion/stale. No devuelve el canonical payload de persistencia, rutas absolutas, credenciales, evidencia cruda ni instrucciones finales para Codex.

## Metadata readback y minimización

Metadata se reduce a identidad, fingerprint, idempotency, target lógico, auditoría temporal y flags de seguridad. El summary excluye tanto `safeMemoryRecord` como metadata completa.

## Error handling

Los errores se sanitizan, no incluyen stacktrace crudo y no disparan reparación o mutación. El adapter nunca modifica record, metadata o índices.

## Límites

Solo lee bajo `.codex-temp`. No escribe memoria, no crea DB o embeddings, no arma contexto, no crea Codex Task, no ejecuta Codex/Hermes, no crea proyecto/repositorio y no deploya. Todavía no integra Electron runtime, UI o IPC.

## Próximos pasos

Enviar resultados seguros a un futuro `Factory Memory Context Assembly Gate`; cualquier `Codex Task Contract` requiere gates y aprobaciones posteriores.
