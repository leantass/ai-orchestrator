const assert = require('node:assert/strict')
const cp = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const ts = require('typescript')

const root = process.cwd()
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jefe-batch-3-'))
const domains = [
  { dir: 'hermes-wrapper-no-tool-mode-approval', prefix: 'hermes-wrapper-no-tool-mode-approval', evaluate: 'evaluateFactoryHermesWrapperNoToolModeApproval', serialize: 'serializeFactoryHermesWrapperNoToolModeApprovalResult' },
  { dir: 'hermes-wrapper-no-tool-mode-implementation-approval', prefix: 'hermes-wrapper-no-tool-mode-implementation-approval', evaluate: 'evaluateFactoryHermesWrapperNoToolModeImplementationApproval', serialize: 'serializeFactoryHermesWrapperNoToolModeImplementationApprovalResult' },
]

function compile(version, domain, suffix) {
  const file = `src/factory/${domain.dir}/${domain.prefix}.${suffix}.ts`
  const source = version === 'after' ? fs.readFileSync(path.join(root, file), 'utf8') : cp.execFileSync('git', ['show', `d27925b436abfffbcff23bab48409bbf4f578141:${file}`], { encoding: 'utf8' })
  return ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll('.ts', '.js')
}
function load(version, domain) {
  const dir = path.join(tempRoot, version, domain.dir); fs.mkdirSync(dir, { recursive: true })
  for (const suffix of ['defaults', 'evaluate', 'serialize']) fs.writeFileSync(path.join(dir, `${domain.prefix}.${suffix}.js`), compile(version, domain, suffix))
  return { evaluate: require(path.join(dir, `${domain.prefix}.evaluate.js`))[domain.evaluate], serialize: require(path.join(dir, `${domain.prefix}.serialize.js`))[domain.serialize] }
}

const planning = { planningId: 'planning-1', status: 'wrapper_no_tool_mode_plan_created', decision: 'hermes_wrapper_no_tool_mode_plan_created_for_approval', wrapperPlanningStatus: 'plan_candidate_created', recommendedWrapperPath: { chosenStrategyId: 'wrapper_temp_config_no_toolsets' }, hermesWrapperNoToolModePlanCandidate: { directHermesRuntimeAdapterBlocked: true, sourceMutationAllowedNow: false, wrapperImplementationAllowedNow: false, wrapperExecutionAllowedNow: false, runtimeAdapterAllowedNow: false, researchExecutionAllowedNow: false }, canProceedToHermesWrapperNoToolModeApproval: true, canRunResearchNow: false }
const revision = { planningId: 'revision-1', hermesRuntimeSelectionRevisionPlanCandidate: { directHermesRuntimeAdapterBlocked: true, wrapperPlanningRecommended: true } }
const toolset = { status: 'toolset_disable_verification_approval_blocked', approvalStatus: 'blocked' }
const implementationPlan = { planningId: 'implementation-plan-1', status: 'wrapper_no_tool_mode_implementation_plan_created', decision: 'hermes_wrapper_no_tool_mode_implementation_plan_created_for_approval', implementationPlanningStatus: 'plan_candidate_created', selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', wrapperImplementationArchitecturePlan: {}, wrapperTempConfigPlan: {}, wrapperNoToolEnforcementPlan: {}, wrapperValidationPlan: {}, wrapperImplementationRiskRegister: {}, hermesWrapperNoToolModeImplementationPlanCandidate: { wrapperImplementationAllowedNow: false, wrapperExecutionAllowedNow: false, tempConfigCreationAllowedNow: false, sourceMutationAllowedNow: false, researchRuntimeAdapterAllowedNow: false, researchExecutionAllowedNow: false, futureImplementationRequiresApproval: true, futureVerificationRequiresApproval: true }, canProceedToHermesWrapperNoToolModeImplementationApproval: true, canProceedToHermesWrapperNoToolModeImplementation: false, canRunResearchNow: false }
const approval = { approvalId: 'approval-1', status: 'wrapper_no_tool_mode_approval_granted', decision: 'hermes_wrapper_no_tool_mode_approved_for_implementation_planning', approvalStatus: 'approved_for_implementation_planning', hermesWrapperNoToolModeApprovalDecision: { implementationPlanningApproved: true, wrapperImplementationApproved: false, wrapperExecutionApproved: false, researchRuntimeAdapterApproved: false, researchExecutionApproved: false } }
const cases = [
  [{ evaluatedAt: '2026-07-23T04:00:00.000Z', evaluatedBy: 'batch-3-hermetic-test', wrapperNoToolModePlanningResult: planning, runtimeSelectionRevisionPlanningResult: revision, toolsetDisableVerificationApprovalResult: toolset }, 0],
  [{ evaluatedAt: '2026-07-23T04:01:00.000Z', evaluatedBy: 'batch-3-hermetic-test', wrapperNoToolModePlanningResult: { ...planning, canRunResearchNow: true }, runtimeSelectionRevisionPlanningResult: revision, toolsetDisableVerificationApprovalResult: toolset }, 0],
]
const beforeApproval = load('before', domains[0]); const afterApproval = load('after', domains[0])
for (const [input] of cases) { const before = beforeApproval.evaluate(input); const after = afterApproval.evaluate(input); assert.deepEqual(after, before); assert.equal(afterApproval.serialize(after), beforeApproval.serialize(before)) }
const beforeImplementation = load('before', domains[1]); const afterImplementation = load('after', domains[1])
for (const input of [{ evaluatedAt: '2026-07-23T05:00:00.000Z', evaluatedBy: 'batch-3-hermetic-test', implementationPlanningResult: implementationPlan, wrapperNoToolModeApprovalResult: approval }, { evaluatedAt: '2026-07-23T05:01:00.000Z', evaluatedBy: 'batch-3-hermetic-test', implementationPlanningResult: { ...implementationPlan, canRunResearchNow: true }, wrapperNoToolModeApprovalResult: approval }]) { const before = beforeImplementation.evaluate(input); const after = afterImplementation.evaluate(input); assert.deepEqual(after, before); assert.equal(afterImplementation.serialize(after), beforeImplementation.serialize(before)) }
console.log('factory-hermes-wrapper-approval-batch-3-hermetic-test: PASS BEFORE/AFTER, approved/blocked fixtures and serializations')
