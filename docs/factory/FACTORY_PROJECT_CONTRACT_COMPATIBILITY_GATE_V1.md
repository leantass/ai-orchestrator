# Factory Project Contract Compatibility Gate v1

## Propósito

Este gate verifica si un FactoryProjectContractCandidate puede proyectarse de forma segura sobre el FactoryProjectContract v1 real. Es el boundary entre una propuesta revisable y un draft contractual en memoria.

## Diferencias

- **Contract Candidate:** propuesta de identidad, stack, perfiles y obligaciones.
- **Compatibility Gate:** valida readiness, approvals y compatibilidad campo por campo.
- **FactoryProjectContract:** contrato real versionado que gobernará materialización futura.
- **Proyecto real:** aplicación independiente creada únicamente tras autorizaciones posteriores.

Un resultado `compatible` no aprueba el contrato ni crea el proyecto.

## Checks

El gate comprueba readiness, aprobación humana, lineage, repo/root propios, independencia, env vars sin valores, quality/security profiles, evidencia y ejecución deshabilitada. Después proyecta el contrato y llama a `validateFactoryProjectContractV1`.

## Mapping al contrato real

Mapea identidad, slug, descripción, project type, stack, env vars y lineage. `briefDraftId` pasa a `briefId`. Como el candidato no posee un run ejecutado, se usa un `runId` determinista marcado explícitamente como placeholder de proyección y warning; nunca representa ejecución real.

También incorpora defaults seguros y explícitos para:

- paths relativos y portables;
- namespaces de memoria;
- quality y security;
- approvals y repositorio GitHub planificado;
- CI planificado sin deploy;
- staging/producción deshabilitados;
- analítica por decidir;
- artifacts y lifecycle draft.

No se inventan silenciosamente owner, approvals o readiness: su ausencia bloquea la compatibilidad.

## Resultado

Si falla un check o el validador del contrato, devuelve `blocked`/`needs_human_review`, blockers y warnings. Si todo pasa, devuelve `compatible`, `contractDraft` y `contractValidation.ok: true`.

En todos los estados:

```text
canExecuteCodex: false
canCreateProject: false
canCreateRepository: false
canDeploy: false
```

`canCreateFactoryProjectContract: true` significa únicamente que el draft puede someterse a revisión final; no persiste ni aprueba nada.

## Relación futura

MEMORIA podrá registrar decisiones validadas después de aprobación. El JEFE Review & Correction Loop podrá reutilizar los checks y evidencia, pero este gate no ejecuta tests, correcciones o release.

## Ejemplo resumido

```json
{
  "status": "compatible",
  "canCreateFactoryProjectContract": true,
  "canExecuteCodex": false,
  "canCreateProject": false,
  "canCreateRepository": false,
  "canDeploy": false,
  "contractValidation": { "ok": true }
}
```

## Qué no hace

- No persiste contrato final.
- No crea proyecto, repo, root o branch.
- No ejecuta Codex o Hermes.
- No publica ni despliega.
- No usa filesystem, red, procesos, APIs u OpenAI.

Solo produce un reporte de compatibilidad y, si corresponde, una proyección contractual en memoria.

## Próximos pasos

Revisión humana del diff candidato→contrato y aprobación explícita del contrato real en un bloque separado. Solo después deberá diseñarse un permit para Codex y materialización controlada.
