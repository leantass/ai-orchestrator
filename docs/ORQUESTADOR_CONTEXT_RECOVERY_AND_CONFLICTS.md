# Recuperacion y conflictos de MEMORIA (2D)

`ESCALON_2D_STATUS=COMPLETED`. La recuperacion es una autoridad interna unica: `diagnose`, `planRecovery`, `executeRecovery` y `getRecoveryStatus`. Diagnostica de forma read-only y determinista; sus reportes contienen solo estado, proyecto, codigos allowlisted, recuperabilidad, autoridad requerida y proximo paso. No exponen roots, paths, payloads, stacks ni secretos.

| Dato | Fuente de verdad | Derivado | Recuperacion permitida | Prohibido |
| --- | --- | --- | --- | --- |
| Manifest/version y ledger | Artefactos fisicos | Indice de proyectos | reconstruir indice desde manifests validos | alterar manifest/ledger o restaurar version |
| Eventos de MEMORIA | Event log valido append-only | Snapshot e indice contextual | reconstruir proyecciones | sobrescribir, borrar o inventar evento |
| Outbox e intentos | Trabajo durable | Estado de salud | retry compatible/reconciliacion | convertir fallo permanente en exito |
| Conflicto humano | Entradas originales y resolucion append-only | Estado vigente | defer o resolver por frontera humana | fusionar/overwrite automatico |
| Referencias HTTPS | Dato no verificado | Ninguno | preservar como referencia | DNS, fetch o evidencia inventada |

El plan es determinista, con `planId`, fingerprint, precondiciones y operaciones cerradas: reconstruir proyecciones contextuales, reconstruir indice de proyectos, reintentar contexto lifecycle o reconciliar resultados pendientes. Se vuelve stale ante cambio de precondiciones y no acepta operaciones, proyecto, IDs ni roots del caller.

Las fuentes canonicas corruptas se preservan y quedan `blocked`/`corrupt`; no se reconstruyen por inferencia. Colisiones incompatibles permanecen pendientes de resolucion humana. La resolucion interna permite `defer`, `accept_existing`, `supersede_with_correction` e `invalidate`; crea una entrada nueva `human_decision`, conserva la historia y es idempotente para replay identico. La autoridad semantica esta preparada, pero la autenticacion del operador y su superficie UI quedan pendientes; no existe verificacion humana end-to-end.

`RETENTION_MODE=CONSERVATIVE_NO_AUTOMATIC_DELETION`: no hay purga de eventos, decisiones, conflictos, manifests, ledger ni intentos. Snapshot e indices son reconstruibles. No hay UI, IPC adicional, red, agentes reales, runners, QA visual, deploy, vector database ni resolucion automatica de conflictos.

El smoke `jefe-context-recovery-resolution-smoke.mjs` cubre 54 casos de diagnostico, plan, recuperacion, corrupcion, conflictos, aislamiento A/B, retencion, salud y reapertura.
