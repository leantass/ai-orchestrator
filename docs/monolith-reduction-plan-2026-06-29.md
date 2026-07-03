# Monolith Reduction Plan - 2026-06-29

## Objetivo

Reducir el riesgo operativo de `src/App.tsx` y `electron/main.cjs` sin romper el release candidate ni mezclar una refactorizacion grande con cambios de producto.

## Principios

- cortar por seams ya probados;
- mover primero derivacion pura y composicion, no decisiones de safety;
- validar en cada corte con el slice mas chico posible;
- no reabrir `electron/main.cjs` entero en una sola pasada.

## Plan para `src/App.tsx`

### Estado actual del runtime

`App.tsx` ya demostro una estrategia segura: extraer tarjetas y paneles puros a `src/components/` mientras deja en el archivo principal el armado de estado y callbacks.

### Siguiente corte recomendado

1. Extraer builders de view-model repetidos a un modulo nuevo, por ejemplo `src/app-view-models.ts`.
2. Mover derivaciones de continuidad a un modulo dedicado, por ejemplo `src/project-continuity-view-models.ts`.
3. Mantener dentro de `App.tsx` solo:
   - hooks de estado;
   - side effects;
   - wiring IPC;
   - seleccion del panel activo.

### Seams concretos ya maduros

- continuidad:
  - builders de `visibleOptions`
  - builders de modulos y acciones
  - resolucion de readiness y labels
- el summary superior de `ProjectContinuityCenterCard` ya deriva sus props desde `src/project-continuity-view-models.ts`, dejando en `App.tsx` solo wiring y callbacks para `ProjectContinuationSummaryCard`;
- la seleccion entre `RuntimeApprovalPanel` y `ApprovalRequestPanel`, mas sus fallbacks base de alcance/validacion/alternativa segura, ya se deriva desde `buildProjectContinuationApprovalPanelsViewModel` en `src/project-continuity-view-models.ts`;
- `ProjectContinuityCenterCard` ya delega su bloque superior a `ProjectContinuationSummaryCard`, asi que el siguiente corte real en continuidad ya no es markup repetido sino derivacion/view-model builders;
- el panel `v1` ya no carga inline dentro del chunk principal: `V1ClosureDashboard` ahora entra por `lazy()` y `Suspense`, lo que bajo el bundle principal de `501.59 kB` a `466.21 kB` minificado;
- resultado final:
  - resumen operatorio
  - detalles tecnicos
  - acciones de cierre
- flujo guiado:
  - ensamblado de cards ya extraidas
  - helpers de footer y sidebar

### No mover todavia

- effects que sincronizan planner/runtime/UI;
- dispatch de acciones a Electron;
- persistencia de sesion local;
- gating de approval en caliente.

### Validacion por corte

- `npx tsc --noEmit`
- `npm run lint`
- `node scripts/ai-operator-e2e-smoke.mjs`

## Plan para `electron/main.cjs`

### Estado actual

`main.cjs` mezcla:

- bootstrap Electron;
- IPC handlers;
- planner/runtime routing;
- generated-domain contract handling;
- materializacion canonica y fallback;
- observabilidad/debug;
- seguridad y approvals.

### Estrategia de desmontaje

No extraer por tema narrativo. Extraer por responsabilidad estable y testeable.

### Fase 1: contrato generado y stack profile

Mover a modulo propio:

- `buildStackProfile`
- `buildExplicitRequestedStackProfile`
- deteccion de stacks pedidos;
- armado de prompts/metadata del contrato generado;
- helpers que solo derivan `stackProfile` o `generatorReadiness`.

Archivo sugerido:

- `electron/main-stack-profile-helpers.cjs`

Estado de esta pasada:

- ya se ejecuto el primer corte real;
- `buildStackProfile` y `buildExplicitRequestedStackProfile` salieron de `electron/main.cjs`;
- la normalizacion/defaults de `stackProfile` y `generatorReadiness` tambien salieron a `electron/main-generated-domain-stack-readiness-helpers.cjs`;
- los harnesses de smoke que extraen superficie desde `main.cjs` ya se alinean via `scripts/main-planner-extracted-helper-dependencies.mjs` en vez de wiring manual por archivo;
- la validacion fuerte `node scripts/ai-quality.mjs --scope=changed` cerro en verde despues del corte.

