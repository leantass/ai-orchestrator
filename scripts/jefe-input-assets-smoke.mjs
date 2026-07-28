import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const require = createRequire(import.meta.url)
const {
  sanitizeAssetName,
  detectAssetKind,
  isAllowedAssetExtension,
  validateAssetSelection,
  extractManualBrandColors,
} = require(path.join(repoRoot, 'electron', 'jefe-input-assets.cjs'))
const {
  createDryRun,
  resolveRunPaths,
} = require(path.join(repoRoot, 'electron', 'jefe-run-persistence.cjs'))
const {
  buildInputAssetsDoc,
  copyInputAssetsToProject,
} = require(path.join(repoRoot, 'electron', 'jefe-input-assets-output.cjs'))

const smokeRoot = path.join(repoRoot, '.codex-temp', 'jefe-input-assets-smoke', `run-${Date.now()}`)
const fixturesRoot = path.join(repoRoot, '.codex-temp', 'jefe-input-assets-fixtures', `fixtures-${Date.now()}`)
const targetRoot = path.join(smokeRoot, 'projects')
const targetProjectPath = path.join(targetRoot, 'Proyecto Demo Universal')
const runId = `input-assets-${Date.now()}`

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

const acceptedFixtures = [
  await writeFixture('logo-demo-universal.png', Buffer.from('png-fixture')),
  await writeFixture('brand-reference.pdf', Buffer.from('%PDF-1.4 fixture')),
  await writeFixture('referencia-home.jpg', Buffer.from('jpg-fixture')),
  await writeFixture('brief-notes.md', Buffer.from('# Notas\nProyecto Demo Universal\n')),
  await writeFixture('referencia-extra.webp', Buffer.from('webp-fixture')),
  await writeFixture('paleta.txt', Buffer.from('primary #111827\n')),
  await writeFixture('icono.svg', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')),
  await writeFixture('foto.jpeg', Buffer.from('jpeg-fixture')),
]
const blockedFixtures = [
  await writeFixture('blocked.exe', Buffer.from('blocked')),
  await writeFixture('blocked.ps1', Buffer.from('blocked')),
  await writeFixture('blocked.js', Buffer.from('blocked')),
  await writeFixture('blocked.zip', Buffer.from('blocked')),
  await writeFixture('blocked.bat', Buffer.from('blocked')),
  await writeFixture('blocked.cmd', Buffer.from('blocked')),
  await writeFixture('blocked.ts', Buffer.from('blocked')),
  await writeFixture('blocked.rar', Buffer.from('blocked')),
]

for (const filePath of acceptedFixtures) {
  assert.equal(isAllowedAssetExtension(filePath), true, `${path.basename(filePath)} permitido`)
}
for (const filePath of blockedFixtures) {
  assert.equal(isAllowedAssetExtension(filePath), false, `${path.basename(filePath)} bloqueado`)
}
assert.equal(sanitizeAssetName('Logo Demo Universal.png'), 'logo-demo-universal.png', 'sanitiza nombres')
assert.throws(() => sanitizeAssetName('../logo.png'), /inseguro|vacio/u, 'bloquea traversal')
assert.equal(detectAssetKind('logo-demo-universal.png'), 'logo', 'detecta logo candidate')

const selection = validateAssetSelection([...acceptedFixtures, ...blockedFixtures])
assert.equal(selection.assets.length, acceptedFixtures.length, 'acepta fixtures seguros')
assert.equal(selection.blocked.length, blockedFixtures.length, 'bloquea fixtures peligrosos')
assert.equal(selection.logoCandidate?.safeName, 'logo-demo-universal.png', 'logo candidate')

const colors = extractManualBrandColors('primary: #111827\nsecondary: #f97316\nbackground: #fff7ed')
assert.deepEqual(colors.hexCodes, ['#111827', '#f97316', '#fff7ed'], 'extrae hex')
assert.equal(colors.cssVariables['--brand-primary'], '#111827', 'primary css')
assert.equal(colors.cssVariables['--brand-secondary'], '#f97316', 'secondary css')
assert.equal(colors.cssVariables['--brand-background'], '#fff7ed', 'background css')

const brief = 'Quiero crear una web institucional llamada Proyecto Demo Universal. Tiene que mostrar servicios, casos, equipo, testimonios y contacto.'
const dryRun = await createDryRun({
  runId,
  title: 'Proyecto Demo Universal',
  brief,
  runType: 'dry-run',
  createdAt: new Date().toISOString(),
  status: 'running',
  currentStep: 'Leyendo brief',
  validation: 'Dry-run en curso',
  steps: [{ label: 'Leyendo brief', status: 'completed' }],
  expectedArtifacts: ['run.json', 'brief.md', 'inputs/input-assets.json'],
  warnings: ['Smoke local sin servicios externos.'],
  inputAssets: {
    assets: selection.assets.slice(0, 4),
    brandColors: colors.source,
    visualNotes: 'Estilo moderno, limpio, de agencia premium.',
  },
}, { repoRoot })
assert.equal(dryRun.ok, true, dryRun.error)

const runPaths = resolveRunPaths(runId, { repoRoot })
assert.equal(fs.existsSync(runPaths.inputAssetsPath), true, 'input-assets.json existe en run')
const runManifest = JSON.parse(fs.readFileSync(runPaths.inputAssetsPath, 'utf8'))
assert.equal(runManifest.totalFiles, 4, 'manifest total files')
assert.equal(runManifest.logoCandidate.safeName, 'logo-demo-universal.png', 'manifest logo')
assert.equal(fs.existsSync(path.join(runPaths.inputAssetsFolderPath, 'logo-demo-universal.png')), true, 'logo copiado al run')

await fs.promises.mkdir(targetProjectPath, { recursive: true })
const inputAssetsDoc = buildInputAssetsDoc(runManifest)
assert.match(inputAssetsDoc, /Input Assets|logo-demo-universal|#111827|Estilo moderno/iu, 'doc neutral')
const copied = await copyInputAssetsToProject({
  inputAssets: runManifest,
  sourceRunPath: runPaths.runPath,
  targetPath: targetProjectPath,
})
assert.equal(copied.copiedAssets.length, 4, 'assets copiados al proyecto fixture')
assert.equal(copied.logoAppPath, './assets/logo.png', 'logo relativo local')
assert.equal(fs.existsSync(path.join(targetProjectPath, 'assets/input/input-assets.json')), true, 'manifest en proyecto')
assert.equal(fs.existsSync(path.join(targetProjectPath, 'docs/input-assets/INPUT_ASSETS.md')), true, 'doc input assets')
assert.equal(fs.existsSync(path.join(targetProjectPath, 'app/assets/logo.png')), true, 'logo app copiado')
assert.doesNotThrow(() => buildInputAssetsDoc({ ...runManifest, visualNotes: 'ok' }), 'manifest seguro')
await assert.rejects(
  () => copyInputAssetsToProject({
    inputAssets: {
      ...runManifest,
      assets: [{ ...runManifest.assets[0], runRelativePath: '../escape.png' }],
    },
    sourceRunPath: runPaths.runPath,
    targetPath: targetProjectPath,
  }),
  /runRelativePath inseguro|fuera del root permitido/u,
  'rechaza traversal en runRelativePath',
)
await assert.rejects(
  () => copyInputAssetsToProject({
    inputAssets: {
      ...runManifest,
      assets: [{ ...runManifest.assets[0], safeName: '../escape.png' }],
    },
    sourceRunPath: runPaths.runPath,
    targetPath: targetProjectPath,
  }),
  /safeName inseguro|fuera del root permitido/u,
  'rechaza safeName inseguro',
)
const projectPath = targetProjectPath
const projectManifest = read(projectPath, 'assets/input/input-assets.json')
const projectDoc = read(projectPath, 'docs/input-assets/INPUT_ASSETS.md')
assert.match(projectDoc, /logo-demo-universal|#111827|Estilo moderno/iu, 'doc describe assets')
assert.equal(fs.existsSync(path.join(projectPath, 'app/index.html')), false, 'no crea app html general')
assert.equal(/C:\\|https?:\/\//iu.test(projectManifest), false, 'sin rutas externas en manifest')
assert.equal(/\.\.\//u.test(projectManifest), false, 'sin traversal en manifest')

console.log(JSON.stringify({
  ok: true,
  acceptedAssets: selection.assets.length,
  blockedAssets: selection.blocked.length,
  runManifest: path.relative(repoRoot, runPaths.inputAssetsPath).replace(/\\/g, '/'),
  projectPath: path.relative(repoRoot, projectPath).replace(/\\/g, '/'),
  logoAppPath: copied.logoAppPath,
}, null, 2))
