# Escalón 1A — reconciliación de worktrees

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

Se resolvieron manualmente los tres archivos solapados de creación/materialización: `electron/jefe-project-creation.cjs`, `electron/jefe-real-generation.cjs` y `scripts/jefe-project-creation-smoke.mjs`. No se copió un motor completo: se conservaron la tipificación/capacidades Factory y la marca/Input Assets/direcciones estructurales Comercial bajo el contrato canónico. Permanecen sin integrar `src/App.tsx`, `src/index.css`, `electron/main.cjs`, preload, IPC, workspace, preview y Hermes completo.
