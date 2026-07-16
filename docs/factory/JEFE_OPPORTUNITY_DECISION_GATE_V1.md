# JEFE Opportunity Decision Gate v1

## Propósito

Este gate convierte una oportunidad evaluada por Radar y, cuando corresponde, investigada mediante JefeHermesAdapter en una decisión explícita y auditable de JEFE. Separa evidencia de autorización: Radar puntúa, Hermes investiga y JEFE decide.

## Problema que resuelve

Sin un gate, un score o un reporte podrían confundirse con autorización para construir. El módulo aplica umbrales, riesgos, cobertura y aprobación humana antes de emitir señales acotadas. Nunca crea un proyecto ni habilita Codex.

## Flujo

```text
MarketOpportunity + RadarEvaluationResult
              + JefeHermesResearchReport opcional
                              │
                              ▼
               JEFE Opportunity Decision Gate
                              │
          reject / hold / research / human review
                    / brief signal / candidate signal
```

## Relación con Radar y Hermes

Radar aporta decisión preliminar, score y riesgos. Hermes aporta evidencia, confianza, diversidad, cobertura, contradicciones y riesgos. Hermes no decide construir. Un reporte faltante o incompleto produce investigación adicional cuando la policy exige Hermes.

## Decisiones

- `reject_opportunity`
- `hold_opportunity`
- `request_more_research`
- `human_review_required`
- `approve_brief_draft`
- `prepare_factory_project_candidate`
- `blocked`

## Política default

Se exige Hermes para brief y candidato, Radar ≥ 70, confianza Hermes ≥ 0,7, al menos tres evidencias y dos fuentes, cobertura completa, ausencia de riesgos críticos y contradicciones fuertes. Las categorías sensibles requieren revisión humana. Un candidato requiere aprobación humana explícita.

Las flags de seguridad no admiten degradación mediante overrides: Codex, creación de proyecto y deploy permanecen deshabilitados.

## Brief draft signal

`approve_brief_draft` emite contexto mínimo para redactar un brief: problema, audiencia, solución propuesta, monetización, evidencia resumida, riesgos, supuestos, preguntas abiertas y borrador de criterios. No es un brief final ni un FactoryProjectContract.

## Project candidate signal

Con evidencia suficiente y aprobación humana de scope `project_candidate`, el gate puede emitir `prepare_factory_project_candidate`. La señal exige repo propio, independencia de runtime, FactoryProjectContract futuro y nueva aprobación antes de Codex. No crea repositorio, branch, archivos o contrato real.

## Revisión humana

Riesgos críticos, sensibilidad legal/financiera/sanitaria o una recomendación de Hermes para revisión bloquean el avance automático. Contradicciones fuertes y cobertura incompleta solicitan más investigación.

## JEFE Review & Correction Loop

Este gate gobierna la oportunidad antes de construcción. En fases posteriores, toda entrega, test, QA, seguridad y prompt evaluation regresará a JEFE. Este módulo no implementa todavía ese ciclo, pero preserva el principio de que evidencia y herramientas no se autoaprueban.

## Ejemplo resumido

```json
{
  "opportunityId": "opportunity-1",
  "radarScore": 80,
  "hermesConfidence": 0.85,
  "decision": "approve_brief_draft",
  "codexAllowed": false,
  "projectCreationAllowed": false,
  "deployAllowed": false,
  "recommendedNextStep": "Draft a Factory brief for JEFE review."
}
```

Una señal candidata agrega `repositoryRequired`, `runtimeIndependenceRequired` y `requiresFactoryProjectContract`, todos en `true`, junto con la referencia de aprobación humana.

## Qué no hace

- No llama Codex ni Hermes Agent.
- No crea proyectos, repositorios, branches o contratos reales.
- No publica ni despliega.
- No accede a filesystem, red, procesos o APIs.
- No reemplaza aprobación humana cuando hay riesgo.

## Próximos pasos

Después de revisión humana, el siguiente contrato puede modelar el Factory Brief Draft. La conversión de una señal candidata a FactoryProjectContract debe permanecer en un bloque separado, con validación y aprobación propias.
