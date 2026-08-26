# Escalon 6: QA, seguridad y correction loop canonicos

Estado normativo actual: `ESCALON_6_STATUS=IMPLEMENTED_PENDING_HUMAN_GATE`; `ESCALON_6A_STATUS=COMPLETED`; `ESCALON_6B_STATUS=COMPLETED`; `ESCALON_6C_STATUS=IMPLEMENTED_PENDING_HUMAN_GATE`; `ESCALON_6D_STATUS=COMPLETED`.

Este documento define el alcance canónico y registra su implementación incremental. La implementación actual no declara cierre: 6-CLOSE permanece pendiente y no modifica el estado de ningún escalón anterior ni inicia el Escalón 7.

## 1. Proposito y limites

Entrada: un cambio aislado y recuperable producido por Escalon 5, con `projectId`, `runId`, `versionId`, `executionId`, branch, HEAD, root/worktree y baseline ya validados.

Salida: evidencia durable, sanitizada, correlacionada y reproducible de QA tecnico, seguridad estatica y accesibilidad local; un gate explicito; y, si corresponde, un retorno al responsable correcto mediante correction loop.

El escalon cubre solamente:

- contrato y politica de checks locales allowlisted;
- ejecucion o registro controlado de validaciones locales sin red;
- findings de QA, seguridad y accesibilidad, con severidad y evidencia acotada;
- gates tecnicos separados por dominio;
- persistencia atomica, idempotente, recuperable y aislada por proyecto;
- retorno de una correccion a Escalon 5/Planner/Lean segun la causa, sin borrar historia;
- evidencia manual explicitamente marcada como manual.

Queda fuera: preview visual, aprobacion visual o humana end-to-end, deploy, push, CI remoto, proveedores externos, Codex real, navegadores reales, Electron, red, credenciales, SAST externo, contenedores, base productiva, telemetria y release governance. Esas capacidades pertenecen a otros escalones o requieren una decision posterior.

## 2. Clasificacion de evidencia

Cada afirmacion y cada resultado debe llevar exactamente una clasificacion:

| Clase | Significado | Puede cerrar gate |
| --- | --- | --- |
| `functional` | Comportamiento implementado y ejercido por una validacion local real, con artefacto de salida verificable | Si, segun el dominio |
| `prepared` | Contrato, politica o adapter definido, pero no ejercido contra un runtime real | No |
| `smoke_fixture` | Caso local con datos, adapter o herramienta simulada/injectada | No; prueba la forma y las reglas |
| `manual` | Inspeccion humana o accion fuera de automatizacion permitida | Solo con gate humano explicito y fuera del cierre automatico |
| `pending` | Falta evidencia, hay timeout, dependencia ausente o estado inconcluso | No |
| `rejected` | Evidencia invalida, insegura, fuera de scope, inconsistente o no correlacionada | No |

`trusted` no es un tipo libre: un resultado puede ser `trusted_local` solamente cuando el check allowlisted se ejecuto localmente, su comando y version fueron registrados, el exit code y artefactos fueron verificados, y el readback coincide con el digest persistido. Resultados de fixtures, claims del caller, outputs crudos, proveedores no conectados y resultados sin readback son `untrusted` o `rejected`.

## 3. Bloques canonicos

### 6A — contrato y politica QA/security

Define el `QaSecurityRunContract` inmutable: identidad, referencia al execution contract, baseline, scope de archivos, check catalog, politicas, limites y modo de ejecucion. Define tambien el `Finding`, `EvidenceReceipt`, `GateResult` y `CorrectionRequest`.

El contrato debe:

- aceptar unicamente la correlacion exacta `projectId/runId/versionId/executionId` y, cuando exista investigacion de origen, `evidenceCaseId`;
- exigir que el `executionId` este en un estado de Escalon 5 que permita QA y que su baseline no haya cambiado;
- derivar un `qaRunId` determinista del identity, execution, scope y policy fingerprint;
- aceptar checks de un catalogo cerrado, cada uno con dominio, comando local abstracto, paths declarados, timeout, retry y tipo de evidencia;
- rechazar shell libre, interpolacion de input, paths absolutos, traversal, roots externos, glob irrestricto, variables sensibles y artefactos fuera de scope;
- congelar el fingerprint de politica y baseline antes de cualquier check;
- distinguir `network=disabled`, `credentials=absent`, `provider=not_connected` y `browser=not_connected` como restricciones, no como PASS;
- prohibir que QA, seguridad o Codex se autoaprueben o eleven autoridad humana.

