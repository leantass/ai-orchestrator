const fs = require('node:fs');
const path = require('node:path');

const SOURCE_FILES = ['hermes_cli/tools_config.py', 'toolsets.py', 'run_agent.py', 'hermes_cli/config.py', 'hermes_cli/oneshot.py', 'hermes_cli/main.py', 'README.md', 'pyproject.toml'];
const KEYWORDS = ['--toolsets', 'toolsets', 'tools', 'web', 'browser', 'terminal', 'shell', 'mcp', 'no_mcp', 'search', 'filesystem', 'file', 'default', 'empty', 'disabled', 'config.yaml', 'registry', 'read', 'write'];

function walkInteresting(root, limit = 60) {
  const out = [];
  function walk(dir) {
    if (out.length >= limit || !fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['.git', '.venv', 'python-env', '__pycache__', 'node_modules'].includes(entry.name)) walk(full);
      } else if (/\.(py|md|toml|yaml|yml|cfg|ini|txt)$/i.test(entry.name) && /(tool|mcp|browser|web|terminal|config|agent|readme|pyproject|oneshot|main)/i.test(full)) {
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

function inspectFactoryHermesToolsetsSource(sourceRoot) {
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
      const lower = line.toLowerCase();
      if (KEYWORDS.some((keyword) => lower.includes(keyword))) {
        evidence.push({ file: rel, line: index + 1, keywords: KEYWORDS.filter((keyword) => lower.includes(keyword)), excerpt: line.trim().slice(0, 180) });
      }
      if (evidence.length >= 100) break;
    }
  }
  return {
    inspectionMode: 'source_text_toolsets_reference_extraction_only',
    sourceFilesInspected,
    evidence,
    toolsetNamesObserved: [...new Set(['web', 'browser', 'terminal', 'mcp', 'filesystem'].filter((name) => allText.toLowerCase().includes(name)))].sort(),
    noToolsetsTextOnlySupported: /\b(no_mcp|no tools|empty toolsets|disable.*tools|toolsets.*empty)\b/iu.test(allText),
    toolsetsEnabled: false,
    webToolsExecuted: false,
    browserToolsExecuted: false,
    terminalToolsExecuted: false,
    mcpExecuted: false,
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

module.exports = { inspectFactoryHermesToolsetsSource };
