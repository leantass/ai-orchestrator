# Índice documental

Prevalencia: [ORQUESTADOR_CURRENT_STATUS.md](ORQUESTADOR_CURRENT_STATUS.md) define el estado actual; [ORQUESTADOR_CANONICAL_ARCHITECTURE.md](ORQUESTADOR_CANONICAL_ARCHITECTURE.md) define autoridades; la auditoría y reconciliación explican evidencia e historia.

- [Estado actual](ORQUESTADOR_CURRENT_STATUS.md)
- [Ingesta canónica de resultados de agente](ORQUESTADOR_AGENT_RESULT_INGESTION.md)
- [Recuperación y conflictos de MEMORIA](ORQUESTADOR_CONTEXT_RECOVERY_AND_CONFLICTS.md)
- [Roadmap canónico](ORQUESTADOR_CANONICAL_ROADMAP.md)
- [Intake y descubrimiento supervisado](ORQUESTADOR_SUPERVISED_DISCOVERY.md)

Estado de cierre Escalón 2: `ESCALON_2_STATUS=VERIFIED_CLOSED`, `ESCALON_2D_STATUS=COMPLETED`, `RECOVERY_SMOKE=54/54_PASS`, `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`. No declara release-ready, agentes reales, autenticación humana end-to-end, UI de conflictos, QA visual, deploy ni red.
- [Arquitectura canónica](ORQUESTADOR_CANONICAL_ARCHITECTURE.md)
- [Auditoría maestra](ORQUESTADOR_MASTER_AUDIT.md)
- [Integración](ORQUESTADOR_INTEGRATION_STATUS.md)
- [Reconciliación y matriz de fuentes](ORQUESTADOR_WORKTREE_RECONCILIATION.md)
- [MEMORIA / Context Hub canónico](ORQUESTADOR_CONTEXT_HUB.md)

Estado prevalente: `ESCALON_1_STATUS=VERIFIED_CLOSED`, `ESCALON_2_STATUS=VERIFIED_CLOSED`, `ESCALON_2A_STATUS=COMPLETED`, `ESCALON_2B_STATUS=COMPLETED`, `ESCALON_2C_STATUS=COMPLETED`, `ESCALON_2D_STATUS=COMPLETED`, `RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`. MEMORIA está integrada al lifecycle físico, recibe resultados C1 revalidados y tiene recuperación/conflictos internos probados `54/54`; no hay agentes reales, autenticación humana end-to-end, UI de MEMORIA, QA visual ni deploy.

2C-C1 completa el handoff durable y contrato de resultado no ingerido; 2C-C2 completa la ingesta/reconciliación acotada e idempotente; 2D completa recuperación controlada, conflictos humanos internos y retención conservadora.

Los documentos `V1_*`, `release-candidate-checklist.md`, `operator-demo-flow.md`, `INVESTOR_DEMO_GUIDE.md`, `jefe-readiness-scoreboard.md` y planes de Factory/Hermes son históricos o prospectivos. No describen capacidad canónica ni reemplazan este índice.
