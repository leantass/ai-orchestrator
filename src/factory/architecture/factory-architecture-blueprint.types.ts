export type FactoryArchitectureBlueprintVersion = '1.0'

export type FactoryArchitectureLayerId =
  | 'market_radar'
  | 'hermes_scout'
  | 'jefe_decision'
  | 'canonical_memory'
  | 'codex_constructor'
  | 'jefe_review'
  | 'unit_integration_tests'
  | 'browser_qa'
  | 'security_quality_performance'
  | 'ai_prompt_evaluation'
  | 'release_approval'
  | 'staging'
  | 'post_deploy_tests'
  | 'production'
  | 'analytics_monetization'
  | 'learning_memory'

export type FactoryToolStatus = 'approved' | 'conditional' | 'deferred' | 'rejected'
export type FactoryComponentOrigin =
  | 'internal_module'
  | 'external_tool'
  | 'adapter'
  | 'contract'
  | 'workflow_gate'
  | 'external_platform'
  | 'external_standard'
  | 'generated_project_component'
  | 'service_future'

export type FactoryIntegrationMode =
  | 'native'
  | 'read_only_adapter'
  | 'supervised_constructor'
  | 'contract_only'
  | 'ci_integration'
  | 'evidence_gate'
  | 'telemetry_standard'
  | 'independent_runtime'
  | 'future_service'

export type FactoryComponentOwnership = 'jefe_core' | 'external_provider' | 'generated_project' | 'shared_standard'

export interface FactoryExternalToolPolicy {
  origin: FactoryComponentOrigin
  integrationMode?: FactoryIntegrationMode
  adapterRequired: boolean
  adapterName?: string
  ownership: FactoryComponentOwnership
  mayModifyCode: boolean
  mayModifyRepo: boolean
  mayApprove: boolean
  mayDeploy: boolean
  mayReadExternalSources: boolean
  requiresHumanApproval: boolean
  notes: string[]
}

export interface FactoryAdapterPolicy extends FactoryExternalToolPolicy {
  origin: 'adapter'
  ownership: 'jefe_core'
  governs: string[]
  runtimeIntegrated: false
}
export type FactoryToolCostProfile =
  | 'free'
  | 'open_source'
  | 'free_tier'
  | 'paid_only'
  | 'token_cost'
  | 'unknown'

export interface FactoryToolAdoptionPolicy {
  adoptionTrigger: string
  acceptanceCriteria: string[]
  rollback: string
}

export interface FactoryArchitectureTool extends FactoryToolAdoptionPolicy, FactoryExternalToolPolicy {
  toolId: string
  name: string
  category: string
  status: FactoryToolStatus
  cost: FactoryToolCostProfile
  why: string
  solves: string[]
  risk: string
  notes: string[]
  paidOnlyJustification?: 'openai-tokens-or-api'
}

export interface FactoryLayerGate {
  gateId: string
  fromLayer: FactoryArchitectureLayerId
  toLayer?: FactoryArchitectureLayerId
  requiredEvidence: string[]
  acceptanceCriteria: string[]
  approver: 'JEFE' | 'JEFE_AND_HUMAN'
  codexSelfApprovalAllowed: false
  humanApprovalRequired: boolean
}

export interface FactoryQualityGate extends FactoryLayerGate {
  gateType: 'quality'
}

export interface FactorySecurityGate extends FactoryLayerGate {
  gateType: 'security'
}

export interface FactoryAiEvaluationGate extends FactoryLayerGate {
  gateType: 'ai_evaluation'
}

export interface FactoryDeploymentGate extends FactoryLayerGate {
  gateType: 'deployment'
}

export interface FactoryAnalyticsGate extends FactoryLayerGate {
  gateType: 'analytics'
}

export type FactoryGate =
  | FactoryQualityGate
  | FactorySecurityGate
  | FactoryAiEvaluationGate
  | FactoryDeploymentGate
  | FactoryAnalyticsGate

export interface FactoryArchitectureLayer {
  layerId: FactoryArchitectureLayerId
  order: number
  name: string
  responsibility: string
  actor: string
  toolIds: string[]
  outputs: string[]
  origin: FactoryComponentOrigin
  ownership: FactoryComponentOwnership
}

export interface FactoryArchitectureComponent extends FactoryExternalToolPolicy {
  componentId: string
  name: string
  role: string
  governs: string[]
  runtimeIntegrated: boolean
}

