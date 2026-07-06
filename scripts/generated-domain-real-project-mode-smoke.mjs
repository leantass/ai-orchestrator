import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const outputRoot = path.join(repoRoot, '.codex-temp', 'orchestrator-official-real-mode-test')
const {
  buildGeneratedDomainSpecializedTemplateArtifacts,
  resolveGeneratedDomainGeneratorReadiness,
} = require(path.join(repoRoot, 'electron', 'generated-domain-orchestration-diagnostics.cjs'))

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value))
}

function createBaseRealProjectContract() {
  return {
    contractVersion: '1.0',
    deliveryLevel: 'fullstack-local',
    domain: {
      label: 'Real Project Local',
      slug: 'real-project-local',
      summary: 'Proyecto local real con SQLite, API REST y backoffice CRUD.',
    },
    root: {
      slug: 'real-project-local',
      sourceRoot: 'real-project-local',
      targetRoot: 'real-project-local',
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
    roles: ['operator', 'admin'],
    entities: ['records', 'requests', 'reports'],
    states: { record: ['new', 'in_progress', 'done'] },
    workflows: ['create records', 'review dashboard', 'manage admin crud'],
    frontendSurfaces: [
      { key: 'public', label: 'Publico', path: 'public/index.html', screens: ['dashboard', 'records'] },
      { key: 'admin', label: 'Admin', path: 'public/admin.html', screens: ['collections', 'crud'] },
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
      tables: ['records', 'requests', 'reports'],
      relationships: [],
      seedData: ['seed local records'],
    },
    shared: { files: ['src/domain.mjs'] },
    docs: ['README.md'],
    scripts: ['scripts/seed.mjs', 'scripts/build.mjs', 'scripts/smoke.mjs'],
    integrations: [],
    safety: {
      forbiddenFiles: ['.env', 'Dockerfile', 'docker-compose.yml'],
      forbiddenSignals: ['real token', 'external api call'],
      explicitExclusions: ['deploy', 'node_modules', 'web-prueba'],
    },
    materialization: {
      requiredFiles: ['src/server.mjs', 'src/db.mjs', 'public/admin.html', 'database/schema.sql'],
      operations: [],
      allowedTargetPaths: [],
    },
    validation: {
      syntaxChecks: ['node --check src/server.mjs', 'node --check src/db.mjs'],
      requiredPathGroups: [],
      forbiddenSearchPatterns: ['ACCESS_TOKEN', 'client_secret', '.env'],
    },
    approvals: [],
  }
}

function createTicketsContract() {
  const contract = cloneJson(createBaseRealProjectContract())
  contract.domain = {
    label: 'Sistema de tickets de soporte',
    slug: 'sistema-tickets-soporte',
    summary: 'Helpdesk local para clientes, agentes, comentarios y SLA.',
  }
  contract.root = { slug: '03-sistema-tickets-soporte', sourceRoot: '03-sistema-tickets-soporte', targetRoot: '03-sistema-tickets-soporte' }
  contract.roles = ['client', 'agent', 'admin']
  contract.entities = ['users', 'tickets', 'comments', 'slaEvents']
  contract.states = { ticket: ['open', 'in_progress', 'resolved', 'closed'] }
  contract.workflows = ['create ticket', 'comment ticket', 'resolve ticket', 'review sla']
  contract.database.tables = ['users', 'tickets', 'comments', 'slaEvents']
  contract.frontendSurfaces[0].screens = ['crear ticket', 'listado', 'detalle', 'dashboard']
  return contract
}

function createEcommerceContract() {
  const contract = cloneJson(createBaseRealProjectContract())
  contract.domain = {
    label: 'Ecommerce de indumentaria',
    slug: 'ecommerce-indumentaria',
    summary: 'Tienda local para catalogo, productos, ordenes mock y stock.',
  }
  contract.root = { slug: '02-ecommerce-indumentaria', sourceRoot: '02-ecommerce-indumentaria', targetRoot: '02-ecommerce-indumentaria' }
  contract.roles = ['shopper', 'admin']
  contract.entities = ['categories', 'products', 'orders', 'orderItems']
  contract.states = { order: ['draft', 'paid_mock', 'preparing', 'shipped', 'cancelled'] }
  contract.workflows = ['browse catalog', 'create mock order', 'manage stock']
  contract.database.tables = ['categories', 'products', 'orders', 'orderItems']
  contract.frontendSurfaces[0].screens = ['catalogo', 'producto', 'carrito', 'checkout mock']
  return contract
}

function createRestaurantContract() {
  const contract = cloneJson(createBaseRealProjectContract())
  contract.domain = {
    label: 'Restaurante con pedidos online',
    slug: 'restaurante-pedidos-online',
    summary: 'Menu local, pedidos online mock, horarios y panel de cocina.',
  }
  contract.root = { slug: '10-restaurante-pedidos-online', sourceRoot: '10-restaurante-pedidos-online', targetRoot: '10-restaurante-pedidos-online' }
  contract.roles = ['customer', 'kitchen', 'admin']
  contract.entities = ['categories', 'menuItems', 'openingHours', 'orders', 'orderItems']
  contract.states = { order: ['new', 'kitchen', 'ready', 'delivered', 'cancelled'] }
  contract.workflows = ['delivery ordering', 'kitchen status', 'menu management']
  contract.database.tables = ['categories', 'menuItems', 'openingHours', 'orders', 'orderItems']
  contract.frontendSurfaces[0].screens = ['menu', 'categorias', 'pedido', 'estado']
  return contract
}

const projectDefinitions = new Map([
  ['03-sistema-tickets-soporte', createTicketsContract],
  ['02-ecommerce-indumentaria', createEcommerceContract],
  ['10-restaurante-pedidos-online', createRestaurantContract],
])

function selectedProjectIds() {
  const projectArgIndex = process.argv.indexOf('--project')
  if (projectArgIndex >= 0) {
    const requested = process.argv[projectArgIndex + 1]
    assert.equal(projectDefinitions.has(requested), true, `Proyecto no soportado por el smoke: ${requested}`)
    return [requested]
  }
  return [...projectDefinitions.keys()]
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

function materializeArtifacts(artifacts) {
  const projectPath = path.join(outputRoot, artifacts.projectRoot)
  fs.rmSync(projectPath, { recursive: true, force: true })
  for (const file of artifacts.filesToCreate) {
    writeFile(path.join(outputRoot, file.path), file.content)
  }
  return projectPath
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

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(`${npmCommand} ${args.join(' ')} failed in ${projectPath}: ${result.stderr || result.stdout}`)
  }

  return result.stdout
}

function buildArtifactsForContract(contract) {
  const readiness = resolveGeneratedDomainGeneratorReadiness({ stackProfile: contract.stackProfile })
  assert.equal(readiness.supportedNow, true)
  assert.equal(readiness.templateFamily, 'node-sqlite-rest-backoffice')

  const artifacts = buildGeneratedDomainSpecializedTemplateArtifacts({
    templateFamily: readiness.templateFamily,
    projectRoot: contract.root.targetRoot,
    domainLabel: contract.domain.label,
    deliveryLevel: contract.deliveryLevel,
    generatedDomainContract: contract,
    stackProfile: contract.stackProfile,
  })

  assert.equal(artifacts?.built, true)
  assert.ok(artifacts.filesToCreate.some((file) => file.path.endsWith('/src/db.mjs') && file.content.includes('node:sqlite')))
  assert.ok(artifacts.filesToCreate.some((file) => file.path.endsWith('/public/app.js') && file.content.includes('data-delete')))
  assert.ok(artifacts.filesToCreate.some((file) => file.path.endsWith('/scripts/smoke.mjs') && file.content.includes('admin create failed')))
  return artifacts
}

function validateMaterializedProject(projectPath) {
  runProjectCommand(projectPath, ['run', 'seed'])
  runProjectCommand(projectPath, ['run', 'build'])
  runProjectCommand(projectPath, ['run', 'smoke'])
  const dbPath = path.join(projectPath, 'data', 'app.sqlite')
  const buildReportPath = path.join(projectPath, 'validation', 'build-report.json')
  const smokeReportPath = path.join(projectPath, 'validation', 'smoke-report.json')
  assert.equal(fs.existsSync(dbPath), true, 'SQLite DB debe existir')
  assert.equal(JSON.parse(fs.readFileSync(buildReportPath, 'utf8')).ok, true)
  assert.equal(JSON.parse(fs.readFileSync(smokeReportPath, 'utf8')).ok, true)
  return {
    dbPath: path.relative(repoRoot, dbPath).replace(/\\/g, '/'),
    dbBytes: fs.statSync(dbPath).size,
  }
}

function main() {
  fs.mkdirSync(outputRoot, { recursive: true })
  const results = []
  for (const projectId of selectedProjectIds()) {
    const contract = projectDefinitions.get(projectId)()
    const artifacts = buildArtifactsForContract(contract)
    const projectPath = materializeArtifacts(artifacts)
    const validation = validateMaterializedProject(projectPath)
    results.push({ projectId, status: 'PASS', templateFamily: artifacts.templateFamily, validation })
  }

  writeFile(
    path.join(outputRoot, 'results.json'),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`,
  )
  console.log(JSON.stringify({ status: 'PASS', total: results.length, outputRoot: path.relative(repoRoot, outputRoot).replace(/\\/g, '/') }, null, 2))
}

main()