Checks iniciales permitidos para la implementacion futura: `syntax`, `eslint_focal`, `typecheck`, `build`, `diff_check`, `secret_scan_local`, `path_policy`, `command_policy`, `artifact_scope`, `accessibility_static` y `responsive_static`. Los nombres son contratos, no implican que una herramienta externa este instalada.

### 6B — persistencia y orquestacion

Persiste `qa-runs`, checks, findings, receipts, gates y correction requests bajo un root allowlisted por proyecto. Usa staging + rename, locks por root, CAS por revision, indices derivados reconstruibles y retencion conservadora.

La orquestacion solo puede:

1. cargar un execution contract cerrado y su baseline;
2. crear un QA run idempotente;
3. reservar un check allowlisted con limite de concurrencia 1 por `qaRunId`;
4. persistir el resultado sanitizado antes de derivar un gate;
5. recalcular gates desde receipts persistidos;
6. abrir o reanudar correction requests sin sobrescribir resultados anteriores.

No puede modificar el cambio, el worktree, el Planner, MEMORIA ni la decision humana por efecto lateral.

### 6C — evidencia y gates

Cada check produce un receipt estructurado, nunca stdout/stderr/pid completo ni secretos. Los dominios son independientes:

- `technical`: syntax, tipos, lint focal, build, diff y regresiones allowlisted;
- `security`: paths, comandos, secretos, scope de artefactos, dependencias declaradas y politicas de no red/credenciales;
- `accessibility`: estructura estatica, labels, focus order declarado, teclado modelado, contraste calculable desde CSS y responsive en breakpoints definidos;
- `human_approval`: registro futuro separado, siempre `not_connected` en este escalon.

Un gate queda `passed` solo si todos sus checks obligatorios tienen receipts `trusted_local` y ninguna finding bloqueante esta abierta. `smoke_fixture`, `prepared`, `manual`, `pending` y `untrusted` nunca sustituyen evidencia tecnica real.

### 6D — recovery, correccion y documentacion

Recovery diagnostica sin mutar, conserva corrupciones, reconstruye indices derivados y produce un plan determinista. Puede reanudar un check compatible o recalcular gates desde receipts validos; no inventa resultados ni elimina historia.

El correction loop selecciona retorno por causa:

| Causa | Retorno |
| --- | --- |
| contrato, identidad, scope o baseline invalidos | Planner / Escalon 5A |
| patch o cambio del producto | responsable de Escalon 5, con nuevo execution attempt |
| evidencia tecnica insuficiente o fallo de QA | Escalon 5 con correction request |
| finding de seguridad bloqueante | responsable de Escalon 5; nunca bypass automatico |
| accesibilidad/responsive no demostrados | responsable del cambio; no preview/aprobacion |
| repeticion agotada o conflicto humano | `requires_human`, sin resolver automaticamente |

El loop conserva el `qaRunId` original, crea `correctionId` y, si hay nuevo intento, mantiene lineage de `executionId`, `attemptId`, `attemptNumber` y revisions previas.

## 4. Contratos y modelos

### 4.1 QaSecurityRunContract

Campos obligatorios exactos:

```text
schemaVersion
qaRunId
projectId
runId
versionId
executionId
evidenceCaseId | null
repository { repositoryId, rootKey, branch, head, clean, sourceWorktree, worktreeId, allowlisted }
baseline { head, branch, fingerprint }
scope { paths[], artifactIds[] }
policy { network, credentials, providers, browser, maxChecks, maxConcurrency, maxDurationMs, maxRetries, maxFindings }
checkIds[]
state
revision
createdAt
updatedAt
policyFingerprint
```

`scope.paths` solo contiene paths relativos allowlisted. `artifactIds` son identificadores, nunca paths recibidos desde UI. `evidenceCaseId` puede ser null para cambios sin investigacion, pero no puede cambiar despues de crear el run.

### 4.2 Finding

```text
findingId, qaRunId, checkId, domain, ruleId, severity,
title, sanitizedSummary, location { path, line | null },
status, evidenceClass, blocking, fingerprint, createdAt, updatedAt
```

