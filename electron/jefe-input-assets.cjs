const fs = require('fs')
const path = require('path')

const MAX_ASSET_FILES = 20
const MAX_ASSET_BYTES = 25 * 1024 * 1024
const MAX_TOTAL_ASSET_BYTES = 100 * 1024 * 1024
const ASSET_WARNING =
  'Input Assets V1 registra y copia materiales localmente. No realiza OCR, analisis visual avanzado ni parsing automatico de PDFs.'
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.pdf', '.txt', '.md'])
const BLOCKED_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.ps1',
  '.js',
  '.ts',
  '.tsx',
  '.jsx',
  '.cjs',
  '.mjs',
  '.zip',
  '.rar',
  '.7z',
])

function stripAccents(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function hasDangerousNameSegment(value) {
  const text = String(value || '')
  return !text.trim() || text.includes('..') || /[\\/]/u.test(text) || /[\x00-\x1F]/u.test(text)
}

function sanitizeAssetName(name) {
  if (hasDangerousNameSegment(name)) {
    throw new Error('Nombre de asset vacio o inseguro.')
  }
  const parsed = path.parse(String(name || ''))
  const extension = parsed.ext.toLowerCase()
  const base = stripAccents(parsed.name)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
    .replace(/\.\.+/g, ' ')
    .replace(/[^\p{L}\p{N} _-]+/gu, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 70)

  if (!base) throw new Error('Nombre de asset vacio o inseguro.')
  return `${base}${extension}`
}

function isAllowedAssetExtension(fileName) {
  const extension = path.extname(String(fileName || '')).toLowerCase()
  return ALLOWED_EXTENSIONS.has(extension) && !BLOCKED_EXTENSIONS.has(extension)
}

function detectAssetKind(fileName) {
  const extension = path.extname(String(fileName || '')).toLowerCase()
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(extension)) {
    const normalized = stripAccents(path.basename(fileName)).toLowerCase()
    if (/(logo|marca|brand|isotipo|icono|identidad)/u.test(normalized)) return 'logo'
    return 'image'
  }
  if (extension === '.pdf') return 'pdf'
  if (extension === '.txt') return 'text'
  if (extension === '.md') return 'markdown'
  return isAllowedAssetExtension(fileName) ? 'unknown_allowed' : 'blocked'
}

function validateAssetSize(size) {
  const bytes = Number(size)
  if (!Number.isFinite(bytes) || bytes < 0) throw new Error('Tamano de asset invalido.')
  if (bytes > MAX_ASSET_BYTES) throw new Error('Asset bloqueado: supera 25 MB.')
  return bytes
}

function makeAssetId(index, safeName) {
  const base = path.parse(safeName).name.replace(/[^a-z0-9_-]/giu, '-').replace(/-+/g, '-')
  return `asset-${String(index + 1).padStart(2, '0')}-${base}`.slice(0, 90)
}

function resolveDuplicateSafeName(safeName, usedNames) {
  if (!usedNames.has(safeName)) {
    usedNames.add(safeName)
    return safeName
  }
  const parsed = path.parse(safeName)
  for (let index = 2; index < 100; index += 1) {
    const nextName = `${parsed.name}-${index}${parsed.ext}`
    if (!usedNames.has(nextName)) {
      usedNames.add(nextName)
      return nextName
    }
  }
  throw new Error('No se pudo resolver nombre duplicado de asset.')
}

function normalizeAssetSelectionItem(file, index, usedNames) {
  const sourcePath = typeof file === 'string' ? file : file?.path || file?.sourcePath
  if (typeof sourcePath !== 'string' || !path.isAbsolute(sourcePath)) {
    return { ok: false, error: 'Asset bloqueado: ruta absoluta requerida.' }
  }
  const originalName = path.basename(sourcePath)
  if (hasDangerousNameSegment(originalName)) {
    return { ok: false, originalName, error: 'Asset bloqueado: nombre inseguro.' }
  }
  if (!isAllowedAssetExtension(originalName)) {
    return { ok: false, originalName, error: 'Asset bloqueado: extension no permitida.' }
  }
  const size = validateAssetSize(file?.size ?? fs.statSync(sourcePath).size)
  const safeName = resolveDuplicateSafeName(sanitizeAssetName(originalName), usedNames)
  const extension = path.extname(safeName).toLowerCase()
  const kind = detectAssetKind(safeName)
  return {
    ok: true,
    id: makeAssetId(index, safeName),
    originalName,
    safeName,
    extension,
    size,
    kind,
    sourcePath,
    usageHint: kind === 'logo' ? 'possible_logo' : undefined,
  }
}

