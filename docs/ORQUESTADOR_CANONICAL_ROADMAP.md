# Roadmap canónico de finalización del Orquestador

Esta es la única autoridad posterior a Escalón 2. Estados: `ESCALON_1_STATUS=VERIFIED_CLOSED`, `ESCALON_2_STATUS=VERIFIED_CLOSED`, `ESCALON_3_STATUS=VERIFIED_CLOSED`, `ESCALON_4_STATUS=IN_PROGRESS`, `ESCALON_5_STATUS=NOT_STARTED`, `ESCALON_6_STATUS=NOT_STARTED`, `ESCALON_7_STATUS=NOT_STARTED`, `ESCALON_8_STATUS=NOT_STARTED`, `ESCALON_9_STATUS=NOT_STARTED`, `ESCALON_10_STATUS=PARTIAL_EXISTING_FOUNDATION`, `ESCALON_11_STATUS=NOT_STARTED`, `ESCALON_12_STATUS=NOT_STARTED`.

## Flujo y retorno

Lean → CEREBRO → Radar → Hermes/Scout → JEFE → MEMORIA → Planner → Codex aislado → QA/seguridad → preview/aprobación humana → Git/CI/entrega → observabilidad → MEMORIA. Cada salida es evidencia para el siguiente gate, no permiso implícito. Brief incompleto vuelve a CEREBRO/Radar; evidencia insuficiente a Hermes/Scout; contradicción a MEMORIA/Lean; plan inválido a Planner; ejecución, QA o seguridad fallidas a Codex/Planner; preview rechazado a JEFE/Planner/Codex; CI/entrega fallidas a Codex/QA/release; incidente a observabilidad/JEFE/MEMORIA.

| Escalón | Propósito y dueño | Entrada → salida/gate | Excluye y retorno |
| --- | --- | --- | --- |
| 3 | Descubrimiento e investigación supervisados: CEREBRO/Radar/Hermes/Scout/JEFE | necesidad humana → intake, plan, receipts correlacionados y runtime local supervisado; gate: identidad, política y evidencia | sin red ni proveedores reales; falta crítica vuelve a Lean/CEREBRO |
| 4 | Planner y contratos ejecutables | intake/contexto válido → alcance, dependencias, riesgos y plan; gate: contrato cerrado | sin ejecución; invalidez vuelve a discovery |
| 5 | Ejecución segura: Codex/worktrees | plan aprobado → cambio aislado recuperable; gate: locks/límites | sin entrega; fallo vuelve a Codex/Planner |
| 6 | QA, seguridad y correction loop | cambio aislado → evidencia de pruebas; gate: QA/SAST/accesibilidad | sin aprobación visual; fallo vuelve a responsable |
| 7 | Preview y aprobación humana | evidencia local real → decisión explícita; gate: operador | sin autenticación ficticia/deploy; rechazo vuelve al plan |
| 8 | Git, CI y entrega | aprobación/evidencia → commit, CI y entrega honesta | sin push/deploy implícito; fallo vuelve a QA/Codex |
| 9 | Observabilidad y operación | eventos reales → salud/incidentes/recuperación | sin alertas inventadas; incidente vuelve a JEFE/MEMORIA |
| 10 | Centro de control comercial | capacidades conectadas → UX visual guiada y accesible | UI sin backend es bloqueada; mantiene base comercial existente |
| 11 | Integración end-to-end | todos los gates reales → flujo trazable completo | no simula agentes/proveedores ausentes |
| 12 | Release governance | evidencia integral → decisión de release humana | no declara release-ready sin auditoría y soporte |

Todos los escalones contienen subbloques A contrato/fundación, B persistencia/orquestación, C evidencia y gates, D recuperación/documentación. Las decisiones de Lean, evidencia física y decisiones humanas nunca son reemplazadas por inferencia.

## Condiciones comerciales transversales de Pol

Cada gate visible exige lenguaje humano, pasos guiados, información justa, estado/próximo paso/error recuperable, acción real con feedback, responsive, teclado/foco y accesibilidad básica. La UI comercial nunca expone paths, IPC, runners ni botones decorativos; diferencia smoke de evidencia real, mantiene historial/comparación y no promete preview, análisis, integración, QA, deploy o aprobación inexistentes.

## Catálogo de terceros candidatos

Nada está integrado por este documento. Sin evidencia local o verificación externa se marca `REQUIRES_EXTERNAL_VERIFICATION`; no se instala ni consulta red.

