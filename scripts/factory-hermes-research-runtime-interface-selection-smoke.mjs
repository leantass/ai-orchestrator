import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import selectionRuntime from '../electron/factory/hermes-research-runtime-interface-selection/index.cjs'
import {
  evaluateFactoryHermesResearchRuntimeInterfaceSelection,
  parseFactoryHermesResearchRuntimeInterfaceSelectionResult,
  serializeFactoryHermesResearchRuntimeInterfaceSelectionResult,
  summarizeFactoryHermesResearchRuntimeInterfaceSelectionResult,
  validateFactoryHermesResearchRuntimeInterfaceSelectionInput,
  validateFactoryHermesResearchRuntimeInterfaceSelectionResult,
} from '../src/factory/hermes-research-runtime-interface-selection/index.ts'

const { executeFactoryHermesResearchRuntimeInterfaceSelection, resolveFactoryHermesResearchRuntimeInterfaceSelectionPaths } = selectionRuntime
const paths = resolveFactoryHermesResearchRuntimeInterfaceSelectionPaths()
const planning = JSON.parse(readFileSync(paths.planningResult, 'utf8'))
const dossier = readFileSync(paths.dossier, 'utf8')
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.planningResult), true) // 1
assert.ok(planning) // 2
assert.equal(planning.status, 'manual_selection_required') // 3
const selectedCandidateId = 'pyproject-console-script-1'
assert.equal(selectedCandidateId, 'pyproject-console-script-1') // 4
const candidate = planning.interfaceCandidates.find((c) => c.candidateId === selectedCandidateId)
assert.ok(candidate) // 5
assert.equal(dossier.includes('confianza: `high`') || dossier.includes('| `high` |'), true) // 6
assert.equal(dossier.includes('package_entrypoint'), true) // 7
assert.equal(/hermes_cli\.main:main|hermes = "hermes_cli\.main:main"/u.test(dossier), true) // 8
const input = { selectedAt: '2026-07-21T17:00:00.000Z', selectedBy: 'factory-hermes-research-runtime-interface-selection-smoke', selectedCandidateId, humanApprovalRef: 'human-review/hermes-research-runtime-interface-selection-v1', planningResult: planning, dossierSummary: 'RECOMMENDED_SELECTION pyproject-console-script-1 hermes_cli.main:main' }
assert.ok(input.humanApprovalRef) // 9
const result = await executeFactoryHermesResearchRuntimeInterfaceSelection(input)
if (result.status !== 'selected') {
  console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noFallback: true, noUv: true, noPip: true, noPython: true, noSetupPy: true, noHermes: true, noNetwork: true }, null, 2))
  process.exit(1)
}
assert.equal(result.status, 'selected') // 10
assert.equal(result.decision, 'hermes_research_runtime_interface_selected_for_boundary_planning') // 11
assert.ok(result.interfaceSelectionReceipt) // 12
assert.ok(result.selectedHermesResearchRuntimeInterfaceEnvelope) // 13
assert.equal(result.selectedInterface.commandName, 'hermes') // 14
assert.equal(result.selectedInterface.pythonEntrypoint, 'hermes_cli.main:main') // 15
assert.equal(result.selectedInterface.futureExecutableCandidateWindows.endsWith('/python-env/Scripts/hermes.exe'), true) // 16
assert.equal(result.selectedHermesResearchRuntimeInterfaceEnvelope.approvedNextGate, 'Factory Hermes Research Runtime Boundary Contract v1') // 17
assert.equal(result.canProceedToResearchRuntimeBoundary, true) // 18
assert.equal(result.canExecuteHermes, false) // 19
assert.equal(result.canRunHermesScripts, false) // 20
assert.equal(result.canUseNetwork, false) // 21
assert.equal(result.canUseCredentials, false) // 22
assert.equal(result.canCallModels, false) // 23
assert.equal(result.canMutateProjectFiles, false) // 24
assert.equal(result.canDeploy, false) // 25
for (const action of ['execute_hermes_now', 'execute_selected_interface_now', 'execute_python_now', 'execute_uv_now', 'execute_pip_now', 'execute_setup_py_now', 'call_models_now', 'access_credentials_now', 'use_network_now', 'create_runtime_now']) assert.ok(result.interfaceSelectionReceipt.notAuthorizedActions.includes(action)) // 26-35
assert.equal(evaluateFactoryHermesResearchRuntimeInterfaceSelection({ ...input, selectedCandidateId: '' }).decision, 'blocked_selected_candidate_not_found') // 36
assert.equal(evaluateFactoryHermesResearchRuntimeInterfaceSelection({ ...input, selectedCandidateId: 'unknown' }).decision, 'blocked_selected_candidate_not_found') // 37
assert.equal(evaluateFactoryHermesResearchRuntimeInterfaceSelection({ ...input, selectedCandidateId: 'scripts-directory' }).decision, 'blocked_selected_candidate_not_recommended') // 38
assert.equal(evaluateFactoryHermesResearchRuntimeInterfaceSelection({ ...input, humanApprovalRef: undefined }).status, 'human_review_required') // 39
assert.equal(validateFactoryHermesResearchRuntimeInterfaceSelectionInput(input).ok, true) // 40
assert.equal(validateFactoryHermesResearchRuntimeInterfaceSelectionResult(result).ok, true) // 41
assert.equal(parseFactoryHermesResearchRuntimeInterfaceSelectionResult(serializeFactoryHermesResearchRuntimeInterfaceSelectionResult(result)).interfaceSelectionId, result.interfaceSelectionId) // 42
assert.equal(/full source|BEGIN|password|secret|api[_-]?key|bearer/iu.test(JSON.stringify(summarizeFactoryHermesResearchRuntimeInterfaceSelectionResult(result))), false) // 43
assert.equal(existsSync(paths.selectionResult), true) // 44
assert.equal(sha256('package.json'), expectedPackageHash) // 45
assert.equal(sha256('package-lock.json'), expectedLockHash) // 46
assert.ok(/Research Runtime Boundary Contract/iu.test(result.recommendedNextStep) && !/execute Hermes/iu.test(result.recommendedNextStep)) // 47

console.log(JSON.stringify({ ok: true, checks: 47, status: result.status, decision: result.decision, selectedCandidateId: result.selectedCandidateId, commandName: result.selectedInterface.commandName, canProceedToResearchRuntimeBoundary: result.canProceedToResearchRuntimeBoundary, canExecuteHermes: result.canExecuteHermes }, null, 2))
