# Fase dedicada de deuda histórica de calidad

## Estado vigente — 2026-10-01

`QUALITY_DEBT_PHASE=IN_PROGRESS`
`13C_STATUS=CLOSED_PASS`
`13C_STABILITY=PASS`
`13C_FIX_SCOPE=TEST_ONLY`
`13D_STARTED=false`
`PRODUCTION_READY=false`
`DEPLOY=NOT_CONNECTED`
`EXTERNAL_CAPABILITIES=NOT_CONNECTED`

Esta fase es el siguiente bloque activo de JEFE y está dedicada exclusivamente a medir, clasificar y reducir de forma controlada la deuda histórica de ESLint concentrada en `src/factory/*`. No es 13D, no amplía capacidades y no cambia la configuración de ESLint.

## Baseline reproducible del bloque inicial

Ejecutado sobre la rama `feature/continue-orchestrator`, HEAD `574c457b10ac833133177c8d5057dca39cf88600`, con worktree limpio:

- `npm run lint`: 311 errores, 0 warnings, exit code 1.
- 306 errores dentro de `src/factory/**` y 5 fuera; suma total 311.
- Reglas: `@typescript-eslint/no-explicit-any` 308; `@typescript-eslint/no-empty-object-type` 2; `@typescript-eslint/ban-ts-comment` 1.
- Fuera de `src/factory/*`: `src/commercial/OperationalView.tsx`, 5 incidencias `no-explicit-any`.
- Evidencia completa y agregados: `C:\Users\PC\Desktop\JEFE-QUALITY-DEBT\baseline\`.

La separación reconciliada es 306 + 5 = 311; el inventario machine-readable está en `C:\Users\PC\Desktop\JEFE-QUALITY-DEBT\lint-inventory.json`.

13C presentó una expectativa no determinista de loading. Se estabilizó exclusivamente el test mediante una fase de respuestas pendientes controlada por promesas: se espera el inicio de la request, se verifica el loading humanizado, se libera la respuesta y luego se verifica el estado final. No se modificó producción. La suite completa pasó 20/20 y el test aislado de loading pasó 19/20 en la primera tanda más 10/10 en la repetición posterior; la única anomalía fue un crash de infraestructura sin assertion (`-1073740791`).

## Clasificación

### Mecánico / bajo riesgo

Baseline actual: 0 incidencias inequívocamente mecánicas. No hay incidencias de imports o variables no usados. Sustituir `any` por `unknown`, tipos concretos o genéricos no se considera mecánico sin revisar contratos y consumidores.

### Requiere análisis

306 incidencias dentro de `src/factory/**`: 304 `no-explicit-any` y 2 `no-empty-object-type`, más 5 incidencias externas de `OperationalView.tsx` (4 `no-explicit-any`, 1 `ban-ts-comment`) fuera del alcance de esta fase. Requieren análisis de tipos, closures, async/control flow, contratos y consumidores antes de cada corrección.

### Posible deuda funcional

La presencia de `any`, `@ts-ignore` o interfaces vacías no prueba por sí misma un stub, pero cada caso que oculte un contrato incompleto, camino no implementado o inconsistencia debe separarse y no “arreglarse” sólo para satisfacer lint. El baseline inicial no declara incidencias funcionales sin análisis de código.

## Lotes propuestos

| Lote | Alcance | Incidencias | Riesgo | Verificación/dependencias |
|---|---|---:|---|---|
| 1 | No ejecutado: sólo incidencias inequívocamente mecánicas | 0 | Bajo | No aplica; se habilita sólo si aparece un subconjunto demostrablemente mecánico |
| 2 | Tipos declarativos `*.types.ts`, por familia Hermes, empezando por `no-empty-object-type` y `no-explicit-any` con consumidores trazados | por inventario de familia | Medio | typecheck, smokes de la familia; depende de mantener contratos equivalentes |
| 3 | Evaluadores/validadores (`*.evaluate.ts`, `*.validate.ts`) | por inventario de familia | Medio/alto | typecheck y smoke funcional por gate; depende de Lote 2 cuando comparta tipos |
| 4 | Índices/adapters/runtime y comentarios `@ts-` | por inventario de familia | Alto | smokes focales, typecheck, build y revisión manual; último por posible efecto en control flow |
| 5 | Incidencias funcionales descubiertas durante lotes 2–4 | no predeterminable | Alto | propuesta separada, nunca corrección oportunista de lint |

No se autoriza modificar `src/commercial/*` en esta fase ni cambiar reglas/configuración para ocultar incidencias.

## Resultado del bloque inicial

## Batch 2 — hermes-build-dependency-cache — reconstrucción limpia

Estado: `QUALITY_BATCH_2=PASS`. Baseline canónico: `bed669bda04cafd7f883127e6169a520cbaa82b0`.

El alcance quedó limitado a `hermes-build-dependency-cache`. Los tres archivos `*.types.ts` fueron `BATCH_2_CORE` y `hermes-build-dependency-cache-verification.evaluate.ts` fue `BATCH_2_REQUIRED_CONSUMER`: al precisar `cacheRuntimeResult` desde `any`, el evaluator necesitó únicamente cambiar `r` a acceso opcional (`r?.`) para conservar exactamente las decisiones, estados, checks, outputs y serialización anteriores. Los cuatro archivos `hermes-wrapper-*` y su test fueron contaminación fuera de alcance y se retiraron.

La reconciliación de lint por archivo fue: planning types `5→0`, runtime types `6→0`, verification types `12→0`, verification evaluator `0→0`; total autorizado `23`. Los cuatro archivos wrapper eliminados habían aportado `3+9+2+9=23` incidencias adicionales. Por eso el delta contaminado anterior `300→254` se explica como `23` cache + `23` wrapper; el lote limpio mide `300→277`, sin incidencias nuevas.

Validación limpia: test hermético cache BEFORE/AFTER PASS con fixtures opcionales, runtime bloqueado y runtime exitoso; lint focal/global `277` errores históricos; typecheck PASS; build PASS; 13B PASS (`node scripts/jefe-release-operations-13b-smoke.mjs`); 13C PASS (4/4 Playwright); `git diff --check` PASS. Evidencia completa: `C:\Users\PC\Desktop\JEFE-QUALITY-DEBT\batch-2-recovery\clean-reconstruction\`.

## Batch 3 — hermes-wrapper-no-tool-mode approval

Estado: `QUALITY_BATCH_3=PASS`. Baseline canónico: `d27925b436abfffbcff23bab48409bbf4f578141`.

El dominio cohesivo contiene cuatro archivos: approval `types.ts` y `evaluate.ts`, e implementation-approval `types.ts` y `evaluate.ts`. Los evaluadores consumen los shapes de planning, runtime-selection, toolset approval e implementation planning; sus consumidores directos son los índices, validadores, serializadores y smokes de las mismas dos puertas. No se modificaron runtime Electron, red, Hermes, credenciales, UI ni configuración.

La reconstrucción reemplazó `any` por interfaces de entrada, records de resultados y tipos explícitos para checks/blockers/warnings. Los guards conservan las mismas condiciones; cuatro resultados booleanos fueron normalizados con `Boolean(...)` sólo para satisfacer el contrato requerido, sin cambio de comportamiento.

Lint machine-readable: `BEFORE=277`, `BEFORE_ONLY=23`, `AFTER_ONLY=0`, `COMMON=254`, `AFTER=254`. Factory `272→249`; externos `5→5`. Reglas: `no-explicit-any 274→251`, `no-empty-object-type 2→2`, `ban-ts-comment 1→1`.

Validación: hermético BEFORE/AFTER PASS con casos aprobados, bloqueados, opcionales y serialización; lint focal PASS; typecheck PASS; build PASS; 13B PASS; 13C PASS 4/4; `git diff --check` PASS. Los dos smokes oficiales wrapper quedaron `BLOCKED_EXTERNAL_FIXTURE` por ausencia de los artefactos externos pinneados ya documentados; no se generaron ni descargaron. Evidencia: `C:\Users\PC\Desktop\JEFE-QUALITY-DEBT\batch-3\`.

## Batch 4A — hermes-wrapper-no-tool-mode-implementation-planning

Estado: `QUALITY_BATCH_4A=PASS`. Baseline canónico: `5a5a4698fe263d4a2cb38fbe4fd548476f5b6723`.

El lote quedó limitado al gate `hermes-wrapper-no-tool-mode-implementation-planning`: `evaluate.ts` aportaba 3 incidencias y `types.ts` 6. La caracterización BEFORE cubrió planning aprobado y bloqueado, aprobación incompleta/ausente, `sourceInspection` válido/ausente/inválido, opcionales/null, warnings de schema desconocido, checks/blockers, decisiones, guards y serialización estable.

Se agregaron interfaces explícitas para approval/planning previos, source inspection, checks, blockers y warnings. Los guards del evaluator preservan las condiciones originales; no se modificaron defaults, decisiones, blockers, warnings ni consumidores externos.

Reconciliación machine-readable: `BEFORE=254`, `BEFORE_ONLY=9`, `AFTER_ONLY=0`, `COMMON=245`, `AFTER=245`. Factory `249→240`; externos `5→5`. Reglas: `no-explicit-any 251→242`, `no-empty-object-type 2→2`, `ban-ts-comment 1→1`.

Validación: caracterización BEFORE PASS; equivalencia hermética BEFORE/AFTER PASS con 6 fixtures; lint focal/global PASS; typecheck PASS; build PASS; 13B PASS; 13C PASS 4/4; `git diff --check` PASS. El smoke oficial quedó `BLOCKED_EXTERNAL_FIXTURE` por falta del fixture externo pinneado; no se descargó ni generó. Evidencia: `C:\Users\PC\Desktop\JEFE-QUALITY-DEBT\batch-4\4A\`.

## Batch 4B — hermes-wrapper-no-tool-mode-verification-planning

Estado: `QUALITY_BATCH_4B=PASS`. Baseline canónico: `ff99b0b9b7606733af45c2a995e63815275693c4`.

El lote quedó limitado al único `verification-planning/index.ts`, con 13 incidencias `no-explicit-any`: siete inputs de gates previos e inspección, dos guards de implementation/approval y cuatro fronteras de validación/serialización/parse/summarize. La caracterización BEFORE cubrió válido, bloqueado, planning/implementation/approval ausentes o incompletos, adapter aprobado, code inspection válido/ausente/null/inválido, gates de no ejecución, warnings, blockers, decisions y serialización.

Se aplicaron interfaces explícitas para implementation, approval, adapter approval, code inspection y planning inputs. Las funciones de validación/serialización usan el tipo inferido del evaluator; los guards se normalizan a booleanos sin relajar ni endurecer condiciones. No se modificaron verification-approval, otros wrappers, OperationalView, defaults ni consumers externos.

Reconciliación machine-readable: `BEFORE=245`, `BEFORE_ONLY=13`, `AFTER_ONLY=0`, `COMMON=232`, `AFTER=232`. Factory `240→227`; externos `5→5`. Reglas: `no-explicit-any 242→229`, `no-empty-object-type 2→2`, `ban-ts-comment 1→1`.

Validación: caracterización BEFORE PASS; equivalencia hermética BEFORE/AFTER PASS con 7 fixtures, gates de seguridad, summaries y serialización; lint focal/global PASS; typecheck PASS; build PASS; 13B PASS; 13C PASS 4/4; `git diff --check` PASS. El smoke oficial quedó `BLOCKED_EXTERNAL_FIXTURE` por falta del fixture externo pinneado; no se descargó ni generó. Evidencia: `C:\Users\PC\Desktop\JEFE-QUALITY-DEBT\batch-4\4B\`.

## Batch 4C — hermes-wrapper-no-tool-mode-verification-approval

Estado: `QUALITY_BATCH_4C=PASS`. Baseline canónico: `17b4f2259670e91fcead1d3c2fec1ebe6f6af5bc`.

El lote quedó limitado al único `verification-approval/index.ts`, con 13 incidencias `no-explicit-any`: seis inputs de planning/implementation/adapter y cinco superficies de guards/resultado/validación/serialización, más summaries. La caracterización BEFORE cubrió approval válido y bloqueado, planning/implementation ausentes o incompletos, adapter aprobado, opcionales/null, input inválido, decision record, blocker plan, warning, summary y serialización.

Se aplicaron interfaces explícitas para planning, implementation, adapter e input; un resultado tipado con flags de seguridad y fronteras de parse/serialize/validate/summarize tipadas. Las condiciones de approval y todos los estados autorizados permanecen iguales.

Reconciliación machine-readable: `BEFORE=232`, `BEFORE_ONLY=13`, `AFTER_ONLY=0`, `COMMON=219`, `AFTER=219`. Factory `227→214`; externos `5→5`. Reglas: `no-explicit-any 229→216`, `no-empty-object-type 2→2`, `ban-ts-comment 1→1`.

Validación: caracterización BEFORE PASS; equivalencia hermética BEFORE/AFTER PASS con 7 fixtures, approval decisions, blockers, summaries y serialización; lint focal/global PASS; typecheck PASS; build PASS; 13B PASS; 13C PASS 4/4; `git diff --check` PASS. El smoke oficial quedó `BLOCKED_EXTERNAL_FIXTURE` por falta del fixture externo pinneado; no se descargó ni generó. Evidencia: `C:\Users\PC\Desktop\JEFE-QUALITY-DEBT\batch-4\4C\`.

## Resumen consolidado Batch 4

| Sublote | Dominio | Incidencias eliminadas | Resultado |
|---|---|---:|---|
| 4A | wrapper no-tool implementation planning | 9 | PASS |
| 4B | wrapper no-tool verification planning | 13 | PASS |
| 4C | wrapper no-tool verification approval | 13 | PASS |
| **Total** | **candidato wrapper no-tool completo** | **35** | **PASS** |

La deuda total pasó de `277` al cierre de Batch 3 a `219` tras 4A–4C: Factory `272→214`, externos `5→5`. Se agregaron seis artefactos herméticos de caracterización/equivalencia: dos por cada sublote. Los smokes oficiales de Hermes permanecen `BLOCKED_EXTERNAL_FIXTURE`; las superficies modificadas quedaron cubiertas con equivalencia hermética local.

## Batch 1 — hermes-wrapper-no-tool-mode-planning

Estado: `BLOCKED` para cierre semántico. Alcance:

- `src/factory/hermes-wrapper-no-tool-mode-planning/hermes-wrapper-no-tool-mode-planning.types.ts`
- `src/factory/hermes-wrapper-no-tool-mode-planning/hermes-wrapper-no-tool-mode-planning.evaluate.ts`
- `src/factory/hermes-wrapper-no-tool-mode-planning/hermes-wrapper-no-tool-mode-planning.validate.ts`

La medición focal encontró 12 incidencias actuales, no 13: 9 en `types.ts`, 3 en `evaluate.ts` y 0 en `validate.ts`, todas `@typescript-eslint/no-explicit-any`. La incidencia 13 declarada queda separada; no se forzó el contador.

La corrección reemplazó los `any` por interfaces explícitas para los shapes serializados de revisión de runtime, aprobación de toolsets e inspección de source, y por un mapa de inspección con literales cerrados. No se cambiaron nombres, valores, decisiones, orden de operaciones ni serialización.

Resultados: lint focal `PASS`; typecheck `PASS`; build `PASS`; 13B `PASS`; 13C `PASS` (4/4); `git diff --check` `PASS`. La lint global posterior mide 300 errores (295 Factory, 5 externos): 297 `no-explicit-any`, 2 `no-empty-object-type`, 1 `ban-ts-comment`. Frente al baseline declarado 311/306/5, la reducción observable es 11 y queda como discrepancia de reconciliación.

El smoke oficial del wrapper sigue bloqueado porque faltan los artefactos simulados requeridos bajo `.codex-temp/external-tools/hermes-agent/install/75b300f/`. La auditoría confirmó que espera `runtime-selection-revision-planning-result.json`, `toolset-disable-verification-approval-result.json` y una inspección de archivos del checkout Hermes; el pin documentado es `75b300f13af40878ad6482b2ecb39c55c86679fe`. Esa dependencia requiere checkout/artefactos externos y no es necesaria para validar la semántica tipada del evaluador.

Se agregó `scripts/factory-hermes-wrapper-no-tool-mode-planning-hermetic-test.cjs`, que transpila temporalmente el evaluador y comparara el mismo fixture válido y bloqueado contra `git show 574c457b10ac833133177c8d5057dca39cf88600` y el código actual. Verifica deep equality del resultado y de la serialización: `PASS`.

La reconciliación exacta contra el commit `574c457b10ac833133177c8d5057dca39cf88600`, usando el mismo ESLint/config/parser/formato, queda cerrada: `BEFORE=311`, `AFTER=300`, `BEFORE_ONLY=11`, `AFTER_ONLY=0`, `COMMON=300`. Las 11 eliminadas son `@typescript-eslint/no-explicit-any` y no existen incidencias transformadas. La duodécima corrección observada en el baseline focal del worktree sucio previo al lote ya estaba presente localmente pero no existía en el commit canónico; por eso hubo 12 correcciones observadas y una reducción neta de 11 frente al commit exacto. No apareció ninguna incidencia nueva causada por Batch 1.

El smoke integral oficial queda clasificado como `BLOCKED_EXTERNAL_FIXTURE`: requiere checkout/resultado externo gitignored pinneado a `75b300f13af40878ad6482b2ecb39c55c86679fe`. No se descargó ni generó ese artefacto; no participa de la semántica modificada. El test hermético BEFORE/AFTER cubre el contrato afectado.

No existe Batch 1 seguro bajo los criterios autorizados. No se modificó `src/factory/*`; no se ejecutaron correcciones, refactors, deploy, red, commit ni push. `quality:ci` queda pendiente y previsiblemente bloqueado por la deuda medida.

## Batch 5 — hermes-toolset-disable-verification-approval

Estado: `QUALITY_BATCH_5=PASS`. Baseline canónico: `b8a97ea4cd0770cf0251d4595bc3cb33e95f10f5`.

El lote quedó limitado a la familia cohesionada `hermes-toolset-disable-verification-approval`: 13 incidencias `no-explicit-any` en `types.ts` y `evaluate.ts`. Es un gate declarativo; no ejecuta Hermes, no accede a red/credenciales y no cambia autoridad. Se reemplazaron fronteras `any` por records desconocidos, un contrato explícito para source-safety assessment y guards estructurales, preservando decisiones, estados, flags, blockers, warnings y serialización.

Reconciliación machine-readable: `BEFORE=219`, `BEFORE_ONLY=13`, `AFTER_ONLY=0`, `COMMON=206`, `AFTER=206`. Factory `214→201`; externos `5→5`. Reglas Factory: `no-explicit-any 212→199`, `no-empty-object-type 2→2`; `ban-ts-comment 1` permanece externo. La caída 219→206 coincide exactamente con los 13 hallazgos de la familia seleccionada.

Validación: typecheck PASS; caracterización hermética del gate PASS; build PASS; 13B PASS; 13C PASS 4/4; `git diff --check` PASS. El smoke oficial quedó `BLOCKED_EXTERNAL_FIXTURE` antes de evaluar por ausencia del resultado externo de planificación Hermes; no se generó ni descargó. Evidencia completa: `C:\Users\PC\Desktop\JEFE-QUALITY-DEBT\batch-5\`.
