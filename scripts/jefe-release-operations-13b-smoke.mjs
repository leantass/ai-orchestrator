import assert from 'node:assert/strict'
import { createReleaseOperations, SCHEMA, CAPABILITIES } from '../electron/jefe-release-operations.cjs'
import { createRunbookRegistry, RUNBOOK_SCHEMA } from '../electron/jefe-release-operations-runbook.cjs'

const runbooks = createRunbookRegistry()
assert.equal(runbooks.schemaVersion, RUNBOOK_SCHEMA)
assert.equal(runbooks.get('historical_lint_debt').automatic, false)
assert.equal(runbooks.get('remote_ci_failed').humanRequired, true)

const lifecycle = {
  async snapshot(projectId) { return { projectId, activeVersionId: 'version-current', lastActivity: '2026-09-30T12:00:00.000Z' } },
  persistence: { async getVersionRecord() { return { project: { runId: 'run-current' } } } },
}
const e2e = {
  async flowForIdentity(identity) { return { e2eFlowId: 'e2e-current', state: 'active', identity, stages: { qa: { status: 'completed' } } } },
  async releaseForProject() { return { state: 'blocked', releaseRequestId: 'release-request-current', releaseFlowId: 'release-flow-current' } },
}
const operations = createReleaseOperations({
  lifecycle,
  persistence: { async getVersionRecord() { return { project: { runId: 'run-current' } } } },
  e2e,
  historicalLintErrors: 306,
  observability: { async getOperationalState() { return { health: { health: { status: 'healthy' }, quality: { status: 'failing' }, readiness: { status: 'blocked' }, limitations: { historicalLintErrors: 306 }, productionReady: false }, incidents: [], timeline: [] } } },
  releaseRecovery: { async releaseHealth() { return { status: 'healthy', pendingOutbox: 0, failedCi: 1 } } },
  governanceRecovery: { async health() { return { status: 'healthy', staleDecisions: 0, corruptions: 0 } }, async governanceView() { return { releaseReadiness: 'blocked', productionReady: false } } },
})

const global = await operations.global()
assert.equal(global.schemaVersion, SCHEMA)
assert.equal(global.health, 'healthy')
assert.equal(global.releaseReadiness, 'blocked')
assert.equal(global.productionReady, false)
assert.equal(global.limitations.historicalLintErrors, 306)
assert.equal(global.blockers.filter((item) => item.category === 'historical_lint_debt').length, 1)
assert.equal(global.blockers.some((item) => item.category === 'remote_ci_failed'), true)
assert.equal(global.recoveries.release.readOnly, true)
assert.equal(global.recoveries.governance.status, 'healthy')
assert.deepEqual(global.capabilities, CAPABILITIES)
assert.equal(global.readOnly, true)
assert.equal(global.nextSafeActions.every((item) => item.code !== 'approve_release'), true)

const project = await operations.project('project-a')
assert.equal(project.currentVersion.versionId, 'version-current')
assert.equal(project.currentVersion.e2eFlowId, 'e2e-current')
assert.equal(project.release.releaseRequestId, 'release-request-current')
assert.equal(project.blockers.filter((item) => item.category === 'remote_authorization_missing').length, 1)
assert.equal(project.readOnly, true)
assert.match(project.fingerprint, /^[a-f0-9]{24}$/u)
await assert.rejects(() => operations.project('../project-a'), /projectId invalido/u)

const unavailable = createReleaseOperations({ historicalLintErrors: null })
const degraded = await unavailable.global()
assert.equal(degraded.productionReady, false)
assert.equal(degraded.sources.some((item) => item.availability === 'unavailable'), true)
assert.equal(degraded.blockers.every((item) => item.automatic === false), true)

console.log('PASS jefe-release-operations-13b-smoke: composed read-only global/project release operations, runbooks, recovery visibility, blocker traceability, current-version binding and degraded sources')
