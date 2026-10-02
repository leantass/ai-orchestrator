const assert = require('node:assert/strict')
const cp = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const ts = require('typescript')

const root = path.resolve(__dirname, '..')
const baseline = '8d8ff7950046b508173f6dd67f4696ff35d4765b'
const domain = 'hermes-runtime-selection-revision-planning'
const files = ['index.ts', `${domain}.types.ts`, `${domain}.defaults.ts`, `${domain}.evaluate.ts`, `${domain}.validate.ts`, `${domain}.serialize.ts`]
function source(version, file) { return version === 'before' ? cp.execFileSync('git', ['show', `${baseline}:src/factory/${domain}/${file}`], { cwd: root, encoding: 'utf8' }) : fs.readFileSync(path.join(root, 'src/factory', domain, file), 'utf8') }
function load(version) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), `jefe-6b-${version}-`)); for (const file of files) fs.writeFileSync(path.join(dir, file.replace('.ts', '.js')), ts.transpileModule(source(version, file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll('.ts', '.js')); return require(path.join(dir, 'index.js')) }
const before = load('before'); const after = load('after')
const validApproval = { status: 'toolset_disable_verification_approval_blocked', decision: 'hermes_toolset_disable_verification_approval_blocked_no_safe_probe_shape', approvalStatus: 'blocked', canProceedToRuntimeSelectionRevisionPlanning: true, canProceedToResearchRuntimeAdapterApprovalRetry: false, canProceedToResearchRuntimeAdapter: false, canRunResearchNow: false, approvalId: 'approval-1' }
const validAdapter = { status: 'research_runtime_adapter_approval_blocked', decision: 'hermes_research_runtime_adapter_approval_blocked_toolset_mode_unverified', runtimeAdapterApprovalStatus: 'blocked', canProceedToResearchRuntimeAdapter: false, adapterApprovalId: 'adapter-1' }
const validSelection = { selectedProvider: { providerId: 'openai' }, selectedModel: { modelId: 'gpt-4o-mini' }, selectedCredentialRef: { credentialRefName: 'OPENAI_API_KEY' }, selectedNetworkHosts: { selectedHosts: ['api.openai.com'] }, selectedToolsetMode: { selectedToolsetMode: 'no_toolsets_text_only' }, selectedRunRoot: { selectedRunRoot: '.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/run-1/' }, decisionId: 'selection-1' }
const base = { plannedAt: '2026-10-02T12:00:00.000Z', plannedBy: 'batch-6b-hermetic', toolsetDisableVerificationApprovalResult: validApproval, researchRuntimeAdapterApprovalResult: validAdapter, runtimeSelectionDecisionResult: validSelection }
const fixtures = [
  ['valid-selection-review-required', base],
  ['blocked-toolset-approval', { ...base, toolsetDisableVerificationApprovalResult: { ...validApproval, status: 'wrong' } }],
  ['blocked-adapter-approval', { ...base, researchRuntimeAdapterApprovalResult: { ...validAdapter, status: 'wrong' } }],
  ['blocked-runtime-selection', { ...base, runtimeSelectionDecisionResult: { ...validSelection, selectedModel: { modelId: 'unknown' } } }],
  ['all-approvals-missing', { plannedAt: base.plannedAt, plannedBy: base.plannedBy }],
  ['optional-null-policy', { ...base, policy: null, planningNotes: null }],
  ['invalid-secret-notes', { ...base, planningNotes: 'token=secret' }],
  ['null-runtime-inputs', { ...base, toolsetDisableVerificationApprovalResult: null, researchRuntimeAdapterApprovalResult: null, runtimeSelectionDecisionResult: null }],
]
function observe(mod, input) { const result = mod.evaluateFactoryHermesRuntimeSelectionRevisionPlanning(input); const inputValidation = mod.validateFactoryHermesRuntimeSelectionRevisionPlanningInput(input); const resultValidation = mod.validateFactoryHermesRuntimeSelectionRevisionPlanningResult(result); const serialized = mod.serializeFactoryHermesRuntimeSelectionRevisionPlanningResult(result); const parsed = mod.parseFactoryHermesRuntimeSelectionRevisionPlanningResult(serialized); const summary = mod.summarizeFactoryHermesRuntimeSelectionRevisionPlanningResult(result); return { result, inputValidation, resultValidation, serialized, parsed, summary } }
const report = []
for (const [name, input] of fixtures) { const b = observe(before, input); const a = observe(after, input); assert.deepEqual(a, b, `BEFORE/AFTER mismatch: ${name}`); report.push({ name, status: a.result.status, decision: a.result.decision, revisionStatus: a.result.revisionStatus, inputOk: a.inputValidation.ok, resultOk: a.resultValidation.ok, options: a.result.revisionOptions.length }) }
fs.mkdirSync(path.join(root, '.codex-temp'), { recursive: true }); fs.writeFileSync(path.join(root, '.codex-temp', 'batch-6b-characterization-report.json'), JSON.stringify({ baseline, fixtures: report }, null, 2))
console.log(`batch-6b-hermetic-test: PASS BEFORE/AFTER, ${fixtures.length} fixtures, selection/revision decisions, safety flags, validation, summary and serialization`)
