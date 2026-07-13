import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')

const {
  normalizeGeneratedDomainContract,
  validateGeneratedDomainContract,
  isContractSafeForLocalMaterialization,
  buildGeneratedDomainContractDiagnostics,
} = require(path.join(repoRoot, 'electron', 'generated-domain-contract.cjs'))
const {
  buildGeneratedDomainSpecializedTemplateArtifacts,
  resolveGeneratedDomainGeneratorReadiness,
} = require(path.join(repoRoot, 'electron', 'generated-domain-orchestration-diagnostics.cjs'))

function parseArgs(argv) {
  const options = { mode: 'real-project', runValidations: false }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--brief') options.brief = argv[index += 1]
    else if (arg === '--output') options.output = argv[index += 1]
    else if (arg === '--mode') options.mode = argv[index += 1]
    else if (arg === '--reports-dir') options.reportsDir = argv[index += 1]
    else if (arg === '--logs-dir') options.logsDir = argv[index += 1]
    else if (arg === '--run-validations') options.runValidations = true
    else if (arg === '--json') options.json = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else throw new Error(`Argumento no soportado: ${arg}`)
  }
  return options
}

function printHelp() {
  console.log(`Usage:
  node scripts/generated-domain-real-project-from-brief.mjs \
    --brief <brief.md> \
    --output <output/project-folder> \
    [--mode real-project] \
    [--reports-dir <dir>] \
    [--logs-dir <dir>] \
    [--run-validations] \
    [--json]
`)
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function slugify(value, fallback = 'generated-real-project') {
  const normalized = normalizeText(value)
    .normalize('NFKD')
    .replace(/[^\w\s-]/gu, '')
    .trim()
    .replace(/[\s_]+/gu, '-')
    .replace(/-+/gu, '-')
    .toLocaleLowerCase()
  return normalized || fallback
}

function ensureInsideRepo(relativeOrAbsolutePath) {
  const resolved = path.resolve(repoRoot, relativeOrAbsolutePath)
  if (!resolved.startsWith(repoRoot)) {
    throw new Error(`Path fuera del repo: ${relativeOrAbsolutePath}`)
  }
  return resolved
}

function relativeProjectRoot(outputPath) {
  return path.basename(path.resolve(repoRoot, outputPath))
}

function detectBriefKind(briefText) {
  const text = briefText.toLocaleLowerCase()
  const laundrySignals = ['lavander', 'uniform', 'prenda', 'servicio', 'retiro', 'entrega', 'lavado']
  const viandasSignals = ['viandas', 'corporativas', 'empleados', 'centro de costo', 'produccion', 'etiquetas']
  const b2bSignals = ['empresa', 'empleado', 'menu', 'pedido', 'reporte']
  if (laundrySignals.filter((signal) => text.includes(signal)).length >= 4) return 'lavanderia-corporativa-b2b'
  if (viandasSignals.filter((signal) => text.includes(signal)).length >= 4) return 'viandas-corporativas-b2b'
  if (b2bSignals.filter((signal) => text.includes(signal)).length >= 4) return 'b2b-operations'
  return 'unsupported'
}

function buildViandasContract({ briefText, outputPath }) {
  const projectRoot = relativeProjectRoot(outputPath)
  const projectSlug = slugify(projectRoot, 'viandas-corporativas-b2b')
  const label = /viandas corporativas b2b/iu.test(briefText)
    ? 'Viandas Corporativas B2B'
    : 'Operaciones B2B Locales'

  return {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: {
      label,
      slug: projectSlug,
      summary: 'Sistema B2B mobile-first para pedidos de viandas corporativas con empresas, empleados, menus, produccion, etiquetas y reportes.',
    },
    root: {
      slug: projectRoot,
      sourceRoot: projectRoot,
      targetRoot: projectRoot,
    },
    stackProfile: {
      frontend: 'vanilla-static-html',
      backend: 'node-local-js',
      database: 'node-sqlite',
      apiStyle: 'rest-crud',
      auth: 'mock-roles',
      styling: 'vanilla-css',
      testing: 'node-smoke',
      packageManager: 'npm',
      runtime: 'node-local',
    },
    roles: [
      'restaurant_admin',
      'company_admin',
      'employee',
      'kitchen_operator',
      'system_admin',
    ],
    entities: [
      'companies',
      'employees',
      'costCenters',
      'menus',
      'menuItems',
      'extras',
      'orders',
      'orderStates',
      'productionItems',
      'labels',
      'reports',
      'cutoffRules',
    ],
    states: {
      order: ['draft', 'pending', 'confirmed', 'preparing', 'prepared', 'delivered', 'cancelled'],
      productionItem: ['pending', 'preparing', 'prepared'],
      label: ['ready', 'printed_mock'],
      report: ['draft', 'ready'],
    },
    workflows: [
      'employee orders meal from mobile portal',
      'employee cancels before cutoff',
      'company admin reviews employee orders by cost center',
      'restaurant admin manages companies menus dishes extras and cutoff rules',
      'kitchen operator reviews daily production and marks orders prepared',
      'system generates printable label data',
      'system generates basic production and company reports',
    ],
    frontendSurfaces: [
      { key: 'employee-portal', label: 'Portal empleado mobile-first', path: 'public/employee.html', screens: ['menu disponible', 'elegir plato', 'extras', 'confirmar pedido', 'estado', 'cancelacion', 'historial'] },
      { key: 'company-panel', label: 'Panel empresa', path: 'public/company.html', screens: ['empleados', 'centros de costo', 'pedidos por empleado', 'reportes por fecha', 'consumo por centro'] },
      { key: 'provider-panel', label: 'Panel restaurante proveedor', path: 'public/provider.html', screens: ['menus', 'platos', 'extras', 'pedidos consolidados', 'produccion', 'etiquetas', 'reportes'] },
      { key: 'kitchen-panel', label: 'Panel cocina produccion', path: 'public/kitchen.html', screens: ['produccion diaria', 'cantidades por plato', 'pendientes', 'preparados', 'agrupacion por empresa'] },
      { key: 'labels', label: 'Etiquetas imprimibles', path: 'public/labels.html', screens: ['empleado', 'empresa', 'centro de costo', 'plato', 'extras', 'fecha', 'observaciones', 'id pedido'] },
      { key: 'reports', label: 'Reportes operativos', path: 'public/reports.html', screens: ['pedidos por dia', 'pedidos por empresa', 'centros de costo', 'cantidades por plato', 'extras', 'cancelados', 'produccion'] },
    ],
    backend: {
      packageFile: 'package.json',
      entryFile: 'src/server.mjs',
      routes: ['src/server.mjs'],
      services: ['src/db.mjs'],
      modules: ['src/validation.mjs'],
    },
    database: {
      schemaFile: 'database/schema.sql',
      seedFile: 'data/seed.json',
      tables: [
        'companies',
        'employees',
        'costCenters',
        'menus',
        'menuItems',
        'extras',
        'orders',
        'orderStates',
        'productionItems',
        'labels',
        'reports',
        'cutoffRules',
      ],
      relationships: [
        'employees belong to companies and cost centers',
        'orders belong to employees companies menus and menu items',
        'production items summarize confirmed non-cancelled orders',
        'labels belong to orders',
        'reports aggregate orders by day company cost center and dish',
      ],
      seedData: ['sample companies employees menus dishes extras orders production labels reports'],
    },
    shared: { files: ['src/domain.mjs'] },
    docs: ['README.md'],
    scripts: ['scripts/seed.mjs', 'scripts/build.mjs', 'scripts/smoke.mjs', 'scripts/domain-smoke.mjs'],
    integrations: [],
    safety: {
      forbiddenFiles: ['.env', 'Dockerfile', 'docker-compose.yml'],
      forbiddenSignals: ['ACCESS_TOKEN', 'MERCADOPAGO_ACCESS_TOKEN', 'client_secret', 'api.mercadopago.com'],
      explicitExclusions: ['deploy', 'node_modules', 'web-prueba', 'production database', 'real email', 'real payment'],
    },
    materialization: {
      requiredFiles: [
        'README.md',
        'package.json',
        'src/server.mjs',
        'src/db.mjs',
        'src/validation.mjs',
        'public/index.html',
        'public/admin.html',
        'public/employee.html',
        'public/company.html',
        'public/provider.html',
        'public/kitchen.html',
        'public/labels.html',
        'public/reports.html',
        'database/schema.sql',
        'data/seed.json',
        'scripts/seed.mjs',
        'scripts/build.mjs',
        'scripts/smoke.mjs',
      ],
      operations: [],
      allowedTargetPaths: [projectRoot],
    },
    validation: {
      syntaxChecks: ['node --check src/server.mjs', 'node --check src/db.mjs', 'node --check scripts/smoke.mjs'],
      requiredPathGroups: [
        { label: 'db', candidates: ['src/db.mjs', 'database/schema.sql'] },
        { label: 'api', candidates: ['src/server.mjs'] },
        { label: 'backoffice', candidates: ['public/admin.html', 'public/app.js'] },
        { label: 'role-ux', candidates: ['public/employee.html', 'public/company.html', 'public/provider.html', 'public/kitchen.html', 'public/labels.html', 'public/reports.html'] },
        { label: 'smoke', candidates: ['scripts/smoke.mjs'] },
      ],
      forbiddenSearchPatterns: ['ACCESS_TOKEN', 'MERCADOPAGO_ACCESS_TOKEN', 'client_secret', '.env'],
    },
    approvals: [],
  }
}

function buildLaundryContract({ briefText, outputPath }) {
  const contract = buildViandasContract({ briefText, outputPath })
  contract.domain = {
    label: 'Lavanderia Corporativa B2B',
    slug: slugify(relativeProjectRoot(outputPath), 'lavanderia-corporativa-b2b'),
    summary: 'Sistema B2B mobile-first para solicitudes de lavanderia corporativa, uniformes, retiros, procesamiento, etiquetas y reportes.',
  }
  contract.roles = [
    'laundry_admin',
    'company_admin',
    'employee',
    'plant_operator',
    'system_admin',
  ]
  contract.entities = [
    'companies',
    'employees',
    'costCenters',
    'services',
    'garmentTypes',
    'requests',
    'requestStates',
    'productionItems',
    'labels',
    'reports',
    'deliveryRoutes',
    'quotaRules',
  ]
  contract.states = {
    request: ['pending', 'confirmed', 'received', 'washing', 'ready', 'delivered', 'cancelled'],
    productionItem: ['pending', 'received', 'washing', 'ready', 'delivered'],
    label: ['ready', 'printed_mock'],
    report: ['draft', 'ready'],
  }
  contract.workflows = [
    'employee requests garment laundry or uniform delivery from mobile portal',
    'employee cancels pending or confirmed request',
    'company admin reviews requests by employee and cost center',
    'laundry provider manages companies services garment types delivery routes and reports',
    'plant operator receives garments and marks washing ready and delivered states',
    'system generates printable label data for confirmed requests',
    'system generates production and company reports by date garment service and status',
  ]
  contract.frontendSurfaces = [
    { key: 'employee-portal', label: 'Portal empleado mobile-first', path: 'public/employee.html', screens: ['servicios disponibles', 'solicitar lavado', 'tipo de prenda', 'cantidad', 'observaciones', 'estado', 'cancelacion', 'historial'] },
    { key: 'company-panel', label: 'Panel empresa', path: 'public/company.html', screens: ['empleados', 'centros de costo', 'solicitudes por empleado', 'cupos', 'reportes por fecha', 'volumen por prenda'] },
    { key: 'provider-panel', label: 'Panel lavanderia proveedor', path: 'public/provider.html', screens: ['empresas cliente', 'servicios', 'tipos de prenda', 'solicitudes consolidadas', 'retiro y entrega', 'etiquetas', 'reportes'] },
    { key: 'plant-panel', label: 'Panel planta produccion', path: 'public/kitchen.html', screens: ['trabajos pendientes', 'prendas recibidas', 'en lavado', 'listas', 'entregadas', 'agrupacion por empresa y prenda'] },
    { key: 'labels', label: 'Etiquetas imprimibles', path: 'public/labels.html', screens: ['empleado', 'empresa', 'centro de costo', 'prenda', 'cantidad', 'servicio', 'fecha', 'observaciones', 'id solicitud'] },
    { key: 'reports', label: 'Reportes operativos', path: 'public/reports.html', screens: ['solicitudes por dia', 'solicitudes por empresa', 'centros de costo', 'volumen por prenda', 'estados', 'cancelados', 'produccion'] },
  ]
  contract.database.tables = [
    'companies',
    'employees',
    'costCenters',
    'services',
    'garmentTypes',
    'requests',
    'requestStates',
    'productionItems',
    'labels',
    'reports',
    'deliveryRoutes',
    'quotaRules',
  ]
  contract.database.relationships = [
    'employees belong to companies and cost centers',
    'requests belong to employees companies cost centers services and garment types',
    'production items summarize non-cancelled requests by company and garment type',
    'labels belong to requests',
    'reports aggregate requests by day company cost center garment service and status',
  ]
  contract.database.seedData = ['sample companies employees cost centers services garment types requests production labels reports routes quotas']
  return contract
}

function buildContractFromBrief({ briefText, outputPath }) {
  const kind = detectBriefKind(briefText)
  if (kind === 'unsupported') {
    throw new Error('Brief no soportado por el mapper minimo actual. Se requieren señales B2B operativas como empresas, empleados, menus, pedidos, produccion, etiquetas y reportes.')
  }
  if (kind === 'lavanderia-corporativa-b2b') return buildLaundryContract({ briefText, outputPath })
  return buildViandasContract({ briefText, outputPath })
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

function materializeArtifacts({ artifacts, outputPath }) {
  const outputAbsolute = ensureInsideRepo(outputPath)
  fs.rmSync(outputAbsolute, { recursive: true, force: true })
  const outputParent = path.dirname(outputAbsolute)
  for (const file of artifacts.filesToCreate) {
    const relativeInsideProject = file.path.startsWith(`${artifacts.projectRoot}/`)
      ? file.path.slice(artifacts.projectRoot.length + 1)
      : file.path
    writeFile(path.join(outputParent, file.path), file.content)
    assert.equal(
      fs.existsSync(path.join(outputAbsolute, relativeInsideProject)),
      true,
      `No se materializo ${relativeInsideProject}`,
    )
  }
  return outputAbsolute
}

function runProjectCommand(projectPath, args) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const effectiveCommand = process.platform === 'win32' ? 'cmd.exe' : npmCommand
  const effectiveArgs = process.platform === 'win32' ? ['/d', '/s', '/c', npmCommand, ...args] : args
  const result = spawnSync(effectiveCommand, effectiveArgs, {
    cwd: projectPath,
    shell: false,
    windowsHide: true,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.error) throw result.error
  return {
    command: `${npmCommand} ${args.join(' ')}`,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

function runNodeCommand(projectPath, args) {
  const result = spawnSync(process.execPath, args, {
    cwd: projectPath,
    shell: false,
    windowsHide: true,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.error) throw result.error
  return {
    command: `node ${args.join(' ')}`,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

function runValidations(projectPath) {
  const results = [
    runProjectCommand(projectPath, ['run', 'seed']),
    runProjectCommand(projectPath, ['run', 'build']),
    runProjectCommand(projectPath, ['run', 'smoke']),
  ]
  if (fs.existsSync(path.join(projectPath, 'scripts', 'domain-smoke.mjs'))) {
    results.push(runNodeCommand(projectPath, ['scripts/domain-smoke.mjs']))
  }
  return results
}

function writeReports({ options, result }) {
  if (options.reportsDir) {
    const reportsDir = ensureInsideRepo(options.reportsDir)
    writeFile(path.join(reportsDir, 'generation-result.json'), `${JSON.stringify(result, null, 2)}\n`)
  }
  if (options.logsDir) {
    const logsDir = ensureInsideRepo(options.logsDir)
    const logLines = [
      `status=${result.status}`,
      `projectPath=${result.projectPath}`,
      `templateFamily=${result.templateFamily}`,
      `filesCreated=${result.filesCreated.length}`,
      ...result.validationResults.map((entry) => [
        `$ ${entry.command}`,
        `exit=${entry.status}`,
        entry.stdout.trim(),
        entry.stderr.trim(),
      ].filter(Boolean).join('\n')),
    ]
    writeFile(path.join(logsDir, 'generation.log'), `${logLines.join('\n\n')}\n`)
  }
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  if (options.help) {
    printHelp()
    return { status: 'help' }
  }
  if (options.mode !== 'real-project') throw new Error(`--mode no soportado: ${options.mode}`)
  if (!options.brief) throw new Error('--brief es requerido')
  if (!options.output) throw new Error('--output es requerido')

  const briefPath = ensureInsideRepo(options.brief)
  const outputPath = ensureInsideRepo(options.output)
  const briefText = fs.readFileSync(briefPath, 'utf8')
  const generatedDomainContract = buildContractFromBrief({ briefText, outputPath })
  const normalizedContract = normalizeGeneratedDomainContract(generatedDomainContract)
  const validation = validateGeneratedDomainContract(normalizedContract)
  assert.equal(validation.ok, true, `GeneratedDomainContract invalid: ${validation.errors.join('; ')}`)
  const safety = isContractSafeForLocalMaterialization(normalizedContract)
  assert.equal(safety.ok, true, `GeneratedDomainContract unsafe: ${safety.errors.join('; ')}`)

  const readiness = resolveGeneratedDomainGeneratorReadiness({ stackProfile: normalizedContract.stackProfile })
  assert.equal(readiness.supportedNow, true)
  assert.equal(readiness.templateFamily, 'node-sqlite-rest-backoffice')
  const artifacts = buildGeneratedDomainSpecializedTemplateArtifacts({
    templateFamily: readiness.templateFamily,
    projectRoot: normalizedContract.root.targetRoot,
    domainLabel: normalizedContract.domain.label,
    deliveryLevel: normalizedContract.deliveryLevel,
    generatedDomainContract: normalizedContract,
    stackProfile: normalizedContract.stackProfile,
  })
  assert.equal(artifacts?.built, true)

  const projectPath = materializeArtifacts({ artifacts, outputPath })
  const validationResults = options.runValidations ? runValidations(projectPath) : []
  const failedValidation = validationResults.find((entry) => entry.status !== 0)
  if (failedValidation) {
    const error = new Error(`Validation failed: ${failedValidation.command}`)
    error.validationResult = failedValidation
    throw error
  }

  const diagnostics = buildGeneratedDomainContractDiagnostics({ generatedDomainContract: normalizedContract }, repoRoot)
  const result = {
    status: 'materialized',
    mode: 'real-project-from-brief',
    mapper: detectBriefKind(briefText),
    templateFamily: artifacts.templateFamily,
    projectRoot: artifacts.projectRoot,
    projectPath: path.relative(repoRoot, projectPath).replace(/\\/g, '/'),
    filesCreated: artifacts.filesToCreate.map((file) => file.path),
    validationResults: validationResults.map((entry) => ({ command: entry.command, status: entry.status })),
    readiness,
    diagnostics: {
      present: diagnostics.present === true,
      valid: diagnostics.valid === true,
      safeForLocalMaterialization: diagnostics.safeForLocalMaterialization === true,
      frontendSurfacesCount: diagnostics.frontendSurfacesCount,
      backendRoutesCount: diagnostics.backendRoutesCount,
      databaseTablesCount: diagnostics.databaseTablesCount,
      errors: diagnostics.errors || [],
      warnings: diagnostics.warnings || [],
    },
  }
  writeReports({ options, result })
  console.log(JSON.stringify(result, null, 2))
  return result
}

try {
  run()
} catch (error) {
  console.error(error?.stack || error?.message || String(error))
  if (error?.validationResult) console.error(JSON.stringify(error.validationResult, null, 2))
  process.exit(1)
}