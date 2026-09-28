# Escalón 8 — Git / CI / Delivery

## Estado vigente — 2026-09-25

- `ESCALON_8A_STATUS=COMPLETED`
- `ESCALON_8B_STATUS=COMPLETED`
- `ESCALON_8C_STATUS=COMPLETED`
- `ESCALON_8D_STATUS=NOT_STARTED`
- `NEXT=ESCALON_8D_RECOVERY_AND_CLOSURE`

Esta especificación define el contrato y la política de 8A. No ejecuta commit, push, merge, pull request, CI remoto, release tag ni deploy.

## Separación de autoridades

`Version approved`, `delivery prepared`, `git commit prepared`, `remote push authorized`, `remote CI passed`, `release authorized` y `deploy authorized` son estados independientes. Ninguno implica automáticamente el siguiente.

## Contrato canónico

`electron/jefe-release-contract.cjs` implementa:

- `jefe-release-request/v1`;
- `jefe-ci-evidence/v1`;
- `jefe-remote-action-authorization/v1`;
- binding exacto de project/version/approval/snapshot;
- binding de repository identity, branch y HEAD;
- hash canónico del delivery manifest y hashes de artifacts;
- source immutability;
- acciones permitidas: `prepare_local_delivery`, `prepare_git_commit`, `request_ci`, `prepare_release`;
- acciones remotas separadas y explícitas: push, PR, merge, tag y deploy.

El contrato recibe evidencia durable ya resuelta por JEFE. El renderer no puede elegir filesystem paths, repository, branch, HEAD, approval, snapshot, delivery path ni resultados CI. Inputs no confiables son rechazados y las URLs remotas se sanitizan sin credenciales.

## Delivery

`prepareDelivery()` existente continúa siendo la materialización local compatible `jefe-local-delivery/v1`, con identidad de delivery y hashes SHA-256 por archivo. 8A calcula además el hash canónico del manifiesto y exige que tanto el manifiesto como cada artifact coincidan antes de preparar un release request. Si un artifact cambia, el resultado es `DELIVERY_INTEGRITY_MISMATCH`; no hay reparación silenciosa.

## Git policy

8A sólo permite leer baseline y preparar metadata. No ejecuta `git commit`, `git push`, `git merge`, `git rebase`, `git reset`, `git clean`, checkout de main ni force push. Un cambio de branch o HEAD produce `REPOSITORY_BASELINE_CHANGED`. Un futuro stage deberá aplicar una allowlist explícita y bloquear worktrees dirty fuera de ella.

## CI evidence

`LocalQualityEvidence` no es `RemoteCiEvidence`. `npm run quality:ci` local no puede convertirse en CI PASS. La evidencia remota usa `jefe-ci-evidence/v1`, con provider, workflow, repository, commit SHA, estado, timestamps, checks y fuente. `prepare_release` exige evidencia remota `github-actions` con status `passed`, commit igual al HEAD ligado y autorización de release explícita.

## Idempotencia y seguridad

El `requestId` se deriva de project/version/snapshot/approval/delivery/repository/action. Repetir exactamente la misma evidencia produce la misma identidad; cambiar cualquiera exige otra request. No se persisten secretos, tokens, API keys ni URLs con credenciales.

## QA

`scripts/jefe-release-contract-smoke.mjs` cubre aprobación exacta, aprobación stale, snapshots, delivery ausente/corrupto, artifact tampered, drift de branch/HEAD, paths y branch inyectados, acciones prohibidas, CI local versus remoto, autorización remota e idempotencia. No se ejecutó provider, Git mutation, CI remoto ni deploy.

## Escalón 8B — orquestación durable

`ESCALON_8B_STATUS=COMPLETED`. `electron/jefe-release-persistence.cjs` mantiene stores separados bajo `<root>/.jefe-release` para requests, flows, autorizaciones, outbox e índices. Los writes son stage/rename atómicos, las requests/autorizaciones/outbox son inmutables por identidad y los flows avanzan mediante CAS con revisión y allowlist de transiciones. Los locks son locales al proceso; no se afirma coordinación multiproceso ni exactly-once distribuido.

