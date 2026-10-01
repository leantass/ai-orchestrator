const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const cp = require('node:child_process')
const ts = require('typescript')

const root = process.cwd()
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jefe-batch-1-'))
const files = [
  'hermes-wrapper-no-tool-mode-planning.defaults.ts',
  'hermes-wrapper-no-tool-mode-planning.evaluate.ts',
  'hermes-wrapper-no-tool-mode-planning.serialize.ts',
]
const sourceDir = path.join(root, 'src/factory/hermes-wrapper-no-tool-mode-planning')

function compile(version, file) {
  const source = version === 'after'
    ? fs.readFileSync(path.join(sourceDir, file), 'utf8')
    : cp.execFileSync('git', ['show', `574c457b10ac833133177c8d5057dca39cf88600:src/factory/hermes-wrapper-no-tool-mode-planning/${file}`], { encoding: 'utf8' })
  return ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll('.ts', '.js')
}

function load(version) {
  const dir = path.join(tempRoot, version)
  fs.mkdirSync(dir, { recursive: true })
  for (const file of files) fs.writeFileSync(path.join(dir, file.replace('.ts', '.js')), compile(version, file))
  return {
    evaluate: require(path.join(dir, 'hermes-wrapper-no-tool-mode-planning.evaluate.js')).evaluateFactoryHermesWrapperNoToolModePlanning,
    serialize: require(path.join(dir, 'hermes-wrapper-no-tool-mode-planning.serialize.js')).serializeFactoryHermesWrapperNoToolModePlanningResult,
  }
}

const input = {
  plannedAt: '2026-07-23T01:00:00.000Z',
  plannedBy: 'hermetic-batch-1-test',
  runtimeSelectionRevisionPlanningResult: {
    planningId: 'revision-1', status: 'runtime_selection_revision_plan_created',
    decision: 'hermes_runtime_selection_revision_plan_created_toolset_mode_blocked',
    revisionStatus: 'manual_revision_required',
    hermesRuntimeSelectionRevisionPlanCandidate: { directHermesRuntimeAdapterBlocked: true, wrapperPlanningRecommended: true },
    canProceedToHermesWrapperNoToolModePlanning: true, canRunResearchNow: false,
  },
  toolsetDisableVerificationApprovalResult: {
    status: 'toolset_disable_verification_approval_blocked',
    decision: 'hermes_toolset_disable_verification_approval_blocked_no_safe_probe_shape', approvalStatus: 'blocked',
  },
  researchRuntimeAdapterApprovalResult: { adapterApprovalId: 'adapter-1' },
  sourceInspection: { sourceFilesInspected: ['fixture.py'], runOneshotAcceptsToolsetsArgument: true, explicitToolsetValidationExists: true },
}

const before = load('before')
const after = load('after')
const beforeResult = before.evaluate(input)
const afterResult = after.evaluate(input)
assert.deepEqual(afterResult, beforeResult)
assert.equal(after.serialize(afterResult), before.serialize(beforeResult))

const blockedInput = { ...input, runtimeSelectionRevisionPlanningResult: undefined }
assert.deepEqual(after.evaluate(blockedInput), before.evaluate(blockedInput))
console.log('factory-hermes-wrapper-no-tool-mode-planning-hermetic-test: PASS before/after equivalence, valid+blocked fixtures')
