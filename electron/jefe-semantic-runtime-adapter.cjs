const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const path = require('node:path')

const ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,15}$/u
const DEFAULT_TIMEOUT_MS = 120000
const TERMINAL_PHASES = new Set(['HUMAN_FEEDBACK_LOADED', 'CORRECTION_PLAN_READY', 'BUSINESS_UNDERSTANDING_READY', 'CONTENT_PLAN_READY', 'EXPERIENCE_PLAN_READY', 'SEMANTIC_GATES_PASS', 'GENERATION_SPEC_READY', 'CANDIDATE_READY', 'QUALITY_PASS', 'PROMOTED'])

function fail(code, message) { throw Object.assign(new Error(message), { code }) }
function runHash(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex') }
function safeIdentity(input) { if (!input || typeof input !== 'object' || !ID.test(input.projectId || '') || !ID.test(input.sourceVersionId || '')) fail('INVALID_ID', 'La identidad semántica no es válida.'); if (Object.keys(input).some((key) => !['projectId', 'sourceVersionId', 'idempotencyKey'].includes(key))) fail('INVALID_PAYLOAD', 'El intent semántico sólo admite identidad e idempotencia.'); return { projectId: input.projectId, sourceVersionId: input.sourceVersionId, ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}) } }
function safeFailureMessage(error) { return String(error instanceof Error ? error.message : 'La corrección semántica no pudo completarse.').replace(/(?:sk|api[_-]?key|authorization|bearer)\s*[:=]?\s*[^\s,;]+/giu, '[redacted]').slice(0, 500) }
function failureCategory(error, phase) { if (error?.code === 'SEMANTIC_RUN_TIMEOUT') return 'TIMEOUT'; if (/provider|model|credential|openai/iu.test(String(error?.code || ''))) return 'PROVIDER_FAILURE'; if (/quality|gate/iu.test(String(error?.code || '')) || phase === 'QUALITY_PASS') return 'QUALITY_FAILURE'; if (phase === 'CANDIDATE_READY') return 'CANDIDATE_GENERATION_FAILURE'; if (phase === 'PROMOTED') return 'PROMOTION_FAILURE'; if (phase && TERMINAL_PHASES.has(phase)) return `${phase}_FAILURE`; if (/candidate|generation/iu.test(String(error?.code || ''))) return 'CANDIDATE_GENERATION_FAILURE'; if (/promotion|version/iu.test(String(error?.code || ''))) return 'PROMOTION_FAILURE'; return 'LOCAL_FAILURE' }
function safeResult(result) { return { ok: Boolean(result?.ok), projectId: result?.projectId || null, sourceVersionId: result?.sourceVersionId || null, runId: result?.runId || null, status: result?.status || null, lastCompletedPhase: result?.lastCompletedPhase || null, failureCategory: result?.failureCategory || null, safeFailureMessage: result?.safeFailureMessage || null, semanticGenerationCalls: Number(result?.semanticGenerationCalls || 0), correctionRounds: Number(result?.correctionRounds || 0), candidateId: result?.candidateId || null, newVersionId: result?.newVersionId || result?.versionId || null, executionPackageId: result?.executionPackageId || null, correctionId: result?.correctionId || null, attemptId: result?.attemptId || null, versionId: result?.versionId || result?.newVersionId || null, state: result?.state || null, previewRequestId: result?.previewRequestId || null, error: result?.error ? { code: result.error.code || 'SEMANTIC_RUNTIME_FAILED', message: result.error.message || 'La operación semántica no pudo completarse.' } : undefined } }

function createSemanticRunStateStore({ root } = {}) {
  const runsRoot = path.join(path.resolve(root), '.jefe-semantic-runs')
  async function write(state) { const file = path.join(runsRoot, state.projectId, `${state.runId}.json`); await fs.mkdir(path.dirname(file), { recursive: true }); const temp = `${file}.tmp-${process.pid}-${Date.now()}`; await fs.writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, 'utf8'); await fs.rename(temp, file); return { ...state, reportPath: file } }
  async function begin({ projectId, sourceVersionId, runId, correctionRounds = 1 }) { return write({ schemaVersion: 'semantic-run-terminal-state-v1', runId, projectId, sourceVersionId, status: 'RUNNING', startedAt: new Date().toISOString(), completedAt: null, lastCompletedPhase: null, failureCategory: null, safeFailureMessage: null, semanticGenerationCalls: 0, correctionRounds, candidateId: null, newVersionId: null }) }
  async function progress(state, phase, details = {}) { if (!TERMINAL_PHASES.has(phase)) fail('INVALID_SEMANTIC_PHASE', `Unknown semantic phase: ${phase}`); return write({ ...state, lastCompletedPhase: phase, semanticGenerationCalls: Number(details.semanticGenerationCalls ?? state.semanticGenerationCalls), correctionRounds: Number(details.correctionRounds ?? state.correctionRounds), candidateId: details.candidateId || state.candidateId, newVersionId: details.newVersionId || state.newVersionId }) }
  async function terminal(state, status, details = {}) { if (!['PASS', 'PARTIAL', 'BLOCKED'].includes(status)) fail('INVALID_SEMANTIC_TERMINAL_STATUS', `Unknown terminal status: ${status}`); return write({ ...state, status, completedAt: new Date().toISOString(), failureCategory: details.failureCategory || null, safeFailureMessage: details.safeFailureMessage || null, lastCompletedPhase: details.lastCompletedPhase || state.lastCompletedPhase, semanticGenerationCalls: Number(details.semanticGenerationCalls ?? state.semanticGenerationCalls), correctionRounds: Number(details.correctionRounds ?? state.correctionRounds), candidateId: details.candidateId || state.candidateId, newVersionId: details.newVersionId || state.newVersionId }) }
  return { begin, progress, terminal, runsRoot }
}

