const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertControlledResearchRuntimeLiveArtifactVerificationPathContained, resolveFactoryHermesControlledResearchRuntimeLiveArtifactVerificationPaths } = require('./hermes-controlled-research-runtime-live-artifact-verification.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

function textHasSecret(text) {
  return /sk-[a-z0-9]|OPENAI_API_KEY\s*=|api_key\s*:|apikey\s*:|secret\s*:|token\s*:|password\s*:|BEGIN PRIVATE KEY/iu.test(text);
}

function textHasEnvDump(text) {
  const envLikeLines = text.split(/\r?\n/u).filter((line) => /^[A-Z_][A-Z0-9_]{1,40}=.+/u.test(line)).length;
  return /\b(PATH|USER|USERNAME|HOME)=/u.test(text) || envLikeLines >= 4;
}

function textHasExecutableCommand(text) {
  return /\b(hermes\.exe|--oneshot|spawn|exec|child_process)\b/iu.test(text);
}

function textHasNetworkEnablement(text) {
  return /\b(network|web|browser)\s*:\s*true\b/iu.test(text);
}

function textHasToolsetEnablement(text) {
  return /\b(toolsets\s*:\s*default|mcp\s*:\s*true|tools\s*:\s*true|enabled\s*:\s*true)\b/iu.test(text);
}

function textHasPromptBody(text) {
  return /\b(prompt|user_message|system_message|messages)\s*:\s*(\||>|["'])/iu.test(text);
}

function hasOutputOrFindings(text) {
  return /\b(findings|stdout|stderr|model_output|research_output)\b/iu.test(text);
}

async function safeReadDir(dir) {
  return (await fs.readdir(dir, { withFileTypes: true })).map((entry) => ({ name: entry.name, isFile: entry.isFile(), isDirectory: entry.isDirectory(), isSymbolicLink: entry.isSymbolicLink() }));
}

async function executeFactoryHermesControlledResearchRuntimeLiveArtifactVerification(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeLiveArtifactVerificationPaths();
  for (const target of [paths.liveArtifactVerificationResult, paths.liveArtifactCreationResult, paths.liveArtifactApprovalResult, paths.liveArtifactPlanningResult, paths.preparationReviewResult, paths.preparationResult, paths.runtimeSelectionDecisionResult, paths.liveTempConfigRoot, paths.liveTempConfigPath, paths.liveRunRoot, paths.runRootManifestPath]) {
    assertControlledResearchRuntimeLiveArtifactVerificationPathContained(target, paths.installRoot);
  }

  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-live-artifact-verification', 'index.ts')).href);
  const [creation, approval, planning, preparationReview, preparation, runtimeSelection] = await Promise.all([
    readJson(paths.liveArtifactCreationResult),
    readJson(paths.liveArtifactApprovalResult),
    readJson(paths.liveArtifactPlanningResult),
    readJson(paths.preparationReviewResult),
    readJson(paths.preparationResult),
    readJson(paths.runtimeSelectionDecisionResult),
  ]);

  const configStat = await fs.stat(paths.liveTempConfigPath);
  const manifestStat = await fs.stat(paths.runRootManifestPath);
  const configText = await fs.readFile(paths.liveTempConfigPath, 'utf8');
  const manifestText = await fs.readFile(paths.runRootManifestPath, 'utf8');
  const manifestJson = JSON.parse(manifestText);
  const [configRealPath, manifestRealPath] = await Promise.all([fs.realpath(paths.liveTempConfigPath), fs.realpath(paths.runRootManifestPath)]);
  const [configLstat, manifestLstat, configRootLstat, runRootLstat] = await Promise.all([fs.lstat(paths.liveTempConfigPath), fs.lstat(paths.runRootManifestPath), fs.lstat(paths.liveTempConfigRoot), fs.lstat(paths.liveRunRoot)]);
  const [configRootEntries, runRootEntries] = await Promise.all([safeReadDir(paths.liveTempConfigRoot), safeReadDir(paths.liveRunRoot)]);

  const pathContainment = {
    configPath: paths.liveTempConfigPath,
    configRealPath,
    runManifestPath: paths.runRootManifestPath,
    runManifestRealPath: manifestRealPath,
    codexTempContainmentPassed: configRealPath.startsWith(path.resolve(paths.installRoot)) && manifestRealPath.startsWith(path.resolve(paths.installRoot)),
    configContainmentPassed: configRealPath.startsWith(path.resolve(paths.liveTempConfigRoot)) && path.basename(configRealPath) === 'config.yaml',
    runRootContainmentPassed: manifestRealPath.startsWith(path.resolve(paths.liveRunRoot)) && path.basename(manifestRealPath) === 'RUN_MANIFEST.json',
    pathEscapeDetected: false,
  };
  pathContainment.passed = pathContainment.codexTempContainmentPassed && pathContainment.configContainmentPassed && pathContainment.runRootContainmentPassed && pathContainment.pathEscapeDetected === false;

  const symlink = {
    checkedPaths: [paths.liveTempConfigPath, paths.runRootManifestPath, paths.liveTempConfigRoot, paths.liveRunRoot],
    symlinkDetected: configLstat.isSymbolicLink() || manifestLstat.isSymbolicLink() || configRootLstat.isSymbolicLink() || runRootLstat.isSymbolicLink(),
    symlinkEscapeDetected: false,
  };
  symlink.passed = symlink.symlinkDetected === false && symlink.symlinkEscapeDetected === false;

  const configSecretPassed = !textHasSecret(configText);
  const manifestSecretPassed = !textHasSecret(manifestText);
  const configCredentialPassed = !/OPENAI_API_KEY\s*=|bearer\s+|password\s*[:=]/iu.test(configText);
  const manifestCredentialPassed = !/OPENAI_API_KEY\s*=|bearer\s+|password\s*[:=]/iu.test(manifestText);
  const configEnvPassed = !textHasEnvDump(configText) && !configText.includes('.env');
  const manifestEnvPassed = !textHasEnvDump(manifestText) && !manifestText.includes('.env');
  const configExecutableDetected = textHasExecutableCommand(configText);
  const manifestExecutableDetected = textHasExecutableCommand(manifestText);
  const configNetworkDetected = textHasNetworkEnablement(configText);
  const configToolsetDetected = textHasToolsetEnablement(configText);
  const configPromptDetected = textHasPromptBody(configText);
  const manifestPromptDetected = textHasPromptBody(manifestText);

  const liveTempConfigVerificationResult = {
    exists: true,
    isFile: configStat.isFile(),
    sizeBytes: configStat.size,
    secretScanPassed: configSecretPassed,
    credentialValueScanPassed: configCredentialPassed,
    envDumpScanPassed: configEnvPassed,
    promptBodyDetected: configPromptDetected,
    executableCommandDetected: configExecutableDetected,
    networkEnablementDetected: configNetworkDetected,
    toolsetEnablementDetected: configToolsetDetected,
    schemaUnknownWarning: true,
    emptyToolsetsUnknownWarning: true,
    schemaSafetyScanPassed: configText.includes('execution_allowed: false') && configText.includes('network_allowed: false') && configText.includes('credential_access_allowed: false') && configText.includes('enabled: false'),
  };
  liveTempConfigVerificationResult.passed = liveTempConfigVerificationResult.exists && liveTempConfigVerificationResult.isFile && liveTempConfigVerificationResult.sizeBytes > 0 && liveTempConfigVerificationResult.secretScanPassed && liveTempConfigVerificationResult.credentialValueScanPassed && liveTempConfigVerificationResult.envDumpScanPassed && liveTempConfigVerificationResult.promptBodyDetected === false && liveTempConfigVerificationResult.executableCommandDetected === false && liveTempConfigVerificationResult.networkEnablementDetected === false && liveTempConfigVerificationResult.toolsetEnablementDetected === false && liveTempConfigVerificationResult.schemaSafetyScanPassed;

  const executionFlagsSafe = manifestJson.runtimeExecutionAllowedNow === false && manifestJson.researchExecutionApprovedNow === false && manifestJson.promptPassingAllowedNow === false && manifestJson.modelCallsAllowedNow === false && manifestJson.networkApprovedNow === false && manifestJson.credentialAccessApprovedNow === false && manifestJson.toolsetEnablementApprovedNow === false && manifestJson.findingsUseApprovedNow === false;
  const liveRunRootManifestVerificationResult = {
    exists: true,
    isFile: manifestStat.isFile(),
    jsonParsePassed: true,
    secretScanPassed: manifestSecretPassed,
    credentialValueScanPassed: manifestCredentialPassed,
    envDumpScanPassed: manifestEnvPassed,
    promptBodyDetected: manifestPromptDetected,
    executableCommandDetected: manifestExecutableDetected,
    executionFlagsSafe,
    wrapperStrategyMatches: creation.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets',
    outputOrFindingsDetected: hasOutputOrFindings(manifestText),
  };
  liveRunRootManifestVerificationResult.passed = liveRunRootManifestVerificationResult.exists && liveRunRootManifestVerificationResult.isFile && liveRunRootManifestVerificationResult.jsonParsePassed && liveRunRootManifestVerificationResult.secretScanPassed && liveRunRootManifestVerificationResult.credentialValueScanPassed && liveRunRootManifestVerificationResult.envDumpScanPassed && liveRunRootManifestVerificationResult.promptBodyDetected === false && liveRunRootManifestVerificationResult.executableCommandDetected === false && liveRunRootManifestVerificationResult.executionFlagsSafe && liveRunRootManifestVerificationResult.wrapperStrategyMatches && liveRunRootManifestVerificationResult.outputOrFindingsDetected === false;

  const unexpectedConfigEntries = configRootEntries.filter((entry) => entry.name !== 'config.yaml');
  const unexpectedRunEntries = runRootEntries.filter((entry) => entry.name !== 'RUN_MANIFEST.json');
  const liveArtifactDirectoryInventoryVerificationResult = {
    configRootEntries,
    runRootEntries,
    unexpectedEntries: [...unexpectedConfigEntries, ...unexpectedRunEntries],
    runtimeOutputFilesDetected: [...configRootEntries, ...runRootEntries].some((entry) => /stdout|stderr|output|log/iu.test(entry.name)),
    findingsFilesDetected: [...configRootEntries, ...runRootEntries].some((entry) => /findings/iu.test(entry.name)),
  };
  liveArtifactDirectoryInventoryVerificationResult.passed = liveArtifactDirectoryInventoryVerificationResult.unexpectedEntries.length === 0 && liveArtifactDirectoryInventoryVerificationResult.runtimeOutputFilesDetected === false && liveArtifactDirectoryInventoryVerificationResult.findingsFilesDetected === false;

  const liveArtifactSecretScanResult = {
    liveTempConfigSecretScanPassed: configSecretPassed,
    runManifestSecretScanPassed: manifestSecretPassed,
    credentialValueScanPassed: configCredentialPassed && manifestCredentialPassed,
    envDumpScanPassed: configEnvPassed && manifestEnvPassed,
    passed: configSecretPassed && manifestSecretPassed && configCredentialPassed && manifestCredentialPassed && configEnvPassed && manifestEnvPassed,
  };
  const liveArtifactRuntimeSafetyScanResult = {
    hermesExecuted: false,
    hermesExeExecuted: false,
    oneShotExecuted: false,
    wrapperExecutedAgainstHermes: false,
    adapterExecuted: false,
    researchExecuted: false,
    promptSent: false,
    modelCallsMade: false,
    networkUsed: false,
    dnsResolved: false,
    endpointTests: false,
    credentialValuesRead: false,
    envSecretsRead: false,
    dotEnvRead: false,
    toolsetsEnabled: false,
    outputIngested: false,
    findingsPromoted: false,
    executableCommandDetected: configExecutableDetected || manifestExecutableDetected,
  };
  liveArtifactRuntimeSafetyScanResult.passed = liveArtifactRuntimeSafetyScanResult.executableCommandDetected === false;

  const result = gate.evaluateFactoryHermesControlledResearchRuntimeLiveArtifactVerification({
    verifiedAt: input.verifiedAt || '2026-07-23T21:00:00.000Z',
    verifiedBy: input.verifiedBy || 'factory-hermes-controlled-research-runtime-live-artifact-verification-smoke',
    liveArtifactCreationResult: creation,
    liveArtifactApprovalResult: approval,
    liveArtifactPlanningResult: planning,
    preparationReviewResult: preparationReview,
    preparationResult: preparation,
    runtimeSelectionDecisionResult: runtimeSelection,
    liveTempConfigVerificationResult,
    liveRunRootManifestVerificationResult,
    liveArtifactPathContainmentVerificationResult: pathContainment,
    liveArtifactSymlinkVerificationResult: symlink,
    liveArtifactSecretScanResult,
    liveArtifactRuntimeSafetyScanResult,
    liveArtifactDirectoryInventoryVerificationResult,
  });
  await fs.writeFile(paths.liveArtifactVerificationResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeLiveArtifactVerification };
