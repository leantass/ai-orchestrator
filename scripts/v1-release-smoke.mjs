import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const require = createRequire(import.meta.url)

const requiredDocs = [
  'docs/V1_CLOSURE_AUDIT.md',
  'docs/V1_RUNBOOK.md',
  'docs/V1_LIMITS_AND_NEXT_STEPS.md',
]

const requiredUiFiles = [
  'src/App.tsx',
  'src/components/V1ClosureDashboard.tsx',
  'src/components/AppShell.tsx',
  'src/components/AppUiPrimitives.tsx',
]

const requiredElectronModules = [
  'electron/generated-domain-delivery-review.cjs',
  'electron/generated-domain-delivery-worker-handoff.cjs',
  'electron/generated-domain-delivery-correction-selector.cjs',
  'electron/generated-domain-delivery-history-ledger.cjs',
  'electron/generated-domain-delivery-supervised-workflow.cjs',
  'electron/orchestrator-tool-worker-registry.cjs',
  'electron/orchestrator-local-smoke-worker.cjs',
  'electron/orchestrator-supervised-worker-workflow.cjs',
  'electron/orchestrator-planned-external-workers.cjs',
  'electron/orchestrator-external-tool-approval-gates.cjs',
  'electron/orchestrator-external-tool-dry-run-planner.cjs',
  'electron/orchestrator-external-tool-supervised-execution.cjs',
  'electron/orchestrator-external-tool-readiness-review.cjs',
  'electron/orchestrator-external-tool-manual-execution-packet.cjs',
  'electron/orchestrator-external-tool-human-approval-record.cjs',
  'electron/orchestrator-external-tool-execution-permit-bundle.cjs',
]

const requiredScripts = [
  'scripts/ai-quality.mjs',
  'scripts/ai-quality-sections.mjs',
  'scripts/ai-planner-smoke.mjs',
  'scripts/ai-release-smoke.mjs',
  'scripts/ai-operator-e2e-smoke.mjs',
  'scripts/generated-domain-delivery-history-ledger-smoke.mjs',
  'scripts/generated-domain-delivery-supervised-workflow-smoke.mjs',
  'scripts/generated-domain-materialization-sandbox-smoke.mjs',
  'scripts/generated-domain-sandbox-final-materialization-approval-smoke.mjs',
  'scripts/orchestrator-tool-worker-registry-smoke.mjs',
  'scripts/orchestrator-local-smoke-worker-smoke.mjs',
  'scripts/orchestrator-supervised-worker-workflow-smoke.mjs',
  'scripts/orchestrator-planned-external-workers-smoke.mjs',
  'scripts/orchestrator-external-tool-approval-gates-smoke.mjs',
  'scripts/orchestrator-external-tool-dry-run-planner-smoke.mjs',
  'scripts/orchestrator-external-tool-supervised-execution-smoke.mjs',
  'scripts/orchestrator-external-tool-readiness-review-smoke.mjs',
  'scripts/orchestrator-external-tool-manual-execution-packet-smoke.mjs',
  'scripts/orchestrator-external-tool-human-approval-record-smoke.mjs',
  'scripts/orchestrator-external-tool-execution-permit-bundle-smoke.mjs',
  'scripts/v1-release-smoke.mjs',
]

const criticalQualityEntries = [
  'scripts/generated-domain-delivery-history-ledger-smoke.mjs',
  'scripts/generated-domain-delivery-supervised-workflow-smoke.mjs',
  'scripts/orchestrator-tool-worker-registry-smoke.mjs',
  'scripts/orchestrator-local-smoke-worker-smoke.mjs',
  'scripts/orchestrator-supervised-worker-workflow-smoke.mjs',
  'scripts/orchestrator-external-tool-execution-permit-bundle-smoke.mjs',
  'scripts/v1-release-smoke.mjs',
]

const expectedExports = [
  [
    'electron/orchestrator-external-tool-execution-permit-bundle.cjs',
    [
      'loadExternalToolPermitArtifacts',
      'buildExternalToolExecutionPermitBundle',
      'validateExternalToolExecutionPermitBundle',
      'writeExternalToolExecutionPermitBundle',
      'summarizeExternalToolExecutionPermitBundle',
      'deriveExternalToolExecutionPermitStatus',
    ],
  ],
  [
    'electron/orchestrator-external-tool-human-approval-record.cjs',
    [
      'loadManualExecutionPacket',
      'buildExternalToolHumanApprovalRecord',
      'validateExternalToolHumanApprovalRecord',
      'writeExternalToolHumanApprovalRecord',
      'summarizeExternalToolHumanApprovalRecord',
      'isExternalToolHumanApprovalUsable',
    ],
  ],
  [
    'electron/orchestrator-external-tool-manual-execution-packet.cjs',
    [
      'loadExternalToolReadinessReview',
      'buildExternalToolManualExecutionPacket',
      'validateExternalToolManualExecutionPacket',
      'writeExternalToolManualExecutionPacket',
      'summarizeExternalToolManualExecutionPacket',
    ],
  ],
  [
    'electron/orchestrator-tool-worker-registry.cjs',
    [
      'getDefaultToolWorkerRegistry',
      'findToolWorkersForCapability',
      'buildWorkerTaskEnvelope',
      'writeWorkerTaskEnvelope',
    ],
  ],
]

function repoPath(relativePath) {
  return path.join(repoRoot, relativePath)
}

function readText(relativePath) {
  return fs.readFileSync(repoPath(relativePath), 'utf8')
}

function assertExists(relativePath) {
  assert.equal(fs.existsSync(repoPath(relativePath)), true, `${relativePath} debe existir`)
}

function assertTextIncludes(relativePath, expectedText) {
  const content = readText(relativePath)
  assert.equal(
    content.includes(expectedText),
    true,
    `${relativePath} debe incluir "${expectedText}"`,
  )
}

