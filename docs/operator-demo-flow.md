# Flujo Operativo Local para el Operador

## Objetivo

Esta guía sirve para mostrar JEFE como orquestador local seguro: planifica, prepara una materializacion revisable, genera una entrega funcional local rica y deja continuidad real por fases sin ejecutar nada sensible.

## Escenario recomendado

Usá un pedido que obligue a JEFE a mostrar dominio, continuidad y seguridad:

> Haceme un sistema fullstack local para una veterinaria, con clientes, mascotas, turnos, recordatorios, reportes e inventario basico. Quiero una entrega funcional local segura con datos mock, sin instalar dependencias, sin levantar backend real, sin crear base de datos real y sin tocar integraciones externas.

También podés validar otras verticales ya soportadas:

- reservas y canchas
- ecommerce y catálogo
- inmobiliaria y propiedades
- sistema documental y vencimientos
- gestión escolar y familias
- seguridad, accesos y sensores
- comunidad social y grupos
- gestión operativa genérica
- operaciones portuarias con buques, muelles y documentación

## Recorrido sugerido

1. Confirmá que JEFE elija `fullstack-local` y devuelva un plan revisable.
2. En Paso 5, usá el CTA principal:
   - `Preparar materialización fullstack local`
3. Ejecutá la materialización segura.
4. En Paso 6 y Paso 7, verificá que JEFE muestre:
   - carpeta creada
   - carpetas creadas
   - archivos escritos
   - cantidad de validaciones
   - ruta del proyecto
   - ruta exacta de `frontend/index.html`
   - próxima fase segura recomendada
   - readiness actual
   - estado de MEMORIA / Context Hub
5. Abrí `frontend/index.html` con doble click.
6. Confirmá que la entrega local carga por `file://`, sin servidor, sin `npm install` y sin pantalla blanca.
7. Recorre la entrega local y valida que muestre una vertical real, no un scaffold generico vacio.

## Paso 2: centro de contexto e insumos

Antes de pedir el plan final, el operador ya puede cargar contexto real:

- adjuntar archivos como logos, documentos, imagenes, gifs o videos
- adjuntar carpetas de assets como referencia
- seleccionar un proyecto existente y pedir analisis read-only
- elegir si quiere crear proyecto nuevo, continuar el existente o dejar que JEFE decida

Lectura esperable del operador:

- los adjuntos aparecen como metadata segura con nombre, ruta, tipo, rol inferido y nota
- el proyecto existente muestra framework, scripts, carpetas importantes, entrypoints y archivos protegidos detectados
- JEFE no lee `.env`, no ejecuta scripts y no modifica la carpeta seleccionada
- si el objetivo pide continuidad y hay carpeta seleccionada, el planner debe tratarla como continuidad real

## Que deberia mostrar una entrega local rica

- hero o encabezado operativo
- métricas mock visibles
- navegación local por secciones
- listas o tablas claras
- panel de detalle o selección
- alertas o pendientes
- actividad reciente
- mensaje explícito de modo local seguro
- mensaje claro de qué no se ejecutó
- al menos dos o tres interacciones locales en memoria

## Que probar dentro de la entrega local

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

Si el workspace ya contiene un proyecto existente con `jefe-project.json`, JEFE no debería volver a ofrecer el scaffold como primera acción. En ese caso, la lectura esperable es:

- `Proyecto existente detectado`
- carpeta detectada
- última fase completada
- próxima fase segura calculada desde el manifest actual
- continuidad sobre `frontend-mock-flow` o la fase que corresponda
- sin volver a mostrar `Preparar materialización fullstack local` como CTA principal si el scaffold ya existe

Para un caso como `fullstack-local-veterinaria/jefe-project.json` dentro del workspace activo, JEFE debería:

- leer el manifest antes de decidir la estrategia principal
- inferir readiness desde fases y archivos si el manifest vino con campos viejos
- conservar `frontend-mock-flow` como siguiente fase segura cuando el scaffold ya está `done`
- mostrar en Paso 5 que el proyecto existente fue detectado y que la continuidad sigue desde esa carpeta

