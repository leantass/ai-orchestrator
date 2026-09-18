const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}
async function executeFactoryHermesControlledResearchRuntimeMockE2EReview(input = {}) {
  const repoRoot = process.cwd();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const mockRoot = path.join(installRoot, 'mock-e2e');
  const resultArtifact = path.join(installRoot, 'controlled-research-runtime-mock-e2e-review-result.json');
  const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-mock-e2e-review', 'index.ts')).href);
  const [mockE2EExecutionResult, mockE2EApprovalResult, mockE2EPlanningResult, alternateSafeRuntimeVerificationResult, implementationResult, runtimeSelectionDecisionResult, prompt, contract, mockInput, raw, redacted, audit, reviewCandidate] = await Promise.all([
    readJson(path.join(installRoot, 'controlled-research-runtime-mock-e2e-execution-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-mock-e2e-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-mock-e2e-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-verification-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-implementation-result.json')),
    readJson(path.join(installRoot, 'runtime-selection-decision-result.json')),
    readJson(path.join(mockRoot, 'MOCK_PROMPT_ARTIFACT.json')),
    readJson(path.join(mockRoot, 'MOCK_OUTPUT_CONTRACT.json')),
    readJson(path.join(mockRoot, 'MOCK_E2E_INPUT.json')),
    readJson(path.join(mockRoot, 'MOCK_E2E_OUTPUT_RAW.json')),
    readJson(path.join(mockRoot, 'MOCK_E2E_OUTPUT_REDACTED.json')),
    readJson(path.join(mockRoot, 'MOCK_E2E_AUDIT.json')),
    readJson(path.join(mockRoot, 'MOCK_E2E_REVIEW_CANDIDATE.json')),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeMockE2EReview({ reviewedAt: input.reviewedAt || '2026-07-27T00:00:00.000Z', reviewedBy: input.reviewedBy || 'factory-hermes-controlled-research-runtime-mock-e2e-review-smoke', mockE2EExecutionResult, mockE2EApprovalResult, mockE2EPlanningResult, alternateSafeRuntimeVerificationResult, implementationResult, runtimeSelectionDecisionResult, artifacts: { prompt, contract, input: mockInput, raw, redacted, audit, reviewCandidate } });
  await fs.writeFile(resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeMockE2EReview };
