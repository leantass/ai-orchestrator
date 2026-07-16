# Factory Project Contract Persistence Gate v1

## Propósito

Convierte una aprobación contractual válida en un plan determinista y revisable de persistencia. El Approval Gate acepta la proyección; este gate define el payload exacto, su identidad idempotente, el destino relativo y los planes futuros de escritura atómica y rollback. Un contrato persistido y un proyecto real siguen siendo etapas distintas.

## Qué no hace

No escribe archivos, no persiste contratos, no crea proyectos ni repositorios, no ejecuta Codex, no publica y no despliega. `canPersistContract` significa que el plan es elegible para un adapter futuro, no que este módulo tenga permiso de escritura.

## Canonicalización

Los objetos se copian, se eliminan propiedades `undefined`, las keys se ordenan recursivamente y los arrays conservan su orden. El resultado es JSON estable y contiene el `FactoryProjectContract v1` completo solo dentro del resultado en memoria; el summary nunca lo reproduce.

## Fingerprint e idempotency key

El fingerprint usa FNV-1a de 32 bits. Es determinista, pero no criptográfico: no constituye firma, autenticación ni protección contra colisiones deliberadas. La idempotency key incorpora kind, versión, projectId, approvalId, fingerprint y target.

## Target relativo

El destino sugerido es `factory-project-contracts/<slug-o-projectId>/factory-project-contract.v1.json`, con metadata adyacente. Paths absolutos y segmentos `..` bloquean el plan.

## Atomic write plan

Describe, sin ejecutar: crear directorio padre, escribir temporal, validar payload temporal, rename atómico, escribir metadata y verificar readback. Incluye temp, backup y lock relativos; `notExecuted` es siempre `true`, requiere adapter runtime futuro y aprobación humana.

## Rollback plan

Describe remover el temporal, preservar el payload fallido para revisión, restaurar backup, marcar el fallo y exigir revisión humana. No ejecuta rollback.

## Validaciones

Exige approval receipt, envelope aprobado, contract validation correcta y estados `not_persisted`, `not_executable`, `not_allowed` y `not_created`. También comprueba paths relativos, metadata de entorno sin valores y la ausencia total de permisos para Codex, proyecto, repositorio, deploy o filesystem.

## Relación futura

Un adapter runtime de persistencia separado deberá autenticar la aprobación, aplicar lock e idempotencia, ejecutar escritura atómica, verificar readback, registrar evidencia en MEMORIA y activar el Correction Loop ante fallos. Este gate solo prepara el plan.

## Ejemplo resumido

```json
{
  "status": "ready_for_runtime_persistence",
  "fingerprint": { "algorithm": "fnv1a-32", "cryptographic": false },
  "target": { "targetPath": "factory-project-contracts/workflow-assistant/factory-project-contract.v1.json", "relative": true },
  "atomicWritePlan": { "notExecuted": true, "filesystemWritePerformed": false },
  "rollbackPlan": { "notExecuted": true, "rollbackExecuted": false },
  "canExecuteCodex": false
}
```

## Próximos pasos

Diseñar el runtime adapter de persistencia con permisos explícitos, canonicalización versionada, mecanismo criptográfico apropiado, lock, idempotencia durable, atomicidad real, readback y rollback probado. No debe habilitar Codex ni materialización automáticamente.
