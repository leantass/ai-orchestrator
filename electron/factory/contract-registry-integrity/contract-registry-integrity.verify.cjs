const { readFile } = require('node:fs/promises')
const { createFactoryContractRegistryIndex } = require('../contract-registry/index.cjs')
const { assertFactoryContractRegistryIntegrityRootAllowed, assertFactoryRegistryIntegrityPathContained, isSafeFactoryRegistryIntegrityRelativePath } = require('./contract-registry-integrity.path.cjs')

const normalize = (value) => Array.isArray(value) ? value.map(normalize) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, normalize(item)])) : value
const stableStringify = (value) => JSON.stringify(normalize(value))
function fnv1a(value) { let hash = 0x811c9dc5; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 0x01000193) >>> 0 } return hash.toString(16).padStart(8, '0') }
function recalculateFactoryContractFingerprint(contract) { return fnv1a(stableStringify(contract)) }
function recalculateFactoryContractIdempotencyKey(input) { return `factory-contract-${fnv1a(stableStringify(input))}` }
const finding = (entryId, kind, severity, message) => ({ findingId: `${entryId || 'registry'}-${kind}`, registryEntryId: entryId || undefined, kind, severity, message })
async function optionalJson(absolute) { try { return { exists: true, value: JSON.parse(await readFile(absolute, 'utf8')) } } catch (error) { return { exists: false, error: error && error.code === 'ENOENT' ? 'missing' : 'invalid' } } }

async function verifyEntry(storageRoot, entry) {
  const findings = []; let pathContained = true; let targetAbsolute; let metadataAbsolute
  try { targetAbsolute = assertFactoryRegistryIntegrityPathContained(storageRoot, entry.targetPath); metadataAbsolute = assertFactoryRegistryIntegrityPathContained(storageRoot, entry.metadataPath) } catch { pathContained = false; findings.push(finding(entry.registryEntryId, 'unsafe_path', 'critical', 'Registry entry path is unsafe or outside storageRoot.')) }
  const contractRead = pathContained ? await optionalJson(targetAbsolute) : { exists: false }; const metadataRead = pathContained ? await optionalJson(metadataAbsolute) : { exists: false }
  if (!contractRead.exists) findings.push(finding(entry.registryEntryId, 'missing_contract_file', 'critical', 'Contract file is missing or invalid.'))
  if (!metadataRead.exists) findings.push(finding(entry.registryEntryId, 'missing_metadata_file', 'critical', 'Metadata file is missing or invalid.'))
  const contract = contractRead.value; const metadata = metadataRead.value
  const recalculatedFingerprint = contract ? recalculateFactoryContractFingerprint(contract) : undefined
  const expectedFingerprint = entry.fingerprint || metadata && metadata.fingerprint || ''
  const fingerprintMatches = Boolean(recalculatedFingerprint && expectedFingerprint === recalculatedFingerprint && metadata && metadata.fingerprint === recalculatedFingerprint)
  if (contract && metadata && !fingerprintMatches) findings.push(finding(entry.registryEntryId, 'fingerprint_mismatch', 'critical', 'Recalculated fingerprint does not match registry and metadata.'))
  const metadataMatchesContract = Boolean(contract && metadata && contract.project && contract.project.projectId === entry.contractProjectId && contract.project.slug === entry.projectSlug && metadata.targetPath === entry.targetPath)
  if (contract && metadata && !metadataMatchesContract) findings.push(finding(entry.registryEntryId, 'metadata_contract_mismatch', 'critical', 'Metadata, registry entry and contract identity do not match.'))
  const flagsSafe = Boolean(metadata && metadata.notExecutable === true && metadata.codexAllowed === false && metadata.projectCreated === false && metadata.repositoryCreated === false && metadata.deployed === false)
  if (metadata && !flagsSafe) findings.push(finding(entry.registryEntryId, 'unsafe_flags', 'critical', 'Metadata enables an unsafe capability.'))
  let recalculatedIdempotencyKey; let idempotencyMatches = false
  if (contract && metadata && recalculatedFingerprint && metadata.approvalId && metadata.targetPath) {
    recalculatedIdempotencyKey = recalculateFactoryContractIdempotencyKey({ contractKind: contract.contractKind, contractVersion: contract.contractVersion, projectId: contract.project.projectId, approvalId: metadata.approvalId, fingerprint: recalculatedFingerprint, targetPath: metadata.targetPath })
    idempotencyMatches = recalculatedIdempotencyKey === entry.idempotencyKey && recalculatedIdempotencyKey === metadata.idempotencyKey
    if (!idempotencyMatches) findings.push(finding(entry.registryEntryId, 'idempotency_mismatch', 'critical', 'Recalculated idempotency key does not match registry and metadata.'))
  } else findings.push(finding(entry.registryEntryId, 'unknown_warning', 'warning', 'Idempotency key could not be recalculated from available fields.'))
  if (entry.status !== 'valid') findings.push(finding(entry.registryEntryId, 'invalid_entry', 'error', 'Registry entry was not valid before integrity verification.'))
  const critical = findings.some((item) => item.severity === 'critical' || item.severity === 'error'); const warning = findings.some((item) => item.severity === 'warning'); const status = critical ? 'blocked' : warning ? 'warning' : 'clean'
  const checks = [{ checkId: 'contract-exists', passed: Boolean(contractRead.exists), message: 'Contract file must exist.' }, { checkId: 'metadata-exists', passed: Boolean(metadataRead.exists), message: 'Metadata file must exist.' }, { checkId: 'fingerprint-match', passed: fingerprintMatches, message: 'Fingerprint must match readback.' }, { checkId: 'idempotency-match', passed: idempotencyMatches, message: 'Idempotency key must match.' }, { checkId: 'safe-flags', passed: flagsSafe, message: 'Metadata flags must remain safe.' }, { checkId: 'path-contained', passed: pathContained, message: 'Paths must remain contained.' }]
  return { registryEntryId: entry.registryEntryId, contractProjectId: entry.contractProjectId, projectSlug: entry.projectSlug, targetPath: entry.targetPath, metadataPath: entry.metadataPath, expectedFingerprint, recalculatedFingerprint, expectedIdempotencyKey: entry.idempotencyKey || '', recalculatedIdempotencyKey, contractExists: Boolean(contractRead.exists), metadataExists: Boolean(metadataRead.exists), metadataMatchesContract, fingerprintMatches, idempotencyMatches, flagsSafe, pathContained, status, checks, findings, canUseForMemory: status === 'clean', canUseForCodexTask: false, canExecuteCodex: false, canCreateProject: false, canCreateRepository: false, canDeploy: false }
}

