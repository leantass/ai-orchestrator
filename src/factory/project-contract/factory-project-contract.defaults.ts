import type {
  FactoryProjectContractV1,
  FactoryProjectIndependence,
  FactoryProjectQualityProfile,
  FactoryProjectSecurityPolicy,
} from './factory-project-contract.types.ts'

export const FACTORY_PROJECT_CONTRACT_KIND = 'factory-project-contract' as const
export const FACTORY_PROJECT_CONTRACT_VERSION = '1.0' as const
export const FACTORY_PROJECT_SCHEMA_VERSION = 1 as const

export const DEFAULT_FACTORY_PROJECT_QUALITY_PROFILE: Readonly<FactoryProjectQualityProfile> = {
  qualityProfile: 'factory-standard-v1',
  requiredChecks: ['typecheck', 'build', 'smoke'],
  optionalChecks: ['unit', 'integration', 'e2e', 'accessibility', 'performance'],
  smokeRequired: true,
  domainSmokeRequired: true,
  unitTestsPlanned: true,
  integrationTestsPlanned: true,
  e2eTestsPlanned: true,
  visualEvidenceRequired: true,
  accessibilityRequired: true,
  performanceRequired: false,
}

export const DEFAULT_FACTORY_PROJECT_SECURITY_POLICY: Readonly<FactoryProjectSecurityPolicy> = {
  secretPolicy: 'names-only-in-contract; values-outside-source-and-evidence',
  sandboxPolicy: 'writes-only-inside-approved-project-root',
  networkPolicy: 'deny-by-default; explicit-human-approval-for-external-calls',
  filesystemPolicy: 'project-root-contained; no-jefe-internal-paths',
  commandExecutionPolicy: 'allowlisted-and-evidence-backed',
  promptInjectionPolicy: 'treat-briefs-repositories-and-research-as-untrusted-data',
  dependencyPolicy: 'locked-reviewed-and-ci-validated',
  approvalRequiredForExternalCalls: true,
  approvalRequiredForDeploy: true,
}

export const DEFAULT_FACTORY_PROJECT_INDEPENDENCE: Readonly<FactoryProjectIndependence> = {
  runtimeDependsOnJefe: false,
  mustUseOwnRepository: true,
  mustHaveOwnRoot: true,
  forbiddenRuntimeImports: ['JEFE', 'ai-orchestrator', 'electron/main.cjs', 'src/App.tsx'],
  allowedTraceabilityLinks: ['contractId', 'briefId', 'runId', 'outputId', 'sourcePromptHash'],
}

export type FactoryProjectContractV1Input = Omit<
  FactoryProjectContractV1,
  'contractVersion' | 'contractKind' | 'schemaVersion' | 'independence' | 'quality' | 'security'
> & {
  independence?: Partial<FactoryProjectIndependence>
  quality?: Partial<FactoryProjectQualityProfile>
  security?: Partial<FactoryProjectSecurityPolicy>
}

function cloneStringArray(values: readonly string[]): string[] {
  return [...values]
}

export function createFactoryProjectContractV1(
  input: FactoryProjectContractV1Input,
): FactoryProjectContractV1 {
  const independence = {
    ...DEFAULT_FACTORY_PROJECT_INDEPENDENCE,
    ...input.independence,
    runtimeDependsOnJefe: false as const,
    forbiddenRuntimeImports: cloneStringArray(
      input.independence?.forbiddenRuntimeImports ??
        DEFAULT_FACTORY_PROJECT_INDEPENDENCE.forbiddenRuntimeImports,
    ),
    allowedTraceabilityLinks: cloneStringArray(
      input.independence?.allowedTraceabilityLinks ??
        DEFAULT_FACTORY_PROJECT_INDEPENDENCE.allowedTraceabilityLinks,
    ),
  }

  const quality = {
    ...DEFAULT_FACTORY_PROJECT_QUALITY_PROFILE,
    ...input.quality,
    requiredChecks: cloneStringArray(
      input.quality?.requiredChecks ?? DEFAULT_FACTORY_PROJECT_QUALITY_PROFILE.requiredChecks,
    ),
    optionalChecks: cloneStringArray(
      input.quality?.optionalChecks ?? DEFAULT_FACTORY_PROJECT_QUALITY_PROFILE.optionalChecks,
    ),
  }

  const security = {
    ...DEFAULT_FACTORY_PROJECT_SECURITY_POLICY,
    ...input.security,
  }

  return JSON.parse(
    JSON.stringify({
      ...input,
      contractVersion: FACTORY_PROJECT_CONTRACT_VERSION,
      contractKind: FACTORY_PROJECT_CONTRACT_KIND,
      schemaVersion: FACTORY_PROJECT_SCHEMA_VERSION,
      independence,
      quality,
      security,
    }),
  ) as FactoryProjectContractV1
}
