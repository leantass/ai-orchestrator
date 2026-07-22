# Factory Memory Registry Integrity Gate v1

## Propósito y frontera Node

Memory Registry descubre memoria; Integrity Gate verifica si record, metadata, project index y registry index son coherentes antes de cualquier consumo. Contratos, validación y serialización viven en `src`; readback, canonicalización y filesystem viven en CJS bajo `electron/factory/memory-registry-integrity/`.

## Verificación profunda

El gate comprueba existencia y parsing, identidad y namespaces, flags fail-closed, containment, pertenencia al project index y vigencia del registry index. Compara registry entry, metadata y record, y reporta duplicados, conflictos y huérfanos sin reparar nada.

## Fingerprint e idempotencia

Canonicaliza localmente con keys ordenadas, arrays preservados y `undefined` omitido. Recalcula FNV-1a de 32 bits igual que Memory Persistence Gate. Es determinístico pero no criptográfico y no sustituye una firma. La idempotency key se recalcula con kind/version, namespace, record/approval/admission IDs, fingerprint y logical target; lineage incompleto genera warning, no datos inventados.

## Índices y findings

Project index debe contener record, fingerprint e idempotency correctos y flags seguros. Registry index se compara con el índice recibido y filesystem. Findings usan severidades info, warning, error y critical; missing files, tampering, unsafe paths/flags y mismatch crítico bloquean lectura.

## Qué no hace

Solo lee bajo un `storageRoot` en `.codex-temp`. No modifica records, metadata o índices; no repara conflictos; no crea DB, embeddings, Codex Task, proyecto o repo; no ejecuta Hermes/Codex ni despliega; no se integra con Electron runtime/IPC.

## Relaciones futuras

Findings deben ir a un Registry Repair gobernado. Solo referencias clean podrán presentarse a un Codex Task Contract Gate futuro, que seguirá requiriendo aprobación separada.

## Ejemplo

```json
{"integrityKind":"factory-memory-registry-integrity","status":"clean","summary":{"cleanEntries":1,"canUseForCodexTask":0},"canCreateEmbeddings":false}
```

## Próximos pasos

Definir Registry Repair y luego un Codex Task Contract Gate que consuma únicamente memoria íntegra.
