# Radar to Hermes Handoff v1

## Proposito

Este contrato convierte una `MarketOpportunity` y su `RadarEvaluationResult` en una solicitud gobernada para `JefeHermesAdapter` cuando Radar recomienda `research_with_hermes`.

Existe para mantener separado el scoring interno de Radar del boundary externo de Hermes Agent. No investiga, no llama Hermes, no navega internet y no ejecuta runtime; solo prepara datos acotados para que JEFE los revise y apruebe en el futuro.

## Relaciones

- Radar: aporta oportunidad, score, decision, riesgos y preguntas abiertas.
- JefeHermesAdapter: construye el request seguro y fuerza policies read-only.
- Hermes Agent: herramienta externa futura; no es invocada por este módulo.
- JEFE: recibe el handoff, revisa policy y decide si autoriza investigación.
- Codex: no participa y queda `codexAllowed: false`.

## Reglas de decision

- `research_with_hermes`: crea request si la categoría no exige aprobación humana pendiente.
- `reject`: bloquea con `opportunity_rejected_by_radar`.
- `hold`: bloquea con `opportunity_on_hold`.
- `needs_human_review`: bloquea con `human_review_required_before_research`.
- `draft_factory_brief`: no salta Hermes por defecto; bloquea para revisión de policy.
- Categorías sensibles: requieren aprobación humana explícita antes de preparar request automático.

El handoff nunca crea proyectos, habilita Codex o ejecuta el adapter.

## Mapping

Title, problem/description, audience y category se resumen hacia el request. Geography/language se derivan de signals. Evidence cruda no se copia. Las preguntas baseline son demand, competitors, pricing, reviews, trends, monetization, risks, differentiation y distribution. Open questions se clasifican mediante reglas deterministas; monetization y competitor hypotheses agregan mappings explícitos.

Las fuentes futuras permitidas son públicas/manuales/importadas y quedan sujetas al adapter. Fuentes privadas, pagas sin aprobación, credentialed, scraping prohibido, PII, leaks, ilegales y datos productivos sin policy quedan restringidas.

## Ejemplos abreviados

```json
{"opportunity":{"id":"opportunity-1"},"evaluation":{"decision":{"type":"research_with_hermes"},"score":{"total":72}},"createdAt":"2026-07-16T12:00:00.000Z","requestedBy":"JEFE"}
```

```json
{"targetAdapterName":"JefeHermesAdapter","targetExternalToolName":"Hermes Agent","requestCreated":true,"codexAllowed":false,"directProjectCreationAllowed":false}
```

```json
{"radarDecision":"reject","requestCreated":false,"blockedReason":"opportunity_rejected_by_radar"}
```

## Proximos pasos

Revision humana y cierre contractual. La ejecución futura requiere un gate JEFE separado, permisos, auditoría, transport adapter y evidencia de la interfaz real de Hermes Agent.
