const fs = require('node:fs/promises');
const path = require('node:path');
const { resolveFactoryHermesResearchResultIngestionPaths, assertIngestionPathContained } = require('./hermes-research-result-ingestion.path.cjs');

const KIND = 'factory-hermes-research-result-ingestion';
const VERSION = '1.0';
const NEXT = 'Proceed to Factory Hermes Research JEFE Review Gate v1; do not repair or execute Hermes directly.';
const notAuthorizedActions = ['execute_hermes_now', 'retry_adapter_now', 'materialize_entrypoint_now', 'execute_python_now', 'execute_uv_now', 'execute_pip_now', 'execute_setup_py_now', 'use_network_now', 'call_models_now', 'access_credentials_now', 'treat_as_research_result', 'use_findings_now', 'mutate_project_files_now', 'deploy_now'];
const safetyObservations = ['noHermesExecution', 'noResearchPrompt', 'noNetwork', 'noCredentials', 'noModelCalls', 'noPip', 'noPythonDirect', 'noSetupPy', 'noUv'];
async function readJson(file) {
  let text;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (error) {
    const wrapped = new Error(`json_file_missing: ${file}`);
    wrapped.code = 'json_file_missing';
    wrapped.path = file;
    wrapped.cause = error;
    throw wrapped;
  }
  if (text.trim().length === 0) {
    const error = new Error(`json_file_empty: ${file}`);
    error.code = 'json_file_empty';
    error.path = file;
    throw error;
  }
  try {
    return JSON.parse(text);
  } catch (cause) {
    const error = new Error(`json_parse_failed: ${file}: ${cause.message}`);
    error.code = 'json_parse_failed';
    error.path = file;
    error.cause = cause;
    throw error;
  }
}
function decisionForJsonReadError(error) {
  if (error.code === 'json_file_missing') return 'blocked_missing_adapter_result';
  if (error.code === 'json_file_empty') return 'blocked_empty_adapter_result';
  if (error.code === 'json_parse_failed') return 'blocked_invalid_adapter_result';
  return 'blocked_invalid_adapter_result';
}
function base(input, adapter = {}) {
  return { ingestionId: `hermes-research-result-ingestion:75b300f:${input.ingestedAt}`, ingestionKind: KIND, ingestionVersion: VERSION, ingestedAt: input.ingestedAt, ingestedBy: input.ingestedBy, toolId: 'hermes_agent', selectedCandidateId: adapter.selectedCandidateId || '', commandName: adapter.commandName || '', pythonEntrypoint: adapter.pythonEntrypoint || '', adapterRunRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/research-runtime-adapter-result.json', adapterDecision: adapter.decision || '', adapterStatus: adapter.status || '', classification: 'not_research_result', checks: [], blockers: [], warnings: [], status: 'blocked', decision: 'blocked_missing_adapter_result', canProceedToResearchJefeReview: false, canTreatAsResearchResult: false, canUseFindings: false, canProceedToEntrypointMaterializationReview: false, canExecuteHermes: false, canRunHermesScripts: false, canUseNetwork: false, canUseCredentials: false, canCallModels: false, canMutateProjectFiles: false, canDeploy: false, recommendedNextStep: NEXT };
}
function boundaryViolation(a) {
  return a.networkStatus !== 'not_allowed' || a.credentialsStatus !== 'not_allowed' || a.modelCallStatus !== 'not_allowed' || a.pipStatus !== 'not_executed' || a.pythonDirectStatus !== 'not_executed' || a.setupPyStatus !== 'not_executed' || a.uvStatus !== 'not_executed' || a.scriptsStatus !== 'not_executed';
}
function evaluate(input) {
  const a = input.adapterResult;
  const out = base(input, a);
  if (!a) return { ...out, blockers: [{ blockerId: 'blocked_missing_adapter_result', message: 'Adapter result is required.' }] };
  if (a.mode !== 'help_probe_only' || a.selectedCandidateId !== 'pyproject-console-script-1' || a.commandName !== 'hermes' || a.pythonEntrypoint !== 'hermes_cli.main:main') return { ...out, decision: 'blocked_adapter_result_not_ingestable', blockers: [{ blockerId: 'blocked_adapter_result_not_ingestable', message: 'Adapter identity is not ingestable.' }] };
  if (a.canTreatAsResearchResult !== false || a.canUseFindings !== false) return { ...out, decision: 'blocked_adapter_result_claims_research_findings', blockers: [{ blockerId: 'blocked_adapter_result_claims_research_findings', message: 'Help probe cannot claim findings.' }] };
  if (boundaryViolation(a)) return { ...out, classification: 'boundary_violation', decision: 'blocked_adapter_boundary_violation', blockers: [{ blockerId: 'blocked_adapter_boundary_violation', message: 'Adapter result violates boundary.' }] };
  if (a.canProceedToResultIngestion !== true) return { ...out, decision: 'blocked_adapter_result_not_ingestable', blockers: [{ blockerId: 'blocked_adapter_result_not_ingestable', message: 'Adapter cannot proceed to ingestion.' }] };
  const controlledBlock = a.decision === 'blocked_executable_missing';
  const classification = controlledBlock ? 'controlled_adapter_block' : 'help_probe_result';
  const decision = controlledBlock ? 'hermes_research_result_ingested_controlled_adapter_block' : 'hermes_research_result_ingested_help_probe_completed';
  const normalizedOutcome = controlledBlock ? 'entrypoint_executable_missing' : 'help_probe_completed';
  const id = out.ingestionId;
  const receipt = { receiptId: `${id}:receipt`, ingestionId: id, toolId: 'hermes_agent', ingestedBy: input.ingestedBy, ingestedAt: input.ingestedAt, adapterDecision: a.decision, classification, scope: 'hermes_research_result_ingestion_only', approvedNextGate: 'Factory Hermes Research JEFE Review Gate v1', limitations: ['Ingestion classifies adapter evidence only.', 'No repair, retry or Hermes execution is authorized.', 'Help probe output is not a research result.'], notAuthorizedActions };
  const record = { recordId: `${id}:record`, ingestionId: id, toolId: 'hermes_agent', selectedCandidateId: a.selectedCandidateId, commandName: a.commandName, pythonEntrypoint: a.pythonEntrypoint, adapterRunRef: out.adapterRunRef, adapterMode: a.mode, adapterDecision: a.decision, adapterStatus: a.status, classification, normalizedOutcome, normalizedMessage: controlledBlock ? 'selected package entrypoint was approved but executable wrapper is missing because project was not installed as package' : 'adapter produced a controlled help probe artifact that is not a research result', evidence: { executableRef: a.executableRef, missingExecutablePath: controlledBlock ? a.executableRef : undefined, mode: a.mode, exitCode: a.exitCode, timedOut: a.timedOut, killed: a.killed, stdoutPreview: a.stdoutPreview || '', stderrPreview: a.stderrPreview || '' }, safetyObservations, suggestedNextActions: ['Factory Hermes Research JEFE Review Gate v1', 'Factory Hermes Entrypoint Materialization Planning Gate v1'], canProceedToResearchJefeReview: true, canTreatAsResearchResult: false, canUseFindings: false };
  return { ...out, classification, status: 'ingested', decision, researchResultIngestionReceipt: receipt, hermesResearchResultIngestionRecord: record, canProceedToResearchJefeReview: true, canProceedToEntrypointMaterializationReview: controlledBlock };
}
async function executeFactoryHermesResearchResultIngestion(input = {}) {
  const paths = resolveFactoryHermesResearchResultIngestionPaths();
  assertIngestionPathContained(paths.installRoot, path.join(paths.root, '.codex-temp'));
  assertIngestionPathContained(paths.ingestionResult, paths.installRoot);
  let adapterResult; let approvalResult; let boundaryResult;
  try {
    adapterResult = await readJson(paths.adapterResult);
    approvalResult = await readJson(paths.approvalResult);
    boundaryResult = await readJson(paths.boundaryResult);
    await readJson(paths.interfaceSelectionResult);
  } catch (error) {
    const decision = decisionForJsonReadError(error);
    const result = { ...base({ ingestedAt: input.ingestedAt || '2026-07-21T21:00:00.000Z', ingestedBy: input.ingestedBy || 'factory-hermes-research-result-ingestion-smoke' }), decision, blockers: [{ blockerId: error.code || 'json_read_failed', message: `${error.code || 'json_read_failed'} at ${error.path || 'unknown path'}` }] };
    await fs.writeFile(paths.ingestionResult, JSON.stringify(result, null, 2));
    return result;
  }
  if (approvalResult.status !== 'approved_for_adapter_candidate' || boundaryResult.status !== 'boundary_contract_created') throw new Error('Approval or boundary artifact is not ready for ingestion.');
  const result = evaluate({ ingestedAt: input.ingestedAt || '2026-07-21T21:00:00.000Z', ingestedBy: input.ingestedBy || 'factory-hermes-research-result-ingestion-smoke', adapterResult, approvalResult, boundaryResult });
  await fs.writeFile(paths.ingestionResult, JSON.stringify(result, null, 2));
  return result;
}
module.exports = { executeFactoryHermesResearchResultIngestion, evaluateFactoryHermesResearchResultIngestion: evaluate };
