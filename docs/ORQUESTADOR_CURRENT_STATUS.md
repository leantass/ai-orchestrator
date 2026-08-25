# Estado actual canónico del Orquestador

Fecha de cierre documental: 2026-08-25. Rama: `integration/orquestador-canonical-v1`.

Estado prevalente de cierre: `ESCALON_1_STATUS=VERIFIED_CLOSED`; `ESCALON_2A_STATUS=COMPLETED`; `ESCALON_2B_STATUS=COMPLETED`; `ESCALON_2C_STATUS=COMPLETED`; `ESCALON_2D_STATUS=COMPLETED`; `ESCALON_2_STATUS=VERIFIED_CLOSED`; `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`.

Estado actual: `STATUS=ESCALON_4C_COMPLETED`; `ESCALON_3_STATUS=VERIFIED_CLOSED`; `ESCALON_3A_STATUS=COMPLETED`; `ESCALON_3B_STATUS=COMPLETED`; `ESCALON_3B_R1_STATUS=COMPLETED`; `ESCALON_3C_STATUS=VERIFIED_CLOSED`; `ESCALON_3C_A_STATUS=COMPLETED`; `ESCALON_3C_B_STATUS=COMPLETED`; `ESCALON_3C_C_STATUS=COMPLETED`; `ESCALON_3C_D_STATUS=COMPLETED`; `ESCALON_4_STATUS=IN_PROGRESS`; `ESCALON_4A_STATUS=COMPLETED`; `ESCALON_4B_STATUS=COMPLETED`; `ESCALON_4C_STATUS=COMPLETED`. Los escalones 5–9 y 11–12 siguen `NOT_STARTED`; Escalón 10 conserva `PARTIAL_EXISTING_FOUNDATION`. La autoridad es [ORQUESTADOR_CANONICAL_ROADMAP.md](ORQUESTADOR_CANONICAL_ROADMAP.md).

`NETWORK=DISABLED`; `REAL_NETWORK_CONNECTORS=NOT_CONNECTED`; `PUSH=NO`; `NEXT=ESCALON_4D_PLANNER_RECOVERY_AND_DOCUMENTATION`.

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

`npm run lint` global continúa FAIL heredado: 306 errores, 0 warnings, 73 archivos afectados bajo `src/factory/hermes-*`. La deuda Hermes permanece intacta, el quality gate global sigue abierto y no se alteraron reglas. JEFE no está release-ready; UI, autenticación humana end-to-end, QA visual, deploy y proyecto comercial real siguen pendientes. Los cierres 3C-B, 3C-C y 3C-D no autorizan ejecución remota ni cambian los límites de red; el próximo bloque canónico es 4A, sin iniciar su implementación.

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

`ESCALON_4_STATUS=IN_PROGRESS`; `ESCALON_4A_STATUS=COMPLETED`. La solicitud durablemente identificable correlaciona identity, discovery, investigación, caso de evidencia, flujo 3C y paquete de contexto para Planner. El plan local valida alcance, dependencias, riesgos y restricciones con límites y sanitización; no acepta paths, secretos, credenciales ni comandos. El gate es `closed` sólo para evidencia `accepted_for_context` y paquete `ready`; el resto retorna explícitamente a discovery. No existe permiso de ejecución, autoridad humana, IPC, UI, Codex, red, preview o deploy.

`jefe-planner-contract-smoke.mjs` pasa `20/20` casos conductuales reales. 4B fue iniciado posteriormente desde este contrato cerrado.

## Escalón 4B — persistencia y orquestación de Planner

`ESCALON_4B_STATUS=COMPLETED`. La persistencia de solicitud/plan es atómica, reabrible, idempotente, aislada y con índice derivado reconstruible. La orquestación sólo revalida los puertos canónicos de 3A/3B-R1/3C y el paquete 2C para Planner; no ejecuta plan ni acepta autoridad humana. Las fuentes ausentes o cruzadas se rechazan y la evidencia insuficiente retorna a discovery.

`jefe-planner-persistence-smoke.mjs` pasa `20/20` casos. 4C fue iniciado posteriormente desde la persistencia canónica.

## Escalón 4C — evidencia y gate de contrato

`ESCALON_4C_STATUS=COMPLETED`. El gate durable deriva del plan y sólo puede cerrar contrato o devolver a discovery; no puede registrar una decisión humana ni emitir un permiso de ejecución. Aun con contrato cerrado, `executionPermit=not_available_until_escalon_5`. Su persistencia es atómica, idempotente, reabrible y reconstruible.

`jefe-planner-gate-smoke.mjs` pasa `16/16` casos. El siguiente bloque es 4D; no fue iniciado por 4C.
