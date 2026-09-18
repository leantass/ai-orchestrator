const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
async function writeJson(file, value) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`); return value; }
async function executeFactoryHermesControlledResearchRuntimeOutputIngestionApproval(input = {}) {
  const repoRoot = process.cwd();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-output-ingestion-approval', 'index.ts')).href);
  const [outputIngestionPlanningResult, providerRuntimeRetryReviewResult, providerRuntimeRetryExecutionResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(path.join(installRoot, 'controlled-research-runtime-output-ingestion-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-review-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-execution-result.json')),
    readJson(path.join(installRoot, 'runtime-selection-decision-result.json')),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeOutputIngestionApproval({ approvedAt: input.approvedAt || '2026-07-27T00:00:00.000Z', approvedBy: input.approvedBy || 'factory-hermes-controlled-research-runtime-output-ingestion-approval-smoke', outputIngestionPlanningResult, providerRuntimeRetryReviewResult, providerRuntimeRetryExecutionResult, runtimeSelectionDecisionResult });
  await writeJson(path.join(installRoot, 'controlled-research-runtime-output-ingestion-approval-result.json'), result);
  return result;
}
module.exports = { executeFactoryHermesControlledResearchRuntimeOutputIngestionApproval };
