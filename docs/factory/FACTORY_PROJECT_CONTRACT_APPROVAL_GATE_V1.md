# Factory Project Contract Approval Gate v1

## Propósito

Este gate decide si JEFE acepta una proyección compatible de FactoryProjectContract para convertirla en candidata a persistencia contractual futura. Añade revisión de negocio y gobierno sobre la compatibilidad técnica.

## Diferencias

- **Compatibility Gate:** demuestra que el candidato puede mapearse al contrato real.
- **Approval Gate:** decide si JEFE acepta esa proyección bajo aprobación humana.
- **FactoryProjectContract:** contrato final todavía no persistido.
- **Proyecto real:** aplicación independiente que tampoco se crea aquí.

Compatibilidad no implica aprobación, y aprobación candidata no implica ejecución.

## Decisiones

- `reject_contract_draft`
- `request_contract_changes`
- `human_review_required`
- `approve_contract_for_final_review`
- `approve_contract_for_persistence_candidate`
- `blocked`

## Policy default y checks

Exige resultado compatible, draft, validación correcta, reviewer, aprobación humana, ausencia de blockers/warnings críticos, independencia, repo/root propios y env vars sin valores. Codex, proyecto, repo, persistencia y deploy permanecen deshabilitados.

## Approval receipt

El receipt registra review, approval reference, scope y limitaciones. Su scope es únicamente `contract_persistence_candidate_only`. Declara expresamente como no autorizados: Codex, proyecto, repo, deploy, publicación, mutación de runtime y secretos.

## Approved contract envelope

El envelope contiene una copia en memoria del draft y su validación. Sus estados son:

```text
persistenceStatus: not_persisted
runtimeStatus: not_executable
codexStatus: not_allowed
repositoryStatus: not_created
deployStatus: not_allowed
```

No se agregó fingerprint: queda reservado para el futuro boundary de persistencia, donde deberá definirse una canonicalización estable y una primitiva criptográfica aprobada.

## Bloqueos

Un resultado incompatible, draft ausente, validación fallida, blockers previos o warning crítico bloquea o solicita cambios. Sin human approval se exige revisión humana.

## Relación futura

MEMORIA podrá conservar el receipt solo después de validación. El Correction Loop podrá devolver cambios contractuales y repetir compatibilidad/aprobación. Un bloque futuro deberá diseñar persistencia final con canonicalización, fingerprint, atomicidad, rollback y auditoría.

## Ejemplo

```json
{
  "decision": "approve_contract_for_persistence_candidate",
  "status": "approved_candidate",
  "canPersistFactoryProjectContract": false,
  "canExecuteCodex": false,
  "canCreateProject": false,
  "canCreateRepository": false,
  "canDeploy": false,
  "approvedContractEnvelope": {
    "persistenceStatus": "not_persisted",
    "runtimeStatus": "not_executable",
    "codexStatus": "not_allowed"
  }
}
```

## Qué no hace

- No persiste el contrato final.
- No crea proyecto, repo, root o branch.
- No ejecuta Codex o Hermes.
- No publica ni despliega.
- No usa filesystem, red, procesos, APIs u OpenAI.

Solo aprueba una proyección contractual para una etapa posterior.

## Próximos pasos

Revisión humana del receipt/envelope y diseño separado del persistence gate. La materialización y Codex deberán conservar permisos independientes posteriores.
