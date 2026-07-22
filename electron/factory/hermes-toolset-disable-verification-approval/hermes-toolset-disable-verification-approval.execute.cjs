const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertToolsetDisableApprovalPathContained, resolveFactoryHermesToolsetDisableVerificationApprovalPaths } = require('./hermes-toolset-disable-verification-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function readText(file) {
  try { return await fs.readFile(file, 'utf8'); } catch { return ''; }
}

function inspectSourceSafety(files) {
  const oneshot = files.oneshot || '';
  const main = files.main || '';
  const toolsConfig = files.toolsConfig || '';
  const config = files.config || '';
  const joined = [oneshot, main, toolsConfig, config, files.readme || ''].join('\n');
  const validatesToolsetsBeforeAgent = oneshot.indexOf('_validate_explicit_toolsets') !== -1
    && oneshot.indexOf('_validate_explicit_toolsets') < oneshot.indexOf('AIAgent(');
  return {
    sourceFilesInspected: ['hermes_cli/main.py', 'hermes_cli/oneshot.py', 'hermes_cli/tools_config.py', 'hermes_cli/config.py', 'README.md'],
    hasToolsetsArgument: joined.includes('--toolsets'),
    validatesKnownToolsetNames: joined.includes('_validate_explicit_toolsets') && joined.includes('validate_toolset'),
    rejectsAllInvalidToolsets: joined.includes('--toolsets did not contain any valid toolsets'),
    omittingToolsetsMayUseDefaults: joined.includes('use_config_toolsets') && joined.includes('_get_platform_tools'),
    noMcpDisablesAllTools: false,
    noToolsetsTextOnlyIsHermesSyntax: false,
    toolsetValidationBeforeAIAgent: validatesToolsetsBeforeAgent,
    safeProbeShapeProven: false,
    probeDoesNotRequirePrompt: false,
    probeCannotReachProviderModelNetwork: false,
    probeCannotReadCredentials: false,
    exactCommandCandidateProven: false,
    exactCommandCandidate: [],
    riskSummary: ['--toolsets validation is found in the oneshot path, which still requires a prompt.', 'No command path was proven that validates toolsets without risk of provider/model/network setup.', 'Omitting --toolsets may use configured defaults.', 'no_mcp is a sentinel for MCP only, not a full no-tools mode.'],
    evidenceRefs: ['hermes_cli/main.py --toolsets', 'hermes_cli/oneshot.py _validate_explicit_toolsets', 'hermes_cli/oneshot.py AIAgent construction', 'hermes_cli/tools_config.py no_mcp'],
  };
}

async function executeFactoryHermesToolsetDisableVerificationApproval(input = {}) {
  const paths = resolveFactoryHermesToolsetDisableVerificationApprovalPaths();
  for (const target of [paths.planningResult, paths.adapterApprovalResult, paths.finalExecutionApprovalResult, paths.runtimeSelectionDecisionResult, paths.toolsetsPolicyPlanningResult, paths.approvalResult, paths.oneshot, paths.main, paths.toolsConfig, paths.config, paths.readme]) assertToolsetDisableApprovalPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesToolsetDisableVerificationApproval } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-toolset-disable-verification-approval', 'index.ts')).href);
  const evaluatedAt = input.evaluatedAt || '2026-07-22T23:00:00.000Z';
  const evaluatedBy = input.evaluatedBy || 'factory-hermes-toolset-disable-verification-approval-smoke';
  const sourceSafetyAssessment = input.sourceSafetyAssessment || inspectSourceSafety({
    oneshot: await readText(paths.oneshot),
    main: await readText(paths.main),
    toolsConfig: await readText(paths.toolsConfig),
    config: await readText(paths.config),
    readme: await readText(paths.readme),
  });
  const result = evaluateFactoryHermesToolsetDisableVerificationApproval({
    evaluatedAt,
    evaluatedBy,
    toolsetDisableVerificationPlanningResult: input.toolsetDisableVerificationPlanningResult || await readJson(paths.planningResult),
    researchRuntimeAdapterApprovalResult: input.researchRuntimeAdapterApprovalResult || await readJson(paths.adapterApprovalResult),
    finalExecutionApprovalResult: input.finalExecutionApprovalResult || await readJson(paths.finalExecutionApprovalResult),
    runtimeSelectionDecisionResult: input.runtimeSelectionDecisionResult || await readJson(paths.runtimeSelectionDecisionResult),
    toolsetsPolicyPlanningResult: input.toolsetsPolicyPlanningResult || await readJson(paths.toolsetsPolicyPlanningResult),
    sourceSafetyAssessment,
  });
  await fs.mkdir(path.dirname(paths.approvalResult), { recursive: true });
  await fs.writeFile(paths.approvalResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesToolsetDisableVerificationApproval };
