const fs = require('fs')
const path = require('path')
const { deserializeProjectContract } = require('./jefe-project-contract.cjs')

const INDEX_FILE = '.jefe-project-index.json'
const INDEX_SCHEMA = 'jefe-project-index/v1'

class ProjectPersistenceError extends Error { constructor(code, message, details = {}) { super(message); this.code = code; this.details = details } }
function fail(code, message, details) { throw new ProjectPersistenceError(code, message, details) }
function inside(root, candidate) { const rel = path.relative(root, candidate); return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel)) }
function safeId(value) { return typeof value === 'string' && /^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,15}$/u.test(value) }
function stable(value) { if (Array.isArray(value)) return value.map(stable); if (!value || typeof value !== 'object') return value; return Object.keys(value).sort().reduce((out, key) => { out[key] = stable(value[key]); return out }, {}) }

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
  return { root: allowedRoot, registerManifest, rebuildIndex, listProjects, getProject, listVersions, getVersion, getVersionRecord, workspaceSnapshot, readManifest, writeAtomic }
}
module.exports = { ProjectPersistenceError, createProjectPersistence }
