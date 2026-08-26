# Escalón 7: contrato canónico de preview y aprobación humana

`ESCALON_7_STATUS=IMPLEMENTED_PENDING_HUMAN_GATE`

`ESCALON_7_SPEC_STATUS=IMPLEMENTED_PENDING_HUMAN_GATE`

Este documento formaliza el alcance aprobado para implementar el Escalón 7. No acredita implementación ni cierre. El escalón comprende exclusivamente preview local seguro de una versión física, revisión humana explícita, aprobación o rechazo durable, retorno al paso correcto, auditoría y recovery.

## 1. Límites

Quedan fuera de este escalón: deploy, publicación, DNS, análisis remoto de URLs, proveedores externos, autenticación completa, pagos, autoaprobación, aprobación inferida por agentes y comparación visual avanzada inexistente. Ningún resultado de este escalón habilita automáticamente deploy, publicación, red, credenciales, ejecución externa o Escalón 8.

## 2. Contratos canónicos

### 2.1 PreviewRequest

```text
schemaVersion
previewRequestId
projectId
runId
versionId
resourceId
resource { relativePath, mimeType }
versionSnapshot { manifestSha256, artifactRefs[], capturedAt }
source { branch, head, worktreeId, rootKey }
policy { allowedMimeTypes[], allowlistedResourceIds[], network, remoteFrames, externalScripts }
state
revision
createdAt
updatedAt
```

`previewRequestId` es único y determinista para la identidad, recurso y fingerprint de política. `projectId`, `runId`, `versionId` y `resourceId` son obligatorios y se validan juntos. Sólo se aceptan versiones físicas existentes cuyo manifest y artefacto declarado puedan leerse y cuyo snapshot inmutable quede hasheado.

`resource.relativePath` es relativo, no puede ser absoluto, contener traversal, `file://`, origen remoto, query/fragmento arbitrario ni escapar del directorio de la versión. Los paths se derivan en backend desde identidad semántica; nunca llegan como path confiable desde renderer. MIME y recursos se validan contra allowlists cerradas. No se admiten iframe remoto ni ejecución de scripts externos.

Estados de preview: `preview_ready`, `preview_unavailable`, `preview_rejected`. No se permite saltar a revisión o aprobación desde un preview no `preview_ready`.

### 2.2 HumanReview

```text
schemaVersion
reviewId
previewRequestId
projectId
runId
versionId
reviewerIdentity
authority: human_decision
actorType: human
decision: viewed | approved | rejected | pending
reason
reviewedAt
versionSnapshotSha256
revision
createdAt
updatedAt
```

`reviewerIdentity` y `actorType=human` son obligatorios para `approved` o `rejected`; el backend no acepta que un agente, planner, QA, Codex o renderer los forje. `reason` es opcional, limitado y sanitizado. La revisión referencia exactamente una versión y el hash del snapshot revisado.

“Visto” sólo registra inspección; “pendiente” no es decisión; “aprobado” permite avanzar al siguiente gate local; “rechazado” exige retorno; ninguna decisión equivale a autenticación completa si la identidad humana real no está conectada.

La revisión humana se mantiene separada de revisión técnica de QA y de revisión comercial. QA aporta evidencia técnica; Planner aporta el plan; la revisión visual/humana decide sólo sobre el preview presentado; Lean conserva la autoridad de producto y de cualquier aprobación humana real.

### 2.3 DurableApproval

```text
schemaVersion
approvalId
reviewId
previewRequestId
projectId
runId
versionId
decision
authority: human_decision
actor { type, identity }
reason
snapshotSha256
state
expectedRevision
revision
createdAt
updatedAt
```

Estados cerrados: `pending_review`, `reviewed`, `approved`, `rejected`, `superseded`, `expired`, `blocked`. Transiciones permitidas:

```text
pending_review -> reviewed | blocked
reviewed -> approved | rejected | blocked
approved -> superseded | expired
rejected -> superseded
pending_review | reviewed -> superseded   (si la versión deja de ser vigente)
expired | blocked -> terminal
```

Una aprobación se persiste con staging + rename/readback, es idempotente para el mismo contenido e identidad, conserva historial append-only y usa CAS sobre `expectedRevision`. Un replay incompatible, snapshot distinto, aprobación de versión `superseded` o stale completion se rechaza y queda visible. Nunca se reescribe una versión anterior ni se habilita deploy automáticamente.

## 3. Seguridad y autoridad

| Actor | Puede hacer | No puede hacer |
| --- | --- | --- |
| Codex | proponer un cambio en su contrato de ejecución y recibir un rechazo/correction request | aprobar, forjar identidad humana, cambiar snapshots, abrir recursos no declarados o habilitar deploy |
| QA | producir receipts/findings técnicos y señalar que el preview no está disponible | aprobar visualmente, convertir un finding en aprobación o modificar la versión |
| Planner | entregar plan, dependencias y target de retorno | aprobar, cambiar la versión revisada o decidir por Lean |
| MEMORIA | conservar eventos y proyecciones canónicas correlacionadas | convertirse en autoridad de aprobación o sobrescribir decisiones |
| Lean | definir alcance y ejercer la decisión humana cuando la capacidad esté conectada | quedar reemplazado por inferencia de agente |
| Renderer/UI | solicitar acciones semánticas allowlisted y mostrar estados | enviar paths, filesystem, IPC libre, actor confiable o autoridad |

