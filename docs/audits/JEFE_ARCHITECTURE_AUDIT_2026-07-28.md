# Auditoria integral de JEFE / Orquestador - solo diagnostico objetivo

Fecha: 2026-07-28
Repo auditado: `C:\Users\letas\Desktop\Proyectos\Desarrollo\orquestadoria\ai-orchestrator`
Nota de alcance: la ruta workspace superior `C:\Users\letas\Desktop\Proyectos\Desarrollo\orquestadoria` no es repo Git; contiene `ai-orchestrator`, que si es repo verificable. No se inspeccionaron rutas masivas fuera del workspace.

## 1. Resumen ejecutivo directo

JEFE existe como aplicacion Electron/React con orquestacion local significativa: intake de objetivo/contexto, planner, rutas de ejecucion `fast-local` y `executor`, aprobaciones/rechazo seguro, persistencia de runs, registry de tipos de proyecto, generacion local mock, continuacion de proyectos, Input Assets V1, bridge preload/IPC y una capa concreta de Context Hub degradable.

El estado no es todavia la arquitectura final completa. El nucleo esta parcialmente operativo, pero el worktree esta muy cargado con cambios no commiteados y no trackeados. Eso vuelve riesgoso continuar construyendo encima sin antes estabilizar el scope. La rama remota `origin/feature/viandas-corporativas-mvp` mezcla avances reutilizables de nucleo con piezas comerciales/demo y verticales historicas.

Context Hub/MEMORIA tiene integracion real en JEFE para `GET /v1/packs/suggested`, `POST /v1/events`, health, timeout de 1200 ms y degradacion no bloqueante. No se verifico el repositorio separado de Context Hub ni una instancia viva; por lo tanto su estado externo queda como no verificable desde este alcance.

Recomendacion final: `CORREGIR ANTES DE CONTINUAR`.

## 2. Estado Git inicial

- `git status --short --branch`: `## feature/jefe-factory-core...origin/feature/jefe-factory-core`
- HEAD: `b9a888a064e3a203c3b680a5adf1ed44f580cfbb`
- Rama actual: `feature/jefe-factory-core`
- Remoto: `origin https://github.com/leantass/ai-orchestrator.git`
- Ramas locales: `main` en `d8424f9`, `feature/jefe-factory-core` en `b9a888a`
- Ramas remotas relevantes: `origin/main`, `origin/feature/jefe-factory-core`, `origin/feature/viandas-corporativas-mvp`
- Worktree: contiene muchos modificados y no trackeados. Entre modificados: `electron/main.cjs`, `electron/preload.cjs`, `electron/jefe-real-generation.cjs`, `electron/jefe-run-persistence.cjs`, `src/App.tsx`, `src/components/SimpleExperienceDashboard.tsx`, `src/index.css`, multiples docs `docs/factory/*` y scripts smoke Hermes/JEFE.
- No trackeados relevantes: `electron/jefe-input-assets.cjs`, `electron/jefe-open-bridge.cjs`, `electron/jefe-project-creation.cjs`, `electron/jefe-project-registry.cjs`, `electron/jefe-roadmap-registry.cjs`, muchos gates Hermes/controlled-research-runtime en `docs/factory`, `electron/factory`, `src/factory` y `scripts`.
- Estado exacto de Input Assets and Brand Materials V1: no commiteado. Evidencia: `electron/jefe-input-assets.cjs` y `scripts/jefe-input-assets-smoke.mjs` aparecen como `??`; `electron/main.cjs` expone `jefe-input-assets:select`; `electron/preload.cjs` expone `jefeInputAssetsBridge`; `src/App.tsx` contiene UI comercial para materiales opcionales.
- Validacion permitida: `git diff --check` ejecutado sin salida y exit code 0.

## 3. Inventario real del nucleo JEFE

