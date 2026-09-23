import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createOpenAISemanticProvider, providerConfig } = require('../electron/jefe-semantic-provider.cjs')

function scenario({ deadlineMs = 300000, initialDelayMs = 2000, intervalMs = 2500, maxPolls, terminalPoll = null } = {}) {
  let clock = 0
  let pollCount = 0
  let cancelCount = 0
  const now = () => clock
  const sleepImpl = async (ms) => { clock += ms }
  const fetchImpl = async (url, options) => {
    if (options.method === 'POST' && url.endsWith('/cancel')) { cancelCount += 1; return { ok: true, status: 200, text: async () => '{}' } }
    if (options.method === 'POST') return { ok: true, status: 200, text: async () => JSON.stringify({ id: 'resp-controlled', status: 'queued' }) }
    pollCount += 1
    const payload = terminalPoll && pollCount >= terminalPoll.after ? { id: 'resp-controlled', status: terminalPoll.status, output_text: JSON.stringify({ schemaVersion: 'business-understanding-v2' }) } : { id: 'resp-controlled', status: 'queued' }
    return { ok: true, status: 200, text: async () => JSON.stringify(payload) }
  }
  const env = { OPENAI_API_KEY: 'offline', AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED: 'true', AI_ORCHESTRATOR_SEMANTIC_BACKGROUND_DEADLINE_MS: String(deadlineMs), AI_ORCHESTRATOR_SEMANTIC_BACKGROUND_INITIAL_DELAY_MS: String(initialDelayMs), AI_ORCHESTRATOR_SEMANTIC_BACKGROUND_INTERVAL_MS: String(intervalMs), ...(maxPolls === undefined ? {} : { AI_ORCHESTRATOR_SEMANTIC_BACKGROUND_MAX_POLLS: String(maxPolls) }) }
  const provider = createOpenAISemanticProvider({ env, now, sleepImpl, fetchImpl })
  return { provider, now, counters: () => ({ pollCount, cancelCount }), config: providerConfig({ env }) }
}

const defaults = scenario()
assert.equal(defaults.config.configuredMaxPollRequests, 121)
assert.equal(defaults.config.effectiveMaxPollRequests, 121)
const defaultResult = await defaults.provider.request({ executionMode: 'background', input: [], operation: 'content_plan' })
assert.equal(defaultResult.errorCategory, 'BACKGROUND_DEADLINE_EXCEEDED')
assert.equal(defaultResult.telemetry.terminationReason, 'DEADLINE')
assert.equal(defaultResult.telemetry.elapsedMs, 300000)
assert.equal(defaultResult.telemetry.pollCount, 120)
assert.equal(defaults.counters().cancelCount, 1)

const explicit = scenario({ maxPolls: 5 })
const explicitResult = await explicit.provider.request({ executionMode: 'background', input: [], operation: 'content_plan' })
assert.equal(explicitResult.errorCategory, 'BACKGROUND_POLL_LIMIT_EXCEEDED')
assert.equal(explicitResult.telemetry.terminationReason, 'POLL_LIMIT')
assert.equal(explicitResult.telemetry.elapsedMs, 12000)
assert.equal(explicitResult.telemetry.pollCount, 5)
assert.equal(explicit.counters().cancelCount, 1)

const shortDeadline = scenario({ deadlineMs: 10000 })
const shortResult = await shortDeadline.provider.request({ executionMode: 'background', input: [], operation: 'content_plan' })
assert.equal(shortResult.errorCategory, 'BACKGROUND_DEADLINE_EXCEEDED')
assert.equal(shortResult.telemetry.terminationReason, 'DEADLINE')
assert.equal(shortResult.telemetry.elapsedMs, 10000)

const completed = scenario({ terminalPoll: { after: 1, status: 'completed' } })
const completedResult = await completed.provider.request({ executionMode: 'background', input: [], operation: 'content_plan' })
assert.equal(completedResult.ok, true)
assert.equal(completedResult.telemetry.terminationReason, 'RESPONSE_COMPLETED')
assert.equal(completedResult.telemetry.cancelAttempted, false)
assert.equal(completed.counters().cancelCount, 0)

console.log('PASS jefe-semantic-background-polling-deadline-smoke: derived default capacity, explicit poll limit, real deadline, bounded sleep, completion and cancel telemetry')
