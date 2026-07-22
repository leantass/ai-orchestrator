const fs = require('node:fs');
const path = require('node:path');
const { assertModelProviderPolicyPlanningPathContained } = require('./hermes-model-provider-policy-planning.path.cjs');

const FILES = [
  'hermes_cli/runtime_provider.py',
  'hermes_cli/config.py',
  'hermes_cli/auth.py',
  'hermes_cli/oneshot.py',
  'hermes_cli/main.py',
  'README.md',
  'pyproject.toml',
];

function readIfPresent(sourceRoot, relativePath) {
  const file = path.join(sourceRoot, relativePath);
  assertModelProviderPolicyPlanningPathContained(file, sourceRoot);
  if (!fs.existsSync(file)) return '';
  return fs.readFileSync(file, 'utf8');
}

function inspectFactoryHermesModelProviderSource(sourceRoot) {
  const inspectedFiles = [];
  const textParts = [];
  for (const relativePath of FILES) {
    const text = readIfPresent(sourceRoot, relativePath);
    if (text) {
      inspectedFiles.push(relativePath);
      textParts.push(text);
    }
  }
  const text = textParts.join('\n');
  const providersObserved = ['openai', 'anthropic', 'gemini', 'google'].filter((name) => new RegExp(`["']?${name}["']?`, 'iu').test(text));
  const credentialEnvRefsObserved = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'HERMES_INFERENCE_MODEL', 'HERMES_INFERENCE_PROVIDER'].filter((name) => text.includes(name));
  return {
    sourceRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/source',
    inspectedFiles,
    providersObserved,
    credentialEnvRefsObserved,
    providerModelMayComeFromArgs: /--provider|--model/iu.test(text),
    providerModelMayComeFromEnv: /HERMES_INFERENCE_MODEL|HERMES_INFERENCE_PROVIDER/iu.test(text),
    providerModelMayComeFromConfig: /config\.yaml|model\["provider"\]|model\.provider|cfg\.get\("model"\)/iu.test(text),
    mockOfflineProviderFound: /providerMockOrOfflineFound["']?\s*:\s*true/iu.test(text) || false,
    fallbackRiskObserved: /default|fallback|active_provider|resolve_provider/iu.test(text),
    noEnvValuesRead: true,
    noDotEnvRead: true,
    noSourceDumpIncluded: true,
  };
}

module.exports = { inspectFactoryHermesModelProviderSource };
