const crypto = require('node:crypto');
const fsSync = require('node:fs');
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
function redact(text, credential) {
  let value = String(text || '');
  if (credential) value = value.replaceAll(credential, '[REDACTED_CREDENTIAL]');
  return value.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, 'Bearer [REDACTED]').slice(0, maxRawChars);
}
function scanToolMetadata(text) { return /tool_calls|function_call|tool_choice|mcp|browser tool|shell tool|file tool/i.test(String(text || '')); }
function hasForbiddenAccessClaim(parsed) {
  return parsed?.noToolEvidence?.toolsRequested !== false
    || parsed?.noToolEvidence?.toolsUsed !== false
    || parsed?.noToolEvidence?.toolChoiceUsed !== false
    || parsed?.noToolEvidence?.functionsDeclared !== false
    || parsed?.noToolEvidence?.mcpUsed !== false
    || parsed?.noToolEvidence?.browsingClaimed !== false
    || parsed?.noToolEvidence?.externalAccessClaimed !== false;
}
function boundedString(value, limit = 1200) { return typeof value === 'string' && value.length > 0 && value.length <= limit; }
function parseAssistantJson(responseJson) {
  const content = responseJson?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') return { ok: false, parsed: null, content: '' };
  try { const parsed = JSON.parse(content); return { ok: parsed && typeof parsed === 'object' && !Array.isArray(parsed), parsed, content }; } catch { return { ok: false, parsed: null, content }; }
}
function validateContract(parsed) {
  const errors = [];
  const boolFalsePaths = [
    ['noToolEvidence', 'toolsRequested'], ['noToolEvidence', 'toolsUsed'], ['noToolEvidence', 'toolChoiceUsed'],
    ['noToolEvidence', 'functionsDeclared'], ['noToolEvidence', 'mcpUsed'], ['noToolEvidence', 'browsingClaimed'],
    ['noToolEvidence', 'externalAccessClaimed'], ['safety', 'containsSecrets'], ['safety', 'containsCredentials'],
    ['safety', 'credentialIncluded'], ['safety', 'outputIngestionApprovedNow'], ['safety', 'findingsUseApprovedNow']
  ];
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) errors.push('output_not_json_object');
  if (parsed?.runKind !== 'provider_direct_retry_controlled_runtime_test') errors.push('runKind_mismatch');
  if (parsed?.provider !== selectedProvider) errors.push('provider_mismatch');
  if (parsed?.model !== selectedModel) errors.push('model_mismatch');
  if (parsed?.mock !== false) errors.push('mock_not_false');
  if (parsed?.realResearchCandidate !== true) errors.push('realResearchCandidate_not_true');
  if (!boundedString(parsed?.summary)) errors.push('summary_missing_or_unbounded');
  if (!Array.isArray(parsed?.evidence) || parsed.evidence.length < 1 || parsed.evidence.length > 5) errors.push('evidence_missing_or_unbounded');
  if (!Array.isArray(parsed?.limitations) || parsed.limitations.length < 1 || parsed.limitations.length > 6) errors.push('limitations_missing_or_unbounded');
  if (!parsed?.noToolEvidence || typeof parsed.noToolEvidence !== 'object') errors.push('noToolEvidence_missing');
  if (!parsed?.safety || typeof parsed.safety !== 'object') errors.push('safety_missing');
  for (const [parent, key] of boolFalsePaths) if (parsed?.[parent]?.[key] !== false) errors.push(`${parent}.${key}_not_false`);
  if (parsed?.rawOutputPromotedToFindings !== false) errors.push('rawOutputPromotedToFindings_not_false');
  if (parsed?.outputIngestionApprovedNow !== false) errors.push('outputIngestionApprovedNow_not_false');
  if (parsed?.findingsUseApprovedNow !== false) errors.push('findingsUseApprovedNow_not_false');
  if (hasForbiddenAccessClaim(parsed) || scanToolMetadata(JSON.stringify(parsed || {}))) errors.push('tool_or_external_claim_detected');
  return { valid: errors.length === 0, errors, requiredFieldsPresent: errors.length === 0 };
}
async function packageHashesIntact(repoRoot) {
  const packageJson = crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, 'package.json'))).digest('hex').toUpperCase();
  const packageLock = crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, 'package-lock.json'))).digest('hex').toUpperCase();
  return packageJson === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
    && packageLock === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303';
}

