const fs = require('node:fs');
const path = require('node:path');

const SOURCE_FILES = ['hermes_cli/oneshot.py', 'hermes_cli/main.py', 'run_agent.py', 'hermes_cli/config.py', 'README.md', 'pyproject.toml'];
const KEYWORDS = ['final_response', 'stdout', 'stderr', 'print', 'usage-file', 'usage_file', 'json', 'tokens', 'cost', 'model', 'api_calls', 'output', 'response', 'result', 'logs', 'logging', 'structured', 'schema', 'markdown', 'plain text', 'error', 'exception', 'trace', 'debug', 'usage'];

function walkInteresting(root, limit = 60) {
  const out = [];
  function walk(dir) {
    if (out.length >= limit || !fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['.git', '.venv', 'python-env', '__pycache__', 'node_modules'].includes(entry.name)) walk(full);
      } else if (/\.(py|md|toml|yaml|yml|cfg|ini|txt)$/i.test(entry.name) && /(output|logging|usage|result|response|agent|oneshot|main|readme|pyproject)/i.test(full)) {
        out.push(path.relative(root, full).replace(/\\/g, '/'));
      }
    }
  }
  walk(root);
  return out;
}

function readSmall(file) {
  if (!fs.existsSync(file)) return '';
  if (fs.statSync(file).size > 500_000) return '';
  return fs.readFileSync(file, 'utf8');
}

function inspectFactoryHermesOutputSource(sourceRoot) {
  const sourceFilesInspected = [...new Set([...SOURCE_FILES, ...walkInteresting(sourceRoot)])];
  const evidence = [];
  for (const rel of sourceFilesInspected) {
    const text = readSmall(path.join(sourceRoot, rel));
    if (!text) continue;
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const lower = line.toLowerCase();
      if (KEYWORDS.some((keyword) => lower.includes(keyword))) evidence.push({ file: rel, line: index + 1, keywords: KEYWORDS.filter((keyword) => lower.includes(keyword)), excerpt: line.trim().slice(0, 180) });
      if (evidence.length >= 100) break;
    }
  }
  return { inspectionMode: 'source_text_output_reference_extraction_only', sourceFilesInspected, evidence, outputReferencesObserved: [...new Set(evidence.flatMap((item) => item.keywords))].sort(), hermesExecuted: false, promptSent: false, outputUsedAsFindings: false, toolsetsEnabled: false, networkUsed: false, dnsResolved: false, endpointsTested: false, envValuesRead: false, dotEnvRead: false, credentialsRead: false, modelCallsPerformed: false, sourceDumpIncluded: false };
}

module.exports = { inspectFactoryHermesOutputSource };
