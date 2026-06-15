import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const ignoredTopLevelDirs = new Set([
  'node_modules',
  'dist',
  'build',
  '.vite',
  'coverage',
  'out',
  'release',
])
const ignoredPathFragments = [
  `${path.sep}.tmp-`,
  `${path.sep}tmp-`,
  `${path.sep}tmp_`,
]
const relevantExtensions = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.html',
  '.yml',
  '.yaml',
])
const relevantBasenames = new Set([
  'package.json',
  'package-lock.json',
  'eslint.config.js',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
])

const sections = [
  {
    id: 'syntax-checks',
    label: 'Syntax checks',
    commands: [
      ['node', ['--check', 'electron/main.cjs']],
      ['node', ['--check', 'electron/local-deterministic-executor.cjs']],
      ['node', ['--check', 'electron/context-hub-client.cjs']],
      ['node', ['--check', 'electron/context-hub-events.cjs']],
      ['node', ['--check', 'electron/context-hub-event-status.cjs']],
      ['node', ['--check', 'electron/context-hub-launcher.cjs']],
      ['node', ['--check', 'electron/fullstack-phase-contracts.cjs']],
      ['node', ['--check', 'electron/generated-domain-delivery-correction-selector.cjs']],
      ['node', ['--check', 'electron/generated-domain-delivery-history-ledger.cjs']],
      ['node', ['--check', 'electron/generated-domain-delivery-review.cjs']],
      ['node', ['--check', 'electron/generated-domain-delivery-supervised-workflow.cjs']],
      ['node', ['--check', 'electron/generated-domain-delivery-worker-handoff.cjs']],
      ['node', ['--check', 'electron/orchestrator-local-smoke-worker.cjs']],
      ['node', ['--check', 'electron/orchestrator-planned-external-workers.cjs']],
      ['node', ['--check', 'electron/orchestrator-supervised-worker-workflow.cjs']],
      ['node', ['--check', 'electron/orchestrator-tool-worker-registry.cjs']],
      ['node', ['--check', 'electron/project-context.cjs']],
      ['node', ['--check', 'electron/workspace-project-detection.cjs']],
      ['node', ['--check', 'scripts/ai-planner-smoke.mjs']],
      ['node', ['--check', 'scripts/ai-operator-e2e-smoke.mjs']],
      ['node', ['--check', 'scripts/ai-release-smoke.mjs']],
      ['node', ['--check', 'scripts/generated-domain-delivery-codex-task-smoke.mjs']],
      ['node', ['--check', 'scripts/generated-domain-delivery-correction-selector-smoke.mjs']],
      ['node', ['--check', 'scripts/generated-domain-delivery-history-ledger-smoke.mjs']],
      ['node', ['--check', 'scripts/generated-domain-delivery-roundtrip-runner-smoke.mjs']],
      ['node', ['--check', 'scripts/generated-domain-delivery-roundtrip-smoke.mjs']],
      ['node', ['--check', 'scripts/generated-domain-delivery-review-evidence-smoke.mjs']],
      ['node', ['--check', 'scripts/generated-domain-delivery-review-loop-smoke.mjs']],
      ['node', ['--check', 'scripts/generated-domain-delivery-supervised-workflow-smoke.mjs']],
      ['node', ['--check', 'scripts/generated-domain-delivery-worker-handoff-smoke.mjs']],
      ['node', ['--check', 'scripts/generated-domain-electron-ui-e2e-smoke.mjs']],
      ['node', ['--check', 'scripts/generated-domain-sandbox-approval-battery-smoke.mjs']],
      ['node', ['--check', 'scripts/generated-domain-delivery-correction-selector.mjs']],
      ['node', ['--check', 'scripts/generated-domain-delivery-history-ledger.mjs']],
      ['node', ['--check', 'scripts/generated-domain-delivery-supervised-workflow.mjs']],
      ['node', ['--check', 'scripts/generated-domain-delivery-worker-handoff.mjs']],
      ['node', ['--check', 'scripts/orchestrator-local-smoke-worker.mjs']],
      ['node', ['--check', 'scripts/orchestrator-local-smoke-worker-smoke.mjs']],
      ['node', ['--check', 'scripts/orchestrator-planned-external-workers.mjs']],
      ['node', ['--check', 'scripts/orchestrator-planned-external-workers-smoke.mjs']],
      ['node', ['--check', 'scripts/orchestrator-supervised-worker-workflow.mjs']],
      ['node', ['--check', 'scripts/orchestrator-supervised-worker-workflow-smoke.mjs']],
      ['node', ['--check', 'scripts/orchestrator-tool-worker-registry.mjs']],
      ['node', ['--check', 'scripts/orchestrator-tool-worker-registry-smoke.mjs']],
      ['node', ['--check', 'scripts/wait-for-vite-dev.mjs']],
      ['node', ['--check', 'scripts/ai-quality.mjs']],
    ],
  },
  {
    id: 'lint',
    label: 'Lint',
    commands: [[npmCommand, ['run', 'lint']]],
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    commands: [[npxCommand, ['tsc', '--noEmit']]],
  },
  {
    id: 'planner-smoke',
    label: 'Planner smoke',
    commands: [[npmCommand, ['run', 'ai-planner-smoke']]],
  },
  {
    id: 'release-smoke',
    label: 'Release smoke',
    commands: [['node', ['scripts/ai-release-smoke.mjs']]],
  },
  {
    id: 'operator-e2e-smoke',
    label: 'Operator E2E smoke',
    commands: [['node', ['scripts/ai-operator-e2e-smoke.mjs']]],
  },
  {
    id: 'generated-domain-delivery-codex-task-smoke',
    label: 'Generated domain delivery Codex task smoke',
    commands: [['node', ['scripts/generated-domain-delivery-codex-task-smoke.mjs']]],
  },
  {
    id: 'generated-domain-delivery-correction-selector-smoke',
    label: 'Generated domain delivery correction selector smoke',
    commands: [['node', ['scripts/generated-domain-delivery-correction-selector-smoke.mjs']]],
  },
  {
    id: 'generated-domain-delivery-history-ledger-smoke',
    label: 'Generated domain delivery history ledger smoke',
    commands: [['node', ['scripts/generated-domain-delivery-history-ledger-smoke.mjs']]],
  },
  {
    id: 'generated-domain-delivery-supervised-workflow-smoke',
    label: 'Generated domain delivery supervised workflow smoke',
    commands: [['node', ['scripts/generated-domain-delivery-supervised-workflow-smoke.mjs']]],
  },
  {
    id: 'generated-domain-delivery-worker-handoff-smoke',
    label: 'Generated domain delivery worker handoff smoke',
    commands: [['node', ['scripts/generated-domain-delivery-worker-handoff-smoke.mjs']]],
  },
  {
    id: 'orchestrator-tool-worker-registry-smoke',
    label: 'Orchestrator tool worker registry smoke',
    commands: [['node', ['scripts/orchestrator-tool-worker-registry-smoke.mjs']]],
  },
  {
    id: 'orchestrator-local-smoke-worker-smoke',
    label: 'Orchestrator local smoke worker smoke',
    commands: [['node', ['scripts/orchestrator-local-smoke-worker-smoke.mjs']]],
  },
  {
    id: 'orchestrator-planned-external-workers-smoke',
    label: 'Orchestrator planned external workers smoke',
    commands: [['node', ['scripts/orchestrator-planned-external-workers-smoke.mjs']]],
  },
  {
    id: 'orchestrator-supervised-worker-workflow-smoke',
    label: 'Orchestrator supervised worker workflow smoke',
    commands: [['node', ['scripts/orchestrator-supervised-worker-workflow-smoke.mjs']]],
  },
  {
    id: 'generated-domain-delivery-roundtrip-smoke',
    label: 'Generated domain delivery roundtrip smoke',
    commands: [['node', ['scripts/generated-domain-delivery-roundtrip-smoke.mjs']]],
  },
  {
    id: 'generated-domain-delivery-roundtrip-runner-smoke',
    label: 'Generated domain delivery roundtrip runner smoke',
    commands: [['node', ['scripts/generated-domain-delivery-roundtrip-runner-smoke.mjs']]],
  },
  {
    id: 'generated-domain-delivery-review-loop-smoke',
    label: 'Generated domain delivery review loop smoke',
    commands: [['node', ['scripts/generated-domain-delivery-review-loop-smoke.mjs']]],
  },
  {
    id: 'generated-domain-delivery-review-evidence-smoke',
    label: 'Generated domain delivery review evidence smoke',
    commands: [['node', ['scripts/generated-domain-delivery-review-evidence-smoke.mjs']]],
  },
  {
    id: 'generated-domain-electron-ui-e2e-smoke',
    label: 'Generated domain Electron UI E2E smoke',
    commands: [['node', ['scripts/generated-domain-electron-ui-e2e-smoke.mjs']]],
  },
  {
    id: 'generated-domain-sandbox-approval-battery-smoke',
    label: 'Generated domain sandbox approval battery smoke',
    commands: [['node', ['scripts/generated-domain-sandbox-approval-battery-smoke.mjs']]],
  },
  {
    id: 'build',
    label: 'Build',
    commands: [[npmCommand, ['run', 'build']]],
  },
]

function printUsage() {
  console.log('Uso: node scripts/ai-quality.mjs [--scope=all|changed] [--changed]')
}

function parseScope(argv) {
  let scope = 'all'

  for (const arg of argv) {
    if (arg === '--changed') {
      scope = 'changed'
      continue
    }

    if (arg.startsWith('--scope=')) {
      scope = arg.slice('--scope='.length).trim() || scope
      continue
    }

    if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
  }

  if (scope !== 'all' && scope !== 'changed') {
    console.error(`[ai-quality] Scope no soportado: ${scope}`)
    printUsage()
    process.exit(1)
  }

  return scope
}

function normalizeRepoPath(filePath) {
  return filePath.replaceAll('\\', '/').replace(/^\.\/+/, '').trim()
}

function shouldIgnorePath(filePath) {
  if (!filePath) {
    return true
  }

  const normalized = normalizeRepoPath(filePath)

  if (!normalized || normalized.endsWith('.log')) {
    return true
  }

  const segments = normalized.split('/')

  if (segments.some((segment) => ignoredTopLevelDirs.has(segment))) {
    return true
  }

  if (
    ignoredPathFragments.some((fragment) =>
      normalized.includes(fragment.replaceAll(path.sep, '/')),
    )
  ) {
    return true
  }

  return false
}

function isRelevantChangedFile(filePath) {
  const normalized = normalizeRepoPath(filePath)
  const ext = path.extname(normalized).toLowerCase()
  const basename = path.basename(normalized)

  return relevantExtensions.has(ext) || relevantBasenames.has(basename)
}

function spawnCommand(command, args, stdioMode) {
  const shouldUseCmdWrapper =
    process.platform === 'win32' && typeof command === 'string' && command.endsWith('.cmd')
  const effectiveCommand = shouldUseCmdWrapper ? 'cmd.exe' : command
  const effectiveArgs = shouldUseCmdWrapper
    ? ['/d', '/s', '/c', command, ...args]
    : args

  return spawnSync(effectiveCommand, effectiveArgs, {
    cwd: repoRoot,
    shell: false,
    windowsHide: true,
    stdio: stdioMode,
    encoding: stdioMode === 'inherit' ? undefined : 'utf8',
  })
}

function captureCommand(command, args) {
  const result = spawnCommand(command, args, ['ignore', 'pipe', 'pipe'])

  if (result.error) {
    throw new Error(`No se pudo ejecutar ${command} ${args.join(' ')}: ${result.error.message}`)
  }

  if (result.status !== 0) {
    const stderr = typeof result.stderr === 'string' ? result.stderr.trim() : ''
    throw new Error(
      `El comando ${command} ${args.join(' ')} fallo con exit code ${result.status}${
        stderr ? `: ${stderr}` : ''
      }`,
    )
  }

  return typeof result.stdout === 'string' ? result.stdout : ''
}

function listChangedFiles() {
  const tracked = captureCommand('git', [
    'diff',
    '--name-only',
    '--diff-filter=ACMRTUXB',
    'HEAD',
  ])
  const untracked = captureCommand('git', ['ls-files', '--others', '--exclude-standard'])

  return [...tracked.split(/\r?\n/), ...untracked.split(/\r?\n/)]
    .map((entry) => normalizeRepoPath(entry))
    .filter(Boolean)
    .filter((entry, index, values) => values.indexOf(entry) === index)
    .filter((entry) => !shouldIgnorePath(entry))
}

function runCommand(command, args) {
  const printable = [command, ...args].join(' ')
  console.log(`[ai-quality] Ejecutando: ${printable}`)

  const result = spawnCommand(command, args, 'inherit')

  if (result.error) {
    console.error(`[ai-quality] Error al ejecutar "${printable}": ${result.error.message}`)
    process.exit(1)
  }

  if (result.status !== 0) {
    console.error(`[ai-quality] El comando fallo con exit code ${result.status}: ${printable}`)
    process.exit(result.status || 1)
  }
}

function printSectionHeader(label) {
  console.log('')
  console.log(`[ai-quality] ${label}`)
  console.log(`[ai-quality] ${'-'.repeat(label.length)}`)
}

function runSections() {
  sections.forEach((section) => {
    printSectionHeader(section.label)
    section.commands.forEach(([command, args]) => runCommand(command, args))
  })
}

function main() {
  const scope = parseScope(process.argv.slice(2))

  if (scope === 'changed') {
    const changedFiles = listChangedFiles()

    if (changedFiles.length === 0) {
      console.log('[ai-quality] No hay archivos modificados relevantes para validar.')
      process.exit(0)
    }

    const relevantFiles = changedFiles.filter((filePath) => isRelevantChangedFile(filePath))

    if (relevantFiles.length === 0) {
      console.log('[ai-quality] No hay cambios de codigo o config que justifiquen la suite fuerte.')
      process.exit(0)
    }

    console.log('[ai-quality] Archivos modificados relevantes detectados:')
    relevantFiles.forEach((filePath) => console.log(`- ${filePath}`))
  }

  console.log(`[ai-quality] Scope: ${scope}`)
  console.log('[ai-quality] Suite: release candidate local')

  runSections()

  console.log('')
  console.log('[ai-quality] Release candidate quality checks passed.')
  console.log(`[ai-quality] OK. Se ejecutaron ${sections.length} secciones en modo ${scope}.`)
}

main()
