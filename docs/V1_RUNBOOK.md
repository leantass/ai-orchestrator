# JEFE / AI Orchestrator - V1 Runbook

## Objetivo

Este runbook explica como operar la V1 local de JEFE de forma segura, demostrable y sin ejecutar herramientas externas reales.

## Como correr la app

Desde la raiz del repo:

```bash
npm run dev
```

Para validar build local:

```bash
npm run build
```

No hace falta abrir Electron para validar este cierre V1.

## Como correr quality

Suite completa:

```bash
npm run quality:ci
```

Smoke V1:

```bash
node scripts/v1-release-smoke.mjs
```

Smokes externos criticos:

```bash
node scripts/orchestrator-external-tool-execution-permit-bundle-smoke.mjs
node scripts/orchestrator-external-tool-human-approval-record-smoke.mjs
node scripts/orchestrator-external-tool-manual-execution-packet-smoke.mjs
node scripts/orchestrator-external-tool-readiness-review-smoke.mjs
```

## Scripts principales

- `scripts/ai-quality.mjs`: suite release candidate local.
- `scripts/ai-planner-smoke.mjs`: casos del planificador.
- `scripts/ai-release-smoke.mjs`: readiness de release.
- `scripts/ai-operator-e2e-smoke.mjs`: flujo operador end-to-end.
- `scripts/generated-domain-delivery-history-ledger.mjs`: ledger de revision/correccion.
- `scripts/orchestrator-tool-worker-registry.mjs`: registry y matching de workers.
- `scripts/orchestrator-local-smoke-worker.mjs`: smoke runner local seguro.
- `scripts/orchestrator-external-tool-execution-permit-bundle.mjs`: paquete final de permiso externo.
- `scripts/v1-release-smoke.mjs`: cierre V1.

## Como hacer una revision

1. Preparar o reutilizar el objetivo.
2. Generar plan.
3. Revisar approvals pendientes.
4. Autorizar solo scopes seguros.
5. Materializar en sandbox.
6. Revisar evidencia y reporte.
7. Si hay revision, generar handoff.
8. Validar correccion con smokes.
9. Escribir o consultar ledger.

## Como generar paquetes externos

La cadena externa se usa sin ejecutar herramientas reales:

```bash
node scripts/orchestrator-planned-external-workers.mjs
node scripts/orchestrator-external-tool-approval-gates.mjs
node scripts/orchestrator-external-tool-dry-run-planner.mjs
node scripts/orchestrator-external-tool-supervised-execution.mjs
node scripts/orchestrator-external-tool-readiness-review.mjs
node scripts/orchestrator-external-tool-manual-execution-packet.mjs
node scripts/orchestrator-external-tool-human-approval-record.mjs
node scripts/orchestrator-external-tool-execution-permit-bundle.mjs
```

Los outputs deben ir a `.codex-temp` o una carpeta temporal segura.

## Que NO hacer

- No abrir Blender desde JEFE V1.
- No abrir Unity desde JEFE V1.
- No invocar MCP real desde JEFE V1.
- No escribir `.env`.
- No tocar `web-prueba`.
- No crear `node_modules`.
- No instalar dependencias.
- No hacer deploy.
- No usar Docker.
- No usar credenciales reales.
- No tocar DB productiva.
- No usar `git add .`.

## Como interpretar estados

- `ready_for_manual_supervised_execution`: candidato para ejecucion manual futura, no automatica.
- `requires_human_approval`: falta approval humano usable.
- `needs_missing_inputs`: faltan inputs, scopes, evidencia o outputs.
- `needs_more_planning`: artefactos presentes pero insuficientes o inconsistentes.
- `blocked`: riesgo duro o accion prohibida.
- `missing_artifacts`: falta un artefacto critico.
- `invalid`: datos contradictorios o corruptos.

## Flujo demo recomendado

1. Abrir la app.
2. Entrar en modo Avanzado.
3. Abrir la seccion `Cierre V1`.
4. Mostrar dashboard, pipeline, workers, approvals, ledger y limites.
5. Ejecutar `node scripts/v1-release-smoke.mjs`.
6. Ejecutar `npm run quality:ci`.
7. Mostrar que external tools reales siguen deshabilitadas.

## Checklist antes de release

- [ ] `git status --short` limpio antes de empezar.
- [ ] `node scripts/v1-release-smoke.mjs` pasa.
- [ ] Smokes criticos externos pasan.
- [ ] `npm run quality:ci` pasa.
- [ ] No hay cambios en `.env`, `web-prueba`, packages, Docker ni `electron/main.cjs`.
- [ ] CI remoto verde despues del push.

## Cierre rapido de pasada

Usar este bloque cuando el trabajo ya esta implementado y queres cerrar una pasada sin improvisar el orden:

```bash
git status -sb
git diff --check
git diff --cached --stat
npm run quality:ci
git log --oneline origin/main..HEAD
git push origin main
```

Lectura esperada:

- `git status -sb`: confirmar branch actual, ahead local y que no queden cambios sueltos antes del push.
- `git diff --check`: cortar si aparecen problemas de whitespace o formato obvios.
- `git diff --cached --stat`: revisar que el corte staged siga siendo chico y coherente.
- `npm run quality:ci`: validacion fuerte antes de empujar.
- `git log --oneline origin/main..HEAD`: auditar que los commits locales cuenten una historia clara.
- `git push origin main`: solo despues de que todo lo anterior quede verde.

Si la pasada toca wiring de quality, readiness docs o el bloque V1.8 del project operations loop, sumar tambien:

```bash
node scripts/v1-release-smoke.mjs
```
