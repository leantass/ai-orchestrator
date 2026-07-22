# Factory Contract Registry Integrity Gate v1

## Propósito

Registry descubre e indexa contratos. Integrity Gate vuelve a leer contrato y metadata, recalcula sus identificadores y decide si una entrada es confiable antes de MEMORIA o de un futuro Codex Task Contract.

## Qué verifica

Comprueba existencia y JSON válido, containment, projectId/slug, metadata target, flags de seguridad, fingerprint, idempotency key, estado previo, duplicados y conflictos. No modifica contratos, metadata o índice.

## Fingerprint no criptográfico

Replica canonicalización estable y FNV-1a de 32 bits del Persistence Gate. Detecta cambios accidentales y tampering básico, pero no es firma criptográfica ni protege contra colisiones deliberadas.

## Idempotency verification

Cuando existen kind, version, projectId, approvalId, fingerprint y targetPath, recalcula la idempotency key y la compara con Registry y metadata. Si faltan campos emite warning; no inventa valores.

## Metadata versus contrato

Project ID, slug y target deben coincidir entre entry, metadata y contrato. Flags obligatorios: `notExecutable: true`, `codexAllowed: false`, `projectCreated: false`, `repositoryCreated: false` y `deployed: false`.

## Findings y severidades

Soporta info, warning, error y critical. Missing files, fingerprint mismatch, unsafe path y unsafe flags son critical. Duplicados son warning; identidades conflictivas son critical. Un entry con error/critical queda blocked y no puede usarse para MEMORIA.

## Frontera y límites

La API pura vive en `src/factory/contract-registry-integrity/`; readback vive en CJS Node aislado bajo `electron/factory/contract-registry-integrity/`. Solo lee storage roots contenidos en `.codex-temp`. Durante smoke los fixtures se escriben exclusivamente allí.

No ejecuta Codex o Hermes, no crea proyectos/repositorios, no despliega, no resuelve conflictos y `canUseForCodexTask` permanece siempre false.

## Ejemplo

```json
{
  "integrityKind": "factory-contract-registry-integrity",
  "status": "clean",
  "entries": [{ "fingerprintMatches": true, "canUseForMemory": true, "canUseForCodexTask": false }]
}
```

## Relación futura y próximos pasos

MEMORIA solo debería consumir entries clean. Un futuro Codex Task Contract requerirá otro gate explícito. Próximos pasos: firma criptográfica, registry repair gobernado, códigos de error estructurados, locking y política de revalidación/staleness.
