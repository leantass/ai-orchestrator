# Factory Memory Write Approval Gate v1

## Propósito

Memory Admission determina qué records podrían ingresar a MEMORIA. Memory Write Approval revisa esos drafts y, con aprobación humana explícita, puede emitir un candidato project-scoped para una futura etapa de persistencia. Compatibilidad o admisión por sí solas no autorizan escritura.

## Qué aprueba

V1 solo aprueba `FactoryMemoryRecordDraft` válidos, project-scoped, sin secretos, evidencia cruda, contradicciones ni capacidades operativas. La decisión positiva es `approve_project_memory_for_persistence_candidate`; todavía no representa memoria escrita.

## Decisiones

- `reject_memory_admission`
- `request_memory_changes`
- `human_review_required`
- `approve_project_memory_for_persistence_candidate`
- `block_memory_write`
- `blocked`

## Policy default

La policy exige admission result, reviewer, aprobación humana, al menos un draft, scope de proyecto, namespace y lineage válidos, retention/promotion/stale policies y ausencia de findings críticos, bloqueos, secretos o evidencia cruda. Los overrides no pueden habilitar escritura, promoción global, Codex, proyecto, repositorio o deploy.

## Approval receipt

El receipt conserva approval/admission IDs, reviewer, fecha, human approval ref, alcance y limitaciones. `notAuthorizedActions` bloquea escritura runtime, promoción global, Codex Task, ejecución de Codex, creación de proyecto/repo, deploy, publicación, secretos y embeddings.

## Approved memory envelope

El envelope contiene copias de los drafts aprobados y validación en memoria. Sus estados son `not_persisted`, `not_executable`, `not_allowed` y `not_created`. El siguiente paso es un futuro Factory Memory Persistence Gate.

## Project scope, global promotion y contradicciones

V1 solo admite candidatos project-scoped. La promoción global está prohibida incluso con human approval ordinario y requerirá un gate específico. Contradicciones no resueltas y entries rechazadas o bloqueadas impiden aprobación.

## Qué no hace

No escribe memoria real, no crea base de datos o vector store, no usa embeddings u OpenAI, no usa filesystem, no ejecuta Hermes o Codex, no crea proyecto/repo y no despliega. Solo aprueba un candidato de persistencia de memoria project-scoped.

## Relaciones futuras

Un Factory Memory Persistence Gate deberá canonicalizar, aplicar idempotencia y preparar escritura reversible. Después, un Memory Runtime Adapter separado podría persistir bajo autorización explícita. Codex Task Contract deberá tener su propio gate y consumir únicamente memoria canónica ya persistida.

## Ejemplo

```json
{
  "approvalKind": "factory-memory-write-approval",
  "decision": "approve_project_memory_for_persistence_candidate",
  "status": "approved_candidate",
  "approvedMemoryEnvelope": {
    "memoryPersistenceStatus": "not_persisted",
    "globalPromotionStatus": "not_allowed",
    "codexTaskStatus": "not_allowed"
  },
  "canWriteMemoryRuntime": false
}
```

## Próximos pasos

Definir Factory Memory Persistence Gate v1 sin filesystem y mantener separada cualquier ejecución runtime, promoción global o creación de Codex Task.
