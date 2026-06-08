# JEFE / Orquestador de IA Local - Visual Sandbox Flow Closure v1

## 1. Resumen ejecutivo

Se cerró el flujo visual sandbox seguro de JEFE desde punta a punta para el caso real de materialización controlada en Electron.

Este hito era importante porque el sistema ya tenía contratos, smokes y materialización segura, pero todavía faltaba validar y estabilizar el comportamiento visible real de la UI ante approvals humanas, rechazos, diferidos y bloqueos de seguridad.

Con este cierre, JEFE ahora puede:

- recibir un pedido nuevo
- construir plan y approval surface
- ejecutar materialización sandbox segura cuando la approval es válida
- cerrar visualmente el resultado sin quedar en estados engañosos
- bloquear approvals inseguras con causa visible

## 2. Baseline final

- Branch: `main`
- Commit final: `44ea3f3 fix: close pending visual sandbox branches`
- CI: `success`
- Estado repo: limpio y sincronizado con `origin/main`

## 3. Alcance validado

Se validó explícitamente:

- caso feliz visual real
- approval de ubicación segura
- rechazo de materialización
- no materializar todavía
- bloqueo de approval insegura hacia `web-prueba`
- sandbox interno/controlado

Restricciones confirmadas:

- no producción
- no `web-prueba`
- no `.env`
- no `node_modules`
- no Docker/deploy
- no servicios externos
- no pagos reales
- no DB productiva
- no credenciales

## 4. Evidencia generada

Las evidencias locales de auditoría quedaron bajo `.codex-temp/` y no se versionan:

- `.codex-temp/electron-visual-e2e/visual-case-a-live-2/`
- `.codex-temp/electron-visual-e2e/visual-pending-branches/case-b-location-safe-dev-2/`
- `.codex-temp/electron-visual-e2e/visual-pending-branches/case-c-reject-dev-6/`
- `.codex-temp/electron-visual-e2e/visual-pending-branches/case-d-not-yet-dev-1/`
- `.codex-temp/electron-visual-e2e/visual-pending-branches/case-e-web-prueba-dev-2/`

Estas evidencias:

- no se commitean
- sirven para auditoría local
- permiten revisar screenshots, heartbeat y reportes JSON del driver visual
- no deben tratarse como almacenamiento permanente

El driver visual ahora preserva más contexto final y, cuando corresponde, captura snapshot de `validation/report.json`.

## 5. Commits relevantes del cierre

- `cd1b346 fix: support sandbox location approval materialization flow`
  - soporte real para approval de ubicación sandbox y puente a materialización segura
- `e7178e4 fix: execute approved sandbox materialization flow`
  - corrección del execute real después de la approval final
- `62176db fix: validate approved sandbox flow end to end`
  - refuerzo del flujo E2E y validación integrada
- `787f2a7 fix: harden visual sandbox materialization flow`
  - endurecimiento del flujo visual y de la evidencia asociada
- `b850a4a fix: preserve visual sandbox validation evidence`
  - preservación de snapshot y trazabilidad documental de la evidencia visual
- `44ea3f3 fix: close pending visual sandbox branches`
  - cierre visual de ramas pendientes: ubicación segura, rechazo, no materializar todavía y bloqueo a `web-prueba`

## 6. Qué bugs se corrigieron

Durante este cierre se corrigieron, entre otros, estos problemas:

- approval registrada pero no ejecutada
- approval final que replanificaba en vez de ejecutar
- UI quedando en `En revisión / 25% / Todavía no se ejecutó ninguna instrucción`
- materialización directa insegura en workspace
- evidencia visual sin snapshot persistente
- rechazo/no materializar todavía sin cierre claro
- approval insegura hacia `web-prueba` sin bloqueo visual claro

## 7. Estado funcional final

Flujo esperado:

`pedido -> plan -> approval -> ejecución sandbox -> validation/report.json -> resultado visual cerrado`

Ramas finales validadas:

- aprobación segura ejecuta
- rechazo conserva planificación y no crea archivos
- no materializar todavía conserva planificación y no crea archivos
- approval peligrosa bloquea y explica causa

Sandbox efectivo esperado:

- `.codex-temp/generated-domain-materialization-approved/...`

La materialización real fuera de sandbox no quedó habilitada en este hito.

## 8. Riesgos residuales

Quedan riesgos y deuda técnica conocidos:

- `electron/main.cjs` sigue siendo grande y crítico
- `src/App.tsx` sigue siendo grande
- `electron/local-deterministic-executor.cjs` sigue con deuda legacy
- `.codex-temp` puede limpiarse y no debe asumirse como almacenamiento permanente
- la automatización visual depende del entorno local
- runtime productivo real sigue fuera de alcance
- materialización fuera de sandbox sigue bloqueada salvo aprobación futura explícita

## 9. Fuera de alcance

Este hito no incluyó:

- deploy
- Docker
- servicios externos
- pagos reales
- DB productiva
- credenciales
- tocar `web-prueba`
- materialización real fuera de sandbox
- limpieza grande
- refactor de arquitectura

## 10. Roadmap post-MVP recomendado

### A. Limpieza segura de temporales ignorados

- `.codex-temp`
- logs
- outputs locales
- solo si ya no se necesita evidencia visual local

### B. Consolidación documental

- changelog interno
- demo script
- risk log
- checklist de operación

### C. Modularización controlada de `main.cjs`

- sin cambiar comportamiento
- extraer helpers seguros
- mantener CI verde

### D. Modularización controlada de `App.tsx`

- separar estados y paneles de approval/result
- no reescribir la UI completa

### E. Migración gradual de `local-deterministic-executor.cjs`

- pasar de ramas por dominio a capabilities
- mantener fallback legacy

### F. Más dominios de prueba

- biblioteca comunitaria
- cooperativa de reciclaje
- comedor comunitario
- turnos mock
- inventario barrial

### G. Release post-MVP

- tag
- changelog
- demo script
- checklist de riesgos

## 11. Reglas operativas futuras

- no apilar cambios con CI en progreso
- no tocar `web-prueba` salvo autorización explícita
- no aceptar harness como reemplazo visual cuando el pedido sea visual
- no commitear `.codex-temp`
- no instalar dependencias sin aprobación
- si falla CI, arreglar CI antes de seguir

## Estado del hito

Cerrado funcionalmente.

Seguro para validación local controlada.

No productivo.

No deployable.
