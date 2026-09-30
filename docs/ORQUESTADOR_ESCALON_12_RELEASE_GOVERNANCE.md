# ORQUESTADOR — Escalón 12A: auditoría de governance de release

## Autoridad vigente — 2026-09-29

`ESCALON_12_STATUS=IN_PROGRESS`  
`ESCALON_12A_STATUS=COMPLETED`  
`ESCALON_12B_STATUS=NOT_STARTED`  
`ESCALON_12C_STATUS=NOT_STARTED`  
`ESCALON_12D_STATUS=NOT_STARTED`  
`NEXT=ESCALON_12B_RELEASE_GOVERNANCE_CONTRACT_AND_DECISION_ENGINE`

Esta fase audita el gobierno de release existente. No agrega una decisión durable de release, decisión de producción, proveedor, red, CI, tag, deploy, merge ni ejecución remota.

## Alcance y evidencia

El audit harness `scripts/jefe-release-governance-audit-12a.mjs` ejerce los contratos reales de request, delivery, repository baseline, flow, authorization, outbox y CI evidence en roots temporales. Su salida queda en `.codex-temp/escalon-12a/audit-report.json`; no es versionada ni autoridad por sí misma.

La auditoría confirmó:

- aprobación humana, QA y delivery son prerequisitos distintos; ninguno por sí solo es un release candidate;
- el ReleaseRequest liga proyecto, versión, snapshot de aprobación, delivery y baseline de repositorio;
- `request_ci` requiere autorización durable `trigger_ci` y produce outbox, no ejecución;
- CI `passed` sólo acepta provider `github-actions` y commit exacto; CI local no se convierte en evidencia remota;
- `prepare_release` bloquea CI fallida, exige CI remota pasada y autorización `release_tag`; no crea por sí mismo un tag;
- drift de branch/HEAD vuelve stale el flow; replay de la misma autorización/outbox es idempotente;
- los errores de acción, request, proyecto y commit se rechazan fail-closed;
- se corrigió una regresión pequeña: un flow `completed_local` puede volver a `preflight_passed` al solicitar CI, como ya esperaba la implementación de `requestCi()`.

Workflow auditado: `.github/workflows/ci.yml`, nombre `CI`, `workflow_dispatch` habilitado, Windows, Node 24, `npm ci` y `npm run quality:ci`. La deuda histórica sigue siendo `306` errores en `src/factory/*`; por eso `REMOTE_CI_QUALITY=FAILING_HISTORICAL_LINT_DEBT`, `RELEASE_READINESS=BLOCKED` y `PRODUCTION_READY=false`.

## Authority map

| Boundary | Authority | Evidence | Current outcome |
|---|---|---|---|
| Version | immutable version/snapshot | snapshot hash | prerequisite |
| Human gate | durable approval for exact version/snapshot | approval record | necessary, not release decision |
| QA | promotion-eligible quality evidence | QA record | necessary, not remote CI |
| Delivery | local manifest and artifact hashes | delivery evidence | necessary for release request |
| Repository | exact identity, branch and HEAD | repository evidence | stale protection |
| Release request/flow | durable identity and lifecycle | request/flow/outbox | current orchestration authority |
| Action authorization | request/action binding | authorization record | required per action |
| Remote CI | trusted provider/workflow/commit evidence | CI evidence | required before release preparation |
| Release decision | separate durable governance decision | absent in 12A | gap for 12B |
| Production decision | environment/target/deploy authority | absent in 12A | gap for 12B |

Human approval is not a release decision. QA is not CI. An authorization is not execution. An outbox is not execution. A receipt is not remote evidence.

## Definitions for the next contract

- `RELEASE_CANDIDATE`: exact immutable version with human approval, passing QA, local delivery, healthy/unblocked E2E lineage, a bound ReleaseRequest and repository baseline. It is not currently a durable first-class decision.
- `RELEASE_READY`: candidate plus trusted remote CI passed for the exact commit/workflow, no blocking incident, a separate release decision and exact action authorization. Current value: `false`.
- `DEPLOY_READY`: release-ready plus release artifact/tag, explicit environment/target and deploy authority/adapter. Current value: `false`; deploy remains not connected.
- `PRODUCTION_READY`: deploy completed with post-deploy verification, rollback and operational evidence. Current value: `false`.

## Authorization audit

The current authorization is immutable and bound to `requestId` and `action`, with actor/reason and creation timestamp. It does not model `expiresAt`, revocation, consumption/single-use, non-repudiation, environment or target. Repository, version, delivery and HEAD binding are principally transitive through the request and revalidated by orchestration, not independently carried as authorization fields. `git_commit` is named among remote actions although its current execution path is local and separate from push.

These are governance gaps, not permission to infer authority. No authorization is recreated by the 12A audit.

## Findings

- `P0=0`: no unauthorised action, fake CI pass, cross-project authorization, force push or hidden provider execution was demonstrated.
- `P1`: no durable `ReleaseDecision` or `ProductionDecision`; `prepare_release` currently prepares an action intent after gates rather than recording an explicit governance decision.
- `P1`: authorization lifecycle lacks explicit expiry, revocation and consumption policy.
- `P1`: deploy is an allowlisted contract action without an environment/target and production-decision model.
- `P2`: mandatory-check completeness is not a first-class CI policy; action naming distinguishes local commit and remote push imperfectly.
- Quality blocker (separate from governance): historical lint debt keeps remote quality failing and release readiness blocked.

## Closed next steps

1. `ESCALON_12B_RELEASE_GOVERNANCE_CONTRACT_AND_DECISION_ENGINE`: add durable governance snapshot, ReleaseDecision, ProductionDecision, expiry/revocation/staleness and truthful read models. Do not imply readiness.
2. `ESCALON_12C_CONTROLLED_RELEASE_GOVERNANCE_ACCEPTANCE`: controlled local acceptance, or a separately authorized canary, proving decision/action separation. No live mutation is authorized by 12A.
3. `ESCALON_12D_RELEASE_GOVERNANCE_RECOVERY_AND_FINAL_CLOSURE`: recover decisions and authorizations across stale, revoked, expired, crash and corruption boundaries, then close documentation.

Historical Escalón 8 canary evidence remains: remote execution verified, CI failed honestly, release gate blocked correctly, cleanup passed. It is evidence of mechanism and fail-closed behavior, not a release-quality pass.

`ProviderCalls=0` · `ExternalNetworkUsed=false` · `LiveGitHubPush=false` · `LiveWorkflowDispatch=false` · `LivePullRequest=false` · `LiveRemoteTag=false` · `LiveRelease=false` · `DeployPerformed=false`.
## Escalon 12B - contrato y motor de decisiones

`ESCALON_12B_STATUS=COMPLETED`.

`electron/jefe-release-governance.cjs` agrega stores locales separados para `jefe-release-governance-snapshot/v1`, `jefe-release-decision/v1`, `jefe-production-decision/v1` y el lifecycle enlazado de autorizaciones. El snapshot congela proyecto, version, E2E flow, QA, aprobacion humana, delivery, ReleaseRequest, repository/branch/commit, CI, incidentes, blockers, fingerprint y source refs.

La decision de release no ejecuta ni autoriza push/deploy. La decision de produccion no se infiere de release approval y exige evidencia de produccion para `approved`. Las decisiones validan fingerprint e identidad y quedan stale si cambia la evidencia. CI tiene una policy read-only de mandatory checks; environment governance modela `local`, `staging` y `production`; deploy governance declara `NOT_CONNECTED` y no incorpora executor.

El lifecycle compatible conserva intacto `jefe-remote-action-authorization/v1` y persiste un record paralelo por `authorizationId`, con estados `active`, `consumed`, `expired`, `revoked` y `superseded`, ademas de scope/decision/snapshot binding. `expiresAt` puede registrarse, pero la expiracion basada en reloj y la revocacion operativa completa quedan explicitamente pendientes de 12D.

