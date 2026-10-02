import assert from 'node:assert/strict'
import { evaluateFactoryHermesRuntimeSelectionPlanning } from '../src/factory/hermes-runtime-selection-planning/index.ts'
import { evaluateFactoryHermesRuntimeSelectionDecision } from '../src/factory/hermes-runtime-selection-decision/index.ts'

const at = '2026-10-02T12:00:00.000Z'
const requirements = ['promptApproval', 'providerSelection', 'modelSelection', 'credentialSelection', 'networkHostApproval', 'toolsetSelectionApproval', 'runtimeRunRootApproval', 'finalExecutionApproval'].map((requirementId) => ({ requirementId, reason: 'fixture' }))
const approval = { approvalId: 'approval-fixture', status: 'research_execution_approval_blocked', decision: 'hermes_research_execution_approval_blocked_missing_runtime_selections', approvalStatus: 'not_approved', canProceedToRuntimeSelectionPlanning: true, canProceedToResearchRuntimeAdapter: false, canRunResearchNow: false, runtimeSelectionRequirements: requirements }
const policies = { promptPolicyPlanning: { hermesPromptPolicyPlanCandidate: { promptCandidate: { sha256: 'hash-fixture', text: 'safe prompt' } } }, networkPolicyPlanning: { hermesNetworkPolicyPlanCandidate: { providerNetworkCandidates: [{ hostCandidates: ['api.openai.com'] }] } } }
const plan = evaluateFactoryHermesRuntimeSelectionPlanning({ plannedAt: at, plannedBy: '11A-smoke', researchExecutionApprovalResult: approval, policyPlanningResults: policies })
assert.equal(plan.status, 'runtime_selection_plan_created')
assert.equal(plan.canRunResearchNow, false)
assert.equal(plan.canProceedToRuntimeSelectionDecision, true)
assert.equal(plan.hermesRuntimeSelectionPlanCandidate?.providerSelectionCandidates.length, 5)
assert.deepEqual(plan.hermesRuntimeSelectionPlanCandidate?.networkHostSelectionCandidates[0].hostCandidates, ['api.openai.com'])
const decision = evaluateFactoryHermesRuntimeSelectionDecision({ decidedAt: at, decidedBy: '11A-smoke', runtimeSelectionPlanningResult: plan })
assert.equal(decision.status, 'runtime_selection_decision_recorded')
assert.equal(decision.canProceedToResearchExecutionApprovalRetry, true)
assert.equal(decision.canExecuteHermesNow, false)
assert.equal(decision.selectedModel.modelId, 'gpt-4o-mini')
assert.deepEqual(decision.selectedNetworkHosts.selectedHosts, ['api.openai.com'])
assert.equal(evaluateFactoryHermesRuntimeSelectionPlanning({ plannedAt: at, plannedBy: '11A-smoke' }).status, 'blocked')
assert.equal(evaluateFactoryHermesRuntimeSelectionDecision({ decidedAt: at, decidedBy: '11A-smoke' }).status, 'blocked')
const malformed = structuredClone(plan); malformed.hermesRuntimeSelectionPlanCandidate.providerSelectionCandidates = []
assert.equal(evaluateFactoryHermesRuntimeSelectionDecision({ decidedAt: at, decidedBy: '11A-smoke', runtimeSelectionPlanningResult: malformed }).status, 'runtime_selection_decision_recorded')
console.log(JSON.stringify({ ok: true, suite: 'QUALITY_BATCH_11A', checks: 12, runtimeExecuted: false }, null, 2))
