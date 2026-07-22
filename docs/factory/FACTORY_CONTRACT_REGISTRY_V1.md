# Factory Contract Registry v1

## Propósito

El Persistence Runtime Adapter guarda un contrato aprobado. El Registry descubre esos contratos, valida su metadata, crea entradas resumidas, detecta duplicados y conflictos, escribe un índice controlado y permite consultas gobernadas.

## Frontera pura y Node

Tipos, policies, validación, queries y serialización viven en `src/factory/contract-registry/` sin imports Node. Discovery, containment y escritura del índice viven como CJS aislado en `electron/factory/contract-registry/`; no están conectados a Electron main, preload o IPC.

## Lectura y escritura

Lee únicamente metadata con nombre `factory-project-contract.v1.meta.json` y su contrato hermano. Ignora temporales, locks, backups y archivos irrelevantes. Solo escribe `factory-contract-registry/index.v1.json` mediante temporal, rename y readback dentro del `storageRoot` autorizado en `.codex-temp`.

## Path containment

El root debe incluir el segmento exacto `.codex-temp`. Paths absolutos provenientes de metadata no son confiables; targets, metadata, temporal e índice se resuelven contra el root y no pueden contener traversal ni salir de él.

## Registry entries e index

Cada entrada conserva identidad, lineage de persistencia, fingerprint, idempotency key, paths relativos, validación y flags de seguridad. El índice ordena entradas establemente y resume estados, duplicados, conflictos, warnings y blockers sin incorporar contratos completos.

## Queries

Soporta projectId, slug, fingerprint, idempotency key, status, latest only y ready for next step. El resultado no autoriza ejecución: solo prepara selección para revisión futura por MEMORIA o un Codex Task Contract gobernado.

## Duplicados y conflictos

Se agrupan fingerprints e idempotency keys repetidos. Un mismo projectId o slug con fingerprints diferentes se considera conflicto y exige revisión humana. Ninguna entrada inválida habilita capacidades.

## Seguridad y límites

Todas las entradas fuerzan `notExecutable: true`, `codexAllowed: false`, `projectCreated: false`, `repositoryCreated: false` y `deployed: false`. El Registry no ejecuta Codex o Hermes, no crea proyectos/repositorios y no despliega.

## Ejemplo resumido

```json
{
  "registryKind": "factory-contract-registry",
  "registryVersion": "1.0",
  "entries": [{ "contractProjectId": "product-one", "status": "valid", "codexAllowed": false }],
  "duplicates": [],
  "conflicts": []
}
```

## Relación futura y próximos pasos

MEMORIA podrá almacenar receipts y decisiones validadas. Un futuro Codex Task Contract podrá referenciar una entrada seleccionada, pero el Registry nunca habilita Codex directamente. Próximos pasos: códigos de error estructurados, fingerprint readback fuerte, locking concurrente y políticas de retención del índice.
