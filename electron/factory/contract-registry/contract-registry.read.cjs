const { readdir, readFile } = require('node:fs/promises')
const path = require('node:path')
const { assertFactoryContractRegistryRootAllowed, assertFactoryRegistryPathContained, isSafeFactoryRegistryRelativePath } = require('./contract-registry.path.cjs')

const METADATA_NAME = 'factory-project-contract.v1.meta.json'
const CONTRACT_NAME = 'factory-project-contract.v1.json'
const safeId = (value) => String(value || 'unknown').replace(/[^a-z0-9-]+/giu, '-').replace(/-+/gu, '-').replace(/^-|-$/gu, '').slice(0, 100) || 'unknown'
async function findMetadataFiles(directory) {
  const found = []
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, item.name)
    if (item.isDirectory()) found.push(...await findMetadataFiles(absolute))
    else if (item.isFile() && item.name === METADATA_NAME) found.push(absolute)
  }
  return found
}

async function readFactoryContractRegistryEntries(input) {
  const root = assertFactoryContractRegistryRootAllowed(input.storageRoot)
  let metadataFiles = []
  try { metadataFiles = await findMetadataFiles(root) } catch (error) { if (!error || error.code !== 'ENOENT') throw error }
  const entries = []
  for (const metadataAbsolute of metadataFiles.sort()) {
    const targetAbsolute = path.join(path.dirname(metadataAbsolute), CONTRACT_NAME)
    assertFactoryRegistryPathContained(root, metadataAbsolute); assertFactoryRegistryPathContained(root, targetAbsolute)
    const metadataPath = path.relative(root, metadataAbsolute).replace(/\\/gu, '/')
    const targetPath = path.relative(root, targetAbsolute).replace(/\\/gu, '/')
    const warnings = []; const blockers = []
    let metadata = {}; let contract = {}
    try { metadata = JSON.parse(await readFile(metadataAbsolute, 'utf8')) } catch { blockers.push('Metadata is missing or invalid JSON.') }
    try { contract = JSON.parse(await readFile(targetAbsolute, 'utf8')) } catch { blockers.push('Contract readback is missing or invalid JSON.') }
    if (!isSafeFactoryRegistryRelativePath(metadata.targetPath || '')) blockers.push('Metadata targetPath is unsafe or missing.')
    if (!metadata.fingerprint) blockers.push('Metadata fingerprint is required.'); if (!metadata.idempotencyKey) blockers.push('Metadata idempotencyKey is required.')
    if (metadata.notExecutable !== true || metadata.codexAllowed !== false || metadata.projectCreated !== false || metadata.repositoryCreated !== false || metadata.deployed !== false) blockers.push('Metadata capability flags are unsafe.')
    if (!contract.project || !contract.project.projectId || !contract.project.slug) blockers.push('Contract identity is incomplete.')
    const status = blockers.length ? 'invalid' : 'valid'
    entries.push({ registryEntryId: `registry-${safeId(contract.project && contract.project.projectId)}-${safeId(metadata.fingerprint)}-${safeId(metadataPath)}`, contractProjectId: contract.project && contract.project.projectId || '', contractKind: contract.contractKind || '', contractVersion: contract.contractVersion || '', projectSlug: contract.project && contract.project.slug || '', projectName: contract.project && contract.project.name || '', targetPath, metadataPath, fingerprint: metadata.fingerprint || '', idempotencyKey: metadata.idempotencyKey || '', persistenceId: metadata.persistenceId || '', approvalId: metadata.approvalId || '', candidateId: metadata.candidateId || '', createdAt: contract.createdAt || '', writtenAt: metadata.writtenAt || '', status, validation: { ok: blockers.length === 0, errors: [...blockers], warnings: [...warnings] }, notExecutable: true, codexAllowed: false, projectCreated: false, repositoryCreated: false, deployed: false, warnings, blockers })
  }
  return entries
}

module.exports = { readFactoryContractRegistryEntries }