| Area | Estado | Evidencia | Observacion |
| --- | --- | --- | --- |
| Intake de objetivo/contexto | Implementado parcialmente | `electron/main.cjs` handler `ai-orchestrator:plan-task`; `src/App.tsx` estado `goal`, `context`, `workspacePath`; UI simple/comercial | Intake amplio pero con UI monolitica y vertical comercial visible. |
| Planner/Cerebro | Implementado parcialmente | `requestStrategicBrainDecision`, `buildResponsiveLocalStrategicBrainFallbackResult`, prompt/schema en `electron/main.cjs`; `scripts/ai-planner-smoke.mjs` | Existe planner con fallback local y timeout; no se ejecuto suite pesada. |
| Modos `fast-local`, `executor`, `ask-user/approval` | Implementado parcialmente | `electron/main.cjs` usa `executionMode`, `nextExpectedAction`, `request-approval`, `runExecutorTask`; logs `execute-task:fast-route-detected` | Funciona como rutas de decision, no como pipeline completo final. |
| Aprobaciones y rechazo seguro | Implementado parcialmente | `detectSensitiveApprovalRequirement`, `approvalRequest`, `approvalRequestPlan`, panels en `src/App.tsx`, `RuntimeApprovalPanel.tsx`, `ApprovalRequestPanel.tsx` | Hay rechazo seguro y no reapertura de approvals en codigo; requiere consolidacion/test enfocado. |
| Routing costo/calidad | Implementado parcialmente | `costMode`, `routingHints`, debug `cheap/balanced/smart/max-quality` en `electron/main.cjs` y tipos UI | Hay trazas y decision, pero no se valido end-to-end con proveedores reales. |
| Providers/fallbacks/trazabilidad | Implementado parcialmente | debug `brainAdapter`, `primaryAdapter`, `fallbackAdapter`, `routingDecision`, `fallbackUsed`; `OPENAI_API_KEY` condicional | Preparado para OpenAI/fallback local; proveedores externos no auditados en vivo. |
| Executor/materializacion local | Implementado parcialmente | `local-deterministic-executor.cjs`, `executor-bridge`, `runExecutorTask`, `generated-domain-*` | Materializa scaffolds/local mocks con prohibiciones; no equivale a construccion Codex supervisada completa. |
| Runs/persistencia/eventos/reportes | Implementado parcialmente | `electron/jefe-run-persistence.cjs`, IPC `jefe-runs:*`, `src/components/SimpleExperienceDashboard.tsx`, `scripts/jefe-run-persistence-smoke.mjs` | Persistencia local real; estado sin commit en rama actual. |
| Registry de proyectos | Implementado parcialmente | `electron/jefe-project-registry.cjs` define `PROJECT_TYPE_REGISTRY`, `CAPABILITY_MATRIX`, delivery levels | Registry local con capacidades marcadas `not_yet` para muchos escalones. |
| Reusable memory local | Implementado parcialmente | `electron/reusable-artifact-memory.cjs`, IPC `list/search/save-reusable-artifacts` | Memoria local de artefactos existe, distinta de Context Hub. |
| `FactoryProjectContract` | Implementado parcialmente | `src/factory/project-contract/factory-project-contract.types.ts`, validators/serializers, docs `FACTORY_PROJECT_CONTRACT_V1.md` | Contrato rico; persistencia/runtime tambien existen en carpetas nuevas. |
| Arquitectura de producto compleja | Implementado parcialmente | `projectBlueprint`, `implementationRoadmap`, `generatedDomainContract`, docs architecture | Planifica, pero sigue muy centrado en mock/local. |
| Generacion universal real/mock | Implementado parcialmente | `generated-domain-real-project-from-brief.mjs`, `jefe-real-generation.cjs`, `generated-domain-real-project-artifacts.cjs` | Universalizacion en progreso; hay señales verticales residuales. |
| Continuacion de proyectos existentes | Implementado parcialmente | `pick-existing-project`, `analyze-existing-project`, `project-continuity-view-models.ts`, components `ProjectContinuation*` | Existe flujo de lectura/continuacion; no se verifico runtime completo. |
| Input Assets / Brand Materials V1 | Implementado parcialmente | `electron/jefe-input-assets.cjs` valida extensiones/tamanos/copia assets, extrae colores hex manuales | No hace OCR ni analisis visual avanzado; no trackeado. |
| Electron/preload/IPC seguridad | Implementado parcialmente | `contextBridge.exposeInMainWorld`, handlers `jefe-open`, `contextHub`, `execute-task`; sanitizado en assets | Hay controles y bridges explicitos; `contextHub:open` usa `shell.openExternal`; requiere revision de whitelist/URLs antes de estabilizar. |
| Smokes/typecheck/build/CI/docs | Implementado parcialmente | `package.json` scripts `typecheck`, `quality:ci`, CI Windows, muchos scripts smoke | CI solo ejecuta `npm run quality:ci`; no hay Vitest/MSW/Playwright formal en dependencias. |

## 4. Comparacion `main` vs `feature/viandas-corporativas-mvp`

Comando usado: `git diff --stat main..origin/feature/viandas-corporativas-mvp`.

Resultado: 47 archivos cambiados, 13959 inserciones, 2240 eliminaciones.

