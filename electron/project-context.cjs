const fs = require('fs')
const path = require('path')
const { createHash } = require('crypto')
const { spawnSync } = require('child_process')

const INPUT_IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.bmp',
])
const INPUT_DOCUMENT_EXTENSIONS = new Set([
  '.pdf',
  '.docx',
  '.txt',
  '.md',
  '.rtf',
])
const INPUT_VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov'])
const INPUT_GIF_EXTENSIONS = new Set(['.gif'])
const PROJECT_IMPORTANT_FOLDERS = [
  'src',
  'app',
  'pages',
  'components',
  'public',
  'assets',
  'backend',
  'database',
  'docs',
]
const PROTECTED_FILE_PATTERNS = [
  /^\.env(?:\..+)?$/i,
  /secret/i,
  /credential/i,
  /token/i,
  /apikey/i,
  /api[-_]?key/i,
]
const RUNTIME_TEMPORARY_PATH_PATTERNS = [
  /(^|\/)\.tmp[-/]/i,
  /(^|\/)tmp[-/]/i,
  /(^|\/)temp(?:\/|$)/i,
  /(^|\/)user data(?:\/|$)/i,
  /(^|\/)cache(?:\/|$)/i,
  /(^|\/)code cache(?:\/|$)/i,
  /(^|\/)gpucache(?:\/|$)/i,
  /(^|\/)dawncache(?:\/|$)/i,
  /(^|\/)grshadercache(?:\/|$)/i,
  /(^|\/)blob_storage(?:\/|$)/i,
  /(^|\/)service worker(?:\/|$)/i,
  /(^|\/)crashpad(?:\/|$)/i,
  /(^|\/)singleton(?:cookie|lock|socket)?$/i,
  /(^|\/)local state$/i,
  /chromium/i,
  /chrome/i,
  /electron/i,
]

function normalizeOptionalString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizePathForMetadata(targetPath) {
  return typeof targetPath === 'string' && targetPath.trim()
    ? path.resolve(targetPath.trim())
    : ''
}

function createStableId(seed) {
  return createHash('sha1').update(seed).digest('hex').slice(0, 12)
}

function inferInputRole({ name, extension, isDirectory }) {
  const normalizedName = normalizeOptionalString(name).toLocaleLowerCase()
  const normalizedExtension = normalizeOptionalString(extension).toLocaleLowerCase()

  if (isDirectory) {
    if (
      normalizedName.includes('asset') ||
      normalizedName.includes('media') ||
      normalizedName.includes('brand') ||
      normalizedName.includes('logo')
    ) {
      return 'referencia'
    }

    return 'otro'
  }

  if (normalizedName.includes('logo') || normalizedName.includes('isotipo')) {
    return 'logo'
  }

  if (INPUT_GIF_EXTENSIONS.has(normalizedExtension)) {
    return 'gif'
  }

  if (INPUT_VIDEO_EXTENSIONS.has(normalizedExtension)) {
    return 'video'
  }

  if (INPUT_IMAGE_EXTENSIONS.has(normalizedExtension)) {
    return 'imagen'
  }

  if (INPUT_DOCUMENT_EXTENSIONS.has(normalizedExtension)) {
    if (
      normalizedName.includes('copy') ||
      normalizedName.includes('brief') ||
      normalizedName.includes('idea') ||
      normalizedName.includes('contenido')
    ) {
      return 'contenido'
    }

    return 'documento'
  }

  if (
    normalizedExtension === '.fig' ||
    normalizedExtension === '.psd' ||
    normalizedExtension === '.ai'
  ) {
    return 'referencia'
  }

  return 'otro'
}

function safeStat(targetPath) {
  try {
    return fs.statSync(targetPath)
  } catch {
    return null
  }
}

function buildAttachedInputMetadata(targetPath, options = {}) {
  const resolvedPath = normalizePathForMetadata(targetPath)

  if (!resolvedPath) {
    return null
  }

  const stats = safeStat(resolvedPath)

  if (!stats) {
    return null
  }

  const isDirectory = stats.isDirectory()
  const extension = isDirectory ? '' : path.extname(resolvedPath).toLocaleLowerCase()
  const name = path.basename(resolvedPath)
  const kind = options.kind === 'folder' || isDirectory ? 'folder' : 'file'

  return {
    id: createStableId(
      [
        kind,
        resolvedPath,
        String(stats.size || 0),
        String(stats.mtimeMs || 0),
      ].join('|'),
    ),
    kind,
    name,
    originalPath: resolvedPath,
    extension,
    sizeBytes: Number.isFinite(stats.size) ? stats.size : 0,
    inferredRole: inferInputRole({ name, extension, isDirectory }),
    operatorNote: normalizeOptionalString(options.operatorNote),
    status: normalizeOptionalString(options.status) || 'referenced',
    isDirectory,
  }
}

