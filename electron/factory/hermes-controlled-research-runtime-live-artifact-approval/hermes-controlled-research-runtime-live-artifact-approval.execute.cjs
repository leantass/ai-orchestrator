const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertControlledResearchRuntimeLiveArtifactApprovalPathContained, resolveFactoryHermesControlledResearchRuntimeLiveArtifactApprovalPaths } = require('./hermes-controlled-research-runtime-live-artifact-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeLiveArtifactApproval(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeLiveArtifactApprovalPaths();
  for (const target of [paths.liveArtifactPlanningResult, paths.preparationReviewResult, paths.liveArtifactApprovalResult]) assertControlledResearchRuntimeLiveArtifactApprovalPathContained(target, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-live-artifact-approval', 'index.ts')).href);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeLiveArtifactApproval({
    approvedAt: input.approvedAt || '2026-07-23T19:00:00.000Z',
    approvedBy: input.approvedBy || 'factory-hermes-controlled-research-runtime-live-artifact-approval-smoke',
    liveArtifactPlanningResult: input.liveArtifactPlanningResult || await readJson(paths.liveArtifactPlanningResult),
    preparationReviewResult: input.preparationReviewResult || await readJson(paths.preparationReviewResult),
  });
  await fs.mkdir(path.dirname(paths.liveArtifactApprovalResult), { recursive: true });
  await fs.writeFile(paths.liveArtifactApprovalResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeLiveArtifactApproval };
