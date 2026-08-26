# Auditoría maestra integral del Orquestador / JEFE

> Estado canónico: consultar [ORQUESTADOR_CURRENT_STATUS.md](ORQUESTADOR_CURRENT_STATUS.md). Esta auditoría conserva historia; desde el cierre 1G no declara release-ready, QA visual ni Codex real.

Versión incorporada al worktree canónico candidato: 2026-08-20.
Fuente auditada: `feature/jefe-factory-core` y `feature/jefe-real-project-delivery-v1`, ambos desde `81ba810313610e3e3f678bea5a70b29650b471c0`.

## Addendum Escalon 5

## Addendum vigente: cierre documental Escalon 6

`ESCALON_6_STATUS=VERIFIED_CLOSED`; `ESCALON_7_STATUS=NOT_STARTED`. La evidencia visual v4-final fue aprobada externamente: `orquestador-visual-evidence-2026-08-26-v4-final.zip`, SHA-256 `899D1B33318D4652062488447A1AE666882E13EFBF4E16C4C3D47BEC85E1F9C2`, sobre el workspace interno `factory-qa-electron` (`factory_typed`). No acredita proveedores reales, red, deploy ni publicaciÃ³n. La deuda Hermes global y el warning de chunk mayor a 500 kB permanecen vigentes; el video no fue necesario.

La auditoria cierra 5A contrato/politica, 5B persistencia/estados, 5C ejecucion controlada/MEMORIA y 5D diagnostico/recovery. La evidencia ejecutable esta en los cuatro smokes `orchestrator-canonical-execution-5[abcd]-smoke.mjs`. El adaptador Codex externo sigue desconectado y no se simula exito. El proximo escalon es 6 y no fue iniciado.

## Formalizacion del Escalon 6

La especificacion canonica está en [ORQUESTADOR_ESCALON_6_QA_SECURITY.md](ORQUESTADOR_ESCALON_6_QA_SECURITY.md). Define 6A–6D, contratos de QA/security/findings/correction, correlación, estados, gates, evidencia, políticas locales, recovery, límites y criterios de cierre. 6A–6D tienen implementación local y el smoke 6 pasa `24/24`; la batería integral posterior a las correcciones también pasa. La evidencia v4-final contiene diez vistas reales, incluyendo workspace Electron físico, y fue aprobada externamente. No se declara ejecución SAST externa, proveedor real, red, deploy ni publicación; el cierre del Escalón 6 es documental y `ESCALON_7_STATUS=NOT_STARTED`.

La validación actual del 2026-08-26 reportó 316 errores y 0 warnings en la deuda heredada `src/factory/hermes-*`. Las menciones históricas a 306 errores en este documento no representan el conteo actual; no se modificó esa deuda ni se alteró la configuración de lint.

## Estado vigente de auditoría

El Orquestador posee arquitectura, contratos, UI y smokes parciales, pero no una escalera integral demostrada. Escalón 6 queda cerrado documentalmente con evidencia v4-final aprobada. Escalón 7 permanece `NOT_STARTED`, aunque su contrato canónico ya fue formalizado en [ORQUESTADOR_ESCALON_7_PREVIEW_APPROVAL.md](ORQUESTADOR_ESCALON_7_PREVIEW_APPROVAL.md); todavía faltan implementación y evidencia de sus criterios. Continúan fuera de alcance la verdad de integración externa, Context Hub externo, investigación real/Hermes, ejecución Codex no demostrada, proveedores, red, deploy y publicación.

La evidencia no permite declarar “release candidate”, “deuda crítica cero”, preview validado, investigación remota, Codex operativo, entrega comercial o prueba integral. Capturas blancas no cuentan como evidencia visual.

## Escalones vigentes

