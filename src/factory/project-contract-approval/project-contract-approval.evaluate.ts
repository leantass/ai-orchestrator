import { FACTORY_PROJECT_CONTRACT_APPROVAL_KIND, FACTORY_PROJECT_CONTRACT_APPROVAL_VERSION, createFactoryProjectContractApprovalPolicy } from './project-contract-approval.defaults.ts'
import type { FactoryProjectContractApprovalBlocker, FactoryProjectContractApprovalCheck, FactoryProjectContractApprovalDecision, FactoryProjectContractApprovalInput, FactoryProjectContractApprovalReceipt, FactoryProjectContractApprovalResult, FactoryProjectContractApprovalStatus, FactoryProjectContractApprovalWarning } from './project-contract-approval.types.ts'

const forbiddenEnvKeys = ['value', 'actualValue', 'token', 'apiKeyValue', 'secretValue']
const makeCheck = (checkId: string, category: FactoryProjectContractApprovalCheck['category'], passed: boolean, message: string): FactoryProjectContractApprovalCheck => ({ checkId, category, passed, message })

export function evaluateFactoryProjectContractApproval(input: FactoryProjectContractApprovalInput): FactoryProjectContractApprovalResult {
  const value = structuredClone(input); const compatibility = value.compatibilityResult; createFactoryProjectContractApprovalPolicy(value.policy); const draft = compatibility.contractDraft
  const criticalWarnings = compatibility.warnings.filter((item) => /critical|catastrophic|credential exposure|runtime dependency/iu.test(`${item.category} ${item.message}`))
  const envSafe = Boolean(draft && draft.environmentVariables.every((variable) => forbiddenEnvKeys.every((key) => !Object.prototype.hasOwnProperty.call(variable, key))))
  const forbiddenImportsPresent = Boolean(draft && (!draft.independence.forbiddenRuntimeImports.includes('JEFE') || !draft.independence.forbiddenRuntimeImports.includes('ai-orchestrator')))
  const checks = [
    makeCheck('compatible-result', 'compatibility', compatibility.status === 'compatible' && compatibility.canCreateFactoryProjectContract, 'Compatibility result must be compatible.'),
    makeCheck('contract-draft', 'contract', Boolean(draft), 'Contract draft must be present.'),
    makeCheck('contract-validation', 'contract', compatibility.contractValidation?.ok === true, 'Contract validation must pass.'),
    makeCheck('no-prior-blockers', 'compatibility', compatibility.blockers.length === 0, 'Compatibility blockers must be resolved.'),
    makeCheck('human-approval', 'approval', Boolean(value.humanApprovalRef), 'Human approval reference is required.'),
    makeCheck('reviewer-identity', 'reviewer', Boolean(value.reviewedBy.trim()), 'Reviewer identity is required.'),
    makeCheck('no-critical-warnings', 'warnings', criticalWarnings.length === 0, 'Critical warnings must be resolved.'),
    makeCheck('runtime-independent', 'independence', Boolean(draft && draft.independence.runtimeDependsOnJefe === false && draft.independence.mustHaveOwnRoot && !forbiddenImportsPresent), 'Runtime independence and forbidden JEFE imports are mandatory.'),
    makeCheck('own-repository', 'repository', Boolean(draft && draft.independence.mustUseOwnRepository && draft.repository.repositoryRequired), 'Own repository is mandatory.'),
    makeCheck('environment-safe', 'environment', envSafe, 'Environment variables must contain names and metadata only.'),
    makeCheck('execution-disabled', 'execution', !compatibility.canExecuteCodex && !compatibility.canCreateProject && !compatibility.canCreateRepository && !compatibility.canDeploy, 'Compatibility result must not authorize execution or resource creation.'),
  ]
  const blockers: FactoryProjectContractApprovalBlocker[] = checks.filter((item) => !item.passed).map((item) => ({ blockerId: item.checkId, category: item.category, message: item.message }))
  const warnings: FactoryProjectContractApprovalWarning[] = compatibility.warnings.map((item) => ({ warningId: item.warningId, severity: criticalWarnings.includes(item) ? 'critical' : 'warning', message: item.message }))
  let decision: FactoryProjectContractApprovalDecision; let status: FactoryProjectContractApprovalStatus
  if (compatibility.status !== 'compatible') { decision = 'blocked'; status = 'blocked' }
  else if (!draft) { decision = 'blocked'; status = 'blocked' }
  else if (compatibility.contractValidation?.ok !== true) { decision = 'request_contract_changes'; status = 'requires_changes' }
  else if (compatibility.blockers.length > 0) { decision = 'blocked'; status = 'blocked' }
  else if (criticalWarnings.length > 0) { decision = 'request_contract_changes'; status = 'requires_changes' }
  else if (!value.humanApprovalRef) { decision = 'human_review_required'; status = 'requires_human_review' }
  else if (blockers.length > 0) { decision = 'blocked'; status = 'blocked' }
  else { decision = 'approve_contract_for_persistence_candidate'; status = 'approved_candidate' }
  const approved = decision === 'approve_contract_for_persistence_candidate' && Boolean(draft && value.humanApprovalRef)
  const approvalId = `factory-project-contract-approval-${compatibility.compatibilityId}-${value.createdAt.replace(/[^0-9]/g, '')}`
  const notAuthorizedActions: FactoryProjectContractApprovalReceipt['notAuthorizedActions'] = ['execute_codex', 'create_project', 'create_repository', 'deploy', 'publish', 'mutate_runtime', 'access_secrets']
  const approvalReceipt = approved ? { receiptId: `receipt-${approvalId}`, approvalId, compatibilityId: compatibility.compatibilityId, candidateId: compatibility.candidateId, reviewedBy: value.reviewedBy, reviewedAt: value.createdAt, humanApprovalRef: value.humanApprovalRef!, decision, scope: 'contract_persistence_candidate_only' as const, limitations: ['No persistence is performed.', 'No construction or external execution is authorized.', ...(value.reviewNotes ?? [])], notAuthorizedActions } : undefined
  const approvedContractEnvelope = approved && draft && compatibility.contractValidation ? { envelopeId: `envelope-${approvalId}`, approvalId, contractDraft: structuredClone(draft), validation: structuredClone(compatibility.contractValidation), persistenceStatus: 'not_persisted' as const, runtimeStatus: 'not_executable' as const, codexStatus: 'not_allowed' as const, repositoryStatus: 'not_created' as const, deployStatus: 'not_allowed' as const, recommendedNextStep: 'Submit the approved projection to a separate final persistence review; do not execute Codex.' } : undefined
  return { approvalId, approvalKind: FACTORY_PROJECT_CONTRACT_APPROVAL_KIND, approvalVersion: FACTORY_PROJECT_CONTRACT_APPROVAL_VERSION, createdAt: value.createdAt, reviewedBy: value.reviewedBy, candidateId: compatibility.candidateId, compatibilityId: compatibility.compatibilityId, opportunityId: compatibility.opportunityId, status, decision,
    requirements: checks.map((item) => ({ requirementId: item.checkId, description: item.message, satisfied: item.passed, source: item.category === 'approval' ? 'approval' : item.category === 'reviewer' ? 'reviewer' : item.category === 'contract' ? 'contract' : 'compatibility' })), checks, blockers, warnings, approvalReceipt, approvedContractEnvelope,
    canPersistFactoryProjectContract: false, canExecuteCodex: false, canCreateProject: false, canCreateRepository: false, canDeploy: false,
    recommendedNextStep: approved ? 'Proceed to a separate final contract persistence review; Codex and materialization remain unauthorized.' : decision === 'human_review_required' ? 'Obtain explicit human approval and repeat contract review.' : 'Resolve approval blockers or contract changes and repeat review.' }
}
