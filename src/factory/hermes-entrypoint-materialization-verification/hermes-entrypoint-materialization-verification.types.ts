export type FactoryHermesEntrypointMaterializationVerificationVersion = '1.0'
export type FactoryHermesEntrypointMaterializationVerificationKind = 'factory-hermes-entrypoint-materialization-verification'
export type FactoryHermesEntrypointMaterializationVerificationStatus = 'verified' | 'warning_verified' | 'blocked'
export type FactoryHermesEntrypointMaterializationVerificationDecision = 'hermes_entrypoint_materialization_verified_for_research_runtime_adapter_retry' | 'blocked_missing_runtime_retry_result' | 'blocked_runtime_retry_not_success' | 'blocked_entrypoint_executable_missing' | 'blocked_entrypoint_executable_empty' | 'blocked_entrypoint_path_not_contained' | 'blocked_unexpected_source_mutation' | 'blocked_boundary_violation_detected' | 'request_materialization_retry_repair_before_verification'
export type FactoryHermesEntrypointMaterializationVerificationValidationResult = { ok: boolean; errors: string[]; warnings: string[] }
export type FactoryHermesEntrypointMaterializationVerificationInput = { verifiedAt: string; verifiedBy: string; runtimeRetryResult?: any; runtimeRetryManifest?: any; executableInspection?: any; sourceInspection?: any; cacheVerificationResult?: any; policy?: Partial<FactoryHermesEntrypointMaterializationVerificationPolicy>; verificationNotes?: string[] }
export type FactoryHermesEntrypointMaterializationVerificationPolicy = Record<string, boolean>
export type FactoryHermesEntrypointMaterializationVerificationResult = {
  verificationId: string
  verificationKind: FactoryHermesEntrypointMaterializationVerificationKind
  verificationVersion: FactoryHermesEntrypointMaterializationVerificationVersion
  verifiedAt: string
  verifiedBy: string
  toolId: 'hermes_agent'
  commandName: 'hermes'
  pythonEntrypoint: 'hermes_cli.main:main'
  expectedExecutableRef: string
  executableStatus: string
  executableSizeBytes: number | null
  executableSha256: string
  materializationStatus: string
  sourceMutationStatus: string
  knownWarnings: string[]
  runtimeRetryDecision: string
  entrypointMaterializationVerificationReceipt?: Record<string, any>
  hermesEntrypointMaterializationVerificationRecord?: Record<string, any>
  approvedResearchRuntimeAdapterRetryEnvelope?: Record<string, any>
  checks: Array<Record<string, any>>
  blockers: Array<{ blockerId: string; message: string }>
  warnings: Array<{ warningId: string; message: string }>
  status: FactoryHermesEntrypointMaterializationVerificationStatus
  decision: FactoryHermesEntrypointMaterializationVerificationDecision
  canProceedToResearchRuntimeAdapterRetry: boolean
  canRetryResearchAdapterNow: false
  canExecuteHermesNow: false
  canTreatAsResearchResult: false
  canUseFindings: false
  canUseNetwork: false
  canUseCredentials: false
  canCallModels: false
  canMutateProjectFiles: false
  canDeploy: false
  recommendedNextStep: string
}
export type FactoryHermesEntrypointMaterializationVerificationSummary = { verificationId: string; commandName: string; pythonEntrypoint: string; executableStatus: string; executableSha256: string; status: string; decision: string; sourceMutationStatus: string; canProceedToResearchRuntimeAdapterRetry: boolean; canRetryResearchAdapterNow: false; canExecuteHermesNow: false; nextStep: string }
