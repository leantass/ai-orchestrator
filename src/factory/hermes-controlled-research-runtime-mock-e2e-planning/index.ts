export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_PLANNING_KIND = 'factory-hermes-controlled-research-runtime-mock-e2e-planning'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_PLANNING_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeMockE2EPlanningVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_PLANNING_VERSION
export type FactoryHermesControlledResearchRuntimeMockE2EPlanningKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_PLANNING_KIND
export type FactoryHermesControlledResearchRuntimeMockE2EPlanningInput = Record<string, any>
export type FactoryHermesControlledResearchRuntimeMockE2EPlanningPolicy = Record<string, any>
export type FactoryHermesControlledResearchRuntimeMockE2EPlanningStatus = 'controlled_research_runtime_mock_e2e_plan_created' | 'controlled_research_runtime_mock_e2e_plan_blocked'
export type FactoryHermesControlledResearchRuntimeMockE2EPlanningDecision = 'factory_owned_mock_runtime_e2e_plan_created_for_approval' | 'factory_owned_mock_runtime_e2e_plan_blocked_no_safe_plan'
export type FactoryHermesAlternateSafeRuntimeVerificationAcceptanceForMockE2EPlan = Record<string, any>
export type FactoryHermesMockE2EScopePlan = Record<string, any>
export type FactoryHermesMockPromptArtifactPlan = Record<string, any>
export type FactoryHermesMockOutputContractPlan = Record<string, any>
export type FactoryHermesMockRuntimeInputPlan = Record<string, any>
export type FactoryHermesMockExecutionBoundaryPlan = Record<string, any>
export type FactoryHermesMockNoToolEvidencePlan = Record<string, any>
export type FactoryHermesMockOutputCaptureRedactionPlan = Record<string, any>
export type FactoryHermesMockOutputReviewPlan = Record<string, any>
export type FactoryHermesMockFindingsBlockPlan = Record<string, any>
export type FactoryHermesNestedSmokeEpermVerificationNote = Record<string, any>
export type FactoryHermesMockE2EPlanningRiskRegister = Record<string, any>
export type FactoryHermesMockE2EApprovalEnvelope = Record<string, any>
export type FactoryHermesMockE2EPlanningReceipt = Record<string, any>
export type FactoryHermesMockE2EPlanCandidate = Record<string, any>
export type FactoryHermesMockE2EPlanningBlockerPlan = Record<string, any>
export type FactoryHermesMockE2EPlanningCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesMockE2EPlanningBlocker = { blockerId: string, message: string }
export type FactoryHermesMockE2EPlanningWarning = { warningId: string, message: string }
export type FactoryHermesMockE2EPlanningResult = Record<string, any>
export type FactoryHermesMockE2EPlanningValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesMockE2EPlanningSummary = Record<string, any>

const selectedAlternateRuntimeStrategy = 'factory_owned_no_tool_model_provider_direct_research_adapter'
const selectedMockRuntimeStrategy = 'factory_owned_mock_only_research_runtime'
const safeFallbackStrategy = 'keep_hermes_research_blocked'
const installRef = '.codex-temp/external-tools/hermes-agent/install/75b300f'
const mockE2ERoot = `${installRef}/mock-e2e`

