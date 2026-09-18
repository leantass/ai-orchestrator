const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
async function executeFactoryHermesControlledResearchRuntimeProviderRuntimePlanning(input = {}) {
  const repoRoot = process.cwd();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-provider-runtime-planning', 'index.ts')).href);
  const [mockE2EReviewResult, mockE2EExecutionResult, alternateSafeRuntimeVerificationResult, implementationResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(path.join(installRoot, 'controlled-research-runtime-mock-e2e-review-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-mock-e2e-execution-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-verification-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-implementation-result.json')),
    readJson(path.join(installRoot, 'runtime-selection-decision-result.json')),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeProviderRuntimePlanning({ plannedAt: input.plannedAt || '2026-07-27T00:00:00.000Z', plannedBy: input.plannedBy || 'factory-hermes-controlled-research-runtime-provider-runtime-planning-smoke', mockE2EReviewResult, mockE2EExecutionResult, alternateSafeRuntimeVerificationResult, implementationResult, runtimeSelectionDecisionResult });
  await fs.writeFile(path.join(installRoot, 'controlled-research-runtime-provider-runtime-planning-result.json'), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
module.exports = { executeFactoryHermesControlledResearchRuntimeProviderRuntimePlanning };
