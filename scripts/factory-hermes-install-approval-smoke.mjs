import assert from 'node:assert/strict'
import { evaluateFactoryHermesInstallationPlan } from '../src/factory/hermes-installation-plan/index.ts'
import { evaluateFactoryHermesRuntimeBoundary } from '../src/factory/hermes-runtime-boundary/index.ts'
import {
  evaluateFactoryHermesInstallApproval,
  parseFactoryHermesInstallApprovalResult,
  serializeFactoryHermesInstallApprovalResult,
  summarizeFactoryHermesInstallApprovalResult,
  validateFactoryHermesInstallApprovalInput,
  validateFactoryHermesInstallApprovalResult,
} from '../src/factory/hermes-install-approval/index.ts'

const sourceAuditSnapshot = {
  remoteUrl: 'https://github.com/NousResearch/hermes-agent.git',
  sourcePath: '.codex-temp/external-tools/hermes-agent/source',
  auditedHead: '75b300f13af40878ad6482b2ecb39c55c86679fe',
  remoteHead: 'cf52edbb595638fd6c9d7286ce4ff081fa95129b',
  headsMatch: false,
  checkoutStrategy: 'windows_safe_sparse_checkout',
  sparsePatterns: ['/README*', '/package.json', '/pyproject.toml', '!/website/i18n/**'],
  manifestsFound: ['README.md', 'LICENSE', 'package.json', 'package-lock.json', 'pyproject.toml', 'setup.py', 'uv.lock'],
  likelyEcosystems: ['mixed'],
  installSurfaces: [{ surfaceId: 'node', kind: 'node', path: 'package.json', description: 'Node install surface.', installCommandCandidates: ['npm install'], executionAllowedNow: false }],
  runtimeSurfaces: [{ surfaceId: 'cli', kind: 'cli', path: 'run_agent.py', description: 'CLI surface.', executionAllowedNow: false }],
  cliSurfaces: ['run_agent.py'],
  docsSurfaces: ['README.md'],
  licenseDetected: 'LICENSE',
  packageManagersDetected: ['npm', 'python'],
  lockfilesDetected: ['package-lock.json', 'uv.lock'],
  scriptsDetected: ['scripts/install.ps1'],
  riskNotes: ['Mixed install surface.'],
}

const planResult = evaluateFactoryHermesInstallationPlan({
  sourceAuditSnapshot,
  createdAt: '2026-07-17T00:00:00.000Z',
  createdBy: 'install-approval-smoke',
})

const boundaryResult = evaluateFactoryHermesRuntimeBoundary({
  hermesInstallationPlanResult: planResult,
  createdAt: '2026-07-17T00:01:00.000Z',
  createdBy: 'install-approval-smoke',
  humanReviewRef: 'human-review/hermes-runtime-boundary-v1',
})

const input = {
  hermesInstallationPlanResult: planResult,
  hermesRuntimeBoundaryResult: boundaryResult,
  reviewedAt: '2026-07-17T00:02:00.000Z',
  reviewedBy: 'lean',
  reviewerRole: 'owner',
  humanApprovalRef: 'human-review/hermes-install-approval-v1',
}
const result = evaluateFactoryHermesInstallApproval(input)
const receipt = result.approvalReceipt
const envelope = result.approvedInstallEnvelope

assert.equal(result.status, 'install_envelope_candidate_approved') // 1
assert.equal(result.toolId, 'hermes_agent') // 2
assert.ok(result.auditedHead) // 3
assert.ok(result.remoteHead) // 4
assert.equal(result.headsMatch, false) // 5
assert.ok(result.warnings.some((warning) => warning.warningId === 'remote_head_differs_from_audited_head')) // 6
assert.equal(envelope?.installVersionScope, 'audited_head_only') // 7
assert.ok(receipt) // 8
assert.ok(envelope) // 9
assert.equal(envelope?.installStatus, 'not_installed') // 10
assert.equal(envelope?.executionStatus, 'not_allowed') // 11
assert.equal(envelope?.scriptsStatus, 'not_allowed') // 12
assert.equal(envelope?.credentialsStatus, 'not_allowed') // 13
assert.equal(result.canInstallHermesNow, false) // 14
assert.equal(result.canExecuteHermes, false) // 15
assert.equal(result.canRunHermesScripts, false) // 16
assert.equal(result.canUseCredentials, false) // 17
assert.equal(result.canCallModels, false) // 18
assert.equal(result.canMutateProjectFiles, false) // 19
assert.equal(result.canDeploy, false) // 20
assert.ok(receipt?.notAuthorizedActions.includes('install_now')) // 21
assert.ok(receipt?.notAuthorizedActions.includes('execute_hermes')) // 22
assert.ok(receipt?.notAuthorizedActions.includes('run_hermes_scripts')) // 23
assert.ok(receipt?.notAuthorizedActions.includes('mutate_project_package_files')) // 24
assert.ok(receipt?.notAuthorizedActions.includes('access_credentials')) // 25
assert.ok(receipt?.notAuthorizedActions.includes('call_model')) // 26
assert.equal(evaluateFactoryHermesInstallApproval({ ...input, hermesInstallationPlanResult: undefined }).status, 'blocked') // 27
assert.equal(evaluateFactoryHermesInstallApproval({ ...input, hermesRuntimeBoundaryResult: undefined }).status, 'blocked') // 28
const unsafePlan = structuredClone(planResult)
unsafePlan.executionAllowedNow = true
assert.equal(evaluateFactoryHermesInstallApproval({ ...input, hermesInstallationPlanResult: unsafePlan }).status, 'blocked') // 29
const unsafeBoundary = structuredClone(boundaryResult)
unsafeBoundary.boundaryContract.canInstallHermes = true
assert.equal(evaluateFactoryHermesInstallApproval({ ...input, hermesRuntimeBoundaryResult: unsafeBoundary }).status, 'blocked') // 30
const mismatchedBoundary = structuredClone(boundaryResult)
mismatchedBoundary.boundaryContract.auditedHead = '0000000000000000000000000000000000000000'
assert.equal(evaluateFactoryHermesInstallApproval({ ...input, hermesRuntimeBoundaryResult: mismatchedBoundary }).status, 'blocked') // 31
assert.equal(evaluateFactoryHermesInstallApproval({ ...input, humanApprovalRef: undefined }).status, 'human_review_required') // 32
assert.equal(validateFactoryHermesInstallApprovalInput(input).ok, true) // 33
assert.equal(validateFactoryHermesInstallApprovalResult(result).ok, true) // 34
assert.equal(parseFactoryHermesInstallApprovalResult(serializeFactoryHermesInstallApprovalResult(result)).approvalId, result.approvalId) // 35
assert.equal(/token|password|api[_-]?key|secret/iu.test(JSON.stringify(summarizeFactoryHermesInstallApprovalResult(result))), false) // 36
assert.ok(/Hermes Install Runtime Adapter/u.test(result.recommendedNextStep) && !/execute Hermes directly/iu.test(result.recommendedNextStep)) // 37
assert.equal(result.canInstallHermesNow, false) // 38
assert.equal(result.canExecuteHermes, false) // 39
assert.equal(result.canRunHermesScripts, false) // 40
assert.equal(envelope?.installPlanSummary.installAllowedNow, false) // 41

console.log(JSON.stringify({
  ok: true,
  checks: 41,
  approvalKind: result.approvalKind,
  status: result.status,
  auditedHead: result.auditedHead,
  headsMatch: result.headsMatch,
  installStatus: envelope?.installStatus,
  canInstallHermesNow: result.canInstallHermesNow,
}, null, 2))
