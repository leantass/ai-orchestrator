# Auditoria: contrato universal domain-agnostic para JEFE

## 1. Resumen ejecutivo

JEFE todavia no cumple por completo la idea de dominio infinito. Aunque ya puede planificar, preparar y materializar entregas fullstack local en dominios grandes, hoy sigue dependiendo de hardcoding productivo para dominios conocidos dentro del backend, del renderer y de algunos tests.

La consecuencia practica es que cada dominio nuevo tiende a empujar al sistema hacia una arquitectura de catalogo cerrado: se agregan detectores, roots, required paths, forbidden signals y contratos canonicos por rubro. Eso contradice la direccion correcta.

La direccion correcta es que el Cerebro/OpenAI produzca un contrato universal estructurado para cualquier dominio, y que JEFE conozca el schema de ese contrato, no la lista de rubros posibles.

## 2. Principio correcto

El usuario puede pedir cualquier dominio.

El Cerebro entiende el dominio.

El Cerebro devuelve un contrato universal.

JEFE no deberia conocer todos los dominios posibles.

JEFE debe conocer el schema, no el rubro.

## 3. Que NO queremos

- catalogo cerrado de dominios
- `domainContractRegistry` con `logistics`, `online-courses`, `hospitality` o equivalentes como fuente de verdad productiva
- `if` por dominio en materializacion
- roots distintos entre review y materialization
- inspector duplicando contratos por dominio
- renderer reconstruyendo required paths o forbidden signals por rubro
- tests que obligan a hardcodear rubros para que el sistema funcione

## 4. Que SI queremos

Un `GeneratedDomainContract` universal con estructura equivalente a:

- `contractVersion`
- `deliveryLevel`
- `domain.label`
- `domain.slug`
- `domain.summary`
- `root.slug`
- `root.sourceRoot`
- `root.targetRoot`
- `roles`
- `entities`
- `states`
- `workflows`
- `frontendSurfaces`
- `backend.routes`
- `backend.services`
- `backend.modules`
- `database.tables`
- `database.relationships`
- `database.seedData`
- `shared.files`
- `docs`
- `scripts`
- `integrations`
- `safety`
- `materialization.requiredFiles`
- `materialization.operations`
- `materialization.allowedTargetPaths`
- `validation.syntaxChecks`
- `validation.requiredPathGroups`
- `validation.forbiddenSearchPatterns`

## 5. Mapa de hardcoding actual

### `electron/main.cjs`

Hallazgos principales:

- detectores productivos por rubro como `detectLogisticsTrackingIntent`, `detectOnlineCoursesIntent`, `detectHospitalityReservationsIntent`
- seleccion de root por dominio conocido como `logitrack-local-v1`, `edu-platform-local`, `hotel-reservations-local`
- seleccion de `selectedContractKind` por dominio conocido
- perfiles/archetypes como `logistics-tracking`, `online-courses`, `hotel-reservations`, `veterinary`
- contratos canonicos por dominio con `requiredPathGroups`, `forbiddenSignals`, `expectedTargetPaths`
- builders de scaffold, demo data, rutas backend, superficies frontend, docs y seeds por rubro

Conclusion:

`electron/main.cjs` hoy es el principal lugar donde JEFE viola la idea de dominio infinito.

### `src/planner-ui-state.js`

Hallazgos principales:

- detectores UI por dominio
- fallback contracts por dominio
- `requiredPathGroups` por rubro
- `forbiddenSignals` por rubro

Conclusion:

El renderer todavia reconstruye conocimiento de contratos por dominio en vez de limitarse a validar un contrato universal ya normalizado.

### `src/App.tsx`

Hallazgos principales:

- prompts de preparacion materializable con ejemplos y ramas ligadas a dominios concretos
- parte del flujo de continuacion todavia orienta al Cerebro con pistas de contratos conocidos

Conclusion:

No es el foco principal del problema, pero sigue empujando al sistema hacia una lista conocida de dominios.

### `scripts/ai-operator-e2e-smoke.mjs`

Hallazgos principales:

- fixtures y casos para logistica, cursos online, hoteleria, veterinaria, escolar y otros
- asserts exactos de roots, required paths y contract kinds
- duplicacion de conocimiento de contratos canonicos dentro de los tests

Conclusion:

Una parte es aceptable como regresion. Otra parte es demasiado rigida y refuerza la arquitectura de rubros conocidos.

## 6. Que hardcoding es aceptable

Es aceptable cuando aparece como dato de prueba o ejemplo, no como motor de produccion:

