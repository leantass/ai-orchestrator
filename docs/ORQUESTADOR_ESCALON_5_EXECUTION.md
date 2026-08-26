# Escalon 5: ejecucion segura canonica

Estado: `ESCALON_5_STATUS=VERIFIED_CLOSED`.

## Bloques y cierre

| Bloque | Alcance | Evidencia |
| --- | --- | --- |
| 5A | Contrato, correlacion `project/run/version/plan/execution`, catalogo cerrado, argumentos estructurados, permisos derivados, repositorio/branch/HEAD/root/worktree allowlisted, baseline y limites | `electron/orchestrator-canonical-execution-contract.cjs`; `scripts/orchestrator-canonical-execution-5a-smoke.mjs` |
| 5B | Persistencia durable, staging canonico, CAS por revision, estados, cancelacion, colisiones, replay e indice reconstruible | `electron/orchestrator-canonical-execution-persistence.cjs`; `scripts/orchestrator-canonical-execution-5b-smoke.mjs` |
| 5C | Gate Planner cerrado, adaptador controlado, resultado tecnico sanitizado y append posterior via API canonica de MEMORIA | `electron/orchestrator-canonical-execution-service.cjs`; `scripts/orchestrator-canonical-execution-5c-smoke.mjs` |
| 5D | Diagnostico read-only, corrupcion aislada, reconstruccion conservadora, recovery y reconciliacion documental | `scripts/orchestrator-canonical-execution-5d-smoke.mjs`; documentos canonicos de estado/arquitectura/auditoria |

## Flujo autoritativo

`Planner cerrado -> gate -> politica de repositorio/worktree -> prepared/waiting_for_authority -> adaptador controlado -> resultado tecnico no autoritativo persistido -> MEMORIA.append -> siguiente responsable Lean`.

El contrato no acepta shell libre, comandos fuera del catalogo, paths absolutos o entregados como roots, traversal, worktree fuente, variables sensibles, stdout/stderr, PID, secretos ni claims de aprobacion, QA, deploy o publicacion. Los errores se reducen a codigos allowlisted y un mensaje publico fijo.

El adaptador `codex-cli` queda `not_connected`: no hay ejecucion real de Codex CLI, proveedor externo, navegador ni runner autorizada en este escalon. `completed_unverified` representa exclusivamente un resultado tecnico sanitizado y nunca evidencia de entrega.

## Estados

La maquina durable cubre `requested`, `policy_blocked`, `prepared`, `waiting_for_authority`, `running`, `cancel_requested`, `cancelled`, `timed_out`, `interrupted`, `failed_transient`, `failed_permanent`, `completed_unverified`, `recovery_required`, `recovered` y `not_connected`. Retry conserva el registro original y se modela como nuevo intento correlacionado en la siguiente revision del contrato; ninguna lectura elimina corrupciones.

No se agrega UI ni IPC: el roadmap vigente de Escalon 5 define ejecucion segura y no una superficie visible. Escalon 6 permanece sin iniciar porque el roadmap solo enuncia su proposito QA/seguridad y no define bloques ni criterios operables.

## Correccion de auditoria 2026-08-26

Persistencia 5B ahora rechaza patches de transicion fuera de la allowlist `adapter`/`technicalResult`, evitando que una transicion altere identidad, repositorio, baseline, permisos o lineage. El smoke 5B cubre esta frontera con un caso adversarial y confirma que la identidad durable permanece intacta.
