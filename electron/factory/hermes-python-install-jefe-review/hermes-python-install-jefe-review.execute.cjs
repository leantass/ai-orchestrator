const path = require('node:path');
const { resolveFactoryHermesPythonInstallJefeReviewPaths, assertJefeReviewPathContained, readJsonFile, writeJsonFile } = require('./hermes-python-install-jefe-review.path.cjs');

const KIND = 'factory-hermes-python-install-jefe-review';
const VERSION = '1.0';
const NEXT = 'Proceed to Factory Hermes Research Runtime Planning Gate v1; Hermes execution remains forbidden.';
const notAuthorizedActions = ['execute_hermes_now', 'run_hermes_scripts_now', 'call_models_now', 'access_credentials_now', 'execute_codex_now', 'deploy_now', 'mutate_project_files_now', 'execute_uv_run', 'execute_uv_pip', 'execute_pip', 'execute_python_direct', 'execute_setup_py', 'create_research_runtime_now'];

function evaluate(input) {
  const v = input.pythonInstallVerificationResult;
  const id = `hermes-python-install-jefe-review:75b300f:${input.reviewedAt}`;
  const base = { jefeReviewId: id, jefeReviewKind: KIND, jefeReviewVersion: VERSION, reviewedAt: input.reviewedAt, reviewedBy: input.reviewedBy, toolId: 'hermes_agent', auditedHead: v?.auditedHead || '', installRootRef: v?.installRootRef || '', sourceRootRef: v?.sourceRootRef || '', pythonEnvRootRef: v?.pythonEnvRootRef || '', uvExecutableRef: v?.uvExecutableRef || '', uvVerificationRef: v?.uvVerificationRef || '', pythonInstallVerificationRef: v?.pythonInstallVerificationResultRef || '', verificationStatus: v?.status || 'missing', verificationDecision: v?.decision || 'missing', checks: [], blockers: [], warnings: [], canExecuteHermes: false, canRunHermesScripts: false, canUseCredentials: false, canCallModels: false, canMutateProjectFiles: false, canDeploy: false, recommendedNextStep: NEXT };
  if (!v) return { ...base, status: 'blocked', decision: 'blocked_missing_python_install_verification', canProceedToResearchRuntimePlanning: false, blockers: [{ blockerId: 'blocked_missing_python_install_verification', message: 'Python install verification result is required.' }] };
  if (v.status !== 'verified' || v.decision !== 'hermes_python_install_verified' || v.canProceedToJefeReview !== true) return { ...base, status: 'blocked', decision: 'blocked_python_install_not_verified', canProceedToResearchRuntimePlanning: false, blockers: [{ blockerId: 'blocked_python_install_not_verified', message: 'Python install verification is not verified for JEFE review.' }] };
  if (v.canExecuteHermes === true) return { ...base, status: 'blocked', decision: 'blocked_verification_allows_hermes_execution', canProceedToResearchRuntimePlanning: false, blockers: [{ blockerId: 'blocked_verification_allows_hermes_execution', message: 'Verification must not allow Hermes execution.' }] };
  if (v.pipStatus !== 'not_executed' || v.pythonDirectStatus !== 'not_executed' || v.setupPyStatus !== 'not_executed' || v.hermesExecutionStatus !== 'not_allowed' || v.canRunHermesScripts === true || v.canUseCredentials === true || v.canCallModels === true || v.canDeploy === true) return { ...base, status: 'changes_required', decision: 'request_python_install_repair_before_review', canProceedToResearchRuntimePlanning: false, blockers: [{ blockerId: 'request_python_install_repair_before_review', message: 'Verification contains unsafe execution or capability status.' }] };
  if (!input.humanApprovalRef) return { ...base, status: 'human_review_required', decision: 'blocked_missing_human_approval', canProceedToResearchRuntimePlanning: false, blockers: [{ blockerId: 'blocked_missing_human_approval', message: 'humanApprovalRef is required.' }] };
  const reviewReceipt = { receiptId: `${id}:receipt`, jefeReviewId: id, toolId: 'hermes_agent', auditedHead: v.auditedHead, reviewedBy: input.reviewedBy, reviewedAt: input.reviewedAt, humanApprovalRef: input.humanApprovalRef, decision: 'hermes_python_install_jefe_review_approved_for_research_runtime_planning', scope: 'hermes_python_install_readiness_for_research_runtime_planning', approvedNextGate: 'Factory Hermes Research Runtime Planning Gate v1', limitations: ['Planning only.', 'Hermes execution remains forbidden.', 'No model calls or credentials.'], notAuthorizedActions };
  const approvedHermesPythonInstallReadinessEnvelope = { envelopeId: `${id}:readiness-envelope`, jefeReviewId: id, toolId: 'hermes_agent', auditedHead: v.auditedHead, sourceRootRef: v.sourceRootRef, installRootRef: v.installRootRef, pythonEnvRootRef: v.pythonEnvRootRef, uvExecutableRef: v.uvExecutableRef, uvVerificationRef: v.uvVerificationRef, pythonInstallVerificationRef: v.pythonInstallVerificationResultRef, verificationSummary: { status: v.status, decision: v.decision, pythonInstallStatus: v.pythonInstallStatus, pythonEnvStatus: v.pythonEnvStatus, uvVerificationStatus: v.uvVerificationStatus }, approvedNextGate: 'Factory Hermes Research Runtime Planning Gate v1', pythonInstallReadinessStatus: 'approved_for_planning_only', hermesExecutionStatus: 'not_allowed', scriptsStatus: 'not_allowed', credentialsStatus: 'not_allowed', modelCallStatus: 'not_allowed', projectMutationStatus: 'not_allowed', deployStatus: 'not_allowed', canProceedToResearchRuntimePlanning: true, canExecuteHermes: false, canRunHermesScripts: false, recommendedNextStep: NEXT };
  return { ...base, status: 'approved', decision: 'hermes_python_install_jefe_review_approved_for_research_runtime_planning', reviewReceipt, approvedHermesPythonInstallReadinessEnvelope, canProceedToResearchRuntimePlanning: true };
}

async function executeFactoryHermesPythonInstallJefeReview(input) {
  const paths = resolveFactoryHermesPythonInstallJefeReviewPaths();
  assertJefeReviewPathContained(paths.installRoot, path.join(paths.root, '.codex-temp'));
  assertJefeReviewPathContained(paths.verificationResult, paths.installRoot);
  assertJefeReviewPathContained(paths.jefeReviewResult, paths.installRoot);
  const pythonInstallVerificationResult = await readJsonFile(paths.verificationResult);
  const result = evaluate({ ...input, pythonInstallVerificationResult });
  await writeJsonFile(paths.jefeReviewResult, result);
  return result;
}
module.exports = { executeFactoryHermesPythonInstallJefeReview };
