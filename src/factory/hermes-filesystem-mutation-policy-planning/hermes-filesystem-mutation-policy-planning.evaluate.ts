import { DEFAULT_FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_POLICY, FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_KIND, FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_NEXT_STEP, FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_VERSION, FILESYSTEM_MUTATION_NOT_AUTHORIZED_ACTIONS, FILESYSTEM_MUTATION_REQUIRED_NEXT_POLICIES } from './hermes-filesystem-mutation-policy-planning.defaults.ts'
import type { FactoryHermesFilesystemArtifactShape, FactoryHermesFilesystemMutationPolicyPlanningInput, FactoryHermesFilesystemMutationPolicyPlanningResult, FactoryHermesFilesystemReadPathRule, FactoryHermesFilesystemSurfaceCandidate, FactoryHermesFilesystemWritePathRule } from './hermes-filesystem-mutation-policy-planning.types.ts'

function surfaces(): FactoryHermesFilesystemSurfaceCandidate[] {
  return [
    { surfaceId: 'runtime_run_artifact_root', candidateRoot: '.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/<runId>/', status: 'future_allowed_root_candidate', canUseNow: false, purpose: 'guardar artifacts de ejecucion futura.' },
    { surfaceId: 'usage_file_artifact', status: 'future_allowed_file_candidate', mustBeUnderApprovedRunRoot: true, metadataOnly: true },
    { surfaceId: 'stdout_stderr_preview_artifacts', status: 'future_allowed_file_candidate', sanitizedOnly: true, previewLimited: true },
    { surfaceId: 'execution_manifest_artifact', status: 'future_allowed_file_candidate', purpose: 'contains command shape, refs, statuses, no secrets.' },
    { surfaceId: 'result_ingestion_record_artifact', status: 'future_allowed_file_candidate', purpose: 'requires ingestion contract; findingsUseAllowed false.' },
    { surfaceId: 'source_root', path: '.codex-temp/external-tools/hermes-agent/install/75b300f/source/', status: 'read_only_no_mutation', writesAllowed: false },
    { surfaceId: 'python_env_root', path: '.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/', status: 'read_only_no_mutation', writesAllowed: false },
    { surfaceId: 'uv_cache_root', status: 'no_mutation_during_research_execution', writesAllowed: false },
    { surfaceId: 'project_root', status: 'forbidden_for_runtime_writes', writesAllowed: false },
    { surfaceId: 'package_files', path: 'package.json / package-lock.json', status: 'forbidden', writesAllowed: false },
    { surfaceId: 'env_files', path: '.env / dotenv files', status: 'forbidden_read_write', writesAllowed: false },
    { surfaceId: 'arbitrary_paths', status: 'forbidden', writesAllowed: false },
    { surfaceId: 'user_home_desktop_downloads', status: 'forbidden', writesAllowed: false },
  ]
}

function readRules(): FactoryHermesFilesystemReadPathRule[] {
  return [
    { ruleId: 'approved_runtime_refs_only', requirements: ['Allow read only for approved runtime executable refs if future boundary approves.'] },
    { ruleId: 'source_root_read_only_if_required', requirements: ['Source root is read-only only if boundary requires it.'] },
    { ruleId: 'no_dotenv', requirements: ['No .env reads.'] },
    { ruleId: 'no_credentials_files', requirements: ['No credentials files.'] },
    { ruleId: 'no_arbitrary_project_reads', requirements: ['No arbitrary project file reads.'] },
    { ruleId: 'no_user_home_scans', requirements: ['No user home scans.'] },
    { ruleId: 'no_recursive_broad_reads', requirements: ['No recursive broad reads.'] },
    { ruleId: 'no_untrusted_globs', requirements: ['No glob expansion from untrusted input.'] },
    { ruleId: 'path_safety', requirements: ['No symlink traversal.', 'No path traversal with ..', 'No UNC/network paths.', 'No drive hopping.', 'Normalized absolute path containment required.'] },
  ]
}

