# Investigación supervisada (3B)

3B establece la aduana local entre el intake 3A y conectores futuros. El registro sólo reconoce `manual_reference`, metabúsqueda, navegador automatizado, crawler, modelo local, análisis estructurado y corroboración; registrado no significa configurado, disponible, conectado ni ejecutado.

La política confiable controla rol, propósito, presupuesto, límites y URLs HTTPS. La red permanece deshabilitada y ningún caller, renderer, agente ni contenido externo puede elevar capacidades, credenciales, proveedores o presupuesto. La validación URL es sintáctica/offline: el futuro connector deberá repetir la defensa SSRF tras DNS y redirects.

Las solicitudes y receipts son contratos cerrados y correlacionados. Un receipt es contenido `UNTRUSTED_EXTERNAL_CONTENT`, no evidencia ni verdad. El gate exige correlación, receipt válido, procedencia y corroboración independiente; evidencia aceptada sólo significa admisible para contexto técnico, nunca aprobación humana ni verdad absoluta. Contradicciones quedan `requires_human` para Lean.

La persistencia durable conserva sesiones, receipts inmutables, decisiones de evidencia, presupuesto y operaciones pendientes mediante escritura atómica. Un fallo al añadir a MEMORIA deja `evidence_pending`; replay/reconciliación sólo repite el append faltante. Corrupciones quedan aisladas y no se sobrescriben. MEMORIA sigue siendo el único contexto append-only; 2D conserva la autoridad de recuperación y conflictos.

Estados operativos: `prepared`, `policy_blocked`, `awaiting_provider`, `not_connected`, `evidence_pending`, `needs_corroboration`, `requires_human`, `completed_with_evidence`, `completed_without_evidence` y `failed`. No hay proveedor real conectado, red, navegador, shell, lifecycle, deploy ni evidencia externa real.

## Reparación 3B-R1: casos de evidencia entre requests

`ESCALON_3B_R1_STATUS=COMPLETED`. Cada plan recibe un `researchPlanId` compartido y un `evidenceCaseId` determinista. El caso se persiste primero en `preparing`, asocia las requests independientes de Radar, Scout y Hermes, y sólo pasa a `ready` cuando las sesiones por request quedaron durables. Un fallo parcial conserva `complete_plan` y puede reanudarse sin cambiar identidades ni perder registros.

La entrada nueva `receiveContribution` es cerrada: admite únicamente `researchRequestId`, `rawReceipt` y `claim`. El receipt se valida contra la request y su provider. El caller no entrega corroboraciones ni polaridad; el gate las reconstruye exclusivamente desde receipts y contribuciones persistidas del mismo caso. Una contribución válida queda `needs_corroboration`. Para aceptar exige claim equivalente y provider, host y hash independientes. Claims distintos se conservan como ramas contradictorias en `requires_human`, sin ganador, autoridad humana inventada ni resolución automática posterior.

El caso es la autoridad agregada reabrible. Replay con otro timestamp, reapertura en otra instancia, retry de operaciones pendientes, reconcile, concurrencia y aislamiento A/B convergen idempotentemente. Las escrituras son atómicas; colisiones y corrupción se reportan con errores allowlisted sin sobrescribir bytes, y el índice de casos/asociaciones puede reconstruirse desde los registros sanos.

Sólo el orquestador puede añadir evidencia a MEMORIA, mediante un `entryId` determinista y únicamente después de `accepted_for_context`. Un fallo de append conserva `memory_append` pendiente; retry/reconcile repiten sólo esa operación y no vuelven a evaluar con datos del caller. `receive` continúa como wrapper compatible, pero ignora cualquier corroboración suministrada externamente.

`jefe-supervised-research-evidence-case-smoke.mjs` acredita 41 casos conductuales reales y emite `CORRELATION_SMOKE=PASS`; `jefe-supervised-research-evidence-smoke.mjs` conserva 84/84. Ambos son smokes locales con contenido inyectado: no constituyen evidencia externa ni conectan red o providers reales.