Commits remotos de la rama: desde `5e5ea96 fix(orchestrator): stabilize fullstack fallback flow` hasta `d1470d1 feat: show persisted jefe runs in interface`.

Cambios que pertenecen al nucleo universal de JEFE:

- Extracciones del monolito y helpers de orquestacion: `electron/main-project-operations-routing-helpers.cjs`, `electron/main-stack-profile-helpers.cjs`, `electron/main-project-approval-bundle-helpers.cjs`, `electron/main-generated-domain-stack-readiness-helpers.cjs`.
- Persistencia de runs: `electron/jefe-run-persistence.cjs`, `scripts/jefe-run-persistence-smoke.mjs`, `scripts/jefe-run-history-smoke.mjs`.
- Contrato/generated-domain universal: `electron/generated-domain-contract.cjs`, `docs/architecture/generated-domain-contract-v1.md`, `scripts/generated-domain-contract-smoke.mjs`.
- Continuidad/UI de proyectos: `src/project-continuity-view-models.ts`, `src/planner-ui-state.d.ts`.
- Generacion desde brief cuando se mantiene agnostica: `scripts/generated-domain-real-project-from-brief.mjs`, `electron/generated-domain-real-project-artifacts.cjs`.

Cambios especificos de producto generado, demo, vertical o experimento:

- `electron/generated-domain-revenue-platform-artifacts.cjs`: contiene artefactos de Revenue/platform.
- `docs/INVESTOR_DEMO_GUIDE.md`: guia demo/investor, no nucleo.
- `src/components/SimpleExperienceDashboard.tsx` y `src/index.css`: gran superficie `jefe-commercial-*`, ejemplos de viandas y UX comercial.
- Commits `fix: improve generated viandas commercial UX`, `fix: polish generated viandas demo UX`, `fix: improve generated viandas role UX`, `fix: harden brief driven viandas generation`: vertical/producto historico.

Duplicaciones/riesgo entre ramas:

- La rama actual `feature/jefe-factory-core` ya contiene muchos archivos `docs/factory`, `electron/factory`, `src/factory` no presentes en `main`; `feature/viandas-corporativas-mvp` agrega otro set de avances sobre `main`. Hay riesgo alto de doble integracion manual si se intenta mezclar ambas sin seleccionar commits.
- `src/App.tsx` y `src/index.css` estan modificados tanto por trabajo de nucleo como por UI comercial; son archivos calientes.

## 5. Estado real de Context Hub / MEMORIA

Estado JEFE-side: Implementado parcialmente.

Evidencia:

- Cliente: `electron/context-hub-client.cjs`
- Endpoints: `SUGGESTED_CONTEXT_HUB_ENDPOINT = '/v1/packs/suggested'`, `CONTEXT_HUB_EVENTS_ENDPOINT = '/v1/events'`, health `/health`.
- Timeout: `CONTEXT_HUB_TIMEOUT_MS = 1200`.
- Fallback URLs: `http://127.0.0.1:3210`, `http://localhost:3210`, `http://localhost:3710`, o `CONTEXT_HUB_API_URL`.
- Degradacion segura: `fetchSuggestedContextHubPack()` devuelve `buildUnavailableContextHubPack(reason)` ante unavailable, timeout, error o no-pack; `plan-task` sigue construyendo `strategicBrainInput` con ese pack.
- Consulta antes del planner: `electron/main.cjs` handler `ai-orchestrator:plan-task` ejecuta `const contextHubPack = await fetchSuggestedContextHubPack()` antes de `requestStrategicBrainDecision(strategicBrainInput)`.
- Payload: `strategicBrainInput` incluye `contextHubPack`; `buildResponsiveLocalStrategicBrainFallbackResult` usa `contextHubPack: input.contextHubPack || buildUnavailableContextHubPack('unavailable')`.
- Eventos: `emitContextHubEvent()` usa `POST /v1/events`; `plan-task` emite evento de planning terminado y adjunta status.
- Launcher: `electron/context-hub-launcher.cjs` busca una instalacion local con `.context-hub-cli-dist/node/contextHubApiServer.js` y permite `contextHub:startLocal`, pero este audit no ejecuto arranque ni integracion externa.

Estado externo de Context Hub: No verificable. No se verifico un repo separado ni una instancia viva desde rutas documentadas en esta tarea. No se busco masivamente por todo el disco.

Clasificacion:

