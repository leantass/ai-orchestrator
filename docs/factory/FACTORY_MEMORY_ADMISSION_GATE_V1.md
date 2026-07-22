# Factory Memory Admission Gate v1

## Propósito

Factory Memory Admission Gate v1 transforma un reporte verificado de Registry Integrity en drafts canónicos, project-scoped y todavía no persistibles. Registry descubre; Integrity verifica; Memory Admission decide qué podría entrar a una futura MEMORIA runtime.

## MEMORIA canónica y namespaces

La memoria debe ser versionada, trazable, libre de secretos y separada por proyecto. `factory` queda reservado para conocimiento global. Los contratos usan `factory/projects/<slug-or-projectId>/contracts`; los espacios futuros incluyen `decisions` y `evidence`. Los namespaces son rutas lógicas relativas con `/`, nunca paths filesystem, y rechazan vacío, raíz absoluta y `..`.

## Record drafts

Una entry limpia con `canUseForMemory: true` produce un `factory_project_contract` draft. Conserva referencias, fingerprint, idempotency key, identidad y lineage disponible, pero no copia contrato completo, env vars, evidencia cruda ni secretos. El draft bloquea Codex Task, proyecto, repositorio, deploy y promoción global.

## Admisión, rechazo y bloqueo

- Clean + habilitada para memoria: draft project-scoped.
- Finding crítico: rechazo.
- Entry no limpia o no habilitada: bloqueo.
- Duplicado exacto project/fingerprint: warning controlado para deduplicación.
- Mismo proyecto con fingerprint distinto: posible contradicción y bloqueo para revisión.

## Contradiction, stale y replacement

V1 no resuelve contradicciones, no reemplaza y no borra memoria. Un reemplazo futuro debe marcar el registro previo como stale antes de promoción, conservar lineage y requerir resolución gobernada. La promoción a `factory` exige revisión humana futura y está deshabilitada por defecto.

## Qué no hace

No escribe memoria real, no crea base de datos, no usa embeddings ni OpenAI, no usa filesystem, no ejecuta Hermes o Codex, no crea proyecto o repositorio y no despliega. `canWriteMemory` y `canCreateCodexTask` son siempre `false` en v1.

## Relación futura

Un Memory Runtime Adapter separado podrá validar y persistir drafts aprobados. Un Codex Task Contract futuro deberá consumir memoria ya gobernada mediante otro gate; este módulo nunca habilita Codex directamente.

## Ejemplo

```json
{
  "admissionKind": "factory-memory-admission",
  "admissionVersion": "1.0",
  "recordDrafts": [{ "namespace": "factory/projects/example/contracts", "scope": "project", "globalPromotionAllowed": false, "codexTaskAllowed": false }],
  "canWriteMemory": false,
  "canCreateCodexTask": false
}
```

## Próximos pasos

Definir revisión humana de promoción, resolución de contradicciones y un Memory Runtime Adapter con persistencia reversible antes de diseñar cualquier consumo por Codex Task Contract.
