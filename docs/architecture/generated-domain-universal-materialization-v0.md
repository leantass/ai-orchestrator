# Generated Domain Universal Materialization v0

## 1. Proposito

Este documento define la siguiente fase segura para JEFE: pasar de un `materializationPlan` legacy y archetype-first hacia una materializacion universal derivada del `GeneratedDomainContract`, sin activar runtime riesgoso antes de tiempo.

En este estado del proyecto, la direccion correcta es:

- contrato universal como fuente estructural
- preview/candidate/shadow como puente
- approvals explicitas antes de cualquier write real
- fallback legacy controlado mientras exista deuda

## 2. Estado actual

Hoy ya existen estas piezas observacionales:

- `GeneratedDomainContract`
- `generatedDomainCapabilityProfile`
- `generatedDomainMaterializationShadowPlan`
- `generatedDomainShadowMaterializationCandidatePlan`
- `generatedDomainShadowCandidateLegacyComparison`
- `generatedDomainMaterializationSourceResolution`
- `generatedDomainMaterializationInspectionSourceResolution`
- `generatedDomainShadowMaterializationEndToEndReadiness`
- `generatedDomainControlledEnablePolicy`
- `generatedDomainFirstControlledEnableScenario`
- `generatedDomainFileCreationApprovalPolicy`
- `generatedDomainMaterializationApprovalPayload`
- `generatedDomainUniversalMaterializationPlanPreview`
- `generatedDomainUniversalMaterializationPlanPreviewComparison`
- `generatedDomainRuntimeShadowReadinessDecision`

Estas piezas ya permiten razonar sobre una materializacion universal futura sin reemplazar el `materializationPlan` real ni tocar `executionScope`.

## 3. Principios

- runtime normal sigue apagado para shadow
- `behaviorChanged=false` salvo autorizacion explicita
- no writes reales sin aprobacion de Lean
- no `.env`
- no `node_modules`
- no Docker
- no deploy
- no servicios externos reales
- no pagos reales
- no `web-prueba` sin aprobacion explicita
- no dominio como branch productivo nuevo

## 4. Entradas del flujo universal

La materializacion universal futura deberia leer:

- `GeneratedDomainContract`
- `generatedDomainCapabilityProfile`
- `domainConsistencyDiagnostics`
- `generatedDomainShadowMaterializationCandidatePlan`
- `generatedDomainShadowCandidateLegacyComparison`
- `generatedDomainFileCreationApprovalPolicy`
- `generatedDomainControlledEnablePolicy`

Entradas opcionales:

- `Context Hub` como memoria auxiliar no obligatoria
- `materializationPlan` legacy solo como fallback y comparacion

## 5. Etapas propuestas

### 5.1 Normalizacion del contrato

- validar schema
- validar safety
- completar defaults seguros
- normalizar `root.slug`, `sourceRoot`, `targetRoot`
- derivar `allowedTargetPaths`
- derivar `requiredPathGroups`
- derivar `forbiddenSignals`

### 5.2 Preview universal

`generatedDomainUniversalMaterializationPlanPreview` ya cumple la funcion de vista estructural no ejecutable.

Debe seguir pudiendo responder:

- que superficies existen
- que buckets existen
- que paths serian validos
- que required groups serian exigibles
- si el contrato podria convertirse en plan materializable

### 5.3 Candidate comparable

`generatedDomainShadowMaterializationCandidatePlan` es el adaptador entre shadow y forma legacy.

Debe seguir siendo:

- serializable
- inspeccionable
- no ejecutable
- sin `operations`
- sin `commands`
- sin writes

### 5.4 Comparacion fuerte

La comparacion fuerte entre preview, candidate y legacy debe seguir cubriendo:

- `root`
- `sourceRoot`
- `targetRoot`
- `allowedTargetPaths`
- `requiredPathGroups`
- `fileChecks`
- `buckets`
- `safety`

Estados aceptables:

- `aligned`
- `partial`
- `divergent`
- `blocked`
- `not-available`

### 5.5 Aprobacion explicita

