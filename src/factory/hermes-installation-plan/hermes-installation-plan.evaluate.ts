import {
  DEFAULT_FACTORY_HERMES_INSTALLATION_PLAN_POLICY,
  FACTORY_HERMES_INSTALLATION_PLAN_KIND,
  FACTORY_HERMES_INSTALLATION_PLAN_VERSION,
  HERMES_INSTALLATION_PLAN_SAFE_NEXT_STEP,
} from './hermes-installation-plan.defaults.ts';
import type {
  FactoryHermesInstallStep,
  FactoryHermesInstallationPlan,
  FactoryHermesInstallationPlanBlocker,
  FactoryHermesInstallationPlanCheck,
  FactoryHermesInstallationPlanInput,
  FactoryHermesInstallationPlanPolicy,
  FactoryHermesInstallationPlanResult,
  FactoryHermesInstallationPlanWarning,
  FactoryHermesRisk,
  FactoryHermesValidationStep,
  FactoryHermesVersionPolicyDecision,
} from './hermes-installation-plan.types.ts';

function mergePolicy(policy?: Partial<FactoryHermesInstallationPlanPolicy>): FactoryHermesInstallationPlanPolicy {
  return {
    ...DEFAULT_FACTORY_HERMES_INSTALLATION_PLAN_POLICY,
    ...policy,
    forbidInstallInThisGate: true,
    forbidExecutionInThisGate: true,
    forbidScriptsInThisGate: true,
    forbidCredentialsInThisGate: true,
    forbidProjectPackageMutation: true,
    forbidGlobalInstall: true,
    forbidShellAdapter: true,
    forbidCodexExecution: true,
  };
}

function shortHead(head: string): string {
  return head.slice(0, 12);
}

function makeBlockedResult(
  input: FactoryHermesInstallationPlanInput,
  blockers: FactoryHermesInstallationPlanBlocker[],
  warnings: FactoryHermesInstallationPlanWarning[],
  checks: FactoryHermesInstallationPlanCheck[],
): FactoryHermesInstallationPlanResult {
  return {
    resultId: `hermes-installation-plan-result:${input.createdAt}:${input.createdBy}`,
    resultKind: FACTORY_HERMES_INSTALLATION_PLAN_KIND,
    resultVersion: FACTORY_HERMES_INSTALLATION_PLAN_VERSION,
    createdAt: input.createdAt,
    createdBy: input.createdBy,
    decision: 'blocked',
    status: 'blocked',
    sourceAuditSnapshot: input.sourceAuditSnapshot,
    checks,
    blockers,
    warnings,
    installAllowedNow: false,
    executionAllowedNow: false,
    credentialsAllowedNow: false,
    scriptsExecuted: false,
    dependenciesInstalled: false,
    projectPackageMutated: false,
    canExecuteCodex: false,
    recommendedNextStep: 'Provide a valid Hermes source checkout audit before installation planning; do not install or execute Hermes in this gate.',
  };
}

function buildInstallSteps(): FactoryHermesInstallStep[] {
  return [
    {
      stepId: 'choose_pinned_source_version',
      title: 'Choose pinned source version',
      description: 'Use the audited Hermes commit as the only eligible source version until a new remote HEAD audit is approved.',
      declarativeOnly: true,
      executed: false,
    },
    {
      stepId: 'create_isolated_install_root',
      title: 'Create isolated install root',
      description: 'Prepare a future isolated root under .codex-temp/external-tools/hermes-agent/install/<auditedHead>/ without mutating JEFE package files.',
      declarativeOnly: true,
      executed: false,
    },
    {
      stepId: 'inspect_package_manager',
      title: 'Inspect package manager surfaces',
      description: 'Review package.json, package-lock.json, pyproject.toml, setup.py and uv.lock before choosing any future install command.',
      declarativeOnly: true,
      executed: false,
    },
    {
      stepId: 'prepare_future_dependency_install',
      title: 'Prepare future dependency install approval',
      description: 'Draft install commands for a later approved install runtime, keeping npm, pip, uv or shell execution disabled in this gate.',
      declarativeOnly: true,
      executed: false,
    },
    {
      stepId: 'defer_runtime_smoke',
      title: 'Defer runtime smoke',
      description: 'Run any Hermes smoke only after Runtime Boundary and Install Runtime Adapter gates approve the exact operation.',
      declarativeOnly: true,
      executed: false,
    },
  ];
}

