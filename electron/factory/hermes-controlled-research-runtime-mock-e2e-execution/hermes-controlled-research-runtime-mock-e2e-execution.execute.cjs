const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { buildMockResearchRuntimeResult } = require('../controlled-research-runtime-mock-adapter/index.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}
function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex').toUpperCase();
}
async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function executeFactoryHermesControlledResearchRuntimeMockE2EExecution(input = {}) {
  const repoRoot = process.cwd();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const mockRoot = path.join(installRoot, 'mock-e2e');
  const resultArtifact = path.join(installRoot, 'controlled-research-runtime-mock-e2e-execution-result.json');
  const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-mock-e2e-execution', 'index.ts')).href);
  const [mockE2EApprovalResult, mockE2EPlanningResult, alternateSafeRuntimeVerificationResult, implementationResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(path.join(installRoot, 'controlled-research-runtime-mock-e2e-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-mock-e2e-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-verification-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-implementation-result.json')),
    readJson(path.join(installRoot, 'runtime-selection-decision-result.json')),
  ]);

  const promptBody = 'Generate a deterministic mock research response for testing the controlled research runtime pipeline. Do not use tools. Do not claim real provider access.';
  const promptHash = hashText(promptBody);
  const mockPromptArtifact = { artifactId: 'mock-prompt-artifact:75b300f:v1', artifactKind: 'mock_prompt_artifact', artifactVersion: 'v1', promptRef: 'mock-e2e/MOCK_PROMPT_ARTIFACT.json', promptHash, safeSummary: 'Synthetic deterministic mock prompt for controlled runtime pipeline testing.', promptBody, containsSecrets: false, requestsTools: false, syntheticDataOnly: true, providerPrompt: false, allowedForMockOnly: true, createdFor: 'mock_e2e_execution_only' };
  const mockOutputContract = { artifactId: 'mock-output-contract:75b300f:v1', artifactKind: 'mock_output_contract', artifactVersion: 'v1', schema: { mock: 'literal_true', realResearch: 'literal_false', summary: 'bounded_string', evidence: 'bounded_array', noToolEvidence: 'object', limitations: 'bounded_array', findingsUseApprovedNow: 'literal_false' }, boundedOutput: true, maxBytes: 4096, requires: ['mock', 'realResearch', 'summary', 'evidence', 'noToolEvidence', 'limitations', 'findingsUseApprovedNow'], forbids: ['secrets', 'tool metadata', 'real provider execution claims', 'raw credentials', 'unbounded strings', 'findings promotion'], findingsUseApprovedNow: false };
  const noToolPolicy = { toolsAllowed: false, toolRegistryAllowed: false, mcpAllowed: false, functionDeclarationsAllowed: false, toolChoiceAllowed: false };
  const mockE2EInput = { artifactId: 'mock-e2e-input:75b300f:v1', artifactKind: 'mock_e2e_input', artifactVersion: 'v1', promptArtifactRef: 'mock-e2e/MOCK_PROMPT_ARTIFACT.json', outputContractRef: 'mock-e2e/MOCK_OUTPUT_CONTRACT.json', mockRuntimeRef: 'src/factory/controlled-research-runtime-mock-adapter/index.ts', sharedContractsRef: 'src/factory/controlled-research-runtime-contracts/index.ts', promptArtifact: { ref: 'mock_prompt_artifact', path: 'mock-e2e/MOCK_PROMPT_ARTIFACT.json', hash: promptHash, safeSummary: 'Synthetic deterministic mock prompt for controlled runtime pipeline testing.' }, outputContract: { schema: mockOutputContract.schema, boundedOutput: true, maxBytes: 4096 }, noToolPolicy, timeoutPolicy: { maxRuntimeMs: 30000 }, outputBoundsPolicy: { maxBytes: 4096, findingsBlockedByDefault: true }, redactionPolicy: { enabled: true, secretPatternsBlocked: true }, findingsBlocked: true, providerRuntimeAllowed: false, credentialAccessAllowed: false, networkAllowed: false, processEnvReadAllowed: false, modelCallsAllowed: false };
  const mockRuntimeResult = buildMockResearchRuntimeResult(mockE2EInput);
  const rawOutput = { artifactId: 'mock-e2e-output-raw:75b300f:v1', artifactKind: 'mock_e2e_output_raw', mock: true, realResearch: false, deterministic: true, generatedBy: 'controlled-research-runtime-mock-adapter', output: mockRuntimeResult.output, noToolEvidence: { ...noToolPolicy, noToolEvidencePresent: true, toolCallsInOutput: false, toolMetadataInOutput: false }, findingsUseApprovedNow: false, rawOutputPromotedToFindings: false };
  const redactedOutput = { ...rawOutput, artifactId: 'mock-e2e-output-redacted:75b300f:v1', artifactKind: 'mock_e2e_output_redacted', redacted: true, containsSecrets: false, containsCredentials: false, containsEnv: false, containsProviderData: false, findingsUseApprovedNow: false };
  const audit = { artifactId: 'mock-e2e-audit:75b300f:v1', artifactKind: 'mock_e2e_audit', mockExecutionBoundary: true, providerRuntimeExecuted: false, credentialsRead: false, processEnvRead: false, dotEnvRead: false, networkUsed: false, dnsResolved: false, modelCalls: false, promptSentToProvider: false, toolsEnabled: false, outputIngestion: false, findingsPromoted: false, artifactRefs: ['MOCK_PROMPT_ARTIFACT.json', 'MOCK_OUTPUT_CONTRACT.json', 'MOCK_E2E_INPUT.json', 'MOCK_E2E_OUTPUT_RAW.json', 'MOCK_E2E_OUTPUT_REDACTED.json'], promptHash };
  const reviewCandidate = { artifactId: 'mock-e2e-review-candidate:75b300f:v1', artifactKind: 'mock_e2e_review_candidate', inputRef: 'mock-e2e/MOCK_E2E_INPUT.json', rawOutputRef: 'mock-e2e/MOCK_E2E_OUTPUT_RAW.json', redactedOutputRef: 'mock-e2e/MOCK_E2E_OUTPUT_REDACTED.json', auditRef: 'mock-e2e/MOCK_E2E_AUDIT.json', schemaValidationResult: { ok: mockRuntimeResult.ok === true }, redactionResult: { redacted: true, containsSecrets: false }, noToolEvidence: rawOutput.noToolEvidence, mockOutputIsRealResearch: false, findingsUseApprovedNow: false, recommendation: 'ready_for_mock_e2e_review' };

  await writeJson(path.join(mockRoot, 'MOCK_PROMPT_ARTIFACT.json'), mockPromptArtifact);
  await writeJson(path.join(mockRoot, 'MOCK_OUTPUT_CONTRACT.json'), mockOutputContract);
  await writeJson(path.join(mockRoot, 'MOCK_E2E_INPUT.json'), mockE2EInput);
  await writeJson(path.join(mockRoot, 'MOCK_E2E_OUTPUT_RAW.json'), rawOutput);
  await writeJson(path.join(mockRoot, 'MOCK_E2E_OUTPUT_REDACTED.json'), redactedOutput);
  await writeJson(path.join(mockRoot, 'MOCK_E2E_AUDIT.json'), audit);
  await writeJson(path.join(mockRoot, 'MOCK_E2E_REVIEW_CANDIDATE.json'), reviewCandidate);

  const result = gate.evaluateFactoryHermesControlledResearchRuntimeMockE2EExecution({ executedAt: input.executedAt || '2026-07-27T00:00:00.000Z', executedBy: input.executedBy || 'factory-hermes-controlled-research-runtime-mock-e2e-execution-smoke', mockE2EApprovalResult, mockE2EPlanningResult, alternateSafeRuntimeVerificationResult, implementationResult, runtimeSelectionDecisionResult, mockRuntimeResult, artifacts: { mockPromptArtifact, mockOutputContract, mockE2EInput, rawOutput, redactedOutput, audit, reviewCandidate } });
  await writeJson(resultArtifact, result);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeMockE2EExecution };
