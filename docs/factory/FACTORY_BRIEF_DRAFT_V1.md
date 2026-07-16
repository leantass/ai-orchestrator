# Factory Brief Draft v1

## Propósito

Factory Brief Draft v1 transforma una señal aprobada por JEFE en un documento estructurado, trazable y revisable. Organiza la decisión sin convertirla en autorización de construcción.

## Lugar en el flujo

```text
JEFE Opportunity Decision Gate
        │ briefDraftSignal + decisionId
        ▼
Factory Brief Draft
        │ revisión JEFE + humana
        ▼
FactoryProjectContract candidate (fase futura)
        │ aprobación separada
        ▼
Codex / construcción (no incluida aquí)
```

Una decision signal expresa que la evidencia permite redactar. El brief draft estructura producto y criterios. FactoryProjectContract definirá obligaciones ejecutables de la factory. El proyecto real será un repositorio y runtime independientes. Ninguno de esos tres últimos pasos ocurre aquí.

## Estructura

- Identidad, versión, status y lineage JEFE.
- Problema, audiencia y solución propuesta.
- Hipótesis de monetización.
- Evidencia resumida, riesgos y supuestos.
- Preguntas abiertas.
- Criterios de aceptación preliminares.
- Scope boundaries y non-goals.
- Política de independencia.
- Reviews obligatorias, readiness, blockers y warnings.
- Policy de ejecución completamente deshabilitada.

## Source y lineage

El input exige `decisionId`, porque la señal de brief no lo contiene. El source conserva opportunity, score Radar y confianza Hermes opcionales, referencias acotadas, razones de decisión y aprobación humana opcional. `generatedBy` siempre es `JEFE`; no se atribuye el brief a Codex.

No se copia evidencia cruda, secretos o PII. El summary solo expone información operacional acotada.

## Independencia

Todo draft exige:

- producto generado independiente;
- root y repositorio propios;
- ninguna dependencia del runtime JEFE;
- ningún import de módulos JEFE;
- enlaces de trazabilidad únicamente;
- FactoryProjectContract y aprobación humana antes de Codex.

## Policies

Son obligatorios opportunity, decision, problema, audiencia, solución, monetización, evidencia, criterios, boundaries e independencia. Codex, creación de proyecto/repositorio y deploy permanecen prohibidos. Los overrides no pueden degradar estas flags.

## Relación con MEMORIA y Correction Loop

MEMORIA podrá conservar decisiones y aprendizajes validados en una fase futura, pero este módulo no escribe memoria. Los criterios preliminares alimentarán el futuro JEFE Review & Correction Loop, donde tests y evidencia regresarán a JEFE; todavía no implementan un gate de release.

## Ejemplo resumido

```json
{
  "briefDraftKind": "factory-brief-draft",
  "briefDraftVersion": "1.0",
  "source": {
    "decisionId": "jefe-decision-1",
    "opportunityId": "opportunity-1",
    "generatedBy": "JEFE"
  },
  "status": "needs_human_review",
  "executionPolicy": {
    "codexExecutionAllowed": false,
    "projectCreationAllowed": false,
    "repositoryCreationAllowed": false,
    "deployAllowed": false
  }
}
```

## Qué no hace

- No ejecuta Codex o Hermes Agent.
- No crea un proyecto, root, repo o branch.
- No crea FactoryProjectContract.
- No publica ni despliega.
- No usa filesystem, red, procesos, APIs u OpenAI.

Es un documento estructurado anterior al contrato.

## Próximos pasos

Tras revisión humana, un bloque separado podrá definir la conversión controlada hacia un candidato de FactoryProjectContract. Ese paso deberá validar lineage, resolver blockers y exigir una nueva aprobación explícita.