function buildValidationSteps(): FactoryHermesValidationStep[] {
  return [
    {
      stepId: 'verify_pinned_commit',
      title: 'Verify pinned commit',
      description: 'Confirm the installed source, if ever installed, resolves to the audited commit.',
      declarativeOnly: true,
      executed: false,
    },
    {
      stepId: 'verify_no_jefe_package_mutation',
      title: 'Verify no JEFE package mutation',
      description: 'Confirm package.json and package-lock.json in JEFE remain unchanged.',
      declarativeOnly: true,
      executed: false,
    },
    {
      stepId: 'verify_no_credentials',
      title: 'Verify no credentials',
      description: 'Confirm no credentials, env files or secrets are required during planning.',
      declarativeOnly: true,
      executed: false,
    },
    {
      stepId: 'verify_runtime_boundary',
      title: 'Verify runtime boundary',
      description: 'Require a Hermes Runtime Boundary Contract before any command execution.',
      declarativeOnly: true,
      executed: false,
    },
  ];
}

function buildRisks(headsMatch: boolean): FactoryHermesRisk[] {
  const risks: FactoryHermesRisk[] = [
    {
      riskId: 'mixed_node_python_surface',
      severity: 'warning',
      description: 'Hermes exposes Node and Python installation surfaces.',
      mitigation: 'Require isolated install root, pinned commit and explicit install runtime approval.',
    },
    {
      riskId: 'scripts_present',
      severity: 'warning',
      description: 'Hermes checkout contains install and helper scripts.',
      mitigation: 'Do not run scripts in this gate; treat scripts as future reviewed inputs only.',
    },
  ];

  if (!headsMatch) {
    risks.push({
      riskId: 'remote_head_differs_from_audited_head',
      severity: 'warning',
      description: 'The audited checkout HEAD differs from the currently observed remote HEAD.',
      mitigation: 'Pin audited head for this plan or perform a fresh source checkout audit before installation.',
    });
  }

  return risks;
}

export function evaluateFactoryHermesInstallationPlan(
  input: FactoryHermesInstallationPlanInput,
): FactoryHermesInstallationPlanResult {
  const policy = mergePolicy(input.policy);
  const audit = input.sourceAuditSnapshot;
  const checks: FactoryHermesInstallationPlanCheck[] = [];
  const blockers: FactoryHermesInstallationPlanBlocker[] = [];
  const warnings: FactoryHermesInstallationPlanWarning[] = [];

  checks.push({
    checkId: 'install_forbidden',
    ok: policy.forbidInstallInThisGate,
    message: 'This gate never installs Hermes.',
  });
  checks.push({
    checkId: 'execution_forbidden',
    ok: policy.forbidExecutionInThisGate,
    message: 'This gate never executes Hermes.',
  });

  if (!audit) {
    blockers.push({
      blockerId: 'missing_source_checkout_audit',
      message: 'Hermes source checkout audit is required before creating an installation plan.',
    });
    return makeBlockedResult(input, blockers, warnings, checks);
  }

  if (policy.requireAuditedHead && !audit.auditedHead) {
    blockers.push({ blockerId: 'missing_audited_head', message: 'Audited Hermes HEAD is required.' });
  }

  if (policy.requireRemoteHead && !audit.remoteHead) {
    blockers.push({ blockerId: 'missing_remote_head', message: 'Remote Hermes HEAD observation is required.' });
  }

  const hasInstallManifest = audit.manifestsFound.some((manifest) =>
    ['package.json', 'package-lock.json', 'pyproject.toml', 'setup.py', 'uv.lock'].includes(manifest),
  );
  if (!hasInstallManifest) {
    blockers.push({
      blockerId: 'missing_install_manifests',
      message: 'No supported Hermes installation manifest was present in the source audit snapshot.',
    });
  }

  if (blockers.length > 0) {
    return makeBlockedResult(input, blockers, warnings, checks);
  }

  const headsMatch = audit.auditedHead === audit.remoteHead;
  const versionPolicyDecision: FactoryHermesVersionPolicyDecision =
    input.preferredVersionPolicy ?? (headsMatch ? 'pin_audited_head' : 'allow_install_plan_for_audited_head_only');

  if (!headsMatch) {
    warnings.push({
      warningId: 'remote_head_differs_from_audited_head',
      message: 'Remote HEAD differs from audited checkout HEAD; plan is valid only for the audited commit and remote HEAD should be re-audited before runtime.',
    });
  }

  const isolatedInstallRootSuggestion = `.codex-temp/external-tools/hermes-agent/install/${shortHead(audit.auditedHead)}/`;
  const recommendedNextStep = headsMatch
    ? HERMES_INSTALLATION_PLAN_SAFE_NEXT_STEP
    : 'Pin the audited Hermes HEAD for planning or re-audit the current remote HEAD, then proceed to Factory Hermes Runtime Boundary Contract v1 before any install runtime approval.';

  const installationPlan: FactoryHermesInstallationPlan = {
    planId: `hermes-installation-plan:${shortHead(audit.auditedHead)}:${input.createdAt}`,
    planKind: FACTORY_HERMES_INSTALLATION_PLAN_KIND,
    planVersion: FACTORY_HERMES_INSTALLATION_PLAN_VERSION,
    toolId: 'hermes_agent',
    createdAt: input.createdAt,
    createdBy: input.createdBy,
    auditedHead: audit.auditedHead,
    remoteHead: audit.remoteHead,
    headsMatch,
    versionPolicyDecision,
    sourcePathRef: audit.sourcePath,
    isolatedInstallRootSuggestion,
    manifestsFound: [...audit.manifestsFound],
    installSurfaces: audit.installSurfaces.map((surface) => ({ ...surface, executionAllowedNow: false })),
    runtimeSurfaces: audit.runtimeSurfaces.map((surface) => ({ ...surface, executionAllowedNow: false })),
    installSteps: buildInstallSteps(),
    validationSteps: buildValidationSteps(),
    risks: buildRisks(headsMatch),
    runtimeBoundaryRequired: true,
    adapterRequired: true,
    resultIngestionRequired: true,
    jefeReviewRequired: true,
    installAllowedNow: false,
    executionAllowedNow: false,
    credentialsAllowedNow: false,
    scriptsExecuted: false,
    dependenciesInstalled: false,
    projectPackageMutated: false,
    recommendedNextStep,
  };

  return {
    resultId: `hermes-installation-plan-result:${shortHead(audit.auditedHead)}:${input.createdAt}`,
    resultKind: FACTORY_HERMES_INSTALLATION_PLAN_KIND,
    resultVersion: FACTORY_HERMES_INSTALLATION_PLAN_VERSION,
    createdAt: input.createdAt,
    createdBy: input.createdBy,
    decision: 'approve_installation_plan_for_future_gate',
    status: 'install_plan_ready_for_audited_head',
    sourceAuditSnapshot: audit,
    installationPlan,
    checks,
    blockers,
    warnings,
    installAllowedNow: false,
    executionAllowedNow: false,
    credentialsAllowedNow: false,
    scriptsExecuted: false,
    dependenciesInstalled: false,
    projectPackageMutated: false,
    canExecuteCodex: false,
    recommendedNextStep,
  };
}
