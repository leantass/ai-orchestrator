import { FACTORY_PROJECT_CONTRACT_CANDIDATE_KIND, FACTORY_PROJECT_CONTRACT_CANDIDATE_VERSION } from './project-contract-candidate.defaults.ts'
import type { FactoryProjectContractCandidate, FactoryProjectContractCandidateInput, FactoryProjectContractCandidateValidationResult } from './project-contract-candidate.types.ts'

const secretPattern = /(api[_-]?key|secret|password|token)\s*[:=]\s*[^\s]{8,}/iu
const forbiddenEnvKeys = ['value', 'actualValue', 'token', 'apiKeyValue', 'secretValue']
const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

export function validateFactoryProjectContractCandidateInput(input: FactoryProjectContractCandidateInput): FactoryProjectContractCandidateValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const draft = input?.draft
  if (!draft) errors.push('draft is required.')
  if (!input?.createdAt?.trim()) errors.push('createdAt is required.')
  if (!input?.createdBy?.trim()) errors.push('createdBy is required.')
  if (draft && !draft.briefDraftId.trim()) errors.push('briefDraftId is required.')
  if (draft && !draft.opportunityId.trim()) errors.push('opportunityId is required.')
  if (draft && !draft.title.trim()) errors.push('title is required.')
  if (draft && !draft.problem.statement.trim()) errors.push('problem is required.')
  if (draft && !draft.audience.primary.trim()) errors.push('audience is required.')
  const independence = draft?.independencePolicy
  if (draft && (!independence || !independence.mustHaveOwnRoot || !independence.mustHaveOwnRepository || !independence.mustNotDependOnJefeRuntime || !independence.mustNotImportJefeModules)) errors.push('Complete draft independence policy is required.')
  if (draft && JSON.stringify(draft.evidenceSummary).length > 8000) errors.push('Raw or excessive evidence is not allowed.')
  if (secretPattern.test(JSON.stringify(input))) errors.push('Input appears to contain a secret value.')
  if (!input?.humanReviewRef) warnings.push('Human review is pending.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryProjectContractCandidate(candidate: FactoryProjectContractCandidate): FactoryProjectContractCandidateValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const independence = candidate.independencePolicy
  if (candidate.candidateKind !== FACTORY_PROJECT_CONTRACT_CANDIDATE_KIND) errors.push('candidateKind is invalid.')
  if (candidate.candidateVersion !== FACTORY_PROJECT_CONTRACT_CANDIDATE_VERSION) errors.push('candidateVersion is invalid.')
  if (!candidate.candidateId.trim() || !candidate.source.briefDraftId.trim() || !candidate.lineage.opportunityId.trim()) errors.push('Candidate and lineage identifiers are required.')
  if (!candidate.identity.name.trim()) errors.push('identity.name is required.')
  if (!validSlug.test(candidate.identity.slugSuggestion) || candidate.identity.slugSuggestion.length > 63) errors.push('identity.slugSuggestion is invalid.')
  if (candidate.repository.repositoryRequired !== true || candidate.repository.ownRootRequired !== true || candidate.repository.creationAllowed !== false) errors.push('Own repository/root must be required while repository creation stays disabled.')
  if (!independence.mustHaveOwnRoot || !independence.mustHaveOwnRepository || !independence.mustNotDependOnJefeRuntime || !independence.mustNotImportJefeModules) errors.push('Complete independence policy is required.')
  for (const variable of candidate.environmentVariables) for (const key of forbiddenEnvKeys) if (Object.prototype.hasOwnProperty.call(variable, key)) errors.push(`Environment variable ${variable.name} contains forbidden field ${key}.`)
  if (!candidate.qualityProfile?.profile) errors.push('qualityProfile is required.')
  if (!candidate.securityProfile?.profile) errors.push('securityProfile is required.')
  if (candidate.evidenceRequirements.length === 0) errors.push('Evidence requirements are required.')
  if (candidate.approvalRequirements.length === 0) errors.push('Approval requirements are required.')
  if (candidate.executionPolicy.codexExecutionAllowed !== false || candidate.executionPolicy.projectCreationAllowed !== false || candidate.executionPolicy.repositoryCreationAllowed !== false || candidate.executionPolicy.deployAllowed !== false) errors.push('All execution and creation capabilities must remain disabled.')
  if (candidate.policy.requireHumanApprovalBeforeContractCreation !== true || candidate.policy.requireHumanApprovalBeforeCodex !== true) errors.push('Human approvals before contract creation and Codex are mandatory.')
  if (!candidate.recommendedNextStep.trim()) errors.push('recommendedNextStep is required.')
  if (secretPattern.test(JSON.stringify(candidate))) errors.push('Candidate appears to contain a secret value.')
  if (candidate.readiness.status === 'ready_for_contract_draft' && !candidate.lineage.humanReviewRef) errors.push('Ready candidate requires humanReviewRef.')
  if (candidate.readiness.status !== 'ready_for_contract_draft') warnings.push('Candidate is not ready for contract drafting.')
  return { ok: errors.length === 0, errors, warnings }
}
