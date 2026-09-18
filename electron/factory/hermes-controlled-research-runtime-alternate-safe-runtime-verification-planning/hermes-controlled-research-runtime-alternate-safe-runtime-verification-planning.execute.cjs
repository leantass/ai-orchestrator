const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
async function executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeVerificationPlanning(input = {}) {
  const repoRoot = process.cwd();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const resultArtifact = path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-verification-planning-result.json');
  const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-alternate-safe-runtime-verification-planning', 'index.ts')).href);
  const [implementationResult, implementationApprovalResult, implementationPlanningResult, resolutionApprovalResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-implementation-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-implementation-approval-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-implementation-planning-result.json')),
    readJson(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-resolution-approval-result.json')),
    readJson(path.join(installRoot, 'runtime-selection-decision-result.json')),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeVerificationPlanning({ plannedAt: input.plannedAt || '2026-07-27T00:00:00.000Z', plannedBy: input.plannedBy || 'factory-hermes-controlled-research-runtime-alternate-safe-runtime-verification-planning-smoke', implementationResult, implementationApprovalResult, implementationPlanningResult, resolutionApprovalResult, runtimeSelectionDecisionResult });
  await fs.writeFile(resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
module.exports = { executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeVerificationPlanning };
