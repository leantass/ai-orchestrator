# Investigación supervisada (3B)

3B establece la aduana local entre el intake 3A y conectores futuros. El registro sólo reconoce `manual_reference`, metabúsqueda, navegador automatizado, crawler, modelo local, análisis estructurado y corroboración; registrado no significa configurado, disponible, conectado ni ejecutado.

La política confiable controla rol, propósito, presupuesto, límites y URLs HTTPS. La red permanece deshabilitada y ningún caller, renderer, agente ni contenido externo puede elevar capacidades, credenciales, proveedores o presupuesto. La validación URL es sintáctica/offline: el futuro connector deberá repetir la defensa SSRF tras DNS y redirects.

Las solicitudes y receipts son contratos cerrados y correlacionados. Un receipt es contenido `UNTRUSTED_EXTERNAL_CONTENT`, no evidencia ni verdad. El gate exige correlación, receipt válido, procedencia y corroboración independiente; evidencia aceptada sólo significa admisible para contexto técnico, nunca aprobación humana ni verdad absoluta. Contradicciones quedan `requires_human` para Lean.

La persistencia durable conserva sesiones, receipts inmutables, decisiones de evidencia, presupuesto y operaciones pendientes mediante escritura atómica. Un fallo al añadir a MEMORIA deja `evidence_pending`; replay/reconciliación sólo repite el append faltante. Corrupciones quedan aisladas y no se sobrescriben. MEMORIA sigue siendo el único contexto append-only; 2D conserva la autoridad de recuperación y conflictos.

Estados operativos: `prepared`, `policy_blocked`, `awaiting_provider`, `not_connected`, `evidence_pending`, `needs_corroboration`, `requires_human`, `completed_with_evidence`, `completed_without_evidence` y `failed`. No hay proveedor real conectado, red, navegador, shell, lifecycle, deploy ni evidencia externa real.
