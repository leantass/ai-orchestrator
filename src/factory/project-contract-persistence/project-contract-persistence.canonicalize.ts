import type { FactoryProjectContractV1 } from '../project-contract/index.ts'
import type { FactoryProjectContractCanonicalPayload, FactoryProjectContractFingerprint, FactoryProjectContractIdempotencyKey } from './project-contract-persistence.types.ts'

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, normalize(item)]))
  return value
}
export function stableStringifyFactoryContractPayload(value: unknown): string { return JSON.stringify(normalize(value)) }
export function canonicalizeFactoryProjectContractForPersistence(contractDraft: FactoryProjectContractV1): FactoryProjectContractCanonicalPayload {
  const contract = JSON.parse(stableStringifyFactoryContractPayload(contractDraft)) as FactoryProjectContractV1
  return { contractKind: contract.contractKind, contractVersion: contract.contractVersion, projectId: contract.project.projectId, contract, canonicalJson: stableStringifyFactoryContractPayload(contract) }
}
export function createFactoryProjectContractFingerprint(payload: FactoryProjectContractCanonicalPayload): FactoryProjectContractFingerprint {
  let hash = 0x811c9dc5
  for (let index = 0; index < payload.canonicalJson.length; index += 1) { hash ^= payload.canonicalJson.charCodeAt(index); hash = Math.imul(hash, 0x01000193) >>> 0 }
  return { algorithm: 'fnv1a-32', value: hash.toString(16).padStart(8, '0'), cryptographic: false, purpose: 'idempotency_and_basic_change_detection' }
}
export function createFactoryProjectContractIdempotencyKey(input: { contractKind: string; contractVersion: string; projectId: string; approvalId: string; fingerprint: string; targetPath: string }): FactoryProjectContractIdempotencyKey {
  const material = stableStringifyFactoryContractPayload(input); let hash = 0x811c9dc5
  for (let index = 0; index < material.length; index += 1) { hash ^= material.charCodeAt(index); hash = Math.imul(hash, 0x01000193) >>> 0 }
  return { value: `factory-contract-${hash.toString(16).padStart(8, '0')}`, inputs: { ...input } }
}
