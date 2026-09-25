## ESTADO VIGENTE — 2026-09-25

Esta sección supersede las afirmaciones históricas incompatibles de agosto y de los cierres anteriores. El pipeline semántico real y el flujo normal de usuario ya fueron demostrados; la aprobación automatizada de QA no equivale a aprobación humana. El estado vigente de Git/CI/entrega es `ESCALON_8_STATUS=IN_PROGRESS`, `ESCALON_8A_STATUS=COMPLETED`, `ESCALON_8B_STATUS=COMPLETED`, `ESCALON_8C_STATUS=NOT_STARTED`, `ESCALON_8D_STATUS=NOT_STARTED`.

8B es una capa durable de contratos: requests inmutables, flows CAS, autorizaciones separadas, outbox de intención, replay/reconciliación, detección stale, corrupción visible e índices derivados reconstruibles. No ejecuta commit, push, CI remoto, release ni deploy. `NEXT=ESCALON_8C_EXPLICIT_GIT_REMOTE_CI_DELIVERY`.

La calidad remota no se fabrica desde la local: `.github/workflows/ci.yml` existe, pero `npm run quality:ci` continúa bloqueado por deuda histórica de lint global (`306` errores documentados), sin cambios de reglas.

# ESTADO VIGENTE — 2026-09-24

Este encabezado supersede el estado histórico de agosto. Desde entonces se implementó y validó el pipeline semántico real: existe un ciclo aprobado `version-v0001 → version-v0006`, con rechazos humanos durables, provider OpenAI real, Model Router V2, BrowserQuality real y aprobación humana durable.

Ver [ORQUESTADOR_REAL_SEMANTIC_CYCLE_2026-09-24.md](ORQUESTADOR_REAL_SEMANTIC_CYCLE_2026-09-24.md). Esto no significa production-ready: el ciclo fue un controlled smoke en `.codex-temp`, con ID `smoke` oculto para la UI y deep-link; falta demostrar `REAL_USER_PROJECT_FLOW_V1` desde creación normal hasta aprobación sin harness.

# Estado actual canónico del Orquestador

Fecha de cierre documental: 2026-08-26. Rama: `integration/orquestador-canonical-v1`.

Estado vigente posterior a la aprobación externa: `ESCALON_6_STATUS=VERIFIED_CLOSED`; `ESCALON_7_STATUS=IMPLEMENTED_PENDING_HUMAN_GATE`; `ESCALON_8_STATUS=NOT_STARTED`. La evidencia del 6 es `orquestador-visual-evidence-2026-08-26-v4-final.zip`; el 7 tiene implementación local, smoke de 25 casos y evidencia visual parcial en `orquestador-visual-evidence-escalon-7-final11.zip`, pero requiere gate humano y evidencia runtime del Bridge/workspace Electron.

Registro histórico previo a la implementación local de 7: la evidencia v4-final fue revisada y aprobada externamente. El estado vigente de 7 es `IMPLEMENTED_PENDING_HUMAN_GATE`, como se declara arriba.

Estado prevalente de cierre: `ESCALON_1_STATUS=VERIFIED_CLOSED`; `ESCALON_2A_STATUS=COMPLETED`; `ESCALON_2B_STATUS=COMPLETED`; `ESCALON_2C_STATUS=COMPLETED`; `ESCALON_2D_STATUS=COMPLETED`; `ESCALON_2_STATUS=VERIFIED_CLOSED`; `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`.

Estado actual: `STATUS=ESCALON_7_IMPLEMENTED_PENDING_HUMAN_GATE`; `ESCALON_3_STATUS=VERIFIED_CLOSED`; `ESCALON_4_STATUS=VERIFIED_CLOSED`; `ESCALON_5_STATUS=VERIFIED_CLOSED`; `ESCALON_6_STATUS=VERIFIED_CLOSED`; `ESCALON_7_STATUS=IMPLEMENTED_PENDING_HUMAN_GATE`; `ESCALON_8_STATUS=NOT_STARTED`. Escalones 9 y 11–12 siguen `NOT_STARTED`; Escalón 10 conserva `PARTIAL_EXISTING_FOUNDATION`. La autoridad es [ORQUESTADOR_CANONICAL_ROADMAP.md](ORQUESTADOR_CANONICAL_ROADMAP.md).

`NETWORK=DISABLED`; `REAL_NETWORK_CONNECTORS=NOT_CONNECTED`; `PUSH=NO`; `ESCALON_5_STATUS=VERIFIED_CLOSED`; `ESCALON_5A_STATUS=VERIFIED_CLOSED`; `ESCALON_5B_STATUS=VERIFIED_CLOSED`; `ESCALON_5C_STATUS=VERIFIED_CLOSED`; `ESCALON_5D_STATUS=VERIFIED_CLOSED`; `NEXT=ESCALON_7_HUMAN_GATE_AND_VISUAL_EVIDENCE`.

Auditoría histórica 2026-08-26: Escalón 5 quedó verificado tras corregir la allowlist de patches de transición en persistencia 5B. La referencia original a Escalón 6 en progreso queda supersedida por el cierre documental aprobado registrado arriba. Escalón 7 está implementado localmente y pendiente del gate humano/evidencia visual runtime.

Implementación 2026-08-26: [ORQUESTADOR_ESCALON_6_QA_SECURITY.md](ORQUESTADOR_ESCALON_6_QA_SECURITY.md) define e implementa 6A–6D. El smoke QA pasa `24/24`, la batería completa pasa y la evidencia v4-final fue aprobada externamente. Escalón 7 implementa preview/aprobación local, persistencia, recovery, IPC/preload y UI; su smoke pasa `25` casos e incluye pending_review, reviewed, supersession, CAS concurrente y corrupción read-only. Existe evidencia visual parcial del renderer web; queda `IMPLEMENTED_PENDING_HUMAN_GATE` por autenticación humana no conectada y evidencia runtime del Bridge/workspace Electron no obtenida.

Evidencia de cierre: `CORRELATION_SMOKE=PASS`; `SMOKE_3B=84/84_PASS`; `CONNECTOR_RUNTIME_SMOKE=54/54_PASS`; `ESCALON_3C_B_SMOKE=24/24_PASS`; `SUPERVISED_EXECUTION_SMOKE=38/38`; `ESCALON_3C_C_DELIVERY_SMOKE=26/26_PASS`; `ESCALON_3C_D_HEALTH_SMOKE=34/34_PASS`; `SUPERVISED_RECOVERY_SMOKE=67/67`; `C2_REGRESSION=36/36_PASS`.

`ESCALON_1_STATUS=VERIFIED_CLOSED`: se cerraron y verificaron la reconciliación de repositorio y la autoridad canónica, no el producto ni el release.

`ESCALON_2_STATUS=VERIFIED_CLOSED`; `ESCALON_2A_STATUS=COMPLETED`; `ESCALON_2B_STATUS=COMPLETED`; `ESCALON_2C_STATUS=COMPLETED`; `ESCALON_2C_A_STATUS=COMPLETED`; `ESCALON_2C_B_STATUS=COMPLETED`; `ESCALON_2C_C_STATUS=COMPLETED`; `ESCALON_2C_C1_STATUS=COMPLETED`; `ESCALON_2C_C2_STATUS=COMPLETED`; `ESCALON_2D_STATUS=COMPLETED`.

2B conecta MEMORIA al lifecycle canónico mediante productores posteriores a manifests/ledger, outbox durable, reapertura/reintento, reconciliación idempotente, aislamiento A/B y canales contextuales semánticos. El smoke integrado pasa `CHECKS=42/42` y `CASOS_PASS=1-42`.

## Integrado y validado focalmente

- Contrato único de proyecto, run y versión.
- Perfiles locales `factory_typed` y `commercial_site`.
- Materialización, manifests, persistencia e IPC/preload allowlisted.
- Hub comercial, wizard de cinco pasos, Input Assets como referencia y tres direcciones visuales.
- Workspace de cuatro áreas, ciclo de versiones, ledger, aprobación local, comparación de manifests/hashes, restauración como nueva versión y entrega local inmutable.
- Resolver seguro de preview para proyecto/versión/recurso declarado y MIME permitido.
- La creación/materialización canónica es la única vía real; el flujo heredado permanece deshabilitado y su smoke sólo verifica el rechazo honesto `not_available`.
- MEMORIA recibe creación, versiones, cambios, aprobaciones, restauraciones, entrega local y fallos sanitizados desde fuentes físicas; snapshot/timeline son lecturas puras y timeline está limitado/paginado.
- Paquetes canónicos de contexto son deterministas, presupuestados y específicos por agente; los adapters 2C-B producen sólo handoffs inmutables para consumidores internos inyectables y el runtime por defecto responde `not_connected`.
- 3A conserva intake humano durable; 3B-R1 agrega requests independientes en casos de evidencia deterministas y limita MEMORIA a un append del orquestador después de aceptación.
- 3C-A aporta contrato, persistencia, coordinación y runtime local seguro para intentos de connector, con presupuesto confiable, concurrencia, timeout de adapter, cancelación linealizada, retry, circuit breaker y reconciliación acotada.
- 3C-B añade exclusivamente `structured_analysis`: un conector local, determinista y sin red para paquetes autorizados; `manual_reference` sigue siendo inerte y los fixtures no acreditan proveedores ni evidencia externa.
- 3C-C conecta el flujo supervisado durable desde intake hasta entrega previa a `receiveContribution`, con replay, concurrencia, cancelación, fallo parcial y reanudación sin repetir el adapter ni fabricar autoridad.
- 3C-D diagnostica y recupera localmente mediante planes explícitos y allowlisted, reconstruye derivados y salud, conserva corrupción y sincroniza sólo trabajo durable compatible; no ejecuta adapters, reintentos de proveedor ni red.

## Límites abiertos

El Escalón 3 queda cerrado sólo como flujo local supervisado. Permanecen pendientes UI de MEMORIA y conectores, autenticación humana end-to-end, agentes y proveedores reales, aprendizaje entre proyectos, búsqueda semántica/vectorial, investigación remota, planner comercial, Codex/executor real, QA y seguridad globales, preview embebido/QA visual, Git/CI/entrega remota, observabilidad y prueba integral.

El preview no está demostrado como iframe ni validado visualmente; sólo puede abrirse un recurso local previamente validado. Aprobación local no equivale a validación técnica o visual. No hay deploy, publicación, red ni proyecto comercial real.

## Deuda y próximo paso

`npm run lint` global continúa FAIL heredado: la ejecución de auditoría del 2026-08-26 reportó 316 errores y 0 warnings en archivos `src/factory/hermes-*`; la cifra histórica de 306 queda sólo como antecedente fechado. La deuda Hermes permanece intacta, el quality gate global sigue abierto y no se alteraron reglas. JEFE no está release-ready; deploy, proveedores reales y proyecto comercial real siguen fuera de alcance. Escalón 6 está cerrado documentalmente sobre la evidencia aprobada.

## Escalón 3B — investigación supervisada

`ESCALON_3B_STATUS=COMPLETED`; registro no equivale a conexión, receipt no equivale a evidencia y evidencia aceptada no equivale a verdad absoluta. Las sesiones por request son durables, con receipts inmutables, replay, recuperación de `evidence_pending` y corrupción aislada. La red sigue deshabilitada y los proveedores reales no están conectados.

### Reparación estructural 3B-R1

`ESCALON_3B_R1_STATUS=COMPLETED`; `CORRELATION_SMOKE=PASS` con 41 casos conductuales reales y el smoke histórico 3B en 84/84. El agregado durable correlaciona las tres requests de cada plan, reconstruye corroboraciones sólo desde receipts persistidos, conserva contradicciones para Lean y limita MEMORIA a un único append del orquestador tras `accepted_for_context`. No habilita red, providers reales, UI, autenticación humana, preview ni deploy.

## Escalón 3C-A — runtime seguro de conectores

`STATUS=ESCALON_3C_A_COMPLETED`; el cierre original obtuvo `CONNECTOR_RUNTIME_SMOKE=52/52_PASS_X5` y la regresión actual pasa `54/54`. Los intentos son cerrados, durables e idempotentes; el caller no controla adapter, provider, presupuesto, timeout, circuit breaker, IDs ni autoridad. Los adapters inyectados sólo pueden devolver candidatos no confiables, que el runtime valida bajo un contrato cerrado. La única vía hacia la evidencia 3B es `receiveContribution`, que vuelve a validar correlación y receipt; el runtime no decide `accepted_for_context` ni escribe MEMORIA por su cuenta.

