const fs = require('node:fs');
const path = require('node:path');
const { assertCredentialsPolicyPlanningPathContained } = require('./hermes-credentials-policy-planning.path.cjs');
const FILES = ['hermes_cli/auth.py', 'hermes_cli/config.py', 'hermes_cli/runtime_provider.py', 'hermes_cli/oneshot.py', 'hermes_cli/main.py', 'README.md', 'pyproject.toml'];
function readIfPresent(sourceRoot, relativePath) {
  const file = path.join(sourceRoot, relativePath);
  assertCredentialsPolicyPlanningPathContained(file, sourceRoot);
  if (!fs.existsSync(file)) return '';
  return fs.readFileSync(file, 'utf8');
}
function inspectFactoryHermesCredentialSource(sourceRoot) {
  const inspectedFiles = [];
  const textParts = [];
  for (const relativePath of FILES) {
    const text = readIfPresent(sourceRoot, relativePath);
    if (text) { inspectedFiles.push(relativePath); textParts.push(text); }
  }
  const text = textParts.join('\n');
  const refs = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'HERMES_INFERENCE_MODEL', 'HERMES_INFERENCE_PROVIDER'].filter((name) => text.includes(name));
  return { sourceRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/source', inspectedFiles, credentialRefsObserved: refs.filter((r) => r.endsWith('_API_KEY')), providerModelEnvRefsObserved: refs.filter((r) => r.startsWith('HERMES_')), configRefsObserved: ['config.yaml', 'auth', 'credentials', 'token', 'api key'].filter((needle) => text.toLowerCase().includes(needle.toLowerCase())), getenvObserved: /os\.environ|getenv|os\.getenv/iu.test(text), fallbackEnvConfigObserved: /default|fallback|config\.yaml|active_provider|resolve_provider/iu.test(text), envValuesRead: false, credentialValuesRead: false, dotEnvRead: false, envPrinted: false, sourceDumpIncluded: false };
}
module.exports = { inspectFactoryHermesCredentialSource };
