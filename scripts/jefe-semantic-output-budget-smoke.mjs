import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { OUTPUT_BUDGET_POLICY, ProviderRunBudget } = require('../electron/jefe-semantic-provider.cjs')

for (const operation of ['business_understanding', 'content_plan', 'experience_plan', 'correction_plan']) {
  const policy = OUTPUT_BUDGET_POLICY[operation]
  assert.ok(policy.initialOutputBudget < policy.retryOutputBudget)
  assert.equal(policy.maxRetries, 1)
  assert.ok(policy.initialOutputBudget >= 1200)
}
assert.ok(OUTPUT_BUDGET_POLICY.business_understanding.initialOutputBudget > OUTPUT_BUDGET_POLICY.minimal_probe.initialOutputBudget)
const fixture = JSON.stringify({ hero: 'A'.repeat(300), presentation: 'B'.repeat(300), services: ['service one', 'service two', 'service three'], trust: ['clear method', 'visible scope', 'guided support'], faq: ['question one', 'question two', 'question three', 'question four'], contact: 'Start a conversation', contentPriorities: ['clarity', 'trust'] })
assert.ok(Math.ceil(Buffer.byteLength(fixture, 'utf8') / 4) < OUTPUT_BUDGET_POLICY.content_plan.initialOutputBudget)
const budget = new ProviderRunBudget({ runId: 'budget-fixture', maxCalls: 6 })
for (const operation of ['business_understanding', 'business_understanding', 'content_plan', 'content_plan', 'experience_plan', 'experience_plan']) assert.equal(await budget.reserve(operation), true)
assert.equal(budget.callsUsed, 6)
assert.equal(await budget.reserve('overflow'), false)
assert.deepEqual(budget.snapshot().operationCounts, { business_understanding: 2, content_plan: 2, experience_plan: 2 })
console.log('PASS jefe-semantic-output-budget-smoke: operation policy, headroom guard, one-retry policy, six-call worst case, hard ceiling')