El cierre original de 3C-A completó `52/52` en cinco ejecuciones; la regresión actual completa `SMOKE_STRUCTURE=54/54`, `BEHAVIORAL_CASES_COMPLETE=54/54` y `BEHAVIORAL_CASES_REAL=1-54`. Esto acredita comportamiento local con fixtures inyectadas, no red, DNS, fetch, shell, navegador, Electron, providers reales, generación, preview, publicación o deploy.

La matriz cruzada reexpuso una flake C2 entre instancias de MEMORIA sobre el mismo root. La persistencia ahora serializa append/rebuild por root dentro del proceso y usa staging globalmente único; C2 pasó 36/36 en diez ejecuciones consecutivas. No existe locking multiproceso.

## Cierre 3C-B, 3C-C y 3C-D

`ESCALON_3_STATUS=VERIFIED_CLOSED`; `ESCALON_3C_STATUS=VERIFIED_CLOSED`; `ESCALON_3C_B_STATUS=COMPLETED`; `ESCALON_3C_C_STATUS=COMPLETED`; `ESCALON_3C_D_STATUS=COMPLETED`; `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`.

3C-B integra solamente el conector local `structured_analysis`, con input y candidate deterministas y sin red. 3C-C hace durable el flujo de preparación, ejecución explícita y entrega previa al gate de evidencia; el adapter no se repite al reanudar una entrega o sincronización. 3C-D incorpora diagnóstico, plan y recuperación local por root físico, reconstrucción de índices/salud y aislamiento conservador de corrupción. Ningún bloque ejecuta proveedores reales, DNS, fetch, shell, navegador, Electron, proyecto comercial, UI, preview, publicación o deploy.

La evidencia focal es `24/24` para 3C-B, `38/38` y `26/26` para 3C-C, y `34/34` y `67/67` para 3C-D. Ese cierre dejó como siguiente bloque `ESCALON_4A_PLANNER_AND_EXECUTABLE_CONTRACTS`, iniciado posteriormente bajo la autoridad vigente.

## Escalón 4A — contrato canónico de planner

`ESCALON_4A_STATUS=COMPLETED`. La solicitud durablemente identificable correlaciona identity, discovery, investigación, caso de evidencia, flujo 3C y paquete de contexto para Planner. El plan local valida alcance, dependencias, riesgos y restricciones con límites y sanitización; no acepta paths, secretos, credenciales ni comandos. El gate es `closed` sólo para evidencia `accepted_for_context` y paquete `ready`; el resto retorna explícitamente a discovery. No existe permiso de ejecución, autoridad humana, IPC, UI, Codex, red, preview o deploy.

`jefe-planner-contract-smoke.mjs` pasa `20/20` casos conductuales reales. 4B fue iniciado posteriormente desde este contrato cerrado.

## Escalón 4B — persistencia y orquestación de Planner

`ESCALON_4B_STATUS=COMPLETED`. La persistencia de solicitud/plan es atómica, reabrible, idempotente, aislada y con índice derivado reconstruible. La orquestación sólo revalida los puertos canónicos de 3A/3B-R1/3C y el paquete 2C para Planner; no ejecuta plan ni acepta autoridad humana. Las fuentes ausentes o cruzadas se rechazan y la evidencia insuficiente retorna a discovery.

`jefe-planner-persistence-smoke.mjs` pasa `20/20` casos. 4C fue iniciado posteriormente desde la persistencia canónica.

## Escalón 4C — evidencia y gate de contrato

`ESCALON_4C_STATUS=COMPLETED`. El gate durable deriva del plan y sólo puede cerrar contrato o devolver a discovery; no puede registrar una decisión humana ni emitir un permiso de ejecución. Aun con contrato cerrado, `executionPermit=not_available_until_escalon_5`. Su persistencia es atómica, idempotente, reabrible y reconstruible.

`jefe-planner-gate-smoke.mjs` pasa `16/16` casos. 4D fue iniciado posteriormente desde el gate canónico.

## Escalón 4D — recuperación y cierre de Planner

`ESCALON_4_STATUS=VERIFIED_CLOSED`; `ESCALON_4D_STATUS=COMPLETED`. Recovery diagnostica sin mutar, deriva un plan reproducible y reconstruye sólo índices derivados por una acción explícita. Nunca ejecuta planes, adapters, proveedores o Codex; tampoco borra historia, resuelve decisiones humanas ni habilita Escalón 5.

