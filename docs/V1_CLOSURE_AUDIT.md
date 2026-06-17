# JEFE / AI Orchestrator - V1 Closure Audit

## Resultado de auditoria

V1 queda cerrada como una herramienta local usable y demostrable para planificar, aprobar, materializar en sandbox, revisar entregas, preparar correcciones supervisadas y dejar evidencia. La app no es solo una coleccion de CLI: el panel V1 expone el mapa del producto, el flujo principal, los workers, la cadena de permisos externos, el ledger y los limites.

## Que existe

- UI principal en `src/App.tsx` con modos Simple, Avanzado y Tecnico.
- Shell y componentes reutilizables en `src/components`.
- Estado del planificador y surface de aprobaciones en `src/planner-ui-state.js`.
- Materializacion segura y diagnosticos generated-domain en `electron/generated-domain-*`.
- Revision de entrega, handoff a worker, correccion supervisada, roundtrip y history ledger.
- Worker registry seguro en `electron/orchestrator-tool-worker-registry.cjs`.
- Workers internos: Codex manual correction, local smoke runner y supervised workflow.
- Cadena externa completa para Blender, Unity y MCP futuro:
  - planned handoff
  - approval gate
  - dry-run plan
  - supervised execution design
  - readiness review
  - manual execution packet
  - human approval record
  - execution permit bundle
- Suite local de calidad en `scripts/ai-quality.mjs`.
- Smokes por dominio, sandbox, approvals, workers y external tools.

## Que se integra en V1

- Dashboard V1 visible en la app.
- Vista conceptual del pipeline:
  `Pedido -> Plan -> Approval -> Sandbox -> Materialization -> Delivery Review -> Codex Correction -> Validation -> History -> Final Report`.
- Vista de workers internos y workers externos planificados.
- Vista de approvals y permit bundle, dejando claro que no autorizan ejecucion automatica.
- Resumen navegable del ledger y de los scripts que escriben historial.
- Documentacion de runbook, limites y proximos pasos.
- Smoke `scripts/v1-release-smoke.mjs` integrado en quality.

## Que queda fuera

- Ejecucion real de Blender.
- Apertura real de Unity.
- Invocacion MCP real.
- Runner externo manual-supervisado de ejecucion real.
- Post-execution review para herramientas externas reales.
- UI completamente interactiva para generar todos los artefactos externos.
- Deploy, instalador empaquetado y DB productiva.

## Modulos principales

- `electron/generated-domain-delivery-review.cjs`
- `electron/generated-domain-delivery-worker-handoff.cjs`
- `electron/generated-domain-delivery-correction-selector.cjs`
- `electron/generated-domain-delivery-history-ledger.cjs`
- `electron/generated-domain-delivery-supervised-workflow.cjs`
- `electron/orchestrator-tool-worker-registry.cjs`
- `electron/orchestrator-local-smoke-worker.cjs`
- `electron/orchestrator-supervised-worker-workflow.cjs`
- `electron/orchestrator-planned-external-workers.cjs`
- `electron/orchestrator-external-tool-approval-gates.cjs`
- `electron/orchestrator-external-tool-dry-run-planner.cjs`
- `electron/orchestrator-external-tool-supervised-execution.cjs`
- `electron/orchestrator-external-tool-readiness-review.cjs`
- `electron/orchestrator-external-tool-manual-execution-packet.cjs`
- `electron/orchestrator-external-tool-human-approval-record.cjs`
- `electron/orchestrator-external-tool-execution-permit-bundle.cjs`

## Scripts principales

- `scripts/ai-quality.mjs`
- `scripts/ai-planner-smoke.mjs`
- `scripts/ai-release-smoke.mjs`
- `scripts/ai-operator-e2e-smoke.mjs`
- `scripts/generated-domain-delivery-history-ledger-smoke.mjs`
- `scripts/generated-domain-delivery-supervised-workflow-smoke.mjs`
- `scripts/orchestrator-tool-worker-registry-smoke.mjs`
- `scripts/orchestrator-local-smoke-worker-smoke.mjs`
- `scripts/orchestrator-supervised-worker-workflow-smoke.mjs`
- `scripts/orchestrator-external-tool-execution-permit-bundle-smoke.mjs`
- `scripts/v1-release-smoke.mjs`

## Flujo principal

1. El operador describe el pedido y los limites.
2. JEFE planifica y detecta el tipo de entrega.
3. Si hay riesgo, pide approval humano.
4. El trabajo se materializa solo dentro de sandbox aprobado.
5. La entrega se revisa con evidencia.
6. Si hace falta correccion, se genera handoff para Codex.
7. El workflow supervisado valida la correccion.
8. Los smokes verifican contratos y seguridad.
9. El ledger registra el historial.
10. La UI muestra estado, resultado y proximos pasos.

## Limites conocidos

- V1 prioriza seguridad y supervision por encima de automatizacion total.
- Algunas generaciones de artefactos siguen siendo CLI-first.
- Los artefactos de `.codex-temp` son evidencia local no versionada.
- External tools quedan en modo permiso/preparacion; no se ejecutan.
- `executionAllowed` y `automaticExecutionAllowed` permanecen `false` para herramientas externas.

## No ejecucion real externa

V1 no abre Blender, no abre Unity y no invoca MCP. La cadena externa prepara paquetes, permisos, evidencias esperadas y validaciones posteriores para una ejecucion manual supervisada futura.

## Checklist de cierre

- [x] UI V1 visible.
- [x] Flujo principal explicado.
- [x] Workers internos y externos visibles.
- [x] Approvals y permits explicados.
- [x] Ledger expuesto conceptualmente.
- [x] Docs V1 creadas.
- [x] Smoke V1 creado.
- [x] Smoke V1 integrado en quality.
- [x] External tools reales deshabilitadas.
- [x] Sin cambios en `.env`, `web-prueba`, `node_modules`, Docker ni packages.
