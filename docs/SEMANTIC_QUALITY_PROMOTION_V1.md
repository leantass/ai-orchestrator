# Semantic Quality & Promotion V1

El coordinator evalúa el candidate real antes de cualquier promoción: semantic pre-gate, fidelidad del plan, independencia del artifact, visual y contenido. El resultado incluye identidad y hash SHA-256 de los archivos del candidate; una evaluación no puede reutilizarse silenciosamente para otro artifact. Sólo un agregado `PASS` es elegible; los fallos quedan fuera de `ProjectVersion`.

`experienceQuality` y `browserQuality` se informan honestamente como `NOT_IMPLEMENTED` en esta foundation y no se usan para declarar una capacidad inexistente como PASS.

Esta etapa valida el candidate y el gate con un root sintético. La promoción productiva al lifecycle canónico, el estado `pending_review` y el Human Gate todavía requieren integración posterior. No se usan proyectos reales ni provider.