La matriz local completa pasa: contrato `20/20`, persistencia/orquestación `20/20`, gate `16/16` y recovery `11/11`. Planner queda cerrado sólo como contrato/persistencia/gate local. El siguiente escalón canónico es 5A y no fue iniciado.
## Errata de estado vigente 2026-08-26

Las referencias históricas posteriores que mencionan `IN_PROGRESS` o `ESCALON_7_STATUS=NOT_STARTED` preceden a la implementación local actual. El estado prevalente es `ESCALON_6_STATUS=VERIFIED_CLOSED`; `ESCALON_7_STATUS=IMPLEMENTED_PENDING_HUMAN_GATE`, conforme al gate humano y la evidencia visual runtime aún pendientes.
# ESTADO VIGENTE — 2026-09-25

El estado vigente supersede las afirmaciones históricas incompatibles de agosto y el encabezado documental del 2026-09-24. El pipeline semántico real fue implementado y cerrado mediante QA autónoma aislada: contratos, persistencia, Human Gate mecánico, BrowserQuality, grounding de claims, CTA human-owned, corrección semántica, calidad y Playwright Chromium quedaron verificados.

Existe un cierre automatizado del flujo `REAL_USER_PROJECT_FLOW_V1B` con dos runs semánticos reales en estados de código distintos y seis provider calls totales. El segundo run terminó promovido y el recorrido QA posterior aprobó automáticamente la versión en un root aislado. Esto demuestra la mecánica del flujo, no production-readiness ni juicio humano: `AutomatedQaApproval=true`, `RealHumanApproval=false`.

La evidencia completa está en [AUTONOMOUS_QUALITY_CLOSURE_2026-09-25.md](AUTONOMOUS_QUALITY_CLOSURE_2026-09-25.md). La evidencia visual y los datos QA permanecen fuera de Git bajo `.codex-temp/autonomous-quality-closure`.

Limitaciones vigentes: no hubo deploy ni producción externa, no se usaron conectores externos, y la validación browser fue aislada. La próxima fase es trasladar esta cobertura al flujo normal de proyecto de usuario sin harness especial, conservando los gates y la separación del Human Gate.
# ESTADO VIGENTE — 2026-09-25 · NORMAL USER FLOW ACCEPTANCE

El flujo normal de usuario fue aceptado mediante Playwright Chromium headless usando el `APPDATA` normal y el root default real de JEFE, sin `JEFE_WEB_DATA_ROOT`, controlled smoke, deep-link ni runner especial de persistencia. El proyecto histórico fue protegido por snapshot/hash y terminó con `ExistingProjectsMutated=0`.

La evidencia está en [NORMAL_USER_FLOW_ACCEPTANCE_2026-09-25.md](NORMAL_USER_FLOW_ACCEPTANCE_2026-09-25.md). La aceptación creó un proyecto normal nuevo, ejecutó borrador, creación, Projects, preview, rechazo, corrección semántica real, nueva versión, quality y aprobación automatizada. `AutomatedAcceptanceApproval=true`; `RealHumanApproval=false`. Esto no declara production-ready.

El primer proyecto de esta fase quedó bloqueado por el gate de legibilidad del hero; se hizo fix-forward con regresión y se creó un segundo proyecto normal nuevo. El segundo run terminó `PROMOTED`, preservó la versión fuente y dejó `version-v0001` aprobado mecánicamente. Los proyectos y screenshots son evidencia local deliberada y no deben limpiarse sin decisión de retención.
# ESTADO VIGENTE — 2026-09-25 · ESCALÓN 8A

Escalón 7 está `VERIFIED_CLOSED` en alcance local demostrado. Escalón 8 está `IN_PROGRESS`; 8A (`Git / CI / Delivery Contract + Policy`) está `COMPLETED`, mientras 8B, 8C y 8D siguen `NOT_STARTED`. El contrato separa aprobación, delivery local, commit preparado, autorización remota, CI remoto, release y deploy; no ejecuta mutaciones remotas.

La especificación es [ORQUESTADOR_ESCALON_8_GIT_CI_DELIVERY.md](ORQUESTADOR_ESCALON_8_GIT_CI_DELIVERY.md). `NEXT=ESCALON_8B_DURABLE_ORCHESTRATION`. El lint global conserva deuda histórica no relacionada; el lint focal y las validaciones de 8A fueron ejecutados por separado.