function buildAttachedInputMetadataList(targetPaths, options = {}) {
  if (!Array.isArray(targetPaths)) {
    return []
  }

  const seenIds = new Set()

  return targetPaths
    .map((entry) => buildAttachedInputMetadata(entry, options))
    .filter((entry) => entry && !seenIds.has(entry.id) && seenIds.add(entry.id))
}

function detectPackageManager(projectPath) {
  const candidates = [
    { file: 'pnpm-lock.yaml', value: 'pnpm' },
    { file: 'yarn.lock', value: 'yarn' },
    { file: 'package-lock.json', value: 'npm' },
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(projectPath, candidate.file))) {
      return candidate.value
    }
  }

  return ''
}

function detectProbableFramework({ packageJson, topLevelEntries, projectPath }) {
  const dependencies = {
    ...(packageJson?.dependencies && typeof packageJson.dependencies === 'object'
      ? packageJson.dependencies
      : {}),
    ...(packageJson?.devDependencies && typeof packageJson.devDependencies === 'object'
      ? packageJson.devDependencies
      : {}),
  }

  if (dependencies.next || fs.existsSync(path.join(projectPath, 'next.config.js'))) {
    return 'Next.js'
  }

  if (dependencies.react || dependencies['react-dom']) {
    if (dependencies.vite || fs.existsSync(path.join(projectPath, 'vite.config.ts'))) {
      return 'Vite + React'
    }

    return 'React'
  }

  if (dependencies.vue || dependencies.nuxt) {
    return 'Vue'
  }

  if (dependencies['@angular/core']) {
    return 'Angular'
  }

  if (dependencies.laravel || fs.existsSync(path.join(projectPath, 'artisan'))) {
    return 'Laravel'
  }

  if (fs.existsSync(path.join(projectPath, 'wp-config.php'))) {
    return 'WordPress'
  }

  if (fs.existsSync(path.join(projectPath, 'pubspec.yaml'))) {
    return 'Flutter'
  }

  if (packageJson || topLevelEntries.includes('package.json')) {
    return 'Node'
  }

  if (topLevelEntries.includes('index.php')) {
    return 'PHP'
  }

  return 'Desconocido'
}

function summarizeGitStatus(projectPath) {
  const gitPath = path.join(projectPath, '.git')

  if (!fs.existsSync(gitPath)) {
    return {
      detected: false,
      branch: '',
      dirty: false,
      summary: 'Sin repositorio git detectado',
    }
  }

  try {
    const result = spawnSync(
      'git',
      ['-C', projectPath, 'status', '--short', '--branch', '--untracked-files=no'],
      {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 4000,
      },
    )

    const stdout = normalizeOptionalString(result.stdout)
    const lines = stdout ? stdout.split(/\r?\n/u).filter(Boolean) : []
    const header = lines[0] || ''
    const dirty = lines.slice(1).length > 0
    const branchMatch = header.match(/^##\s+([^\s.]+)/u)
    const branch = branchMatch?.[1] || ''

    return {
      detected: true,
      branch,
      dirty,
      summary:
        header ||
        (dirty ? 'Repositorio git detectado con cambios' : 'Repositorio git limpio'),
    }
  } catch {
    return {
      detected: true,
      branch: '',
      dirty: false,
      summary: 'Repositorio git detectado, pero no se pudo resumir el estado',
    }
  }
}

function isRuntimeTemporaryPath(relativePath) {
  const normalizedRelativePath = normalizeOptionalString(relativePath).replace(/\\/g, '/')

  if (!normalizedRelativePath) {
    return false
  }

  return RUNTIME_TEMPORARY_PATH_PATTERNS.some((pattern) =>
    pattern.test(normalizedRelativePath),
  )
}

function scanProtectedFiles(projectPath, maxEntries = 500) {
  const sensitiveDetected = []
  const runtimeTemporaryDetected = []
  const queue = [{ currentPath: projectPath, depth: 0 }]
  let visited = 0

  while (queue.length > 0 && visited < maxEntries) {
    const entry = queue.shift()

    if (!entry) {
      continue
    }

    let dirEntries = []

    try {
      dirEntries = fs.readdirSync(entry.currentPath, { withFileTypes: true })
    } catch {
      continue
    }

    for (const dirEntry of dirEntries) {
      if (visited >= maxEntries) {
        break
      }

      visited += 1
      const entryName = normalizeOptionalString(dirEntry?.name)

      if (!entryName) {
        continue
      }

      const fullPath = path.join(entry.currentPath, entryName)
      const relativePath = path.relative(projectPath, fullPath) || entryName
      const normalizedRelativePath = relativePath.replace(/\\/g, '/')
      const matchesProtectedPattern = PROTECTED_FILE_PATTERNS.some((pattern) =>
        pattern.test(entryName),
      )

      if (matchesProtectedPattern) {
        if (isRuntimeTemporaryPath(normalizedRelativePath)) {
          runtimeTemporaryDetected.push(normalizedRelativePath)
        } else {
          sensitiveDetected.push(normalizedRelativePath)
        }
      } else if (isRuntimeTemporaryPath(normalizedRelativePath)) {
        runtimeTemporaryDetected.push(normalizedRelativePath)
      }

      if (
        dirEntry.isDirectory &&
        dirEntry.isDirectory() &&
        entry.depth < 2 &&
        entryName !== 'node_modules' &&
        entryName !== '.git' &&
        entryName !== 'dist' &&
        entryName !== 'build'
      ) {
        queue.push({ currentPath: fullPath, depth: entry.depth + 1 })
      }
    }
  }

  return {
    sensitiveDetected: [...new Set(sensitiveDetected)].slice(0, 40),
    runtimeTemporaryDetected: [...new Set(runtimeTemporaryDetected)].slice(0, 40),
  }
}

function detectEntrypoints(projectPath) {
  const candidates = [
    'src/main.tsx',
    'src/main.jsx',
    'src/index.tsx',
    'src/index.jsx',
    'src/App.tsx',
    'src/App.jsx',
    'app/page.tsx',
    'app/page.jsx',
    'pages/index.tsx',
    'pages/index.jsx',
    'pages/index.js',
    'index.html',
    'server.js',
    'server.ts',
    'main.php',
    'artisan',
    'pubspec.yaml',
  ]

  return candidates
    .filter((relativePath) => fs.existsSync(path.join(projectPath, relativePath)))
    .slice(0, 12)
}

function readPackageJsonSummary(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    return {
      exists: false,
      scripts: {},
      dependencies: {},
      devDependencies: {},
      name: '',
    }
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

    return {
      exists: true,
      name: normalizeOptionalString(parsed?.name),
      scripts:
        parsed?.scripts && typeof parsed.scripts === 'object' ? parsed.scripts : {},
      dependencies:
        parsed?.dependencies && typeof parsed.dependencies === 'object'
          ? parsed.dependencies
          : {},
      devDependencies:
        parsed?.devDependencies && typeof parsed.devDependencies === 'object'
          ? parsed.devDependencies
          : {},
    }
  } catch {
    return {
      exists: true,
      name: '',
      scripts: {},
      dependencies: {},
      devDependencies: {},
      invalid: true,
    }
  }
}

function readJefeManifestSummary(projectPath) {
  const manifestPath = path.join(projectPath, 'jefe-project.json')

  if (!fs.existsSync(manifestPath)) {
    return null
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

    return {
      detected: true,
      projectRoot: normalizeOptionalString(manifest?.projectRoot),
      domain: normalizeOptionalString(manifest?.domain),
      projectType: normalizeOptionalString(manifest?.projectType),
      deliveryLevel: normalizeOptionalString(manifest?.deliveryLevel),
      nextRecommendedPhase: normalizeOptionalString(manifest?.nextRecommendedPhase),
      lastCompletedPhase: normalizeOptionalString(manifest?.lastCompletedPhase),
    }
  } catch {
    return {
      detected: true,
      invalid: true,
    }
  }
}

function inferProjectStack({ framework, packageJson, projectPath }) {
  const stack = []

  if (framework && framework !== 'Desconocido') {
    stack.push(framework)
  }

  if (packageJson?.exists) {
    stack.push('package.json')
  }

  if (fs.existsSync(path.join(projectPath, 'Dockerfile'))) {
    stack.push('Dockerfile')
  }

  if (fs.existsSync(path.join(projectPath, 'docker-compose.yml'))) {
    stack.push('docker-compose')
  }

  return [...new Set(stack)]
}