### Fase 2: canonical specialized fullstack contract

Mover a modulo propio:

- resolucion de `usesCanonicalSpecializedFullstackContract`;
- builders de archivos canonicos y docs asociadas;
- derivacion de scaffold canonico soportado.

Archivo sugerido:

- `electron/main-canonical-fullstack-contracts.cjs`

Estado de esta pasada:

- ya se ejecuto un primer corte real de esta fase;
- `resolveFullstackLocalSpecializedContractFlags` y `buildFullstackLocalSpecializedPathPlan` salieron a `electron/main-fullstack-local-specialized-path-helpers.cjs`;
- `buildFullstackLocalSpecializedFrontendContentBundle` y `buildFullstackLocalSpecializedDocumentationContentBundle` salieron a `electron/main-fullstack-local-specialized-content-helpers.cjs`;
- `buildFullstackLocalSpecializedBackendContentBundle` y `buildFullstackLocalSpecializedMaterializationOperations` salieron a `electron/main-fullstack-local-specialized-operations-helpers.cjs`;
- `buildFullstackLocalMaterializationPlan` ya no repite inline la misma logica de flags y bundles de paths para `allowedTargetPaths` y `scaffoldFiles`;
- `buildFullstackLocalMaterializationPlan` ya no repite inline los blobs especializados de readmes, superficies ni docs;
- `buildFullstackLocalMaterializationPlan` ya inserta `preCoreOperations`, `coreExtensionOperations` y `postCoreOperations` desde helper en vez de mantener arrays inline de operaciones especializadas;
- el siguiente corte de la fase ya puede apuntar a validaciones o builders genéricos restantes, no a los route-contract builders canónicos ya extraídos.

### Fase 3: routing y next-action del project operations loop

Mover a modulo propio:

- derivacion de `nextExpectedAction`;
- transiciones de planner/executor;
- traduccion a payloads legibles por UI.

Estado actual:

- `buildNextActionPlan` ya salio de `electron/main.cjs` hacia `electron/main-project-operations-routing-helpers.cjs`;
- el armado conjunto de `runtimeApprovalState`, `projectReadinessState`, sync del manifest y `approvalRequestPlan` ya salio a `electron/main-project-approval-bundle-helpers.cjs`;
- el seam se alineo con el loader compartido de VM smokes via el patron `main-*-helpers.cjs`;
- `node scripts/ai-planner-smoke.mjs` quedo verde despues de la extraccion, asi que el siguiente corte de esta fase ya puede apuntar a mas routing/approval derivation adyacente y no a reabrir el wrapper inicial.

### Fase 4: registro de IPC

Cuando la logica ya este afuera, dejar en `main.cjs` solo:

- bootstrap Electron;
- creacion de ventana;
- lifecycle app;
- registro fino de `ipcMain.handle(...)` que delega a handlers externos.

Archivo sugerido:

- `electron/main-ipc-handlers.cjs`

## Orden recomendado de ejecucion

1. cortar `App.tsx` por view-model builders puros;
2. cortar `main.cjs` por stack-profile/generated-domain helpers;
3. cortar `main.cjs` por canonical specialized contract builders;
4. recien despues tocar routing del project operations loop;
5. dejar IPC bootstrap para el final.

## Riesgos a evitar

- mezclar estas refactorizaciones con nuevas features de dominio;
- mover funciones que hoy tambien escriben o emiten eventos sin tests alrededor;
- cambiar nombres de payloads visibles por UI en la misma pasada;
- tocar `electron/main.cjs` y `src/App.tsx` con la misma refactorizacion mas cambio funcional.

## Criterio de exito

El plan se considera bien ejecutado si cada pasada deja:

- menos codigo inline en el monolito;
- mismo comportamiento observable;
- smokes verdes;
- diff pequeno y explicable;
- una historia Git donde cada commit refleje una sola responsabilidad.
