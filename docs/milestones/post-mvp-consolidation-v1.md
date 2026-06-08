# JEFE / Orquestador de IA Local - Post-MVP Consolidation v1

## 1. Objetivo

Este documento consolida el estado real del proyecto despues del cierre del MVP visual sandbox.

No define un producto listo para produccion. Define un baseline operativo seguro para seguir trabajando sin perder contexto.

## 2. Estado actual del proyecto

- Branch esperada: `main`
- Baseline de cierre visual sandbox: `44ea3f3 fix: close pending visual sandbox branches`
- Baseline documental del cierre: `2b6533b docs: document visual sandbox flow closure`
- CI del baseline documental: `success`
- Estado esperado del repo: limpio y sincronizado con `origin/main`

JEFE hoy puede:

- recibir un pedido nuevo
- construir contrato y plan
- mostrar approval surface
- ejecutar materializacion segura solo en sandbox controlado
- cerrar visualmente el resultado en el caso validado
- bloquear approvals inseguras con causa visible

## 3. Que quedo cerrado

Quedo cerrado en este MVP:

- caso feliz visual real del flujo sandbox
- approval de ubicacion segura
- rechazo de materializacion
- no materializar todavia
- bloqueo de approval insegura hacia `web-prueba`
- evidencia visual local bajo `.codex-temp/electron-visual-e2e/`
- snapshot y trazabilidad local de `validation/report.json` cuando corresponde
- bateria tecnica local
- CI remoto verde sobre el cierre visual y su documentacion

## 4. Que quedo fuera

Quedo explicitamente fuera del MVP:

- deploy
- Docker
- servicios externos reales
- pagos reales
- DB productiva
- credenciales
- materializacion real fuera de sandbox
- refactor grande de arquitectura
- limpieza estructural profunda
- endurecimiento productivo del runtime

## 5. Baseline funcional

Flujo funcional esperado:

`pedido -> plan -> approval -> materializacion sandbox -> validation/report.json -> resultado visual cerrado`

Ramas esperadas:

- approval segura ejecuta en sandbox controlado
- rechazo conserva planificacion y no crea archivos
- no materializar todavia conserva planificacion y no crea archivos
- approval peligrosa bloquea y explica causa

## 6. Criterio de prioridad

Prioridad alta:

- no romper el flujo sandbox ya validado
- no tocar `web-prueba`
- no mezclar validacion visual real con solo harness
- no degradar CI

Prioridad media:

- reducir complejidad en `electron/main.cjs`
- reducir complejidad en `src/App.tsx`
- seguir cerrando deuda legacy sin cambiar comportamiento

Prioridad baja:

- limpieza local adicional de temporales no criticos
- mejoras cosmeticas de documentacion y demo interna

## 7. Riesgos residuales

- `electron/main.cjs` sigue siendo grande y critico
- `src/App.tsx` sigue siendo grande y concentra mucho estado
- `electron/local-deterministic-executor.cjs` sigue con deuda legacy
- la automatizacion visual depende del entorno local
- `.codex-temp` no es almacenamiento permanente
- el bridge approval -> execute ya funciona, pero sigue sensible a crecimiento sin modularizacion
- materializacion fuera de sandbox sigue bloqueada salvo aprobacion futura explicita

## 8. Mapa de proximos bloques

Orden recomendado:

1. auditoria de evidencia visual no versionada
2. extraccion segura de helpers puros desde `electron/main.cjs`
3. modularizacion controlada de estado UI en `src/App.tsx`
4. migracion gradual de capacidades en `local-deterministic-executor.cjs`
5. ampliacion de dominios de prueba
6. release post-MVP

## 9. Regla operativa de continuidad

- no apilar cambios con CI en progreso
- no tratar `.codex-temp` como fuente permanente
- no tocar `web-prueba` salvo autorizacion explicita
- no vender UI-E2E/harness como prueba visual real
- si CI falla, arreglar CI antes de avanzar

## 10. Estado del proyecto

Cerrado para validacion local segura del MVP visual sandbox.

No productivo.

No deployable.
