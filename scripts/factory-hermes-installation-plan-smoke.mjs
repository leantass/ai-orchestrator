import assert from 'node:assert/strict'
import {
  evaluateFactoryHermesInstallationPlan,
  parseFactoryHermesInstallationPlanResult,
  serializeFactoryHermesInstallationPlanResult,
  summarizeFactoryHermesInstallationPlanResult,
  validateFactoryHermesInstallationPlan,
  validateFactoryHermesInstallationPlanResult,
} from '../src/factory/hermes-installation-plan/index.ts'

const sourceAuditSnapshot = {
  remoteUrl: 'https://github.com/NousResearch/hermes-agent.git',
  sourcePath: '.codex-temp/external-tools/hermes-agent/source',
  auditedHead: '75b300f13af40878ad6482b2ecb39c55c86679fe',
  remoteHead: 'cf52edbb595638fd6c9d7286ce4ff081fa95129b',
  headsMatch: false,
  checkoutStrategy: 'windows_safe_sparse_checkout',
  sparsePatterns: ['/README*', '/LICENSE*', '/package.json', '/package-lock.json', '/pyproject.toml', '/setup.py', '/docs/**', '/website/docs/**', '/scripts/**', '!/website/i18n/**'],
  manifestsFound: ['README.md', 'LICENSE', 'package.json', 'package-lock.json', 'pyproject.toml', 'setup.py', 'uv.lock'],
  likelyEcosystems: ['mixed'],
  installSurfaces: [
    {
      surfaceId: 'node_package_json',
      kind: 'node',
      path: 'package.json',
      description: 'Node workspace and npm script surface detected.',
      installCommandCandidates: ['npm install --workspaces=false'],
      executionAllowedNow: false,
    },
    {
      surfaceId: 'python_pyproject',
      kind: 'python',
      path: 'pyproject.toml',
      description: 'Python package metadata detected.',
      installCommandCandidates: ['pip install .'],
      executionAllowedNow: false,
    },
  ],
  runtimeSurfaces: [
    {
      surfaceId: 'python_cli',
      kind: 'cli',
      path: 'run_agent.py',
      description: 'Hermes Python agent CLI surface detected.',
      executionAllowedNow: false,
    },
  ],
  cliSurfaces: ['cli.py', 'run_agent.py', 'hermes_cli/'],
  docsSurfaces: ['README.md', 'docs/', 'website/docs/'],
  licenseDetected: 'LICENSE',
  packageManagersDetected: ['npm', 'python', 'uv'],
  lockfilesDetected: ['package-lock.json', 'uv.lock'],
  scriptsDetected: ['scripts/install.ps1', 'scripts/install.sh', 'setup-hermes.sh'],
  riskNotes: ['Mixed Node/Python install surfaces.', 'Install scripts present but not executed.'],
}

const result = evaluateFactoryHermesInstallationPlan({
  sourceAuditSnapshot,
  createdAt: '2026-07-17T00:00:00.000Z',
  createdBy: 'factory-hermes-installation-plan-smoke',
})

assert.equal(result.status, 'install_plan_ready_for_audited_head') // 1
assert.equal(result.installationPlan?.toolId, 'hermes_agent') // 2
assert.ok(result.installationPlan?.auditedHead) // 3
assert.ok(result.installationPlan?.remoteHead) // 4
assert.equal(result.installationPlan?.headsMatch, false) // 5
assert.ok(result.warnings.some((warning) => warning.warningId === 'remote_head_differs_from_audited_head')) // 6
assert.ok(result.installationPlan?.versionPolicyDecision) // 7
assert.equal(result.installAllowedNow, false) // 8
assert.equal(result.executionAllowedNow, false) // 9
assert.equal(result.credentialsAllowedNow, false) // 10
assert.equal(result.scriptsExecuted, false) // 11
assert.equal(result.dependenciesInstalled, false) // 12
assert.equal(result.projectPackageMutated, false) // 13
assert.equal(result.installationPlan?.runtimeBoundaryRequired, true) // 14
assert.equal(result.installationPlan?.adapterRequired, true) // 15
assert.equal(result.installationPlan?.resultIngestionRequired, true) // 16
assert.equal(result.installationPlan?.jefeReviewRequired, true) // 17
assert.ok(result.installationPlan?.isolatedInstallRootSuggestion.startsWith('.codex-temp/external-tools/hermes-agent/install/')) // 18
assert.ok((result.installationPlan?.installSteps.length ?? 0) >= 4) // 19
assert.ok((result.installationPlan?.validationSteps.length ?? 0) >= 3) // 20
assert.equal(validateFactoryHermesInstallationPlan(result.installationPlan).ok, true) // 21
assert.equal(validateFactoryHermesInstallationPlanResult(result).ok, true) // 22
assert.equal(parseFactoryHermesInstallationPlanResult(serializeFactoryHermesInstallationPlanResult(result)).resultId, result.resultId) // 23
assert.equal(/token|password|api[_-]?key/iu.test(JSON.stringify(summarizeFactoryHermesInstallationPlanResult(result))), false) // 24
assert.equal(evaluateFactoryHermesInstallationPlan({ createdAt: '2026-07-17T00:00:00.000Z', createdBy: 'missing-audit' }).status, 'blocked') // 25
assert.equal(result.installationPlan?.executionAllowedNow, false) // 26
assert.ok(/Runtime Boundary|re-audit/iu.test(result.recommendedNextStep) && !/execute Hermes directly/iu.test(result.recommendedNextStep)) // 27
assert.equal(result.installationPlan?.installAllowedNow, false) // 28
assert.equal(result.installationPlan?.executionAllowedNow, false) // 29
assert.equal(result.installationPlan?.projectPackageMutated, false) // 30

console.log(JSON.stringify({
  ok: true,
  checks: 30,
  status: result.status,
  auditedHead: result.installationPlan?.auditedHead,
  remoteHead: result.installationPlan?.remoteHead,
  headsMatch: result.installationPlan?.headsMatch,
  installAllowedNow: result.installAllowedNow,
  executionAllowedNow: result.executionAllowedNow,
}, null, 2))
