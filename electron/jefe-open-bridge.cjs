const fs = require('fs')
const path = require('path')
let clipboard
let shell
try {
  ;({ clipboard, shell } = require('electron'))
} catch {
  clipboard = { writeText: () => {} }
  shell = { openPath: async () => 'Electron shell no disponible.' }
}

const DESKTOP_PROJECTS_ROOT = 'C:\\Users\\letas\\Desktop\\Proyectos'
const CODEX_TEMP_SEGMENT = `${path.sep}.codex-temp${path.sep}`

function hasDangerousSegments(value) {
  return String(value || '')
    .split(/[\\/]+/u)
    .some((segment) => segment === '..')
}

function normalizeAbsolutePath(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Ruta vacia.')
  }
  if (hasDangerousSegments(value)) {
    throw new Error('Ruta no permitida: contiene segmentos peligrosos.')
  }
  if (!path.isAbsolute(value)) {
    throw new Error('Ruta no permitida: debe ser absoluta.')
  }
  return path.resolve(value)
}

function isInsideRoot(targetPath, rootPath) {
  const resolvedTarget = path.resolve(targetPath)
  const resolvedRoot = path.resolve(rootPath)
  return resolvedTarget === resolvedRoot || resolvedTarget.startsWith(resolvedRoot + path.sep)
}

function validateProjectPath(projectPath) {
  const resolved = normalizeAbsolutePath(projectPath)
  if (!isInsideRoot(resolved, DESKTOP_PROJECTS_ROOT)) {
    throw new Error('Ruta no permitida: fuera de Desktop\\Proyectos.')
  }
  return resolved
}

function validateDemoAppPath(appPath) {
  const resolved = validateProjectPath(appPath)
  const normalized = resolved.toLowerCase()
  if (!normalized.endsWith(`${path.sep}app${path.sep}index.html`)) {
    throw new Error('Ruta no permitida: la app demo debe terminar en app\\index.html.')
  }
  return resolved
}

function validateReportPath(reportPath) {
  const resolved = normalizeAbsolutePath(reportPath)
  if (!resolved.includes(CODEX_TEMP_SEGMENT)) {
    throw new Error('Ruta no permitida: reportes solo bajo .codex-temp.')
  }
  return resolved
}

async function openProjectFolder(projectPath) {
  try {
    const resolved = validateProjectPath(projectPath)
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      return { ok: false, error: 'No se encontro carpeta del proyecto.', path: resolved }
    }
    const result = await shell.openPath(resolved)
    return result ? { ok: false, error: result, path: resolved } : { ok: true, path: resolved }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

async function openDemoApp(appPath) {
  try {
    const resolved = validateDemoAppPath(appPath)
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
      return { ok: false, error: 'No se encontro app/index.html.', path: resolved }
    }
    const result = await shell.openPath(resolved)
    return result ? { ok: false, error: result, path: resolved } : { ok: true, path: resolved }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

function copyToClipboard(value) {
  try {
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) throw new Error('No hay texto para copiar.')
    clipboard.writeText(text)
    return { ok: true, value: text }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

module.exports = {
  DESKTOP_PROJECTS_ROOT,
  validateProjectPath,
  validateDemoAppPath,
  validateReportPath,
  openProjectFolder,
  openDemoApp,
  copyToClipboard,
}
