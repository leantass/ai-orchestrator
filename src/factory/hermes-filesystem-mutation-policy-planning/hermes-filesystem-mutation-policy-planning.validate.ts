import { FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_KIND, FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_VERSION } from './hermes-filesystem-mutation-policy-planning.defaults.ts'
import type { FactoryHermesFilesystemMutationPolicyPlanningInput, FactoryHermesFilesystemMutationPolicyPlanningResult, FactoryHermesFilesystemMutationPolicyPlanningValidationResult } from './hermes-filesystem-mutation-policy-planning.types.ts'

const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=])/iu

export function validateFactoryHermesFilesystemMutationPolicyPlanningInput(input: FactoryHermesFilesystemMutationPolicyPlanningInput): FactoryHermesFilesystemMutationPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt is required.')
  if (!input?.plannedBy) errors.push('plannedBy is required.')
  if (!input?.timeoutKillSwitchPolicyPlanningResult) errors.push('timeoutKillSwitchPolicyPlanningResult is required.')
  if (!input?.resultIngestionContractPlanningResult) errors.push('resultIngestionContractPlanningResult is required.')
  if (SECRETISH.test(JSON.stringify({ planningNotes: input?.planningNotes }))) errors.push('input appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesFilesystemMutationPolicyPlanningResult(result: FactoryHermesFilesystemMutationPolicyPlanningResult): FactoryHermesFilesystemMutationPolicyPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.planningKind !== FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_KIND) errors.push('planningKind mismatch.')
  if (result.planningVersion !== FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_VERSION) errors.push('planningVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'filesystem_mutation_policy_plan_created') errors.push('status must be filesystem_mutation_policy_plan_created.')
  if (result.decision !== 'hermes_filesystem_mutation_policy_plan_created') errors.push('decision must be hermes_filesystem_mutation_policy_plan_created.')
  const receipt = result.filesystemMutationPolicyPlanningReceipt
  const plan = result.hermesFilesystemMutationPolicyPlanCandidate
  if (!receipt) errors.push('filesystemMutationPolicyPlanningReceipt is required.')
  if (!plan) errors.push('hermesFilesystemMutationPolicyPlanCandidate is required.')
  const surface = new Map((plan?.filesystemSurfaceCandidates || []).map((item) => [item.surfaceId, item]))
  for (const id of ['runtime_run_artifact_root', 'usage_file_artifact', 'stdout_stderr_preview_artifacts', 'execution_manifest_artifact']) if (!surface.has(id)) errors.push(`${id} missing.`)
  if (surface.get('source_root')?.status !== 'read_only_no_mutation') errors.push('source_root must be read_only_no_mutation.')
  if (surface.get('python_env_root')?.status !== 'read_only_no_mutation') errors.push('python_env_root must be read_only_no_mutation.')
  if (surface.get('project_root')?.status !== 'forbidden_for_runtime_writes') errors.push('project_root must be forbidden_for_runtime_writes.')
  if (surface.get('env_files')?.status !== 'forbidden_read_write') errors.push('env_files must be forbidden_read_write.')
  if (!plan?.readPathRules.length) errors.push('readPathRules required.')
  if (!plan?.writePathRules.length) errors.push('writePathRules required.')
  if (!plan?.artifactShapes.length) errors.push('artifactShapes required.')
  if (plan) {
    for (const [key, expected] of Object.entries({ futureWritesRestrictedToCodexTemp: true, futureWritesRequireApprovedRunRoot: true, sourceRootMutationForbidden: true, pythonEnvMutationForbidden: true, uvCacheMutationForbidden: true, packageFileMutationForbidden: true, dotEnvReadWriteForbidden: true, arbitraryPathAccessForbidden: true, pathContainmentRequired: true, symlinkTraversalForbidden: true, fsMutationReportingRequired: true, filesystemMutationAllowedNow: false, projectFileWritesAllowedNow: false })) if ((plan as any)[key] !== expected) errors.push(`${key} must be ${expected}.`)
  }
  if (result.canProceedToResearchExecutionBoundaryPlanning !== true) errors.push('canProceedToResearchExecutionBoundaryPlanning must be true.')
  for (const key of ['canProceedToResearchExecutionApproval', 'canRunResearchNow', 'canExecuteHermesNow', 'canMutateFilesystemNow', 'canWriteProjectFilesNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  for (const action of ['mutate_filesystem_now', 'write_project_files_now', 'write_source_root_now', 'mutate_python_env_now', 'read_dotenv_now', 'write_outside_codex_temp_now']) if (!receipt?.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction ${action}.`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  if (SECRETISH.test(JSON.stringify(result))) errors.push('result appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
