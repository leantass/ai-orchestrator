import { FACTORY_CONTRACT_REGISTRY_ENTRY_STATUSES, FACTORY_CONTRACT_REGISTRY_KIND, FACTORY_CONTRACT_REGISTRY_VERSION } from './contract-registry.defaults.ts'
import type { FactoryContractRegistryEntry, FactoryContractRegistryIndex, FactoryContractRegistryQueryResult, FactoryContractRegistryValidationResult } from './contract-registry.types.ts'
const secretPattern = /(api[_-]?key|secret|password|token)\s*[:=]\s*[^\s]{8,}/iu
const safeRelative = (value: string) => Boolean(value.trim()) && !/^(?:[a-z]:[\\/]|[\\/]{1,2})/iu.test(value) && !value.split(/[\\/]+/u).includes('..')
const unsafeCapability = (entry: FactoryContractRegistryEntry) => entry.notExecutable !== true || entry.codexAllowed !== false || entry.projectCreated !== false || entry.repositoryCreated !== false || entry.deployed !== false
export function validateFactoryContractRegistryEntry(entry: FactoryContractRegistryEntry): FactoryContractRegistryValidationResult {
  const errors: string[] = []; const warnings = [...(entry?.warnings ?? [])]
  for (const [label, value] of [['registryEntryId', entry?.registryEntryId], ['contractProjectId', entry?.contractProjectId], ['fingerprint', entry?.fingerprint], ['idempotencyKey', entry?.idempotencyKey]] as const) if (!value?.trim()) errors.push(`${label} is required.`)
  if (!safeRelative(entry?.targetPath ?? '') || !safeRelative(entry?.metadataPath ?? '')) errors.push('Entry paths must be safe and relative.'); if (!FACTORY_CONTRACT_REGISTRY_ENTRY_STATUSES.includes(entry?.status)) errors.push('Entry status is invalid.'); if (unsafeCapability(entry)) errors.push('Entry capabilities must remain disabled.'); if (secretPattern.test(JSON.stringify(entry))) errors.push('Entry appears to contain a secret value.')
  return { ok: errors.length === 0, errors, warnings }
}
export function validateFactoryContractRegistryIndex(index: FactoryContractRegistryIndex): FactoryContractRegistryValidationResult {
  const errors: string[] = []; const warnings = [...(index?.warnings ?? [])]
  if (index?.registryKind !== FACTORY_CONTRACT_REGISTRY_KIND) errors.push('registryKind is invalid.'); if (index?.registryVersion !== FACTORY_CONTRACT_REGISTRY_VERSION) errors.push('registryVersion is invalid.'); if (!Array.isArray(index?.entries)) errors.push('entries must be an array.'); if (!Array.isArray(index?.duplicates) || !Array.isArray(index?.conflicts)) errors.push('duplicates and conflicts must be arrays.'); if (!index?.summary) errors.push('summary is required.'); for (const entry of index?.entries ?? []) if (unsafeCapability(entry)) errors.push(`Unsafe entry: ${entry.registryEntryId}`)
  return { ok: errors.length === 0, errors, warnings }
}
export function validateFactoryContractRegistryQueryResult(result: FactoryContractRegistryQueryResult): FactoryContractRegistryValidationResult {
  const errors: string[] = []; const warnings = [...(result?.warnings ?? [])]
  if (!Array.isArray(result?.matches)) errors.push('matches must be an array.'); if (!result?.summary) errors.push('summary is required.'); for (const entry of result?.matches ?? []) if (unsafeCapability(entry)) errors.push(`Unsafe match: ${entry.registryEntryId}`)
  return { ok: errors.length === 0, errors, warnings }
}