- `GET /v1/packs/suggested`: codigo integrado en JEFE; no validado contra servidor real.
- `POST /v1/events`: codigo integrado en JEFE; no validado contra servidor real.
- Degradacion caido/vacio/lento/error: implementada en cliente por timeout, catches y packs unavailable; no se ejecuto test externo.
- Integrado y probado: no verificable para servidor real.
- Codigo preparado pero no conectado: no aplica a JEFE-side; si esta conectado en `plan-task`.
- Documentado solamente: aplica a alcance completo de MEMORIA como sistema separado.

## 6. Tabla de brechas de arquitectura

| Componente | Estado esperado | Estado real | Evidencia | Brecha / riesgo | Proximo paso |
| --- | --- | --- | --- | --- | --- |
| Radar de mercado | futuro | Implementado parcialmente | `src/factory/radar`, `scripts/radar-v1-smoke.mjs`, docs `RADAR_V1.md` | Parece modelo/score local, no radar operativo externo. | Mantener separado y read-only; definir contrato de handoff. |
| Hermes / Scout read-only | futuro | Implementado parcialmente | Muchos gates `HERMES_*`, controlled research runtime, scripts smoke | Mucho worktree no trackeado; riesgo de sobredocumentacion vs runtime real. | Consolidar paquete minimo read-only antes de mas features. |
| JEFE core | operativo | Implementado parcialmente | `electron/main.cjs`, `src/App.tsx`, executor, approvals, persistence | Opera localmente, pero worktree inestable y monolito grande. | Estabilizar nucleo universal y separar verticales. |
| Context Hub | separado e integrado de forma degradable | Implementado parcialmente | `context-hub-client.cjs`, `context-hub-launcher.cjs`, `plan-task` | Integracion JEFE-side existe; repo/servicio separado no verificable. | Validar contrato con Context Hub real o fixture local controlada. |
| Codex / workers | constructor supervisado | Implementado parcialmente | `orchestrator-*worker*`, `executor-bridge`, docs external tools | No se ve loop Codex completo productivo; varios gates son planificados. | Definir un worker path minimo con approval y evidencia. |
| QA local | por tipo de proyecto | Implementado parcialmente | `ai-quality`, scripts smoke; CI Windows | No hay Vitest/MSW/Playwright en package deps. | Agregar ciclo QA real cuando el nucleo este limpio. |
| Seguridad / calidad | por necesidad | Preparado/documentado, no integrado | docs mencionan Gitleaks/Semgrep/Trivy/axe/Lighthouse | No hay herramientas en deps/CI. | Incorporar checks graduales por riesgo. |
| Promptfoo | flujos IA | Preparado/documentado, no integrado | docs factory architecture/quality | Sin package/script verificable. | Postergar hasta estabilizar prompts y fixtures. |
| CI | validacion repetible | Implementado parcialmente | `.github/workflows/ci.yml` ejecuta `npm ci` y `npm run quality:ci` | CI existe pero limitada a suite custom; worktree no trackeado no esta protegido. | Alinear `quality:ci` con nucleo estabilizado. |
| Staging / produccion | approval humana | No iniciado | `CAPABILITY_MATRIX` marca deploy/staging/production `not_yet` | No hay pipeline deploy. | No avanzar hasta JEFE core y QA local. |
| Analitica / aprendizaje | posterior y trazable | Implementado parcialmente | reusable memory local, Context Hub events, analytics policy en contract | Analitica/monetizacion real no implementada. | Registrar aprendizaje local primero; luego analytics externa. |

## 7. Separacion clara

Nucleo JEFE:

- `electron/main.cjs`, `electron/preload.cjs`
- `electron/context-hub-client.cjs`, `electron/context-hub-events.cjs`, `electron/context-hub-event-status.cjs`, `electron/context-hub-launcher.cjs`
- `electron/local-deterministic-executor.cjs`, `executor-bridge/*`
- `electron/jefe-run-persistence.cjs`, `electron/jefe-project-registry.cjs`, `electron/jefe-project-creation.cjs`, `electron/jefe-input-assets.cjs`
- `src/factory/project-contract*`, `src/factory/memory-*`, `src/factory/jefe-decision`, `src/factory/radar`
- Components de estado/plan/aprobacion/proyecto cuando sean agnosticos.

Producto generado / demo / vertical:

- `electron/generated-domain-revenue-platform-artifacts.cjs`
- Señales de viandas en `src/App.tsx` y quick examples comerciales.
- `docs/INVESTOR_DEMO_GUIDE.md`
- CSS `jefe-commercial-*` si se mantiene atado a una experiencia comercial especifica y no al shell universal.

Legado o incierto:

