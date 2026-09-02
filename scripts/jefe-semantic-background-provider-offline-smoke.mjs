import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { ProviderRunBudget, createOpenAISemanticProvider } = require('../electron/jefe-semantic-provider.cjs')
function createScenario(sequence, envExtra = {}) {
  let post = 0; let poll = 0; let cancel = 0
  const provider = createOpenAISemanticProvider({ env: { OPENAI_API_KEY: 'offline', AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED: 'true', AI_ORCHESTRATOR_SEMANTIC_BACKGROUND_INITIAL_DELAY_MS: '0', AI_ORCHESTRATOR_SEMANTIC_BACKGROUND_INTERVAL_MS: '0', ...envExtra }, callBudget: new ProviderRunBudget({ runId: `offline-background-${Math.random()}`, maxCalls: 6 }), sleepImpl: async () => {}, fetchImpl: async (url, options) => {
    if (options.method === 'POST' && url.endsWith('/cancel')) { cancel += 1; return { ok: true, status: 200, text: async () => '{}' } }
    if (options.method === 'POST') { post += 1; const value = sequence.posts?.[post - 1] || sequence.posts?.at(-1) || { status: 'queued', id: `resp-${post}` }; return { ok: true, status: 200, text: async () => JSON.stringify(value) } }
    poll += 1; if (sequence.pollErrors?.includes(poll)) throw new Error('transient poll')
    const value = sequence.polls?.[poll - 1] || sequence.polls?.at(-1) || { status: 'completed', id: 'resp-bg', output_text: JSON.stringify({ schemaVersion: 'business-understanding-v2' }) }
    return { ok: sequence.pollHttpErrors?.includes(poll) !== true, status: sequence.pollHttpErrors?.includes(poll) ? 503 : 200, text: async () => JSON.stringify(value) }
  } })
  return { provider, counters: () => ({ post, poll, cancel }) }
}
const happy = createScenario({ posts: [{ status: 'queued', id: 'resp-bg' }], polls: [{ status: 'in_progress', id: 'resp-bg' }, { status: 'completed', id: 'resp-bg', output_text: JSON.stringify({ schemaVersion: 'business-understanding-v2' }) }] })
const happyResult = await happy.provider.request({ executionMode: 'background', input: [], maxOutputTokens: 1200, operation: 'business_understanding' })
assert.equal(happyResult.ok, true); assert.deepEqual(happy.counters(), { post: 1, poll: 2, cancel: 0 }); assert.equal(happy.provider.transportStats.generationRequests, 1); assert.equal(happy.provider.transportStats.pollRequests, 2); assert.equal(happy.provider.transportStats.totalHttpRequests, 3)
const incomplete = createScenario({ posts: [{ status: 'queued', id: 'resp-one' }, { status: 'queued', id: 'resp-two' }], polls: [{ status: 'incomplete', id: 'resp-one', incomplete_details: { reason: 'max_output_tokens' } }, { status: 'completed', id: 'resp-two', output_text: JSON.stringify({ schemaVersion: 'business-understanding-v2' }) }] })
const incompleteResult = await incomplete.provider.request({ executionMode: 'background', input: [], maxOutputTokens: 1200, retryOutputBudget: 2400, outputBudgetRetryMax: 1, operation: 'business_understanding' })
assert.equal(incompleteResult.ok, true); assert.equal(incomplete.provider.transportStats.generationRequests, 2); assert.equal(incomplete.provider.transportStats.pollRequests, 2)
for (const terminal of ['failed', 'cancelled']) { const scenario = createScenario({ posts: [{ status: 'queued', id: `resp-${terminal}` }], polls: [{ status: terminal, id: `resp-${terminal}` }] }); const result = await scenario.provider.request({ executionMode: 'background', input: [], maxOutputTokens: 1200 }); assert.equal(result.ok, false); assert.equal(result.status, terminal) }
const deadline = createScenario({ posts: [{ status: 'queued', id: 'resp-deadline' }], polls: [{ status: 'queued', id: 'resp-deadline' }] }, { AI_ORCHESTRATOR_SEMANTIC_BACKGROUND_DEADLINE_MS: '1', AI_ORCHESTRATOR_SEMANTIC_BACKGROUND_MAX_POLLS: '1' })
const deadlineResult = await deadline.provider.request({ executionMode: 'background', input: [], maxOutputTokens: 1200 }); assert.equal(deadlineResult.errorCategory, 'BACKGROUND_DEADLINE_EXCEEDED'); assert.equal(deadline.counters().cancel, 1)
const transient = createScenario({ posts: [{ status: 'queued', id: 'resp-transient' }], pollErrors: [1], polls: [{ status: 'queued', id: 'resp-transient' }, { status: 'completed', id: 'resp-transient', output_text: JSON.stringify({ schemaVersion: 'business-understanding-v2' }) }] })
assert.equal((await transient.provider.request({ executionMode: 'background', input: [], maxOutputTokens: 1200 })).ok, true); assert.equal(transient.provider.transportStats.pollRequests, 2)
console.log('PASS jefe-semantic-background-provider-offline-smoke: completed/incomplete-retry/failed/cancelled/deadline-cancel/transient-poll, store=false, bounded polling, generation budget separation, transport stats')