| Escalón | Estado |
|---|---|
| Verdad del repositorio | En reconciliación. |
| Context Hub / MEMORIA | Parcial; externo y no demostrado extremo a extremo. |
| Entrada e investigación | Assets parciales; investigación real no demostrada. |
| JEFE comercial | WIP sin validación visual real. |
| Planner / contratos | Parcial y mayormente oculto. |
| Codex / ejecución | Mock/bridge presentes; Codex real no demostrado. |
| QA / seguridad | Smokes/políticas presentes; QA integral ausente. |
| Corrección automática | Preparada en partes, no integrada. |
| Preview / aprobación | Sin evidencia visual válida. |
| Git / CI / entrega | Configurado en parte, sin entrega comprobada. |
| Observabilidad / aprendizaje | Eventos locales, sin analítica/aprendizaje cerrado. |
| Prueba integral | Ausente. |

Este documento es una auditoría fechada; `ORQUESTADOR_INTEGRATION_STATUS.md` registra el bloque de integración actualmente aplicado.

## Deuda heredada de lint: QA / Factory-Hermes

El lint global del baseline mantiene 306 errores y 0 warnings en 73 archivos bajo `src/factory/hermes-*`: 304 de `@typescript-eslint/no-explicit-any` y 2 de `@typescript-eslint/no-empty-object-type`. No afecta al contrato, registro ni smoke fundacionales, que pasan lint focalizado. La deuda permanece abierta y corresponde al escalón futuro de QA / Factory-Hermes; no se relajan reglas ni se modifica la clasificación vigente de los demás escalones.

## Escalón 1C: alcance de creación canónica

La creación de primera versión se reconcilia con contrato único, perfiles `factory_typed` y `commercial_site`, materialización atómica local y manifest reabrible. La validación es estructural y de archivos/DOM; no constituye QA visual, preview, entrega comercial ni ejecución externa. Los flujos de generación heredados con runners, UI, IPC y Hermes siguen fuera del alcance y requieren su escalón propio.

## Escalón 1D: estado de persistencia

Persistencia JSON atómica e IPC allowlisted quedan disponibles para una UI futura. No constituyen una UI, preview o restauración real; la entrega sólo se declara disponible con evidencia física.

## Escalón 1E: hub comercial guiado

La portada comercial consume proyectos físicos mediante `jefeProjectBridge`, con hub, borrador local no canónico y wizard de cinco pasos. El modo técnico permanece fuera del recorrido principal mediante `#advanced`, compatible con Vite y `file://`. Responsive y accesibilidad se implementaron por código; no hubo validación visual. Workspace completo, comparación, restauración y entrega avanzada quedan para 1F.

## Escalón 1F: ciclo local y workspace

El ciclo local de versiones, ledger y entrega inmutable están cubiertos por smokes físicos. El workspace comercial no convierte esa evidencia en claims de IA, Codex real, deploy, publicación o QA visual. Preview conserva una frontera de recurso declarado y MIME allowlisted, pero no hay protocolo dedicado registrado ni evidencia de iframe vivo. La aprobación local no es validación técnica. La deuda global Hermes permanece: 306 errores y 0 warnings en 73 archivos `src/factory/hermes-*`, sin relajar reglas.

## Cierre 1G: auditoría de reconciliación

`ESCALON_1_STATUS=VERIFIED_CLOSED` para la integración de repositorio. La autoridad de contrato, creación, persistencia, IPC, apertura/copia y preview está descrita en `ORQUESTADOR_CANONICAL_ARCHITECTURE.md`; no se halló una autoridad paralela activa en el recorrido canónico. La única vía real de creación/materialización es canónica; el smoke de generación heredada verifica que sus aliases de compatibilidad devuelven `not_available`, sin iniciar runner ni crear artefactos.

La matriz completa y agrupada de los WIP Factory/Comercial se consolida en `ORQUESTADOR_WORKTREE_RECONCILIATION.md`: registro/profiles e Input Assets se integraron o reemplazaron; Hermes/Radar, memoria, planner, executor, QA, corrección, preview visual, entrega remota y observabilidad quedaron asignados a escalones futuros. Cerrar 1 no equivale a cerrar producto, release ni deuda Hermes.

## Escalón 2A: memoria local canónica

