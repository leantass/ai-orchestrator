const assert = require('node:assert/strict')
const cp = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const ts = require('typescript')

const root = process.cwd()
const baseline = '5a5a4698fe263d4a2cb38fbe4fd548476f5b6723'
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jefe-4a-before-'))
const dir = path.join(tempRoot, 'implementation-planning'); fs.mkdirSync(dir, { recursive: true })
const sourceFiles = ['index.ts', 'hermes-wrapper-no-tool-mode-implementation-planning.defaults.ts', 'hermes-wrapper-no-tool-mode-implementation-planning.evaluate.ts', 'hermes-wrapper-no-tool-mode-implementation-planning.serialize.ts', 'hermes-wrapper-no-tool-mode-implementation-planning.types.ts', 'hermes-wrapper-no-tool-mode-implementation-planning.validate.ts']
for (const file of sourceFiles) {
  const repoFile = `src/factory/hermes-wrapper-no-tool-mode-implementation-planning/${file}`
  const source = cp.execFileSync('git', ['show', `${baseline}:${repoFile}`], { encoding: 'utf8' })
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll('.ts', '.js')
  fs.writeFileSync(path.join(dir, file.replace('.ts', '.js')), output)
}
const mod = require(path.join(dir, 'index.js'))
const approval = { approvalId: 'approval-1', status: 'wrapper_no_tool_mode_approval_granted', decision: 'hermes_wrapper_no_tool_mode_approved_for_implementation_planning', approvalStatus: 'approved_for_implementation_planning', approvedWrapperNoToolModeImplementationPlanningEnvelope: { selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets' }, hermesWrapperNoToolModeApprovalDecision: { implementationPlanningApproved: true, wrapperImplementationApproved: false, wrapperExecutionApproved: false, researchRuntimeAdapterApproved: false, researchExecutionApproved: false }, canProceedToHermesWrapperNoToolModeImplementationPlanning: true, canProceedToHermesWrapperNoToolModeImplementation: false, canRunResearchNow: false }
const planning = { planningId: 'planning-1', status: 'wrapper_no_tool_mode_plan_created', decision: 'hermes_wrapper_no_tool_mode_plan_created_for_approval', wrapperPlanningStatus: 'plan_candidate_created', hermesWrapperNoToolModePlanCandidate: { directHermesRuntimeAdapterBlocked: true, sourceMutationAllowedNow: false, wrapperImplementationAllowedNow: false, wrapperExecutionAllowedNow: false } }
const base = { plannedAt: '2026-10-01T12:00:00.000Z', plannedBy: 'batch-4a-before-characterization', wrapperNoToolModeApprovalResult: approval, wrapperNoToolModePlanningResult: planning }
const cases = {
  valid_with_source: { ...base, sourceInspection: { configSchemaKnown: true, emptyToolsetsInConfigSupported: false, configPathSelectionMethodKnown: true } },
  valid_without_source: { ...base },
  invalid_source_shape: { ...base, sourceInspection: { exactConfigSchemaKnown: 'unexpected', emptyToolsetsInConfigSupported: null } },
  blocked_missing_approval: { ...base, wrapperNoToolModeApprovalResult: null },
  blocked_incomplete_planning: { ...base, wrapperNoToolModePlanningResult: { status: 'blocked' } },
  optional_nulls: { ...base, sourceInspection: null, planningNotes: undefined },
}
const characterized = {}
for (const [name, input] of Object.entries(cases)) {
  const result = mod.evaluateFactoryHermesWrapperNoToolModeImplementationPlanning(input)
  const validation = mod.validateFactoryHermesWrapperNoToolModeImplementationPlanningResult(result)
  const serialized = mod.serializeFactoryHermesWrapperNoToolModeImplementationPlanningResult(result)
  assert.equal(mod.parseFactoryHermesWrapperNoToolModeImplementationPlanningResult(serialized).planningId, result.planningId)
  characterized[name] = { status: result.status, decision: result.decision, implementationPlanningStatus: result.implementationPlanningStatus, checks: result.checks, blockers: result.blockers, warnings: result.warnings, selectedWrapperStrategy: result.selectedWrapperStrategy, sourceInspection: input.sourceInspection ?? null, candidate: result.hermesWrapperNoToolModeImplementationPlanCandidate, validation, serialized }
}
assert.equal(characterized.valid_with_source.status, 'wrapper_no_tool_mode_implementation_plan_created')
assert.equal(characterized.blocked_missing_approval.status, 'wrapper_no_tool_mode_implementation_plan_blocked')
console.log(JSON.stringify({ baseline, cases: characterized }, null, 2))