- `electron/generated-domain-legacy-diagnostics.cjs`
- `docs/monolith-reduction-plan-2026-06-29.md` como deuda historica, util para contexto pero no runtime.
- Multiples docs/gates Hermes en worktree no trackeado: pueden ser necesarios, pero aun no estan estabilizados como nucleo versionado.

## 8. Candidatos de limpieza - no ejecutados

| Ruta | Motivo | Confianza | Impacto de retirarlo | Recomendacion |
| --- | --- | --- | --- | --- |
| `electron/generated-domain-revenue-platform-artifacts.cjs` | Producto/vertical Revenue, no nucleo universal | Alta | Puede romper demos historicas Revenue | Mover fuera del core o aislar como fixture/producto generado en ciclo posterior. |
| `docs/INVESTOR_DEMO_GUIDE.md` | Material demo/investor, no arquitectura core | Alta | Pierde guion demo, no runtime | Mantener como docs de demo o archivar luego de aprobacion. |
| `src/App.tsx` bloques comerciales/viandas | Mezcla UI core con experiencia comercial | Media | Puede romper flujo simple actual | Extraer shell universal y dejar ejemplos como fixtures. |
| `src/index.css` clases `jefe-commercial-*` | CSS comercial dentro del global del core | Media | Puede afectar UI actual | Separar CSS de experiencia comercial del shell universal. |
| `electron/generated-domain-legacy-diagnostics.cjs` | Nombre indica legado | Media | Puede romper diagnosticos antiguos | Revisar referencias antes de retirar. |
| `scripts/ai-operator-e2e-smoke.mjs` fixtures veterinaria/viandas/demo | Tests mezclan validacion core con verticales | Media | Reduce cobertura historica | Separar fixtures verticales de asserts core. |
| `docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_*` | Gran cantidad de gates nuevos no trackeados | Media | Puede perder trazabilidad de investigacion | Consolidar indice/estado antes de commitear; no borrar sin mapa. |

## 9. Riesgos ordenados por severidad

1. Worktree no estabilizado con volumen alto de cambios modificados y no trackeados. Riesgo: no hay baseline confiable para seguir ciclos.
2. Mezcla de nucleo universal con verticales comerciales/viandas/revenue. Riesgo: JEFE absorbe logica de producto generado.
3. Context Hub externo no verificable. Riesgo: se asume integracion completa cuando solo esta probado el lado JEFE por codigo.
4. QA final incompleta. Riesgo: muchas rutas claims de arquitectura, pero sin Vitest/MSW/Playwright/seguridad/Promptfoo integrados en CI.
5. Monolito `src/App.tsx` y `electron/main.cjs` siguen siendo hotspots grandes. Riesgo: regresiones y dificultad de revision.
6. Bridges Electron con apertura externa/local requieren auditoria dedicada. Riesgo: URLs/rutas no suficientemente restringidas antes de uso productivo.

## 10. Recomendacion de un unico siguiente ciclo

Siguiente ciclo recomendado: estabilizacion del nucleo universal JEFE antes de cualquier feature nueva.

Alcance propuesto:

- Congelar el worktree actual y decidir que archivos pertenecen a nucleo, producto generado o investigacion.
- Llevar a commit limpio solo el subconjunto universal minimo: planner, approvals, run persistence, project registry, Input Assets V1, Context Hub degradable y contratos factory.
- Separar viandas/revenue/investor demo como fixtures o productos generados, sin logica hardcodeada en el nucleo.
- Agregar smokes enfocados y livianos para: `plan-task` con Context Hub caido, `contextHubPack` presente, Input Assets V1, run persistence y rechazo seguro.

Justificacion: sin estabilizacion, cualquier avance posterior agranda la incertidumbre y hace mas probable que la arquitectura final quede contaminada por verticales o por gates no versionados.

## 11. Recomendacion final explicita

`CORREGIR ANTES DE CONTINUAR`

Motivo: JEFE tiene nucleo operativo parcial y Context Hub JEFE-side integrado de forma degradable, pero el estado Git y la mezcla core/vertical impiden considerar saludable el siguiente ciclo de construccion funcional.

## Validacion y acciones no realizadas

- Se ejecuto `git diff --check`: sin salida, exit code 0.
- No se ejecutaron builds pesados.
- No se modifico codigo, configuracion, dependencias ni archivos de producto.
- No se borraron, movieron, renombraron ni archivaron archivos.
- No se tocaron `.env`, secretos, `web-prueba`, `node_modules`, Docker, deploys, bases reales, autenticacion, pagos ni servicios externos.
- No se hicieron commits ni push.
