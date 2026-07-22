const fs = require('node:fs');
const path = require('node:path');
const { toRef } = require('./hermes-research-execution-planning.path.cjs');

function safeReadText(file, maxBytes = 12000) {
  if (!fs.existsSync(file)) return '';
  const fd = fs.openSync(file, 'r');
  try {
    const buffer = Buffer.alloc(maxBytes);
    const bytesRead = fs.readSync(fd, buffer, 0, maxBytes, 0);
    return buffer.subarray(0, bytesRead).toString('utf8');
  } finally {
    fs.closeSync(fd);
  }
}

function makeHelpProbeInspection(adapterRetryResult) {
  const help = String(adapterRetryResult.stdoutPreview || adapterRetryResult.commandResults?.[0]?.stdoutPreview || '');
  return {
    helpProbeStatus: adapterRetryResult.helpProbeStatus || '',
    helpOutputRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/research-runtime-adapter-retry-result.json:stdoutPreview',
    hasOneshotPromptFlag: /(?:-z PROMPT|--oneshot PROMPT)/u.test(help),
    hasModelFlag: /--model MODEL|-m MODEL/u.test(help),
    hasProviderFlag: /--provider PROVIDER/u.test(help),
    hasToolsetsFlag: /--toolsets TOOLSETS|-t TOOLSETS/u.test(help),
    hasSafeModeFlag: /--safe-mode/u.test(help),
    hasIgnoreUserConfigFlag: /--ignore-user-config/u.test(help),
    hasExplicitDryRunOrMockFlag: /dry-run|mock/u.test(help),
    hasExplicitNoNetworkResearchFlag: /no-network|offline/u.test(help),
    evidence: [
      /--oneshot PROMPT/u.test(help) ? 'Help output exposes --oneshot PROMPT.' : 'No --oneshot prompt evidence found.',
      /--model MODEL/u.test(help) ? 'Help output exposes --model MODEL.' : 'No --model evidence found.',
      /--provider PROVIDER/u.test(help) ? 'Help output exposes --provider PROVIDER.' : 'No provider evidence found.',
      /--safe-mode/u.test(help) ? 'Help output exposes --safe-mode, but not as a research no-network contract.' : 'No safe-mode evidence found.',
    ],
  };
}

function findFirstExisting(sourceRoot, names) {
  for (const name of names) {
    const p = path.join(sourceRoot, name);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function makeSourceInspection(sourceRoot) {
  const pyproject = path.join(sourceRoot, 'pyproject.toml');
  const readme = findFirstExisting(sourceRoot, ['README.md', 'README.rst']);
  const cliMain = path.join(sourceRoot, 'src', 'hermes_cli', 'main.py');
  const pyprojectText = safeReadText(pyproject);
  const readmeText = readme ? safeReadText(readme) : '';
  const cliText = safeReadText(cliMain);
  const consoleMatch = pyprojectText.match(/hermes\s*=\s*["']hermes_cli\.main:main["']/u);
  const combined = `${pyprojectText}\n${readmeText}\n${cliText}`;
  const inspectedFiles = [pyproject, readme, cliMain].filter(Boolean).filter((p) => fs.existsSync(p)).map(toRef);
  return {
    sourceRootRef: toRef(sourceRoot),
    inspectedFiles,
    pyprojectPresent: fs.existsSync(pyproject),
    readmePresent: Boolean(readme),
    hermesCliMainPresent: fs.existsSync(cliMain),
    consoleScriptEvidence: consoleMatch ? 'pyproject declares hermes = "hermes_cli.main:main"' : undefined,
    safeMockOrDryRunEvidence: /dry-run|mock|offline research|no-network research/iu.test(combined),
    notes: [
      'Source inspection was read-only and bounded.',
      consoleMatch ? 'Console script identity is consistent with previous gates.' : 'Console script identity was not found in inspected pyproject snippet.',
    ],
  };
}

module.exports = { makeHelpProbeInspection, makeSourceInspection };
