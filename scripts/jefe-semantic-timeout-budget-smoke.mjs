import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createSemanticRuntimeAdapter } = require('../electron/jefe-semantic-runtime-adapter.cjs')
const { deriveSemanticRunTimeoutMs } = require('../electron/jefe-semantic-timeout.cjs')

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-semantic-timeout-budget-'))
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const packageFor = (projectId) => ({ executionPackageId: `package-${projectId}`, identity: { projectId, sourceVersionId: 'version-v0001', correctionRound: 1 } })
const service = { registerAttempt: async () => ({ attemptId: 'candidate-offline' }), promoteSemanticCorrectionAttempt: async () => ({ ok: true, versionId: 'version-v0002', state: 'pending_review' }) }

async function report(projectId, result) {
  return JSON.parse(await fs.readFile(path.join(root, '.jefe-semantic-runs', projectId, `${result.runId}.json`), 'utf8'))
}

async function run(projectId, options = {}) {
  const adapter = createSemanticRuntimeAdapter({ root, service: options.service || service, timeoutMs: options.timeoutMs, providerOperationTimeoutMs: options.providerOperationTimeoutMs, resolveExecution: options.resolveExecution })
  const result = await adapter.requestSemanticCorrection({ projectId, sourceVersionId: 'version-v0001' })
  return { result, report: await report(projectId, result) }
}

try {
  const fast = await run('fast-complete', { timeoutMs: 100, resolveExecution: async (_identity, { onPhase, onPhaseStart }) => { onPhaseStart('BUSINESS_UNDERSTANDING_READY'); await onPhase('BUSINESS_UNDERSTANDING_READY', { semanticGenerationCalls: 1 }); return { executionPackage: packageFor('fast-complete') } } })
  assert.equal(fast.result.status, 'PASS')

  const slowWithin = await run('slow-within-operation-deadline', { timeoutMs: 120, providerOperationTimeoutMs: 40, resolveExecution: async (_identity, { onPhase, onPhaseStart }) => { onPhaseStart('BUSINESS_UNDERSTANDING_READY'); await sleep(20); await onPhase('BUSINESS_UNDERSTANDING_READY', { semanticGenerationCalls: 1 }); return { executionPackage: packageFor('slow-within-operation-deadline') } } })
  assert.equal(slowWithin.result.status, 'PASS')

  const providerDeadline = await run('provider-deadline', { timeoutMs: 200, resolveExecution: async (_identity, { onPhase, onPhaseStart }) => { onPhaseStart('CONTENT_PLAN_READY'); await onPhase('BUSINESS_UNDERSTANDING_READY', { semanticGenerationCalls: 1 }); throw Object.assign(new Error('BACKGROUND_DEADLINE_EXCEEDED'), { code: 'BACKGROUND_DEADLINE_EXCEEDED', errorEnvelope: { category: 'BACKGROUND_DEADLINE_EXCEEDED', operation: 'content_plan', generationCallNumber: 2, pollCount: 4 }, telemetry: { durationMs: 40, pollRequests: 4 } }) } })
  assert.equal(providerDeadline.result.status, 'BLOCKED'); assert.equal(providerDeadline.report.failureCategory, 'BACKGROUND_DEADLINE'); assert.equal(providerDeadline.report.timeoutDetails.timeoutLayer, 'BACKGROUND_DEADLINE'); assert.equal(providerDeadline.report.timeoutDetails.pollCount, 4)

  const providerPollLimit = await run('provider-poll-limit', { timeoutMs: 200, resolveExecution: async (_identity, { onPhase, onPhaseStart }) => { onPhaseStart('CONTENT_PLAN_READY'); await onPhase('BUSINESS_UNDERSTANDING_READY', { semanticGenerationCalls: 1 }); throw Object.assign(new Error('BACKGROUND_POLL_LIMIT_EXCEEDED'), { code: 'BACKGROUND_POLL_LIMIT_EXCEEDED', errorEnvelope: { category: 'BACKGROUND_POLL_LIMIT_EXCEEDED', operation: 'content_plan', generationCallNumber: 2, pollCount: 5 }, telemetry: { backgroundDeadlineMs: 300000, configuredMaxPollRequests: 5, effectiveMaxPollRequests: 5, elapsedMs: 12000, remainingMs: 288000, terminationReason: 'POLL_LIMIT', responseStatus: 'in_progress', pollCount: 5, cancelAttempted: true, cancelStatus: 'accepted' } }) } })
  assert.equal(providerPollLimit.result.status, 'BLOCKED'); assert.equal(providerPollLimit.result.failureCategory, 'BACKGROUND_POLL_LIMIT'); assert.equal(providerPollLimit.report.timeoutDetails.timeoutLayer, 'BACKGROUND_POLL_LIMIT'); assert.equal(providerPollLimit.report.timeoutDetails.terminationReason, 'POLL_LIMIT'); assert.equal(providerPollLimit.report.timeoutDetails.effectiveMaxPollRequests, 5)

  const global = await run('run-global', { timeoutMs: 20, resolveExecution: async () => new Promise(() => {}) })
  assert.equal(global.result.status, 'BLOCKED'); assert.equal(global.report.failureCategory, 'TIMEOUT'); assert.equal(global.report.timeoutDetails.timeoutLayer, 'RUN_GLOBAL')

  const derived = deriveSemanticRunTimeoutMs({ maxCalls: 2, providerOperationTimeoutMs: 30, marginMs: 10 })
  const contentWithin = await run('content-within-derived-budget', { timeoutMs: derived, resolveExecution: async (_identity, { onPhase, onPhaseStart }) => { onPhaseStart('BUSINESS_UNDERSTANDING_READY'); await onPhase('BUSINESS_UNDERSTANDING_READY', { semanticGenerationCalls: 1 }); onPhaseStart('CONTENT_PLAN_READY'); await sleep(20); await onPhase('CONTENT_PLAN_READY', { semanticGenerationCalls: 2 }); return { executionPackage: packageFor('content-within-derived-budget') } } })
  assert.equal(contentWithin.result.status, 'PASS'); assert.equal(contentWithin.report.lastCompletedPhase, 'PROMOTED')

  let lateCallbackRan = false
  const late = await run('late-callback', { timeoutMs: 10, resolveExecution: async (_identity, { onPhase, onPhaseStart }) => { onPhaseStart('CONTENT_PLAN_READY'); await sleep(30); lateCallbackRan = true; await onPhase('CONTENT_PLAN_READY', { semanticGenerationCalls: 2 }) } })
  await sleep(40)
  const lateReport = await report('late-callback', late.result)
  assert.equal(late.result.status, 'BLOCKED'); assert.equal(lateReport.lastCompletedPhase, null); assert.equal(lateCallbackRan, true); assert.equal(lateReport.timeoutDetails.operation, 'content_plan')

  console.log(JSON.stringify({ ok: true, smoke: 'jefe-semantic-timeout-budget', cases: { A: 'PASS', B: 'PASS', C: 'BLOCKED_BACKGROUND_DEADLINE', D: 'BLOCKED_BACKGROUND_POLL_LIMIT', E: 'BLOCKED_RUN_GLOBAL', F: 'PASS', G: 'PASS_LATE_CALLBACK_IGNORED' }, ProviderCalls: 0 }))
} finally { await fs.rm(root, { recursive: true, force: true }) }
