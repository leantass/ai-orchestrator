# JEFE / Orquestador de IA Local - Visual Sandbox Demo Script v1

## 1. Objetivo de la demo

Mostrar que JEFE puede recorrer un flujo visual sandbox seguro completo sin tocar `web-prueba`, sin salir a produccion y sin ejecutar integraciones sensibles.

## 2. Preparacion

- usar repo limpio
- no abrir flujos reales fuera de sandbox
- no crear `.env`
- no crear `node_modules`
- no usar Docker
- no usar deploy
- no usar servicios externos

## 3. Caso feliz visual

### Objetivo sugerido

Pedir una app local para un banco comunitario de herramientas barriales con frontend publico, panel operativo, panel administrativo, backend mock y diseno de base local.

### Pasos

1. Cargar objetivo.
2. Cargar contexto de prueba controlada.
3. Elegir `Maxima calidad`.
4. Elegir `No reutilizar`.
5. Generar plan.
6. Resolver approvals segun corresponda.
7. Verificar que el flujo llegue a materializacion sandbox.
8. Verificar cierre visual con resultado claro.

### Senales esperadas en UI

- plan visible y entendible
- approval surface clara
- progreso real
- ejecutor activo cuando corresponde
- resultado final cerrado
- sin quedar en `En revision`
- sin quedar en `25%`
- sin quedar en `Todavia no se ejecuto ninguna instruccion`

## 4. Approval de ubicacion segura

### Paso visual

Si aparece approval de ubicacion:

- elegir la opcion aislada o equivalente
- usar workspace alternativo seguro
- materializar solo dentro del sandbox aprobado

### Esperado

- approval aceptada
- sin escritura directa en `web-prueba`
- sin escritura directa insegura en el repo
- sandbox efectivo bajo `.codex-temp/generated-domain-materialization-approved/...`
- si hay materializacion, `validation/report.json` y evidencia persistente del driver

## 5. Rechazo de materializacion

### Paso visual

Cuando aparezca approval final:

- elegir `Rechazar y mantener solo planificacion`

### Esperado

- no crea archivos
- no materializa
- cierre visual claro
- CTA coherente
- sin quedar en espera muda

## 6. No materializar todavia

### Paso visual

Si aparece la opcion:

- elegir `No materializar todavia`

### Esperado

- no crea archivos
- no materializa
- conserva planificacion
- cierre visual claro

## 7. Bloqueo por web-prueba

### Paso visual

Si la approval permite texto libre:

- intentar una autorizacion insegura que pida escribir en `web-prueba`

### Esperado

- bloqueo explicito
- causa visible
- no materializa
- no toca `web-prueba`

## 8. Que NO debe pasar

- materializacion directa fuera de sandbox
- `web-prueba` como destino real
- `.env`
- `node_modules`
- Docker o deploy
- servicios externos
- pagos reales
- DB productiva
- credenciales
- replanificacion muda despues de una approval valida

## 9. Evidencia temporal esperada

Evidencia local no versionada esperada:

- `.codex-temp/electron-visual-e2e/visual-case-a-live-2/`
- `.codex-temp/electron-visual-e2e/visual-pending-branches/`

Tipos de evidencia:

- screenshots
- `report.json`
- `heartbeat.json`
- `validation-report.snapshot.json` cuando corresponda

## 10. Nota operativa

La demo visual real no debe confundirse con UI-E2E/harness. Los smokes sirven de respaldo, pero no reemplazan la prueba visual cuando el objetivo de la demo es el comportamiento visible en Electron.