function withTimeout(promise, timeoutMs) { let timer; return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('Semantic correction run timed out.'), { code: 'SEMANTIC_RUN_TIMEOUT' })), timeoutMs) })]).finally(() => clearTimeout(timer)) }
function createSemanticRuntimeAdapter({ root, service, resolveExecution, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (!service || typeof service.registerAttempt !== 'function' || typeof service.promoteSemanticCorrectionAttempt !== 'function') fail('MISSING_SEMANTIC_SERVICE', 'Falta el servicio semántico compartido.')
  const stateStore = createSemanticRunStateStore({ root })
  async function requestSemanticCorrection(input) {
    const identity = safeIdentity(input)
    if (typeof resolveExecution !== 'function') fail('SEMANTIC_RUNTIME_NOT_CONFIGURED', 'El runtime semántico no tiene resolver de ejecución.')
    const runId = `semantic-run-${runHash(identity).slice(0, 20)}`
    let state = await stateStore.begin({ ...identity, runId })
    let activePhase = null
    let settled = false
    try {
      const onPhaseStart = (phase) => { if (!settled) activePhase = phase }
      const onPhase = async (phase, details = {}) => { if (settled) return; activePhase = phase; state = await stateStore.progress(state, phase, details) }
      const resolved = await withTimeout(resolveExecution(identity, { runId, onPhase, onPhaseStart }), timeoutMs)
      if (!resolved?.executionPackage || resolved.executionPackage.identity?.projectId !== identity.projectId || resolved.executionPackage.identity?.sourceVersionId !== identity.sourceVersionId) fail('INVALID_SEMANTIC_RUNTIME_RESOLUTION', 'La ejecución no coincide con la identidad solicitada.')
      activePhase = 'QUALITY_PASS'
      const attempt = await withTimeout(service.registerAttempt(resolved), timeoutMs)
      state = await stateStore.progress(state, 'QUALITY_PASS', { candidateId: attempt.attemptId, correctionRounds: resolved.executionPackage.identity.correctionRound })
      activePhase = 'PROMOTED'
      const promoted = await withTimeout(service.promoteSemanticCorrectionAttempt({ executionPackageId: resolved.executionPackage.executionPackageId, attemptId: attempt.attemptId }), timeoutMs)
      state = await stateStore.progress(state, 'PROMOTED', { candidateId: attempt.attemptId, newVersionId: promoted.versionId || promoted.newVersionId, correctionRounds: resolved.executionPackage.identity.correctionRound })
      settled = true
      state = await stateStore.terminal(state, 'PASS', { candidateId: attempt.attemptId, newVersionId: promoted.versionId || promoted.newVersionId })
      return safeResult({ ...promoted, projectId: identity.projectId, sourceVersionId: identity.sourceVersionId, runId, status: state.status, lastCompletedPhase: state.lastCompletedPhase, semanticGenerationCalls: state.semanticGenerationCalls, correctionRounds: state.correctionRounds, candidateId: state.candidateId, newVersionId: state.newVersionId, executionPackageId: resolved.executionPackage.executionPackageId, attemptId: attempt.attemptId })
    } catch (error) {
      settled = true
      state = await stateStore.terminal(state, 'BLOCKED', { failureCategory: failureCategory(error, activePhase), safeFailureMessage: safeFailureMessage(error), lastCompletedPhase: state.lastCompletedPhase })
      return safeResult({ ok: false, projectId: identity.projectId, sourceVersionId: identity.sourceVersionId, runId, status: state.status, lastCompletedPhase: state.lastCompletedPhase, failureCategory: state.failureCategory, safeFailureMessage: state.safeFailureMessage, semanticGenerationCalls: state.semanticGenerationCalls, correctionRounds: state.correctionRounds, candidateId: state.candidateId, newVersionId: state.newVersionId, error: { code: error?.code || 'SEMANTIC_RUNTIME_FAILED', message: state.safeFailureMessage } })
    }
  }
  return { requestSemanticCorrection, stateStore }
}

module.exports = { DEFAULT_TIMEOUT_MS, TERMINAL_PHASES, createSemanticRunStateStore, createSemanticRuntimeAdapter, safeIdentity, safeResult, failureCategory, safeFailureMessage }