function analyzeExistingProject(projectPath) {
  const selectedPath = normalizePathForMetadata(projectPath)

  if (!selectedPath) {
    return {
      selectedPath: '',
      detected: false,
      stack: [],
      packageManager: '',
      scripts: [],
      gitStatusSummary: null,
      protectedFilesDetected: [],
      importantFolders: [],
      entrypoints: [],
      warnings: ['No se selecciono una carpeta valida para analizar.'],
      safeToInspect: false,
      lastScannedAt: new Date().toISOString(),
    }
  }

  const stats = safeStat(selectedPath)

  if (!stats || !stats.isDirectory()) {
    return {
      selectedPath,
      detected: false,
      stack: [],
      packageManager: '',
      scripts: [],
      gitStatusSummary: null,
      protectedFilesDetected: [],
      importantFolders: [],
      entrypoints: [],
      warnings: ['La ruta seleccionada no es una carpeta de proyecto inspeccionable.'],
      safeToInspect: false,
      lastScannedAt: new Date().toISOString(),
    }
  }

  let topLevelEntries = []

  try {
    topLevelEntries = fs.readdirSync(selectedPath, { withFileTypes: true })
  } catch {
    return {
      selectedPath,
      detected: false,
      stack: [],
      packageManager: '',
      scripts: [],
      gitStatusSummary: null,
      protectedFilesDetected: [],
      importantFolders: [],
      entrypoints: [],
      warnings: ['No se pudo leer la carpeta del proyecto seleccionado.'],
      safeToInspect: false,
      lastScannedAt: new Date().toISOString(),
    }
  }

  const topLevelNames = topLevelEntries
    .map((entry) => normalizeOptionalString(entry?.name))
    .filter(Boolean)
  const packageJson = readPackageJsonSummary(selectedPath)
  const packageManager = detectPackageManager(selectedPath)
  const framework = detectProbableFramework({
    packageJson,
    topLevelEntries: topLevelNames,
    projectPath: selectedPath,
  })
  const importantFolders = PROJECT_IMPORTANT_FOLDERS.filter((folderName) =>
    fs.existsSync(path.join(selectedPath, folderName)),
  )
  const protectedFileScan = scanProtectedFiles(selectedPath)
  const protectedFilesDetected = protectedFileScan.sensitiveDetected
  const runtimeTemporaryFilesDetected = protectedFileScan.runtimeTemporaryDetected
  const entrypoints = detectEntrypoints(selectedPath)
  const gitStatusSummary = summarizeGitStatus(selectedPath)
  const jefeManifestSummary = readJefeManifestSummary(selectedPath)
  const warnings = []

  if (protectedFilesDetected.length > 0) {
    warnings.push(
      'Se detectaron archivos protegidos. JEFE no los lee ni los envia al planner.',
    )
  }

  if (runtimeTemporaryFilesDetected.length > 0) {
    warnings.push(
      'Se detectaron artefactos de runtime temporal o cache local. JEFE los ignora en este analisis.',
    )
  }

  if (fs.existsSync(path.join(selectedPath, 'node_modules'))) {
    warnings.push('El proyecto ya trae node_modules. JEFE no ejecuta npm install ni scripts.')
  }

  if (
    fs.existsSync(path.join(selectedPath, 'Dockerfile')) ||
    fs.existsSync(path.join(selectedPath, 'docker-compose.yml')) ||
    fs.existsSync(path.join(selectedPath, 'docker-compose.yaml'))
  ) {
    warnings.push('Se detecto Docker. JEFE no levanta contenedores en este analisis.')
  }

  if (packageJson.invalid) {
    warnings.push('package.json existe, pero no se pudo parsear de forma segura.')
  }

  return {
    selectedPath,
    detected: true,
    projectName:
      packageJson.name || normalizeOptionalString(path.basename(selectedPath)),
    framework,
    stack: inferProjectStack({ framework, packageJson, projectPath: selectedPath }),
    packageManager,
    scripts: Object.entries(packageJson.scripts || {})
      .slice(0, 20)
      .map(([name, command]) => ({
        name,
        command: typeof command === 'string' ? command : '',
      })),
    gitStatusSummary,
    protectedFilesDetected,
    runtimeTemporaryFilesDetected,
    importantFolders,
    entrypoints,
    warnings,
    safeToInspect: true,
    lastScannedAt: new Date().toISOString(),
    hasPackageJson: packageJson.exists === true,
    hasGit: gitStatusSummary.detected === true,
    hasNodeModules: fs.existsSync(path.join(selectedPath, 'node_modules')),
    hasDocker:
      fs.existsSync(path.join(selectedPath, 'Dockerfile')) ||
      fs.existsSync(path.join(selectedPath, 'docker-compose.yml')) ||
      fs.existsSync(path.join(selectedPath, 'docker-compose.yaml')),
    packageJsonPath: packageJson.exists ? path.join(selectedPath, 'package.json') : '',
    entrypointCount: entrypoints.length,
    topLevelEntryCount: topLevelNames.length,
    protectedFilesCount: protectedFilesDetected.length,
    jefeManifestSummary,
  }
}

module.exports = {
  analyzeExistingProject,
  buildAttachedInputMetadata,
  buildAttachedInputMetadataList,
}
