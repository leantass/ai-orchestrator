# Escalón 8 — Git / CI / Delivery

## Estado vigente — 2026-09-25

- `ESCALON_8A_STATUS=COMPLETED`
- `ESCALON_8B_STATUS=NOT_STARTED`
- `ESCALON_8C_STATUS=NOT_STARTED`
- `ESCALON_8D_STATUS=NOT_STARTED`
- `NEXT=ESCALON_8B_DURABLE_ORCHESTRATION`

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

## Fases futuras

- 8B: persistencia durable, replay, locks, outbox y reconciliación del contrato.
- 8C: ejecución remota explícitamente autorizada y evidencia de CI/delivery.
- 8D: recovery, stale requests, incidentes y cierre operativo.
