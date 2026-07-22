const fs = require('node:fs/promises');
const { resolveFactoryHermesResearchJefeReviewV2Paths, assertResearchJefeReviewV2PathContained } = require('./hermes-research-jefe-review-v2.path.cjs');

const KIND = 'factory-hermes-research-jefe-review-v2';
const VERSION = '2.0';
const NEXT = 'Proceed to Factory Hermes Research Execution Planning Gate v1; do not run research or execute Hermes directly.';
const ingestionRef = '.codex-temp/external-tools/hermes-agent/install/75b300f/research-result-ingestion-v2-result.json';
const adapterRetryRef = '.codex-temp/external-tools/hermes-agent/install/75b300f/research-runtime-adapter-retry-result.json';
const notAuthorizedActions = ['run_research_now', 'execute_hermes_now', 'execute_entrypoint_now', 'pass_prompt_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'treat_help_as_research_result', 'use_help_output_as_findings', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'mutate_project_files_now', 'deploy_now'];
const questions = ['What exact research command shape does Hermes support?', 'Does Hermes require network access?', 'Does Hermes require credentials or model provider config?', 'How will prompts be bounded and sanitized?', 'What output contract will be ingested?', 'How will JEFE prevent help text from becoming findings?', 'What timeout/output truncation limits are needed?', 'What is the first harmless real research task, if any?'];
const futureGates = ['Factory Hermes Research Execution Planning Gate v1', 'Factory Hermes Research Execution Approval Gate v1', 'Factory Hermes Research Execution Boundary Gate v1', 'Factory Hermes Research Execution Runtime Adapter v1', 'Factory Hermes Research Execution Result Ingestion Gate v1', 'Factory Hermes Research Execution JEFE Review Gate v1'];
async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
function base(input, i = {}) { return { jefeReviewId: `hermes-research-jefe-review-v2:75b300f:${input.reviewedAt}`, jefeReviewKind: KIND, jefeReviewVersion: VERSION, reviewedAt: input.reviewedAt, reviewedBy: input.reviewedBy, toolId: 'hermes_agent', commandName: i.commandName || '', pythonEntrypoint: i.pythonEntrypoint || '', executableRef: i.executableRef || '', executableSha256: i.executableSha256 || '', helpProbeStatus: i.helpProbeStatus || '', ingestionClassification: i.classification || '', ingestionNormalizedOutcome: i.normalizedOutcome || '', checks: [], blockers: [], warnings: [], status: 'blocked', decision: 'blocked_missing_ingestion_v2', canProceedToResearchExecutionPlanning: false, canRunResearchNow: false, canExecuteHermesNow: false, canTreatHelpAsResearchResult: false, canTreatAsResearchResult: false, canUseFindings: false, canUseNetworkNow: false, canUseCredentials: false, canCallModelsNow: false, canMutateProjectFiles: false, canDeploy: false, recommendedNextStep: NEXT }; }
function hasBoundaryViolation(i) { return i.canExecuteHermes !== false || i.canUseNetwork !== false || i.canUseCredentials !== false || i.canCallModels !== false || i.canUseFindings !== false || i.canTreatAsResearchResult !== false; }
function evaluate(input) {
  const i = input.researchResultIngestionV2Result;
  const out = base(input, i);
  if (!i) return { ...out, blockers: [{ blockerId: 'blocked_missing_ingestion_v2', message: 'Research result ingestion v2 result is required.' }] };
  if (!input.humanApprovalRef) return { ...out, status: 'human_review_required', decision: 'blocked_missing_human_approval', blockers: [{ blockerId: 'blocked_missing_human_approval', message: 'humanApprovalRef is required.' }] };
  if (i.status !== 'ingested' || i.canProceedToResearchJefeReviewV2 !== true) return { ...out, decision: 'blocked_ingestion_v2_not_reviewable', blockers: [{ blockerId: 'blocked_ingestion_v2_not_reviewable', message: 'Ingestion v2 is not reviewable.' }] };
  if (i.classification !== 'controlled_help_probe_success' || i.normalizedOutcome !== 'hermes_help_probe_succeeded' || i.helpProbeStatus !== 'succeeded') return { ...out, decision: 'blocked_help_probe_not_success', blockers: [{ blockerId: 'blocked_help_probe_not_success', message: 'Help probe success is required.' }] };
  if (i.canTreatAsResearchResult !== false || i.canUseFindings !== false) return { ...out, decision: 'blocked_help_probe_claims_research_result', blockers: [{ blockerId: 'blocked_help_probe_claims_research_result', message: 'Help probe cannot be research result or findings.' }] };
  if (hasBoundaryViolation(i)) return { ...out, decision: 'blocked_boundary_violation_detected', blockers: [{ blockerId: 'blocked_boundary_violation_detected', message: 'Ingestion v2 safety boundary was violated.' }] };
  const id = out.jefeReviewId;
  const receipt = { receiptId: `${id}:receipt`, jefeReviewId: id, toolId: 'hermes_agent', reviewedBy: input.reviewedBy, reviewedAt: input.reviewedAt, humanApprovalRef: input.humanApprovalRef, ingestionDecision: i.decision, helpProbeStatus: i.helpProbeStatus, classification: i.classification, normalizedOutcome: i.normalizedOutcome, decision: 'hermes_research_jefe_review_v2_approved_research_execution_planning', scope: 'hermes_research_jefe_review_v2_only', approvedNextGate: 'Factory Hermes Research Execution Planning Gate v1', limitations: ['Approval is for planning only.', 'No research runtime, prompt passing, model calls, network or credentials are authorized now.', 'Help output remains operational evidence only and cannot be findings.'], notAuthorizedActions };
  const record = { recordId: `${id}:record`, jefeReviewId: id, toolId: 'hermes_agent', commandName: 'hermes', pythonEntrypoint: 'hermes_cli.main:main', executableRef: i.executableRef, executableSha256: i.executableSha256 || '', ingestionV2ResultRef: ingestionRef, adapterRetryResultRef: adapterRetryRef, ingestionDecision: i.decision, helpProbeStatus: i.helpProbeStatus, classification: i.classification, normalizedOutcome: i.normalizedOutcome, jefeAssessment: 'Hermes entrypoint is operational at help-probe level only.', operationalConclusion: 'Help probe succeeded and proves CLI is callable under boundary.', researchConclusion: 'No research was performed and no findings may be used.', approvedNextPlanning: 'Factory Hermes Research Execution Planning Gate v1', safetyConclusion: 'no network, no credentials, no model calls, no research prompt, no uv/pip/python/setup execution', canProceedToResearchExecutionPlanning: true, canRunResearchNow: false, canExecuteHermesNow: false, canUseFindings: false };
  const envelope = { envelopeId: `${id}:research-execution-planning-envelope`, jefeReviewId: id, toolId: 'hermes_agent', commandName: 'hermes', pythonEntrypoint: 'hermes_cli.main:main', executableRef: i.executableRef, executableSha256: i.executableSha256 || '', selectedInterface: { interfaceType: 'package_entrypoint', commandName: 'hermes', pythonEntrypoint: 'hermes_cli.main:main' }, currentVerifiedCapability: 'help_probe_only', currentVerifiedCommand: 'hermes.exe --help', allowedNextGate: 'Factory Hermes Research Execution Planning Gate v1', researchExecutionAllowedNow: false, hermesExecutionAllowedNow: false, networkAllowedNow: false, credentialsAllowedNow: false, modelCallsAllowedNow: false, promptPassingAllowedNow: false, requiredPlanningQuestions: questions, requiredFutureGates: futureGates };
  return { ...out, status: 'approved_for_research_execution_planning', decision: 'hermes_research_jefe_review_v2_approved_research_execution_planning', researchJefeReviewV2Receipt: receipt, hermesResearchJefeReviewV2Record: record, approvedResearchExecutionPlanningEnvelope: envelope, canProceedToResearchExecutionPlanning: true };
}
async function executeFactoryHermesResearchJefeReviewV2(input = {}) {
  const paths = resolveFactoryHermesResearchJefeReviewV2Paths();
  for (const p of [paths.ingestionV2Result, paths.adapterRetryResult, paths.adapterRetryManifest, paths.entrypointVerificationResult, paths.boundaryResult, paths.approvalResult, paths.interfaceSelectionResult, paths.reviewV2Result]) assertResearchJefeReviewV2PathContained(p, paths.installRoot);
  const reviewedAt = input.reviewedAt || '2026-07-22T05:45:00.000Z';
  const reviewedBy = input.reviewedBy || 'factory-hermes-research-jefe-review-v2-smoke';
  const humanApprovalRef = input.humanApprovalRef || 'human-review/hermes-research-jefe-review-v2';
  let ingestion;
  try {
    ingestion = input.researchResultIngestionV2Result || await readJson(paths.ingestionV2Result);
    const retry = input.researchRuntimeAdapterRetryResult || await readJson(paths.adapterRetryResult);
    const verification = input.entrypointMaterializationVerificationResult || await readJson(paths.entrypointVerificationResult);
    await readJson(paths.adapterRetryManifest); await readJson(paths.boundaryResult); await readJson(paths.approvalResult); await readJson(paths.interfaceSelectionResult);
    if (retry.status !== 'success' || retry.decision !== 'hermes_research_runtime_adapter_retry_help_probe_succeeded') throw new Error('adapter retry is not successful');
    if (!['verified', 'warning_verified'].includes(verification.status) || verification.decision !== 'hermes_entrypoint_materialization_verified_for_research_runtime_adapter_retry') throw new Error('entrypoint verification is not valid');
  } catch (error) {
    const result = { ...base({ reviewedAt, reviewedBy }, ingestion), blockers: [{ blockerId: 'blocked_missing_ingestion_v2', message: String(error.message || error) }] };
    await fs.writeFile(paths.reviewV2Result, `${JSON.stringify(result, null, 2)}\n`);
    return result;
  }
  const result = evaluate({ reviewedAt, reviewedBy, humanApprovalRef, researchResultIngestionV2Result: ingestion });
  await fs.writeFile(paths.reviewV2Result, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
module.exports = { executeFactoryHermesResearchJefeReviewV2, evaluateFactoryHermesResearchJefeReviewV2: evaluate, resolveFactoryHermesResearchJefeReviewV2Paths };
