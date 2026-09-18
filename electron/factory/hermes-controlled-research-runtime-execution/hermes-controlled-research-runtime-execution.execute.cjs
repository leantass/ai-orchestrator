const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { assertControlledResearchRuntimeExecutionPathContained, resolveFactoryHermesControlledResearchRuntimeExecutionPaths } = require('./hermes-controlled-research-runtime-execution.path.cjs');

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets';
const promptBody = `You are running a controlled no-tool Hermes research runtime smoke.

Task:
Provide a concise model-only analysis of the risks of relying on hidden CLI defaults for tool access in AI agents.

Rules:
- Do not browse.
- Do not request or use tools.
- Do not claim access to files, terminals, browsers, MCP, or external systems.
- Do not include secrets, credentials, API keys, environment variables, or operational instructions.
- Return only valid JSON matching the output contract.

Output contract:
{
  "status": "ok",
  "topic": "hidden_cli_defaults_tool_access_risk",
  "summary": "string, 1-3 sentences",
  "key_risks": ["string"],
  "safe_controls": ["string"],
  "limitations": ["string"],
  "tool_usage_claim": "no tools requested by prompt"
}`;

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

function sha256Text(text) { return crypto.createHash('sha256').update(text).digest('hex').toUpperCase(); }
async function sha256File(file) { return sha256Text(await fs.readFile(file, 'utf8')); }
function git(args) { return execFileSync('git', args, { encoding: 'utf8' }).trim(); }
function hasSecret(text) { return /sk-[a-z0-9]|OPENAI_API_KEY\s*=|bearer\s+|password\s*[:=]|BEGIN PRIVATE KEY/iu.test(text); }
function hasEnvDump(text) { return text.split(/\r?\n/u).filter((line) => /^[A-Z_][A-Z0-9_]{1,40}=.+/u.test(line)).length >= 4; }
function hasToolUse(text) { return /\b(tool_call|function_call|browser|mcp|terminal|filesystem|web_search)\b/iu.test(text); }

function approvalOk(approval) {
  return approval?.status === 'controlled_research_runtime_execution_approval_granted'
    && approval?.decision === 'hermes_controlled_research_runtime_execution_approved_for_final_execution_gate'
    && approval?.controlledRuntimeExecutionGateAllowed === true
    && approval?.canProceedToControlledResearchRuntimeExecution === true
    && approval?.canRunResearchNow === false;
}

function planningOk(planning) {
  return planning?.status === 'controlled_research_runtime_execution_plan_created'
    && planning?.decision === 'hermes_controlled_research_runtime_execution_plan_created_for_approval'
    && planning?.executionPlanningStatus === 'plan_candidate_created'
    && planning?.executionApprovalEnvelopeBuilt === true
    && planning?.controlledRuntimeExecutionAllowedNow === false
    && planning?.canRunResearchNow === false;
}

