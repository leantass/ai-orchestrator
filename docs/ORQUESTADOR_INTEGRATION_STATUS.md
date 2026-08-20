# Estado de integración canónica del Orquestador

Fecha: 2026-08-20
Rama candidata: `integration/orquestador-canonical-v1`
Worktree: `C:\Users\letas\Desktop\Proyectos\Desarrollo\orquestadoria\ai-orchestrator-canonical-integration-81ba810`
Base: `81ba810313610e3e3f678bea5a70b29650b471c0`

## Escalón 1

Estado: **en integración; no cerrado**.

| Bloque | Estado | Fuente | Archivos |
|---|---|---|---|
| Baseline verificable | Integrado | Ambos worktrees | `ORQUESTADOR_SOURCE_BASELINE_MANIFEST.md` |
| Auditoría y reconciliación | Integrado como documentación vigente | Comercial | `ORQUESTADOR_MASTER_AUDIT.md`, `ORQUESTADOR_WORKTREE_RECONCILIATION.md` |
| Contrato único de identidad | Integrado | Nuevo canónico | `electron/jefe-project-contract.cjs` |
| Registro mínimo de proyecto/capacidades | Integrado y adaptado | Factory | `electron/jefe-project-registry.cjs` |
| Smoke de contrato | Integrado | Nuevo canónico | `scripts/jefe-project-contract-smoke.mjs` |
| Roadmap Factory | Pospuesto | Factory | `electron/jefe-roadmap-registry.cjs`; contiene estados planificados contradictorios. |
| UI, generación, materialización, IPC, preview | Pospuesto | Ambos | Cinco archivos compartidos y módulos Comerciales. |
| Hermes/Factory masivo | Pospuesto | Factory | Más de 300 archivos; requiere subcadenas completas. |

## Contrato de identidad

El contrato no depende de React, Electron renderer, `localStorage`, red ni ejecución de archivos. Normaliza y valida: `projectId`, `runId`, versiones con `versionId`, tipo, plataforma, perfil, dirección visual, marca, Input Assets, manifest, paths dentro de roots explícitos, timestamps, origen de cambio y entrega.

Reglas vigentes:

- `projectId`, `runId` y `versionId` son espacios de identidad distintos; no pueden colisionar.
- Un proyecto puede no tener versiones ni entrega.
- Una versión posee su propio `runId` y no se inventa desde el nombre del proyecto.
- `commercial_site` exige plataforma `web`; dirección visual puede permanecer nula hasta una decisión explícita.
- Una entrega `delivered_local` exige ruta dentro de scope y timestamp; `not_ready` no puede presentarse como entregada.
- Paths físicos requieren `allowedRoots` explícitos; traversal y rutas externas se rechazan.

## Validaciones y commits

| Validación | Resultado |
|---|---|
| `node --check electron/jefe-project-registry.cjs` | PASS |
| `node --check electron/jefe-project-contract.cjs` | PASS |
| `node --check scripts/jefe-project-contract-smoke.mjs` | PASS |
| `node scripts/jefe-project-contract-smoke.mjs` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS tras la instalación reproducible registrada en la actualización de este documento. |

El bloqueo inicial de build quedó resuelto con la estrategia de dependencias reproducibles registrada más abajo. No se avanzó a UI, generación, IPC, Hermes ni otros bloques.

- Commit local: no realizado.
- Push: prohibido/no realizado.

## Actualización: desbloqueo reproducible (2026-08-20)

Estado actual: **`FOUNDATION_VALIDATED_WITH_INHERITED_LINT_DEBT`**.

La instalación se realizó únicamente en este worktree. `npm ci --offline --no-audit --no-fund` falló exclusivamente con `ENOTCACHED` para `zustand@5.0.12`; se aplicó el fallback autorizado `npm ci --prefer-offline --no-audit --no-fund`, que completó con 527 paquetes. No se ejecutó `npm install`, no se modificaron `package.json` ni `package-lock.json`, y no se copiaron dependencias entre worktrees.

| Validación adicional | Resultado |
|---|---|
| `npx eslint electron/jefe-project-registry.cjs electron/jefe-project-contract.cjs scripts/jefe-project-contract-smoke.mjs` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS (`vite v8.0.8`, 1774 módulos transformados) |
| `npm run lint` | FAIL heredado: 306 errores, 0 warnings, en 73 archivos bajo `src/factory/hermes-*`; 304 de `@typescript-eslint/no-explicit-any` y 2 de `@typescript-eslint/no-empty-object-type`. Ningún archivo fundacional aparece en el resultado. |
| `git diff --check` posterior | PASS |

Los SHA-256 de `package.json` y `package-lock.json` permanecieron idénticos antes y después de la instalación. `node_modules` y `dist` están ignorados por `.gitignore`. La deuda de lint se clasifica como heredada del baseline: no hay diff en `src/factory/**`, archivos Hermes, `eslint.config.js`, `package.json` ni `package-lock.json`; el lint focalizado de los tres archivos fundacionales pasa. Los documentos Markdown no requieren lint de código.

El quality gate global continúa abierto y su cierre corresponde al escalón futuro de QA / Factory-Hermes. Esta integración no ocultó, excluyó ni corrigió artificialmente la deuda: no añadió `eslint-disable`, excepciones, exclusiones, cambios de reglas, scripts, configuración ni dependencias. Por esa clasificación explícita, el bloque fundacional puede recibir su commit local sin declarar PASS global.

## Escalón 1C: creación y materialización canónica

Estado: **en integración; Escalón 1 todavía no cerrado**. La única entrada pública de creación es `createFirstVersionFromRun(...)` en `electron/jefe-project-creation.cjs`. Acepta una solicitud canónica y conserva, sólo como adaptador transitorio, la firma histórica con `runId`; ambos caminos se normalizan inmediatamente mediante `jefe-project-contract.cjs`.

Perfiles soportados:

- `factory_typed`: tipo y plataforma del registro, matriz de capacidades y artefactos mock locales honestos; no declara backend, pagos, autenticación, despliegue ni producto comercial completo.
- `commercial_site`: sólo plataforma `web`, nombre/tipo de negocio, audiencia, propuesta, marca, Input Assets y referencias URL sin analizarlas ni ejecutarlas. Cuando existe un logo local aportado, se preserva también como logo/favicon local. Requiere dirección `editorial`, `comercial` o `expresiva`.

`jefe-real-generation.cjs` es ahora el materializador local interno. Escribe primero en `.jefe-staging` dentro del root permitido, valida rutas/IDs/nombres de Input Assets, genera `manifest.json` con contrato reabrible y rutas relativas de artefactos, y sólo renombra la versión al completar. Las colisiones de `projectId`/`versionId` se rechazan estructuradamente; no hay sobrescritura silenciosa ni mezcla de versiones. Un fallo parcial limpia el staging y no presenta una versión válida.

El smoke `scripts/jefe-project-creation-smoke.mjs` usa únicamente un directorio temporal y cubre Factory, Comercial, identidad, manifest/reapertura, compatibilidad de perfil/tipo/plataforma, traversal, roots externos, colisiones, fallo parcial, Input Assets/URL como referencia, las tres direcciones y su diferenciación estructural por DOM. No valida belleza visual ni crea un proyecto comercial real.

Fuentes sintetizadas manualmente: Factory aportó registro/capacidades, mock y documentación local; Comercial aportó marca, Input Assets y composición estructural por dirección. Siguen fuera de este escalón los flujos heredados `startGenerationFromRun`, UI, `electron/main.cjs`, preload, IPC, workspace, preview, restauración y Hermes masivo.
