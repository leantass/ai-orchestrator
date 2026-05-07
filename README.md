# JEFE / Orquestador de IA Local

Aplicacion desktop con React + Electron para planificar, materializar y continuar entregas funcionales locales en modo seguro. JEFE puede trabajar aun si MEMORIA / Context Hub no esta disponible, y separa con claridad lo local-revisable de cualquier paso que requiera aprobacion futura.

## Modos de ejecucion

- `mock`: el ejecutor responde desde Electron con una simulacion local.
- `bridge`: Electron llama al bridge local y el bridge responde en mock.
- `codex`: Electron llama al bridge local y el bridge delega en `codex exec`.

## Requisitos

- Node.js 20 o superior
- npm
- `codex` disponible en `PATH` para usar el modo `codex`

## Instalacion

```bash
npm install
```

## Levantar JEFE

### Flujo local principal

```bash
npm run desktop:dev
```

JEFE espera levantar Vite en `http://127.0.0.1:5173` y Electron solo abre cuando confirma que esa URL pertenece a este repo.

### Si el puerto 5173 esta ocupado

- JEFE no debe saltar silenciosamente a `5174`.
- Vite falla con `strictPort` y `desktop:dev` corta el arranque.
- Libera el `5173` y volve a correr `npm run desktop:dev`.
- Esto evita que Electron se conecte por error a otra app vieja o a otro Vite ajeno.

### Otros modos

```bash
npm run desktop:bridge
npm run desktop:codex
```

## MEMORIA / Context Hub

- Endpoint preferido de API: `http://127.0.0.1:3210`
- Fallbacks de API: `http://localhost:3210` y `http://localhost:3710`
- Endpoints usados por JEFE:
  - `GET /v1/packs/suggested`
  - `POST /v1/events`

Desde JEFE ahora podes:

- ver si MEMORIA esta conectada, iniciando, con error o no disponible
- reintentar conexion sin bloquear el flujo
- levantar MEMORIA local desde `C:\Users\letas\Desktop\Proyectos\Desarrollo\context-hub\app`
- abrir la UI real de MEMORIA cuando Context Hub la esta sirviendo en local
- abrir un endpoint tecnico cuando solo esta disponible la API

Si Context Hub esta apagado, JEFE sigue funcionando. La UI muestra `MEMORIA no disponible` y permite seguir con el flujo.

`Levantar MEMORIA local` arranca la API de Context Hub en `http://127.0.0.1:3210`.

Si tambien hay una UI real de Context Hub sirviendose en local, JEFE la detecta y `Abrir MEMORIA` abre esa UI.

Si solo responde la API, JEFE cambia el CTA a `Abrir endpoint tecnico` y abre `http://127.0.0.1:3210/v1/packs/suggested` como vista tecnica de diagnostico.

Para tener UI real de MEMORIA, Context Hub puede levantarse aparte desde `app/` con alguno de estos caminos:

```bash
npm run dev
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

## Como interpretar el resultado final

- `Plan revisable`: todavia no se ejecutaron cambios.
- `Materializacion` o `Ejecucion completada`: ya hubo escritura local o cierre tecnico real.
- `Archivos escritos confirmados`: archivos reportados como realmente escritos.
- `Archivos previstos o tocados`: progreso parcial o materializacion que no cerro con confirmacion completa.
- `Validaciones`: separa previstas, aprobadas y fallidas.
- `MEMORIA / Context Hub`: muestra si JEFE pudo apoyarse en memoria externa o si siguio solo.

## Bridge local

El bridge recibe un JSON por `stdin` con la forma:

```json
{"instruction":"Preparar la primera ejecucion operativa para avanzar con el objetivo"}
```

Devuelve uno de estos formatos:

```json
{"ok":true,"result":"..."}
```

```json
{"ok":true,"approvalRequired":true,"approvalReason":"...","resultPreview":"..."}
```

```json
{"ok":false,"error":"..."}
```

Prueba rapida en PowerShell:

```powershell
'{"instruction":"Preparar la primera ejecucion operativa para avanzar con el objetivo"}' | node .\executor-bridge\executor-bridge.cjs
```

## Variables opcionales

- `AI_ORCHESTRATOR_EXECUTOR_MODE`
  - `mock` por defecto
  - `command` para usar el bridge local
- `AI_ORCHESTRATOR_BRIDGE_MODE`
  - `mock` por defecto
  - `codex` para delegar al CLI de Codex
- `AI_ORCHESTRATOR_EXECUTOR_COMMAND`
  - opcional
  - si no se define y el modo es `command`, Electron usa `node "./executor-bridge/executor-bridge.cjs"`

## Context Hub y Git

- No toques `.context-hub/events.json` a mano.
- Si aparece sucio en el repo de Context Hub, tratalo como runtime/log, no como codigo de producto.
- No mezclar ese archivo con commits funcionales de JEFE.
- El launcher de MEMORIA desde JEFE no debe commitear runtime logs. Si el uso de eventos ensucia `.context-hub/events.json`, dejalo fuera del commit.

## Scripts utiles

- `npm run dev`
- `npm run desktop:dev`
- `npm run desktop:bridge`
- `npm run desktop:codex`
- `npm run executor:bridge`
- `npm run ai-planner-smoke`
- `npm run build`
- `npm run lint`