Antes de cualquier materializacion real, `generatedDomainFileCreationApprovalPolicy` debe exigir:

- root visible
- archivos visibles
- exclusiones visibles
- riesgos visibles
- aprobacion explicita de Lean

Sin esa aprobacion:

- `approvalRequired=true`
- `approved=false`
- `allowedNow=false`

### 5.6 Payload de aprobacion

`generatedDomainMaterializationApprovalPayload` debe consolidar la revision manual futura sin ejecutar nada real.

Debe dejar visible:

- `root`
- `sourceRoot`
- `targetRoot`
- `pathsPreview`
- `filesPreview`
- `directoriesPreview`
- `forbiddenPaths`
- `affectedAreas`
- `blockedReasons`
- `validations`
- `risks`

Y debe seguir dejando claro:

- `approvalRequired=true`
- `approved=false` por defecto
- `allowedNow=false`
- `notExecutedDisclaimer` explicito

### 5.7 Decision final de readiness shadow

`generatedDomainRuntimeShadowReadinessDecision` debe ser la capa integradora antes de cualquier runtime enable futuro.

Debe unificar:

- `generatedDomainControlledEnablePolicy`
- `generatedDomainFileCreationApprovalPolicy`
- `generatedDomainFirstControlledEnableScenario`
- `generatedDomainShadowMaterializationCandidatePlan`
- `generatedDomainUniversalMaterializationPlanPreview`
- `generatedDomainUniversalMaterializationPlanPreviewComparison`
- `generatedDomainShadowCandidateLegacyComparison`
- `generatedDomainMaterializationSourceResolution`
- `generatedDomainShadowMaterializationEndToEndReadiness`
- `domainConsistencyDiagnostics`

Estados esperables:

- `ready-for-harness`
- `requires-Lean-approval`
- `ready-for-controlled-runtime-review`
- `not-ready`
- `blocked`

Mientras no exista aprobacion explicita:

- `runtimeEnabled=false`
- `controlledRuntimeEnable=false`
- `source real != generated-domain-shadow`
- no muta `materializationPlan`
- no muta `executionScope`

## 6. Como deberia verse el plan universal real

El `materializationPlan` universal futuro deberia construirse desde el contrato y no desde un archetype cerrado.

Campos minimos:

- `version`
- `kind`
- `strategy`
- `projectRoot`
- `allowedTargetPaths`
- `contractDefinition.requiredPathGroups`
- `surfaces`
- `frontend`
- `backend`
- `database`
- `shared`
- `docs`
- `scripts`
- `validation`
- `safety`

Campos que no deben aparecer automaticamente sin aprobacion:

- `operations` ejecutables reales
- commands
- writes efectivos
- `.env`
- `node_modules`
- Docker
- deploy
- paths fuera del root permitido

## 7. Safety gates

Ninguna ruta futura de enable deberia cruzar a runtime real si falla cualquiera de estos checks:

- contrato invalido
- `domainConsistencyDiagnostics` en mismatch/error
- candidate no inspeccionable
- comparison `divergent` o `blocked`
- approval policy no lista
- presencia de `.env`
- presencia de `node_modules`
- señales de Docker o deploy
- servicios externos reales
- pagos reales
- root fuera de alcance permitido
- intento de tocar `web-prueba`

## 8. Rollback y fallback

Mientras exista deuda legacy:

- la fuente real de runtime sigue siendo legacy/current/none
- el preview universal no gobierna runtime
- el candidate no reemplaza el `materializationPlan`
- el fallback legacy sigue vivo para inspeccion y ejecucion segura

Si una etapa universal falla:

- se conserva la observabilidad
- se bloquea la promocion
- se recomienda `observe` o `investigate`
- no se miente sobre readiness

## 9. Context Hub

`Context Hub` debe seguir siendo una ayuda, no una dependencia dura.

Reglas:

- `unavailable` no bloquea el flujo
- `available` no pisa el contrato actual
- no debe arrastrar dominio viejo
- no debe contaminar roots
- los fallos de eventos no deben romper la decision principal

## 10. Mapa de deuda legacy actual

### `electron/main.cjs`

Zonas con deuda fuerte:

- `detectSafeFirstDeliveryModuleFamily`
- `detectFullstackLocalDemoArchetype`
- `buildCanonicalFullstackLocalMaterializationContract`
- `inspectFullstackLocalMaterializationContract`
- `buildFullstackLocalMaterializationPlan`

Estado recomendado:

- migrar primero inspeccion
- luego comparacion
- despues preview/candidate
- por ultimo resolver enable y plan real

### `electron/local-deterministic-executor.cjs`

Todavia tiene ramas fuertes por:

- `ecommerce`
- `school-crm`
- `generic`
- `interactionMode`
- `runtimeMode`

La migracion futura deberia orientarse a capacidades:

- `catalog`
- `admin-panel`
- `forms`
- `scheduling`
- `inventory`
- `reporting`
- `documents`
- `tracking`
- `mock-payments`

## 11. Roadmap seguro

1. mantener preview/candidate/comparison como superficie estable
2. preferir candidate-first para inspeccion cuando sea seguro
3. seguir reforzando comparacion con fallback legacy
4. exigir approval policy antes de cualquier write
5. crear plan universal real solo en harness
6. validar con dominios inventados y prompts sensibles
7. pedir aprobacion de Lean antes de cualquier runtime enable o materializacion real

## 12. Legacy hardcoding reduction plan

El hardcoding legacy mas sensible sigue concentrado en `electron/main.cjs`.

### Zonas runtime-critical

- `detectSafeFirstDeliveryModuleFamily`
- `detectFullstackLocalDemoArchetype`
- `buildCanonicalFullstackLocalMaterializationContract`
- `inspectFullstackLocalMaterializationContract`
- `buildFullstackLocalMaterializationPlan`
- `selectedDomain`
- `selectedContractKind`

Estas zonas no deben borrarse de golpe. La migracion segura es:

1. aislarlas como fallback explicito
2. reforzar diagnosticos observacionales
3. derivar capacidades estructurales universales
4. preferir candidate/preview en inspeccion
5. dejar el runtime real intacto hasta una fase aprobada

### Zonas fixture-only o safe-to-isolate

- demo data por vertical
- fixtures de regresion por dominio
- contratos canonicos historicos usados por smokes

Estas piezas pueden seguir existiendo si quedan claramente tratadas como regresiones, no como motor conceptual del runtime nuevo.

### Relacion con capabilities

La reduccion de hardcoding no deberia preguntar primero por el rubro. Deberia preguntar por capacidades como:

- `hasPublicFrontend`
- `hasAdminPanel`
- `hasOperatorPanel`
- `hasBackend`
- `hasDatabase`
- `hasReporting`
- `hasScheduling`
- `hasInventory`
- `hasDocuments`
- `hasMockPayments`
- `hasMessaging`
- `hasAuthMock`
- `hasValidation`
- `hasSafeLocalMaterialization`

Mientras esas capacidades no tengan cobertura suficiente, el legacy sigue siendo fallback temporal.

### Relacion con candidate-first inspection

`generatedDomainMaterializationInspectionSourceResolution` ya permite preferir candidate/contract cuando:

- el candidate es inspeccionable
- la comparacion con legacy no es riesgosa
- la approval policy sigue bloqueando writes reales
- la consistencia de dominio no muestra mismatch fuerte

Eso permite migrar inspeccion antes de migrar materializacion real.

### Riesgos actuales

- `buildFullstackLocalMaterializationPlan` sigue siendo demasiado central para tocarlo de golpe
- `selectedDomain` y `selectedContractKind` siguen siendo compatibilidad observable
- `local-deterministic-executor.cjs` conserva branching por `ecommerce`, `school-crm` y `generic`
- todavia no hay approval de Lean para runtime enable ni writes reales

## 13. Local deterministic executor migration plan

### Estado actual

`electron/local-deterministic-executor.cjs` sigue siendo una capa de compatibilidad valiosa, pero todavia decide bastante comportamiento a partir de:

- `ecommerce`
- `school-crm`
- `generic`
- `interactionMode`
- `runtimeMode`
- `productType`
- `domainLabel`

Hoy no conviene reescribirlo de golpe porque sigue siendo runtime-critical para las entregas locales seguras ya validadas.

### Branches legacy mas sensibles

- `detectSafeFirstDeliveryInteractionMode`
- `buildSafeFirstDeliveryRuntimeModeConfig`
- resolucion de `productType` y `domainLabel`
- templates y variaciones `school-crm`
- ramas `ecommerce` con catalogo, checkout mock y pagos mock
- fallback `generic`

### Capacidades objetivo

La migracion correcta no es "sumar otro rubro". Es proyectar el executor hacia capacidades como:

- `catalog`
- `admin-panel`
- `public-surface`
- `forms`
- `scheduling`
- `inventory`
- `reporting`
- `documents`
- `tracking`
- `mock-payments`
- `messaging`
- `auth-mock`
- `database-local`
- `backend-api`

### Plan gradual

1. observar y clasificar ramas legacy sin tocar outputs
2. mapear `catalog`, `admin-panel`, `public-surface`, `forms`, `reporting` y `mock-payments` como capacidades observacionales
3. mantener `interactionMode` y `runtimeMode` como fallback mientras la suite domain-agnostic gane cobertura
4. dejar `database-local` y `backend-api` fuera del executor hasta una fase separada y aprobada
5. tocar el fallback `generic` solo cuando existan invariantes estructurales suficientes

### Que queda bloqueado

- reescribir `runtimeMode`
- reescribir `interactionMode`
- cambiar outputs observables del executor
- cambiar paths o builders reales
- usar el executor para backend real, database real o writes fuera de politica

### Como validar

- smokes que verifiquen el debt report y el capability migration plan
- auditoria de texto del executor para confirmar que no aparecieron ramas nuevas por dominio
- `npm run quality:ci`
- `node scripts/generated-domain-contract-smoke.mjs`
- `node scripts/ai-operator-e2e-smoke.mjs`

## 14. No objetivos de esta fase

Esta fase no habilita:

- runtime shadow real
- reemplazo del `materializationPlan` real
- materializacion efectiva de archivos
- ejecucion local automatica
- cambios de renderer
- cambios sobre `web-prueba`
- integraciones reales

## 15. Criterio de salida

La materializacion universal podra considerarse lista para revision controlada cuando:

- el preview este `built`
- el candidate sea usable
- la comparacion con legacy quede `aligned`
- la inspeccion prefiera candidate/contract de manera segura
- la approval policy quede lista para revision manual
- el runtime normal siga sin mutacion
- la suite domain-agnostic siga verde

## 16. MVP functional flow

El MVP funcional seguro que ya queda preparado en esta fase es:

`pedido`
→ `GeneratedDomainContract`
→ `generatedDomainCapabilityProfile`
→ `generatedDomainUniversalMaterializationPlanPreview`
→ `generatedDomainMaterializationApprovalPayload`
→ `generatedDomainUniversalMaterializationPlan`
→ `evaluateGeneratedDomainFileCreationApproval`
→ `materializeGeneratedDomainSandboxPlan`
→ `validation/report.json`

Notas:

- `buildBrainDecisionContract(...)` solo adjunta diagnostics y candidates
- el runtime normal no ejecuta writes
- la materializacion real queda acotada a harness/sandbox interno

## 17. Sandbox materialization flow

### Inputs

- `GeneratedDomainContract`
- `generatedDomainUniversalMaterializationPlanPreview`
- `generatedDomainShadowMaterializationCandidatePlan`
- `generatedDomainFileCreationApprovalPolicy`
- `domainConsistencyDiagnostics`
- `generatedDomainStructuralCapabilities`

### Candidate ejecutable seguro

`buildGeneratedDomainUniversalMaterializationPlan(...)` deriva:

- `projectRoot`
- `sourceRoot`
- `targetRoot`
- `allowedTargetPaths`
- `requiredPathGroups`
- `filesToCreate`
- `fileChecks`
- `validationPlan`
- `forbiddenSignals`
- `approvalRequired`
- `approved=false`
- `safety`
- `rollback`
- `report`

### Approval gate

`evaluateGeneratedDomainFileCreationApproval(...)` solo permite continuar cuando:

- `approved=true`
- `scope=sandbox-only`
- el sandbox queda dentro del repo
- no hay `.env`
- no hay `node_modules`
- no hay `Docker`
- no hay `deploy`
- no hay `web-prueba`
- no hay rutas fuera de root

### Materializacion

`materializeGeneratedDomainSandboxPlan(...)`:

- escribe solo dentro del sandbox aprobado
- no ejecuta comandos externos
- no instala dependencias
- no inicia servicios
- no toca `web-prueba`
- genera `validation/report.json`

## 18. Security rules

La politica dura de esta fase queda explicitamente bloqueando:

- `.env`
- secretos y credenciales
- `node_modules`
- `Dockerfile` y `docker-compose`
- `deploy`
- pagos reales
- servicios externos reales
- bases productivas
- paths absolutos peligrosos
- `..`
- otros proyectos
- `web-prueba`

## 19. Rollback and report

El rollback de esta fase no usa deletes destructivos generales.

La estrategia permitida es:

- remover solo el root del sandbox controlado
- no tocar otros roots del workspace
- usar `validation/report.json` como evidencia del alcance escrito

El reporte debe listar:

- archivos creados
- archivos bloqueados
- validaciones corridas
- warnings
- errors
- pista de rollback

## 20. Remaining roadmap

Todavia quedan deliberadamente fuera de este MVP base:

- runtime shadow real
- cambio de fuente real a `generated-domain-shadow`
- mutacion del `materializationPlan` real
- mutacion del `executionScope` real
- UI visual de approval
- materializacion fuera de sandbox
- deploy
- Docker
- integraciones reales
- pagos reales

## 21. Executive MVP readiness report

`generatedDomainMvpReadinessExecutiveReport` consolida el estado del MVP sin tocar runtime real.

Debe responder de forma compacta:

- si `GeneratedDomainContract` ya es valido y seguro
- si el `preview` universal ya es utilizable
- si el `generatedDomainUniversalMaterializationPlan` ya esta listo para sandbox
- si la policy de approval ya actua como gate
- si el payload de approval ya esta listo para revision
- si el sandbox sigue siendo el unico lugar permitido para writes reales
- si el runtime normal sigue apagado y sin mutaciones
- que aprobaciones, riesgos y siguientes pasos quedan pendientes

Este reporte es ejecutivo, no ejecutable:

- no cambia `strategy`
- no cambia `executionMode`
- no cambia `nextExpectedAction`
- no activa `generated-domain-shadow` como fuente real
- no escribe archivos

## 22. MVP validation breadth

El smoke de sandbox ya no depende de un solo dominio inventado.

Hoy valida el mismo pipeline seguro sobre al menos tres variantes:

- sistema comunitario local
- ecommerce mock local
- sistema de turnos/admin local

La intencion es reforzar que:

- el contrato universal gobierna por capacidades
- la materializacion segura no depende de rubros fijos
- los dominios siguen siendo fixtures/harnesses, no motor runtime

## 23. GeneratedDomainContract extraction plan

La extraccion completa de `electron/generated-domain-contract.cjs` hacia un runtime mas chico todavia no se mueve en esta fase porque sigue muy acoplada a:

- `buildBrainDecisionContract(...)`
- el harness VM de `generated-domain-contract-smoke`
- builders de preview, candidate y sandbox

Plan exacto de extraccion segura:

1. mover helpers de validacion/safety a un modulo puro compartido
2. mover normalizacion y derives de paths a un modulo puro compartido
3. mantener `buildGeneratedDomainCapabilityProfile(...)` como frontera estable entre contrato y runtime
4. recablear smokes para depender del modulo nuevo antes de reducir `main.cjs`
5. dejar `electron/generated-domain-contract.cjs` como facade fina cuando la cobertura siga verde

Hasta que ese plan no pase con smokes verdes:

- no se toca el runtime real
- no se toca renderer
- no se promueve shadow a fuente real

## 24. Post-MVP backlog and risk log

Backlog post-MVP que queda explicitamente separado de esta fase:

- UI visual de approval y resultado de materializacion
- runtime shadow real con fallback legacy controlado
- ejecucion local opcional aprobada
- integraciones reales
- Docker
- deploy
- pagos reales
- servicios externos reales
- DB productiva

Riesgos tecnicos que siguen abiertos:

- `electron/main.cjs` todavia concentra demasiada logica
- `inspectFullstackLocalMaterializationContract` sigue siendo legacy-first
- `buildFullstackLocalMaterializationPlan` sigue mezclando contrato universal y fallback legacy
- `electron/local-deterministic-executor.cjs` conserva branching fuerte por `ecommerce`, `school-crm` y `generic`

Mitigaciones ya implementadas:

- diagnostics observacionales
- approval policy estricta
- sandbox materialization
- suite domain-agnostic incremental
- readiness executive report

## 25. Inspection contract decoupling plan

Estado actual:

- `inspectFullstackLocalMaterializationContract(...)` sigue siendo legacy-first en el sentido de que conserva un fallback canonico legacy obligatorio
- hoy la ruta real de inspeccion puede reutilizar `materializationPlan.contractDefinition`, luego `generatedDomainContract` cuando alcanza, y finalmente caer al contrato canonico legacy
- el runtime normal no cambia ni promote `generated-domain-shadow` como fuente real

Paso v0.1:

- `resolveGeneratedDomainContractFirstInspectionDefinition(...)` calcula en paralelo una fuente observacional `contract-first`
- el helper puede preferir:
- `universal-plan`
- `shadow-candidate`
- `generated-domain-contract`
- `legacy`
- `blocked`
- `none`
- esta resolucion es diagnostica y de harness
- `behaviorChanged=false`
- `materializationPlanChanged=false`
- `executionScopeChanged=false`

Reporte observacional:

- `generatedDomainInspectionContractDecouplingReport` resume:
- fuente real actual de inspeccion
- disponibilidad de `universal-plan`, `shadow-candidate` y `generated-domain-contract`
- si candidate/contract ya pueden inspeccionar
- si el fallback legacy sigue siendo requerido
- `migrationStatus`
- blockers, warnings y errors

Fallback legacy que sigue intacto:

- contrato canonico legacy
- resolucion real actual de `inspectFullstackLocalMaterializationContract(...)`
- ninguna mutacion del runtime normal

Que falta antes de cambiar runtime real:

- mas cobertura sobre `inspectFullstackLocalMaterializationContract(...)`
- mas evidencia alineada entre `generatedDomainUniversalMaterializationPlan`, candidate y contrato inspeccionable
- validar mismatchs de dominio y degradaciones raras con mas fixtures
- desacoplar mas logicamente `buildFullstackLocalMaterializationPlan(...)`
- mantener fallback legacy hasta que la ruta contract-first quede verde de punta a punta

Riesgos:

- `inspectFullstackLocalMaterializationContract(...)` todavia mezcla compatibilidad historica y evidencia nueva
- un cambio agresivo podria alterar la semantica de inspeccion sin tocar materializacion
- el executor legacy sigue condicionando parte de la lectura de planes fullstack locales

Validaciones necesarias:

- smoke directo de casos `universal-plan`, `legacy`, `mismatch` y `none`
- payload E2E con `generatedDomainInspectionContractDecouplingReport`
- build + quality + planner/release/sandbox smokes
- confirmacion de que `strategy`, `executionMode`, `nextExpectedAction`, `materializationPlan` real y `executionScope` real no cambian

## 26. BuildFullstackLocalMaterializationPlan decoupling plan

Estado actual:

