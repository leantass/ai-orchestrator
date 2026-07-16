import { FACTORY_PROJECT_CONTRACT_COMPATIBILITY_KIND, FACTORY_PROJECT_CONTRACT_COMPATIBILITY_VERSION } from './project-contract-compatibility.defaults.ts'
import type { FactoryProjectContractCompatibilityInput, FactoryProjectContractCompatibilityResult, FactoryProjectContractCompatibilityValidationResult } from './project-contract-compatibility.types.ts'

const secretPattern = /(api[_-]?key|secret|password|token)\s*[:=]\s*[^\s]{8,}/iu
const forbiddenEnvKeys = ['value', 'actualValue', 'token', 'apiKeyValue', 'secretValue']
const hasEnvValues = (items: unknown[]) => items.some((item) => typeof item === 'object' && item !== null && forbiddenEnvKeys.some((key) => Object.prototype.hasOwnProperty.call(item, key)))

export function validateFactoryProjectContractCompatibilityInput(input: FactoryProjectContractCompatibilityInput): FactoryProjectContractCompatibilityValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const candidate = input?.candidate
  if (!candidate) errors.push('candidate is required.')
  if (!input?.createdAt?.trim()) errors.push('createdAt is required.')
  if (!input?.checkedBy?.trim()) errors.push('checkedBy is required.')
  if (candidate && !candidate.candidateId.trim()) errors.push('candidateId is required.')
  if (candidate && !candidate.source.briefDraftId.trim()) errors.push('briefDraftId is required.')
  if (candidate && !candidate.lineage.opportunityId.trim()) errors.push('opportunityId is required.')
  if (candidate && !['not_ready', 'needs_human_review', 'ready_for_contract_draft'].includes(candidate.readiness.status)) errors.push('Candidate readiness is invalid.')
  if (candidate && hasEnvValues(candidate.environmentVariables)) errors.push('Candidate environment variables contain forbidden values.')
  if (secretPattern.test(JSON.stringify(input))) errors.push('Input appears to contain a secret value.')
  if (!input?.humanApprovalRef && !candidate?.lineage.humanReviewRef) warnings.push('Human approval reference is missing.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryProjectContractCompatibilityResult(result: FactoryProjectContractCompatibilityResult): FactoryProjectContractCompatibilityValidationResult {
  const errors: string[] = []; const warnings: string[] = []
  if (result.compatibilityKind !== FACTORY_PROJECT_CONTRACT_COMPATIBILITY_KIND) errors.push('compatibilityKind is invalid.')
  if (result.compatibilityVersion !== FACTORY_PROJECT_CONTRACT_COMPATIBILITY_VERSION) errors.push('compatibilityVersion is invalid.')
  if (!result.candidateId.trim()) errors.push('candidateId is required.')
  if (!['compatible', 'needs_human_review', 'blocked'].includes(result.status)) errors.push('status is invalid.')
  if (result.canExecuteCodex !== false || result.canCreateProject !== false || result.canCreateRepository !== false || result.canDeploy !== false) errors.push('Execution, creation and deploy capabilities must remain disabled.')
  if (result.status === 'compatible' && (!result.contractDraft || result.contractValidation?.ok !== true || !result.canCreateFactoryProjectContract)) errors.push('Compatible result requires a valid in-memory contract draft.')
  if (result.status !== 'compatible' && result.blockers.length === 0) errors.push('Non-compatible result requires blockers.')
  if (!result.recommendedNextStep.trim()) errors.push('recommendedNextStep is required.')
  if (result.contractDraft) {
    if (hasEnvValues(result.contractDraft.environmentVariables)) errors.push('Contract draft contains forbidden environment values.')
    if (result.contractDraft.independence.runtimeDependsOnJefe !== false) errors.push('Contract draft must not depend on JEFE runtime.')
    if (!result.contractDraft.independence.mustUseOwnRepository || !result.contractDraft.independence.mustHaveOwnRoot || !result.contractDraft.repository.repositoryRequired) errors.push('Contract draft must require its own repository and root.')
  }
  if (secretPattern.test(JSON.stringify(result))) errors.push('Result appears to contain a secret value.')
  if (result.warnings.length > 0) warnings.push(...result.warnings.map((item) => item.message))
  return { ok: errors.length === 0, errors, warnings }
}
