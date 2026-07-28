const fs = require('fs')
const path = require('path')

const DEFAULT_WARNING = 'Input Assets V1 no realiza OCR, analisis visual avanzado ni parsing automatico de PDFs.'
const CSS_VARIABLE_PATTERN = /^--[a-z0-9-]+$/u
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/iu

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function sanitizeText(value, maxLength = 1000) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function ensureInsidePath(targetPath, rootPath, label = 'path') {
  const resolvedTarget = path.resolve(targetPath)
  const resolvedRoot = path.resolve(rootPath)

  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`${label} fuera del root permitido.`)
  }

  return resolvedTarget
}

function normalizeSafeFileName(fileName) {
  const normalized = sanitizeText(fileName, 240)
  if (!normalized || normalized !== path.basename(normalized) || normalized.includes('..')) {
    throw new Error('asset safeName inseguro.')
  }
  return normalized
}

function normalizeRunRelativePath(relativePath) {
  const normalized = sanitizeText(relativePath, 500).replace(/\\/g, '/')
  const parts = normalized.split('/')
  if (
    !normalized ||
    path.isAbsolute(normalized) ||
    /^[A-Za-z]:/u.test(normalized) ||
    parts.some((part) => !part || part === '.' || part === '..')
  ) {
    throw new Error('asset runRelativePath inseguro.')
  }
  return normalized
}

function normalizeAsset(asset) {
  const safeName = normalizeSafeFileName(asset?.safeName)
  return {
    ...asset,
    safeName,
    runRelativePath: normalizeRunRelativePath(asset?.runRelativePath),
    kind: sanitizeText(asset?.kind, 80) || 'asset',
    size: Number.isFinite(asset?.size) ? asset.size : 0,
  }
}

function buildInputAssetsCssVariables(inputAssets) {
  const cssVariables = inputAssets?.cssVariables
  if (!cssVariables || typeof cssVariables !== 'object' || Array.isArray(cssVariables)) return {}

  return Object.fromEntries(
    Object.entries(cssVariables).filter(([key, value]) =>
      CSS_VARIABLE_PATTERN.test(key) && typeof value === 'string' && HEX_COLOR_PATTERN.test(value.trim()),
    ),
  )
}

function projectInputAssetsSummary(inputAssets) {
  if (!inputAssets) return { totalFiles: 0, totalBytes: 0 }

  return {
    totalFiles: inputAssets.totalFiles || 0,
    totalBytes: inputAssets.totalBytes || 0,
    logoCandidate: inputAssets.logoCandidate?.safeName || '',
    detectedHexColors: asArray(inputAssets.detectedHexColors),
  }
}

function buildInputAssetsReportLines(inputAssets) {
  if (!inputAssets) {
    return [
      'Materiales recibidos: 0.',
      'No se cargaron logos, imagenes, PDFs ni referencias visuales para este run.',
    ]
  }

  const assetLines = asArray(inputAssets.assets).map((asset) =>
    `${sanitizeText(asset.safeName, 240) || 'asset'} (${sanitizeText(asset.kind, 80) || 'asset'}, ${asset.size || 0} bytes)`,
  )

  return [
    `Materiales recibidos: ${inputAssets.totalFiles || 0}.`,
    `Materiales copiados: ${inputAssets.totalFiles || 0}.`,
    `Logo candidato: ${inputAssets.logoCandidate?.safeName || 'ninguno'}.`,
    `Colores manuales: ${sanitizeText(inputAssets.manualBrandColors, 500) || 'sin colores manuales'}.`,
    `Colores detectados: ${asArray(inputAssets.detectedHexColors).join(', ') || 'ninguno'}.`,
    `Notas visuales: ${sanitizeText(inputAssets.visualNotes, 1000) || 'sin notas visuales'}.`,
    ...(assetLines.length > 0 ? assetLines : ['Sin archivos de assets.']),
    sanitizeText(inputAssets.warning, 500) || DEFAULT_WARNING,
  ].filter(Boolean)
}