async function verifyFactoryContractRegistryIntegrity(input) {
  assertFactoryContractRegistryIntegrityRootAllowed(input.storageRoot)
  const registryIndex = input.registryIndex || await createFactoryContractRegistryIndex({ storageRoot: input.storageRoot, generatedAt: input.checkedAt, generatedBy: input.checkedBy })
  const entries = []; for (const entry of registryIndex.entries) entries.push(await verifyEntry(input.storageRoot, entry))
  const globalFindings = []
  for (const duplicate of registryIndex.duplicates || []) globalFindings.push(finding(undefined, duplicate.field === 'fingerprint' ? 'duplicate_fingerprint' : 'duplicate_idempotency_key', 'warning', `Duplicate ${duplicate.field}: ${duplicate.value}`))
  for (const conflict of registryIndex.conflicts || []) globalFindings.push(finding(undefined, 'conflicting_project_identity', 'critical', `Conflicting ${conflict.field}: ${conflict.value}`))
  const findings = [...entries.flatMap((entry) => entry.findings), ...globalFindings]; const critical = findings.filter((item) => item.severity === 'critical').length; const errors = findings.filter((item) => item.severity === 'error').length; const warnings = findings.filter((item) => item.severity === 'warning').length
  const status = critical || errors ? 'blocked' : warnings ? 'warning' : 'clean'; const statusCounts = entries.reduce((counts, entry) => ({ ...counts, [entry.status]: (counts[entry.status] || 0) + 1 }), {}); const severityCounts = findings.reduce((counts, item) => ({ ...counts, [item.severity]: (counts[item.severity] || 0) + 1 }), {})
  const recommendedNextStep = status === 'clean' ? 'Submit clean entries to MEMORIA review; Codex Task Contract remains disabled in v1.' : 'Repair registry or persisted contract integrity findings, then repeat verification before MEMORIA review.'
  return { integrityKind: 'factory-contract-registry-integrity', integrityVersion: '1.0', generatedAt: input.checkedAt, checkedBy: input.checkedBy, storageRoot: input.storageRoot, registryIndexRef: 'factory-contract-registry/index.v1.json', status, entries, summary: { totalEntries: entries.length, statusCounts, severityCounts, criticalFindings: critical, cleanEntries: entries.filter((entry) => entry.status === 'clean').length, blockedEntries: entries.filter((entry) => entry.status === 'blocked').length, canUseForMemory: entries.filter((entry) => entry.canUseForMemory).length, canUseForCodexTask: 0, recommendedNextStep }, findings, blockers: findings.filter((item) => item.severity === 'critical' || item.severity === 'error').map((item) => item.message), warnings: findings.filter((item) => item.severity === 'warning').map((item) => item.message), recommendedNextStep }
}

module.exports = { recalculateFactoryContractFingerprint, recalculateFactoryContractIdempotencyKey, verifyFactoryContractRegistryIntegrity }
