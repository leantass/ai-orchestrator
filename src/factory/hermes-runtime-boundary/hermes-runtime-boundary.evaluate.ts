import {
  DEFAULT_FACTORY_HERMES_RUNTIME_BOUNDARY_POLICY,
  FACTORY_HERMES_RUNTIME_BOUNDARY_KIND,
  FACTORY_HERMES_RUNTIME_BOUNDARY_VERSION,
  HERMES_RUNTIME_BOUNDARY_NEXT_STEP,
} from './hermes-runtime-boundary.defaults.ts';
import type {
  FactoryHermesRuntimeBoundaryBlocker,
  FactoryHermesRuntimeBoundaryCheck,
  FactoryHermesRuntimeBoundaryContract,
  FactoryHermesRuntimeBoundaryInput,
  FactoryHermesRuntimeBoundaryPolicy,
  FactoryHermesRuntimeBoundaryResult,
  FactoryHermesRuntimeBoundaryWarning,
} from './hermes-runtime-boundary.types.ts';

function mergePolicy(policy?: Partial<FactoryHermesRuntimeBoundaryPolicy>): FactoryHermesRuntimeBoundaryPolicy {
  return {
    ...DEFAULT_FACTORY_HERMES_RUNTIME_BOUNDARY_POLICY,
    ...policy,
    forbidInstallInThisGate: true,
    forbidExecutionInThisGate: true,
    forbidCredentialsInThisGate: true,
    forbidModelCallsInThisGate: true,
    forbidExternalNetworkByDefault: true,
    forbidProjectMutation: true,
    forbidDeploy: true,
    requireJefeReviewAfterToolResult: true,
    requireResultIngestion: true,
    requireNoVendorIntoRepo: true,
  };
}

function shortHead(head: string): string {
  return head.slice(0, 12);
}

function baseResult(
  input: FactoryHermesRuntimeBoundaryInput,
  decision: FactoryHermesRuntimeBoundaryResult['decision'],
  status: FactoryHermesRuntimeBoundaryResult['status'],
  checks: FactoryHermesRuntimeBoundaryCheck[],
  blockers: FactoryHermesRuntimeBoundaryBlocker[],
  warnings: FactoryHermesRuntimeBoundaryWarning[],
  nextStep: string,
  boundaryContract?: FactoryHermesRuntimeBoundaryContract,
): FactoryHermesRuntimeBoundaryResult {
  return {
    resultId: `hermes-runtime-boundary-result:${input.createdAt}:${input.createdBy}`,
    resultKind: FACTORY_HERMES_RUNTIME_BOUNDARY_KIND,
    resultVersion: FACTORY_HERMES_RUNTIME_BOUNDARY_VERSION,
    createdAt: input.createdAt,
    createdBy: input.createdBy,
    decision,
    status,
    boundaryContract,
    checks,
    blockers,
    warnings,
    canInstallHermes: false,
    canExecuteHermes: false,
    canUseCredentials: false,
    canCallModels: false,
    canAccessExternalNetwork: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: nextStep,
  };
}

