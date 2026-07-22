import assert from 'node:assert/strict'
import {
  evaluateFactoryHermesInstallationPlan,
} from '../src/factory/hermes-installation-plan/index.ts'
import {
  evaluateFactoryHermesRuntimeBoundary,
  parseFactoryHermesRuntimeBoundaryResult,
  serializeFactoryHermesRuntimeBoundaryResult,
  summarizeFactoryHermesRuntimeBoundaryResult,
  validateFactoryHermesRuntimeBoundaryContract,
  validateFactoryHermesRuntimeBoundaryResult,
} from '../src/factory/hermes-runtime-boundary/index.ts'

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

const installationPlanResult = evaluateFactoryHermesInstallationPlan({
  sourceAuditSnapshot,
  createdAt: '2026-07-17T00:00:00.000Z',
  createdBy: 'runtime-boundary-smoke',
})

const result = evaluateFactoryHermesRuntimeBoundary({
  hermesInstallationPlanResult: installationPlanResult,
  createdAt: '2026-07-17T00:01:00.000Z',
  createdBy: 'runtime-boundary-smoke',
  humanReviewRef: 'human-review/hermes-runtime-boundary-v1',
})

const contract = result.boundaryContract
assert.equal(result.status, 'runtime_boundary_contract_ready') // 1
assert.equal(contract?.toolId, 'hermes_agent') // 2
assert.ok(contract?.auditedHead) // 3
assert.ok(contract?.remoteHead) // 4
assert.equal(contract?.headsMatch, false) // 5
assert.ok(result.warnings.some((warning) => warning.warningId === 'remote_head_differs_from_audited_head')) // 6
assert.ok(contract?.installRootRef.startsWith('.codex-temp/external-tools/hermes-agent/install/')) // 7
assert.ok(contract?.runtimeRootRef.startsWith('.codex-temp/external-tools/hermes-agent/runtime/')) // 8
assert.ok(contract?.outputRootRef.startsWith('.codex-temp/')) // 9
assert.ok(contract?.filesystemPolicy.logsRootRef.startsWith('.codex-temp/')) // 10
assert.ok(contract?.filesystemPolicy.forbiddenRoots.includes('.env')) // 11
assert.ok(contract?.filesystemPolicy.forbiddenRoots.includes('package.json') && contract.filesystemPolicy.forbiddenRoots.includes('package-lock.json')) // 12
assert.ok(contract?.filesystemPolicy.forbiddenRoots.includes('src/App.tsx')) // 13
assert.ok(contract?.filesystemPolicy.forbiddenRoots.includes('electron/main.cjs') && contract.filesystemPolicy.forbiddenRoots.includes('preload') && contract.filesystemPolicy.forbiddenRoots.includes('IPC')) // 14
assert.equal(contract?.networkPolicy.networkAllowedByDefault, false) // 15
assert.equal(contract?.credentialPolicy.credentialsAllowedNow, false) // 16
assert.equal(contract?.environmentPolicy.envInjectionAllowedNow, false) // 17
assert.equal(contract?.executionPolicy.executionAllowedNow, false) // 18
assert.equal(contract?.executionPolicy.installAllowedNow, false) // 19
assert.equal(contract?.executionPolicy.scriptsAllowedNow, false) // 20
assert.equal(contract?.executionPolicy.commandExecutionAllowedNow, false) // 21
assert.equal(contract?.canInstallHermes, false) // 22
assert.equal(contract?.canExecuteHermes, false) // 23
assert.equal(contract?.canUseCredentials, false) // 24
assert.equal(contract?.canCallModels, false) // 25
assert.equal(contract?.canMutateProjectFiles, false) // 26
assert.equal(contract?.canDeploy, false) // 27
assert.equal(contract?.killSwitches.every((killSwitch) => killSwitch.enabled === false), true) // 28
assert.ok((contract?.adapterRequirements.length ?? 0) >= 4) // 29
assert.ok(contract?.resultContract.requiredFields.includes('citations')) // 30
assert.equal(validateFactoryHermesRuntimeBoundaryContract(contract).ok, true) // 31
assert.equal(validateFactoryHermesRuntimeBoundaryResult(result).ok, true) // 32
assert.equal(parseFactoryHermesRuntimeBoundaryResult(serializeFactoryHermesRuntimeBoundaryResult(result)).resultId, result.resultId) // 33
assert.equal(/token|password|api[_-]?key|secret/iu.test(JSON.stringify(summarizeFactoryHermesRuntimeBoundaryResult(result))), false) // 34
assert.equal(evaluateFactoryHermesRuntimeBoundary({ createdAt: '2026-07-17T00:01:00.000Z', createdBy: 'missing-plan', humanReviewRef: 'x' }).status, 'blocked') // 35
const unsafePlan = structuredClone(installationPlanResult)
unsafePlan.executionAllowedNow = true
assert.equal(evaluateFactoryHermesRuntimeBoundary({ hermesInstallationPlanResult: unsafePlan, createdAt: '2026-07-17T00:01:00.000Z', createdBy: 'unsafe', humanReviewRef: 'x' }).status, 'blocked') // 36
assert.equal(evaluateFactoryHermesRuntimeBoundary({ hermesInstallationPlanResult: installationPlanResult, createdAt: '2026-07-17T00:01:00.000Z', createdBy: 'no-review' }).status, 'human_review_required') // 37
assert.ok(/Install Runtime Adapter|re-audit/iu.test(result.recommendedNextStep) && !/execute Hermes directly/iu.test(result.recommendedNextStep)) // 38
assert.equal(result.canInstallHermes, false) // 39
assert.equal(result.canExecuteHermes, false) // 40
assert.equal(contract?.executionPolicy.scriptsAllowedNow, false) // 41
assert.equal(contract?.filesystemPolicy.packageMutationAllowedNow, false) // 42

console.log(JSON.stringify({
  ok: true,
  checks: 42,
  boundaryKind: result.resultKind,
  status: result.status,
  auditedHead: contract?.auditedHead,
  headsMatch: contract?.headsMatch,
  canExecuteHermes: result.canExecuteHermes,
}, null, 2))
