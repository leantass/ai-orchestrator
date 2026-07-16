# Radar de Mercado v1

## Proposito

Radar v1 define como JEFE representa señales, deriva oportunidades y aplica scoring preliminar antes de investigar o redactar un brief. Es un contrato puro, versionado y serializable; no es un crawler ni un agente conectado.

## Problema que resuelve

Sin un modelo comun, una observacion manual, una tendencia o una metrica pueden convertirse demasiado pronto en proyecto. Radar normaliza esos inputs, explicita hipotesis y riesgos, puntua con reglas deterministas y recomienda rechazo, espera, investigacion, brief o revision humana.

## Que no hace todavia

- No investiga internet, hace scraping ni llama APIs.
- No usa OpenAI ni Hermes.
- No crea briefs, repositorios o proyectos.
- No modifica MEMORIA, GitHub, runtime, Electron, IPC o UI.
- No confirma que una hipotesis de mercado sea verdadera.

## Radar y Hermes

Radar decide que merece investigacion o conversion a brief usando evidencia ya entregada. Hermes sera el scout read-only que investigue demanda, competidores, precios y reseñas cuando Radar devuelva `research_with_hermes`. Hermes no modifica codigo ni aprueba oportunidades.

## Señal y oportunidad

Una señal es una observacion cruda o semiestructurada con fuente, tipo, fuerza, confianza y evidencia opcional. Las fuentes terminadas en `_future` son marcadores contractuales, no integraciones activas.

Una oportunidad agrupa una o mas señales y agrega problema, audiencia, solucion propuesta, hipotesis, escalas `0..5`, evidencia, supuestos, preguntas y riesgos. El modelo es universal y no contiene verticales historicas.

## Scoring

El score puro se limita a `0..100`. Suman demanda, urgencia, frecuencia, disposicion a pagar, claridad de monetizacion, facilidad de construccion, diferenciacion, viralidad, aprendizaje reutilizable y calidad de señales. Restan competencia extrema, costo operativo y sensibilidad legal.

La suficiencia exige al menos dos señales y dos evidencias favorables con confianza mínima de `0.6`. Evidencia contradictoria, monetizacion ausente y categorias sensibles generan warnings. El score no reemplaza investigacion ni juicio humano.

## Decisiones

- `reject`: score bajo.
- `hold`: score medio con evidencia suficiente pero sin tesis fuerte.
- `research_with_hermes`: evidencia insuficiente o contradictoria que merece investigacion.
- `draft_factory_brief`: score alto con evidencia suficiente.
- `needs_human_review`: riesgo critico o sensibilidad legal extrema.

Codex no participa en este gate y Radar no autoaprueba productos.

## Relacion con FactoryArchitectureBlueprint

Radar implementa la primera capa `market_radar`. Su output futuro alimentara `hermes_scout` o `jefe_decision`, conservando evidencia y razonamiento del gate.

## Relaciones futuras

- `FactoryProjectContract`: solo se crea despues de que JEFE apruebe un brief; Radar conserva lineage de oportunidad.
- MEMORIA: guardara señales y decisiones en namespaces controlados, sin promocion global automatica.
- GitHub Issues/Projects: podran reflejar oportunidades aprobadas, no señales crudas indiscriminadamente.
- Analitica y monetizacion: aportaran señales posteriores de adquisicion, retencion, conversion, costo e ingresos.

## Ejemplo de señal

```json
{
  "radarVersion": "1.0",
  "id": "signal-001",
  "type": "repeated_problem",
  "source": "manual",
  "title": "Proceso repetitivo sin resolver",
  "summary": "Tres entrevistas describen el mismo trabajo manual.",
  "capturedAt": "2026-07-15T18:00:00.000Z",
  "strength": "strong",
  "tags": ["workflow", "manual"],
  "confidence": 0.8,
  "risks": [],
  "notes": []
}
```

## Ejemplo de oportunidad

```json
{
  "radarVersion": "1.0",
  "id": "opportunity-001",
  "title": "Automatizacion de un flujo repetitivo",
  "description": "Herramienta universal para reducir tareas manuales.",
  "problem": "El equipo repite una operacion propensa a errores.",
  "audience": "Equipos operativos pequeños",
  "category": "productivity",
  "status": "captured",
  "signals": ["..."],
  "proposedSolution": "Aplicacion independiente con flujo guiado.",
  "monetizationHypothesis": "Suscripcion por equipo.",
  "demandHypothesis": "La frecuencia sostiene demanda recurrente.",
  "competitorHypothesis": "Alternativas genericas no cubren el flujo.",
  "buildComplexity": 2,
  "operationalCost": 1,
  "legalSensitivity": 1,
  "urgency": 5,
  "frequency": 5,
  "willingnessToPay": 4,
  "differentiationPotential": 4,
  "viralPotential": 2,
  "reusableLearningPotential": 5,
  "evidence": ["..."],
  "assumptions": [],
  "openQuestions": [],
  "risks": [],
  "createdAt": "2026-07-15T18:00:00.000Z"
}
```

## Ejemplo de evaluacion

```json
{
  "opportunityId": "opportunity-001",
  "score": { "total": 78, "breakdown": { "rawTotal": 77.6 } },
  "decision": { "type": "draft_factory_brief" },
  "evidenceSufficient": true,
  "contradictoryEvidence": false,
  "recommendedNextStep": "Draft a FactoryProject brief for JEFE review."
}
```

## Proximos pasos

Tras revision humana, el siguiente bloque debe definir el contrato Hermes read-only: pedido de investigacion, fuentes permitidas, evidencia, limites y handoff de vuelta a JEFE. La persistencia y UI de Radar quedan para fases posteriores.