Si en ese mismo workspace el operador pide una entrega nueva para otro dominio, por ejemplo operaciones portuarias con barcos y muelles, JEFE no debería pegarse a veterinaria:

- debe proponer un proyecto nuevo del dominio pedido
- no debe reutilizar `targetPath`, manifest ni fases del proyecto viejo
- no debe disparar continuidad sensible solo porque exista un `jefe-project.json`
- si el pedido es un dominio nuevo y el workspace ya tiene otro proyecto, JEFE puede mostrar el proyecto detectado como ignorado, pero no debe usarlo como plan activo ni como CTA principal

Después del scaffold base, el readiness no debería decir `En planificación`. La lectura esperable es:

- `Scaffold materializado`
- `Entrega funcional pendiente de completar`
- próxima fase segura: `frontend-mock-flow`

Cada fase segura debería poder:

- prepararse como plan revisable
- materializarse sin runtime real
- actualizar `jefe-project.json`
- dejar el siguiente paso seguro sugerido

## Cómo leer readiness

JEFE debería poder decir con claridad si el proyecto está:

- en planificación
- con scaffold creado
- con frontend mock listo
- con backend contracts listos
- con database design listo
- con validación local lista
- entrega funcional local validada
- todavía no listo para producto real

Lectura práctica:

- `Scaffold materializado`: ya existe la base real en disco, pero todavía falta completar fases seguras.
- `Entrega funcional en progreso`: el proyecto ya avanzo por una o mas fases base, pero aun no cerro `local-validation`.
- `Entrega funcional local validada`: ya paso el flujo base local y puede mostrarse como entrega mock revisable.

## MEMORIA / Context Hub

- Si Context Hub está disponible, JEFE debería mostrarlo como contexto aplicado o disponible, sin convertirlo en un bloqueo.
- Si Context Hub no está disponible, JEFE debería seguir funcionando y decirlo claro como ausencia de memoria externa, no como error crítico.
- En el resultado final conviene revisar si JEFE indica `MEMORIA / Context Hub: Disponible` o `No disponible`, para entender cuánto contexto externo usó.
- En Paso 4 también debería aparecer un panel de MEMORIA con:
  - `Reintentar conexión`
  - `Abrir MEMORIA`
  - `Levantar MEMORIA local`
- Si JEFE levanta MEMORIA, la UI debería pasar a `MEMORIA conectada` y mostrar el workspace servido y el PID local.
- Si MEMORIA expone solo API, `Abrir MEMORIA` abre el endpoint útil en `GET /v1/packs/suggested`.
- Si el uso de MEMORIA ensucia `.context-hub/events.json`, tratarlo como runtime/log y no como trabajo de código.

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

## Cuándo conviene guardar como reusable

No conviene hacerlo apenas apareció un scaffold.

La recomendación operable es:

- primero materializar el scaffold
- después revisar `frontend/index.html` por `file://`
- luego completar `frontend-mock-flow`, `backend-contracts`, `database-design` y `local-validation`
- recién ahí evaluar `Guardar como reusable`

Mientras no haya validación local cerrada, la UI debería sugerir:

- `Guardar como reusable después de validar`

## Checklist de entrega local

- el wizard no se rompió
- el plan revisable fue entendible
- el CTA principal fue claro
- el scaffold se abrió por `file://`
- la entrega mostro contenido especifico del dominio
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
5. Si el resultado dice `Scaffold materializado`, segui con `frontend-mock-flow` antes de declarar la entrega como reusable.

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

## Nota de deuda tecnica actual

- El panel de MEMORIA ya muestra el ultimo evento emitido por JEFE en la sesion.
- Si MEMORIA no estaba disponible, ese ultimo evento puede aparecer como omitido o no enviado sin marcar la corrida principal como fallida.
- El planner ya distingue mejor proyecto nuevo vs continuidad, incluso con un workspace que ya contiene otro dominio.
- `src/App.tsx` y `electron/main.cjs` siguen siendo grandes, pero hoy no bloquean esta validacion operativa local.
