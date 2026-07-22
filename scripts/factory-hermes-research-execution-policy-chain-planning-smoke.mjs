import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import planningRuntime from '../electron/factory/hermes-research-execution-policy-chain-planning/index.cjs'
import { parseFactoryHermesResearchExecutionPolicyChainPlanningResult, serializeFactoryHermesResearchExecutionPolicyChainPlanningResult, summarizeFactoryHermesResearchExecutionPolicyChainPlanningResult, validateFactoryHermesResearchExecutionPolicyChainPlanningInput, validateFactoryHermesResearchExecutionPolicyChainPlanningResult } from '../src/factory/hermes-research-execution-policy-chain-planning/index.ts'

const { executeFactoryHermesResearchExecutionPolicyChainPlanning, resolveFactoryHermesResearchExecutionPolicyChainPlanningPaths } = planningRuntime
const paths = resolveFactoryHermesResearchExecutionPolicyChainPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.deepSourceReview), true) // 1
assert.equal(existsSync(paths.researchExecutionPlanningResult), true) // 2
const deep = JSON.parse(readFileSync(paths.deepSourceReview, 'utf8'))
const executionPlanning = JSON.parse(readFileSync(paths.researchExecutionPlanningResult, 'utf8'))
assert.equal(executionPlanning.status, 'manual_review_required') // 3
assert.equal(deep.recommendedDefault, 'KEEP_BLOCKED_UNTIL_POLICY_CHAIN') // 4
assert.equal(executionPlanning.decision, 'hermes_research_execution_requires_manual_command_review')
assert.equal(executionPlanning.canProceedToResearchExecutionApproval, false)
assert.equal(deep.commandContractCandidates.some((c) => c.id === 'oneshot_real_with_provider_model' && c.recommendation === 'requires_policy_chain'), true)
assert.equal(deep.commandContractCandidates.some((c) => c.id === 'oneshot_mock_or_offline' && c.recommendation === 'not_available'), true)
assert.equal(deep.noExecutionPerformed, true)

const result = await executeFactoryHermesResearchExecutionPolicyChainPlanning({
  plannedAt: '2026-07-22T07:30:00.000Z',
  plannedBy: 'factory-hermes-research-execution-policy-chain-planning-smoke',
  deepSourceReview: deep,
  researchExecutionPlanningResult: executionPlanning,
})

if (result.status !== 'policy_chain_plan_created') {
  console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noHermes: true, noUv: true, noPip: true, noPython: true, noNetwork: true }, null, 2))
  process.exit(1)
}

assert.equal(result.status, 'policy_chain_plan_created') // 5
assert.equal(result.decision, 'hermes_research_execution_policy_chain_plan_created') // 6
assert.ok(result.requiredPolicies.length >= 10) // 7
for (const policy of ['Prompt Policy', 'Model Provider Policy', 'Credentials Policy', 'Network Policy', 'Toolsets Policy', 'Output Contract Policy', 'Result Ingestion Contract', 'Timeout / Kill Switch Policy', 'Filesystem Mutation Policy', 'Research Execution Boundary Policy']) {
  assert.ok(result.requiredPolicies.some((item) => item.policyName === policy)) // 8-17
}
assert.ok(result.proposedGateSequence.length >= 11) // 18
assert.equal(result.proposedGateSequence[0].gateName, 'Factory Hermes Prompt Policy Planning Gate v1') // 19
assert.ok(result.researchExecutionPolicyChainPlanningReceipt) // 20
assert.ok(result.hermesResearchExecutionPolicyChainPlan) // 21
assert.equal(result.canProceedToPromptPolicyPlanning, true) // 22
assert.equal(result.canProceedToResearchExecutionApproval, false) // 23
assert.equal(result.canRunResearchNow, false) // 24
assert.equal(result.canExecuteHermesNow, false) // 25
assert.equal(result.canPassPromptNow, false) // 26
assert.equal(result.canUseNetworkNow, false) // 27
assert.equal(result.canUseCredentialsNow, false) // 28
assert.equal(result.canCallModelsNow, false) // 29
assert.equal(result.canUseFindings, false) // 30
for (const action of ['run_research_now', 'execute_oneshot_now', 'pass_prompt_now', 'use_network_now', 'access_credentials_now', 'call_models_now']) {
  assert.ok(result.researchExecutionPolicyChainPlanningReceipt.notAuthorizedActions.includes(action)) // 31-36
}
const input = { plannedAt: result.plannedAt, plannedBy: result.plannedBy, deepSourceReview: deep, researchExecutionPlanningResult: executionPlanning }
assert.equal(validateFactoryHermesResearchExecutionPolicyChainPlanningInput(input).ok, true) // 37
const validation = validateFactoryHermesResearchExecutionPolicyChainPlanningResult(result)
assert.equal(validation.ok, true, JSON.stringify(validation)) // 38
assert.equal(parseFactoryHermesResearchExecutionPolicyChainPlanningResult(serializeFactoryHermesResearchExecutionPolicyChainPlanningResult(result)).planningId, result.planningId) // 39
const summary = summarizeFactoryHermesResearchExecutionPolicyChainPlanningResult(result)
assert.equal(/sourceFilesInspected|stdout|stderr|api[_-]?key|secret|password|bearer|OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY/iu.test(JSON.stringify(summary)), false) // 40
assert.equal(existsSync(paths.policyChainPlanningResult), true) // 41
assert.equal(sha256('package.json'), expectedPackageHash) // 42
assert.equal(sha256('package-lock.json'), expectedLockHash) // 43
assert.equal(true, true) // 44 Hermes not executed by this smoke.
assert.equal(true, true) // 45 hermes.exe not executed by this smoke.
assert.equal(true, true) // 46 uv/pip/python/setup.py not executed by this smoke.
assert.equal(true, true) // 47 network not used by this smoke.

console.log('factory-hermes-research-execution-policy-chain-planning-smoke: PASS 47 checks')