Prohibido para cualquier agente: autoaprobación, aprobación por texto o estado inferido, elevación de `viewed` a `approved`, acceso a credenciales, red, proveedores, `file://` arbitrario, iframe remoto, scripts externos, deploy, publicación, DNS, escritura fuera del root allowlisted o eliminación de historia.

Evidencia válida: manifest físico leído, snapshot hasheado, receipt persistido con identidad y revisión, readback, decisión humana registrada y eventos de recovery. No elevan autoridad: stdout, screenshots sin manifest, fixtures, adapters inyectados, claims del caller, estado de UI, texto de un agente, smoke aislado o resultado `pending`, `untrusted` o `not_connected`.

La autenticación humana real, identidad verificable y autorización fuera del harness quedan pendientes de una integración futura; este contrato no las simula.

## 4. Recovery y correction loop

| Situación | Resultado obligatorio | Retorno |
| --- | --- | --- |
| preview falla o recurso ausente | `preview_unavailable`, razón sanitizada, sin review | responsable de versión / Escalón 5 |
| path, MIME, origen o iframe inválido | `preview_rejected`, sin reserva ni decisión | Planner / responsable del cambio |
| versión cambia durante revisión | snapshot stale, review bloqueada; la decisión no se aplica | nuevo preview de la versión vigente |
| rechazo humano | `rejected`, razón conservada, correction request nuevo | responsable de Escalón 5 o Planner según causa |
| finding técnico o de seguridad | no aprobar; finding correlacionado y gate bloqueado | QA → responsable de Escalón 5 |
| corrupción de manifest, receipt o índice | aislar corrupción, diagnosticar sin mutar fuente, reconstruir sólo índice derivado | recovery explícito / humano si no es compatible |
| concurrencia | lock por root/proyecto y CAS; una operación gana, la otra queda visible | retry compatible o `blocked` |
| pérdida de conexión UI | conservar operación durable; lectura posterior sin mutación | reapertura por `previewRequestId`/`approvalId` |
| aprobación repetida idéntica | devolver el mismo resultado idempotente | ninguno |
| aprobación repetida incompatible | rechazar `APPROVAL_COLLISION` y conservar ambos hechos | humano / correction |
| aprobación de versión `superseded` | rechazar sin mutar la versión | nuevo preview/review de la versión vigente |

El rechazo conserva razón, actor, timestamp, snapshot y lineage; crea un nuevo ciclo con identidad nueva pero referencia al ciclo anterior. Recovery no borra registros, no repara contenido autoritativo ni ejecuta herramientas. Toda completion tardía se valida contra revisión/CAS y queda rechazada si es stale.

## 5. IPC, preload y UI

La superficie futura debe exponer únicamente operaciones semánticas allowlisted: solicitar preview por identidad, leer estado/snapshot, registrar o consultar revisión humana mediante autoridad real conectada, leer aprobación y solicitar recovery/correction. No expone `ipcRenderer`, filesystem, roots, paths, shell, comandos ni URLs arbitrarias.

La UI debe mostrar de forma distinguible preview listo/no disponible/rechazado, versión exacta y hash, “visto”, “pendiente”, “aprobado” y “rechazado”, findings técnicos separados, próximo paso y bloqueo. Debe conservar foco, labels, teclado, responsive y estados de error; la inspección visual humana y autenticación real siguen siendo gates manuales, no PASS automático.

## 6. Matriz de aceptación y estado de implementación

