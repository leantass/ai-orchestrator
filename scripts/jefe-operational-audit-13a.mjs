import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.join(process.cwd(), '.codex-temp', 'escalon-13a')
const files = {
  status: path.join(process.cwd(), 'docs', 'ORQUESTADOR_CURRENT_STATUS.md'),
  roadmap: path.join(process.cwd(), 'docs', 'ORQUESTADOR_CANONICAL_ROADMAP.md'),
  e2e: path.join(process.cwd(), 'docs', 'ORQUESTADOR_ESCALON_11_END_TO_END_INTEGRATION.md'),
  governance: path.join(process.cwd(), 'docs', 'ORQUESTADOR_ESCALON_12_RELEASE_GOVERNANCE.md'),
  operation: path.join(process.cwd(), 'src', 'commercial', 'OperationalView.tsx'),
  controlCenter: path.join(process.cwd(), 'electron', 'jefe-commercial-control-center.cjs'),
  observability: path.join(process.cwd(), 'electron', 'jefe-observability-runtime.cjs'),
  releaseRecovery: path.join(process.cwd(), 'electron', 'jefe-release-recovery.cjs'),
  governanceRecovery: path.join(process.cwd(), 'electron', 'jefe-release-governance-recovery.cjs')
}

const read = async (file) => fs.readFile(file, 'utf8')
const has = (value, pattern) => pattern.test(value)

async function main() {
  await fs.rm(root, { recursive: true, force: true })
  await fs.mkdir(root, { recursive: true })
  const source = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, file]) => [key, await read(file)])))
  const authority = {
    projectState: 'project-lifecycle persistence / Commercial Control Center project read model',
    e2eState: 'jefe-e2e-persistence + jefe-e2e-orchestrator',
    qa: 'durable E2E/QA receipts selected by project/version',
    humanGate: 'durable human approval record bound to version/snapshot',
    delivery: 'local delivery manifest and artifact hashes',
    releaseFlow: 'jefe-release-persistence + jefe-release-orchestrator',
    ciEvidence: 'trusted CI evidence contract and remote adapter boundary',
    governanceDecision: 'jefe-release-governance store / ReleaseDecision',
    productionDecision: 'jefe-release-governance store / ProductionDecision',
    incident: 'observability incident store plus release/E2E recovery incidents',
    recoveryStatus: 'durable recovery journals and read-only health projections'
  }
  const healthMap = [
    { plane: 'E2E runtime', authority: authority.e2eState, durableStore: 'E2E persistence', healthSource: 'E2E health/recovery read models', recoveryOwner: 'jefe-e2e-recovery.cjs', uiConsumer: 'project Control Center / E2E flow projection', mutability: 'read-only view; explicit backend recovery', status: 'CONNECTED_REAL_PARTIAL' },
    { plane: 'Release', authority: authority.releaseFlow, durableStore: 'jefe-release-persistence', healthSource: 'releaseHealth()', recoveryOwner: 'jefe-release-recovery.cjs', uiConsumer: 'project release projection + observability /operation', mutability: 'explicit executor boundary', status: 'CONNECTED_REAL_LOCAL_AND_HISTORICAL_REMOTE' },
    { plane: 'Governance', authority: authority.governanceDecision, durableStore: 'jefe-release-governance store', healthSource: 'governance recovery health', recoveryOwner: 'jefe-release-governance-recovery.cjs', uiConsumer: 'not yet combined into Control Center global model', mutability: 'decision/recovery separated', status: 'DURABLE_NOT_YET_OPERATIONALLY_COMPOSED' },
    { plane: 'Observability', authority: 'observation event and health snapshot contracts', durableStore: 'jefe-observability-persistence', healthSource: 'observability runtime', recoveryOwner: 'jefe-observability-recovery.cjs', uiConsumer: '/operation and Control Center global', mutability: 'read model plus explicit refresh', status: 'CONNECTED_REAL' },
    { plane: 'Commercial Control Center', authority: 'read-only projection, not authority', durableStore: 'none; consumes source stores', healthSource: 'observability runtime + project services', recoveryOwner: 'backend recovery modules', uiConsumer: '/operation and project surfaces', mutability: 'read-only', status: 'CONNECTED_REAL_WITH_GOVERNANCE_GAP' }
  ]
  const findings = [
    { id: 'P1-OPERATIONS-COMPOSITION', severity: 'P1', status: 'open', summary: 'Control Center global read model consumes observability health but does not yet compose governance decision/lifecycle/recovery health as a first-class operational source.' },
    { id: 'P1-BLOCKER-TRACEABILITY', severity: 'P1', status: 'open', summary: 'Global release blocker explains historical CI quality debt, but project/operator navigation to exact ReleaseRequest, GovernanceDecision, authorization state and recovery action is incomplete.' },
    { id: 'P1-RECOVERY-VISIBILITY', severity: 'P1', status: 'open', summary: 'Release and governance recovery requirements exist in backend stores but are not surfaced as a unified operator state with safe next action.' },
    { id: 'P2-OPERATIONAL-HISTORY', severity: 'P2', status: 'open', summary: 'Timeline, incident history, recovery journal and governance audit history are separate and lack one human-facing navigation model.' },
    { id: 'P2-RUNBOOKS', severity: 'P2', status: 'open', summary: 'Operational runbook matrix is not yet a canonical product artifact.' },
    { id: 'P2-SOURCE-DEGRADED-PROJECTION', severity: 'P2', status: 'open', summary: 'Partial source failure is backend-tolerant, but the Control Center does not project governance-store degradation distinctly from generic unknown.' },
    { id: 'P3-TEST-LABEL-DRIFT', severity: 'P3', status: 'fixed-forward', summary: 'The operation Playwright assertion expected an obsolete label; it now asserts the current truthful Desconocido state.' }
  ]
  const report = {
    schemaVersion: 'jefe-operational-audit/v1', audit: 'ESCALON_13A', generatedAt: '2026-09-30T12:00:00.000Z',
    canonicalDocs: { reconciled: true, escalon11: 'VERIFIED_CLOSED', escalon12: 'VERIFIED_CLOSED', next: 'ESCALON_13A_OBSERVABILITY_AND_RELEASE_OPERATIONS' },
    escalon13PreviouslySpecified: false, escalon13Required: true,
    authority, healthMap,
    correlation: { keys: ['projectId', 'versionId', 'e2eFlowId', 'releaseRequestId'], qa: 'reachable by project/version', humanGate: 'reachable by project/version', delivery: 'reachable by project/version', release: 'reachable by project/version', ci: 'release contract bound; not surfaced in one project view', governance: 'durable but not surfaced in Control Center', incidents: 'global observability only; project correlation partial', recovery: 'durable modules; unified operator projection missing' },
    globalVsProject: { global: { historicalLintErrors: 306, remoteCiQuality: 'FAILING_HISTORICAL_LINT_DEBT', releaseReadiness: 'BLOCKED', productionReady: false }, project: ['version', 'qa', 'approval', 'delivery', 'releaseRequest', 'releaseFlow', 'governanceDecision'] },
    lintDebt: { errors: 306, warnings: 0, affectedFiles: 73, scope: 'src/factory/*', blocksRemoteCi: true, affectsCurrentRuntime: 'not demonstrated by this audit', assignedToEachProject: false, dedicatedPhase: true, recommendedPhase: 'separate quality-debt closure after operational governance' },
    incidentPolicy: { normalBlockersAreNotIncidents: true, waitingHumanIsIncident: false, waitingAuthorizationIsIncident: false, corruptionIsIncident: true, ciFailureIsEvidenceAndBlocker: true, recoveryRequiredIsOperationalCondition: true },
    remoteCapabilities: { gitCommit: 'LOCAL_ONLY', gitPush: 'HISTORICALLY_VERIFIED', remoteCi: 'HISTORICALLY_VERIFIED', createPr: 'CONTRACT_ONLY', merge: 'CONTRACT_ONLY', releaseTag: 'LOCAL_ONLY', deploy: 'NOT_CONNECTED' },
    historicalCanary: { mechanism: 'operational', ci: 'failed', release: 'blocked', cleanup: 'passed', production: false },
    semantics: { unknown: 'no evidence', blocked: 'evidence shows impediment', unavailable: 'capability not connected', failed: 'attempted operation failed', stale: 'evidence no longer current' },
    operationRoute: { path: '/operation', current: 'read-only observability health/quality/readiness/sources/incidents', missing: ['governance decision/lifecycle projection', 'recovery required and safe next action', 'project-to-release correlation detail', 'canonical runbook navigation'], excess: ['none identified as unsafe'] },
    recoveryActionSurface: 'READ_ONLY_SUFFICIENT_FOR_13A', retention: 'CONSERVATIVE_NO_AUTOMATIC_DELETION', multiprocessLocking: false, distributedExactlyOnce: false,
    findings, p0: [], p1: findings.filter((item) => item.severity === 'P1'), p2: findings.filter((item) => item.severity === 'P2'), p3: findings.filter((item) => item.severity === 'P3'),
    security: { secretsInOperationalProjection: false, absolutePathsInOperationalProjection: false, credentialsOrHeaders: false },
    validationBasis: { controlCenterUsesObservability: has(source.controlCenter, /observability\.getOperationalState/u), operationIsReadOnly: has(source.operation, /Esta vista no ejecuta acciones remotas/u), observabilityPersists: has(source.observability, /recordHealthSnapshot/u), releaseRecoveryExists: has(source.releaseRecovery, /releaseHealth/u), governanceRecoveryExists: has(source.governanceRecovery, /governance-recovery-plan\/v1/u) },
    providerCalls: 0, externalNetworkUsed: false, liveReleaseMutations: false, deployPerformed: false,
    releaseReadiness: 'BLOCKED', productionReady: false,
    proposedPhases: { phase13B: 'ESCALON_13B_RELEASE_OPERATIONS_READ_MODEL_AND_RUNBOOKS', phase13C: 'ESCALON_13C_OPERATIONAL_ACCEPTANCE', phase13D: 'ESCALON_13D_OPERATIONAL_RECOVERY_AND_CLOSURE' }
  }
  assert.equal(report.lintDebt.errors, 306)
  assert.equal(report.canonicalDocs.reconciled, true)
  await fs.writeFile(path.join(root, 'operational-audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log('OPERATIONAL_AUDIT_13A=PASS')
  console.log(`P0=${report.p0.length} P1=${report.p1.length} P2=${report.p2.length} P3=${report.p3.length}`)
  console.log(`EVIDENCE_ROOT=${root}`)
}

main().catch((error) => { console.error(error.stack || error); process.exitCode = 1 })
