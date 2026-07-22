import type { FactoryHermesPythonInstallStrategyKind, FactoryHermesPythonInstallStrategyPolicy, FactoryHermesPythonInstallStrategyVersion } from './hermes-python-install-strategy.types.ts';

export const FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_KIND: FactoryHermesPythonInstallStrategyKind = 'factory_hermes_python_install_strategy';
export const FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_VERSION: FactoryHermesPythonInstallStrategyVersion = '1.0';
export const DEFAULT_FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_POLICY: FactoryHermesPythonInstallStrategyPolicy = {
  requireInstallVerification: true, requireNodeInstallVerified: true, requirePythonSurfaceSnapshot: true, requireIsolatedPythonEnv: true, requireHumanReviewForPythonInstall: true, preferUvLockIfPresent: true, allowPipOnlyWithVenv: true, forbidGlobalPipInstall: true, forbidSetupPyDirectExecution: true, forbidPythonInstallInThisGate: true, forbidHermesExecutionInThisGate: true, forbidScriptsInThisGate: true, forbidCredentialsInThisGate: true, forbidModelCallsInThisGate: true, forbidProjectMutation: true, forbidPackageFileMutation: true, requireFuturePythonInstallRuntimeAdapter: true, requireFutureInstallVerification: true, requireJefeReviewFuture: true,
};
export const HERMES_PYTHON_INSTALL_STRATEGY_NEXT_STEP = 'Proceed to Factory Hermes Python Install Runtime Adapter v1 only after explicit approval; Hermes execution remains disabled.';
