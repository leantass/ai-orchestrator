const fs = require('fs')
const path = require('path')
const { deserializeProjectContract } = require('./jefe-project-contract.cjs')
const { sanitizeAssetName, isAllowedAssetExtension, detectAssetKind, MAX_ASSET_FILES, MAX_ASSET_BYTES, MAX_TOTAL_ASSET_BYTES } = require('./jefe-input-assets.cjs')

const INDEX_FILE = '.jefe-project-index.json'
const INDEX_SCHEMA = 'jefe-project-index/v1'

class ProjectPersistenceError extends Error { constructor(code, message, details = {}) { super(message); this.code = code; this.details = details } }
function fail(code, message, details) { throw new ProjectPersistenceError(code, message, details) }
function inside(root, candidate) { const rel = path.relative(root, candidate); return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel)) }
function safeId(value) { return typeof value === 'string' && /^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,15}$/u.test(value) }
function stable(value) { if (Array.isArray(value)) return value.map(stable); if (!value || typeof value !== 'object') return value; return Object.keys(value).sort().reduce((out, key) => { out[key] = stable(value[key]); return out }, {}) }
function assetContentMatches(fileName, data) { const extension = path.extname(fileName).toLowerCase(); if (extension === '.txt' || extension === '.md') return true; if (extension === '.png') return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])); if (extension === '.jpg' || extension === '.jpeg') return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff; if (extension === '.webp') return data.length >= 12 && data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP'; if (extension === '.pdf') return data.subarray(0, 5).toString('ascii') === '%PDF-'; if (extension === '.svg') return /<svg(?:\s|>)/iu.test(data.toString('utf8').slice(0, 4096)); return false }

