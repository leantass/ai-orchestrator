export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_REVIEW_KIND = 'factory-hermes-controlled-research-runtime-mock-e2e-review'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_REVIEW_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeMockE2EReviewVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_REVIEW_VERSION
export type FactoryHermesControlledResearchRuntimeMockE2EReviewKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_REVIEW_KIND
export type FactoryHermesControlledResearchRuntimeMockE2EReviewInput = Record<string, any>
export type FactoryHermesControlledResearchRuntimeMockE2EReviewPolicy = Record<string, any>
export type FactoryHermesControlledResearchRuntimeMockE2EReviewStatus = 'controlled_research_runtime_mock_e2e_review_completed' | 'controlled_research_runtime_mock_e2e_review_blocked'
export type FactoryHermesControlledResearchRuntimeMockE2EReviewDecision = 'factory_owned_mock_runtime_e2e_review_accepted_for_provider_runtime_planning' | 'factory_owned_mock_runtime_e2e_review_blocked_artifacts_invalid_or_unsafe'
export type FactoryHermesMockE2EExecutionResultReview = Record<string, any>
export type FactoryHermesMockPromptArtifactReview = Record<string, any>
export type FactoryHermesMockOutputContractReview = Record<string, any>
export type FactoryHermesMockE2EInputReview = Record<string, any>
export type FactoryHermesMockRawOutputReview = Record<string, any>
export type FactoryHermesMockRedactedOutputReview = Record<string, any>
export type FactoryHermesMockAuditReview = Record<string, any>
export type FactoryHermesMockReviewCandidateReview = Record<string, any>
export type FactoryHermesMockNoToolEvidenceReview = Record<string, any>
export type FactoryHermesMockFindingsBlockReview = Record<string, any>
export type FactoryHermesMockSafetyManifestReview = Record<string, any>
export type FactoryHermesMockE2EReviewLimitationsCarryForward = Record<string, any>
export type FactoryHermesMockE2EReviewRiskDispositionRegister = Record<string, any>
export type FactoryHermesProviderRuntimePlanningEnvelope = Record<string, any>
export type FactoryHermesMockE2EReviewReceipt = Record<string, any>
export type FactoryHermesMockE2EReviewDecisionRecord = Record<string, any>
export type FactoryHermesMockE2EReviewBlockerPlan = Record<string, any>
export type FactoryHermesMockE2EReviewCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesMockE2EReviewBlocker = { blockerId: string, message: string }
export type FactoryHermesMockE2EReviewWarning = { warningId: string, message: string }
export type FactoryHermesMockE2EReviewResult = Record<string, any>
export type FactoryHermesMockE2EReviewValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesMockE2EReviewSummary = Record<string, any>

const selectedMockRuntimeStrategy = 'factory_owned_mock_only_research_runtime'
const selectedAlternateRuntimeStrategy = 'factory_owned_no_tool_model_provider_direct_research_adapter'
const safeFallbackStrategy = 'keep_hermes_research_blocked'

