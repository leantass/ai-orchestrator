# Release Candidate Checklist

## Objetivo

Esta guía sirve para demostrar JEFE como plataforma local de programación automatizada sin salir del modo seguro.

## Escenario 1: pedir un sistema desde cero

1. Pedir un sistema nuevo, por ejemplo:
   `Haceme un sistema para turnos de veterinaria.`
2. Confirmar que JEFE devuelva:
   - delivery level razonable
   - blueprint
   - roadmap
   - siguiente paso seguro
3. Verificar que la UI muestre continuidad y readiness en modo planificación.

## Escenario 2: avanzar las fases base

1. Materializar `fullstack-local`.
2. Abrir `frontend/index.html` con doble click para confirmar que la demo estática local levanta con `file://`, sin servidor y sin `npm install`.
3. Confirmar que la primera demo local no sea solo un scaffold mínimo y muestre, según el dominio:
   - secciones navegables
   - métricas mock
   - detalle lateral o ficha seleccionada
   - interacciones client-side locales
   - mensajes claros de modo seguro
4. Para veterinaria, confirmar específicamente:
   - clientes y dueños
   - mascotas
   - turnos
   - recordatorios
   - reportes
   - inventario básico
   - ausencia de términos de clínica humana como concepto principal
5. Preparar y materializar:
   - `frontend-mock-flow`
   - `backend-contracts`
   - `database-design`
   - `local-validation`
6. Confirmar en `jefe-project.json`:
   - fases registradas
   - `nextRecommendedPhase`
   - `nextRecommendedAction`
   - `readinessLevel`

## Escenario 3: expandir módulos seguros

1. Preparar `review-and-expand`.
2. Elegir un módulo seguro:
   - `notifications`
   - `reports`
   - `inventory`
3. Preparar el plan del módulo.
4. Materializarlo solo si JEFE lo marca como seguro.
5. Confirmar que el manifest no duplique módulos ya hechos.

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
   - devuelva un paquete de aprobación
   - muestre el preview controlado con comandos propuestos
   - muestre riesgo, alternativa segura y alcance
   - mantenga todo en planner-only o bloqueado
3. Revisar también `docs/runtime-approval-flow.md` para interpretar el preview, la frase sugerida de aprobación y las validaciones obligatorias.

## Escenario 5: interpretar readiness

1. Abrir el centro de continuidad.
2. Revisar:
   - `Estado para demo`
   - `Qué ya está construido`
   - `Qué sigue siendo mock`
   - `Requiere aprobación`
   - `Bloqueado por seguridad`
   - `Guía rápida para probar`
3. Confirmar que JEFE explique:
   - si está listo para demo local segura
   - qué sigue siendo mock
   - qué falta para producto real
   - cuál es el próximo paso recomendado

## Qué NO probar todavía

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

- el proyecto está materializado solo con archivos locales revisables
- las fases base están completas
- la validación local está cerrada
- los módulos seguros agregados siguen en mock
- las acciones sensibles aparecen como aprobables o bloqueadas
- las aprobaciones sensibles quedan en preview y no como ejecuciones reales
- no se ejecutó nada real fuera del modo local seguro
