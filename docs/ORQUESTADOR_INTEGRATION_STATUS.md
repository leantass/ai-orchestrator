# Estado de integración canónica del Orquestador

> Historial de integración. Para estado prevalente consultar [ORQUESTADOR_CURRENT_STATUS.md](ORQUESTADOR_CURRENT_STATUS.md).

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

## Escalón 1D: persistencia e IPC seguro

La fuente de verdad pasa a ser el manifest físico por versión dentro de un root autorizado; `.jefe-project-index.json` es atómico, determinista y reconstruible desde manifests válidos. `jefeProjectBridge` expone sólo crear/listar/consultar/snapshot/open/copy/capacidades/Input Assets mediante canales semánticos, sin paths, shell, filesystem ni canales libres. Abrir/copiar resuelve identidad en main y los smokes usan shell/clipboard inyectados. UI sigue sin conectar; el lint global Hermes continúa abierto.

## Escalón 1E: estado parcial por límite de turno

`STATUS=PARTIAL_BY_TURN_TIME_LIMIT`. Checkpoints 1 a 4 están en curso: se añadieron `src/commercial/hubModel.ts` y `src/commercial/CommercialApp.tsx`, se conectó la portada comercial por defecto desde `App.tsx` y se agregaron reglas responsive/accesibles focales en `src/index.css`. El hub usa exclusivamente `jefeProjectBridge`, no crea fixtures y conserva `/advanced` como ruta explícita para el código técnico existente. `npm run typecheck` pasó. Falta completar el smoke hub/wizard, documentación 1E completa, ESLint focalizado, build, auditoría Git y commit `feat: connect commercial project hub and guided intake`.

Actualización de cierre: smoke del hub/wizard y regresiones canónicas PASS; ESLint focalizado, typecheck y build PASS. El modo técnico usa ahora `#advanced` (no `/advanced`) para funcionar también bajo `file://`. El hub mantiene borradores sólo en `localStorage`, usa snapshots físicos para proyectos y deja 1F —workspace, comparación, restauración y entrega avanzada— pendiente. Responsive y accesibilidad fueron revisados por reglas/código, sin afirmar validación visual.

## Escalón 1F: workspace comercial y ciclo completo de versiones

El ciclo canónico crea versiones locales desde un pedido de cambio con IDs generados dentro del servicio, lock por proyecto y materialización atómica. Conserva versiones previas, marca, Input Assets y referencias; la dirección sólo cambia de forma explícita. El ledger `jefe-project-events/v1` registra creación, cambios, aprobaciones, restauraciones y entregas con secuencia determinista y escritura atómica.

La aprobación es local, explícita y distinta de la validación técnica o visual. La comparación A/B usa manifests y hashes de artefactos declarados, sin contenido, diff visual ni evaluación estética. Restaurar crea una versión nueva por staging/rename. La entrega exige aprobación y genera un snapshot inmutable con manifest; no hay deploy, publicación ni red.

El bridge añade acciones allowlisted de versiones, historial, comparación, restauración, entrega y preview. El resolver acepta sólo proyecto/versión/recurso declarados y MIME permitidos. No se registró un protocolo Electron nuevo: la UI ofrece “Abrir preview validado” y no simula iframe ni usa `file://` arbitrario. El workspace persiste sólo preferencias locales de proyecto/área y presenta Resumen, Construcción y supervisión, Materiales y contexto, y Versiones y entrega desde el snapshot físico. Responsive y accesibilidad fueron implementados por código, sin declarar validación visual real.

## Escalón 1G: cierre de baseline

Se cerró la reconciliación documental y de autoridades del Escalón 1. La corrección mínima de esta ronda restauró el wizard comercial de cinco pasos, Input Assets y borrador local después de detectar que el workspace 1F había reducido ese flujo. La secuencia de commits canónicos es revisable y el cierre no afirma release-ready ni cierra los escalones 2–12.

## Escalón 1H: verificación de frontera heredada

`ESCALON_1_STATUS=VERIFIED_CLOSED`. `createFirstVersionFromRun(...)` y `materializeProject(...)` siguen siendo la única vía real de creación/materialización. `scripts/jefe-real-generation-smoke.mjs` ya no pretende ejecutar un runner histórico: verifica que el alias heredado responde `not_available`, no crea proyecto, versión, entrega, preview ni deploy, y no abre una segunda autoridad. Los escalones 2–12 permanecen abiertos; JEFE no está terminado ni release-ready y la deuda Hermes continúa en 306 errores, 0 warnings y 73 archivos heredados.