function validateAssetSelection(files = []) {
  if (!Array.isArray(files)) throw new Error('Seleccion de assets invalida.')
  const usedNames = new Set()
  const assets = []
  const blocked = []
  let totalBytes = 0

  for (const [index, file] of files.entries()) {
    if (assets.length >= MAX_ASSET_FILES) {
      blocked.push({ error: 'Asset bloqueado: maximo 20 archivos.' })
      continue
    }
    try {
      const result = normalizeAssetSelectionItem(file, index, usedNames)
      if (!result.ok) {
        blocked.push(result)
        continue
      }
      totalBytes += result.size
      if (totalBytes > MAX_TOTAL_ASSET_BYTES) {
        blocked.push({ originalName: result.originalName, error: 'Asset bloqueado: total supera 100 MB.' })
        totalBytes -= result.size
        continue
      }
      assets.push(result)
    } catch (error) {
      blocked.push({
        originalName: typeof file === 'string' ? path.basename(file) : path.basename(String(file?.path || '')),
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    ok: true,
    assets,
    blocked,
    totalFiles: assets.length,
    totalBytes,
    logoCandidate: assets.find((asset) => asset.kind === 'logo') || null,
  }
}

function extractManualBrandColors(text) {
  const source = typeof text === 'string' ? text.trim().slice(0, 2000) : ''
  const matches = Array.from(source.matchAll(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/gu)).map((match) => match[0])
  const unique = Array.from(new Set(matches)).slice(0, 8)
  return {
    source,
    hexCodes: unique,
    cssVariables: {
      ...(unique[0] ? { '--brand-primary': unique[0] } : {}),
      ...(unique[1] ? { '--brand-secondary': unique[1] } : {}),
      ...(unique[2] ? { '--brand-background': unique[2] } : {}),
      ...(unique[3] ? { '--brand-accent': unique[3] } : {}),
    },
  }
}

async function copyAssetsToRun({ runId, runPath, projectName, assets = [], brandColors = '', visualNotes = '' }) {
  const assetsPath = path.join(runPath, 'inputs', 'assets')
  await fs.promises.mkdir(assetsPath, { recursive: true })
  const validated = validateAssetSelection(assets)
  const copiedAssets = []

  for (const asset of validated.assets) {
    const targetPath = path.join(assetsPath, asset.safeName)
    await fs.promises.copyFile(asset.sourcePath, targetPath)
    copiedAssets.push({
      ...asset,
      sourcePath: undefined,
      runRelativePath: path.relative(runPath, targetPath).replace(/\\/g, '/'),
    })
  }

  const manualColors = extractManualBrandColors(brandColors)
  const manifest = {
    runId,
    createdAt: new Date().toISOString(),
    projectName: projectName || '',
    assets: copiedAssets,
    blocked: validated.blocked,
    manualBrandColors: manualColors.source,
    detectedHexColors: manualColors.hexCodes,
    cssVariables: manualColors.cssVariables,
    visualNotes: typeof visualNotes === 'string' ? visualNotes.trim().slice(0, 4000) : '',
    totalFiles: copiedAssets.length,
    totalBytes: copiedAssets.reduce((sum, asset) => sum + asset.size, 0),
    logoCandidate: copiedAssets.find((asset) => asset.kind === 'logo') || null,
    warning: ASSET_WARNING,
  }
  const manifestPath = path.join(runPath, 'inputs', 'input-assets.json')
  await fs.promises.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  return { ok: true, manifest, manifestPath, assetsPath }
}

async function readInputAssetsManifest(runPath) {
  try {
    const manifestPath = path.join(runPath, 'inputs', 'input-assets.json')
    return JSON.parse(await fs.promises.readFile(manifestPath, 'utf8'))
  } catch {
    return null
  }
}

module.exports = {
  ASSET_WARNING,
  ALLOWED_EXTENSIONS,
  BLOCKED_EXTENSIONS,
  MAX_ASSET_FILES,
  MAX_ASSET_BYTES,
  MAX_TOTAL_ASSET_BYTES,
  sanitizeAssetName,
  detectAssetKind,
  isAllowedAssetExtension,
  validateAssetSize,
  validateAssetSelection,
  extractManualBrandColors,
  copyAssetsToRun,
  readInputAssetsManifest,
}
