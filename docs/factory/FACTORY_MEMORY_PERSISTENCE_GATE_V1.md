# Factory Memory Persistence Gate v1

## Propósito

Memory Write Approval decide qué drafts pueden avanzar. Memory Persistence Gate define, sin ejecutar, cómo se canonicalizarían y persistirían como MEMORIA project-scoped. El resultado es un plan serializable, no memoria escrita.

## Canonicalización, fingerprint e idempotencia

La canonicalización elimina `undefined`, ordena keys de objetos y preserva arrays. Cada record recibe un fingerprint FNV-1a de 32 bits. Es determinístico y no criptográfico: detecta cambios básicos y soporta idempotencia, pero no es firma digital. La idempotency key incluye kind/version, namespace, record ID, approval/admission IDs, fingerprint y target.

## Targets lógicos

Los targets no son paths filesystem. V1 exige `factory-memory/projects/<project>/records/<kind>/<record>.v1.json`, metadata vecina e índice project-scoped. Se rechazan targets absolutos, traversal, segmentos vacíos y targets globales.

## Manifest

El manifest resume approval/admission lineage, records, namespaces, fingerprints, idempotency keys y targets. Declara memoria no persistida/no ejecutable, embeddings y Codex Task no permitidos y promoción global bloqueada.

## Atomic write plan

Cada record describe pasos futuros: preparar namespace, escribir temp, validar, promover atómicamente, escribir metadata, actualizar índice y verificar readback. `notExecuted` es true y `memoryWritePerformed` es false. Requiere runtime adapter y revisión humana separados.

## Rollback plan

Describe limpieza de temp, preservación para revisión, restauración eventual, marcado de fallo y revisión humana. No ejecuta rollback ni filesystem.

## Qué no hace

No escribe memoria real, no crea base de datos/vector store, no usa embeddings/OpenAI, no ejecuta Hermes/Codex, no crea proyecto/repo y no despliega. Solo genera un plan de persistencia project-scoped.

## Relaciones futuras

Un Factory Memory Runtime Adapter futuro deberá validar nuevamente el plan, contener rutas reales y ejecutar solo con autorización humana. MEMORIA canónica persistida podrá alimentar otro gate de Codex Task Contract; este bloque nunca lo habilita.

## Ejemplo

```json
{"persistenceKind":"factory-memory-persistence","status":"ready_for_memory_runtime_persistence","manifest":{"memoryPersistenceStatus":"not_persisted","embeddingsStatus":"not_allowed"},"canWriteMemoryRuntime":false}
```

## Próximos pasos

Diseñar un runtime adapter contenido, idempotente, auditable y reversible, sin mezclarlo con Codex Task, embeddings o promoción global.