function writeRules(): FactoryHermesFilesystemWritePathRule[] {
  return [
    { ruleId: 'codex_temp_run_root_only', requirements: ['Future writes only under approved .codex-temp run root.'] },
    { ruleId: 'no_project_source_writes', requirements: ['No writes to project source.', 'No writes to docs/source during runtime.'] },
    { ruleId: 'no_install_roots_mutation', requirements: ['No writes to sourceRoot.', 'No writes to python-env.', 'No writes to uv cache.'] },
    { ruleId: 'no_sensitive_file_writes', requirements: ['No writes to package.json/package-lock.json.', 'No writes to .env.'] },
    { ruleId: 'no_external_writes', requirements: ['No writes outside repo root.', 'No writes to user home/desktop/downloads.', 'No arbitrary paths.'] },
    { ruleId: 'overwrite_policy', requirements: ['No overwrite existing artifacts unless same runId and policy allows idempotent retry.'] },
    { ruleId: 'artifact_integrity', requirements: ['Atomic writes preferred.', 'Max artifact size required.', 'Artifact sha256 required if stored.'] },
    { ruleId: 'mutation_reporting', requirements: ['fsMutationStatus required.', 'fsWrites list required.', 'fsWriteViolations list required.', 'cleanup policy required.'] },
  ]
}

function artifactShapes(): FactoryHermesFilesystemArtifactShape[] {
  return [
    { shapeId: 'future_execution_manifest', fields: ['runId', 'toolId', 'commandShape', 'promptHash', 'provider', 'model', 'toolsets', 'timeoutPolicyRef', 'filesystemPolicyRef', 'createdAt'], noSecrets: true },
    { shapeId: 'future_command_result', fields: ['runId', 'exitCode', 'timedOut', 'killed', 'durationMs', 'stdoutPreviewRef', 'stderrPreviewRef', 'usageFileRef', 'outputSha256'], noSecrets: true },
    { shapeId: 'future_usage_file', fields: ['pathRef', 'metadataOnly', 'usableAsFindings'], noSecrets: true, metadataOnly: true, usableAsFindings: false },
    { shapeId: 'future_ingestion_record', fields: ['classification', 'normalizedOutcome', 'findingUseAllowed', 'requiresJefeReview'], noSecrets: true, findingUseAllowed: false, requiresJefeReview: true },
  ]
}

function base(input: FactoryHermesFilesystemMutationPolicyPlanningInput): FactoryHermesFilesystemMutationPolicyPlanningResult {
  return { planningId: `hermes-filesystem-mutation-policy-planning:75b300f:${input.plannedAt}`, planningKind: FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_KIND, planningVersion: FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_VERSION, plannedAt: input.plannedAt, plannedBy: input.plannedBy, toolId: 'hermes_agent', commandShapeUnderConsideration: 'oneshot_real_with_provider_model', futureCommandShape: 'hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL> --toolsets <TOOLSETS>', filesystemSurfaceCandidates: [], readPathRules: [], writePathRules: [], artifactShapes: [], checks: [], blockers: [], warnings: [], status: 'blocked', decision: 'blocked_missing_timeout_kill_switch_policy_planning', canProceedToResearchExecutionBoundaryPlanning: false, canProceedToResearchExecutionApproval: false, canRunResearchNow: false, canExecuteHermesNow: false, canMutateFilesystemNow: false, canWriteProjectFilesNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canUseFindings: false, recommendedNextStep: FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_NEXT_STEP }
}

export function evaluateFactoryHermesFilesystemMutationPolicyPlanning(input: FactoryHermesFilesystemMutationPolicyPlanningInput): FactoryHermesFilesystemMutationPolicyPlanningResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_FILESYSTEM_MUTATION_POLICY_PLANNING_POLICY, ...(input.policy || {}) }
  const out = base(input)
  const timeout = input.timeoutKillSwitchPolicyPlanningResult
  if (policy.requireTimeoutKillSwitchPolicyPlanning && !timeout) return { ...out, blockers: [{ blockerId: 'blocked_missing_timeout_kill_switch_policy_planning', message: 'Timeout kill switch policy planning result is required.' }] }
  const timeoutPlan = timeout?.hermesTimeoutKillSwitchPolicyPlanCandidate
  if (timeout?.status !== 'timeout_kill_switch_policy_plan_created' || timeout?.decision !== 'hermes_timeout_kill_switch_policy_plan_created' || timeout?.canProceedToFilesystemMutationPolicyPlanning !== true || timeout?.canProceedToResearchExecutionApproval !== false || timeout?.canRunResearchNow !== false || timeout?.canExecuteHermesNow !== false || timeoutPlan?.timeoutAllowedNow !== false || timeoutPlan?.killSwitchMutationAllowedNow !== false || timeoutPlan?.researchExecutionAllowedNow !== false || timeoutPlan?.autoRetryAllowed !== false) return { ...out, decision: 'blocked_timeout_kill_switch_policy_not_ready_for_filesystem_mutation_policy', blockers: [{ blockerId: 'blocked_timeout_kill_switch_policy_not_ready_for_filesystem_mutation_policy', message: 'Timeout kill switch policy planning is not ready.' }] }
  const ingestion = input.resultIngestionContractPlanningResult
  if (policy.requireResultIngestionContractPlanning && (!ingestion || ingestion.status !== 'result_ingestion_contract_plan_created' || ingestion.canUseFindings !== false)) return { ...out, decision: 'blocked_result_ingestion_contract_not_ready_for_filesystem_mutation_policy', blockers: [{ blockerId: 'blocked_result_ingestion_contract_not_ready_for_filesystem_mutation_policy', message: 'Result ingestion contract planning is not ready.' }] }
  const filesystemSurfaceCandidates = surfaces()
  const readPathRules = readRules()
  const writePathRules = writeRules()
  const shapes = artifactShapes()
  const receipt = { receiptId: `${out.planningId}:receipt`, planningId: out.planningId, toolId: 'hermes_agent' as const, plannedBy: input.plannedBy, plannedAt: input.plannedAt, decision: 'hermes_filesystem_mutation_policy_plan_created' as const, scope: 'hermes_filesystem_mutation_policy_planning_only' as const, approvedNextGate: 'Factory Hermes Research Execution Boundary Planning Gate v1' as const, limitations: ['No filesystem mutation is authorized now.', 'Future writes require approved .codex-temp run root.', 'Project/source/package/.env writes remain forbidden.'], notAuthorizedActions: FILESYSTEM_MUTATION_NOT_AUTHORIZED_ACTIONS }
  const plan = { planCandidateId: `${out.planningId}:filesystem-mutation-policy-plan-candidate`, toolId: 'hermes_agent' as const, commandShapeUnderConsideration: 'oneshot_real_with_provider_model' as const, futureCommandShape: { executable: 'hermes.exe' as const, argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>', '--toolsets', '<TOOLSETS>'] as ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>', '--toolsets', '<TOOLSETS>'], shell: false as const }, filesystemSurfaceCandidates, readPathRules, writePathRules, artifactShapes: shapes, filesystemMutationAllowedNow: false as const, projectFileWritesAllowedNow: false as const, futureWritesRequireApprovedRunRoot: true as const, futureWritesRestrictedToCodexTemp: true as const, sourceRootMutationForbidden: true as const, pythonEnvMutationForbidden: true as const, uvCacheMutationForbidden: true as const, packageFileMutationForbidden: true as const, dotEnvReadWriteForbidden: true as const, arbitraryPathAccessForbidden: true as const, pathContainmentRequired: true as const, symlinkTraversalForbidden: true as const, fsMutationReportingRequired: true as const, requiredNextPolicies: FILESYSTEM_MUTATION_REQUIRED_NEXT_POLICIES, canProceedToResearchExecutionBoundaryPlanning: true as const, canProceedToResearchExecutionApproval: false as const, canRunResearchNow: false as const }
  return { ...out, filesystemSurfaceCandidates, readPathRules, writePathRules, artifactShapes: shapes, filesystemMutationPolicyPlanningReceipt: receipt, hermesFilesystemMutationPolicyPlanCandidate: plan, status: 'filesystem_mutation_policy_plan_created', decision: 'hermes_filesystem_mutation_policy_plan_created', canProceedToResearchExecutionBoundaryPlanning: true }
}
