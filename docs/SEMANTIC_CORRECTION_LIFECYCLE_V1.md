# Semantic Correction Lifecycle V1

El bridge separa `SemanticCorrectionAttempt` temporal de `ProjectVersion` comercial. Un `SemanticCorrectionExecutionPackage` reúne planes estructurados, referencias, hashes, gates y reglas de preservación. El candidate se genera fuera del lifecycle comercial; sólo un candidate validado se promueve atómicamente a una nueva versión.

La versión fuente se declara inmutable. La promoción es idempotente para el mismo destino y conserva el lineage `sourceVersionId → correctionId → newVersionId`. El hard gate exige `CorrectionPlan`, BU V2, ContentPlan V2, ExperiencePlan V2 y `semanticGates=PASS`; un fallo no crea una versión.

Este bloque sólo valida plumbing con fixtures temporales. No lee HumanFeedback real, no llama providers, no crea `v0007` y no modifica artifacts reales.

`ProductionGeneratorIntegration=NOT_IMPLEMENTED`. El `candidateGenerator` del smoke está marcado conceptualmente como `TEST/FIXTURE ONLY`; el bridge exige que un caller inyecte el generator, por lo que no puede confundirse con el generador comercial productivo.