`electron/jefe-release-orchestrator.cjs` implementa replay y reconciliación explícita: reconstruye un flow faltante desde una request durable y un único intent de outbox cuando ya existe autorización válida. `prepare_local_delivery` puede comenzar sin delivery y delega la preparación local a un adapter inyectado; la integridad posterior exige manifest y hashes. `request_ci` requiere autorización durable `trigger_ci`; `prepare_release` requiere evidencia remota `github-actions` pasada, commit ligado y autorización durable `release_tag`. 8B no ejecuta Git, red, CI, release ni deploy.

La rehidratación vuelve a validar schema, identidad, hashes, bindings y referencias. JSON/schema corruptos permanecen visibles y el índice se reconstruye desde records físicos; el índice no es autoridad. El smoke `scripts/jefe-release-orchestration-smoke.mjs` cubre colisiones, CAS, drift de HEAD/branch, replay, delivery tampered, autorización cruzada, outbox duplicado, crash boundaries, corrupción y aislamiento A/B.

La configuración CI continúa siendo `CONFIGURED_BUT_LOCAL_QUALITY_GATE_FAILING`: el workflow existe, pero la deuda histórica de lint global mantiene `npm run quality:ci` bloqueado. La calidad local no se presenta como evidencia CI remota.

## Escalón 8C — ejecución explícita local y evidencia remota

`ESCALON_8C_STATUS=COMPLETED`. `electron/jefe-release-execution-contract.cjs` define `jefe-release-execution-receipt/v1` con identidad de outbox/flow/request, acción, repository, branch, HEAD ligado, estado terminal y error sanitizado. `electron/jefe-release-git-adapter.cjs` usa `execFile` con argumentos fijos: lee identidad/baseline/status, valida hashes y allowlist exacta, ejecuta commit, push fast-forward y tag local; nunca usa `shell: true`, `git add .`, force push ni combina commit con push.

`electron/jefe-release-executor.cjs` revalida request, flow, authorization, baseline e integridad antes de consumir cada intent. El claim/receipt durable evita doble dispatch dentro del proceso; un crash antes de ejecutar permite retry y un crash posterior a un commit se reconcilia sólo si el commit exacto (metadata, parent y archivos cambiados) es demostrable. De otro modo el estado queda ambiguo/bloqueado. La protección es local al proceso y no se afirma locking multiproceso.

`electron/jefe-release-remote-adapter.cjs` deja trigger CI/PR/merge desconectados por defecto. La ingestión CI sólo acepta resultados provenientes de un adapter trusted, con provider `github-actions`, workflow esperado y commit exacto para `passed`; el resultado local `quality:ci` no se convierte en CI remoto. `scripts/jefe-release-execution-smoke.mjs` acredita commit, replay, doble dispatch, allowlist, push contra bare remote, divergencia sin force, tag local, auth, crash/reconciliación, aislamiento, CI fake y sanitización. Todas las mutaciones ocurren bajo `.codex-temp/escalon-8c`; no hubo red ni provider calls.

Canary remoto real verificado el 2026-09-28: base `5cd946865f2bb8e6f08cbfcdc45b5618a43b2af5`, commit canary `d1aa579a6266bc5ff155a3a9fa266f1450c551a7`, rama temporal `canary/jefe-release-8c-5cd9468`, run GitHub Actions `36447463345`, workflow `CI`, evento `workflow_dispatch`, conclusión `failure`. La evidencia indicó la deuda Hermes histórica (`src/factory`, `npm run quality:ci`); no se fabricó PASS. `RemoteExecutionPath=VERIFIED`, `RemoteCiEvidence=VERIFIED_FAILURE`, `ReleaseGateBlockedCorrectly=PASS`, `RemoteBranchCleanup=PASS`. No hubo PR, merge, tag remoto, release ni deploy. `LiveRemoteCanary=PASS`.

## Fases futuras

- 8B: persistencia durable, replay, locks, outbox y reconciliación del contrato.
- 8C: ejecución remota explícitamente autorizada y evidencia de CI/delivery.
- 8D: recovery, stale requests, incidentes y cierre operativo.
