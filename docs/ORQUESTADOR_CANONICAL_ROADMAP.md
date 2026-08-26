# Roadmap canónico de finalización del Orquestador

Esta es la única autoridad posterior a Escalón 2. Estados: `ESCALON_1_STATUS=VERIFIED_CLOSED`, `ESCALON_2_STATUS=VERIFIED_CLOSED`, `ESCALON_3_STATUS=VERIFIED_CLOSED`, `ESCALON_4_STATUS=VERIFIED_CLOSED`, `ESCALON_5_STATUS=VERIFIED_CLOSED`, `ESCALON_6_STATUS=VERIFIED_CLOSED`, `ESCALON_7_STATUS=NOT_STARTED`, `ESCALON_8_STATUS=NOT_STARTED`, `ESCALON_9_STATUS=NOT_STARTED`, `ESCALON_10_STATUS=PARTIAL_EXISTING_FOUNDATION`, `ESCALON_11_STATUS=NOT_STARTED`, `ESCALON_12_STATUS=NOT_STARTED`.

## Estado vigente de cierre documental

`ESCALON_6_STATUS=VERIFIED_CLOSED`; `ESCALON_7_STATUS=NOT_STARTED`. Cierre basado en `orquestador-visual-evidence-2026-08-26-v4-final.zip`, SHA-256 `899D1B33318D4652062488447A1AE666882E13EFBF4E16C4C3D47BEC85E1F9C2`, aprobado externamente sobre el workspace interno `factory-qa-electron` (`factory_typed`).

## Flujo y retorno

Lean → CEREBRO → Radar → Hermes/Scout → JEFE → MEMORIA → Planner → Codex aislado → QA/seguridad → preview/aprobación humana → Git/CI/entrega → observabilidad → MEMORIA. Cada salida es evidencia para el siguiente gate, no permiso implícito. Brief incompleto vuelve a CEREBRO/Radar; evidencia insuficiente a Hermes/Scout; contradicción a MEMORIA/Lean; plan inválido a Planner; ejecución, QA o seguridad fallidas a Codex/Planner; preview rechazado a JEFE/Planner/Codex; CI/entrega fallidas a Codex/QA/release; incidente a observabilidad/JEFE/MEMORIA.

| Escalón | Propósito y dueño | Entrada → salida/gate | Excluye y retorno |
| --- | --- | --- | --- |
| 3 | Descubrimiento e investigación supervisados: CEREBRO/Radar/Hermes/Scout/JEFE | necesidad humana → intake, plan, receipts correlacionados y runtime local supervisado; gate: identidad, política y evidencia | sin red ni proveedores reales; falta crítica vuelve a Lean/CEREBRO |
| 4 | Planner y contratos ejecutables | intake/contexto válido → alcance, dependencias, riesgos y plan; gate: contrato cerrado | sin ejecución; invalidez vuelve a discovery |
| 5 | Ejecución segura: Codex/worktrees | plan aprobado → cambio aislado recuperable; gate: locks/límites | sin entrega; fallo vuelve a Codex/Planner |
| 6 | QA, seguridad y correction loop | cambio aislado → evidencia de pruebas; gate: QA/SAST/accesibilidad; bloques 6A contrato/política, 6B persistencia/orquestación, 6C evidencia/gates, 6D recovery/corrección | sin aprobación visual; fallo vuelve a responsable; especificación en `ORQUESTADOR_ESCALON_6_QA_SECURITY.md` |
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

Al cierre del Escalón 3, el siguiente bloque era `ESCALON_4A_PLANNER_AND_EXECUTABLE_CONTRACTS`; quedó completado posteriormente.

## Escalón 4A — contrato canónico de planner

`ESCALON_4_STATUS=VERIFIED_CLOSED`; `ESCALON_4A_STATUS=COMPLETED`; `ESCALON_4B_STATUS=COMPLETED`; `ESCALON_4C_STATUS=COMPLETED`; `ESCALON_4D_STATUS=COMPLETED`.

`jefe-planner-contract.cjs` es la autoridad de la solicitud y del plan local. Correlaciona identidad física, intake, plan de investigación, caso de evidencia, flujo supervisado y paquete de contexto específico de Planner. El contrato normaliza alcance, dependencias, riesgos y restricciones sin paths, secretos, credenciales ni comandos; produce pasos deterministas de planificación y un gate explícito. Sólo evidencia `accepted_for_context` con paquete `ready` cierra el contrato para el gate siguiente; toda evidencia insuficiente, humana pendiente o paquete restringido vuelve a discovery. Ningún plan habilita ejecución: `executionPermitted=false` hasta el Escalón 5.

El smoke `jefe-planner-contract-smoke.mjs` pasa `20/20` casos conductuales locales sobre determinismo, correlación, límites, sanitización, gate, inmutabilidad y matriz negativa. No hay UI, IPC, red, proveedores, navegador, Electron, Codex, ejecución, aprobación humana, proyecto comercial, preview, publicación o deploy.

4B continuó posteriormente desde este contrato cerrado.

## Escalón 4B — persistencia y orquestación de Planner

`ESCALON_4B_STATUS=COMPLETED`. `jefe-planner-persistence.cjs` persiste la solicitud y su plan correlacionado mediante staging/rename, locks por root físico, reapertura, idempotencia, índice reconstruible y aislamiento por proyecto. Los registros son inmutables: una solicitud o plan forjado se rechaza antes de escribir y una corrupción permanece visible en el read model.

`jefe-planner-orchestrator.cjs` consume exclusivamente puertos de lectura de discovery, casos de evidencia y flujos 3C, más un paquete 2C validado para el agente Planner. Revalida identidad y correlación completa antes de crear los registros. Fuente ausente, identidad cruzada o referencias incongruentes rechazan la preparación; evidencia insuficiente genera el retorno explícito a discovery. No hay adapter, shell, red, IPC, Codex ni ejecución de plan.

