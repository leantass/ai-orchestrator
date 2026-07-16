# Factory Project Contract Persistence Runtime Adapter v1

## Propósito

El Persistence Gate prepara un plan sin efectos. Este adapter ejecuta ese plan de forma contenida para persistir un contrato aprobado durante control local. Solo acepta un `storageRoot` dentro de `.codex-temp` y nunca habilita construcción, repositorios o deploy.

## Frontera Node

Los tipos, defaults, validación y serialización puros viven en `src/factory/project-contract-persistence-runtime/`. Esa API no importa ni reexporta módulos `node:*`. El path containment y el executor filesystem viven en `electron/factory/project-contract-persistence-runtime/` como módulos CJS Node aislados, siguiendo la convención existente del repo.

No se agregan tipos Node al cliente, no se modifica `tsconfig.app.json` y el renderer/web no recibe acceso a filesystem. Esta frontera todavía no está conectada a Electron, `main.cjs`, preload o IPC. El smoke importa el executor explícitamente desde la superficie Node.

## Qué escribe y dónde

Escribe el JSON canónico del contrato y metadata mínima exclusivamente debajo del `storageRoot` aprobado en `.codex-temp`. El smoke utiliza `.codex-temp/factory-project-contract-persistence-runtime-v1/smoke/`. No escribe contratos en `src`, `docs`, Electron ni otras rutas versionadas.

## Path containment

El target procede del Persistence Gate. Debe ser relativo, no puede contener `..` ni ser absoluto. `path.resolve` y `path.relative` confirman que target, metadata, temporal, backup y lock permanecen dentro del root. Un segmento exacto `.codex-temp` es obligatorio.

## Flujo de escritura

El adapter valida el plan, crea el directorio padre, escribe con `flag: wx` un temporal, verifica su payload, realiza rename atómico, escribe metadata y verifica readback de ambos archivos. Usa únicamente `fs/promises` y `path`; no usa shell, `child_process`, red ni comandos externos.

## Idempotencia

Si target y metadata ya existen con el mismo fingerprint e idempotency key, devuelve `idempotent_noop`. Un fingerprint diferente produce `conflict_existing_contract`; nunca sobrescribe ni elimina el contrato divergente.

## Metadata

Registra IDs, fingerprint, idempotency key, target relativo, actor y fecha. Mantiene `notExecutable: true`, `codexAllowed: false`, `projectCreated: false`, `repositoryCreated: false` y `deployed: false`. No incluye contrato, env vars o secretos.

## Rollback y errores

Ante fallo intenta eliminar únicamente el temporal creado. No borra target o metadata existentes y no crea backups destructivos en v1. El resultado informa rollback y un error sanitizado; el summary no expone stacktrace.

## Qué no hace

No ejecuta Codex ni Hermes, no crea proyecto o repo, no publica, no despliega, no accede a credenciales y no convierte el contrato persistido en runtime ejecutable.

## Relación futura

MEMORIA podrá registrar receipts y resultados verificados. El Correction Loop deberá recibir conflictos o fallos. Un contract registry futuro puede indexar la persistencia, siempre con aprobación y sin habilitar Codex automáticamente.

## Ejemplo

```json
{
  "status": "persisted",
  "writeResult": { "written": true, "readbackVerified": true },
  "metadata": { "notExecutable": true, "codexAllowed": false },
  "canCreateProject": false,
  "canDeploy": false
}
```

## Próximos pasos

Agregar registry y MEMORIA como contratos separados, códigos de error estructurados, locking real probado bajo concurrencia y pruebas de fault injection, sin crear todavía proyectos o repositorios.
