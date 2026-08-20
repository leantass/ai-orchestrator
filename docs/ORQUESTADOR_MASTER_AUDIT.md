# Auditoría maestra integral del Orquestador / JEFE

> Estado canónico: consultar [ORQUESTADOR_CURRENT_STATUS.md](ORQUESTADOR_CURRENT_STATUS.md). Esta auditoría conserva historia; desde el cierre 1G no declara release-ready, QA visual ni Codex real.

Versión incorporada al worktree canónico candidato: 2026-08-20.
Fuente auditada: `feature/jefe-factory-core` y `feature/jefe-real-project-delivery-v1`, ambos desde `81ba810313610e3e3f678bea5a70b29650b471c0`.

## Estado vigente de auditoría

El Orquestador posee arquitectura, contratos, UI y smokes parciales, pero no una escalera integral demostrada. Los bloqueos principales son: verdad de integración, Context Hub externo, investigación real/Hermes bloqueado, ejecución Codex no demostrada, QA visual inexistente, bucles de corrección no integrados y entrega no verificada.

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

`ESCALON_1_STATUS=CLOSED` para la integración de repositorio. La autoridad de contrato, creación, persistencia, IPC, apertura/copia y preview está descrita en `ORQUESTADOR_CANONICAL_ARCHITECTURE.md`; no se halló una autoridad paralela activa en el recorrido canónico. Los aliases de generación heredada son compatibilidad segura porque devuelven `not_available`.

La matriz completa y agrupada de los WIP Factory/Comercial se consolida en `ORQUESTADOR_WORKTREE_RECONCILIATION.md`: registro/profiles e Input Assets se integraron o reemplazaron; Hermes/Radar, memoria, planner, executor, QA, corrección, preview visual, entrega remota y observabilidad quedaron asignados a escalones futuros. Cerrar 1 no equivale a cerrar producto, release ni deuda Hermes.
