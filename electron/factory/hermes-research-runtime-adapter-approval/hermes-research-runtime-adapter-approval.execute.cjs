const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertAdapterApprovalPathContained, resolveFactoryHermesResearchRuntimeAdapterApprovalPaths } = require('./hermes-research-runtime-adapter-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function readTextIfExists(file) {
  try { return await fs.readFile(file, 'utf8'); } catch { return ''; }
}

function inspectToolsetDisableSupport(sourceTexts) {
  const joined = sourceTexts.join('\n');
  const hasExplicitToolsets = joined.includes('--toolsets') && joined.includes('_validate_explicit_toolsets');
  const rejectsNoValid = joined.includes('--toolsets did not contain any valid toolsets');
  const hasConfigFallback = joined.includes('use_config_toolsets') && joined.includes('_get_platform_tools');
  const hasNoMcpOnly = joined.includes('no_mcp');
  if (hasExplicitToolsets && rejectsNoValid && hasConfigFallback && hasNoMcpOnly) return 'unverified_requires_toolset_disable_verification';
  return 'unverified_requires_toolset_disable_verification';
}

async function executeFactoryHermesResearchRuntimeAdapterApproval(input = {}) {
  const paths = resolveFactoryHermesResearchRuntimeAdapterApprovalPaths();
  for (const target of [paths.finalExecutionApprovalResult, paths.runtimeSelectionDecisionResult, paths.toolsetsPolicyPlanningResult, paths.researchRuntimeAdapterApprovalResult, paths.hermesCliOneshot, paths.hermesCliMain, paths.hermesCliToolsConfig]) assertAdapterApprovalPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesResearchRuntimeAdapterApproval } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-research-runtime-adapter-approval', 'index.ts')).href);
  const evaluatedAt = input.evaluatedAt || '2026-07-22T21:00:00.000Z';
  const evaluatedBy = input.evaluatedBy || 'factory-hermes-research-runtime-adapter-approval-smoke';
  const sourceTexts = [await readTextIfExists(paths.hermesCliOneshot), await readTextIfExists(paths.hermesCliMain), await readTextIfExists(paths.hermesCliToolsConfig)];
  let result;
  try {
    result = evaluateFactoryHermesResearchRuntimeAdapterApproval({
      evaluatedAt,
      evaluatedBy,
      finalExecutionApprovalResult: input.finalExecutionApprovalResult || await readJson(paths.finalExecutionApprovalResult),
      runtimeSelectionDecisionResult: input.runtimeSelectionDecisionResult || await readJson(paths.runtimeSelectionDecisionResult),
      toolsetDisableSupportStatus: input.toolsetDisableSupportStatus || inspectToolsetDisableSupport(sourceTexts),
    });
  } catch (error) {
    result = evaluateFactoryHermesResearchRuntimeAdapterApproval({ evaluatedAt, evaluatedBy });
    result = { ...result, blockers: [{ blockerId: 'runtime_read_failed', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.researchRuntimeAdapterApprovalResult), { recursive: true });
  await fs.writeFile(paths.researchRuntimeAdapterApprovalResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesResearchRuntimeAdapterApproval };
