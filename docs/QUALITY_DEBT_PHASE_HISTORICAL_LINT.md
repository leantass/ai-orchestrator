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