- fixtures de tests
- goals de ejemplo
- snapshots de regresion
- datos mock ilustrativos
- casos de contaminacion cruzada para validar seguridad

En estos casos, el dominio aparece como muestra de entrada o de salida, no como condicion necesaria para que JEFE sepa materializar.

## 7. Que hardcoding es peligroso

Es peligroso cuando obliga a tocar codigo cada vez que aparece un dominio nuevo:

- detectores de intencion por rubro en produccion
- roots canonicos resueltos por `if` de dominio
- required paths por rubro dentro del backend o del renderer
- forbidden signals por rubro
- contract kinds cerrados como fuente de verdad productiva
- fallbacks que solo saben construir contratos para verticales conocidas

Ese hardcoding es el que convierte cada nuevo dominio en una migracion de codigo, en lugar de una nueva instancia de un contrato universal.

## 8. Riesgos de seguir parcheando

Si seguimos agregando ramas por dominio:

- cada nuevo rubro puede romper `rootSlug`, `sourceRoot` o `targetRoot`
- cada nuevo rubro puede obligar a duplicar `requiredPaths` en backend, renderer y tests
- se multiplican los `forbiddenSignals` inconsistentes
- la UI puede quedar pegada en review o rechazar contratos validos por falta de soporte local
- los smokes se vuelven catalogos cerrados de dominios soportados
- la deuda de `electron/main.cjs` sigue creciendo y se vuelve mas dificil razonar sobre el sistema

## 9. Arquitectura propuesta

Flujo propuesto:

`Usuario -> Cerebro -> GeneratedDomainContract -> Normalizador -> Materializador -> Inspector -> Renderer -> Validaciones`

Principio operativo:

- el Cerebro produce un contrato universal
- el normalizador valida schema, completa defaults y aplica safety universal
- el materializador genera archivos desde ese contrato
- el inspector valida readiness desde ese mismo contrato
- el renderer muestra estados y diagnosticos sin reconstruir dominio
- las validaciones finales se derivan del bloque `validation` del contrato

## 10. Responsabilidades por capa

### OpenAI / Cerebro

- entender el dominio pedido
- inferir roles, entidades, estados, workflows, superficies, rutas, tablas, docs y seeds
- producir un `GeneratedDomainContract` estructurado
- declarar exclusiones, integraciones mock y aprobaciones futuras

### JEFE / backend

- validar schema
- validar safety
- normalizar defaults
- mantener coherentes `sourceRoot` y `targetRoot`
- transformar contrato en operaciones de materializacion
- ejecutar validaciones estructurales y sintacticas

### Renderer

- mostrar el estado del flujo
- mostrar readiness o diagnostico
- no reconstruir required files por dominio
- no decidir el rubro desde heuristicas locales

### Tests

- validar contratos universales
- validar contaminacion cruzada
- validar casos de root mismatch, contrato incompleto, forbidden signals y approvals
- usar dominios concretos como fixtures, no como motor de verdad

### local-rules

- fallback generico
- nunca catalogo cerrado de dominios
- deberia completar un contrato minimo universal cuando OpenAI no responda usable

## 11. Plan de migracion por fases

### Fase 1

Congelar nuevos hardcodes por dominio.

### Fase 2

Definir schema `GeneratedDomainContract`.

### Fase 3

Implementar normalizador universal.

### Fase 4

Adaptar logistica y cursos online al schema universal sin cambiar resultados.

### Fase 5

Tratar hoteleria como contrato generado, no como branch hardcodeado.

### Fase 6

Eliminar duplicacion entre backend, renderer y tests.

### Fase 7

Agregar prueba de dominio inventado.

## 12. Test clave futuro

Dominio inventado de prueba:

`sistema para administrar criaderos de plantas carnivoras con reservas, cuidados, ventas mock y reportes`

Resultado esperado:

- el Cerebro puede generar contrato
- JEFE puede normalizarlo
- el materializador puede producir scaffold local
- el renderer puede evaluar readiness
- no hace falta agregar codigo especifico para ese dominio

Si este caso no funciona sin tocar el codigo productivo, entonces la arquitectura todavia depende de rubros conocidos.

## 13. Recomendacion final

Refactorizar hacia contrato universal antes de seguir agregando dominios grandes.

Seguir parchando hoteleria, veterinaria, escolar u otros como ramas nuevas solo profundiza la deuda. La siguiente inversion correcta no es "sumar otro dominio", sino mover JEFE a un modelo donde el Cerebro produzca un `GeneratedDomainContract` universal y el resto del sistema opere sobre ese contrato.
