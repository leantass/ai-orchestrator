const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
async function writeJson(file, value) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`); return value; }

async function executeFactoryHermesControlledResearchRuntimeProviderRuntimeRetryReview(input = {}) {
  const repoRoot = process.cwd();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const providerRoot = path.join(installRoot, 'provider-runtime-retry');
  const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-provider-runtime-retry-review', 'index.ts')).href);
  const [providerRuntimeRetryExecutionResult, providerRuntimeRetryApprovalResult, providerRuntimeRetryPlanningResult, providerRuntimeReviewResult, providerRuntimeExecutionResult, providerRuntimeExecutionApprovalResult, providerRuntimePlanningResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-execution-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-review-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-planning-result.json')),
    readJson(path.join(installRoot, 'runtime-selection-decision-result.json')),
  ]);
  const providerRuntimeRetryArtifacts = {
    prompt: await readJson(path.join(providerRoot, 'PROVIDER_RETRY_PROMPT_ARTIFACT.json')),
    contract: await readJson(path.join(providerRoot, 'PROVIDER_RETRY_OUTPUT_CONTRACT.json')),
    runtimeInput: await readJson(path.join(providerRoot, 'PROVIDER_RETRY_RUNTIME_INPUT.json')),
    requestEnvelope: await readJson(path.join(providerRoot, 'PROVIDER_RETRY_REQUEST_ENVELOPE_REDACTED.json')),
    rawOutput: await readJson(path.join(providerRoot, 'PROVIDER_RETRY_OUTPUT_RAW.json')),
    redactedOutput: await readJson(path.join(providerRoot, 'PROVIDER_RETRY_OUTPUT_REDACTED.json')),
    audit: await readJson(path.join(providerRoot, 'PROVIDER_RETRY_AUDIT.json')),
    reviewCandidate: await readJson(path.join(providerRoot, 'PROVIDER_RETRY_REVIEW_CANDIDATE.json')),
  };
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeProviderRuntimeRetryReview({ reviewedAt: input.reviewedAt || '2026-07-27T00:00:00.000Z', reviewedBy: input.reviewedBy || 'factory-hermes-controlled-research-runtime-provider-runtime-retry-review-smoke', providerRuntimeRetryExecutionResult, providerRuntimeRetryApprovalResult, providerRuntimeRetryPlanningResult, providerRuntimeReviewResult, providerRuntimeExecutionResult, providerRuntimeExecutionApprovalResult, providerRuntimePlanningResult, runtimeSelectionDecisionResult, providerRuntimeRetryArtifacts });
  await writeJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-review-result.json'), result);
  return result;
}

if (require.main === module) {
  executeFactoryHermesControlledResearchRuntimeProviderRuntimeRetryReview().then((result) => {
    console.log(JSON.stringify({ ok: true, status: result.status, decision: result.decision, resultPath: path.join(process.cwd(), '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f', 'controlled-research-runtime-provider-runtime-retry-review-result.json') }, null, 2));
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { executeFactoryHermesControlledResearchRuntimeProviderRuntimeRetryReview };