export function evaluateFactoryHermesRuntimeBoundary(
  input: FactoryHermesRuntimeBoundaryInput,
): FactoryHermesRuntimeBoundaryResult {
  const policy = mergePolicy(input.policy);
  const checks: FactoryHermesRuntimeBoundaryCheck[] = [
    { checkId: 'install_forbidden', ok: policy.forbidInstallInThisGate, message: 'This gate cannot install Hermes.' },
    { checkId: 'execution_forbidden', ok: policy.forbidExecutionInThisGate, message: 'This gate cannot execute Hermes.' },
    { checkId: 'credentials_forbidden', ok: policy.forbidCredentialsInThisGate, message: 'This gate cannot use credentials.' },
    { checkId: 'model_calls_forbidden', ok: policy.forbidModelCallsInThisGate, message: 'This gate cannot call models.' },
  ];
  const blockers: FactoryHermesRuntimeBoundaryBlocker[] = [];
  const warnings: FactoryHermesRuntimeBoundaryWarning[] = [];
  const planResult = input.hermesInstallationPlanResult;

  if (!planResult) {
    blockers.push({ blockerId: 'missing_installation_plan', message: 'Hermes installation plan result is required.' });
    return baseResult(input, 'blocked', 'blocked', checks, blockers, warnings, 'Create Factory Hermes Installation Plan Gate v1 before runtime boundary approval.');
  }

  const plan = planResult.installationPlan;
  if (!plan || planResult.status !== 'install_plan_ready_for_audited_head') {
    blockers.push({ blockerId: 'installation_plan_not_ready', message: 'Hermes installation plan must be ready for audited head.' });
    return baseResult(input, 'request_runtime_boundary_changes', 'changes_required', checks, blockers, warnings, 'Repair the Hermes installation plan before creating a runtime boundary.');
  }

  if (planResult.installAllowedNow || planResult.executionAllowedNow || planResult.credentialsAllowedNow || planResult.dependenciesInstalled || planResult.scriptsExecuted || planResult.projectPackageMutated) {
    blockers.push({ blockerId: 'unsafe_installation_plan_flags', message: 'Installation plan exposes unsafe install/execution/credential/mutation flags.' });
    return baseResult(input, 'blocked', 'blocked', checks, blockers, warnings, 'Regenerate a fail-closed Hermes installation plan before runtime boundary approval.');
  }

  if (policy.requireAuditedHead && !plan.auditedHead) {
    blockers.push({ blockerId: 'missing_audited_head', message: 'Audited Hermes HEAD is required.' });
    return baseResult(input, 'blocked', 'blocked', checks, blockers, warnings, 'Re-audit Hermes source before runtime boundary approval.');
  }

  if (policy.requireHumanReview && !input.humanReviewRef) {
    return baseResult(input, 'human_review_required', 'human_review_required', checks, blockers, warnings, 'Provide humanReviewRef before approving Hermes runtime boundary contract.');
  }

  const headsMatch = plan.auditedHead === plan.remoteHead;
  if (!headsMatch) {
    warnings.push({
      warningId: 'remote_head_differs_from_audited_head',
      message: 'Runtime boundary is valid only for the audited Hermes HEAD; re-audit remote HEAD before install runtime if not pinning.',
    });
  }

  const headShort = shortHead(plan.auditedHead);
  const installRootRef = `.codex-temp/external-tools/hermes-agent/install/${headShort}/`;
  const runtimeRootRef = `.codex-temp/external-tools/hermes-agent/runtime/${headShort}/`;
  const inputRootRefs = ['.codex-temp/external-tools/hermes-agent/inputs/'];
  const outputRootRef = '.codex-temp/external-tools/hermes-agent/outputs/';
  const logsRootRef = '.codex-temp/external-tools/hermes-agent/logs/';
  const forbiddenRoots = [
    'repo root mutation',
    '.env',
    'credentials files',
    'node_modules',
    'web-prueba',
    'package.json',
    'package-lock.json',
    'src/App.tsx',
    'electron/main.cjs',
    'electron/preload.cjs',
    'preload',
    'IPC',
    'production paths',
  ];

  const boundaryContract: FactoryHermesRuntimeBoundaryContract = {
    boundaryId: `hermes-runtime-boundary:${headShort}:${input.createdAt}`,
    boundaryKind: FACTORY_HERMES_RUNTIME_BOUNDARY_KIND,
    boundaryVersion: FACTORY_HERMES_RUNTIME_BOUNDARY_VERSION,
    toolId: 'hermes_agent',
    auditedHead: plan.auditedHead,
    remoteHead: plan.remoteHead,
    headsMatch,
    versionPolicyDecision: plan.versionPolicyDecision,
    sourcePathRef: plan.sourcePathRef,
    installRootRef,
    runtimeRootRef,
    inputRootRefs,
    outputRootRef,
    filesystemPolicy: {
      installRootRef,
      runtimeRootRef,
      inputRootRefs,
      outputRootRef,
      logsRootRef,
      allowedFutureRoots: [installRootRef, runtimeRootRef, ...inputRootRefs, outputRootRef, logsRootRef],
      forbiddenRoots,
      repoMutationAllowedNow: false,
      packageMutationAllowedNow: false,
    },
    networkPolicy: {
      networkAllowedByDefault: false,
      futureAllowlistRequired: true,
      arbitraryBrowsingAllowed: false,
      credentialedExternalCallsAllowedNow: false,
    },
    environmentPolicy: {
      allowedEnvNames: [],
      forbiddenEnvPatterns: ['SECRET', 'TOKEN', 'API_KEY', 'PASSWORD', 'PRIVATE', 'OPENAI', 'GITHUB_TOKEN'],
      envInjectionAllowedNow: false,
    },
    credentialPolicy: {
      credentialsAllowedNow: false,
      credentialStoreAllowedNow: false,
      envFileReadsAllowedNow: false,
      futureCredentialApprovalRequired: true,
    },
    executionPolicy: {
      executionAllowedNow: false,
      installAllowedNow: false,
      scriptsAllowedNow: false,
      commandExecutionAllowedNow: false,
      maxRuntimeSecondsFuture: 600,
      maxOutputBytesFuture: 5_000_000,
      killSwitchRequired: true,
    },
    loggingPolicy: {
      logsRootRef,
      redactSecrets: true,
      rawCredentialsAllowed: false,
      structuredResultRequired: true,
    },
    killSwitches: [
      { switchId: 'globalHermesEnabled', enabled: false, description: 'Global Hermes runtime enable switch.' },
      { switchId: 'hermesInstallEnabled', enabled: false, description: 'Hermes install enable switch.' },
      { switchId: 'hermesRuntimeEnabled', enabled: false, description: 'Hermes execution enable switch.' },
      { switchId: 'hermesNetworkEnabled', enabled: false, description: 'Hermes external network enable switch.' },
      { switchId: 'hermesCredentialsEnabled', enabled: false, description: 'Hermes credentials enable switch.' },
    ],
    allowedOperations: [
      { operationId: 'read_approved_research_request', description: 'Future adapter may read approved Hermes research requests.', futureOnly: true },
      { operationId: 'write_structured_research_result', description: 'Future adapter may write structured results to the output root.', futureOnly: true },
      { operationId: 'write_runtime_logs', description: 'Future adapter may write redacted logs to the logs root.', futureOnly: true },
    ],
    forbiddenOperations: [
      'install_now',
      'execute_now',
      'read_env',
      'access_secrets',
      'mutate_repo',
      'create_branch',
      'commit',
      'push',
      'deploy',
      'call_model_without_approval',
      'arbitrary_network',
      'modify_jefe_source',
    ].map((operationId) => ({ operationId, description: `Forbidden operation: ${operationId}` })),
    adapterRequirements: [
      { requirementId: 'hermes_research_runtime_adapter_required', description: 'Future Hermes Research Runtime Adapter is required.', required: true },
      { requirementId: 'hermes_result_ingestion_required', description: 'Future Hermes Result Ingestion is required.', required: true },
      { requirementId: 'jefe_evidence_review_required', description: 'JEFE Evidence Review must review every Hermes result.', required: true },
      { requirementId: 'result_schema_required', description: 'Structured result schema is required.', required: true },
      { requirementId: 'timeout_required', description: 'Timeout must be enforced by future runtime.', required: true },
      { requirementId: 'kill_switch_check_required', description: 'Kill switches must be checked before runtime.', required: true },
    ],
    resultContract: {
      resultKind: 'hermes_research_result',
      requiredFields: ['requestId', 'toolVersion', 'auditedHead', 'sources', 'claims', 'evidence', 'confidence', 'risks', 'unresolvedQuestions', 'citations', 'recommendedNextStep'],
      citationsRequired: true,
      rawSecretsAllowed: false,
      directProjectMutationAllowed: false,
      recommendedNextStepRequired: true,
    },
    status: 'boundary_contract_not_executable',
    installStatus: 'not_installed',
    executionStatus: 'not_allowed',
    credentialsStatus: 'not_allowed',
    networkStatus: 'not_allowed_by_default',
    modelCallStatus: 'not_allowed',
    projectMutationStatus: 'not_allowed',
    deployStatus: 'not_allowed',
    canInstallHermes: false,
    canExecuteHermes: false,
    canUseCredentials: false,
    canCallModels: false,
    canAccessExternalNetwork: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: HERMES_RUNTIME_BOUNDARY_NEXT_STEP,
  };

  return baseResult(input, 'approve_runtime_boundary_contract', 'runtime_boundary_contract_ready', checks, blockers, warnings, HERMES_RUNTIME_BOUNDARY_NEXT_STEP, boundaryContract);
}
