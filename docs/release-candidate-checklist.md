# Release Candidate Checklist

## Objetivo

Esta guía sirve para validar JEFE como plataforma local segura y operable. El criterio de salida no es solo “generó archivos”, sino que el operador pueda entender el flujo, abrir la demo, continuar por fases seguras y distinguir con claridad qué está listo, qué sigue mockeado y qué requiere aprobación futura.

## Precondiciones

Antes de correr la demo o el smoke final:

- usar la rama esperada del repo
- confirmar que JEFE abre sin errores visibles
- partir de un workspace limpio para el proyecto a materializar
- no instalar dependencias
- no crear `.env`
- no ejecutar runtime real
- no conectar una base de datos real

## Escenario 1: pedir un sistema fullstack local

Usar un pedido que fuerce a JEFE a demostrar dominio, seguridad y continuidad. Ejemplo recomendado:

> Haceme un sistema fullstack local para una veterinaria, con clientes, mascotas, turnos, recordatorios, reportes e inventario básico. Quiero una demo local segura con datos mock, sin instalar dependencias, sin levantar backend real, sin crear base de datos real y sin tocar integraciones externas.

Verificar que JEFE:

- elija `fullstack-local`
- devuelva un plan revisable
- proponga una materialización segura
- no convierta restricciones explícitas en bloqueos actuales
- muestre el estado de MEMORIA / Context Hub como disponible o no disponible, sin romper el flujo

## Escenario 2: materializar el scaffold seguro

1. En Paso 5, usar el CTA principal para preparar la materialización.
2. Ejecutar la materialización segura.
3. Confirmar en el resultado:
   - `Scaffold fullstack local materializado`
   - carpeta creada
   - carpetas creadas
   - archivos escritos
   - validaciones OK
   - ruta exacta de `frontend/index.html`
   - próxima fase segura recomendada
   - readiness actual
   - si MEMORIA / Context Hub estuvo disponible o no

## Escenario 3: abrir la demo por file://

1. Abrir `frontend/index.html` con doble click.
2. Confirmar que la demo:
   - abre por `file://`
   - no usa `type="module"`
   - no usa `import` ni `export`
   - no usa `fetch`
   - no necesita servidor
   - no necesita `npm install`
   - no deja pantalla blanca

## Escenario 4: validar la calidad del dominio

La demo generada debe sentirse como una primera entrega local revisable, no como un cascarón vacío.

Para veterinaria, confirmar:

- `Veterinaria` como título visible presentable
- clientes o tutores
- mascotas
- turnos
- recordatorios
- inventario
- reportes
- profesionales veterinarios
- ausencia de `Clínica médica`
- ausencia de `Pediatría`
- ausencia de `Ingreso de paciente`

Para otros dominios, confirmar que no haya contaminación entre verticales.

## Escenario 5: continuidad por fases

Después del scaffold, JEFE debería poder seguir con:

- `frontend-mock-flow`
- `backend-contracts`
- `database-design`
- `local-validation`
- `review-and-expand`

Validar que cada fase:

- tenga id estable
- tenga título visible claro
- tenga objetivo y summary
- tenga `allowedTargetPaths`
- actualice `jefe-project.json`
- marque `done` cuando corresponde
- deje la siguiente fase segura como recomendada
- no vuelva a sugerir fases ya completadas

## Escenario 6: lectura de readiness

Verificar que el readiness hable en lenguaje de producto:

- `En planificación` solo antes de materializar
- `Scaffold materializado` después de crear la base real
- `Demo visual en progreso` cuando las fases base están avanzando
- `Listo para demo local segura` recién después de `local-validation`

No debería pasar:

- `En planificación` con scaffold ya escrito
- `demo lista` si todavía falta `local-validation`
- `bloqueado por seguridad` cuando el flujo actual sigue siendo seguro

## Escenario 7: autonomía y aprobaciones futuras

Cuando el operador elige un modo de baja intervención o pide “decidí vos”:

- JEFE debería resolver faltantes menores sin frenar
- debería avanzar hasta la próxima acción segura
- no debería preguntar por detalles cosméticos o menores
- debería frenar solo ante riesgo real

Las acciones sensibles futuras deben mostrarse como futuras:

- `npm install`
- runtime real
- DB real
- migraciones o seeds reales
- Docker
- deploy
- auth real
- pagos reales
- integraciones externas

## Escenario 8: MEMORIA / Context Hub

Validar dos comportamientos:

1. Si Context Hub está disponible:
   - JEFE lo muestra como contexto aplicado o disponible
   - no duplica contexto innecesario
   - no rompe el flujo
2. Si Context Hub no está disponible:
   - JEFE sigue funcionando
   - lo informa como ausencia de memoria externa
   - no lo trata como error crítico

## Escenario 9: reusable solo después de validar

La UI no debería empujar reusable demasiado temprano.

Antes de `local-validation`, el mensaje esperado es algo como:

- `Guardar como reusable después de validar`

Recién después de validación visual/local tiene sentido tratar la salida como reusable o base para variantes.

## Qué no debería pasar nunca

- `type="module"` en `frontend/index.html`
- `import` o `export` en el frontend estático
- `fetch` en la demo estática
- creación de `node_modules`
- creación de `.env`
- creación de `Dockerfile`
- creación de `docker-compose.yml`
- backend real escuchando puerto
- base de datos real
- deploy real

## Comandos de validación recomendados

- `npm run ai-planner-smoke`
- `node scripts/ai-release-smoke.mjs`
- `node scripts/ai-operator-e2e-smoke.mjs`
- `node --check electron/main.cjs`
- `node --check electron/local-deterministic-executor.cjs`

## Criterio de release candidate

JEFE queda en estado de release candidate operable cuando:

- el flujo guiado es entendible
- el scaffold se materializa en modo seguro
- la demo abre por `file://`
- el dominio visible es coherente
- la continuidad por fases funciona
- el readiness es honesto
- las aprobaciones futuras no bloquean el flujo seguro actual
- MEMORIA / Context Hub suma sin volverse un punto único de falla
- el resultado final le dice al operador qué hizo, dónde quedó y qué sigue
