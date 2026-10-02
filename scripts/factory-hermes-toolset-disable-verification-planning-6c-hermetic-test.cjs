const assert = require('node:assert/strict')
const cp = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const ts = require('typescript')

const root = path.resolve(__dirname, '..')
const baseline = '676d96283f287600583f52fc1a276b3de92f4d18'
const domain = 'hermes-toolset-disable-verification-planning'
const files = ['index.ts', `${domain}.types.ts`, `${domain}.defaults.ts`, `${domain}.evaluate.ts`, `${domain}.validate.ts`, `${domain}.serialize.ts`]

function source(version, file) { return version === 'before' ? cp.execFileSync('git', ['show', `${baseline}:src/factory/${domain}/${file}`], { cwd: root, encoding: 'utf8' }) : fs.readFileSync(path.join(root, 'src/factory', domain, file), 'utf8') }
function load(version) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `jefe-6c-${version}-`))
  for (const file of files) fs.writeFileSync(path.join(dir, file.replace('.ts', '.js')), ts.transpileModule(source(version, file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll('.ts', '.js'))
  return require(path.join(dir, 'index.js'))
}

const adapterBlocked = { status: 'research_runtime_adapter_approval_blocked', decision: 'hermes_research_runtime_adapter_approval_blocked_toolset_mode_unverified', runtimeAdapterApprovalStatus: 'blocked', canProceedToToolsetDisableVerificationPlanning: true, canProceedToResearchRuntimeAdapter: false, canRunResearchNow: false, canExecuteHermesNow: false, adapterApprovalId: 'fixture:adapter' }
const validInput = { plannedAt: '2026-10-02T12:00:00.000Z', plannedBy: 'batch-6c-hermetic', researchRuntimeAdapterApprovalResult: adapterBlocked, runtimeSelectionDecisionResult: { status: 'runtime_selection_decision_created' }, toolsetsPolicyPlanningResult: { status: 'toolsets_policy_plan_created' }, sourceInspection: { hasToolsetsArg: true, hasNoMcp: true } }
const fixtures = [
  ['valid-static-review', validInput],
  ['valid-toolset-shape', { ...validInput, sourceInspection: { hasToolsetsArg: true, hasNoMcp: true, extra: 'ignored' } }],
  ['missing-adapter', { ...validInput, researchRuntimeAdapterApprovalResult: undefined }],
  ['blocked-adapter', { ...validInput, researchRuntimeAdapterApprovalResult: { ...adapterBlocked, canProceedToToolsetDisableVerificationPlanning: false } }],
  ['invalid-adapter-status', { ...validInput, researchRuntimeAdapterApprovalResult: { ...adapterBlocked, status: 'approved' } }],
  ['missing-toolset', { ...validInput, sourceInspection: {} }],
  ['null-optionals', { ...validInput, runtimeSelectionDecisionResult: null, toolsetsPolicyPlanningResult: null, sourceInspection: null }],
  ['policy-disabled', { ...validInput, policy: { requireAdapterApprovalBlockedByToolset: false } }],
  ['input-invalid', {}],
]

function projection(result) {
  return { status: result.status, decision: result.decision, selectedToolsetMode: result.selectedToolsetMode, staticVerificationStatus: result.staticVerificationStatus, evidence: result.toolsetDisableEvidence, candidates: result.toolsetDisableVerificationCandidates, checks: result.checks, blockers: result.blockers, warnings: result.warnings, summary: result.toolsetDisableVerificationRecommendation, downstream: { approval: result.canProceedToToolsetDisableVerificationApproval, retry: result.canProceedToResearchRuntimeAdapterApprovalRetry, runtime: result.canProceedToResearchRuntimeAdapter, execute: result.canExecuteHermesNow, network: result.canUseNetworkNow, mutate: result.canMutateFilesystemNow } }
}

const before = load('before')
const after = load('after')
let count = 0
for (const [name, input] of fixtures) {
  const beforeValidation = before.validateFactoryHermesToolsetDisableVerificationPlanningInput(input)
  const afterValidation = after.validateFactoryHermesToolsetDisableVerificationPlanningInput(input)
  assert.deepEqual(afterValidation, beforeValidation, `${name}: input validation changed`); count++
  const beforeResult = before.evaluateFactoryHermesToolsetDisableVerificationPlanning(input)
  const afterResult = after.evaluateFactoryHermesToolsetDisableVerificationPlanning(input)
  assert.deepEqual(projection(afterResult), projection(beforeResult), `${name}: behavior changed`); count++
  if (beforeResult.status === 'toolset_disable_verification_plan_created') {
    assert.equal(before.validateFactoryHermesToolsetDisableVerificationPlanningResult(beforeResult).ok, true, `${name}: before result invalid`)
    assert.equal(after.validateFactoryHermesToolsetDisableVerificationPlanningResult(afterResult).ok, true, `${name}: after result invalid`)
    assert.deepEqual(JSON.parse(after.serializeFactoryHermesToolsetDisableVerificationPlanningResult(afterResult)), JSON.parse(before.serializeFactoryHermesToolsetDisableVerificationPlanningResult(beforeResult)), `${name}: serialization changed`); count += 3
  }
}
const valid = after.evaluateFactoryHermesToolsetDisableVerificationPlanning(validInput)
for (const key of ['canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) assert.equal(valid[key], false); count += 7
assert.equal(valid.toolsetDisableEvidence.noToolModeProven, false); assert.equal(valid.canProceedToResearchRuntimeAdapterApprovalRetry, false); count += 2
console.log(`factory-hermes-toolset-disable-verification-planning-6c-hermetic-test: PASS ${count} assertions across ${fixtures.length} fixtures`)