function add(checks: FactoryHermesMockE2EReviewCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function risk(riskId: string): Record<string, any> {
  return { riskId, severity: 'high', disposition: ['accepted_for_provider_runtime_planning_only', 'blocks_provider_runtime_execution', 'blocks_runtime_execution', 'blocks_findings_use', 'requires_future_gate_control'], mitigation: `Future gate control required for ${riskId}.`, blocksMockReview: false, blocksProviderRuntimePlanning: false, blocksProviderRuntimeExecution: true, blocksRuntimeExecution: true, blocksFindingsUse: true }
}

export function evaluateFactoryHermesControlledResearchRuntimeMockE2EReview(input: FactoryHermesControlledResearchRuntimeMockE2EReviewInput): FactoryHermesMockE2EReviewResult {
  const execution = input.mockE2EExecutionResult
  const artifacts = input.artifacts || {}
  const safety = execution?.mockE2EExecutionSafetyManifest || {}
  const checks: FactoryHermesMockE2EReviewCheck[] = []
  const reviewId = `hermes-controlled-research-runtime-mock-e2e-review:75b300f:${input.reviewedAt}`
  const required = [
    add(checks, 'execution_status', execution?.status, 'controlled_research_runtime_mock_e2e_execution_completed'),
    add(checks, 'execution_decision', execution?.decision, 'factory_owned_mock_runtime_e2e_executed_for_review'),
    add(checks, 'execution_state', execution?.mockE2EExecutionStatus, 'mock_executed_not_real_research'),
    ...['mockPromptArtifactCreated', 'mockOutputContractCreated', 'mockE2EInputCreated', 'mockRuntimeExecuted', 'mockRawOutputCreated', 'mockRedactedOutputCreated', 'mockAuditCreated', 'mockReviewCandidateCreated', 'mockOutputSchemaValid', 'mockOutputRedacted', 'mockNoToolEvidencePresent', 'mockE2EExecutedNow', 'canProceedToMockE2EReview'].map((key) => add(checks, `execution_${key}`, execution?.[key])),
    ...['mockOutputIsRealResearch', 'realResearchExecuted', 'providerRuntimeExecutedNow', 'controlledRuntimeExecutionAllowedNow', 'providerRuntimePlanningAllowedNow', 'credentialAccessAllowedNow', 'promptPassingToProviderAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToProviderRuntimePlanning', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow'].map((key) => add(checks, `execution_${key}_false`, execution?.[key], false)),
    add(checks, 'prompt_kind', artifacts.prompt?.artifactKind, 'mock_prompt_artifact'),
    add(checks, 'prompt_hash', Boolean(artifacts.prompt?.promptHash)),
    add(checks, 'prompt_safe_summary', Boolean(artifacts.prompt?.safeSummary)),
    add(checks, 'prompt_body', Boolean(artifacts.prompt?.promptBody)),
    add(checks, 'prompt_no_secrets', artifacts.prompt?.containsSecrets, false),
    add(checks, 'prompt_no_tools', artifacts.prompt?.requestsTools, false),
    add(checks, 'prompt_synthetic', artifacts.prompt?.syntheticDataOnly),
    add(checks, 'prompt_not_provider', artifacts.prompt?.providerPrompt, false),
    add(checks, 'contract_kind', artifacts.contract?.artifactKind, 'mock_output_contract'),
    add(checks, 'contract_schema', Boolean(artifacts.contract?.schema)),
    add(checks, 'contract_bounded', artifacts.contract?.boundedOutput),
    add(checks, 'input_kind', artifacts.input?.artifactKind, 'mock_e2e_input'),
    add(checks, 'input_findings_blocked', artifacts.input?.findingsBlocked),
    add(checks, 'input_provider_false', artifacts.input?.providerRuntimeAllowed, false),
    add(checks, 'input_credentials_false', artifacts.input?.credentialAccessAllowed, false),
    add(checks, 'input_network_false', artifacts.input?.networkAllowed, false),
    add(checks, 'input_env_false', artifacts.input?.processEnvReadAllowed, false),
    add(checks, 'raw_mock', artifacts.raw?.mock),
    add(checks, 'raw_real_research_false', artifacts.raw?.realResearch, false),
    add(checks, 'raw_findings_false', artifacts.raw?.findingsUseApprovedNow, false),
    add(checks, 'redacted_redacted', artifacts.redacted?.redacted),
    add(checks, 'redacted_no_secrets', artifacts.redacted?.containsSecrets, false),
    add(checks, 'audit_kind', artifacts.audit?.artifactKind, 'mock_e2e_audit'),
    add(checks, 'audit_provider_false', artifacts.audit?.providerRuntimeExecuted, false),
    add(checks, 'audit_network_false', artifacts.audit?.networkUsed, false),
    add(checks, 'review_candidate_recommendation', artifacts.reviewCandidate?.recommendation, 'ready_for_mock_e2e_review'),
    add(checks, 'review_candidate_not_real', artifacts.reviewCandidate?.mockOutputIsRealResearch, false),
    add(checks, 'review_candidate_findings_false', artifacts.reviewCandidate?.findingsUseApprovedNow, false),
    add(checks, 'safety_hermes_blocked', safety.hermesCliRuntimeBlocked),
    add(checks, 'safety_provider_false', safety.providerRuntimeExecutedNow, false),
    add(checks, 'safety_network_false', safety.networkUsed, false),
    add(checks, 'safety_findings_false', safety.findingsPromoted, false),
  ]
  const completed = required.every(Boolean)
  const status: FactoryHermesControlledResearchRuntimeMockE2EReviewStatus = completed ? 'controlled_research_runtime_mock_e2e_review_completed' : 'controlled_research_runtime_mock_e2e_review_blocked'
  const decision: FactoryHermesControlledResearchRuntimeMockE2EReviewDecision = completed ? 'factory_owned_mock_runtime_e2e_review_accepted_for_provider_runtime_planning' : 'factory_owned_mock_runtime_e2e_review_blocked_artifacts_invalid_or_unsafe'
  const blockers = completed ? [] : checks.filter((check) => !check.passed).map((check) => ({ blockerId: check.checkId, message: `Mock E2E review blocked: ${check.checkId}` }))
  const accepted = completed
  const providerRuntimePlanningEnvelope = accepted ? { envelopeId: `${reviewId}:provider-runtime-planning-envelope`, toolId: 'factory_controlled_research_runtime', approvedFor: 'controlled_research_runtime_provider_runtime_planning_only', selectedAlternateRuntimeStrategy, selectedMockRuntimeStrategy, sourceMockE2EReviewRef: 'controlled-research-runtime-mock-e2e-review-result.json', sourceMockE2EExecutionRef: 'controlled-research-runtime-mock-e2e-execution-result.json', sourceVerificationRef: 'controlled-research-runtime-alternate-safe-runtime-verification-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Provider Runtime Planning Gate v1', purpose: 'plan a future provider-direct runtime path after mock E2E succeeded, while keeping provider execution, credentials, network, output ingestion and findings blocked', allowedInNextGate: ['read mock E2E review result', 'read mock E2E execution result', 'read verification result', 'plan provider runtime prompt artifact', 'plan provider runtime output contract', 'plan credential access boundary', 'plan network/model boundary', 'plan provider execution approval chain', 'plan output ingestion/review chain', 'write ignored planning artifact'], forbiddenEvenInNextGate: ['execute provider runtime', 'call model', 'use network', 'resolve DNS', 'read credentials', 'read .env', 'read process.env', 'pass prompt to provider', 'enable tools', 'ingest output as findings', 'promote findings', 'unblock Hermes CLI', 'execute Hermes', 'mutate package files', 'modify UI/preload/App', 'run uv/pip/python/setup.py'], flags: { providerRuntimePlanningAllowedNow: true, providerRuntimeExecutionAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, networkAllowedNow: false, modelCallsAllowedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToProviderRuntimePlanning: true, canProceedToProviderRuntimeExecution: false, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Provider Runtime Planning Gate v1' } : undefined
  const review = (acceptedKey: string, extra: Record<string, any> = {}) => ({ accepted, [acceptedKey]: accepted, ...extra })
  return { reviewId, reviewKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_REVIEW_KIND, reviewVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_REVIEW_VERSION, reviewedAt: input.reviewedAt, reviewedBy: input.reviewedBy, toolId: 'factory_controlled_research_runtime', mockE2EExecutionRef: 'controlled-research-runtime-mock-e2e-execution-result.json', mockE2EApprovalRef: 'controlled-research-runtime-mock-e2e-approval-result.json', mockE2EPlanningRef: 'controlled-research-runtime-mock-e2e-planning-result.json', verificationRef: 'controlled-research-runtime-alternate-safe-runtime-verification-result.json', implementationRef: 'controlled-research-runtime-alternate-safe-runtime-implementation-result.json', runtimeSelectionDecisionRef: 'runtime-selection-decision-result.json', hermesCliRuntimeBlocked: true, selectedMockRuntimeStrategy, selectedAlternateRuntimeStrategy, safeFallbackStrategy, mockE2EExecutionResultReview: review('mockE2EExecutionAccepted', { executionResultPresent: Boolean(execution), executionCompleted: accepted, executionStatus: execution?.mockE2EExecutionStatus, providerRuntimePlanningMayBeConsidered: accepted, providerRuntimeExecutionStillBlocked: true, findingsStillBlocked: true }), mockPromptArtifactReview: review('mockPromptArtifactAccepted'), mockOutputContractReview: review('mockOutputContractAccepted'), mockE2EInputReview: review('mockE2EInputAccepted'), mockRawOutputReview: review('mockRawOutputAccepted'), mockRedactedOutputReview: review('mockRedactedOutputAccepted'), mockAuditReview: review('mockAuditAccepted'), mockReviewCandidateReview: review('mockReviewCandidateAccepted'), mockNoToolEvidenceReview: review('mockNoToolEvidenceAccepted', { noToolEvidencePresent: accepted }), mockFindingsBlockReview: review('mockFindingsBlockAccepted', { mockOutputCanBeFindings: false }), mockSafetyManifestReview: review('mockSafetyManifestAccepted'), mockE2EReviewLimitationsCarryForward: { limitations: ['mock_e2e_review_is_not_provider_runtime', 'mock_output_is_not_real_research', 'mock_output_is_not_findings', 'provider_runtime_not_planned_yet', 'provider_runtime_not_approved', 'provider_runtime_not_executed', 'credentials_still_blocked', 'network_model_prompt_still_blocked', 'output_ingestion_still_blocked', 'findings_still_blocked', 'provider_runtime_planning_required_before_any_real_runtime', 'provider_runtime_approval_required_before_any_provider_call', 'output_ingestion_and_findings_review_required_before_findings'], limitationsAcceptableForProviderRuntimePlanning: accepted, limitationsBlockProviderRuntimeExecution: true, limitationsBlockRuntimeExecution: true, limitationsBlockFindingsUse: true }, mockE2EReviewRiskDispositionRegister: { risks: ['mock_review_confused_with_provider_runtime', 'mock_output_confused_with_real_research', 'mock_output_promoted_to_findings', 'provider_runtime_planning_confused_with_provider_execution', 'credentials_enabled_after_mock_review', 'network_enabled_after_mock_review', 'model_call_enabled_after_mock_review', 'prompt_sent_to_provider_after_mock_review', 'tool_evidence_overclaimed', 'output_ingestion_enabled_too_early', 'findings_review_skipped', 'Hermes_cli_unblocked_accidentally', 'package_or_ui_mutation_sneaks_in', 'git_add_dot_used'].map(risk) }, providerRuntimePlanningEnvelope, mockE2EReviewReceipt: { mockE2EReviewed: accepted, mockReExecuted: false, providerRuntimeExecuted: false, realResearchExecuted: false, hermesExecuted: false, promptSentToProvider: false, modelCalls: false, networkUsed: false, dnsResolved: false, endpointsTested: false, envSecretsRead: false, processEnvRead: false, dotEnvRead: false, credentialValuesRead: false, toolsetsEnabled: false, outputIngestion: false, findingsPromoted: false, uvPipPythonSetupExecuted: false }, factoryControlledResearchRuntimeMockE2EReviewDecision: { status, decision, completed }, mockE2EReviewBlockerPlan: completed ? undefined : { blockers, safeFallbackStrategy }, checks, blockers, warnings: [], status, decision, mockE2EReviewStatus: completed ? 'accepted_mock_only' : 'blocked', mockE2EExecutionAccepted: accepted, mockPromptArtifactAccepted: accepted, mockOutputContractAccepted: accepted, mockE2EInputAccepted: accepted, mockRawOutputAccepted: accepted, mockRedactedOutputAccepted: accepted, mockAuditAccepted: accepted, mockReviewCandidateAccepted: accepted, mockNoToolEvidenceAccepted: accepted, mockFindingsBlockAccepted: accepted, mockSafetyManifestAccepted: accepted, mockOutputIsRealResearch: false, mockOutputCanBeFindings: false, providerRuntimePlanningAllowedNow: accepted, providerRuntimeExecutionAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingToProviderAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToProviderRuntimePlanning: accepted, canProceedToProviderRuntimeExecution: false, canProceedToControlledResearchRuntimeExecution: false, canProceedToKeepHermesResearchBlockedDecision: true, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canPassPromptToProviderNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canReadProcessEnvNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: accepted ? 'Proceed to Factory Hermes Controlled Research Runtime Provider Runtime Planning Gate v1.' : 'Keep Hermes research blocked; mock E2E review blocked.' }
}

export function serializeFactoryHermesControlledResearchRuntimeMockE2EReviewResult(result: FactoryHermesMockE2EReviewResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeMockE2EReviewResult(text: string): FactoryHermesMockE2EReviewResult { return JSON.parse(text) }
