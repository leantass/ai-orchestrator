import { DEFAULT_FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_POLICY, FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_KIND, FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_VERSION, HERMES_PYTHON_INSTALL_STRATEGY_NEXT_STEP } from './hermes-python-install-strategy.defaults.ts';
import type { FactoryHermesPythonInstallStrategyInput, FactoryHermesPythonInstallStrategyPlan, FactoryHermesPythonInstallStrategyPolicy, FactoryHermesPythonInstallStrategyResult } from './hermes-python-install-strategy.types.ts';

function policy(p?: Partial<FactoryHermesPythonInstallStrategyPolicy>): FactoryHermesPythonInstallStrategyPolicy { return { ...DEFAULT_FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_POLICY, ...p, forbidGlobalPipInstall: true, forbidSetupPyDirectExecution: true, forbidPythonInstallInThisGate: true, forbidHermesExecutionInThisGate: true, forbidScriptsInThisGate: true, forbidCredentialsInThisGate: true, forbidModelCallsInThisGate: true, forbidProjectMutation: true, forbidPackageFileMutation: true } }
function blocked(input: FactoryHermesPythonInstallStrategyInput, message: string): FactoryHermesPythonInstallStrategyResult { return { resultId: `hermes-python-install-strategy:${input.createdAt}:${input.createdBy}`, resultKind: FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_KIND, resultVersion: FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_VERSION, createdAt: input.createdAt, createdBy: input.createdBy, decision: 'blocked', status: 'blocked', snapshot: input.pythonSurfaceSnapshot, checks: [], blockers: [{ blockerId: 'blocked', message }], warnings: [], installAllowedNow: false, pythonInstallRuntimeAllowedNow: false, executionAllowedNow: false, credentialsAllowedNow: false, modelCallsAllowedNow: false, canExecuteHermes: false, recommendedNextStep: 'Repair install verification before Python strategy.' } }

export function evaluateFactoryHermesPythonInstallStrategy(input: FactoryHermesPythonInstallStrategyInput): FactoryHermesPythonInstallStrategyResult {
  const cfg = policy(input.policy);
  const verification = input.installVerificationResult;
  const snapshot = input.pythonSurfaceSnapshot;
  if (!verification) return blocked(input, 'install verification is required.');
  if (cfg.requireNodeInstallVerified && !verification.nodeInstallVerified) return blocked(input, 'node install must be verified.');
  if (!snapshot) return blocked(input, 'python surface snapshot is required.');
  const hasPythonSurface = snapshot.pyprojectPresent || snapshot.setupPyPresent || snapshot.uvLockPresent || snapshot.requirementsPresent || snapshot.pythonPackagesDetected.length > 0;
  if (!hasPythonSurface) return { ...blocked(input, 'no python strategy required.'), decision: 'no_python_strategy_required' };
  if (cfg.requireHumanReviewForPythonInstall && !input.humanReviewRef) return { ...blocked(input, 'humanReviewRef is required.'), decision: 'human_review_required', status: 'human_review_required', recommendedNextStep: 'Provide human review before Python install strategy approval.' };
  const managerDecision = snapshot.uvLockPresent && snapshot.pyprojectPresent ? 'prefer_uv_lock' : snapshot.pyprojectPresent || snapshot.setupPyPresent ? 'prefer_venv_pip' : 'require_manual_python_review';
  const auditedHead = verification.auditedHead ?? 'unknown';
  const installRootRef = verification.installRoot;
  const plan: FactoryHermesPythonInstallStrategyPlan = {
    strategyPlanId: `hermes-python-install-strategy:${auditedHead.slice(0, 7)}:${input.createdAt}`,
    strategyKind: FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_KIND,
    strategyVersion: FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_VERSION,
    toolId: 'hermes_agent',
    auditedHead,
    sourceRootRef: snapshot.sourceRoot,
    installRootRef,
    pythonEnvRootSuggestion: `${installRootRef}/python-env/`,
    managerDecision,
    installSteps: managerDecision === 'prefer_uv_lock' ? [
      { stepId: 'verify_uv_future', description: 'Future runtime verifies uv availability without global install.', declarativeOnly: true, executed: false },
      { stepId: 'create_isolated_python_env', description: 'Future runtime creates isolated python env under python-env.', declarativeOnly: true, executed: false },
      { stepId: 'install_from_uv_lock', description: 'Future runtime installs from uv.lock after approval.', declarativeOnly: true, executed: false },
    ] : [
      { stepId: 'verify_python_future', description: 'Future runtime verifies Python version.', declarativeOnly: true, executed: false },
      { stepId: 'create_venv', description: 'Future runtime creates venv under python-env.', declarativeOnly: true, executed: false },
      { stepId: 'venv_pip_install', description: 'Future runtime uses venv pip only; never setup.py directly.', declarativeOnly: true, executed: false },
    ],
    validationSteps: [
      { stepId: 'verify_no_global_site_packages', description: 'Verify no global site packages.', declarativeOnly: true, executed: false },
      { stepId: 'verify_no_credentials', description: 'Verify no credentials or .env reads.', declarativeOnly: true, executed: false },
      { stepId: 'verify_hermes_not_executed', description: 'Verify Hermes remains not executed.', declarativeOnly: true, executed: false },
    ],
    forbiddenSteps: ['global pip install', 'setup.py execution', 'install.sh/install.ps1', 'reading .env', 'using credentials', 'executing Hermes', 'running arbitrary scripts'],
    risks: snapshot.setupPyPresent ? [{ riskId: 'setup_py_present_direct_execution_forbidden', severity: 'warning', description: 'setup.py exists and must not be executed directly.', mitigation: 'Use isolated future strategy only.' }] : [],
    installAllowedNow: false, pythonInstallRuntimeAllowedNow: false, executionAllowedNow: false, credentialsAllowedNow: false, modelCallsAllowedNow: false, recommendedNextStep: HERMES_PYTHON_INSTALL_STRATEGY_NEXT_STEP,
  };
  return { resultId: `${plan.strategyPlanId}:result`, resultKind: FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_KIND, resultVersion: FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_VERSION, createdAt: input.createdAt, createdBy: input.createdBy, decision: 'python_install_strategy_ready', status: 'python_install_strategy_ready', snapshot, strategyPlan: plan, checks: [{ checkId: 'node_install_verified', ok: true, message: 'Node install verified.' }], blockers: [], warnings: snapshot.setupPyPresent ? [{ warningId: 'setup_py_present', message: 'setup.py direct execution is forbidden.' }] : [], installAllowedNow: false, pythonInstallRuntimeAllowedNow: false, executionAllowedNow: false, credentialsAllowedNow: false, modelCallsAllowedNow: false, canExecuteHermes: false, recommendedNextStep: HERMES_PYTHON_INSTALL_STRATEGY_NEXT_STEP };
}
