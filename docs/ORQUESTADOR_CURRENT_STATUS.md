# Estado actual canónico del Orquestador

Fecha de cierre documental: 2026-08-25. Rama: `integration/orquestador-canonical-v1`.

Estado prevalente de cierre: `ESCALON_1_STATUS=VERIFIED_CLOSED`; `ESCALON_2A_STATUS=COMPLETED`; `ESCALON_2B_STATUS=COMPLETED`; `ESCALON_2C_STATUS=COMPLETED`; `ESCALON_2D_STATUS=COMPLETED`; `ESCALON_2_STATUS=VERIFIED_CLOSED`; `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`.

Estado actual: `STATUS=ESCALON_3C_A_COMPLETED`; `ESCALON_3_STATUS=IN_PROGRESS`; `ESCALON_3A_STATUS=COMPLETED`; `ESCALON_3B_STATUS=COMPLETED`; `ESCALON_3B_R1_STATUS=COMPLETED`; `ESCALON_3C_STATUS=IN_PROGRESS`; `ESCALON_3C_A_STATUS=COMPLETED`. Los escalones 4–9 y 11–12 siguen `NOT_STARTED`; Escalón 10 conserva `PARTIAL_EXISTING_FOUNDATION`. La autoridad es [ORQUESTADOR_CANONICAL_ROADMAP.md](ORQUESTADOR_CANONICAL_ROADMAP.md).

`NETWORK=DISABLED`; `REAL_NETWORK_CONNECTORS=NOT_CONNECTED`; `PUSH=NO`; `NEXT=ESCALON_3C_SUPERVISED_RESEARCH_CONNECTORS_AND_EXECUTION`.

Evidencia de cierre: `CORRELATION_SMOKE=PASS`; `SMOKE_3B=84/84_PASS`; `SMOKE_STRUCTURE=52/52`; `BEHAVIORAL_CASES_COMPLETE=52/52`; `CONNECTOR_RUNTIME_SMOKE=52/52_PASS_X5`; `C2_REGRESSION=36/36_PASS`.

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

## Límites abiertos

Escalón 3 continúa abierto después de completar 3C-A; 3C-B, 3C-C y 3C-D no comenzaron. Permanecen pendientes UI de MEMORIA y conectores, autenticación humana end-to-end, agentes y proveedores reales, aprendizaje entre proyectos, búsqueda semántica/vectorial, investigación remota, planner comercial, Codex/executor real, QA y seguridad globales, preview embebido/QA visual, Git/CI/entrega remota, observabilidad y prueba integral.

El preview no está demostrado como iframe ni validado visualmente; sólo puede abrirse un recurso local previamente validado. Aprobación local no equivale a validación técnica o visual. No hay deploy, publicación, red ni proyecto comercial real.

## Deuda y próximo paso

`npm run lint` global continúa FAIL heredado: 306 errores, 0 warnings, 73 archivos afectados bajo `src/factory/hermes-*`. La deuda Hermes permanece intacta, el quality gate global sigue abierto y no se alteraron reglas. JEFE no está release-ready; UI, autenticación humana end-to-end, QA visual, deploy y proyecto comercial real siguen pendientes. El runtime 3C-A no autoriza ejecución remota ni cambia el `NEXT` canónico.

## Escalón 3B — investigación supervisada

`ESCALON_3B_STATUS=COMPLETED`; registro no equivale a conexión, receipt no equivale a evidencia y evidencia aceptada no equivale a verdad absoluta. Las sesiones por request son durables, con receipts inmutables, replay, recuperación de `evidence_pending` y corrupción aislada. La red sigue deshabilitada y los proveedores reales no están conectados.

### Reparación estructural 3B-R1

`ESCALON_3B_R1_STATUS=COMPLETED`; `CORRELATION_SMOKE=PASS` con 41 casos conductuales reales y el smoke histórico 3B en 84/84. El agregado durable correlaciona las tres requests de cada plan, reconstruye corroboraciones sólo desde receipts persistidos, conserva contradicciones para Lean y limita MEMORIA a un único append del orquestador tras `accepted_for_context`. No habilita red, providers reales, UI, autenticación humana, preview ni deploy.

## Escalón 3C-A — runtime seguro de conectores

`STATUS=ESCALON_3C_A_COMPLETED`; `CONNECTOR_RUNTIME_SMOKE=52/52_PASS_X5`. Los intentos son cerrados, durables e idempotentes; el caller no controla adapter, provider, presupuesto, timeout, circuit breaker, IDs ni autoridad. Los adapters inyectados sólo pueden devolver candidatos no confiables, que el runtime valida bajo un contrato cerrado. La única vía hacia la evidencia 3B es `receiveContribution`, que vuelve a validar correlación y receipt; el runtime no decide `accepted_for_context` ni escribe MEMORIA por su cuenta.

El smoke 3C-A completó `SMOKE_STRUCTURE=52/52`, `BEHAVIORAL_CASES_COMPLETE=52/52` y `BEHAVIORAL_CASES_REAL=1-52` en cinco ejecuciones, además de las regresiones cruzadas. Esto acredita comportamiento local con fixtures inyectadas, no red, DNS, fetch, shell, navegador, Electron, providers reales, generación, preview, publicación o deploy.

La matriz cruzada reexpuso una flake C2 entre instancias de MEMORIA sobre el mismo root. La persistencia ahora serializa append/rebuild por root dentro del proceso y usa staging globalmente único; C2 pasó 36/36 en diez ejecuciones consecutivas. No existe locking multiproceso.