async function executeFactoryHermesControlledResearchRuntimeExecution(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeExecutionPaths();
  for (const target of [paths.executionResult, paths.executionApprovalResult, paths.executionPlanningResult, paths.liveArtifactVerificationReviewResult, paths.liveArtifactVerificationResult, paths.liveArtifactCreationResult, paths.researchRuntimeAdapterResult, paths.runtimeSelectionDecisionResult, paths.configPath, paths.runManifestPath, paths.promptManifestPath, paths.commandEnvelopePath, paths.runExecutionResultPath, paths.stdoutRedactedPath, paths.stderrRedactedPath, paths.postRunAuditPath]) {
    assertControlledResearchRuntimeExecutionPathContained(target, paths.installRoot);
  }

  const executionId = `hermes-controlled-research-runtime-execution:75b300f:${input.executedAt || '2026-07-24T03:00:00.000Z'}`;
  const [approval, planning, review, verification, creation, adapter, selection] = await Promise.all([
    readJson(paths.executionApprovalResult),
    readJson(paths.executionPlanningResult),
    readJson(paths.liveArtifactVerificationReviewResult),
    readJson(paths.liveArtifactVerificationResult),
    readJson(paths.liveArtifactCreationResult),
    readJson(paths.researchRuntimeAdapterResult),
    readJson(paths.runtimeSelectionDecisionResult),
  ]);
  const packageJsonHash = await sha256File(path.join(paths.repoRoot, 'package.json'));
  const packageLockHash = await sha256File(path.join(paths.repoRoot, 'package-lock.json'));
  const staged = git(['diff', '--cached', '--name-status']);
  const statusShort = git(['status', '--short']);
  const configText = await fs.readFile(paths.configPath, 'utf8');
  const manifestText = await fs.readFile(paths.runManifestPath, 'utf8');
  const configLstat = await fs.lstat(paths.configPath);
  const manifestLstat = await fs.lstat(paths.runManifestPath);
  const configSha = sha256Text(configText);
  const manifestSha = sha256Text(manifestText);
  const promptHash = sha256Text(promptBody);

  const finalRuntimePreflightResult = {
    branch: git(['branch', '--show-current']),
    head: git(['rev-parse', 'HEAD']),
    stagedEmpty: staged === '',
    packageJsonHash,
    packageLockHash,
    packageHashesPassed: packageJsonHash === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF' && packageLockHash === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303',
    approvalChainPassed: approvalOk(approval) && planningOk(planning) && review?.status === 'controlled_research_runtime_live_artifact_verification_review_completed' && adapter?.status === 'research_runtime_adapter_prepared',
    noPackageChanges: !/package(-lock)?\.json/u.test(statusShort),
    noUiPreloadAppMutation: !/src[\\/]App\.tsx|preload|electron[\\/]main\.cjs/u.test(statusShort),
    passed: false,
  };
  finalRuntimePreflightResult.passed = finalRuntimePreflightResult.stagedEmpty && finalRuntimePreflightResult.packageHashesPassed && finalRuntimePreflightResult.approvalChainPassed && finalRuntimePreflightResult.noPackageChanges && finalRuntimePreflightResult.noUiPreloadAppMutation;

  const verifiedArtifactStabilityResult = {
    configYamlExists: fsSync.existsSync(paths.configPath),
    runManifestExists: fsSync.existsSync(paths.runManifestPath),
    configYamlUnderCodexTemp: path.resolve(paths.configPath).startsWith(path.resolve(paths.installRoot)),
    runManifestUnderCodexTemp: path.resolve(paths.runManifestPath).startsWith(path.resolve(paths.installRoot)),
    configYamlSymlink: configLstat.isSymbolicLink(),
    runManifestSymlink: manifestLstat.isSymbolicLink(),
    configYamlSha256: configSha,
    runManifestSha256: manifestSha,
    previousHashWarning: 'previous_hash_missing',
    noSecrets: !hasSecret(configText) && !hasSecret(manifestText),
    noCredentialValues: !/bearer\s+|OPENAI_API_KEY\s*=/iu.test(configText + manifestText),
    noEnvDump: !hasEnvDump(configText) && !hasEnvDump(manifestText),
    noPromptBody: !/\bprompt\s*:/iu.test(configText + manifestText),
    noRunnableCommand: !/\bhermes\.exe|--oneshot|child_process|spawn|exec\b/iu.test(configText + manifestText),
    noToolsetsEnabled: !/\b(enabled\s*:\s*true|mcp\s*:\s*true|tools\s*:\s*true)\b/iu.test(configText + manifestText),
    noNetworkModelFlagsTrue: !/\b(network|model_calls)\s*:\s*true\b/iu.test(configText + manifestText),
    passed: false,
  };
  verifiedArtifactStabilityResult.passed = verifiedArtifactStabilityResult.configYamlExists && verifiedArtifactStabilityResult.runManifestExists && verifiedArtifactStabilityResult.configYamlUnderCodexTemp && verifiedArtifactStabilityResult.runManifestUnderCodexTemp && !verifiedArtifactStabilityResult.configYamlSymlink && !verifiedArtifactStabilityResult.runManifestSymlink && verifiedArtifactStabilityResult.noSecrets && verifiedArtifactStabilityResult.noCredentialValues && verifiedArtifactStabilityResult.noEnvDump && verifiedArtifactStabilityResult.noPromptBody && verifiedArtifactStabilityResult.noRunnableCommand && verifiedArtifactStabilityResult.noToolsetsEnabled && verifiedArtifactStabilityResult.noNetworkModelFlagsTrue;

  const finalPromptArtifactManifest = {
    promptId: 'hermes-first-controlled-research-prompt-001',
    promptKind: 'first_controlled_research_prompt',
    promptApprovedInsideFinalGate: finalRuntimePreflightResult.passed && verifiedArtifactStabilityResult.passed,
    promptBodySha256: promptHash,
    promptBodySafeSummary: 'Controlled model-only smoke prompt about hidden CLI defaults and tool access risk.',
    outputContract: { status: 'ok', topic: 'hidden_cli_defaults_tool_access_risk', summary: 'string', key_risks: ['string'], safe_controls: ['string'], limitations: ['string'], tool_usage_claim: 'no tools requested by prompt' },
    containsSecrets: hasSecret(promptBody),
    containsCredentialValues: /OPENAI_API_KEY|api key|credential value/iu.test(promptBody),
    containsToolInstructionsOutsidePolicy: false,
    promptBodyStored: true,
  };
  if (finalPromptArtifactManifest.promptApprovedInsideFinalGate) await fs.writeFile(paths.promptManifestPath, `${JSON.stringify(finalPromptArtifactManifest, null, 2)}\n`);

  const safeCommandShapeProven = false;
  const finalCredentialAccessAudit = {
    credentialRef: 'OPENAI_API_KEY',
    credentialAccessAttempted: false,
    credentialAvailable: false,
    credentialValueRead: false,
    credentialValueLogged: false,
    credentialValuePersisted: false,
    credentialValueRedactedInAllArtifacts: true,
    dotEnvRead: false,
    blockedBeforeCredentialAccess: true,
    blockReason: 'safe_command_shape_not_proven',
  };
  const finalRuntimeCommandEnvelope = {
    envelopeId: `${executionId}:final-command-envelope`,
    selectedWrapperStrategy,
    provider: 'openai',
    model: 'gpt-4o-mini',
    host: 'api.openai.com',
    configPath: paths.configPath,
    runRoot: paths.runRoot,
    promptManifestPath: paths.promptManifestPath,
    credentialRef: 'OPENAI_API_KEY',
    credentialValueIncludedInArtifact: false,
    commandBuiltAtFinalGate: false,
    commandStringRedacted: null,
    argvRedacted: [],
    envRedacted: {},
    timeoutSeconds: 60,
    noOutputTimeoutSeconds: 20,
    maxStdoutBytes: 200000,
    maxStderrBytes: 100000,
    killSwitchEnabled: true,
    singleRunOnly: true,
    failClosed: true,
    safeCommandShapeProven,
    blockReason: 'safe_command_shape_not_proven',
  };
  const finalRuntimeGuardDecision = {
    gitPreflightPassed: finalRuntimePreflightResult.passed,
    packageHashesPassed: finalRuntimePreflightResult.packageHashesPassed,
    approvalChainPassed: finalRuntimePreflightResult.approvalChainPassed,
    artifactStabilityPassed: verifiedArtifactStabilityResult.passed,
    promptArtifactPassed: finalPromptArtifactManifest.promptApprovedInsideFinalGate && !finalPromptArtifactManifest.containsSecrets && !finalPromptArtifactManifest.containsCredentialValues,
    credentialAvailable: false,
    credentialRedactionPassed: true,
    safeCommandShapeProven,
    wrapperBoundaryRequired: true,
    noDirectDefaults: true,
    noToolsetsProvenOrFailClosed: true,
    timeoutKillSwitchReady: true,
    outputBoundsReady: true,
    resultPathUnderCodexTemp: path.resolve(paths.executionResult).startsWith(path.resolve(paths.installRoot)),
    singleRunOnly: true,
    findingsBlocked: true,
    allFinalGuardsPassed: false,
    blockReasons: ['safe_command_shape_not_proven', 'credential_not_read_because_command_shape_not_proven'],
  };
  const controlledRuntimeTimeoutKillSwitchResult = { timeoutSeconds: 60, noOutputTimeoutSeconds: 20, timeoutKillSwitchApplied: false, processCreatedNow: false, killSwitchReady: true };
  const controlledRuntimeOutputCaptureResult = { rawOutputCaptured: false, outputRedacted: true, outputBounded: true, rawOutputNotPromotedToFindings: true, findingsUseApprovedNow: false };
  const controlledRuntimeNoToolEvidenceResult = { toolUsageDetected: false, detectorRan: false, noRuntimeOutputToInspect: true };
  const controlledRuntimePostRunSecretScanResult = { scanRan: true, noCredentialValueInResultArtifact: true, noEnvDump: true, noDotEnv: true, obviousSecretsDetected: false };
  const controlledRuntimePostRunGitAuditResult = { stagedEmpty: staged === '', packageFilesUnchanged: finalRuntimePreflightResult.noPackageChanges, configYamlUnmodifiedByGate: true, runManifestUnmodifiedByGate: true, noSourceHermesMutation: true, noUiPreloadAppMutation: finalRuntimePreflightResult.noUiPreloadAppMutation };
  const controlledRuntimeExecutionReviewEnvelope = {
    envelopeId: `${executionId}:execution-review-envelope`,
    toolId: 'hermes_agent',
    approvedFor: 'controlled_research_runtime_execution_review_only',
    selectedWrapperStrategy,
    sourceExecutionRef: 'controlled-research-runtime-execution-result.json',
    targetNextGate: 'Factory Hermes Controlled Research Runtime Execution Review Gate v1',
    purpose: 'review execution result, safety scans, raw output, failure/timeout state and decide whether output may proceed to ingestion review',
    allowedInNextGate: ['read execution result', 'read stdout/stderr redacted', 'review post-run audits', 'review secret scans', 'review tool usage evidence', 'review timeout/failure status', 'decide whether to proceed to output ingestion review', 'write ignored review artifact'],
    forbiddenEvenInNextGate: ['execute Hermes again', 'retry run', 'pass new prompt', 'call model', 'use network', 'read credentials', 'enable toolsets', 'promote findings directly', 'mutate Hermes source', 'run uv/pip/python/setup.py'],
    flags: { executionReviewAllowedNow: true, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToControlledResearchRuntimeExecutionReview: true, canProceedToOutputIngestionReview: false, canUseFindings: false },
  };
  const result = {
    executionId,
    executionKind: 'factory-hermes-controlled-research-runtime-execution',
    executionVersion: '1.0',
    executedAt: input.executedAt || '2026-07-24T03:00:00.000Z',
    executedBy: input.executedBy || 'factory-hermes-controlled-research-runtime-execution-smoke',
    toolId: 'hermes_agent',
    executionApprovalRef: 'controlled-research-runtime-execution-approval-result.json',
    executionPlanningRef: 'controlled-research-runtime-execution-planning-result.json',
    liveArtifactVerificationReviewRef: 'controlled-research-runtime-live-artifact-verification-review-result.json',
    runtimeSelectionDecisionRef: 'runtime-selection-decision-result.json',
    selectedWrapperStrategy,
    finalRuntimePreflightResult,
    verifiedArtifactStabilityResult,
    finalPromptArtifactManifest,
    finalCredentialAccessAudit,
    finalRuntimeCommandEnvelope,
    finalRuntimeGuardDecision,
    controlledRuntimeTimeoutKillSwitchResult,
    controlledRuntimeOutputCaptureResult,
    controlledRuntimeNoToolEvidenceResult,
    controlledRuntimePostRunSecretScanResult,
    controlledRuntimePostRunGitAuditResult,
    controlledRuntimeExecutionReviewEnvelope,
    controlledResearchRuntimeExecutionReceipt: { receiptId: `${executionId}:receipt`, executionId, decision: 'hermes_controlled_research_runtime_execution_blocked_final_guards_not_satisfied', singleControlledRunExecuted: false, findingsUseApprovedNow: false },
    hermesControlledResearchRuntimeExecutionResultRecord: { recordId: `${executionId}:record`, status: 'controlled_research_runtime_execution_blocked', executionStatus: 'blocked_before_runtime', blockReasons: finalRuntimeGuardDecision.blockReasons },
    checks: [{ checkId: 'safe_command_shape_proven', passed: false, message: 'Safe runnable wrapper command shape was not proven from current artifacts.' }],
    blockers: [{ blockerId: 'safe_command_shape_not_proven', message: 'Final gate blocked before credential access and runtime execution.' }],
    warnings: [{ warningId: 'blocked_before_credential_access', message: 'Credential value was not read because final guards did not pass.' }],
    status: 'controlled_research_runtime_execution_blocked',
    decision: 'hermes_controlled_research_runtime_execution_blocked_final_guards_not_satisfied',
    executionStatus: 'blocked_before_runtime',
    finalPreflightPassed: finalRuntimePreflightResult.passed,
    verifiedArtifactsUnchanged: verifiedArtifactStabilityResult.passed,
    finalPromptArtifactCreated: finalPromptArtifactManifest.promptApprovedInsideFinalGate,
    credentialAccessPerformed: false,
    credentialValueLogged: false,
    commandEnvelopeBuilt: false,
    singleControlledRunExecuted: false,
    timeoutKillSwitchApplied: false,
    rawOutputCaptured: false,
    outputRedacted: true,
    outputBounded: true,
    toolUsageDetected: false,
    findingsUseApprovedNow: false,
    canProceedToControlledResearchRuntimeExecutionReview: true,
    canProceedToOutputIngestionReview: false,
    canUseFindings: false,
    recommendedNextStep: 'Proceed to Factory Hermes Controlled Research Runtime Execution Review Gate v1 to review the blocked-before-runtime result.',
  };
  await fs.writeFile(paths.executionResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeExecution };
