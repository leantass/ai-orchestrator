import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createSemanticRuntimeComposition } = require('../electron/jefe-semantic-runtime-composition.cjs')
const { ProviderRunBudget } = require('../electron/jefe-semantic-provider.cjs')

assert.equal(process.env.AI_ORCHESTRATOR_SEMANTIC_MODEL, 'gpt-5.6-terra')
const budget = new ProviderRunBudget({ runId: 'gpt56-terra-qualification', maxCalls: 4 })
const composition = createSemanticRuntimeComposition({ root: 'C:/Users/letas/AppData/Local/Temp/jefe-gpt56-qualification', mode: 'productive', env: process.env, callBudget: budget })
assert.equal(composition.providerHealth.model, 'gpt-5.6-terra')
assert.equal(composition.providerHealth.enabled, true)
assert.equal(composition.providerHealth.credentialAvailable, true)
const plans = await composition.runSemanticPlans({ brief: 'Fictional coworking company with hourly private offices and reservable meeting rooms.', sourceRefs: ['synthetic-brief:gpt56-qualification'] })
for (const [name, plan] of Object.entries(plans)) if (name !== 'providerBudget') { assert.match(plan.provenance.provider, /^openai(?:-semantic)?$/u); assert.equal(plan.provenance.model, 'gpt-5.6-terra'); assert.ok(plan.decision.schemaVersion.endsWith('-v2')) }
assert.ok(budget.snapshot().callsUsed <= 4)
console.log(`PASS jefe-gpt56-terra-qualification: model=gpt-5.6-terra, background plans=3, calls=${budget.snapshot().callsUsed}/4, no fallback`)
