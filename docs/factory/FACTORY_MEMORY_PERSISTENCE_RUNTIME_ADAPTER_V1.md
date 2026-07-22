# Factory Memory Persistence Runtime Adapter v1

## Propósito y frontera Node

Memory Persistence Gate produce un plan puro; este adapter ejecuta ese plan bajo un `storageRoot` controlado en `.codex-temp`. Tipos, defaults, validación y serialización viven en `src`; `node:fs/promises` y `node:path` viven exclusivamente en `electron/factory/memory-persistence-runtime/`. No se integra todavía con Electron runtime, preload o IPC.

## Qué escribe y dónde

Escribe memory record JSON, metadata JSON e índice project-scoped únicamente bajo el root autorizado. Los logical targets deben comenzar con `factory-memory/projects/`, ser relativos y no contener traversal. Todos los paths finales, temporales e índices se verifican contra el root.

## Escritura atómica e idempotencia

Cada record se escribe primero a temp, se verifica y se promueve con rename. Metadata e índice usan el mismo patrón. Si target y metadata existentes tienen el mismo fingerprint e idempotency key, devuelve `idempotent_noop`. Un fingerprint diferente produce conflicto y nunca sobrescribe el record.

## Metadata e índice

La metadata conserva lineage, fingerprint, idempotency, namespace y flags fail-closed sin payload completo. Cada proyecto recibe `index.v1.json` con records, fingerprints e idempotency keys; no existe índice global en v1.

## Rollback y errores

Ante fallo se intentan eliminar solo temporales creados. No se borran targets, metadata o índices existentes. Los errores se sanitizan y el summary no incluye stacktrace o payloads.

## Qué no hace

No crea base de datos/vector store, embeddings, Codex Task, proyecto o repo; no ejecuta Hermes/Codex ni despliega. Solo escribe bajo `.codex-temp` durante control local. No accede a secretos ni usa shell, child_process o comandos externos.

## Relaciones futuras

Un Memory Registry futuro podrá descubrir y verificar estos records. Un Codex Task Contract Gate separado podrá consumir memoria ya gobernada; este adapter no autoriza Codex directamente.

## Ejemplo

```json
{"runtimePersistenceKind":"factory-memory-persistence-runtime","status":"persisted","recordsWritten":1,"canCreateEmbeddings":false,"canCreateCodexTask":false}
```

## Próximos pasos

Diseñar Memory Registry e Integrity Gate para memory records antes de habilitar cualquier consumo posterior.