function createProjectPersistence({ root }) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) fail('INVALID_ROOT', 'El root de persistencia debe ser absoluto.')
  const allowedRoot = path.resolve(root)
  const indexPath = path.join(allowedRoot, INDEX_FILE)
  function assertPath(candidate, label) {
    const resolved = path.resolve(candidate)
    if (!inside(allowedRoot, resolved)) fail('PATH_OUTSIDE_ROOT', `${label} queda fuera del root permitido.`)
    return resolved
  }
  async function writeAtomic(filePath, value) {
    const target = assertPath(filePath, 'archivo')
    await fs.promises.mkdir(path.dirname(target), { recursive: true })
    const temp = `${target}.tmp-${process.pid}-${Date.now()}`
    await fs.promises.writeFile(temp, `${JSON.stringify(stable(value), null, 2)}\n`, 'utf8')
    await fs.promises.rename(temp, target)
  }
  async function readManifest(manifestPath) {
    const target = assertPath(manifestPath, 'manifest')
    let raw
    try { raw = JSON.parse(await fs.promises.readFile(target, 'utf8')) } catch (error) { fail('CORRUPT_MANIFEST', 'El manifest no contiene JSON válido.', { manifestPath: target }) }
    if (!raw || typeof raw !== 'object' || !raw.contract) fail('CORRUPT_MANIFEST', 'El manifest no contiene contrato.', { manifestPath: target })
    const planningPath = path.join(path.dirname(target), 'data', 'planning.json')
    if (fs.existsSync(planningPath)) {
      let persistedPlanning
      try { persistedPlanning = JSON.parse(await fs.promises.readFile(planningPath, 'utf8')) } catch { fail('CORRUPT_PLANNING', 'data/planning.json no contiene JSON válido.', { manifestPath: target }) }
      if (JSON.stringify(stable(persistedPlanning)) !== JSON.stringify(stable(raw.contract.planning))) fail('MANIFEST_PLANNING_MISMATCH', 'manifest.json y data/planning.json no contienen el mismo planning.', { manifestPath: target })
    }
    const project = deserializeProjectContract(JSON.stringify(raw.contract), { allowedRoots: [allowedRoot] })
    const expected = path.join(allowedRoot, project.projectId, project.activeVersionId, 'manifest.json')
    if (path.resolve(expected) !== target) fail('IDENTITY_INCONSISTENT', 'La identidad del manifest no coincide con su ubicación.', { manifestPath: target })
    return { project, manifestPath: target, artifactPaths: Array.isArray(raw.artifactPaths) ? raw.artifactPaths : [], raw }
  }
  async function scan() {
    const records = []
    let projects = []
    try { projects = await fs.promises.readdir(allowedRoot, { withFileTypes: true }) } catch (error) { if (error.code === 'ENOENT') return records; throw error }
    for (const projectDir of projects.filter((entry) => entry.isDirectory() && safeId(entry.name))) {
      const projectRoot = assertPath(path.join(allowedRoot, projectDir.name), 'proyecto')
      const versions = await fs.promises.readdir(projectRoot, { withFileTypes: true }).catch(() => [])
      for (const versionDir of versions.filter((entry) => entry.isDirectory() && safeId(entry.name))) {
        const manifestPath = path.join(projectRoot, versionDir.name, 'manifest.json')
        if (!fs.existsSync(manifestPath)) continue
        try { records.push(await readManifest(manifestPath)) } catch (error) { records.push({ invalid: true, manifestPath, error: { code: error.code || 'CORRUPT_MANIFEST', message: error.message } }) }
      }
    }
    return records
  }
  function indexFromRecords(records) {
    const valid = records.filter((record) => !record.invalid)
    const projects = {}
    for (const record of valid) {
      const project = record.project
      const entry = projects[project.projectId] || { projectId: project.projectId, versions: [] }
      entry.versions.push({ versionId: project.activeVersionId, manifestPath: path.relative(allowedRoot, record.manifestPath).replace(/\\/gu, '/') })
      projects[project.projectId] = entry
    }
    return { schemaVersion: INDEX_SCHEMA, projects: Object.values(projects).map((entry) => ({ ...entry, versions: entry.versions.sort((a, b) => a.versionId.localeCompare(b.versionId)) })).sort((a, b) => a.projectId.localeCompare(b.projectId)) }
  }
  async function rebuildIndex() { const records = await scan(); const index = indexFromRecords(records); await writeAtomic(indexPath, index); return { index, invalidManifests: records.filter((record) => record.invalid) } }
  async function readIndex() {
    try { const parsed = JSON.parse(await fs.promises.readFile(indexPath, 'utf8')); if (parsed.schemaVersion !== INDEX_SCHEMA || !Array.isArray(parsed.projects)) throw new Error('schema'); return parsed } catch { return (await rebuildIndex()).index }
  }
  async function registerManifest(manifestPath) { const record = await readManifest(manifestPath); await rebuildIndex(); return record.project }
  async function listProjects() {
    await readIndex(); const records = (await scan()).filter((record) => !record.invalid)
    const byProject = new Map()
    for (const record of records) { const current = byProject.get(record.project.projectId); if (!current || record.project.timestamps.updatedAt > current.project.timestamps.updatedAt) byProject.set(record.project.projectId, record) }
    return [...byProject.values()].map((record) => record.project).sort((a, b) => a.projectId.localeCompare(b.projectId))
  }
  async function getProject(projectId) { if (!safeId(projectId)) fail('INVALID_ID', 'projectId inválido.'); return (await listProjects()).find((project) => project.projectId === projectId) || null }
  async function listVersions(projectId) { const records = (await scan()).filter((record) => !record.invalid && record.project.projectId === projectId); return records.map((record) => record.project.versions.find((version) => version.versionId === record.project.activeVersionId)).filter(Boolean).sort((a, b) => a.versionId.localeCompare(b.versionId)) }
  async function getVersion(projectId, versionId) { return (await listVersions(projectId)).find((version) => version.versionId === versionId) || null }
  async function getVersionRecord(projectId, versionId) {
    if (!safeId(projectId) || !safeId(versionId)) fail('INVALID_ID', 'La identidad de versión es inválida.')
    return (await scan()).find((record) => !record.invalid && record.project.projectId === projectId && record.project.activeVersionId === versionId) || null
  }
  async function workspaceSnapshot(projectId) { const project = await getProject(projectId); if (!project) return null; const versions = await listVersions(projectId); const rootPath = project.physicalPaths.projectRoot; const previewPath = rootPath ? path.join(rootPath, 'app', 'index.html') : null; return { projectId: project.projectId, state: project.delivery.status, generationProfile: project.generationProfile, projectType: project.projectType, platform: project.platform, creativeDirection: project.visualDirection, materials: { totalFiles: project.inputAssets.totalFiles, references: project.inputAssets.urlReferences.length }, lastActivity: project.timestamps.updatedAt, versionCount: versions.length, activeVersionId: project.activeVersionId, previewAvailable: Boolean(previewPath && fs.existsSync(previewPath)), deliveryAvailable: project.delivery.status === 'delivered_local' && Boolean(project.delivery.localPath && fs.existsSync(project.delivery.localPath)), nextStep: project.delivery.status === 'not_ready' ? 'review_local_artifacts' : 'review_delivery', blockers: project.delivery.status === 'not_ready' ? ['delivery_not_registered'] : [] } }
  async function attachInputAssets(projectId, versionId, files) {
    const record = await getVersionRecord(projectId, versionId); if (!record) fail('VERSION_NOT_FOUND', 'La versión no existe.');
    if (!Array.isArray(files) || files.length === 0) fail('INVALID_ASSET', 'No se recibieron materiales.');
    const current = record.raw.contract.inputAssets || {}; const existing = Array.isArray(current.files) ? current.files : []; if (existing.length + files.length > MAX_ASSET_FILES) fail('INVALID_ASSET', 'Se superó la cantidad máxima de materiales.');
    const targetRoot = path.join(path.dirname(record.manifestPath), 'inputs', 'assets'); await fs.promises.mkdir(targetRoot, { recursive: true }); const used = new Set(existing.map((item) => item.safeName)); let total = existing.reduce((sum, item) => sum + (Number(item.sizeBytes) || 0), 0); const added = [];
    for (const file of files) { const originalName = String(file.name || ''); if (!isAllowedAssetExtension(originalName)) fail('INVALID_ASSET', 'La extensión del material no está permitida.'); const safeName = sanitizeAssetName(originalName); if (used.has(safeName)) fail('INVALID_ASSET', 'Ya existe un material con ese nombre.'); const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data || ''); if (data.length <= 0 || data.length > MAX_ASSET_BYTES || total + data.length > MAX_TOTAL_ASSET_BYTES) fail('INVALID_ASSET', 'El tamaño del material no es válido.'); if (!assetContentMatches(safeName, data)) fail('INVALID_ASSET', 'El contenido no coincide con el tipo declarado.'); const destination = path.resolve(targetRoot, safeName); if (!inside(allowedRoot, destination)) fail('PATH_OUTSIDE_ROOT', 'El material queda fuera del root permitido.'); await fs.promises.writeFile(destination, data, { flag: 'wx' }); used.add(safeName); total += data.length; added.push({ safeName, kind: detectAssetKind(safeName), sizeBytes: data.length }); }
    const nextRaw = { ...record.raw, contract: { ...record.raw.contract, inputAssets: { ...current, files: [...existing, ...added], totalFiles: existing.length + added.length } } }; await writeAtomic(record.manifestPath, nextRaw); await registerManifest(record.manifestPath); return { ok: true, assets: added }
  }
  async function removeInputAsset(projectId, versionId, safeName) { const record = await getVersionRecord(projectId, versionId); if (!record) fail('VERSION_NOT_FOUND', 'La versión no existe.'); const current = record.raw.contract.inputAssets || {}; const files = Array.isArray(current.files) ? current.files : []; const target = files.find((item) => item.safeName === safeName); if (!target) fail('ASSET_NOT_FOUND', 'El material no existe.'); const assetPath = path.resolve(path.dirname(record.manifestPath), 'inputs', 'assets', target.safeName); if (!inside(allowedRoot, assetPath)) fail('PATH_OUTSIDE_ROOT', 'El material queda fuera del root permitido.'); await fs.promises.rm(assetPath, { force: true }); const nextRaw = { ...record.raw, contract: { ...record.raw.contract, inputAssets: { ...current, files: files.filter((item) => item.safeName !== safeName), totalFiles: files.length - 1 } } }; await writeAtomic(record.manifestPath, nextRaw); await registerManifest(record.manifestPath); return { ok: true, removed: safeName } }
  return { root: allowedRoot, registerManifest, rebuildIndex, listProjects, getProject, listVersions, getVersion, getVersionRecord, workspaceSnapshot, readManifest, writeAtomic, attachInputAssets, removeInputAsset }
}
module.exports = { ProjectPersistenceError, createProjectPersistence }
