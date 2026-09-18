const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
async function executeFactoryHermesControlledResearchRuntimeProviderRuntimeReview(input = {}) {
  const repoRoot = process.cwd();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const providerRoot = path.join(installRoot, 'provider-runtime');
  const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-provider-runtime-review', 'index.ts')).href);
  const [providerRuntimeExecutionResult, providerRuntimeExecutionApprovalResult, providerRuntimeExecutionPlanningResult, providerRuntimeApprovalResult, providerRuntimePlanningResult, mockE2EReviewResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-mock-e2e-review-result.json')),
    readJson(path.join(installRoot, 'runtime-selection-decision-result.json')),
  ]);
  const providerRuntimeArtifacts = {
    promptArtifact: await readJson(path.join(providerRoot, 'PROVIDER_PROMPT_ARTIFACT.json')),
    outputContract: await readJson(path.join(providerRoot, 'PROVIDER_OUTPUT_CONTRACT.json')),
    runtimeInput: await readJson(path.join(providerRoot, 'PROVIDER_RUNTIME_INPUT.json')),
    requestEnvelopeRedacted: await readJson(path.join(providerRoot, 'PROVIDER_RUNTIME_REQUEST_ENVELOPE_REDACTED.json')),
    rawOutput: await readJson(path.join(providerRoot, 'PROVIDER_RUNTIME_OUTPUT_RAW.json')),
    redactedOutput: await readJson(path.join(providerRoot, 'PROVIDER_RUNTIME_OUTPUT_REDACTED.json')),
    audit: await readJson(path.join(providerRoot, 'PROVIDER_RUNTIME_AUDIT.json')),
    reviewCandidate: await readJson(path.join(providerRoot, 'PROVIDER_RUNTIME_REVIEW_CANDIDATE.json')),
  };
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeProviderRuntimeReview({ reviewedAt: input.reviewedAt || '2026-07-27T00:00:00.000Z', reviewedBy: input.reviewedBy || 'factory-hermes-controlled-research-runtime-provider-runtime-review-smoke', providerRuntimeExecutionResult, providerRuntimeExecutionApprovalResult, providerRuntimeExecutionPlanningResult, providerRuntimeApprovalResult, providerRuntimePlanningResult, mockE2EReviewResult, runtimeSelectionDecisionResult, providerRuntimeArtifacts });
  await fs.writeFile(path.join(installRoot, 'controlled-research-runtime-provider-runtime-review-result.json'), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
module.exports = { executeFactoryHermesControlledResearchRuntimeProviderRuntimeReview };