function assertTextIncludesOneOf(relativePath, expectedTexts) {
  const content = readText(relativePath)
  assert.equal(
    expectedTexts.some((expectedText) => content.includes(expectedText)),
    true,
    `${relativePath} debe incluir alguno de: ${expectedTexts.join(' | ')}`,
  )
}

function run(command, args) {
  const shouldUseCmdWrapper =
    process.platform === 'win32' && typeof command === 'string' && command.endsWith('.cmd')
  const effectiveCommand = shouldUseCmdWrapper ? 'cmd.exe' : command
  const effectiveArgs = shouldUseCmdWrapper ? ['/d', '/s', '/c', command, ...args] : args

  const result = spawnSync(effectiveCommand, effectiveArgs, {
    cwd: repoRoot,
    shell: false,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} fallo con exit code ${result.status}: ${result.stderr}`,
    )
  }

  return result.stdout
}

function assertNoTrackedForbiddenChanges() {
  const status = run('git', ['status', '--short', '--', 'web-prueba', '.env', 'node_modules'])
  assert.equal(status.trim(), '', 'No debe haber cambios versionados en web-prueba, .env ni node_modules')
}

function assertSafeExternalMessaging() {
  const component = readText('src/components/V1ClosureDashboard.tsx')
  const docs = requiredDocs.map((doc) => readText(doc)).join('\n')

  for (const phrase of [
    'No Blender launch in V1',
    'No Unity launch in V1',
    'No MCP invocation in V1',
    'executionAllowed false',
    'automaticExecutionAllowed',
  ]) {
    assert.equal(
      `${component}\n${docs}`.includes(phrase),
      true,
      `La UI/docs V1 deben declarar el limite: ${phrase}`,
    )
  }

  assert.equal(
    /onClick=\{[^}]*Blender|onClick=\{[^}]*Unity|onClick=\{[^}]*MCP/.test(component),
    false,
    'La vista V1 no debe tener acciones UI obvias para abrir herramientas externas',
  )
}

function assertExports() {
  for (const [modulePath, exportNames] of expectedExports) {
    const loaded = require(repoPath(modulePath))
    for (const exportName of exportNames) {
      assert.equal(
        typeof loaded[exportName],
        'function',
        `${modulePath} debe exportar ${exportName}`,
      )
    }
  }
}

function assertQualityIntegration() {
  const quality = [
    readText('scripts/ai-quality.mjs'),
    readText('scripts/ai-quality-sections.mjs'),
  ].join('\n')

  for (const entry of criticalQualityEntries) {
    assert.equal(quality.includes(entry), true, `ai-quality debe incluir ${entry}`)
  }
}

function assertUiWiring() {
  assertTextIncludesOneOf('src/App.tsx', [
    "import { V1ClosureDashboard }",
    'const LazyV1ClosureDashboard = lazy(() =>',
  ])
  assertTextIncludes('src/App.tsx', "| 'v1'")
  assertTextIncludes('src/App.tsx', "key: 'v1'")
  assertTextIncludesOneOf('src/App.tsx', ['<V1ClosureDashboard', '<LazyV1ClosureDashboard'])
  assertTextIncludes('src/components/V1ClosureDashboard.tsx', 'export function V1ClosureDashboard')
}

function assertDocs() {
  for (const doc of requiredDocs) {
    assertExists(doc)
  }

  assertTextIncludes('docs/V1_CLOSURE_AUDIT.md', 'No ejecucion real externa')
  assertTextIncludes('docs/V1_RUNBOOK.md', 'Como correr quality')
  assertTextIncludes('docs/V1_LIMITS_AND_NEXT_STEPS.md', 'V1 no ejecuta Blender real')
}

function writeConceptualReport() {
  const outputDir = repoPath('.codex-temp/v1-release-smoke')
  fs.mkdirSync(outputDir, { recursive: true })

  const report = {
    status: 'v1_release_smoke_passed',
    generatedAt: new Date().toISOString(),
    flow: [
      'pedido',
      'plan',
      'approval',
      'sandbox',
      'materialization',
      'delivery-review',
      'codex-correction',
      'validation',
      'history',
      'final-report',
    ],
    workers: ['codex-manual-correction', 'local-smoke-runner', 'supervised-workflow'],
    externalTools: {
      blender: 'planned-only',
      unity: 'planned-only',
      mcp: 'future-planned-only',
      realExecution: false,
      automaticExecution: false,
    },
    approvals: ['approval-gates', 'manual-execution-packet', 'human-approval-record', 'permit-bundle'],
    history: ['generated-domain-delivery-history-ledger', 'roundtrip-runner'],
    qa: ['v1-release-smoke', 'ai-quality', 'critical-external-tool-smokes'],
  }

  fs.writeFileSync(
    path.join(outputDir, 'v1-conceptual-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  )
  fs.writeFileSync(
    path.join(outputDir, 'README.md'),
    [
      '# V1 conceptual smoke report',
      '',
      'This folder is generated by `scripts/v1-release-smoke.mjs` and is not versioned.',
      'It demonstrates the V1 product flow without running Blender, Unity or MCP.',
      '',
    ].join('\n'),
  )
}

function assertUiCompiles() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  run(npmCommand, ['run', 'build'])
}

function main() {
  for (const filePath of [...requiredDocs, ...requiredUiFiles, ...requiredElectronModules, ...requiredScripts]) {
    assertExists(filePath)
  }

  assertDocs()
  assertUiWiring()
  assertQualityIntegration()
  assertExports()
  assertSafeExternalMessaging()
  assertNoTrackedForbiddenChanges()
  writeConceptualReport()
  assertUiCompiles()

  console.log('OK. V1 release smoke completo.')
}

main()
