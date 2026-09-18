# JEFE Delivery Maturity Levels V1

## L0 - Brief Intake

JEFE interpreta el pedido, detecta tipo, genera reportes y contrato. Produce los 10 reportes base. Valida cobertura de intake. No permite construir producto final ni ejecutar herramientas reales.

## L1 - Local Mock First Version

JEFE crea una primera version local mock, estatica y revisable. Produce app HTML/CSS/JS vanilla, datos mock y docs copiados. Valida estructura local. No permite backend real, deploy ni datos reales.

## L2 - Technical Scaffold

JEFE/Codex crean scaffold tecnico real aprobado. Produce estructura tecnica inicial. Valida convenciones del stack. No permite features productivas sin backlog aprobado.

## L3 - Codex Build Loop

Codex implementa tareas y JEFE revisa contra contrato. Produce cambios tecnicos iterativos. Valida alcance y aceptacion. No permite publicacion automatica.

## L4 - Unit/API/Component QA

Vitest + MSW prueban logica, servicios, componentes, reglas internas y comportamientos de APIs. Produce evidencia de pruebas. No reemplaza E2E.

## L5 - Browser/E2E/Visual QA

Playwright prueba navegador, flujos reales, responsive, accesibilidad y evidencia visual. Produce trazas y screenshots. No reemplaza seguridad ni performance.

## L6 - Security/Quality/Performance

Gitleaks, Semgrep, Trivy, axe, Lighthouse y controles correspondientes revisan secretos, codigo, dependencias, accesibilidad y rendimiento. No aprueba por si solo produccion.

## L7 - AI Evaluation

Promptfoo evalua prompts, agentes, regresiones, seguridad y calidad de respuestas de IA. Aplica solo cuando hay IA. No reemplaza revision humana.

## L8 - Staging Release

Deploy controlado a staging. Produce ambiente verificable. Valida release candidate. No es produccion.

## L9 - Production Release

Deploy productivo aprobado. Produce publicacion real. Requiere aprobacion de JEFE y evidencia previa. No habilita cambios sin monitoreo.

## L10 - Analytics/Monetization Feedback

Metricas, conversion, costos, tokens, anuncios, suscripciones e ingresos retroalimentan decisiones. Produce senales de negocio. No decide sin interpretacion de JEFE.

## L11 - Memory Learning

MEMORIA guarda aprendizajes reutilizables validados. Produce contexto canonico para decisiones futuras. No guarda findings sin validacion.
