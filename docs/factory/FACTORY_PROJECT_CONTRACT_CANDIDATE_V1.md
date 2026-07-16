# Factory Project Contract Candidate v1

## Propósito

Este módulo transforma un Factory Brief Draft en un candidato estructurado para un futuro FactoryProjectContract. Prepara identidad, lineage, stack, repositorio, calidad, seguridad, evidencia y aprobaciones sin crear recursos ni habilitar construcción.

## Diferencias

- **FactoryBriefDraft:** estructura problema, audiencia, solución y criterios preliminares.
- **Contract Candidate:** propone metadatos y obligaciones para revisión.
- **FactoryProjectContract:** contrato real futuro que gobernará la materialización.
- **Proyecto real:** aplicación independiente con root, repo y runtime propios.

El candidato no es ninguno de los dos últimos.

## Mapping y lineage

Conserva `briefDraftId`, `opportunityId`, `decisionId`, scores opcionales, referencias de evidencia y revisión humana. Declara `generatedBy: JEFE` y `derivedFrom: FactoryBriefDraft`; Codex no aparece como autor.

El título genera determinísticamente nombre, project ID y slug. El slug se normaliza a minúsculas ASCII, usa guiones, elimina repeticiones, limita longitud y tiene fallback seguro.

## Estructura

- Identidad sugerida y project type.
- Descripción, problema, audiencia, solución y monetización.
- Stack inicial, todavía revisable.
- Policy de repositorio propio sin autorización de crearlo.
- Variables de entorno como metadata sin valores.
- Quality y security profiles iniciales.
- Evidencias y aprobaciones requeridas.
- Independencia, readiness, blockers y siguiente paso.

## Repositorio e independencia

El candidato exige root y repositorio propios, independencia del runtime JEFE, ausencia de imports JEFE y trazabilidad solamente. `repository.creationAllowed` permanece en `false`.

## Variables de entorno

Cada variable declara nombre, obligatoriedad, secreto, scope, descripción, defaults y producción. Están prohibidos `value`, `actualValue`, `token`, `apiKeyValue` y `secretValue`. Los valores reales pertenecen a una configuración posterior y segura.

## Quality y security profiles

El perfil inicial planifica typecheck, lint, unit, integration, E2E, accesibilidad y performance. Seguridad exige no almacenar valores secretos, least privilege, approvals para llamadas/deploy, revisión de prompt injection y dependencias. Estas herramientas no se instalan aquí.

## Approvals y readiness

- Blockers del brief → `not_ready`.
- Sin human review → `needs_human_review`.
- Brief completo y human review → `ready_for_contract_draft`.

Incluso en estado ready, solo se autoriza redactar un FactoryProjectContract para revisión separada. Codex, proyecto, repo y deploy siguen deshabilitados.

## Relación futura

FactoryProjectContract formalizará el candidato tras una nueva revisión. MEMORIA podrá conservar decisiones validadas, y los criterios alimentarán el JEFE Review & Correction Loop. Ninguna integración se implementa todavía.

## Ejemplo resumido

```json
{
  "candidateKind": "factory-project-contract-candidate",
  "identity": { "slugSuggestion": "workflow-assistant" },
  "repository": { "repositoryRequired": true, "creationAllowed": false },
  "readiness": { "status": "needs_human_review" },
  "executionPolicy": {
    "codexExecutionAllowed": false,
    "projectCreationAllowed": false,
    "repositoryCreationAllowed": false,
    "deployAllowed": false
  }
}
```

## Qué no hace

- No crea FactoryProjectContract real.
- No crea proyecto, root, repo o branch.
- No ejecuta Codex o Hermes.
- No publica ni despliega.
- No usa filesystem, red, procesos, APIs u OpenAI.

## Próximos pasos

Revisión humana del candidato y, en un bloque separado, diseño de una conversión explícita al FactoryProjectContract v1 existente. Esa conversión deberá validar compatibilidad campo por campo y mantener rollback contractual.