Smoke: `scripts/jefe-release-governance-12b-smoke.mjs`. No hubo red, provider, CI real, release, deploy ni mutacion GitHub.

`NEXT=ESCALON_12C_CONTROLLED_RELEASE_GOVERNANCE_ACCEPTANCE`.
## Escalon 12C - controlled release governance acceptance

`ESCALON_12C_STATUS=COMPLETED`.

La aceptacion controlada usa exclusivamente `.codex-temp/escalon-12c/` y una fixture aislada que representa el flujo 11C completo: version v2, QA PASS, preview, aprobacion humana, delivery, ReleaseRequest, E2E flow, repository baseline y CI evidence. El smoke `scripts/jefe-release-governance-12c-smoke.mjs` crea el snapshot real, verifica fingerprint, deriva `candidate_ready`, persiste una `ReleaseDecision=approved` y demuestra un `ProductionDecision=blocked` por deploy no conectado.

La matriz negativa cubre QA/aprobacion/delivery ausentes, snapshot y decision stale, snapshot/decision tampered, proyecto/version/commit incorrectos, CI local disfrazada, CI remota fallida, autorizacion release_tag reutilizada para deploy, scope cruzado, lifecycle active/consumed/expired/revoked/superseded y replay consumido. La identidad derivada de las decisiones se valida contra todos sus campos inmutables.

El read model distingue `candidate`, `approved`, `blocked` y `stale`; no agrega botones ni ofrece `deploy now`. Build queda disponible como evidencia local, release readiness permanece `BLOCKED`, production readiness permanece `false`, y los 306 errores historicos de lint son un blocker global separado de la fixture.

No hubo provider, red, workflow dispatch, GitHub release, tag remoto, PR, merge, deploy ni mutacion de release. El canary 8C historico sigue interpretado como mecanismo operativo con CI fallida y release bloqueado, no como aprobacion.

`NEXT=ESCALON_12D_RELEASE_GOVERNANCE_RECOVERY_AND_FINAL_CLOSURE`.
## Escalon 12D - recovery y cierre de governance

`ESCALON_12D_STATUS=COMPLETED` y `ESCALON_12_STATUS=VERIFIED_CLOSED`.

`electron/jefe-release-governance-recovery.cjs` separa `diagnose -> derivePlan -> applyPlan`. El diagnostico valida snapshot, ReleaseDecision, ProductionDecision y authorization lifecycle sin mutar; clasifica stale, blocked, evidence missing, identity mismatch y corruption. El plan `jefe-release-governance-recovery-plan/v1` es determinista, allowlisted y ligado a `snapshotFingerprint`. `applyPlan` usa journal durable, audit history idempotente, stale protection y recovery tras crash/restart.

Recovery solo puede marcar stale, registrar estados de authorization, registrar evidencia bloqueada, preservar corruption y reconstruir health. Nunca crea approval, ReleaseDecision approved, ProductionDecision approved, QA/CI, authorization ni ejecuta push/tag/merge/deploy. No borra evidencia.

La matriz 12D cubre cambios de QA/delivery/commit, ProductionDecision stale, authorization active/consumed/expired/revoked/superseded, tamper, evidencia faltante, proyecto/version/action/environment incorrectos, replay, plan stale, crash despues de journal/audit y reapertura. El read model de health queda read-only: `releaseReadiness=BLOCKED`, `productionReady=false`, `deploy=not_connected`, `canary=historical_blocked`.

El canary remoto 8C historico conserva su interpretacion terminal: mecanismo operativo, CI real fallida, release bloqueado y sin produccion. La deuda global continua en 306 errores de lint; no se asigna a la fixture ni se declara quality ready.

`ProviderCalls=0` · `ExternalNetworkUsed=false` · `LiveReleaseMutations=false` · `DeployPerformed=false` · `NEXT=ESCALON_13A_OBSERVABILITY_AND_RELEASE_OPERATIONS`.
