# JEFE Product Pipeline v1

El flujo comercial conserva un bundle persistible y versionable:

ProductBrief -> ProductStrategy -> ExperiencePlan -> VisualSystem -> ContentPlan -> BuildPlan -> PhysicalArtifact

El brief original es inmutable. Las solicitudes se guardan en `revisions[]` con `revisionId`, `baseBriefId`, clasificación y planes afectados; nunca se concatenan al brief ni se renderizan como contenido customer-facing.

El planner deriva sus decisiones del brief, el tipo de producto y la dirección visual. Los perfiles institucionales, catálogos y productos digitales pueden producir estructuras, CTA, contenido y composición diferentes sin reglas específicas por nombre de proyecto.

La materialización valida secciones planificadas, ausencia de secciones no planificadas, gramática mínima, duplicados, fuga de instrucciones internas, tokens del VisualSystem, controles sin estilos de navegador, links diseñados, foco visible, temas claro/oscuro y responsive sin overflow.

`BuildPlan.traceability` conserva la relación entre fuente del brief, decisión, componente y criterio QA. `manifest.json` y `data/planning.json` deben contener el mismo bundle estable antes de publicar una versión física.

La generación es local y determinista: no conecta proveedores externos, no analiza URLs remotamente, no ejecuta servicios aportados, no despliega y no prepara entrega hasta una aprobación humana explícita.

La generalización se cubre con `scripts/jefe-generalization-smoke.mjs`, que materializa tres briefs aislados en un temporal y verifica identidad, estrategia, experiencia, sistema visual, contenido, estructura, CTA, artefacto customer-facing y ausencia de datos internos.

Estado del gate: `ESCALON_7_STATUS=IMPLEMENTED_PENDING_HUMAN_GATE`.
