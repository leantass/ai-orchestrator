# ORQUESTADOR — Escalón 13A: auditoría de observability y release operations

## Autoridad vigente — 2026-09-30

`ESCALON_13A_STATUS=COMPLETED`  
`ESCALON_13_REQUIRED=true`  
`HISTORICAL_LINT_DEBT_NEEDS_DEDICATED_PHASE=true`  
`NEXT=ESCALON_13B_RELEASE_OPERATIONS_READ_MODEL_AND_RUNBOOKS`

Escalón 13 no estaba especificado previamente. La auditoría demuestra que sí está justificado, pero únicamente para composición operativa, trazabilidad humana y runbooks. No debe duplicar E2E, Release, Governance, Observability ni el Commercial Control Center.

## Conclusión ejecutiva

La plataforma conserva las autoridades y health sources reales, pero están distribuidas. Un operador puede ver salud global, calidad, readiness, incidentes y el bloqueo histórico de CI en `/operation`; también puede consultar un proyecto y su versión activa. Todavía no puede recorrer desde una sola vista `projectId/versionId/e2eFlowId/releaseRequestId` hasta governance decision, authorization lifecycle, recovery journal, evidencia CI y next safe action.

Por eso `P0=0`, pero hay tres gaps `P1`: composición de governance/recovery en la operación, trazabilidad explicable del blocker y visibilidad de recovery requerido. Hay tres gaps `P2`: historia operacional unificada, runbook canónico y degradación diferenciada ante store de governance no disponible. La auditoría no encontró acciones remotas indebidas ni producción mostrada como lista.

## Mapa de autoridad y planos

| Plano | Autoridad | Store | Health source | Recovery owner | Consumer UI | Mutabilidad | Estado |
|---|---|---|---|---|---|---|---|
| E2E | E2E persistence/orchestrator | E2E records | E2E health/recovery | `jefe-e2e-recovery.cjs` | proyecto/versión | backend explícito | `CONNECTED_REAL_PARTIAL` |
| Release | release persistence/orchestrator | requests, flows, outbox, receipts | `releaseHealth()` | `jefe-release-recovery.cjs` | release project/operation | executor explícito | `CONNECTED_REAL_LOCAL_AND_HISTORICAL_REMOTE` |
| Governance | governance store | snapshots, decisions, lifecycle | governance recovery health | `jefe-release-governance-recovery.cjs` | aún no compuesto globalmente | decision/auth separadas | `DURABLE_NOT_YET_OPERATIONALLY_COMPOSED` |
| Observability | observation contracts/runtime | event, incident, health stores | observability runtime | `jefe-observability-recovery.cjs` | `/operation` | read model/refresh | `CONNECTED_REAL` |
| Control Center | proyección read-only | no es autoridad | consume observability + project services | backend owners | `/operation`, project views | read-only | `CONNECTED_REAL_WITH_GOVERNANCE_GAP` |

No se encontraron dos autoridades para una misma verdad. El gap es de composición y navegación, no de ownership.

## Estado global versus proyecto

Global:

- `HistoricalLintErrors=306`, 73 archivos afectados, 0 warnings;
- scope confirmado: `src/factory/*`;
- `REMOTE_CI_QUALITY=FAILING_HISTORICAL_LINT_DEBT`;
- `RELEASE_READINESS=BLOCKED`;
- `PRODUCTION_READY=false`.

Proyecto/versión:

- versión activa, QA, approval, delivery, ReleaseRequest, ReleaseFlow y decisiones de governance;
- la deuda global no debe asignarse automáticamente a cada proyecto;
- la UI de proyecto resuelve la versión por identidad, no por `flows[0]`.

La deuda bloquea `quality:ci` y por tanto el gate remoto de release. No se demostró que cada archivo Hermes afecte el runtime comercial actual. Requiere una fase de calidad separada, no convertir 13A en limpieza masiva.

## Semántica operacional

`unknown` significa evidencia ausente. `blocked` significa evidencia de impedimento. `unavailable` significa capacidad no conectada. `failed` significa operación intentada y fallida. `stale` significa evidencia que dejó de ser vigente.

Un blocker normal, como autorización remota faltante o CI requerida, no es automáticamente un incident. Corrupción, tamper, divergencia, ejecución incierta y recovery requerido sí generan incidentes. `waiting_human` y `waiting_authorization` permanecen estados normales de espera.

## Correlación y límites actuales

La navegación durable existe para proyecto, versión, QA, Human Gate, delivery y ReleaseRequest/Flow. Observability tiene timeline/incidents globales y project filtering. Governance snapshot/decision/lifecycle y recovery audit history existen durablemente, pero no están proyectados en el Control Center como una cadena operativa completa. Tampoco existe un read model único `jefe-release-operations/v1`.

`/operation` es read-only y muestra build, calidad CI, release, producción, blockers, incidents y sources. No ofrece approve, push, tag, deploy, resolver incidentes ni recovery mutante. El refresh es observación. Esta superficie es suficiente como frontera segura para 13A, pero insuficiente para operación cotidiana post-governance.

