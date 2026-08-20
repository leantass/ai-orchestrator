# Escalón 1A — reconciliación de worktrees

> Este documento es la disposición canónica de fuentes. El estado vigente prevalente está en [ORQUESTADOR_CURRENT_STATUS.md](ORQUESTADOR_CURRENT_STATUS.md).

Fecha de incorporación: 2026-08-20. Base común: `81ba810313610e3e3f678bea5a70b29650b471c0`.

## Verdad conciliada

- Factory Core: `feature/jefe-factory-core`, 41 cambios rastreados y 358 nuevos en el baseline.
- Comercial: `feature/jefe-real-project-delivery-v1`, 8 cambios rastreados y 6 nuevos antes de los documentos de auditoría.
- No existen commits exclusivos entre ramas; la divergencia era WIP local.
- Los cinco archivos solapados son `electron/jefe-project-creation.cjs`, `electron/jefe-real-generation.cjs`, `scripts/jefe-project-creation-smoke.mjs`, `src/App.tsx` y `src/index.css`.

## Decisiones de integración

- Resolver manualmente creación, generación, `App.tsx` y el smoke compartido.
- `src/index.css` es compatible mecánicamente, pero queda pospuesto junto a la UI.
- No incorporar `.codex-temp`, `node_modules`, `dist`, outputs, capturas, logs ni fixtures generados.
- No trasladar masivamente Factory/Hermes; hacerlo por cadenas completas y con evidencia.
- El registro mínimo Factory puede incorporarse sin Hermes. El roadmap Factory queda pospuesto porque contiene estado planificado contradictorio.

## Worktree candidato

Rama: `integration/orquestador-canonical-v1`.
Ruta: `C:\Users\letas\Desktop\Proyectos\Desarrollo\orquestadoria\ai-orchestrator-canonical-integration-81ba810`.

El Escalón 1 sigue abierto hasta que los archivos solapados, persistencia, IPC y documentación se reconcilien y validen en este worktree.

## Avance de reconciliación 1C

Se resolvieron manualmente los tres archivos solapados de creación/materialización: `electron/jefe-project-creation.cjs`, `electron/jefe-real-generation.cjs` y `scripts/jefe-project-creation-smoke.mjs`. No se copió un motor completo: se conservaron la tipificación/capacidades Factory y la marca/Input Assets/direcciones estructurales Comercial bajo el contrato canónico. Permanecen sin integrar `src/App.tsx`, `src/index.css`, workspace, preview, restauración y Hermes completo.

La reconciliación 1D incorpora persistencia/IPC canónicos sin conectar UI; `src/App.tsx` e `src/index.css` siguen excluidos.

La reconciliación 1E conecta `App.tsx` e `index.css` exclusivamente al bridge canónico: el hub no incorpora fixtures ni proyectos demo, y la UI técnica heredada queda preservada detrás de `#advanced`. No se integra todavía el workspace 1F.

La reconciliación 1F completa el workspace comercial sobre las mismas autoridades canónicas: manifests por versión, persistencia existente, ledger físico por proyecto y bridge allowlisted. Se añadieron lifecycle, resolver de preview, smokes y UI comercial; no se integró Hermes masivo ni se tocaron los worktrees fuente. El preview integrado queda diferido por no ampliar `electron/main.cjs` con un protocolo dedicado; sólo se abre un recurso validado por main.

## Cierre 1G: matriz de disposición de WIP fuente

| Fuente / grupo | Cantidad / roots | Disposición | Razón y criterio futuro |
|---|---:|---|---|
| Factory registro mínimo | 1: `electron/jefe-project-registry.cjs` | INTEGRADO_CANONICO | Tipos, perfiles y capacidades bajo contrato único. |
| Factory creación/generación compartida | 3 solapados | REEMPLAZADO_POR_IMPLEMENTACION_CANONICA | Contrato, materializador y smokes canónicos sustituyen WIP; no se mantiene otra autoridad. |
| Factory roadmap | 1: `electron/jefe-roadmap-registry.cjs` | EXCLUIDO_OBSOLETO | Estado contradictorio; sólo reingresa con contrato y escalón propietario. |
| Factory/Hermes | 73 archivos con deuda; conjunto WIP restante bajo `src/factory/hermes-*` | DIFERIDO_ESCALON_3_INVESTIGACION / DIFERIDO_ESCALON_7_QA_SEGURIDAD | Radar/Hermes requiere evidencia, políticas y cierre de lint; no se integra por parecido. |
| Factory memoria/contratos | grupos `factory-memory-*`, `factory-contract-*` | DIFERIDO_ESCALON_2_MEMORIA / DIFERIDO_ESCALON_5_PLANNER | Se incorporarán con admisión y propiedad de Context Hub. |
| Factory Codex/herramientas externas | grupos executor, bridge y approvals | DIFERIDO_ESCALON_6_EXECUTOR / DIFERIDO_ESCALON_7_QA_SEGURIDAD | Sin ejecución real en el baseline; exige permisos y supervisión. |
| Comercial marca/Input Assets/direcciones | UI y assets relevantes | INTEGRADO_CANONICO | Wizard, perfiles comerciales, referencias y tres direcciones conectados a contratos físicos. |
| Comercial workspace/lifecycle | UI y módulos 1F | INTEGRADO_CANONICO | Snapshot físico, versiones, aprobación, restauración y entrega local. |
| Comercial preview visual | iframe/capturas/QA visual | DIFERIDO_ESCALON_9_PREVIEW_APROBACION | Resolver seguro existe; no hay protocolo embebido ni evidencia visual. |
| Fixtures, `.codex-temp`, `node_modules`, `dist`, logs/capturas | generado/no productivo | EXCLUIDO_GENERADO_TEMPORAL / EXCLUIDO_FIXTURE_NO_PRODUCTIVO | Nunca se incorporan como autoridad runtime. |

Conteo de disposición demostrable: 3 grupos integrados, 1 reemplazado, 1 compatibilidad segura, 6 grupos diferidos y 1 grupo temporal/fixtures excluido. Los dos worktrees fuente conservan sus WIP intactos y no son autoridades activas.
