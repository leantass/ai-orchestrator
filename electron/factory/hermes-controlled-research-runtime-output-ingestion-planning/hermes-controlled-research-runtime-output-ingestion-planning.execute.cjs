const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
async function writeJson(file, value) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`); return value; }
async function executeFactoryHermesControlledResearchRuntimeOutputIngestionPlanning(input = {}) {
  const repoRoot = process.cwd();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const providerRoot = path.join(installRoot, 'provider-runtime-retry');
  const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-output-ingestion-planning', 'index.ts')).href);
  const [providerRuntimeRetryReviewResult, providerRuntimeRetryExecutionResult, providerRuntimeRetryApprovalResult, providerRuntimeRetryPlanningResult, providerRuntimeReviewResult, providerRuntimeExecutionResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-review-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-execution-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-review-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-result.json')),
    readJson(path.join(installRoot, 'runtime-selection-decision-result.json')),
  ]);
  const providerRuntimeRetryArtifacts = {
    redactedOutput: await readJson(path.join(providerRoot, 'PROVIDER_RETRY_OUTPUT_REDACTED.json')),
    reviewCandidate: await readJson(path.join(providerRoot, 'PROVIDER_RETRY_REVIEW_CANDIDATE.json')),
    audit: await readJson(path.join(providerRoot, 'PROVIDER_RETRY_AUDIT.json')),
    contract: await readJson(path.join(providerRoot, 'PROVIDER_RETRY_OUTPUT_CONTRACT.json')),
  };
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeOutputIngestionPlanning({ plannedAt: input.plannedAt || '2026-07-27T00:00:00.000Z', plannedBy: input.plannedBy || 'factory-hermes-controlled-research-runtime-output-ingestion-planning-smoke', providerRuntimeRetryReviewResult, providerRuntimeRetryExecutionResult, providerRuntimeRetryApprovalResult, providerRuntimeRetryPlanningResult, providerRuntimeReviewResult, providerRuntimeExecutionResult, runtimeSelectionDecisionResult, providerRuntimeRetryArtifacts });
  await writeJson(path.join(installRoot, 'controlled-research-runtime-output-ingestion-planning-result.json'), result);
  return result;
}
module.exports = { executeFactoryHermesControlledResearchRuntimeOutputIngestionPlanning };
