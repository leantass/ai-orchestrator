# Release Candidate Checklist

## Objetivo

Esta guía sirve para validar JEFE como plataforma local de programación automatizada en modo seguro: planifica, materializa demos ricas por `file://`, deja continuidad útil y mantiene las acciones sensibles fuera de ejecución.

## Escenario 1: pedir un sistema desde cero

1. Pedí un sistema nuevo, por ejemplo:
   - `Haceme un sistema fullstack local para una veterinaria...`
   - `Haceme un sistema fullstack local para reservas de canchas...`
   - `Haceme un sistema fullstack local para ecommerce...`
2. Confirmá que JEFE devuelva:
   - delivery level razonable
   - blueprint
   - roadmap
   - siguiente paso seguro
3. Verificá que no prometa runtime real ni `npm install`.

## Escenario 2: materializar un fullstack-local rico

1. Prepará la materialización fullstack local.
2. Ejecutá la materialización segura.
3. Verificá que el cierre muestre:
   - carpeta creada
   - operaciones aplicadas
   - validaciones
   - ruta de `frontend/index.html`
   - próxima fase segura
   - readiness actual
4. Confirmá que el proyecto generado incluya:
   - `frontend/`
   - `backend/`
   - `shared/`
   - `database/`
   - `docs/`
   - `jefe-project.json`

## Escenario 3: abrir la demo estática

1. Abrí `frontend/index.html` con doble click.
2. Confirmá que la demo carga por `file://`.
3. Confirmá que:
   - no usa servidor
   - no requiere `npm install`
   - no deja pantalla blanca
   - muestra navegación, métricas, listas, detalle y actividad

## Escenario 4: validar que la demo sea rica y del dominio correcto

Para cualquier vertical, la demo debería incluir:

- secciones navegables
- métricas mock
- alertas o pendientes
- detalle de entidad seleccionada
- al menos dos o tres interacciones locales en memoria

Para veterinaria, confirmar específicamente:

- clientes o dueños
- mascotas
- turnos
- recordatorios
- reportes
- inventario básico
- veterinarios o profesionales veterinarios
- ausencia de “Clínica médica”, “Pediatría” y “pacientes” como concepto principal

## Escenario 5: avanzar continuidad por fases

1. Después del scaffold, confirmar que la siguiente fase recomendada sea `frontend-mock-flow`.
2. Luego preparar y materializar, cuando corresponda:
   - `frontend-mock-flow`
   - `backend-contracts`
   - `database-design`
   - `local-validation`
3. Verificar en `jefe-project.json`:
   - fases registradas
   - `nextRecommendedPhase`
   - `nextRecommendedAction`
   - `readinessLevel`

## Escenario 6: interpretar readiness

1. Abrí el centro de continuidad.
2. Revisá:
   - `Estado para demo`
   - `Qué ya está construido`
   - `Qué sigue siendo mock`
   - `Próxima fase segura`
   - `Aprobaciones futuras`
3. Confirmá que JEFE explique:
   - si la demo local segura ya está lista
   - qué sigue siendo mock
   - qué falta para producto real

## Escenario 7: revisar aprobaciones futuras sin bloquear el flujo seguro

1. Pedí acciones sensibles, por ejemplo:
   - `npm install`
   - runtime local real
   - DB real
   - Docker
   - deploy
   - auth real
   - pagos reales
   - integraciones externas
2. Confirmá que JEFE:
   - no ejecute nada real
   - devuelva preview y aprobación controlada
   - muestre riesgo, comandos propuestos y validaciones
   - no convierta esas aprobaciones futuras en bloqueo del scaffold seguro actual

## Qué no debería pasar nunca

- `type="module"` en `frontend/index.html`
- `import` o `export` en el frontend estático generado
- `fetch` en la demo estática
- creación de `node_modules`
- creación de `.env`
- creación de `Dockerfile`
- creación de `docker-compose.yml`
- backend real escuchando puerto
- base de datos real
- deploy real

## Criterio de demo local segura

La demo se considera lista para mostrar cuando:

- abre por `file://`
- el dominio visible es coherente
- la interacción local funciona en memoria
- las fases base avanzan sin tocar runtime real
- readiness lo explica con honestidad
- las acciones sensibles quedan como aprobación futura o bloqueo explícito, nunca como ejecución real
