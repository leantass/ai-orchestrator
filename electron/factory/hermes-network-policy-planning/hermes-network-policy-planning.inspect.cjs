const fs = require('node:fs');
const path = require('node:path');

const SOURCE_FILES = [
  'hermes_cli/runtime_provider.py',
  'hermes_cli/config.py',
  'hermes_cli/auth.py',
  'hermes_cli/oneshot.py',
  'hermes_cli/tools_config.py',
  'toolsets.py',
  'run_agent.py',
  'README.md',
  'pyproject.toml',
];

const KEYWORDS = ['network', 'web', 'browser', 'search', 'requests', 'http', 'https', 'openai', 'anthropic', 'gemini', 'google', 'provider', 'endpoint', 'base_url', 'api_base', 'toolsets', 'no-network', 'offline', 'timeout', 'retries', 'proxy'];

function walkInteresting(root, limit = 60) {
  const out = [];
  function walk(dir) {
    if (out.length >= limit || !fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['.git', '.venv', 'python-env', '__pycache__', 'node_modules'].includes(entry.name)) walk(full);
      } else if (/\.(py|md|toml|yaml|yml|cfg|ini|txt)$/i.test(entry.name) && /(network|web|browser|search|provider|tool|config|auth|agent|readme|pyproject|run_agent|oneshot)/i.test(full)) {
        out.push(path.relative(root, full).replace(/\\/g, '/'));
      }
    }
  }
  walk(root);
  return out;
}

function readSmall(file) {
  if (!fs.existsSync(file)) return '';
  const stat = fs.statSync(file);
  if (stat.size > 500_000) return '';
  return fs.readFileSync(file, 'utf8');
}

function hostCandidatesFor(provider, text) {
  const hosts = new Set();
  const urlRe = /https?:\/\/([a-z0-9.-]+)/giu;
  let match;
  while ((match = urlRe.exec(text))) {
    const host = match[1].toLowerCase();
    if (provider === 'openai' && host.includes('openai')) hosts.add(host);
    if (provider === 'anthropic' && host.includes('anthropic')) hosts.add(host);
    if (provider === 'gemini_google' && (host.includes('google') || host.includes('gemini'))) hosts.add(host);
  }
  return [...hosts].sort();
}

function inspectFactoryHermesNetworkSource(sourceRoot) {
  const sourceFilesInspected = [...new Set([...SOURCE_FILES, ...walkInteresting(sourceRoot)])];
  const evidence = [];
  let allText = '';
  for (const rel of sourceFilesInspected) {
    const text = readSmall(path.join(sourceRoot, rel));
    if (!text) continue;
    allText += `\n${text}`;
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (KEYWORDS.some((keyword) => line.toLowerCase().includes(keyword))) {
        evidence.push({ file: rel, line: index + 1, keywords: KEYWORDS.filter((keyword) => line.toLowerCase().includes(keyword)), excerpt: line.trim().slice(0, 180) });
      }
      if (evidence.length >= 80) break;
    }
  }
  return {
    inspectionMode: 'source_text_network_reference_extraction_only',
    sourceFilesInspected,
    evidence,
    providerHostCandidates: {
      openai: hostCandidatesFor('openai', allText),
      anthropic: hostCandidatesFor('anthropic', allText),
      gemini_google: hostCandidatesFor('gemini_google', allText),
    },
    networkKeywordsObserved: [...new Set(evidence.flatMap((item) => item.keywords))].sort(),
    networkUsed: false,
    dnsResolved: false,
    endpointsTested: false,
    envValuesRead: false,
    dotEnvRead: false,
    credentialsRead: false,
    modelCallsPerformed: false,
    sourceDumpIncluded: false,
  };
}

module.exports = { inspectFactoryHermesNetworkSource };
