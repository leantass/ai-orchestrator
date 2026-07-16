# JefeHermesAdapter Contract v1

## Proposito

Este contrato define el boundary futuro entre JEFE y Hermes Agent. Hermes Agent es una herramienta externa de Nous Research; JEFE no lo reinventa, incluye, clona, instala ni ejecuta en v1. `JefeHermesAdapter` sera un adapter propio que gobernara requests read-only, fuentes, evidencia, reports y handoffs.

## Que no hace todavia

- No instala, clona o ejecuta Hermes Agent.
- No navega, hace scraping o llama APIs.
- No usa OpenAI ni tokens.
- No modifica codigo, repositorios, UI, Electron o IPC.
- No aprueba oportunidades, briefs, releases o deploys.
- No integra runtime; `runtimeIntegrated` es siempre `false`.

## External tool boundary

La identidad contractual fija `externalToolName: Hermes Agent`, `externalToolOrigin: external_tool`, `externalToolProvider: Nous Research` e `integrationMode: read_only_adapter`. El adapter propio se identifica como `JefeHermesAdapter`, version `1.0`, kind `jefe-hermes-adapter-contract`.

## Read-only policy

El constructor reimpone despues de cualquier merge: read-only, sin escritura de codigo/repos, sin aprobacion, sin deploy, sin Codex, approval para llamadas externas, citas obligatorias, quality rating y evidencia para recomendaciones. Ningun input puede degradar estas invariantes.

## Request model y source policy

El request enlaza una oportunidad Radar con preguntas, scope, presupuesto, timebox, evidencia requerida y handoff a JEFE. Las fuentes permitidas son capacidades futuras publicas/manuales/importadas. Se restringen datos privados sin permiso, servicios pagos sin aprobacion, cuentas con credenciales, scraping prohibido, PII, fuentes ilegales/leaks y datos productivos sin policy.

## Evidence model

Cada item contiene fuente, resumen breve, timestamp, postura, confidence, frescura, quality, relevancia y flags. Quotes se limitan a 280 caracteres y summaries a 1000. Validadores rechazan secretos aparentes, emails/PII innecesaria y contenido extenso.

## Research report y cobertura

El report separa `requiredCoverage`, `satisfiedCoverage` y `missingCoverage`. La cobertura declarada solo cuenta si existe evidencia del kind correspondiente. Evidencia fuerte requiere al menos tres items, dos fuentes distintas, quality media suficiente, cobertura minima y ausencia de contradicciones fuertes.

Una fuente unica, baja calidad, cobertura faltante o contradicciones fuerzan mas investigacion. Riesgo critico fuerza revision humana. Ninguno permite conversion directa a brief.

## Handoff to JEFE

El handoff siempre apunta a JEFE, mantiene `codexAllowed: false` y recalcula coverage. Hermes recomienda; JEFE decide. `convert_to_factory_brief` significa solamente que JEFE puede revisar si corresponde crear un brief.

## Relaciones

- Radar: origina la oportunidad y preguntas iniciales.
- JEFE Review & Correction Loop: la investigacion es una referencia de aceptacion, no un gate autonomo.
- MEMORIA: en el futuro conservara reportes validados y redaccion segura, nunca promocion automatica.
- OpenAI/tokens: cualquier uso futuro requiere policy, presupuesto, trazabilidad y aprobacion.
- GitHub Issues/Projects: podran recibir decisiones aprobadas por JEFE, no ejecutar Hermes.
- Hermes Agent real: la compatibilidad se definira contra su interfaz real en un bloque futuro, sin asumir runtime.

## Ejemplos abreviados

```json
{"adapterName":"JefeHermesAdapter","externalToolName":"Hermes Agent","requestId":"request-1","mode":"read_only","handoffTarget":"jefe"}
```

```json
{"reportId":"report-1","status":"completed","requiredCoverage":["demand","pricing"],"satisfiedCoverage":["demand","pricing"],"recommendedDecisionForJefe":"convert_to_factory_brief"}
```

```json
{"handoffId":"handoff-report-1","target":"jefe","codexAllowed":false,"missingCoverage":[],"requiredHumanReview":false}
```

## Proximos pasos

Revision humana y cierre del contrato. Luego definir un adapter runtime separado, solo tras inspeccionar la interfaz oficial real, con permits, sandbox, auditoria, redaccion y tests de integracion controlados.
