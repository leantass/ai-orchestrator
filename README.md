# AI Orchestrator

Aplicacion desktop con React + Electron para validar un flujo local entre planificador, ejecutor y aprobacion manual.

## Modos de ejecucion

- `mock`: el ejecutor responde desde Electron con una simulacion local
- `bridge`: Electron llama al bridge local y el bridge responde en mock
- `codex`: Electron llama al bridge local y el bridge delega en `codex exec`

## Requisitos

- Node.js 20 o superior
- npm
- `codex` disponible en `PATH` para usar el modo `codex`

## Instalacion

```bash
npm install
```

## Primera ejecucion operativa

### Flujo mock

```bash
npm run desktop:dev
```

### Flujo con bridge local

```bash
npm run desktop:bridge
```

### Flujo con Codex

```bash
npm run desktop:codex
```

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

## Scripts

- `npm run dev`
- `npm run desktop:dev`
- `npm run desktop:bridge`
- `npm run desktop:codex`
- `npm run executor:bridge`
- `npm run build`
- `npm run lint`
