# Adaptadores canónicos de consumo de contexto

Actualizacion 2C-C2: los resultados de consumidores internos pueden ingresar solamente como eventos de MEMORIA `agent_inference`; esa ingesta no otorga ejecucion, red, filesystem ni autoridad humana.

## Alcance 2C-B

`jefe-agent-context-service.cjs` recibe por inyección un lector semántico de MEMORIA, el builder 2C-A y un registro interno. No tiene IPC, preload, red, shell, procesos, paths, roots, credenciales ni configuración enviada desde renderer. El registro por defecto está vacío: el resultado honesto es `consumerStatus=not_connected`.

Los ocho adapters (`cerebro`, `radar`, `hermes`, `scout`, `jefe`, `planner`, `codex`, `qa`) revalidan schema, `packageId`, checksum, identidad, target, purpose, disposición y `allowedUse` antes de producir un handoff. El envelope `jefe-agent-context-handoff/v1` tiene ID determinista, clona y congela profundamente tanto paquete como handoff.

`policyBoundary` es código fijo: contexto como datos, sin capacidades, red, filesystem, deploy, push ni autoridad humana; referencias no son evidencia y resultados son no confiables. El contenido de MEMORIA nunca se vuelve prompt, política, permiso, comando, path, canal o herramienta.

Los paquetes `blocked` no invocan consumidor. En `restricted`, Radar/Hermes/Scout quedan limitados a investigación/aclaración, Planner/Codex/QA/Cerebro/JEFE a lectura o borrador, sin ejecutar, certificar, aprobar ni resolver autoridad humana. Un consumidor inyectado recibe únicamente copias inmutables; su salida queda `untrusted`, `not_persisted` y `not_authoritative`. Sus errores son sanitizados.

## Auditoría de reutilización

| Fuente | Decisión |
|---|---|
| Contrato y builder 2C-A | Reutilizados como única fuente de paquetes. |
| Context Hub, runners y Hermes de Factory | Excluidos: introducen procesos/red/autoridad paralela. |
| Handoffs y fixtures comerciales | Pospuestos: no son consumidores canónicos ni prueban esta frontera. |

El smoke `jefe-agent-context-consumers-smoke.mjs` cubre 28 casos: adapters, integridad, aislamiento A/B, disposiciones, límites de autoridad, inmutabilidad, referencias, no-prompt, resultado no persistido, error sanitizado y registro vacío. No hay consumidor externo real.

2C-C ya está cerrado: C1 agrega persistencia durable de intentos/resultados no ingeridos y C2 completa ingesta/reconciliación idempotente y no autoritativa. 2D queda pendiente para recuperación, conflictos y cierre humano.