| Familia | Candidato | Tipo/estado | Escalón | Riesgo/límite |
| --- | --- | --- | --- | --- |
| Git/CI | Git, GitHub CLI/CI | Git presente; resto `REQUIRES_EXTERNAL_VERIFICATION` | 8 | credenciales/red y aprobación |
| aislamiento | worktrees, Docker/Podman | worktrees base existente; contenedores no verificados | 5 | no ejecutar por defecto |
| investigación | SearXNG, Ollama, n8n, crawler | candidatos self-hosted/no integrados | 3 | red, contenido no confiable |
| pruebas | Playwright, Vitest, axe-core, Lighthouse | no verificados localmente | 6/7 | no afirmar QA visual |
| seguridad | Semgrep, Gitleaks, Trivy, OWASP ZAP | candidatos no integrados | 6 | red/credenciales/falsos positivos |
| operación | OpenTelemetry, Prometheus, Grafana, Loki | candidatos no integrados | 9 | no crear telemetría ficticia |
| datos | SQLite/PostgreSQL/MinIO/colas | candidatos no integrados | 9/11 | retención y credenciales |

## Inventario honesto

MEMORIA, paquetes 2C, handoff/resultados y recuperación 2D son `FUNCTIONAL_CONNECTED` en smokes locales. Lifecycle, persistencia, preview seguro y workspace comercial son fundaciones locales conectadas. El intake 3A, el gate 3B reparado por R1 y el flujo local supervisado 3C-A a 3C-D son locales; no acreditan investigación remota. Preview visual, UI de conflictos, autenticación humana end-to-end, agentes y proveedores reales, Codex, QA global, CI, entrega remota y observabilidad son `ABSENT` o `FOUNDATION_ONLY`. Factory/Hermes/Radar/Planner histórico es `HISTORICAL_WIP`/`REFERENCE_ONLY`; Comercial es `PARTIAL_EXISTING_FOUNDATION` para Escalón 10. Ningún fixture, adapter inyectable, smoke o documento acredita proveedor real.

`ESCALON_3_STATUS=VERIFIED_CLOSED`; `ESCALON_3A_STATUS=COMPLETED`; `ESCALON_3B_STATUS=COMPLETED`; `ESCALON_3B_R1_STATUS=COMPLETED`; `ESCALON_3C_STATUS=VERIFIED_CLOSED`; `ESCALON_3C_A_STATUS=COMPLETED`; `ESCALON_3C_B_STATUS=COMPLETED`; `ESCALON_3C_C_STATUS=COMPLETED`; `ESCALON_3C_D_STATUS=COMPLETED`.

## Escalón 3B — investigación supervisada

`ESCALON_3B_STATUS=COMPLETED`; registro no equivale a conexión, receipt no equivale a evidencia y evidencia aceptada no equivale a verdad absoluta. La red sigue deshabilitada y los proveedores reales no están conectados. Las sesiones por request son durables, con receipts inmutables, replay, recuperación de `evidence_pending` y corrupción aislada. El contenido externo permanece no confiable.

## Reparación estructural 3B-R1

`ESCALON_3B_R1_STATUS=COMPLETED`; `CORRELATION_SMOKE=PASS`. El modelo durable por request se conserva y queda subordinado a un `researchPlanId` compartido y un `evidenceCaseId` determinista. Los casos agregan únicamente receipts persistidos y correlacionados; una sola fuente queda `needs_corroboration`, fuentes con provider, host y hash independientes pueden quedar `accepted_for_context`, y claims contradictorios permanecen `requires_human` sin ganador automático. Replay, reapertura, retry, reconcile, concurrencia e índice reconstruible son idempotentes. MEMORIA recibe como máximo un append canónico desde el orquestador y sólo después de aceptación. La red continúa deshabilitada y ningún proveedor real queda conectado por R1.

## Escalón 3C-A — fundación segura de runtime de conectores

`STATUS=ESCALON_3C_A_COMPLETED`; `ESCALON_3C_A_STATUS=COMPLETED`. El runtime prepara intentos durables, reserva presupuesto desde política confiable, limita concurrencia, aplica timeout de adapter/cancelación linealizada, retry con lineage, circuit breaker persistido y reconciliación acotada. El candidato validado sólo entra a 3B mediante `receiveContribution`; el runtime no decide corroboración, aceptación, autoridad ni escritura a MEMORIA. Coordinación y locks son locales al proceso; 3C-A no acredita ejecución distribuida.

El cierre original de 3C-A acreditó `52/52` casos en cinco ejecuciones. La regresión actual de `jefe-research-connector-runtime-smoke.mjs` pasa `SMOKE_STRUCTURE=54/54`, `BEHAVIORAL_CASES_COMPLETE=54/54`, `BEHAVIORAL_CASES_REAL=1-54` y `CONNECTOR_RUNTIME_SMOKE=54/54_PASS`. `NETWORK=DISABLED`; `REAL_NETWORK_CONNECTORS=NOT_CONNECTED`. `manual_reference` es una referencia local inerte y los adapters inyectados son fixtures de smoke, no evidencia externa. No hubo DNS, fetch, shell, navegador, Electron, provider real, generación, preview, publicación ni deploy.

- `ESCALON_3C_A=SAFE_CONNECTOR_RUNTIME_FOUNDATION` — `COMPLETED`
- `ESCALON_3C_B=DETERMINISTIC_LOCAL_STRUCTURED_ANALYSIS_CONNECTOR` — `COMPLETED`
- `ESCALON_3C_C=SUPERVISED_EXECUTION_AND_EVIDENCE_FLOW` — `COMPLETED`
- `ESCALON_3C_D=RECOVERY_AND_ESCALON_3_CLOSURE` — `COMPLETED`

