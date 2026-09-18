const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeResolutionVerificationPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-resolution-verification.path.cjs');

const execFileAsync = promisify(execFile);

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function runAllowed(name, file, args = []) {
  try {
    const { stdout, stderr } = await execFileAsync(file, args, { cwd: process.cwd(), windowsHide: true, timeout: 120000 });
    return { name, ok: true, command: [file, ...args].join(' '), stdoutPreview: stdout.slice(0, 400), stderrPreview: stderr.slice(0, 400) };
  } catch (error) {
    return { name, ok: false, command: [file, ...args].join(' '), message: error.message, stdoutPreview: String(error.stdout || '').slice(0, 400), stderrPreview: String(error.stderr || '').slice(0, 400) };
  }
}

async function staticScan(paths) {
  const targets = [
    ['rendererTs', path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-command-renderer', 'index.ts')],
    ['rendererCjs', path.join(paths.repoRoot, 'electron', 'factory', 'hermes-controlled-research-runtime-command-renderer', 'index.cjs')],
    ['wrapperTs', path.join(paths.repoRoot, 'src', 'factory', 'hermes-wrapper-fail-closed-command-builder', 'index.ts')],
    ['wrapperCjs', path.join(paths.repoRoot, 'electron', 'factory', 'hermes-wrapper-fail-closed-command-builder', 'index.cjs')],
    ['implementationTs', path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-implementation', 'index.ts')],
    ['implementationExecuteCjs', path.join(paths.repoRoot, 'electron', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-implementation', 'hermes-controlled-research-runtime-safe-command-shape-resolution-implementation.execute.cjs')],
    ['implementationPathCjs', path.join(paths.repoRoot, 'electron', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-implementation', 'hermes-controlled-research-runtime-safe-command-shape-resolution-implementation.path.cjs')],
    ['implementationIndexCjs', path.join(paths.repoRoot, 'electron', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-implementation', 'index.cjs')],
  ];
  const importRules = [
    ['child_process', /require\(['"]node:child_process['"]\)|from ['"]node:child_process['"]/],
    ['network_import', /require\(['"]node:(http|https|net|dns)['"]\)|from ['"]node:(http|https|net|dns)['"]/],
  ];
  const codeRules = [
    ['spawn_exec_fork', /\b(spawn|exec|execFile|fork)\s*\(/],
    ['process_env', /process\.env/],
    ['dot_env', /\.env|dotenv/i],
    ['fs_write', /\b(writeFile|appendFile|mkdir|rm|unlink|rename|copyFile)\s*\(/],
    ['network_call', /fetch\s*\(/],
    ['model_call', /openai|chat\.completions|responses\.create/i],
    ['hermes_invocation', /hermes\.exe|--oneshot|spawnHermes|executeHermes\s*\(/i],
  ];
  const findings = [];
  for (const [label, target] of targets) {
    const text = await fs.readFile(target, 'utf8');
    const codeOnly = text.replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '');
    for (const [rule, pattern] of importRules) {
      if (pattern.test(text)) findings.push({ label, rule });
    }
    for (const [rule, pattern] of codeRules) {
      if (rule === 'fs_write' && label.startsWith('implementation')) continue;
      if (pattern.test(codeOnly)) findings.push({ label, rule });
    }
  }
  return {
    ok: findings.length === 0,
    rendererSafe: !findings.some((finding) => finding.label.startsWith('renderer')),
    wrapperSafe: !findings.some((finding) => finding.label.startsWith('wrapper')),
    findings,
    scannedFiles: targets.map(([, target]) => path.relative(paths.repoRoot, target)),
  };
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerification(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPaths();
  for (const target of [paths.resultArtifact, paths.verificationApprovalResult, paths.verificationPlanningResult, paths.implementationResult]) {
    assertControlledResearchRuntimeSafeCommandShapeResolutionVerificationPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-verification', 'index.ts')).href);
  const [verificationApprovalResult, verificationPlanningResult, implementationResult] = await Promise.all([
    readJson(paths.verificationApprovalResult),
    readJson(paths.verificationPlanningResult),
    readJson(paths.implementationResult),
  ]);
  const npmCommand = process.platform === 'win32' ? ['cmd.exe', ['/c', 'npm']] : ['npm', []];
  const commandResults = {
    rendererNodeCheck: await runAllowed('rendererNodeCheck', 'node', ['--check', 'scripts/factory-hermes-controlled-research-runtime-command-renderer-smoke.mjs']),
    rendererSmoke: await runAllowed('rendererSmoke', 'node', ['scripts/factory-hermes-controlled-research-runtime-command-renderer-smoke.mjs']),
    wrapperNodeCheck: await runAllowed('wrapperNodeCheck', 'node', ['--check', 'scripts/factory-hermes-wrapper-fail-closed-command-builder-smoke.mjs']),
    wrapperSmoke: await runAllowed('wrapperSmoke', 'node', ['scripts/factory-hermes-wrapper-fail-closed-command-builder-smoke.mjs']),
    implementationNodeCheck: await runAllowed('implementationNodeCheck', 'node', ['--check', 'scripts/factory-hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-smoke.mjs']),
    implementationSmoke: await runAllowed('implementationSmoke', 'node', ['scripts/factory-hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-smoke.mjs']),
    verificationApprovalNodeCheck: await runAllowed('verificationApprovalNodeCheck', 'node', ['--check', 'scripts/factory-hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval-smoke.mjs']),
    verificationApprovalSmoke: await runAllowed('verificationApprovalSmoke', 'node', ['scripts/factory-hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval-smoke.mjs']),
    typecheck: await runAllowed('typecheck', npmCommand[0], [...npmCommand[1], 'run', 'typecheck']),
    build: await runAllowed('build', npmCommand[0], [...npmCommand[1], 'run', 'build']),
    diffCheck: await runAllowed('diffCheck', 'git', ['diff', '--check']),
  };
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerification({
    verifiedAt: input.verifiedAt || '2026-07-24T22:30:00.000Z',
    verifiedBy: input.verifiedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-resolution-verification-smoke',
    verificationApprovalResult,
    verificationPlanningResult,
    implementationResult,
    commandResults,
    staticScanResult: await staticScan(paths),
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerification };
