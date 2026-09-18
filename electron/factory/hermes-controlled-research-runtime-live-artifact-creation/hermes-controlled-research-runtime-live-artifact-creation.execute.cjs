const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertControlledResearchRuntimeLiveArtifactCreationPathContained, resolveFactoryHermesControlledResearchRuntimeLiveArtifactCreationPaths } = require('./hermes-controlled-research-runtime-live-artifact-creation.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeLiveArtifactCreation(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeLiveArtifactCreationPaths();
  for (const target of [paths.liveArtifactApprovalResult, paths.liveArtifactPlanningResult, paths.liveArtifactCreationResult, paths.liveTempConfigPath, paths.liveRunRoot, paths.runRootManifestPath]) assertControlledResearchRuntimeLiveArtifactCreationPathContained(target, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-live-artifact-creation', 'index.ts')).href);
  const approval = input.liveArtifactApprovalResult || await readJson(paths.liveArtifactApprovalResult);
  const planning = input.liveArtifactPlanningResult || await readJson(paths.liveArtifactPlanningResult);
  await fs.mkdir(paths.liveTempConfigRoot, { recursive: true });
  await fs.mkdir(paths.liveRunRoot, { recursive: true });
  await fs.writeFile(paths.liveTempConfigPath, gate.buildFactoryHermesControlledRuntimeLiveTempConfigContent(), { flag: 'wx' }).catch(async (error) => {
    if (error && error.code === 'EEXIST') await fs.writeFile(paths.liveTempConfigPath, gate.buildFactoryHermesControlledRuntimeLiveTempConfigContent());
    else throw error;
  });
  await fs.writeFile(paths.runRootManifestPath, `${JSON.stringify({ toolId: 'hermes_agent', runRootCreatedFor: 'controlled_research_runtime_live_artifact_verification_only', runtimeExecutionAllowedNow: false, researchExecutionApprovedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkApprovedNow: false, credentialAccessApprovedNow: false, toolsetEnablementApprovedNow: false, findingsUseApprovedNow: false }, null, 2)}\n`);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeLiveArtifactCreation({
    createdAt: input.createdAt || '2026-07-23T20:00:00.000Z',
    createdBy: input.createdBy || 'factory-hermes-controlled-research-runtime-live-artifact-creation-smoke',
    liveArtifactApprovalResult: approval,
    liveArtifactPlanningResult: planning,
    materializedArtifacts: { liveTempConfigCreated: true, liveRunRootCreated: true, liveTempConfigPath: paths.liveTempConfigPath, liveRunRootPath: paths.liveRunRoot, runRootManifestPath: paths.runRootManifestPath },
  });
  await fs.writeFile(paths.liveArtifactCreationResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeLiveArtifactCreation };
