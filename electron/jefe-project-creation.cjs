const fs = require('fs')
const path = require('path')
const { resolveRunPaths } = require('./jefe-run-persistence.cjs')
const { readInputAssetsManifest } = require('./jefe-input-assets.cjs')
const {
  buildInputAssetsCssVariables,
  copyInputAssetsToProject,
} = require('./jefe-input-assets-output.cjs')

const RUN_ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/
const DEFAULT_PROJECTS_ROOT = path.join('.codex-temp', 'jefe-projects')

function validateRunId(runId) {
  const normalizedRunId = typeof runId === 'string' ? runId.trim() : ''
  if (!RUN_ID_PATTERN.test(normalizedRunId)) {
    throw new Error('runId invalido. Solo se permiten letras, numeros, guion y guion bajo.')
  }
  return normalizedRunId
}

function ensureInsidePath(targetPath, rootPath, label = 'path') {
  const resolvedTarget = path.resolve(targetPath)
  const resolvedRoot = path.resolve(rootPath)
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`${label} fuera del root permitido.`)
  }
  return resolvedTarget
}

function sanitizeFolderName(value) {
  const cleaned = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
    .replace(/\.\.+/g, ' ')
    .replace(/[^\p{L}\p{N} _-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.slice(0, 80).trim() || 'Proyecto JEFE'
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.promises.readFile(filePath, 'utf8'))
  } catch {
    return null
  }
}

async function writeFile(filePath, content) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
  await fs.promises.writeFile(filePath, content, 'utf8')
}

function buildStylesCss(inputAssets) {
  const cssVariables = buildInputAssetsCssVariables(inputAssets)
  return `:root {
  color-scheme: light;
  --brand-primary: ${cssVariables['--brand-primary'] || '#176b5b'};
  --brand-secondary: ${cssVariables['--brand-secondary'] || '#dce5df'};
  --brand-accent: ${cssVariables['--brand-accent'] || '#85d7c6'};
  --brand-background: ${cssVariables['--brand-background'] || '#f4f7f5'};
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
body { margin: 0; min-height: 100vh; background: var(--brand-background); color: #18231f; }
main { max-width: 960px; margin: 0 auto; padding: 32px; display: grid; gap: 16px; }
.panel { background: white; border: 1px solid #d9e4de; border-radius: 8px; padding: 20px; }
.brand-logo { width: 80px; max-height: 80px; object-fit: contain; border-radius: 8px; }
.swatches { display: flex; flex-wrap: wrap; gap: 8px; }
.swatch { width: 42px; height: 42px; border-radius: 8px; border: 1px solid #cbd8d2; }
`
}

function buildIndexHtml({ projectName, inputAssets, logoAppPath }) {
  const colors = inputAssets?.detectedHexColors || []
  const notes = inputAssets?.visualNotes || 'Sin notas visuales.'
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${projectName}</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <main>
      <section class="panel">
        ${logoAppPath ? `<img class="brand-logo" src="${logoAppPath}" alt="Logo de ${projectName}" />` : ''}
        <h1>${projectName}</h1>
        <p>Mock local generado con materiales de entrada copiados localmente.</p>
      </section>
      <section class="panel">
        <h2>Colores</h2>
        <div class="swatches">
          ${colors.map((color) => `<span class="swatch" style="background:${color}"></span>`).join('')}
        </div>
      </section>
      <section class="panel">
        <h2>Notas visuales</h2>
        <p>${notes}</p>
      </section>
    </main>
  </body>
</html>
`
}

async function createFirstVersionFromRun(runId, options = {}) {
  try {
    const safeRunId = validateRunId(runId)
    const repoRoot = path.resolve(options.repoRoot || path.join(__dirname, '..'))
    const runPaths = resolveRunPaths(safeRunId, { repoRoot })
    const runRecord = await readJsonIfExists(runPaths.runJsonPath)
    const inputAssets = await readInputAssetsManifest(runPaths.runPath)
    const projectName = runRecord?.title || inputAssets?.projectName || 'Proyecto JEFE'
    const projectsRoot = ensureInsidePath(
      path.resolve(repoRoot, options.targetRoot || DEFAULT_PROJECTS_ROOT),
      repoRoot,
      'projects root',
    )
    const safeFolderName = sanitizeFolderName(projectName)
    const targetPath = ensureInsidePath(path.join(projectsRoot, safeFolderName), projectsRoot, 'project target')

    if (fs.existsSync(targetPath)) {
      return {
        ok: false,
        status: 'project_already_exists',
        error: 'La carpeta destino ya existe. No se sobrescribio nada.',
        projectName,
        safeFolderName,
        path: targetPath,
      }
    }

    await fs.promises.mkdir(targetPath, { recursive: true })
    const copied = await copyInputAssetsToProject({
      inputAssets,
      sourceRunPath: runPaths.runPath,
      targetPath,
    })

    await writeFile(path.join(targetPath, 'README.md'), `# ${projectName}\n\nMock local con Input Assets V1.\n`)
    await writeFile(path.join(targetPath, 'app', 'styles.css'), buildStylesCss(inputAssets))
    await writeFile(path.join(targetPath, 'app', 'index.html'), buildIndexHtml({
      projectName,
      inputAssets,
      logoAppPath: copied.logoAppPath,
    }))

    return {
      ok: true,
      status: 'created',
      runId: safeRunId,
      projectName,
      safeFolderName,
      path: targetPath,
      projectPath: targetPath,
      appEntryPath: path.join(targetPath, 'app', 'index.html'),
      inputAssets: {
        copiedAssets: copied.copiedAssets.length,
        logoAppPath: copied.logoAppPath,
      },
      createdFiles: [
        'README.md',
        'docs/input-assets/INPUT_ASSETS.md',
        'assets/input/input-assets.json',
        'app/assets/',
        'app/index.html',
        'app/styles.css',
      ],
      warnings: [
        'Mock local: sin red, sin OCR, sin analisis automatico de PDF y sin ejecucion de archivos.',
      ],
    }
  } catch (error) {
    return {
      ok: false,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

module.exports = {
  DEFAULT_PROJECTS_ROOT,
  createFirstVersionFromRun,
  sanitizeFolderName,
}