Valores cerrados: `domain = technical | security | accessibility`; `severity = info | low | medium | high | critical`; `status = open | acknowledged | corrected | waived_pending_human | rejected`; `evidenceClass` usa la tabla de clasificacion. No se persisten secretos, tokens, credenciales, contenido crudo ni comandos no allowlisted.

### 4.3 EvidenceReceipt

```text
receiptId, qaRunId, checkId, identity, policyFingerprint,
inputFingerprint, outputFingerprint, toolRef, toolVersion | null,
exitCode | null, outcome, evidenceClass, artifactRefs[],
warnings[], sanitizedSummary, startedAt, finishedAt, durationMs
```

`outcome = passed | failed | pending | rejected | not_connected`. Un resultado `passed` con `toolVersion=null`, sin input/output fingerprint o con warnings no clasificados no puede ser `trusted_local`.

### 4.4 CorrectionRequest

```text
correctionId, qaRunId, findingIds[], returnTarget, reasonCode,
attemptNumber, expectedRevision, state, scope, createdAt, updatedAt
```

`returnTarget = planner | execution | human`; `state = requested | acknowledged | applied | revalidated | blocked | closed`. `human` no significa aprobacion simulada: requiere una capacidad humana futura y queda `blocked` en este escalon.

## 5. Estados y transiciones

Estados de QA run:

`requested -> prepared -> running -> evidence_pending -> gates_pending -> passed | failed | recovery_required | blocked | not_connected`.

Retornos permitidos: `failed -> correction_requested`; `correction_requested -> prepared`; `recovery_required -> recovered | blocked`; `recovered -> prepared`. No se permite saltar de `requested` a `passed`, reabrir un `passed` sin nueva revision o mutar un `failed` a `passed` sin nuevos receipts.

Estados de check:

`planned -> reserved -> running -> passed | failed | pending | rejected | timed_out | cancelled | not_connected`; `failed | timed_out -> retryable`; `retryable -> reserved`; `cancelled` y `rejected` son terminales salvo nuevo check con identidad nueva.

Estados de gate: `not_ready`, `pending`, `passed`, `failed`, `blocked`, `not_connected`. Los gates son derivados y no aceptan patch arbitrario.

Estados de finding: `open -> corrected -> verified` o `open -> waived_pending_human`; `rejected` solo por invalidacion del receipt, nunca para ocultar un hallazgo real. `verified` requiere un nuevo receipt correlacionado.

Limites normativos: `maxConcurrency=1` por QA run; `maxRetries=2` por check; `maxDurationMs=120000` por check y `600000` por run; cancelacion linealizada; stale completion rechazado por CAS; no retry de `rejected`, `not_connected` ni `critical` sin correction request; todo timeout queda visible.

## 6. Politicas de seguridad

La politica debe bloquear antes de reservar o ejecutar cuando detecte:

- path absoluto POSIX/Windows, traversal, symlink fuera de root, root externo o archivo no declarado;
- comando fuera del catalogo, shell composition, redireccion, pipe, subshell, `git add .`, deploy, Docker, escritura fuera de staging o acceso a `.env`;
- secretos, credenciales, API keys, tokens, passwords, authorization headers o dumps en input, output, metadata o mensajes;
- artefactos no declarados, MIME inesperado, tamaño mayor al limite, digest inconsistente o receipt cruzado entre proyectos/runs;
- cambios de branch/HEAD/worktree respecto del baseline, worktree fuente, scope mutable o policy fingerprint distinto;
- claim de aprobacion humana, autoridad, exito externo, provider conectado o resultado visual no ejercido.

El escaneo local de secretos y SAST puede usar reglas internas deterministas. Semgrep, Gitleaks, Trivy, axe, Lighthouse, Playwright, Vitest y cualquier otro candidato permanecen `prepared` o `not_connected` hasta existir evidencia local de instalacion y ejecucion, sin que este documento autorice instalar nada.

## 7. QA y accesibilidad demostrables

La implementacion futura puede demostrar localmente:

