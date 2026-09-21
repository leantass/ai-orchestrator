import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createSemanticRuntimeAdapter } = require('../electron/jefe-semantic-runtime-adapter.cjs')
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-semantic-terminal-state-'))
const phases = ['HUMAN_FEEDBACK_LOADED', 'BUSINESS_UNDERSTANDING_READY', 'CORRECTION_PLAN_READY', 'CONTENT_PLAN_READY', 'EXPERIENCE_PLAN_READY', 'SEMANTIC_GATES_PASS', 'GENERATION_SPEC_READY', 'CANDIDATE_READY', 'QUALITY_PASS', 'PROMOTED']
const packageFor = (projectId) => ({ executionPackageId: `package-${projectId}`, identity: { projectId, sourceVersionId: 'version-v0001', correctionRound: 2 } })
const phasePlan = phases.slice(0, 8)

async function runCase(projectId, failureAt = null) {
  let registerCalls = 0
  const service = {
    registerAttempt: async () => { registerCalls += 1; if (failureAt === 'QUALITY_PASS') throw Object.assign(new Error('quality gate failed'), { code: 'QUALITY_GATE_FAILED' }); return { attemptId: `candidate-${projectId}` } },
    promoteSemanticCorrectionAttempt: async () => { if (failureAt === 'PROMOTED') throw Object.assign(new Error('promotion failed'), { code: 'PROMOTION_FAILED' }); return { ok: true, versionId: 'version-v0002', state: 'pending_review' } },
  }
  const adapter = createSemanticRuntimeAdapter({ root, timeoutMs: 1000, service, resolveExecution: async (_identity, { onPhase, onPhaseStart }) => {
    for (const phase of phasePlan) {
      onPhaseStart(phase)
      if (failureAt === phase) throw Object.assign(new Error(`${phase} synthetic failure`), { code: `${phase}_FAILED` })
      await onPhase(phase, { semanticGenerationCalls: phase === 'BUSINESS_UNDERSTANDING_READY' ? 1 : phase === 'CONTENT_PLAN_READY' ? 2 : phase === 'EXPERIENCE_PLAN_READY' ? 3 : 3, correctionRounds: 2, candidateId: phase === 'CANDIDATE_READY' ? `candidate-${projectId}` : undefined })
    }
    return { executionPackage: packageFor(projectId) }
  } })
  const result = await adapter.requestSemanticCorrection({ projectId, sourceVersionId: 'version-v0001' })
  const report = JSON.parse(await fs.readFile(path.join(root, '.jefe-semantic-runs', projectId, `${result.runId}.json`), 'utf8'))
  assert.equal(result.status, failureAt ? 'BLOCKED' : 'PASS')
  assert.equal(report.status, result.status)
  assert.equal(typeof report.startedAt, 'string')
  assert.equal(typeof report.completedAt, 'string')
  assert.equal(report.projectId, projectId)
  assert.equal(report.sourceVersionId, 'version-v0001')
  assert.equal(typeof report.runId, 'string')
  assert.equal(typeof report.correctionRounds, 'number')
  assert.equal(typeof report.semanticGenerationCalls, 'number')
  assert.notEqual(report.safeFailureMessage, undefined)
  assert.equal(JSON.stringify(report).includes('sk-live'), false)
  if (failureAt) { assert.equal(report.lastCompletedPhase, phases[phases.indexOf(failureAt) - 1]); const expectedCategory = failureAt === 'QUALITY_PASS' ? 'QUALITY_FAILURE' : failureAt === 'PROMOTED' ? 'PROMOTION_FAILURE' : failureAt === 'CANDIDATE_READY' ? 'CANDIDATE_GENERATION_FAILURE' : `${failureAt}_FAILURE`; assert.equal(report.failureCategory, expectedCategory); assert.equal(result.newVersionId, null) }
  else { assert.equal(report.lastCompletedPhase, 'PROMOTED'); assert.equal(report.candidateId, `candidate-${projectId}`); assert.equal(report.newVersionId, 'version-v0002'); assert.equal(registerCalls, 1) }
  return { result, report }
}

try {
  const cases = {}
  for (const phase of ['BUSINESS_UNDERSTANDING_READY', 'CONTENT_PLAN_READY', 'EXPERIENCE_PLAN_READY', 'GENERATION_SPEC_READY', 'CANDIDATE_READY', 'QUALITY_PASS', 'PROMOTED']) cases[phase] = await runCase(`blocked-${phase.toLowerCase().replaceAll('_', '-')}`, phase)
  cases.PASS = await runCase('passed-run')
  assert.equal(cases.PASS.result.lastCompletedPhase, 'PROMOTED')
  const timeoutAdapter = createSemanticRuntimeAdapter({ root, timeoutMs: 10, service: { registerAttempt: async () => ({ attemptId: 'never' }), promoteSemanticCorrectionAttempt: async () => ({ versionId: 'never' }) }, resolveExecution: async () => new Promise(() => {}) })
  const timeoutResult = await timeoutAdapter.requestSemanticCorrection({ projectId: 'timeout-run', sourceVersionId: 'version-v0001' })
  assert.equal(timeoutResult.status, 'BLOCKED'); assert.equal(timeoutResult.failureCategory, 'TIMEOUT'); assert.equal(timeoutResult.lastCompletedPhase, null)
  console.log(JSON.stringify({ ok: true, smoke: 'jefe-semantic-run-terminal-state', failurePhases: Object.keys(cases).filter((key) => key !== 'PASS'), successfulRun: cases.PASS.report, ProviderCalls: 0 }))
} finally { await fs.rm(root, { recursive: true, force: true }) }
