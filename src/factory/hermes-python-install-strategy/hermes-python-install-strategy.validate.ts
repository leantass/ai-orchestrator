import { FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_KIND, FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_VERSION } from './hermes-python-install-strategy.defaults.ts';
import type { FactoryHermesPythonInstallStrategyPlan, FactoryHermesPythonInstallStrategyResult, FactoryHermesPythonInstallStrategyValidationResult } from './hermes-python-install-strategy.types.ts';

export function validateFactoryHermesPythonInstallStrategyPlan(plan: FactoryHermesPythonInstallStrategyPlan): FactoryHermesPythonInstallStrategyValidationResult {
  const errors: string[] = []; const warnings: string[] = [];
  if (plan.strategyKind !== FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_KIND) errors.push('invalid strategy kind.');
  if (plan.strategyVersion !== FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_VERSION) errors.push('invalid strategy version.');
  if (plan.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.');
  if (!plan.sourceRootRef) errors.push('sourceRootRef required.');
  if (!plan.pythonEnvRootSuggestion.startsWith('.codex-temp/external-tools/hermes-agent/install/') || !plan.pythonEnvRootSuggestion.endsWith('/python-env/')) errors.push('python env root must be under expected .codex-temp install root.');
  if (plan.installAllowedNow || plan.pythonInstallRuntimeAllowedNow || plan.executionAllowedNow || plan.credentialsAllowedNow || plan.modelCallsAllowedNow) errors.push('all runtime permission flags must be false.');
  if (plan.installSteps.some((step) => step.executed !== false) || plan.validationSteps.some((step) => step.executed !== false)) errors.push('no step may be executed.');
  if (!plan.forbiddenSteps.some((step) => /setup\.py execution/iu.test(step))) errors.push('setup.py execution must be forbidden.');
  if (!plan.forbiddenSteps.some((step) => /global pip install/iu.test(step))) errors.push('global pip install must be forbidden.');
  if (!plan.recommendedNextStep) errors.push('recommendedNextStep required.');
  return { ok: errors.length === 0, errors, warnings };
}

export function validateFactoryHermesPythonInstallStrategyResult(result: FactoryHermesPythonInstallStrategyResult): FactoryHermesPythonInstallStrategyValidationResult {
  const errors: string[] = []; const warnings: string[] = [];
  if (result.resultKind !== FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_KIND || result.resultVersion !== FACTORY_HERMES_PYTHON_INSTALL_STRATEGY_VERSION) errors.push('invalid result kind/version.');
  if (result.installAllowedNow || result.pythonInstallRuntimeAllowedNow || result.executionAllowedNow || result.credentialsAllowedNow || result.modelCallsAllowedNow || result.canExecuteHermes) errors.push('dangerous flags must be false.');
  if (result.strategyPlan) errors.push(...validateFactoryHermesPythonInstallStrategyPlan(result.strategyPlan).errors);
  if (!result.recommendedNextStep) errors.push('recommendedNextStep required.');
  return { ok: errors.length === 0, errors, warnings };
}