## Runbook matrix

| Caso | Clasificación | Fuente | Mensaje operacional | Next safe action | Auto | Humano | Recovery | Riesgo producción |
|---|---|---|---|---|---|---|---|---|
| lint histórico 306 | blocker global | CI/quality | Calidad remota bloqueada por deuda histórica | abrir fase de calidad dedicada | no | sí | no | release bloqueado |
| remote CI failed | blocker + evidencia | CI evidence | CI remota falló para commit exacto | revisar checks/logs; no fabricar pass | no | sí | no | release bloqueado |
| remote CI unavailable | unavailable | trusted adapter | no hay observación remota confiable | reintentar observación explícita | no | opcional | no | no inferir pass/fail |
| repository stale | stale | repository baseline | branch/HEAD cambió | nuevo request/baseline | no | sí | release recovery | no push |
| delivery tampered | incident crítico | delivery hashes | delivery no coincide con manifest | nueva delivery/version | no | sí | release recovery diagnóstico | release bloqueado |
| human rejection | estado normal + blocker | Human Gate | versión requiere corrección | correction child explícito | no | sí | E2E recovery si necesario | no release |
| QA failure | blocker | QA receipt | QA no habilita preview/release | corregir y nueva evaluación | no | sí | E2E recovery si corrupto | no release |
| release auth missing | blocker normal | release flow | falta autorización de acción | autoridad explícita | no | sí | release recovery sólo observa | no ejecución |
| release auth expired/revoked | blocker + lifecycle | governance lifecycle | autorización no utilizable | nueva autorización explícita | no | sí | governance recovery | no ejecución |
| governance decision stale | incident/blocker | governance recovery | decisión ligada a evidencia vieja | nuevo snapshot/decisión | no | sí | governance recovery | no release |
| E2E corruption | incident crítico | E2E persistence | lineage/receipt corrupto | conservar y diagnosticar | no | sí | E2E recovery | no promoción |
| release corruption | incident crítico | release persistence | request/flow/receipt corrupto | conservar y diagnosticar | no | sí | release recovery | no ejecución |
| governance corruption | incident crítico | governance store | decision/snapshot inválido | conservar y diagnosticar | no | sí | governance recovery | no aprobación |
| deploy not connected | unavailable/capability gap | deploy governance | deploy no está conectado | planificar capacidad; no botón | no | sí | no | producción false |

## Capacidades remotas actuales

| Acción | Estado |
|---|---|
| git commit | `LOCAL_ONLY` |
| git push | `HISTORICALLY_VERIFIED` |
| trigger CI | `HISTORICALLY_VERIFIED` |
| create PR | `CONTRACT_ONLY` |
| merge | `CONTRACT_ONLY` |
| release tag | `LOCAL_ONLY` |
| deploy | `NOT_CONNECTED` |

El canary 8C sigue siendo evidencia histórica: mecanismo remoto operativo, CI real fallida, release bloqueado y cleanup correcto. No se recrea ni se interpreta como readiness.

## Hallazgos y fases derivadas

`P0=0`. No hay acción remota desde la UI, contaminación cross-project demostrada, ni producción mostrada ready sin evidencia.

`P1=3`:

1. `13B`: read model operativo compuesto para release, governance, observability y recovery.
2. `13B`: trazabilidad de blocker desde global/project hasta evidencia, actor, decisión, autorización y next safe action.
3. `13B`: recovery required/stale/corruption visible en operación con degradación parcial.

`P2=3`:

1. `13B`: runbooks y navegación de history/audit/journal diferenciados.
2. `13B`: proyección explícita de source failure de governance.
3. `13C`: aceptación operacional de estados y copy sin acciones ficticias.

`P3=1`: una expectativa Playwright histórica usaba el texto `Salud desconocida`; se corrigió a la etiqueta vigente `Desconocido` sin cambiar autoridad ni mutabilidad.

Propuesta derivada, no iniciada:

- `13B=ESCALON_13B_RELEASE_OPERATIONS_READ_MODEL_AND_RUNBOOKS`
- `13C=ESCALON_13C_OPERATIONAL_ACCEPTANCE`
- `13D=ESCALON_13D_OPERATIONAL_RECOVERY_AND_CLOSURE`

`NEXT=ESCALON_13B_RELEASE_OPERATIONS_READ_MODEL_AND_RUNBOOKS`.

## Límites y seguridad

`RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`. No se propone TTL en 13A. Locks y exactly-once siguen siendo locales al proceso: `MultiprocessLocking=false`, `DistributedExactlyOnce=false`. La operación degrada fuentes no disponibles a unknown/unavailable sin fabricar datos. No se observaron tokens, headers, credenciales ni paths absolutos en el read model auditado.

`ProviderCalls=0` · `ExternalNetworkUsed=false` · `LiveReleaseMutations=false` · `DeployPerformed=false` · `PRODUCTION_READY=false`.