export interface FactoryCorrectionLoopPolicy {
  afterTestsReturnToJefe: true
  afterQaReturnToJefe: true
  afterSecurityReturnToJefe: true
  afterPromptEvalReturnToJefe: true
  codexSelfApprovalAllowed: false
  jefeMustCompareAgainstBrief: true
  jefeMustCompareAgainstContract: true
  jefeMustCompareAgainstAcceptanceCriteria: true
  jefeMustCompareAgainstEvidence: true
  correctionLoopRequiredBeforeRelease: true
  humanEscalationOnRepeatedFailure: true
  maxCorrectionRoundsDefault: number
  allowHumanOverride: true
  regressionDetectionRequired: true
  releaseReadinessRequiresJefeApproval: true
}

export interface FactoryReviewGate {
  gateId: string
  origin: 'workflow_gate'
  required: true
  approver: 'JEFE'
  returnFromLayers: FactoryArchitectureLayerId[]
  comparesAgainst: string[]
  stagingRequiresThisGate: true
}

export interface FactoryCorrectionLoop {
  policy: FactoryCorrectionLoopPolicy
  jefeReviewGate: FactoryReviewGate
  sequence: string[]
  directToStagingForbiddenFrom: FactoryArchitectureLayerId[]
}

export interface FactoryAcceptanceReviewConcept { conceptKind: 'FactoryAcceptanceReview'; implemented: false; purpose: string }
export interface FactoryCorrectionPlanConcept { conceptKind: 'FactoryCorrectionPlan'; implemented: false; purpose: string }
export interface FactoryCorrectionRoundConcept { conceptKind: 'FactoryCorrectionRound'; implemented: false; purpose: string }
export interface FactoryReleaseReadinessConcept { conceptKind: 'FactoryReleaseReadiness'; implemented: false; purpose: string }
export interface FactoryRegressionReportConcept { conceptKind: 'FactoryRegressionReport'; implemented: false; purpose: string }
export type FactoryFutureConcept = FactoryAcceptanceReviewConcept | FactoryCorrectionPlanConcept | FactoryCorrectionRoundConcept | FactoryReleaseReadinessConcept | FactoryRegressionReportConcept

export interface FactoryImplementationPhase {
  phaseId: string
  order: number
  name: string
  objective: string
  layerIds: FactoryArchitectureLayerId[]
  dependencies: string[]
  acceptanceCriteria: string[]
  rollback: string
}

export interface FactoryBlueprintDecision {
  decisionId: string
  statement: string
  rationale: string
  status: 'approved' | 'conditional' | 'rejected'
}

export interface FactoryBlueprintRisk {
  riskId: string
  description: string
  severity: 'low' | 'medium' | 'high'
  mitigation: string
}

export interface FactoryArchitectureEconomics {
  freeFirst: true
  paidAllowedOnlyForOpenAITokens: true
  avoidDuplicateTools: true
  requireCostJustification: true
  expectedCost: string
}

export interface FactoryGeneratedProjectIndependence {
  generatedProjectsMustHaveOwnRepo: true
  generatedProjectsMustNotDependOnJefeRuntime: true
  generatedProjectsMustHaveTraceabilityOnly: true
  verticalHardcodingForbiddenInCore: true
}

export interface FactoryActorPolicy {
  codexCanSelfApprove: false
  hermesCanModifyCode: false
  memoryGlobalPromotionRequiresReview: true
  jefeOwnsFinalDecision: true
}

export interface FactoryArchitectureBlueprintV1 {
  blueprintVersion: FactoryArchitectureBlueprintVersion
  blueprintKind: 'factory-architecture-blueprint'
  schemaVersion: 1
  createdAt: string
  owner?: string
  projectName: 'JEFE / ORQUESTADOR'
  layers: FactoryArchitectureLayer[]
  tools: FactoryArchitectureTool[]
  components: FactoryArchitectureComponent[]
  gates: FactoryGate[]
  implementationPhases: FactoryImplementationPhase[]
  decisions: FactoryBlueprintDecision[]
  risks: FactoryBlueprintRisk[]
  economics: FactoryArchitectureEconomics
  independence: FactoryGeneratedProjectIndependence
  actorPolicy: FactoryActorPolicy
  correctionLoop: FactoryCorrectionLoop
  futureConcepts: FactoryFutureConcept[]
}

export interface FactoryBlueprintValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export interface FactoryArchitectureBlueprintSummary {
  blueprintVersion: FactoryArchitectureBlueprintVersion
  layerCount: number
  approvedTools: string[]
  conditionalTools: string[]
  rejectedTools: string[]
  nextTopDownSteps: string[]
  primaryRisks: string[]
  expectedCost: string
  primaryGates: string[]
  originCounts: Record<FactoryComponentOrigin, number>
  toolsRequiringAdapter: string[]
  nextAdaptersToDefine: string[]
  correctionLoopEnabled: boolean
  maxCorrectionRoundsDefault: number
  releaseRequiresJefeReview: boolean
}
