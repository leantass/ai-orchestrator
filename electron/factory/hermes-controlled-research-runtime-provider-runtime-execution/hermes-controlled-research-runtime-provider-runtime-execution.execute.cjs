const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const selectedProvider = 'openai';
const selectedModel = 'gpt-4o-mini';
const selectedCredentialRef = 'OPENAI_API_KEY';
const selectedHost = 'api.openai.com';
const endpoint = 'https://api.openai.com/v1/chat/completions';
const maxRuntimeMs = 30000;
const maxRawChars = 24000;
async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
async function writeJson(file, value) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`); return value; }
function sha256(text) { return crypto.createHash('sha256').update(text).digest('hex'); }
function redact(text, credential) { return String(text || '').replaceAll(credential || '__NO_CREDENTIAL__', '[REDACTED_CREDENTIAL]').slice(0, maxRawChars); }
function scanToolClaims(text) { return /tool_calls|function_call|tool_choice|mcp|browser|shell|file tool|external access|browse/i.test(String(text || '')); }
function bounded(value, limit = 1200) { return typeof value === 'string' && value.length > 0 && value.length <= limit; }
function parseAssistantJson(responseJson) {
  const content = responseJson?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') return { ok: false, parsed: null, content: '' };
  try { return { ok: true, parsed: JSON.parse(content), content }; } catch { return { ok: false, parsed: null, content }; }
}
function validateContract(parsed) {
  const errors = [];
  if (!parsed || typeof parsed !== 'object') errors.push('output_not_json_object');
  if (parsed?.runKind !== 'provider_direct_first_controlled_runtime_test') errors.push('runKind_mismatch');
  if (parsed?.provider !== selectedProvider) errors.push('provider_mismatch');
  if (parsed?.model !== selectedModel) errors.push('model_mismatch');
  if (parsed?.mock !== false) errors.push('mock_not_false');
  if (parsed?.realResearchCandidate !== true) errors.push('realResearchCandidate_not_true');
  if (!bounded(parsed?.summary)) errors.push('summary_missing_or_unbounded');
  if (!Array.isArray(parsed?.evidence) || parsed.evidence.length > 5) errors.push('evidence_missing_or_unbounded');
  if (!Array.isArray(parsed?.limitations) || parsed.limitations.length > 5) errors.push('limitations_missing_or_unbounded');
  if (!parsed?.noToolEvidence || typeof parsed.noToolEvidence !== 'object') errors.push('noToolEvidence_missing');
  if (!parsed?.safety || typeof parsed.safety !== 'object') errors.push('safety_missing');
  if (parsed?.rawOutputPromotedToFindings !== false) errors.push('rawOutputPromotedToFindings_not_false');
  if (parsed?.outputIngestionApprovedNow !== false) errors.push('outputIngestionApprovedNow_not_false');
  if (parsed?.findingsUseApprovedNow !== false) errors.push('findingsUseApprovedNow_not_false');
  if (scanToolClaims(JSON.stringify(parsed || {}))) errors.push('tool_or_external_claim_detected');
  return { valid: errors.length === 0, errors, requiredFieldsPresent: errors.length === 0 };
}
async function executeFactoryHermesControlledResearchRuntimeProviderRuntimeExecution(input = {}) {
  const repoRoot = process.cwd();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const providerRoot = path.join(installRoot, 'provider-runtime');
  const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-provider-runtime-execution', 'index.ts')).href);
  const [executionApprovalResult, executionPlanningResult, providerRuntimeApprovalResult, providerRuntimePlanningResult, mockE2EReviewResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-mock-e2e-review-result.json')),
    readJson(path.join(installRoot, 'runtime-selection-decision-result.json')),
  ]);
  const approvalOk = executionApprovalResult?.status === 'controlled_research_runtime_provider_runtime_execution_approval_granted'
    && executionApprovalResult?.decision === 'factory_owned_provider_direct_runtime_execution_approved_for_execution_gate'
    && executionApprovalResult?.providerRuntimeExecutionGateAllowed === true
    && executionApprovalResult?.selectedProvider === selectedProvider
    && executionApprovalResult?.selectedModel === selectedModel
    && executionApprovalResult?.selectedCredentialRef === selectedCredentialRef
    && executionApprovalResult?.selectedHost === selectedHost
    && executionApprovalResult?.canProceedToProviderRuntimeExecution === true
    && executionApprovalResult?.outputIngestionApprovedNow === false
    && executionApprovalResult?.findingsUseApprovedNow === false
    && runtimeSelectionDecisionResult?.selectedProvider?.providerId === selectedProvider
    && runtimeSelectionDecisionResult?.selectedModel?.modelId === selectedModel
    && runtimeSelectionDecisionResult?.selectedCredentialRef?.credentialRefName === selectedCredentialRef
    && runtimeSelectionDecisionResult?.selectedNetworkHosts?.selectedHosts?.[0] === selectedHost;
  const executedAt = input.executedAt || '2026-07-27T00:00:00.000Z';
  const executionId = `hermes-controlled-research-runtime-provider-runtime-execution:75b300f:${executedAt}`;
  const promptBody = 'Generate a compact JSON response for the first controlled provider-direct runtime test. Use only the information in this prompt. Do not browse. Do not use tools. Do not claim external access. Do not include secrets. Return only valid JSON matching the provided contract.';
  const promptArtifact = await writeJson(path.join(providerRoot, 'PROVIDER_PROMPT_ARTIFACT.json'), { artifactId: `${executionId}:prompt`, artifactKind: 'provider_prompt_artifact', artifactVersion: 'v1', promptRef: 'provider-runtime/PROVIDER_PROMPT_ARTIFACT.json', promptHash: sha256(promptBody), safeSummary: 'Synthetic bounded prompt for first provider-direct runtime test.', promptBody, containsSecrets: false, requestsTools: false, syntheticDataOnly: true, providerPrompt: true, allowedForProviderRuntimeOnly: true, createdFor: 'provider_runtime_execution_only' });
  const outputContract = await writeJson(path.join(providerRoot, 'PROVIDER_OUTPUT_CONTRACT.json'), { artifactId: `${executionId}:output-contract`, artifactKind: 'provider_output_contract', artifactVersion: 'v1', requiredFields: ['runKind', 'provider', 'model', 'mock', 'realResearchCandidate', 'summary', 'evidence', 'limitations', 'noToolEvidence', 'safety', 'rawOutputPromotedToFindings', 'outputIngestionApprovedNow', 'findingsUseApprovedNow'], expected: { runKind: 'provider_direct_first_controlled_runtime_test', provider: selectedProvider, model: selectedModel, mock: false, realResearchCandidate: true, rawOutputPromotedToFindings: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false }, boundedFields: true, forbidsSecrets: true, forbidsToolMetadata: true, forbidsBrowsingClaims: true, forbidsFindingsPromotion: true });
  const runtimeInput = await writeJson(path.join(providerRoot, 'PROVIDER_RUNTIME_INPUT.json'), { artifactId: `${executionId}:runtime-input`, promptArtifactRef: 'provider-runtime/PROVIDER_PROMPT_ARTIFACT.json', outputContractRef: 'provider-runtime/PROVIDER_OUTPUT_CONTRACT.json', providerDirectAdapterRef: 'controlled-research-runtime-provider-direct-adapter', sharedContractsRef: 'controlled-research-runtime-contracts', provider: selectedProvider, model: selectedModel, host: selectedHost, credentialRef: selectedCredentialRef, noToolPolicy: { toolsAllowed: false, toolRegistryAllowed: false, mcpAllowed: false, functionDeclarationsAllowed: false, toolChoiceAllowed: false }, timeoutPolicy: { maxRuntimeMs, noRetry: true, streamingAllowed: false }, outputBoundsPolicy: { maxRawChars, maxTokens: 700 }, redactionPolicy: { redactCredential: true, redactAuthorizationHeader: true }, findingsBlocked: true, outputIngestionApprovedNow: false, findingsUseApprovedNow: false });
  const requestEnvelope = await writeJson(path.join(providerRoot, 'PROVIDER_RUNTIME_REQUEST_ENVELOPE_REDACTED.json'), { artifactId: `${executionId}:redacted-request-envelope`, endpoint, method: 'POST', provider: selectedProvider, model: selectedModel, host: selectedHost, credentialRef: selectedCredentialRef, credentialValueIncluded: false, authorizationHeader: '[REDACTED]', promptArtifactRef: 'provider-runtime/PROVIDER_PROMPT_ARTIFACT.json', outputContractRef: 'provider-runtime/PROVIDER_OUTPUT_CONTRACT.json', noToolPolicy: runtimeInput.noToolPolicy, timeoutPolicy: runtimeInput.timeoutPolicy, outputBoundsPolicy: runtimeInput.outputBoundsPolicy, requestBodyRedacted: { model: selectedModel, temperature: 0, max_tokens: 700, response_format: { type: 'json_object' }, messages: '[REDACTED_BOUNDED_PROMPT_MESSAGES]' }, toolsIncluded: false, toolChoiceIncluded: false, functionsIncluded: false, mcpIncluded: false, executableOnlyInsideThisGate: true, findingsUseApprovedNow: false });
  let credential = '';
  let credentialRead = false;
  let outcome = 'failed';
  let failureReason = approvalOk ? '' : 'execution_approval_validation_failed';
  let responseJson = null;
  let rawResponseBody = '';
  let httpStatus = null;
  let providerCallSucceeded = false;
  const credentialAccess = { credentialReadFromProcessEnv: false, credentialPresent: false, credentialLengthObserved: 0, credentialValuePersisted: false, credentialValueLogged: false, credentialValueWrittenToArtifacts: false, dotEnvRead: false, dotenvUsed: false, envDumped: false };
  if (approvalOk) {
    credentialRead = true;
    credential = process.env.OPENAI_API_KEY || '';
    credentialAccess.credentialReadFromProcessEnv = true;
    credentialAccess.credentialPresent = credential.length > 0;
    credentialAccess.credentialLengthObserved = credential.length;
    if (!credential) { outcome = 'blocked_missing_credential'; failureReason = 'OPENAI_API_KEY missing or empty'; }
  }
  const requestBody = { model: selectedModel, temperature: 0, max_tokens: 700, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are running a controlled provider-direct runtime smoke test. Return only valid JSON. Do not browse. Do not use tools. Do not claim external access. Do not include secrets.' }, { role: 'user', content: `${promptBody}\n\nRequired JSON fields: runKind, provider, model, mock, realResearchCandidate, summary, evidence, limitations, noToolEvidence, safety, rawOutputPromotedToFindings, outputIngestionApprovedNow, findingsUseApprovedNow.` }] };
  let requestAttempted = false;
  if (approvalOk && credential) {
    requestAttempted = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), maxRuntimeMs);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${credential}`, 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody), signal: controller.signal });
      httpStatus = response.status;
      providerCallSucceeded = response.ok;
      rawResponseBody = await response.text();
      try { responseJson = JSON.parse(rawResponseBody); } catch { responseJson = { parseError: true, raw: rawResponseBody.slice(0, 2000) }; }
      outcome = response.ok ? 'completed' : 'failed';
      failureReason = response.ok ? '' : `provider_http_status_${response.status}`;
    } catch (error) {
      outcome = 'failed';
      failureReason = error?.name === 'AbortError' ? 'provider_request_timeout' : `provider_request_error:${error?.message || 'unknown'}`;
    } finally {
      clearTimeout(timeout);
    }
  }
  const assistant = parseAssistantJson(responseJson);
  const validation = outcome === 'completed' ? validateContract(assistant.parsed) : { valid: false, errors: [failureReason || 'provider_call_not_completed'], requiredFieldsPresent: false };
  if (outcome === 'completed' && !validation.valid) {
    outcome = 'failed';
    failureReason = `provider_output_contract_invalid:${validation.errors.join(',')}`;
  }
  const redactedRaw = redact(rawResponseBody || JSON.stringify({ status: outcome, failureReason }), credential);
  const rawOutput = await writeJson(path.join(providerRoot, 'PROVIDER_RUNTIME_OUTPUT_RAW.json'), { artifactId: `${executionId}:raw-output`, created: true, provider: selectedProvider, model: selectedModel, httpStatus, rawResponseBody: redactedRaw, providerMetadataRedacted: true, credentialIncluded: false, authorizationHeaderIncluded: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, rawOutputPromotedToFindings: false });
  const noToolEvidence = { present: true, toolsRequested: false, toolsDeclared: false, toolCallsInResponse: Boolean(responseJson?.choices?.[0]?.message?.tool_calls), functionCallInResponse: Boolean(responseJson?.choices?.[0]?.message?.function_call), toolMetadataFound: scanToolClaims(redactedRaw), mcpBrowserFileShellClaims: scanToolClaims(assistant.content), outputIngestionBlockedIfToolEvidenceFails: true, findingsBlockedIfToolEvidenceFails: true };
  const containsCredential = Boolean(credential && redactedRaw.includes(credential));
  const redactedOutput = await writeJson(path.join(providerRoot, 'PROVIDER_RUNTIME_OUTPUT_REDACTED.json'), { artifactId: `${executionId}:redacted-output`, created: true, redacted: true, containsSecrets: containsCredential, providerResponseWasJson: assistant.ok, parsedJson: assistant.parsed, schemaValidationResult: validation, noToolEvidenceScan: noToolEvidence, findingsUseApprovedNow: false });
  const ingestionBlock = { outputIngestionApprovedNow: false, rawOutputPromotedToFindings: false, redactedOutputPromotedToFindings: false, blockedUntilProviderRuntimeReview: true };
  const findingsBlock = { findingsUseApprovedNow: false, findingsPromoted: false, blockedUntilOutputIngestionReviewAndFindingsReview: true };
  const audit = await writeJson(path.join(providerRoot, 'PROVIDER_RUNTIME_AUDIT.json'), { artifactId: `${executionId}:audit`, provider: selectedProvider, model: selectedModel, host: selectedHost, credentialRef: selectedCredentialRef, credentialValuePersisted: false, credentialValueLogged: false, credentialValueWrittenToArtifacts: false, dotEnvRead: false, processEnvRead: credentialRead, processEnvReadKey: selectedCredentialRef, networkUsed: requestAttempted, dnsResolved: requestAttempted, endpoint: selectedHost, modelCallExecuted: providerCallSucceeded, timeoutFailureState: failureReason || 'none', outputRefs: { rawOutputRef: 'provider-runtime/PROVIDER_RUNTIME_OUTPUT_RAW.json', redactedOutputRef: 'provider-runtime/PROVIDER_RUNTIME_OUTPUT_REDACTED.json' }, secretScanResult: { containsCredential, containsSecrets: containsCredential }, noToolScanResult: noToolEvidence, outputIngestionApprovedNow: false, findingsUseApprovedNow: false });
  const reviewCandidate = await writeJson(path.join(providerRoot, 'PROVIDER_RUNTIME_REVIEW_CANDIDATE.json'), { artifactId: `${executionId}:review-candidate`, inputRef: 'provider-runtime/PROVIDER_RUNTIME_INPUT.json', requestEnvelopeRedactedRef: 'provider-runtime/PROVIDER_RUNTIME_REQUEST_ENVELOPE_REDACTED.json', rawOutputRef: 'provider-runtime/PROVIDER_RUNTIME_OUTPUT_RAW.json', redactedOutputRef: 'provider-runtime/PROVIDER_RUNTIME_OUTPUT_REDACTED.json', auditRef: 'provider-runtime/PROVIDER_RUNTIME_AUDIT.json', schemaValidationResult: validation, noToolEvidence, secretScanResult: audit.secretScanResult, providerRuntimeExecuted: outcome === 'completed', outputIngestionApprovedNow: false, findingsUseApprovedNow: false, recommendation: outcome === 'completed' ? 'ready_for_provider_runtime_review' : 'blocked_or_failed_for_provider_runtime_review' });
  const safety = { providerRuntimeExecutedNow: outcome === 'completed', providerRuntimeSingleRequestExecuted: outcome === 'completed', realResearchCandidateGenerated: providerCallSucceeded, hermesCliRuntimeBlocked: true, hermesExecuted: false, wrapperExecutedAgainstHermes: false, credentialReadFromProcessEnv: credentialRead, credentialValuePersisted: false, credentialValueLogged: false, credentialValueWrittenToArtifacts: false, dotEnvRead: false, envDumped: false, networkUsed: requestAttempted, dnsResolved: requestAttempted, endpointTests: false, modelCallsMade: providerCallSucceeded, promptSentToProvider: requestAttempted, toolsEnabled: false, toolChoiceUsed: false, functionsDeclared: false, outputIngested: false, findingsPromoted: false, packageHashesIntact: true, providerRuntimeReviewRequired: true, outputIngestionStillBlocked: true, findingsStillBlocked: true };
  const reviewEnvelope = { envelopeId: `${executionId}:provider-runtime-review-envelope`, toolId: 'factory_controlled_research_runtime', approvedFor: 'controlled_research_runtime_provider_runtime_review_only', selectedProvider, selectedModel, selectedCredentialRef, selectedHost, sourceProviderRuntimeExecutionRef: 'controlled-research-runtime-provider-runtime-execution-result.json', sourceProviderRuntimeExecutionApprovalRef: 'controlled-research-runtime-provider-runtime-execution-approval-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Provider Runtime Review Gate v1', purpose: 'review first provider-direct runtime output and decide whether output ingestion planning may proceed while findings remain blocked', allowedInNextGate: ['read execution result', 'read provider runtime artifacts', 'review prompt artifact', 'review output contract', 'review redacted request envelope', 'review raw/redacted output', 'review audit', 'review no-tool evidence', 'review secret scan', 'decide whether output ingestion planning may proceed', 'write ignored review artifact'], forbiddenEvenInNextGate: ['execute provider runtime again', 'call model again', 'use network', 'resolve DNS', 'read credentials', 'read .env', 'read process.env', 'pass prompt to provider', 'enable tools', 'ingest output as findings', 'promote findings', 'unblock Hermes CLI', 'execute Hermes', 'mutate package files', 'modify UI/preload/App', 'run uv/pip/python/setup.py'], flags: { providerRuntimeReviewAllowedNow: true, outputIngestionPlanningAllowedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToProviderRuntimeReview: true, canProceedToOutputIngestionPlanning: false, canProceedToFindingsReview: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Provider Runtime Review Gate v1' };
  const result = gate.buildFactoryHermesControlledResearchRuntimeProviderRuntimeExecutionResult({ executionId, executedAt, executedBy: input.executedBy || 'factory-hermes-controlled-research-runtime-provider-runtime-execution-smoke', outcome, failureReason, providerRuntimeExecutionApprovalValidationResult: { valid: approvalOk, executionApprovalPresent: Boolean(executionApprovalResult), errors: approvalOk ? [] : ['execution_approval_invalid_or_not_granted'] }, providerPromptArtifactResult: { created: true, artifactRef: 'provider-runtime/PROVIDER_PROMPT_ARTIFACT.json', promptHash: promptArtifact.promptHash, containsSecrets: false, requestsTools: false }, providerOutputContractResult: { created: true, artifactRef: 'provider-runtime/PROVIDER_OUTPUT_CONTRACT.json', requiredFields: outputContract.requiredFields }, providerRuntimeInputResult: { created: true, artifactRef: 'provider-runtime/PROVIDER_RUNTIME_INPUT.json', provider: selectedProvider, model: selectedModel, host: selectedHost, findingsBlocked: true }, providerRequestEnvelopeRedactedResult: { created: true, artifactRef: 'provider-runtime/PROVIDER_RUNTIME_REQUEST_ENVELOPE_REDACTED.json', authorizationHeader: requestEnvelope.authorizationHeader, credentialValueIncluded: false }, providerCredentialAccessResult: credentialAccess, providerNetworkModelCallResult: { requestAttempted, providerCallSucceeded, singleRequest: requestAttempted, retryAttempted: false, streamingUsed: false, endpoint, host: selectedHost, model: selectedModel, httpStatus, failureReason }, providerRawOutputResult: { created: true, artifactRef: 'provider-runtime/PROVIDER_RUNTIME_OUTPUT_RAW.json', outputIngestionApprovedNow: false, findingsUseApprovedNow: false }, providerOutputRedactionResult: { created: true, artifactRef: 'provider-runtime/PROVIDER_RUNTIME_OUTPUT_REDACTED.json', redacted: true, containsSecrets: containsCredential }, providerOutputContractValidationResult: validation, providerNoToolEvidenceResult: noToolEvidence, providerOutputIngestionBlockResult: ingestionBlock, providerFindingsBlockResult: findingsBlock, providerRuntimeAuditResult: { created: true, artifactRef: 'provider-runtime/PROVIDER_RUNTIME_AUDIT.json' }, providerRuntimeReviewCandidateResult: { created: true, artifactRef: 'provider-runtime/PROVIDER_RUNTIME_REVIEW_CANDIDATE.json', recommendation: reviewCandidate.recommendation }, providerRuntimeExecutionSafetyManifest: safety, providerRuntimeReviewEnvelope: reviewEnvelope, providerRuntimeExecutionReceipt: { providerRuntimeExecuted: outcome === 'completed' ? true : providerCallSucceeded ? 'partial_attempt_failed' : false, realResearchExecuted: false, hermesExecuted: false, promptSentToProvider: requestAttempted, modelCalls: providerCallSucceeded, networkUsed: requestAttempted, dnsResolved: requestAttempted, endpointsTested: false, credentialReadFromProcessEnv: credentialRead, dotEnvRead: false, credentialValuesRead: credentialRead, credentialValuePersisted: false, credentialValueLogged: false, credentialValueWrittenToArtifacts: false, toolsEnabled: false, outputIngestion: false, findingsPromoted: false } });
  await writeJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-result.json'), result);
  return result;
}
module.exports = { executeFactoryHermesControlledResearchRuntimeProviderRuntimeExecution };
