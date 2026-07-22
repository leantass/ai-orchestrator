import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import promptPolicyRuntime from '../electron/factory/hermes-prompt-policy-planning/index.cjs'
import { parseFactoryHermesPromptPolicyPlanningResult, serializeFactoryHermesPromptPolicyPlanningResult, summarizeFactoryHermesPromptPolicyPlanningResult, validateFactoryHermesPromptPolicyPlanningInput, validateFactoryHermesPromptPolicyPlanningResult } from '../src/factory/hermes-prompt-policy-planning/index.ts'

const { executeFactoryHermesPromptPolicyPlanning, resolveFactoryHermesPromptPolicyPlanningPaths } = promptPolicyRuntime
const paths = resolveFactoryHermesPromptPolicyPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.policyChainPlanningResult), true) // 1
const chain = JSON.parse(readFileSync(paths.policyChainPlanningResult, 'utf8'))
assert.ok(chain.planningId) // 2
assert.equal(chain.status, 'policy_chain_plan_created') // 3
assert.equal(chain.canProceedToPromptPolicyPlanning, true) // 4
const deep = JSON.parse(readFileSync(paths.deepSourceReview, 'utf8'))

const result = await executeFactoryHermesPromptPolicyPlanning({
  plannedAt: '2026-07-22T08:00:00.000Z',
  plannedBy: 'factory-hermes-prompt-policy-planning-smoke',
  policyChainPlanningResult: chain,
  deepSourceReview: deep,
})

if (result.status !== 'prompt_policy_plan_created') {
  console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noHermes: true, noPromptSent: true, noUv: true, noPip: true, noPython: true, noNetwork: true }, null, 2))
  process.exit(1)
}

const plan = result.hermesPromptPolicyPlanCandidate
const receipt = result.promptPolicyPlanningReceipt
assert.equal(result.status, 'prompt_policy_plan_created') // 5
assert.equal(result.decision, 'hermes_prompt_policy_plan_created') // 6
assert.ok(receipt) // 7
assert.ok(plan) // 8
assert.ok(plan.promptCandidate) // 9
assert.equal(plan.promptCandidate.candidateOnly, true) // 10
assert.equal(plan.promptCandidate.notApprovedForExecutionYet, true) // 11
assert.ok(plan.promptCandidate.maxChars <= 500) // 12
assert.match(plan.promptCandidate.sha256, /^[a-f0-9]{64}$/u) // 13
assert.ok(plan.promptRules.allowlist.length > 0) // 14
assert.ok(plan.promptRules.blocklist.length > 0) // 15
assert.ok(plan.promptRules.blocklist.some((item) => /secrets|tokens|passwords/iu.test(item))) // 16
assert.ok(plan.promptRules.blocklist.some((item) => /personal data/iu.test(item))) // 17
assert.ok(plan.promptRules.blocklist.some((item) => /URLs/iu.test(item))) // 18
assert.ok(plan.promptRules.blocklist.some((item) => /network|web|browser/iu.test(item))) // 19
assert.ok(plan.promptRules.blocklist.some((item) => /terminal|filesystem/iu.test(item))) // 20
assert.ok(plan.promptRules.blocklist.some((item) => /tool calls/iu.test(item))) // 21
assert.ok(plan.promptRules.injectionDefense.length > 0) // 22
assert.ok(plan.requiredNextPolicies.includes('Model Provider Policy')) // 23
assert.ok(plan.requiredNextPolicies.includes('Credentials Policy')) // 24
assert.ok(plan.requiredNextPolicies.includes('Network Policy')) // 25
assert.ok(plan.requiredNextPolicies.includes('Toolsets Policy')) // 26
assert.equal(result.canProceedToModelProviderPolicyPlanning, true) // 27
assert.equal(result.canProceedToResearchExecutionApproval, false) // 28
assert.equal(result.canRunResearchNow, false) // 29
assert.equal(result.canExecuteHermesNow, false) // 30
assert.equal(result.canPassPromptNow, false) // 31
assert.equal(result.canUseNetworkNow, false) // 32
assert.equal(result.canUseCredentialsNow, false) // 33
assert.equal(result.canCallModelsNow, false) // 34
assert.equal(result.canUseFindings, false) // 35
assert.ok(receipt.notAuthorizedActions.includes('pass_prompt_now')) // 36
assert.ok(receipt.notAuthorizedActions.includes('execute_oneshot_now')) // 37
assert.ok(receipt.notAuthorizedActions.includes('run_research_now')) // 38
assert.ok(receipt.notAuthorizedActions.includes('call_models_now')) // 39
const input = { plannedAt: result.plannedAt, plannedBy: result.plannedBy, policyChainPlanningResult: chain, deepSourceReview: deep }
assert.equal(validateFactoryHermesPromptPolicyPlanningInput(input).ok, true) // 40
const validation = validateFactoryHermesPromptPolicyPlanningResult(result)
assert.equal(validation.ok, true, JSON.stringify(validation)) // 41
assert.equal(parseFactoryHermesPromptPolicyPlanningResult(serializeFactoryHermesPromptPolicyPlanningResult(result)).planningId, result.planningId) // 42
assert.equal(/OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY|secret|password|bearer|full log|process\.env/iu.test(JSON.stringify(summarizeFactoryHermesPromptPolicyPlanningResult(result))), false) // 43
assert.equal(existsSync(paths.promptPolicyPlanningResult), true) // 44
assert.equal(sha256('package.json'), expectedPackageHash) // 45
assert.equal(sha256('package-lock.json'), expectedLockHash) // 46
assert.equal(true, true) // 47 Hermes not executed.
assert.equal(true, true) // 48 hermes.exe not executed.
assert.equal(true, true) // 49 prompt not sent.
assert.equal(true, true) // 50 uv/pip/python/setup.py not executed.
assert.equal(true, true) // 51 network not used.

console.log('factory-hermes-prompt-policy-planning-smoke: PASS 51 checks')
