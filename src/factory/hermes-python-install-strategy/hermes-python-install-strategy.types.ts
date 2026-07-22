import type { FactoryHermesInstallVerificationResult } from '../hermes-install-verification/index.ts';

export type FactoryHermesPythonInstallStrategyVersion = '1.0';
export type FactoryHermesPythonInstallStrategyKind = 'factory_hermes_python_install_strategy';
export type FactoryHermesPythonManager = 'uv' | 'pip' | 'poetry' | 'mixed' | 'unknown';
export type FactoryHermesPythonInstallStrategyDecision = 'blocked' | 'human_review_required' | 'no_python_strategy_required' | 'python_install_strategy_ready';
export type FactoryHermesPythonInstallStrategyStatus = 'blocked' | 'human_review_required' | 'python_install_strategy_ready';
export type FactoryHermesPythonManagerDecision = 'prefer_uv_lock' | 'prefer_venv_pip' | 'require_manual_python_review' | 'block_python_install';

export interface FactoryHermesPythonSurfaceSnapshot {
  sourceRoot: string;
  pyprojectPresent: boolean;
  setupPyPresent: boolean;
  setupCfgPresent: boolean;
  uvLockPresent: boolean;
  requirementsPresent: boolean;
  poetryLockPresent: boolean;
  pipfilePresent: boolean;
  pythonPackagesDetected: string[];
  cliEntrypointsDetected: string[];
  pythonScriptsDetected: string[];
  likelyPythonManager: FactoryHermesPythonManager;
  strategyRiskNotes: string[];
}

export interface FactoryHermesPythonInstallStrategyPolicy {
  requireInstallVerification: boolean; requireNodeInstallVerified: boolean; requirePythonSurfaceSnapshot: boolean; requireIsolatedPythonEnv: boolean; requireHumanReviewForPythonInstall: boolean; preferUvLockIfPresent: boolean; allowPipOnlyWithVenv: boolean; forbidGlobalPipInstall: boolean; forbidSetupPyDirectExecution: boolean; forbidPythonInstallInThisGate: boolean; forbidHermesExecutionInThisGate: boolean; forbidScriptsInThisGate: boolean; forbidCredentialsInThisGate: boolean; forbidModelCallsInThisGate: boolean; forbidProjectMutation: boolean; forbidPackageFileMutation: boolean; requireFuturePythonInstallRuntimeAdapter: boolean; requireFutureInstallVerification: boolean; requireJefeReviewFuture: boolean;
}

export interface FactoryHermesPythonInstallStrategyInput {
  installVerificationResult?: FactoryHermesInstallVerificationResult;
  pythonSurfaceSnapshot?: FactoryHermesPythonSurfaceSnapshot;
  createdAt: string;
  createdBy: string;
  policy?: Partial<FactoryHermesPythonInstallStrategyPolicy>;
  humanReviewRef?: string;
  preferredPythonManager?: FactoryHermesPythonManager;
}

export interface FactoryHermesPythonInstallStep { stepId: string; description: string; declarativeOnly: true; executed: false }
export interface FactoryHermesPythonValidationStep { stepId: string; description: string; declarativeOnly: true; executed: false }
export interface FactoryHermesPythonRisk { riskId: string; severity: 'info' | 'warning' | 'error' | 'critical'; description: string; mitigation: string }
export interface FactoryHermesPythonInstallStrategyCheck { checkId: string; ok: boolean; message: string }
export interface FactoryHermesPythonInstallStrategyBlocker { blockerId: string; message: string }
export interface FactoryHermesPythonInstallStrategyWarning { warningId: string; message: string }

export interface FactoryHermesPythonInstallStrategyPlan {
  strategyPlanId: string;
  strategyKind: FactoryHermesPythonInstallStrategyKind;
  strategyVersion: FactoryHermesPythonInstallStrategyVersion;
  toolId: 'hermes_agent';
  auditedHead: string;
  sourceRootRef: string;
  installRootRef: string;
  pythonEnvRootSuggestion: string;
  managerDecision: FactoryHermesPythonManagerDecision;
  installSteps: FactoryHermesPythonInstallStep[];
  validationSteps: FactoryHermesPythonValidationStep[];
  forbiddenSteps: string[];
  risks: FactoryHermesPythonRisk[];
  installAllowedNow: false;
  pythonInstallRuntimeAllowedNow: false;
  executionAllowedNow: false;
  credentialsAllowedNow: false;
  modelCallsAllowedNow: false;
  recommendedNextStep: string;
}

export interface FactoryHermesPythonInstallStrategyResult {
  resultId: string;
  resultKind: FactoryHermesPythonInstallStrategyKind;
  resultVersion: FactoryHermesPythonInstallStrategyVersion;
  createdAt: string;
  createdBy: string;
  decision: FactoryHermesPythonInstallStrategyDecision;
  status: FactoryHermesPythonInstallStrategyStatus;
  snapshot?: FactoryHermesPythonSurfaceSnapshot;
  strategyPlan?: FactoryHermesPythonInstallStrategyPlan;
  checks: FactoryHermesPythonInstallStrategyCheck[];
  blockers: FactoryHermesPythonInstallStrategyBlocker[];
  warnings: FactoryHermesPythonInstallStrategyWarning[];
  installAllowedNow: false;
  pythonInstallRuntimeAllowedNow: false;
  executionAllowedNow: false;
  credentialsAllowedNow: false;
  modelCallsAllowedNow: false;
  canExecuteHermes: false;
  recommendedNextStep: string;
}

export interface FactoryHermesPythonInstallStrategyValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesPythonInstallStrategySummary { strategyPlanId?: string; auditedHead?: string; managerDecision?: FactoryHermesPythonManagerDecision; pyprojectPresent?: boolean; uvLockPresent?: boolean; setupPyPresent?: boolean; installAllowedNow: false; executionAllowedNow: false; nextStep: string }