## Escalón 3C-B — conector local de análisis estructurado

`STATUS=ESCALON_3C_B_COMPLETED`. El único conector ejecutable incorporado es `structured_analysis`, una transformación local, determinista y sin red de un paquete de contexto autorizado. Su catálogo separa los siete tipos registrados, el conector productivo, `manual_reference` inerte y fixtures inyectadas. El runtime vuelve a validar descriptor, input, hash, presupuesto y recibo antes de que una contribución pueda entrar en 3B; ningún resultado se declara proveedor externo ni evidencia comercial.

El smoke `jefe-research-structured-analysis-connector-smoke.mjs` pasa `24/24` casos conductuales reales. `NETWORK=DISABLED`; no hubo DNS, fetch, shell, navegador, Electron, proveedor real, proyecto comercial, preview, publicación ni deploy.

## Escalón 3C-C — ejecución supervisada y entrega de evidencia

`STATUS=ESCALON_3C_C_COMPLETED`. El flujo durable correlaciona intake, paquetes por rol, plan, caso de evidencia, requests, intentos y entregas. La ejecución es explícita: prepara sin ejecutar, usa sólo el conector local autorizado, persiste una entrega cerrada antes de `receiveContribution` y reanuda delivery o sincronización sin repetir el adapter. Los terminales, replay, concurrencia, cancelación, fallo parcial y aislamiento A/B se conservan sin fabricar receipts, autoridad humana ni append adicional a MEMORIA.

Los smokes `jefe-supervised-research-execution-smoke.mjs` y `jefe-research-connector-delivery-smoke.mjs` pasan respectivamente `38/38` y `26/26` casos conductuales reales. No hay agentes, proveedores reales, red, UI, autenticación humana end-to-end ni ejecución distribuida.

## Escalón 3C-D — recuperación y cierre del Escalón 3

`STATUS=ESCALON_3C_D_COMPLETED`; `ESCALON_3_STATUS=VERIFIED_CLOSED`; `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`. La recuperación es local, explícita y por plan: toma snapshots estables, diagnostica sin mutar, produce un plan determinista ligado a sus revisiones y ejecuta sólo operaciones allowlisted con locks por root físico. Puede reconstruir índices derivados y salud de conectores, reconciliar estado durable compatible y sincronizar un append pendiente de MEMORIA; no ejecuta adapters, red ni reintentos de provider. La corrupción se preserva y aísla, las fronteras de entrega/preparación/humana permanecen explícitas, y cada fallo vuelve al checkpoint durable correspondiente.

Los smokes `jefe-research-connector-health-rebuild-smoke.mjs` y `jefe-supervised-research-recovery-smoke.mjs` pasan respectivamente `34/34` y `67/67` casos conductuales reales. Esto cierra el flujo local supervisado del Escalón 3, no acredita investigación remota, proveedores reales, autenticación humana, UI, QA visual, proyecto comercial, CI, publicación o deploy.

UI, autenticación humana end-to-end, QA visual y deploy permanecen pendientes. JEFE no está release-ready. La deuda Hermes heredada continúa intacta: 306 errores, 0 warnings y 73 archivos afectados. `PUSH=NO`.

`NEXT=ESCALON_4A_PLANNER_AND_EXECUTABLE_CONTRACTS`.

## Escalón 4A — contrato canónico de planner

`ESCALON_4_STATUS=IN_PROGRESS`; `ESCALON_4A_STATUS=COMPLETED`; `ESCALON_4B_STATUS=NOT_STARTED`; `ESCALON_4C_STATUS=NOT_STARTED`; `ESCALON_4D_STATUS=NOT_STARTED`.

`jefe-planner-contract.cjs` es la autoridad de la solicitud y del plan local. Correlaciona identidad física, intake, plan de investigación, caso de evidencia, flujo supervisado y paquete de contexto específico de Planner. El contrato normaliza alcance, dependencias, riesgos y restricciones sin paths, secretos, credenciales ni comandos; produce pasos deterministas de planificación y un gate explícito. Sólo evidencia `accepted_for_context` con paquete `ready` cierra el contrato para el gate siguiente; toda evidencia insuficiente, humana pendiente o paquete restringido vuelve a discovery. Ningún plan habilita ejecución: `executionPermitted=false` hasta el Escalón 5.

El smoke `jefe-planner-contract-smoke.mjs` pasa `20/20` casos conductuales locales sobre determinismo, correlación, límites, sanitización, gate, inmutabilidad y matriz negativa. No hay UI, IPC, red, proveedores, navegador, Electron, Codex, ejecución, aprobación humana, proyecto comercial, preview, publicación o deploy.

`NEXT=ESCALON_4B_PLANNER_PERSISTENCE_AND_ORCHESTRATION`.