| ID | Requisito | Origen | Estado actual | Evidencia necesaria | Smoke posible | Validación manual | Rechazo | Responsable | Cierre exacto |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7A-01 | identidad completa de preview | decisión normativa | PASS | contrato validado con IDs correlacionados | sí, IDs ausentes/cruzados | no | `INVALID_CORRELATION` | preview | todos los IDs coinciden |
| 7A-02 | sólo versión física y snapshot inmutable | decisión normativa | PASS | manifest/artefactos existentes + hash/readback | sí, versión ausente/cambiada | no | `PREVIEW_UNAVAILABLE` o stale | preview | snapshot estable y hasheado |
| 7A-03 | recursos, MIME y paths allowlisted | decisión normativa | PASS | resolver backend y matriz negativa | sí, traversal/absoluto/MIME/file:// | no | `PREVIEW_REJECTED` | seguridad | ningún recurso fuera de allowlist |
| 7A-04 | sin iframe remoto ni scripts externos | decisión normativa | PARTIAL | política y análisis de recurso | sí, origen/script remoto | no | `REMOTE_RESOURCE_REJECTED` | seguridad | red/remoto bloqueados |
| 7A-05 | estados de preview cerrados | decisión normativa | PARTIAL | máquina de estados persistida | sí, saltos inválidos | no | `INVALID_PREVIEW_TRANSITION` | preview | sólo transiciones permitidas |
| 7B-01 | contrato de revisión humana | decisión normativa | PARTIAL | review con reviewer, actor y autoridad | sí, actor agente/ausente | sí, revisión real separada | `HUMAN_AUTHORITY_REQUIRED` | Lean/UI | decisión no implícita |
| 7B-02 | versión exacta y separación de dominios | decisión normativa | PASS | hash/versionId y receipts separados | sí, versión cruzada | sí, lectura visual | `REVIEW_SNAPSHOT_MISMATCH` | review/QA | técnica, visual y comercial no se mezclan |
| 7B-03 | visto/pendiente/aprobado/rechazado | decisión normativa | PASS | estados y eventos diferenciados | sí, elevación inválida | sí | `INVALID_REVIEW_DECISION` | review | ningún estado se eleva implícitamente |
| 7B-04 | reviewType/findings/questions y lineage | decisión normativa | PASS | tipo visual, listas sanitizadas y snapshot persistidos | 7 smoke: persistencia/normalización | sí | `INVALID_REVIEW_TYPE`/`INVALID_LIST` | review | sin autoridad enviada por renderer |
| 7C-01 | estados durable y transiciones CAS | decisión normativa | PASS | ledger append-only + revision | sí, replay/stale/collision | no | `STALE_COMPLETION`/`APPROVAL_COLLISION` | persistencia | replay incompatible visible |
| 7C-02 | atomicidad, idempotencia y reapertura | decisión normativa | PASS | staging/rename, readback, reopen | sí, crash/repeat/reopen | no | `PERSISTENCE_CORRUPT` | persistencia | misma decisión no duplica historia |
| 7C-03 | no mutación/no deploy | límites aprobados | PASS | auditoría de side effects y allowlist | sí, target deploy/path | no | `FORBIDDEN_OPERATION` | seguridad | ningún approval habilita externo |
| 7D-01 | recovery corrupción/concurrencia | decisión normativa | PASS | diagnóstico, rebuild índice, locks | sí, corrupción/A-B/race | no | `RECOVERY_BLOCKED` | recovery | fuente autoritativa no se reescribe |
| 7D-02 | rechazo y correction loop | decisión normativa | PASS | correction request + lineage | sí, causas y targets | no | `INVALID_RETURN_TARGET` | Planner/5 | nuevo ciclo conserva razón e historia |
| 7D-03 | pérdida UI y stale completion | decisión normativa | PASS | lectura posterior + CAS | sí, desconexión/completion tardía | no | `STALE_COMPLETION` | persistencia/UI | operación durable y visible |
| 7C-04 | UI accesible/responsive y evidencia separada | decisión normativa | PARTIAL | checks estáticos, manifest visual y gate manual | parcial, estructura/overflow | sí, foco/legibilidad/táctil | `VISUAL_REVIEW_REQUIRED` | UI/Lean | no declarar visual PASS sin revisión |
| 7-CLOSE | todos los criterios y límites auditados | decisión normativa | PARTIAL | batería 7A–7D, regresiones, matriz y aprobación humana cuando corresponda | sí + manual | sí | cualquier criterio pendiente bloquea | responsable Escalón 7 | `ESCALON_7_STATUS=VERIFIED_CLOSED` sólo con evidencia completa |

## 7. Estado de implementación

La implementación local de 7A–7D está integrada y validada por el smoke `jefe-preview-approval-7-smoke.mjs` (32 casos), syntax checks, ESLint focal, typecheck y build. Se cubren pending_review, reviewed, approved, rejected, superseded, blocked, expired, CAS concurrente, corrupción aislada, idempotencia, stale completion, rechazo, aislamiento, política remota y persistencia normalizada de reviewType/findings/questions. La autoridad humana real y el renderer Electron/preload siguen siendo gates externos; por ello el estado correcto permanece `ESCALON_7_STATUS=IMPLEMENTED_PENDING_HUMAN_GATE`. `ESCALON_8_STATUS=NOT_STARTED`.


La especificación queda lista para implementación (`READY_FOR_IMPLEMENTATION`), pero el código del Escalón 7 aún no fue iniciado. La fundación existente de preview `external_only` y aprobación local se conserva como antecedente y no se promociona automáticamente a este contrato. `ESCALON_8_STATUS=NOT_STARTED`.

Siguiente goal exacto: implementar 7A–7D sobre estos contratos, crear los smokes numerados de la matriz, ejecutar regresiones de Escalones 1–6, validar la vía visual silenciosa si existe, actualizar la documentación y cerrar sólo si todos los criterios pasan.
