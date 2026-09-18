const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPaths, assertControlledResearchRuntimeSafeCommandShapeResolutionImplementationPathContained } = require('./hermes-controlled-research-runtime-safe-command-shape-resolution-implementation.path.cjs');

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function sourceScan(file) {
  const text = await fs.readFile(file, 'utf8');
  const banned = ['child_process', 'spawn(', 'exec(', 'fork(', 'process.env', 'https:', 'http:', 'fetch(', 'require('];
  return { file, ok: banned.every((token) => !text.includes(token)), bannedFound: banned.filter((token) => text.includes(token)) };
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementation(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPaths();
  assertControlledResearchRuntimeSafeCommandShapeResolutionImplementationPathContained(paths.resultArtifact, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-implementation', 'index.ts')).href);
  const renderer = await import(pathToFileURL(paths.rendererSource).href);
  const builder = await import(pathToFileURL(paths.wrapperBuilderSource).href);
  const [rendererScan, wrapperBuilderScan] = await Promise.all([sourceScan(paths.rendererSource), sourceScan(paths.wrapperBuilderSource)]);
  const proof = { passed: true, staticCommandShapeProofPassed: true, noDefaultsNoToolsetsProofPassed: true, wrapperBoundaryProofPassed: true, failClosedCommandConstructionProofPassed: true, sourceCliContractCriticalUnknownsEmpty: true };
  const contract = renderer.buildHermesSourceCliContract({ supportsExplicitConfigPath: true, supportsExplicitRunRoot: true, supportsPromptFileOrPromptRef: true, credentialReadOrderKnown: true, credentialReadAfterValidation: true, networkCallOrderKnown: true, networkAfterValidation: true, modelCallOrderKnown: true, modelAfterValidation: true, promptOrderKnown: true, promptAfterValidation: true, hiddenDefaultsExcluded: true, configAppliedBeforeDefaults: true, mcpDisableSupported: true, toolsetsDisableSupported: true, emptyToolRegistrySupported: true });
  const rendererResult = renderer.buildHermesControlledRuntimeCommandEnvelope({ sourceCliContract: contract, noToolProof: proof, verifiedArtifacts: { configPathRef: 'verified-config-ref', runRootRef: 'verified-run-root-ref' }, promptArtifact: { promptRef: 'prompt-ref', promptBodyIncluded: false }, credentialRef: { credentialRef: 'credential-ref', credentialValueIncluded: false } });
  const builderResult = builder.buildWrapperFailClosedHermesCommand({ rendererResult, boundary: { configPathRef: 'verified-config-ref', runRootRef: 'verified-run-root-ref', promptRef: 'prompt-ref', credentialRef: 'credential-ref', noToolProofRef: 'proof-ref', sourceCliContractRef: 'contract-ref' } });
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementation({ implementedAt: input.implementedAt || '2026-07-24T21:30:00.000Z', implementedBy: input.implementedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-smoke', implementationApprovalResult: await readJson(paths.implementationApprovalResult), rendererSmokePassed: rendererResult.status === 'rendered_redacted_non_runnable', wrapperBuilderSmokePassed: builderResult.status === 'wrapper_redacted_non_runnable_built', moduleSafetyScan: { rendererCodeOnly: rendererScan.ok, wrapperBuilderCodeOnly: wrapperBuilderScan.ok, rendererScan, wrapperBuilderScan } });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementation };
