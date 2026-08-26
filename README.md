# JEFE / Orquestador

Estado canónico actual: `ESCALON_6_STATUS=VERIFIED_CLOSED`; `ESCALON_7_STATUS=IMPLEMENTED_PENDING_HUMAN_GATE`; `ESCALON_8_STATUS=NOT_STARTED`. El contrato e implementación local del Escalón 7 están en [ORQUESTADOR_ESCALON_7_PREVIEW_APPROVAL.md](docs/ORQUESTADOR_ESCALON_7_PREVIEW_APPROVAL.md); existe evidencia visual parcial del renderer web, pero falta autenticación humana real y evidencia runtime del Bridge/workspace físico.

JEFE es una aplicación local para crear y administrar versiones físicas de proyectos con controles explícitos de revisión y entrega local. No es release-ready: no demuestra Context Hub/MEMORIA conectado, investigación remota, Codex/executor real, QA visual, deploy ni entrega remota.

Fuente de verdad canónica: worktree `C:\Users\letas\Desktop\Proyectos\Desarrollo\orquestadoria\ai-orchestrator-canonical-integration-81ba810`, rama `integration/orquestador-canonical-v1`. El estado vigente está en [docs/ORQUESTADOR_CURRENT_STATUS.md](docs/ORQUESTADOR_CURRENT_STATUS.md).

## Inicio local

Requiere Node.js y las dependencias ya materializadas para este worktree.

```bash
npm run typecheck
npm run build
```

El recorrido comercial predeterminado permite crear proyectos locales, revisar versiones, solicitar cambios, comparar manifests/hashes, aprobar explícitamente y preparar una entrega local. No afirma generación por Codex real ni preview visual embebido: el preview disponible abre únicamente un recurso local validado.

## Documentación canónica

- [Estado actual](docs/ORQUESTADOR_CURRENT_STATUS.md)
- [Arquitectura canónica](docs/ORQUESTADOR_CANONICAL_ARCHITECTURE.md)
- [Auditoría maestra](docs/ORQUESTADOR_MASTER_AUDIT.md)
- [Historial de integración](docs/ORQUESTADOR_INTEGRATION_STATUS.md)
- [Recuperación y conflictos de MEMORIA](docs/ORQUESTADOR_CONTEXT_RECOVERY_AND_CONFLICTS.md)
- [Reconciliación de worktrees](docs/ORQUESTADOR_WORKTREE_RECONCILIATION.md)
- [Roadmap canónico](docs/ORQUESTADOR_CANONICAL_ROADMAP.md)
- [Especificación Escalón 6 QA/Security](docs/ORQUESTADOR_ESCALON_6_QA_SECURITY.md)
- [Intake y descubrimiento supervisado](docs/ORQUESTADOR_SUPERVISED_DISCOVERY.md)
- [Índice documental](docs/README.md)

Los documentos `V1_*`, guías de demo y checklist de release son históricos; no prevalecen sobre el estado actual.
Registro histórico previo a la implementación local de 7: `ESCALON_6_STATUS=VERIFIED_CLOSED`; `ESCALON_7_STATUS=NOT_STARTED`. El estado vigente de 7 es `IMPLEMENTED_PENDING_HUMAN_GATE`, con gate humano y evidencia visual runtime pendientes.
