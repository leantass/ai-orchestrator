import { FACTORY_PROJECT_CONTRACT_PERSISTENCE_RUNTIME_KIND, FACTORY_PROJECT_CONTRACT_PERSISTENCE_RUNTIME_STATUSES, FACTORY_PROJECT_CONTRACT_PERSISTENCE_RUNTIME_VERSION } from './project-contract-persistence-runtime.defaults.ts'
import type { FactoryProjectContractPersistenceRuntimeInput, FactoryProjectContractPersistenceRuntimeResult, FactoryProjectContractPersistenceRuntimeValidationResult } from './project-contract-persistence-runtime.types.ts'
const secretPattern = /(api[_-]?key|secret|password|token)\s*[:=]\s*[^\s]{8,}/iu
const normalizedSegments = (value: string) => value.replace(/\\/gu, '/').split('/').filter(Boolean)
const isStorageRootInsideCodexTemp = (value: string) => normalizedSegments(value).includes('.codex-temp')
const isContainedPath = (root: string, target: string) => { const normalizedRoot = root.replace(/\\/gu, '/').replace(/\/+$/gu, '').toLowerCase(); const normalizedTarget = target.replace(/\\/gu, '/').toLowerCase(); return normalizedTarget.startsWith(`${normalizedRoot}/`) }
export function validateFactoryProjectContractPersistenceRuntimeInput(input: FactoryProjectContractPersistenceRuntimeInput): FactoryProjectContractPersistenceRuntimeValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const persistence = input?.persistenceResult
  if (!persistence) errors.push('persistenceResult is required.'); if (!input?.storageRoot?.trim()) errors.push('storageRoot is required.'); else if (!isStorageRootInsideCodexTemp(input.storageRoot)) errors.push('storageRoot must be inside .codex-temp.'); if (!input?.executedAt?.trim()) errors.push('executedAt is required.'); if (!input?.executedBy?.trim()) errors.push('executedBy is required.')
  if (persistence && (!persistence.fingerprint || !persistence.idempotencyKey || !persistence.canonicalPayload || !persistence.target)) errors.push('Persistence plan requires fingerprint, idempotency key, canonical payload and target.'); if (secretPattern.test(JSON.stringify(input))) errors.push('Input appears to contain a secret value.')
  return { ok: errors.length === 0, errors, warnings }
}
export function validateFactoryProjectContractPersistenceRuntimeResult(result: FactoryProjectContractPersistenceRuntimeResult): FactoryProjectContractPersistenceRuntimeValidationResult {
  const errors: string[] = []; const warnings = result.warnings.map((item) => item.message)
  if (result.runtimePersistenceKind !== FACTORY_PROJECT_CONTRACT_PERSISTENCE_RUNTIME_KIND) errors.push('runtimePersistenceKind is invalid.'); if (result.runtimePersistenceVersion !== FACTORY_PROJECT_CONTRACT_PERSISTENCE_RUNTIME_VERSION) errors.push('runtimePersistenceVersion is invalid.'); if (!FACTORY_PROJECT_CONTRACT_PERSISTENCE_RUNTIME_STATUSES.includes(result.status)) errors.push('status is invalid.')
  if (!isContainedPath(result.storageRoot, result.targetAbsolutePath) || !isContainedPath(result.storageRoot, result.metadataAbsolutePath)) errors.push('Runtime output paths must remain inside storageRoot.')
  if (result.canExecuteCodex !== false || result.canCreateProject !== false || result.canCreateRepository !== false || result.canDeploy !== false) errors.push('Codex, project, repository and deploy must remain disabled.')
  if (result.metadata && (!result.metadata.notExecutable || result.metadata.codexAllowed !== false || result.metadata.projectCreated !== false || result.metadata.repositoryCreated !== false || result.metadata.deployed !== false)) errors.push('Metadata safety flags are invalid.')
  if ((result.status === 'persisted' || result.status === 'idempotent_noop') && !(result.writeResult.written || result.writeResult.idempotent)) errors.push('Successful result requires a write or idempotent outcome.'); if ((result.status === 'failed' || result.status === 'blocked') && result.blockers.length === 0 && !result.writeResult.sanitizedError) errors.push('Failure requires blockers or a sanitized error.'); if (!result.recommendedNextStep.trim()) errors.push('recommendedNextStep is required.')
  return { ok: errors.length === 0, errors, warnings }
}
