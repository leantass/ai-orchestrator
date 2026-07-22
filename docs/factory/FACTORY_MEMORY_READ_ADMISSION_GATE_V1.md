# Factory Memory Read Admission Gate v1

## Propósito

Convierte entradas seguras de un `FactoryMemoryRegistryIntegrityReport` en candidatos mínimos y gobernados de lectura para JEFE. El Integrity Gate establece confiabilidad; este gate decide admisión para una etapa futura de lectura.

## Alcance y decisiones

Las decisiones son `blocked`, `reject_memory_read`, `request_memory_repair`, `human_review_required` y `approve_memory_read_candidates`. Solo memoria project-scoped, contenida, íntegra y con `canUseForMemoryRead: true` puede producir candidates. Findings críticos rechazan la entrada; findings de error, flags inseguros, namespaces incompatibles o identificadores de integridad faltantes la bloquean. Warnings no críticos pueden conservarse como `warning_candidate`.

Los read purposes son `jefe_review_context`, `factory_planning_context`, `memory_audit_context`, `codex_task_preparation_candidate` y `human_review_context`. La preparación candidata para Codex Task requiere referencia de revisión humana, pero nunca habilita la creación de la task.

## Candidates, minimal facts y referencias seguras

Cada `FactoryMemoryReadCandidateDraft` contiene identidad del record, namespace de proyecto, fingerprint, idempotency key, targets lógicos, estado de integridad y flags seguros. `safeReferences` solo conserva targets lógicos; no contiene contenido del record ni payload canónico.

El candidate declara siempre:

- `containsFullMemoryRecord: false`;
- `containsCanonicalPayload: false`;
- `containsRawEvidence: false`;
- `containsSecrets: false`;
- runtime read, context assembly, Codex Task, Codex, embeddings, proyecto, repo y deploy deshabilitados.

## Lineage, freshness y retention

Lineage referencia el reporte de integridad y la entrada del registry, con campos opcionales para persistence, approval y admission cuando estén disponibles. Freshness conserva el momento del integrity check y marca `current`, `unknown` o `stale_candidate`. Retention es read-only y prohíbe mutación. El gate no repara registros ni resuelve stale automáticamente.

## Qué no hace

No usa filesystem, no lee records completos, no escribe archivos, no crea base de datos ni embeddings, no arma contexto final, no crea Codex Task, no ejecuta Codex o Hermes, no crea proyecto o repositorio y no hace deploy. Tampoco integra Electron, UI o IPC.

## Flujo futuro

Un candidate aprobado puede dirigirse a un futuro `Factory Memory Read Runtime Adapter` y luego a un `Factory Memory Context Assembly Gate`. Solo después de nuevas aprobaciones podría alimentar un `Codex Task Contract`; nunca va directo a Codex.

## Ejemplo resumido

```json
{
  "decision": "approve_memory_read_candidates",
  "status": "read_candidates_ready",
  "candidates": [{
    "memoryRecordId": "memory-record-1",
    "readScope": "project",
    "containsFullMemoryRecord": false,
    "canCreateCodexTask": false
  }],
  "canReadMemoryRuntime": false,
  "canAssembleContext": false
}
```

## Próximos pasos

Implementar, en bloques separados, el runtime controlado de lectura y el assembly gobernado de contexto, preservando minimización, trazabilidad y revisión humana.
