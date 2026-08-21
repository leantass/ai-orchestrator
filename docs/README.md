# Índice documental

Prevalencia: [ORQUESTADOR_CURRENT_STATUS.md](ORQUESTADOR_CURRENT_STATUS.md) define el estado actual; [ORQUESTADOR_CANONICAL_ARCHITECTURE.md](ORQUESTADOR_CANONICAL_ARCHITECTURE.md) define autoridades; la auditoría y reconciliación explican evidencia e historia.

- [Estado actual](ORQUESTADOR_CURRENT_STATUS.md)
- [Ingesta canónica de resultados de agente](ORQUESTADOR_AGENT_RESULT_INGESTION.md)

Estado de cierre 2C-C2: `ESCALON_2C_STATUS=COMPLETED`, `ESCALON_2_STATUS=IN_PROGRESS`, `CHECKS=36/36`, `NEXT=ESCALON_2D_CONTEXT_RECOVERY_CONFLICTS_AND_CLOSURE`. No declara release-ready, agentes reales, aprobación automática, QA visual, deploy ni red.
- [Arquitectura canónica](ORQUESTADOR_CANONICAL_ARCHITECTURE.md)
- [Auditoría maestra](ORQUESTADOR_MASTER_AUDIT.md)
- [Integración](ORQUESTADOR_INTEGRATION_STATUS.md)
- [Reconciliación y matriz de fuentes](ORQUESTADOR_WORKTREE_RECONCILIATION.md)
- [MEMORIA / Context Hub canónico](ORQUESTADOR_CONTEXT_HUB.md)

Estado prevalente: `ESCALON_1_STATUS=VERIFIED_CLOSED`, `ESCALON_2_STATUS=IN_PROGRESS`, `ESCALON_2A_STATUS=COMPLETED`, `ESCALON_2B_STATUS=COMPLETED`, `ESCALON_2C_STATUS=COMPLETED`, `ESCALON_2C_A_STATUS=COMPLETED`, `ESCALON_2C_B_STATUS=COMPLETED`, `ESCALON_2C_C1_STATUS=COMPLETED`, `ESCALON_2C_C2_STATUS=COMPLETED`, `ESCALON_2D_STATUS=NOT_STARTED`. MEMORIA está integrada al lifecycle físico y recibe resultados C1 revalidados con smoke C2 `36/36`; no hay agentes reales, UI de MEMORIA, QA visual ni deploy.

2C-C1 completa el handoff durable y contrato de resultado no ingerido; 2C-C2 completa la ingesta/reconciliación acotada e idempotente. 2D queda pendiente para recuperación/conflictos y cierre humano.

Los documentos `V1_*`, `release-candidate-checklist.md`, `operator-demo-flow.md`, `INVESTOR_DEMO_GUIDE.md`, `jefe-readiness-scoreboard.md` y planes de Factory/Hermes son históricos o prospectivos. No describen capacidad canónica ni reemplazan este índice.
