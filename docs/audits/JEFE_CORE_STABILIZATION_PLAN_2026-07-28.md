# Plan de estabilizacion del nucleo JEFE y separacion de verticales

Fecha: 2026-07-28
Fuente de verdad: docs/audits/JEFE_ARCHITECTURE_AUDIT_2026-07-28.md
Repo auditado: C:\Users\letas\Desktop\Proyectos\Desarrollo\orquestadoria\ai-orchestrator
Alcance: diagnostico y plan. No se modifica codigo, no se mueve nada, no se borra nada, no se commitea.

## Resultado general

El worktree no esta listo para un commit aislado de Input Assets V1. Hay piezas claramente aislables, pero los nueve archivos reportados no forman una unidad limpia: src/App.tsx, electron/jefe-real-generation.cjs, electron/jefe-project-creation.cjs y src/index.css mezclan Input Assets con intake de 10 reportes, primera version local mock, UI comercial y ejemplos de viandas/agencia. electron/main.cjs y electron/preload.cjs tambien mezclan IPC de Input Assets con bridges de apertura y creacion de proyecto.

Estado Git operativo de este ciclo:

- Rama: `feature/jefe-factory-core`.
- git diff --shortstat: 42 archivos modificados, 4316 inserciones, 1228 eliminaciones.
- Archivos modificados trackeados: 42.
- Archivos no trackeados detectados antes de crear este plan: 361.
- Validacion permitida ejecutada al cierre: `git diff --check` sin salida.

## Clasificacion del worktree

Clasificaciones permitidas usadas: Core JEFE, Input Assets V1, Vertical/Viandas, Revenue/comercial/demo, Legacy/incertidumbre, Infraestructura/soporte.

