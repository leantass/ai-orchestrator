# Semantic Production Promotion V1

El servicio productivo sintético encadena `SemanticCorrectionExecutionPackage` → `SemanticGenerationSpec` → adapter semántico → `jefe-real-generation.cjs` → quality coordinator → Browser QA headless por HTTP loopback → `ProjectVersion` canónica → `pending_review`.

La promoción sólo acepta `executionPackageId` y `attemptId`. El backend resuelve el candidate, verifica source snapshot, hash del candidate y quality report canónico; no acepta paths ni resultados enviados por el caller. La asignación de versión es incremental y la materialización usa staging y rename atómico dentro del root permitido.

La prueba usa exclusivamente un root temporal. No habilita provider, no toca VetNova/Floe y no ejecuta aprobación o rechazo humano sobre la nueva versión. Experience Quality y Browser QA están cubiertos por el smoke sintético; el Human Gate existente queda inicializado en `pending_review` para decisión posterior.
