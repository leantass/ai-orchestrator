const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { canonical } = require('./jefe-context-contract.cjs')

const ID = /^[a-z][a-z0-9_-]{2,80}$/u
const OPERATIONS = Object.freeze(['rebuild_context_projections', 'rebuild_project_index', 'retry_lifecycle_context', 'reconcile_agent_results'])
const RETENTION_MODE = 'CONSERVATIVE_NO_AUTOMATIC_DELETION'

class ContextRecoveryError extends Error { constructor(code, message) { super(message); this.code = code } }
function fail(code, message) { throw new ContextRecoveryError(code, message) }
function digest(value) { return crypto.createHash('sha256').update(canonical(value)).digest('hex') }
function validProjectId(value) { return typeof value === 'string' && ID.test(value) }
function safeJson(value) { try { JSON.parse(value); return true } catch { return false } }

function createContextRecovery({ memory, integration = null, projectPersistence = null, agentIngestion = null, agentPersistence = null, conflictResolution = null } = {}) {
  if (!memory || typeof memory.readEvents !== 'function' || typeof memory.getSnapshot !== 'function' || typeof memory.rebuild !== 'function') fail('INVALID_DEPENDENCY', 'MEMORIA no es valida.')
  const locks = new Set()

  async function derivedState(file) {
    try {
      const raw = await fs.promises.readFile(file, 'utf8')
      return safeJson(raw) ? 'present' : 'corrupt'
    } catch (error) { return error.code === 'ENOENT' ? 'missing' : 'corrupt' }
  }

  async function diagnose({ projectId } = {}) {
    if (!validProjectId(projectId)) fail('INVALID_PROJECT_ID', 'Proyecto invalido.')
    const [loaded, snapshot, snapshotFile, indexFile] = await Promise.all([memory.readEvents(), memory.getSnapshot(), derivedState(memory.paths.snapshotPath), derivedState(memory.paths.indexPath)])
    const issues = []
    if (snapshotFile === 'missing') issues.push({ code: 'SNAPSHOT_MISSING', recoverable: true, authorityRequired: 'none', nextStep: 'rebuild_context_projections' })
    if (indexFile === 'missing') issues.push({ code: 'CONTEXT_INDEX_MISSING', recoverable: true, authorityRequired: 'none', nextStep: 'rebuild_context_projections' })
    if (snapshotFile === 'corrupt') issues.push({ code: 'SNAPSHOT_CORRUPT', recoverable: true, authorityRequired: 'none', nextStep: 'rebuild_context_projections' })
    if (indexFile === 'corrupt') issues.push({ code: 'CONTEXT_INDEX_CORRUPT', recoverable: true, authorityRequired: 'none', nextStep: 'rebuild_context_projections' })
    if (loaded.corruptions.length || snapshot.corruptions.length) issues.push({ code: 'CONTEXT_EVENT_CORRUPT', recoverable: false, authorityRequired: 'human_decision', nextStep: 'preserve_and_review' })
    if (projectPersistence && typeof projectPersistence.root === 'string') {
      const projectIndex = await derivedState(path.join(projectPersistence.root, '.jefe-project-index.json'))
      if (projectIndex !== 'present') issues.push({ code: projectIndex === 'missing' ? 'PROJECT_INDEX_MISSING' : 'PROJECT_INDEX_CORRUPT', recoverable: true, authorityRequired: 'none', nextStep: 'rebuild_project_index' })
    }
    let sync = null
    if (integration && typeof integration.syncStatus === 'function') {
      sync = await integration.syncStatus({ projectId })
      if (sync.status === 'pending') issues.push({ code: 'LIFECYCLE_CONTEXT_GAP', recoverable: true, authorityRequired: 'none', nextStep: 'retry_lifecycle_context' })
      if (sync.status === 'failed') issues.push({ code: 'OUTBOX_FAILED', recoverable: false, authorityRequired: 'human_decision', nextStep: 'preserve_and_review' })
    }
    let attempts = []
    if (agentPersistence && typeof agentPersistence.scan === 'function') attempts = await agentPersistence.scan(projectId)
    if (attempts.some((attempt) => attempt.status === 'completed_uningested')) issues.push({ code: 'AGENT_RESULT_UNINGESTED', recoverable: true, authorityRequired: 'none', nextStep: 'reconcile_agent_results' })
    if (attempts.some((attempt) => attempt.status === 'ingestion_pending')) issues.push({ code: 'AGENT_INGESTION_PENDING', recoverable: true, authorityRequired: 'none', nextStep: 'reconcile_agent_results' })
    if (attempts.some((attempt) => attempt.status === 'ingestion_failed')) issues.push({ code: 'AGENT_INGESTION_FAILED', recoverable: false, authorityRequired: 'human_decision', nextStep: 'preserve_and_review' })
    let conflicts = []
    if (conflictResolution && typeof conflictResolution.listConflicts === 'function') conflicts = (await conflictResolution.listConflicts({ projectId })).conflicts
    if (conflicts.some((conflict) => conflict.state !== 'resolved')) issues.push({ code: 'CONTEXT_CONFLICT_OPEN', recoverable: false, authorityRequired: 'human_decision', nextStep: 'resolve_conflict' })
    if (projectPersistence && integration && typeof projectPersistence.getProject === 'function') {
      const project = await projectPersistence.getProject(projectId)
      if (!project) issues.push({ code: 'PHYSICAL_PROJECT_MISSING', recoverable: false, authorityRequired: 'human_decision', nextStep: 'preserve_and_review' })
    }
    const codes = issues.map((issue) => issue.code).sort()
    const status = codes.some((code) => code.includes('CORRUPT')) ? 'corrupt' : codes.includes('CONTEXT_CONFLICT_OPEN') ? 'conflicted' : codes.some((code) => code.endsWith('FAILED') || code === 'PHYSICAL_PROJECT_MISSING') ? 'blocked' : codes.length ? 'recoverable' : 'healthy'
    const report = { schemaVersion: 'jefe-context-diagnosis/v1', scope: 'project', projectId, status, recoverable: issues.length > 0 && issues.every((issue) => issue.recoverable), authorityRequired: issues.some((issue) => issue.authorityRequired === 'human_decision') ? 'human_decision' : 'none', nextStep: issues[0]?.nextStep || 'none', codes, issues, pendingWork: attempts.filter((attempt) => ['completed_uningested', 'ingestion_pending'].includes(attempt.status)).length, conflictsOpen: conflicts.filter((conflict) => conflict.state !== 'resolved').length, lastEvaluated: null, retentionMode: RETENTION_MODE }
    return { ...report, fingerprint: digest(report) }
  }

  async function planRecovery({ projectId } = {}) {
    const diagnosis = await diagnose({ projectId })
    const operations = []
    if (diagnosis.codes.some((code) => ['SNAPSHOT_MISSING', 'CONTEXT_INDEX_MISSING', 'SNAPSHOT_CORRUPT', 'CONTEXT_INDEX_CORRUPT'].includes(code))) operations.push('rebuild_context_projections')
    if (diagnosis.codes.some((code) => ['PROJECT_INDEX_MISSING', 'PROJECT_INDEX_CORRUPT'].includes(code))) operations.push('rebuild_project_index')
    if (diagnosis.codes.includes('LIFECYCLE_CONTEXT_GAP')) operations.push('retry_lifecycle_context')
    if (diagnosis.codes.some((code) => ['AGENT_RESULT_UNINGESTED', 'AGENT_INGESTION_PENDING'].includes(code))) operations.push('reconcile_agent_results')
    const state = diagnosis.authorityRequired === 'human_decision' ? 'requires_human' : operations.length ? 'ready' : 'blocked'
    const plan = { schemaVersion: 'jefe-context-recovery-plan/v1', scope: 'project', projectId, diagnosisFingerprint: diagnosis.fingerprint, operations, preconditions: diagnosis.codes, authorityRequired: diagnosis.authorityRequired, state, changesPlanned: operations, willNotModify: ['context_events', 'manifests', 'ledger', 'approvals', 'deliveries'], retentionMode: RETENTION_MODE }
    return { ...plan, planId: `context-recovery-plan-${digest(plan).slice(0, 32)}` }
  }

  async function executeRecovery(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some((key) => !['projectId', 'plan'].includes(key))) fail('INVALID_PLAN', 'Plan invalido.')
    const { projectId, plan } = input
    if (!validProjectId(projectId) || !plan || typeof plan !== 'object' || plan.projectId !== projectId) fail('INVALID_PLAN', 'Plan invalido.')
    const expected = await planRecovery({ projectId })
    if (canonical(plan) !== canonical(expected)) fail('STALE_PLAN', 'El plan ya no coincide con sus precondiciones.')
    if (plan.state === 'requires_human') return { status: 'requires_human', planId: plan.planId, operations: [] }
    if (plan.state !== 'ready') return { status: 'blocked', planId: plan.planId, operations: [] }
    if (locks.has(projectId)) return { status: 'pending', planId: plan.planId, operations: [] }
    locks.add(projectId)
    try {
      const performed = []
      for (const operation of plan.operations) {
        if (!OPERATIONS.includes(operation)) fail('INVALID_OPERATION', 'Operacion invalida.')
        if (operation === 'rebuild_context_projections') { await memory.rebuild(); performed.push(operation) }
        if (operation === 'retry_lifecycle_context' && integration) { await integration.retry(projectId); performed.push(operation) }
        if (operation === 'reconcile_agent_results' && agentIngestion) { await agentIngestion.reconcilePendingResults({ projectId, limit: 50 }); performed.push(operation) }
        if (operation === 'rebuild_project_index' && projectPersistence) { await projectPersistence.rebuildIndex(); performed.push(operation) }
      }
      const after = await diagnose({ projectId })
      return { status: after.status === 'healthy' ? 'recovered' : after.status === 'recoverable' ? 'pending' : after.status, planId: plan.planId, operations: performed, diagnosis: after }
    } finally { locks.delete(projectId) }
  }

  async function getRecoveryStatus({ projectId } = {}) {
    const diagnosis = await diagnose({ projectId })
    return { projectId, status: diagnosis.status, recoverable: diagnosis.recoverable, conflictsOpen: diagnosis.conflictsOpen, pendingWork: diagnosis.pendingWork, nextResponsible: diagnosis.authorityRequired === 'human_decision' ? 'lean' : null, lastEvaluated: diagnosis.lastEvaluated, codes: diagnosis.codes, retentionMode: RETENTION_MODE }
  }

  function retentionPolicy() { return { mode: RETENTION_MODE, automaticDeletion: false, canonicalEvents: 'retain', humanDecisions: 'retain', manifests: 'retain', ledger: 'retain', conflicts: 'retain', attempts: 'retain', derived: 'rebuildable' } }
  return { diagnose, planRecovery, executeRecovery, getRecoveryStatus, retentionPolicy }
}

module.exports = { OPERATIONS, RETENTION_MODE, ContextRecoveryError, createContextRecovery }
