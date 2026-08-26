# Índice documental

Prevalencia: [ORQUESTADOR_CURRENT_STATUS.md](ORQUESTADOR_CURRENT_STATUS.md) define el estado actual; [ORQUESTADOR_CANONICAL_ARCHITECTURE.md](ORQUESTADOR_CANONICAL_ARCHITECTURE.md) define autoridades; la auditoría y reconciliación explican evidencia e historia.

- [Estado actual](ORQUESTADOR_CURRENT_STATUS.md)
Estado vigente: `ESCALON_6_STATUS=VERIFIED_CLOSED`; `ESCALON_7_STATUS=NOT_STARTED`; `ESCALON_7_SPEC_STATUS=READY_FOR_IMPLEMENTATION`. El cierre del 6 usa evidencia visual v4-final aprobada externamente sobre el workspace interno `factory-qa-electron` (`factory_typed`); el contrato de 7 está en [ORQUESTADOR_ESCALON_7_PREVIEW_APPROVAL.md](ORQUESTADOR_ESCALON_7_PREVIEW_APPROVAL.md).
- [Ingesta canónica de resultados de agente](ORQUESTADOR_AGENT_RESULT_INGESTION.md)
- [Recuperación y conflictos de MEMORIA](ORQUESTADOR_CONTEXT_RECOVERY_AND_CONFLICTS.md)
- [Roadmap canónico](ORQUESTADOR_CANONICAL_ROADMAP.md)
- [Especificación Escalón 6 QA/Security](ORQUESTADOR_ESCALON_6_QA_SECURITY.md)
- [Intake y descubrimiento supervisado](ORQUESTADOR_SUPERVISED_DISCOVERY.md)
- [Investigación supervisada y gate de evidencia](ORQUESTADOR_SUPERVISED_RESEARCH.md)
- [Runtime seguro de conectores de investigación](ORQUESTADOR_RESEARCH_CONNECTORS.md)

Estado de cierre Escalón 2: `ESCALON_2_STATUS=VERIFIED_CLOSED`, `ESCALON_2D_STATUS=COMPLETED`, `RECOVERY_SMOKE=54/54_PASS`, `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`. No declara release-ready, agentes reales, autenticación humana end-to-end, UI de conflictos, QA visual, deploy ni red.
- [Arquitectura canónica](ORQUESTADOR_CANONICAL_ARCHITECTURE.md)
- [Auditoría maestra](ORQUESTADOR_MASTER_AUDIT.md)
- [Integración](ORQUESTADOR_INTEGRATION_STATUS.md)
- [Reconciliación y matriz de fuentes](ORQUESTADOR_WORKTREE_RECONCILIATION.md)
- [MEMORIA / Context Hub canónico](ORQUESTADOR_CONTEXT_HUB.md)

Estado prevalente: `ESCALON_1_STATUS=VERIFIED_CLOSED`, `ESCALON_2_STATUS=VERIFIED_CLOSED`, `ESCALON_2A_STATUS=COMPLETED`, `ESCALON_2B_STATUS=COMPLETED`, `ESCALON_2C_STATUS=COMPLETED`, `ESCALON_2D_STATUS=COMPLETED`, `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`. MEMORIA está integrada al lifecycle físico, recibe resultados C1 revalidados y tiene recuperación/conflictos internos probados `54/54`; no hay agentes reales, autenticación humana end-to-end, UI de MEMORIA, QA visual ni deploy.

2C-C1 completa el handoff durable y contrato de resultado no ingerido; 2C-C2 completa la ingesta/reconciliación acotada e idempotente; 2D completa recuperación controlada, conflictos humanos internos y retención conservadora.

Los documentos `V1_*`, `release-candidate-checklist.md`, `operator-demo-flow.md`, `INVESTOR_DEMO_GUIDE.md`, `jefe-readiness-scoreboard.md` y planes de Factory/Hermes son históricos o prospectivos. No describen capacidad canónica ni reemplazan este índice.

## Escalón 3B — investigación supervisada

`ESCALON_3A_STATUS=COMPLETED`; `ESCALON_3B_STATUS=COMPLETED`; `ESCALON_3B_R1_STATUS=COMPLETED`; `CORRELATION_SMOKE=PASS`. Registro no equivale a conexión, receipt no equivale a evidencia y evidencia aceptada no equivale a verdad absoluta. Las sesiones por request quedan subordinadas a casos agregados deterministas; sólo el orquestador puede añadir una evidencia aceptada a MEMORIA.

## Escalón 3C-A — runtime seguro de conectores

`STATUS=ESCALON_3C_A_COMPLETED`; `ESCALON_3_STATUS=IN_PROGRESS`; `ESCALON_3C_A_STATUS=COMPLETED`; `CONNECTOR_RUNTIME_SMOKE=52/52_PASS_X5`. El runtime local durable entrega candidatos sanitizados exclusivamente a `receiveContribution`; no decide evidencia, autoridad ni aceptación.

`NETWORK=DISABLED`; `REAL_NETWORK_CONNECTORS=NOT_CONNECTED`; `PUSH=NO`; `NEXT=ESCALON_3C_SUPERVISED_RESEARCH_CONNECTORS_AND_EXECUTION`. UI, autenticación humana end-to-end, QA visual y deploy siguen pendientes; JEFE no está release-ready. La deuda Hermes permanece intacta: 306 errores, 0 warnings y 73 archivos afectados.
Estado prevalente posterior al cierre documental: `ESCALON_6_STATUS=VERIFIED_CLOSED`; `ESCALON_7_STATUS=NOT_STARTED`. La evidencia v4-final fue aprobada externamente sobre el workspace interno `factory-qa-electron` (`factory_typed`); no es un proyecto comercial ni habilita proveedores, red, deploy o publicación.
