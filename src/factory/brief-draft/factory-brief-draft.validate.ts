import { FACTORY_BRIEF_DRAFT_KIND, FACTORY_BRIEF_DRAFT_VERSION } from './factory-brief-draft.defaults.ts'
import type { FactoryBriefDraft, FactoryBriefDraftInput, FactoryBriefDraftValidationResult } from './factory-brief-draft.types.ts'

const secretPattern = /(api[_-]?key|secret|password|token)\s*[:=]\s*[^\s]{8,}/iu
const hasSecret = (value: unknown) => secretPattern.test(JSON.stringify(value))

export function validateFactoryBriefDraftInput(input: FactoryBriefDraftInput): FactoryBriefDraftValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const signal = input?.signal
  if (!signal) errors.push('signal is required.')
  if (!input?.decisionId?.trim()) errors.push('decisionId is required.')
  if (!input?.createdAt?.trim()) errors.push('createdAt is required.')
  if (!input?.createdBy?.trim()) errors.push('createdBy is required.')
  if (signal && !signal.opportunityId.trim()) errors.push('signal.opportunityId is required.')
  if (signal && !signal.title.trim()) errors.push('signal.title is required.')
  if (signal && !signal.problem.trim()) errors.push('signal.problem is required.')
  if (signal && !signal.audience.trim()) errors.push('signal.audience is required.')
  if (signal && !signal.proposedSolution.trim()) errors.push('signal.proposedSolution is required.')
  if (signal && signal.requiredAcceptanceCriteriaDraft.length === 0) errors.push('At least one preliminary acceptance criterion is required.')
  if (signal && JSON.stringify(signal.evidenceSummary).length > 8000) errors.push('Raw or excessive evidence is not allowed in the draft input.')
  if (hasSecret(input)) errors.push('Input appears to contain a secret value.')
  if (signal && !signal.monetizationHypothesis.trim()) warnings.push('Monetization hypothesis is missing.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryBriefDraft(draft: FactoryBriefDraft): FactoryBriefDraftValidationResult {
  const errors: string[] = []; const warnings: string[] = []; const independence = draft.independencePolicy
  if (draft.briefDraftKind !== FACTORY_BRIEF_DRAFT_KIND) errors.push('briefDraftKind is invalid.')
  if (draft.briefDraftVersion !== FACTORY_BRIEF_DRAFT_VERSION) errors.push('briefDraftVersion is invalid.')
  if (!draft.opportunityId.trim() || !draft.source.opportunityId.trim()) errors.push('opportunityId is required.')
  if (!draft.decisionId.trim() || !draft.source.decisionId.trim()) errors.push('decisionId is required.')
  if (!draft.title.trim() || !draft.problem.statement.trim() || !draft.audience.primary.trim() || !draft.proposedSolution.summary.trim()) errors.push('Title, problem, audience and solution are required.')
  if (!draft.monetization.hypothesis.trim()) warnings.push('Monetization hypothesis is missing.')
  if (!draft.evidenceSummary.summary.trim()) errors.push('Evidence summary is required.')
  if (draft.preliminaryAcceptanceCriteria.length === 0) errors.push('Preliminary acceptance criteria are required.')
  if (draft.scopeBoundaries.length === 0) errors.push('Scope boundaries are required.')
  if (draft.requiredReviews.length === 0) errors.push('Required reviews are required.')
  if (!independence || !independence.generatedProductMustBeIndependent || !independence.mustHaveOwnRoot || !independence.mustHaveOwnRepository || !independence.mustNotDependOnJefeRuntime || !independence.mustNotImportJefeModules || !independence.traceabilityOnly || !independence.requiresFactoryProjectContractBeforeCodex || !independence.requiresHumanApprovalBeforeCodex) errors.push('Complete product independence policy is mandatory.')
  if (draft.executionPolicy.codexExecutionAllowed !== false) errors.push('Codex execution must remain disabled.')
  if (draft.executionPolicy.projectCreationAllowed !== false) errors.push('Project creation must remain disabled.')
  if (draft.executionPolicy.repositoryCreationAllowed !== false) errors.push('Repository creation must remain disabled.')
  if (draft.executionPolicy.deployAllowed !== false) errors.push('Deploy must remain disabled.')
  if (!draft.recommendedNextStep.trim()) errors.push('recommendedNextStep is required.')
  if (hasSecret(draft)) errors.push('Draft appears to contain a secret value.')
  return { ok: errors.length === 0, errors, warnings }
}