El smoke `jefe-planner-persistence-smoke.mjs` pasa `20/20` casos conductuales locales de persistencia, reapertura, concurrencia, corrupción, rollback atómico, aislamiento y seguridad de fuentes. 4C continuó posteriormente desde esta persistencia.

## Escalón 4C — evidencia y gate de contrato

`ESCALON_4C_STATUS=COMPLETED`. `jefe-planner-gate.cjs` deriva y persiste un gate inmutable de cada revisión de plan. Si el contrato está cerrado, el resultado queda preparado sólo para el gate del Escalón 5; si no, retorna a discovery. En ambos casos el permiso de ejecución es explícitamente `not_available_until_escalon_5`: el módulo no registra aprobación humana, no inicia Codex y no autoriza ninguna operación externa.

El gate es atómico, reabrible, idempotente, aislado por proyecto y con índice reconstruible; su read model no muta. El smoke `jefe-planner-gate-smoke.mjs` pasa `16/16` casos conductuales locales. 4D continuó posteriormente desde este gate.

## Escalón 4D — recuperación y cierre de Planner

`ESCALON_4D_STATUS=COMPLETED`; `ESCALON_4_STATUS=VERIFIED_CLOSED`; `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`. `jefe-planner-recovery.cjs` diagnostica los stores de plan y gate sin escribir, deriva un plan determinista y reconstruye exclusivamente sus índices derivados por una invocación explícita. No reabre ni ejecuta planes, adapters o proveedores, no borra registros y no altera decisiones humanas.

El smoke `jefe-planner-recovery-smoke.mjs` pasa `11/11` casos conductuales locales. La matriz del Escalón 4 comprende contratos `20/20`, persistencia/orquestación `20/20`, gates `16/16` y recovery `11/11`. Esto cierra solamente Planner y contratos ejecutables locales; no inicia Codex, worktrees, ejecución, QA, preview, aprobación humana, Git/CI, red, publicación ni deploy.

`ESCALON_5_STATUS=VERIFIED_CLOSED`; `ESCALON_5_BLOCKS=5A_CONTRACT_POLICY,5B_DURABLE_STATE,5C_CONTROLLED_EXECUTION_MEMORY,5D_RECOVERY_DOCUMENTATION`.
`NEXT=ESCALON_6_QA_SECURITY`.

`ESCALON_6_STATUS=VERIFIED_CLOSED`; `ESCALON_6A_STATUS=COMPLETED`; `ESCALON_6B_STATUS=COMPLETED`; `ESCALON_6C_STATUS=COMPLETED`; `ESCALON_6D_STATUS=COMPLETED`; `ESCALON_6_BLOCKS=6A_CONTRACT_POLICY,6B_DURABLE_ORCHESTRATION,6C_EVIDENCE_GATES,6D_RECOVERY_CORRECTION_DOCUMENTATION`. El cierre usa la evidencia v4-final aprobada externamente sobre el workspace físico interno `factory-qa-electron` (`factory_typed`); `ESCALON_7_STATUS=NOT_STARTED`.

## Auditoria de cierre del Escalon 5 — 2026-08-26

La auditoria confirmo rama `integration/orquestador-canonical-v1`, HEAD `f2cb4f83edeaa57a270057c4c156b474bcd5b943`, arbol e indice limpios, y ancestry lineal de 5A, 5B, 5C, 5D y la correccion de retry lineage. `package.json` cambio intencionalmente en 5A para agregar los cuatro comandos smoke de 5A–5D; su SHA-256 actual es `43c4d2a4e3188682e42fbfb8b91032010f22f938f0a68522010a925f6ee4c272`, frente a `660bfe94e2c1ac11abdaa04ac36190503b4638217932c8c0d2bfe5f5cd0259ff` en `ad78a08^`. `package-lock.json` no cambio y conserva SHA-256 `6a202a2a9d202936dfee777591fe2e01cffc0ab588c6775faf20849990280303`.

La correccion de auditoria en 5B restringe los patches de transicion a `adapter` y `technicalResult`; impide alterar identidad, repositorio, baseline, permisos o lineage desde una transicion durable. El smoke 5B agrega evidencia adversarial de rechazo y preservacion.

Evidencia ejecutada: 5A `12/12`, 5B `11/11`, 5C `5/5`, 5D `5/5`; Planner contrato/persistencia/gate/recovery `20/20`, `20/20`, `16/16`, `11/11`; Research, MEMORIA, recovery y regresiones relacionadas PASS. Syntax, ESLint focal, typecheck, build y `git diff --check` PASS. El lint global queda FAIL con `316 errores, 0 warnings`, concentrados en la deuda heredada `src/factory/hermes-*`; el build conserva el warning literal de chunk mayor a 500 kB.

El alcance operativo detallado de `ESCALON_6_QA_SECURITY` está definido en su especificación canónica enlazada. El bloque 6 queda cerrado documentalmente: smoke focal `24/24`, batería completa, workspace físico `factory-qa-electron` y evidencia v4-final aprobada externamente. La deuda Hermes sigue documentada y `ESCALON_7_STATUS=NOT_STARTED`.
## Errata de estado vigente 2026-08-26

Las referencias históricas de Escalón 6 como pendiente o en progreso quedan superseded por el estado prevalente: `ESCALON_6_STATUS=VERIFIED_CLOSED`; `ESCALON_7_STATUS=NOT_STARTED`. El cierre documental usa la evidencia v4-final aprobada externamente sobre `factory-qa-electron` (`factory_typed`).
