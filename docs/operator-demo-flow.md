# Flujo de Demo para Operador

## Objetivo

Esta guía sirve para mostrar JEFE como orquestador local seguro: planifica, materializa una demo estática rica, deja continuidad por fases y no ejecuta nada sensible sin aprobación explícita.

## Escenario recomendado

Usá un pedido que obligue a JEFE a demostrar dominio, continuidad y seguridad:

> Haceme un sistema fullstack local para una veterinaria, con clientes, mascotas, turnos, recordatorios, reportes e inventario básico. Quiero una demo local segura con datos mock, sin instalar dependencias, sin levantar backend real, sin crear base de datos real y sin tocar integraciones externas.

También podés usar otras verticales ya soportadas:

- reservas y canchas
- ecommerce y catálogo
- inmobiliaria y propiedades
- sistema documental y vencimientos
- gestión escolar y familias
- seguridad, accesos y sensores
- comunidad social y grupos
- gestión operativa genérica

## Recorrido sugerido

1. Confirmá que JEFE elija un delivery level seguro y devuelva blueprint, roadmap y siguiente paso.
2. Revisá el plan escalable y usá el CTA principal para preparar la materialización fullstack local.
3. Ejecutá la materialización segura.
4. En el cierre, verificá:
   - carpeta creada
   - operaciones aplicadas
   - validaciones
   - ruta de `frontend/index.html`
   - próxima fase segura recomendada
5. Abrí `frontend/index.html` con doble click.
6. Confirmá que la demo carga por `file://`, sin servidor, sin `npm install` y sin pantalla blanca.
7. Recorré la demo y validá que muestre una vertical real, no un scaffold genérico vacío.

## Qué debería mostrar una demo rica

- header o hero operativo
- métricas mock visibles
- navegación local por secciones
- listas o tablas claras
- panel de detalle o selección
- alertas o pendientes
- actividad reciente
- mensaje explícito de modo local seguro
- al menos dos o tres interacciones locales en memoria

## Qué probar dentro de la demo

- cambiar de sección
- buscar o filtrar
- seleccionar una entidad
- cambiar un estado mock
- marcar un pendiente como revisado
- detectar stock bajo, alerta o vencimiento según el dominio

## Continuidad esperada después del scaffold

Después de materializar `fullstack-local`, JEFE debería recomendar esta cadena segura:

- `frontend-mock-flow`
- `backend-contracts`
- `database-design`
- `local-validation`
- `review-and-expand`

El operador no debería ver esas restricciones como bloqueos actuales:

- sin instalar dependencias
- sin backend real
- sin DB real
- sin Docker
- sin deploy

Eso debe quedar como restricción respetada o aprobación futura, no como algo que impide el flujo seguro.

## Cómo leer readiness

JEFE debería poder decir con claridad si el proyecto está:

- en planificación
- con scaffold creado
- con frontend mock listo
- con backend contracts listos
- con database design listo
- con validación local lista
- listo para demo local segura
- todavía no listo para producto real

## Cuándo hay una aprobación real

Una aprobación real aparece recién cuando el operador pide salir del modo seguro, por ejemplo:

- `npm install`
- levantar runtime real
- conectar DB real
- correr migraciones o seeds reales
- Docker
- deploy
- auth real
- pagos reales
- integraciones externas

En esos casos JEFE tiene que mostrar preview, riesgo, comandos propuestos y validaciones, pero no ejecutar nada todavía.

## Checklist de demo salió bien

- el wizard no se rompió
- el plan escalable fue entendible
- el CTA para preparar materialización se vio como acción principal
- el scaffold se abrió por `file://`
- la demo mostró contenido específico del dominio
- la continuidad recomendó la siguiente fase segura
- readiness explicó qué ya está listo y qué sigue siendo mock
- las aprobaciones futuras no aparecieron como bloqueo actual
- no apareció ningún botón peligroso para ejecutar runtime real

## Si algo sale mal

1. Revisá `jefe-project.json` para ver fases, módulos y `nextRecommendedPhase`.
2. Revisá `docs/local-runbook.md` dentro del proyecto generado.
3. Corré:
   - `npm run ai-planner-smoke`
   - `node scripts/ai-release-smoke.mjs`
   - `node scripts/ai-operator-e2e-smoke.mjs`
4. Confirmá que no se hayan creado `.env`, `node_modules`, `Dockerfile` ni `docker-compose.yml`.

## Qué no probar todavía

- `npm install` real
- dev server del proyecto generado
- backend real escuchando puerto
- base de datos real
- migraciones o seeds reales
- Docker real
- deploy real
- auth real
- pagos reales
- integraciones externas reales
