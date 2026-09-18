# JEFE Context And Model Decision Policy V1

## Principio

JEFE primero intenta resolver con brief actual, assets cargados, memoria local validada, docs del proyecto, registry interno, scans seguros del repo, patrones validados y decisiones canonicas previas.

Si eso no alcanza, debe decidir si necesita preguntar al usuario, usar Hermes / Scout, usar OpenAI API, usar investigacion externa futura o bloquear por falta de informacion.

## Niveles de suficiencia

### CONTEXT_SUFFICIENT

Se puede proceder con memoria local. No hace falta OpenAI API, Hermes, Scout ni research. Se puede generar mock, docs o tarea segura.

### CONTEXT_PARTIAL

Se puede avanzar con mock/scaffold, marcando incertidumbre. Puede requerir confirmacion del usuario. No se debe publicar ni tomar decisiones fuertes.

### CONTEXT_INSUFFICIENT

No alcanza para construir bien. Se requiere usuario, Hermes, OpenAI API o research. No se debe inventar.

### EXTERNAL_INTELLIGENCE_REQUIRED

Usar cuando el pedido requiere tendencias actuales, precios actuales, competidores actuales, APIs/documentacion externa, informacion tecnica muy especifica, decisiones de arquitectura complejas, informacion fuera de memoria local, investigacion de mercado o modelos de monetizacion actuales.

### HIGH_RISK_EXTERNAL_REQUIRED

Usar cuando el pedido toca legal, financiero, salud, seguridad, produccion, credenciales, pagos, datos personales o compliance.

## Campos esperados

```json
{
  "decision": "CONTEXT_SUFFICIENT | CONTEXT_PARTIAL | CONTEXT_INSUFFICIENT | EXTERNAL_INTELLIGENCE_REQUIRED | HIGH_RISK_EXTERNAL_REQUIRED",
  "reason": "...",
  "confidence": 0.0,
  "missingContext": [],
  "recommendedSource": "LOCAL_MEMORY | USER_CLARIFICATION | HERMES_SCOUT | OPENAI_API | BLOCKED",
  "estimatedCostRisk": "none | low | medium | high",
  "approvalRequired": true,
  "allowedNextAction": "..."
}
```

## Ejemplo

```json
{
  "decision": "EXTERNAL_INTELLIGENCE_REQUIRED",
  "reason": "El brief pide comparar competidores actuales y precios de mercado.",
  "confidence": 0.42,
  "missingContext": ["competidores actuales", "precios", "modelos de monetizacion"],
  "recommendedSource": "HERMES_SCOUT",
  "estimatedCostRisk": "medium",
  "approvalRequired": true,
  "allowedNextAction": "prepare_research_plan_only"
}
```

## Regla importante

La decision puede ser automatica, pero la ejecucion de llamadas reales debe estar gobernada por approvals, policy gates, governance y cost control. JEFE no debe ejecutar OpenAI API, Hermes, Scout, red, Codex o herramientas reales sin aprobacion y etapa permitida.
