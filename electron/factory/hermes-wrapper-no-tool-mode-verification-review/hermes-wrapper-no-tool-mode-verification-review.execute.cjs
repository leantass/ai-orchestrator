const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertWrapperNoToolModeVerificationReviewPathContained, resolveFactoryHermesWrapperNoToolModeVerificationReviewPaths } = require('./hermes-wrapper-no-tool-mode-verification-review.path.cjs');
async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
async function executeFactoryHermesWrapperNoToolModeVerificationReview(input = {}) {
  const paths = resolveFactoryHermesWrapperNoToolModeVerificationReviewPaths();
  for (const [key, value] of Object.entries(paths)) { if (key === 'repoRoot' || key === 'installRoot') continue; const root = key === 'implementationReport' ? path.join(paths.repoRoot, '.codex-temp') : paths.installRoot; assertWrapperNoToolModeVerificationReviewPathContained(value, root); }
  const moduleUrl = pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-wrapper-no-tool-mode-verification-review', 'index.ts')).href;
  const mod = await import(moduleUrl);
  const result = mod.evaluateFactoryHermesWrapperNoToolModeVerificationReview({ reviewedAt: input.reviewedAt || '2026-07-23T09:00:00.000Z', reviewedBy: input.reviewedBy || 'factory-hermes-wrapper-no-tool-mode-verification-review-smoke', verificationResult: input.verificationResult || await readJson(paths.verificationResult), verificationApprovalResult: input.verificationApprovalResult || await readJson(paths.verificationApprovalResult), verificationPlanningResult: input.verificationPlanningResult || await readJson(paths.verificationPlanningResult), implementationResult: input.implementationResult || await readJson(paths.implementationResult), adapterApprovalResult: input.adapterApprovalResult || await readJson(paths.adapterApprovalResult) });
  await fs.mkdir(path.dirname(paths.verificationReviewResult), { recursive: true });
  await fs.writeFile(paths.verificationReviewResult, mod.serializeFactoryHermesWrapperNoToolModeVerificationReviewResult(result));
  return result;
}
module.exports = { executeFactoryHermesWrapperNoToolModeVerificationReview };
