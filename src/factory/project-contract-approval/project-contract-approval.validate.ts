import { FACTORY_PROJECT_CONTRACT_APPROVAL_DECISIONS, FACTORY_PROJECT_CONTRACT_APPROVAL_KIND, FACTORY_PROJECT_CONTRACT_APPROVAL_STATUSES, FACTORY_PROJECT_CONTRACT_APPROVAL_VERSION } from './project-contract-approval.defaults.ts'
import type { FactoryProjectContractApprovalInput, FactoryProjectContractApprovalResult, FactoryProjectContractApprovalValidationResult } from './project-contract-approval.types.ts'

const secretPattern = /(api[_-]?key|secret|password|token)\s*[:=]\s*[^\s]{8,}/iu
const forbiddenEnvKeys = ['value', 'actualValue', 'token', 'apiKeyValue', 'secretValue']
const hasEnvValues = (items: unknown[]) => items.some((item) => typeof item === 'object' && item !== null && forbiddenEnvKeys.some((key) => Object.prototype.hasOwnProperty.call(item, key)))

export function validateFactoryProjectContractApprovalInput(input: FactoryProjectContractApprovalInput): FactoryProjectContractApprovalValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const compatibility = input?.compatibilityResult
  if (!compatibility) errors.push('compatibilityResult is required.')
  if (!input?.createdAt?.trim()) errors.push('createdAt is required.')
  if (!input?.reviewedBy?.trim()) errors.push('reviewedBy is required.')
  if (compatibility && !compatibility.compatibilityId.trim()) errors.push('compatibilityId is required.')
  if (compatibility && !compatibility.candidateId.trim()) errors.push('candidateId is required.')
  if (!input?.humanApprovalRef?.trim()) errors.push('humanApprovalRef is required by policy.')
  if (secretPattern.test(JSON.stringify(input))) errors.push('Input appears to contain a secret value.')
  if (!input?.reviewerRole) warnings.push('reviewerRole was not supplied; JEFE review is assumed only for reporting.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryProjectContractApprovalResult(result: FactoryProjectContractApprovalResult): FactoryProjectContractApprovalValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const approved = result.status === 'approved_candidate'
  if (result.approvalKind !== FACTORY_PROJECT_CONTRACT_APPROVAL_KIND) errors.push('approvalKind is invalid.')
  if (result.approvalVersion !== FACTORY_PROJECT_CONTRACT_APPROVAL_VERSION) errors.push('approvalVersion is invalid.')
  if (!result.approvalId.trim()) errors.push('approvalId is required.')
  if (!FACTORY_PROJECT_CONTRACT_APPROVAL_DECISIONS.includes(result.decision)) errors.push('decision is invalid.')
  if (!FACTORY_PROJECT_CONTRACT_APPROVAL_STATUSES.includes(result.status)) errors.push('status is invalid.')
  if (result.canPersistFactoryProjectContract !== false || result.canExecuteCodex !== false || result.canCreateProject !== false || result.canCreateRepository !== false || result.canDeploy !== false) errors.push('Persistence, execution, creation and deploy must remain disabled.')
  if (approved && (!result.approvalReceipt || !result.approvedContractEnvelope)) errors.push('Approved candidate requires receipt and envelope.')
  if (approved && (!result.approvedContractEnvelope?.contractDraft || result.approvedContractEnvelope.validation.ok !== true)) errors.push('Approved envelope requires a valid contract draft.')
  if (!approved && result.blockers.length === 0 && result.decision !== 'human_review_required' && result.decision !== 'request_contract_changes') errors.push('Blocked or rejected result requires blockers or change reasons.')
  const envelope = result.approvedContractEnvelope
  if (envelope) {
    if (envelope.persistenceStatus !== 'not_persisted' || envelope.runtimeStatus !== 'not_executable' || envelope.codexStatus !== 'not_allowed' || envelope.repositoryStatus !== 'not_created' || envelope.deployStatus !== 'not_allowed') errors.push('Envelope statuses must remain non-executable and non-persisted.')
    if (hasEnvValues(envelope.contractDraft.environmentVariables)) errors.push('Envelope contract contains forbidden environment values.')
    if (envelope.contractDraft.independence.runtimeDependsOnJefe !== false) errors.push('Envelope contract must not depend on JEFE runtime.')
  }
  if (!result.recommendedNextStep.trim()) errors.push('recommendedNextStep is required.')
  if (secretPattern.test(JSON.stringify(result))) errors.push('Result appears to contain a secret value.')
  if (result.warnings.length > 0) warnings.push(...result.warnings.map((item) => item.message))
  return { ok: errors.length === 0, errors, warnings }
}
