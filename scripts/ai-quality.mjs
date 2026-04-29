import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
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
])
const buildRelevantRoots = new Set(['src', 'electron', 'public'])
const lintRelevantBasenames = new Set([
  'package.json',
  'package-lock.json',
  'eslint.config.js',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
])
const buildRelevantBasenames = new Set([
  'package.json',
  'package-lock.json',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
])

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

function runCommand(command, args) {
  const printable = [command, ...args].join(' ')
  console.log(`[ai-quality] Ejecutando: ${printable}`)

  const shouldUseCmdWrapper =
    process.platform === 'win32' && typeof command === 'string' && command.endsWith('.cmd')
  const effectiveCommand = shouldUseCmdWrapper ? 'cmd.exe' : command
  const effectiveArgs = shouldUseCmdWrapper
    ? ['/d', '/s', '/c', command, ...args]
    : args
  const result = spawnSync(effectiveCommand, effectiveArgs, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
  })

  if (result.error) {
    console.error(`[ai-quality] Error al ejecutar "${printable}": ${result.error.message}`)
    process.exit(1)
  }

  if (result.status !== 0) {
    console.error(`[ai-quality] El comando fallo con exit code ${result.status}: ${printable}`)
    process.exit(result.status || 1)
  }
}

function captureCommand(command, args) {
  const shouldUseCmdWrapper =
    process.platform === 'win32' && typeof command === 'string' && command.endsWith('.cmd')
  const effectiveCommand = shouldUseCmdWrapper ? 'cmd.exe' : command
  const effectiveArgs = shouldUseCmdWrapper
    ? ['/d', '/s', '/c', command, ...args]
    : args
  const result = spawnSync(effectiveCommand, effectiveArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true,
  })

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

function listChangedFiles() {
  const tracked = captureCommand('git', [
    'diff',
    '--name-only',
    '--diff-filter=ACMRTUXB',
    'HEAD',
  ])
  const untracked = captureCommand('git', ['ls-files', '--others', '--exclude-standard'])

  const entries = [...tracked.split(/\r?\n/), ...untracked.split(/\r?\n/)]
    .map((entry) => normalizeRepoPath(entry))
    .filter(Boolean)
    .filter((entry, index, values) => values.indexOf(entry) === index)
    .filter((entry) => !shouldIgnorePath(entry))

  return entries
}

function shouldRunLint(changedFiles) {
  return changedFiles.some((filePath) => {
    const ext = path.extname(filePath).toLowerCase()
    const basename = path.basename(filePath)

    return relevantExtensions.has(ext) || lintRelevantBasenames.has(basename)
  })
}

function shouldRunBuild(changedFiles) {
  return changedFiles.some((filePath) => {
    const normalized = normalizeRepoPath(filePath)
    const topLevel = normalized.split('/')[0]
    const basename = path.basename(normalized)
    const ext = path.extname(normalized).toLowerCase()

    return (
      buildRelevantRoots.has(topLevel) ||
      buildRelevantBasenames.has(basename) ||
      (relevantExtensions.has(ext) && topLevel !== 'scripts')
    )
  })
}

function scheduleChecks(scope, changedFiles) {
  const checks = []
  const addCheck = (id, label, command, args) => {
    if (checks.some((check) => check.id === id)) {
      return
    }

    checks.push({ id, label, command, args })
  }

  if (scope === 'all') {
    addCheck(
      'node-check-electron-main',
      'Validar sintaxis de electron/main.cjs',
      'node',
      ['--check', 'electron/main.cjs'],
    )
    addCheck(
      'node-check-local-deterministic',
      'Validar sintaxis de electron/local-deterministic-executor.cjs',
      'node',
      ['--check', 'electron/local-deterministic-executor.cjs'],
    )
    addCheck('lint', 'Correr lint del proyecto', npmCommand, ['run', 'lint'])
    addCheck('build', 'Correr build del proyecto', npmCommand, ['run', 'build'])

    return checks
  }

  if (changedFiles.includes('electron/main.cjs')) {
    addCheck(
      'node-check-electron-main',
      'Validar sintaxis de electron/main.cjs',
      'node',
      ['--check', 'electron/main.cjs'],
    )
  }

  if (changedFiles.includes('electron/local-deterministic-executor.cjs')) {
    addCheck(
      'node-check-local-deterministic',
      'Validar sintaxis de electron/local-deterministic-executor.cjs',
      'node',
      ['--check', 'electron/local-deterministic-executor.cjs'],
    )
  }

  if (shouldRunLint(changedFiles)) {
    addCheck('lint', 'Correr lint del proyecto', npmCommand, ['run', 'lint'])
  }

  if (shouldRunBuild(changedFiles)) {
    addCheck('build', 'Correr build del proyecto', npmCommand, ['run', 'build'])
  }

  return checks
}

function main() {
  const scope = parseScope(process.argv.slice(2))
  const changedFiles = scope === 'changed' ? listChangedFiles() : []

  if (scope === 'changed') {
    if (changedFiles.length === 0) {
      console.log('[ai-quality] No hay archivos modificados relevantes para validar.')
      process.exit(0)
    }

    console.log('[ai-quality] Archivos modificados detectados:')
    changedFiles.forEach((filePath) => console.log(`- ${filePath}`))
  }

  const checks = scheduleChecks(scope, changedFiles)

  if (checks.length === 0) {
    console.log('[ai-quality] No hay checks necesarios para el scope actual.')
    process.exit(0)
  }

  console.log(`[ai-quality] Scope: ${scope}`)
  console.log('[ai-quality] Checks programados:')
  checks.forEach((check) => console.log(`- ${check.label}`))

  for (const check of checks) {
    runCommand(check.command, check.args)
  }

  console.log(`[ai-quality] OK. Se ejecutaron ${checks.length} checks en modo ${scope}.`)
}

main()
