const { mkdir, readFile, rename, writeFile } = require('node:fs/promises')
const path = require('node:path')
const { readFactoryContractRegistryEntries } = require('./contract-registry.read.cjs')
const { resolveFactoryContractRegistryRoot } = require('./contract-registry.path.cjs')

const groupDuplicates = (entries, field) => Object.entries(entries.reduce((groups, entry) => entry[field] ? { ...groups, [entry[field]]: [...groups[entry[field]] || [], entry] } : groups, {})).filter(([, group]) => group.length > 1).map(([value, group]) => ({ field, value, registryEntryIds: group.map((entry) => entry.registryEntryId).sort() }))
const groupConflicts = (entries, field) => Object.entries(entries.reduce((groups, entry) => entry[field] ? { ...groups, [entry[field]]: [...groups[entry[field]] || [], entry] } : groups, {})).filter(([, group]) => new Set(group.map((entry) => entry.fingerprint)).size > 1).map(([value, group]) => ({ field, value, registryEntryIds: group.map((entry) => entry.registryEntryId).sort(), fingerprints: [...new Set(group.map((entry) => entry.fingerprint))].sort() }))

async function createFactoryContractRegistryIndex(input) {
  const entries = (input.entries || await readFactoryContractRegistryEntries(input)).slice().sort((left, right) => left.contractProjectId.localeCompare(right.contractProjectId) || left.writtenAt.localeCompare(right.writtenAt) || left.registryEntryId.localeCompare(right.registryEntryId))
  const duplicates = [...groupDuplicates(entries, 'fingerprint'), ...groupDuplicates(entries, 'idempotencyKey')]
  const conflicts = [...groupConflicts(entries, 'contractProjectId'), ...groupConflicts(entries, 'projectSlug')]
  const validEntries = entries.filter((entry) => entry.status === 'valid').length; const invalidEntries = entries.filter((entry) => entry.status === 'invalid').length; const blockedEntries = entries.filter((entry) => entry.status === 'blocked').length
  return { registryKind: 'factory-contract-registry', registryVersion: '1.0', generatedAt: input.generatedAt, storageRoot: input.storageRoot, entries, duplicates, conflicts, warnings: duplicates.length ? ['Duplicate registry identities require review.'] : [], blockers: conflicts.length ? ['Conflicting project identities require human review.'] : [], summary: { totalEntries: entries.length, validEntries, invalidEntries, blockedEntries, duplicateGroups: duplicates.length, conflictGroups: conflicts.length, readyForNextStep: validEntries, recommendedNextStep: conflicts.length ? 'Resolve registry conflicts before MEMORIA or Codex Task Contract review.' : 'Submit validated registry entries to future MEMORIA or Codex Task Contract review; do not execute Codex directly.' } }
}

async function writeFactoryContractRegistryIndex(input) {
  const roots = resolveFactoryContractRegistryRoot(input); const index = input.index || await createFactoryContractRegistryIndex(input); const serialized = `${JSON.stringify(index, null, 2)}\n`
  await mkdir(path.dirname(roots.indexAbsolutePath), { recursive: true })
  try { if (await readFile(roots.indexAbsolutePath, 'utf8') === serialized) return { written: false, idempotent: true, indexAbsolutePath: roots.indexAbsolutePath, readbackVerified: true } } catch (error) { if (!error || error.code !== 'ENOENT') throw error }
  await writeFile(roots.tempAbsolutePath, serialized, { encoding: 'utf8', flag: 'w' }); await rename(roots.tempAbsolutePath, roots.indexAbsolutePath)
  const readbackVerified = await readFile(roots.indexAbsolutePath, 'utf8') === serialized
  if (!readbackVerified) throw new Error('Registry index readback verification failed.')
  return { written: true, idempotent: false, indexAbsolutePath: roots.indexAbsolutePath, readbackVerified }
}

module.exports = { createFactoryContractRegistryIndex, writeFactoryContractRegistryIndex }
