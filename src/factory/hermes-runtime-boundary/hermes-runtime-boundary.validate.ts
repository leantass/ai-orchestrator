import {
  FACTORY_HERMES_RUNTIME_BOUNDARY_KIND,
  FACTORY_HERMES_RUNTIME_BOUNDARY_VERSION,
} from './hermes-runtime-boundary.defaults.ts';
import type {
  FactoryHermesRuntimeBoundaryContract,
  FactoryHermesRuntimeBoundaryResult,
  FactoryHermesRuntimeBoundaryValidationResult,
} from './hermes-runtime-boundary.types.ts';

const decisions = ['blocked', 'reject_runtime_boundary', 'request_runtime_boundary_changes', 'human_review_required', 'approve_runtime_boundary_contract'];
const statuses = ['blocked', 'rejected', 'changes_required', 'human_review_required', 'runtime_boundary_contract_ready'];

function hasForbiddenRoot(contract: FactoryHermesRuntimeBoundaryContract, pattern: RegExp): boolean {
  return contract.filesystemPolicy.forbiddenRoots.some((root) => pattern.test(root));
}

export function validateFactoryHermesRuntimeBoundaryContract(
  contract: FactoryHermesRuntimeBoundaryContract,
): FactoryHermesRuntimeBoundaryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (contract.boundaryKind !== FACTORY_HERMES_RUNTIME_BOUNDARY_KIND) errors.push('Invalid boundary kind.');
  if (contract.boundaryVersion !== FACTORY_HERMES_RUNTIME_BOUNDARY_VERSION) errors.push('Invalid boundary version.');
  if (contract.toolId !== 'hermes_agent') errors.push('Boundary toolId must be hermes_agent.');
  if (!contract.auditedHead) errors.push('auditedHead is required.');
  if (!contract.installRootRef.startsWith('.codex-temp/external-tools/hermes-agent/install/')) errors.push('installRootRef must be under controlled Hermes install root.');
  if (!contract.runtimeRootRef.startsWith('.codex-temp/external-tools/hermes-agent/runtime/')) errors.push('runtimeRootRef must be under controlled Hermes runtime root.');
  if (!contract.outputRootRef.startsWith('.codex-temp/')) errors.push('outputRootRef must be under .codex-temp.');
  if (!contract.filesystemPolicy.logsRootRef.startsWith('.codex-temp/')) errors.push('logsRootRef must be under .codex-temp.');
  if (!hasForbiddenRoot(contract, /^\.env$/u)) errors.push('Forbidden roots must include .env.');
  if (!hasForbiddenRoot(contract, /package\.json/u) || !hasForbiddenRoot(contract, /package-lock\.json/u)) errors.push('Forbidden roots must include package files.');
  if (!hasForbiddenRoot(contract, /src\/App\.tsx/u)) errors.push('Forbidden roots must include src/App.tsx.');
  if (!hasForbiddenRoot(contract, /electron\/main\.cjs/u) || !hasForbiddenRoot(contract, /preload/u) || !hasForbiddenRoot(contract, /IPC/u)) errors.push('Forbidden roots must include Electron/preload/IPC surfaces.');
  if (contract.networkPolicy.networkAllowedByDefault !== false) errors.push('Network must be disabled by default.');
  if (contract.credentialPolicy.credentialsAllowedNow !== false) errors.push('Credentials must be disabled.');
  if (contract.executionPolicy.executionAllowedNow !== false) errors.push('Execution must be disabled.');
  if (contract.executionPolicy.installAllowedNow !== false) errors.push('Install must be disabled.');
  if (contract.canInstallHermes !== false || contract.canExecuteHermes !== false || contract.canUseCredentials !== false || contract.canCallModels !== false || contract.canMutateProjectFiles !== false || contract.canDeploy !== false) errors.push('Capability flags must remain false.');
  if (contract.killSwitches.length === 0 || contract.killSwitches.some((killSwitch) => killSwitch.enabled !== false)) errors.push('Kill switches must exist and default false.');
  if (!contract.resultContract) errors.push('Result contract is required.');
  if (contract.adapterRequirements.length === 0) errors.push('Adapter requirements are required.');
  if (!contract.recommendedNextStep) errors.push('recommendedNextStep is required.');
  if (!contract.headsMatch) warnings.push('Audited head differs from remote head; pin or re-audit before install runtime.');
  return { ok: errors.length === 0, errors, warnings };
}

export function validateFactoryHermesRuntimeBoundaryResult(
  result: FactoryHermesRuntimeBoundaryResult,
): FactoryHermesRuntimeBoundaryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (result.resultKind !== FACTORY_HERMES_RUNTIME_BOUNDARY_KIND) errors.push('Invalid result kind.');
  if (result.resultVersion !== FACTORY_HERMES_RUNTIME_BOUNDARY_VERSION) errors.push('Invalid result version.');
  if (!decisions.includes(result.decision)) errors.push('Invalid decision.');
  if (!statuses.includes(result.status)) errors.push('Invalid status.');
  if (result.status === 'runtime_boundary_contract_ready' && !result.boundaryContract) errors.push('Approved result must include boundaryContract.');
  if (result.canInstallHermes !== false || result.canExecuteHermes !== false || result.canUseCredentials !== false || result.canCallModels !== false || result.canAccessExternalNetwork !== false || result.canMutateProjectFiles !== false || result.canDeploy !== false) errors.push('Result capability flags must remain false.');
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.');
  if (result.boundaryContract) {
    const validation = validateFactoryHermesRuntimeBoundaryContract(result.boundaryContract);
    errors.push(...validation.errors.map((error) => `Contract: ${error}`));
    warnings.push(...validation.warnings.map((warning) => `Contract: ${warning}`));
    if (!result.boundaryContract.headsMatch && !result.warnings.some((warning) => warning.warningId === 'remote_head_differs_from_audited_head')) errors.push('Head mismatch must produce a warning.');
  }
  return { ok: errors.length === 0, errors, warnings };
}
