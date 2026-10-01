'use strict'

const crypto = require('node:crypto')
const { createRunbookRegistry } = require('./jefe-release-operations-runbook.cjs')

const SCHEMA = 'jefe-release-operations/v1'
const CAPABILITIES = Object.freeze({ gitCommit: 'local_only', gitPush: 'historically_verified', remoteCi: 'historically_verified', createPr: 'contract_only', merge: 'contract_only', releaseTag: 'local_only', deploy: 'not_connected' })
const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value))
const digest = (value) => crypto.createHash('sha256').update(JSON.stringify(value, Object.keys(value || {}).sort())).digest('hex').slice(0, 24)
const safeError = (error) => ({ code: typeof error?.code === 'string' ? error.code.replace(/[^A-Z0-9_-]/giu, '').slice(0, 80) : 'SOURCE_UNAVAILABLE', message: 'La fuente operativa no esta disponible.' })
const read = async (sourceId, fn, fallback) => { try { const value = await fn(); return { value, status: 'available' } } catch (error) { return { value: fallback, status: 'unavailable', error: safeError(error), sourceId } } }
const status = (value, fallback = 'unknown') => typeof value === 'string' && value ? value : fallback

function createReleaseOperations({ e2e = null, e2eRecovery = null, releaseRecovery = null, governance = null, governanceRecovery = null, observability = null, lifecycle = null, persistence = null, runbooks = createRunbookRegistry(), historicalLintErrors = null } = {}) {
  const source = (name, authority, availability = 'available', extra = {}) => ({ name, authority, availability, ...extra })
  const recoveryView = (name, value, unavailable = false) => ({ name, status: unavailable ? 'unavailable' : status(value?.status, 'unknown'), issueCount: Number.isInteger(value?.issueCount) ? value.issueCount : Number.isInteger(value?.corruptions) ? value.corruptions : null, corruptionCount: Number.isInteger(value?.corruptions) ? value.corruptions : null, lastRecoveryAt: value?.lastRecoveryAt || null, recommendedAction: value?.recommendedAction || (unavailable ? 'wait' : null), readOnly: true })
  const blocker = (item = {}, fallbackCategory = 'source_unavailable') => { const category = item.category || item.code || fallbackCategory; const book = runbooks.get(category); const scope = item.scope === 'project' || item.projectId ? 'project' : 'global'; return { category, scope, projectId: item.projectId || null, versionId: item.versionId || null, label: item.label || book.label, reason: item.reason || book.reason, source: item.source || source(book.domain, book.recoveryOwner), evidenceRefs: Array.isArray(item.evidenceRefs) ? [...new Set(item.evidenceRefs)].sort() : [], nextAction: item.nextAction || book.nextAction, nextActionLabel: item.nextActionLabel || book.nextActionLabel, humanRequired: item.humanRequired ?? book.humanRequired, automatic: false, productionRisk: item.productionRisk || book.productionRisk } }
  const dedupe = (items) => [...new Map(items.map((item) => { const normalized = blocker(item); return [`${normalized.category}:${normalized.scope}:${normalized.projectId || ''}:${normalized.versionId || ''}`, normalized] })).values()].sort((a, b) => `${a.scope}:${a.category}:${a.projectId || ''}`.localeCompare(`${b.scope}:${b.category}:${b.projectId || ''}`))
  const sourceState = (name, authority, availability, extra = {}) => source(name, authority, availability, extra)
  async function global() {
    const [obs, release, governanceHealth, governanceView] = await Promise.all([
      read('observability', () => observability?.getOperationalState ? observability.getOperationalState({ limit: 50 }) : Promise.reject(Object.assign(new Error(), { code: 'NOT_CONNECTED' })), null),
      read('release', () => releaseRecovery?.releaseHealth ? releaseRecovery.releaseHealth() : Promise.resolve(null), null),
      read('governance-recovery', () => governanceRecovery?.health ? governanceRecovery.health() : Promise.reject(Object.assign(new Error(), { code: 'NOT_CONNECTED' })), null),
      read('governance', () => governanceRecovery?.governanceView ? governanceRecovery.governanceView() : Promise.resolve(null), null),
    ])
    const obsHealth = obs.value?.health || {}; const lint = historicalLintErrors ?? obsHealth.limitations?.historicalLintErrors ?? null
    const blockers = []; if (lint !== null) blockers.push(blocker({ category: 'historical_lint_debt', scope: 'global', reason: `La calidad CI remota esta bloqueada por ${lint} errores historicos de lint.`, evidenceRefs: [`quality:historical-lint-${lint}`], source: source('quality', 'historical CI evidence') }))
    if (obsHealth.readiness?.status === 'blocked' || obsHealth.quality?.status === 'failing') blockers.push(blocker({ category: obsHealth.quality?.status === 'failing' ? 'remote_ci_failed' : 'source_unavailable', scope: 'global', evidenceRefs: ['observability:release-readiness'], source: source('observability', 'durable operational evidence') }))
    const recovery = { e2e: recoveryView('e2e', null, true), release: recoveryView('release', release.value, release.status !== 'available'), governance: recoveryView('governance', governanceHealth.value, governanceHealth.status !== 'available'), observability: recoveryView('observability', obs.value?.health, obs.status !== 'available') }
    if (release.status !== 'available') blockers.push(blocker({ category: 'release_recovery_required', evidenceRefs: ['release:health'], source: source('release', 'release recovery', 'unavailable') }))
    if (governanceHealth.status !== 'available') blockers.push(blocker({ category: 'governance_recovery_required', evidenceRefs: ['governance:health'], source: source('governance', 'governance recovery', 'unavailable') }))
    const incidents = Array.isArray(obs.value?.incidents) ? obs.value.incidents.map((item) => ({ ...item, source: item.source || 'observability' })) : []
    const history = Array.isArray(obs.value?.timeline) ? obs.value.timeline.map((item) => ({ timestamp: item.timestamp || item.createdAt || null, domain: item.domain || 'observability', kind: item.kind || item.type || 'event', summary: item.summary || 'Evidencia operativa registrada.', projectId: item.projectId || null, versionId: item.versionId || null, sourceRef: item.sourceRef || 'observability' })) : []
    return { schemaVersion: SCHEMA, scope: 'global', health: status(obsHealth.health?.status, 'unknown'), quality: status(obsHealth.quality?.status, 'unknown'), releaseReadiness: governanceView.value?.releaseReadiness || obsHealth.readiness?.status || 'unknown', productionReady: false, sources: [sourceState('observability', 'durable operational evidence', obs.status), sourceState('release', 'release recovery health', release.status), sourceState('governance', 'governance decisions and recovery', governanceHealth.status)], blockers: dedupe(blockers), incidents, recoveries: recovery, capabilities: clone(CAPABILITIES), historySummary: { entries: history.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp))).slice(-50), partial: [obs, release, governanceHealth].some((item) => item.status !== 'available') }, nextSafeActions: dedupe(blockers).map((item) => ({ code: item.nextAction, label: item.nextActionLabel, scope: item.scope, humanRequired: item.humanRequired })), limitations: { historicalLintErrors: lint, retention: 'CONSERVATIVE_NO_AUTOMATIC_DELETION', multiprocessLocking: false, distributedExactlyOnce: false }, readOnly: true, fingerprint: digest({ blockers, recovery, health: obsHealth, release: release.value, governance: governanceHealth.value }) }
  }
  async function project(projectId) {
    if (typeof projectId !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,40}$/u.test(projectId)) throw Object.assign(new Error('projectId invalido.'), { code: 'INVALID_PROJECT_ID' })
    const snapshot = await lifecycle?.snapshot?.(projectId); const versionId = snapshot?.activeVersionId || null
    const record = versionId && persistence?.getVersionRecord ? await persistence.getVersionRecord(projectId, versionId) : null
    const runId = record?.project?.runId || null
    const flow = versionId && runId && e2e?.flowForIdentity ? await e2e.flowForIdentity({ projectId, runId, versionId }) : null
    const release = versionId && e2e?.releaseForProject ? await e2e.releaseForProject(projectId, versionId) : null
    const globalModel = await global(); const globalBlockers = globalModel.blockers.filter((item) => item.scope === 'global'); const projectBlockers = globalModel.blockers.filter((item) => item.scope === 'project' && item.projectId === projectId && (!item.versionId || item.versionId === versionId))
    if (flow?.stages?.qa?.status === 'failed') projectBlockers.push(blocker({ category: 'qa_failed', scope: 'project', projectId, versionId, evidenceRefs: [`flow:${flow.e2eFlowId}`] }))
    if (release?.state === 'blocked') projectBlockers.push(blocker({ category: 'remote_authorization_missing', scope: 'project', projectId, versionId, evidenceRefs: [`release:${release.releaseFlowId || 'flow'}`] }))
    let governanceView = { state: 'not_started', source: 'governance', availability: 'available', decision: null, productionDecision: null }
    if (governance?.project) governanceView = await governance.project(projectId, versionId)
    else if (governance?.getProject) governanceView = await governance.getProject(projectId, versionId)
    return { schemaVersion: SCHEMA, scope: 'project', projectId, currentVersion: { versionId, runId, e2eFlowId: flow?.e2eFlowId || null, source: 'project-lifecycle.activeVersionId' }, e2e: { flowId: flow?.e2eFlowId || null, state: flow?.state || 'unknown', qa: flow?.stages?.qa?.status || 'unknown' }, release: { state: release?.state || 'unknown', releaseRequestId: release?.releaseRequestId || null, releaseFlowId: release?.releaseFlowId || null }, governance: governanceView, blockers: dedupe(projectBlockers), globalBlockers: dedupe(globalBlockers), incidents: globalModel.incidents.filter((item) => !item.projectId || item.projectId === projectId), recoveries: globalModel.recoveries, nextSafeActions: dedupe(projectBlockers).map((item) => ({ code: item.nextAction, label: item.nextActionLabel, humanRequired: item.humanRequired })), history: globalModel.historySummary, readOnly: true, fingerprint: digest({ projectId, versionId, flow: flow?.e2eFlowId, release: release?.releaseFlowId, governance: governanceView, blockers: projectBlockers, globalBlockers }) }
  }
  return Object.freeze({ schemaVersion: SCHEMA, global, project, runbooks })
}

module.exports = { SCHEMA, CAPABILITIES, createReleaseOperations }