- `buildFullstackLocalMaterializationPlan(...)` sigue naciendo desde una mezcla de:
- `detectFullstackLocalDemoArchetype(...)`
- `resolveFullstackLocalContractProfile(...)`
- contratos canonicos y rutas legacy
- esa salida real sigue siendo la fuente efectiva del `materializationPlan` normal del runtime
- el MVP sandbox ya demuestra que el contrato universal puede materializar seguro, pero todavia no reemplaza ese plan runtime

Paso v0.1:

- `buildGeneratedDomainUniversalMaterializationPlanCandidate(...)` construye un candidato paralelo y puramente observacional
- el candidate se deriva desde:
- `GeneratedDomainContract`
- diagnostics del contrato
- capability profile
- `generatedDomainUniversalMaterializationPlanPreview`
- shadow candidate
- approval policy
- consistency diagnostics
- el candidate expone:
- `projectRoot`
- `allowedTargetPaths`
- `requiredPathGroups`
- `filesToCreate`
- `fileChecks`
- `validationPlan`
- `forbiddenSignals`
- `approvalRequired`
- `approved:false`
- `safety`
- nunca ejecuta commands ni escribe archivos reales

Comparacion nueva:

- `generatedDomainMaterializationPlanCandidateLegacyComparison` compara candidate vs `materializationPlan` legacy
- compara roots, paths, required groups, files, file checks, validation plan, forbidden signals, safety y readiness de sandbox
- su salida es observacional y usa estados:
- `not-available`
- `aligned`
- `partial`
- `divergent`
- `blocked`

Reporte de desacople:

- `generatedDomainMaterializationPlanDecouplingReport` resume:
- fuente actual del plan real
- si el plan legacy sigue presente
- si preview / universal plan / candidate existen
- si el candidate ya puede representar el plan
- si approval policy y sandbox readiness estan listos
- `migrationStatus`
- blockers, warnings y errors

Que sigue quedando en fallback legacy:

- el `materializationPlan` real del runtime normal
- la mezcla actual archetype/profile-first
- cualquier dependencia de contratos canonicos legacy

Que falta antes de mover runtime real:

- reducir mas divergencias candidate-vs-legacy
- acercar `buildFullstackLocalMaterializationPlan(...)` a `GeneratedDomainContract` sin romper cobertura
- seguir desacoplando `inspectFullstackLocalMaterializationContract(...)`
- probar mas fixtures domain-agnostic y continuidad entre corridas
- mantener `materializationPlanChanged=false` y `executionScopeChanged=false` hasta una aprobacion explicita

Relacion con el sandbox MVP:

- el candidate universal usa la misma direccion de seguridad del MVP sandbox
- sirve para demostrar compatibilidad estructural antes de cualquier promote real
- no habilita runtime normal
- no toca `web-prueba`
- no toca `.env`
- no usa Docker, deploy ni servicios externos

## 27. Runtime controlled enable v0.1

Runtime normal:

- sigue apagado por defecto
- `generatedDomainControlledRuntimeMaterializationSource` devuelve:
- `enabled=false`
- `mode=runtime-disabled`
- `selectedSource=current|legacy|none`
- `behaviorChanged=false`
- `materializationPlanChanged=false`
- `executionScopeChanged=false`
- el runtime real no promueve `generated-domain-universal` ni `generated-domain-shadow`

Harness controlled enable:

- existe solo como helper interno y seguro
- requiere opciones explicitas de harness
- no depende de `.env`
- no depende de flags globales
- no depende de UI ni de Electron visual
- solo puede seleccionar `generated-domain-universal` si:
- el universal plan ya esta built
- la approval evaluation quedo `approved-for-sandbox`
- el sandbox root queda dentro del workspace permitido
- no toca `web-prueba`
- no toca `.env`
- no toca `node_modules`
- no toca Docker ni deploy
- la consistencia de dominio sigue OK
- la comparacion candidate-vs-legacy sigue usable
- el readiness shadow ya permite harness
- el fallback legacy sigue disponible

Materializacion:

- cualquier write real sigue acotado a sandbox/harness controlado
- el helper solo selecciona fuente bajo esas condiciones
- no cambia el `materializationPlan` real del runtime normal
- no cambia el `executionScope` real
- no cambia `strategy`, `executionMode` ni `nextExpectedAction`

