const assert = require('node:assert/strict')
const cp = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const ts = require('typescript')

const root = path.resolve(__dirname, '..')
const baseline = '0396062ad7fb6af16c7f6fd83596057f6648aecc'
const domain = 'hermes-research-execution-boundary-planning'
const files = [
  'index.ts',
  `${domain}.types.ts`,
  `${domain}.defaults.ts`,
  `${domain}.evaluate.ts`,
  `${domain}.validate.ts`,
  `${domain}.serialize.ts`,
]

function source(version, file) {
  if (version === 'before') return cp.execFileSync('git', ['show', `${baseline}:src/factory/${domain}/${file}`], { cwd: root, encoding: 'utf8' })
  return fs.readFileSync(path.join(root, 'src/factory', domain, file), 'utf8')
}

function load(version) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `jefe-6a-${version}-`))
  for (const file of files) {
    const output = ts.transpileModule(source(version, file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll('.ts', '.js')
    fs.writeFileSync(path.join(dir, file.replace('.ts', '.js')), output)
  }
  return require(path.join(dir, 'index.js'))
}

const before = load('before')
const after = load('after')
const requiredPolicies = ['policyChainPlanningResult', 'promptPolicyPlanningResult', 'modelProviderPolicyPlanningResult', 'credentialsPolicyPlanningResult', 'networkPolicyPlanningResult', 'toolsetsPolicyPlanningResult', 'outputContractPolicyPlanningResult', 'resultIngestionContractPlanningResult', 'timeoutKillSwitchPolicyPlanningResult', 'filesystemMutationPolicyPlanningResult']
const validInput = { plannedAt: '2026-10-02T12:00:00.000Z', plannedBy: 'batch-6a-hermetic', ...Object.fromEntries(requiredPolicies.map((key) => [key, {}])) }
const fixtures = [
  ['valid-all-gates-disabled', validInput],
  ['blocked-empty-input', {}],
  ['blocked-missing-policy-chain', { ...validInput, policyChainPlanningResult: { status: 'not-ready' } }],
  ['blocked-prompt-policy', { ...validInput, promptPolicyPlanningResult: { status: 'not-ready' } }],
  ['blocked-model-provider-policy', { ...validInput, modelProviderPolicyPlanningResult: { status: 'not-ready' } }],
  ['blocked-credentials-policy', { ...validInput, credentialsPolicyPlanningResult: { status: 'not-ready' } }],
  ['blocked-network-policy', { ...validInput, networkPolicyPlanningResult: { status: 'not-ready' } }],
  ['blocked-toolsets-policy', { ...validInput, toolsetsPolicyPlanningResult: { status: 'not-ready' } }],
  ['blocked-output-policy', { ...validInput, outputContractPolicyPlanningResult: { status: 'not-ready' } }],
  ['blocked-ingestion-policy', { ...validInput, resultIngestionContractPlanningResult: { status: 'not-ready' } }],
  ['blocked-timeout-policy', { ...validInput, timeoutKillSwitchPolicyPlanningResult: { status: 'not-ready' } }],
  ['blocked-filesystem-policy', { ...validInput, filesystemMutationPolicyPlanningResult: { status: 'not-ready' } }],
  ['optional-null-inputs', { ...validInput, humanApprovalRef: null, deepSourceReview: null, commandShapeReview: null, planningNotes: undefined }],
  ['secretish-invalid-input', { ...validInput, planningNotes: 'password=secret' }],
]

function observe(mod, input) {
  const evaluated = mod.evaluateFactoryHermesResearchExecutionBoundaryPlanning(input)
  const validationInput = mod.validateFactoryHermesResearchExecutionBoundaryPlanningInput(input)
  const validationResult = mod.validateFactoryHermesResearchExecutionBoundaryPlanningResult(evaluated)
  const serialized = mod.serializeFactoryHermesResearchExecutionBoundaryPlanningResult(evaluated)
  const parsed = mod.parseFactoryHermesResearchExecutionBoundaryPlanningResult(serialized)
  const summary = mod.summarizeFactoryHermesResearchExecutionBoundaryPlanningResult(evaluated)
  return { evaluated, validationInput, validationResult, serialized, parsed, summary }
}

const report = []
for (const [name, input] of fixtures) {
  const b = observe(before, input)
  const a = observe(after, input)
  assert.deepEqual(a, b, `BEFORE/AFTER mismatch: ${name}`)
  report.push({ name, status: a.evaluated.status, decision: a.evaluated.decision, inputOk: a.validationInput.ok, resultOk: a.validationResult.ok, serializedBytes: a.serialized.length, missingSelections: a.evaluated.missingRuntimeSelections.length })
}

fs.writeFileSync(path.join(root, '.codex-temp', 'batch-6a-characterization-report.json'), JSON.stringify({ baseline, fixtures: report }, null, 2))
console.log(`batch-6a-hermetic-test: PASS BEFORE/AFTER, ${fixtures.length} fixtures, decisions, security flags, validation, summary and serialization`)
