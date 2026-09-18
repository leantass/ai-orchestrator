const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
async function executeFactoryHermesControlledResearchRuntimeProviderRuntimeRetryApproval(input = {}) {
  const repoRoot = process.cwd();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-provider-runtime-retry-approval', 'index.ts')).href);
  const [providerRuntimeRetryPlanningResult, providerRuntimeReviewResult, providerRuntimeExecutionResult, providerRuntimeExecutionApprovalResult, providerRuntimeExecutionPlanningResult, providerRuntimeApprovalResult, providerRuntimePlanningResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-review-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-planning-result.json')),
    readJson(path.join(installRoot, 'runtime-selection-decision-result.json')),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeProviderRuntimeRetryApproval({ approvedAt: input.approvedAt || '2026-07-27T00:00:00.000Z', approvedBy: input.approvedBy || 'factory-hermes-controlled-research-runtime-provider-runtime-retry-approval-smoke', providerRuntimeRetryPlanningResult, providerRuntimeReviewResult, providerRuntimeExecutionResult, providerRuntimeExecutionApprovalResult, providerRuntimeExecutionPlanningResult, providerRuntimeApprovalResult, providerRuntimePlanningResult, runtimeSelectionDecisionResult });
  await fs.writeFile(path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-approval-result.json'), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
module.exports = { executeFactoryHermesControlledResearchRuntimeProviderRuntimeRetryApproval };
