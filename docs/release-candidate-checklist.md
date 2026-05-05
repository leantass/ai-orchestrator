# Release candidate checklist

## Objetivo

Esta guia sirve para demostrar JEFE como plataforma local de programacion automatizada sin salir del modo seguro.

## Escenario 1: pedir un sistema desde cero

1. Pedir un sistema nuevo, por ejemplo:
   `Haceme un sistema para turnos de veterinaria.`
2. Confirmar que JEFE devuelva:
   - delivery level razonable
   - blueprint
   - roadmap
   - siguiente paso seguro
3. Verificar que la UI muestre continuidad y readiness en modo planificacion.

## Escenario 2: avanzar las fases base

1. Materializar `fullstack-local`.
2. Preparar y materializar:
   - `frontend-mock-flow`
   - `backend-contracts`
   - `database-design`
   - `local-validation`
3. Confirmar en `jefe-project.json`:
   - fases registradas
   - `nextRecommendedPhase`
   - `nextRecommendedAction`
   - `readinessLevel`

## Escenario 3: expandir modulos seguros

1. Preparar `review-and-expand`.
2. Elegir un modulo seguro:
   - `notifications`
   - `reports`
   - `inventory`
3. Preparar el plan del modulo.
4. Materializarlo solo si JEFE lo marca como seguro.
5. Confirmar que el manifest no duplique modulos ya hechos.

## Escenario 4: ver bloqueos y aprobaciones

1. Pedir acciones sensibles, por ejemplo:
   - `npm install`
   - runtime local
   - DB real
   - auth real
   - deploy
   - Docker
   - integraciones externas
2. Confirmar que JEFE:
   - no ejecute nada real
   - devuelva un paquete de aprobacion
   - muestre riesgo, alternativa segura y alcance
   - mantenga todo en planner-only o bloqueado

## Escenario 5: interpretar readiness

1. Abrir el centro de continuidad.
2. Revisar:
   - `Estado para demo`
   - `Que ya esta construido`
   - `Que sigue siendo mock`
   - `Requiere aprobacion`
   - `Bloqueado por seguridad`
   - `Guia rapida para probar`
3. Confirmar que JEFE explique:
   - si esta listo para demo local segura
   - que sigue siendo mock
   - que falta para producto real
   - cual es el proximo paso recomendado

## Que NO probar todavia

- no correr `npm install`
- no levantar runtime real
- no abrir backend real
- no abrir puertos manualmente
- no crear DB real
- no ejecutar SQL
- no correr migraciones
- no correr seeds
- no crear Dockerfile real
- no crear docker-compose real
- no hacer deploy
- no configurar auth real
- no tocar pagos reales
- no integrar APIs externas reales
- no crear `.env` real

## Criterio de demo segura

La demo se considera segura cuando:

- el proyecto esta materializado solo con archivos locales revisables
- las fases base estan completas
- la validacion local esta cerrada
- los modulos seguros agregados siguen en mock
- las acciones sensibles aparecen como aprobables o bloqueadas
- no se ejecuto nada real fuera del modo local seguro
