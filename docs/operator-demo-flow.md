# Flujo de Demo para Operador

## Escenario recomendado

Usar un pedido simple pero rico en continuidad:

> Haceme un sistema para turnos de veterinaria con clientes, mascotas, turnos, recordatorios y reportes.

## Recorrido sugerido

1. Confirmar que JEFE elija un delivery level seguro y devuelva blueprint + roadmap.
2. Materializar la base `fullstack-local`.
3. Abrir `frontend/index.html` con doble click y confirmar que la demo estática carga con `file://`, sin servidor ni instalación de dependencias.
4. Avanzar las fases base:
   - `frontend-mock-flow`
   - `backend-contracts`
   - `database-design`
   - `local-validation`
5. Abrir el centro de continuidad.
6. Confirmar el próximo paso recomendado.
7. Preparar `review-and-expand`.
8. Expandir al menos un módulo seguro:
   - `notifications`
   - `reports`
   - `inventory`
9. Revisar el estado para demo.
10. Pedir una acción sensible como `npm install` o runtime local.
11. Confirmar que JEFE solo prepare la aprobación y no ejecute nada real.

## Qué debería mostrar la UI

- `Próximo paso recomendado`
- `Opciones para seguir`
- `Estado para demo`
- `Qué ya está construido`
- `Qué sigue siendo mock`
- `Aprobaciones pendientes`
- `Comandos propuestos`
- `Validaciones obligatorias`
- `Alternativa segura`

## Checklist de demo salió bien

- el wizard no se rompió
- la continuidad se entendió sin mirar JSON
- los módulos seguros se ofrecieron como tales
- los módulos ya hechos no se duplicaron
- readiness explicó qué falta y qué ya está listo
- las aprobaciones se vieron como preview, no como ejecución
- no apareció ningún botón peligroso para runtime real

## Si algo sale mal

1. Revisar `jefe-project.json` para ver fases, módulos y next action.
2. Correr:
   - `npm run ai-planner-smoke`
   - `node scripts/ai-release-smoke.mjs`
   - `node scripts/ai-operator-e2e-smoke.mjs`
3. Verificar que no hayan quedado archivos temporales fuera de `.tmp`.
4. Confirmar que no se haya creado `.env`, `node_modules`, `Dockerfile` ni `docker-compose.yml`.

## Qué NO probar todavía

- `npm install` real
- dev server de proyectos generados
- backend real escuchando puerto
- DB real
- migraciones o seeds reales
- Docker real
- deploy real
- auth real
- pagos reales
- integraciones externas reales