function add(checks: FactoryHermesMockE2EPlanningCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function risk(riskId: string, mitigation: string): Record<string, any> {
  return {
    riskId,
    severity: 'high',
    disposition: [
      'accepted_for_mock_e2e_planning_only',
      'blocks_mock_execution',
      'blocks_provider_runtime',
      'blocks_runtime_execution',
      'blocks_findings_use',
      'requires_future_gate_control',
    ],
    mitigation,
    blocksMockE2EPlanning: false,
    blocksMockE2EExecution: true,
    blocksProviderRuntime: true,
    blocksRuntimeExecution: true,
    blocksFindingsUse: true,
  }
}

export function evaluateFactoryHermesControlledResearchRuntimeMockE2EPlanning(input: FactoryHermesControlledResearchRuntimeMockE2EPlanningInput): FactoryHermesMockE2EPlanningResult {
  const verification = input.alternateSafeRuntimeVerificationResult
  const approval = input.verificationApprovalResult
  const implementation = input.implementationResult
  const selection = input.runtimeSelectionDecisionResult
  const checks: FactoryHermesMockE2EPlanningCheck[] = []
  const planningId = `hermes-controlled-research-runtime-mock-e2e-planning:75b300f:${input.plannedAt}`

  const required = [
    add(checks, 'verification_status', verification?.status, 'alternate_safe_runtime_verification_completed'),
    add(checks, 'verification_decision', verification?.decision, 'factory_owned_provider_direct_runtime_verified_for_mock_e2e_planning'),
    add(checks, 'verification_state', verification?.verificationStatus, 'verified_code_only_not_runtime_execution'),
    add(checks, 'verification_hermes_blocked', verification?.hermesCliRuntimeBlocked),
    ...['sharedContractsVerified', 'providerDirectAdapterVerified', 'mockRuntimeVerified', 'promptArtifactOutputContractVerified', 'credentialNetworkModelBoundaryVerified', 'noToolEnforcementVerified', 'timeoutKillSwitchVerified', 'outputCaptureReviewVerified', 'findingsGateDependencyVerified', 'staticSafetyScanPassed', 'smokeRegressionVerificationPassed', 'staleRegressionCompatibilityVerified', 'sharedContractsSmokePassed', 'providerDirectAdapterSmokePassed', 'mockRuntimeSmokePassed', 'implementationSmokePassed', 'canProceedToMockE2EPlanning'].map((key) => add(checks, `verification_${key}`, verification?.[key])),
    ...['providerDirectAdapterExecutesRuntime', 'mockRuntimeExecutesRuntime', 'providerDirectAdapterReadsCredentials', 'mockRuntimeReadsCredentials', 'providerDirectAdapterReadsEnv', 'mockRuntimeReadsEnv', 'providerDirectAdapterReadsProcessEnv', 'mockRuntimeReadsProcessEnv', 'providerDirectAdapterUsesNetwork', 'mockRuntimeUsesNetwork', 'providerDirectAdapterCallsModel', 'mockRuntimeCallsModel', 'providerDirectAdapterPassesPromptToProvider', 'mockRuntimePassesPromptToProvider', 'providerDirectAdapterEnablesTools', 'mockRuntimeEnablesTools', 'alternateRuntimeExecutedNow', 'mockRuntimeExecutedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'networkAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToProviderRuntimePlanning', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow'].map((key) => add(checks, `verification_${key}_false`, verification?.[key], false)),
    add(checks, 'approval_status', approval?.status, 'alternate_safe_runtime_verification_approval_granted'),
    add(checks, 'approval_decision', approval?.decision, 'factory_owned_provider_direct_runtime_verification_approved_for_verification_gate'),
    add(checks, 'approval_can_proceed_verification', approval?.canProceedToAlternateSafeRuntimeVerification),
    add(checks, 'approval_can_proceed_mock_planning_false', approval?.canProceedToMockE2EPlanning, false),
    add(checks, 'implementation_status', implementation?.status, 'alternate_safe_runtime_implementation_completed'),
    add(checks, 'runtime_selection_provider', selection?.selectedProvider?.providerId, 'openai'),
    add(checks, 'runtime_selection_model', selection?.selectedModel?.modelId, 'gpt-4o-mini'),
    add(checks, 'runtime_selection_credential_ref', selection?.selectedCredentialRef?.credentialRefName, 'OPENAI_API_KEY'),
    add(checks, 'runtime_selection_host', selection?.selectedNetworkHosts?.selectedHosts?.[0], 'api.openai.com'),
  ]

  const planCreated = required.every(Boolean)
  const status: FactoryHermesControlledResearchRuntimeMockE2EPlanningStatus = planCreated ? 'controlled_research_runtime_mock_e2e_plan_created' : 'controlled_research_runtime_mock_e2e_plan_blocked'
  const decision: FactoryHermesControlledResearchRuntimeMockE2EPlanningDecision = planCreated ? 'factory_owned_mock_runtime_e2e_plan_created_for_approval' : 'factory_owned_mock_runtime_e2e_plan_blocked_no_safe_plan'
  const blockers = planCreated ? [] : checks.filter((check) => !check.passed).map((check) => ({ blockerId: check.checkId, message: `Mock E2E planning blocked: ${check.checkId}` }))

  const alternateSafeRuntimeVerificationAcceptanceForMockE2EPlan: FactoryHermesAlternateSafeRuntimeVerificationAcceptanceForMockE2EPlan = {
    verificationResultPresent: Boolean(verification),
    verificationCompleted: planCreated,
    verificationStatus: verification?.verificationStatus,
    sharedContractsVerified: verification?.sharedContractsVerified === true,
    mockRuntimeVerified: verification?.mockRuntimeVerified === true,
    providerDirectAdapterVerified: verification?.providerDirectAdapterVerified === true,
    staticSafetyScanPassed: verification?.staticSafetyScanPassed === true,
    staleRegressionCompatibilityVerified: verification?.staleRegressionCompatibilityVerified === true,
    verificationSupportsMockE2EPlanning: planCreated,
    verificationDoesNotApproveMockExecutionNow: true,
    verificationDoesNotApproveProviderRuntimeNow: true,
    verificationDoesNotApproveFindingsNow: true,
    acceptedForMockE2EPlanning: planCreated,
    mockE2EPlanningRequired: true,
    mockExecutionStillBlocked: true,
    providerRuntimeStillBlocked: true,
    findingsStillBlocked: true,
  }

  const mockE2EScopePlan: FactoryHermesMockE2EScopePlan = {
    included: ['mock-only E2E path', 'verified mock adapter only', 'verified shared contracts', 'mock prompt artifact plan', 'mock output contract plan', 'mock runtime input plan', 'deterministic mock output plan', 'no-tool evidence plan', 'mock output capture/redaction plan', 'mock output review plan', 'mock findings blocked plan'],
    excluded: ['provider runtime', 'real research', 'credential reads', 'process.env reads', '.env', 'network/DNS', 'model calls', 'prompt to provider', 'output ingestion as findings', 'real findings', 'Hermes CLI', 'Hermes source mutation', 'package/UI changes'],
    mockE2EScopeSafeForApprovalReview: planCreated,
    planningOnly: true,
    mockE2EExecutionAllowedNow: false,
    providerRuntimeAllowedNow: false,
  }

  const mockPromptArtifactPlan: FactoryHermesMockPromptArtifactPlan = {
    proposedFutureArtifact: `${mockE2ERoot}/MOCK_PROMPT_ARTIFACT.json`,
    createArtifactNow: false,
    requiredFields: ['promptArtifactRef', 'promptHash', 'safeSummary', 'syntheticScenario', 'noSecrets', 'noToolRequests'],
    noSecrets: true,
    noToolRequests: true,
    noProviderInstructionsRequiringExternalTools: true,
    mockSpecificScenario: true,
    noRealCredentials: true,
    syntheticPersonalDataOnly: true,
    consumedOnlyByFutureMockRuntimeExecutionGate: true,
    promptSentToProviderNow: false,
  }

  const mockOutputContractPlan: FactoryHermesMockOutputContractPlan = {
    proposedFutureArtifact: `${mockE2ERoot}/MOCK_OUTPUT_CONTRACT.json`,
    createArtifactNow: false,
    schemaLikeContract: { required: ['mock', 'realResearch', 'summary', 'items', 'noToolEvidence'], boundedStrings: true, noSecrets: true, noToolMetadata: true },
    mock: true,
    realResearch: false,
    noClaimsOfRealProviderExecution: true,
    outputCannotBecomeFindings: true,
    invalidMockOutputBlocksMockReview: true,
  }

  const mockRuntimeInputPlan: FactoryHermesMockRuntimeInputPlan = {
    plannedInputs: ['mock prompt artifact ref', 'mock output contract ref', 'verified mock adapter ref', 'verified shared contracts ref', 'no-tool policy', 'timeout policy', 'output bounds', 'redaction policy'],
    findingsBlocked: true,
    failClosedIf: ['prompt artifact missing', 'output contract missing', 'no-tool policy invalid', 'timeout policy missing', 'redaction policy missing', 'provider/runtime/credential/network field present', 'tool declaration present'],
  }

  const mockExecutionBoundaryPlan: FactoryHermesMockExecutionBoundaryPlan = {
    allowedFutureExecution: ['execute mock adapter only', 'deterministic local mock output only'],
    forbiddenInFutureMockExecution: ['provider-direct runtime execution', 'real OpenAI call', 'credential read', 'network', 'DNS', 'Hermes CLI', 'real findings', 'package/UI changes'],
    noProviderRuntime: true,
    noCredentialAccess: true,
    noProcessEnv: true,
    noDotEnv: true,
    noNetwork: true,
    noDns: true,
    noModelCalls: true,
    noPromptToProvider: true,
    noTools: true,
    noOutputIngestionAsFindings: true,
    mockE2EExecutionAllowedNow: false,
    futureMockExecutionRequiresApproval: true,
    providerRuntimeStillBlocked: true,
  }

  const mockNoToolEvidencePlan: FactoryHermesMockNoToolEvidencePlan = {
    noToolPolicy: { browser: false, file: false, shell: false, mcp: false, functions: false, providerTools: false },
    mockAdapterEmitsNoToolEvidence: true,
    outputContractForbidsToolMetadata: true,
    mockOutputIncludesNoToolCalls: true,
    toolUseClaimBlocksMockReview: true,
    toolMetadataBlocksMockReview: true,
    noMcp: true,
    noFunctionToolDeclarations: true,
    noBrowserFileShellTools: true,
  }

  const mockOutputCaptureRedactionPlan: FactoryHermesMockOutputCaptureRedactionPlan = {
    futureArtifactRoot: `${mockE2ERoot}/`,
    potentialFutureArtifacts: ['MOCK_E2E_INPUT.json', 'MOCK_E2E_OUTPUT_RAW.json', 'MOCK_E2E_OUTPUT_REDACTED.json', 'MOCK_E2E_AUDIT.json', 'MOCK_E2E_REVIEW_CANDIDATE.json'].map((name) => `${mockE2ERoot}/${name}`),
    createArtifactsNow: false,
    rawOutputNotFindings: true,
    redactedOutputNotFindings: true,
    outputBounded: true,
    secretScanRequired: true,
    schemaValidationRequired: true,
    deterministicAuditRequired: true,
    noProviderData: true,
  }

  const mockOutputReviewPlan: FactoryHermesMockOutputReviewPlan = {
    futureGate: 'Factory Hermes Controlled Research Runtime Mock E2E Review Gate v1',
    reviewItems: ['mock input', 'mock output', 'no-tool evidence', 'redaction', 'schema validation', 'deterministic behavior', 'mock is not real research'],
    decideIfProviderRuntimePlanningMayProceed: true,
    keepFindingsBlocked: true,
    mockReviewRequiredBeforeProviderRuntimePlanning: true,
    findingsStillBlockedAfterMockReviewUnlessFutureExplicitGate: true,
  }

  const mockFindingsBlockPlan: FactoryHermesMockFindingsBlockPlan = {
    mockOutputCannotBeFindings: true,
    mockReviewOutputCannotBeRealFindings: true,
    noAutomaticIngestion: true,
    outputIngestionApprovedNow: false,
    findingsApprovedNow: false,
    providerRuntimeStillRequiresFutureGates: true,
    realFindingsOnlyAfterProviderRuntimeExecutionReviewOutputIngestionReviewAndFindingsReview: true,
  }

  const nestedSmokeEpermVerificationNote: FactoryHermesNestedSmokeEpermVerificationNote = {
    nestedSmokeEpermObservedInPreviousVerification: true,
    externalAllowedSmokesPassed: true,
    acceptedForMockE2EPlanning: planCreated,
    doesNotGrantRuntimePermission: true,
    doesNotGrantProviderRuntime: true,
    doesNotGrantFindings: true,
    futureLongRunningRegressionShouldAddressSandboxPermissions: true,
  }

  const mockE2EPlanningRiskRegister: FactoryHermesMockE2EPlanningRiskRegister = {
    risks: [
      risk('mock_e2e_planning_confused_with_mock_execution', 'Keep this gate planning-only and require a future mock execution approval gate.'),
      risk('mock_execution_confused_with_real_research', 'Require mock:true and realResearch:false in future output contract.'),
      risk('mock_output_promoted_to_findings', 'Block all findings use until future explicit findings gates.'),
      risk('mock_prompt_contains_secret', 'Require future prompt artifact secret scan and synthetic-only content.'),
      risk('mock_output_contract_missing', 'Fail closed before mock execution if contract artifact is absent.'),
      risk('no_tool_evidence_overclaimed', 'Require no-tool evidence review before provider planning.'),
      risk('provider_runtime_enabled_too_early', 'Keep provider runtime planning and execution false in this gate.'),
      risk('credential_access_added_to_mock', 'Fail closed on any credential field or credential read.'),
      risk('network_call_added_to_mock', 'Fail closed on any network or DNS field.'),
      risk('process_env_read_added_to_mock', 'Fail closed on any process.env read.'),
      risk('stale_regression_ignored_before_release', 'Carry stale regression compatibility into future release controls.'),
      risk('nested_smoke_eperm_overlooked', 'Record EPERM note without converting it into runtime permission.'),
      risk('Hermes_cli_unblocked_accidentally', 'Keep Hermes CLI blocked in every envelope flag.'),
      risk('package_or_ui_mutation_sneaks_in', 'Restrict future gates away from package files and UI/preload/App.'),
    ],
  }

  const mockE2EApprovalEnvelope: FactoryHermesMockE2EApprovalEnvelope | undefined = planCreated ? {
    envelopeId: `${planningId}:mock-e2e-approval-envelope`,
    toolId: 'factory_controlled_research_runtime',
    approvedFor: 'controlled_research_runtime_mock_e2e_approval_only',
    selectedMockRuntimeStrategy,
    selectedAlternateRuntimeStrategy,
    safeFallbackStrategy,
    sourceMockE2EPlanningRef: 'controlled-research-runtime-mock-e2e-planning-result.json',
    sourceVerificationRef: 'controlled-research-runtime-alternate-safe-runtime-verification-result.json',
    targetNextGate: 'Factory Hermes Controlled Research Runtime Mock E2E Approval Gate v1',
    purpose: 'approve or block mock-only E2E execution planning using verified mock runtime/contracts, without provider runtime, credentials, network, output ingestion or findings',
    allowedInNextGate: ['read mock E2E planning result', 'read verification result', 'review mock scope', 'review mock prompt artifact plan', 'review mock output contract plan', 'review mock execution boundary', 'review no-tool evidence plan', 'review mock output review plan', 'decide whether mock E2E execution gate may proceed', 'write ignored approval artifact'],
    forbiddenEvenInNextGate: ['execute mock E2E', 'execute provider runtime', 'execute research real', 'call model', 'use network', 'resolve DNS', 'read credentials', 'read .env', 'read process.env', 'pass prompt to provider', 'enable tools', 'ingest output', 'promote findings', 'unblock Hermes CLI', 'execute Hermes', 'mutate package files', 'modify UI/preload/App', 'run uv/pip/python/setup.py'],
    flags: { mockE2EApprovalAllowedNow: true, mockE2EExecutionAllowedNow: false, providerRuntimePlanningAllowedNow: false, providerRuntimeAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, networkAllowedNow: false, modelCallsAllowedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToMockE2EApproval: true, canProceedToMockE2EExecution: false, canProceedToProviderRuntimePlanning: false, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false },
    recommendedNextGate: 'Factory Hermes Controlled Research Runtime Mock E2E Approval Gate v1',
  } : undefined

  const mockE2EPlanningReceipt: FactoryHermesMockE2EPlanningReceipt = {
    mockE2EPlanningOnly: true,
    mockE2EExecuted: false,
    runtimeExecuted: false,
    providerRuntimeExecuted: false,
    researchExecuted: false,
    hermesExecuted: false,
    promptSent: false,
    modelCalls: false,
    networkUsed: false,
    dnsResolved: false,
    endpointsTested: false,
    envSecretsRead: false,
    processEnvRead: false,
    dotEnvRead: false,
    credentialValuesRead: false,
    toolsetsEnabled: false,
    outputIngestion: false,
    findingsPromoted: false,
    uvPipPythonSetupExecuted: false,
    packageFilesMutated: false,
  }

  const factoryControlledResearchRuntimeMockE2EPlanCandidate: FactoryHermesMockE2EPlanCandidate = {
    candidateId: `${planningId}:candidate`,
    planningOnly: true,
    selectedMockRuntimeStrategy: planCreated ? selectedMockRuntimeStrategy : safeFallbackStrategy,
    requiredFutureArtifacts: [`${mockE2ERoot}/MOCK_PROMPT_ARTIFACT.json`, `${mockE2ERoot}/MOCK_OUTPUT_CONTRACT.json`],
    futureExecutionGateRequired: true,
    futureReviewGateRequired: true,
    findingsBlocked: true,
  }

  return {
    planningId,
    planningKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_PLANNING_KIND,
    planningVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_PLANNING_VERSION,
    plannedAt: input.plannedAt,
    plannedBy: input.plannedBy,
    toolId: 'factory_controlled_research_runtime',
    verificationRef: 'controlled-research-runtime-alternate-safe-runtime-verification-result.json',
    verificationApprovalRef: 'controlled-research-runtime-alternate-safe-runtime-verification-approval-result.json',
    implementationRef: 'controlled-research-runtime-alternate-safe-runtime-implementation-result.json',
    runtimeSelectionDecisionRef: 'runtime-selection-decision-result.json',
    hermesCliRuntimeBlocked: true,
    selectedAlternateRuntimeStrategy,
    selectedMockRuntimeStrategy: planCreated ? selectedMockRuntimeStrategy : safeFallbackStrategy,
    safeFallbackStrategy,
    alternateSafeRuntimeVerificationAcceptanceForMockE2EPlan,
    mockE2EScopePlan,
    mockPromptArtifactPlan,
    mockOutputContractPlan,
    mockRuntimeInputPlan,
    mockExecutionBoundaryPlan,
    mockNoToolEvidencePlan,
    mockOutputCaptureRedactionPlan,
    mockOutputReviewPlan,
    mockFindingsBlockPlan,
    nestedSmokeEpermVerificationNote,
    mockE2EPlanningRiskRegister,
    mockE2EApprovalEnvelope,
    mockE2EPlanningReceipt,
    factoryControlledResearchRuntimeMockE2EPlanCandidate,
    mockE2EPlanningBlockerPlan: planCreated ? undefined : { blockers, safeFallbackStrategy },
    checks,
    blockers,
    warnings: [],
    status,
    decision,
    mockE2EPlanningStatus: planCreated ? 'plan_candidate_created' : 'blocked',
    alternateSafeRuntimeVerificationAcceptedForMockE2EPlanning: planCreated,
    sharedContractsAvailableForMockE2E: planCreated,
    mockRuntimeAvailableForMockE2E: planCreated,
    providerDirectAdapterAvailableButNotExecutable: planCreated,
    mockE2EScopePlanBuilt: planCreated,
    mockPromptArtifactPlanBuilt: planCreated,
    mockOutputContractPlanBuilt: planCreated,
    mockRuntimeInputPlanBuilt: planCreated,
    mockExecutionBoundaryPlanBuilt: planCreated,
    mockNoToolEvidencePlanBuilt: planCreated,
    mockOutputCaptureRedactionPlanBuilt: planCreated,
    mockOutputReviewPlanBuilt: planCreated,
    mockFindingsBlockPlanBuilt: planCreated,
    nestedSmokeEpermVerificationNoteBuilt: planCreated,
    mockE2EApprovalEnvelopeBuilt: planCreated,
    mockE2EExecutedNow: false,
    providerRuntimeExecutedNow: false,
    controlledRuntimeExecutionAllowedNow: false,
    providerRuntimePlanningAllowedNow: false,
    credentialAccessAllowedNow: false,
    promptPassingAllowedNow: false,
    modelCallsAllowedNow: false,
    networkAllowedNow: false,
    outputIngestionApprovedNow: false,
    findingsUseApprovedNow: false,
    canProceedToMockE2EApproval: planCreated,
    canProceedToMockE2EExecution: false,
    canProceedToProviderRuntimePlanning: false,
    canProceedToControlledResearchRuntimeExecution: false,
    canProceedToKeepHermesResearchBlockedDecision: true,
    canRunResearchNow: false,
    canExecuteHermesNow: false,
    canPassPromptNow: false,
    canUseNetworkNow: false,
    canUseCredentialsNow: false,
    canReadEnvSecretsNow: false,
    canReadProcessEnvNow: false,
    canCallModelsNow: false,
    canEnableToolsetsNow: false,
    canMutateFilesystemNow: false,
    canUseFindings: false,
    recommendedNextStep: planCreated ? 'Proceed to Factory Hermes Controlled Research Runtime Mock E2E Approval Gate v1.' : 'Keep Hermes research blocked; mock E2E planning blocked.',
  }
}

export function serializeFactoryHermesControlledResearchRuntimeMockE2EPlanningResult(result: FactoryHermesMockE2EPlanningResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeMockE2EPlanningResult(text: string): FactoryHermesMockE2EPlanningResult { return JSON.parse(text) }