MEMORIA incorpora contrato, persistencia inmutable y proyección determinista, sin afirmar integración externa ni recuperación semántica. La decisión humana no puede ser sustituida por una inferencia; las relaciones explícitas preservan historia y conflictos. Persisten como pendientes UI, IPC, productores, consumo por agentes, aprendizaje, vector database y los escalones 2B–2D.

## Escalón 2B: cierre de integración contextual

`ESCALON_2B_STATUS=COMPLETED` dentro de `ESCALON_2_STATUS=IN_PROGRESS`. La auditoría verificó que manifests/ledger son fuente de verdad y que MEMORIA se deriva después del éxito físico para creación, versiones/cambios, aprobación local, restauración, entrega local y fallos sanitizados. La identidad por versión permanece `projectId/runId/versionId`; la autoridad humana procede sólo de una aprobación física local.

La outbox durable representa `synced`, `pending` y `failed`; reconciliación/reapertura recuperan eventos técnicos faltantes de forma idempotente, mientras una colisión incompatible conserva historia y queda `failed`. Locks y cola se liberan, y un fallo contextual de A no bloquea ni contamina B. Snapshot, timeline limitado/paginado, preview y comparación no producen efectos físicos.

La frontera IPC/preload es semántica y cerrada: no hay append genérico, filesystem, paths, roots ni `ipcRenderer` para renderer. El smoke de 2B pasa 42/42. Esto no declara release-ready, QA visual, deploy, publicación, consumo por agentes, búsqueda vectorial, resolución humana de conflictos ni aprendizaje entre proyectos. La deuda Hermes global continúa en 306 errores, 0 warnings y 73 archivos.

## Escalón 2C-A: frontera de paquetes

`ESCALON_2C_STATUS=COMPLETED`; `ESCALON_2C_A_STATUS=COMPLETED`; `ESCALON_2C_B_STATUS=COMPLETED`; `ESCALON_2C_C1_STATUS=COMPLETED`; `ESCALON_2C_C2_STATUS=COMPLETED`. Los paquetes son vistas deterministas, limitadas y puras de snapshots válidos: no constituyen una segunda memoria ni ejecutan agentes. El presupuesto registra omisiones, decisiones humanas/conflictos/lineage se preservan y una fuente pending, failed o corrupta no puede producir falso `ready`.

La auditoría de Factory/Comercial mantuvo sus módulos Context Hub, Hermes, Radar y planner como referencias desconectadas. Se excluyeron de la integración para evitar autoridad paralela, filesystem libre, red o ejecución. Permanecen abiertos consumo real, UI, aprendizaje/vector database, QA visual, deploy y resolución humana de conflictos.

Los adapters 2C-B revalidan los paquetes y entregan handoffs inmutables sólo a consumidores internos inyectados; con registro vacío devuelven `not_connected`. No hay runtime real ni escritura de resultados: 2C-C conserva esa responsabilidad.

2C-C1 añade intento durable y resultado estructurado no ingerido. La persistencia por proyecto es atómica, reconstruible y aislada; no agrega autoridad ni consume referencias URL. Factory/Hermes permanece histórico/pospuesto por sus runners y fronteras de ejecución.

## Cierre 2C-C2

`CHECKS=36/36`. El servicio canonico ingiere solo resultados C1 revalidados como eventos `agent_inference`; la recuperacion parcial es idempotente, A/B queda aislado, la corrupcion se reporta sin contenido crudo y `ENTRY_ID_COLLISION` es permanente. El proximo trabajo es 2D: resolucion humana de conflictos y cierre, no ejecucion automatica.

## Cierre 2D

`CHECKS=54/54`; `ESCALON_2_STATUS=VERIFIED_CLOSED`. Recuperacion, conflictos y salud operan dentro de la autoridad contextual canonica. No reconstruyen fuentes fisicas/canonicas corruptas, no borran historia y no ejecutan lifecycle, agentes, red ni deploy. La retencion es conservadora y la interfaz/autenticacion humana quedan fuera de alcance.

## Roadmap 3-12

