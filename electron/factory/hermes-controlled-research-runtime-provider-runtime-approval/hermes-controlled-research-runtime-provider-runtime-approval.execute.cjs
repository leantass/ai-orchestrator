const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
async function executeFactoryHermesControlledResearchRuntimeProviderRuntimeApproval(input = {}) {
  const repoRoot = process.cwd();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-provider-runtime-approval', 'index.ts')).href);
  const [providerRuntimePlanningResult, mockE2EReviewResult, mockE2EExecutionResult, alternateSafeRuntimeVerificationResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(path.join(installRoot, 'controlled-research-runtime-provider-runtime-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-mock-e2e-review-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-mock-e2e-execution-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-verification-result.json')),
    readJson(path.join(installRoot, 'runtime-selection-decision-result.json')),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeProviderRuntimeApproval({ approvedAt: input.approvedAt || '2026-07-27T00:00:00.000Z', approvedBy: input.approvedBy || 'factory-hermes-controlled-research-runtime-provider-runtime-approval-smoke', providerRuntimePlanningResult, mockE2EReviewResult, mockE2EExecutionResult, alternateSafeRuntimeVerificationResult, runtimeSelectionDecisionResult });
  await fs.writeFile(path.join(installRoot, 'controlled-research-runtime-provider-runtime-approval-result.json'), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
module.exports = { executeFactoryHermesControlledResearchRuntimeProviderRuntimeApproval };