Blockers:

- approval faltante
- sandbox inseguro
- mismatch de dominio
- candidate/comparison insuficientes
- readiness shadow insuficiente
- cualquier intento de tocar `web-prueba`, `.env`, `node_modules`, Docker o deploy

Que falta para produccion real:

- una aprobacion Lean explicita para cualquier runtime review controlado
- mas coverage de fallback legacy ante fallos raros
- una UI/backend de aprobacion mas visible
- desacoplar mas `main.cjs`
- seguir reduciendo el peso legacy de `buildFullstackLocalMaterializationPlan(...)`

Que requiere Lean:

- cualquier enable fuera de harness
- cualquier write fuera de sandbox interno aprobado
- cualquier revision sobre `web-prueba`
- cualquier runtime review visual o manual de produccion real

## 28. Approval surface v0.1

Que muestra la surface:

- `generatedDomainMaterializationApprovalSurface`
- estado serializable para revision humana previa a cualquier materializacion
- `root`, `sourceRoot`, `targetRoot`
- preview de archivos
- conteos de archivos a crear y bloqueados
- safety flags
- validations planeadas
- blockers, warnings y errors

Como se conecta con approval policy:

- consume `generatedDomainFileCreationApprovalPolicy`
- consume `generatedDomainFileCreationApprovalEvaluation`
- consume `generatedDomainMaterializationApprovalPayload`
- refleja si la aprobacion esta:
- `ready-for-review`
- `approved-for-sandbox`
- `blocked`

Como se conecta con el universal plan:

- usa `generatedDomainUniversalMaterializationPlan` como fuente estructural
- reutiliza previews del approval payload para mostrar archivos y paths
- no ejecuta commands
- no ejecuta writes
- no promueve el runtime general

Bloqueos explicitos:

- `web-prueba`
- `.env`
- `node_modules`
- `Dockerfile` y `docker-compose`
- `deploy`
- roots inseguros o fuera del workspace permitido

Uso futuro en UI:

- la UI visual futura solo deberia consumir esta surface ya serializada
- no necesita recalcular policy ni approval en renderer
- puede mostrar:
- resumen de aprobacion
- root y sandbox target
- files preview
- blockers y riesgos
- next action sugerido

Validacion manual futura requerida:

- confirmacion visual del layout final en renderer
- decision humana real de Lean antes de cualquier approval fuera de harness
- cualquier aprobacion sobre proyectos externos o fuera del sandbox interno

## 29. UI approval surface consumption v0.1

Que muestra ahora el renderer:

- una tarjeta tecnica compacta de `Aprobacion de materializacion`
- `status`, `approvalState` y `nextAction`
- `root` objetivo
- cantidad de archivos propuestos
- cantidad de bloqueos, warnings y errors
- safety labels:
- sin `.env`
- sin `node_modules`
- sin Docker
- sin deploy
- sin servicios externos
- sin `web-prueba`
- validaciones principales derivadas del payload backend

Que NO ejecuta:

- no agrega botones de write real
- no dispara materializacion desde la UI
- no cambia el CTA principal actual
- no promueve `generated-domain-universal` como runtime general

Como se conecta con backend:

- consume `generatedDomainMaterializationApprovalSurface`
- usa `buildPlannerApprovalSurfaceViewModel(...)` para normalizar lectura en renderer
- reutiliza la signal de approval ya calculada por backend/policy
- no recalcula safety ni approval desde Electron visual

Como se mantiene seguro:

- la UI sigue mostrando un estado de solo lectura
- conserva el texto `No ejecuta todavia`
- cuando hay aprobacion de harness solo expone `approved-for-sandbox`
- cualquier `web-prueba`, `.env`, `node_modules`, Docker o deploy sigue entrando como `blocked`

Validacion manual futura pendiente:

- revisar el layout visual final en Electron renderer real
- decidir si la tarjeta vive solo en advanced mode o tambien en vistas resumidas
- definir un flujo humano real de approval antes de habilitar cualquier accion de escritura
