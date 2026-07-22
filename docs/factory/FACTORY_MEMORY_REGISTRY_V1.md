# Factory Memory Registry v1

## Propósito y frontera Node

Memory Persistence Runtime escribe records; Memory Registry los descubre, cataloga y consulta. La API pura de tipos, policies, validación y serialización vive en `src`. Discovery, filesystem, índice y queries runtime viven aislados en `electron/factory/memory-registry/`; no hay integración con Electron runtime, preload o IPC.

## Lecturas y escrituras

Lee records `*.v1.json`, metadata `*.v1.meta.json` e índices project-scoped bajo `factory-memory/projects/`. Solo escribe `factory-memory-registry/index.v1.json`, mediante temp, rename y readback, dentro del mismo `storageRoot` en `.codex-temp`. Nunca modifica records o metadata.

## Containment y entries

El root debe contener `.codex-temp`. Logical targets son relativos, sin traversal y con prefijo `factory-memory/projects/`. Cada entry conserva identity, namespace, lineage, fingerprint, idempotency y flags fail-closed, sin copiar el payload completo.

## Project indexes, registry index y queries

El registry descubre `index.v1.json` por proyecto y genera un índice estable con entries, duplicates, conflicts y orphans. Queries soportan project namespace, namespace, record ID/kind, fingerprint, idempotency, status, latest y readiness.

## Duplicates, conflicts y orphans

Detecta fingerprints e idempotency keys duplicados, identidades mapeadas a namespaces/fingerprints incompatibles, metadata sin record y records sin metadata. No repara ni elimina artefactos.

## Seguridad y límites

No crea DB/vector store, embeddings, Codex Task, proyecto o repo; no ejecuta Hermes/Codex ni despliega. Todos los resultados mantienen esas capacidades deshabilitadas. No es aún un integrity gate profundo.

## Relaciones futuras

Un Memory Registry Integrity Gate deberá recalcular fingerprints, comparar payload/metadata/índice y decidir qué records pueden alimentar un Codex Task Contract Gate separado.

## Ejemplo

```json
{"registryKind":"factory-memory-registry","registryVersion":"1.0","summary":{"totalEntries":2,"orphanCount":0},"recommendedNextStep":"Memory Registry Integrity Gate"}
```

## Próximos pasos

Crear el integrity gate de memory records antes de habilitar cualquier consumo posterior.
