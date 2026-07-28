import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const require = createRequire(import.meta.url)
const { createDryRun } = require(path.join(repoRoot, 'electron', 'jefe-run-persistence.cjs'))
const { validateAssetSelection, extractManualBrandColors } = require(path.join(repoRoot, 'electron', 'jefe-input-assets.cjs'))
const { createFirstVersionFromRun } = require(path.join(repoRoot, 'electron', 'jefe-project-creation.cjs'))

const smokeRoot = path.join(repoRoot, '.codex-temp', 'jefe-project-creation-smoke', `run-${Date.now()}`)
const fixturesRoot = path.join(smokeRoot, 'fixtures')
const targetRoot = path.join(smokeRoot, 'projects')
const runId = `project-assets-${Date.now()}`

async function writeFixture(name, content) {
  const filePath = path.join(fixturesRoot, name)
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
  await fs.promises.writeFile(filePath, content)
  return filePath
}

function read(projectPath, relativePath) {
  const filePath = path.join(projectPath, relativePath)
  assert.equal(fs.existsSync(filePath), true, `${relativePath} existe`)
  return fs.readFileSync(filePath, 'utf8')
}

const logoPath = await writeFixture('logo-demo-universal.png', Buffer.from('png-fixture'))
const pdfPath = await writeFixture('brand-reference.pdf', Buffer.from('%PDF-1.4 fixture'))
const selection = validateAssetSelection([
  { path: logoPath, size: fs.statSync(logoPath).size },
  { path: pdfPath, size: fs.statSync(pdfPath).size },
])
const colors = extractManualBrandColors('primary: #111827\nsecondary: #f97316')

const dryRun = await createDryRun({
  runId,
  title: 'Proyecto Demo Universal',
  brief: 'Mock local universal con logo, PDF, colores y nota visual.',
  runType: 'dry-run',
  createdAt: new Date().toISOString(),
  status: 'completed',
  currentStep: 'Preparando entrega',
  validation: 'Input Assets listo',
  steps: [{ label: 'Preparando entrega', status: 'completed' }],
  expectedArtifacts: ['inputs/input-assets.json'],
  warnings: ['Smoke local sin servicios externos.'],
  inputAssets: {
    assets: selection.assets,
    brandColors: colors.source,
    visualNotes: 'Nota visual neutral para el proyecto mock.',
  },
}, { repoRoot })
assert.equal(dryRun.ok, true, dryRun.error)

const created = await createFirstVersionFromRun(runId, { repoRoot, targetRoot })
assert.equal(created.ok, true, created.error)
assert.equal(created.path.startsWith(targetRoot), true, 'proyecto bajo targetRoot')

const projectPath = created.path
const manifest = read(projectPath, 'assets/input/input-assets.json')
const inputAssetsDoc = read(projectPath, 'docs/input-assets/INPUT_ASSETS.md')
const indexHtml = read(projectPath, 'app/index.html')
const stylesCss = read(projectPath, 'app/styles.css')

assert.equal(fs.existsSync(path.join(projectPath, 'assets/input/logo-demo-universal.png')), true, 'logo en assets/input')
assert.equal(fs.existsSync(path.join(projectPath, 'assets/input/brand-reference.pdf')), true, 'pdf en assets/input')
assert.equal(fs.existsSync(path.join(projectPath, 'app/assets/logo.png')), true, 'logo en app/assets')
assert.match(inputAssetsDoc, /logo-demo-universal|brand-reference|#111827|Nota visual neutral/iu)
assert.match(indexHtml, /\.\/assets\/logo\.png/iu, 'logo relativo en html')
assert.match(stylesCss, /--brand-primary:\s*#111827|--brand-secondary:\s*#f97316/iu, 'variables de marca')
assert.equal(/C:\\|https?:\/\//iu.test(`${manifest}\n${inputAssetsDoc}\n${indexHtml}\n${stylesCss}`), false, 'sin rutas absolutas o externas')
assert.equal(/\.\.\//u.test(`${manifest}\n${inputAssetsDoc}\n${indexHtml}\n${stylesCss}`), false, 'sin traversal')

const unsafeRunId = `project-assets-unsafe-${Date.now()}`
const unsafeRun = await createDryRun({
  runId: unsafeRunId,
  title: 'Proyecto Inseguro',
  brief: 'Debe rechazar traversal.',
  runType: 'dry-run',
  createdAt: new Date().toISOString(),
  status: 'completed',
  currentStep: 'Preparando entrega',
  validation: 'Input Assets listo',
  steps: [{ label: 'Preparando entrega', status: 'completed' }],
  expectedArtifacts: ['inputs/input-assets.json'],
  warnings: [],
  inputAssets: {
    assets: selection.assets.slice(0, 1),
    brandColors: colors.source,
    visualNotes: 'ok',
  },
}, { repoRoot })
assert.equal(unsafeRun.ok, true, unsafeRun.error)
const unsafeRunPath = path.join(repoRoot, '.codex-temp', 'jefe-ui-real-flow', 'runs', unsafeRunId, 'inputs', 'input-assets.json')
const unsafeManifest = JSON.parse(fs.readFileSync(unsafeRunPath, 'utf8'))
unsafeManifest.assets[0].runRelativePath = '../escape.png'
await fs.promises.writeFile(unsafeRunPath, `${JSON.stringify(unsafeManifest, null, 2)}\n`, 'utf8')
const unsafeCreated = await createFirstVersionFromRun(unsafeRunId, {
  repoRoot,
  targetRoot: path.join(smokeRoot, 'unsafe-projects'),
})
assert.equal(unsafeCreated.ok, false, 'rechaza traversal en manifest')
assert.match(unsafeCreated.error || '', /runRelativePath inseguro|fuera del root permitido/iu)

console.log(JSON.stringify({
  ok: true,
  projectPath: path.relative(repoRoot, projectPath).replace(/\\/g, '/'),
  copiedAssets: created.inputAssets.copiedAssets,
  logoAppPath: created.inputAssets.logoAppPath,
}, null, 2))