| Ruta | Estado actual | Clasificacion | Pertenece a | Accion recomendada | Riesgo |
|---|---:|---|---|---|---|
| `docs/audits/JEFE_ARCHITECTURE_AUDIT_2026-07-28.md` | ?? | Infraestructura/soporte | auditoria/planificacion | conservar temporalmente | Bajo |
| `docs/factory/CONTROLLED_RESEARCH_RUNTIME_CONTRACTS_V1.md` | ?? | Infraestructura/soporte | validacion/documentacion | conservar temporalmente | Bajo |
| `docs/factory/CONTROLLED_RESEARCH_RUNTIME_MOCK_ADAPTER_V1.md` | ?? | Infraestructura/soporte | validacion/documentacion | conservar temporalmente | Bajo |
| `docs/factory/CONTROLLED_RESEARCH_RUNTIME_PROVIDER_DIRECT_ADAPTER_V1.md` | ?? | Infraestructura/soporte | validacion/documentacion | conservar temporalmente | Bajo |
| `docs/factory/EXTERNAL_TOOL_GOVERNANCE_V1.md` | M | Infraestructura/soporte | validacion/documentacion | conservar temporalmente | Bajo |
| `docs/factory/FACTORY_IMPLEMENTATION_STATUS_V1.md` | M | Core JEFE | contratos/memoria/orquestacion universal | integrar en commits de nucleo | Medio |
| `docs/factory/HERMES_AGENT_INTEGRATION_PLAN_V1.md` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_IMPLEMENTATION_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_IMPLEMENTATION_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_IMPLEMENTATION_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_VERIFICATION_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_VERIFICATION_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_VERIFICATION_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_COMMAND_RENDERER_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_REVIEW_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_CREATION_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_VERIFICATION_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_VERIFICATION_REVIEW_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_EXECUTION_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_REVIEW_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_OUTPUT_INGESTION_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_OUTPUT_INGESTION_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PREPARATION_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PREPARATION_REVIEW_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PROVIDER_RUNTIME_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PROVIDER_RUNTIME_EXECUTION_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PROVIDER_RUNTIME_EXECUTION_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PROVIDER_RUNTIME_EXECUTION_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PROVIDER_RUNTIME_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PROVIDER_RUNTIME_RETRY_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PROVIDER_RUNTIME_RETRY_EXECUTION_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PROVIDER_RUNTIME_RETRY_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PROVIDER_RUNTIME_RETRY_REVIEW_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PROVIDER_RUNTIME_REVIEW_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_REVIEW_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_REVIEW_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_IMPLEMENTATION_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_IMPLEMENTATION_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_IMPLEMENTATION_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_VERIFICATION_APPROVAL_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_VERIFICATION_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_VERIFICATION_PLANNING_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_RESEARCH_EXECUTION_APPROVAL_GATE_V1.md` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_GATE_V1.md` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_GATE_V1.md` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_RETRY_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_RESEARCH_RUNTIME_ADAPTER_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_WRAPPER_FAIL_CLOSED_COMMAND_BUILDER_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_WRAPPER_NO_TOOL_MODE_IMPLEMENTATION_GATE_V1.md` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_WRAPPER_NO_TOOL_MODE_VERIFICATION_APPROVAL_GATE_V1.md` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_WRAPPER_NO_TOOL_MODE_VERIFICATION_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_WRAPPER_NO_TOOL_MODE_VERIFICATION_PLANNING_GATE_V1.md` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/HERMES_WRAPPER_NO_TOOL_MODE_VERIFICATION_REVIEW_GATE_V1.md` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `docs/factory/JEFE_ASSETS_AND_DATABASE_GENERATION_ROADMAP_V1.md` | ?? | Core JEFE | contratos/memoria/orquestacion universal | integrar en commits de nucleo | Medio |
| `docs/factory/JEFE_CANONICAL_OPERATING_ARCHITECTURE_V1.md` | ?? | Core JEFE | contratos/memoria/orquestacion universal | integrar en commits de nucleo | Medio |
| `docs/factory/JEFE_CONTEXT_AND_MODEL_DECISION_POLICY_V1.md` | ?? | Core JEFE | contratos/memoria/orquestacion universal | integrar en commits de nucleo | Medio |
| `docs/factory/JEFE_DELIVERY_MATURITY_LEVELS_V1.md` | ?? | Core JEFE | contratos/memoria/orquestacion universal | integrar en commits de nucleo | Medio |
| `docs/factory/JEFE_MASTER_ROADMAP_V1.md` | ?? | Core JEFE | contratos/memoria/orquestacion universal | integrar en commits de nucleo | Medio |
| `docs/factory/JEFE_PRODUCT_BACKLOG_V1.md` | ?? | Core JEFE | contratos/memoria/orquestacion universal | integrar en commits de nucleo | Medio |
| `docs/factory/JEFE_PROJECT_MODES_V1.md` | ?? | Core JEFE | contratos/memoria/orquestacion universal | integrar en commits de nucleo | Medio |
| `docs/factory/JEFE_QUALITY_PIPELINE_V1.md` | ?? | Core JEFE | contratos/memoria/orquestacion universal | integrar en commits de nucleo | Medio |
| `electron/factory/controlled-research-runtime-contracts/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/controlled-research-runtime-mock-adapter/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/controlled-research-runtime-provider-direct-adapter/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation/hermes-controlled-research-runtime-alternate-safe-runtime-implementation.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation/hermes-controlled-research-runtime-alternate-safe-runtime-implementation.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-approval/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-approval/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-approval.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval/hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval/hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning/hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning/hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-verification/hermes-controlled-research-runtime-alternate-safe-runtime-verification.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-verification/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-verification-approval/hermes-controlled-research-runtime-alternate-safe-runtime-verification-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-verification-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-verification-planning/hermes-controlled-research-runtime-alternate-safe-runtime-verification-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-verification-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-approval/hermes-controlled-research-runtime-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-approval/hermes-controlled-research-runtime-approval.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-command-renderer/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-execution/hermes-controlled-research-runtime-execution.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-execution/hermes-controlled-research-runtime-execution.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-execution/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-execution-approval/hermes-controlled-research-runtime-execution-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-execution-approval/hermes-controlled-research-runtime-execution-approval.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-execution-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-execution-planning/hermes-controlled-research-runtime-execution-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-execution-planning/hermes-controlled-research-runtime-execution-planning.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-execution-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-execution-review/hermes-controlled-research-runtime-execution-review.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-execution-review/hermes-controlled-research-runtime-execution-review.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-execution-review/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-approval/hermes-controlled-research-runtime-live-artifact-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-approval/hermes-controlled-research-runtime-live-artifact-approval.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-creation/hermes-controlled-research-runtime-live-artifact-creation.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-creation/hermes-controlled-research-runtime-live-artifact-creation.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-creation/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-planning/hermes-controlled-research-runtime-live-artifact-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-planning/hermes-controlled-research-runtime-live-artifact-planning.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-verification/hermes-controlled-research-runtime-live-artifact-verification.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-verification/hermes-controlled-research-runtime-live-artifact-verification.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-verification/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-verification-review/hermes-controlled-research-runtime-live-artifact-verification-review.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-verification-review/hermes-controlled-research-runtime-live-artifact-verification-review.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-live-artifact-verification-review/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-mock-e2e-approval/hermes-controlled-research-runtime-mock-e2e-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-mock-e2e-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-mock-e2e-execution/hermes-controlled-research-runtime-mock-e2e-execution.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-mock-e2e-execution/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-mock-e2e-planning/hermes-controlled-research-runtime-mock-e2e-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-mock-e2e-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-mock-e2e-review/hermes-controlled-research-runtime-mock-e2e-review.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-mock-e2e-review/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-output-ingestion-approval/hermes-controlled-research-runtime-output-ingestion-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-output-ingestion-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-output-ingestion-planning/hermes-controlled-research-runtime-output-ingestion-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-output-ingestion-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-planning/hermes-controlled-research-runtime-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-planning/hermes-controlled-research-runtime-planning.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-preparation/hermes-controlled-research-runtime-preparation.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-preparation/hermes-controlled-research-runtime-preparation.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-preparation/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-preparation-review/hermes-controlled-research-runtime-preparation-review.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-preparation-review/hermes-controlled-research-runtime-preparation-review.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-preparation-review/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-approval/hermes-controlled-research-runtime-provider-runtime-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-execution/hermes-controlled-research-runtime-provider-runtime-execution.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-execution/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-execution-approval/hermes-controlled-research-runtime-provider-runtime-execution-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-execution-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-execution-planning/hermes-controlled-research-runtime-provider-runtime-execution-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-execution-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-planning/hermes-controlled-research-runtime-provider-runtime-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-retry-approval/hermes-controlled-research-runtime-provider-runtime-retry-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-retry-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-retry-execution/hermes-controlled-research-runtime-provider-runtime-retry-execution.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-retry-execution/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-retry-planning/hermes-controlled-research-runtime-provider-runtime-retry-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-retry-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-retry-review/hermes-controlled-research-runtime-provider-runtime-retry-review.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-retry-review/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-review/hermes-controlled-research-runtime-provider-runtime-review.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-provider-runtime-review/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof/hermes-controlled-research-runtime-safe-command-shape-proof.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof/hermes-controlled-research-runtime-safe-command-shape-proof.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-approval/hermes-controlled-research-runtime-safe-command-shape-proof-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-approval/hermes-controlled-research-runtime-safe-command-shape-proof-approval.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-planning/hermes-controlled-research-runtime-safe-command-shape-proof-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-planning/hermes-controlled-research-runtime-safe-command-shape-proof-planning.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry/hermes-controlled-research-runtime-safe-command-shape-proof-retry.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry/hermes-controlled-research-runtime-safe-command-shape-proof-retry.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval/hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval/hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry-planning/hermes-controlled-research-runtime-safe-command-shape-proof-retry-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry-planning/hermes-controlled-research-runtime-safe-command-shape-proof-retry-planning.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry-review/hermes-controlled-research-runtime-safe-command-shape-proof-retry-review.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry-review/hermes-controlled-research-runtime-safe-command-shape-proof-retry-review.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry-review/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-review/hermes-controlled-research-runtime-safe-command-shape-proof-review.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-review/hermes-controlled-research-runtime-safe-command-shape-proof-review.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-review/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-approval/hermes-controlled-research-runtime-safe-command-shape-resolution-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-approval/hermes-controlled-research-runtime-safe-command-shape-resolution-approval.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-approval/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-approval/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-approval.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-planning/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-planning/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-planning.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-planning/hermes-controlled-research-runtime-safe-command-shape-resolution-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-planning/hermes-controlled-research-runtime-safe-command-shape-resolution-planning.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification/hermes-controlled-research-runtime-safe-command-shape-resolution-verification.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification/hermes-controlled-research-runtime-safe-command-shape-resolution-verification.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval/hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval/hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification-planning/hermes-controlled-research-runtime-safe-command-shape-resolution-verification-planning.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification-planning/hermes-controlled-research-runtime-safe-command-shape-resolution-verification-planning.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification-planning/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-research-execution-approval/hermes-research-execution-approval.execute.cjs` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-research-execution-approval/hermes-research-execution-approval.path.cjs` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-research-execution-approval-retry/hermes-research-execution-approval-retry.execute.cjs` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-research-execution-approval-retry/hermes-research-execution-approval-retry.path.cjs` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-research-execution-approval-retry/index.cjs` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-research-runtime-adapter/hermes-research-runtime-adapter.execute.cjs` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-research-runtime-adapter/hermes-research-runtime-adapter.path.cjs` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-research-runtime-adapter-approval-retry/hermes-research-runtime-adapter-approval-retry.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-research-runtime-adapter-approval-retry/hermes-research-runtime-adapter-approval-retry.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-research-runtime-adapter-approval-retry/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-wrapper-fail-closed-command-builder/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-wrapper-no-tool-mode-verification/hermes-wrapper-no-tool-mode-verification.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-wrapper-no-tool-mode-verification/hermes-wrapper-no-tool-mode-verification.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-wrapper-no-tool-mode-verification/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-wrapper-no-tool-mode-verification-review/hermes-wrapper-no-tool-mode-verification-review.execute.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-wrapper-no-tool-mode-verification-review/hermes-wrapper-no-tool-mode-verification-review.path.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/factory/hermes-wrapper-no-tool-mode-verification-review/index.cjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `electron/jefe-input-assets.cjs` | ?? | Input Assets V1 | mixto: assets + UI/IPC/generacion; revisar por bloques | separar antes de commit si toca App/main/generacion | Alto |
| `electron/jefe-open-bridge.cjs` | ?? | Legacy/incertidumbre | sin clasificacion automatica segura | revisar manualmente | Medio |
| `electron/jefe-project-creation.cjs` | ?? | Input Assets V1 | mixto: assets + UI/IPC/generacion; revisar por bloques | separar antes de commit si toca App/main/generacion | Alto |
| `electron/jefe-project-registry.cjs` | ?? | Core JEFE | generacion/registry universal con riesgo de vertical | revisar y commitear despues de assets si agnostico | Medio |
| `electron/jefe-real-generation.cjs` | M | Input Assets V1 | mixto: assets + UI/IPC/generacion; revisar por bloques | separar antes de commit si toca App/main/generacion | Alto |
| `electron/jefe-roadmap-registry.cjs` | ?? | Core JEFE | generacion/registry universal con riesgo de vertical | revisar y commitear despues de assets si agnostico | Medio |
| `electron/jefe-run-persistence.cjs` | M | Input Assets V1 | mixto: assets + UI/IPC/generacion; revisar por bloques | separar antes de commit si toca App/main/generacion | Alto |
| `electron/main.cjs` | M | Input Assets V1 | mixto: assets + UI/IPC/generacion; revisar por bloques | separar antes de commit si toca App/main/generacion | Alto |
| `electron/preload.cjs` | M | Input Assets V1 | mixto: assets + UI/IPC/generacion; revisar por bloques | separar antes de commit si toca App/main/generacion | Alto |
| `scripts/factory-controlled-research-runtime-contracts-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-controlled-research-runtime-mock-adapter-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-controlled-research-runtime-provider-direct-adapter-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-alternate-safe-runtime-implementation-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-alternate-safe-runtime-implementation-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-alternate-safe-runtime-verification-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-alternate-safe-runtime-verification-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-alternate-safe-runtime-verification-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-command-renderer-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-execution-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-execution-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-execution-review-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-execution-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-live-artifact-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-live-artifact-creation-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-live-artifact-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-live-artifact-verification-review-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-live-artifact-verification-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-mock-e2e-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-mock-e2e-execution-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-mock-e2e-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-mock-e2e-review-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-output-ingestion-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-output-ingestion-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-preparation-review-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-preparation-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-provider-runtime-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-provider-runtime-execution-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-provider-runtime-execution-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-provider-runtime-execution-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-provider-runtime-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-provider-runtime-retry-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-provider-runtime-retry-execution-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-provider-runtime-retry-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-provider-runtime-retry-review-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-provider-runtime-review-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-proof-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-proof-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-proof-retry-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-proof-retry-review-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-proof-retry-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-proof-review-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-proof-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-resolution-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-resolution-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-resolution-verification-planning-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-controlled-research-runtime-safe-command-shape-resolution-verification-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-research-execution-approval-retry-smoke.mjs` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-research-execution-approval-smoke.mjs` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-research-runtime-adapter-approval-retry-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-research-runtime-adapter-smoke.mjs` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-wrapper-fail-closed-command-builder-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-wrapper-no-tool-mode-verification-review-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/factory-hermes-wrapper-no-tool-mode-verification-smoke.mjs` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `scripts/jefe-input-assets-smoke.mjs` | ?? | Input Assets V1 | mixto: assets + UI/IPC/generacion; revisar por bloques | separar antes de commit si toca App/main/generacion | Alto |
| `scripts/jefe-project-creation-smoke.mjs` | ?? | Core JEFE | generacion/registry universal con riesgo de vertical | revisar y commitear despues de assets si agnostico | Medio |
| `scripts/jefe-real-generation-smoke.mjs` | M | Infraestructura/soporte | validacion/documentacion | conservar temporalmente | Bajo |
| `scripts/jefe-roadmap-smoke.mjs` | ?? | Core JEFE | generacion/registry universal con riesgo de vertical | revisar y commitear despues de assets si agnostico | Medio |
| `src/App.tsx` | M | Input Assets V1 | mixto: assets + UI/IPC/generacion; revisar por bloques | separar antes de commit si toca App/main/generacion | Alto |
| `src/components/SimpleExperienceDashboard.tsx` | M | Revenue/comercial/demo | UI comercial actual | separar de shell core antes de migrar | Alto |
| `src/factory/controlled-research-runtime-contracts/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/controlled-research-runtime-mock-adapter/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/controlled-research-runtime-provider-direct-adapter/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-alternate-safe-runtime-verification/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-alternate-safe-runtime-verification-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-alternate-safe-runtime-verification-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-command-renderer/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-execution/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-execution-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-execution-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-execution-review/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-live-artifact-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-live-artifact-creation/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-live-artifact-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-live-artifact-verification/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-live-artifact-verification-review/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-mock-e2e-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-mock-e2e-execution/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-mock-e2e-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-mock-e2e-review/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-output-ingestion-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-output-ingestion-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-preparation/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-preparation-review/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-provider-runtime-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-provider-runtime-execution/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-provider-runtime-execution-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-provider-runtime-execution-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-provider-runtime-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-provider-runtime-retry-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-provider-runtime-retry-execution/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-provider-runtime-retry-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-provider-runtime-retry-review/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-provider-runtime-review/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-proof/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-proof-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-proof-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry-review/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-proof-review/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification-planning/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-execution-approval/hermes-research-execution-approval.defaults.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-execution-approval/hermes-research-execution-approval.evaluate.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-execution-approval/hermes-research-execution-approval.serialize.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-execution-approval/hermes-research-execution-approval.types.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-execution-approval/hermes-research-execution-approval.validate.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-execution-approval-retry/hermes-research-execution-approval-retry.defaults.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-execution-approval-retry/hermes-research-execution-approval-retry.evaluate.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-execution-approval-retry/hermes-research-execution-approval-retry.serialize.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-execution-approval-retry/hermes-research-execution-approval-retry.types.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-execution-approval-retry/hermes-research-execution-approval-retry.validate.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-runtime-adapter/hermes-research-runtime-adapter.defaults.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-runtime-adapter/hermes-research-runtime-adapter.evaluate.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-runtime-adapter/hermes-research-runtime-adapter.serialize.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-runtime-adapter/hermes-research-runtime-adapter.types.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-runtime-adapter/hermes-research-runtime-adapter.validate.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-runtime-adapter/index.ts` | M | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-runtime-adapter-approval-retry/hermes-research-runtime-adapter-approval-retry.defaults.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-runtime-adapter-approval-retry/hermes-research-runtime-adapter-approval-retry.evaluate.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-runtime-adapter-approval-retry/hermes-research-runtime-adapter-approval-retry.serialize.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-runtime-adapter-approval-retry/hermes-research-runtime-adapter-approval-retry.types.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-runtime-adapter-approval-retry/hermes-research-runtime-adapter-approval-retry.validate.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-research-runtime-adapter-approval-retry/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-wrapper-fail-closed-command-builder/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-wrapper-no-tool-mode-verification/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/factory/hermes-wrapper-no-tool-mode-verification-review/index.ts` | ?? | Infraestructura/soporte | Hermes/Scout/runtime/gates experimentales | conservar temporalmente; consolidar en commit posterior | Medio |
| `src/index.css` | M | Input Assets V1 | mixto: assets + UI/IPC/generacion; revisar por bloques | separar antes de commit si toca App/main/generacion | Alto |

## Lista exacta del nucleo JEFE hoy

Nucleo runtime/orquestacion:

- electron/main.cjs
- electron/preload.cjs
- electron/local-deterministic-executor.cjs
- executor-bridge/executor-bridge.cjs
- electron/jefe-run-persistence.cjs
- electron/jefe-real-generation.cjs, solo si se mantiene agnostico y sin verticales hardcodeadas
- electron/jefe-project-registry.cjs, como registry universal
- electron/jefe-project-creation.cjs, solo si se mantiene como generador universal local mock y no como demo comercial
- electron/jefe-input-assets.cjs
- electron/jefe-open-bridge.cjs, con auditoria de seguridad antes de integrarlo como core estable

Nucleo Context Hub / memoria local:

- electron/context-hub-client.cjs
- electron/context-hub-events.cjs
- electron/context-hub-event-status.cjs
- electron/context-hub-launcher.cjs
- electron/reusable-artifact-memory.cjs

Nucleo factory/contracts:

- src/factory/project-contract/**
- src/factory/project-contract-*/*
- src/factory/memory-*/*
- src/factory/jefe-decision/**
- docs/factory/FACTORY_*
- docs/factory/JEFE_*, con revision porque varios estan no trackeados

UI core candidata:

- src/components/ApprovalRequestPanel.tsx
- src/components/RuntimeApprovalPanel.tsx
- src/components/ContextHubControlPanel.tsx
- src/components/Project*, src/components/Plan*, src/components/Result*, siempre que no contengan copy o ejemplos verticales
- src/App.tsx, solo como contenedor transitorio; no debe seguir absorbiendo logica vertical

## Archivos y bloques de verticales/demos

Rutas o bloques que NO son nucleo estable hoy:

- src/App.tsx: quick example Sistema de viandas para empresas; bloque de pantalla comercial; estados commercialUiRun, commercialGenerationStarted; copy de intake comercial; callbacks de primera version dentro del shell simple.
- src/components/SimpleExperienceDashboard.tsx: UI jefe-commercial-*, historial comercial, drawer tecnico y flujo de runs comerciales. Puede contener piezas reutilizables, pero hoy pertenece a una experiencia comercial/demo.
- src/index.css: clases jefe-commercial-*, incluyendo jefe-commercial-assets, jefe-commercial-asset-list, jefe-commercial-inline-actions.
- electron/jefe-project-creation.cjs: genera una app demo local mock y contiene perfiles por tipo de proyecto; es reutilizable si se prueba como generador universal, pero no debe mezclarse en el commit Input Assets.
- electron/jefe-real-generation.cjs: intake de 10 reportes y perfiles typed intake; contiene una rama especial para reputacion/TryPost. Reutilizable con revision, pero no aislado.
- scripts/jefe-input-assets-smoke.mjs: smoke mezcla Input Assets, run persistence, generacion de intake, creacion de primera version y fixture Marca Norte.
- Cambios de origin/feature/viandas-corporativas-mvp no migrables: commits y bloques de Viandas UX, Revenue artifacts, investor demo guide y pulido comercial.

## Cambios reutilizables de eature/viandas-corporativas-mvp

Migrar al core, si se cherry-pickea por bloques y con test:

- electron/jefe-run-persistence.cjs: persistencia de dry-runs por IPC seguro.
- scripts/jefe-run-persistence-smoke.mjs y scripts/jefe-run-history-smoke.mjs: validacion liviana de persistencia.
- electron/main-project-operations-routing-helpers.cjs, electron/main-stack-profile-helpers.cjs, electron/main-project-approval-bundle-helpers.cjs: extracciones del monolito si no arrastran copy vertical.
- src/project-continuity-view-models.ts y src/planner-ui-state.d.ts: modelos de continuidad si se mantienen agnosticos.
- electron/generated-domain-contract.cjs y scripts/generated-domain-contract-smoke.mjs: contrato universal si no conserva sesgos de vertical.

No migrar al core:

- electron/generated-domain-revenue-platform-artifacts.cjs.
- docs/INVESTOR_DEMO_GUIDE.md.
- Bloques de Viandas/comercial dentro de src/App.tsx, src/components/SimpleExperienceDashboard.tsx y src/index.css.
- Commits enfocados en generated viandas commercial UX, generated viandas demo UX, generated viandas role UX.

## Viabilidad de commit Input Assets V1

Conclusion: no es seguro commitear los nueve archivos juntos ahora.

| Archivo | Estado | Evidencia de diff/dependencia | Viabilidad |
|---|---:|---|---|
| electron/jefe-input-assets.cjs | ?? | Modulo propio: valida extensiones, limites, sanitiza nombres, copia assets a run y lee manifest. | Aislable. |
| electron/jefe-run-persistence.cjs | M | Agrega copyAssetsToRun, paths inputs/input-assets.json y payload inputAssets. | Aislable si se acompana del modulo y smoke minimo. |
| electron/main.cjs | M | Agrega IPC jefe-input-assets:select, pero tambien jefe-projects:* y jefe-open:*. | No aislable sin separar hunks. |
| electron/preload.cjs | M | Expone jefeInputAssetsBridge, pero tambien jefeProjectCreationBridge y jefeOpenBridge. | No aislable sin separar hunks. |
| scripts/jefe-input-assets-smoke.mjs | ?? | Prueba assets, pero tambien generacion de intake y createFirstVersionFromRun. | No aislable; requiere smoke minimo nuevo o recorte. |
| src/App.tsx | M | Estados/UI de assets, pero tambien primera version, commercial run, intake reports y ejemplos de viandas. | No aislable sin extraer componentes/hunks. |
| src/index.css | M | CSS assets bajo jefe-commercial-*; vive dentro de CSS comercial global. | No aislable como core puro. |
| electron/jefe-real-generation.cjs | M | Lee input assets, pero tambien reemplaza flujo por 10 reportes, typed profiles y generacion intake. | No incluir en commit aislado de Input Assets. |
| electron/jefe-project-creation.cjs | ?? | Consume manifest de assets, pero crea primera version demo completa. | No incluir en commit aislado de Input Assets. |

Dependencia minima demostrable para un commit aislado futuro de Input Assets:

- Incluir electron/jefe-input-assets.cjs.
- Incluir solo los hunks de electron/jefe-run-persistence.cjs que aceptan inputAssets, copian assets y registran manifest.
- Incluir solo el IPC jefe-input-assets:select de electron/main.cjs.
- Incluir solo jefeInputAssetsBridge de electron/preload.cjs.
- Crear o recortar un smoke que pruebe unicamente sanitizacion, validacion, copia a run y manifest, sin generacion de intake ni primera version.
- Posponer UI de src/App.tsx/src/index.css o extraerla a un componente InputAssetsPanel con estilos no comerciales.

## Frontera core vs verticales

Regla concreta para electron/main.cjs:

- main.cjs solo debe registrar handlers IPC y delegar a modulos core.
- Cualquier flujo de producto generado va a electron/jefe-project-* o electron/generated-domain-*.
- Cualquier integracion externa o apertura de apps/rutas queda en modulos bridge auditables con whitelist y tests.
- No se agregan perfiles de negocio, copy comercial ni verticales en main.cjs.

Regla concreta para src/App.tsx:

- App.tsx solo compone providers, estado global y rutas de alto nivel.
- Intake, assets, historial de runs, detalle de run, creacion de primera version y dashboards comerciales deben vivir en componentes separados.
- Ejemplos como Viandas, Revenue, agencia o Marca Norte deben vivir en fixtures o presets externos, nunca hardcodeados en el shell universal.
- CSS de core debe usar nombres neutrales (jefe-input-assets-*, jefe-run-*, jefe-shell-*); jefe-commercial-* queda como demo/vertical.

## Plan de commits propuesto

### Commit A - Input Assets V1 minimo, solo si se separa antes

Archivos propuestos:

- electron/jefe-input-assets.cjs
- Hunks especificos de electron/jefe-run-persistence.cjs
- Hunk unico jefe-input-assets:select de electron/main.cjs
- Hunk unico jefeInputAssetsBridge de electron/preload.cjs
- Smoke minimo nuevo o recortado, sin primera version: scripts/jefe-input-assets-smoke.mjs

Proposito: admitir archivos de marca/entrada, validarlos, copiarlos a .codex-temp y registrar manifest local sin OCR ni integraciones.

Dependencias: jefe-run-persistence y Electron dialog. No debe depender de jefe-real-generation ni jefe-project-creation.

Validaciones: 
ode scripts/jefe-input-assets-smoke.mjs solo si queda recortado; git diff --check; luego 
pm run typecheck en un ciclo posterior si se permite.

Rollback: revertir esos hunks y borrar solo el commit completo, nunca limpiar archivos manualmente.

Estado actual: no listo.

### Commit B - Run persistence y generacion/intake agnostica

Archivos candidatos:

- electron/jefe-run-persistence.cjs, si no entro completo en A
- electron/jefe-real-generation.cjs, tras remover o aislar perfiles especiales
- scripts/jefe-real-generation-smoke.mjs
- docs/factory/FACTORY_IMPLEMENTATION_STATUS_V1.md, si documenta estado real y no roadmap especulativo

Proposito: estabilizar dry-runs, 10 reportes/intake y estado final sin UI comercial.

Dependencias: Input Assets A si se quieren incluir assets en reportes; si no, debe degradar sin assets.

Validaciones: smoke de run persistence, smoke de generacion local, git diff --check.

Rollback: revertir commit B completo; no tocar artefactos .codex-temp salvo en limpieza separada.

### Commit C - Project registry y primera version local mock universal

Archivos candidatos:

- electron/jefe-project-registry.cjs
- electron/jefe-project-creation.cjs
- scripts/jefe-project-creation-smoke.mjs
- Docs JEFE_PROJECT_MODES, JEFE_DELIVERY_MATURITY_LEVELS, JEFE_QUALITY_PIPELINE, solo si reflejan lo implementado

Proposito: crear una primera version local mock en carpeta separada, sin dependencias ni servicios reales.

Dependencias: Commit B para leer reportes/intake; Commit A si copia assets al proyecto.

Validaciones: smoke de project creation con target dentro .codex-temp; git diff --check.

Rollback: revertir commit C completo.

### Commit D - UI core separada de demo comercial

Archivos candidatos:

- src/App.tsx, solo despues de extraer componentes
- src/components/InputAssetsPanel.tsx o equivalente nuevo
- src/components/RunHistoryPanel.tsx o equivalente nuevo
- src/index.css, solo clases neutrales core

Proposito: que la UI universal no contenga copy ni ejemplos verticales.

Dependencias: A, B y C ya estabilizados.

Validaciones: typecheck/build cuando el ciclo permita validacion pesada; por ahora git diff --check.

Rollback: revertir commit D completo.

### Commit E - Hermes/Scout/runtime gates

Archivos candidatos:

- Familias docs/factory/HERMES_*, electron/factory/hermes-*, src/factory/hermes-*, scripts/factory-hermes-*.

Proposito: consolidar solo un paquete minimo coherente de Hermes/Scout read-only o controlled runtime.

Dependencias: frontera core clara; no mezclar con Input Assets ni UI.

Validaciones: smokes Hermes especificos, git diff --check.

Rollback: revertir commit E completo.

### Commit F - Verticales, demos y Revenue

Archivos candidatos:

- Fixtures/presets de Viandas, Revenue, investor demo o experiencia comercial.

Proposito: conservar valor historico sin contaminar core.

Dependencias: crear carpeta o convencion examples/, ixtures/ o generated-products/ en un ciclo aprobado. No mover ahora.

Validaciones: solo despues de decidir destino.

Rollback: revertir commit F completo.

## Decisiones sobre archivos inciertos

- docs/audits/JEFE_ARCHITECTURE_AUDIT_2026-07-28.md: conservar temporalmente; es fuente de este ciclo.
- Familias HERMES_CONTROLLED_RESEARCH_RUNTIME_*: conservar temporalmente; revisar manualmente y consolidar por paquete, no por goteo.
- electron/factory/hermes-controlled-* y src/factory/hermes-controlled-*: revisar manualmente; parecen scaffolds/gates repetitivos y no deben entrar al core antes de tener indice y smoke unico.
- electron/jefe-open-bridge.cjs: revisar manualmente por seguridad; no descartar, pero no mezclar con Input Assets.
- electron/jefe-roadmap-registry.cjs: conservar temporalmente; documentacion/roadmap runtime requiere decision humana.
- src/components/SimpleExperienceDashboard.tsx: conservar temporalmente; extraer piezas reutilizables, dejar UI comercial fuera del core.
- src/index.css: conservar temporalmente; separar clases core vs comercial antes de commitear.
- src/App.tsx: conservar temporalmente; requiere extraccion antes de estabilizar.

## Criterios objetivos de worktree estabilizado

El worktree se puede declarar estabilizado cuando:

1. git status --short muestra solo archivos de un commit candidato o queda limpio.
2. Cada commit candidato tiene una lista de archivos sin mezclar core, verticales y experimentos.
3. src/App.tsx no recibe nueva logica vertical; cualquier vertical queda en fixtures/presets.
4. electron/main.cjs solo agrega handlers del commit activo y delega a modulos especificos.
5. Input Assets puede validarse sin jefe-real-generation ni jefe-project-creation.
6. Hermes/Scout queda en commit separado y no bloquea JEFE core.
7. git diff --check pasa limpio.
8. No hay .env, secretos, deploy, Docker, bases reales, pagos ni servicios externos tocados.

## Recomendacion final

REQUIERE SEPARACION PREVIA

Motivo: hay un nucleo valioso listo para aislar, pero los cambios actuales estan mezclados. En especial, Input Assets V1 no debe commitearse junto con primera version local, open bridge, UI comercial ni perfiles de generacion.

## Validacion y acciones no realizadas

- Solo se hizo inspeccion y se crea este documento.
- No se ejecutaron builds pesados.
- No se tocaron .env, secretos, Docker, deploy, bases, 
ode_modules ni servicios externos.
- No se movieron, borraron ni renombraron archivos.
- No se hicieron commits ni push.

