# JEFE / AI Orchestrator - V1 Limits and Next Steps

## Limites de V1

- V1 no ejecuta Blender real.
- V1 no abre Unity real.
- V1 no invoca MCP real.
- V1 no hace deploy.
- V1 no toca proyectos productivos.
- V1 no usa pagos reales.
- V1 no usa DB productiva.
- V1 no consume credenciales reales.
- V1 usa CLI y smokes para algunos flujos.
- V1 prioriza seguridad, sandbox, evidencia y supervision.
- V1 mantiene `executionAllowed: false` y `automaticExecutionAllowed: false` para herramientas externas.

## Que si permite V1

- Planificar entregas locales.
- Pedir approvals humanos cuando corresponde.
- Materializar en sandbox seguro.
- Revisar entregas con evidencia.
- Preparar correcciones supervisadas.
- Ejecutar smokes allowlisted.
- Registrar historial/ledger.
- Preparar paquetes y permisos para herramientas externas futuras.
- Mostrar en UI el estado V1 y los limites operativos.

## Riesgos controlados

- Writes fuera de scope.
- `.env`.
- `web-prueba`.
- `node_modules`.
- Docker/deploy.
- Credenciales.
- Package changes no autorizados.
- Ejecucion GUI automatica.
- MCP real sin scopes.

## Recomendaciones V1.5

- Runner manual-supervisado para ejecucion externa con approval reusable.
- Post-execution review para Blender, Unity y MCP.
- UI para generar y revisar todos los artefactos externos sin CLI.
- Vista de ledger con lectura dinamica de artefactos recientes.
- Mejor agrupacion de quality por perfiles: fast, external, release.

## Recomendaciones V2

- MCP real con scopes controlados y redaccion de payloads.
- Ejecucion externa manual-supervisada con evidencia obligatoria.
- Plantillas de proyecto y paquetes demo.
- Instalador empaquetado.
- Panel de CI remoto y commits recientes desde UI.
- Project templates versionadas.
- Export de reporte V1/V2 en HTML o PDF.

## Regla de producto

JEFE debe seguir siendo conservador: preparar, explicar, pedir permiso, registrar evidencia y validar antes de ejecutar acciones con riesgo real.