function buildInputAssetsDoc(inputAssets) {
  if (!inputAssets) {
    return `# Input Assets

No se cargaron materiales opcionales para este proyecto.
`
  }

  return `# Input Assets

## Resumen

- Archivos: ${inputAssets.totalFiles || 0}
- Bytes totales: ${inputAssets.totalBytes || 0}
- Logo candidato: ${inputAssets.logoCandidate?.safeName || 'ninguno'}
- Colores manuales: ${sanitizeText(inputAssets.manualBrandColors, 500) || 'sin colores manuales'}
- Colores detectados: ${asArray(inputAssets.detectedHexColors).join(', ') || 'ninguno'}
- Notas visuales: ${sanitizeText(inputAssets.visualNotes, 1000) || 'sin notas visuales'}

## Archivos

${asArray(inputAssets.assets).map((asset) => `- ${sanitizeText(asset.safeName, 240) || 'asset'} (${sanitizeText(asset.kind, 80) || 'asset'})`).join('\n') || '- Sin archivos.'}

## Advertencia

${sanitizeText(inputAssets.warning, 500) || DEFAULT_WARNING}
`
}

async function copyInputAssetsToProject({ inputAssets, sourceRunPath, targetPath }) {
  const resolvedSourceRunPath = path.resolve(sourceRunPath)
  const resolvedTargetPath = path.resolve(targetPath)
  const targetAssetsPath = ensureInsidePath(path.join(resolvedTargetPath, 'assets', 'input'), resolvedTargetPath, 'assets input')
  const targetDocsPath = ensureInsidePath(
    path.join(resolvedTargetPath, 'docs', 'input-assets'),
    resolvedTargetPath,
    'input assets docs',
  )
  const targetAppAssetsPath = ensureInsidePath(path.join(resolvedTargetPath, 'app', 'assets'), resolvedTargetPath, 'app assets')

  await fs.promises.mkdir(targetAssetsPath, { recursive: true })
  await fs.promises.mkdir(targetDocsPath, { recursive: true })
  await fs.promises.mkdir(targetAppAssetsPath, { recursive: true })
  await fs.promises.writeFile(path.join(targetDocsPath, 'INPUT_ASSETS.md'), buildInputAssetsDoc(inputAssets), 'utf8')

  if (!inputAssets) return { copiedAssets: [], logoAppPath: '' }

  const copiedAssets = []
  for (const rawAsset of asArray(inputAssets.assets)) {
    const asset = normalizeAsset(rawAsset)
    const sourcePath = ensureInsidePath(
      path.join(resolvedSourceRunPath, asset.runRelativePath),
      resolvedSourceRunPath,
      'asset origen',
    )
    const targetAssetPath = ensureInsidePath(
      path.join(targetAssetsPath, asset.safeName),
      targetAssetsPath,
      'asset destino',
    )
    await fs.promises.copyFile(sourcePath, targetAssetPath)
    copiedAssets.push({
      ...asset,
      projectRelativePath: path.relative(resolvedTargetPath, targetAssetPath).replace(/\\/g, '/'),
    })
  }

  await fs.promises.writeFile(
    path.join(targetAssetsPath, 'input-assets.json'),
    `${JSON.stringify({ ...inputAssets, assets: copiedAssets }, null, 2)}\n`,
    'utf8',
  )

  let logoAppPath = ''
  if (inputAssets.logoCandidate?.safeName) {
    const logo = normalizeAsset(inputAssets.logoCandidate)
    const extension = sanitizeText(logo.extension, 20) || path.extname(logo.safeName)
    const logoTargetName = `logo${extension}`
    const sourceLogoPath = ensureInsidePath(
      path.join(resolvedSourceRunPath, logo.runRelativePath),
      resolvedSourceRunPath,
      'logo origen',
    )
    const logoTargetPath = ensureInsidePath(
      path.join(targetAppAssetsPath, logoTargetName),
      targetAppAssetsPath,
      'logo destino',
    )
    await fs.promises.copyFile(sourceLogoPath, logoTargetPath)
    logoAppPath = `./assets/${logoTargetName}`
  }

  return { copiedAssets, logoAppPath }
}

module.exports = {
  buildInputAssetsCssVariables,
  buildInputAssetsDoc,
  buildInputAssetsReportLines,
  copyInputAssetsToProject,
  projectInputAssetsSummary,
}
