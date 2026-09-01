# Semantic Intelligence & Experience Engine V1

La corrección parte de `HumanFeedbackInput` persistido por el Human Gate. `CorrectionPlan`, `BusinessUnderstandingV2`, `ContentPlanV2` y `ExperiencePlanV2` son contratos separados del materializador y no mutan artifacts.

El adaptador `electron/jefe-semantic-intelligence.cjs` falla cerrado cuando no hay proveedor semántico autorizado. El provider OpenAI existente se audita como `CONFIGURED_BUT_DISABLED` cuando hay `OPENAI_API_KEY` pero no `AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED=true`; en esta ejecución no se invoca red ni se declara uso del provider. Sin clave queda `CONTRACT_ONLY`.

Los gates cubren leakage de brief, naturalidad, especificidad, FAQ, confianza y diferenciación de experiencia. Las fixtures cubren dominios distintos y no representan proyectos reales. No se creó CorrectionPlan para VetNova, no se creó `v0007` y no se modificó ningún artifact.