La auditoría clasificó runtime canónico de MEMORIA/lifecycle como conectado local; Factory/Hermes/Radar/Planner como histórico o referencia; Comercial como base parcial de UX. El roadmap canónico fija Escalón 3 para discovery supervisado y prohíbe inferir integraciones reales desde smokes, adapters o documentación.

## Escalón 3A

`CHECKS=40/40`. Intake humano durable y paquetes no conectados son fundación local; no hay descubrimiento externo, proveedor, evidencia verificada ni ejecución.

## Escalón 3B — investigación supervisada

ESCALON_3B_STATUS=COMPLETED; registro no equivale a conexión, receipt no equivale a evidencia y evidencia aceptada no equivale a verdad absoluta. La red sigue deshabilitada y los proveedores reales no están conectados. Las sesiones de investigación son durables, con receipts inmutables, replay, recuperación de evidence_pending y corrupción aislada. El contenido externo permanece no confiable; la defensa SSRF es offline hasta 3C. El fallo C2 anterior no volvió a reproducirse; se corrigió una carrera real de staging de MEMORIA mediante secuencia monotónica local y regresión determinista.

## Auditoría de cierre 3B-R1 y 3C-A — 2026-08-25

Esta entrada amplía la historia sin reemplazar las conclusiones fechadas anteriores. El estado prevalente queda en `ORQUESTADOR_CURRENT_STATUS.md` y el orden en `ORQUESTADOR_CANONICAL_ROADMAP.md`.

`ESCALON_3A_STATUS=COMPLETED`; `ESCALON_3B_STATUS=COMPLETED`; `ESCALON_3B_R1_STATUS=COMPLETED`; `STATUS=ESCALON_3C_A_COMPLETED`; `ESCALON_3_STATUS=IN_PROGRESS`. R1 cerró la correlación entre requests mediante casos de evidencia deterministas, receipts persistidos y un único append del orquestador después de `accepted_for_context`. Su smoke completa 41 casos y conserva la regresión 3B en 84/84.

3C-A añade una fundación local de connector runtime con contrato cerrado, persistencia atómica, presupuesto confiable, concurrencia limitada, timeout de adapter, cancelación linealizada, retry con lineage, circuit breaker durable y reconcile acotado. El candidato validado sólo alcanza 3B por `receiveContribution`; ni caller ni adapter pueden elevar provider, IDs, presupuesto, autoridad, aceptación, deploy o paths. Coordinación y locks son locales al proceso y no acreditan ejecución distribuida. El smoke completa 52/52 casos conductuales reales en cinco ejecuciones y mantiene verdes los órdenes cruzados con 3B, 2B, C2 y 2D.

Durante ese cierre, el orden cruzado reprodujo nuevamente una carrera C2 entre instancias de MEMORIA que compartían root. Se corrigió en la persistencia canónica con exclusión por root a nivel de proceso y staging globalmente único; la regresión C2 pasó 36/36 diez veces consecutivas antes de repetir los órdenes. No se afirma coordinación entre procesos.

La evidencia sigue siendo local y de smoke. `NETWORK=DISABLED`; `REAL_NETWORK_CONNECTORS=NOT_CONNECTED`; no hay DNS, fetch, shell, browser, Electron, provider real, generación, preview, publicación ni deploy. UI, autenticación humana end-to-end y QA visual continúan pendientes; JEFE no está release-ready. La deuda Hermes permanece intacta en 306 errores, 0 warnings y 73 archivos afectados. `PUSH=NO`; `NEXT=ESCALON_3C_SUPERVISED_RESEARCH_CONNECTORS_AND_EXECUTION`.
## Errata de estado vigente 2026-08-26

Las afirmaciones históricas de QA visual inexistente o Escalón 6 no cerrado quedan superseded por el addendum de cierre: `ESCALON_6_STATUS=VERIFIED_CLOSED`; `ESCALON_7_STATUS=NOT_STARTED`, con evidencia v4-final aprobada externamente. El alcance sigue sin incluir proveedores reales, red, deploy ni publicación.
