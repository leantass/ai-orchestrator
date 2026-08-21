# Paquetes canónicos de contexto (2C-A)

`ESCALON_2_STATUS=IN_PROGRESS`; `ESCALON_2A_STATUS=COMPLETED`; `ESCALON_2B_STATUS=COMPLETED`; `ESCALON_2C_STATUS=IN_PROGRESS`; `ESCALON_2C_A_STATUS=COMPLETED`; `ESCALON_2C_B_STATUS=COMPLETED`; `ESCALON_2C_C_STATUS=NOT_STARTED`; `ESCALON_2D_STATUS=NOT_STARTED`.

Los paquetes son una frontera pura de consumo: transforman snapshot/timeline ya sincronizados en una vista determinista por agente. No escriben MEMORIA, outbox, manifests, ledger, índices ni archivos; no usan IPC, red, filesystem libre ni invocan agentes.

## Contrato

`jefe-context-package-contract.cjs` valida `schemaVersion`, `packageId`, `targetAgent`, `purpose`, `scope`, `identity`, `disposition`, `allowedUse`, `blockers`, `source`, `context`, `budget`, `omissions` e `integrity`. La identidad conserva `projectId/runId/versionId`; `packageId`, bytes, orden y `asOf` se derivan de fuentes persistidas, sin UUID ni reloj de ejecución.

La matriz allowlisted es Cerebro/JEFE-supervisión, Radar-discovery, Hermes/Scout-research, Planner-planning, Codex-execution y QA-validation. Las vistas son materialmente distintas y no conceden permisos de red, push, deploy, QA visual ni aprobación humana.

## Contenido, autoridad y presupuesto

Las secciones permitidas preservan `entryId`, timestamp, scope, identidad, actor, autoridad, procedencia y referencias seguras. Decisiones humanas, conflictos, pendientes de Lean y lineage no se sustituyen por inferencia; entradas reemplazadas/invalidadas salen de lo activo pero sus extremos permanecen en lineage. URLs permanecen como referencias y texto sensible, paths, comandos, secretos, payloads crudos, outbox y archivos completos no salen en paquetes.

`maxEntries` y `maxCharacters` son límites validados. El orden de prioridad protege bloqueos/conflictos, decisiones humanas, objetivo, restricciones y requisitos antes de evidencia u outcomes. Toda omisión lleva sección, cantidad, razón e IDs. Si no entra el núcleo, la disposición es `blocked`, nunca un falso paquete suficiente.

`ready` sólo indica memoria sincronizada, identidad válida y contenido suficiente; no significa aprobación humana, QA visual, deploy ni release-ready. `restricted` conserva conflictos/preguntas/pendientes; `blocked` cubre memoria pending/failed/corrupta, identidad/snapshot inválidos o núcleo insuficiente.

## Auditoría previa y decisión de reutilización

| Módulo | Origen | Propósito | Autoridad | Estado/riesgo | Decisión |
|---|---|---|---|---|---|
| `jefe-context-contract/persistence` | Canónico 2A | Eventos y snapshot validados | Canónica | Conectado, local | Reutilizar |
| `jefe-context-integration` | Canónico 2B | Productores, outbox y reconciliación | Canónica | Conectado, físico primero | Adaptar como fuente de paquete |
| `context-hub-*` | Factory/Comercial | Hub externo/histórico | No canónica | Desconectado, riesgo de segunda autoridad | Excluir |
| `factory/hermes-*`, Radar y runners | Factory/Comercial | Planificación/ejecución externa | No conectada | Fixtures/planificación, riesgo de red/ejecución | Posponer |
| `project-context` y UI | Worktrees fuente | Estado/visualización histórica | No canónica | No representa MEMORIA 2B | Excluir |

## Evidencia

`jefe-context-package-smoke.mjs` cubre 24 casos: matriz de agentes, determinismo, presupuesto, disposiciones, autoridad humana, lineage, seguridad, aislamiento A/B y ausencia de mutaciones. Los paquetes están construibles, pero todavía no tienen consumidores reales, UI, aprendizaje/vector database, ejecución automática ni validación visual. JEFE no es release-ready.

## Adaptadores 2C-B

2C-B consume estos paquetes sólo mediante `jefe-agent-context-adapters.cjs` y el servicio interno inyectable. Cada adapter vuelve a validar la integridad y genera un handoff inmutable con frontera de política fija; no hay IPC, UI, runner, red, filesystem ni consumidor real. Véase [ORQUESTADOR_AGENT_CONTEXT_CONSUMERS.md](ORQUESTADOR_AGENT_CONTEXT_CONSUMERS.md). La corrección mínima de `cleanReference` preserva únicamente URLs `https` seguras como datos, sin consultarlas.

2C-C1 correlaciona ese handoff con un intento durable y resultado no ingerido; la corrección mínima permite a QA validar sin exigir un objetivo ausente de su vista.