async function executeFactoryHermesControlledResearchRuntimeProviderRuntimeRetryExecution(input = {}) {
  const repoRoot = process.cwd();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const providerRoot = path.join(installRoot, 'provider-runtime-retry');
  const resultPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-execution-result.json');
  const rawOutputPath = path.join(providerRoot, 'PROVIDER_RETRY_OUTPUT_RAW.json');
  const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-provider-runtime-retry-execution', 'index.ts')).href);
  const executedAt = input.executedAt || new Date().toISOString();
  const executionId = `hermes-controlled-research-runtime-provider-runtime-retry-execution:75b300f:${executedAt}`;
  const existingArtifacts = fsSync.existsSync(resultPath) || fsSync.existsSync(rawOutputPath);
  const [retryApproval, retryPlanning, retryReview, firstExecution, executionApproval, executionPlanning, providerApproval, providerPlanning, runtimeSelection] = await Promise.all([
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-review-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-planning-result.json')),
    readJson(path.join(installRoot, 'runtime-selection-decision-result.json')),
  ]);
  const approvalOk = retryApproval?.status === 'controlled_research_runtime_provider_runtime_retry_approval_granted'
    && retryApproval?.decision === 'factory_owned_provider_direct_runtime_retry_approved_for_execution_gate'
    && retryApproval?.providerRuntimeRetryApprovalStatus === 'approved_for_provider_runtime_retry_execution_gate_only'
    && retryApproval?.providerRuntimeRetryExecutionGateAllowed === true
    && retryApproval?.selectedProvider === selectedProvider
    && retryApproval?.selectedModel === selectedModel
    && retryApproval?.selectedCredentialRef === selectedCredentialRef
    && retryApproval?.selectedHost === selectedHost
    && retryApproval?.canProceedToProviderRuntimeRetryExecution === true
    && retryApproval?.outputIngestionApprovedNow === false
    && retryApproval?.findingsUseApprovedNow === false
    && retryPlanning?.status === 'controlled_research_runtime_provider_runtime_retry_plan_created'
    && retryPlanning?.decision === 'factory_owned_provider_direct_runtime_retry_plan_created_for_approval'
    && retryPlanning?.providerRuntimeRetryPlanningStatus === 'plan_candidate_created'
    && retryReview?.status === 'controlled_research_runtime_provider_runtime_review_completed'
    && retryReview?.decision === 'factory_owned_provider_direct_runtime_review_accepted_invalid_output_for_retry_planning'
    && firstExecution?.status === 'controlled_research_runtime_provider_runtime_execution_failed'
    && runtimeSelection?.selectedProvider?.providerId === selectedProvider
    && runtimeSelection?.selectedModel?.modelId === selectedModel
    && runtimeSelection?.selectedCredentialRef?.credentialRefName === selectedCredentialRef
    && runtimeSelection?.selectedNetworkHosts?.selectedHosts?.[0] === selectedHost;
  const promptBody = `Return exactly one valid JSON object and nothing else. Do not include markdown. Do not browse. Do not use tools. Do not claim external access. Do not include secrets. Use only this prompt.

The JSON object must match this exact shape and include every field:

{
  "runKind": "provider_direct_retry_controlled_runtime_test",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "mock": false,
  "realResearchCandidate": true,
  "summary": "Controlled retry runtime response using only the prompt.",
  "evidence": [
    {
      "label": "input_scope",
      "value": "Synthetic retry prompt only; no browsing or tools."
    }
  ],
  "limitations": [
    "No browsing.",
    "No tools.",
    "No external access.",
    "Not approved for findings."
  ],
  "noToolEvidence": {
    "toolsRequested": false,
    "toolsUsed": false,
    "toolChoiceUsed": false,
    "functionsDeclared": false,
    "mcpUsed": false,
    "browsingClaimed": false,
    "externalAccessClaimed": false
  },
  "safety": {
    "containsSecrets": false,
    "containsCredentials": false,
    "credentialIncluded": false,
    "outputIngestionApprovedNow": false,
    "findingsUseApprovedNow": false
  },
  "rawOutputPromotedToFindings": false,
  "outputIngestionApprovedNow": false,
  "findingsUseApprovedNow": false
}`;
  const promptArtifact = await writeJson(path.join(providerRoot, 'PROVIDER_RETRY_PROMPT_ARTIFACT.json'), { artifactId: `${executionId}:retry-prompt`, artifactKind: 'provider_retry_prompt_artifact', artifactVersion: 'v1', promptRef: 'provider-runtime-retry/PROVIDER_RETRY_PROMPT_ARTIFACT.json', promptHash: sha256(promptBody), safeSummary: 'Synthetic bounded retry prompt with exact JSON skeleton.', promptBody, containsSecrets: false, requestsTools: false, syntheticDataOnly: true, providerPrompt: true, retryPrompt: true, outputIngestionApprovedNow: false, findingsUseApprovedNow: false });
  const outputContract = await writeJson(path.join(providerRoot, 'PROVIDER_RETRY_OUTPUT_CONTRACT.json'), { artifactId: `${executionId}:retry-output-contract`, artifactKind: 'provider_retry_output_contract', artifactVersion: 'v1', outputContractRef: 'provider-runtime-retry/PROVIDER_RETRY_OUTPUT_CONTRACT.json', requiredFields: ['runKind', 'provider', 'model', 'mock', 'realResearchCandidate', 'summary', 'evidence', 'limitations', 'noToolEvidence', 'safety', 'rawOutputPromotedToFindings', 'outputIngestionApprovedNow', 'findingsUseApprovedNow'], expected: { runKind: 'provider_direct_retry_controlled_runtime_test', provider: selectedProvider, model: selectedModel, mock: false, realResearchCandidate: true, rawOutputPromotedToFindings: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false }, alignedToPromptSkeleton: true, forbidsSecrets: true, forbidsToolMetadata: true, forbidsBrowsingClaims: true, forbidsFindingsPromotion: true });
  const runtimeInput = await writeJson(path.join(providerRoot, 'PROVIDER_RETRY_RUNTIME_INPUT.json'), { artifactId: `${executionId}:retry-runtime-input`, promptArtifactRef: 'provider-runtime-retry/PROVIDER_RETRY_PROMPT_ARTIFACT.json', outputContractRef: 'provider-runtime-retry/PROVIDER_RETRY_OUTPUT_CONTRACT.json', provider: selectedProvider, model: selectedModel, host: selectedHost, credentialRef: selectedCredentialRef, retryAttempt: 1, maxRequests: 1, noToolPolicy: { toolsAllowed: false, toolRegistryAllowed: false, mcpAllowed: false, functionDeclarationsAllowed: false, toolChoiceAllowed: false }, timeoutPolicy: { maxRuntimeMs, noRetry: true, streamingAllowed: false }, outputBoundsPolicy: { maxRawChars, maxTokens: 900 }, outputIngestionApprovedNow: false, findingsUseApprovedNow: false });
  const requestEnvelope = await writeJson(path.join(providerRoot, 'PROVIDER_RETRY_REQUEST_ENVELOPE_REDACTED.json'), { artifactId: `${executionId}:retry-request-envelope-redacted`, endpoint, method: 'POST', provider: selectedProvider, model: selectedModel, host: selectedHost, credentialRef: selectedCredentialRef, credentialValueIncluded: false, authorizationHeader: 'Bearer [REDACTED]', promptArtifactRef: 'provider-runtime-retry/PROVIDER_RETRY_PROMPT_ARTIFACT.json', outputContractRef: 'provider-runtime-retry/PROVIDER_RETRY_OUTPUT_CONTRACT.json', requestBodyRedacted: { model: selectedModel, temperature: 0, max_tokens: 900, response_format: { type: 'json_object' }, messages: '[REDACTED_BOUNDED_RETRY_PROMPT_MESSAGES]' }, toolsIncluded: false, toolChoiceIncluded: false, functionsIncluded: false, mcpIncluded: false, streamingUsed: false, maxRequests: 1, outputIngestionApprovedNow: false, findingsUseApprovedNow: false });
  let credential = '';
  let credentialRead = false;
  let outcome = existingArtifacts ? 'blocked_existing_retry_execution_artifacts' : approvalOk ? 'failed' : 'blocked_invalid_approval';
  let failureReason = existingArtifacts ? 'existing_retry_execution_artifacts' : approvalOk ? '' : 'retry_approval_validation_failed';
  let responseJson = null;
  let rawResponseBody = '';
  let httpStatus = null;
  let providerCallSucceeded = false;
  let requestAttempted = false;
  const credentialAccess = { credentialReadFromProcessEnv: false, credentialPresent: false, credentialValuePersisted: false, credentialValueLogged: false, credentialValueWrittenToArtifacts: false, dotEnvRead: false, dotenvUsed: false, envDumped: false };
  if (!existingArtifacts && approvalOk) {
    credentialRead = true;
    credential = process.env.OPENAI_API_KEY || '';
    credentialAccess.credentialReadFromProcessEnv = true;
    credentialAccess.credentialPresent = credential.length > 0;
    if (!credential) { outcome = 'blocked_missing_credential'; failureReason = 'OPENAI_API_KEY missing or empty'; }
  }
  const requestBody = { model: selectedModel, temperature: 0, max_tokens: 900, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are running a controlled provider-direct retry runtime smoke test. Return exactly one valid JSON object and nothing else. Do not browse. Do not use tools. Do not claim external access. Do not include secrets.' }, { role: 'user', content: `${promptBody}\n\nOutput contract summary: exact JSON object only, no markdown, no tools, no browsing, no external access claims, no secrets, no findings promotion.` }] };
  if (!existingArtifacts && approvalOk && credential) {
    if (new URL(endpoint).host !== selectedHost) throw new Error('retry_endpoint_host_not_allowlisted');
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
  const noToolEvidence = { present: true, toolsRequested: false, toolsDeclared: false, toolCallsInResponse: Boolean(responseJson?.choices?.[0]?.message?.tool_calls), functionCallInResponse: Boolean(responseJson?.choices?.[0]?.message?.function_call), toolMetadataFound: scanToolMetadata(redactedRaw) || scanToolMetadata(assistant.content), mcpBrowserFileShellClaims: hasForbiddenAccessClaim(assistant.parsed), outputIngestionBlockedIfToolEvidenceFails: true, findingsBlockedIfToolEvidenceFails: true };
  const containsCredential = Boolean(credential && redactedRaw.includes(credential));
  const rawOutput = await writeJson(rawOutputPath, { artifactId: `${executionId}:retry-raw-output`, created: true, provider: selectedProvider, model: selectedModel, httpStatus, rawResponseBody: redactedRaw, providerMetadataRedacted: true, credentialIncluded: false, authorizationHeaderIncluded: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, rawOutputPromotedToFindings: false });
  const redactedOutput = await writeJson(path.join(providerRoot, 'PROVIDER_RETRY_OUTPUT_REDACTED.json'), { artifactId: `${executionId}:retry-redacted-output`, created: true, redacted: true, containsSecrets: containsCredential, providerResponseWasJson: assistant.ok, parsedJson: assistant.parsed, schemaValidationResult: validation, noToolEvidenceScan: noToolEvidence, outputIngestionApprovedNow: false, findingsUseApprovedNow: false });
  const ingestionBlock = { outputIngestionApprovedNow: false, rawOutputPromotedToFindings: false, redactedOutputPromotedToFindings: false, blockedUntilProviderRuntimeRetryReview: true };
  const findingsBlock = { findingsUseApprovedNow: false, findingsPromoted: false, blockedUntilOutputIngestionReviewAndFindingsReview: true };
  const audit = await writeJson(path.join(providerRoot, 'PROVIDER_RETRY_AUDIT.json'), { artifactId: `${executionId}:retry-audit`, provider: selectedProvider, model: selectedModel, host: selectedHost, credentialRef: selectedCredentialRef, credentialValuePersisted: false, credentialValueLogged: false, credentialValueWrittenToArtifacts: false, dotEnvRead: false, processEnvRead: credentialRead, processEnvReadKey: selectedCredentialRef, networkUsed: requestAttempted, dnsResolved: requestAttempted, endpoint: selectedHost, modelCallExecuted: providerCallSucceeded, retryAttempt: 1, maxRequests: 1, timeoutFailureState: failureReason || 'none', outputRefs: { rawOutputRef: 'provider-runtime-retry/PROVIDER_RETRY_OUTPUT_RAW.json', redactedOutputRef: 'provider-runtime-retry/PROVIDER_RETRY_OUTPUT_REDACTED.json' }, secretScanResult: { containsCredential, containsSecrets: containsCredential }, noToolScanResult: noToolEvidence, outputIngestionApprovedNow: false, findingsUseApprovedNow: false });
  const reviewCandidate = await writeJson(path.join(providerRoot, 'PROVIDER_RETRY_REVIEW_CANDIDATE.json'), { artifactId: `${executionId}:retry-review-candidate`, inputRef: 'provider-runtime-retry/PROVIDER_RETRY_RUNTIME_INPUT.json', requestEnvelopeRedactedRef: 'provider-runtime-retry/PROVIDER_RETRY_REQUEST_ENVELOPE_REDACTED.json', rawOutputRef: 'provider-runtime-retry/PROVIDER_RETRY_OUTPUT_RAW.json', redactedOutputRef: 'provider-runtime-retry/PROVIDER_RETRY_OUTPUT_REDACTED.json', auditRef: 'provider-runtime-retry/PROVIDER_RETRY_AUDIT.json', schemaValidationResult: validation, noToolEvidence, secretScanResult: audit.secretScanResult, providerRuntimeRetryExecuted: outcome === 'completed' && validation.valid, providerRetryOutputSchemaValid: validation.valid, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, recommendation: 'ready_for_provider_runtime_retry_review' });
  const safety = { providerRuntimeRetryExecutedNow: outcome === 'completed' && validation.valid, providerRuntimeRetrySingleRequestExecuted: requestAttempted, retryAttempt: 1, maxRequests: 1, realResearchCandidateGenerated: providerCallSucceeded, hermesCliRuntimeBlocked: true, hermesExecuted: false, wrapperExecutedAgainstHermes: false, credentialReadFromProcessEnv: credentialRead, credentialValuePersisted: false, credentialValueLogged: false, credentialValueWrittenToArtifacts: false, dotEnvRead: false, envDumped: false, networkUsed: requestAttempted, dnsResolved: requestAttempted, endpointTests: false, modelCallsMade: providerCallSucceeded, promptSentToProvider: requestAttempted, toolsEnabled: false, toolChoiceUsed: false, functionsDeclared: false, outputIngested: false, findingsPromoted: false, packageHashesIntact: await packageHashesIntact(repoRoot), providerRuntimeRetryReviewRequired: true, outputIngestionStillBlocked: true, findingsStillBlocked: true };
  const reviewEnvelope = { envelopeId: `${executionId}:provider-runtime-retry-review-envelope`, toolId: 'factory_controlled_research_runtime', approvedFor: 'controlled_research_runtime_provider_runtime_retry_review_only', selectedProvider, selectedModel, selectedCredentialRef, selectedHost, sourceProviderRuntimeRetryExecutionRef: 'controlled-research-runtime-provider-runtime-retry-execution-result.json', sourceProviderRuntimeRetryApprovalRef: 'controlled-research-runtime-provider-runtime-retry-approval-result.json', sourceProviderRuntimeReviewRef: 'controlled-research-runtime-provider-runtime-review-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Provider Runtime Retry Review Gate v1', purpose: 'review second provider-direct retry output and decide whether output ingestion planning may proceed while findings remain blocked', allowedInNextGate: ['read retry execution result', 'read retry provider runtime artifacts', 'review retry prompt artifact', 'review retry output contract', 'review redacted request envelope', 'review raw/redacted output', 'review audit', 'review no-tool evidence', 'review secret scan', 'decide whether output ingestion planning may proceed', 'write ignored review artifact'], forbiddenEvenInNextGate: ['execute provider runtime again', 'call model again', 'use network', 'resolve DNS', 'read credentials', 'read .env', 'read process.env', 'pass prompt to provider', 'enable tools', 'ingest output as findings', 'promote findings', 'unblock Hermes CLI', 'execute Hermes', 'mutate package files', 'modify UI/preload/App', 'run uv/pip/python/setup.py'], flags: { providerRuntimeRetryReviewAllowedNow: true, outputIngestionPlanningAllowedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToProviderRuntimeRetryReview: true, canProceedToOutputIngestionPlanning: false, canProceedToFindingsReview: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Provider Runtime Retry Review Gate v1' };
  const result = gate.buildFactoryHermesControlledResearchRuntimeProviderRuntimeRetryExecutionResult({ executionId, executedAt, executedBy: input.executedBy || 'factory-hermes-controlled-research-runtime-provider-runtime-retry-execution-runtime', outcome, failureReason, providerRuntimeRetryApprovalValidationResult: { valid: approvalOk && !existingArtifacts, retryApprovalPresent: Boolean(retryApproval), errors: approvalOk ? existingArtifacts ? ['existing_retry_execution_artifacts'] : [] : ['retry_approval_invalid_or_not_granted'] }, providerRetryPromptArtifactResult: { created: true, artifactRef: 'provider-runtime-retry/PROVIDER_RETRY_PROMPT_ARTIFACT.json', promptHash: promptArtifact.promptHash, containsSecrets: false, requestsTools: false }, providerRetryOutputContractResult: { created: true, artifactRef: 'provider-runtime-retry/PROVIDER_RETRY_OUTPUT_CONTRACT.json', requiredFields: outputContract.requiredFields }, providerRetryRuntimeInputResult: { created: true, artifactRef: 'provider-runtime-retry/PROVIDER_RETRY_RUNTIME_INPUT.json', provider: selectedProvider, model: selectedModel, host: selectedHost, findingsBlocked: true }, providerRetryRequestEnvelopeRedactedResult: { created: true, artifactRef: 'provider-runtime-retry/PROVIDER_RETRY_REQUEST_ENVELOPE_REDACTED.json', authorizationHeader: requestEnvelope.authorizationHeader, credentialValueIncluded: false }, providerRetryCredentialAccessResult: credentialAccess, providerRetryNetworkModelCallResult: { requestAttempted, providerCallSucceeded, singleRequest: requestAttempted, retryAttempted: false, streamingUsed: false, endpoint, host: selectedHost, model: selectedModel, httpStatus, failureReason }, providerRetryRawOutputResult: { created: Boolean(rawOutput?.created), artifactRef: 'provider-runtime-retry/PROVIDER_RETRY_OUTPUT_RAW.json', outputIngestionApprovedNow: false, findingsUseApprovedNow: false }, providerRetryOutputRedactionResult: { created: Boolean(redactedOutput?.created), artifactRef: 'provider-runtime-retry/PROVIDER_RETRY_OUTPUT_REDACTED.json', redacted: true, containsSecrets: containsCredential }, providerRetryOutputContractValidationResult: validation, providerRetryNoToolEvidenceResult: noToolEvidence, providerRetryOutputIngestionBlockResult: ingestionBlock, providerRetryFindingsBlockResult: findingsBlock, providerRetryRuntimeAuditResult: { created: true, artifactRef: 'provider-runtime-retry/PROVIDER_RETRY_AUDIT.json' }, providerRetryRuntimeReviewCandidateResult: { created: true, artifactRef: 'provider-runtime-retry/PROVIDER_RETRY_REVIEW_CANDIDATE.json', recommendation: reviewCandidate.recommendation }, providerRetryExecutionSafetyManifest: safety, providerRuntimeRetryReviewEnvelope: reviewEnvelope, providerRuntimeRetryExecutionReceipt: { providerRuntimeRetryExecuted: outcome === 'completed' && validation.valid ? true : providerCallSucceeded ? 'partial_attempt_failed' : false, secondRealProviderCallExecuted: requestAttempted, realResearchExecuted: false, hermesExecuted: false, promptSentToProvider: requestAttempted, modelCalls: providerCallSucceeded, networkUsed: requestAttempted, dnsResolved: requestAttempted, endpointsTested: false, credentialReadFromProcessEnv: credentialRead, dotEnvRead: false, credentialValuesRead: credentialRead, credentialValuePersisted: false, credentialValueLogged: false, credentialValueWrittenToArtifacts: false, toolsEnabled: false, outputIngestion: false, findingsPromoted: false } });
  await writeJson(resultPath, result);
  return result;
}

if (require.main === module) {
  executeFactoryHermesControlledResearchRuntimeProviderRuntimeRetryExecution().then((result) => {
    console.log(JSON.stringify({ ok: true, status: result.status, decision: result.decision, providerRuntimeRetryExecutionStatus: result.providerRuntimeRetryExecutionStatus }, null, 2));
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { executeFactoryHermesControlledResearchRuntimeProviderRuntimeRetryExecution };
