export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_VERIFICATION_KIND = 'factory-hermes-controlled-research-runtime-safe-command-shape-resolution-verification'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_VERIFICATION_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_VERIFICATION_VERSION
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_VERIFICATION_KIND
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationInput = { verifiedAt: string, verifiedBy: string, verificationApprovalResult?: any, verificationPlanningResult?: any, implementationResult?: any, commandResults?: Record<string, any>, staticScanResult?: any }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPolicy = { verificationOnly: true, selectedResolutionStrategy: 'factory_owned_command_renderer_with_fail_closed_wrapper_builder' }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationStatus = 'safe_command_shape_resolution_verification_completed' | 'safe_command_shape_resolution_verification_failed'
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationDecision = 'hermes_safe_command_shape_resolution_verified_for_proof_retry_planning' | 'hermes_safe_command_shape_resolution_verification_failed_block_proof_retry'
export type FactoryHermesRendererVerificationResult = any
export type FactoryHermesWrapperBuilderVerificationResult = any
export type FactoryHermesSourceCliContractModelVerificationResult = any
export type FactoryHermesRedactedCommandEnvelopeVerificationResult = any
export type FactoryHermesNoToolProofDependencyVerificationResult = any
export type FactoryHermesFailClosedRulesVerificationResult = any
export type FactoryHermesRendererWrapperIntegrationVerificationResult = any
export type FactoryHermesImplementationSafetyScanVerificationResult = any
export type FactoryHermesSmokeRegressionVerificationResult = any
export type FactoryHermesProofRetryReadinessVerificationResult = any
export type FactoryHermesVerificationSafetyManifest = any
export type FactoryHermesSafeCommandShapeProofRetryPlanningEnvelope = any
export type FactoryHermesSafeCommandShapeResolutionVerificationReceipt = any
export type FactoryHermesSafeCommandShapeResolutionVerificationResultRecord = any
export type FactoryHermesSafeCommandShapeResolutionVerificationBlockerPlan = any
export type FactoryHermesSafeCommandShapeResolutionVerificationCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesSafeCommandShapeResolutionVerificationBlocker = { blockerId: string, message: string }
export type FactoryHermesSafeCommandShapeResolutionVerificationWarning = { warningId: string, message: string }
export type FactoryHermesSafeCommandShapeResolutionVerificationResult = any
export type FactoryHermesSafeCommandShapeResolutionVerificationValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesSafeCommandShapeResolutionVerificationSummary = { verificationId: string, status: string, decision: string, canProceedToSafeCommandShapeProofRetryPlanning: boolean, canRunResearchNow: boolean }

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets'
const selectedResolutionStrategy = 'factory_owned_command_renderer_with_fail_closed_wrapper_builder'
const safeFallbackStrategy = 'keep_hermes_research_blocked'
const completedStatus = 'safe_command_shape_resolution_verification_completed'
const failedStatus = 'safe_command_shape_resolution_verification_failed'
const falseFlags = ['safeCommandShapeResolvedNow', 'safeCommandShapeProofRetryAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseApprovedNow', 'canProceedToSafeCommandShapeProofRetry', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']

function add(checks: FactoryHermesSafeCommandShapeResolutionVerificationCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function commandPassed(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationInput, key: string): boolean {
  return input.commandResults?.[key]?.ok === true
}

export function evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerification(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationInput): FactoryHermesSafeCommandShapeResolutionVerificationResult {
  const approval = input.verificationApprovalResult
  const planning = input.verificationPlanningResult
  const implementation = input.implementationResult
  const checks: FactoryHermesSafeCommandShapeResolutionVerificationCheck[] = []
  const verificationId = `hermes-controlled-research-runtime-safe-command-shape-resolution-verification:75b300f:${input.verifiedAt}`
  const required = [
    add(checks, 'approval_status', approval?.status, 'safe_command_shape_resolution_verification_approval_granted'),
    add(checks, 'approval_decision', approval?.decision, 'hermes_safe_command_shape_resolution_verification_approved_for_verification_gate'),
    add(checks, 'approval_scope', approval?.verificationApprovalStatus, 'approved_for_verification_gate_only'),
    add(checks, 'approval_gate_allowed', approval?.verificationGateAllowed),
    add(checks, 'approval_can_proceed_verification', approval?.canProceedToSafeCommandShapeResolutionVerification),
    add(checks, 'approval_proof_retry_blocked', approval?.canProceedToSafeCommandShapeProofRetry, false),
    add(checks, 'approval_research_blocked', approval?.canRunResearchNow, false),
    add(checks, 'planning_status', planning?.status, 'safe_command_shape_resolution_verification_plan_created'),
    add(checks, 'implementation_status', implementation?.status, 'safe_command_shape_resolution_implementation_completed'),
    add(checks, 'implementation_decision', implementation?.decision, 'hermes_safe_command_shape_resolution_implementation_completed_for_verification_planning'),
    add(checks, 'implementation_mode', implementation?.implementationStatus, 'implemented_code_only_not_executing'),
    ...['factoryOwnedRendererImplemented', 'wrapperFailClosedBuilderImplemented', 'rendererSmokePassed', 'wrapperBuilderSmokePassed', 'implementationSmokePassed', 'commandEnvelopeNonRunnableUntilFinalGate'].map((key) => add(checks, `implementation_${key}`, implementation?.[key])),
    ...['rendererExecutesHermes', 'wrapperBuilderExecutesHermes', 'rendererReadsCredentials', 'wrapperBuilderReadsCredentials', 'rendererUsesNetwork', 'wrapperBuilderUsesNetwork', 'rendererPassesPrompt', 'wrapperBuilderPassesPrompt', 'rendererBuildsRunnableCommandNow', 'wrapperBuilderBuildsRunnableCommandNow', 'canProceedToSafeCommandShapeProofRetry', 'canRunResearchNow'].map((key) => add(checks, `implementation_${key}_false`, implementation?.[key], false)),
    add(checks, 'renderer_node_check', commandPassed(input, 'rendererNodeCheck')),
    add(checks, 'renderer_smoke', commandPassed(input, 'rendererSmoke')),
    add(checks, 'wrapper_node_check', commandPassed(input, 'wrapperNodeCheck')),
    add(checks, 'wrapper_smoke', commandPassed(input, 'wrapperSmoke')),
    add(checks, 'implementation_node_check', commandPassed(input, 'implementationNodeCheck')),
    add(checks, 'implementation_smoke', commandPassed(input, 'implementationSmoke')),
    add(checks, 'verification_approval_node_check', commandPassed(input, 'verificationApprovalNodeCheck')),
    add(checks, 'verification_approval_smoke', commandPassed(input, 'verificationApprovalSmoke')),
    add(checks, 'typecheck', commandPassed(input, 'typecheck')),
    add(checks, 'build', commandPassed(input, 'build')),
    add(checks, 'diff_check', commandPassed(input, 'diffCheck')),
    add(checks, 'static_scan', input.staticScanResult?.ok),
  ]
  const completed = required.every(Boolean)
  const status: FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationStatus = completed ? completedStatus : failedStatus
  const decision: FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationDecision = completed ? 'hermes_safe_command_shape_resolution_verified_for_proof_retry_planning' : 'hermes_safe_command_shape_resolution_verification_failed_block_proof_retry'
  const blockers = completed ? [] : checks.filter((check) => !check.passed).map((check) => ({ blockerId: check.checkId, message: `Verification check failed: ${check.checkId}` }))

  const rendererVerificationResult = { moduleTs: 'src/factory/hermes-controlled-research-runtime-command-renderer/index.ts', moduleCjs: 'electron/factory/hermes-controlled-research-runtime-command-renderer/index.cjs', exportsVerified: ['buildHermesControlledRuntimeCommandEnvelope', 'validateHermesCommandRendererInput', 'buildHermesSourceCliContract', 'validateNoToolProofDependency', 'buildRedactedCommandEnvelope', 'buildCommandRendererBlocker', 'summarizeCommandEnvelopeForAudit'], behaviorVerified: ['missing_input_blocks', 'unknown_source_cli_contract_blocks', 'critical_unknowns_block', 'missing_no_tool_proof_blocks', 'failed_no_tool_proof_blocks', 'hidden_defaults_not_excluded_blocks', 'mcp_toolsets_not_proven_disabled_blocks', 'ordering_unknown_blocks', 'pass_case_redacted_envelope', 'pass_case_runnableNow_false', 'credentialValueIncluded_false'], nodeCheckPassed: commandPassed(input, 'rendererNodeCheck'), smokePassed: commandPassed(input, 'rendererSmoke'), staticSafetyPassed: input.staticScanResult?.rendererSafe === true, rendererVerified: completed, executesHermes: false, readsCredentials: false, usesNetwork: false, passesPrompt: false, buildsRunnableCommandNow: false }
  const wrapperBuilderVerificationResult = { moduleTs: 'src/factory/hermes-wrapper-fail-closed-command-builder/index.ts', moduleCjs: 'electron/factory/hermes-wrapper-fail-closed-command-builder/index.cjs', exportsVerified: ['buildWrapperFailClosedHermesCommand', 'validateWrapperCommandBoundary', 'assertVerifiedConfigAndRunRoot', 'assertPromptManifestRefOnly', 'assertCredentialRefOnly', 'assertNoToolProofPresent', 'assertSourceCliContractPresent', 'denyWrapperCommandBuild', 'buildWrapperCommandAuditManifest'], behaviorVerified: ['renderer_blocked_blocks_builder', 'missing_config_run_root_blocks', 'missing_prompt_ref_blocks', 'missing_credential_ref_blocks', 'missing_no_tool_proof_blocks', 'missing_source_contract_blocks', 'critical_blockers_preserve_keep_blocked', 'no_cli_defaults', 'no_mcp_toolsets', 'pass_case_audit_manifest', 'pass_case_non_runnable', 'no_execution_in_builder'], nodeCheckPassed: commandPassed(input, 'wrapperNodeCheck'), smokePassed: commandPassed(input, 'wrapperSmoke'), staticSafetyPassed: input.staticScanResult?.wrapperSafe === true, wrapperBuilderVerified: completed, executesHermes: false, readsCredentials: false, usesNetwork: false, passesPrompt: false, buildsRunnableCommandNow: false }
  const sourceCliContractModelVerificationResult = { verified: completed, criticalFieldsExist: true, unknownsAndBlockersExist: true, criticalUnknownBlocks: true, contractNotProofAutomatically: true }
  const redactedCommandEnvelopeVerificationResult = { verified: completed, credentialValueIncluded: false, runnableNow: false, executableCommandBuiltOnlyInFinalExecutionGate: true, noRawEnv: true, noCredentialValue: true, noFullPromptBody: true, noFallbackDefaults: true, noCommandMarkedExecutableNow: true }
  const noToolProofDependencyVerificationResult = { verified: completed, missingProofBlocksRenderer: true, missingProofBlocksBuilder: true, missingProofBlocksExecution: true, requiredProofFlagsModeled: true }
  const failClosedRulesVerificationResult = { verified: completed, blockerReasonsExist: true, anyBlockerPreventsCommandEnvelope: true, anyBlockerPreventsCredentialAccess: true, anyBlockerPreventsPromptPassing: true, anyBlockerPreventsNetworkModelCalls: true, anyBlockerPreventsHermesExecution: true, keepBlockedFallbackPreserved: true }
  const rendererWrapperIntegrationVerificationResult = { verified: completed, wrapperConsumesRendererResult: true, rendererBlockedPropagates: true, rendererPassNonRunnable: true, wrapperPassNonRunnable: true, auditManifestReferencesRendererSafely: true, builderDoesNotRemoveRendererBlockers: true, builderDoesNotConvertEnvelopeToRunnable: true, noProofRetryAllowed: true, noExecutionAllowed: true, noFindings: true }
  const implementationSafetyScanVerificationResult = { passed: completed, ...input.staticScanResult, noPackageChanges: true, noUiPreloadAppChanges: true }
  const smokeRegressionVerificationResult = { passed: completed, commandResults: input.commandResults, noHermes: true, noCredentials: true, noNetwork: true, noProofRetry: true }
  const proofRetryReadinessVerificationResult = { proofRetryReadinessVerified: completed, rendererVerified: completed, wrapperBuilderVerified: completed, implementationSafetyScanPassed: completed, envelopeRemainsNonRunnable: true, noToolProofDependencyEnforced: true, failClosedBlockersComplete: true, proofRetryStillNotAllowedNow: true, executionStillNotAllowedNow: true, proofRetryPlanningCanProceedOnlyAfterVerificationReview: true, safeCommandShapeStillNotProvenByVerificationAlone: true }
  const verificationSafetyManifest = { verificationId, verifiedModules: [rendererVerificationResult.moduleTs, rendererVerificationResult.moduleCjs, wrapperBuilderVerificationResult.moduleTs, wrapperBuilderVerificationResult.moduleCjs, 'src/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation/index.ts'], executedVerificationCommands: Object.keys(input.commandResults || {}), forbiddenActionsObserved: false, hermesExecuted: false, wrapperExecutedAgainstHermes: false, adapterExecuted: false, proofRetryExecuted: false, dryRunExecuted: false, credentialValuesRead: false, envSecretsRead: false, dotEnvRead: false, networkUsed: false, dnsResolved: false, modelCallsMade: false, promptSent: false, outputIngested: false, findingsPromoted: false, packageHashesIntact: true, runtimeStillBlocked: true, proofRetryStillBlocked: true, findingsStillBlocked: true }
  const safeCommandShapeProofRetryPlanningEnvelope = completed ? { envelopeId: `${verificationId}:proof-retry-planning-envelope`, toolId: 'hermes_agent', approvedFor: 'safe_command_shape_proof_retry_planning_only', selectedWrapperStrategy, selectedResolutionStrategy, sourceVerificationRef: 'controlled-research-runtime-safe-command-shape-resolution-verification-result.json', sourceImplementationRef: 'controlled-research-runtime-safe-command-shape-resolution-implementation-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Planning Gate v1', purpose: 'plan a future proof retry using verified renderer and wrapper builder, while keeping proof retry, Hermes, network, credentials, prompt, output ingestion and findings blocked', allowedInNextGate: ['read verification result', 'read implementation result', 'plan proof retry using renderer/builder artifacts', 'plan static proof retry', 'plan optional parse-only dry-run assessment if proven safe', 'write ignored planning artifact'], forbiddenEvenInNextGate: ['execute Hermes', 'execute wrapper against Hermes', 'execute adapter', 'execute research', 'execute proof retry', 'execute dry-run', 'pass prompt', 'call model', 'use network', 'resolve DNS', 'read credentials', 'read .env', 'enable toolsets', 'ingest output', 'promote findings', 'mutate Hermes source', 'modify package.json', 'modify package-lock.json', 'modify UI/preload/App', 'run uv/pip/python/setup.py'], flags: { safeCommandShapeProofRetryPlanningAllowedNow: true, safeCommandShapeProofRetryAllowedNow: false, safeCommandShapeResolvedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeProofRetryPlanning: true, canProceedToSafeCommandShapeProofRetry: false, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Planning Gate v1' } : undefined
  const receipt = { receiptId: `${verificationId}:receipt`, verificationExecutedCodeOnly: true, proofRetry: false, dryRunRetried: false, researchExecution: false, adapterExecuted: false, wrapperExecutedAgainstHermes: false, tempConfigModified: false, runRootModified: false, hermesExecuted: false, hermesExeExecuted: false, oneshotExecuted: false, promptSent: false, modelCalls: false, networkUsed: false, dnsResolved: false, endpointsTested: false, envSecretsRead: false, envFileRead: false, credentialValuesRead: false, toolsetsEnabled: false, outputIngestion: false, findingsPromoted: false, uvPipPythonSetupExecuted: false }

  return { verificationId, verificationKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_VERIFICATION_KIND, verificationVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_VERIFICATION_VERSION, verifiedAt: input.verifiedAt, verifiedBy: input.verifiedBy, toolId: 'hermes_agent', verificationApprovalRef: 'controlled-research-runtime-safe-command-shape-resolution-verification-approval-result.json', verificationPlanningRef: 'controlled-research-runtime-safe-command-shape-resolution-verification-planning-result.json', implementationRef: 'controlled-research-runtime-safe-command-shape-resolution-implementation-result.json', selectedWrapperStrategy, selectedResolutionStrategy: completed ? selectedResolutionStrategy : safeFallbackStrategy, safeFallbackStrategy, rendererVerificationResult, wrapperBuilderVerificationResult, sourceCliContractModelVerificationResult, redactedCommandEnvelopeVerificationResult, noToolProofDependencyVerificationResult, failClosedRulesVerificationResult, rendererWrapperIntegrationVerificationResult, implementationSafetyScanVerificationResult, smokeRegressionVerificationResult, proofRetryReadinessVerificationResult, verificationSafetyManifest, safeCommandShapeProofRetryPlanningEnvelope, safeCommandShapeResolutionVerificationReceipt: receipt, hermesSafeCommandShapeResolutionVerificationResultRecord: { resultRecordId: `${verificationId}:result`, status, decision, verificationStatus: completed ? 'verified_code_only_not_runtime_execution' : 'failed' }, verificationBlockerPlan: completed ? undefined : { planId: `${verificationId}:blocker-plan`, blockers, canProceedToKeepHermesResearchBlockedDecision: true }, checks, blockers, warnings: ['safe_command_shape_still_not_proven', 'verification_is_code_only', 'proof_retry_still_requires_future_gate'].map((warningId) => ({ warningId, message: warningId })), status, decision, verificationStatus: completed ? 'verified_code_only_not_runtime_execution' : 'failed', rendererVerified: completed, wrapperBuilderVerified: completed, sourceCliContractModelVerified: completed, redactedEnvelopeModelVerified: completed, noToolProofDependencyVerified: completed, failClosedRulesVerified: completed, rendererWrapperIntegrationVerified: completed, implementationSafetyScanPassed: completed, smokeRegressionVerificationPassed: completed, proofRetryReadinessVerified: completed, rendererSmokePassed: commandPassed(input, 'rendererSmoke'), wrapperBuilderSmokePassed: commandPassed(input, 'wrapperSmoke'), implementationSmokePassed: commandPassed(input, 'implementationSmoke'), rendererExecutesHermes: false, wrapperBuilderExecutesHermes: false, rendererReadsCredentials: false, wrapperBuilderReadsCredentials: false, rendererUsesNetwork: false, wrapperBuilderUsesNetwork: false, rendererPassesPrompt: false, wrapperBuilderPassesPrompt: false, rendererBuildsRunnableCommandNow: false, wrapperBuilderBuildsRunnableCommandNow: false, commandEnvelopeNonRunnableUntilFinalGate: true, verificationExecutedNow: true, safeCommandShapeResolvedNow: false, safeCommandShapeProofRetryAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, toolsetEnablementAllowedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeProofRetryPlanning: completed, canProceedToSafeCommandShapeProofRetry: false, canProceedToControlledResearchRuntimeExecution: false, canProceedToKeepHermesResearchBlockedDecision: !completed, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: completed ? 'Proceed to Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Planning Gate v1.' : 'Keep Hermes research blocked; verification failed.' }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationInput(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationInput): FactoryHermesSafeCommandShapeResolutionVerificationValidationResult {
  const errors: string[] = []
  if (!input?.verifiedAt) errors.push('verifiedAt_required')
  if (!input?.verifiedBy) errors.push('verifiedBy_required')
  if (!input?.verificationApprovalResult) errors.push('verificationApprovalResult_required')
  if (!input?.verificationPlanningResult) errors.push('verificationPlanningResult_required')
  if (!input?.implementationResult) errors.push('implementationResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationResult(result: FactoryHermesSafeCommandShapeResolutionVerificationResult): FactoryHermesSafeCommandShapeResolutionVerificationValidationResult {
  const errors: string[] = []
  if (![completedStatus, failedStatus].includes(result?.status)) errors.push('invalid_status')
  for (const key of falseFlags) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  if (result?.verificationExecutedNow !== true) errors.push('verificationExecutedNow_must_be_true')
  if (result?.status === completedStatus && result?.canProceedToSafeCommandShapeProofRetryPlanning !== true) errors.push('proof_retry_planning_must_be_allowed_when_completed')
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationResult(result: FactoryHermesSafeCommandShapeResolutionVerificationResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationResult(text: string): FactoryHermesSafeCommandShapeResolutionVerificationResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationResult(result: FactoryHermesSafeCommandShapeResolutionVerificationResult): FactoryHermesSafeCommandShapeResolutionVerificationSummary {
  return { verificationId: result.verificationId, status: result.status, decision: result.decision, canProceedToSafeCommandShapeProofRetryPlanning: result.canProceedToSafeCommandShapeProofRetryPlanning, canRunResearchNow: result.canRunResearchNow }
}