- syntax/typecheck/build/diff y lint focal de archivos del scope;
- estructura DOM/JSX, labels, roles, headings, focusable order y presencia de estados de error mediante parser o smoke local;
- reglas CSS de breakpoints, overflow, tamaños minimos, contraste calculable y ausencia de `display:none` para contenido requerido;
- responsive estatico sobre una matriz declarada de breakpoints, sin afirmar screenshot, browser o validacion visual;
- regresiones del contrato, Planner, Research, MEMORIA y recovery mediante sus smokes existentes.

Solo puede declararse `manual` la inspeccion de foco real, lector de pantalla, interacción táctil, apariencia, animación, screenshot, iframe, preview y compatibilidad de navegador. Esos casos no cierran este escalon automaticamente.

## 8. Persistencia, integridad y recovery

Los registros son append-only por entidad logica. Writes usan staging + rename y readback; los indices son derivados. Locks son por root fisico dentro del proceso; no se afirma locking multiproceso. Idempotencia se define por `qaRunId`, `checkId`, `inputFingerprint` y revision esperada. Colisiones incompatibles son permanentes y visibles.

La corrupcion de un receipt o indice se aisla, se reporta y no produce PASS. A/B usa roots y project identities independientes. Recovery no borra registros, no repara contenido autoritativo y no ejecuta herramientas: diagnostica, reconstruye indices y reabre solo trabajo compatible mediante plan explicito.

## 9. Matriz de aceptacion para una futura implementacion

| ID | Requisito verificable | Evidencia requerida | Clasificacion actual |
| --- | --- | --- | --- |
| 6A-01 | contrato exacto, IDs y correlacion completa | validator + casos negativos del smoke 6 | PASS |
| 6A-02 | catalogo cerrado, scope y politica sin shell/red/secretos | validator + matriz de paths/comandos del smoke 6 | PASS |
| 6A-03 | diferencia trusted/untrusted/pending/rejected | token interno + casos de receipt del smoke 6 | PASS |
| 6B-01 | persistencia atomica, CAS, locks e idempotencia | smoke fisico con readback | PASS |
| 6B-02 | concurrencia e aislamiento A/B | smoke concurrente y roots separados + IPC A/B | PASS |
| 6B-03 | timeout, cancelacion, retry y stale completion | smoke de estados y limites | PASS |
| 6C-01 | technical/security/accessibility gates independientes | receipts y gate derivado/persistido | PASS |
| 6C-02 | SAST/secret/path/command/artifact checks locales | runner local sin shell/red | PASS |
| 6C-03 | QA tecnico y responsive/accessibility estaticos sin claim visual | checks estaticos + evidencia visual real separada; revision humana pendiente | PARTIAL |
| 6C-04 | findings sanitizados y no forjables | validator + corrupcion/secret cases | PASS |
| 6D-01 | correction loop vuelve al target correcto | smoke de retorno y lineage | PASS |
| 6D-02 | recovery conserva corrupcion e historia | diagnostico, rebuild y reapertura | PASS |
| 6D-03 | documentacion y limites honestos | docs canonicamente sincronizados | PASS |
| 6-CLOSE | todos los checks obligatorios trusted, gates pasados, sin bloqueantes, recovery probado y deuda clasificada | matriz completa repetida en limpio | PARTIAL: gate humano y workspace visual real pendientes |

## 10. Casos manuales y capacidades fuera de alcance

Requieren validacion manual: foco con teclado real, lector de pantalla, tactil, apariencia, animacion, screenshots, preview embebido, iframe, performance percibida y compatibilidad de navegador. Ninguno puede representarse como PASS por un fixture.

Permanecen fuera: red, proveedores, Codex CLI, Electron, navegador, deploy, CI remoto, credenciales, autenticacion humana end-to-end, aprobacion visual, push, observabilidad, base productiva, contenedores y release governance. La deuda Hermes del baseline se conserva como pendiente; no se corrige ni se oculta por esta especificacion.

## 11. Condicion exacta de cierre

`ESCALON_6_STATUS=VERIFIED_CLOSED` solo puede registrarse cuando:

1. 6A, 6B, 6C y 6D esten implementados y cada criterio de la matriz tenga evidencia;
2. todos los checks obligatorios del scope tengan receipts `trusted_local` o una clasificacion manual explicitamente aceptada por el gate humano correspondiente;
3. technical, security y accessibility gates esten `passed`, sin findings `high`/`critical` abiertas ni receipts `pending`, `rejected` o `not_connected` contados como PASS;
4. correction loop, retry, timeout, cancelacion, stale completion, corrupcion, recovery, concurrencia e aislamiento A/B esten ejercitados;
5. se preserve el baseline y el lineage completo, sin borrar ni reescribir historia;
6. se documenten por separado los casos manuales, la deuda Hermes y cada capacidad fuera de alcance;
7. el commit de cierre contenga la implementacion, smokes, validaciones y documentacion, sin iniciar Escalon 7.

Estado de implementación al 2026-08-26: 6A, 6B y 6D pasan sus criterios automatizables; 6C conserva `6C-03=PARTIAL` por revisión humana. Existe workspace físico QA `factory-qa-electron`, perfil `factory_typed`, y run real `qa-run-9acde2282f0d64880cce6444f4fc160b`; su snapshot visual permanece `not_ready`, con próximo paso `review_and_approve` y bloqueo `approval_required`. La evidencia v4 fue capturada desde el ejecutable Electron directo en segundo plano mediante CDP, con preload real: hub, workspace desktop 1280x820, workspace mobile 390x844, foco y estados QA. El wrapper `run-electron-runtime.mjs` sigue terminando inmediatamente en este entorno; no se presenta como runtime estable. El smoke QA Security pasa `24/24`; el smoke IPC verifica el canal semántico `runs`. El estado canónico es `ESCALON_6_STATUS=IMPLEMENTED_PENDING_HUMAN_GATE`; `ESCALON_7_STATUS=NOT_STARTED`, `NETWORK=DISABLED`, `REAL_NETWORK_CONNECTORS=NOT_CONNECTED`, `PUSH=NO`.

La superficie productiva QA/IPC está integrada en `electron/jefe-qa-security-ipc.cjs`, registrada desde `electron/main.cjs` y expuesta mediante `jefeQaSecurityBridge` en `electron/preload.cjs`. Solo ofrece canales semánticos allowlisted: no expone `ipcRenderer`, filesystem, roots, shell ni comandos. Las lecturas componen snapshots desde registros persistidos y cada operación valida la pertenencia del `qaRunId` al `projectId`.

## 12. Evidencia visual real separada del gate

El 2026-08-26 se capturó la aplicación React real servida por Vite local mediante Chrome aislado y CDP directo, sin Playwright/Puppeteer, Electron, Edge, fixtures ni imágenes generadas. El manifiesto queda en `.codex-temp/orchestrator-canonical-visual-evidence-20260826/manifest.json`.

| Vista | Dimensiones | SHA-256 | Resultado |
| --- | ---: | --- | --- |
| `01-hub-desktop.png` | 1280×820 | `957c201128acf4e3f47614e544954ab83e6017b177dd0dc540c4a9a866c7066b` | real, no uniforme, overflow horizontal 0 |
| `02-wizard-step-1-desktop.png` | 1280×820 | `c2bf84a2cdd29a3900969d89ec2c75375afe3eb2b8b80176852c283e64289b6b` | real, no uniforme, overflow horizontal 0 |
| `03-wizard-feedback-error.png` | 1280×820 | `e6d51ce0a8a54cb2d2b1ce7c9fabc48bc04566e725750be22af2654c9342521b` | feedback visible, no uniforme, overflow horizontal 0 |
| `04-materiales-referencias-desktop.png` | 1280×820 | `7d074c308d1b5364abde0684fa5112dccfff8adcf29d18016532353248c18ef3` | real, no uniforme, overflow horizontal 0 |
| `05-materiales-referencias-mobile.png` | 390×844 | `e193088f9a8c3bcd61aba5bb72d178b68bc1b680da5c73e70628747baa60ec4c` | real, no uniforme, overflow horizontal 0 |

Hallazgo corregido: `Wizard.next()` no exponía el error de campos obligatorios; ahora lo presenta en el estado `aria-live`. El análisis DOM de las vistas registró controles etiquetados, 0 overflow horizontal y foco alcanzable por Tab. La evidencia v4 contiene hub con el proyecto físico, wizard, validación, materiales desktop/mobile, workspace físico desktop/mobile, foco y viewport angosto; todas las imágenes son no uniformes. La evidencia visual no se promueve automáticamente a aprobación humana ni cierra `6-CLOSE`.
