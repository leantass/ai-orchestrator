const fs = require('node:fs/promises');
const path = require('node:path');
const { resolveFactoryHermesResearchResultIngestionV2Paths, assertResearchResultIngestionV2PathContained } = require('./hermes-research-result-ingestion-v2.path.cjs');

const KIND = 'factory-hermes-research-result-ingestion-v2';
const VERSION = '2.0';
const NEXT = 'Proceed to Factory Hermes Research JEFE Review Gate v2; help output is operational health evidence only, not research findings.';
const retryResultRef = '.codex-temp/external-tools/hermes-agent/install/75b300f/research-runtime-adapter-retry-result.json';
const retryManifestRef = '.codex-temp/external-tools/hermes-agent/install/75b300f/research-runtime-adapter-retry-manifest.json';
const notAuthorizedActions = ['execute_hermes_now', 'execute_entrypoint_now', 'run_research_now', 'treat_help_as_research_result', 'use_help_output_as_findings', 'retry_adapter_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'use_network_now', 'call_models_now', 'access_credentials_now', 'mutate_project_files_now', 'deploy_now'];
const safetyObservations = ['helpProbeOnly', 'noResearchPrompt', 'noResearchFindings', 'noNetwork', 'noCredentials', 'noModelCalls', 'noPip', 'noPythonDirect', 'noSetupPyDirect', 'noUv'];
async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
function base(input, r = {}) { return { ingestionId: `hermes-research-result-ingestion-v2:75b300f:${input.ingestedAt}`, ingestionKind: KIND, ingestionVersion: VERSION, ingestedAt: input.ingestedAt, ingestedBy: input.ingestedBy, toolId: 'hermes_agent', commandName: r.commandName || '', pythonEntrypoint: r.pythonEntrypoint || '', executableRef: r.executableRef || '', executableSha256: r.executableSha256 || '', retryResultRef, retryManifestRef, retryDecision: r.decision || '', helpProbeStatus: r.helpProbeStatus || '', exitCode: typeof r.exitCode === 'number' ? r.exitCode : null, timedOut: Boolean(r.timedOut), classification: 'not_research_result', normalizedOutcome: '', checks: [], blockers: [], warnings: [], status: 'blocked', decision: 'blocked_missing_adapter_retry_result', canProceedToResearchJefeReviewV2: false, canTreatAsResearchResult: false, canUseFindings: false, canExecuteHermes: false, canRunHermesScripts: false, canUseNetwork: false, canUseCredentials: false, canCallModels: false, canMutateProjectFiles: false, canDeploy: false, recommendedNextStep: NEXT }; }
function commandArgs(r) { return r.commandResults?.[0]?.args || []; }
function boundaryViolation(r) { return r.networkStatus !== 'not_allowed' || r.credentialsStatus !== 'not_allowed' || r.modelCallStatus !== 'not_allowed' || r.pipStatus !== 'not_executed' || r.pythonDirectStatus !== 'not_executed' || r.setupPyDirectStatus !== 'not_executed' || r.uvStatus !== 'not_executed' || r.canUseNetwork !== false || r.canUseCredentials !== false || r.canCallModels !== false; }
function evaluate(input) {
  const r = input.researchRuntimeAdapterRetryResult;
  const out = base(input, r);
  if (!r) return { ...out, blockers: [{ blockerId: 'blocked_missing_adapter_retry_result', message: 'Research runtime adapter retry result is required.' }] };
  if (r.canTreatAsResearchResult !== false || r.canUseFindings !== false) return { ...out, decision: 'blocked_help_probe_claims_research_result', blockers: [{ blockerId: 'blocked_help_probe_claims_research_result', message: 'Help probe cannot claim research findings.' }] };
  if (JSON.stringify(commandArgs(r)) !== JSON.stringify(['--help']) || r.commandResults?.[0]?.shell !== false) return { ...out, decision: 'blocked_unexpected_hermes_args', blockers: [{ blockerId: 'blocked_unexpected_hermes_args', message: 'Adapter retry command must be exactly hermes --help with shell:false.' }] };
  if (r.commandName !== 'hermes' || r.pythonEntrypoint !== 'hermes_cli.main:main' || !String(r.executableRef || '').endsWith('python-env/Scripts/hermes.exe') || r.canProceedToResearchResultIngestionV2 !== true) return { ...out, decision: 'blocked_adapter_retry_not_ingestable', blockers: [{ blockerId: 'blocked_adapter_retry_not_ingestable', message: 'Adapter retry result identity is not ingestable.' }] };
  if (boundaryViolation(r)) return { ...out, classification: 'boundary_violation', decision: 'blocked_boundary_violation_detected', blockers: [{ blockerId: 'blocked_boundary_violation_detected', message: 'Adapter retry result violates the safety boundary.' }] };
  const controlledFailure = r.status === 'controlled_failure';
  if (r.decision !== 'hermes_research_runtime_adapter_retry_help_probe_succeeded' && !controlledFailure) return { ...out, decision: 'blocked_adapter_retry_not_ingestable', blockers: [{ blockerId: 'blocked_adapter_retry_not_ingestable', message: 'Adapter retry result is neither success nor controlled failure.' }] };
  const classification = controlledFailure ? 'controlled_help_probe_failure' : 'controlled_help_probe_success';
  const normalizedOutcome = controlledFailure ? 'hermes_help_probe_failed_controlled' : 'hermes_help_probe_succeeded';
  const decision = controlledFailure ? 'hermes_research_result_ingested_help_probe_controlled_failure' : 'hermes_research_result_ingested_help_probe_success';
  const id = out.ingestionId;
  const receipt = { receiptId: `${id}:receipt`, ingestionId: id, toolId: 'hermes_agent', ingestedBy: input.ingestedBy, ingestedAt: input.ingestedAt, retryDecision: r.decision, helpProbeStatus: r.helpProbeStatus, classification, normalizedOutcome, decision, scope: 'hermes_research_result_ingestion_v2_help_probe_only', approvedNextGate: 'Factory Hermes Research JEFE Review Gate v2', limitations: ['Help output is operational health evidence only.', 'Help output is not a research result and cannot be used as findings.', 'No Hermes execution, retry, network, credentials, model calls, uv, pip, Python or setup.py are authorized by ingestion.'], notAuthorizedActions };
  const record = { recordId: `${id}:record`, ingestionId: id, toolId: 'hermes_agent', commandName: 'hermes', pythonEntrypoint: 'hermes_cli.main:main', executableRef: r.executableRef, executableSha256: r.executableSha256 || '', retryResultRef, retryManifestRef, retryDecision: r.decision, helpProbeStatus: r.helpProbeStatus, exitCode: r.exitCode, timedOut: Boolean(r.timedOut), classification, normalizedOutcome, normalizedMessage: 'Hermes entrypoint help probe succeeded. Output is operational health evidence only and must not be treated as research findings.', evidence: { commandArgs: ['--help'], shell: false, stdoutPreviewStatus: typeof r.stdoutPreview === 'string' ? 'sanitized_preview_present' : 'not_present', stderrPreviewStatus: typeof r.stderrPreview === 'string' ? 'sanitized_preview_present' : 'not_present', outputSanitized: true, stdoutTruncated: Boolean(r.stdoutTruncated), stderrTruncated: Boolean(r.stderrTruncated) }, safetyObservations, suggestedNextActions: ['Factory Hermes Research JEFE Review Gate v2'], canProceedToResearchJefeReviewV2: true, canTreatAsResearchResult: false, canUseFindings: false };
  return { ...out, classification, normalizedOutcome, status: 'ingested', decision, researchResultIngestionV2Receipt: receipt, hermesResearchResultIngestionV2Record: record, canProceedToResearchJefeReviewV2: true };
}
async function executeFactoryHermesResearchResultIngestionV2(input = {}) {
  const paths = resolveFactoryHermesResearchResultIngestionV2Paths();
  for (const p of [paths.retryResult, paths.retryManifest, paths.entrypointVerificationResult, paths.boundaryResult, paths.approvalResult, paths.interfaceSelectionResult, paths.ingestionV2Result]) assertResearchResultIngestionV2PathContained(p, paths.installRoot);
  const ingestedAt = input.ingestedAt || '2026-07-22T05:30:00.000Z';
  const ingestedBy = input.ingestedBy || 'factory-hermes-research-result-ingestion-v2-smoke';
  let retryResult;
  try {
    retryResult = input.researchRuntimeAdapterRetryResult || await readJson(paths.retryResult);
    const retryManifest = input.researchRuntimeAdapterRetryManifest || await readJson(paths.retryManifest);
    const verification = input.entrypointMaterializationVerificationResult || await readJson(paths.entrypointVerificationResult);
    await readJson(paths.boundaryResult); await readJson(paths.approvalResult); await readJson(paths.interfaceSelectionResult);
    if (retryManifest.manifestKind !== 'factory-hermes-research-runtime-adapter-retry-manifest' || retryManifest.commandSummary?.shell !== false || JSON.stringify(retryManifest.commandSummary?.args) !== JSON.stringify(['--help']) || retryManifest.nextRequiredGate !== 'Factory Hermes Research Result Ingestion Gate v2') throw new Error('retry manifest is not ingestable');
    if (!['verified', 'warning_verified'].includes(verification.status) || verification.decision !== 'hermes_entrypoint_materialization_verified_for_research_runtime_adapter_retry') throw new Error('entrypoint verification is not ingestable');
  } catch (error) {
    const result = { ...base({ ingestedAt, ingestedBy }, retryResult), decision: 'blocked_missing_adapter_retry_result', blockers: [{ blockerId: 'blocked_missing_adapter_retry_result', message: String(error.message || error) }] };
    await fs.writeFile(paths.ingestionV2Result, `${JSON.stringify(result, null, 2)}\n`);
    return result;
  }
  const result = evaluate({ ingestedAt, ingestedBy, researchRuntimeAdapterRetryResult: retryResult });
  await fs.writeFile(paths.ingestionV2Result, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
module.exports = { executeFactoryHermesResearchResultIngestionV2, evaluateFactoryHermesResearchResultIngestionV2: evaluate, resolveFactoryHermesResearchResultIngestionV2Paths };
