import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type FlowMessage = {
  id: number
  source: 'operador' | 'orquestador' | 'planificador' | 'executor' | 'codex' | 'bridge'
  title: string
  content: string
  raw?: string
  status?: 'info' | 'success' | 'warning' | 'error'
}

type ExecutorTraceEntry = Omit<FlowMessage, 'id'>
type ExecutionEventPayload = ExecutorTraceEntry & {
  requestId?: string
}

type ExecutorValidationResult = {
  type?: string
  targetPath?: string
  expectedKind?: string
  ok?: boolean
}

type ExecutorFailureContext = {
  timestamp?: string
  decisionKey?: string
  failureType?: string
  executorMode?: string
  executorModeSource?: string
  bridgeMode?: string
  bridgeModeSource?: string
  executorCommand?: string
  origin?: string
  stepIndex?: number
  totalSteps?: number
  currentStep?: string
  currentSubtask?: string
  currentAction?: string
  currentCommand?: string
  currentTargetPath?: string
  touchedPaths?: string[]
  createdPaths?: string[]
  stdout?: string
  stderr?: string
  lastProgressAt?: string
  lastMaterialProgressAt?: string
  hasMaterialProgress?: boolean
  materialState?: string
  strategy?: string
  brainStrategy?: string
  reasoningLayer?: string
  materializationLayer?: string
  materializationPlanSource?: string
  validationResults?: ExecutorValidationResult[]
  appliedReuseMode?: string
  reusedStyleFromArtifactId?: string
  reusedStructureFromArtifactId?: string
  reuseAppliedFields?: string[]
  acceptedAt?: string
  attemptScope?: 'broad' | 'targeted' | 'subtask' | 'continuation'
  fingerprint?: string
  isRecoveryAttempt?: boolean
  repeatedFailureCount?: number
  lastAttemptScope?: 'broad' | 'targeted' | 'subtask' | 'continuation'
  blockedRecoveryModes?: string[]
  lastFailure?: ExecutorFailureContext
  recentFailures?: ExecutorFailureContext[]
}

type ExecutionCompletePayload = {
  requestId?: string
  ok?: boolean
  trace?: ExecutorTraceEntry[]
  instruction?: string
  result?: string
  resultPreview?: string
  approvalRequired?: boolean
  approvalReason?: string
  error?: string
  failureType?: string
  executorMode?: string
  executorModeSource?: string
  bridgeMode?: string
  bridgeModeSource?: string
  details?: ExecutorFailureContext
}

type ExecutorContinuationAnchor = {
  targetPath?: string
  subtask?: string
  action?: string
}

type ExecutorExecutionScope = {
  objectiveScope?: 'single-target' | 'single-subtask' | 'continuation'
  allowedTargetPaths?: string[]
  blockedTargetPaths?: string[]
  successCriteria?: string[]
  continuationAnchor?: ExecutorContinuationAnchor
  enforceNarrowScope?: boolean
}

type ReusableArtifactLookupMatch = {
  id: string
  type?: string
  sector?: string
  visualStyle?: string
  layoutVariant?: string
  heroStyle?: string
  localPath?: string
  primaryCta?: string
  secondaryCta?: string
  typography?: {
    headingFamily?: string
    bodyFamily?: string
    fontHref?: string
  }
  colors?: Record<string, string>
  preview?: {
    status?: string
    imagePath?: string
    generatedAt?: string
    source?: string
    errorMessage?: string
  }
  metadata?: Record<string, unknown>
  matchReasons?: string[]
}

type ReusableArtifactLookupContract = {
  executed: boolean
  foundCount: number
  matches: ReusableArtifactLookupMatch[]
}

type ReusableArtifactRecord = ReusableArtifactLookupMatch & {
  sectorLabel?: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

type ManualReuseMode =
  | 'auto'
  | 'none'
  | 'inspiration-only'
  | 'reuse-style'
  | 'reuse-structure'
  | 'reuse-style-and-structure'

type ManualReusablePreference = {
  artifactId?: string
  reuseMode: Exclude<ManualReuseMode, 'auto'>
  source?: string
}

type ProductArchitectureContract = {
  productType?: string
  domain?: string
  users?: string[]
  roles?: string[]
  coreModules?: string[]
  dataEntities?: string[]
  keyFlows?: string[]
  integrations?: string[]
  criticalRisks?: string[]
  approvalRequiredFor?: string[]
  suggestedArchitecture?: {
    frontend?: string
    backend?: string
    database?: string
    auth?: string
    payments?: string
    storage?: string
  }
  phases?: string[]
  safeFirstDelivery?: string[]
  outOfScopeForFirstIteration?: string[]
}

type SafeFirstDeliveryPlanContract = {
  scope?: string[]
  modules?: string[]
  mockData?: string[]
  screens?: string[]
  localBehavior?: string[]
  explicitExclusions?: string[]
  approvalRequiredLater?: string[]
  successCriteria?: string[]
}

type SafeFirstDeliveryMaterializationContract = {
  domainLabel?: string
  productType?: string
  modules?: string[]
  screens?: string[]
  entities?: string[]
  mockCollections?: string[]
  localActions?: string[]
  stateHints?: string[]
  approvalThemes?: string[]
  explicitExclusions?: string[]
}

type DomainUnderstandingContract = {
  domainLabel?: string
  intentLabel?: string
  productKind?: string
  primaryModules?: string[]
  primaryEntities?: string[]
  secondaryEntities?: string[]
  roles?: string[]
  coreFlows?: string[]
  stateModel?: string[]
  localActions?: string[]
  riskThemes?: string[]
  approvalThemes?: string[]
  explicitExclusions?: string[]
}

type ScalableDeliveryPlanFileContract = {
  path?: string
  purpose?: string
  required?: boolean
}

type ScalableDeliveryPlanContract = {
  deliveryLevel?:
    | 'safe-first-delivery'
    | 'frontend-project'
    | 'fullstack-local'
    | 'monorepo-local'
    | 'infra-local-plan'
  reason?: string
  targetStructure?: string[]
  allowedRootPaths?: string[]
  modules?: string[]
  directories?: string[]
  filesToCreate?: ScalableDeliveryPlanFileContract[]
  localOnlyConstraints?: string[]
  explicitExclusions?: string[]
  approvalRequiredLater?: string[]
  successCriteria?: string[]
}

type ProjectBlueprintIntegrationContract = {
  name?: string
  type?: string
  requiredNow?: boolean
  approvalRequired?: boolean
  reason?: string
}

type ProjectBlueprintPhaseContract = {
  phase?: string
  goal?: string
  deliveryLevel?: ScalableDeliveryPlanContract['deliveryLevel'] | string
  executableNow?: boolean
  approvalRequired?: boolean
}

type ProjectBlueprintContract = {
  productType?: string
  domain?: string
  intent?: string
  deliveryLevel?: ScalableDeliveryPlanContract['deliveryLevel'] | string
  confidence?: 'low' | 'medium' | 'high' | string
  stackProfile?: {
    frontend?: string
    backend?: string
    database?: string
    apiStyle?: string
    auth?: string
    styling?: string
    testing?: string
    packageManager?: string
    runtime?: string
  }
  roles?: string[]
  modules?: string[]
  entities?: string[]
  coreFlows?: string[]
  integrations?: ProjectBlueprintIntegrationContract[]
  dataSensitivity?: 'none' | 'low' | 'medium' | 'high' | string
  riskLevel?: 'low' | 'medium' | 'high' | string
  assumptions?: string[]
  blockingQuestions?: string[]
  delegatedDecisions?: string[]
  phasePlan?: ProjectBlueprintPhaseContract[]
  explicitExclusions?: string[]
  approvalRequiredLater?: string[]
  successCriteria?: string[]
}

type QuestionPolicyContract = {
  mode?: 'ask-only-if-blocking' | 'brain-decides-missing' | 'user-will-contribute' | string
  blockingQuestions?: string[]
  optionalQuestions?: string[]
  delegatedDecisions?: string[]
  shouldAskBeforePlanning?: boolean
  shouldAskBeforeMaterialization?: boolean
  reason?: string
}

type ImplementationRoadmapPhaseContract = {
  id?: string
  title?: string
  goal?: string
  deliveryLevel?: ScalableDeliveryPlanContract['deliveryLevel'] | string
  status?: 'planned' | 'ready' | 'blocked' | 'done' | string
  executableNow?: boolean
  approvalRequired?: boolean
  riskLevel?: 'low' | 'medium' | 'high' | string
  expectedOutputs?: string[]
  allowedRootPaths?: string[]
  dependencies?: string[]
  validationStrategy?: string[]
}

type ImplementationRoadmapContract = {
  projectSlug?: string
  projectType?: string
  domain?: string
  deliveryLevel?: ScalableDeliveryPlanContract['deliveryLevel'] | string
  currentPhase?: string
  phases?: ImplementationRoadmapPhaseContract[]
  nextRecommendedPhase?: string
  suggestedNextAction?: string
  blockers?: string[]
  explicitExclusions?: string[]
  approvalRequiredLater?: string[]
  successCriteria?: string[]
}

type NextActionPlanContract = {
  currentState?: string
  recommendedAction?: string
  actionType?:
    | 'review-plan'
    | 'prepare-materialization'
    | 'execute-materialization'
    | 'validate-result'
    | 'expand-next-phase'
    | 'ask-blocking-question'
    | 'request-approval'
    | string
  targetStrategy?: string
  targetDeliveryLevel?: ScalableDeliveryPlanContract['deliveryLevel'] | string
  reason?: string
  safeToRunNow?: boolean
  requiresApproval?: boolean
  userFacingLabel?: string
  technicalLabel?: string
  expectedOutcome?: string
}

type ValidationPlanFileCheckContract = {
  path?: string
  expectation?: string
}

type ValidationPlanContract = {
  scope?: string
  level?: 'light' | 'medium' | 'full' | string
  commands?: string[]
  fileChecks?: ValidationPlanFileCheckContract[]
  forbiddenPaths?: string[]
  runtimeChecks?: string[]
  manualChecks?: string[]
  successCriteria?: string[]
}

type PhaseExpansionPlanContract = {
  phaseId?: string
  goal?: string
  targetFiles?: string[]
  changesExpected?: string[]
  risks?: string[]
  validationPlan?: ValidationPlanContract | null
  executableNow?: boolean
  approvalRequired?: boolean
  nextExpectedAction?: string
}

type ExpansionOptionContract = {
  id?: string
  label?: string
  description?: string
  expansionType?: string
  riskLevel?: 'low' | 'medium' | 'high' | string
  safeToPrepare?: boolean
  safeToMaterialize?: boolean
  requiresApproval?: boolean
  targetStrategy?: string
  expectedFiles?: string[]
  reason?: string
}

type ExpansionOptionsContract = {
  projectRoot?: string
  currentPhase?: string
  recommendedOptionId?: string
  options?: ExpansionOptionContract[]
}

type ModuleExpansionExpectedChangeContract = {
  layer?: string
  targetPath?: string
  purpose?: string
}

type ModuleExpansionPlanContract = {
  moduleId?: string
  moduleName?: string
  projectRoot?: string
  domain?: string
  expansionType?: string
  reason?: string
  safeToPrepare?: boolean
  safeToMaterialize?: boolean
  approvalRequired?: boolean
  riskLevel?: 'low' | 'medium' | 'high' | string
  affectedLayers?: string[]
  targetFiles?: string[]
  allowedTargetPaths?: string[]
  forbiddenPaths?: string[]
  blockers?: string[]
  expectedChanges?: ModuleExpansionExpectedChangeContract[]
  validationPlan?: ValidationPlanContract | null
  explicitExclusions?: string[]
  successCriteria?: string[]
}

type ModuleExpansionActionPayload = {
  moduleId?: string
  moduleName?: string
  optionType?: string
  targetStrategy?: string
  expectedFiles?: string[] | null
  safeToPrepare?: boolean
  safeToMaterialize?: boolean
  requiresApproval?: boolean
  reason?: string
}

type ContinuationActionContract = {
  id?: string
  title?: string
  description?: string
  category?: string
  targetStrategy?: string
  safeToPrepare?: boolean
  safeToMaterialize?: boolean
  requiresApproval?: boolean
  blocked?: boolean
  blocker?: string
  approvalType?: string
  expectedOutcome?: string
  recommended?: boolean
  priority?: number
  phaseId?: string
  moduleId?: string
  riskLevel?: 'low' | 'medium' | 'high' | string
  projectRoot?: string
  deliveryLevel?: ScalableDeliveryPlanContract['deliveryLevel'] | string
  reason?: string
  targetFiles?: string[]
  allowedTargetPaths?: string[]
  explicitExclusions?: string[]
  successCriteria?: string[]
  risks?: string[]
  validationPlan?: ValidationPlanContract | null
}

type ProjectContinuationStateContract = {
  projectStatus?: string
  completedPhases?: string[]
  pendingPhases?: string[]
  availableSafeActions?: ContinuationActionContract[]
  availablePlanningActions?: ContinuationActionContract[]
  approvalRequiredActions?: ContinuationActionContract[]
  blockedActions?: ContinuationActionContract[]
  modulesDone?: string[]
  modulesAvailable?: string[]
  modulesBlocked?: string[]
  nextRecommendedAction?: ContinuationActionContract | null
  nextRecommendedPhase?: string
  nextRecommendedModule?: string
  risks?: string[]
  blockers?: string[]
  summary?: string
  operatorMessage?: string
}

type ProjectPhaseExecutionOperationPreviewContract = {
  type?: string
  targetPath?: string
  purpose?: string
}

type ProjectPhaseExecutionPlanContract = {
  phaseId?: string
  sourceStrategy?: string
  targetStrategy?: string
  deliveryLevel?: ScalableDeliveryPlanContract['deliveryLevel'] | string
  projectRoot?: string
  goal?: string
  reason?: string
  executableNow?: boolean
  approvalRequired?: boolean
  riskLevel?: 'low' | 'medium' | 'high' | string
  targetFiles?: string[]
  allowedTargetPaths?: string[]
  operationsPreview?: ProjectPhaseExecutionOperationPreviewContract[]
  validationPlan?: ValidationPlanContract | null
  explicitExclusions?: string[]
  successCriteria?: string[]
}

type LocalProjectManifestPhaseContract = {
  id?: string
  status?: string
  createdAt?: string
  files?: string[]
}

type LocalProjectManifestModuleContract = {
  id?: string
  name?: string
  status?: string
  addedAt?: string
  layers?: string[]
  files?: string[]
}

type LocalProjectManifestHistoryContract = {
  kind?: string
  id?: string
  status?: string
  at?: string
  note?: string
}

type LocalProjectManifestContract = {
  version?: number
  projectType?: string
  domain?: string
  deliveryLevel?: ScalableDeliveryPlanContract['deliveryLevel'] | string
  createdBy?: string
  materializationLayer?: string
  phases?: LocalProjectManifestPhaseContract[]
  modules?: LocalProjectManifestModuleContract[]
  forbiddenPaths?: string[]
  nextRecommendedPhase?: string
  nextRecommendedAction?: string
  lastCompletedPhase?: string
  availableActions?: string[]
  blockedActions?: string[]
  approvalRequiredActions?: string[]
  risks?: string[]
  updatedAt?: string
  history?: LocalProjectManifestHistoryContract[]
}

type MaterializationPlanContract = Record<string, unknown>

type PlannerExecutionMetadata = {
  decisionKey: string
  businessSector: string
  businessSectorLabel: string
  creativeDirection: WebCreativeDirectionContract | null
  executionScope: ExecutorExecutionScope | null
  strategy: string
  executionMode: string
  reason: string
  nextExpectedAction: string
  tasks: Array<{
    step?: number
    title?: string
    operation?: string
    targetPath?: string
  }>
  assumptions: string[]
  reusableArtifactLookup: ReusableArtifactLookupContract | null
  reusableArtifactsFound: number
  reuseDecision: boolean
  reuseReason: string
  reusedArtifactIds: string[]
  reuseMode: string
  contextHubStatus: ContextHubStatusSummary | null
  productArchitecture: ProductArchitectureContract | null
  safeFirstDeliveryPlan: SafeFirstDeliveryPlanContract | null
  safeFirstDeliveryMaterialization: SafeFirstDeliveryMaterializationContract | null
  domainUnderstanding: DomainUnderstandingContract | null
  scalableDeliveryPlan: ScalableDeliveryPlanContract | null
  projectBlueprint: ProjectBlueprintContract | null
  questionPolicy: QuestionPolicyContract | null
  implementationRoadmap: ImplementationRoadmapContract | null
  nextActionPlan: NextActionPlanContract | null
  validationPlan: ValidationPlanContract | null
  phaseExpansionPlan: PhaseExpansionPlanContract | null
  projectPhaseExecutionPlan: ProjectPhaseExecutionPlanContract | null
  localProjectManifest: LocalProjectManifestContract | null
  expansionOptions: ExpansionOptionsContract | null
  moduleExpansionPlan: ModuleExpansionPlanContract | null
  continuationActionPlan: ContinuationActionContract | null
  projectContinuationState: ProjectContinuationStateContract | null
  materializationPlan: MaterializationPlanContract | null
}

type PlannerRequestSnapshot = {
  goal: string
  context: string
  decisionKey: string
  safeFirstDeliveryPlanFingerprint: string
}

type ContextHubStatusSummary = {
  source: 'context-hub'
  endpoint: string
  available: boolean
  id?: string
  slug?: string
  title?: string
  itemsCount?: number
  estimatedTokens?: number
  reason?: string
}

type BrainCostMode = 'cheap' | 'balanced' | 'smart' | 'max-quality'

type BrainRoutingDecision = {
  selectedProvider?: string
  resolvedProvider?: string
  fallbackProvider?: string
  fallbackUsed?: boolean
  fallbackReason?: string
  routingMode?: string
  reason?: string
  confidence?: number
  costMode?: BrainCostMode
  complexity?: 'low' | 'medium' | 'high'
  ambiguity?: 'low' | 'medium' | 'high'
  risk?: 'low' | 'medium' | 'high'
  impact?: 'low' | 'medium' | 'high'
  problemNature?: string
}

type ExecutionRunSummary = {
  runId: string
  latestRequestId: string
  requestIds: string[]
  objectiveSummary: string
  instructionSummary: string
  approvalsOpened: number
  recoveries: number
  repeatedFailureCount: number
  latestFailureType: string
  finalFailureType: string
  hasMaterialProgress: boolean
  createdPaths: string[]
  touchedPaths: string[]
  latestRecoveryMode: string
  latestExecutorMode: string
  latestBridgeMode: string
  latestDecisionKey: string
  latestAttemptScope: string
  latestExecutionScope: string
  blockedRecoveryModes: string[]
  continuationAnchor: string
  status: 'running' | 'approval-pending' | 'recovery-pending' | 'success' | 'error'
  scenarioLabel:
    | 'Caso feliz base'
    | 'Falla recuperable'
    | 'Recovery exitoso'
    | 'Bloqueo por repeticion equivalente'
    | 'Corrida fallida'
    | 'Corrida en curso'
  updatedAtLabel: string
}

type UserParticipationMode =
  | 'user-will-contribute'
  | 'brain-decides-missing'
  | ''

type ResolvedDecisionRecord = {
  key: string
  status: 'delegated' | 'approved' | 'rejected' | 'resolved'
  source: 'system' | 'user' | 'planner' | 'executor'
  summary?: string
  responseMode?: 'binary' | 'options' | 'free-answer' | 'mixed'
  selectedOption?: string
  freeAnswer?: string
  approvalFamily?: string
  updatedAt?: string
}

type PlannerProjectState = {
  userParticipationMode?: UserParticipationMode
  resolvedDecisions?: ResolvedDecisionRecord[]
}

type WebCreativeDirectionContract = {
  profileKey?: string
  originalityLevel?: string
  experienceType?: string
  visualStyle?: string
  tone?: string
  heroStyle?: string
  layoutVariant?: string
  layoutRhythm?: string
  contentDensity?: string
  primaryCta?: string
  secondaryCta?: string
  sectionOrder?: string[]
  prioritySections?: string[]
  heroEyebrow?: string
  heroPanelTitle?: string
  heroPanelItems?: string[]
  sectionLabels?: {
    aboutTag?: string
    servicesTag?: string
    trustTag?: string
    contactTag?: string
  }
  typography?: {
    headingFamily?: string
    bodyFamily?: string
    fontHref?: string
  }
  paletteSuggestion?: Record<string, string>
  cta?: {
    primary?: string
    secondary?: string
  }
  layoutCriteria?: string[]
}

type ApprovalRequestOption = {
  key: string
  label: string
  description?: string
}

type ApprovalRequestContract = {
  decisionKey?: string
  reason?: string
  question?: string
  options?: ApprovalRequestOption[]
  allowFreeAnswer?: boolean
  allowBrainDefault?: boolean
  impact?: string
  nextExpectedAction?: string
  responseMode?: 'binary' | 'options' | 'free-answer' | 'mixed'
}

type ProjectApprovalPolicy = {
  scope: 'repeatable-executor-approval'
  source: 'executor'
  decisionKey: string
  responseMode: 'binary'
}

type PlannerDecisionResponse = {
  ok: boolean
  goal?: string
  instruction?: string
  completed?: boolean
  iterationLabel?: string
  approvalRequired?: boolean
  approvalReason?: string
  businessSector?: string
  businessSectorLabel?: string
  creativeDirection?: WebCreativeDirectionContract
  reusableArtifactLookup?: {
    executed?: boolean
    foundCount?: number
    matches?: Array<Partial<ReusableArtifactLookupMatch>>
  }
  reusableArtifactsFound?: number
  reuseDecision?: boolean
  reuseReason?: string
  reusedArtifactIds?: string[]
  reuseMode?: string
  executionScope?: ExecutorExecutionScope
  strategy?: string
  executionMode?: string
  decisionKey?: string
  reason?: string
  question?: string
  approvalRequest?: ApprovalRequestContract
  nextExpectedAction?: string
  contextHubStatus?: ContextHubStatusSummary | null
  productArchitecture?: ProductArchitectureContract | null
  safeFirstDeliveryPlan?: SafeFirstDeliveryPlanContract | null
  safeFirstDeliveryMaterialization?: SafeFirstDeliveryMaterializationContract | null
  domainUnderstanding?: DomainUnderstandingContract | null
  scalableDeliveryPlan?: ScalableDeliveryPlanContract | null
  projectBlueprint?: ProjectBlueprintContract | null
  questionPolicy?: QuestionPolicyContract | null
  implementationRoadmap?: ImplementationRoadmapContract | null
  nextActionPlan?: NextActionPlanContract | null
  validationPlan?: ValidationPlanContract | null
  phaseExpansionPlan?: PhaseExpansionPlanContract | null
  projectPhaseExecutionPlan?: ProjectPhaseExecutionPlanContract | null
  localProjectManifest?: LocalProjectManifestContract | null
  expansionOptions?: ExpansionOptionsContract | null
  moduleExpansionPlan?: ModuleExpansionPlanContract | null
  continuationActionPlan?: ContinuationActionContract | null
  projectContinuationState?: ProjectContinuationStateContract | null
  materializationPlan?: MaterializationPlanContract | null
  brainRoutingDecision?: BrainRoutingDecision
  tasks?: unknown[]
  assumptions?: string[]
  error?: string
}

type OrchestratorPlannerFeedback = {
  type: 'approval-granted' | 'approval-rejected' | 'execution-error'
  source: 'planner' | 'executor'
  approvalMode?: 'once' | 'project-rule'
  instruction?: string
  error?: string
  approvalReason?: string
  resultPreview?: string
  approvalRequestDecisionKey?: string
  responseMode?: 'binary' | 'options' | 'free-answer' | 'mixed'
  selectedOption?: string
  freeAnswer?: string
  executorFailureContext?: ExecutorFailureContext
}

declare global {
  interface Window {
    aiOrchestrator?: {
      platform?: string
      getRuntimeStatus?: () => Promise<{
        ok: boolean
        platform: string
        electron: string
        node: string
        executorMode: string
        executorModeSource: string
        bridgeMode: string
        bridgeModeSource: string
      }>
      listReusableArtifacts?: (payload?: {
        id?: string
        type?: string
        sector?: string
        visualStyle?: string
        layoutVariant?: string
        heroStyle?: string
        tags?: string[]
        search?: string
        limit?: number
      }) => Promise<{
        ok: boolean
        artifacts?: ReusableArtifactRecord[]
      }>
      searchReusableArtifacts?: (payload?: {
        sector?: string
        visualStyle?: string
        layoutVariant?: string
        heroStyle?: string
        tags?: string[]
        limit?: number
      }) => Promise<{
        ok: boolean
        artifacts?: ReusableArtifactRecord[]
      }>
      planTask?: (payload: {
        goal: string
        iteration?: number
        previousExecutionResult?: string
        context?: string
        workspacePath?: string
        userParticipationMode?: UserParticipationMode
        projectState?: PlannerProjectState
        autonomyLevel?: string
        costMode?: BrainCostMode
        routingHints?: {
          forceProvider?: string
          preferProvider?: string
        }
        manualReusablePreference?: ManualReusablePreference
      }) => Promise<PlannerDecisionResponse>
      executeTask?: (payload: {
        instruction: string
        context?: string
        workspacePath?: string
        requestId?: string
        decisionKey?: string
        businessSector?: string
        businessSectorLabel?: string
        creativeDirection?: WebCreativeDirectionContract
        reusableArtifactLookup?: PlannerDecisionResponse['reusableArtifactLookup']
        reusableArtifactsFound?: number
        reuseDecision?: boolean
        reuseReason?: string
        reusedArtifactIds?: string[]
        reuseMode?: string
        executionScope?: ExecutorExecutionScope
        safeFirstDeliveryMaterialization?: SafeFirstDeliveryMaterializationContract
        materializationPlan?: MaterializationPlanContract
      }) => Promise<{
        ok: boolean
        accepted?: boolean
        instruction?: string
        result?: string
        resultPreview?: string
        requestId?: string
        approvalRequired?: boolean
        approvalReason?: string
        error?: string
        failureType?: string
        details?: ExecutorFailureContext & {
          exitCode?: number
        }
        trace?: ExecutorTraceEntry[]
      }>
      onExecutionEvent?: (
        listener: (payload: ExecutionEventPayload) => void,
      ) => (() => void) | void
      onExecutionComplete?: (
        listener: (payload: ExecutionCompletePayload) => void,
      ) => (() => void) | void
    }
  }
}

const PROJECT_POLICY_KEY = 'ai-orchestrator.projectPolicyAllowed'
const SESSION_EVENTS_KEY = 'ai-orchestrator.sessionEvents'
const SESSION_SNAPSHOT_KEY = 'ai-orchestrator.sessionSnapshot'
const WORKSPACE_PATH_KEY = 'ai-orchestrator.workspacePath'
const USER_PARTICIPATION_MODE_KEY = 'ai-orchestrator.userParticipationMode'
const RESOLVED_DECISIONS_KEY = 'ai-orchestrator.resolvedDecisions'
const BRAIN_COST_MODE_KEY = 'ai-orchestrator.brainCostMode'
const FLOW_CONSOLE_STATE_KEY = 'ai-orchestrator.flowConsoleState'
const FLOW_MESSAGES_KEY = 'ai-orchestrator.flowMessages'
const DEFAULT_SESSION_STATUS = 'Listo para recibir un objetivo'
const DEFAULT_CURRENT_STEP = 'Esperando una nueva instrucción del planificador'
const READY_WITH_PROJECT_RULE_STATUS =
  'Listo para continuar con la regla del proyecto'
const READY_WITH_PROJECT_RULE_STEP =
  'Esperando una nueva acción con aprobación persistente'
const DEFAULT_SESSION_EVENTS = [
  'Sesión creada',
  'El planificador cargó el objetivo inicial',
  'Se abrió el punto de aprobación',
]
const DEFAULT_GOAL_INPUT =
  'Preparar una mejora del flujo de trabajo entre planificador y ejecutor'
const LEGACY_DEFAULT_WORKSPACE_PATH =
  'C:\\Users\\letas\\Desktop\\Proyectos\\Desarrollo\\orquestadoria\\ai-orchestrator'
const DEFAULT_WORKSPACE_PATH =
  'C:\\Users\\letas\\Desktop\\Proyectos\\Desarrollo\\web-prueba'
const DEFAULT_EXECUTION_CONTEXT_INPUT = ''
const DEFAULT_USER_PARTICIPATION_MODE: UserParticipationMode = ''
const DEFAULT_RESOLVED_DECISIONS: ResolvedDecisionRecord[] = []
const DEFAULT_BRAIN_COST_MODE: BrainCostMode = 'balanced'
const DEFAULT_PLANNER_INSTRUCTION = 'Todavía no se generó ninguna instrucción'
const DEFAULT_EXECUTOR_RESULT = 'Todavía no se ejecutó ninguna instrucción'
const DEFAULT_EXECUTOR_REQUEST_STATE = 'idle'
const DEFAULT_APPROVAL_MESSAGE =
  'Esta tarea necesita validación manual antes de continuar.'
const AUTO_FLOW_COMPLETED_STATUS = 'Objetivo completado en flujo automático'
const DEFAULT_LAST_RUN_TEXT = 'Todavía no se registró ninguna corrida'
const DEFAULT_LAST_RUN_SUMMARY = {
  objective: DEFAULT_LAST_RUN_TEXT,
  instruction: DEFAULT_LAST_RUN_TEXT,
  result: DEFAULT_LAST_RUN_TEXT,
  context: DEFAULT_LAST_RUN_TEXT,
  workspacePath: DEFAULT_LAST_RUN_TEXT,
  approval: DEFAULT_LAST_RUN_TEXT,
  finalStatus: DEFAULT_LAST_RUN_TEXT,
}
const DEFAULT_FLOW_MESSAGES: FlowMessage[] = []
const EMPTY_PLANNER_EXECUTION_METADATA: PlannerExecutionMetadata = {
  decisionKey: '',
  businessSector: '',
  businessSectorLabel: '',
  creativeDirection: null,
  executionScope: null,
  strategy: '',
  executionMode: '',
  reason: '',
  nextExpectedAction: '',
  tasks: [],
  assumptions: [],
  reusableArtifactLookup: null,
  reusableArtifactsFound: 0,
  reuseDecision: false,
  reuseReason: '',
  reusedArtifactIds: [],
  reuseMode: 'none',
  contextHubStatus: null,
  productArchitecture: null,
  safeFirstDeliveryPlan: null,
  safeFirstDeliveryMaterialization: null,
  domainUnderstanding: null,
  scalableDeliveryPlan: null,
  projectBlueprint: null,
  questionPolicy: null,
  implementationRoadmap: null,
  nextActionPlan: null,
  validationPlan: null,
  phaseExpansionPlan: null,
  projectPhaseExecutionPlan: null,
  localProjectManifest: null,
  expansionOptions: null,
  moduleExpansionPlan: null,
  continuationActionPlan: null,
  projectContinuationState: null,
  materializationPlan: null,
}

const buildSafeFirstDeliveryReviewMetadata = ({
  baseMetadata,
  plan,
}: {
  baseMetadata: PlannerExecutionMetadata
  plan: SafeFirstDeliveryPlanContract
}): PlannerExecutionMetadata => ({
  ...EMPTY_PLANNER_EXECUTION_METADATA,
  businessSector: baseMetadata.businessSector,
  businessSectorLabel: baseMetadata.businessSectorLabel,
  creativeDirection: baseMetadata.creativeDirection,
  reason: baseMetadata.reason,
  assumptions: baseMetadata.assumptions,
  reusableArtifactLookup: baseMetadata.reusableArtifactLookup,
  reusableArtifactsFound: baseMetadata.reusableArtifactsFound,
  reuseDecision: baseMetadata.reuseDecision,
  reuseReason: baseMetadata.reuseReason,
  reusedArtifactIds: baseMetadata.reusedArtifactIds,
  reuseMode: baseMetadata.reuseMode,
  contextHubStatus: baseMetadata.contextHubStatus,
  productArchitecture: baseMetadata.productArchitecture,
  domainUnderstanding: baseMetadata.domainUnderstanding,
  scalableDeliveryPlan: baseMetadata.scalableDeliveryPlan,
  projectBlueprint: baseMetadata.projectBlueprint,
  questionPolicy: baseMetadata.questionPolicy,
  implementationRoadmap: baseMetadata.implementationRoadmap,
  nextActionPlan: baseMetadata.nextActionPlan,
  validationPlan: baseMetadata.validationPlan,
  phaseExpansionPlan: baseMetadata.phaseExpansionPlan,
  projectPhaseExecutionPlan: baseMetadata.projectPhaseExecutionPlan,
  localProjectManifest: baseMetadata.localProjectManifest,
  materializationPlan: baseMetadata.materializationPlan,
  decisionKey: 'safe-first-delivery-plan',
  strategy: 'safe-first-delivery-plan',
  executionMode: 'planner-only',
  nextExpectedAction: 'review-safe-first-delivery',
  safeFirstDeliveryPlan: plan,
})
const BRAIN_COST_MODE_OPTIONS: Array<{
  value: BrainCostMode
  label: string
  description: string
}> = [
  {
    value: 'cheap',
    label: 'Económico',
    description: 'Prioriza reglas locales para pedidos simples y cuida el costo.',
  },
  {
    value: 'balanced',
    label: 'Equilibrado',
    description: 'Equilibra costo y criterio sin romper el flujo actual.',
  },
  {
    value: 'smart',
    label: 'Inteligente',
    description: 'Decide por dificultad, ambigüedad, riesgo e impacto.',
  },
  {
    value: 'max-quality',
    label: 'Máxima calidad',
    description: 'Deriva más casos a OpenAI para maximizar criterio.',
  },
]
const ORCHESTRATOR_PLANNER_FEEDBACK_PREFIX = '__orchestrator_feedback__:'

const DEFAULT_RUNTIME_STATUS = {
  connection: 'Todavía no se probó',
  platform: 'No disponible',
  electron: 'No disponible',
  node: 'No disponible',
  executorMode: 'unknown',
  executorModeSource: '',
  bridgeMode: 'unknown',
  bridgeModeSource: '',
}

function formatExecutorRuntimeModeLabel(executorMode?: string, bridgeMode?: string) {
  const normalizedExecutorMode =
    typeof executorMode === 'string' ? executorMode.trim().toLocaleLowerCase() : ''
  const normalizedBridgeMode =
    typeof bridgeMode === 'string' ? bridgeMode.trim().toLocaleLowerCase() : ''

  if (normalizedExecutorMode === 'mock') {
    return 'Mock local'
  }

  if (normalizedExecutorMode === 'command' && normalizedBridgeMode === 'codex') {
    return 'Real (Codex)'
  }

  if (normalizedExecutorMode === 'command') {
    return 'Real por comando'
  }

  return 'No definido'
}

function formatExecutorRuntimeModeDetail({
  executorModeSource,
  bridgeMode,
  bridgeModeSource,
  executorCommand,
}: {
  executorModeSource?: string
  bridgeMode?: string
  bridgeModeSource?: string
  executorCommand?: string
}) {
  const detailParts = []

  if (typeof executorModeSource === 'string' && executorModeSource.trim()) {
    detailParts.push(
      executorModeSource.trim() === 'env' ? 'forzado por entorno' : 'default del flujo',
    )
  }

  const normalizedBridgeMode =
    typeof bridgeMode === 'string' ? bridgeMode.trim().toLocaleLowerCase() : ''

  if (normalizedBridgeMode && normalizedBridgeMode !== 'unknown') {
    const bridgeModeLabel = `bridge ${normalizedBridgeMode}`
    const bridgeSourceLabel =
      typeof bridgeModeSource === 'string' && bridgeModeSource.trim()
        ? bridgeModeSource.trim() === 'env'
          ? 'por entorno'
          : 'por default'
        : ''
    detailParts.push(
      bridgeSourceLabel ? `${bridgeModeLabel} ${bridgeSourceLabel}` : bridgeModeLabel,
    )
  }

  if (typeof executorCommand === 'string' && executorCommand.trim()) {
    detailParts.push(executorCommand.trim())
  }

  return detailParts.join(' · ') || 'Sin metadata de runtime'
}

const normalizeValidationResults = (value: unknown): ExecutorValidationResult[] =>
  Array.isArray(value)
    ? value
        .map((entry) =>
          entry && typeof entry === 'object'
            ? {
                ...(typeof (entry as { type?: unknown }).type === 'string'
                  ? { type: (entry as { type: string }).type.trim() }
                  : {}),
                ...((typeof (entry as { targetPath?: unknown }).targetPath === 'string' &&
                  (entry as { targetPath: string }).targetPath.trim()) ||
                (typeof (entry as { path?: unknown }).path === 'string' &&
                  (entry as { path: string }).path.trim())
                  ? {
                      targetPath:
                        (typeof (entry as { targetPath?: unknown }).targetPath === 'string' &&
                        (entry as { targetPath: string }).targetPath.trim()
                          ? (entry as { targetPath: string }).targetPath.trim()
                          : (entry as { path: string }).path.trim()),
                    }
                  : {}),
                ...(typeof (entry as { expectedKind?: unknown }).expectedKind === 'string'
                  ? { expectedKind: (entry as { expectedKind: string }).expectedKind.trim() }
                  : {}),
                ...(typeof (entry as { ok?: unknown }).ok === 'boolean'
                  ? { ok: (entry as { ok: boolean }).ok }
                  : {}),
              }
            : null,
        )
        .filter((entry): entry is ExecutorValidationResult => entry !== null)
    : []

const isLocalFastRouteExecution = (value?: {
  strategy?: unknown
  materializationPlanSource?: unknown
  materialState?: unknown
  executionMode?: unknown
  decisionKey?: unknown
} | null) => {
  const normalizedStrategy = normalizeOptionalString(value?.strategy).toLocaleLowerCase()
  const normalizedPlanSource = normalizeOptionalString(
    value?.materializationPlanSource,
  ).toLocaleLowerCase()
  const normalizedMaterialState = normalizeOptionalString(value?.materialState).toLocaleLowerCase()
  const normalizedExecutionMode = normalizeOptionalString(value?.executionMode).toLocaleLowerCase()
  const normalizedDecisionKey = normalizeOptionalString(value?.decisionKey).toLocaleLowerCase()

  return (
    normalizedStrategy === 'local-deterministic-materialization' ||
    normalizedPlanSource.startsWith('fast-route:') ||
    normalizedMaterialState === 'local-deterministic-success' ||
    normalizedExecutionMode === 'local-fast' ||
    normalizedDecisionKey === 'fast-local'
  )
}

const getReuseModeLabel = (
  value: unknown,
  { noneLabel = 'Sin reutilización aplicada' }: { noneLabel?: string } = {},
) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'reuse-style-and-structure') {
    return 'Reutilizar estilo y estructura'
  }

  if (normalizedValue === 'reuse-style') {
    return 'Reutilizar estilo'
  }

  if (normalizedValue === 'reuse-structure') {
    return 'Reutilizar estructura'
  }

  if (normalizedValue === 'inspiration-only') {
    return 'Solo inspiracion'
  }

  return noneLabel
}

const normalizeProductArchitectureContract = (
  value: unknown,
): ProductArchitectureContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const architecture = value as ProductArchitectureContract
  const suggestedArchitecture =
    architecture.suggestedArchitecture &&
    typeof architecture.suggestedArchitecture === 'object'
      ? {
          ...(normalizeOptionalString(architecture.suggestedArchitecture.frontend)
            ? {
                frontend: normalizeOptionalString(
                  architecture.suggestedArchitecture.frontend,
                ),
              }
            : {}),
          ...(normalizeOptionalString(architecture.suggestedArchitecture.backend)
            ? {
                backend: normalizeOptionalString(
                  architecture.suggestedArchitecture.backend,
                ),
              }
            : {}),
          ...(normalizeOptionalString(architecture.suggestedArchitecture.database)
            ? {
                database: normalizeOptionalString(
                  architecture.suggestedArchitecture.database,
                ),
              }
            : {}),
          ...(normalizeOptionalString(architecture.suggestedArchitecture.auth)
            ? {
                auth: normalizeOptionalString(architecture.suggestedArchitecture.auth),
              }
            : {}),
          ...(normalizeOptionalString(architecture.suggestedArchitecture.payments)
            ? {
                payments: normalizeOptionalString(
                  architecture.suggestedArchitecture.payments,
                ),
              }
            : {}),
          ...(normalizeOptionalString(architecture.suggestedArchitecture.storage)
            ? {
                storage: normalizeOptionalString(
                  architecture.suggestedArchitecture.storage,
                ),
              }
            : {}),
        }
      : null

  const normalizedValue: ProductArchitectureContract = {
    ...(normalizeOptionalString(architecture.productType)
      ? { productType: normalizeOptionalString(architecture.productType) }
      : {}),
    ...(normalizeOptionalString(architecture.domain)
      ? { domain: normalizeOptionalString(architecture.domain) }
      : {}),
    ...(normalizeOptionalStringArray(architecture.users).length > 0
      ? { users: normalizeOptionalStringArray(architecture.users) }
      : {}),
    ...(normalizeOptionalStringArray(architecture.roles).length > 0
      ? { roles: normalizeOptionalStringArray(architecture.roles) }
      : {}),
    ...(normalizeOptionalStringArray(architecture.coreModules).length > 0
      ? { coreModules: normalizeOptionalStringArray(architecture.coreModules) }
      : {}),
    ...(normalizeOptionalStringArray(architecture.dataEntities).length > 0
      ? { dataEntities: normalizeOptionalStringArray(architecture.dataEntities) }
      : {}),
    ...(normalizeOptionalStringArray(architecture.keyFlows).length > 0
      ? { keyFlows: normalizeOptionalStringArray(architecture.keyFlows) }
      : {}),
    ...(normalizeOptionalStringArray(architecture.integrations).length > 0
      ? { integrations: normalizeOptionalStringArray(architecture.integrations) }
      : {}),
    ...(normalizeOptionalStringArray(architecture.criticalRisks).length > 0
      ? { criticalRisks: normalizeOptionalStringArray(architecture.criticalRisks) }
      : {}),
    ...(normalizeOptionalStringArray(architecture.approvalRequiredFor).length > 0
      ? {
          approvalRequiredFor: normalizeOptionalStringArray(
            architecture.approvalRequiredFor,
          ),
        }
      : {}),
    ...(suggestedArchitecture &&
    Object.values(suggestedArchitecture).some((fieldValue) => Boolean(fieldValue))
      ? { suggestedArchitecture }
      : {}),
    ...(normalizeOptionalStringArray(architecture.phases).length > 0
      ? { phases: normalizeOptionalStringArray(architecture.phases) }
      : {}),
    ...(normalizeOptionalStringArray(architecture.safeFirstDelivery).length > 0
      ? {
          safeFirstDelivery: normalizeOptionalStringArray(
            architecture.safeFirstDelivery,
          ),
        }
      : {}),
    ...(normalizeOptionalStringArray(architecture.outOfScopeForFirstIteration).length > 0
      ? {
          outOfScopeForFirstIteration: normalizeOptionalStringArray(
            architecture.outOfScopeForFirstIteration,
          ),
        }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeSafeFirstDeliveryPlanContract = (
  value: unknown,
): SafeFirstDeliveryPlanContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const plan = value as SafeFirstDeliveryPlanContract
  const normalizedValue: SafeFirstDeliveryPlanContract = {
    ...(normalizeOptionalStringArray(plan.scope).length > 0
      ? { scope: normalizeOptionalStringArray(plan.scope) }
      : {}),
    ...(normalizeOptionalStringArray(plan.modules).length > 0
      ? { modules: normalizeOptionalStringArray(plan.modules) }
      : {}),
    ...(normalizeOptionalStringArray(plan.mockData).length > 0
      ? { mockData: normalizeOptionalStringArray(plan.mockData) }
      : {}),
    ...(normalizeOptionalStringArray(plan.screens).length > 0
      ? { screens: normalizeOptionalStringArray(plan.screens) }
      : {}),
    ...(normalizeOptionalStringArray(plan.localBehavior).length > 0
      ? { localBehavior: normalizeOptionalStringArray(plan.localBehavior) }
      : {}),
    ...(normalizeOptionalStringArray(plan.explicitExclusions).length > 0
      ? {
          explicitExclusions: normalizeOptionalStringArray(
            plan.explicitExclusions,
          ),
        }
      : {}),
    ...(normalizeOptionalStringArray(plan.approvalRequiredLater).length > 0
      ? {
          approvalRequiredLater: normalizeOptionalStringArray(
            plan.approvalRequiredLater,
          ),
        }
      : {}),
    ...(normalizeOptionalStringArray(plan.successCriteria).length > 0
      ? { successCriteria: normalizeOptionalStringArray(plan.successCriteria) }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeSafeFirstDeliveryMaterializationContract = (
  value: unknown,
): SafeFirstDeliveryMaterializationContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as SafeFirstDeliveryMaterializationContract
  const normalizedValue: SafeFirstDeliveryMaterializationContract = {
    ...(normalizeOptionalString(contract.domainLabel)
      ? { domainLabel: normalizeOptionalString(contract.domainLabel) }
      : {}),
    ...(normalizeOptionalString(contract.productType)
      ? { productType: normalizeOptionalString(contract.productType) }
      : {}),
    ...(normalizeOptionalStringArray(contract.modules).length > 0
      ? { modules: normalizeOptionalStringArray(contract.modules) }
      : {}),
    ...(normalizeOptionalStringArray(contract.screens).length > 0
      ? { screens: normalizeOptionalStringArray(contract.screens) }
      : {}),
    ...(normalizeOptionalStringArray(contract.entities).length > 0
      ? { entities: normalizeOptionalStringArray(contract.entities) }
      : {}),
    ...(normalizeOptionalStringArray(contract.mockCollections).length > 0
      ? { mockCollections: normalizeOptionalStringArray(contract.mockCollections) }
      : {}),
    ...(normalizeOptionalStringArray(contract.localActions).length > 0
      ? { localActions: normalizeOptionalStringArray(contract.localActions) }
      : {}),
    ...(normalizeOptionalStringArray(contract.stateHints).length > 0
      ? { stateHints: normalizeOptionalStringArray(contract.stateHints) }
      : {}),
    ...(normalizeOptionalStringArray(contract.approvalThemes).length > 0
      ? { approvalThemes: normalizeOptionalStringArray(contract.approvalThemes) }
      : {}),
    ...(normalizeOptionalStringArray(contract.explicitExclusions).length > 0
      ? {
          explicitExclusions: normalizeOptionalStringArray(
            contract.explicitExclusions,
          ),
        }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeScalableDeliveryPlanContract = (
  value: unknown,
): ScalableDeliveryPlanContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as ScalableDeliveryPlanContract
  const normalizedFilesToCreate = Array.isArray(contract.filesToCreate)
    ? contract.filesToCreate
        .map((entry) =>
          entry && typeof entry === 'object'
            ? {
                ...(normalizeOptionalString(entry.path)
                  ? { path: normalizeOptionalString(entry.path) }
                  : {}),
                ...(normalizeOptionalString(entry.purpose)
                  ? { purpose: normalizeOptionalString(entry.purpose) }
                  : {}),
                ...(typeof entry.required === 'boolean'
                  ? { required: entry.required }
                  : {}),
              }
            : null,
        )
        .filter(
          (
            entry,
          ): entry is ScalableDeliveryPlanFileContract =>
            Boolean(entry) && Object.keys(entry).length > 0,
        )
    : []

  const normalizedValue: ScalableDeliveryPlanContract = {
    ...(normalizeOptionalString(contract.deliveryLevel)
      ? {
          deliveryLevel: normalizeOptionalString(
            contract.deliveryLevel,
          ) as ScalableDeliveryPlanContract['deliveryLevel'],
        }
      : {}),
    ...(normalizeOptionalString(contract.reason)
      ? { reason: normalizeOptionalString(contract.reason) }
      : {}),
    ...(normalizeOptionalStringArray(contract.targetStructure).length > 0
      ? { targetStructure: normalizeOptionalStringArray(contract.targetStructure) }
      : {}),
    ...(normalizeOptionalStringArray(contract.allowedRootPaths).length > 0
      ? { allowedRootPaths: normalizeOptionalStringArray(contract.allowedRootPaths) }
      : {}),
    ...(normalizeOptionalStringArray(contract.modules).length > 0
      ? { modules: normalizeOptionalStringArray(contract.modules) }
      : {}),
    ...(normalizeOptionalStringArray(contract.directories).length > 0
      ? { directories: normalizeOptionalStringArray(contract.directories) }
      : {}),
    ...(normalizedFilesToCreate.length > 0 ? { filesToCreate: normalizedFilesToCreate } : {}),
    ...(normalizeOptionalStringArray(contract.localOnlyConstraints).length > 0
      ? {
          localOnlyConstraints: normalizeOptionalStringArray(
            contract.localOnlyConstraints,
          ),
        }
      : {}),
    ...(normalizeOptionalStringArray(contract.explicitExclusions).length > 0
      ? {
          explicitExclusions: normalizeOptionalStringArray(
            contract.explicitExclusions,
          ),
        }
      : {}),
    ...(normalizeOptionalStringArray(contract.approvalRequiredLater).length > 0
      ? {
          approvalRequiredLater: normalizeOptionalStringArray(
            contract.approvalRequiredLater,
          ),
        }
      : {}),
    ...(normalizeOptionalStringArray(contract.successCriteria).length > 0
      ? { successCriteria: normalizeOptionalStringArray(contract.successCriteria) }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeProjectBlueprintContract = (
  value: unknown,
): ProjectBlueprintContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as ProjectBlueprintContract
  const normalizedIntegrations = Array.isArray(contract.integrations)
    ? contract.integrations
        .map((entry) =>
          entry && typeof entry === 'object'
            ? {
                ...(normalizeOptionalString(entry.name)
                  ? { name: normalizeOptionalString(entry.name) }
                  : {}),
                ...(normalizeOptionalString(entry.type)
                  ? { type: normalizeOptionalString(entry.type) }
                  : {}),
                ...(typeof entry.requiredNow === 'boolean'
                  ? { requiredNow: entry.requiredNow }
                  : {}),
                ...(typeof entry.approvalRequired === 'boolean'
                  ? { approvalRequired: entry.approvalRequired }
                  : {}),
                ...(normalizeOptionalString(entry.reason)
                  ? { reason: normalizeOptionalString(entry.reason) }
                  : {}),
              }
            : null,
        )
        .filter(
          (entry): entry is ProjectBlueprintIntegrationContract =>
            Boolean(entry) && Object.keys(entry).length > 0,
        )
    : []
  const normalizedPhasePlan = Array.isArray(contract.phasePlan)
    ? contract.phasePlan
        .map((entry) =>
          entry && typeof entry === 'object'
            ? {
                ...(normalizeOptionalString(entry.phase)
                  ? { phase: normalizeOptionalString(entry.phase) }
                  : {}),
                ...(normalizeOptionalString(entry.goal)
                  ? { goal: normalizeOptionalString(entry.goal) }
                  : {}),
                ...(normalizeOptionalString(entry.deliveryLevel)
                  ? {
                      deliveryLevel: normalizeOptionalString(
                        entry.deliveryLevel,
                      ) as ProjectBlueprintPhaseContract['deliveryLevel'],
                    }
                  : {}),
                ...(typeof entry.executableNow === 'boolean'
                  ? { executableNow: entry.executableNow }
                  : {}),
                ...(typeof entry.approvalRequired === 'boolean'
                  ? { approvalRequired: entry.approvalRequired }
                  : {}),
              }
            : null,
        )
        .filter(
          (entry): entry is ProjectBlueprintPhaseContract =>
            Boolean(entry) && Object.keys(entry).length > 0,
        )
    : []

  const normalizedValue: ProjectBlueprintContract = {
    ...(normalizeOptionalString(contract.productType)
      ? { productType: normalizeOptionalString(contract.productType) }
      : {}),
    ...(normalizeOptionalString(contract.domain)
      ? { domain: normalizeOptionalString(contract.domain) }
      : {}),
    ...(normalizeOptionalString(contract.intent)
      ? { intent: normalizeOptionalString(contract.intent) }
      : {}),
    ...(normalizeOptionalString(contract.deliveryLevel)
      ? {
          deliveryLevel: normalizeOptionalString(
            contract.deliveryLevel,
          ) as ProjectBlueprintContract['deliveryLevel'],
        }
      : {}),
    ...(normalizeOptionalString(contract.confidence)
      ? {
          confidence: normalizeOptionalString(
            contract.confidence,
          ) as ProjectBlueprintContract['confidence'],
        }
      : {}),
    ...(contract.stackProfile && typeof contract.stackProfile === 'object'
      ? {
          stackProfile: {
            ...(normalizeOptionalString(contract.stackProfile.frontend)
              ? { frontend: normalizeOptionalString(contract.stackProfile.frontend) }
              : {}),
            ...(normalizeOptionalString(contract.stackProfile.backend)
              ? { backend: normalizeOptionalString(contract.stackProfile.backend) }
              : {}),
            ...(normalizeOptionalString(contract.stackProfile.database)
              ? { database: normalizeOptionalString(contract.stackProfile.database) }
              : {}),
            ...(normalizeOptionalString(contract.stackProfile.apiStyle)
              ? { apiStyle: normalizeOptionalString(contract.stackProfile.apiStyle) }
              : {}),
            ...(normalizeOptionalString(contract.stackProfile.auth)
              ? { auth: normalizeOptionalString(contract.stackProfile.auth) }
              : {}),
            ...(normalizeOptionalString(contract.stackProfile.styling)
              ? { styling: normalizeOptionalString(contract.stackProfile.styling) }
              : {}),
            ...(normalizeOptionalString(contract.stackProfile.testing)
              ? { testing: normalizeOptionalString(contract.stackProfile.testing) }
              : {}),
            ...(normalizeOptionalString(contract.stackProfile.packageManager)
              ? {
                  packageManager: normalizeOptionalString(
                    contract.stackProfile.packageManager,
                  ),
                }
              : {}),
            ...(normalizeOptionalString(contract.stackProfile.runtime)
              ? { runtime: normalizeOptionalString(contract.stackProfile.runtime) }
              : {}),
          },
        }
      : {}),
    ...(normalizeOptionalStringArray(contract.roles).length > 0
      ? { roles: normalizeOptionalStringArray(contract.roles) }
      : {}),
    ...(normalizeOptionalStringArray(contract.modules).length > 0
      ? { modules: normalizeOptionalStringArray(contract.modules) }
      : {}),
    ...(normalizeOptionalStringArray(contract.entities).length > 0
      ? { entities: normalizeOptionalStringArray(contract.entities) }
      : {}),
    ...(normalizeOptionalStringArray(contract.coreFlows).length > 0
      ? { coreFlows: normalizeOptionalStringArray(contract.coreFlows) }
      : {}),
    ...(normalizedIntegrations.length > 0 ? { integrations: normalizedIntegrations } : {}),
    ...(normalizeOptionalString(contract.dataSensitivity)
      ? {
          dataSensitivity: normalizeOptionalString(
            contract.dataSensitivity,
          ) as ProjectBlueprintContract['dataSensitivity'],
        }
      : {}),
    ...(normalizeOptionalString(contract.riskLevel)
      ? {
          riskLevel: normalizeOptionalString(
            contract.riskLevel,
          ) as ProjectBlueprintContract['riskLevel'],
        }
      : {}),
    ...(normalizeOptionalStringArray(contract.assumptions).length > 0
      ? { assumptions: normalizeOptionalStringArray(contract.assumptions) }
      : {}),
    ...(normalizeOptionalStringArray(contract.blockingQuestions).length > 0
      ? { blockingQuestions: normalizeOptionalStringArray(contract.blockingQuestions) }
      : {}),
    ...(normalizeOptionalStringArray(contract.delegatedDecisions).length > 0
      ? { delegatedDecisions: normalizeOptionalStringArray(contract.delegatedDecisions) }
      : {}),
    ...(normalizedPhasePlan.length > 0 ? { phasePlan: normalizedPhasePlan } : {}),
    ...(normalizeOptionalStringArray(contract.explicitExclusions).length > 0
      ? { explicitExclusions: normalizeOptionalStringArray(contract.explicitExclusions) }
      : {}),
    ...(normalizeOptionalStringArray(contract.approvalRequiredLater).length > 0
      ? {
          approvalRequiredLater: normalizeOptionalStringArray(
            contract.approvalRequiredLater,
          ),
        }
      : {}),
    ...(normalizeOptionalStringArray(contract.successCriteria).length > 0
      ? { successCriteria: normalizeOptionalStringArray(contract.successCriteria) }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeQuestionPolicyContract = (
  value: unknown,
): QuestionPolicyContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as QuestionPolicyContract
  const normalizedValue: QuestionPolicyContract = {
    ...(normalizeOptionalString(contract.mode)
      ? {
          mode: normalizeOptionalString(
            contract.mode,
          ) as QuestionPolicyContract['mode'],
        }
      : {}),
    ...(normalizeOptionalStringArray(contract.blockingQuestions).length > 0
      ? { blockingQuestions: normalizeOptionalStringArray(contract.blockingQuestions) }
      : {}),
    ...(normalizeOptionalStringArray(contract.optionalQuestions).length > 0
      ? { optionalQuestions: normalizeOptionalStringArray(contract.optionalQuestions) }
      : {}),
    ...(normalizeOptionalStringArray(contract.delegatedDecisions).length > 0
      ? { delegatedDecisions: normalizeOptionalStringArray(contract.delegatedDecisions) }
      : {}),
    ...(typeof contract.shouldAskBeforePlanning === 'boolean'
      ? { shouldAskBeforePlanning: contract.shouldAskBeforePlanning }
      : {}),
    ...(typeof contract.shouldAskBeforeMaterialization === 'boolean'
      ? { shouldAskBeforeMaterialization: contract.shouldAskBeforeMaterialization }
      : {}),
    ...(normalizeOptionalString(contract.reason)
      ? { reason: normalizeOptionalString(contract.reason) }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeImplementationRoadmapContract = (
  value: unknown,
): ImplementationRoadmapContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as ImplementationRoadmapContract
  const normalizedPhases = Array.isArray(contract.phases)
    ? contract.phases
        .map((entry) =>
          entry && typeof entry === 'object'
            ? {
                ...(normalizeOptionalString(entry.id)
                  ? { id: normalizeOptionalString(entry.id) }
                  : {}),
                ...(normalizeOptionalString(entry.title)
                  ? { title: normalizeOptionalString(entry.title) }
                  : {}),
                ...(normalizeOptionalString(entry.goal)
                  ? { goal: normalizeOptionalString(entry.goal) }
                  : {}),
                ...(normalizeOptionalString(entry.deliveryLevel)
                  ? {
                      deliveryLevel: normalizeOptionalString(
                        entry.deliveryLevel,
                      ) as ImplementationRoadmapPhaseContract['deliveryLevel'],
                    }
                  : {}),
                ...(normalizeOptionalString(entry.status)
                  ? {
                      status: normalizeOptionalString(
                        entry.status,
                      ) as ImplementationRoadmapPhaseContract['status'],
                    }
                  : {}),
                ...(typeof entry.executableNow === 'boolean'
                  ? { executableNow: entry.executableNow }
                  : {}),
                ...(typeof entry.approvalRequired === 'boolean'
                  ? { approvalRequired: entry.approvalRequired }
                  : {}),
                ...(normalizeOptionalString(entry.riskLevel)
                  ? {
                      riskLevel: normalizeOptionalString(
                        entry.riskLevel,
                      ) as ImplementationRoadmapPhaseContract['riskLevel'],
                    }
                  : {}),
                ...(normalizeOptionalStringArray(entry.expectedOutputs).length > 0
                  ? {
                      expectedOutputs: normalizeOptionalStringArray(
                        entry.expectedOutputs,
                      ),
                    }
                  : {}),
                ...(normalizeOptionalStringArray(entry.allowedRootPaths).length > 0
                  ? {
                      allowedRootPaths: normalizeOptionalStringArray(
                        entry.allowedRootPaths,
                      ),
                    }
                  : {}),
                ...(normalizeOptionalStringArray(entry.dependencies).length > 0
                  ? {
                      dependencies: normalizeOptionalStringArray(
                        entry.dependencies,
                      ),
                    }
                  : {}),
                ...(normalizeOptionalStringArray(entry.validationStrategy).length > 0
                  ? {
                      validationStrategy: normalizeOptionalStringArray(
                        entry.validationStrategy,
                      ),
                    }
                  : {}),
              }
            : null,
        )
        .filter(
          (entry): entry is ImplementationRoadmapPhaseContract =>
            Boolean(entry) && Object.keys(entry).length > 0,
        )
    : []

  const normalizedValue: ImplementationRoadmapContract = {
    ...(normalizeOptionalString(contract.projectSlug)
      ? { projectSlug: normalizeOptionalString(contract.projectSlug) }
      : {}),
    ...(normalizeOptionalString(contract.projectType)
      ? { projectType: normalizeOptionalString(contract.projectType) }
      : {}),
    ...(normalizeOptionalString(contract.domain)
      ? { domain: normalizeOptionalString(contract.domain) }
      : {}),
    ...(normalizeOptionalString(contract.deliveryLevel)
      ? {
          deliveryLevel: normalizeOptionalString(
            contract.deliveryLevel,
          ) as ImplementationRoadmapContract['deliveryLevel'],
        }
      : {}),
    ...(normalizeOptionalString(contract.currentPhase)
      ? { currentPhase: normalizeOptionalString(contract.currentPhase) }
      : {}),
    ...(normalizedPhases.length > 0 ? { phases: normalizedPhases } : {}),
    ...(normalizeOptionalString(contract.nextRecommendedPhase)
      ? { nextRecommendedPhase: normalizeOptionalString(contract.nextRecommendedPhase) }
      : {}),
    ...(normalizeOptionalString(contract.suggestedNextAction)
      ? { suggestedNextAction: normalizeOptionalString(contract.suggestedNextAction) }
      : {}),
    ...(normalizeOptionalStringArray(contract.blockers).length > 0
      ? { blockers: normalizeOptionalStringArray(contract.blockers) }
      : {}),
    ...(normalizeOptionalStringArray(contract.explicitExclusions).length > 0
      ? { explicitExclusions: normalizeOptionalStringArray(contract.explicitExclusions) }
      : {}),
    ...(normalizeOptionalStringArray(contract.approvalRequiredLater).length > 0
      ? { approvalRequiredLater: normalizeOptionalStringArray(contract.approvalRequiredLater) }
      : {}),
    ...(normalizeOptionalStringArray(contract.successCriteria).length > 0
      ? { successCriteria: normalizeOptionalStringArray(contract.successCriteria) }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeNextActionPlanContract = (
  value: unknown,
): NextActionPlanContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as NextActionPlanContract
  const normalizedValue: NextActionPlanContract = {
    ...(normalizeOptionalString(contract.currentState)
      ? { currentState: normalizeOptionalString(contract.currentState) }
      : {}),
    ...(normalizeOptionalString(contract.recommendedAction)
      ? { recommendedAction: normalizeOptionalString(contract.recommendedAction) }
      : {}),
    ...(normalizeOptionalString(contract.actionType)
      ? {
          actionType: normalizeOptionalString(
            contract.actionType,
          ) as NextActionPlanContract['actionType'],
        }
      : {}),
    ...(normalizeOptionalString(contract.targetStrategy)
      ? { targetStrategy: normalizeOptionalString(contract.targetStrategy) }
      : {}),
    ...(normalizeOptionalString(contract.targetDeliveryLevel)
      ? {
          targetDeliveryLevel: normalizeOptionalString(
            contract.targetDeliveryLevel,
          ) as NextActionPlanContract['targetDeliveryLevel'],
        }
      : {}),
    ...(normalizeOptionalString(contract.reason)
      ? { reason: normalizeOptionalString(contract.reason) }
      : {}),
    ...(typeof contract.safeToRunNow === 'boolean'
      ? { safeToRunNow: contract.safeToRunNow }
      : {}),
    ...(typeof contract.requiresApproval === 'boolean'
      ? { requiresApproval: contract.requiresApproval }
      : {}),
    ...(normalizeOptionalString(contract.userFacingLabel)
      ? { userFacingLabel: normalizeOptionalString(contract.userFacingLabel) }
      : {}),
    ...(normalizeOptionalString(contract.technicalLabel)
      ? { technicalLabel: normalizeOptionalString(contract.technicalLabel) }
      : {}),
    ...(normalizeOptionalString(contract.expectedOutcome)
      ? { expectedOutcome: normalizeOptionalString(contract.expectedOutcome) }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeContinuationActionContract = (
  value: unknown,
): ContinuationActionContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as ContinuationActionContract
  const normalizedValue: ContinuationActionContract = {
    ...(normalizeOptionalString(contract.id)
      ? { id: normalizeOptionalString(contract.id) }
      : {}),
    ...(normalizeOptionalString(contract.title)
      ? { title: normalizeOptionalString(contract.title) }
      : {}),
    ...(normalizeOptionalString(contract.description)
      ? { description: normalizeOptionalString(contract.description) }
      : {}),
    ...(normalizeOptionalString(contract.category)
      ? { category: normalizeOptionalString(contract.category) }
      : {}),
    ...(normalizeOptionalString(contract.targetStrategy)
      ? { targetStrategy: normalizeOptionalString(contract.targetStrategy) }
      : {}),
    ...(typeof contract.safeToPrepare === 'boolean'
      ? { safeToPrepare: contract.safeToPrepare }
      : {}),
    ...(typeof contract.safeToMaterialize === 'boolean'
      ? { safeToMaterialize: contract.safeToMaterialize }
      : {}),
    ...(typeof contract.requiresApproval === 'boolean'
      ? { requiresApproval: contract.requiresApproval }
      : {}),
    ...(typeof contract.blocked === 'boolean' ? { blocked: contract.blocked } : {}),
    ...(normalizeOptionalString(contract.blocker)
      ? { blocker: normalizeOptionalString(contract.blocker) }
      : {}),
    ...(normalizeOptionalString(contract.approvalType)
      ? { approvalType: normalizeOptionalString(contract.approvalType) }
      : {}),
    ...(normalizeOptionalString(contract.expectedOutcome)
      ? { expectedOutcome: normalizeOptionalString(contract.expectedOutcome) }
      : {}),
    ...(typeof contract.recommended === 'boolean'
      ? { recommended: contract.recommended }
      : {}),
    ...(Number.isFinite(contract.priority) ? { priority: contract.priority } : {}),
    ...(normalizeOptionalString(contract.phaseId)
      ? { phaseId: normalizeOptionalString(contract.phaseId) }
      : {}),
    ...(normalizeOptionalString(contract.moduleId)
      ? { moduleId: normalizeOptionalString(contract.moduleId) }
      : {}),
    ...(normalizeOptionalString(contract.riskLevel)
      ? {
          riskLevel: normalizeOptionalString(
            contract.riskLevel,
          ) as ContinuationActionContract['riskLevel'],
        }
      : {}),
    ...(normalizeOptionalString(contract.projectRoot)
      ? { projectRoot: normalizeOptionalString(contract.projectRoot) }
      : {}),
    ...(normalizeOptionalString(contract.deliveryLevel)
      ? {
          deliveryLevel: normalizeOptionalString(
            contract.deliveryLevel,
          ) as ContinuationActionContract['deliveryLevel'],
        }
      : {}),
    ...(normalizeOptionalString(contract.reason)
      ? { reason: normalizeOptionalString(contract.reason) }
      : {}),
    ...(normalizeOptionalStringArray(contract.targetFiles).length > 0
      ? { targetFiles: normalizeOptionalStringArray(contract.targetFiles) }
      : {}),
    ...(normalizeOptionalStringArray(contract.allowedTargetPaths).length > 0
      ? { allowedTargetPaths: normalizeOptionalStringArray(contract.allowedTargetPaths) }
      : {}),
    ...(normalizeOptionalStringArray(contract.explicitExclusions).length > 0
      ? { explicitExclusions: normalizeOptionalStringArray(contract.explicitExclusions) }
      : {}),
    ...(normalizeOptionalStringArray(contract.successCriteria).length > 0
      ? { successCriteria: normalizeOptionalStringArray(contract.successCriteria) }
      : {}),
    ...(normalizeOptionalStringArray(contract.risks).length > 0
      ? { risks: normalizeOptionalStringArray(contract.risks) }
      : {}),
    ...(normalizeValidationPlanContract(contract.validationPlan)
      ? { validationPlan: normalizeValidationPlanContract(contract.validationPlan) }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeProjectContinuationStateContract = (
  value: unknown,
): ProjectContinuationStateContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as ProjectContinuationStateContract
  const normalizeActionList = (entries: unknown) =>
    Array.isArray(entries)
      ? entries
          .map((entry) => normalizeContinuationActionContract(entry))
          .filter((entry): entry is ContinuationActionContract => Boolean(entry))
      : []

  const normalizedValue: ProjectContinuationStateContract = {
    ...(normalizeOptionalString(contract.projectStatus)
      ? { projectStatus: normalizeOptionalString(contract.projectStatus) }
      : {}),
    ...(normalizeOptionalStringArray(contract.completedPhases).length > 0
      ? { completedPhases: normalizeOptionalStringArray(contract.completedPhases) }
      : {}),
    ...(normalizeOptionalStringArray(contract.pendingPhases).length > 0
      ? { pendingPhases: normalizeOptionalStringArray(contract.pendingPhases) }
      : {}),
    ...(normalizeActionList(contract.availableSafeActions).length > 0
      ? { availableSafeActions: normalizeActionList(contract.availableSafeActions) }
      : {}),
    ...(normalizeActionList(contract.availablePlanningActions).length > 0
      ? {
          availablePlanningActions: normalizeActionList(
            contract.availablePlanningActions,
          ),
        }
      : {}),
    ...(normalizeActionList(contract.approvalRequiredActions).length > 0
      ? {
          approvalRequiredActions: normalizeActionList(
            contract.approvalRequiredActions,
          ),
        }
      : {}),
    ...(normalizeActionList(contract.blockedActions).length > 0
      ? { blockedActions: normalizeActionList(contract.blockedActions) }
      : {}),
    ...(normalizeOptionalStringArray(contract.modulesDone).length > 0
      ? { modulesDone: normalizeOptionalStringArray(contract.modulesDone) }
      : {}),
    ...(normalizeOptionalStringArray(contract.modulesAvailable).length > 0
      ? { modulesAvailable: normalizeOptionalStringArray(contract.modulesAvailable) }
      : {}),
    ...(normalizeOptionalStringArray(contract.modulesBlocked).length > 0
      ? { modulesBlocked: normalizeOptionalStringArray(contract.modulesBlocked) }
      : {}),
    ...(normalizeContinuationActionContract(contract.nextRecommendedAction)
      ? {
          nextRecommendedAction: normalizeContinuationActionContract(
            contract.nextRecommendedAction,
          ),
        }
      : {}),
    ...(normalizeOptionalString(contract.nextRecommendedPhase)
      ? { nextRecommendedPhase: normalizeOptionalString(contract.nextRecommendedPhase) }
      : {}),
    ...(normalizeOptionalString(contract.nextRecommendedModule)
      ? { nextRecommendedModule: normalizeOptionalString(contract.nextRecommendedModule) }
      : {}),
    ...(normalizeOptionalStringArray(contract.risks).length > 0
      ? { risks: normalizeOptionalStringArray(contract.risks) }
      : {}),
    ...(normalizeOptionalStringArray(contract.blockers).length > 0
      ? { blockers: normalizeOptionalStringArray(contract.blockers) }
      : {}),
    ...(normalizeOptionalString(contract.summary)
      ? { summary: normalizeOptionalString(contract.summary) }
      : {}),
    ...(normalizeOptionalString(contract.operatorMessage)
      ? { operatorMessage: normalizeOptionalString(contract.operatorMessage) }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeValidationPlanContract = (
  value: unknown,
): ValidationPlanContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as ValidationPlanContract
  const normalizedFileChecks = Array.isArray(contract.fileChecks)
    ? contract.fileChecks
        .map((entry) =>
          entry && typeof entry === 'object'
            ? {
                ...(normalizeOptionalString(entry.path)
                  ? { path: normalizeOptionalString(entry.path) }
                  : {}),
                ...(normalizeOptionalString(entry.expectation)
                  ? { expectation: normalizeOptionalString(entry.expectation) }
                  : {}),
              }
            : null,
        )
        .filter(
          (entry): entry is ValidationPlanFileCheckContract =>
            Boolean(entry) && Object.keys(entry).length > 0,
        )
    : []

  const normalizedValue: ValidationPlanContract = {
    ...(normalizeOptionalString(contract.scope)
      ? { scope: normalizeOptionalString(contract.scope) }
      : {}),
    ...(normalizeOptionalString(contract.level)
      ? {
          level: normalizeOptionalString(
            contract.level,
          ) as ValidationPlanContract['level'],
        }
      : {}),
    ...(normalizeOptionalStringArray(contract.commands).length > 0
      ? { commands: normalizeOptionalStringArray(contract.commands) }
      : {}),
    ...(normalizedFileChecks.length > 0 ? { fileChecks: normalizedFileChecks } : {}),
    ...(normalizeOptionalStringArray(contract.forbiddenPaths).length > 0
      ? { forbiddenPaths: normalizeOptionalStringArray(contract.forbiddenPaths) }
      : {}),
    ...(normalizeOptionalStringArray(contract.runtimeChecks).length > 0
      ? { runtimeChecks: normalizeOptionalStringArray(contract.runtimeChecks) }
      : {}),
    ...(normalizeOptionalStringArray(contract.manualChecks).length > 0
      ? { manualChecks: normalizeOptionalStringArray(contract.manualChecks) }
      : {}),
    ...(normalizeOptionalStringArray(contract.successCriteria).length > 0
      ? { successCriteria: normalizeOptionalStringArray(contract.successCriteria) }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizePhaseExpansionPlanContract = (
  value: unknown,
): PhaseExpansionPlanContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as PhaseExpansionPlanContract
  const normalizedValue: PhaseExpansionPlanContract = {
    ...(normalizeOptionalString(contract.phaseId)
      ? { phaseId: normalizeOptionalString(contract.phaseId) }
      : {}),
    ...(normalizeOptionalString(contract.goal)
      ? { goal: normalizeOptionalString(contract.goal) }
      : {}),
    ...(normalizeOptionalStringArray(contract.targetFiles).length > 0
      ? { targetFiles: normalizeOptionalStringArray(contract.targetFiles) }
      : {}),
    ...(normalizeOptionalStringArray(contract.changesExpected).length > 0
      ? { changesExpected: normalizeOptionalStringArray(contract.changesExpected) }
      : {}),
    ...(normalizeOptionalStringArray(contract.risks).length > 0
      ? { risks: normalizeOptionalStringArray(contract.risks) }
      : {}),
    ...(normalizeValidationPlanContract(contract.validationPlan)
      ? { validationPlan: normalizeValidationPlanContract(contract.validationPlan) }
      : {}),
    ...(typeof contract.executableNow === 'boolean'
      ? { executableNow: contract.executableNow }
      : {}),
    ...(typeof contract.approvalRequired === 'boolean'
      ? { approvalRequired: contract.approvalRequired }
      : {}),
    ...(normalizeOptionalString(contract.nextExpectedAction)
      ? { nextExpectedAction: normalizeOptionalString(contract.nextExpectedAction) }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeExpansionOptionsContract = (
  value: unknown,
): ExpansionOptionsContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as ExpansionOptionsContract
  const normalizedOptions = Array.isArray(contract.options)
    ? contract.options
        .map((entry) =>
          entry && typeof entry === 'object'
            ? {
                ...(normalizeOptionalString(entry.id)
                  ? { id: normalizeOptionalString(entry.id) }
                  : {}),
                ...(normalizeOptionalString(entry.label)
                  ? { label: normalizeOptionalString(entry.label) }
                  : {}),
                ...(normalizeOptionalString(entry.description)
                  ? { description: normalizeOptionalString(entry.description) }
                  : {}),
                ...(normalizeOptionalString(entry.expansionType)
                  ? { expansionType: normalizeOptionalString(entry.expansionType) }
                  : {}),
                ...(normalizeOptionalString(entry.riskLevel)
                  ? {
                      riskLevel: normalizeOptionalString(
                        entry.riskLevel,
                      ) as ExpansionOptionContract['riskLevel'],
                    }
                  : {}),
                ...(typeof entry.safeToPrepare === 'boolean'
                  ? { safeToPrepare: entry.safeToPrepare }
                  : {}),
                ...(typeof entry.safeToMaterialize === 'boolean'
                  ? { safeToMaterialize: entry.safeToMaterialize }
                  : {}),
                ...(typeof entry.requiresApproval === 'boolean'
                  ? { requiresApproval: entry.requiresApproval }
                  : {}),
                ...(normalizeOptionalString(entry.targetStrategy)
                  ? { targetStrategy: normalizeOptionalString(entry.targetStrategy) }
                  : {}),
                ...(normalizeOptionalStringArray(entry.expectedFiles).length > 0
                  ? { expectedFiles: normalizeOptionalStringArray(entry.expectedFiles) }
                  : {}),
                ...(normalizeOptionalString(entry.reason)
                  ? { reason: normalizeOptionalString(entry.reason) }
                  : {}),
              }
            : null,
        )
        .filter((entry): entry is ExpansionOptionContract => Boolean(entry))
    : []

  const normalizedValue: ExpansionOptionsContract = {
    ...(normalizeOptionalString(contract.projectRoot)
      ? { projectRoot: normalizeOptionalString(contract.projectRoot) }
      : {}),
    ...(normalizeOptionalString(contract.currentPhase)
      ? { currentPhase: normalizeOptionalString(contract.currentPhase) }
      : {}),
    ...(normalizeOptionalString(contract.recommendedOptionId)
      ? { recommendedOptionId: normalizeOptionalString(contract.recommendedOptionId) }
      : {}),
    ...(normalizedOptions.length > 0 ? { options: normalizedOptions } : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeModuleExpansionPlanContract = (
  value: unknown,
): ModuleExpansionPlanContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as ModuleExpansionPlanContract
  const normalizedExpectedChanges = Array.isArray(contract.expectedChanges)
    ? contract.expectedChanges
        .map((entry) =>
          entry && typeof entry === 'object'
            ? {
                ...(normalizeOptionalString(entry.layer)
                  ? { layer: normalizeOptionalString(entry.layer) }
                  : {}),
                ...(normalizeOptionalString(entry.targetPath)
                  ? { targetPath: normalizeOptionalString(entry.targetPath) }
                  : {}),
                ...(normalizeOptionalString(entry.purpose)
                  ? { purpose: normalizeOptionalString(entry.purpose) }
                  : {}),
              }
            : null,
        )
        .filter(
          (entry): entry is ModuleExpansionExpectedChangeContract =>
            Boolean(entry) && Object.keys(entry).length > 0,
        )
    : []

  const normalizedValue: ModuleExpansionPlanContract = {
    ...(normalizeOptionalString(contract.moduleId)
      ? { moduleId: normalizeOptionalString(contract.moduleId) }
      : {}),
    ...(normalizeOptionalString(contract.moduleName)
      ? { moduleName: normalizeOptionalString(contract.moduleName) }
      : {}),
    ...(normalizeOptionalString(contract.projectRoot)
      ? { projectRoot: normalizeOptionalString(contract.projectRoot) }
      : {}),
    ...(normalizeOptionalString(contract.domain)
      ? { domain: normalizeOptionalString(contract.domain) }
      : {}),
    ...(normalizeOptionalString(contract.expansionType)
      ? { expansionType: normalizeOptionalString(contract.expansionType) }
      : {}),
    ...(normalizeOptionalString(contract.reason)
      ? { reason: normalizeOptionalString(contract.reason) }
      : {}),
    ...(typeof contract.safeToPrepare === 'boolean'
      ? { safeToPrepare: contract.safeToPrepare }
      : {}),
    ...(typeof contract.safeToMaterialize === 'boolean'
      ? { safeToMaterialize: contract.safeToMaterialize }
      : {}),
    ...(typeof contract.approvalRequired === 'boolean'
      ? { approvalRequired: contract.approvalRequired }
      : {}),
    ...(normalizeOptionalString(contract.riskLevel)
      ? {
          riskLevel: normalizeOptionalString(
            contract.riskLevel,
          ) as ModuleExpansionPlanContract['riskLevel'],
        }
      : {}),
    ...(normalizeOptionalStringArray(contract.affectedLayers).length > 0
      ? { affectedLayers: normalizeOptionalStringArray(contract.affectedLayers) }
      : {}),
    ...(normalizeOptionalStringArray(contract.targetFiles).length > 0
      ? { targetFiles: normalizeOptionalStringArray(contract.targetFiles) }
      : {}),
    ...(normalizeOptionalStringArray(contract.allowedTargetPaths).length > 0
      ? { allowedTargetPaths: normalizeOptionalStringArray(contract.allowedTargetPaths) }
      : {}),
    ...(normalizeOptionalStringArray(contract.forbiddenPaths).length > 0
      ? { forbiddenPaths: normalizeOptionalStringArray(contract.forbiddenPaths) }
      : {}),
    ...(normalizeOptionalStringArray(contract.blockers).length > 0
      ? { blockers: normalizeOptionalStringArray(contract.blockers) }
      : {}),
    ...(normalizedExpectedChanges.length > 0
      ? { expectedChanges: normalizedExpectedChanges }
      : {}),
    ...(normalizeValidationPlanContract(contract.validationPlan)
      ? { validationPlan: normalizeValidationPlanContract(contract.validationPlan) }
      : {}),
    ...(normalizeOptionalStringArray(contract.explicitExclusions).length > 0
      ? { explicitExclusions: normalizeOptionalStringArray(contract.explicitExclusions) }
      : {}),
    ...(normalizeOptionalStringArray(contract.successCriteria).length > 0
      ? { successCriteria: normalizeOptionalStringArray(contract.successCriteria) }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeProjectPhaseExecutionPlanContract = (
  value: unknown,
): ProjectPhaseExecutionPlanContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as ProjectPhaseExecutionPlanContract
  const normalizedOperationsPreview = Array.isArray(contract.operationsPreview)
    ? contract.operationsPreview
        .map((entry) =>
          entry && typeof entry === 'object'
            ? {
                ...(normalizeOptionalString(entry.type)
                  ? { type: normalizeOptionalString(entry.type) }
                  : {}),
                ...(normalizeOptionalString(entry.targetPath)
                  ? { targetPath: normalizeOptionalString(entry.targetPath) }
                  : {}),
                ...(normalizeOptionalString(entry.purpose)
                  ? { purpose: normalizeOptionalString(entry.purpose) }
                  : {}),
              }
            : null,
        )
        .filter(
          (entry): entry is ProjectPhaseExecutionOperationPreviewContract =>
            Boolean(entry) && Object.keys(entry).length > 0,
        )
    : []

  const normalizedValue: ProjectPhaseExecutionPlanContract = {
    ...(normalizeOptionalString(contract.phaseId)
      ? { phaseId: normalizeOptionalString(contract.phaseId) }
      : {}),
    ...(normalizeOptionalString(contract.sourceStrategy)
      ? { sourceStrategy: normalizeOptionalString(contract.sourceStrategy) }
      : {}),
    ...(normalizeOptionalString(contract.targetStrategy)
      ? { targetStrategy: normalizeOptionalString(contract.targetStrategy) }
      : {}),
    ...(normalizeOptionalString(contract.deliveryLevel)
      ? {
          deliveryLevel: normalizeOptionalString(
            contract.deliveryLevel,
          ) as ProjectPhaseExecutionPlanContract['deliveryLevel'],
        }
      : {}),
    ...(normalizeOptionalString(contract.projectRoot)
      ? { projectRoot: normalizeOptionalString(contract.projectRoot) }
      : {}),
    ...(normalizeOptionalString(contract.goal)
      ? { goal: normalizeOptionalString(contract.goal) }
      : {}),
    ...(normalizeOptionalString(contract.reason)
      ? { reason: normalizeOptionalString(contract.reason) }
      : {}),
    ...(typeof contract.executableNow === 'boolean'
      ? { executableNow: contract.executableNow }
      : {}),
    ...(typeof contract.approvalRequired === 'boolean'
      ? { approvalRequired: contract.approvalRequired }
      : {}),
    ...(normalizeOptionalString(contract.riskLevel)
      ? {
          riskLevel: normalizeOptionalString(
            contract.riskLevel,
          ) as ProjectPhaseExecutionPlanContract['riskLevel'],
        }
      : {}),
    ...(normalizeOptionalStringArray(contract.targetFiles).length > 0
      ? { targetFiles: normalizeOptionalStringArray(contract.targetFiles) }
      : {}),
    ...(normalizeOptionalStringArray(contract.allowedTargetPaths).length > 0
      ? { allowedTargetPaths: normalizeOptionalStringArray(contract.allowedTargetPaths) }
      : {}),
    ...(normalizedOperationsPreview.length > 0
      ? { operationsPreview: normalizedOperationsPreview }
      : {}),
    ...(normalizeValidationPlanContract(contract.validationPlan)
      ? { validationPlan: normalizeValidationPlanContract(contract.validationPlan) }
      : {}),
    ...(normalizeOptionalStringArray(contract.explicitExclusions).length > 0
      ? { explicitExclusions: normalizeOptionalStringArray(contract.explicitExclusions) }
      : {}),
    ...(normalizeOptionalStringArray(contract.successCriteria).length > 0
      ? { successCriteria: normalizeOptionalStringArray(contract.successCriteria) }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeLocalProjectManifestContract = (
  value: unknown,
): LocalProjectManifestContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as LocalProjectManifestContract
  const normalizedPhases = Array.isArray(contract.phases)
    ? contract.phases
        .map((entry) =>
          entry && typeof entry === 'object'
            ? {
                ...(normalizeOptionalString(entry.id)
                  ? { id: normalizeOptionalString(entry.id) }
                  : {}),
                ...(normalizeOptionalString(entry.status)
                  ? { status: normalizeOptionalString(entry.status) }
                  : {}),
                ...(normalizeOptionalString(entry.createdAt)
                  ? { createdAt: normalizeOptionalString(entry.createdAt) }
                  : {}),
                ...(normalizeOptionalStringArray(entry.files).length > 0
                  ? { files: normalizeOptionalStringArray(entry.files) }
                  : {}),
              }
            : null,
        )
        .filter(
          (entry): entry is LocalProjectManifestPhaseContract =>
            Boolean(entry) && Object.keys(entry).length > 0,
        )
    : []
  const normalizedModules = Array.isArray(contract.modules)
    ? contract.modules
        .map((entry) =>
          entry && typeof entry === 'object'
            ? {
                ...(normalizeOptionalString(entry.id)
                  ? { id: normalizeOptionalString(entry.id) }
                  : {}),
                ...(normalizeOptionalString(entry.name)
                  ? { name: normalizeOptionalString(entry.name) }
                  : {}),
                ...(normalizeOptionalString(entry.status)
                  ? { status: normalizeOptionalString(entry.status) }
                  : {}),
                ...(normalizeOptionalString(entry.addedAt)
                  ? { addedAt: normalizeOptionalString(entry.addedAt) }
                  : {}),
                ...(normalizeOptionalStringArray(entry.layers).length > 0
                  ? { layers: normalizeOptionalStringArray(entry.layers) }
                  : {}),
                ...(normalizeOptionalStringArray(entry.files).length > 0
                  ? { files: normalizeOptionalStringArray(entry.files) }
                  : {}),
              }
            : null,
        )
        .filter(
          (entry): entry is LocalProjectManifestModuleContract =>
            Boolean(entry) && Object.keys(entry).length > 0,
        )
    : []
  const normalizedHistory = Array.isArray(contract.history)
    ? contract.history
        .map((entry) =>
          entry && typeof entry === 'object'
            ? {
                ...(normalizeOptionalString(entry.kind)
                  ? { kind: normalizeOptionalString(entry.kind) }
                  : {}),
                ...(normalizeOptionalString(entry.id)
                  ? { id: normalizeOptionalString(entry.id) }
                  : {}),
                ...(normalizeOptionalString(entry.status)
                  ? { status: normalizeOptionalString(entry.status) }
                  : {}),
                ...(normalizeOptionalString(entry.at)
                  ? { at: normalizeOptionalString(entry.at) }
                  : {}),
                ...(normalizeOptionalString(entry.note)
                  ? { note: normalizeOptionalString(entry.note) }
                  : {}),
              }
            : null,
        )
        .filter(
          (entry): entry is LocalProjectManifestHistoryContract =>
            Boolean(entry) && Object.keys(entry).length > 0,
        )
    : []

  const normalizedValue: LocalProjectManifestContract = {
    ...(typeof contract.version === 'number' && Number.isFinite(contract.version)
      ? { version: contract.version }
      : {}),
    ...(normalizeOptionalString(contract.projectType)
      ? { projectType: normalizeOptionalString(contract.projectType) }
      : {}),
    ...(normalizeOptionalString(contract.domain)
      ? { domain: normalizeOptionalString(contract.domain) }
      : {}),
    ...(normalizeOptionalString(contract.deliveryLevel)
      ? {
          deliveryLevel: normalizeOptionalString(
            contract.deliveryLevel,
          ) as LocalProjectManifestContract['deliveryLevel'],
        }
      : {}),
    ...(normalizeOptionalString(contract.createdBy)
      ? { createdBy: normalizeOptionalString(contract.createdBy) }
      : {}),
    ...(normalizeOptionalString(contract.materializationLayer)
      ? { materializationLayer: normalizeOptionalString(contract.materializationLayer) }
      : {}),
    ...(normalizedPhases.length > 0 ? { phases: normalizedPhases } : {}),
    ...(normalizedModules.length > 0 ? { modules: normalizedModules } : {}),
    ...(normalizeOptionalStringArray(contract.forbiddenPaths).length > 0
      ? { forbiddenPaths: normalizeOptionalStringArray(contract.forbiddenPaths) }
      : {}),
    ...(normalizeOptionalString(contract.nextRecommendedPhase)
      ? { nextRecommendedPhase: normalizeOptionalString(contract.nextRecommendedPhase) }
      : {}),
    ...(normalizeOptionalString(contract.nextRecommendedAction)
      ? { nextRecommendedAction: normalizeOptionalString(contract.nextRecommendedAction) }
      : {}),
    ...(normalizeOptionalString(contract.lastCompletedPhase)
      ? { lastCompletedPhase: normalizeOptionalString(contract.lastCompletedPhase) }
      : {}),
    ...(normalizeOptionalStringArray(contract.availableActions).length > 0
      ? { availableActions: normalizeOptionalStringArray(contract.availableActions) }
      : {}),
    ...(normalizeOptionalStringArray(contract.blockedActions).length > 0
      ? { blockedActions: normalizeOptionalStringArray(contract.blockedActions) }
      : {}),
    ...(normalizeOptionalStringArray(contract.approvalRequiredActions).length > 0
      ? {
          approvalRequiredActions: normalizeOptionalStringArray(
            contract.approvalRequiredActions,
          ),
        }
      : {}),
    ...(normalizeOptionalStringArray(contract.risks).length > 0
      ? { risks: normalizeOptionalStringArray(contract.risks) }
      : {}),
    ...(normalizeOptionalString(contract.updatedAt)
      ? { updatedAt: normalizeOptionalString(contract.updatedAt) }
      : {}),
    ...(normalizedHistory.length > 0 ? { history: normalizedHistory } : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const normalizeDomainUnderstandingContract = (
  value: unknown,
): DomainUnderstandingContract | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const contract = value as DomainUnderstandingContract
  const normalizedValue: DomainUnderstandingContract = {
    ...(normalizeOptionalString(contract.domainLabel)
      ? { domainLabel: normalizeOptionalString(contract.domainLabel) }
      : {}),
    ...(normalizeOptionalString(contract.intentLabel)
      ? { intentLabel: normalizeOptionalString(contract.intentLabel) }
      : {}),
    ...(normalizeOptionalString(contract.productKind)
      ? { productKind: normalizeOptionalString(contract.productKind) }
      : {}),
    ...(normalizeOptionalStringArray(contract.primaryModules).length > 0
      ? { primaryModules: normalizeOptionalStringArray(contract.primaryModules) }
      : {}),
    ...(normalizeOptionalStringArray(contract.primaryEntities).length > 0
      ? { primaryEntities: normalizeOptionalStringArray(contract.primaryEntities) }
      : {}),
    ...(normalizeOptionalStringArray(contract.secondaryEntities).length > 0
      ? {
          secondaryEntities: normalizeOptionalStringArray(
            contract.secondaryEntities,
          ),
        }
      : {}),
    ...(normalizeOptionalStringArray(contract.roles).length > 0
      ? { roles: normalizeOptionalStringArray(contract.roles) }
      : {}),
    ...(normalizeOptionalStringArray(contract.coreFlows).length > 0
      ? { coreFlows: normalizeOptionalStringArray(contract.coreFlows) }
      : {}),
    ...(normalizeOptionalStringArray(contract.stateModel).length > 0
      ? { stateModel: normalizeOptionalStringArray(contract.stateModel) }
      : {}),
    ...(normalizeOptionalStringArray(contract.localActions).length > 0
      ? { localActions: normalizeOptionalStringArray(contract.localActions) }
      : {}),
    ...(normalizeOptionalStringArray(contract.riskThemes).length > 0
      ? { riskThemes: normalizeOptionalStringArray(contract.riskThemes) }
      : {}),
    ...(normalizeOptionalStringArray(contract.approvalThemes).length > 0
      ? { approvalThemes: normalizeOptionalStringArray(contract.approvalThemes) }
      : {}),
    ...(normalizeOptionalStringArray(contract.explicitExclusions).length > 0
      ? {
          explicitExclusions: normalizeOptionalStringArray(
            contract.explicitExclusions,
          ),
        }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const extractPlannerExecutionMetadata = (payload?: {
  decisionKey?: string
  businessSector?: string
  businessSectorLabel?: string
  creativeDirection?: WebCreativeDirectionContract
  reusableArtifactLookup?: PlannerDecisionResponse['reusableArtifactLookup']
  reusableArtifactsFound?: number
  reuseDecision?: boolean
  reuseReason?: string
  reusedArtifactIds?: string[]
  reuseMode?: string
  executionScope?: ExecutorExecutionScope
  strategy?: string
  executionMode?: string
  reason?: string
  nextExpectedAction?: string
  contextHubStatus?: ContextHubStatusSummary | null
  productArchitecture?: ProductArchitectureContract | null
  safeFirstDeliveryPlan?: SafeFirstDeliveryPlanContract | null
  safeFirstDeliveryMaterialization?: SafeFirstDeliveryMaterializationContract | null
  domainUnderstanding?: DomainUnderstandingContract | null
  scalableDeliveryPlan?: ScalableDeliveryPlanContract | null
  projectBlueprint?: ProjectBlueprintContract | null
  questionPolicy?: QuestionPolicyContract | null
  implementationRoadmap?: ImplementationRoadmapContract | null
  nextActionPlan?: NextActionPlanContract | null
  validationPlan?: ValidationPlanContract | null
  phaseExpansionPlan?: PhaseExpansionPlanContract | null
  projectPhaseExecutionPlan?: ProjectPhaseExecutionPlanContract | null
  localProjectManifest?: LocalProjectManifestContract | null
  expansionOptions?: ExpansionOptionsContract | null
  moduleExpansionPlan?: ModuleExpansionPlanContract | null
  continuationActionPlan?: ContinuationActionContract | null
  projectContinuationState?: ProjectContinuationStateContract | null
  materializationPlan?: MaterializationPlanContract | null
  tasks?: unknown[]
  assumptions?: string[]
} | null): PlannerExecutionMetadata => ({
  decisionKey:
    typeof payload?.decisionKey === 'string' ? payload.decisionKey.trim() : '',
  businessSector:
    typeof payload?.businessSector === 'string' ? payload.businessSector.trim() : '',
  businessSectorLabel:
    typeof payload?.businessSectorLabel === 'string'
      ? payload.businessSectorLabel.trim()
      : '',
  creativeDirection:
    payload?.creativeDirection && typeof payload.creativeDirection === 'object'
      ? payload.creativeDirection
      : null,
  reusableArtifactLookup:
    payload?.reusableArtifactLookup &&
    typeof payload.reusableArtifactLookup === 'object'
      ? {
          executed: payload.reusableArtifactLookup.executed === true,
          foundCount:
            Number.isInteger(payload.reusableArtifactLookup.foundCount) &&
            payload.reusableArtifactLookup.foundCount >= 0
              ? payload.reusableArtifactLookup.foundCount
              : Array.isArray(payload.reusableArtifactLookup.matches)
                ? payload.reusableArtifactLookup.matches.length
                : 0,
          matches: Array.isArray(payload.reusableArtifactLookup.matches)
            ? payload.reusableArtifactLookup.matches
                .map((match) => ({
                  id: typeof match?.id === 'string' ? match.id.trim() : '',
                  type: typeof match?.type === 'string' ? match.type.trim() : '',
                  sector:
                    typeof match?.sector === 'string' ? match.sector.trim() : '',
                  visualStyle:
                    typeof match?.visualStyle === 'string'
                      ? match.visualStyle.trim()
                      : '',
                  layoutVariant:
                    typeof match?.layoutVariant === 'string'
                      ? match.layoutVariant.trim()
                      : '',
                  heroStyle:
                    typeof match?.heroStyle === 'string'
                      ? match.heroStyle.trim()
                      : '',
                  localPath:
                    typeof match?.localPath === 'string'
                      ? match.localPath.trim()
                      : '',
                  primaryCta:
                    typeof match?.primaryCta === 'string'
                      ? match.primaryCta.trim()
                      : '',
                  secondaryCta:
                    typeof match?.secondaryCta === 'string'
                      ? match.secondaryCta.trim()
                      : '',
                  typography:
                    match?.typography && typeof match.typography === 'object'
                      ? {
                          ...(typeof match.typography.headingFamily === 'string'
                            ? { headingFamily: match.typography.headingFamily.trim() }
                            : {}),
                          ...(typeof match.typography.bodyFamily === 'string'
                            ? { bodyFamily: match.typography.bodyFamily.trim() }
                            : {}),
                          ...(typeof match.typography.fontHref === 'string'
                            ? { fontHref: match.typography.fontHref.trim() }
                            : {}),
                        }
                      : undefined,
                  colors:
                    match?.colors && typeof match.colors === 'object'
                      ? Object.fromEntries(
                          Object.entries(match.colors).filter(
                            ([, value]) =>
                              typeof value === 'string' && value.trim(),
                          ),
                        )
                      : undefined,
                  metadata:
                    match?.metadata && typeof match.metadata === 'object'
                      ? match.metadata
                      : undefined,
                  matchReasons: Array.isArray(match?.matchReasons)
                    ? match.matchReasons
                        .filter((reason) => typeof reason === 'string' && reason.trim())
                        .map((reason) => reason.trim())
                    : [],
                }))
                .filter((match) => Boolean(match.id))
            : [],
        }
      : null,
  reusableArtifactsFound:
    Number.isInteger(payload?.reusableArtifactsFound) &&
    payload.reusableArtifactsFound >= 0
      ? payload.reusableArtifactsFound
      : 0,
  reuseDecision: payload?.reuseDecision === true,
  reuseReason:
    typeof payload?.reuseReason === 'string' ? payload.reuseReason.trim() : '',
  reusedArtifactIds: Array.isArray(payload?.reusedArtifactIds)
    ? payload.reusedArtifactIds
        .filter((artifactId) => typeof artifactId === 'string' && artifactId.trim())
        .map((artifactId) => artifactId.trim())
    : [],
  reuseMode: typeof payload?.reuseMode === 'string' ? payload.reuseMode.trim() : 'none',
  contextHubStatus:
    payload?.contextHubStatus && typeof payload.contextHubStatus === 'object'
      ? {
          source: 'context-hub',
          endpoint:
            typeof payload.contextHubStatus.endpoint === 'string'
              ? payload.contextHubStatus.endpoint.trim()
              : '/v1/packs/suggested',
          available: payload.contextHubStatus.available === true,
          ...(typeof payload.contextHubStatus.id === 'string' &&
          payload.contextHubStatus.id.trim()
            ? { id: payload.contextHubStatus.id.trim() }
            : {}),
          ...(typeof payload.contextHubStatus.slug === 'string' &&
          payload.contextHubStatus.slug.trim()
            ? { slug: payload.contextHubStatus.slug.trim() }
            : {}),
          ...(typeof payload.contextHubStatus.title === 'string' &&
          payload.contextHubStatus.title.trim()
            ? { title: payload.contextHubStatus.title.trim() }
            : {}),
          ...(Number.isInteger(payload.contextHubStatus.itemsCount) &&
          payload.contextHubStatus.itemsCount >= 0
            ? { itemsCount: payload.contextHubStatus.itemsCount }
            : {}),
          ...(Number.isFinite(payload.contextHubStatus.estimatedTokens) &&
          payload.contextHubStatus.estimatedTokens >= 0
            ? { estimatedTokens: payload.contextHubStatus.estimatedTokens }
            : {}),
          ...(typeof payload.contextHubStatus.reason === 'string' &&
          payload.contextHubStatus.reason.trim()
            ? { reason: payload.contextHubStatus.reason.trim() }
            : {}),
        }
      : null,
  executionScope:
    payload?.executionScope && typeof payload.executionScope === 'object'
      ? payload.executionScope
      : null,
  strategy: typeof payload?.strategy === 'string' ? payload.strategy.trim() : '',
  executionMode:
    typeof payload?.executionMode === 'string' ? payload.executionMode.trim() : '',
  reason: typeof payload?.reason === 'string' ? payload.reason.trim() : '',
  nextExpectedAction:
    typeof payload?.nextExpectedAction === 'string'
      ? payload.nextExpectedAction.trim()
      : '',
  productArchitecture: normalizeProductArchitectureContract(
    payload?.productArchitecture,
  ),
  safeFirstDeliveryPlan: normalizeSafeFirstDeliveryPlanContract(
    payload?.safeFirstDeliveryPlan,
  ),
  safeFirstDeliveryMaterialization:
    normalizeSafeFirstDeliveryMaterializationContract(
      payload?.safeFirstDeliveryMaterialization,
    ),
  domainUnderstanding: normalizeDomainUnderstandingContract(
    payload?.domainUnderstanding,
  ),
  scalableDeliveryPlan: normalizeScalableDeliveryPlanContract(
    payload?.scalableDeliveryPlan,
  ),
  projectBlueprint: normalizeProjectBlueprintContract(payload?.projectBlueprint),
  questionPolicy: normalizeQuestionPolicyContract(payload?.questionPolicy),
  implementationRoadmap: normalizeImplementationRoadmapContract(
    payload?.implementationRoadmap,
  ),
  nextActionPlan: normalizeNextActionPlanContract(payload?.nextActionPlan),
  validationPlan: normalizeValidationPlanContract(payload?.validationPlan),
  phaseExpansionPlan: normalizePhaseExpansionPlanContract(
    payload?.phaseExpansionPlan,
  ),
  projectPhaseExecutionPlan: normalizeProjectPhaseExecutionPlanContract(
    payload?.projectPhaseExecutionPlan,
  ),
  localProjectManifest: normalizeLocalProjectManifestContract(
    payload?.localProjectManifest,
  ),
  expansionOptions: normalizeExpansionOptionsContract(payload?.expansionOptions),
  moduleExpansionPlan: normalizeModuleExpansionPlanContract(payload?.moduleExpansionPlan),
  continuationActionPlan: normalizeContinuationActionContract(
    payload?.continuationActionPlan,
  ),
  projectContinuationState: normalizeProjectContinuationStateContract(
    payload?.projectContinuationState,
  ),
  materializationPlan:
    payload?.materializationPlan && typeof payload.materializationPlan === 'object'
      ? payload.materializationPlan
      : null,
  tasks: Array.isArray(payload?.tasks)
    ? payload.tasks
        .map((task) =>
          task && typeof task === 'object'
            ? {
                ...(typeof (task as { step?: unknown }).step === 'number'
                  ? { step: (task as { step: number }).step }
                  : {}),
                ...(typeof (task as { title?: unknown }).title === 'string'
                  ? { title: (task as { title: string }).title.trim() }
                  : {}),
                ...(typeof (task as { operation?: unknown }).operation === 'string'
                  ? { operation: (task as { operation: string }).operation.trim() }
                  : {}),
                ...(typeof (task as { targetPath?: unknown }).targetPath === 'string'
                  ? { targetPath: (task as { targetPath: string }).targetPath.trim() }
                  : {}),
              }
            : null,
        )
        .filter(Boolean)
    : [],
  assumptions: Array.isArray(payload?.assumptions)
    ? payload.assumptions
        .filter((assumption) => typeof assumption === 'string' && assumption.trim())
        .map((assumption) => assumption.trim())
    : [],
})

const normalizeReusableArtifactRecord = (
  artifact?: Partial<ReusableArtifactRecord> | null,
): ReusableArtifactRecord | null => {
  if (!artifact || typeof artifact !== 'object') {
    return null
  }

  const artifactId = typeof artifact.id === 'string' ? artifact.id.trim() : ''
  if (!artifactId) {
    return null
  }

  return {
    id: artifactId,
    type: typeof artifact.type === 'string' ? artifact.type.trim() : '',
    sector: typeof artifact.sector === 'string' ? artifact.sector.trim() : '',
    sectorLabel:
      typeof artifact.sectorLabel === 'string' ? artifact.sectorLabel.trim() : '',
    visualStyle:
      typeof artifact.visualStyle === 'string' ? artifact.visualStyle.trim() : '',
    layoutVariant:
      typeof artifact.layoutVariant === 'string'
        ? artifact.layoutVariant.trim()
        : '',
    heroStyle:
      typeof artifact.heroStyle === 'string' ? artifact.heroStyle.trim() : '',
    localPath:
      typeof artifact.localPath === 'string' ? artifact.localPath.trim() : '',
    primaryCta:
      typeof artifact.primaryCta === 'string' ? artifact.primaryCta.trim() : '',
    secondaryCta:
      typeof artifact.secondaryCta === 'string'
        ? artifact.secondaryCta.trim()
        : '',
    typography:
      artifact.typography && typeof artifact.typography === 'object'
        ? {
            ...(typeof artifact.typography.headingFamily === 'string'
              ? { headingFamily: artifact.typography.headingFamily.trim() }
              : {}),
            ...(typeof artifact.typography.bodyFamily === 'string'
              ? { bodyFamily: artifact.typography.bodyFamily.trim() }
              : {}),
            ...(typeof artifact.typography.fontHref === 'string'
              ? { fontHref: artifact.typography.fontHref.trim() }
              : {}),
          }
        : undefined,
    colors:
      artifact.colors && typeof artifact.colors === 'object'
        ? Object.fromEntries(
            Object.entries(artifact.colors).filter(
              ([, value]) => typeof value === 'string' && value.trim(),
            ),
          )
        : undefined,
    preview: normalizeReusableArtifactStoredPreview(
      artifact.preview as ReusableArtifactStoredPreview | undefined,
    ),
    metadata:
      artifact.metadata && typeof artifact.metadata === 'object'
        ? artifact.metadata
        : undefined,
    tags: Array.isArray(artifact.tags)
      ? artifact.tags
          .filter((tag) => typeof tag === 'string' && tag.trim())
          .map((tag) => tag.trim())
      : [],
    createdAt:
      typeof artifact.createdAt === 'string' ? artifact.createdAt.trim() : '',
    updatedAt:
      typeof artifact.updatedAt === 'string' ? artifact.updatedAt.trim() : '',
    matchReasons: Array.isArray(artifact.matchReasons)
      ? artifact.matchReasons
          .filter((reason) => typeof reason === 'string' && reason.trim())
          .map((reason) => reason.trim())
      : [],
  }
}

const getManualReuseModeLabel = (mode: ManualReuseMode) => {
  if (mode === 'reuse-style-and-structure') {
    return 'Reutilizar estilo y estructura'
  }

  if (mode === 'reuse-style') {
    return 'Reutilizar estilo'
  }

  if (mode === 'reuse-structure') {
    return 'Reutilizar estructura'
  }

  if (mode === 'inspiration-only') {
    return 'Usar solo inspiración'
  }

  if (mode === 'none') {
    return 'No reutilizar'
  }

  return 'Búsqueda automática'
}

const getVisualStyleLabel = (value?: string) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return ''
  }

  const labels: Record<string, string> = {
    'clarity-first': 'Claridad primero',
    'street-editorial': 'Editorial urbano',
    'institutional-ledger': 'Institucional metódico',
    'gastronomic-storytelling': 'Narrativa gastronómica',
    'architectural-premium': 'Premium arquitectónico',
    'performance-burst': 'Rendimiento intenso',
  }

  return labels[normalizedValue] || normalizeOptionalString(value).replace(/-/g, ' ')
}

const getLayoutVariantLabel = (value?: string) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return ''
  }

  const labels: Record<string, string> = {
    'structured-trust': 'Confianza estructurada',
    'lookbook-flow': 'Flujo lookbook',
    'evidence-ledger': 'Método probatorio',
    'immersive-pulse': 'Pulso inmersivo',
    'editorial-gallery': 'Galería editorial',
    'editorial-mosaic': 'Mosaico editorial',
  }

  return labels[normalizedValue] || normalizeOptionalString(value).replace(/-/g, ' ')
}

const getHeroStyleLabel = (value?: string) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return ''
  }

  const labels: Record<string, string> = {
    'info-first': 'Información primero',
    'lookbook-stack': 'Lookbook apilado',
    'authority-columns': 'Columnas de autoridad',
    'story-poster': 'Póster narrativo',
    'statement-split': 'Declaración dividida',
    'performance-mosaic': 'Mosaico de rendimiento',
  }

  return labels[normalizedValue] || normalizeOptionalString(value).replace(/-/g, ' ')
}

const sanitizePreviewText = (value?: string) =>
  typeof value === 'string' ? value.replace(/['"]/g, '').trim() : ''

const getPreviewFontFamily = (value?: string, fallback = 'sans-serif') =>
  sanitizePreviewText(value) || fallback

type ReusableArtifactPreviewModel = {
  background: string
  surface: string
  text: string
  muted: string
  accent: string
  accentStrong: string
  headingFont: string
  bodyFont: string
  heroLabel: string
  layoutLabel: string
  previewHeading: string
  previewBody: string
  previewCta: string
}

type ReusableArtifactStoredPreview = {
  status?: string
  imagePath?: string
  generatedAt?: string
  source?: string
  errorMessage?: string
}

// La preview sintetiza una lectura visual rapida usando la metadata reusable
// ya guardada. Asi evitamos depender solo de texto sin abrir una galeria pesada.
const buildReusableArtifactPreviewModel = (
  artifact: ReusableArtifactRecord,
): ReusableArtifactPreviewModel => {
  const colors = artifact.colors || {}
  const background =
    colors.gradientStart && colors.gradientEnd
      ? `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`
      : colors.panel || 'linear-gradient(135deg, #0f172a, #111827)'

  return {
    background,
    surface: colors.panel || 'rgba(15, 23, 42, 0.72)',
    text: colors.text || '#f8fafc',
    muted: colors.muted || 'rgba(226, 232, 240, 0.75)',
    accent: colors.accent || '#38bdf8',
    accentStrong: colors.accentStrong || colors.highlight || colors.accent || '#0ea5e9',
    headingFont: getPreviewFontFamily(artifact.typography?.headingFamily, 'serif'),
    bodyFont: getPreviewFontFamily(artifact.typography?.bodyFamily, 'sans-serif'),
    heroLabel: getHeroStyleLabel(artifact.heroStyle) || 'apertura flexible',
    layoutLabel: getLayoutVariantLabel(artifact.layoutVariant) || 'estructura adaptable',
    previewHeading:
      artifact.sectorLabel ||
      artifact.sector ||
      getVisualStyleLabel(artifact.visualStyle) ||
      'Vista reutilizable',
    previewBody:
      artifact.visualStyle ||
      artifact.layoutVariant ||
      artifact.heroStyle ||
      'Sin direccion visual registrada',
    previewCta: artifact.primaryCta || artifact.secondaryCta || 'Ver propuesta',
  }
}

const normalizeReusableArtifactStoredPreview = (
  preview?: ReusableArtifactStoredPreview | null,
): ReusableArtifactStoredPreview | undefined => {
  if (!preview || typeof preview !== 'object') {
    return undefined
  }

  const normalizedPreview = {
    ...(typeof preview.status === 'string' && preview.status.trim()
      ? { status: preview.status.trim() }
      : {}),
    ...(typeof preview.imagePath === 'string' && preview.imagePath.trim()
      ? { imagePath: preview.imagePath.trim() }
      : {}),
    ...(typeof preview.generatedAt === 'string' && preview.generatedAt.trim()
      ? { generatedAt: preview.generatedAt.trim() }
      : {}),
    ...(typeof preview.source === 'string' && preview.source.trim()
      ? { source: preview.source.trim() }
      : {}),
    ...(typeof preview.errorMessage === 'string' && preview.errorMessage.trim()
      ? { errorMessage: preview.errorMessage.trim() }
      : {}),
  }

  return Object.keys(normalizedPreview).length > 0 ? normalizedPreview : undefined
}

const buildLocalFileUrl = (targetPath?: string) => {
  if (typeof targetPath !== 'string' || !targetPath.trim()) {
    return ''
  }

  const normalizedPath = targetPath.trim()
  if (/^file:/i.test(normalizedPath)) {
    return normalizedPath
  }

  return `file:///${normalizedPath.replace(/\\/g, '/').replace(/^\/+/, '')}`
}

const buildManualReusablePreferencePayload = ({
  mode,
  selectedArtifact,
}: {
  mode: ManualReuseMode
  selectedArtifact: ReusableArtifactRecord | null
}): ManualReusablePreference | null => {
  if (mode === 'auto') {
    return null
  }

  if (mode === 'none') {
    return {
      reuseMode: 'none',
      source: 'ui-manual',
    }
  }

  if (!selectedArtifact?.id) {
    return null
  }

  return {
    artifactId: selectedArtifact.id,
    reuseMode: mode,
    source: 'ui-manual',
  }
}

const buildManualReusableLookupMatch = (
  selectedArtifact: ReusableArtifactRecord,
): ReusableArtifactLookupMatch => ({
  id: selectedArtifact.id,
  type: selectedArtifact.type,
  sector: selectedArtifact.sector,
  visualStyle: selectedArtifact.visualStyle,
  layoutVariant: selectedArtifact.layoutVariant,
  heroStyle: selectedArtifact.heroStyle,
  localPath: selectedArtifact.localPath,
  primaryCta: selectedArtifact.primaryCta,
  secondaryCta: selectedArtifact.secondaryCta,
  typography: selectedArtifact.typography,
  colors: selectedArtifact.colors,
  preview: selectedArtifact.preview,
  metadata: selectedArtifact.metadata,
  matchReasons: Array.from(
    new Set(['manual-selection', ...(selectedArtifact.matchReasons || [])]),
  ),
})

const applyManualReusablePreferenceToPlannerExecutionMetadata = ({
  metadata,
  mode,
  selectedArtifact,
}: {
  metadata: PlannerExecutionMetadata
  mode: ManualReuseMode
  selectedArtifact: ReusableArtifactRecord | null
}): PlannerExecutionMetadata => {
  if (mode === 'auto') {
    return metadata
  }

  if (mode === 'none') {
    return {
      ...metadata,
      reuseDecision: false,
      reuseMode: 'none',
      reusedArtifactIds: [],
      reuseReason:
        metadata.reuseReason ||
        'El operador desactivó manualmente la reutilización para esta corrida.',
    }
  }

  if (!selectedArtifact?.id) {
    return metadata
  }

  const manualMatch = buildManualReusableLookupMatch(selectedArtifact)
  const currentMatches = metadata.reusableArtifactLookup?.matches || []
  const mergedMatches = [
    manualMatch,
    ...currentMatches.filter((match) => match.id !== manualMatch.id),
  ]
  const nextLookup: ReusableArtifactLookupContract = {
    executed: true,
    foundCount: Math.max(
      metadata.reusableArtifactLookup?.foundCount || 0,
      metadata.reusableArtifactsFound,
      mergedMatches.length,
      1,
    ),
    matches: mergedMatches,
  }
  const reusedArtifactIds = [
    selectedArtifact.id,
    ...metadata.reusedArtifactIds.filter(
      (artifactId) => artifactId !== selectedArtifact.id,
    ),
  ]
  const hasMatchingPlannerDecision =
    metadata.reuseDecision === true &&
    metadata.reuseMode === mode &&
    metadata.reusedArtifactIds.includes(selectedArtifact.id)

  return {
    ...metadata,
    reusableArtifactLookup: nextLookup,
    reusableArtifactsFound: Math.max(
      metadata.reusableArtifactsFound,
      nextLookup.foundCount,
      1,
    ),
    reuseDecision: true,
    reuseMode: mode,
    reusedArtifactIds,
    reuseReason: hasMatchingPlannerDecision
      ? metadata.reuseReason
      : `El operador seleccionó manualmente el artefacto ${selectedArtifact.id} en modo ${mode}; esa preferencia tiene prioridad para esta corrida.`,
  }
}

type AppSectionKey =
  | 'inicio'
  | 'objetivo'
  | 'planificacion'
  | 'ejecucion'
  | 'aprobaciones'
  | 'memoria'
  | 'corridas'
  | 'consola'

type ExperienceMode = 'guided' | 'advanced'

type WizardStepKey =
  | 'goal'
  | 'context'
  | 'brain'
  | 'memory'
  | 'plan'
  | 'execution'
  | 'result'

const APP_NAV_SECTIONS: Array<{
  key: AppSectionKey
  label: string
  description: string
}> = [
  {
    key: 'inicio',
    label: 'Inicio',
    description: 'Estado general, resumen del flujo y acciones rapidas.',
  },
  {
    key: 'objetivo',
    label: 'Objetivo y contexto',
    description: 'Objetivo actual, contexto, participacion y criterio del Cerebro.',
  },
  {
    key: 'planificacion',
    label: 'Planificacion',
    description: 'Ruta planificada, decisionKey, motivo y siguiente accion.',
  },
  {
    key: 'ejecucion',
    label: 'Ejecucion',
    description: 'Estado del ejecutor, resultado y accion manual.',
  },
  {
    key: 'aprobaciones',
    label: 'Aprobaciones',
    description: 'Pendientes, ultima respuesta humana e historial corto.',
  },
  {
    key: 'memoria',
    label: 'Memoria reutilizable',
    description: 'Catalogo, filtros, seleccion manual y modo reusable.',
  },
  {
    key: 'corridas',
    label: 'Corridas',
    description: 'Resumen E2E, historial, archivos tocados y estado final.',
  },
  {
    key: 'consola',
    label: 'Consola tecnica',
    description: 'Timeline, eventos, conversacion interna y logs tecnicos.',
  },
]

const GUIDED_WIZARD_STEPS: Array<{
  key: WizardStepKey
  label: string
  description: string
}> = [
  {
    key: 'goal',
    label: 'Objetivo',
    description: 'Definí qué querés lograr.',
  },
  {
    key: 'context',
    label: 'Contexto',
    description: 'Sumá alcance y participación.',
  },
  {
    key: 'brain',
    label: 'Criterio del Cerebro',
    description: 'Elegí costo, calidad y autonomía.',
  },
  {
    key: 'memory',
    label: 'Memoria reutilizable',
    description: 'Opcional: elegí un reusable.',
  },
  {
    key: 'plan',
    label: 'Plan',
    description: 'Revisá la ruta antes de ejecutar.',
  },
  {
    key: 'execution',
    label: 'Ejecución',
    description: 'Seguí el avance y bloqueos.',
  },
  {
    key: 'result',
    label: 'Resultado',
    description: 'Leé la salida final y próximos pasos.',
  },
]

const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

function SidebarSectionButton({
  active,
  label,
  description,
  badge,
  onClick,
}: {
  active: boolean
  label: string
  description: string
  badge?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={joinClasses(
        'w-full rounded-2xl border px-4 py-4 text-left transition',
        active
          ? 'border-sky-300/35 bg-sky-300/12 text-white shadow-[0_14px_40px_rgba(56,189,248,0.16)]'
          : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.06]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{label}</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">{description}</div>
        </div>
        {badge ? (
          <span className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
            {badge}
          </span>
        ) : null}
      </div>
    </button>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/80">
            {eyebrow}
          </div>
        ) : null}
        <div className="text-2xl font-semibold text-white">{title}</div>
        <p className="max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string
  value: string
  detail?: string
  tone?: 'default' | 'sky' | 'emerald' | 'amber' | 'rose'
}) {
  const toneClassName =
    tone === 'sky'
      ? 'border-sky-300/20 bg-sky-300/8'
      : tone === 'emerald'
        ? 'border-emerald-300/20 bg-emerald-300/8'
        : tone === 'amber'
          ? 'border-amber-300/20 bg-amber-300/8'
          : tone === 'rose'
            ? 'border-rose-300/20 bg-rose-300/8'
            : 'border-white/8 bg-white/[0.03]'

  return (
    <article className={joinClasses('rounded-2xl border px-4 py-4', toneClassName)}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-sm font-medium leading-6 text-slate-100">{value}</div>
      {detail ? (
        <div className="mt-2 text-xs leading-5 text-slate-400">{detail}</div>
      ) : null}
    </article>
  )
}

const PRODUCT_ARCHITECTURE_TYPE_LABELS: Record<string, string> = {
  'business-system': 'Sistema de negocio',
  ecommerce: 'Ecommerce',
  crm: 'CRM',
  erp: 'ERP',
  marketplace: 'Marketplace',
  saas: 'SaaS',
  'internal-tool': 'Herramienta interna',
  unknown: 'No definido',
}

const getProductArchitectureTypeLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return 'No definido'
  }

  return (
    PRODUCT_ARCHITECTURE_TYPE_LABELS[normalizedValue] ||
    normalizeOptionalString(value).replace(/-/g, ' ')
  )
}

function ProductArchitectureList({
  items,
  compact = false,
}: {
  items?: string[]
  compact?: boolean
}) {
  const normalizedItems = normalizeOptionalStringArray(items)
  const visibleItems = compact ? normalizedItems.slice(0, 4) : normalizedItems

  if (visibleItems.length === 0) {
    return (
      <div className="text-xs leading-5 text-slate-500">Sin datos definidos</div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visibleItems.map((item) => (
        <span
          key={item}
          className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs leading-5 text-slate-200"
        >
          {item}
        </span>
      ))}
      {compact && normalizedItems.length > visibleItems.length ? (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs leading-5 text-slate-400">
          +{normalizedItems.length - visibleItems.length} más
        </span>
      ) : null}
    </div>
  )
}

function ProductArchitectureDetailBlock({
  label,
  value,
}: {
  label: string
  value?: string
}) {
  const normalizedValue = normalizeOptionalString(value)

  if (!normalizedValue) {
    return null
  }

  return (
    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm leading-6 text-slate-100">{normalizedValue}</div>
    </div>
  )
}

function ProductArchitectureGroup({
  title,
  items,
  compact = false,
  tone = 'default',
}: {
  title: string
  items?: string[]
  compact?: boolean
  tone?: 'default' | 'amber' | 'rose' | 'emerald'
}) {
  const toneClassName =
    tone === 'rose'
      ? 'border-rose-300/20 bg-rose-300/8'
      : tone === 'amber'
        ? 'border-amber-300/20 bg-amber-300/8'
        : tone === 'emerald'
          ? 'border-emerald-300/20 bg-emerald-300/8'
          : 'border-white/8 bg-white/[0.03]'

  return (
    <article className={joinClasses('rounded-2xl border px-4 py-4', toneClassName)}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>
      <div className="mt-3">
        <ProductArchitectureList items={items} compact={compact} />
      </div>
    </article>
  )
}

function ProductArchitectureCard({
  architecture,
  compact = false,
  reviewOnly = false,
  onPrepareSafeFirstDelivery,
}: {
  architecture: ProductArchitectureContract
  compact?: boolean
  reviewOnly?: boolean
  onPrepareSafeFirstDelivery?: (() => void) | null
}) {
  const canPrepareSafeFirstDelivery =
    reviewOnly &&
    typeof onPrepareSafeFirstDelivery === 'function' &&
    (normalizeOptionalStringArray(architecture.safeFirstDelivery).length > 0 ||
      normalizeOptionalStringArray(architecture.phases).length > 0)
  const suggestedArchitectureEntries = [
    ['Frontend', architecture.suggestedArchitecture?.frontend],
    ['Backend', architecture.suggestedArchitecture?.backend],
    ['Database', architecture.suggestedArchitecture?.database],
    ['Auth', architecture.suggestedArchitecture?.auth],
    ['Payments', architecture.suggestedArchitecture?.payments],
    ['Storage', architecture.suggestedArchitecture?.storage],
  ].filter(([, value]) => normalizeOptionalString(value))
  const hasSuggestedArchitecture = suggestedArchitectureEntries.length > 0

  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Arquitectura del producto
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            {reviewOnly
              ? 'Este bloque resume la arquitectura propuesta por el Cerebro para revisión, no para ejecución inmediata.'
              : 'Resumen estructurado de la arquitectura propuesta por el planner.'}
          </div>
        </div>
        {reviewOnly ? (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
              Revisión manual
            </span>
            {canPrepareSafeFirstDelivery ? (
              <button
                type="button"
                onClick={onPrepareSafeFirstDelivery || undefined}
                className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-100 transition hover:bg-sky-300/15"
              >
                Preparar primera entrega segura
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Tipo de producto"
          value={getProductArchitectureTypeLabel(architecture.productType)}
          tone="sky"
        />
        <MetricCard
          label="Dominio"
          value={normalizeOptionalString(architecture.domain) || 'Sin datos definidos'}
        />
        <MetricCard
          label="Primera entrega segura"
          value={
            normalizeOptionalStringArray(architecture.safeFirstDelivery)[0] ||
            'Sin datos definidos'
          }
          tone="emerald"
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Usuarios"
          items={architecture.users}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Roles"
          items={architecture.roles}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Módulos principales"
          items={architecture.coreModules}
          compact={compact}
          tone="sky"
        />
        <ProductArchitectureGroup
          title="Entidades de datos"
          items={architecture.dataEntities}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Flujos clave"
          items={architecture.keyFlows}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Integraciones"
          items={architecture.integrations}
          compact={compact}
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Riesgos críticos"
          items={architecture.criticalRisks}
          compact={compact}
          tone="rose"
        />
        <ProductArchitectureGroup
          title="Aprobaciones necesarias"
          items={architecture.approvalRequiredFor}
          compact={compact}
          tone="amber"
        />
      </div>

      {hasSuggestedArchitecture ? (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Arquitectura sugerida
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {suggestedArchitectureEntries.map(([label, value]) => (
              <ProductArchitectureDetailBlock
                key={label}
                label={label}
                value={normalizeOptionalString(value)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Fases sugeridas"
          items={architecture.phases}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Fuera de alcance de la primera iteración"
          items={architecture.outOfScopeForFirstIteration}
          compact={compact}
        />
      </div>

      {!compact ? (
        <div className="mt-4">
          <ProductArchitectureGroup
            title="Primera entrega segura"
            items={architecture.safeFirstDelivery}
            tone="emerald"
          />
        </div>
      ) : null}
    </article>
  )
}

function SafeFirstDeliveryPlanCard({
  plan,
  compact = false,
  reviewOnly = false,
  onPrepareMaterialization,
}: {
  plan: SafeFirstDeliveryPlanContract
  compact?: boolean
  reviewOnly?: boolean
  onPrepareMaterialization?: (() => void) | null
}) {
  const canPrepareMaterialization =
    reviewOnly &&
    typeof onPrepareMaterialization === 'function' &&
    (normalizeOptionalStringArray(plan.scope).length > 0 ||
      normalizeOptionalStringArray(plan.modules).length > 0 ||
      normalizeOptionalStringArray(plan.screens).length > 0)
  const scopeSummary =
    normalizeOptionalStringArray(plan.scope)[0] || 'Sin datos definidos'
  const moduleSummary =
    normalizeOptionalStringArray(plan.modules)[0] || 'Sin datos definidos'
  const exclusionSummary =
    normalizeOptionalStringArray(plan.explicitExclusions)[0] || 'Sin datos definidos'

  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Primera entrega segura
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            Este bloque resume la primera fase segura propuesta por el Cerebro y no ejecuta cambios todavía.
          </div>
          {canPrepareMaterialization ? (
            <div className="mt-2 text-xs leading-5 text-slate-500">
              Esto genera un plan ejecutable acotado; no ejecuta cambios todavía.
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            Revisión manual
          </span>
          {canPrepareMaterialization ? (
            <button
              type="button"
              onClick={onPrepareMaterialization || undefined}
              className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/15"
            >
              Preparar materialización segura
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MetricCard label="Alcance inicial" value={scopeSummary} tone="sky" />
        <MetricCard
          label="Módulo priorizado"
          value={moduleSummary}
          tone="emerald"
        />
        <MetricCard
          label="Exclusión clave"
          value={exclusionSummary}
          tone="amber"
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Alcance"
          items={plan.scope}
          compact={compact}
          tone="sky"
        />
        <ProductArchitectureGroup
          title="Módulos"
          items={plan.modules}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Datos mock"
          items={plan.mockData}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Pantallas"
          items={plan.screens}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Comportamiento local"
          items={plan.localBehavior}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Criterios de éxito"
          items={plan.successCriteria}
          compact={compact}
          tone="emerald"
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Exclusiones explícitas"
          items={plan.explicitExclusions}
          compact={compact}
          tone="amber"
        />
        <ProductArchitectureGroup
          title="Aprobaciones más adelante"
          items={plan.approvalRequiredLater}
          compact={compact}
          tone="rose"
        />
      </div>
    </article>
  )
}

function ScalableDeliveryPlanCard({
  plan,
  compact = false,
  reviewOnly = false,
  nextExpectedAction,
  onPrepareMaterialization,
}: {
  plan: ScalableDeliveryPlanContract
  compact?: boolean
  reviewOnly?: boolean
  nextExpectedAction?: string
  onPrepareMaterialization?: (() => void) | null
}) {
  const normalizedDeliveryLevel = normalizeOptionalString(plan.deliveryLevel)
  const planReason =
    normalizeOptionalString(plan.reason) || 'Sin motivo resumido disponible.'
  const typeLabel = getScalableDeliveryPlanTypeLabel(normalizedDeliveryLevel)
  const reviewStateLabel = reviewOnly ? 'No ejecuta todavía' : 'Plan informado'
  const nextActionLabel = getNextExpectedActionLabel(nextExpectedAction)
  const canPrepareFrontendMaterialization =
    reviewOnly &&
    normalizedDeliveryLevel.toLocaleLowerCase() === 'frontend-project' &&
    typeof onPrepareMaterialization === 'function'
  const canPrepareFullstackMaterialization =
    reviewOnly &&
    normalizedDeliveryLevel.toLocaleLowerCase() === 'fullstack-local' &&
    typeof onPrepareMaterialization === 'function'
  const fileEntries = Array.isArray(plan.filesToCreate)
    ? plan.filesToCreate
        .map((entry) =>
          entry && typeof entry === 'object'
            ? {
                path: normalizeOptionalString(entry.path),
                purpose: normalizeOptionalString(entry.purpose),
                required: entry.required !== false,
              }
            : null,
        )
        .filter(
          (
            entry,
          ): entry is { path: string; purpose: string; required: boolean } =>
            Boolean(entry?.path || entry?.purpose),
        )
    : []
  const visibleFileEntries = compact ? fileEntries.slice(0, 4) : fileEntries

  return (
    <article className="rounded-3xl border border-sky-300/15 bg-sky-300/[0.06] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Plan escalable
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            Este bloque resume una entrega local más grande que la primera entrega segura y queda en revisión; no ejecuta cambios todavía.
          </div>
          <div className="mt-2 text-xs leading-5 text-slate-500">
            {getScalableDeliverySummary(plan)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            Plan revisable
          </span>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-100">
            No ejecuta todavía
          </span>
          {canPrepareFrontendMaterialization ? (
            <button
              type="button"
              onClick={onPrepareMaterialization || undefined}
              className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-100 transition hover:bg-sky-300/15"
            >
              Preparar materialización frontend
            </button>
          ) : null}
          {canPrepareFullstackMaterialization ? (
            <button
              type="button"
              onClick={onPrepareMaterialization || undefined}
              className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-100 transition hover:bg-sky-300/15"
            >
              Preparar materializacion fullstack local
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Nivel de entrega"
          value={getDeliveryLevelLabel(normalizedDeliveryLevel)}
          tone={getDeliveryLevelTone(normalizedDeliveryLevel)}
        />
        <MetricCard
          label="Tipo de plan"
          value={typeLabel}
          detail="Salida planner-only para revisar antes de materializar."
          tone="sky"
        />
        <MetricCard
          label="Estado"
          value={reviewStateLabel}
          detail="JEFE no debería ejecutar archivos grandes desde este paso."
          tone="amber"
        />
        <MetricCard
          label="Siguiente acción"
          value={nextActionLabel}
          detail={normalizeOptionalString(nextExpectedAction) || 'Sin clave declarada'}
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Estructura propuesta"
          items={plan.targetStructure}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Directorios principales"
          items={plan.directories}
          compact={compact}
          tone="sky"
        />
        <ProductArchitectureGroup
          title="Módulos principales"
          items={plan.modules}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Roots permitidos"
          items={plan.allowedRootPaths}
          compact={compact}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Razón del nivel elegido
        </div>
        <div className="mt-3 text-sm leading-6 text-slate-100">{planReason}</div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Archivos propuestos
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {visibleFileEntries.length > 0 ? (
            visibleFileEntries.map((entry) => (
              <div
                key={`${entry.path || entry.purpose}-${entry.required ? 'required' : 'optional'}`}
                className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
              >
                <div className="text-sm font-medium leading-6 text-slate-100">
                  {entry.path || 'Ruta no declarada'}
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-400">
                  {entry.purpose || 'Sin propósito declarado'}
                </div>
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {entry.required ? 'Requerido' : 'Opcional'}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300 xl:col-span-2">
              El planner no dejó archivos propuestos estructurados para este nivel.
            </div>
          )}
        </div>
        {compact && fileEntries.length > visibleFileEntries.length ? (
          <div className="mt-3 text-xs leading-5 text-slate-500">
            +{fileEntries.length - visibleFileEntries.length} archivo(s) más en la propuesta completa.
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Restricciones locales"
          items={plan.localOnlyConstraints}
          compact={compact}
          tone="amber"
        />
        <ProductArchitectureGroup
          title="Exclusiones explícitas"
          items={plan.explicitExclusions}
          compact={compact}
          tone="rose"
        />
        <ProductArchitectureGroup
          title="Aprobaciones futuras"
          items={plan.approvalRequiredLater}
          compact={compact}
          tone="amber"
        />
        <ProductArchitectureGroup
          title="Criterios de éxito"
          items={plan.successCriteria}
          compact={compact}
          tone="emerald"
        />
      </div>
    </article>
  )
}

const getRoadmapPhaseStatusLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'ready') {
    return 'Lista'
  }
  if (normalizedValue === 'blocked') {
    return 'Bloqueada'
  }
  if (normalizedValue === 'done') {
    return 'Hecha'
  }
  if (normalizedValue === 'planned') {
    return 'Planificada'
  }

  return normalizeOptionalString(value) || 'Sin estado'
}

const getRoadmapPhaseTone = (
  value: unknown,
): 'default' | 'sky' | 'emerald' | 'amber' | 'rose' => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'ready') {
    return 'emerald'
  }
  if (normalizedValue === 'blocked') {
    return 'rose'
  }
  if (normalizedValue === 'done') {
    return 'sky'
  }

  return 'amber'
}

const getNextActionTypeLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'prepare-materialization') {
    return 'Preparar materialización'
  }
  if (normalizedValue === 'execute-materialization') {
    return 'Ejecutar materialización'
  }
  if (normalizedValue === 'validate-result') {
    return 'Validar resultado'
  }
  if (normalizedValue === 'expand-next-phase') {
    return 'Expandir siguiente fase'
  }
  if (normalizedValue === 'ask-blocking-question') {
    return 'Pregunta bloqueante'
  }
  if (normalizedValue === 'request-approval') {
    return 'Pedir aprobación'
  }

  return 'Revisar plan'
}

const getValidationLevelLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'full') {
    return 'Completa'
  }
  if (normalizedValue === 'medium') {
    return 'Media'
  }

  return 'Ligera'
}

function ImplementationRoadmapCard({
  roadmap,
  compact = false,
}: {
  roadmap: ImplementationRoadmapContract
  compact?: boolean
}) {
  const phases = roadmap.phases || []
  const visiblePhases = compact ? phases.slice(0, 4) : phases
  const blockers = roadmap.blockers || []
  const nextPhaseLabel =
    phases.find((phase) => phase.id === roadmap.nextRecommendedPhase)?.title ||
    roadmap.nextRecommendedPhase ||
    'Sin siguiente fase declarada'

  return (
    <article className="rounded-3xl border border-sky-300/15 bg-sky-300/[0.05] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Roadmap de implementación
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            Ordena las fases del proyecto, qué puede avanzar ahora y qué queda bloqueado o sujeto a aprobación.
          </div>
          <div className="mt-2 text-xs leading-5 text-slate-500">
            {normalizeOptionalString(roadmap.suggestedNextAction) ||
              'Sin siguiente paso resumido.'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {getDeliveryLevelLabel(roadmap.deliveryLevel)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Proyecto"
          value={normalizeOptionalString(roadmap.projectSlug) || 'Sin slug'}
          detail={normalizeOptionalString(roadmap.domain) || 'Sin dominio declarado'}
          tone="sky"
        />
        <MetricCard
          label="Fase actual"
          value={normalizeOptionalString(roadmap.currentPhase) || 'Sin fase actual'}
          detail={normalizeOptionalString(roadmap.projectType) || 'Sin tipo declarado'}
        />
        <MetricCard
          label="Siguiente fase"
          value={nextPhaseLabel}
          detail={normalizeOptionalString(roadmap.nextRecommendedPhase) || 'Sin id'}
          tone="emerald"
        />
        <MetricCard
          label="Bloqueos"
          value={blockers.length > 0 ? `${blockers.length} activo(s)` : 'Sin bloqueos'}
          detail={blockers[0] || 'No hay preguntas sensibles pendientes'}
          tone={blockers.length > 0 ? 'rose' : 'default'}
        />
      </div>

      <div className="mt-4 grid gap-3">
        {visiblePhases.map((phase) => (
          <article
            key={phase.id || phase.title}
            className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-medium leading-6 text-slate-100">
                  {phase.title || 'Fase sin título'}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-400">
                  {phase.goal || 'Sin objetivo declarado'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={joinClasses(
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    getRoadmapPhaseTone(phase.status) === 'emerald'
                      ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
                      : getRoadmapPhaseTone(phase.status) === 'rose'
                        ? 'border-rose-300/20 bg-rose-300/10 text-rose-100'
                        : getRoadmapPhaseTone(phase.status) === 'sky'
                          ? 'border-sky-300/20 bg-sky-300/10 text-sky-100'
                          : 'border-amber-300/20 bg-amber-300/10 text-amber-100',
                  )}
                >
                  {getRoadmapPhaseStatusLabel(phase.status)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                  {phase.executableNow ? 'Ejecutable ahora' : 'Revisión'}
                </span>
                {phase.approvalRequired ? (
                  <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-xs font-medium text-rose-100">
                    Requiere aprobación
                  </span>
                ) : null}
              </div>
            </div>
            <div className="mt-3 grid gap-3 xl:grid-cols-3">
              <ProductArchitectureGroup
                title="Outputs esperados"
                items={phase.expectedOutputs}
                compact={compact}
                tone="sky"
              />
              <ProductArchitectureGroup
                title="Dependencias"
                items={phase.dependencies}
                compact={compact}
              />
              <ProductArchitectureGroup
                title="Validación"
                items={phase.validationStrategy}
                compact={compact}
                tone="emerald"
              />
            </div>
          </article>
        ))}
      </div>

      {compact && phases.length > visiblePhases.length ? (
        <div className="mt-3 text-xs leading-5 text-slate-500">
          +{phases.length - visiblePhases.length} fase(s) más en el roadmap completo.
        </div>
      ) : null}
    </article>
  )
}

function NextActionPlanCard({
  plan,
}: {
  plan: NextActionPlanContract
}) {
  const tone: 'default' | 'sky' | 'emerald' | 'amber' | 'rose' =
    plan.requiresApproval
      ? 'rose'
      : plan.safeToRunNow
        ? 'emerald'
        : plan.actionType === 'review-plan'
          ? 'sky'
          : 'amber'

  return (
    <article className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.05] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Próximo paso recomendado
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {normalizeOptionalString(plan.userFacingLabel) || 'Sin etiqueta declarada'}
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            {normalizeOptionalString(plan.recommendedAction) ||
              'Sin acción recomendada.'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {getNextActionTypeLabel(plan.actionType)}
          </span>
          <span
            className={joinClasses(
              'rounded-full border px-3 py-1 text-xs font-medium',
              tone === 'emerald'
                ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
                : tone === 'rose'
                  ? 'border-rose-300/20 bg-rose-300/10 text-rose-100'
                  : tone === 'sky'
                    ? 'border-sky-300/20 bg-sky-300/10 text-sky-100'
                    : 'border-amber-300/20 bg-amber-300/10 text-amber-100',
            )}
          >
            {plan.safeToRunNow ? 'Seguro ahora' : 'No correr todavía'}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Estrategia objetivo"
          value={normalizeOptionalString(plan.targetStrategy) || 'Sin estrategia'}
          detail={normalizeOptionalString(plan.technicalLabel) || 'Sin label técnico'}
          tone={tone}
        />
        <MetricCard
          label="Delivery level"
          value={getDeliveryLevelLabel(plan.targetDeliveryLevel)}
          detail={normalizeOptionalString(plan.currentState) || 'Sin estado'}
        />
        <MetricCard
          label="Approval"
          value={plan.requiresApproval ? 'Sí' : 'No'}
          detail={normalizeOptionalString(plan.reason) || 'Sin razón declarada'}
          tone={plan.requiresApproval ? 'rose' : 'emerald'}
        />
        <MetricCard
          label="Outcome esperado"
          value={normalizeOptionalString(plan.expectedOutcome) || 'Sin outcome'}
        />
      </div>
    </article>
  )
}

function ValidationPlanCard({
  plan,
  compact = false,
}: {
  plan: ValidationPlanContract
  compact?: boolean
}) {
  const fileChecks = plan.fileChecks || []
  const visibleFileChecks = compact ? fileChecks.slice(0, 4) : fileChecks

  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Plan de validación
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            Resume cómo validar el plan o la materialización sin instalar dependencias ni levantar servicios reales.
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
          {getValidationLevelLabel(plan.level)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Scope"
          value={normalizeOptionalString(plan.scope) || 'Sin scope'}
          tone="sky"
        />
        <MetricCard
          label="Commands"
          value={
            normalizeOptionalStringArray(plan.commands).length > 0
              ? `${normalizeOptionalStringArray(plan.commands).length} comando(s)`
              : 'Sin comandos'
          }
          detail={normalizeOptionalStringArray(plan.commands)[0] || 'No hace falta ejecutar comandos'}
        />
        <MetricCard
          label="File checks"
          value={fileChecks.length > 0 ? `${fileChecks.length} check(s)` : 'Sin file checks'}
          detail={normalizeOptionalString(visibleFileChecks[0]?.path) || 'Sin path declarado'}
        />
        <MetricCard
          label="Paths prohibidos"
          value={
            normalizeOptionalStringArray(plan.forbiddenPaths).length > 0
              ? `${normalizeOptionalStringArray(plan.forbiddenPaths).length} path(s)`
              : 'Sin paths prohibidos'
          }
          detail={normalizeOptionalStringArray(plan.forbiddenPaths)[0] || 'Sin restricciones extra'}
          tone="amber"
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            File checks
          </div>
          <div className="mt-3 grid gap-3">
            {visibleFileChecks.length > 0 ? (
              visibleFileChecks.map((entry) => (
                <div
                  key={`${entry.path || 'path'}-${entry.expectation || 'expectation'}`}
                  className="rounded-xl border border-white/8 bg-slate-900/60 px-4 py-3"
                >
                  <div className="text-sm font-medium leading-6 text-slate-100">
                    {entry.path || 'Path no declarado'}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">
                    {entry.expectation || 'Sin expectativa declarada'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm leading-6 text-slate-300">
                Este plan valida contrato y revisión manual, no filesystem real todavía.
              </div>
            )}
          </div>
          {compact && fileChecks.length > visibleFileChecks.length ? (
            <div className="mt-3 text-xs leading-5 text-slate-500">
              +{fileChecks.length - visibleFileChecks.length} file check(s) más.
            </div>
          ) : null}
        </article>
        <div className="grid gap-3">
          <ProductArchitectureGroup
            title="Checks de runtime"
            items={plan.runtimeChecks}
            compact={compact}
          />
          <ProductArchitectureGroup
            title="Checks manuales"
            items={plan.manualChecks}
            compact={compact}
            tone="sky"
          />
          <ProductArchitectureGroup
            title="Criterios de éxito"
            items={plan.successCriteria}
            compact={compact}
            tone="emerald"
          />
        </div>
      </div>
    </article>
  )
}

function PhaseExpansionPlanCard({
  plan,
  compact = false,
}: {
  plan: PhaseExpansionPlanContract
  compact?: boolean
}) {
  return (
    <article className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.05] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Expansión de siguiente fase
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            Propuesta acotada para la próxima mejora de fase; no se ejecuta automáticamente.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {normalizeOptionalString(plan.phaseId) || 'Sin phaseId'}
          </span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
            {plan.executableNow ? 'Ejecutable ahora' : 'Solo propuesta'}
          </span>
          {plan.approvalRequired ? (
            <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-xs font-medium text-rose-100">
              Requiere aprobación
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Objetivo"
          value={normalizeOptionalString(plan.goal) || 'Sin objetivo'}
          tone="emerald"
        />
        <MetricCard
          label="Siguiente acción"
          value={normalizeOptionalString(plan.nextExpectedAction) || 'Sin acción'}
        />
        <MetricCard
          label="Target files"
          value={
            normalizeOptionalStringArray(plan.targetFiles).length > 0
              ? `${normalizeOptionalStringArray(plan.targetFiles).length} archivo(s)`
              : 'Sin archivos'
          }
          detail={normalizeOptionalStringArray(plan.targetFiles)[0] || 'Sin target declarado'}
        />
        <MetricCard
          label="Riesgos"
          value={
            normalizeOptionalStringArray(plan.risks).length > 0
              ? `${normalizeOptionalStringArray(plan.risks).length} riesgo(s)`
              : 'Sin riesgos'
          }
          detail={normalizeOptionalStringArray(plan.risks)[0] || 'Sin detalle'}
          tone="amber"
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Cambios esperados"
          items={plan.changesExpected}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Target files"
          items={plan.targetFiles}
          compact={compact}
          tone="sky"
        />
      </div>
    </article>
  )
}

function getManifestPhaseStatusLabel(value?: string) {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'done') {
    return 'Hecha'
  }

  if (normalizedValue === 'available') {
    return 'Disponible'
  }

  if (normalizedValue === 'blocked') {
    return 'Bloqueada'
  }

  return normalizedValue ? normalizedValue : 'Sin estado'
}

const normalizeModuleUiId = (value: unknown) =>
  normalizeOptionalString(value)
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const getExpansionTypeLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'new-domain-module') {
    return 'Módulo nuevo'
  }
  if (normalizedValue === 'frontend-improvement') {
    return 'Mejora de frontend'
  }
  if (normalizedValue === 'backend-contract-extension') {
    return 'Contratos backend'
  }
  if (normalizedValue === 'database-extension') {
    return 'Diseño de base'
  }
  if (normalizedValue === 'validation-improvement') {
    return 'Mejora de validación'
  }
  if (normalizedValue === 'approval-required') {
    return 'Aprobación futura'
  }

  return normalizeOptionalString(value) || 'Expansión'
}

const getOperatorStrategyLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'prepare-module-expansion-plan') {
    return 'Preparar expansión'
  }
  if (normalizedValue === 'materialize-module-expansion-plan') {
    return 'Materializar módulo'
  }
  if (normalizedValue === 'prepare-project-phase-plan') {
    return 'Preparar fase'
  }
  if (normalizedValue === 'materialize-project-phase-plan') {
    return 'Materializar fase'
  }
  if (normalizedValue === 'prepare-continuation-action-plan') {
    return 'Preparar continuidad'
  }

  return getTechnicalDiagnosticLabel(value, 'Sin estrategia')
}

const getContinuityStateToneClass = (
  tone: 'default' | 'sky' | 'emerald' | 'amber' | 'rose',
) =>
  tone === 'emerald'
    ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
    : tone === 'rose'
      ? 'border-rose-300/20 bg-rose-300/10 text-rose-100'
      : tone === 'amber'
        ? 'border-amber-300/20 bg-amber-300/10 text-amber-100'
        : tone === 'sky'
          ? 'border-sky-300/20 bg-sky-300/10 text-sky-100'
          : 'border-white/10 bg-white/5 text-slate-200'

const getContinuityVisualState = ({
  safeToPrepare,
  safeToMaterialize,
  requiresApproval,
  alreadyDone,
  blocked,
}: {
  safeToPrepare?: boolean
  safeToMaterialize?: boolean
  requiresApproval?: boolean
  alreadyDone?: boolean
  blocked?: boolean
}) => {
  if (alreadyDone) {
    return {
      label: 'Ya agregado al proyecto',
      detail: 'Esta capacidad ya existe; conviene revisarla o extenderla en vez de recrearla.',
      tone: 'sky' as const,
    }
  }

  if (requiresApproval) {
    return {
      label: 'Requiere aprobación',
      detail: 'Sale del modo seguro actual y necesita una revisión humana antes de avanzar.',
      tone: 'rose' as const,
    }
  }

  if (safeToMaterialize) {
    return {
      label: 'Seguro para materializar',
      detail: 'JEFE ya tiene una ruta local y revisable para ejecutar esta expansión.',
      tone: 'emerald' as const,
    }
  }

  if (blocked) {
    return {
      label: 'Bloqueado',
      detail: 'Hace falta revisar un prerequisito o una restricción antes de seguir.',
      tone: 'rose' as const,
    }
  }

  if (safeToPrepare) {
    return {
      label: 'Solo planificación',
      detail: 'Se puede preparar el plan, pero todavía no ejecutar cambios reales.',
      tone: 'amber' as const,
    }
  }

  return {
    label: 'Solo revisión',
    detail: 'Conviene revisar esta propuesta antes de habilitar más pasos.',
    tone: 'default' as const,
  }
}

const getProjectContinuationStatusLabel = (value?: string) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'base-phases-in-progress') {
    return 'Base segura en progreso'
  }
  if (normalizedValue === 'safe-module-expansion-ready') {
    return 'Listo para expandir modulos'
  }
  if (normalizedValue === 'safe-capabilities-complete') {
    return 'Capacidades seguras completas'
  }
  if (normalizedValue === 'review-only') {
    return 'En revision'
  }

  return normalizeOptionalString(value) || 'Sin estado'
}

const getContinuationCategoryLabel = (value?: string) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'project-phase') {
    return 'Fase del proyecto'
  }
  if (normalizedValue === 'frontend-improvement') {
    return 'Mejora de frontend'
  }
  if (normalizedValue === 'backend-contract-extension') {
    return 'Mejora de backend'
  }
  if (normalizedValue === 'database-extension') {
    return 'Datos y schema'
  }
  if (normalizedValue === 'validation-improvement') {
    return 'Validacion y docs'
  }
  if (normalizedValue === 'approval-required') {
    return 'Requiere aprobacion'
  }
  if (normalizedValue === 'blocked') {
    return 'Bloqueado por seguridad'
  }

  return getExpansionTypeLabel(value)
}

function LocalProjectManifestCard({
  manifest,
  compact = false,
  onPreparePhase,
}: {
  manifest: LocalProjectManifestContract
  compact?: boolean
  onPreparePhase?: (phaseId: string) => void
}) {
  const phases = manifest.phases || []
  const visiblePhases = compact ? phases.slice(0, 3) : phases
  const nextRecommendedPhase = normalizeOptionalString(manifest.nextRecommendedPhase)

  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Project phases
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            Estado local del proyecto materializado y fases seguras que JEFE puede seguir preparando.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {normalizeOptionalString(manifest.projectType) || 'Proyecto local'}
          </span>
          {nextRecommendedPhase ? (
            <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-100">
              Siguiente: {nextRecommendedPhase}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Dominio"
          value={normalizeOptionalString(manifest.domain) || 'Sin dominio'}
          detail={getDeliveryLevelLabel(manifest.deliveryLevel)}
          tone="sky"
        />
        <MetricCard
          label="Creado por"
          value={normalizeOptionalString(manifest.createdBy) || 'Sin origen'}
          detail={normalizeOptionalString(manifest.materializationLayer) || 'Sin capa'}
        />
        <MetricCard
          label="Fases"
          value={phases.length > 0 ? `${phases.length} fase(s)` : 'Sin fases'}
          detail={visiblePhases[0]?.id || 'Sin detalle'}
        />
        <MetricCard
          label="Forbidden paths"
          value={
            normalizeOptionalStringArray(manifest.forbiddenPaths).length > 0
              ? `${normalizeOptionalStringArray(manifest.forbiddenPaths).length} path(s)`
              : 'Sin restricciones'
          }
          detail={normalizeOptionalStringArray(manifest.forbiddenPaths)[0] || 'Sin detalle'}
          tone="amber"
        />
      </div>

      <div className="mt-4 grid gap-3">
        {visiblePhases.map((phase) => (
          <article
            key={phase.id || phase.createdAt}
            className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-medium leading-6 text-slate-100">
                  {normalizeOptionalString(phase.id) || 'Fase sin id'}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-400">
                  {normalizeOptionalString(phase.createdAt) || 'Sin timestamp declarativo'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                  {getManifestPhaseStatusLabel(phase.status)}
                </span>
                {onPreparePhase &&
                normalizeOptionalString(phase.status).toLocaleLowerCase() === 'available' ? (
                  <button
                    type="button"
                    onClick={() => onPreparePhase(normalizeOptionalString(phase.id))}
                    className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-100 transition hover:bg-sky-300/15"
                  >
                    Preparar fase
                  </button>
                ) : null}
              </div>
            </div>
            <ProductArchitectureGroup
              title="Archivos"
              items={phase.files}
              compact={compact}
              tone="sky"
            />
          </article>
        ))}
      </div>

      {compact && phases.length > visiblePhases.length ? (
        <div className="mt-3 text-xs leading-5 text-slate-500">
          +{phases.length - visiblePhases.length} fase(s) más en el manifiesto local.
        </div>
      ) : null}
    </article>
  )
}

function ProjectPhaseExecutionPlanCard({
  plan,
  compact = false,
  onMaterializePhase,
}: {
  plan: ProjectPhaseExecutionPlanContract
  compact?: boolean
  onMaterializePhase?: (phaseId: string) => void
}) {
  const operationsPreview = plan.operationsPreview || []
  const visibleOperations = compact ? operationsPreview.slice(0, 3) : operationsPreview
  const tone: 'default' | 'sky' | 'emerald' | 'amber' | 'rose' = plan.approvalRequired
    ? 'rose'
    : plan.executableNow
      ? 'emerald'
      : 'amber'

  return (
    <article className="rounded-3xl border border-sky-300/15 bg-sky-300/[0.05] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Project phase execution
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {normalizeOptionalString(plan.phaseId) || 'Fase sin id'}
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            {normalizeOptionalString(plan.reason) || 'Sin razón declarada.'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {plan.executableNow ? 'Ejecutable ahora' : 'Planner only'}
          </span>
          {onMaterializePhase && plan.executableNow ? (
            <button
              type="button"
              onClick={() => onMaterializePhase(normalizeOptionalString(plan.phaseId))}
              className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/15"
            >
              Materializar fase
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Project root"
          value={normalizeOptionalString(plan.projectRoot) || 'Sin root'}
          detail={getDeliveryLevelLabel(plan.deliveryLevel)}
          tone="sky"
        />
        <MetricCard
          label="Strategies"
          value={normalizeOptionalString(plan.sourceStrategy) || 'Sin source'}
          detail={normalizeOptionalString(plan.targetStrategy) || 'Sin target'}
        />
        <MetricCard
          label="Riesgo"
          value={getRiskLabel(plan.riskLevel)}
          detail={normalizeOptionalString(plan.goal) || 'Sin objetivo'}
          tone={tone}
        />
        <MetricCard
          label="Target files"
          value={
            normalizeOptionalStringArray(plan.targetFiles).length > 0
              ? `${normalizeOptionalStringArray(plan.targetFiles).length} archivo(s)`
              : 'Sin archivos'
          }
          detail={normalizeOptionalStringArray(plan.targetFiles)[0] || 'Sin target'}
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Allowed target paths"
          items={plan.allowedTargetPaths}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Exclusiones"
          items={plan.explicitExclusions}
          compact={compact}
          tone="amber"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Preview de operaciones
        </div>
        <div className="mt-3 grid gap-3">
          {visibleOperations.map((operation) => (
            <div
              key={`${operation.type || 'op'}-${operation.targetPath || 'path'}`}
              className="rounded-xl border border-white/8 bg-slate-900/60 px-4 py-3"
            >
              <div className="text-sm font-medium leading-6 text-slate-100">
                {normalizeOptionalString(operation.type) || 'Operación'}
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-400">
                {normalizeOptionalString(operation.targetPath) || 'Sin target path'}
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                {normalizeOptionalString(operation.purpose) || 'Sin propósito declarado'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ProjectContinuityCard({
  nextActionPlan,
  implementationRoadmap,
  phaseExpansionPlan,
  projectPhaseExecutionPlan,
  localProjectManifest,
  expansionOptions,
  moduleExpansionPlan,
  compact = false,
  busy = false,
  onPreparePhase,
  onMaterializePhase,
  onPrepareModuleExpansion,
  onMaterializeModuleExpansion,
}: {
  nextActionPlan?: NextActionPlanContract | null
  implementationRoadmap?: ImplementationRoadmapContract | null
  phaseExpansionPlan?: PhaseExpansionPlanContract | null
  projectPhaseExecutionPlan?: ProjectPhaseExecutionPlanContract | null
  localProjectManifest?: LocalProjectManifestContract | null
  expansionOptions?: ExpansionOptionsContract | null
  moduleExpansionPlan?: ModuleExpansionPlanContract | null
  compact?: boolean
  busy?: boolean
  onPreparePhase?: (phaseId: string) => void
  onMaterializePhase?: (phaseId: string) => void
  onPrepareModuleExpansion?: (payload: ModuleExpansionActionPayload) => void
  onMaterializeModuleExpansion?: (payload: ModuleExpansionActionPayload) => void
}) {
  const manifestPhases = Array.isArray(localProjectManifest?.phases)
    ? localProjectManifest?.phases || []
    : []
  const manifestModules = Array.isArray(localProjectManifest?.modules)
    ? localProjectManifest?.modules || []
    : []
  const nextRecommendedPhaseId = normalizeOptionalString(
    localProjectManifest?.nextRecommendedPhase,
  )
  const nextManifestPhase =
    manifestPhases.find(
      (phase) => normalizeOptionalString(phase.id) === nextRecommendedPhaseId,
    ) || null
  const recommendedOptionId = normalizeModuleUiId(expansionOptions?.recommendedOptionId)
  const options = Array.isArray(expansionOptions?.options) ? expansionOptions?.options || [] : []
  const visibleOptions = compact ? options.slice(0, 4) : options
  const visibleModules = compact ? manifestModules.slice(0, 3) : manifestModules
  const modulePlanBlockers = normalizeOptionalStringArray(moduleExpansionPlan?.blockers)
  const preparedModuleVisualState = getContinuityVisualState({
    safeToPrepare: moduleExpansionPlan?.safeToPrepare,
    safeToMaterialize: moduleExpansionPlan?.safeToMaterialize,
    requiresApproval: moduleExpansionPlan?.approvalRequired,
    blocked: modulePlanBlockers.length > 0,
  })
  const currentPhaseLabel =
    normalizeOptionalString(expansionOptions?.currentPhase) ||
    normalizeOptionalString(implementationRoadmap?.currentPhase) ||
    normalizeOptionalString(localProjectManifest?.nextRecommendedPhase) ||
    'Sin fase declarada'
  const nextStepTitle =
    normalizeOptionalString(nextActionPlan?.userFacingLabel) ||
    normalizeOptionalString(moduleExpansionPlan?.moduleName) ||
    normalizeOptionalString(nextManifestPhase?.id) ||
    normalizeOptionalString(phaseExpansionPlan?.phaseId) ||
    normalizeOptionalString(implementationRoadmap?.nextRecommendedPhase) ||
    normalizeOptionalString(expansionOptions?.recommendedOptionId) ||
    'Sin siguiente paso declarado'
  const nextStepReason =
    normalizeOptionalString(nextActionPlan?.recommendedAction) ||
    normalizeOptionalString(moduleExpansionPlan?.reason) ||
    normalizeOptionalString(phaseExpansionPlan?.goal) ||
    normalizeOptionalString(implementationRoadmap?.suggestedNextAction) ||
    normalizeOptionalString(projectPhaseExecutionPlan?.reason) ||
    'JEFE ya dejó contexto suficiente para seguir, pero todavía no armó una explicación resumida.'
  const nextStepVisualState = getContinuityVisualState({
    safeToPrepare:
      moduleExpansionPlan?.safeToPrepare ??
      (nextActionPlan?.actionType === 'review-plan' ||
      nextActionPlan?.actionType === 'expand-next-phase'),
    safeToMaterialize:
      moduleExpansionPlan?.safeToMaterialize ??
      projectPhaseExecutionPlan?.executableNow ??
      nextActionPlan?.safeToRunNow,
    requiresApproval: nextActionPlan?.requiresApproval || moduleExpansionPlan?.approvalRequired,
    blocked:
      modulePlanBlockers.length > 0 ||
      (Boolean(nextRecommendedPhaseId) &&
        normalizeOptionalString(nextManifestPhase?.status).toLocaleLowerCase() === 'blocked'),
  })
  const preparedModulePayload: ModuleExpansionActionPayload | null =
    moduleExpansionPlan?.moduleId
      ? {
          moduleId: moduleExpansionPlan.moduleId,
          moduleName: moduleExpansionPlan.moduleName,
          optionType: moduleExpansionPlan.expansionType,
          targetStrategy: moduleExpansionPlan.safeToMaterialize
            ? 'materialize-module-expansion-plan'
            : 'prepare-module-expansion-plan',
          expectedFiles: moduleExpansionPlan.targetFiles,
          safeToPrepare: moduleExpansionPlan.safeToPrepare,
          safeToMaterialize: moduleExpansionPlan.safeToMaterialize,
          requiresApproval: moduleExpansionPlan.approvalRequired,
          reason: moduleExpansionPlan.reason,
        }
      : null

  return (
    <article className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.05] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Continuidad del proyecto
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            Próximo paso recomendado
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{nextStepReason}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={joinClasses(
              'rounded-full border px-3 py-1 text-xs font-medium',
              getContinuityStateToneClass(nextStepVisualState.tone),
            )}
          >
            {nextStepVisualState.label}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {nextStepTitle}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Siguiente acción"
          value={nextStepTitle}
          detail={nextStepVisualState.detail}
          tone={nextStepVisualState.tone}
        />
        <MetricCard
          label="Estado"
          value={nextStepVisualState.label}
          detail={nextStepVisualState.detail}
          tone={nextStepVisualState.tone}
        />
        <MetricCard
          label="Fase actual"
          value={currentPhaseLabel}
          detail={normalizeOptionalString(localProjectManifest?.projectType) || 'Proyecto local'}
          tone="sky"
        />
        <MetricCard
          label="Módulos agregados"
          value={manifestModules.length > 0 ? `${manifestModules.length} módulo(s)` : 'Sin módulos'}
          detail={visibleModules[0]?.name || visibleModules[0]?.id || 'Todavía no hay módulos declarados'}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {onPreparePhase && nextRecommendedPhaseId && nextManifestPhase ? (
          <button
            type="button"
            onClick={() => onPreparePhase(nextRecommendedPhaseId)}
            disabled={busy}
            className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
          >
            Preparar siguiente fase
          </button>
        ) : null}
        {onMaterializePhase &&
        projectPhaseExecutionPlan?.executableNow &&
        normalizeOptionalString(projectPhaseExecutionPlan.phaseId) ? (
          <button
            type="button"
            onClick={() =>
              onMaterializePhase(normalizeOptionalString(projectPhaseExecutionPlan.phaseId))
            }
            disabled={busy}
            className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
          >
            Materializar fase segura
          </button>
        ) : null}
        {onMaterializeModuleExpansion &&
        preparedModulePayload &&
        moduleExpansionPlan?.safeToMaterialize ? (
          <button
            type="button"
            onClick={() => onMaterializeModuleExpansion(preparedModulePayload)}
            disabled={busy}
            className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
          >
            Materializar módulo preparado
          </button>
        ) : null}
      </div>

      {moduleExpansionPlan?.moduleId ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Plan del módulo preparado
              </div>
              <div className="mt-2 text-base font-semibold text-white">
                {normalizeOptionalString(moduleExpansionPlan.moduleName) ||
                  normalizeOptionalString(moduleExpansionPlan.moduleId) ||
                  'Módulo sin nombre'}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-300">
                {normalizeOptionalString(moduleExpansionPlan.reason) ||
                  'JEFE dejó una expansión lista para revisar o materializar en modo seguro.'}
              </div>
            </div>
            <span
              className={joinClasses(
                'rounded-full border px-3 py-1 text-xs font-medium',
                getContinuityStateToneClass(preparedModuleVisualState.tone),
              )}
            >
              {preparedModuleVisualState.label}
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Tipo"
              value={getExpansionTypeLabel(moduleExpansionPlan.expansionType)}
              detail={normalizeOptionalString(moduleExpansionPlan.domain) || 'Sin dominio'}
              tone="sky"
            />
            <MetricCard
              label="Riesgo"
              value={getRiskLabel(moduleExpansionPlan.riskLevel)}
              detail={normalizeOptionalString(moduleExpansionPlan.projectRoot) || 'Sin root'}
              tone={getRiskTone(moduleExpansionPlan.riskLevel)}
            />
            <MetricCard
              label="Capas afectadas"
              value={
                normalizeOptionalStringArray(moduleExpansionPlan.affectedLayers).length > 0
                  ? `${normalizeOptionalStringArray(moduleExpansionPlan.affectedLayers).length} capa(s)`
                  : 'Sin capas'
              }
              detail={normalizeOptionalStringArray(moduleExpansionPlan.affectedLayers)[0] || 'Sin detalle'}
            />
            <MetricCard
              label="Archivos objetivo"
              value={
                normalizeOptionalStringArray(moduleExpansionPlan.targetFiles).length > 0
                  ? `${normalizeOptionalStringArray(moduleExpansionPlan.targetFiles).length} archivo(s)`
                  : 'Sin archivos'
              }
              detail={normalizeOptionalStringArray(moduleExpansionPlan.targetFiles)[0] || 'Sin detalle'}
            />
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            <ProductArchitectureGroup
              title="Capas afectadas"
              items={moduleExpansionPlan.affectedLayers}
              compact={compact}
              tone="emerald"
            />
            <ProductArchitectureGroup
              title="Bloqueos o notas"
              items={
                modulePlanBlockers.length > 0
                  ? modulePlanBlockers
                  : [preparedModuleVisualState.detail]
              }
              compact={compact}
              tone={modulePlanBlockers.length > 0 ? 'rose' : 'amber'}
            />
          </div>
        </div>
      ) : null}

      {visibleOptions.length > 0 ? (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Opciones para seguir
          </div>
          <div className="mt-3 grid gap-3">
            {visibleOptions.map((option) => {
              const normalizedOptionId = normalizeModuleUiId(option.id)
              const matchingModule =
                manifestModules.find(
                  (moduleEntry) =>
                    normalizeModuleUiId(moduleEntry.id || moduleEntry.name) ===
                    normalizedOptionId,
                ) || null
              const alreadyDone =
                normalizeOptionalString(matchingModule?.status).toLocaleLowerCase() ===
                'done'
              const visualState = getContinuityVisualState({
                safeToPrepare: option.safeToPrepare,
                safeToMaterialize: option.safeToMaterialize,
                requiresApproval: option.requiresApproval,
                alreadyDone,
              })
              const optionPayload: ModuleExpansionActionPayload = {
                moduleId: option.id,
                moduleName: option.label,
                optionType: option.expansionType,
                targetStrategy: option.targetStrategy,
                expectedFiles: option.expectedFiles,
                safeToPrepare: option.safeToPrepare,
                safeToMaterialize: option.safeToMaterialize,
                requiresApproval: option.requiresApproval,
                reason: option.reason,
              }
              const canPrepare =
                Boolean(onPrepareModuleExpansion) && option.safeToPrepare !== false
              const canMaterialize =
                Boolean(onMaterializeModuleExpansion) &&
                option.safeToMaterialize === true &&
                !option.requiresApproval &&
                !alreadyDone

              return (
                <article
                  key={option.id || option.label}
                  className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-medium leading-6 text-slate-100">
                          {normalizeOptionalString(option.label) || 'Opción sin título'}
                        </div>
                        {recommendedOptionId &&
                        recommendedOptionId === normalizedOptionId ? (
                          <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
                            Recomendado
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-300">
                        {normalizeOptionalString(option.description) ||
                          'Sin descripción declarada.'}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">
                        {normalizeOptionalString(option.reason) || visualState.detail}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={joinClasses(
                          'rounded-full border px-3 py-1 text-xs font-medium',
                          getContinuityStateToneClass(visualState.tone),
                        )}
                      >
                        {visualState.label}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                        {getExpansionTypeLabel(option.expansionType)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      label="Estrategia sugerida"
                      value={getOperatorStrategyLabel(option.targetStrategy)}
                      detail={
                        alreadyDone
                          ? 'Ya existe en el proyecto y conviene revisarlo antes de volver a expandirlo.'
                          : option.safeToMaterialize
                            ? 'Tiene una ruta segura y revisable dentro del flujo actual.'
                            : option.requiresApproval
                              ? 'Necesita revisión humana antes de salir del modo seguro.'
                              : option.safeToPrepare === false
                                ? 'Todavía no está lista para prepararse desde la interfaz.'
                                : 'Se puede dejar lista como plan revisable sin ejecutar cambios todavía.'
                      }
                      tone="sky"
                    />
                    <MetricCard
                      label="Riesgo"
                      value={getRiskLabel(option.riskLevel)}
                      detail={visualState.detail}
                      tone={getRiskTone(option.riskLevel)}
                    />
                    <MetricCard
                      label="Preparación"
                      value={option.safeToPrepare === false ? 'No' : 'Sí'}
                      detail={
                        option.requiresApproval
                          ? 'Necesita revisión humana'
                          : 'Puede dejar un plan revisable'
                      }
                      tone={option.safeToPrepare === false ? 'rose' : 'emerald'}
                    />
                    <MetricCard
                      label="Materialización"
                      value={option.safeToMaterialize ? 'Segura' : 'No disponible'}
                      detail={
                        alreadyDone
                          ? 'Ya existe en el proyecto'
                          : option.safeToMaterialize
                            ? 'Existe una ruta local y revisable'
                            : 'Todavía no tiene materializador seguro'
                      }
                      tone={
                        alreadyDone
                          ? 'sky'
                          : option.safeToMaterialize
                            ? 'emerald'
                            : option.requiresApproval
                              ? 'rose'
                              : 'amber'
                      }
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {canPrepare ? (
                      <button
                        type="button"
                        onClick={() => onPrepareModuleExpansion?.(optionPayload)}
                        disabled={busy}
                        className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                      >
                        {alreadyDone ? 'Revisar primero' : 'Preparar plan'}
                      </button>
                    ) : null}
                    {canMaterialize ? (
                      <button
                        type="button"
                        onClick={() => onMaterializeModuleExpansion?.(optionPayload)}
                        disabled={busy}
                        className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                      >
                        Materializar módulo
                      </button>
                    ) : (
                      <span className="text-sm leading-6 text-slate-400">
                        {alreadyDone
                          ? 'Ya agregado al proyecto.'
                          : option.requiresApproval
                            ? 'Requiere aprobación antes de salir del modo seguro.'
                            : option.safeToMaterialize
                              ? 'Listo para revisar antes de ejecutar.'
                              : 'Todavía no tiene materializador seguro.'}
                      </span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      ) : null}

      {visibleModules.length > 0 ? (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Módulos ya agregados
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {visibleModules.map((moduleEntry) => (
              <article
                key={moduleEntry.id || moduleEntry.name}
                className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-sm font-medium leading-6 text-slate-100">
                      {normalizeOptionalString(moduleEntry.name) ||
                        normalizeOptionalString(moduleEntry.id) ||
                        'Módulo sin nombre'}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">
                      {normalizeOptionalString(moduleEntry.addedAt) ||
                        'Sin fecha declarada'}
                    </div>
                  </div>
                  <span
                    className={joinClasses(
                      'rounded-full border px-3 py-1 text-xs font-medium',
                      getContinuityStateToneClass(
                        normalizeOptionalString(moduleEntry.status).toLocaleLowerCase() ===
                          'done'
                          ? 'sky'
                          : normalizeOptionalString(moduleEntry.status).toLocaleLowerCase() ===
                              'blocked'
                            ? 'rose'
                            : 'amber',
                      ),
                    )}
                  >
                    {getManifestPhaseStatusLabel(moduleEntry.status)}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <MetricCard
                    label="Capas"
                    value={
                      normalizeOptionalStringArray(moduleEntry.layers).length > 0
                        ? `${normalizeOptionalStringArray(moduleEntry.layers).length} capa(s)`
                        : 'Sin capas'
                    }
                    detail={normalizeOptionalStringArray(moduleEntry.layers)[0] || 'Sin detalle'}
                  />
                  <MetricCard
                    label="Archivos"
                    value={
                      normalizeOptionalStringArray(moduleEntry.files).length > 0
                        ? `${normalizeOptionalStringArray(moduleEntry.files).length} archivo(s)`
                        : 'Sin archivos'
                    }
                    detail={normalizeOptionalStringArray(moduleEntry.files)[0] || 'Sin detalle'}
                    tone="sky"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}

function ProjectContinuityCenterCard({
  nextActionPlan,
  implementationRoadmap,
  phaseExpansionPlan,
  projectPhaseExecutionPlan,
  localProjectManifest,
  expansionOptions,
  moduleExpansionPlan,
  continuationActionPlan,
  projectContinuationState,
  compact = false,
  busy = false,
  onPreparePhase,
  onMaterializePhase,
  onPrepareModuleExpansion,
  onMaterializeModuleExpansion,
  onPrepareContinuationAction,
  onMaterializeContinuationAction,
}: {
  nextActionPlan?: NextActionPlanContract | null
  implementationRoadmap?: ImplementationRoadmapContract | null
  phaseExpansionPlan?: PhaseExpansionPlanContract | null
  projectPhaseExecutionPlan?: ProjectPhaseExecutionPlanContract | null
  localProjectManifest?: LocalProjectManifestContract | null
  expansionOptions?: ExpansionOptionsContract | null
  moduleExpansionPlan?: ModuleExpansionPlanContract | null
  continuationActionPlan?: ContinuationActionContract | null
  projectContinuationState?: ProjectContinuationStateContract | null
  compact?: boolean
  busy?: boolean
  onPreparePhase?: (phaseId: string) => void
  onMaterializePhase?: (phaseId: string) => void
  onPrepareModuleExpansion?: (payload: ModuleExpansionActionPayload) => void
  onMaterializeModuleExpansion?: (payload: ModuleExpansionActionPayload) => void
  onPrepareContinuationAction?: (action: ContinuationActionContract) => void
  onMaterializeContinuationAction?: (action: ContinuationActionContract) => void
}) {
  const manifestPhases = Array.isArray(localProjectManifest?.phases)
    ? localProjectManifest?.phases || []
    : []
  const manifestModules = Array.isArray(localProjectManifest?.modules)
    ? localProjectManifest?.modules || []
    : []
  const completedPhases = normalizeOptionalStringArray(
    projectContinuationState?.completedPhases,
  )
  const pendingPhases = normalizeOptionalStringArray(
    projectContinuationState?.pendingPhases,
  )
  const availableSafeActions = Array.isArray(
    projectContinuationState?.availableSafeActions,
  )
    ? projectContinuationState?.availableSafeActions || []
    : []
  const availablePlanningActions = Array.isArray(
    projectContinuationState?.availablePlanningActions,
  )
    ? projectContinuationState?.availablePlanningActions || []
    : []
  const approvalRequiredActions = Array.isArray(
    projectContinuationState?.approvalRequiredActions,
  )
    ? projectContinuationState?.approvalRequiredActions || []
    : []
  const blockedActions = Array.isArray(projectContinuationState?.blockedActions)
    ? projectContinuationState?.blockedActions || []
    : []
  const modulesDone = normalizeOptionalStringArray(projectContinuationState?.modulesDone)
  const modulesAvailable = normalizeOptionalStringArray(
    projectContinuationState?.modulesAvailable,
  )
  const modulesBlocked = normalizeOptionalStringArray(
    projectContinuationState?.modulesBlocked,
  )
  const continuationRisks = normalizeOptionalStringArray(projectContinuationState?.risks)
  const continuationBlockers = normalizeOptionalStringArray(
    projectContinuationState?.blockers,
  )
  const nextRecommendedPhaseId =
    normalizeOptionalString(projectContinuationState?.nextRecommendedPhase) ||
    normalizeOptionalString(localProjectManifest?.nextRecommendedPhase)
  const nextManifestPhase =
    manifestPhases.find(
      (phase) => normalizeOptionalString(phase.id) === nextRecommendedPhaseId,
    ) || null
  const currentPhaseLabel =
    normalizeOptionalString(expansionOptions?.currentPhase) ||
    normalizeOptionalString(implementationRoadmap?.currentPhase) ||
    nextRecommendedPhaseId ||
    normalizeOptionalString(localProjectManifest?.lastCompletedPhase) ||
    'Sin fase declarada'
  const continuationSummary =
    normalizeOptionalString(projectContinuationState?.summary) ||
    normalizeOptionalString(nextActionPlan?.recommendedAction) ||
    normalizeOptionalString(moduleExpansionPlan?.reason) ||
    normalizeOptionalString(phaseExpansionPlan?.goal) ||
    normalizeOptionalString(projectPhaseExecutionPlan?.reason) ||
    'JEFE ya dejo contexto suficiente para seguir, pero todavia no armo un resumen corto.'
  const operatorMessage =
    normalizeOptionalString(projectContinuationState?.operatorMessage) ||
    continuationSummary
  const projectStatusLabel = getProjectContinuationStatusLabel(
    projectContinuationState?.projectStatus,
  )
  const nextRecommendedAction =
    projectContinuationState?.nextRecommendedAction ||
    continuationActionPlan ||
    (moduleExpansionPlan?.moduleId
      ? {
          id: `prepared-module-${normalizeOptionalString(moduleExpansionPlan.moduleId)}`,
          title:
            normalizeOptionalString(moduleExpansionPlan.moduleName) ||
            normalizeOptionalString(moduleExpansionPlan.moduleId) ||
            'Modulo preparado',
          description:
            normalizeOptionalString(moduleExpansionPlan.reason) ||
            'Hay una expansion preparada para revisar.',
          category: normalizeOptionalString(moduleExpansionPlan.expansionType),
          targetStrategy:
            moduleExpansionPlan.safeToMaterialize === true
              ? 'materialize-module-expansion-plan'
              : 'prepare-module-expansion-plan',
          safeToPrepare: moduleExpansionPlan.safeToPrepare !== false,
          safeToMaterialize: moduleExpansionPlan.safeToMaterialize === true,
          requiresApproval: moduleExpansionPlan.approvalRequired === true,
          blocked:
            normalizeOptionalStringArray(moduleExpansionPlan.blockers).length > 0,
          blocker: normalizeOptionalStringArray(moduleExpansionPlan.blockers)[0] || '',
          moduleId: normalizeOptionalString(moduleExpansionPlan.moduleId),
          riskLevel: moduleExpansionPlan.riskLevel,
          projectRoot: normalizeOptionalString(moduleExpansionPlan.projectRoot),
          reason: normalizeOptionalString(moduleExpansionPlan.reason),
          targetFiles: moduleExpansionPlan.targetFiles || [],
          allowedTargetPaths: moduleExpansionPlan.allowedTargetPaths || [],
          explicitExclusions: moduleExpansionPlan.explicitExclusions || [],
          successCriteria: moduleExpansionPlan.successCriteria || [],
          expectedOutcome:
            'Dejar la expansion del modulo lista para revision o materializacion segura.',
        }
      : null) ||
    (projectPhaseExecutionPlan?.phaseId
      ? {
          id: `prepared-phase-${normalizeOptionalString(projectPhaseExecutionPlan.phaseId)}`,
          title:
            normalizeOptionalString(projectPhaseExecutionPlan.phaseId) ||
            'Fase preparada',
          description:
            normalizeOptionalString(projectPhaseExecutionPlan.reason) ||
            'Hay una fase preparada para revisar.',
          category: 'project-phase',
          targetStrategy:
            normalizeOptionalString(projectPhaseExecutionPlan.targetStrategy) ||
            'prepare-project-phase-plan',
          safeToPrepare: true,
          safeToMaterialize: projectPhaseExecutionPlan.executableNow === true,
          requiresApproval: projectPhaseExecutionPlan.approvalRequired === true,
          blocked:
            normalizeOptionalStringArray(projectPhaseExecutionPlan.blockers).length > 0,
          blocker:
            normalizeOptionalStringArray(projectPhaseExecutionPlan.blockers)[0] || '',
          phaseId: normalizeOptionalString(projectPhaseExecutionPlan.phaseId),
          riskLevel: projectPhaseExecutionPlan.riskLevel,
          projectRoot: normalizeOptionalString(projectPhaseExecutionPlan.projectRoot),
          reason: normalizeOptionalString(projectPhaseExecutionPlan.reason),
          targetFiles: projectPhaseExecutionPlan.targetFiles || [],
          allowedTargetPaths: projectPhaseExecutionPlan.allowedTargetPaths || [],
          explicitExclusions: projectPhaseExecutionPlan.explicitExclusions || [],
          successCriteria: projectPhaseExecutionPlan.successCriteria || [],
          expectedOutcome:
            'Dejar la fase lista para revision o materializacion segura.',
        }
      : null)
  const nextStepTitle =
    normalizeOptionalString(nextRecommendedAction?.title) ||
    normalizeOptionalString(nextActionPlan?.userFacingLabel) ||
    normalizeOptionalString(nextManifestPhase?.id) ||
    normalizeOptionalString(phaseExpansionPlan?.phaseId) ||
    normalizeOptionalString(implementationRoadmap?.nextRecommendedPhase) ||
    'Sin siguiente paso declarado'
  const nextStepReason =
    normalizeOptionalString(nextRecommendedAction?.reason) ||
    normalizeOptionalString(nextActionPlan?.recommendedAction) ||
    normalizeOptionalString(implementationRoadmap?.suggestedNextAction) ||
    continuationSummary
  const nextStepVisualState = getContinuityVisualState({
    safeToPrepare:
      nextRecommendedAction?.safeToPrepare ??
      (nextActionPlan?.actionType === 'review-plan' ||
        nextActionPlan?.actionType === 'expand-next-phase'),
    safeToMaterialize:
      nextRecommendedAction?.safeToMaterialize ??
      projectPhaseExecutionPlan?.executableNow ??
      nextActionPlan?.safeToRunNow,
    requiresApproval:
      nextRecommendedAction?.requiresApproval || nextActionPlan?.requiresApproval,
    blocked:
      nextRecommendedAction?.blocked ||
      normalizeOptionalString(nextManifestPhase?.status).toLocaleLowerCase() ===
        'blocked',
  })
  const actionIdentitySet = new Set(
    [
      ...availableSafeActions,
      ...availablePlanningActions,
      ...approvalRequiredActions,
      ...blockedActions,
    ]
      .map((entry) => normalizeModuleUiId(entry?.moduleId || entry?.id || ''))
      .filter(Boolean),
  )
  const recommendedOptionId = normalizeModuleUiId(expansionOptions?.recommendedOptionId)
  const visibleOptions = (
    Array.isArray(expansionOptions?.options) ? expansionOptions?.options || [] : []
  )
    .filter((option) => {
      const hasVisibleContent = Boolean(
        normalizeOptionalString(option?.id) ||
          normalizeOptionalString(option?.label) ||
          normalizeOptionalString(option?.description) ||
          normalizeOptionalString(option?.reason),
      )
      const optionIdentity = normalizeModuleUiId(option?.id || option?.label || '')

      if (!hasVisibleContent) {
        return false
      }

      if (
        actionIdentitySet.size > 0 &&
        optionIdentity &&
        actionIdentitySet.has(optionIdentity)
      ) {
        return false
      }

      return true
    })
    .slice(0, compact ? 4 : Number.MAX_SAFE_INTEGER)
  const visibleModules = compact ? manifestModules.slice(0, 3) : manifestModules

  const dispatchPrepareAction = (action: ContinuationActionContract) => {
    if (onPrepareContinuationAction) {
      onPrepareContinuationAction(action)
      return
    }

    const normalizedPhaseId = normalizeOptionalString(action.phaseId)
    const normalizedModuleId = normalizeOptionalString(action.moduleId)

    if (normalizedPhaseId && onPreparePhase) {
      onPreparePhase(normalizedPhaseId)
      return
    }

    if (normalizedModuleId && onPrepareModuleExpansion) {
      onPrepareModuleExpansion({
        moduleId: normalizedModuleId,
        moduleName: action.title,
        optionType: action.category,
        targetStrategy: action.targetStrategy,
        expectedFiles: action.targetFiles || null,
        safeToPrepare: action.safeToPrepare,
        safeToMaterialize: action.safeToMaterialize,
        requiresApproval: action.requiresApproval,
        reason: action.reason || action.blocker || action.description,
      })
    }
  }

  const dispatchMaterializeAction = (action: ContinuationActionContract) => {
    if (action.safeToMaterialize !== true) {
      return
    }

    if (onMaterializeContinuationAction) {
      onMaterializeContinuationAction(action)
      return
    }

    const normalizedPhaseId = normalizeOptionalString(action.phaseId)
    const normalizedModuleId = normalizeOptionalString(action.moduleId)

    if (normalizedPhaseId && onMaterializePhase) {
      onMaterializePhase(normalizedPhaseId)
      return
    }

    if (normalizedModuleId && onMaterializeModuleExpansion) {
      onMaterializeModuleExpansion({
        moduleId: normalizedModuleId,
        moduleName: action.title,
        optionType: action.category,
        targetStrategy: action.targetStrategy,
        expectedFiles: action.targetFiles || null,
        safeToPrepare: action.safeToPrepare,
        safeToMaterialize: action.safeToMaterialize,
        requiresApproval: action.requiresApproval,
        reason: action.reason || action.description,
      })
    }
  }

  const renderActionCards = (
    title: string,
    actions: ContinuationActionContract[],
    emptyCopy: string,
    sectionTone: 'emerald' | 'amber' | 'rose' | 'sky',
  ) => {
    if (actions.length === 0) {
      return (
        <div className="rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-4 text-sm leading-6 text-slate-400">
          {emptyCopy}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {title}
        </div>
        <div className="grid gap-3">
          {actions.map((action) => {
            const normalizedModuleId = normalizeModuleUiId(action.moduleId || '')
            const matchingModule =
              manifestModules.find(
                (moduleEntry) =>
                  normalizeModuleUiId(moduleEntry.id || moduleEntry.name) ===
                  normalizedModuleId,
              ) || null
            const alreadyDone =
              normalizeOptionalString(matchingModule?.status).toLocaleLowerCase() ===
              'done'
            const visualState = getContinuityVisualState({
              safeToPrepare: action.safeToPrepare,
              safeToMaterialize: action.safeToMaterialize,
              requiresApproval: action.requiresApproval,
              blocked: action.blocked,
              alreadyDone,
            })
            const detailCopy =
              normalizeOptionalString(action.blocker) ||
              normalizeOptionalString(action.reason) ||
              normalizeOptionalString(action.description) ||
              visualState.detail
            const canPrepare = action.safeToPrepare !== false && !alreadyDone
            const canMaterialize =
              action.safeToMaterialize === true &&
              !action.requiresApproval &&
              !action.blocked &&
              !alreadyDone

            return (
              <article
                key={action.id || action.title}
                className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium leading-6 text-slate-100">
                        {normalizeOptionalString(action.title) || 'Accion sin titulo'}
                      </div>
                      {action.recommended ? (
                        <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
                          Recomendado
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-300">
                      {normalizeOptionalString(action.description) ||
                        'Sin descripcion declarada.'}
                    </div>
                    <div className="mt-2 text-xs leading-5 text-slate-400">
                      {detailCopy}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={joinClasses(
                        'rounded-full border px-3 py-1 text-xs font-medium',
                        getContinuityStateToneClass(visualState.tone),
                      )}
                    >
                      {visualState.label}
                    </span>
                    <span
                      className={joinClasses(
                        'rounded-full border px-3 py-1 text-xs font-medium',
                        getContinuityStateToneClass(sectionTone),
                      )}
                    >
                      {getContinuationCategoryLabel(action.category)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Como sigue"
                    value={getOperatorStrategyLabel(action.targetStrategy)}
                    detail={
                      normalizeOptionalString(action.expectedOutcome) ||
                      'Sin resultado esperado declarado.'
                    }
                    tone="sky"
                  />
                  <MetricCard
                    label="Riesgo"
                    value={getRiskLabel(action.riskLevel)}
                    detail={detailCopy}
                    tone={getRiskTone(action.riskLevel)}
                  />
                  <MetricCard
                    label="Preparacion"
                    value={action.safeToPrepare === false ? 'No' : 'Si'}
                    detail={
                      action.requiresApproval
                        ? 'Requiere aprobacion antes de salir del modo seguro.'
                        : action.blocked
                          ? 'Conviene revisar el bloqueo primero.'
                          : 'Se puede dejar lista como siguiente accion revisable.'
                    }
                    tone={action.safeToPrepare === false ? 'rose' : 'emerald'}
                  />
                  <MetricCard
                    label="Materializacion"
                    value={action.safeToMaterialize ? 'Segura' : 'No disponible'}
                    detail={
                      alreadyDone
                        ? 'Ya agregado al proyecto.'
                        : action.safeToMaterialize
                          ? 'Existe una ruta local y revisable.'
                          : action.requiresApproval
                            ? 'Necesita aprobacion antes de ejecutar.'
                            : action.blocked
                              ? 'Bloqueado por seguridad.'
                              : 'Todavia no se puede ejecutar solo.'
                    }
                    tone={
                      alreadyDone
                        ? 'sky'
                        : action.safeToMaterialize
                          ? 'emerald'
                          : action.requiresApproval || action.blocked
                            ? 'rose'
                            : 'amber'
                    }
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {canPrepare ? (
                    <button
                      type="button"
                      onClick={() => dispatchPrepareAction(action)}
                      disabled={busy}
                      className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                    >
                      {alreadyDone ? 'Revisar primero' : 'Preparar plan'}
                    </button>
                  ) : null}
                  {canMaterialize ? (
                    <button
                      type="button"
                      onClick={() => dispatchMaterializeAction(action)}
                      disabled={busy}
                      className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                    >
                      Materializar seguro
                    </button>
                  ) : (
                    <span className="text-sm leading-6 text-slate-400">
                      {alreadyDone
                        ? 'Ya agregado al proyecto.'
                        : action.requiresApproval
                          ? 'Requiere aprobacion antes de salir del modo seguro.'
                          : action.blocked
                            ? normalizeOptionalString(action.blocker) ||
                              'Bloqueado por seguridad.'
                            : 'Todavia no se puede ejecutar solo.'}
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <article className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.05] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Centro de continuidad
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            Proximo paso recomendado
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            {operatorMessage}
          </div>
          <div className="mt-2 text-xs leading-5 text-slate-400">{nextStepReason}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={joinClasses(
              'rounded-full border px-3 py-1 text-xs font-medium',
              getContinuityStateToneClass(nextStepVisualState.tone),
            )}
          >
            {nextStepVisualState.label}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {nextStepTitle}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {projectStatusLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Estado del proyecto"
          value={projectStatusLabel}
          detail={currentPhaseLabel}
          tone={nextStepVisualState.tone}
        />
        <MetricCard
          label="Ya completado"
          value={
            completedPhases.length > 0
              ? `${completedPhases.length} fase(s)`
              : 'Nada declarado'
          }
          detail={completedPhases[0] || 'Todavia no hay fases completas declaradas'}
          tone="sky"
        />
        <MetricCard
          label="Falta resolver"
          value={
            pendingPhases.length > 0
              ? `${pendingPhases.length} fase(s)`
              : 'Base segura completa'
          }
          detail={
            pendingPhases[0] ||
            nextRecommendedPhaseId ||
            'Conviene revisar la siguiente expansion'
          }
          tone={pendingPhases.length > 0 ? 'amber' : 'emerald'}
        />
        <MetricCard
          label="Modulos del proyecto"
          value={
            manifestModules.length > 0 ? `${manifestModules.length} modulo(s)` : 'Sin modulos'
          }
          detail={
            modulesDone[0] ||
            visibleModules[0]?.name ||
            visibleModules[0]?.id ||
            'Todavia no hay modulos declarados'
          }
          tone="emerald"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {nextRecommendedAction?.safeToPrepare !== false ? (
          <button
            type="button"
            onClick={() => nextRecommendedAction && dispatchPrepareAction(nextRecommendedAction)}
            disabled={busy || !nextRecommendedAction}
            className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
          >
            Preparar plan
          </button>
        ) : null}
        {nextRecommendedAction?.safeToMaterialize === true &&
        !nextRecommendedAction.requiresApproval &&
        !nextRecommendedAction.blocked ? (
          <button
            type="button"
            onClick={() =>
              nextRecommendedAction && dispatchMaterializeAction(nextRecommendedAction)
            }
            disabled={busy || !nextRecommendedAction}
            className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
          >
            Materializar seguro
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Ya completado"
          items={completedPhases}
          compact={compact}
          tone="sky"
        />
        <ProductArchitectureGroup
          title="Falta resolver"
          items={pendingPhases}
          compact={compact}
          tone={pendingPhases.length > 0 ? 'amber' : 'emerald'}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Podria sumar despues"
          items={modulesAvailable}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Riesgo controlado"
          items={
            continuationRisks.length > 0
              ? continuationRisks
              : ['No se toca nada real sin aprobacion.']
          }
          compact={compact}
          tone="amber"
        />
      </div>

      {continuationBlockers.length > 0 ? (
        <div className="mt-4">
          <ProductArchitectureGroup
            title="Bloqueos actuales"
            items={continuationBlockers}
            compact={compact}
            tone="rose"
          />
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        {renderActionCards(
          'Podes avanzar ahora',
          availableSafeActions,
          'Todavia no hay acciones seguras nuevas para ejecutar dentro del modo local.',
          'emerald',
        )}
        {renderActionCards(
          'Acciones revisables',
          availablePlanningActions,
          'JEFE no dejo nuevas acciones revisables ademas del siguiente paso recomendado.',
          'amber',
        )}
        {renderActionCards(
          'Requiere aprobacion',
          approvalRequiredActions,
          'No hay acciones pendientes de aprobacion en esta corrida.',
          'rose',
        )}
        {renderActionCards(
          'Bloqueado por seguridad',
          blockedActions,
          'No hay acciones bloqueadas nuevas en esta corrida.',
          'rose',
        )}
      </div>

      {visibleOptions.length > 0 ? (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Opciones para seguir
          </div>
          <div className="mt-3 grid gap-3">
            {visibleOptions.map((option) => {
              const normalizedOptionId = normalizeModuleUiId(option.id)
              const matchingModule =
                manifestModules.find(
                  (moduleEntry) =>
                    normalizeModuleUiId(moduleEntry.id || moduleEntry.name) ===
                    normalizedOptionId,
                ) || null
              const alreadyDone =
                normalizeOptionalString(matchingModule?.status).toLocaleLowerCase() ===
                'done'
              const visualState = getContinuityVisualState({
                safeToPrepare: option.safeToPrepare,
                safeToMaterialize: option.safeToMaterialize,
                requiresApproval: option.requiresApproval,
                alreadyDone,
              })
              const isModuleOption =
                normalizeOptionalString(option.targetStrategy).includes(
                  'module-expansion',
                ) || option.safeToMaterialize === true
              const optionAction: ContinuationActionContract = {
                id: normalizeOptionalString(option.id),
                title:
                  normalizeOptionalString(option.label) ||
                  normalizeOptionalString(option.id) ||
                  'Opcion sin titulo',
                description: normalizeOptionalString(option.description),
                category: normalizeOptionalString(option.expansionType),
                targetStrategy: normalizeOptionalString(option.targetStrategy),
                safeToPrepare: option.safeToPrepare !== false,
                safeToMaterialize: option.safeToMaterialize === true,
                requiresApproval: option.requiresApproval === true,
                blocked: alreadyDone,
                blocker: alreadyDone ? 'Ya agregado al proyecto.' : '',
                moduleId: isModuleOption ? normalizeOptionalString(option.id) : '',
                riskLevel: option.riskLevel,
                reason: normalizeOptionalString(option.reason),
                targetFiles: option.expectedFiles || [],
              }
              const canPrepare = option.safeToPrepare !== false && !alreadyDone
              const canMaterialize =
                option.safeToMaterialize === true &&
                !option.requiresApproval &&
                !alreadyDone

              return (
                <article
                  key={option.id || option.label}
                  className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-medium leading-6 text-slate-100">
                          {normalizeOptionalString(option.label) || 'Opcion sin titulo'}
                        </div>
                        {recommendedOptionId &&
                        recommendedOptionId === normalizedOptionId ? (
                          <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
                            Recomendado
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-300">
                        {normalizeOptionalString(option.description) ||
                          'Sin descripcion declarada.'}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">
                        {normalizeOptionalString(option.reason) || visualState.detail}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={joinClasses(
                          'rounded-full border px-3 py-1 text-xs font-medium',
                          getContinuityStateToneClass(visualState.tone),
                        )}
                      >
                        {visualState.label}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                        {getContinuationCategoryLabel(option.expansionType)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      label="Como sigue"
                      value={getOperatorStrategyLabel(option.targetStrategy)}
                      detail={
                        alreadyDone
                          ? 'Ya existe en el proyecto y conviene revisarlo antes de volver a expandirlo.'
                          : option.safeToMaterialize
                            ? 'Tiene una ruta segura y revisable dentro del flujo actual.'
                            : option.requiresApproval
                              ? 'Necesita revision humana antes de salir del modo seguro.'
                              : option.safeToPrepare === false
                                ? 'Todavia no esta lista para prepararse desde la interfaz.'
                                : 'Se puede dejar lista como plan revisable sin ejecutar cambios todavia.'
                      }
                      tone="sky"
                    />
                    <MetricCard
                      label="Riesgo"
                      value={getRiskLabel(option.riskLevel)}
                      detail={normalizeOptionalString(option.reason) || visualState.detail}
                      tone={getRiskTone(option.riskLevel)}
                    />
                    <MetricCard
                      label="Preparacion"
                      value={option.safeToPrepare === false ? 'No' : 'Si'}
                      detail={
                        option.requiresApproval
                          ? 'Necesita revision humana'
                          : 'Puede dejar un plan revisable'
                      }
                      tone={option.safeToPrepare === false ? 'rose' : 'emerald'}
                    />
                    <MetricCard
                      label="Materializacion"
                      value={option.safeToMaterialize ? 'Segura' : 'No disponible'}
                      detail={
                        alreadyDone
                          ? 'Ya existe en el proyecto'
                          : option.safeToMaterialize
                            ? 'Existe una ruta local y revisable'
                            : 'Todavia no tiene materializador seguro'
                      }
                      tone={
                        alreadyDone
                          ? 'sky'
                          : option.safeToMaterialize
                            ? 'emerald'
                            : option.requiresApproval
                              ? 'rose'
                              : 'amber'
                      }
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {canPrepare ? (
                      <button
                        type="button"
                        onClick={() => dispatchPrepareAction(optionAction)}
                        disabled={busy}
                        className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                      >
                        {alreadyDone ? 'Revisar primero' : 'Preparar plan'}
                      </button>
                    ) : null}
                    {canMaterialize ? (
                      <button
                        type="button"
                        onClick={() => dispatchMaterializeAction(optionAction)}
                        disabled={busy}
                        className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                      >
                        Materializar modulo
                      </button>
                    ) : (
                      <span className="text-sm leading-6 text-slate-400">
                        {alreadyDone
                          ? 'Ya agregado al proyecto.'
                          : option.requiresApproval
                            ? 'Requiere aprobacion antes de salir del modo seguro.'
                            : option.safeToMaterialize
                              ? 'Listo para revisar antes de ejecutar.'
                              : 'Todavia no tiene materializador seguro.'}
                      </span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      ) : null}

      {visibleModules.length > 0 ? (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Modulos del proyecto
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {visibleModules.map((moduleEntry) => {
              const normalizedStatus = normalizeOptionalString(
                moduleEntry.status,
              ).toLocaleLowerCase()
              const moduleTone =
                normalizedStatus === 'done'
                  ? 'sky'
                  : normalizedStatus === 'blocked'
                    ? 'rose'
                    : normalizedStatus === 'partial' || normalizedStatus === 'planned'
                      ? 'amber'
                      : 'default'

              return (
                <article
                  key={moduleEntry.id || moduleEntry.name}
                  className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-sm font-medium leading-6 text-slate-100">
                        {normalizeOptionalString(moduleEntry.name) ||
                          normalizeOptionalString(moduleEntry.id) ||
                          'Modulo sin nombre'}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-slate-400">
                        {normalizeOptionalString(moduleEntry.addedAt) ||
                          'Sin fecha declarada'}
                      </div>
                    </div>
                    <span
                      className={joinClasses(
                        'rounded-full border px-3 py-1 text-xs font-medium',
                        getContinuityStateToneClass(moduleTone),
                      )}
                    >
                      {normalizedStatus === 'done'
                        ? 'Ya agregado al proyecto'
                        : getManifestPhaseStatusLabel(moduleEntry.status)}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <MetricCard
                      label="Capas"
                      value={
                        normalizeOptionalStringArray(moduleEntry.layers).length > 0
                          ? `${normalizeOptionalStringArray(moduleEntry.layers).length} capa(s)`
                          : 'Sin capas'
                      }
                      detail={
                        normalizeOptionalStringArray(moduleEntry.layers)[0] || 'Sin detalle'
                      }
                    />
                    <MetricCard
                      label="Archivos"
                      value={
                        normalizeOptionalStringArray(moduleEntry.files).length > 0
                          ? `${normalizeOptionalStringArray(moduleEntry.files).length} archivo(s)`
                          : 'Sin archivos'
                      }
                      detail={
                        normalizeOptionalStringArray(moduleEntry.files)[0] || 'Sin detalle'
                      }
                      tone="sky"
                    />
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      ) : null}

      {modulesBlocked.length > 0 ? (
        <div className="mt-4">
          <ProductArchitectureGroup
            title="Modulos con restricciones"
            items={modulesBlocked}
            compact={compact}
            tone="rose"
          />
        </div>
      ) : null}
    </article>
  )
}

function ProjectBlueprintCard({
  blueprint,
  questionPolicy,
  compact = false,
}: {
  blueprint: ProjectBlueprintContract
  questionPolicy?: QuestionPolicyContract | null
  compact?: boolean
}) {
  const stackProfile = blueprint.stackProfile || null
  const stackItems = [
    stackProfile?.frontend
      ? `Frontend: ${stackProfile.frontend}`
      : '',
    stackProfile?.backend ? `Backend: ${stackProfile.backend}` : '',
    stackProfile?.database ? `Base de datos: ${stackProfile.database}` : '',
    stackProfile?.apiStyle ? `API: ${stackProfile.apiStyle}` : '',
    stackProfile?.auth ? `Auth: ${stackProfile.auth}` : '',
    stackProfile?.styling ? `Styling: ${stackProfile.styling}` : '',
    stackProfile?.testing ? `Testing: ${stackProfile.testing}` : '',
    stackProfile?.packageManager
      ? `Package manager: ${stackProfile.packageManager}`
      : '',
    stackProfile?.runtime ? `Runtime: ${stackProfile.runtime}` : '',
  ].filter(Boolean)
  const visibleStackItems = compact ? stackItems.slice(0, 5) : stackItems
  const visibleIntegrations = compact
    ? (blueprint.integrations || []).slice(0, 3)
    : blueprint.integrations || []
  const visiblePhasePlan = compact
    ? (blueprint.phasePlan || []).slice(0, 3)
    : blueprint.phasePlan || []

  return (
    <article className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.06] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Blueprint del proyecto
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            Esta lectura resume el tipo de producto, el stack recomendado, los módulos
            y las decisiones de arquitectura que JEFE está usando para planificar.
          </div>
          <div className="mt-2 text-xs leading-5 text-slate-500">
            {normalizeOptionalString(blueprint.intent) ||
              'Sin intención resumida disponible.'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            Arquitectura dinámica
          </span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
            {getDeliveryLevelLabel(blueprint.deliveryLevel)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tipo de producto"
          value={normalizeOptionalString(blueprint.productType) || 'No definido'}
          detail={normalizeOptionalString(blueprint.domain) || 'Sin dominio declarado'}
          tone="emerald"
        />
        <MetricCard
          label="Delivery level"
          value={getDeliveryLevelLabel(blueprint.deliveryLevel)}
          detail={getScalableDeliveryPlanTypeLabel(blueprint.deliveryLevel)}
          tone={getDeliveryLevelTone(blueprint.deliveryLevel)}
        />
        <MetricCard
          label="Confianza"
          value={getBlueprintConfidenceLabel(blueprint.confidence)}
          detail={getStackProfileSummary(blueprint)}
          tone="sky"
        />
        <MetricCard
          label="Riesgo"
          value={getRiskLabel(blueprint.riskLevel)}
          detail={`Sensibilidad: ${getSensitivityLabel(blueprint.dataSensitivity)}`}
          tone={getRiskTone(blueprint.riskLevel)}
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Roles"
          items={blueprint.roles}
          compact={compact}
          tone="sky"
        />
        <ProductArchitectureGroup
          title="Módulos"
          items={blueprint.modules}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Entidades"
          items={blueprint.entities}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Flujos principales"
          items={blueprint.coreFlows}
          compact={compact}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Stack recomendado
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {visibleStackItems.length > 0 ? (
            visibleStackItems.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-100"
              >
                {item}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300 xl:col-span-2">
              El Cerebro todavía no dejó un stack profile estructurado.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Supuestos"
          items={blueprint.assumptions}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Decisiones delegadas"
          items={blueprint.delegatedDecisions || questionPolicy?.delegatedDecisions}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Preguntas bloqueantes"
          items={blueprint.blockingQuestions || questionPolicy?.blockingQuestions}
          compact={compact}
          tone="amber"
        />
        <ProductArchitectureGroup
          title="Aprobaciones futuras"
          items={blueprint.approvalRequiredLater}
          compact={compact}
          tone="rose"
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Política de preguntas
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <MetricCard
              label="Modo"
              value={getQuestionPolicyModeLabel(questionPolicy?.mode)}
              detail={normalizeOptionalString(questionPolicy?.reason) || 'Sin razón declarada'}
              tone="amber"
            />
            <MetricCard
              label="Antes de planificar"
              value={questionPolicy?.shouldAskBeforePlanning ? 'Preguntar' : 'Seguir'}
              detail={
                questionPolicy?.shouldAskBeforeMaterialization
                  ? 'También podría frenar antes de materializar'
                  : 'No hace falta bloquear la materialización por ahora'
              }
              tone={questionPolicy?.shouldAskBeforePlanning ? 'amber' : 'emerald'}
            />
          </div>
          {normalizeOptionalStringArray(questionPolicy?.optionalQuestions).length > 0 ? (
            <div className="mt-4">
              <ProductArchitectureGroup
                title="Preguntas opcionales"
                items={questionPolicy?.optionalQuestions}
                compact={compact}
              />
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Fases propuestas
          </div>
          <div className="mt-3 grid gap-3">
            {visiblePhasePlan.length > 0 ? (
              visiblePhasePlan.map((phaseEntry) => (
                <div
                  key={`${phaseEntry.phase || 'phase'}-${phaseEntry.goal || 'goal'}`}
                  className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
                >
                  <div className="text-sm font-medium leading-6 text-slate-100">
                    {phaseEntry.phase || 'Fase sin nombre'}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">
                    {phaseEntry.goal || 'Sin objetivo declarado'}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <span>{getDeliveryLevelLabel(phaseEntry.deliveryLevel)}</span>
                    <span>
                      {phaseEntry.executableNow ? 'ejecutable ahora' : 'no ejecutable todavía'}
                    </span>
                    <span>
                      {phaseEntry.approvalRequired
                        ? 'requiere aprobación'
                        : 'sin aprobación previa'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                El blueprint todavía no dejó fases estructuradas.
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Exclusiones explícitas"
          items={blueprint.explicitExclusions}
          compact={compact}
          tone="rose"
        />
        <ProductArchitectureGroup
          title="Criterios de éxito"
          items={blueprint.successCriteria}
          compact={compact}
          tone="emerald"
        />
      </div>

      {visibleIntegrations.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Integraciones consideradas
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {visibleIntegrations.map((integration) => (
              <div
                key={`${integration.name || 'integration'}-${integration.type || 'type'}`}
                className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
              >
                <div className="text-sm font-medium leading-6 text-slate-100">
                  {integration.name || 'Integración sin nombre'}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-400">
                  {integration.reason || 'Sin motivo declarado'}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <span>{integration.type || 'tipo no declarado'}</span>
                  <span>{integration.requiredNow ? 'requerida ahora' : 'no requerida ahora'}</span>
                  <span>
                    {integration.approvalRequired
                      ? 'requiere aprobación'
                      : 'sin aprobación previa'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}

const sanitizeSafeFirstDeliveryText = (value: string) =>
  normalizeOptionalString(value)
    .replace(/ecommerce/gi, 'experiencia comercial')
    .replace(/marketplace/gi, 'experiencia de catálogo')
    .replace(/carrito/gi, 'selección local')
    .replace(/checkout/gi, 'cierre simulado')
    .replace(/backoffice/gi, 'panel interno mock')
    .replace(/ordenes/gi, 'resumenes de pedidos mock')
    .replace(/órdenes/gi, 'resumenes de pedidos mock')
    .replace(/pagos?\s+reales?/gi, 'cobros reales')
    .replace(/pasarela\s+de\s+pagos/gi, 'pasarela externa')
    .replace(/autenticaci[oó]n\s+real/gi, 'acceso autenticado real')
    .replace(/base\s+de\s+datos\s+real/gi, 'persistencia real')
    .replace(/\s+/g, ' ')
    .trim()

const buildSafeFirstDeliveryPlanFingerprint = (
  plan?: SafeFirstDeliveryPlanContract | null,
) => {
  if (!plan) {
    return ''
  }

  return [
    normalizeOptionalStringArray(plan.scope).join('|'),
    normalizeOptionalStringArray(plan.modules).join('|'),
    normalizeOptionalStringArray(plan.mockData).join('|'),
    normalizeOptionalStringArray(plan.screens).join('|'),
    normalizeOptionalStringArray(plan.localBehavior).join('|'),
    normalizeOptionalStringArray(plan.explicitExclusions).join('|'),
    normalizeOptionalStringArray(plan.successCriteria).join('|'),
  ].join('::')
}

const SAFE_FIRST_DELIVERY_GENERIC_MODULE_LABELS = new Set([
  'panel operativo',
  'panel operativo inicial',
  'reportes',
  'reportes mock',
  'seguimiento',
  'estados',
  'entidades principales',
  'comunicaciones mock',
])

const extractDistinctiveSafeFirstDeliveryModules = (
  modules?: string[] | null,
) =>
  normalizeOptionalStringArray(modules).filter(
    (value) =>
      value &&
      !SAFE_FIRST_DELIVERY_GENERIC_MODULE_LABELS.has(
        value.trim().toLocaleLowerCase(),
      ),
  )

const buildMaterializationPlanCoherenceIssue = ({
  sourcePlan,
  metadata,
}: {
  sourcePlan: SafeFirstDeliveryPlanContract
  metadata: PlannerExecutionMetadata
}) => {
  const materializationDecisionDetected =
    isSafeFirstDeliveryMaterializationDecision(metadata.decisionKey) ||
    isSafeFirstDeliveryMaterializationDecision(metadata.strategy)

  if (!materializationDecisionDetected) {
    return 'El planificador no devolvió un materialize-safe-first-delivery-plan válido.'
  }

  const sourceDistinctiveModules = extractDistinctiveSafeFirstDeliveryModules(
    sourcePlan.modules,
  )
  const responseDistinctiveModules = extractDistinctiveSafeFirstDeliveryModules(
    metadata.safeFirstDeliveryMaterialization?.modules ||
      metadata.safeFirstDeliveryPlan?.modules ||
      [],
  )

  if (
    sourceDistinctiveModules.length > 0 &&
    responseDistinctiveModules.length > 0 &&
    !sourceDistinctiveModules.some((moduleName) =>
      responseDistinctiveModules.includes(moduleName),
    )
  ) {
    return `El plan materializable devuelto no coincide con el plan fuente activo. Fuente: ${sourceDistinctiveModules.join(
      ', ',
    )}. Devuelto: ${responseDistinctiveModules.join(', ')}.`
  }

  return ''
}

const buildSafeFirstDeliveryPlanningPrompt = ({
  architecture,
  originalGoal,
  originalContext,
}: {
  architecture: ProductArchitectureContract
  originalGoal: string
  originalContext: string
}) => {
  const safeFirstDeliveryItems = normalizeOptionalStringArray(
    architecture.safeFirstDelivery,
  )
    .map(sanitizeSafeFirstDeliveryText)
    .filter(Boolean)
  const phaseReference =
    normalizeOptionalStringArray(architecture.phases)[0] || 'fase inicial acotada'
  const sanitizedOriginalGoal = sanitizeSafeFirstDeliveryText(originalGoal)
  const domainLabel = normalizeOptionalString(architecture.domain)
  const safeDeliverySummary =
    safeFirstDeliveryItems.length > 0
      ? safeFirstDeliveryItems.join('; ')
      : 'una base local navegable y un alcance acotado para validar la primera fase'
  const planningGoal = [
    'Planificar una primera entrega segura, local y mock del objetivo actual.',
    safeDeliverySummary,
    'No reanalizar toda la arquitectura ni devolver otro product-architecture-plan; proponer un plan acotado, revisable y materializable solo para esta primera fase.',
  ].join(' ')
  const planningContextLines = [
    `Objetivo original: ${sanitizedOriginalGoal || 'No definido'}.`,
    domainLabel
      ? `Dominio de referencia: ${domainLabel}.`
      : 'Tipo de referencia: producto complejo con alcance acotado.',
    `Fase de referencia: ${phaseReference}.`,
    safeFirstDeliveryItems.length > 0
      ? `Primera entrega segura priorizada: ${safeFirstDeliveryItems.join(' | ')}.`
      : '',
    normalizeOptionalStringArray(architecture.criticalRisks).length > 0
      ? `Riesgos a contener: ${normalizeOptionalStringArray(
          architecture.criticalRisks,
        )
          .slice(0, 3)
          .map((item) => sanitizeSafeFirstDeliveryText(item))
          .join(' | ')}.`
      : '',
    normalizeOptionalStringArray(architecture.approvalRequiredFor).length > 0
      ? `Temas que quedan fuera de aprobación en esta fase: ${normalizeOptionalStringArray(
          architecture.approvalRequiredFor,
        )
          .slice(0, 3)
          .map((item) => sanitizeSafeFirstDeliveryText(item))
          .join(' | ')}.`
      : '',
    'Restricciones obligatorias: usar mocks, datos de muestra y flujo local; sin cobros reales, sin secretos reales, sin callbacks externos reales, sin deploy, sin migraciones, sin acceso autenticado real, sin persistencia real y sin conectar servicios externos sensibles.',
    'Si aparece algo sensible, reemplazarlo por simulación local o dejarlo explícitamente fuera de alcance.',
    'Esperado del siguiente plan: una propuesta ejecutable posterior, acotada a la primera entrega segura, lista para revision manual antes de cualquier ejecucion.',
    normalizeOptionalString(originalContext)
      ? `Contexto previo del operador: ${sanitizeSafeFirstDeliveryText(
          normalizeOptionalString(originalContext),
        )}.`
      : '',
  ].filter(Boolean)

  return {
    goal: planningGoal,
    context: planningContextLines.join('\n'),
  }
}

const buildSafeFirstDeliveryMaterializationPrompt = ({
  plan,
  originalGoal,
  originalContext,
}: {
  plan: SafeFirstDeliveryPlanContract
  originalGoal: string
  originalContext: string
}) => {
  const scopeItems = normalizeOptionalStringArray(plan.scope)
    .map(sanitizeSafeFirstDeliveryText)
    .filter(Boolean)
  const moduleItems = normalizeOptionalStringArray(plan.modules)
    .map(sanitizeSafeFirstDeliveryText)
    .filter(Boolean)
  const mockDataItems = normalizeOptionalStringArray(plan.mockData)
    .map(sanitizeSafeFirstDeliveryText)
    .filter(Boolean)
  const screenItems = normalizeOptionalStringArray(plan.screens)
    .map(sanitizeSafeFirstDeliveryText)
    .filter(Boolean)
  const behaviorItems = normalizeOptionalStringArray(plan.localBehavior)
    .map(sanitizeSafeFirstDeliveryText)
    .filter(Boolean)
  const exclusionItems = normalizeOptionalStringArray(plan.explicitExclusions)
    .map(sanitizeSafeFirstDeliveryText)
    .filter(Boolean)
  const successCriteriaItems = normalizeOptionalStringArray(plan.successCriteria)
    .map(sanitizeSafeFirstDeliveryText)
    .filter(Boolean)
  const scopeSummary =
    scopeItems.length > 0
      ? scopeItems.join('; ')
      : 'una primera entrega segura y navegable del flujo principal'
  const materializationGoal = [
    'Materializar una primera entrega segura y acotada del objetivo actual dentro de una carpeta nueva del workspace.',
    scopeSummary,
    'No devolver otro safe-first-delivery-plan ni otro product-architecture-plan; devolver un plan materializable, acotado y revisable antes de ejecutar.',
  ].join(' ')
  const materializationContextLines = [
    `Objetivo original: ${sanitizeSafeFirstDeliveryText(originalGoal) || 'No definido'}.`,
    moduleItems.length > 0
      ? `Modulos que si entran: ${moduleItems.join(' | ')}.`
      : '',
    screenItems.length > 0
      ? `Pantallas o vistas prioritarias: ${screenItems.join(' | ')}.`
      : '',
    mockDataItems.length > 0
      ? `Datos mock obligatorios: ${mockDataItems.join(' | ')}.`
      : '',
    behaviorItems.length > 0
      ? `Comportamiento local esperado: ${behaviorItems.join(' | ')}.`
      : '',
    exclusionItems.length > 0
      ? `Exclusiones obligatorias: ${exclusionItems.join(' | ')}.`
      : '',
    successCriteriaItems.length > 0
      ? `Criterios de exito: ${successCriteriaItems.join(' | ')}.`
      : '',
    'La materializacion debe quedar acotada a archivos locales dentro del workspace, con frontend navegable, datos mock editables y sin conexiones externas reales.',
    'No usar pagos reales, credenciales reales, webhooks reales, deploy, migraciones, auth real, base de datos real, datos sensibles reales ni integraciones externas reales.',
    'El siguiente resultado debe ser un plan ejecutable y acotado, con carpeta destino y archivos permitidos claros, pero sin ejecutar cambios automaticamente.',
    normalizeOptionalString(originalContext)
      ? `Contexto previo del operador: ${sanitizeSafeFirstDeliveryText(
          normalizeOptionalString(originalContext),
        )}.`
      : '',
  ].filter(Boolean)

  return {
    goal: materializationGoal,
    context: materializationContextLines.join('\n'),
  }
}

const buildFrontendProjectMaterializationCoherenceIssue = ({
  sourcePlan,
  metadata,
}: {
  sourcePlan: ScalableDeliveryPlanContract
  metadata: PlannerExecutionMetadata
}) => {
  const materializationDecisionDetected =
    isFrontendProjectMaterializationDecision(metadata.decisionKey) ||
    isFrontendProjectMaterializationDecision(metadata.strategy)

  if (!materializationDecisionDetected) {
    return 'El planificador no devolvio un materialize-frontend-project-plan valido.'
  }

  if (
    normalizeOptionalString(metadata.executionMode).toLocaleLowerCase() !== 'executor'
  ) {
    return 'El plan materializable frontend no quedo marcado para executor.'
  }

  if (
    normalizeOptionalString(metadata.nextExpectedAction).toLocaleLowerCase() !==
    'execute-plan'
  ) {
    return 'El plan materializable frontend no quedo listo para execute-plan.'
  }

  if (!metadata.executionScope?.allowedTargetPaths?.length) {
    return 'El plan materializable frontend no devolvio allowedTargetPaths.'
  }

  if (!metadata.materializationPlan) {
    return 'El plan materializable frontend no devolvio materializationPlan.'
  }

  const sourceRootPath = normalizeOptionalStringArray(sourcePlan.allowedRootPaths)[0]
  const returnedRootPath =
    normalizeOptionalStringArray(metadata.executionScope?.allowedTargetPaths)[0]

  if (
    sourceRootPath &&
    returnedRootPath &&
    normalizeOptionalString(sourceRootPath).toLocaleLowerCase() !==
      normalizeOptionalString(returnedRootPath).toLocaleLowerCase()
  ) {
    return `El root permitido del plan materializable no coincide con el plan frontend activo. Fuente: ${sourceRootPath}. Devuelto: ${returnedRootPath}.`
  }

  return ''
}

const buildFullstackLocalMaterializationCoherenceIssue = ({
  sourcePlan,
  metadata,
}: {
  sourcePlan: ScalableDeliveryPlanContract
  metadata: PlannerExecutionMetadata
}) => {
  const materializationDecisionDetected =
    normalizeOptionalString(metadata.decisionKey).toLocaleLowerCase() ===
      'materialize-fullstack-local-plan' ||
    normalizeOptionalString(metadata.strategy).toLocaleLowerCase() ===
      'materialize-fullstack-local-plan'

  if (!materializationDecisionDetected) {
    return 'El planificador no devolvio un materialize-fullstack-local-plan valido.'
  }

  if (
    normalizeOptionalString(metadata.executionMode).toLocaleLowerCase() !== 'executor'
  ) {
    return 'El plan materializable fullstack no quedo marcado para executor.'
  }

  if (
    normalizeOptionalString(metadata.nextExpectedAction).toLocaleLowerCase() !==
    'execute-plan'
  ) {
    return 'El plan materializable fullstack no quedo listo para execute-plan.'
  }

  if (!metadata.executionScope?.allowedTargetPaths?.length) {
    return 'El plan materializable fullstack no devolvio allowedTargetPaths.'
  }

  if (!metadata.materializationPlan) {
    return 'El plan materializable fullstack no devolvio materializationPlan.'
  }

  const sourceRootPath = normalizeOptionalStringArray(sourcePlan.allowedRootPaths)[0]
  const returnedRootPath =
    normalizeOptionalStringArray(metadata.executionScope?.allowedTargetPaths)[0]

  if (
    sourceRootPath &&
    returnedRootPath &&
    normalizeOptionalString(sourceRootPath).toLocaleLowerCase() !==
      normalizeOptionalString(returnedRootPath).toLocaleLowerCase()
  ) {
    return `El root permitido del plan materializable no coincide con el plan fullstack activo. Fuente: ${sourceRootPath}. Devuelto: ${returnedRootPath}.`
  }

  return ''
}

const buildFrontendProjectMaterializationPrompt = ({
  plan,
  originalGoal,
  originalContext,
}: {
  plan: ScalableDeliveryPlanContract
  originalGoal: string
  originalContext: string
}) => {
  const allowedRootPaths = normalizeOptionalStringArray(plan.allowedRootPaths)
  const targetStructure = normalizeOptionalStringArray(plan.targetStructure)
  const directories = normalizeOptionalStringArray(plan.directories)
  const filesToCreate = Array.isArray(plan.filesToCreate)
    ? plan.filesToCreate
        .map((entry) => normalizeOptionalString(entry.path))
        .filter(Boolean)
    : []
  const constraints = normalizeOptionalStringArray(plan.localOnlyConstraints)
  const exclusions = normalizeOptionalStringArray(plan.explicitExclusions)
  const successCriteria = normalizeOptionalStringArray(plan.successCriteria)
  const targetRoot =
    allowedRootPaths[0] ||
    normalizeOptionalString(targetStructure[0]).replace(/[\\/]+$/g, '') ||
    'frontend-project-local'

  return {
    goal: [
      'Preparar la materializacion controlada de un frontend-project local y revisable dentro de una carpeta nueva del workspace.',
      'No devolver otro scalable-delivery-plan.',
      'No devolver materialize-safe-first-delivery-plan.',
      'Devolver un materialize-frontend-project-plan ejecutable por el executor local deterministico.',
    ].join(' '),
    context: [
      `Objetivo original: ${normalizeOptionalString(originalGoal) || 'No definido'}.`,
      normalizeOptionalString(originalContext)
        ? `Contexto previo del operador: ${normalizeOptionalString(originalContext)}.`
        : '',
      'sourceStrategy: scalable-delivery-plan.',
      'sourceNextExpectedAction: review-scalable-delivery.',
      'deliveryLevel: frontend-project.',
      'accion requerida: materializar frontend-project.',
      'modo esperado: scaffold frontend local, estatico y revisable.',
      `allowedRootPaths: ${allowedRootPaths.join(', ') || targetRoot}.`,
      targetStructure.length > 0
        ? `targetStructure: ${targetStructure.join(' | ')}.`
        : '',
      directories.length > 0 ? `directories: ${directories.join(' | ')}.` : '',
      filesToCreate.length > 0 ? `filesToCreate: ${filesToCreate.join(' | ')}.` : '',
      constraints.length > 0
        ? `localOnlyConstraints: ${constraints.join(' | ')}.`
        : '',
      exclusions.length > 0 ? `explicitExclusions: ${exclusions.join(' | ')}.` : '',
      successCriteria.length > 0
        ? `successCriteria: ${successCriteria.join(' | ')}.`
        : '',
      'Materializar solo: package.json, index.html, README.md, src/main.js, src/styles.css, src/mock-data.js y src/components/App.js.',
      'Sin npm install, sin node_modules, sin backend real, sin base de datos real, sin deploy y sin integraciones externas.',
      `Usar la carpeta objetivo ${targetRoot} como raiz del scaffold.`,
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

const buildFullstackLocalMaterializationPrompt = ({
  plan,
  originalGoal,
  originalContext,
}: {
  plan: ScalableDeliveryPlanContract
  originalGoal: string
  originalContext: string
}) => {
  const allowedRootPaths = normalizeOptionalStringArray(plan.allowedRootPaths)
  const targetStructure = normalizeOptionalStringArray(plan.targetStructure)
  const directories = normalizeOptionalStringArray(plan.directories)
  const filesToCreate = Array.isArray(plan.filesToCreate)
    ? plan.filesToCreate
        .map((entry) => normalizeOptionalString(entry.path))
        .filter(Boolean)
    : []
  const constraints = normalizeOptionalStringArray(plan.localOnlyConstraints)
  const exclusions = normalizeOptionalStringArray(plan.explicitExclusions)
  const successCriteria = normalizeOptionalStringArray(plan.successCriteria)
  const targetRoot =
    allowedRootPaths[0] ||
    normalizeOptionalString(targetStructure[0]).replace(/[\\/]+$/g, '') ||
    'fullstack-local'

  return {
    goal: [
      'Preparar la materializacion controlada de un fullstack-local local y revisable dentro de una carpeta nueva del workspace.',
      'No devolver otro scalable-delivery-plan.',
      'No devolver materialize-safe-first-delivery-plan.',
      'No devolver materialize-frontend-project-plan.',
      'Devolver un materialize-fullstack-local-plan ejecutable por el executor local deterministico.',
    ].join(' '),
    context: [
      `Objetivo original: ${normalizeOptionalString(originalGoal) || 'No definido'}.`,
      normalizeOptionalString(originalContext)
        ? `Contexto previo del operador: ${normalizeOptionalString(originalContext)}.`
        : '',
      'sourceStrategy: scalable-delivery-plan.',
      'sourceNextExpectedAction: review-scalable-delivery.',
      'deliveryLevel: fullstack-local.',
      'accion requerida: materializar fullstack-local.',
      'modo esperado: scaffold fullstack local, estatico y revisable.',
      `allowedRootPaths: ${allowedRootPaths.join(', ') || targetRoot}.`,
      targetStructure.length > 0
        ? `targetStructure: ${targetStructure.join(' | ')}.`
        : '',
      directories.length > 0 ? `directories: ${directories.join(' | ')}.` : '',
      filesToCreate.length > 0 ? `filesToCreate: ${filesToCreate.join(' | ')}.` : '',
      constraints.length > 0
        ? `localOnlyConstraints: ${constraints.join(' | ')}.`
        : '',
      exclusions.length > 0 ? `explicitExclusions: ${exclusions.join(' | ')}.` : '',
      successCriteria.length > 0
        ? `successCriteria: ${successCriteria.join(' | ')}.`
        : '',
      'Materializar solo un scaffold local con README.md, package.json raiz, frontend/, backend/, shared/, database/, scripts/ y docs/.',
      'Sin npm install, sin node_modules, sin backend real activo, sin base de datos real activa, sin Docker, sin deploy y sin integraciones externas.',
      `Usar la carpeta objetivo ${targetRoot} como raiz del scaffold.`,
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

function ResultSectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {title}
        </div>
        {description ? (
          <div className="text-sm leading-6 text-slate-400">{description}</div>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </article>
  )
}

function ResultStatusBadge({
  label,
  tone = 'default',
}: {
  label: string
  tone?: 'default' | 'sky' | 'emerald' | 'amber' | 'rose'
}) {
  const toneClassName =
    tone === 'sky'
      ? 'border-sky-300/20 bg-sky-300/10 text-sky-100'
      : tone === 'emerald'
        ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
        : tone === 'amber'
          ? 'border-amber-300/20 bg-amber-300/10 text-amber-100'
          : tone === 'rose'
            ? 'border-rose-300/20 bg-rose-300/10 text-rose-100'
            : 'border-white/10 bg-white/5 text-slate-100'

  return (
    <span
      className={joinClasses(
        'inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]',
        toneClassName,
      )}
    >
      {label}
    </span>
  )
}

function ResultKeyValueGrid({
  items,
}: {
  items: Array<{
    label: string
    value: string
    detail?: string
  }>
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {item.label}
          </div>
          <div className="mt-2 text-sm font-medium leading-6 text-slate-100">
            {item.value}
          </div>
          {item.detail ? (
            <div className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function DetailDialog({
  open,
  title,
  description,
  onClose,
  maxWidthClassName = 'max-w-4xl',
  children,
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  maxWidthClassName?: string
  children: ReactNode
}) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/72 px-4 py-5 backdrop-blur-sm sm:px-6">
      <div
        className={joinClasses(
          'flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)]',
          maxWidthClassName,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <div className="text-xl font-semibold text-white">{title}</div>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-5 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  )
}

const buildPlannerFeedbackPayload = (
  feedback: OrchestratorPlannerFeedback,
) =>
  `${ORCHESTRATOR_PLANNER_FEEDBACK_PREFIX}${JSON.stringify(feedback)}`

const WINDOWS_1252_ENCODE_MAP = new Map<number, number>([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
])

const countMojibakeMarkers = (value: string) =>
  (value.match(/\u00c3|\u00c2|\u00e2\u20ac|\u00ef\u00bf|\u00c6\u2019|\ufffd/g) || [])
    .length

const encodeWindows1252Bytes = (value: string) => {
  const bytes: number[] = []

  for (const character of value) {
    const codePoint = character.codePointAt(0)

    if (typeof codePoint !== 'number') {
      return null
    }

    if (codePoint <= 0xff) {
      bytes.push(codePoint)
      continue
    }

    const mappedByte = WINDOWS_1252_ENCODE_MAP.get(codePoint)

    if (typeof mappedByte !== 'number') {
      return null
    }

    bytes.push(mappedByte)
  }

  return Uint8Array.from(bytes)
}

const repairMojibakeText = (value: unknown) => {
  if (typeof value !== 'string' || !value) {
    return typeof value === 'string' ? value : ''
  }

  let currentValue = value

  for (let iteration = 0; iteration < 4; iteration += 1) {
    const currentMarkerCount = countMojibakeMarkers(currentValue)

    if (currentMarkerCount === 0) {
      break
    }

    const encodedBytes = encodeWindows1252Bytes(currentValue)

    if (!encodedBytes) {
      break
    }

    const candidateValue = new TextDecoder('utf-8', { fatal: false }).decode(
      encodedBytes,
    )

    if (countMojibakeMarkers(candidateValue) >= currentMarkerCount) {
      break
    }

    currentValue = candidateValue
  }

  return currentValue
}

const sanitizePersistedValue = <T,>(value: T, depth = 0): T => {
  if (depth > 6 || value == null) {
    return value
  }

  if (typeof value === 'string') {
    return repairMojibakeText(value) as T
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizePersistedValue(entry, depth + 1)) as T
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        sanitizePersistedValue(entry, depth + 1),
      ]),
    ) as T
  }

  return value
}

const normalizeOptionalString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const normalizeBrainCostMode = (value: unknown): BrainCostMode => {
  if (typeof value !== 'string' || !value.trim()) {
    return DEFAULT_BRAIN_COST_MODE
  }

  const normalizedValue = value.trim().toLocaleLowerCase()

  if (
    normalizedValue === 'cheap' ||
    normalizedValue === 'balanced' ||
    normalizedValue === 'smart' ||
    normalizedValue === 'max-quality'
  ) {
    return normalizedValue
  }

  if (
    normalizedValue === 'low' ||
    normalizedValue === 'local-first' ||
    normalizedValue === 'local_first'
  ) {
    return 'cheap'
  }

  if (
    normalizedValue === 'max_quality' ||
    normalizedValue === 'maxquality' ||
    normalizedValue === 'quality'
  ) {
    return 'max-quality'
  }

  return DEFAULT_BRAIN_COST_MODE
}

const normalizeOptionalStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string => typeof entry === 'string' && entry.trim() !== '',
      )
    : []

const summarizeInlineText = (value: unknown, maxLength = 120) => {
  const normalizedValue = normalizeOptionalString(value).replace(/\s+/g, ' ')

  if (!normalizedValue) {
    return 'No disponible'
  }

  return normalizedValue.length > maxLength
    ? `${normalizedValue.slice(0, Math.max(1, maxLength - 3))}...`
    : normalizedValue
}

const mergeUniqueStringValues = (
  currentValues: string[],
  incomingValues: unknown,
  limit = 10,
) => {
  const mergedValues = [...currentValues]

  normalizeOptionalStringArray(incomingValues).forEach((value) => {
    if (!mergedValues.includes(value)) {
      mergedValues.push(value)
    }
  })

  return mergedValues.slice(0, limit)
}

const summarizeContinuationAnchor = (
  continuationAnchor?: ExecutorContinuationAnchor | null,
) => {
  if (!continuationAnchor) {
    return ''
  }

  if (normalizeOptionalString(continuationAnchor.targetPath)) {
    if (normalizeOptionalString(continuationAnchor.subtask)) {
      return `${normalizeOptionalString(continuationAnchor.targetPath)} (${normalizeOptionalString(
        continuationAnchor.subtask,
      )})`
    }

    return normalizeOptionalString(continuationAnchor.targetPath)
  }

  return (
    normalizeOptionalString(continuationAnchor.subtask) ||
    normalizeOptionalString(continuationAnchor.action)
  )
}

const summarizeExecutionScope = (executionScope?: ExecutorExecutionScope | null) => {
  if (!executionScope) {
    return ''
  }

  const parts = [
    normalizeOptionalString(executionScope.objectiveScope),
    normalizeOptionalStringArray(executionScope.allowedTargetPaths).length > 0
      ? `${normalizeOptionalStringArray(executionScope.allowedTargetPaths).length} path(s) permitido(s)`
      : '',
    executionScope.enforceNarrowScope === true ? 'scope acotado' : '',
  ].filter(Boolean)

  return parts.join(' · ')
}

const normalizePathValue = (value: unknown) =>
  normalizeOptionalString(value).replace(/\//g, '\\')

const formatWorkspaceRelativePath = (value: unknown, workspaceRoot: unknown) => {
  const normalizedPath = normalizePathValue(value)
  const normalizedWorkspaceRoot = normalizePathValue(workspaceRoot)

  if (!normalizedPath) {
    return ''
  }

  if (!normalizedWorkspaceRoot) {
    return normalizedPath
  }

  const normalizedPathLower = normalizedPath.toLocaleLowerCase()
  const normalizedWorkspaceRootLower = normalizedWorkspaceRoot.toLocaleLowerCase()

  if (normalizedPathLower === normalizedWorkspaceRootLower) {
    return '.'
  }

  if (normalizedPathLower.startsWith(`${normalizedWorkspaceRootLower}\\`)) {
    return normalizedPath.slice(normalizedWorkspaceRoot.length + 1)
  }

  return normalizedPath
}

const getPathLeafName = (value: string) => {
  const normalizedValue = normalizePathValue(value)

  if (!normalizedValue) {
    return ''
  }

  const pathSegments = normalizedValue.split('\\').filter(Boolean)
  return pathSegments[pathSegments.length - 1] || normalizedValue
}

const getPathParentValue = (value: string) => {
  const normalizedValue = normalizePathValue(value)
  const lastSeparatorIndex = normalizedValue.lastIndexOf('\\')

  if (lastSeparatorIndex <= 0) {
    return ''
  }

  return normalizedValue.slice(0, lastSeparatorIndex)
}

const isLikelyFilePath = (value: string) =>
  /\.[a-z0-9_-]{1,12}$/i.test(getPathLeafName(value))

const buildComparablePath = (value: unknown, workspaceRoot: unknown) =>
  normalizePathValue(formatWorkspaceRelativePath(value, workspaceRoot)).toLocaleLowerCase()

const derivePrimaryAffectedPath = ({
  createdPaths,
  touchedPaths,
  currentTargetPath,
}: {
  createdPaths: string[]
  touchedPaths: string[]
  currentTargetPath?: string
}) => {
  const createdFolderPath = createdPaths.find((pathValue) => !isLikelyFilePath(pathValue))

  if (createdFolderPath) {
    return createdFolderPath
  }

  const normalizedCurrentTargetPath = normalizePathValue(currentTargetPath)

  if (normalizedCurrentTargetPath) {
    return isLikelyFilePath(normalizedCurrentTargetPath)
      ? getPathParentValue(normalizedCurrentTargetPath)
      : normalizedCurrentTargetPath
  }

  const touchedFolderPath = touchedPaths.find((pathValue) => !isLikelyFilePath(pathValue))

  if (touchedFolderPath) {
    return touchedFolderPath
  }

  const firstAffectedPath = createdPaths[0] || touchedPaths[0] || ''

  if (!firstAffectedPath) {
    return ''
  }

  return isLikelyFilePath(firstAffectedPath)
    ? getPathParentValue(firstAffectedPath)
    : firstAffectedPath
}

const isSafeFirstDeliveryMaterializationDecision = (value: unknown) =>
  normalizeOptionalString(value).toLocaleLowerCase() ===
  'materialize-safe-first-delivery-plan'

const isFrontendProjectMaterializationDecision = (value: unknown) =>
  normalizeOptionalString(value).toLocaleLowerCase() ===
  'materialize-frontend-project-plan'

const parseMaterializationExecutionStats = (value: string) => {
  const normalizedValue = normalizeOptionalString(value)
  const operationsMatch = normalizedValue.match(/Operaciones aplicadas:\s*(\d+)/i)
  const validationsMatch = normalizedValue.match(/Validaciones:\s*(\d+)/i)

  return {
    operationsCount: operationsMatch ? Number(operationsMatch[1]) || 0 : 0,
    validationsCount: validationsMatch ? Number(validationsMatch[1]) || 0 : 0,
  }
}

const deriveResultStatusPresentation = ({
  runStatus,
  requestState,
  sessionStatus,
  finalStatus,
}: {
  runStatus?: ExecutionRunSummary['status'] | null
  requestState?: 'idle' | 'running' | 'success' | 'error'
  sessionStatus?: string
  finalStatus?: string
}): {
  label: string
  tone: 'default' | 'sky' | 'emerald' | 'amber' | 'rose'
  detail: string
} => {
  const normalizedSessionStatus = normalizeOptionalString(sessionStatus).toLocaleLowerCase()
  const normalizedFinalStatus = normalizeOptionalString(finalStatus)
  const normalizedFinalStatusLower = normalizedFinalStatus.toLocaleLowerCase()

  if (
    runStatus === 'error' ||
    requestState === 'error' ||
    normalizedSessionStatus.includes('error')
  ) {
    return {
      label: 'Error',
      tone: 'rose',
      detail: normalizedFinalStatus || 'La corrida termino con un error.',
    }
  }

  if (runStatus === 'success' || requestState === 'success') {
    const successDetail =
      normalizedFinalStatus &&
      normalizedFinalStatusLower !== 'ejecucion completada' &&
      normalizedFinalStatusLower !== 'ejecución completada'
        ? normalizedFinalStatus
        : 'La corrida terminó correctamente.'

    return {
      label: 'Ejecución completada',
      tone: 'emerald',
      detail: successDetail,
    }
  }

  if (
    runStatus === 'approval-pending' ||
    runStatus === 'recovery-pending' ||
    runStatus === 'running' ||
    requestState === 'running'
  ) {
    return {
      label: 'Parcial',
      tone: 'amber',
      detail:
        normalizedFinalStatus ||
        normalizeOptionalString(sessionStatus) ||
        'La corrida sigue abierta.',
    }
  }

  return {
    label: 'Sin cierre confirmado',
    tone: 'default',
    detail:
      normalizedFinalStatus ||
      normalizeOptionalString(sessionStatus) ||
      'No hay un cierre consolidado.',
  }
}

const getBrainCostModeLabel = (value: BrainCostMode) =>
  BRAIN_COST_MODE_OPTIONS.find((option) => option.value === value)?.label ||
  BRAIN_COST_MODE_OPTIONS.find(
    (option) => option.value === DEFAULT_BRAIN_COST_MODE,
  )?.label ||
  'Equilibrado'

const getBrainRoutingSeverityLabel = (
  value?: 'low' | 'medium' | 'high',
  fallback = 'No disponible',
) => {
  if (value === 'low') {
    return 'Bajo'
  }

  if (value === 'medium') {
    return 'Medio'
  }

  if (value === 'high') {
    return 'Alto'
  }

  return fallback
}

const getBrainProviderLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'openai') {
    return 'OpenAI'
  }

  if (normalizedValue === 'local-rules') {
    return 'Reglas locales'
  }

  return normalizeOptionalString(value) || 'No disponible'
}

const getBrainRoutingModeLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'forced') {
    return 'Forzado'
  }

  if (normalizedValue === 'hinted') {
    return 'Con preferencia explícita'
  }

  if (normalizedValue === 'cheap-policy') {
    return 'Política económica'
  }

  if (normalizedValue === 'balanced-policy') {
    return 'Política equilibrada'
  }

  if (normalizedValue === 'smart-policy') {
    return 'Política inteligente'
  }

  if (normalizedValue === 'max-quality-policy') {
    return 'Política de máxima calidad'
  }

  return normalizeOptionalString(value) || 'No definida'
}

const getBrainProblemNatureLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return 'No clasificada'
  }

  if (normalizedValue === 'forced-openai') {
    return 'Forzada a OpenAI'
  }

  if (normalizedValue === 'forced-local') {
    return 'Forzada a reglas locales'
  }

  if (normalizedValue === 'hinted-openai') {
    return 'Sugerida hacia OpenAI'
  }

  if (normalizedValue === 'hinted-local') {
    return 'Sugerida hacia reglas locales'
  }

  if (normalizedValue.includes('deterministic-composite')) {
    return 'Tarea determinística compuesta'
  }

  if (normalizedValue.includes('deterministic-atomic')) {
    return 'Tarea determinística puntual'
  }

  if (normalizedValue.includes('recoverable-error')) {
    return 'Error recuperable'
  }

  if (normalizedValue.includes('creative-web')) {
    return 'Web creativa'
  }

  if (normalizedValue.includes('open-ended')) {
    return 'Pedido abierto'
  }

  if (normalizedValue.includes('trivial-local')) {
    return 'Pedido trivial local'
  }

  if (normalizedValue === 'review-safe-first-delivery') {
    return 'Revisar primera entrega segura'
  }

  if (normalizedValue === 'review-scalable-delivery') {
    return 'Revisar plan escalable'
  }

  if (normalizedValue === 'review-product-architecture') {
    return 'Revisar arquitectura propuesta'
  }

  if (normalizedValue === 'scalable-delivery-plan') {
    return 'Plan escalable local'
  }

  return normalizeOptionalString(value).replace(/-/g, ' ')
}

const getExecutionModeLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'planner-only') {
    return 'Plan revisable'
  }

  if (normalizedValue === 'local-fast' || normalizedValue === 'local_fast') {
    return 'Ruta rápida local'
  }

  if (normalizedValue === 'ask-user' || normalizedValue === 'user-clarification') {
    return 'Consulta al usuario'
  }

  if (normalizedValue === 'executor') {
    return 'Ejecutor real'
  }

  return normalizeOptionalString(value) || 'No definido'
}

const getNextExpectedActionLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return 'Sin siguiente acción declarada'
  }

  if (normalizedValue === 'execute-plan') {
    return 'Ejecutar el plan actual'
  }

  if (normalizedValue === 'user-approval') {
    return 'Esperar una aprobación humana'
  }

  if (normalizedValue === 'user-clarification') {
    return 'Esperar una nueva definición del usuario'
  }

  if (normalizedValue === 'scalable-delivery-plan') {
    return 'Plan escalable local'
  }

  if (normalizedValue === 'materialize-frontend-project-plan') {
    return 'Materializacion controlada de frontend project'
  }

  return normalizeOptionalString(value).replace(/-/g, ' ')
}

const getDecisionKeyLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return 'No definida'
  }

  if (normalizedValue === 'fast-local') {
    return 'Ruta rápida local'
  }

  if (normalizedValue === 'executor-general') {
    return 'Ejecución general'
  }

  if (normalizedValue === 'approval-response-rejected') {
    return 'Rechazo de aprobación'
  }

  if (normalizedValue === 'ask-user-clarification') {
    return 'Consulta al usuario'
  }

  if (normalizedValue === 'web-scaffold-base') {
    return 'Base web local'
  }

  if (normalizedValue === 'recover-single-target') {
    return 'Recuperación de objetivo acotado'
  }

  if (normalizedValue === 'recover-single-subtask') {
    return 'Recuperación de subtarea acotada'
  }

  if (normalizedValue === 'recover-and-continue') {
    return 'Recuperación y continuidad'
  }

  if (normalizedValue === 'materialize-safe-first-delivery-plan') {
    return 'Materialización segura de primera entrega'
  }

  return normalizeOptionalString(value).replace(/-/g, ' ')
}

const getPlannerStrategyLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return 'No definida'
  }

  if (normalizedValue === 'fast-local') {
    return 'Ruta rápida local'
  }

  if (normalizedValue === 'executor') {
    return 'Ejecutor real'
  }

  if (normalizedValue === 'ask-user') {
    return 'Consulta al usuario'
  }

  if (normalizedValue === 'web-scaffold-base') {
    return 'Base web local'
  }

  if (normalizedValue === 'materialize-safe-first-delivery-plan') {
    return 'Materialización segura de primera entrega'
  }

  return normalizeOptionalString(value).replace(/-/g, ' ')
}

const DELIVERY_LEVEL_LABELS: Record<string, string> = {
  'safe-first-delivery': 'Primera entrega segura',
  'frontend-project': 'Frontend project',
  'fullstack-local': 'Fullstack local',
  'monorepo-local': 'Monorepo local',
  'infra-local-plan': 'Infra local plan',
}

const getDeliveryLevelLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return 'No definido'
  }

  return (
    DELIVERY_LEVEL_LABELS[normalizedValue] ||
    normalizeOptionalString(value).replace(/-/g, ' ')
  )
}

const getDeliveryLevelTone = (
  value: unknown,
): 'default' | 'sky' | 'emerald' | 'amber' | 'rose' => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'infra-local-plan') {
    return 'amber'
  }

  if (normalizedValue === 'fullstack-local') {
    return 'emerald'
  }

  if (
    normalizedValue === 'frontend-project' ||
    normalizedValue === 'monorepo-local'
  ) {
    return 'sky'
  }

  return 'default'
}

const getScalableDeliveryPlanTypeLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return 'Plan escalable local'
  }

  if (normalizedValue === 'frontend-project') {
    return 'Proyecto frontend local'
  }

  if (normalizedValue === 'fullstack-local') {
    return 'Proyecto fullstack local'
  }

  if (normalizedValue === 'monorepo-local') {
    return 'Monorepo local'
  }

  if (normalizedValue === 'infra-local-plan') {
    return 'Infraestructura local planificada'
  }

  return 'Plan escalable local'
}

const getScalableDeliverySummary = (plan?: ScalableDeliveryPlanContract | null) => {
  if (!plan) {
    return 'JEFE detectó una entrega escalable y la dejó en revisión manual.'
  }

  const firstStructureEntry = normalizeOptionalStringArray(plan.targetStructure)[0]
  const firstDirectoryEntry = normalizeOptionalStringArray(plan.directories)[0]
  const firstFileEntry = normalizeOptionalString(plan.filesToCreate?.[0]?.path)

  return (
    firstStructureEntry ||
    firstDirectoryEntry ||
    firstFileEntry ||
    'JEFE detectó una entrega escalable y la dejó en revisión manual.'
  )
}

const getBlueprintConfidenceLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'high') {
    return 'Alta'
  }

  if (normalizedValue === 'medium') {
    return 'Media'
  }

  if (normalizedValue === 'low') {
    return 'Baja'
  }

  return normalizeOptionalString(value) || 'No definida'
}

const getQuestionPolicyModeLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'brain-decides-missing') {
    return 'El Cerebro decide faltantes menores'
  }

  if (normalizedValue === 'user-will-contribute') {
    return 'El usuario puede aportar definiciones'
  }

  if (normalizedValue === 'ask-only-if-blocking') {
    return 'Preguntar solo si bloquea'
  }

  return normalizeOptionalString(value) || 'No definida'
}

const getSensitivityLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'high') {
    return 'Alta'
  }

  if (normalizedValue === 'medium') {
    return 'Media'
  }

  if (normalizedValue === 'low') {
    return 'Baja'
  }

  if (normalizedValue === 'none') {
    return 'Nula'
  }

  return normalizeOptionalString(value) || 'No definida'
}

const getRiskLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'high') {
    return 'Alto'
  }

  if (normalizedValue === 'medium') {
    return 'Medio'
  }

  if (normalizedValue === 'low') {
    return 'Bajo'
  }

  return normalizeOptionalString(value) || 'No definido'
}

const getRiskTone = (
  value: unknown,
): 'default' | 'sky' | 'emerald' | 'amber' | 'rose' => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'high') {
    return 'rose'
  }

  if (normalizedValue === 'medium') {
    return 'amber'
  }

  if (normalizedValue === 'low') {
    return 'emerald'
  }

  return 'default'
}

const getStackProfileSummary = (blueprint?: ProjectBlueprintContract | null) => {
  if (!blueprint?.stackProfile) {
    return 'Sin stack recomendado'
  }

  return (
    [
      normalizeOptionalString(blueprint.stackProfile.frontend),
      normalizeOptionalString(blueprint.stackProfile.backend),
      normalizeOptionalString(blueprint.stackProfile.database),
    ]
      .filter(Boolean)
      .join(' · ') || 'Sin stack recomendado'
  )
}

const getTechnicalDiagnosticLabel = (value: unknown, fallback = 'No disponible') => {
  const normalizedValue = normalizeOptionalString(value)

  if (!normalizedValue) {
    return fallback
  }

  return normalizedValue
    .replace(/-/g, ' ')
    .replace(/approval/gi, 'aprobación')
    .replace(/approved/gi, 'aprobada')
    .replace(/rejected/gi, 'rechazada')
    .replace(/pending/gi, 'pendiente')
    .replace(/recovery/gi, 'recuperación')
    .replace(/recoverable/gi, 'recuperable')
    .replace(/executor/gi, 'ejecutor')
    .replace(/command/gi, 'comando')
    .replace(/failed/gi, 'fallido')
    .replace(/failure/gi, 'fallo')
    .replace(/scope/gi, 'alcance')
    .replace(/target/gi, 'objetivo')
    .replace(/subtask/gi, 'subtarea')
    .replace(/continue/gi, 'continuidad')
}

const buildPlannedCurrentStepLabel = ({
  plannerInstruction,
  executionMode,
}: {
  plannerInstruction: string
  executionMode?: string
}) => {
  const normalizedInstruction = normalizeOptionalString(plannerInstruction)
  const normalizedExecutionMode = normalizeOptionalString(executionMode)

  if (!normalizedInstruction || normalizedInstruction === DEFAULT_PLANNER_INSTRUCTION) {
    return DEFAULT_CURRENT_STEP
  }

  if (!normalizedExecutionMode) {
    return normalizedInstruction
  }

  return `La instruccion quedo lista para ${getExecutionModeLabel(
    normalizedExecutionMode,
  ).toLocaleLowerCase()}`
}

const isUserClarificationPlannerResponse = (value: {
  nextExpectedAction?: string
  executionMode?: string
  strategy?: string
}) => {
  const normalizedNextExpectedAction = normalizeOptionalString(
    value.nextExpectedAction,
  ).toLocaleLowerCase()
  const normalizedExecutionMode = normalizeOptionalString(
    value.executionMode,
  ).toLocaleLowerCase()
  const normalizedStrategy = normalizeOptionalString(value.strategy).toLocaleLowerCase()

  return (
    normalizedNextExpectedAction === 'user-clarification' ||
    normalizedExecutionMode === 'ask-user' ||
    normalizedStrategy === 'ask-user'
  )
}

const isReviewOnlyPlannerResponse = (value: {
  nextExpectedAction?: string
  executionMode?: string
  strategy?: string
  decisionKey?: string
}) => {
  const normalizedNextExpectedAction = normalizeOptionalString(
    value.nextExpectedAction,
  ).toLocaleLowerCase()
  const normalizedExecutionMode = normalizeOptionalString(
    value.executionMode,
  ).toLocaleLowerCase()
  const normalizedStrategy = normalizeOptionalString(value.strategy).toLocaleLowerCase()
  const normalizedDecisionKey = normalizeOptionalString(value.decisionKey).toLocaleLowerCase()

  return (
    normalizedExecutionMode === 'planner-only' ||
    normalizedNextExpectedAction === 'review-safe-first-delivery' ||
    normalizedNextExpectedAction === 'review-scalable-delivery' ||
    normalizedNextExpectedAction === 'review-product-architecture' ||
    normalizedNextExpectedAction === 'review-plan' ||
    normalizedStrategy === 'safe-first-delivery-plan' ||
    normalizedDecisionKey === 'safe-first-delivery-plan' ||
    normalizedStrategy === 'scalable-delivery-plan' ||
    normalizedDecisionKey === 'scalable-delivery-plan' ||
    normalizedStrategy === 'product-architecture-plan' ||
    normalizedDecisionKey === 'product-architecture-plan'
  )
}

const isFastRouteExecutionTitle = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  return (
    normalizedValue.includes('ruta') &&
    (normalizedValue.includes('rapida') || normalizedValue.includes('rápida'))
  )
}

const inferExecutionModeFromSnapshot = (
  snapshot?: ExecutorFailureContext | null,
) => {
  const normalizedMaterialState = normalizeOptionalString(
    snapshot?.materialState,
  ).toLocaleLowerCase()
  const normalizedCurrentAction = normalizeOptionalString(
    snapshot?.currentAction,
  ).toLocaleLowerCase()

  if (normalizedMaterialState.includes('local-fast')) {
    return 'local-fast'
  }

  if (
    normalizedCurrentAction === 'composite-local' ||
    normalizedCurrentAction === 'create-file' ||
    normalizedCurrentAction === 'create-folder' ||
    normalizedCurrentAction === 'append-file'
  ) {
    return 'local-fast'
  }

  return ''
}

const inferExecutionModeFromResultText = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (
    normalizedValue.includes('ruta rápida completada') ||
    normalizedValue.includes('ruta rapida completada') ||
    normalizedValue.includes('ruta rápida detectada') ||
    normalizedValue.includes('ruta rapida detectada')
  ) {
    return 'local-fast'
  }

  return ''
}

const getResolvedDecisionStatusLabel = (record?: ResolvedDecisionRecord | null) => {
  if (!record) {
    return 'Sin decision registrada'
  }

  if (record.status === 'approved') {
    return 'Aprobada'
  }

  if (record.status === 'rejected') {
    return 'Rechazada'
  }

  if (record.status === 'delegated') {
    return 'Delegada'
  }

  return 'Resuelta'
}

const deriveExecutionRunScenarioLabel = (
  summary: Pick<
    ExecutionRunSummary,
    | 'status'
    | 'recoveries'
    | 'repeatedFailureCount'
    | 'blockedRecoveryModes'
    | 'latestFailureType'
  >,
): ExecutionRunSummary['scenarioLabel'] => {
  // La UI no intenta "adivinar" el flujo completo: clasifica la corrida con
  // una heurística compacta para leer rápido si fue caso feliz, recovery o
  // bloqueo por repetición equivalente.
  if (
    summary.blockedRecoveryModes.length > 0 ||
    summary.repeatedFailureCount >= 2
  ) {
    return 'Bloqueo por repeticion equivalente'
  }

  if (summary.status === 'error') {
    return 'Corrida fallida'
  }

  if (summary.status === 'success' && summary.recoveries > 0) {
    return 'Recovery exitoso'
  }

  if (
    summary.recoveries > 0 ||
    normalizeOptionalString(summary.latestFailureType)
  ) {
    return summary.status === 'success'
      ? 'Recovery exitoso'
      : 'Falla recuperable'
  }

  if (
    summary.status === 'running' ||
    summary.status === 'approval-pending' ||
    summary.status === 'recovery-pending'
  ) {
    return 'Corrida en curso'
  }

  return 'Caso feliz base'
}

const buildExecutionRunSummary = (
  partialSummary: Omit<ExecutionRunSummary, 'scenarioLabel'>,
): ExecutionRunSummary => ({
  ...partialSummary,
  scenarioLabel: deriveExecutionRunScenarioLabel(partialSummary),
})

const normalizeResolvedDecisionKey = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLocaleLowerCase() : ''

const normalizeApprovalFamilyKey = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLocaleLowerCase() : ''

const deriveApprovalEquivalenceFamily = (...texts: unknown[]) => {
  // Mantener en sync con electron/main.cjs.
  // Si renderer y main separan familias distintas, la UI puede persistir una
  // decisión activa que el planner no reconoce (o viceversa).
  const combinedText = texts
    .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
    .join(' ')
    .toLocaleLowerCase()

  if (!combinedText) {
    return ''
  }

  const explicitlyNoDeploy =
    combinedText.includes('approve_no_deploy') ||
    combinedText.includes('repo sin deploy') ||
    combinedText.includes('sin deploy') ||
    combinedText.includes('no deploy') ||
    combinedText.includes('sin publicar') ||
    combinedText.includes('sin publicacion') ||
    combinedText.includes('sin publicación')
  const mentionsDeploy =
    combinedText.includes('deploy') ||
    combinedText.includes('github pages') ||
    combinedText.includes('publicacion') ||
    combinedText.includes('publicación') ||
    combinedText.includes('publicar') ||
    combinedText.includes('vercel') ||
    combinedText.includes('produccion') ||
    combinedText.includes('producción')
  const mentionsPublicRepo =
    combinedText.includes('repo publico') ||
    combinedText.includes('repo público') ||
    combinedText.includes('public repo') ||
    combinedText.includes('github repo') ||
    combinedText.includes('crear repo') ||
    combinedText.includes('publicar repo') ||
    combinedText.includes('subir repo') ||
    explicitlyNoDeploy
  const isProvisionalWebScaffoldApproval =
    (combinedText.includes('scaffold') || combinedText.includes('generacion')) &&
    (combinedText.includes('provisional') ||
      combinedText.includes('placeholder') ||
      combinedText.includes('mock endpoint') ||
      combinedText.includes('mock api') ||
      combinedText.includes('endpoint local') ||
      combinedText.includes('continu') ||
      combinedText.includes('clinic-website') ||
      combinedText.includes('ruta local') ||
      combinedText.includes('path local'))

  if (mentionsDeploy && !explicitlyNoDeploy) {
    return 'public-deploy'
  }

  if (mentionsPublicRepo) {
    return 'public-repo-creation'
  }

  return isProvisionalWebScaffoldApproval ? 'provisional-web-scaffold' : ''
}

const resolveLatestDecisionTimestamp = (record?: ResolvedDecisionRecord | null) =>
  normalizeOptionalString(record?.updatedAt) || new Date().toISOString()

const mergeResolvedDecisionRecords = (
  currentRecords: ResolvedDecisionRecord[],
  incomingRecords: ResolvedDecisionRecord[],
) => {
  // El estado persistido se usa como verdad operativa, así que al entrar una
  // nueva decisión de la misma familia debe reemplazar a la anterior en vez de
  // convivir con ella y dejar al planner en un estado ambiguo.
  const normalizedIncomingRecords = incomingRecords
    .map((record) => {
      const normalizedKey = normalizeResolvedDecisionKey(record?.key)

      if (!normalizedKey) {
        return null
      }

      return {
        ...record,
        key: normalizedKey,
        status:
          record?.status === 'delegated' ||
          record?.status === 'approved' ||
          record?.status === 'rejected' ||
          record?.status === 'resolved'
            ? record.status
            : 'resolved',
        approvalFamily: normalizeApprovalFamilyKey(record?.approvalFamily) || undefined,
        updatedAt: resolveLatestDecisionTimestamp(record),
      } satisfies ResolvedDecisionRecord
    })
    .filter((record): record is ResolvedDecisionRecord => record !== null)

  if (normalizedIncomingRecords.length === 0) {
    return currentRecords
  }

  const incomingKeys = new Set(
    normalizedIncomingRecords.map((record) => normalizeResolvedDecisionKey(record.key)),
  )
  const incomingFamilies = new Set(
    normalizedIncomingRecords
      .map((record) => normalizeApprovalFamilyKey(record.approvalFamily))
      .filter(Boolean),
  )
  const preservedCurrentRecords = currentRecords.filter((record) => {
    const normalizedKey = normalizeResolvedDecisionKey(record?.key)
    const normalizedFamily = normalizeApprovalFamilyKey(record?.approvalFamily)

    if (incomingKeys.has(normalizedKey)) {
      return false
    }

    if (!normalizedFamily || !incomingFamilies.has(normalizedFamily)) {
      return true
    }

    return false
  })

  return [...preservedCurrentRecords, ...normalizedIncomingRecords]
}

const extractExecutorFailureContext = (payload?: {
  failureType?: string
  executorMode?: string
  executorModeSource?: string
  bridgeMode?: string
  bridgeModeSource?: string
  details?: ExecutorFailureContext | null
} | null): ExecutorFailureContext | null => {
  const details =
    payload?.details && typeof payload.details === 'object' ? payload.details : null
  const context: ExecutorFailureContext = {
    ...(normalizeOptionalString(details?.timestamp)
      ? { timestamp: normalizeOptionalString(details?.timestamp) }
      : {}),
    ...(normalizeOptionalString(details?.decisionKey)
      ? { decisionKey: normalizeOptionalString(details?.decisionKey) }
      : {}),
    ...(normalizeOptionalString(payload?.failureType)
      ? { failureType: normalizeOptionalString(payload?.failureType) }
      : {}),
    ...(normalizeOptionalString(payload?.executorMode) ||
    normalizeOptionalString(details?.executorMode)
      ? {
          executorMode:
            normalizeOptionalString(payload?.executorMode) ||
            normalizeOptionalString(details?.executorMode),
        }
      : {}),
    ...(normalizeOptionalString(payload?.executorModeSource) ||
    normalizeOptionalString(details?.executorModeSource)
      ? {
          executorModeSource:
            normalizeOptionalString(payload?.executorModeSource) ||
            normalizeOptionalString(details?.executorModeSource),
        }
      : {}),
    ...(normalizeOptionalString(payload?.bridgeMode) ||
    normalizeOptionalString(details?.bridgeMode)
      ? {
          bridgeMode:
            normalizeOptionalString(payload?.bridgeMode) ||
            normalizeOptionalString(details?.bridgeMode),
        }
      : {}),
    ...(normalizeOptionalString(payload?.bridgeModeSource) ||
    normalizeOptionalString(details?.bridgeModeSource)
      ? {
          bridgeModeSource:
            normalizeOptionalString(payload?.bridgeModeSource) ||
            normalizeOptionalString(details?.bridgeModeSource),
        }
      : {}),
    ...(normalizeOptionalString(details?.executorCommand)
      ? { executorCommand: normalizeOptionalString(details?.executorCommand) }
      : {}),
    ...(normalizeOptionalString(details?.origin)
      ? { origin: normalizeOptionalString(details?.origin) }
      : {}),
    ...(typeof details?.stepIndex === 'number' && details.stepIndex > 0
      ? { stepIndex: details.stepIndex }
      : {}),
    ...(typeof details?.totalSteps === 'number' && details.totalSteps > 0
      ? { totalSteps: details.totalSteps }
      : {}),
    ...(normalizeOptionalString(details?.currentStep)
      ? { currentStep: normalizeOptionalString(details?.currentStep) }
      : {}),
    ...(normalizeOptionalString(details?.currentSubtask)
      ? { currentSubtask: normalizeOptionalString(details?.currentSubtask) }
      : {}),
    ...(normalizeOptionalString(details?.currentAction)
      ? { currentAction: normalizeOptionalString(details?.currentAction) }
      : {}),
    ...(normalizeOptionalString(details?.currentCommand)
      ? { currentCommand: normalizeOptionalString(details?.currentCommand) }
      : {}),
    ...(normalizeOptionalString(details?.currentTargetPath)
      ? { currentTargetPath: normalizeOptionalString(details?.currentTargetPath) }
      : {}),
    ...(normalizeOptionalStringArray(details?.createdPaths).length > 0
      ? { createdPaths: normalizeOptionalStringArray(details?.createdPaths) }
      : {}),
    ...(normalizeOptionalStringArray(details?.touchedPaths).length > 0
      ? { touchedPaths: normalizeOptionalStringArray(details?.touchedPaths) }
      : {}),
    ...(normalizeOptionalString(details?.stdout)
      ? { stdout: normalizeOptionalString(details?.stdout) }
      : {}),
    ...(normalizeOptionalString(details?.stderr)
      ? { stderr: normalizeOptionalString(details?.stderr) }
      : {}),
    ...(normalizeOptionalString(details?.lastProgressAt)
      ? { lastProgressAt: normalizeOptionalString(details?.lastProgressAt) }
      : {}),
    ...(normalizeOptionalString(details?.lastMaterialProgressAt)
      ? { lastMaterialProgressAt: normalizeOptionalString(details?.lastMaterialProgressAt) }
      : {}),
    ...(typeof details?.hasMaterialProgress === 'boolean'
      ? { hasMaterialProgress: details.hasMaterialProgress }
      : {}),
    ...(normalizeOptionalString(details?.materialState)
      ? { materialState: normalizeOptionalString(details?.materialState) }
      : {}),
    ...(normalizeOptionalString(details?.strategy)
      ? { strategy: normalizeOptionalString(details?.strategy) }
      : {}),
    ...(normalizeOptionalString(details?.brainStrategy)
      ? { brainStrategy: normalizeOptionalString(details?.brainStrategy) }
      : {}),
    ...(normalizeOptionalString(details?.reasoningLayer)
      ? { reasoningLayer: normalizeOptionalString(details?.reasoningLayer) }
      : {}),
    ...(normalizeOptionalString(details?.materializationLayer)
      ? { materializationLayer: normalizeOptionalString(details?.materializationLayer) }
      : {}),
    ...(normalizeOptionalString(details?.materializationPlanSource)
      ? {
          materializationPlanSource: normalizeOptionalString(
            details?.materializationPlanSource,
          ),
        }
      : {}),
    ...(normalizeValidationResults(details?.validationResults).length > 0
      ? { validationResults: normalizeValidationResults(details?.validationResults) }
      : {}),
    ...(normalizeOptionalString(details?.appliedReuseMode)
      ? { appliedReuseMode: normalizeOptionalString(details?.appliedReuseMode) }
      : {}),
    ...(normalizeOptionalString(details?.reusedStyleFromArtifactId)
      ? {
          reusedStyleFromArtifactId: normalizeOptionalString(
            details?.reusedStyleFromArtifactId,
          ),
        }
      : {}),
    ...(normalizeOptionalString(details?.reusedStructureFromArtifactId)
      ? {
          reusedStructureFromArtifactId: normalizeOptionalString(
            details?.reusedStructureFromArtifactId,
          ),
        }
      : {}),
    ...(normalizeOptionalStringArray(details?.reuseAppliedFields).length > 0
      ? { reuseAppliedFields: normalizeOptionalStringArray(details?.reuseAppliedFields) }
      : {}),
    ...(normalizeOptionalString(details?.acceptedAt)
      ? { acceptedAt: normalizeOptionalString(details?.acceptedAt) }
      : {}),
    ...(normalizeOptionalString(details?.attemptScope)
      ? {
          attemptScope: normalizeOptionalString(
            details?.attemptScope,
          ) as ExecutorFailureContext['attemptScope'],
        }
      : {}),
    ...(normalizeOptionalString(details?.fingerprint)
      ? { fingerprint: normalizeOptionalString(details?.fingerprint) }
      : {}),
    ...(typeof details?.isRecoveryAttempt === 'boolean'
      ? { isRecoveryAttempt: details.isRecoveryAttempt }
      : {}),
    ...(typeof details?.repeatedFailureCount === 'number' &&
    details.repeatedFailureCount > 0
      ? { repeatedFailureCount: details.repeatedFailureCount }
      : {}),
    ...(normalizeOptionalString(details?.lastAttemptScope)
      ? {
          lastAttemptScope: normalizeOptionalString(
            details?.lastAttemptScope,
          ) as ExecutorFailureContext['lastAttemptScope'],
        }
      : {}),
    ...(normalizeOptionalStringArray(details?.blockedRecoveryModes).length > 0
      ? { blockedRecoveryModes: normalizeOptionalStringArray(details?.blockedRecoveryModes) }
      : {}),
    ...(details?.lastFailure && typeof details.lastFailure === 'object'
      ? { lastFailure: extractExecutorFailureContext({ details: details.lastFailure }) || undefined }
      : {}),
    ...(Array.isArray(details?.recentFailures)
      ? {
          recentFailures: details.recentFailures
            .map((entry) => extractExecutorFailureContext({ details: entry }))
            .filter((entry): entry is ExecutorFailureContext => Boolean(entry)),
        }
      : {}),
  }

  return Object.keys(context).length > 0 ? context : null
}

const extractExecutorProgressSnapshot = (raw: unknown): ExecutorFailureContext | null => {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const payload = raw as {
    stepIndex?: number
    totalSteps?: number
    title?: string
    subtask?: string
    action?: string
    command?: string
    targetPath?: string
    createdPaths?: string[]
    touchedPaths?: string[]
    stdoutPreview?: string
    stderrPreview?: string
    emittedAt?: string
  }

  const snapshot: ExecutorFailureContext = {
    ...(typeof payload.stepIndex === 'number' && payload.stepIndex > 0
      ? { stepIndex: payload.stepIndex }
      : {}),
    ...(typeof payload.totalSteps === 'number' && payload.totalSteps > 0
      ? { totalSteps: payload.totalSteps }
      : {}),
    ...(normalizeOptionalString(payload.title)
      ? { currentStep: normalizeOptionalString(payload.title) }
      : {}),
    ...(normalizeOptionalString(payload.subtask) || normalizeOptionalString(payload.title)
      ? {
          currentSubtask:
            normalizeOptionalString(payload.subtask) ||
            normalizeOptionalString(payload.title),
        }
      : {}),
    ...(normalizeOptionalString(payload.action)
      ? { currentAction: normalizeOptionalString(payload.action) }
      : {}),
    ...(normalizeOptionalString(payload.command)
      ? { currentCommand: normalizeOptionalString(payload.command) }
      : {}),
    ...(normalizeOptionalString(payload.targetPath)
      ? { currentTargetPath: normalizeOptionalString(payload.targetPath) }
      : {}),
    ...(normalizeOptionalStringArray(payload.createdPaths).length > 0
      ? { createdPaths: normalizeOptionalStringArray(payload.createdPaths) }
      : {}),
    ...(normalizeOptionalStringArray(payload.touchedPaths).length > 0
      ? { touchedPaths: normalizeOptionalStringArray(payload.touchedPaths) }
      : {}),
    ...(normalizeOptionalString(payload.stdoutPreview)
      ? { stdout: normalizeOptionalString(payload.stdoutPreview) }
      : {}),
    ...(normalizeOptionalString(payload.stderrPreview)
      ? { stderr: normalizeOptionalString(payload.stderrPreview) }
      : {}),
    ...(normalizeOptionalString(payload.emittedAt)
      ? { lastProgressAt: normalizeOptionalString(payload.emittedAt) }
      : {}),
  }

  return Object.keys(snapshot).length > 0 ? snapshot : null
}

const buildParticipationResolvedDecisions = (
  userParticipationMode: UserParticipationMode,
): ResolvedDecisionRecord[] => {
  if (userParticipationMode !== 'brain-decides-missing') {
    return []
  }

  return [
    {
      key: 'technical-defaults',
      status: 'delegated',
      source: 'system',
      summary: 'Defaults técnicos razonables delegados al Cerebro.',
    },
    {
      key: 'placeholder-content',
      status: 'delegated',
      source: 'system',
      summary: 'Contenido placeholder permitido sin reconsulta.',
    },
    {
      key: 'provisional-assets',
      status: 'delegated',
      source: 'system',
      summary: 'Assets provisionales y stock permitidos mientras sean editables.',
    },
    {
      key: 'local-scaffold-work',
      status: 'delegated',
      source: 'system',
      summary: 'Scaffold local, rutas, hooks y componentes base permitidos.',
    },
    {
      key: 'local-branch-work',
      status: 'delegated',
      source: 'system',
      summary: 'Trabajo sobre rama local permitido sin aprobación adicional.',
    },
    {
      key: 'local-commit-work',
      status: 'delegated',
      source: 'system',
      summary: 'Commit local permitido sin aprobación adicional.',
    },
    {
      key: 'readme-env-example',
      status: 'delegated',
      source: 'system',
      summary: 'README y .env.example provisionales permitidos.',
    },
  ]
}

const extractApprovalRequest = (
  payload?: {
    approvalRequest?: ApprovalRequestContract
    question?: string
    approvalReason?: string
    reason?: string
  } | null,
): ApprovalRequestContract | null => {
  if (payload?.approvalRequest && typeof payload.approvalRequest === 'object') {
    return payload.approvalRequest
  }

  const question = normalizeOptionalString(payload?.question)
  const reason =
    normalizeOptionalString(payload?.approvalReason) ||
    normalizeOptionalString(payload?.reason)

  if (!question && !reason) {
    return null
  }

  return {
    decisionKey: 'legacy-approval',
    question,
    reason,
    allowFreeAnswer: false,
    allowBrainDefault: false,
    nextExpectedAction: 'user-approval',
    responseMode: 'binary',
  }
}

const resolveApprovalInteractionMode = (
  approvalRequest?: ApprovalRequestContract | null,
): 'binary' | 'options' | 'free-answer' | 'mixed' => {
  if (approvalRequest?.responseMode) {
    return approvalRequest.responseMode
  }

  const hasOptions =
    Array.isArray(approvalRequest?.options) && approvalRequest.options.length > 0
  const allowFreeAnswer = approvalRequest?.allowFreeAnswer === true

  if (hasOptions && allowFreeAnswer) {
    return 'mixed'
  }

  if (hasOptions) {
    return 'options'
  }

  if (allowFreeAnswer) {
    return 'free-answer'
  }

  return 'binary'
}

const resolveApprovalMessage = (
  payload?: {
    approvalRequest?: ApprovalRequestContract
    question?: string
    approvalReason?: string
    reason?: string
  } | null,
) =>
  extractApprovalRequest(payload)?.question ||
  extractApprovalRequest(payload)?.reason ||
  DEFAULT_APPROVAL_MESSAGE

const resolveApprovalReason = (
  payload?: {
    approvalRequest?: ApprovalRequestContract
    approvalReason?: string
    reason?: string
  } | null,
) =>
  extractApprovalRequest(payload)?.reason ||
  normalizeOptionalString(payload?.approvalReason) ||
  normalizeOptionalString(payload?.reason)

const buildPersistibleProjectApprovalPolicy = ({
  source,
  approvalRequest,
}: {
  source: 'planner' | 'executor' | ''
  approvalRequest?: ApprovalRequestContract | null
}): ProjectApprovalPolicy | null => {
  if (source !== 'executor' || !approvalRequest) {
    return null
  }

  const decisionKey = normalizeOptionalString(approvalRequest.decisionKey)
  const responseMode = resolveApprovalInteractionMode(approvalRequest)
  const hasOptions =
    Array.isArray(approvalRequest.options) && approvalRequest.options.length > 0

  if (
    !decisionKey ||
    decisionKey === 'legacy-approval' ||
    responseMode !== 'binary' ||
    approvalRequest.allowFreeAnswer === true ||
    hasOptions
  ) {
    return null
  }

  return {
    scope: 'repeatable-executor-approval',
    source: 'executor',
    decisionKey,
    responseMode: 'binary',
  }
}

const matchesProjectApprovalPolicy = ({
  policy,
  source,
  payload,
}: {
  policy: ProjectApprovalPolicy | null
  source: 'planner' | 'executor'
  payload?: {
    approvalRequest?: ApprovalRequestContract
    question?: string
    approvalReason?: string
    reason?: string
  } | null
}) => {
  if (!policy || policy.source !== source) {
    return false
  }

  const approvalRequest = extractApprovalRequest(payload)

  if (!approvalRequest) {
    return false
  }

  const decisionKey = normalizeOptionalString(approvalRequest.decisionKey)
  const responseMode = resolveApprovalInteractionMode(approvalRequest)

  return (
    policy.scope === 'repeatable-executor-approval' &&
    decisionKey !== '' &&
    decisionKey === policy.decisionKey &&
    responseMode === policy.responseMode
  )
}

const normalizeSessionEvent = (event: string) => {
  if (event === 'Session created') {
    return 'Sesión creada'
  }

  if (event === 'Planner loaded initial goal') {
    return 'El planificador cargó el objetivo inicial'
  }

  if (event === 'Approval checkpoint opened') {
    return 'Se abrió el punto de aprobación'
  }

  return event
}

const getStoredProjectPolicy = (): ProjectApprovalPolicy | null => {
  try {
    const storedPolicy = localStorage.getItem(PROJECT_POLICY_KEY)

    if (!storedPolicy || storedPolicy === 'true') {
      return null
    }

    const parsedPolicy = sanitizePersistedValue(JSON.parse(storedPolicy))

    return parsedPolicy &&
      parsedPolicy.scope === 'repeatable-executor-approval' &&
      parsedPolicy.source === 'executor' &&
      typeof parsedPolicy.decisionKey === 'string' &&
      parsedPolicy.decisionKey.trim() &&
      parsedPolicy.responseMode === 'binary'
      ? {
          scope: 'repeatable-executor-approval',
          source: 'executor',
          decisionKey: parsedPolicy.decisionKey.trim(),
          responseMode: 'binary',
        }
      : null
  } catch {
    return null
  }
}

const getStoredUserParticipationMode = (): UserParticipationMode => {
  try {
    const storedMode = localStorage.getItem(USER_PARTICIPATION_MODE_KEY)

    return storedMode === 'user-will-contribute' ||
      storedMode === 'brain-decides-missing'
      ? storedMode
      : DEFAULT_USER_PARTICIPATION_MODE
  } catch {
    return DEFAULT_USER_PARTICIPATION_MODE
  }
}

const getStoredResolvedDecisions = (): ResolvedDecisionRecord[] => {
  try {
    const rawValue = localStorage.getItem(RESOLVED_DECISIONS_KEY)

    if (!rawValue) {
      return DEFAULT_RESOLVED_DECISIONS
    }

    const parsedValue = sanitizePersistedValue(JSON.parse(rawValue))

    if (!Array.isArray(parsedValue)) {
      return DEFAULT_RESOLVED_DECISIONS
    }

    return parsedValue
      .map((record) => {
        const normalizedKey = normalizeResolvedDecisionKey(record?.key)

        if (!normalizedKey) {
          return null
        }

        return {
          key: normalizedKey,
          status:
            record?.status === 'delegated' ||
            record?.status === 'approved' ||
            record?.status === 'rejected' ||
            record?.status === 'resolved'
              ? record.status
              : 'resolved',
          source:
            record?.source === 'system' ||
            record?.source === 'user' ||
            record?.source === 'planner' ||
            record?.source === 'executor'
              ? record.source
              : 'system',
          ...(normalizeOptionalString(record?.summary)
            ? { summary: normalizeOptionalString(record.summary) }
            : {}),
          ...(record?.responseMode
            ? { responseMode: record.responseMode }
            : {}),
          ...(normalizeOptionalString(record?.selectedOption)
            ? { selectedOption: normalizeOptionalString(record.selectedOption) }
            : {}),
          ...(normalizeOptionalString(record?.freeAnswer)
            ? { freeAnswer: normalizeOptionalString(record.freeAnswer) }
            : {}),
          ...(normalizeApprovalFamilyKey(record?.approvalFamily)
            ? { approvalFamily: normalizeApprovalFamilyKey(record.approvalFamily) }
            : {}),
          ...(normalizeOptionalString(record?.updatedAt)
            ? { updatedAt: normalizeOptionalString(record.updatedAt) }
            : {}),
        } satisfies ResolvedDecisionRecord
      })
      .filter((record): record is ResolvedDecisionRecord => record !== null)
  } catch {
    return DEFAULT_RESOLVED_DECISIONS
  }
}

const getStoredBrainCostMode = (): BrainCostMode => {
  try {
    return normalizeBrainCostMode(localStorage.getItem(BRAIN_COST_MODE_KEY))
  } catch {
    return DEFAULT_BRAIN_COST_MODE
  }
}

const getStoredSessionEvents = () => {
  try {
    const storedEvents = localStorage.getItem(SESSION_EVENTS_KEY)

    if (!storedEvents) {
      return DEFAULT_SESSION_EVENTS
    }

    const parsedEvents = sanitizePersistedValue(JSON.parse(storedEvents))

    return Array.isArray(parsedEvents) &&
      parsedEvents.every((item) => typeof item === 'string')
      ? parsedEvents.map((item) => normalizeSessionEvent(item))
      : DEFAULT_SESSION_EVENTS
  } catch {
    return DEFAULT_SESSION_EVENTS
  }
}

const getStoredSessionSnapshot = (projectPolicyAllowed: boolean) => {
  const fallbackSnapshot = {
    sessionStatus: projectPolicyAllowed
      ? READY_WITH_PROJECT_RULE_STATUS
      : DEFAULT_SESSION_STATUS,
    currentStep: projectPolicyAllowed
      ? READY_WITH_PROJECT_RULE_STEP
      : DEFAULT_CURRENT_STEP,
    plannerInstruction: DEFAULT_PLANNER_INSTRUCTION,
    executorResult: DEFAULT_EXECUTOR_RESULT,
    executorRequestState: DEFAULT_EXECUTOR_REQUEST_STATE,
    lastRunSummary: DEFAULT_LAST_RUN_SUMMARY,
  }

  try {
    const storedSnapshot = localStorage.getItem(SESSION_SNAPSHOT_KEY)

    if (!storedSnapshot) {
      return fallbackSnapshot
    }

    const parsedSnapshot = sanitizePersistedValue(JSON.parse(storedSnapshot))
    const hasValidLastRunSummary =
      typeof parsedSnapshot?.lastRunSummary?.objective === 'string' &&
      typeof parsedSnapshot?.lastRunSummary?.instruction === 'string' &&
      typeof parsedSnapshot?.lastRunSummary?.result === 'string' &&
      typeof parsedSnapshot?.lastRunSummary?.context === 'string' &&
      typeof parsedSnapshot?.lastRunSummary?.workspacePath === 'string' &&
      typeof parsedSnapshot?.lastRunSummary?.approval === 'string' &&
      typeof parsedSnapshot?.lastRunSummary?.finalStatus === 'string'

    return {
      sessionStatus:
        typeof parsedSnapshot?.sessionStatus === 'string'
          ? parsedSnapshot.sessionStatus
          : fallbackSnapshot.sessionStatus,
      currentStep:
        typeof parsedSnapshot?.currentStep === 'string'
          ? parsedSnapshot.currentStep
          : fallbackSnapshot.currentStep,
      plannerInstruction:
        typeof parsedSnapshot?.plannerInstruction === 'string'
          ? parsedSnapshot.plannerInstruction
          : fallbackSnapshot.plannerInstruction,
      executorResult:
        typeof parsedSnapshot?.executorResult === 'string'
          ? parsedSnapshot.executorResult
          : fallbackSnapshot.executorResult,
      executorRequestState:
        parsedSnapshot?.executorRequestState === 'running' ||
        parsedSnapshot?.executorRequestState === 'success' ||
        parsedSnapshot?.executorRequestState === 'error' ||
        parsedSnapshot?.executorRequestState === 'idle'
          ? parsedSnapshot.executorRequestState
          : fallbackSnapshot.executorRequestState,
      lastRunSummary: hasValidLastRunSummary
        ? parsedSnapshot.lastRunSummary
        : fallbackSnapshot.lastRunSummary,
    }
  } catch {
    return fallbackSnapshot
  }
}

const getStoredWorkspacePath = () => {
  try {
    const storedWorkspacePath = localStorage.getItem(WORKSPACE_PATH_KEY)

    if (typeof storedWorkspacePath !== 'string') {
      return DEFAULT_WORKSPACE_PATH
    }

    const normalizedStoredWorkspacePath = repairMojibakeText(
      storedWorkspacePath,
    ).trim()
    const lowerStoredWorkspacePath =
      normalizedStoredWorkspacePath.toLocaleLowerCase()

    if (
      !normalizedStoredWorkspacePath ||
      lowerStoredWorkspacePath === LEGACY_DEFAULT_WORKSPACE_PATH.toLocaleLowerCase()
    ) {
      return DEFAULT_WORKSPACE_PATH
    }

    return normalizedStoredWorkspacePath
  } catch {
    return DEFAULT_WORKSPACE_PATH
  }
}

const getStoredFlowConsoleState = () => {
  try {
    const storedConsoleState = localStorage.getItem(FLOW_CONSOLE_STATE_KEY)

    if (!storedConsoleState) {
      return {
        open: false,
        pinned: false,
      }
    }

    const parsedConsoleState = sanitizePersistedValue(JSON.parse(storedConsoleState))

    return {
      open: parsedConsoleState?.open === true,
      pinned: parsedConsoleState?.pinned === true,
    }
  } catch {
    return {
      open: false,
      pinned: false,
    }
  }
}

const getStoredFlowMessages = () => {
  try {
    const storedFlowMessages = localStorage.getItem(FLOW_MESSAGES_KEY)

    if (!storedFlowMessages) {
      return DEFAULT_FLOW_MESSAGES
    }

    const parsedFlowMessages = sanitizePersistedValue(JSON.parse(storedFlowMessages))

    return Array.isArray(parsedFlowMessages) &&
      parsedFlowMessages.every(
        (item) =>
          typeof item?.id === 'number' &&
          typeof item?.source === 'string' &&
          typeof item?.title === 'string' &&
          typeof item?.content === 'string',
      )
      ? parsedFlowMessages
      : DEFAULT_FLOW_MESSAGES
  } catch {
    return DEFAULT_FLOW_MESSAGES
  }
}

function App() {
  const persistedFlowMessages = getStoredFlowMessages()
  const skipProjectPolicyPersistenceRef = useRef(false)
  const skipSessionEventsPersistenceRef = useRef(false)
  const flowMessageIdRef = useRef(
    persistedFlowMessages.at(-1)?.id || 0,
  )
  const appRootRef = useRef<HTMLElement | null>(null)
  const activeExecutionRequestIdRef = useRef('')
  const activeExecutionRunIdRef = useRef('')
  const executionRunSummariesRef = useRef<ExecutionRunSummary[]>([])
  const pendingExecutionCompletionResolversRef = useRef<
    Record<string, (payload: ExecutionCompletePayload) => void>
  >({})
  const manualExecutionClosureRef = useRef<{
    requestId: string
    settled: boolean
  }>({
    requestId: '',
    settled: false,
  })
  const executionContextInputRef = useRef<HTMLTextAreaElement | null>(null)
  const flowActivityContainerRef = useRef<HTMLDivElement | null>(null)
  const flowConversationContainerRef = useRef<HTMLDivElement | null>(null)
  const flowTimelineContainerRef = useRef<HTMLDivElement | null>(null)
  const platform = window.aiOrchestrator?.platform ?? 'No disponible'
  const persistedProjectPolicy = getStoredProjectPolicy()
  const persistedResolvedDecisions = getStoredResolvedDecisions()
  const persistedSessionSnapshot = getStoredSessionSnapshot(
    Boolean(persistedProjectPolicy),
  )
  const persistedWorkspacePath = getStoredWorkspacePath()
  const persistedUserParticipationMode = getStoredUserParticipationMode()
  const persistedBrainCostMode = getStoredBrainCostMode()
  const persistedFlowConsoleState = getStoredFlowConsoleState()
  const [projectApprovalPolicy, setProjectApprovalPolicy] = useState<
    ProjectApprovalPolicy | null
  >(
    () => persistedProjectPolicy,
  )
  const projectPolicyAllowed = projectApprovalPolicy !== null
  const [decisionPending, setDecisionPending] = useState(false)
  const [approvalMessage, setApprovalMessage] = useState('')
  const [activeApprovalRequest, setActiveApprovalRequest] =
    useState<ApprovalRequestContract | null>(null)
  const [approvalSelectedOption, setApprovalSelectedOption] = useState('')
  const [approvalFreeAnswer, setApprovalFreeAnswer] = useState('')
  const [pendingInstruction, setPendingInstruction] = useState('')
  const [pendingExecutionInstruction, setPendingExecutionInstruction] =
    useState('')
  const [approvalSource, setApprovalSource] = useState<
    'planner' | 'executor' | ''
  >('')
  const [sessionStatus, setSessionStatus] = useState(
    () => persistedSessionSnapshot.sessionStatus,
  )
  const [currentStep, setCurrentStep] = useState(
    () => persistedSessionSnapshot.currentStep,
  )
  const [isRunning, setIsRunning] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isPlanning, setIsPlanning] = useState(false)
  const [isExecutingTask, setIsExecutingTask] = useState(false)
  const [isAutoFlowRunning, setIsAutoFlowRunning] = useState(false)
  const [autoFlowIteration, setAutoFlowIteration] = useState(0)
  const [autoFlowAwaitingApproval, setAutoFlowAwaitingApproval] = useState<
    'planner' | 'executor' | ''
  >('')
  const [goalInput, setGoalInput] = useState(DEFAULT_GOAL_INPUT)
  const [workspacePath, setWorkspacePath] = useState(() => persistedWorkspacePath)
  const [executionContextInput, setExecutionContextInput] = useState(
    DEFAULT_EXECUTION_CONTEXT_INPUT,
  )
  const [plannerRequestSnapshot, setPlannerRequestSnapshot] =
    useState<PlannerRequestSnapshot>({
      goal: '',
      context: '',
      decisionKey: '',
      safeFirstDeliveryPlanFingerprint: '',
    })
  const [userParticipationMode, setUserParticipationMode] =
    useState<UserParticipationMode>(() => persistedUserParticipationMode)
  const [brainCostMode, setBrainCostMode] = useState<BrainCostMode>(
    () => persistedBrainCostMode,
  )
  const [resolvedDecisions, setResolvedDecisions] = useState<
    ResolvedDecisionRecord[]
  >(() => persistedResolvedDecisions)
  const [isFlowConsoleOpen, setIsFlowConsoleOpen] = useState(
    () => persistedFlowConsoleState.open,
  )
  const [isFlowConsolePinnedOpen, setIsFlowConsolePinnedOpen] = useState(
    () => persistedFlowConsoleState.pinned,
  )
  const [plannerInstruction, setPlannerInstruction] = useState(
    () => persistedSessionSnapshot.plannerInstruction,
  )
  const [plannerExecutionMetadata, setPlannerExecutionMetadata] =
    useState<PlannerExecutionMetadata>(EMPTY_PLANNER_EXECUTION_METADATA)
  const [lastObservedExecutionMode, setLastObservedExecutionMode] = useState('')
  const [executorResult, setExecutorResult] = useState(
    () => persistedSessionSnapshot.executorResult,
  )
  const [lastExecutorSnapshot, setLastExecutorSnapshot] =
    useState<ExecutorFailureContext | null>(null)
  const [executorRequestState, setExecutorRequestState] = useState<
    'idle' | 'running' | 'success' | 'error'
  >(() => persistedSessionSnapshot.executorRequestState)
  const [lastBrainRoutingDecision, setLastBrainRoutingDecision] =
    useState<BrainRoutingDecision | null>(null)
  const [lastRunSummary, setLastRunSummary] = useState(
    () => persistedSessionSnapshot.lastRunSummary,
  )
  const [sessionEvents, setSessionEvents] = useState(() => getStoredSessionEvents())
  const [runtimeStatus, setRuntimeStatus] = useState(DEFAULT_RUNTIME_STATUS)
  const [flowMessages, setFlowMessages] = useState(() => persistedFlowMessages)
  const [executionRunSummaries, setExecutionRunSummaries] = useState<
    ExecutionRunSummary[]
  >([])
  const [reusableArtifactFilters, setReusableArtifactFilters] = useState({
    sector: '',
    visualStyle: '',
    layoutVariant: '',
    heroStyle: '',
    tags: '',
  })
  const [reusableArtifacts, setReusableArtifacts] = useState<
    ReusableArtifactRecord[]
  >([])
  const [isLoadingReusableArtifacts, setIsLoadingReusableArtifacts] =
    useState(false)
  const [reusableArtifactError, setReusableArtifactError] = useState('')
  const [selectedReusableArtifact, setSelectedReusableArtifact] =
    useState<ReusableArtifactRecord | null>(null)
  const [manualReuseMode, setManualReuseMode] = useState<ManualReuseMode>('auto')
  const [activeSection, setActiveSection] = useState<AppSectionKey>('inicio')
  const [selectedRunSummary, setSelectedRunSummary] =
    useState<ExecutionRunSummary | null>(null)
  const [detailReusableArtifact, setDetailReusableArtifact] =
    useState<ReusableArtifactRecord | null>(null)
  const [isFinalResponseOpen, setIsFinalResponseOpen] = useState(false)
  const [experienceMode, setExperienceMode] =
    useState<ExperienceMode>('guided')
  const [activeWizardStep, setActiveWizardStep] =
    useState<WizardStepKey>('goal')

  useEffect(() => {
    executionRunSummariesRef.current = executionRunSummaries
  }, [executionRunSummaries])

  useEffect(() => {
    const rootElement = appRootRef.current

    if (!rootElement) {
      return
    }

    const textWalker = document.createTreeWalker(
      rootElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parentElement = node.parentElement

          if (!parentElement) {
            return NodeFilter.FILTER_REJECT
          }

          if (parentElement.tagName === 'TEXTAREA') {
            return NodeFilter.FILTER_REJECT
          }

          return NodeFilter.FILTER_ACCEPT
        },
      },
    )

    const textNodesToRepair: Text[] = []
    let currentTextNode = textWalker.nextNode()

    while (currentTextNode) {
      textNodesToRepair.push(currentTextNode as Text)
      currentTextNode = textWalker.nextNode()
    }

    textNodesToRepair.forEach((textNode) => {
      const nextValue = repairMojibakeText(textNode.nodeValue || '')

      if (nextValue && nextValue !== textNode.nodeValue) {
        textNode.nodeValue = nextValue
      }
    })

    rootElement
      .querySelectorAll<HTMLElement>('input[placeholder], textarea[placeholder], [title]')
      .forEach((element) => {
        const currentPlaceholder = element.getAttribute('placeholder')
        const currentTitle = element.getAttribute('title')

        if (currentPlaceholder) {
          const nextPlaceholder = repairMojibakeText(currentPlaceholder)
          if (nextPlaceholder !== currentPlaceholder) {
            element.setAttribute('placeholder', nextPlaceholder)
          }
        }

        if (currentTitle) {
          const nextTitle = repairMojibakeText(currentTitle)
          if (nextTitle !== currentTitle) {
            element.setAttribute('title', nextTitle)
          }
        }
      })
  })

  const loadReusableArtifacts = useCallback(async () => {
    setIsLoadingReusableArtifacts(true)
    setReusableArtifactError('')

    try {
      const response = await window.aiOrchestrator?.listReusableArtifacts?.({
        ...(reusableArtifactFilters.sector.trim()
          ? { sector: reusableArtifactFilters.sector.trim() }
          : {}),
        ...(reusableArtifactFilters.visualStyle.trim()
          ? { visualStyle: reusableArtifactFilters.visualStyle.trim() }
          : {}),
        ...(reusableArtifactFilters.layoutVariant.trim()
          ? { layoutVariant: reusableArtifactFilters.layoutVariant.trim() }
          : {}),
        ...(reusableArtifactFilters.heroStyle.trim()
          ? { heroStyle: reusableArtifactFilters.heroStyle.trim() }
          : {}),
        ...(reusableArtifactFilters.tags.trim()
          ? {
              tags: reusableArtifactFilters.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
            }
          : {}),
        limit: 18,
      })

      const normalizedArtifacts = Array.isArray(response?.artifacts)
        ? response.artifacts
            .map((artifact) => normalizeReusableArtifactRecord(artifact))
            .filter((artifact): artifact is ReusableArtifactRecord => Boolean(artifact))
        : []

      setReusableArtifacts(normalizedArtifacts)
    } catch (error) {
      setReusableArtifactError(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar la memoria reusable.',
      )
      setReusableArtifacts([])
    } finally {
      setIsLoadingReusableArtifacts(false)
    }
  }, [
    reusableArtifactFilters.heroStyle,
    reusableArtifactFilters.layoutVariant,
    reusableArtifactFilters.sector,
    reusableArtifactFilters.tags,
    reusableArtifactFilters.visualStyle,
  ])

  useEffect(() => {
    void loadReusableArtifacts()
  }, [loadReusableArtifacts])

  const humanApprovalsBadge = decisionPending
    ? 'Aprobación manual requerida'
    : projectPolicyAllowed
      ? 'Regla del proyecto activa'
      : 'Sin aprobación pendiente'

  const plannerNeedsUserClarification = isUserClarificationPlannerResponse(
    plannerExecutionMetadata,
  )
  const plannerIsReviewOnly = isReviewOnlyPlannerResponse(plannerExecutionMetadata)
  const plannerIsSafeFirstDeliveryReview =
    normalizeOptionalString(plannerExecutionMetadata.decisionKey).toLocaleLowerCase() ===
      'safe-first-delivery-plan' ||
    normalizeOptionalString(plannerExecutionMetadata.strategy).toLocaleLowerCase() ===
      'safe-first-delivery-plan' ||
    normalizeOptionalString(
      plannerExecutionMetadata.nextExpectedAction,
    ).toLocaleLowerCase() === 'review-safe-first-delivery'
  const plannerScalableDeliveryLevel = normalizeOptionalString(
    plannerExecutionMetadata.scalableDeliveryPlan?.deliveryLevel,
  ).toLocaleLowerCase()
  const plannerHasDedicatedScalableDeliveryLevel =
    plannerScalableDeliveryLevel !== '' &&
    plannerScalableDeliveryLevel !== 'safe-first-delivery'
  const plannerIsScalableDeliveryReview =
    normalizeOptionalString(plannerExecutionMetadata.decisionKey).toLocaleLowerCase() ===
      'scalable-delivery-plan' ||
    normalizeOptionalString(plannerExecutionMetadata.strategy).toLocaleLowerCase() ===
      'scalable-delivery-plan' ||
    normalizeOptionalString(
      plannerExecutionMetadata.nextExpectedAction,
    ).toLocaleLowerCase() === 'review-scalable-delivery' ||
    plannerHasDedicatedScalableDeliveryLevel
  const plannerReviewStatusLabel = plannerIsReviewOnly
    ? plannerIsSafeFirstDeliveryReview
      ? 'Primera entrega en revision'
      : plannerIsScalableDeliveryReview
        ? 'Plan escalable en revision'
        : 'Plan en revision'
    : 'Plan activo cargado'
  const plannerReviewHelperText = plannerIsReviewOnly
    ? plannerIsSafeFirstDeliveryReview
      ? 'Este plan define una primera fase segura y no ejecuta cambios todavia.'
      : plannerIsScalableDeliveryReview
        ? 'JEFE detecto una entrega escalable y por ahora solo devuelve un plan revisable; no ejecuta cambios todavia.'
        : 'Este plan no ejecuta cambios todavia; primero requiere revision manual.'
    : 'La instruccion actual puede pasar a ejecucion manual cuando corresponda.'
  const plannerReviewActionLabel = plannerIsSafeFirstDeliveryReview
    ? 'Revisar primera entrega segura'
    : plannerIsScalableDeliveryReview
      ? 'Revisar plan escalable'
      : 'Revisar arquitectura'
  const plannerBadge = isPlanning ? 'Planificación en curso' : plannerReviewStatusLabel

  const executorBadge = isExecutingTask
    ? 'Ejecutando instrucción actual'
    : plannerIsReviewOnly
      ? 'En revisión manual'
    : decisionPending && approvalSource === 'executor'
      ? 'Esperando aprobación'
      : 'Listo para ejecutar'
  const executorRequestStateLabel =
    executorRequestState === 'running'
      ? 'Ejecutando'
      : executorRequestState === 'success'
        ? 'Completado'
        : executorRequestState === 'error'
          ? 'Con error'
          : plannerIsReviewOnly
            ? 'En revisión'
            : 'En espera'
  const canExecuteInstruction =
    plannerInstruction.trim() !== '' &&
    plannerInstruction !== DEFAULT_PLANNER_INSTRUCTION &&
    !plannerNeedsUserClarification &&
    !plannerIsReviewOnly

  const visiblePendingInstruction =
    approvalSource === 'executor'
      ? pendingExecutionInstruction
      : pendingInstruction
  const activeApprovalInteractionMode = resolveApprovalInteractionMode(
    activeApprovalRequest,
  )
  const visibleApprovalOptions = Array.isArray(activeApprovalRequest?.options)
    ? activeApprovalRequest.options
    : []
  const approvalResponseRequiresOption =
    activeApprovalInteractionMode === 'options' ||
    activeApprovalInteractionMode === 'mixed'
  const persistibleProjectApprovalPolicy = buildPersistibleProjectApprovalPolicy({
    source: approvalSource,
    approvalRequest: activeApprovalRequest,
  })
  const canPersistCurrentApprovalRule = Boolean(persistibleProjectApprovalPolicy)
  const canSendRichApprovalResponse =
    decisionPending &&
    (activeApprovalInteractionMode === 'binary'
      ? true
      : activeApprovalInteractionMode === 'options'
        ? approvalSelectedOption.trim() !== ''
        : activeApprovalInteractionMode === 'free-answer'
          ? approvalFreeAnswer.trim() !== ''
          : approvalSelectedOption.trim() !== '' || approvalFreeAnswer.trim() !== '')
  const currentExecutionContextSummary = executionContextInput.trim()
    ? executionContextInput.trim()
    : 'Sin contexto adicional'
  const userParticipationSummary =
    userParticipationMode === 'user-will-contribute'
      ? 'El usuario va a aportar definiciones, recursos o contenidos cuando haga falta.'
      : userParticipationMode === 'brain-decides-missing'
        ? 'El Cerebro debe decidir faltantes menores y avanzar solo salvo bloqueos críticos.'
        : 'Todavía no se definió si el usuario va a aportar insumos durante el proceso.'
  const plannerProjectState: PlannerProjectState = {
    ...(userParticipationMode ? { userParticipationMode } : {}),
    resolvedDecisions: mergeResolvedDecisionRecords(
      buildParticipationResolvedDecisions(userParticipationMode),
      resolvedDecisions,
    ),
  }
  const currentWorkspaceSummary = workspacePath.trim()
    ? workspacePath.trim()
    : 'Sin espacio de trabajo definido'
  const workspaceStatusLabel = workspacePath.trim()
    ? 'Espacio de trabajo definido'
    : 'Espacio de trabajo no definido'
  const manualReusablePreferencePayload = buildManualReusablePreferencePayload({
    mode: manualReuseMode,
    selectedArtifact: selectedReusableArtifact,
  })
  const effectivePlannerExecutionMetadata =
    applyManualReusablePreferenceToPlannerExecutionMetadata({
      metadata: plannerExecutionMetadata,
      mode: manualReuseMode,
      selectedArtifact: selectedReusableArtifact,
    })
  const resolvePlannerExecutionMetadata = (
    payload?: PlannerDecisionResponse | null,
  ) =>
    applyManualReusablePreferenceToPlannerExecutionMetadata({
      metadata: extractPlannerExecutionMetadata(payload),
      mode: manualReuseMode,
      selectedArtifact: selectedReusableArtifact,
    })
  const activeProductArchitecture = effectivePlannerExecutionMetadata.productArchitecture
  const activeSafeFirstDeliveryPlan =
    effectivePlannerExecutionMetadata.safeFirstDeliveryPlan
  const activeScalableDeliveryPlan =
    effectivePlannerExecutionMetadata.scalableDeliveryPlan
  const activeProjectBlueprint = effectivePlannerExecutionMetadata.projectBlueprint
  const activeQuestionPolicy = effectivePlannerExecutionMetadata.questionPolicy
  const activeImplementationRoadmap =
    effectivePlannerExecutionMetadata.implementationRoadmap
  const activeNextActionPlan = effectivePlannerExecutionMetadata.nextActionPlan
  const activeValidationPlan = effectivePlannerExecutionMetadata.validationPlan
  const activePhaseExpansionPlan =
    effectivePlannerExecutionMetadata.phaseExpansionPlan
  const activeProjectPhaseExecutionPlan =
    effectivePlannerExecutionMetadata.projectPhaseExecutionPlan
  const activeLocalProjectManifest =
    effectivePlannerExecutionMetadata.localProjectManifest
  const activeExpansionOptions = effectivePlannerExecutionMetadata.expansionOptions
  const activeModuleExpansionPlan =
    effectivePlannerExecutionMetadata.moduleExpansionPlan
  const activeContinuationActionPlan =
    effectivePlannerExecutionMetadata.continuationActionPlan
  const activeProjectContinuationState =
    effectivePlannerExecutionMetadata.projectContinuationState
  const activeScalableDeliveryLevel = normalizeOptionalString(
    activeScalableDeliveryPlan?.deliveryLevel,
  ).toLocaleLowerCase()
  const shouldShowScalableDeliveryPlan =
    plannerIsScalableDeliveryReview &&
    activeScalableDeliveryLevel !== '' &&
    activeScalableDeliveryLevel !== 'safe-first-delivery'
  const shouldShowProjectBlueprint =
    Boolean(activeProjectBlueprint) &&
    normalizeOptionalString(activeProjectBlueprint?.deliveryLevel).toLocaleLowerCase() !==
      'safe-first-delivery'
  const shouldShowImplementationRoadmap =
    Boolean(activeImplementationRoadmap) &&
    normalizeOptionalString(
      activeImplementationRoadmap?.deliveryLevel,
    ).toLocaleLowerCase() !== 'safe-first-delivery'
  const shouldShowNextActionPlan =
    Boolean(activeNextActionPlan) &&
    (shouldShowImplementationRoadmap ||
      shouldShowScalableDeliveryPlan ||
      Boolean(effectivePlannerExecutionMetadata.materializationPlan))
  const shouldShowValidationPlan =
    Boolean(activeValidationPlan) &&
    (shouldShowImplementationRoadmap ||
      Boolean(effectivePlannerExecutionMetadata.materializationPlan))
  const shouldShowPhaseExpansionPlan =
    Boolean(activePhaseExpansionPlan) &&
    (Boolean(effectivePlannerExecutionMetadata.materializationPlan) ||
      shouldShowImplementationRoadmap)
  const shouldShowLocalProjectManifest =
    Boolean(activeLocalProjectManifest) &&
    normalizeOptionalString(
      activeLocalProjectManifest?.deliveryLevel,
    ).toLocaleLowerCase() === 'fullstack-local'
  const shouldShowProjectPhaseExecutionPlan =
    Boolean(activeProjectPhaseExecutionPlan) &&
    normalizeOptionalString(
      activeProjectPhaseExecutionPlan?.deliveryLevel,
    ).toLocaleLowerCase() === 'fullstack-local'
  const shouldShowProjectContinuity =
    Boolean(activeProjectContinuationState) ||
    Boolean(activeContinuationActionPlan) ||
    Boolean(activeExpansionOptions) ||
    Boolean(activeModuleExpansionPlan) ||
    shouldShowProjectPhaseExecutionPlan ||
    shouldShowLocalProjectManifest ||
    (shouldShowNextActionPlan &&
      normalizeOptionalString(
        activeNextActionPlan?.targetDeliveryLevel,
      ).toLocaleLowerCase() === 'fullstack-local') ||
    (shouldShowPhaseExpansionPlan &&
      normalizeOptionalString(activePhaseExpansionPlan?.phaseId) !== '') ||
    (shouldShowImplementationRoadmap &&
      normalizeOptionalString(
        activeImplementationRoadmap?.deliveryLevel,
      ).toLocaleLowerCase() === 'fullstack-local')
  const activeLocalProjectRoot = (() => {
    if (normalizeOptionalString(activeProjectPhaseExecutionPlan?.projectRoot)) {
      return normalizeOptionalString(activeProjectPhaseExecutionPlan?.projectRoot)
    }

    if (normalizeOptionalString(activeModuleExpansionPlan?.projectRoot)) {
      return normalizeOptionalString(activeModuleExpansionPlan?.projectRoot)
    }

    if (normalizeOptionalString(activeContinuationActionPlan?.projectRoot)) {
      return normalizeOptionalString(activeContinuationActionPlan?.projectRoot)
    }

    const executionScopePaths = Array.isArray(
      effectivePlannerExecutionMetadata.executionScope?.allowedTargetPaths,
    )
      ? effectivePlannerExecutionMetadata.executionScope?.allowedTargetPaths || []
      : []
    const firstScopePath = normalizeOptionalString(executionScopePaths[0])

    if (firstScopePath) {
      return firstScopePath.replace(/\\/g, '/').split('/')[0] || firstScopePath
    }

    return ''
  })()
  const buildProjectPhasePrompt = (
    action: 'prepare' | 'materialize',
    phaseId: string,
  ) => {
    const resolvedPhaseId = normalizeOptionalString(phaseId)
    const projectRoot = activeLocalProjectRoot
    const domainLabel =
      normalizeOptionalString(activeLocalProjectManifest?.domain) ||
      normalizeOptionalString(activeProjectBlueprint?.domain) ||
      'proyecto local'
    const goal =
      action === 'materialize'
        ? `Materializar la fase ${resolvedPhaseId} del proyecto fullstack local de ${domainLabel}.`
        : `Continuar el proyecto fullstack local de ${domainLabel} y preparar la fase ${resolvedPhaseId}.`
    const contextLines = [
      'deliveryLevel: fullstack-local.',
      `phaseId: ${resolvedPhaseId}.`,
      projectRoot ? `projectRoot: ${projectRoot}.` : '',
      normalizeOptionalString(activeLocalProjectManifest?.nextRecommendedPhase)
        ? `nextRecommendedPhase: ${normalizeOptionalString(activeLocalProjectManifest?.nextRecommendedPhase)}.`
        : '',
      action === 'materialize' &&
      Array.isArray(activeProjectPhaseExecutionPlan?.allowedTargetPaths) &&
      activeProjectPhaseExecutionPlan.allowedTargetPaths.length > 0
        ? `allowedTargetPaths: ${activeProjectPhaseExecutionPlan.allowedTargetPaths.join(', ')}`
        : '',
      'Usar jefe-project.json si existe para entender el estado local del proyecto.',
      action === 'materialize'
        ? 'No tocar backend, database, package.json, node_modules, .env, Docker ni deploy.'
        : 'Solo preparar la fase, no escribir archivos todavía.',
    ].filter(Boolean)

    return {
      goal,
      context: contextLines.join('\n'),
    }
  }
  const buildExpansionOptionPrompt = ({
    action,
    optionId,
    optionLabel,
    optionType,
    targetStrategy,
    expectedFiles,
    safeToMaterialize,
    requiresApproval,
    reason,
  }: {
    action: 'prepare' | 'materialize'
    optionId: string
    optionLabel?: string
    optionType?: string
    targetStrategy?: string
    expectedFiles?: string[] | null
    safeToMaterialize?: boolean
    requiresApproval?: boolean
    reason?: string
  }) => {
    const resolvedOptionId = normalizeModuleUiId(optionId)
    const resolvedOptionLabel =
      normalizeOptionalString(optionLabel) ||
      normalizeOptionalString(optionId).replace(/-/g, ' ') ||
      'siguiente expansion'
    const projectRoot =
      normalizeOptionalString(activeExpansionOptions?.projectRoot) || activeLocalProjectRoot
    const domainLabel =
      normalizeOptionalString(activeLocalProjectManifest?.domain) ||
      normalizeOptionalString(activeProjectBlueprint?.domain) ||
      'proyecto local'
    const normalizedExpectedFiles = normalizeOptionalStringArray(expectedFiles)
    const goal =
      action === 'materialize'
        ? `Materializar la expansion ${resolvedOptionLabel} para el proyecto fullstack local de ${domainLabel}.`
        : `Preparar un plan para continuar el proyecto fullstack local de ${domainLabel} con ${resolvedOptionLabel}.`
    const contextLines = [
      'deliveryLevel: fullstack-local.',
      `optionId: ${resolvedOptionId}.`,
      `optionLabel: ${resolvedOptionLabel}.`,
      normalizeOptionalString(optionType)
        ? `expansionType: ${normalizeOptionalString(optionType)}.`
        : '',
      projectRoot ? `projectRoot: ${projectRoot}.` : '',
      normalizeOptionalString(activeLocalProjectManifest?.nextRecommendedPhase)
        ? `nextRecommendedPhase: ${normalizeOptionalString(activeLocalProjectManifest?.nextRecommendedPhase)}.`
        : '',
      normalizeOptionalString(targetStrategy)
        ? `targetStrategyHint: ${normalizeOptionalString(targetStrategy)}.`
        : '',
      normalizedExpectedFiles.length > 0
        ? `expectedFiles: ${normalizedExpectedFiles.join(', ')}`
        : '',
      normalizeOptionalString(reason) ? `reasonHint: ${normalizeOptionalString(reason)}` : '',
      requiresApproval
        ? 'Si la opcion sigue siendo sensible, mantenerla en revision y no ejecutar materializacion directa.'
        : '',
      action === 'materialize'
        ? safeToMaterialize
          ? 'Solo materializar si existe una ruta local, segura y revisable para esta expansion.'
          : 'Si todavia no existe materializador seguro, devolver solo un plan revisable y no ejecutar cambios.'
        : 'Solo preparar el plan; no escribir archivos todavia.',
      'Usar jefe-project.json si existe para entender el estado local del proyecto.',
      'No tocar package.json, node_modules, .env, Docker, deploy ni runtime real.',
    ].filter(Boolean)

    return {
      goal,
      context: contextLines.join('\n'),
    }
  }
  const buildModuleExpansionPrompt = ({
    action,
    moduleId,
    moduleName,
    targetStrategy,
    expectedFiles,
    safeToMaterialize,
    requiresApproval,
  }: {
    action: 'prepare' | 'materialize'
    moduleId: string
    moduleName?: string
    targetStrategy?: string
    expectedFiles?: string[] | null
    safeToMaterialize?: boolean
    requiresApproval?: boolean
  }) => {
    const resolvedModuleId = normalizeModuleUiId(moduleId)
    const resolvedModuleName =
      normalizeOptionalString(moduleName) ||
      normalizeOptionalString(moduleId).replace(/-/g, ' ') ||
      'modulo local'
    const projectRoot =
      normalizeOptionalString(activeModuleExpansionPlan?.projectRoot) || activeLocalProjectRoot
    const domainLabel =
      normalizeOptionalString(activeLocalProjectManifest?.domain) ||
      normalizeOptionalString(activeProjectBlueprint?.domain) ||
      'proyecto local'
    const normalizedExpectedFiles = normalizeOptionalStringArray(expectedFiles)
    const goal =
      action === 'materialize'
        ? `Materializar la expansion de modulo de ${resolvedModuleName} para el proyecto fullstack local de ${domainLabel}.`
        : `Preparar una expansion de modulo de ${resolvedModuleName} para el proyecto fullstack local de ${domainLabel}.`
    const contextLines = [
      'deliveryLevel: fullstack-local.',
      `moduleId: ${resolvedModuleId}.`,
      `moduleName: ${resolvedModuleName}.`,
      projectRoot ? `projectRoot: ${projectRoot}.` : '',
      normalizeOptionalString(activeLocalProjectManifest?.nextRecommendedPhase)
        ? `nextRecommendedPhase: ${normalizeOptionalString(activeLocalProjectManifest?.nextRecommendedPhase)}.`
        : '',
      normalizeOptionalString(targetStrategy)
        ? `targetStrategyHint: ${normalizeOptionalString(targetStrategy)}.`
        : '',
      normalizedExpectedFiles.length > 0
        ? `expectedFiles: ${normalizedExpectedFiles.join(', ')}`
        : '',
      requiresApproval
        ? 'Si esta expansion sigue siendo sensible, mantenerla bloqueada o solo en revision.'
        : '',
      action === 'materialize'
        ? safeToMaterialize
          ? 'Solo materializar si existe un materializador seguro real para este modulo.'
          : 'No prometer ejecucion inmediata si el modulo todavia no tiene materializador seguro.'
        : 'Solo preparar el plan; no escribir archivos todavia.',
      'Usar jefe-project.json si existe para entender el estado local del proyecto.',
      'No tocar package.json, node_modules, .env, Docker, deploy ni runtime real.',
    ].filter(Boolean)

    return {
      goal,
      context: contextLines.join('\n'),
    }
  }
  const buildContinuationActionPrompt = ({
    actionId,
    title,
    targetStrategy,
    approvalType,
    requiresApproval,
    blocked,
    blocker,
    expectedOutcome,
    targetFiles,
  }: ContinuationActionContract) => {
    const resolvedActionId = normalizeOptionalString(actionId)
    const resolvedTitle =
      normalizeOptionalString(title) ||
      normalizeOptionalString(actionId).replace(/-/g, ' ') ||
      'continuidad del proyecto'
    const projectRoot =
      normalizeOptionalString(activeContinuationActionPlan?.projectRoot) ||
      activeLocalProjectRoot
    const domainLabel =
      normalizeOptionalString(activeLocalProjectManifest?.domain) ||
      normalizeOptionalString(activeProjectBlueprint?.domain) ||
      'proyecto local'
    const normalizedTargetFiles = normalizeOptionalStringArray(targetFiles)
    const goal = `Preparar ${resolvedTitle} para el proyecto fullstack local de ${domainLabel}.`
    const contextLines = [
      'deliveryLevel: fullstack-local.',
      `continuationActionId: ${resolvedActionId}.`,
      `continuationActionTitle: ${resolvedTitle}.`,
      projectRoot ? `projectRoot: ${projectRoot}.` : '',
      normalizeOptionalString(targetStrategy)
        ? `targetStrategyHint: ${normalizeOptionalString(targetStrategy)}.`
        : '',
      normalizeOptionalString(approvalType)
        ? `approvalType: ${normalizeOptionalString(approvalType)}.`
        : '',
      normalizeOptionalString(activeLocalProjectManifest?.nextRecommendedPhase)
        ? `nextRecommendedPhase: ${normalizeOptionalString(activeLocalProjectManifest?.nextRecommendedPhase)}.`
        : '',
      normalizedTargetFiles.length > 0
        ? `expectedFiles: ${normalizedTargetFiles.join(', ')}`
        : '',
      normalizeOptionalString(blocker)
        ? `blockerHint: ${normalizeOptionalString(blocker)}`
        : '',
      normalizeOptionalString(expectedOutcome)
        ? `expectedOutcome: ${normalizeOptionalString(expectedOutcome)}`
        : '',
      requiresApproval
        ? 'Requiere aprobacion: no ejecutar runtime real ni cambios sensibles.'
        : '',
      blocked
        ? 'Si sigue bloqueado, devolver solo un plan revisable con alternativa segura.'
        : 'Solo preparar el plan; no escribir archivos todavia.',
      'Usar jefe-project.json si existe para entender el estado local del proyecto.',
      'No tocar package.json, node_modules, .env, Docker, deploy ni runtime real.',
    ].filter(Boolean)

    return {
      goal,
      context: contextLines.join('\n'),
    }
  }
  const manualReuseModeLabel = getManualReuseModeLabel(manualReuseMode)
  const selectedReusableArtifactSummary = selectedReusableArtifact
    ? [
        selectedReusableArtifact.sectorLabel || selectedReusableArtifact.sector,
        selectedReusableArtifact.visualStyle,
        selectedReusableArtifact.layoutVariant,
        selectedReusableArtifact.heroStyle,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Todavía no hay un artefacto reusable seleccionado manualmente.'
  const selectedReusableArtifactTags = selectedReusableArtifact?.tags?.join(', ') || ''
  const activeBrainSelectedProvider = getBrainProviderLabel(
    lastBrainRoutingDecision?.selectedProvider,
  )
  const activeBrainResolvedProvider = getBrainProviderLabel(
    lastBrainRoutingDecision?.resolvedProvider ||
      lastBrainRoutingDecision?.selectedProvider,
  )
  const activeBrainFallbackProvider = getBrainProviderLabel(
    lastBrainRoutingDecision?.fallbackProvider,
  )
  const activeBrainFallbackUsed = lastBrainRoutingDecision?.fallbackUsed === true
  const activeBrainRoutingReason = summarizeInlineText(
    lastBrainRoutingDecision?.reason,
    180,
  )
  const activeBrainRoutingMode =
    getBrainRoutingModeLabel(lastBrainRoutingDecision?.routingMode) ||
    'Sin decisión registrada'
  const activeBrainProblemNature =
    getBrainProblemNatureLabel(lastBrainRoutingDecision?.problemNature)
  const activeBrainRoutingConfidence =
    typeof lastBrainRoutingDecision?.confidence === 'number'
      ? `${Math.round(lastBrainRoutingDecision.confidence * 100)}%`
      : 'No disponible'
  const activeReuseFoundCount = Math.max(
    effectivePlannerExecutionMetadata.reusableArtifactsFound,
    effectivePlannerExecutionMetadata.reusableArtifactLookup?.foundCount || 0,
  )
  const activeContextHubStatus = effectivePlannerExecutionMetadata.contextHubStatus
  const activeContextHubLabel = activeContextHubStatus?.available
    ? 'Context Hub disponible'
    : 'Context Hub no disponible'
  const activeContextHubDetail = activeContextHubStatus?.available
    ? [
        activeContextHubStatus.title
          ? `Pack: ${activeContextHubStatus.title}`
          : activeContextHubStatus.slug || activeContextHubStatus.id
            ? `Pack: ${
                activeContextHubStatus.title ||
                activeContextHubStatus.slug ||
                activeContextHubStatus.id
              }`
            : '',
        Number.isInteger(activeContextHubStatus.itemsCount)
          ? `Items: ${activeContextHubStatus.itemsCount}`
          : '',
        Number.isFinite(activeContextHubStatus.estimatedTokens)
          ? `Tokens estimados: ${activeContextHubStatus.estimatedTokens}`
          : '',
      ]
        .filter(Boolean)
        .join(' · ') || 'JEFE consultó MEMORIA externa antes de planificar.'
    : [
        'JEFE continúa sin memoria externa.',
        activeContextHubStatus?.reason ? `Motivo: ${activeContextHubStatus.reason}` : '',
      ]
        .filter(Boolean)
        .join(' ')
  const activeContextHubEndpointLabel =
    activeContextHubStatus?.endpoint || '/v1/packs/suggested'
  const activeContextHubUiDetail = [activeContextHubDetail, `Endpoint: ${activeContextHubEndpointLabel}`]
    .filter(Boolean)
    .join(' · ')
  const activeReuseModeLabelLegacy =
    effectivePlannerExecutionMetadata.reuseMode === 'reuse-style-and-structure'
      ? 'Reutilizar estilo y estructura'
      : effectivePlannerExecutionMetadata.reuseMode === 'reuse-style'
        ? 'Reutilizar estilo'
        : effectivePlannerExecutionMetadata.reuseMode === 'reuse-structure'
          ? 'Reutilizar estructura'
          : effectivePlannerExecutionMetadata.reuseMode === 'inspiration-only'
            ? 'Solo inspiración'
            : 'Sin reutilización'
  const activeReuseArtifactIdsLegacy =
    effectivePlannerExecutionMetadata.reusedArtifactIds.length > 0
      ? effectivePlannerExecutionMetadata.reusedArtifactIds
      : (effectivePlannerExecutionMetadata.reusableArtifactLookup?.matches || [])
          .slice(0, 2)
          .map((match) => match.id)
  const activeReuseDetailLabelLegacy =
    summarizeInlineText(
      effectivePlannerExecutionMetadata.reuseReason ||
        (activeReuseFoundCount > 0
          ? `Se detectaron ${activeReuseFoundCount} artefacto(s) reutilizables.`
          : 'No se detectaron artefactos reutilizables para este objetivo.'),
      180,
    )
  const hasAppliedReusableContext =
    effectivePlannerExecutionMetadata.reuseDecision === true &&
    normalizeOptionalString(effectivePlannerExecutionMetadata.reuseMode).toLocaleLowerCase() !==
      'none'
  const activeReuseModeLabel = getReuseModeLabel(effectivePlannerExecutionMetadata.reuseMode)
  const activeAppliedReuseArtifactIds = hasAppliedReusableContext
    ? effectivePlannerExecutionMetadata.reusedArtifactIds
    : []
  const activeReuseSuggestionIds = (effectivePlannerExecutionMetadata.reusableArtifactLookup?.matches ||
    [])
    .slice(0, 2)
    .map((match) => match.id)
  const activeReuseDetailLabel = summarizeInlineText(
    hasAppliedReusableContext
      ? effectivePlannerExecutionMetadata.reuseReason ||
          `Se aplico memoria reusable en modo ${effectivePlannerExecutionMetadata.reuseMode}.`
      : activeReuseFoundCount > 0
        ? `Se detectaron ${activeReuseFoundCount} artefacto(s) como referencia, pero no se aplico reutilizacion.`
        : 'No se detectaron artefactos reutilizables para este objetivo.',
    180,
  )
  const activeReuseArtifactSummary = hasAppliedReusableContext
    ? activeAppliedReuseArtifactIds.join(', ') || 'Sin artefactos asociados'
    : activeReuseSuggestionIds.length > 0
      ? `Referencias disponibles: ${activeReuseSuggestionIds.join(', ')}`
      : 'Sin referencias disponibles'
  const activeReuseArtifactsPanelLabel = hasAppliedReusableContext
    ? 'Artefactos aplicados'
    : 'Referencias disponibles'
  void [activeReuseModeLabelLegacy, activeReuseArtifactIdsLegacy, activeReuseDetailLabelLegacy]
  const activeReuseManualSummary =
    manualReuseMode === 'auto'
      ? 'Búsqueda automática'
      : selectedReusableArtifact?.id
        ? `${manualReuseModeLabel} desde ${selectedReusableArtifact.id}`
        : manualReuseMode === 'none'
          ? 'No reutilizar'
          : `${manualReuseModeLabel} sin artefacto seleccionado`
  const resolvedExecutionModeForUi =
    inferExecutionModeFromResultText(executorResult) ||
    inferExecutionModeFromSnapshot(lastExecutorSnapshot) ||
    normalizeOptionalString(lastObservedExecutionMode) ||
    normalizeOptionalString(plannerExecutionMetadata.executionMode)
  const activeExecutionModeLabel = getExecutionModeLabel(resolvedExecutionModeForUi)
  const activeDecisionKeyLabel =
    getDecisionKeyLabel(plannerExecutionMetadata.decisionKey)
  const activePlannerStrategyLabel =
    getPlannerStrategyLabel(plannerExecutionMetadata.strategy)
  const latestExecutionRunSummary = executionRunSummaries[0] || null
  const runtimeExecutorModeLabel = formatExecutorRuntimeModeLabel(
    runtimeStatus.executorMode,
    runtimeStatus.bridgeMode,
  )
  const runtimeExecutorModeDetail = formatExecutorRuntimeModeDetail({
    executorModeSource: runtimeStatus.executorModeSource,
    bridgeMode: runtimeStatus.bridgeMode,
    bridgeModeSource: runtimeStatus.bridgeModeSource,
  })
  const latestExecutorModeValue =
    normalizeOptionalString(lastExecutorSnapshot?.executorMode) ||
    normalizeOptionalString(latestExecutionRunSummary?.latestExecutorMode) ||
    normalizeOptionalString(runtimeStatus.executorMode)
  const latestBridgeModeValue =
    normalizeOptionalString(lastExecutorSnapshot?.bridgeMode) ||
    normalizeOptionalString(latestExecutionRunSummary?.latestBridgeMode) ||
    normalizeOptionalString(runtimeStatus.bridgeMode)
  const latestExecutorModeSource =
    normalizeOptionalString(lastExecutorSnapshot?.executorModeSource) ||
    normalizeOptionalString(runtimeStatus.executorModeSource)
  const latestBridgeModeSource =
    normalizeOptionalString(lastExecutorSnapshot?.bridgeModeSource) ||
    normalizeOptionalString(runtimeStatus.bridgeModeSource)
  const latestExecutorCommand =
    normalizeOptionalString(lastExecutorSnapshot?.executorCommand) || ''
  const activeExecutorRuntimeLabel = formatExecutorRuntimeModeLabel(
    latestExecutorModeValue,
    latestBridgeModeValue,
  )
  const activeExecutorRuntimeDetail = formatExecutorRuntimeModeDetail({
    executorModeSource: latestExecutorModeSource,
    bridgeMode: latestBridgeModeValue,
    bridgeModeSource: latestBridgeModeSource,
    executorCommand: latestExecutorCommand,
  })
  const fastRouteDetected = isLocalFastRouteExecution({
    strategy: lastExecutorSnapshot?.strategy,
    materializationPlanSource: lastExecutorSnapshot?.materializationPlanSource,
    materialState: lastExecutorSnapshot?.materialState,
    executionMode: resolvedExecutionModeForUi,
    decisionKey: plannerExecutionMetadata.decisionKey,
  })
  const latestMaterializationStrategy =
    normalizeOptionalString(lastExecutorSnapshot?.strategy) ||
    (fastRouteDetected ? 'local-deterministic-materialization' : '')
  const latestReasoningLayer =
    normalizeOptionalString(lastExecutorSnapshot?.reasoningLayer) ||
    (fastRouteDetected ? 'local-rules' : '')
  const latestMaterializationLayer =
    normalizeOptionalString(lastExecutorSnapshot?.materializationLayer) ||
    (fastRouteDetected ? 'local-deterministic' : '')
  const latestMaterializationPlanSource = normalizeOptionalString(
    lastExecutorSnapshot?.materializationPlanSource,
  )
  const latestBrainStrategy = normalizeOptionalString(lastExecutorSnapshot?.brainStrategy)
  const latestValidationResults = normalizeValidationResults(lastExecutorSnapshot?.validationResults)
  const inferValidationEntryKind = (
    entry: ExecutorValidationResult,
  ): 'file' | 'folder' | '' => {
    if (entry.expectedKind === 'file' || entry.expectedKind === 'folder') {
      return entry.expectedKind
    }

    const normalizedTargetPath = normalizeOptionalString(entry.targetPath).replace(/\\/g, '/')

    if (!normalizedTargetPath) {
      return ''
    }

    const lastTargetSegment = normalizedTargetPath.split('/').filter(Boolean).at(-1) || ''
    return lastTargetSegment.includes('.') ? 'file' : 'folder'
  }
  const latestValidationOkCount = latestValidationResults.filter((entry) => entry.ok !== false).length
  const latestValidatedFolderCount = latestValidationResults.filter(
    (entry) => entry.ok !== false && inferValidationEntryKind(entry) === 'folder',
  ).length
  const latestValidatedFileCount = latestValidationResults.filter(
    (entry) => entry.ok !== false && inferValidationEntryKind(entry) === 'file',
  ).length
  const contextualExecutorModeCardLabel = fastRouteDetected
    ? 'Modo de ejecucion'
    : 'Modo del executor'
  const contextualExecutorModeLabel = fastRouteDetected
    ? 'Ruta rapida local'
    : activeExecutorRuntimeLabel
  const contextualExecutorModeDetail = fastRouteDetected
    ? [
        latestReasoningLayer ? `Cerebro: ${latestReasoningLayer}` : '',
        latestMaterializationLayer ? `Materializacion: ${latestMaterializationLayer}` : '',
        latestBrainStrategy ? `Plantilla: ${latestBrainStrategy}` : '',
      ]
        .filter(Boolean)
        .join(' · ') || 'Ruta rapida resuelta en el proceso local'
    : activeExecutorRuntimeDetail
  const contextualConnectionLabel = fastRouteDetected
    ? 'Resuelta localmente'
    : runtimeStatus.connection
  const contextualConnectionDetail = fastRouteDetected
    ? 'Electron materializo la salida sin bridge ni Codex.'
    : `${runtimeStatus.platform} · Electron ${runtimeStatus.electron}`
  const contextualRuntimeCardLabel = fastRouteDetected
    ? 'Materializacion'
    : 'Runtime del executor'
  const contextualRuntimeLabel = fastRouteDetected
    ? latestMaterializationLayer || 'local-deterministic'
    : runtimeExecutorModeLabel
  const contextualRuntimeDetail = fastRouteDetected
    ? latestMaterializationPlanSource || latestMaterializationStrategy || 'Sin fuente reportada'
    : runtimeExecutorModeDetail
  const visibleExecutionRunSummaries = executionRunSummaries.slice(0, 3)
  const shouldShowLatestExecutionRunSummaryInOperationalReading =
    Boolean(latestExecutionRunSummary) &&
    !decisionPending &&
    !plannerNeedsUserClarification &&
    executorRequestState !== 'idle'
  const latestCreatedArtifacts = normalizeOptionalStringArray(lastExecutorSnapshot?.createdPaths)
  const latestTouchedArtifactsRaw = normalizeOptionalStringArray(lastExecutorSnapshot?.touchedPaths)
  const latestTouchedArtifacts = mergeUniqueStringValues(
    latestCreatedArtifacts,
    lastExecutorSnapshot?.touchedPaths,
    12,
  )
  const latestCurrentTargetPath = normalizeOptionalString(lastExecutorSnapshot?.currentTargetPath)
  const latestAllowedTargetPaths = normalizeOptionalStringArray(
    plannerExecutionMetadata.executionScope?.allowedTargetPaths,
  )
  const latestBlockedTargetPaths = normalizeOptionalStringArray(
    plannerExecutionMetadata.executionScope?.blockedTargetPaths,
  )
  const latestScopeSuccessCriteria = normalizeOptionalStringArray(
    plannerExecutionMetadata.executionScope?.successCriteria,
  )
  const latestContinuationAnchor = summarizeContinuationAnchor(
    plannerExecutionMetadata.executionScope?.continuationAnchor,
  )
  const latestExecutionScopeSummary = summarizeExecutionScope(
    plannerExecutionMetadata.executionScope,
  )
  const latestReuseAppliedFields = normalizeOptionalStringArray(
    lastExecutorSnapshot?.reuseAppliedFields,
  )
  const latestReusedStyleArtifactId = normalizeOptionalString(
    lastExecutorSnapshot?.reusedStyleFromArtifactId,
  )
  const latestReusedStructureArtifactId = normalizeOptionalString(
    lastExecutorSnapshot?.reusedStructureFromArtifactId,
  )
  const latestAppliedReuseArtifactIds = [
    latestReusedStyleArtifactId,
    latestReusedStructureArtifactId,
  ].filter(Boolean)
  const latestAppliedReuseModeRaw = normalizeOptionalString(
    lastExecutorSnapshot?.appliedReuseMode,
  )
  const plannerRequestedReuseMode = normalizeOptionalString(
    plannerExecutionMetadata.reuseMode,
  )
  const latestReuseApplied =
    (latestAppliedReuseModeRaw &&
      latestAppliedReuseModeRaw.toLocaleLowerCase() !== 'none') ||
    latestAppliedReuseArtifactIds.length > 0 ||
    latestReuseAppliedFields.length > 0
  const latestAppliedReuseMode = latestReuseApplied
    ? latestAppliedReuseModeRaw || plannerRequestedReuseMode || 'none'
    : 'none'
  const latestAppliedReuseModeLabel = latestReuseApplied
    ? getReuseModeLabel(latestAppliedReuseMode)
    : 'Sin reutilización aplicada'
  const latestReusableReferenceSummary =
    activeReuseSuggestionIds.length > 0
      ? activeReuseSuggestionIds.join(', ')
      : 'Sin referencias disponibles'
  const visibleFinalTextResponse =
    shouldShowLatestExecutionRunSummaryInOperationalReading &&
    latestExecutionRunSummary?.status === 'success' &&
    latestTouchedArtifacts.length === 0
      ? normalizeOptionalString(lastRunSummary.result) ||
        normalizeOptionalString(executorResult)
      : ''
  const shouldShowVisibleFinalTextResponse =
    Boolean(visibleFinalTextResponse) &&
    visibleFinalTextResponse !== DEFAULT_LAST_RUN_TEXT &&
    visibleFinalTextResponse !== DEFAULT_EXECUTOR_RESULT
  const resultStatusPresentation = deriveResultStatusPresentation({
    runStatus: latestExecutionRunSummary?.status,
    requestState: executorRequestState,
    sessionStatus,
    finalStatus: lastRunSummary.finalStatus,
  })
  const resultHumanText = shouldShowVisibleFinalTextResponse
    ? visibleFinalTextResponse
    : normalizeOptionalString(lastRunSummary.result) ||
      normalizeOptionalString(executorResult) ||
      'No hay un resultado visible consolidado.'
  const resultHumanSummary = summarizeInlineText(resultHumanText, 180)
  const resultPrimaryAffectedPath = derivePrimaryAffectedPath({
    createdPaths: latestCreatedArtifacts,
    touchedPaths: latestTouchedArtifactsRaw,
    currentTargetPath: latestCurrentTargetPath,
  })
  const resultPrimaryAffectedPathLabel = formatWorkspaceRelativePath(
    resultPrimaryAffectedPath,
    workspacePath,
  )
  const resultCurrentTargetPathLabel = formatWorkspaceRelativePath(
    latestCurrentTargetPath,
    workspacePath,
  )
  const resultCreatedPaths = latestCreatedArtifacts.map((pathValue) =>
    formatWorkspaceRelativePath(pathValue, workspacePath),
  )
  const resultTouchedPaths = latestTouchedArtifactsRaw.map((pathValue) =>
    formatWorkspaceRelativePath(pathValue, workspacePath),
  )
  const resultAllowedPaths = latestAllowedTargetPaths.map((pathValue) =>
    formatWorkspaceRelativePath(pathValue, workspacePath),
  )
  const resultBlockedPaths = latestBlockedTargetPaths.map((pathValue) =>
    formatWorkspaceRelativePath(pathValue, workspacePath),
  )
  const resultValidationItems = latestValidationResults.map((entry, index) => ({
    key: `${index}-${entry.type || 'validation'}-${entry.targetPath || 'target'}`,
    ok: entry.ok !== false,
    label:
      formatWorkspaceRelativePath(entry.targetPath, workspacePath) ||
      'Ruta no reportada',
    detail: [
      normalizeOptionalString(entry.type) || 'validación',
      normalizeOptionalString(entry.expectedKind),
    ]
      .filter(Boolean)
      .join(' · '),
  }))
  const inferredValidationCount = latestValidatedFolderCount + latestValidatedFileCount
  const inferredValidationSummaryParts = [
    latestValidatedFolderCount > 0 ? `${latestValidatedFolderCount} carpeta(s)` : '',
    latestValidatedFileCount > 0 ? `${latestValidatedFileCount} archivo(s)` : '',
  ].filter(Boolean)
  const resultValidationSummaryText =
    latestValidationResults.length > 0
      ? inferredValidationCount > 0
        ? `${inferredValidationSummaryParts.join(' y ')} validados.`
        : `${latestValidationResults.length} validación(es) reportadas.`
      : 'La corrida no devolvió validaciones estructuradas.'
  const resultScopeRespected =
    resultBlockedPaths.length > 0 &&
    resultBlockedPaths.every((pathValue) => {
      const comparableBlockedPath = buildComparablePath(pathValue, workspacePath)

      if (!comparableBlockedPath) {
        return true
      }

      return ![...latestCreatedArtifacts, ...latestTouchedArtifactsRaw].some(
        (artifactPath) =>
          buildComparablePath(artifactPath, workspacePath) === comparableBlockedPath,
      )
    })
  const resultCodexLabel = fastRouteDetected
    ? 'No requerido'
    : latestBridgeModeValue.toLocaleLowerCase() === 'codex' ||
        activeExecutorRuntimeLabel === 'Real (Codex)'
      ? 'Usado'
      : latestBridgeModeValue && latestBridgeModeValue.toLocaleLowerCase() !== 'unknown'
        ? 'No requerido'
        : 'No disponible'
  const resultBridgeLabel = fastRouteDetected
    ? 'No usado'
    : latestBridgeModeValue && latestBridgeModeValue.toLocaleLowerCase() !== 'unknown'
      ? latestBridgeModeValue.toLocaleLowerCase() === 'codex'
        ? 'Codex'
        : latestBridgeModeValue
      : 'No disponible'
  const resultSuggestedActions = [
    resultPrimaryAffectedPathLabel
      ? {
          title: 'Abrir carpeta',
          detail: `Revisar ${resultPrimaryAffectedPathLabel} para continuar sobre la salida generada.`,
        }
      : null,
    [...resultCreatedPaths, ...resultTouchedPaths].some((pathValue) =>
      pathValue.toLocaleLowerCase().endsWith('index.html'),
    )
      ? {
          title: 'Abrir index.html en el navegador',
          detail: 'Sirve para validar rápido el resultado visual y el copy final.',
        }
      : null,
    resultStatusPresentation.label === 'Ejecución completada'
      ? {
          title: 'Guardar como reusable',
          detail: 'Si el cierre te sirve como base, conviene registrarlo como memoria reutilizable.',
        }
      : null,
    resultStatusPresentation.label === 'Ejecución completada'
      ? {
          title: 'Crear variante reutilizando estilo',
          detail: 'Buena opción para iterar una nueva versión sin perder la identidad visual.',
        }
      : null,
    resultStatusPresentation.label === 'Ejecución completada'
      ? {
          title: 'Crear variante reutilizando estructura',
          detail: 'Útil cuando la composición ya funciona y querés cambiar rubro o contenido.',
        }
      : null,
    {
      title: 'Revisar consola técnica',
      detail: 'Usá el panel avanzado o la consola del flujo si querés inspeccionar detalle técnico.',
    },
  ].filter((item): item is { title: string; detail: string } => item !== null)
  const resultScopeSummaryLabel =
    latestExecutionScopeSummary || 'Sin alcance restringido para resumir'
  const resultReusableSummaryLabel =
    !latestReuseApplied
      ? 'Sin reutilización aplicada'
      : latestAppliedReuseArtifactIds.length > 0
        ? latestAppliedReuseArtifactIds.join(', ')
        : latestReuseAppliedFields.length > 0
          ? latestReuseAppliedFields.join(', ')
          : 'Sin artefacto reportado'
  const resultReusableSupportLabel = latestReuseApplied
    ? 'Campos aplicados'
    : 'Referencias disponibles'
  const resultReusableSupportValue = latestReuseApplied
    ? latestReuseAppliedFields.length > 0
      ? latestReuseAppliedFields.join(', ')
      : 'Sin campos reportados'
    : latestReusableReferenceSummary
  const resultIsSafeFirstDeliveryMaterialization =
    resultStatusPresentation.label === 'Ejecución completada' &&
    (isSafeFirstDeliveryMaterializationDecision(plannerExecutionMetadata.decisionKey) ||
      isSafeFirstDeliveryMaterializationDecision(plannerExecutionMetadata.strategy) ||
      isSafeFirstDeliveryMaterializationDecision(latestBrainStrategy))
  const resultMaterializationFilePaths = mergeUniqueStringValues(
    latestCreatedArtifacts.filter((pathValue) => isLikelyFilePath(pathValue)),
    latestTouchedArtifactsRaw.filter((pathValue) => isLikelyFilePath(pathValue)),
    12,
  )
  const resultMaterializationFileLabels = mergeUniqueStringValues(
    resultMaterializationFilePaths.map((pathValue) => getPathLeafName(pathValue)),
    latestAllowedTargetPaths
      .filter((pathValue) => isLikelyFilePath(pathValue))
      .map((pathValue) => getPathLeafName(pathValue)),
    8,
  )
  const resultMaterializationFolderLabel =
    resultPrimaryAffectedPathLabel ||
    formatWorkspaceRelativePath(
      latestAllowedTargetPaths.find((pathValue) => !isLikelyFilePath(pathValue)),
      workspacePath,
    ) ||
    'No disponible'
  const resultMaterializationIndexPathLabel =
    formatWorkspaceRelativePath(
      [
        ...resultMaterializationFilePaths,
        ...latestAllowedTargetPaths.filter((pathValue) => isLikelyFilePath(pathValue)),
      ].find((pathValue) => getPathLeafName(pathValue).toLocaleLowerCase() === 'index.html'),
      workspacePath,
    ) || 'No disponible'
  const resultMaterializationStats = parseMaterializationExecutionStats(resultHumanText)
  const resultMaterializationOperationsLabel =
    resultMaterializationStats.operationsCount > 0
      ? `${resultMaterializationStats.operationsCount} operación(es)`
      : 'No reportadas'
  const resultMaterializationValidationsLabel =
    resultMaterializationStats.validationsCount > 0
      ? `${resultMaterializationStats.validationsCount} validación(es)`
      : latestValidationResults.length > 0
        ? `${latestValidationResults.length} validación(es)`
        : 'No reportadas'
  const resultMaterializationEngineLabel = latestMaterializationLayer || 'No disponible'
  const resultMaterializationBridgeDetail =
    latestMaterializationLayer === 'local-deterministic' || fastRouteDetected
      ? 'No se usó bridge y Codex no fue requerido para materializar esta salida.'
      : 'La corrida no informó una resolución completamente local.'
  const resultMaterializationLimits = [
    'Datos mock editables.',
    'Sin backend real.',
    'Sin autenticación real.',
    'Sin pagos reales.',
    'Sin deploy.',
  ]
  const resultMaterializationSuggestedNextSteps = [
    resultMaterializationIndexPathLabel !== 'No disponible'
      ? `Abrir ${resultMaterializationIndexPathLabel} en el navegador para revisar la interfaz.`
      : 'Abrir el index.html generado para revisar la interfaz.',
    'Validar las acciones locales y el log de actividad de la entrega mock.',
    'Recién después definir la siguiente fase o una nueva materialización más profunda.',
  ]
  const latestHumanDecision = [...resolvedDecisions]
    .filter(
      (record) =>
        Boolean(normalizeOptionalString(record.selectedOption)) ||
        Boolean(normalizeOptionalString(record.freeAnswer)) ||
        record.status === 'approved' ||
        record.status === 'rejected',
    )
    .sort((leftRecord, rightRecord) =>
      resolveLatestDecisionTimestamp(rightRecord).localeCompare(
        resolveLatestDecisionTimestamp(leftRecord),
      ),
    )[0]
  const latestHumanDecisionSummary = latestHumanDecision
    ? [
        getResolvedDecisionStatusLabel(latestHumanDecision),
        normalizeOptionalString(latestHumanDecision.selectedOption),
        normalizeOptionalString(latestHumanDecision.freeAnswer),
        normalizeOptionalString(latestHumanDecision.summary),
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Todavía no hay una respuesta humana relevante registrada'
  const activeApprovalStatusLabel = decisionPending
    ? `Pendiente desde ${approvalSource === 'executor' ? 'el Ejecutor' : 'el Planificador'}`
    : projectPolicyAllowed
      ? 'Hay una aprobación persistente vigente para el proyecto'
      : 'No hay una aprobación vigente en este momento'
  const recentApprovalRecords = [...resolvedDecisions]
    .filter(
      (record) =>
        record.status === 'approved' ||
        record.status === 'rejected' ||
        Boolean(normalizeOptionalString(record.selectedOption)) ||
        Boolean(normalizeOptionalString(record.freeAnswer)),
    )
    .sort((leftRecord, rightRecord) =>
      resolveLatestDecisionTimestamp(rightRecord).localeCompare(
        resolveLatestDecisionTimestamp(leftRecord),
      ),
    )
    .slice(0, 5)
  const activeApprovalDetailLabel = decisionPending
    ? summarizeInlineText(approvalMessage || visiblePendingInstruction, 180)
    : latestHumanDecisionSummary
  const activeOperationalE2eScenarioLabel =
    shouldShowLatestExecutionRunSummaryInOperationalReading && latestExecutionRunSummary
      ? latestExecutionRunSummary.scenarioLabel
      : 'Sin corrida registrada'
  const activeOperationalE2eStatusLabel =
    shouldShowLatestExecutionRunSummaryInOperationalReading && latestExecutionRunSummary
      ? getExecutionRunStatusLabel(latestExecutionRunSummary.status)
      : decisionPending
        ? 'Esperando aprobación'
        : plannerNeedsUserClarification
          ? 'Consulta al usuario'
          : 'Todavía no hay un cierre para mostrar'
  const activeWizardStepIndex = GUIDED_WIZARD_STEPS.findIndex(
    (step) => step.key === activeWizardStep,
  )
  const activeWizardStepConfig =
    GUIDED_WIZARD_STEPS[activeWizardStepIndex] || GUIDED_WIZARD_STEPS[0]
  const reusableWizardArtifacts = reusableArtifacts.slice(0, 3)
  const hasWizardPlan =
    plannerInstruction.trim() !== '' &&
    plannerInstruction !== DEFAULT_PLANNER_INSTRUCTION
  const wizardCanShowResult =
    shouldShowVisibleFinalTextResponse ||
    Boolean(latestExecutionRunSummary) ||
    executorRequestState === 'success' ||
    executorRequestState === 'error'
  const activeSectionConfig =
    APP_NAV_SECTIONS.find((section) => section.key === activeSection) ||
    APP_NAV_SECTIONS[0]
  const flowModeLabel = isAutoFlowRunning
    ? 'Flujo automático'
    : 'Operación manual'
  const flowStageLabel = decisionPending
    ? 'Esperando aprobación'
    : isPlanning
      ? 'Planificando'
      : isExecutingTask
        ? 'Ejecutando'
        : sessionStatus.toLocaleLowerCase().includes('error')
          ? 'Error'
          : 'Listo'
  const flowApprovalPendingLabel = decisionPending ? 'Sí' : 'No'
  const flowApprovalSourceLabel =
    approvalSource === 'planner'
      ? 'Planificador'
      : approvalSource === 'executor'
        ? 'Ejecutor'
        : 'No aplica'
  const hasLastExecutorSnapshot =
    lastExecutorSnapshot !== null &&
    Object.values(lastExecutorSnapshot).some((value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value),
    )
  const isShowingPreExecutionPlanState =
    !decisionPending &&
    !plannerNeedsUserClarification &&
    !isPlanning &&
    !isExecutingTask &&
    executorRequestState === 'idle' &&
    !hasLastExecutorSnapshot &&
    executorResult === DEFAULT_EXECUTOR_RESULT
  const visibleCurrentStepLabel = decisionPending
    ? 'El Cerebro necesita una decision humana antes de seguir'
    : plannerNeedsUserClarification
      ? 'El Cerebro necesita una nueva definición antes de ejecutar'
      : isShowingPreExecutionPlanState
        ? buildPlannedCurrentStepLabel({
            plannerInstruction,
            executionMode: plannerExecutionMetadata.executionMode,
          })
        : currentStep
  const liveActivityEvents = [...sessionEvents].slice(-6).reverse()
  const latestFlowMessage = flowMessages.at(-1)
  const flowExecutionFinished =
    sessionStatus.toLocaleLowerCase().includes('error') ||
    sessionStatus.toLocaleLowerCase().includes('complet') ||
    executorRequestState === 'success' ||
    executorRequestState === 'error'
  const flowExecutionStageIndex =
    flowExecutionFinished
      ? 4
      : latestFlowMessage?.source === 'codex'
        ? 3
        : latestFlowMessage?.source === 'executor' ||
            isExecutingTask ||
            executorRequestState === 'running'
          ? 2
          : latestFlowMessage?.source === 'planificador' || isPlanning
            ? 1
            : 0
  const flowExecutionStages = [
    'Objetivo',
    'Planificador',
    'Ejecutor',
    'Codex',
    'Resultado',
  ]
  const flowExecutionStageStates = flowExecutionStages.map((stage, index) => {
    if (fastRouteDetected && stage === 'Codex') {
      return 'not-required' as const
    }

    if (!flowExecutionFinished && index === flowExecutionStageIndex) {
      return 'active' as const
    }

    if (
      (flowExecutionFinished && index <= flowExecutionStageIndex) ||
      (!flowExecutionFinished && index < flowExecutionStageIndex)
    ) {
      return 'completed' as const
    }

    return 'pending' as const
  })
  const flowExecutionHeaderLabel = flowExecutionFinished
    ? sessionStatus.toLocaleLowerCase().includes('error') ||
      executorRequestState === 'error'
      ? 'Finalizada con error'
      : fastRouteDetected
        ? 'Finalizada · ruta rapida local'
        : 'Finalizada'
    : flowExecutionStages[flowExecutionStageIndex]
  const normalizedGoalInput = goalInput.trim() || 'Sin objetivo definido'

  const handleWizardBack = () => {
    if (activeWizardStepIndex <= 0) {
      return
    }

    setActiveWizardStep(GUIDED_WIZARD_STEPS[activeWizardStepIndex - 1].key)
  }

  const handleWizardNext = () => {
    if (activeWizardStep === 'goal') {
      setActiveWizardStep('context')
      return
    }

    if (activeWizardStep === 'context') {
      setActiveWizardStep('brain')
      return
    }

    if (activeWizardStep === 'brain') {
      setActiveWizardStep('memory')
      return
    }

    if (activeWizardStep === 'execution' && wizardCanShowResult) {
      setActiveWizardStep('result')
    }
  }

  const handleWizardGeneratePlan = async () => {
    await handleGenerateNextStep()
    setActiveWizardStep('plan')
  }

  const handleWizardExecute = async () => {
    setActiveWizardStep('execution')
    await handleExecuteCurrentInstruction()
  }

  const handleWizardStartOver = () => {
    setActiveWizardStep('goal')
  }

  useEffect(() => {
    if (
      decisionPending ||
      isExecutingTask ||
      executorRequestState === 'running'
    ) {
      setActiveWizardStep('execution')
    }
  }, [decisionPending, executorRequestState, isExecutingTask])
  const getExecutionRunScenarioTone = (
    scenarioLabel: ExecutionRunSummary['scenarioLabel'],
  ) => {
    if (scenarioLabel === 'Caso feliz base') {
      return 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
    }

    if (
      scenarioLabel === 'Falla recuperable' ||
      scenarioLabel === 'Recovery exitoso'
    ) {
      return 'border-amber-300/20 bg-amber-300/10 text-amber-100'
    }

    if (scenarioLabel === 'Bloqueo por repeticion equivalente') {
      return 'border-rose-300/20 bg-rose-300/10 text-rose-100'
    }

    if (scenarioLabel === 'Corrida fallida') {
      return 'border-red-300/20 bg-red-300/10 text-red-100'
    }

    return 'border-sky-300/20 bg-sky-300/10 text-sky-100'
  }
  function getExecutionRunStatusLabel(status: ExecutionRunSummary['status']) {
    if (status === 'approval-pending') {
      return 'Esperando aprobación'
    }

    if (status === 'recovery-pending') {
      return 'Recuperación pendiente'
    }

    if (status === 'success') {
      return 'Completada'
    }

    if (status === 'error') {
      return 'Cerrada con error'
    }

    return 'En curso'
  }
  const formatExecutorError = (response?: {
    error?: string
    failureType?: string
    details?: ExecutorFailureContext & {
      exitCode?: number
    }
  }) => {
    const lines = [`Error: ${response?.error || 'Falló la ejecución del ejecutor'}`]

    const failureContext = extractExecutorFailureContext(response)

    if (normalizeOptionalString(response?.failureType)) {
      lines.push(`Tipo de fallo: ${normalizeOptionalString(response?.failureType)}`)
    }

    if (typeof response?.details?.exitCode === 'number') {
      lines.push(`Código de salida: ${response.details.exitCode}`)
    }

    if (failureContext?.currentSubtask || failureContext?.currentStep) {
      lines.push(
        `Subtarea: ${failureContext.currentSubtask || failureContext.currentStep}`,
      )
    }

    if (failureContext?.currentAction) {
      lines.push(`Accion: ${failureContext.currentAction}`)
    }

    if (failureContext?.currentTargetPath) {
      lines.push(`Archivo o ruta: ${failureContext.currentTargetPath}`)
    }

    if (failureContext?.currentCommand) {
      lines.push(`Comando: ${failureContext.currentCommand.slice(0, 220)}`)
    }

    if (Array.isArray(failureContext?.createdPaths) && failureContext.createdPaths.length > 0) {
      lines.push(
        `Avances parciales: ${failureContext.createdPaths.slice(0, 6).join(', ')}`,
      )
    }

    if (Array.isArray(failureContext?.touchedPaths) && failureContext.touchedPaths.length > 0) {
      lines.push(
        `Archivos tocados: ${failureContext.touchedPaths.slice(0, 6).join(', ')}`,
      )
    }

    if (failureContext?.stderr) {
      lines.push(`stderr: ${failureContext.stderr.slice(0, 220)}`)
    }

    if (failureContext?.stdout) {
      lines.push(`stdout: ${failureContext.stdout.slice(0, 220)}`)
    }

    return lines.join('\n')
  }
  const formatStructuredContent = (value: unknown) => {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  const addFlowMessage = (message: ExecutorTraceEntry) => {
    flowMessageIdRef.current += 1
    setFlowMessages((currentMessages) => [
      ...currentMessages,
      {
        id: flowMessageIdRef.current,
        ...message,
      },
    ])
  }
  const addFlowMessages = (messages?: ExecutorTraceEntry[]) => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return
    }

    setFlowMessages((currentMessages) => [
      ...currentMessages,
      ...messages.map((message) => {
        flowMessageIdRef.current += 1

        return {
          id: flowMessageIdRef.current,
          ...message,
        }
      }),
    ])
  }
  const addDiagnosticFlowMessage = (
    title: string,
    content: string,
    status: 'info' | 'success' | 'warning' | 'error' = 'info',
    raw?: string,
  ) => {
    addFlowMessage({
      source: 'orquestador',
      title,
      content,
      status,
      ...(raw ? { raw } : {}),
    })
  }
  const debugRendererLog = (label: string, details?: unknown) => {
    if (details === undefined) {
      console.log(`[renderer-debug] ${label}`)
      return
    }

    console.log(`[renderer-debug] ${label}`, details)
  }
  const parseStructuredRaw = (raw?: string) => {
    if (!raw) {
      return undefined
    }

    try {
      return JSON.parse(raw)
    } catch {
      return undefined
    }
  }
  const safelyAddExecutorTrace = (trace: unknown) => {
    if (!Array.isArray(trace)) {
      addDiagnosticFlowMessage(
        'Diagnóstico de trace',
        'La respuesta del ejecutor no trajo una traza en formato de arreglo.',
        'warning',
        formatStructuredContent(trace),
      )
      return
    }

    addFlowMessages(trace as ExecutorTraceEntry[])
    addDiagnosticFlowMessage(
      'Diagnóstico de trace',
      `Se procesaron ${trace.length} mensaje(s) de traza devueltos por el ejecutor.`,
      'info',
    )
  }
  const mergeExecutorSnapshots = (
    currentSnapshot: ExecutorFailureContext | null,
    nextSnapshot: ExecutorFailureContext | null,
  ): ExecutorFailureContext | null => {
    if (!nextSnapshot) {
      return currentSnapshot
    }

    return {
      ...(currentSnapshot || {}),
      ...nextSnapshot,
      ...(Array.isArray(nextSnapshot.createdPaths)
        ? { createdPaths: nextSnapshot.createdPaths }
        : {}),
      ...(Array.isArray(nextSnapshot.touchedPaths)
        ? { touchedPaths: nextSnapshot.touchedPaths }
        : {}),
    }
  }
  const updateLastExecutorSnapshot = (nextSnapshot: ExecutorFailureContext | null) => {
    if (!nextSnapshot) {
      return
    }

    setLastExecutorSnapshot((currentSnapshot) =>
      mergeExecutorSnapshots(currentSnapshot, nextSnapshot),
    )
  }
  const updateLastRunSummary = (
    summary: Partial<typeof DEFAULT_LAST_RUN_SUMMARY>,
  ) => {
    setLastRunSummary((currentSummary) => ({
      ...currentSummary,
      context: currentExecutionContextSummary,
      workspacePath: currentWorkspaceSummary,
      ...summary,
    }))
  }
  const clearVisibleExecutionRuntimeState = ({
    requestState = 'idle',
    result = DEFAULT_EXECUTOR_RESULT,
  }: {
    requestState?: 'idle' | 'running' | 'success' | 'error'
    result?: string
  } = {}) => {
    // Cuando entra un nuevo plan, approval o ask-user, la UI tiene que dejar
    // de narrar la ejecución anterior como si siguiera vigente.
    setLastObservedExecutionMode('')
    setLastExecutorSnapshot(null)
    setExecutorRequestState(requestState)
    setExecutorResult(result)
  }
  const resetPlannerMaterializationAttemptState = ({
    fallbackMetadata,
    fallbackSnapshot,
  }: {
    fallbackMetadata: PlannerExecutionMetadata
    fallbackSnapshot?: PlannerRequestSnapshot | null
  }) => {
    setDecisionPending(false)
    setApprovalMessage('')
    setPendingInstruction('')
    setPendingExecutionInstruction('')
    setApprovalSource('')
    setPlannerInstruction(DEFAULT_PLANNER_INSTRUCTION)
    setPlannerExecutionMetadata(fallbackMetadata)
    setPlannerRequestSnapshot(
      fallbackSnapshot || {
        goal: '',
        context: '',
        decisionKey: '',
        safeFirstDeliveryPlanFingerprint: '',
      },
    )
    clearVisibleExecutionRuntimeState()
  }
  const syncBrainRoutingDecision = (
    decision?: BrainRoutingDecision | null,
  ) => {
    setLastBrainRoutingDecision(
      decision && typeof decision === 'object' ? decision : null,
    )
  }
  const upsertExecutionRunSummary = (
    runId: string,
    updater: (currentSummary: ExecutionRunSummary | null) => ExecutionRunSummary,
  ) => {
    if (!runId) {
      return
    }

    setExecutionRunSummaries((currentSummaries) => {
      const summaryIndex = currentSummaries.findIndex((summary) => summary.runId === runId)
      const currentSummary = summaryIndex >= 0 ? currentSummaries[summaryIndex] : null
      const nextSummary = buildExecutionRunSummary(updater(currentSummary))
      const nextSummaries =
        summaryIndex >= 0
          ? currentSummaries.map((summary, index) =>
              index === summaryIndex ? nextSummary : summary,
            )
          : [nextSummary, ...currentSummaries].slice(0, 6)

      executionRunSummariesRef.current = nextSummaries
      return nextSummaries
    })
  }
  const updateActiveExecutionRunSummary = (
    updater: (currentSummary: ExecutionRunSummary) => ExecutionRunSummary,
  ) => {
    const activeRunId = activeExecutionRunIdRef.current

    if (!activeRunId) {
      return
    }

    upsertExecutionRunSummary(activeRunId, (currentSummary) => {
      if (!currentSummary) {
        return buildExecutionRunSummary({
          runId: activeRunId,
          latestRequestId: '',
          requestIds: [],
          objectiveSummary: 'No disponible',
          instructionSummary: 'No disponible',
          approvalsOpened: 0,
          recoveries: 0,
          repeatedFailureCount: 0,
          latestFailureType: '',
          finalFailureType: '',
          hasMaterialProgress: false,
          createdPaths: [],
          touchedPaths: [],
          latestRecoveryMode: '',
          latestExecutorMode: '',
          latestBridgeMode: '',
          latestDecisionKey: '',
          latestAttemptScope: '',
          latestExecutionScope: '',
          blockedRecoveryModes: [],
          continuationAnchor: '',
          status: 'running',
          updatedAtLabel: new Date().toLocaleTimeString(),
        })
      }

      return updater(currentSummary)
    })
  }
  const startOrContinueExecutionRun = ({
    requestId,
    instruction,
    executionMetadata,
  }: {
    requestId: string
    instruction: string
    executionMetadata: PlannerExecutionMetadata
  }) => {
    const activeRunId = activeExecutionRunIdRef.current
    const activeSummary = executionRunSummariesRef.current.find(
      (summary) => summary.runId === activeRunId,
    )
    const shouldCreateNewRun =
      !activeSummary ||
      activeSummary.status === 'success' ||
      activeSummary.status === 'error'
    const runId = shouldCreateNewRun
      ? `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      : activeRunId

    activeExecutionRunIdRef.current = runId
    upsertExecutionRunSummary(runId, (currentSummary) => {
      const requestIds = currentSummary
        ? currentSummary.requestIds.includes(requestId)
          ? currentSummary.requestIds
          : [...currentSummary.requestIds, requestId]
        : [requestId]
      const latestDecisionKey = normalizeOptionalString(executionMetadata.decisionKey)
      const latestRecoveryMode = latestDecisionKey.startsWith('recover-')
        ? latestDecisionKey
        : currentSummary?.latestRecoveryMode || ''
      const latestExecutionScope =
        summarizeExecutionScope(executionMetadata.executionScope) ||
        currentSummary?.latestExecutionScope ||
        ''
      const continuationAnchor =
        summarizeContinuationAnchor(executionMetadata.executionScope?.continuationAnchor) ||
        currentSummary?.continuationAnchor ||
        ''

      return {
        runId,
        latestRequestId: requestId,
        requestIds,
        objectiveSummary:
          summarizeInlineText(goalInput, 160) ||
          currentSummary?.objectiveSummary ||
          'No disponible',
        instructionSummary: summarizeInlineText(instruction, 160),
        approvalsOpened: currentSummary?.approvalsOpened || 0,
        recoveries: currentSummary?.recoveries || 0,
        repeatedFailureCount: currentSummary?.repeatedFailureCount || 0,
        latestFailureType: currentSummary?.latestFailureType || '',
        finalFailureType: '',
        hasMaterialProgress: currentSummary?.hasMaterialProgress || false,
        createdPaths: currentSummary?.createdPaths || [],
        touchedPaths: currentSummary?.touchedPaths || [],
        latestRecoveryMode,
        latestExecutorMode: currentSummary?.latestExecutorMode || '',
        latestBridgeMode: currentSummary?.latestBridgeMode || '',
        latestDecisionKey,
        latestAttemptScope: '',
        latestExecutionScope,
        blockedRecoveryModes: currentSummary?.blockedRecoveryModes || [],
        continuationAnchor,
        status: 'running',
        updatedAtLabel: new Date().toLocaleTimeString(),
      }
    })
  }
  const recordPlannerExecutionSummary = (executionMetadata: PlannerExecutionMetadata) => {
    if (!activeExecutionRunIdRef.current) {
      return
    }

    const decisionKey = normalizeOptionalString(executionMetadata.decisionKey)
    const isRecoveryDecision =
      decisionKey === 'recover-single-target' ||
      decisionKey === 'recover-single-subtask' ||
      decisionKey === 'recover-and-continue'

    updateActiveExecutionRunSummary((currentSummary) => ({
      ...currentSummary,
      recoveries:
        isRecoveryDecision && currentSummary.latestDecisionKey !== decisionKey
          ? currentSummary.recoveries + 1
          : currentSummary.recoveries,
      latestRecoveryMode:
        isRecoveryDecision ? decisionKey : currentSummary.latestRecoveryMode,
      latestDecisionKey: decisionKey || currentSummary.latestDecisionKey,
      latestExecutionScope:
        summarizeExecutionScope(executionMetadata.executionScope) ||
        currentSummary.latestExecutionScope,
      continuationAnchor:
        summarizeContinuationAnchor(executionMetadata.executionScope?.continuationAnchor) ||
        currentSummary.continuationAnchor,
      status: isRecoveryDecision ? 'recovery-pending' : currentSummary.status,
      updatedAtLabel: new Date().toLocaleTimeString(),
    }))
  }
  const recordApprovalOpenedOnActiveRun = () => {
    updateActiveExecutionRunSummary((currentSummary) => ({
      ...currentSummary,
      approvalsOpened: currentSummary.approvalsOpened + 1,
      status: 'approval-pending',
      updatedAtLabel: new Date().toLocaleTimeString(),
    }))
  }
  const recordExecutionSnapshotOnActiveRun = (snapshot: ExecutorFailureContext | null) => {
    if (!snapshot) {
      return
    }

    updateActiveExecutionRunSummary((currentSummary) => ({
      ...currentSummary,
      hasMaterialProgress:
        currentSummary.hasMaterialProgress ||
        snapshot.hasMaterialProgress === true ||
        Boolean(
          normalizeOptionalString(snapshot.currentTargetPath) ||
            normalizeOptionalStringArray(snapshot.createdPaths).length > 0 ||
            normalizeOptionalStringArray(snapshot.touchedPaths).length > 0,
        ),
      createdPaths: mergeUniqueStringValues(currentSummary.createdPaths, snapshot.createdPaths),
      touchedPaths: mergeUniqueStringValues(currentSummary.touchedPaths, snapshot.touchedPaths),
      latestExecutorMode:
        normalizeOptionalString(snapshot.executorMode) ||
        currentSummary.latestExecutorMode,
      latestBridgeMode:
        normalizeOptionalString(snapshot.bridgeMode) ||
        currentSummary.latestBridgeMode,
      latestAttemptScope:
        normalizeOptionalString(snapshot.attemptScope) ||
        normalizeOptionalString(snapshot.lastAttemptScope) ||
        currentSummary.latestAttemptScope,
      repeatedFailureCount:
        typeof snapshot.repeatedFailureCount === 'number' &&
        snapshot.repeatedFailureCount > 0
          ? snapshot.repeatedFailureCount
          : currentSummary.repeatedFailureCount,
      blockedRecoveryModes:
        normalizeOptionalStringArray(snapshot.blockedRecoveryModes).length > 0
          ? normalizeOptionalStringArray(snapshot.blockedRecoveryModes)
          : currentSummary.blockedRecoveryModes,
      latestFailureType:
        normalizeOptionalString(snapshot.failureType) || currentSummary.latestFailureType,
      updatedAtLabel: new Date().toLocaleTimeString(),
    }))
  }
  const finalizeActiveExecutionRun = ({
    status,
    failureType,
    failureContext,
  }: {
    status: ExecutionRunSummary['status']
    failureType?: string
    failureContext?: ExecutorFailureContext | null
  }) => {
    updateActiveExecutionRunSummary((currentSummary) => ({
      ...currentSummary,
      status,
      latestFailureType:
        normalizeOptionalString(failureType) ||
        normalizeOptionalString(failureContext?.failureType) ||
        currentSummary.latestFailureType,
      finalFailureType:
        status === 'error'
          ? normalizeOptionalString(failureType) ||
            normalizeOptionalString(failureContext?.failureType) ||
            currentSummary.finalFailureType
          : '',
      hasMaterialProgress:
        currentSummary.hasMaterialProgress || failureContext?.hasMaterialProgress === true,
      createdPaths: mergeUniqueStringValues(currentSummary.createdPaths, failureContext?.createdPaths),
      touchedPaths: mergeUniqueStringValues(currentSummary.touchedPaths, failureContext?.touchedPaths),
      latestExecutorMode:
        normalizeOptionalString(failureContext?.executorMode) ||
        currentSummary.latestExecutorMode,
      latestBridgeMode:
        normalizeOptionalString(failureContext?.bridgeMode) ||
        currentSummary.latestBridgeMode,
      latestAttemptScope:
        normalizeOptionalString(failureContext?.attemptScope) ||
        normalizeOptionalString(failureContext?.lastAttemptScope) ||
        currentSummary.latestAttemptScope,
      repeatedFailureCount:
        typeof failureContext?.repeatedFailureCount === 'number' &&
        failureContext.repeatedFailureCount > 0
          ? failureContext.repeatedFailureCount
          : currentSummary.repeatedFailureCount,
      blockedRecoveryModes:
        normalizeOptionalStringArray(failureContext?.blockedRecoveryModes).length > 0
          ? normalizeOptionalStringArray(failureContext?.blockedRecoveryModes)
          : currentSummary.blockedRecoveryModes,
      updatedAtLabel: new Date().toLocaleTimeString(),
    }))

    if (status === 'success' || status === 'error') {
      activeExecutionRunIdRef.current = ''
    }
  }

  const getCurrentExecutionContextValue = () => {
    const liveTextareaValue = executionContextInputRef.current?.value

    if (typeof liveTextareaValue === 'string') {
      return liveTextareaValue.trim()
    }

    return executionContextInput.trim()
  }
  const openApprovalCheckpoint = ({
    source,
    instruction,
    payload,
    autoFlowSource = '',
  }: {
    source: 'planner' | 'executor'
    instruction: string
    payload?: {
      approvalRequest?: ApprovalRequestContract
      approvalReason?: string
      reason?: string
      question?: string
    } | null
    autoFlowSource?: 'planner' | 'executor' | ''
  }) => {
    // Todo approval entra por el mismo checkpoint para que los caminos manual,
    // auto-flow y executor usen un único estado visible y persistible.
    const approvalRequest = extractApprovalRequest(payload)
    recordApprovalOpenedOnActiveRun()

    if (source === 'executor') {
      setPendingExecutionInstruction(instruction)
      setPendingInstruction('')
    } else {
      setPendingInstruction(instruction)
      setPendingExecutionInstruction('')
    }

    setApprovalMessage(resolveApprovalMessage(payload))
    setApprovalSource(source)
    setActiveApprovalRequest(approvalRequest)
    setApprovalSelectedOption('')
    setApprovalFreeAnswer('')
    if (autoFlowSource) {
      setAutoFlowAwaitingApproval(autoFlowSource)
    }
    setDecisionPending(true)
  }
  const resetApprovalInteractionState = () => {
    setApprovalMessage('')
    setActiveApprovalRequest(null)
    setApprovalSelectedOption('')
    setApprovalFreeAnswer('')
  }
  const buildApprovalResponseFeedback = ({
    type,
    approvalMode,
  }: {
    type: 'approval-granted' | 'approval-rejected'
    approvalMode: 'once' | 'project-rule'
  }) => {
    const approvalInstruction =
      approvalSource === 'executor'
        ? pendingExecutionInstruction.trim()
        : pendingInstruction.trim()

    return buildPlannerFeedbackPayload({
      type,
      source: approvalSource || 'planner',
      approvalMode,
      instruction: approvalInstruction,
      approvalReason:
        activeApprovalRequest?.reason || approvalMessage || DEFAULT_APPROVAL_MESSAGE,
      approvalRequestDecisionKey: activeApprovalRequest?.decisionKey,
      responseMode: activeApprovalInteractionMode,
      ...(approvalSelectedOption.trim()
        ? { selectedOption: approvalSelectedOption.trim() }
        : {}),
      ...(approvalFreeAnswer.trim()
        ? { freeAnswer: approvalFreeAnswer.trim() }
        : {}),
    })
  }
  const rememberCurrentApprovalDecision = (
    decisionType: 'approval-granted' | 'approval-rejected',
  ) => {
    const decisionKey = normalizeResolvedDecisionKey(activeApprovalRequest?.decisionKey)
    const approvalFamily = deriveApprovalEquivalenceFamily(
      activeApprovalRequest?.decisionKey,
      activeApprovalRequest?.reason,
      activeApprovalRequest?.question,
      approvalMessage,
      pendingInstruction,
      pendingExecutionInstruction,
    )

    if ((!decisionKey || decisionKey === 'legacy-approval') && !approvalFamily) {
      return
    }

    const sharedDecisionPayload = {
      status: (decisionType === 'approval-rejected' ? 'rejected' : 'approved') as const,
      source: (approvalSource || 'planner') as ResolvedDecisionRecord['source'],
      summary:
        activeApprovalRequest?.reason || approvalMessage || DEFAULT_APPROVAL_MESSAGE,
      responseMode: activeApprovalInteractionMode,
      ...(approvalFamily ? { approvalFamily } : {}),
      updatedAt: new Date().toISOString(),
      ...(approvalSelectedOption.trim()
        ? { selectedOption: approvalSelectedOption.trim() }
        : {}),
      ...(approvalFreeAnswer.trim()
        ? { freeAnswer: approvalFreeAnswer.trim() }
        : {}),
    }

    const decisionsToPersist: ResolvedDecisionRecord[] = []

    if (decisionKey && decisionKey !== 'legacy-approval') {
      decisionsToPersist.push({
        key: decisionKey,
        ...sharedDecisionPayload,
      })
    }

    if (approvalFamily) {
      decisionsToPersist.push({
        key: `approval-family:${approvalFamily}`,
        ...sharedDecisionPayload,
      })
    }

    if (decisionsToPersist.length === 0) {
      return
    }

    setResolvedDecisions((currentDecisions) =>
      mergeResolvedDecisionRecords(currentDecisions, decisionsToPersist),
    )
  }
  const resetManualExecutionPendingState = () => {
    setDecisionPending(false)
    resetApprovalInteractionState()
    setPendingInstruction('')
    setPendingExecutionInstruction('')
    setApprovalSource('')
  }

  const persistSessionSnapshotNow = ({
    nextSessionStatus,
    nextCurrentStep,
    nextPlannerInstruction,
    nextExecutorResult,
    nextExecutorRequestState,
    nextLastRunSummary,
  }: {
    nextSessionStatus: string
    nextCurrentStep: string
    nextPlannerInstruction: string
    nextExecutorResult: string
    nextExecutorRequestState: 'idle' | 'running' | 'success' | 'error'
    nextLastRunSummary: typeof DEFAULT_LAST_RUN_SUMMARY
  }) => {
    try {
      localStorage.setItem(
        SESSION_SNAPSHOT_KEY,
        JSON.stringify({
          sessionStatus: nextSessionStatus,
          currentStep: nextCurrentStep,
          plannerInstruction: nextPlannerInstruction,
          executorResult: nextExecutorResult,
          executorRequestState: nextExecutorRequestState,
          lastRunSummary: nextLastRunSummary,
        }),
      )
    } catch {
      // Ignora errores de persistencia local para no romper la sesión.
    }
  }

  const persistFlowConsoleStateNow = ({
    open,
    pinned,
  }: {
    open: boolean
    pinned: boolean
  }) => {
    try {
      localStorage.setItem(
        FLOW_CONSOLE_STATE_KEY,
        JSON.stringify({
          open,
          pinned,
        }),
      )
    } catch {
      // Ignora errores de persistencia local para no romper la sesión.
    }
  }

  const setFlowConsoleVisibility = ({
    open,
    pinned,
  }: {
    open: boolean
    pinned: boolean
  }) => {
    setIsFlowConsolePinnedOpen(pinned)
    setIsFlowConsoleOpen(open)
    persistFlowConsoleStateNow({ open, pinned })
  }

  const applyExecutionClosureState = ({
    instruction,
    result,
    approval,
    finalStatus,
    currentStepLabel,
    sessionStatusLabel,
    requestState = 'success',
  }: {
    instruction: string
    result: string
    approval: string
    finalStatus: string
    currentStepLabel: string
    sessionStatusLabel: string
    requestState?: 'success' | 'error'
  }) => {
    const nextLastRunSummary = {
      ...lastRunSummary,
      objective: normalizedGoalInput,
      instruction,
      result,
      context: currentExecutionContextSummary,
      workspacePath: currentWorkspaceSummary,
      approval,
      finalStatus,
    }
    const nextExecutorRequestState = requestState || 'success'

    debugRendererLog('applyExecutionClosureState', {
      instruction,
      result,
      approval,
      finalStatus,
      currentStepLabel,
      sessionStatusLabel,
      requestState: nextExecutorRequestState,
    })
    addDiagnosticFlowMessage(
      'Diagnóstico de cierre manual',
      'El cierre de ejecución se aplicó realmente en la UI.',
      nextExecutorRequestState === 'error' ? 'error' : 'success',
      formatStructuredContent({
        instruction,
        result,
        approval,
        finalStatus,
        currentStepLabel,
        sessionStatusLabel,
        requestState: nextExecutorRequestState,
      }),
    )

    setExecutorRequestState(nextExecutorRequestState)
    setExecutorResult(result)
    setSessionStatus(sessionStatusLabel)
    setCurrentStep(currentStepLabel)
    setLastRunSummary(nextLastRunSummary)
    persistSessionSnapshotNow({
      nextSessionStatus: sessionStatusLabel,
      nextCurrentStep: currentStepLabel,
      nextPlannerInstruction: plannerInstruction,
      nextExecutorResult: result,
      nextExecutorRequestState,
      nextLastRunSummary,
    })
  }
  const closeManualExecutionState = ({
    requestId,
    source,
    instruction,
    result,
    approval,
    finalStatus,
    currentStepLabel,
    sessionStatusLabel,
    requestState = 'success',
    resetPendingState = true,
  }: {
    requestId: string
    source: 'return' | 'event' | 'completion-event'
    instruction: string
    result: string
    approval: string
    finalStatus: string
    currentStepLabel: string
    sessionStatusLabel: string
    requestState?: 'success' | 'error'
    resetPendingState?: boolean
  }) => {
    if (!requestId || manualExecutionClosureRef.current.requestId !== requestId) {
      addDiagnosticFlowMessage(
        'Diagnóstico de cierre manual',
        'El renderer descartó un cierre porque el requestId no coincide con la ejecución activa.',
        'warning',
        formatStructuredContent({
          requestId,
          activeRequestId: manualExecutionClosureRef.current.requestId,
          source,
        }),
      )
      debugRendererLog('closeManualExecutionState:requestId-mismatch', {
        requestId,
        activeRequestId: manualExecutionClosureRef.current.requestId,
        source,
      })
      return false
    }

    if (manualExecutionClosureRef.current.settled) {
      addDiagnosticFlowMessage(
        'Diagnóstico de cierre manual',
        `Se ignoró un cierre duplicado de la ejecución manual desde ${source}.`,
        'warning',
        formatStructuredContent({ requestId, source }),
      )
      debugRendererLog('closeManualExecutionState:already-settled', {
        requestId,
        source,
      })
      return false
    }

    addDiagnosticFlowMessage(
      'Diagnóstico de cierre manual',
      'El renderer está por aplicar el cierre manual de la ejecución.',
      requestState === 'error' ? 'error' : 'info',
      formatStructuredContent({
        requestId,
        source,
        instruction,
        result,
        approval,
        finalStatus,
        currentStepLabel,
        sessionStatusLabel,
        requestState,
        resetPendingState,
      }),
    )
    debugRendererLog('closeManualExecutionState:before-apply', {
      requestId,
      source,
      requestState,
      finalStatus,
    })

    manualExecutionClosureRef.current = {
      requestId,
      settled: true,
    }

    if (resetPendingState) {
      resetManualExecutionPendingState()
    }
    applyExecutionClosureState({
      instruction,
      result,
      approval,
      finalStatus,
      currentStepLabel,
      sessionStatusLabel,
      requestState,
    })
    finalizeActiveExecutionRun({
      status: requestState === 'error' ? 'error' : 'success',
      failureType: requestState === 'error' ? lastExecutorSnapshot?.failureType : '',
      failureContext: lastExecutorSnapshot,
    })
    setIsExecutingTask(false)
    addDiagnosticFlowMessage(
      'Diagnóstico de cierre manual',
      `El renderer cerró la ejecución manual usando ${source}.`,
      requestState === 'error' ? 'error' : 'success',
      formatStructuredContent({
        requestId,
        source,
        requestState,
        finalStatus,
      }),
    )
    debugRendererLog('closeManualExecutionState:completed', {
      requestId,
      source,
      requestState,
      finalStatus,
    })

    return true
  }
  const releaseManualExecutionTracking = (requestId: string) => {
    if (!requestId) {
      return
    }

    if (activeExecutionRequestIdRef.current === requestId) {
      activeExecutionRequestIdRef.current = ''
    }

    if (manualExecutionClosureRef.current.requestId === requestId) {
      manualExecutionClosureRef.current = {
        requestId: '',
        settled: true,
      }
    }
  }
  const closeManualExecutionFromCompletionPayload = (
    payload: ExecutionCompletePayload,
  ) => {
    const requestId =
      typeof payload?.requestId === 'string' ? payload.requestId : ''

    if (!requestId) {
      return false
    }

    const fallbackInstruction = payload.instruction || plannerInstruction
    const fallbackResult =
      payload.error ||
      payload.result ||
      payload.resultPreview ||
      'La ejecución manual terminó sin un resultado detallado.'
    const failureContext = extractExecutorFailureContext(payload)

    addDiagnosticFlowMessage(
      'Diagnóstico de cierre dedicado',
      'La UI recibió un evento final dedicado y evaluará el cierre manual.',
      payload?.ok === false ? 'warning' : 'info',
      formatStructuredContent(payload),
    )
    debugRendererLog('execution-complete:received', {
      requestId,
      ok: payload?.ok,
      approvalRequired: payload?.approvalRequired,
      error: payload?.error,
    })
    updateLastExecutorSnapshot(failureContext)
    recordExecutionSnapshotOnActiveRun(failureContext)

    if (payload?.approvalRequired) {
      if (
        matchesProjectApprovalPolicy({
          policy: projectApprovalPolicy,
          source: 'executor',
          payload,
        })
      ) {
        releaseManualExecutionTracking(requestId)
        void replanManualFlow(
          buildPlannerFeedbackPayload({
            type: 'approval-granted',
            source: 'executor',
            approvalMode: 'project-rule',
            instruction: fallbackInstruction,
            approvalReason: payload.approvalReason,
            resultPreview: payload.resultPreview,
          }),
          true,
        )
        return true
      }

      releaseManualExecutionTracking(requestId)
      finalizeActiveExecutionRun({
        status: 'approval-pending',
        failureType: payload.failureType,
        failureContext,
      })
      openApprovalCheckpoint({
        source: 'executor',
        instruction: fallbackInstruction,
        payload: {
          approvalReason:
            payload.approvalReason ||
            'El ejecutor pidió aprobación manual antes de completar la ejecución.',
        },
      })
      setIsExecutingTask(false)
      setExecutorRequestState('running')
      setSessionStatus('Esperando aprobación para continuar')
      setCurrentStep('El Cerebro espera una decision humana antes de seguir')
      return true
    }

    if (payload?.ok === false) {
      finalizeActiveExecutionRun({
        status: 'error',
        failureType: payload.failureType,
        failureContext,
      })
      const wasClosed = closeManualExecutionState({
        requestId,
        source: 'completion-event',
        instruction: fallbackInstruction,
        result: fallbackResult,
        approval: 'No requerida',
        finalStatus: 'Ejecución fallida. Requiere revisión manual.',
        currentStepLabel: 'La ejecución falló y requiere revisión manual',
        sessionStatusLabel: 'Ejecución fallida. Requiere revisión manual.',
        requestState: 'error',
      })

      if (wasClosed) {
        setSessionEvents((currentEvents) => [
          ...currentEvents,
          'La UI cerró la ejecución manual con error desde el evento final dedicado',
          'La ejecución quedó detenida hasta revisión manual',
        ])
      }

      return wasClosed
    }

    finalizeActiveExecutionRun({
      status: 'success',
      failureType: payload.failureType,
      failureContext,
    })
    const wasClosed = closeManualExecutionState({
      requestId,
      source: 'completion-event',
      instruction: fallbackInstruction,
      result: payload.result || payload.resultPreview || fallbackResult,
      approval: 'No requerida',
      finalStatus: 'Ejecucion completada',
      currentStepLabel: 'La instruccion actual ya fue ejecutada',
      sessionStatusLabel: 'Ejecucion completada',
      requestState: 'success',
    })

    if (wasClosed) {
      setSessionEvents((currentEvents) => [
        ...currentEvents,
        'La UI cerró la ejecución manual con el evento final dedicado',
      ])
    }

    return wasClosed
  }
  const waitForExecutionCompletion = (requestId: string) => {
    return new Promise<ExecutionCompletePayload>((resolve) => {
      pendingExecutionCompletionResolversRef.current[requestId] = resolve
    })
  }

  const clearPendingExecutionCompletion = (requestId: string) => {
    if (!requestId) {
      return
    }

    delete pendingExecutionCompletionResolversRef.current[requestId]
  }
  const finalizeAutoFlowCompletion = (
    iteration: number,
    instruction: string,
    result: string,
    approval: string,
  ) => {
    setDecisionPending(false)
    resetApprovalInteractionState()
    setPendingInstruction('')
    setPendingExecutionInstruction('')
    setApprovalSource('')
    setAutoFlowAwaitingApproval('')
    setAutoFlowIteration(0)
    setSessionStatus(AUTO_FLOW_COMPLETED_STATUS)
    setCurrentStep(`El objetivo quedó completado en la iteración ${iteration}`)
    updateLastRunSummary({
      objective: normalizedGoalInput,
      instruction,
      result,
      approval,
      finalStatus: AUTO_FLOW_COMPLETED_STATUS,
    })
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      'El flujo automático completó el objetivo',
    ])
  }

  useEffect(() => {
    if (skipProjectPolicyPersistenceRef.current) {
      skipProjectPolicyPersistenceRef.current = false
      return
    }

    try {
      if (projectApprovalPolicy) {
        localStorage.setItem(
          PROJECT_POLICY_KEY,
          JSON.stringify(projectApprovalPolicy),
        )
      } else {
        localStorage.removeItem(PROJECT_POLICY_KEY)
      }
    } catch {
      // Ignora errores de persistencia local para no romper la sesión.
    }
  }, [projectApprovalPolicy])

  useEffect(() => {
    if (skipSessionEventsPersistenceRef.current) {
      skipSessionEventsPersistenceRef.current = false
      return
    }

    try {
      localStorage.setItem(SESSION_EVENTS_KEY, JSON.stringify(sessionEvents))
    } catch {
      // Ignora errores de persistencia local para no romper la sesión.
    }
  }, [sessionEvents])

  useEffect(() => {
    try {
      localStorage.setItem(
        SESSION_SNAPSHOT_KEY,
        JSON.stringify({
          sessionStatus,
          currentStep,
          plannerInstruction,
          executorResult,
          executorRequestState,
          lastRunSummary,
        }),
      )
    } catch {
      // Ignora errores de persistencia local para no romper la sesión.
    }
  }, [
    currentStep,
    executorResult,
    executorRequestState,
    lastRunSummary,
    plannerInstruction,
    sessionStatus,
  ])

  useEffect(() => {
    try {
      localStorage.setItem(WORKSPACE_PATH_KEY, workspacePath)
    } catch {
      // Ignora errores de persistencia local para no romper la sesión.
    }
  }, [workspacePath])

  useEffect(() => {
    try {
      localStorage.setItem(BRAIN_COST_MODE_KEY, brainCostMode)
    } catch {
      // Ignora errores de persistencia local para no romper la sesión.
    }
  }, [brainCostMode])

  useEffect(() => {
    try {
      if (userParticipationMode) {
        localStorage.setItem(USER_PARTICIPATION_MODE_KEY, userParticipationMode)
      } else {
        localStorage.removeItem(USER_PARTICIPATION_MODE_KEY)
      }
    } catch {
      // Ignora errores de persistencia local para no romper la sesión.
    }
  }, [userParticipationMode])

  useEffect(() => {
    try {
      if (resolvedDecisions.length > 0) {
        localStorage.setItem(
          RESOLVED_DECISIONS_KEY,
          JSON.stringify(resolvedDecisions),
        )
      } else {
        localStorage.removeItem(RESOLVED_DECISIONS_KEY)
      }
    } catch {
      // Ignora errores de persistencia local para no romper la sesión.
    }
  }, [resolvedDecisions])

  useEffect(() => {
    try {
      localStorage.setItem(FLOW_MESSAGES_KEY, JSON.stringify(flowMessages))
    } catch {
      // Ignora errores de persistencia local para no romper la sesión.
    }
  }, [flowMessages])

  useEffect(() => {
    persistFlowConsoleStateNow({
      open: isFlowConsoleOpen,
      pinned: isFlowConsolePinnedOpen,
    })
  }, [isFlowConsoleOpen, isFlowConsolePinnedOpen])

  // Los listeners de Electron deben suscribirse una sola vez, pero aun asi
  // leer siempre el estado vivo del renderer para no perder cierres ni trazas.
  const handleExecutionEvent = useEffectEvent((payload: ExecutionEventPayload) => {
    if (!payload || typeof payload !== 'object') {
      return
    }

    if (
      !payload.requestId ||
      !activeExecutionRequestIdRef.current ||
      payload.requestId !== activeExecutionRequestIdRef.current
    ) {
      return
    }

    flowMessageIdRef.current += 1
    setFlowMessages((currentMessages) => [
      ...currentMessages,
      {
        id: flowMessageIdRef.current,
        source: payload.source,
        title: payload.title,
        content: payload.content,
        status: payload.status,
        ...(payload.raw ? { raw: payload.raw } : {}),
      },
    ])
    const parsedRaw = parseStructuredRaw(payload.raw)
    const progressSnapshot = extractExecutorProgressSnapshot(parsedRaw)
    updateLastExecutorSnapshot(progressSnapshot)
    recordExecutionSnapshotOnActiveRun(progressSnapshot)

    if (isFastRouteExecutionTitle(payload.title)) {
      setLastObservedExecutionMode('local-fast')
    } else if (
      payload.source === 'executor' &&
      normalizeOptionalString(lastObservedExecutionMode).toLocaleLowerCase() !==
        'local-fast'
    ) {
      setLastObservedExecutionMode('executor')
    }

    if (
      payload.title !== 'Main devolvió respuesta final al renderer' &&
      payload.title !== 'Main devolvió error final al renderer' &&
      payload.title !== 'Main terminó por timeout'
    ) {
      return
    }

    addDiagnosticFlowMessage(
      'Diagnóstico de ejecución manual',
      'El renderer recibió un evento final desde Electron.',
      payload.title === 'Main devolvió respuesta final al renderer' ? 'info' : 'warning',
      formatStructuredContent({
        requestId: payload.requestId,
        title: payload.title,
        parsedRaw,
      }),
    )
    debugRendererLog('execution-event:final-event', {
      requestId: payload.requestId,
      title: payload.title,
      parsedRaw,
    })
    addDiagnosticFlowMessage(
      'Diagnóstico de ejecución manual',
      'El renderer conserva este evento solo como traza; el cierre real queda en el evento de cierre dedicado.',
      'info',
      formatStructuredContent({
        requestId: payload.requestId,
        title: payload.title,
        parsedRaw,
      }),
    )
  })

  useEffect(() => {
    const unsubscribe = window.aiOrchestrator?.onExecutionEvent?.((payload) => {
      handleExecutionEvent(payload)
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  const handleExecutionCompleteEvent = useEffectEvent(
    (payload: ExecutionCompletePayload) => {
      if (!payload || typeof payload !== 'object') {
        return
      }

      if (payload.requestId) {
        const resolvePendingExecution =
          pendingExecutionCompletionResolversRef.current[payload.requestId]

        if (typeof resolvePendingExecution === 'function') {
          delete pendingExecutionCompletionResolversRef.current[payload.requestId]
          resolvePendingExecution(payload)
        }
      }

      if (
        !payload.requestId ||
        !activeExecutionRequestIdRef.current ||
        payload.requestId !== activeExecutionRequestIdRef.current
      ) {
        return
      }

      addDiagnosticFlowMessage(
        'Diagnóstico de cierre dedicado',
        'La UI recibió el evento final dedicado de Electron.',
        payload.ok === false ? 'warning' : 'info',
        formatStructuredContent(payload),
      )
      const failureContext = extractExecutorFailureContext(payload)
      updateLastExecutorSnapshot(failureContext)
      recordExecutionSnapshotOnActiveRun(failureContext)
      if (payload.ok === true) {
        window.setTimeout(() => {
          void loadReusableArtifacts()
        }, 0)
      }

      if (!normalizeOptionalString(lastObservedExecutionMode)) {
        const traceMentionsFastRoute = Array.isArray(payload.trace)
          ? payload.trace.some((entry) => isFastRouteExecutionTitle(entry?.title))
          : false
        const payloadIndicatesFastRoute = isLocalFastRouteExecution({
          strategy: payload.details?.strategy,
          materializationPlanSource: payload.details?.materializationPlanSource,
          materialState: payload.details?.materialState,
        })

        setLastObservedExecutionMode(
          traceMentionsFastRoute || payloadIndicatesFastRoute ? 'local-fast' : 'executor',
        )
      }

      const wasClosed = closeManualExecutionFromCompletionPayload(payload)

      addDiagnosticFlowMessage(
        'Diagnóstico de cierre dedicado',
        `El cierre manual devolvió ${wasClosed ? 'true' : 'false'} desde el evento final dedicado.`,
        wasClosed ? 'success' : 'warning',
        formatStructuredContent({
          requestId: payload.requestId,
          wasClosed,
          ok: payload.ok,
          approvalRequired: payload.approvalRequired,
        }),
      )
      debugRendererLog('execution-complete:close-result', {
        requestId: payload.requestId,
        wasClosed,
        ok: payload.ok,
        approvalRequired: payload.approvalRequired,
      })
    },
  )

  useEffect(() => {
    const unsubscribe = window.aiOrchestrator?.onExecutionComplete?.((payload) => {
      handleExecutionCompleteEvent(payload)
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])
  useEffect(() => {
    if (!isFlowConsoleOpen) {
      return
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      flowActivityContainerRef.current?.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
      flowConversationContainerRef.current?.scrollTo({
        top: flowConversationContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
      flowTimelineContainerRef.current?.scrollTo({
        top: flowTimelineContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    })

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [flowMessages, isFlowConsoleOpen, sessionEvents])

  useEffect(() => {
    if (!isFlowConsolePinnedOpen || isFlowConsoleOpen) {
      return
    }

    setIsFlowConsoleOpen(true)
  }, [isFlowConsoleOpen, isFlowConsolePinnedOpen])

  const replanManualFlow = async (
    previousExecutionResult: string,
    approvedByProjectRule = projectPolicyAllowed,
  ) => {
    // Este camino existe para devolverle al Cerebro el contexto más reciente
    // (approval, rechazo o falla) sin reiniciar la sesión ni perder el hilo
    // operativo que ya vio el usuario en pantalla.
    const currentExecutionContext = getCurrentExecutionContextValue()

    setFlowConsoleVisibility({ open: true, pinned: true })
    setIsPlanning(true)
    setIsExecutingTask(false)
    setDecisionPending(false)
    resetApprovalInteractionState()
    setPendingInstruction('')
    setPendingExecutionInstruction('')
    setApprovalSource('')
    setSessionStatus('El Cerebro está reevaluando la ejecución')
    setCurrentStep('El Mensajero devolvió contexto al Cerebro para replanificar')
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      'El Mensajero devolvió contexto al Cerebro para replanificar',
    ])
    addFlowMessage({
      source: 'orquestador',
      title: 'Reenvio al Cerebro',
      content:
        'El Mensajero devolvió una aprobación o un error al planificador para que redecida antes de seguir.',
      raw: previousExecutionResult,
      status: 'info',
    })
    addFlowMessage({
      source: 'orquestador',
      title: 'Datos enviados al planificador',
      content: 'Se envió una nueva consulta al Cerebro con el contexto actualizado.',
      raw: formatStructuredContent({
        goal: goalInput,
        context: currentExecutionContext || undefined,
        workspacePath: workspacePath.trim() || undefined,
        userParticipationMode: userParticipationMode || undefined,
        projectState: plannerProjectState,
        costMode: brainCostMode,
        previousExecutionResult,
        manualReusablePreference: manualReusablePreferencePayload || undefined,
      }),
      status: 'info',
    })

    try {
      const response = await window.aiOrchestrator?.planTask?.({
        goal: goalInput,
        context: currentExecutionContext || undefined,
        workspacePath: workspacePath.trim() || undefined,
        userParticipationMode: userParticipationMode || undefined,
        projectState: plannerProjectState,
        costMode: brainCostMode,
        previousExecutionResult,
        manualReusablePreference: manualReusablePreferencePayload || undefined,
      })

      if (!response?.ok || !response.instruction) {
        addFlowMessage({
          source: 'planificador',
          title: 'Respuesta invalida del planificador',
          content: 'El Cerebro no devolvió una instrucción utilizable después de reevaluar.',
          raw: formatStructuredContent(response),
          status: 'error',
        })
        setExecutorRequestState('error')
        setExecutorResult(
          'La replanificación no devolvió una instrucción utilizable para continuar.',
        )
        setSessionStatus('Bloqueo real en la replanificación')
        setCurrentStep('El Cerebro no pudo definir una accion ejecutable')
        updateLastRunSummary({
          objective: normalizedGoalInput,
          instruction: instructionToExecute,
          result:
            'La replanificación no devolvió una instrucción utilizable para continuar.',
          approval: approvedByProjectRule
            ? 'Autoaprobada por regla del proyecto'
            : 'No requerida',
          finalStatus: 'Bloqueo real en la replanificación',
        })
        return
      }

      const nextExecutionMetadata = resolvePlannerExecutionMetadata(response)
      syncBrainRoutingDecision(response.brainRoutingDecision)
      setPlannerExecutionMetadata(nextExecutionMetadata)
      setPlannerRequestSnapshot({
        goal: plannerGoal,
        context: plannerContext,
        decisionKey: nextExecutionMetadata.decisionKey,
        safeFirstDeliveryPlanFingerprint: buildSafeFirstDeliveryPlanFingerprint(
          nextExecutionMetadata.safeFirstDeliveryPlan,
        ),
      })
      setLastObservedExecutionMode('')
      recordPlannerExecutionSummary(nextExecutionMetadata)
      addFlowMessage({
        source: 'planificador',
        title: 'Respuesta del planificador',
        content: response.instruction,
        raw: formatStructuredContent(response),
        status: response.approvalRequired ? 'warning' : 'success',
      })

      if (response.approvalRequired) {
        if (approvedByProjectRule) {
          await replanManualFlow(
            buildPlannerFeedbackPayload({
              type: 'approval-granted',
              source: 'planner',
              approvalMode: 'project-rule',
              instruction: response.instruction,
              approvalReason: resolveApprovalReason(response),
            }),
            true,
          )
          return
        }

        openApprovalCheckpoint({
          source: 'planner',
          instruction: response.instruction,
          payload: response,
          planCompletion: response.completed === true,
        })
        clearVisibleExecutionRuntimeState()
        setSessionStatus('Esperando aprobación para continuar')
        setCurrentStep('El Cerebro necesita una decision humana antes de seguir')
        updateLastRunSummary({
          objective: normalizedGoalInput,
          instruction: response.instruction,
          result: 'Pendiente de aprobación',
          approval: 'Manual requerida',
          finalStatus: 'Esperando aprobación para continuar',
        })
        return
      }

      setPlannerInstruction(response.instruction)
      setCurrentStep(response.instruction)
      if (isUserClarificationPlannerResponse(response)) {
        clearVisibleExecutionRuntimeState()
        setSessionStatus('Esperando una nueva definición del usuario')
        setCurrentStep('El Cerebro necesita una nueva definición antes de ejecutar')
        updateLastRunSummary({
          objective: normalizedGoalInput,
          instruction: response.instruction,
          result: response.instruction,
          approval: approvedByProjectRule
            ? 'Autoaprobada por regla del proyecto'
            : 'No requerida',
          finalStatus: 'Esperando una nueva definición del usuario',
        })
        addFlowMessage({
          source: 'orquestador',
          title: 'Decisión del orquestador',
          content:
            'La replanificación dejó una consulta pendiente para el usuario y no se ejecutará automáticamente.',
          status: 'warning',
        })
        return
      }

      if (isReviewOnlyPlannerResponse(response)) {
        clearVisibleExecutionRuntimeState()
        setSessionStatus('Plan listo para revision')
        setCurrentStep('El Cerebro devolvio una arquitectura para revisar antes de ejecutar')
        updateLastRunSummary({
          objective: normalizedGoalInput,
          instruction: response.instruction,
          result: response.instruction,
          approval: approvedByProjectRule
            ? 'Autoaprobada por regla del proyecto'
            : 'No requerida',
          finalStatus: 'Plan listo para revision',
        })
        addFlowMessage({
          source: 'orquestador',
          title: 'Decision del orquestador',
          content:
            'La replanificacion devolvio un plan solo para revision y no se ejecutara automaticamente.',
          status: 'warning',
        })
        return
      }

      clearVisibleExecutionRuntimeState()
      setSessionStatus('El Cerebro definio una nueva accion')
      updateLastRunSummary({
        objective: normalizedGoalInput,
        instruction: response.instruction,
        result: 'Pendiente de ejecución',
        approval: approvedByProjectRule
          ? 'Autoaprobada por regla del proyecto'
          : 'No requerida',
        finalStatus: 'Plan reconfigurado',
      })

      if (response.completed) {
        clearVisibleExecutionRuntimeState({
          requestState: 'success',
          result: response.instruction,
        })
        setSessionStatus('Ejecucion completada')
        setCurrentStep('El Cerebro cerró la corrida sin necesitar otra ejecución')
        updateLastRunSummary({
          objective: normalizedGoalInput,
          instruction: response.instruction,
          result: response.instruction,
          approval: approvedByProjectRule
            ? 'Autoaprobada por regla del proyecto'
            : 'No requerida',
          finalStatus: 'Ejecucion completada',
        })
        return
      }

      await handleExecuteCurrentInstruction(
        response.instruction,
        resolvePlannerExecutionMetadata(response),
      )
    } catch {
      setExecutorRequestState('error')
      setExecutorResult('La replanificación encontró un error inesperado.')
      setSessionStatus('Bloqueo real en la replanificación')
      setCurrentStep('El Cerebro no pudo continuar con la reevaluacion')
    } finally {
      setIsPlanning(false)
    }
  }

  const runAutoFlowLoop = async (
    startIteration: number,
    initialInstruction?: string,
    initialPreviousExecutionResult?: string,
  ) => {
    let iteration = startIteration
    let nextInstruction = normalizeOptionalString(initialInstruction)
    let previousExecutionResult = normalizeOptionalString(initialPreviousExecutionResult)
    let currentPlannerExecutionMetadata = plannerExecutionMetadata

    try {
      while (iteration <= 3) {
        setAutoFlowIteration(iteration)
        setSessionStatus(`Flujo automático en iteración ${iteration}`)
        setCurrentStep(`Preparando la iteración ${iteration} del flujo automático`)
        setSessionEvents((currentEvents) => [
          ...currentEvents,
          `Se inició la iteración ${iteration} del flujo automático`,
        ])

        let instructionToExecute = nextInstruction
        let plannerMarkedCompleted = false

        if (!instructionToExecute) {
          setIsPlanning(true)
          setCurrentStep(`Planificando ${`Iteración ${iteration}`.toLocaleLowerCase()}`)
          setSessionEvents((currentEvents) => [
            ...currentEvents,
            'Se envió un objetivo al planificador local',
          ])
          addFlowMessage({
            source: 'operador',
            title: `Objetivo de iteración ${iteration}`,
            content: normalizedGoalInput,
            status: 'info',
          })
          addFlowMessage({
            source: 'orquestador',
            title: 'Datos enviados al planificador',
            content: `Se preparó el pedido de planificación para la iteración ${iteration}.`,
            raw: formatStructuredContent({
              goal: goalInput,
              context: executionContextInput.trim() || undefined,
              workspacePath: workspacePath.trim() || undefined,
              userParticipationMode: userParticipationMode || undefined,
              projectState: plannerProjectState,
              costMode: brainCostMode,
              iteration,
              previousExecutionResult: previousExecutionResult || undefined,
              manualReusablePreference:
                manualReusablePreferencePayload || undefined,
            }),
            status: 'info',
          })

          if (previousExecutionResult) {
            setSessionEvents((currentEvents) => [
              ...currentEvents,
              'El planificador recibió el resultado anterior del ejecutor',
            ])
          }

          const planResponse = await window.aiOrchestrator?.planTask?.({
            goal: goalInput,
            context: executionContextInput.trim() || undefined,
            workspacePath: workspacePath.trim() || undefined,
            userParticipationMode: userParticipationMode || undefined,
            projectState: plannerProjectState,
            costMode: brainCostMode,
            iteration,
            previousExecutionResult: previousExecutionResult || undefined,
            manualReusablePreference: manualReusablePreferencePayload || undefined,
          })

          if (!planResponse?.ok || !planResponse.instruction) {
            addFlowMessage({
              source: 'planificador',
              title: 'Respuesta inválida del planificador',
              content: 'El planificador no devolvió una instrucción utilizable.',
              raw: formatStructuredContent(planResponse),
              status: 'error',
            })
            setSessionStatus('Error al generar el plan')
            setSessionEvents((currentEvents) => [
              ...currentEvents,
              'Falló el flujo automático en la etapa de planificación',
            ])
            return
          }

          instructionToExecute = planResponse.instruction
          currentPlannerExecutionMetadata =
            resolvePlannerExecutionMetadata(planResponse)
          syncBrainRoutingDecision(planResponse.brainRoutingDecision)
          setPlannerExecutionMetadata(currentPlannerExecutionMetadata)
          setPlannerRequestSnapshot({
            goal: goalInput,
            context: executionContextInput.trim(),
            decisionKey: currentPlannerExecutionMetadata.decisionKey,
            safeFirstDeliveryPlanFingerprint: buildSafeFirstDeliveryPlanFingerprint(
              currentPlannerExecutionMetadata.safeFirstDeliveryPlan,
            ),
          })
          setLastObservedExecutionMode('')
          recordPlannerExecutionSummary(currentPlannerExecutionMetadata)
          plannerMarkedCompleted = planResponse.completed === true
          addFlowMessage({
            source: 'planificador',
            title: 'Respuesta del planificador',
            content: planResponse.instruction,
            raw: formatStructuredContent(planResponse),
            status: planResponse.approvalRequired ? 'warning' : 'success',
          })

          if (planResponse.approvalRequired) {
            if (
              matchesProjectApprovalPolicy({
                policy: projectApprovalPolicy,
                source: 'planner',
                payload: planResponse,
              })
            ) {
              setDecisionPending(false)
              setApprovalMessage('')
              setPendingInstruction('')
              setApprovalSource('')
              setPlannerInstruction(planResponse.instruction)
              setCurrentStep(planResponse.iterationLabel || planResponse.instruction)
              setSessionStatus(
                plannerMarkedCompleted
                  ? AUTO_FLOW_COMPLETED_STATUS
                  : 'Plan autoaprobado por regla del proyecto',
              )
              updateLastRunSummary({
                objective: normalizedGoalInput,
                instruction: planResponse.instruction,
                result: plannerMarkedCompleted
                  ? 'El planificador indicó que el objetivo ya quedó cumplido'
                  : 'Pendiente de ejecución',
                approval: 'Autoaprobada por regla del proyecto',
                finalStatus: plannerMarkedCompleted
                  ? AUTO_FLOW_COMPLETED_STATUS
                  : 'Plan autoaprobado por regla del proyecto',
              })
              setSessionEvents((currentEvents) => [
                ...currentEvents,
                'El planificador detectó una tarea sensible',
                'La regla del proyecto aprobó automáticamente la instrucción',
                'El flujo automático continuó con autoaprobación del planificador',
              ])
              addFlowMessage({
                source: 'orquestador',
                title: 'Decisión del orquestador',
                content: 'La instrucción del planificador quedó autoaprobada por la política del proyecto.',
                status: 'success',
              })
              previousExecutionResult = buildPlannerFeedbackPayload({
                type: 'approval-granted',
                source: 'planner',
                approvalMode: 'project-rule',
                instruction: planResponse.instruction,
                approvalReason: resolveApprovalReason(planResponse),
              })
              nextInstruction = ''
              iteration += 1
              setIsPlanning(false)
              continue
            } else {
              openApprovalCheckpoint({
                source: 'planner',
                instruction: planResponse.instruction,
                payload: planResponse,
                autoFlowSource: 'planner',
              })
              clearVisibleExecutionRuntimeState()
              setSessionStatus('Esperando aprobación para continuar')
              setCurrentStep(`El flujo automático quedó pausado en la iteración ${iteration}`)
              updateLastRunSummary({
                objective: normalizedGoalInput,
                instruction: planResponse.instruction,
                result: 'Pendiente de aprobación',
                approval: 'Manual requerida',
                finalStatus: 'Esperando aprobación para continuar',
              })
              setSessionEvents((currentEvents) => [
                ...currentEvents,
                'El planificador pidió aprobación manual',
                'El flujo automático quedó esperando aprobación del planificador',
              ])
              addFlowMessage({
                source: 'orquestador',
                title: 'Decisión del orquestador',
                content: 'El flujo quedó pausado hasta recibir aprobación manual del planificador.',
                status: 'warning',
              })
              return
            }
          } else {
            setDecisionPending(false)
            setApprovalMessage('')
            setPendingInstruction('')
            setPendingExecutionInstruction('')
            setApprovalSource('')
            setAutoFlowAwaitingApproval('')
            setPlannerInstruction(planResponse.instruction)
            setCurrentStep(planResponse.iterationLabel || planResponse.instruction)
            setSessionStatus(
              plannerMarkedCompleted
                ? AUTO_FLOW_COMPLETED_STATUS
                : `Flujo automático en iteración ${iteration}`,
            )
            updateLastRunSummary({
              objective: normalizedGoalInput,
              instruction: planResponse.instruction,
              result: plannerMarkedCompleted
                ? 'El planificador indicó que el objetivo ya quedó cumplido'
                : 'Pendiente de ejecución',
              approval: 'No requerida',
              finalStatus: plannerMarkedCompleted
                ? AUTO_FLOW_COMPLETED_STATUS
                : 'Plan generado',
            })
            setSessionEvents((currentEvents) => [
              ...currentEvents,
              'El planificador devolvió una instrucción',
            ])
            addFlowMessage({
              source: 'orquestador',
              title: 'Decisión del orquestador',
              content: 'La instrucción del planificador quedó lista para ejecutar en esta iteración.',
              status: 'success',
            })
          }
          if (isUserClarificationPlannerResponse(planResponse)) {
            setIsAutoFlowRunning(false)
            clearVisibleExecutionRuntimeState()
            setSessionStatus('Esperando una nueva definición del usuario')
            setCurrentStep(
              `El flujo automático quedó esperando una nueva definición en la iteración ${iteration}`,
            )
            updateLastRunSummary({
              objective: normalizedGoalInput,
              instruction: planResponse.instruction,
              result: planResponse.instruction,
              approval: 'No requerida',
              finalStatus: 'Esperando una nueva definición del usuario',
            })
            setSessionEvents((currentEvents) => [
              ...currentEvents,
              'El planificador devolvió una consulta para el usuario',
              'El flujo automático quedó esperando una nueva definición',
            ])
            addFlowMessage({
              source: 'orquestador',
              title: 'Decisión del orquestador',
              content:
                'El flujo automático se detuvo porque el planificador necesita una nueva definición del usuario.',
              status: 'warning',
            })
            return
          }

          if (isReviewOnlyPlannerResponse(planResponse)) {
            setIsAutoFlowRunning(false)
            clearVisibleExecutionRuntimeState()
            setSessionStatus('Plan listo para revision')
            setCurrentStep(
              `El flujo automatico quedo detenido en la iteracion ${iteration} para revisar la arquitectura propuesta`,
            )
            updateLastRunSummary({
              objective: normalizedGoalInput,
              instruction: planResponse.instruction,
              result: planResponse.instruction,
              approval: 'No requerida',
              finalStatus: 'Plan listo para revision',
            })
            setSessionEvents((currentEvents) => [
              ...currentEvents,
              'El planificador devolvio un plan solo para revision',
              'El flujo automatico quedo detenido hasta revision manual',
            ])
            addFlowMessage({
              source: 'orquestador',
              title: 'Decision del orquestador',
              content:
                'El flujo automatico se detuvo porque el planificador devolvio una arquitectura para revisar antes de ejecutar.',
              status: 'warning',
            })
            return
          }
        } else {
          setPlannerInstruction(instructionToExecute)
          setCurrentStep(instructionToExecute)
          addFlowMessage({
            source: 'orquestador',
            title: 'Reanudación del flujo',
            content: 'Se reutilizó una instrucción pendiente para continuar la iteración actual.',
            raw: formatStructuredContent({
              instruction: instructionToExecute,
            }),
            status: 'info',
          })
        }

        clearVisibleExecutionRuntimeState({ requestState: 'running' })
        setIsExecutingTask(true)
        setCurrentStep(`Ejecutando la iteración ${iteration}`)
        setSessionEvents((currentEvents) => [
          ...currentEvents,
          'Se envió una instrucción al ejecutor local',
        ])
        addFlowMessage({
          source: 'executor',
          title: 'Datos enviados al ejecutor',
          content: 'Se envió una instrucción al ejecutor con contexto y espacio de trabajo.',
          raw: formatStructuredContent({
            instruction: instructionToExecute,
            context: executionContextInput.trim() || undefined,
            workspacePath: workspacePath.trim() || undefined,
            businessSector:
              currentPlannerExecutionMetadata.businessSector || undefined,
            businessSectorLabel:
              currentPlannerExecutionMetadata.businessSectorLabel || undefined,
            creativeDirection:
              currentPlannerExecutionMetadata.creativeDirection || undefined,
            executionScope:
              currentPlannerExecutionMetadata.executionScope || undefined,
          }),
          status: 'info',
        })

        const executionRequestId = `auto-${iteration}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const completionPromise = waitForExecutionCompletion(executionRequestId)
        const executePayload = {
          instruction: instructionToExecute,
          context: executionContextInput.trim() || undefined,
          workspacePath: workspacePath.trim() || undefined,
          requestId: executionRequestId,
          ...(currentPlannerExecutionMetadata.decisionKey
            ? { decisionKey: currentPlannerExecutionMetadata.decisionKey }
            : {}),
          ...(currentPlannerExecutionMetadata.businessSector
            ? { businessSector: currentPlannerExecutionMetadata.businessSector }
            : {}),
          ...(currentPlannerExecutionMetadata.businessSectorLabel
            ? {
                businessSectorLabel:
                  currentPlannerExecutionMetadata.businessSectorLabel,
              }
            : {}),
          ...(currentPlannerExecutionMetadata.creativeDirection
            ? {
                creativeDirection:
                  currentPlannerExecutionMetadata.creativeDirection,
              }
            : {}),
          ...(currentPlannerExecutionMetadata.reusableArtifactLookup
            ? {
                reusableArtifactLookup:
                  currentPlannerExecutionMetadata.reusableArtifactLookup,
              }
            : {}),
          ...(currentPlannerExecutionMetadata.reusableArtifactsFound > 0
            ? {
                reusableArtifactsFound:
                  currentPlannerExecutionMetadata.reusableArtifactsFound,
              }
            : {}),
          ...(currentPlannerExecutionMetadata.reuseDecision
            ? {
                reuseDecision: currentPlannerExecutionMetadata.reuseDecision,
              }
            : {}),
          ...(currentPlannerExecutionMetadata.reuseReason
            ? {
                reuseReason: currentPlannerExecutionMetadata.reuseReason,
              }
            : {}),
          ...(currentPlannerExecutionMetadata.reusedArtifactIds.length > 0
            ? {
                reusedArtifactIds:
                  currentPlannerExecutionMetadata.reusedArtifactIds,
              }
            : {}),
          ...(currentPlannerExecutionMetadata.reuseMode &&
          currentPlannerExecutionMetadata.reuseMode !== 'none'
            ? {
                reuseMode: currentPlannerExecutionMetadata.reuseMode,
              }
            : {}),
          ...(currentPlannerExecutionMetadata.executionScope
            ? {
                executionScope: currentPlannerExecutionMetadata.executionScope,
              }
            : {}),
          ...(currentPlannerExecutionMetadata.safeFirstDeliveryMaterialization
            ? {
                safeFirstDeliveryMaterialization:
                  currentPlannerExecutionMetadata.safeFirstDeliveryMaterialization,
              }
            : {}),
        }
        startOrContinueExecutionRun({
          requestId: executionRequestId,
          instruction: instructionToExecute,
          executionMetadata: currentPlannerExecutionMetadata,
        })
        const executeAck = await window.aiOrchestrator?.executeTask?.(executePayload)
        if (!executeAck?.ok || executeAck?.accepted !== true) {
          const failureContext = extractExecutorFailureContext(executeAck)
          updateLastExecutorSnapshot(failureContext)
          recordExecutionSnapshotOnActiveRun(failureContext)
          finalizeActiveExecutionRun({
            status: 'error',
            failureType: executeAck?.failureType,
            failureContext,
          })
          clearPendingExecutionCompletion(executionRequestId)
          const executorErrorMessage = executeAck?.error
            ? `Error: ${executeAck.error}`
            : 'Error: El ejecutor no aceptó iniciar la ejecución automática.'
        addFlowMessage({
          source: 'orquestador',
          title: 'Decisión del orquestador',
          content: 'La ejecución automática no pudo iniciarse.',
          raw: executorErrorMessage,
          status: 'error',
        })
        setExecutorRequestState('error')
        setExecutorResult(executorErrorMessage)
        setSessionStatus('Error en el flujo automático')
        updateLastRunSummary({
          objective: normalizedGoalInput,
          instruction: instructionToExecute,
          result: executorErrorMessage,
          approval: 'No requerida',
          finalStatus: 'Error en el flujo automático',
        })
        setSessionEvents((currentEvents) => [
          ...currentEvents,
          'Falló el flujo automático en la etapa de ejecución',
          'El flujo automático quedó detenido hasta revisión manual',
        ])
          setCurrentStep('La ejecución automática terminó con error y requiere revisión manual')
          return
        }
        addFlowMessage({
          source: 'orquestador',
          title: 'Acuse del ejecutor',
          content:
            'La ejecución automática fue aceptada y queda a la espera del resultado final por evento.',
          raw: formatStructuredContent({
            requestId: executionRequestId,
            responseRequestId: executeAck?.requestId,
            accepted: executeAck?.accepted,
          }),
          status: 'info',
        })
        const executeResponse = await completionPromise

        if (!executeResponse?.ok) {
          const failureContext = extractExecutorFailureContext(executeResponse)
          updateLastExecutorSnapshot(failureContext)
          recordExecutionSnapshotOnActiveRun(failureContext)
          finalizeActiveExecutionRun({
            status: 'error',
            failureType: executeResponse?.failureType,
            failureContext,
          })
          const executorErrorMessage = formatExecutorError(executeResponse)
          addFlowMessage({
            source: 'orquestador',
            title: 'Decisión del orquestador',
            content: 'La ejecución automática terminó con error.',
            raw: executorErrorMessage,
            status: 'error',
          })
          setExecutorRequestState('error')
          setExecutorResult(executorErrorMessage)
          setSessionStatus('Error en el flujo automático')
          updateLastRunSummary({
            objective: normalizedGoalInput,
            instruction: instructionToExecute,
            result: executorErrorMessage,
            approval: 'No requerida',
            finalStatus: 'Error en el flujo automático',
          })
          setSessionEvents((currentEvents) => [
            ...currentEvents,
            'Falló el flujo automático en la etapa de ejecución',
            'El flujo automático quedó detenido hasta revisión manual',
          ])
          setCurrentStep('La ejecución automática terminó con error y requiere revisión manual')
          return
        }

        if (executeResponse.approvalRequired) {
          if (
            matchesProjectApprovalPolicy({
              policy: projectApprovalPolicy,
              source: 'executor',
              payload: executeResponse,
            })
          ) {
            const autoApprovedResult =
              executeResponse.resultPreview ||
              'La ejecución sensible fue aprobada automáticamente por la regla del proyecto'
            setDecisionPending(false)
            setApprovalMessage('')
            setPendingExecutionInstruction('')
            setApprovalSource('')
            setAutoFlowAwaitingApproval('')
            setExecutorRequestState('success')
            setExecutorResult(autoApprovedResult)
            setSessionStatus('Ejecución autoaprobada por regla del proyecto')
          setCurrentStep(
            'La instrucción sensible quedó aprobada para ejecutarse',
          )
            updateLastRunSummary({
              objective: normalizedGoalInput,
              instruction: executeResponse.instruction || instructionToExecute,
              result: autoApprovedResult,
              approval: 'Autoaprobada por regla del proyecto',
              finalStatus: 'Ejecución autoaprobada por regla del proyecto',
            })
            setSessionEvents((currentEvents) => [
              ...currentEvents,
              'El ejecutor detectó una tarea sensible',
              'La regla del proyecto aprobó automáticamente la ejecución',
              'El flujo automático continuó con autoaprobación del ejecutor',
            ])
            addFlowMessage({
              source: 'orquestador',
              title: 'Decisión del orquestador',
              content: 'La respuesta del ejecutor quedó autoaprobada y el flujo siguió.',
              status: 'success',
            })
            finalizeActiveExecutionRun({
              status: 'success',
              failureType: executeResponse.failureType,
              failureContext: extractExecutorFailureContext(executeResponse),
            })
            previousExecutionResult = buildPlannerFeedbackPayload({
              type: 'approval-granted',
              source: 'executor',
              approvalMode: 'project-rule',
              instruction: executeResponse.instruction || instructionToExecute,
              approvalReason: executeResponse.approvalReason,
              resultPreview: executeResponse.resultPreview,
            })
            nextInstruction = ''
            iteration += 1
            continue
          } else {
            openApprovalCheckpoint({
              source: 'executor',
              instruction: executeResponse.instruction || instructionToExecute,
              payload: executeResponse,
              autoFlowSource: 'executor',
            })
            finalizeActiveExecutionRun({
              status: 'approval-pending',
              failureType: executeResponse.failureType,
              failureContext: extractExecutorFailureContext(executeResponse),
            })
            setExecutorRequestState('success')
            setSessionStatus('Esperando aprobación para ejecutar')
            setCurrentStep(`El flujo automático quedó pausado en la iteración ${iteration}`)
            updateLastRunSummary({
              objective: normalizedGoalInput,
              instruction: executeResponse.instruction || instructionToExecute,
              result: 'Pendiente de aprobación',
              approval: 'Manual requerida',
              finalStatus: 'Esperando aprobación para ejecutar',
            })
            setSessionEvents((currentEvents) => [
              ...currentEvents,
              'El ejecutor pidió aprobación manual',
              'El flujo automático quedó esperando aprobación del ejecutor',
            ])
            addFlowMessage({
              source: 'orquestador',
              title: 'Decisión del orquestador',
              content: 'El flujo quedó pausado hasta recibir aprobación manual del ejecutor.',
              status: 'warning',
            })
            return
          }
        } else if (executeResponse.result) {
          finalizeActiveExecutionRun({
            status: 'success',
            failureType: executeResponse.failureType,
            failureContext: extractExecutorFailureContext(executeResponse),
          })
          setDecisionPending(false)
          setApprovalMessage('')
          setPendingExecutionInstruction('')
          setApprovalSource('')
          setAutoFlowAwaitingApproval('')
          setExecutorRequestState('success')
          setExecutorResult(executeResponse.result)
          setSessionStatus(`Flujo automático en iteración ${iteration}`)
          setCurrentStep('La instrucción actual ya fue ejecutada')
          updateLastRunSummary({
            objective: normalizedGoalInput,
            instruction: executeResponse.instruction || instructionToExecute,
            result: executeResponse.result,
            approval: 'No requerida',
            finalStatus: 'Ejecución completada',
          })
          setSessionEvents((currentEvents) => [
            ...currentEvents,
            'El ejecutor completó la instrucción',
          ])
          addFlowMessage({
            source: 'orquestador',
            title: 'Decisión del orquestador',
            content: 'La ejecución terminó correctamente y el flujo puede continuar.',
            status: 'success',
          })
          previousExecutionResult = executeResponse.result
        } else {
          finalizeActiveExecutionRun({
            status: 'error',
            failureType: executeResponse.failureType,
            failureContext: extractExecutorFailureContext(executeResponse),
          })
          addFlowMessage({
            source: 'orquestador',
            title: 'Decisión del orquestador',
            content: 'La ejecución no devolvió un resultado utilizable.',
            status: 'error',
          })
          setExecutorRequestState('error')
          setSessionStatus('Error en el flujo automático')
          setSessionEvents((currentEvents) => [
            ...currentEvents,
            'Falló el flujo automático en la etapa de ejecución',
          ])
          return
        }

        iteration += 1
        nextInstruction = ''
      }

      if (
        previousExecutionResult.startsWith(ORCHESTRATOR_PLANNER_FEEDBACK_PREFIX)
      ) {
        setExecutorRequestState('error')
        setSessionStatus('Bloqueo real en el flujo automatico')
        setCurrentStep('El Cerebro no pudo cerrar la corrida dentro del limite previsto')
        updateLastRunSummary({
          objective: normalizedGoalInput,
          instruction: plannerInstruction,
          result:
            'El flujo automatico llego al limite de iteraciones sin una resolucion final.',
          approval: projectPolicyAllowed
            ? 'Autoaprobada por regla del proyecto'
            : 'No requerida',
          finalStatus: 'Bloqueo real en el flujo automatico',
        })
        return
      }

      finalizeAutoFlowCompletion(
        3,
        plannerInstruction,
        executorResult,
        projectPolicyAllowed
          ? 'Autoaprobada por regla del proyecto'
          : 'No requerida',
      )
    } catch {
      setExecutorRequestState('error')
      setSessionStatus('Error en el flujo automático')
      setSessionEvents((currentEvents) => [
        ...currentEvents,
        'Falló el flujo automático en la etapa de ejecución',
      ])
    } finally {
      setFlowConsoleVisibility({ open: true, pinned: true })
      setIsPlanning(false)
      setIsExecutingTask(false)
      setIsAutoFlowRunning(false)
    }
  }

  const handleApproveOnce = async () => {
    const shouldResumeAutoFlow = autoFlowAwaitingApproval === approvalSource
    const approvalFeedback = buildApprovalResponseFeedback({
      type: 'approval-granted',
      approvalMode: 'once',
    })

    rememberCurrentApprovalDecision('approval-granted')
    setDecisionPending(false)
    setProjectApprovalPolicy(null)
    resetApprovalInteractionState()
    setPendingInstruction('')
    setPendingExecutionInstruction('')
    setApprovalSource('')
    setAutoFlowAwaitingApproval('')
    setSessionStatus('El Mensajero devolvió la respuesta al Cerebro')
    setCurrentStep('El Cerebro está reevaluando la siguiente acción')
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      'Se envio una respuesta humana al Cerebro',
      'El Mensajero devolvió la respuesta al Cerebro',
    ])

    if (shouldResumeAutoFlow) {
      setIsAutoFlowRunning(true)
      await runAutoFlowLoop(autoFlowIteration || 1, undefined, approvalFeedback)
      return
    }

    setIsAutoFlowRunning(false)
    await replanManualFlow(approvalFeedback, false)
    return
  }
  const handleAllowForProject = async () => {
    if (!persistibleProjectApprovalPolicy) {
      await handleApproveOnce()
      return
    }

    const shouldResumeAutoFlow = autoFlowAwaitingApproval === approvalSource
    const approvalFeedback = buildApprovalResponseFeedback({
      type: 'approval-granted',
      approvalMode: 'project-rule',
    })

    rememberCurrentApprovalDecision('approval-granted')
    setDecisionPending(false)
    setProjectApprovalPolicy(persistibleProjectApprovalPolicy)
    resetApprovalInteractionState()
    setPendingInstruction('')
    setPendingExecutionInstruction('')
    setApprovalSource('')
    setAutoFlowAwaitingApproval('')
    setSessionStatus('El Mensajero devolvió la aprobación persistente al Cerebro')
    setCurrentStep('El Cerebro está reevaluando con la regla del proyecto')
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      'Se guardó una regla de aprobación para este proyecto',
      'El Mensajero devolvió la aprobación al Cerebro',
    ])

    if (shouldResumeAutoFlow) {
      setIsAutoFlowRunning(true)
      await runAutoFlowLoop(autoFlowIteration || 1, undefined, approvalFeedback)
      return
    }

    setIsAutoFlowRunning(false)
    await replanManualFlow(approvalFeedback, true)
    return
  }
  const handleRunMockCycle = () => {
    setIsRunning(true)
    setSessionStatus('Ciclo de prueba en ejecución')
    setCurrentStep('El planificador está preparando la ejecución')
    setSessionEvents((currentEvents) => [...currentEvents, 'Se inició el ciclo de prueba'])

    window.setTimeout(() => {
      setCurrentStep('El ejecutor está aplicando la acción aprobada')
      setSessionEvents((currentEvents) => [
        ...currentEvents,
        'El ejecutor recibió la instrucción aprobada',
      ])
    }, 800)

    window.setTimeout(() => {
      setCurrentStep('La ejecución terminó correctamente')
      setSessionStatus('En espera después del ciclo de prueba')
      setSessionEvents((currentEvents) => [
        ...currentEvents,
        'Se completó el ciclo de prueba',
      ])
      setIsRunning(false)
    }, 1600)
  }

  const handleRejectApproval = async () => {
    const shouldResumeAutoFlow = autoFlowAwaitingApproval === approvalSource
    const rejectionFeedback = buildApprovalResponseFeedback({
      type: 'approval-rejected',
      approvalMode: 'once',
    })

    rememberCurrentApprovalDecision('approval-rejected')
    setDecisionPending(false)
    setProjectApprovalPolicy(null)
    resetApprovalInteractionState()
    setPendingInstruction('')
    setPendingExecutionInstruction('')
    setApprovalSource('')
    setAutoFlowAwaitingApproval('')
    setSessionStatus('El Mensajero devolvió el rechazo al Cerebro')
    setCurrentStep('El Cerebro está reevaluando después del rechazo')
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      'Se rechazo la propuesta actual',
      'El Mensajero devolvió el rechazo al Cerebro',
    ])

    if (shouldResumeAutoFlow) {
      setIsAutoFlowRunning(true)
      await runAutoFlowLoop(autoFlowIteration || 1, undefined, rejectionFeedback)
      return
    }

    setIsAutoFlowRunning(false)
    await replanManualFlow(rejectionFeedback, false)
  }

  const handleResetSessionMemory = () => {
    skipProjectPolicyPersistenceRef.current = true
    skipSessionEventsPersistenceRef.current = true

    try {
      localStorage.removeItem(PROJECT_POLICY_KEY)
      localStorage.removeItem(SESSION_EVENTS_KEY)
      localStorage.removeItem(WORKSPACE_PATH_KEY)
      localStorage.removeItem(USER_PARTICIPATION_MODE_KEY)
      localStorage.removeItem(RESOLVED_DECISIONS_KEY)
      localStorage.removeItem(BRAIN_COST_MODE_KEY)
      localStorage.removeItem(FLOW_MESSAGES_KEY)
    } catch {
      // Ignora errores de persistencia local para no romper el reset.
    }

    setDecisionPending(false)
    setApprovalMessage('')
    setPendingInstruction('')
    setPendingExecutionInstruction('')
    setApprovalSource('')
    setSessionStatus(DEFAULT_SESSION_STATUS)
    setCurrentStep(DEFAULT_CURRENT_STEP)
    setProjectApprovalPolicy(null)
    setIsRunning(false)
    setIsTestingConnection(false)
    setIsPlanning(false)
    setIsExecutingTask(false)
    setIsAutoFlowRunning(false)
    setAutoFlowIteration(0)
    setAutoFlowAwaitingApproval('')
    setGoalInput(DEFAULT_GOAL_INPUT)
    setWorkspacePath(DEFAULT_WORKSPACE_PATH)
    setExecutionContextInput(DEFAULT_EXECUTION_CONTEXT_INPUT)
    setUserParticipationMode(DEFAULT_USER_PARTICIPATION_MODE)
    setBrainCostMode(DEFAULT_BRAIN_COST_MODE)
    setResolvedDecisions(DEFAULT_RESOLVED_DECISIONS)
    try {
      localStorage.removeItem(FLOW_CONSOLE_STATE_KEY)
    } catch {
      // Ignora errores de persistencia local para no romper la sesión.
    }
    setFlowConsoleVisibility({ open: false, pinned: false })
    setPlannerInstruction(DEFAULT_PLANNER_INSTRUCTION)
    setPlannerExecutionMetadata(EMPTY_PLANNER_EXECUTION_METADATA)
    setPlannerRequestSnapshot({
      goal: '',
      context: '',
      decisionKey: '',
      safeFirstDeliveryPlanFingerprint: '',
    })
    setLastObservedExecutionMode('')
    setExecutorResult(DEFAULT_EXECUTOR_RESULT)
    setLastExecutorSnapshot(null)
    setExecutorRequestState('idle')
    setLastBrainRoutingDecision(null)
    setLastRunSummary(DEFAULT_LAST_RUN_SUMMARY)
    activeExecutionRunIdRef.current = ''
    executionRunSummariesRef.current = []
    flowMessageIdRef.current = 0
    setFlowMessages(DEFAULT_FLOW_MESSAGES)
    setExecutionRunSummaries([])
    setSessionEvents(DEFAULT_SESSION_EVENTS)
    setRuntimeStatus(DEFAULT_RUNTIME_STATUS)
  }

  const handleTestLocalConnection = async () => {
    const minWait = new Promise((resolve) => {
      window.setTimeout(resolve, 800)
    })

    setIsTestingConnection(true)
    setRuntimeStatus((currentStatus) => ({
      ...currentStatus,
      connection: 'Probando conexión local...',
    }))
    setSessionEvents((currentEvents) =>
      currentEvents.at(-1) === 'Se inició la prueba de conexión local'
        ? currentEvents
        : [...currentEvents, 'Se inició la prueba de conexión local'],
    )

    try {
      const response = await window.aiOrchestrator?.getRuntimeStatus?.()
      await minWait

      if (!response?.ok) {
        setRuntimeStatus({
          connection: 'Error al consultar el entorno local',
          platform: 'No disponible',
          electron: 'No disponible',
          node: 'No disponible',
          executorMode: 'unknown',
          executorModeSource: '',
          bridgeMode: 'unknown',
          bridgeModeSource: '',
        })
        setSessionEvents((currentEvents) =>
          currentEvents.at(-1) === 'Falló la prueba de conexión local'
            ? currentEvents
            : [...currentEvents, 'Falló la prueba de conexión local'],
        )
        return
      }

      setRuntimeStatus({
        connection: 'Conexión local verificada',
        platform: response.platform,
        electron: response.electron,
        node: response.node,
        executorMode: response.executorMode,
        executorModeSource: response.executorModeSource,
        bridgeMode: response.bridgeMode,
        bridgeModeSource: response.bridgeModeSource,
      })
      setSessionEvents((currentEvents) =>
        currentEvents.at(-1) === 'La conexión local fue verificada'
          ? currentEvents
          : [...currentEvents, 'La conexión local fue verificada'],
      )
    } catch {
      await minWait
      setRuntimeStatus({
        connection: 'Error al consultar el entorno local',
        platform: 'No disponible',
        electron: 'No disponible',
        node: 'No disponible',
        executorMode: 'unknown',
        executorModeSource: '',
        bridgeMode: 'unknown',
        bridgeModeSource: '',
      })
      setSessionEvents((currentEvents) =>
        currentEvents.at(-1) === 'Falló la prueba de conexión local'
          ? currentEvents
          : [...currentEvents, 'Falló la prueba de conexión local'],
      )
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleGenerateNextStep = async (options?: {
    goal?: string
    context?: string
    sourceLabel?: string
    sendContent?: string
    persistPreparedInputs?: boolean
    onPlanningFailure?: () => void
    validateResponse?: (
      response: PlannerDecisionResponse,
      metadata: PlannerExecutionMetadata,
    ) => string
  }) => {
    const plannerGoal = normalizeOptionalString(options?.goal) || goalInput
    const plannerContext =
      typeof options?.context === 'string'
        ? options.context
        : getCurrentExecutionContextValue()
    const normalizedPlannerGoal = plannerGoal.trim() || 'Sin objetivo definido'

    if (options?.persistPreparedInputs) {
      setGoalInput(plannerGoal)
      setExecutionContextInput(plannerContext)
    }

    setIsPlanning(true)
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      'Se envió un objetivo al planificador local',
    ])
    addFlowMessage({
      source: 'operador',
      title: options?.sourceLabel || 'Objetivo actual',
      content: normalizedPlannerGoal,
      status: 'info',
    })
    addFlowMessage({
      source: 'orquestador',
      title: 'Datos enviados al planificador',
      content:
        options?.sendContent || 'Se envió el objetivo actual al planificador.',
      raw: formatStructuredContent({
        goal: plannerGoal,
        context: plannerContext || undefined,
        workspacePath: workspacePath.trim() || undefined,
        userParticipationMode: userParticipationMode || undefined,
        projectState: plannerProjectState,
        costMode: brainCostMode,
        manualReusablePreference: manualReusablePreferencePayload || undefined,
      }),
      status: 'info',
    })

    try {
      const response = await window.aiOrchestrator?.planTask?.({
        goal: plannerGoal,
        context: plannerContext || undefined,
        workspacePath: workspacePath.trim() || undefined,
        userParticipationMode: userParticipationMode || undefined,
        projectState: plannerProjectState,
        costMode: brainCostMode,
        manualReusablePreference: manualReusablePreferencePayload || undefined,
      })

      if (!response?.ok || !response.instruction) {
        options?.onPlanningFailure?.()
        addFlowMessage({
          source: 'planificador',
          title: 'Respuesta inválida del planificador',
          content: 'El planificador no devolvió una instrucción utilizable.',
          raw: formatStructuredContent(response),
          status: 'error',
        })
        setSessionStatus('Error al generar el plan')
        setSessionEvents((currentEvents) => [
          ...currentEvents,
          'Falló la generación del plan',
        ])
        return
      }

      addFlowMessage({
        source: 'planificador',
        title: 'Respuesta del planificador',
        content: response.instruction,
        raw: formatStructuredContent(response),
        status: response.approvalRequired ? 'warning' : 'success',
      })
      const nextExecutionMetadata = resolvePlannerExecutionMetadata(response)
      const validationIssue = options?.validateResponse?.(
        response,
        nextExecutionMetadata,
      )

      if (validationIssue) {
        options?.onPlanningFailure?.()
        debugRendererLog('materialization-plan:rejected-as-incoherent', {
          validationIssue,
          decisionKey: nextExecutionMetadata.decisionKey,
          strategy: nextExecutionMetadata.strategy,
          sourceModules: activeSafeFirstDeliveryPlan?.modules || [],
          returnedModules:
            nextExecutionMetadata.safeFirstDeliveryMaterialization?.modules ||
            nextExecutionMetadata.safeFirstDeliveryPlan?.modules ||
            [],
        })
        addFlowMessage({
          source: 'orquestador',
          title: 'Decisión del orquestador',
          content: validationIssue,
          status: 'error',
        })
        setSessionStatus('Error al generar el plan')
        setCurrentStep(
          'El orquestador rechazó el plan devuelto por inconsistencia con la primera entrega segura activa',
        )
        setSessionEvents((currentEvents) => [
          ...currentEvents,
          'Se rechazó un plan materializable incoherente con la primera entrega activa',
        ])
        return
      }

      syncBrainRoutingDecision(response.brainRoutingDecision)
      setPlannerExecutionMetadata(nextExecutionMetadata)
      setPlannerRequestSnapshot({
        goal: plannerGoal,
        context: plannerContext,
        decisionKey: nextExecutionMetadata.decisionKey,
        safeFirstDeliveryPlanFingerprint: buildSafeFirstDeliveryPlanFingerprint(
          nextExecutionMetadata.safeFirstDeliveryPlan,
        ),
      })
      setLastObservedExecutionMode('')
      recordPlannerExecutionSummary(nextExecutionMetadata)

      if (response.approvalRequired) {
        if (
          matchesProjectApprovalPolicy({
            policy: projectApprovalPolicy,
            source: 'planner',
            payload: response,
          })
        ) {
          await replanManualFlow(
            buildPlannerFeedbackPayload({
              type: 'approval-granted',
              source: 'planner',
              approvalMode: 'project-rule',
              instruction: response.instruction,
              approvalReason: resolveApprovalReason(response),
            }),
            true,
          )
          return
          setDecisionPending(false)
          setApprovalMessage('')
          setPendingInstruction('')
          setApprovalSource('')
          setPlannerInstruction(response.instruction)
          setCurrentStep(response.instruction)
          setSessionStatus('Plan autoaprobado por regla del proyecto')
          updateLastRunSummary({
            objective: normalizedPlannerGoal,
            instruction: response.instruction,
            result: 'Pendiente de ejecución',
            approval: 'Autoaprobada por regla del proyecto',
            finalStatus: 'Plan autoaprobado por regla del proyecto',
          })
          setSessionEvents((currentEvents) => [
            ...currentEvents,
            'El planificador detectó una tarea sensible',
            'La regla del proyecto aprobó automáticamente la instrucción',
          ])
          addFlowMessage({
            source: 'orquestador',
            title: 'Decisión del orquestador',
            content:
              'La instrucción del planificador quedó autoaprobada por la política del proyecto.',
            status: 'success',
          })
          return
        }

        openApprovalCheckpoint({
          source: 'planner',
          instruction: response.instruction,
          payload: response,
        })
        clearVisibleExecutionRuntimeState()
        setSessionStatus('Esperando aprobación para continuar')
        setCurrentStep('El Cerebro necesita una decision humana antes de seguir')
        updateLastRunSummary({
          objective: normalizedPlannerGoal,
          instruction: response.instruction,
          result: 'Pendiente de aprobación',
          approval: 'Manual requerida',
          finalStatus: 'Esperando aprobación para continuar',
        })
        setSessionEvents((currentEvents) => [
          ...currentEvents,
          'El planificador pidió aprobación manual',
        ])
        addFlowMessage({
          source: 'orquestador',
          title: 'Decisión del orquestador',
          content:
            'La instrucción del planificador quedó pendiente de aprobación manual.',
          status: 'warning',
        })
        return
      }

      setDecisionPending(false)
      setApprovalMessage('')
      setPendingInstruction('')
      setPendingExecutionInstruction('')
      setApprovalSource('')
      setPlannerInstruction(response.instruction)
      setCurrentStep(response.instruction)
      if (isUserClarificationPlannerResponse(response)) {
        clearVisibleExecutionRuntimeState()
        setSessionStatus('Esperando una nueva definición del usuario')
        setCurrentStep('El Cerebro necesita una nueva definición antes de ejecutar')
        updateLastRunSummary({
          objective: normalizedPlannerGoal,
          instruction: response.instruction,
          result: response.instruction,
          approval: 'No requerida',
          finalStatus: 'Esperando una nueva definición del usuario',
        })
        setSessionEvents((currentEvents) => [
          ...currentEvents,
          'El planificador devolvió una consulta para el usuario',
        ])
        addFlowMessage({
          source: 'orquestador',
          title: 'Decisión del orquestador',
          content:
            'La respuesta del planificador requiere una nueva definición del usuario antes de ejecutar.',
          status: 'warning',
        })
        return
      }

      if (isReviewOnlyPlannerResponse(response)) {
        clearVisibleExecutionRuntimeState()
        setSessionStatus('Plan listo para revision')
        setCurrentStep('El Cerebro devolvio una arquitectura para revisar antes de ejecutar')
        updateLastRunSummary({
          objective: normalizedPlannerGoal,
          instruction: response.instruction,
          result: response.instruction,
          approval: 'No requerida',
          finalStatus: 'Plan listo para revision',
        })
        setSessionEvents((currentEvents) => [
          ...currentEvents,
          'El planificador devolvio un plan solo para revision',
        ])
        addFlowMessage({
          source: 'orquestador',
          title: 'Decision del orquestador',
          content:
            'La respuesta del planificador quedo lista para revision y no se ejecutara automaticamente.',
          status: 'warning',
        })
        return
      }

      clearVisibleExecutionRuntimeState()
      setSessionStatus('Plan generado')
      updateLastRunSummary({
        objective: normalizedPlannerGoal,
        instruction: response.instruction,
        result: 'Pendiente de ejecución',
        approval: 'No requerida',
        finalStatus: 'Plan generado',
      })
      setSessionEvents((currentEvents) => [
        ...currentEvents,
        'El planificador devolvió una instrucción',
      ])
      addFlowMessage({
        source: 'orquestador',
        title: 'Decisión del orquestador',
        content: 'La instrucción quedó disponible para ejecución manual.',
        status: 'success',
      })
    } catch {
      options?.onPlanningFailure?.()
      addFlowMessage({
        source: 'orquestador',
        title: 'Decisión del orquestador',
        content: 'La planificación terminó con error.',
        status: 'error',
      })
      setSessionStatus('Error al generar el plan')
      setSessionEvents((currentEvents) => [
        ...currentEvents,
        'Falló la generación del plan',
      ])
    } finally {
      setIsPlanning(false)
    }
  }

  const handlePrepareProjectPhase = async (phaseId: string) => {
    const prompt = buildProjectPhasePrompt('prepare', phaseId)

    clearVisibleExecutionRuntimeState()
    setSessionStatus('Preparando siguiente fase segura')
    setCurrentStep(
      `El orquestador esta preparando la fase ${normalizeOptionalString(phaseId) || 'siguiente'} del proyecto local`,
    )
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      `Se preparo una planificacion para la fase ${normalizeOptionalString(phaseId) || 'siguiente'}`,
    ])

    await handleGenerateNextStep({
      goal: prompt.goal,
      context: prompt.context,
      sourceLabel: `Preparar fase ${normalizeOptionalString(phaseId) || 'local'}`,
      sendContent: `Se envio una solicitud para preparar la fase ${normalizeOptionalString(phaseId) || 'local'} del proyecto existente.`,
      persistPreparedInputs: true,
    })
  }

  const handleMaterializeProjectPhase = async (phaseId: string) => {
    const prompt = buildProjectPhasePrompt('materialize', phaseId)

    clearVisibleExecutionRuntimeState()
    setSessionStatus('Preparando materializacion de fase segura')
    setCurrentStep(
      `El orquestador esta preparando la materializacion de la fase ${normalizeOptionalString(phaseId) || 'local'}`,
    )
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      `Se solicito la materializacion de la fase ${normalizeOptionalString(phaseId) || 'local'}`,
    ])

    await handleGenerateNextStep({
      goal: prompt.goal,
      context: prompt.context,
      sourceLabel: `Materializar fase ${normalizeOptionalString(phaseId) || 'local'}`,
      sendContent: `Se envio una solicitud para materializar la fase ${normalizeOptionalString(phaseId) || 'local'} del proyecto existente.`,
      persistPreparedInputs: true,
    })
  }

  const handlePrepareModuleExpansion = async (
    payload: ModuleExpansionActionPayload,
  ) => {
    const targetStrategy = normalizeOptionalString(payload.targetStrategy).toLocaleLowerCase()
    const prompt =
      targetStrategy === 'prepare-module-expansion-plan' ||
      targetStrategy === 'materialize-module-expansion-plan'
        ? buildModuleExpansionPrompt({
            action: 'prepare',
            moduleId: normalizeOptionalString(payload.moduleId),
            moduleName: payload.moduleName,
            targetStrategy: payload.targetStrategy,
            expectedFiles: payload.expectedFiles,
            safeToMaterialize: payload.safeToMaterialize,
            requiresApproval: payload.requiresApproval,
          })
        : buildExpansionOptionPrompt({
            action: 'prepare',
            optionId: normalizeOptionalString(payload.moduleId),
            optionLabel: payload.moduleName,
            optionType: payload.optionType,
            targetStrategy: payload.targetStrategy,
            expectedFiles: payload.expectedFiles,
            safeToMaterialize: payload.safeToMaterialize,
            requiresApproval: payload.requiresApproval,
            reason: payload.reason,
          })

    clearVisibleExecutionRuntimeState()
    setSessionStatus('Preparando continuidad del proyecto')
    setCurrentStep(
      `El orquestador esta preparando la siguiente expansion de ${normalizeOptionalString(payload.moduleName) || normalizeOptionalString(payload.moduleId) || 'modulo'}`,
    )
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      `Se preparo una planificacion para ${normalizeOptionalString(payload.moduleName) || normalizeOptionalString(payload.moduleId) || 'la siguiente expansion'}`,
    ])

    await handleGenerateNextStep({
      goal: prompt.goal,
      context: prompt.context,
      sourceLabel: `Preparar ${normalizeOptionalString(payload.moduleName) || 'expansion'}`,
      sendContent: `Se envio una solicitud para preparar ${normalizeOptionalString(payload.moduleName) || 'la siguiente expansion'} del proyecto existente.`,
      persistPreparedInputs: true,
    })
  }

  const handleMaterializeModuleExpansion = async (
    payload: ModuleExpansionActionPayload,
  ) => {
    if (!payload.safeToMaterialize) {
      return
    }

    const prompt = buildModuleExpansionPrompt({
      action: 'materialize',
      moduleId: normalizeOptionalString(payload.moduleId),
      moduleName: payload.moduleName,
      targetStrategy: payload.targetStrategy,
      expectedFiles: payload.expectedFiles,
      safeToMaterialize: payload.safeToMaterialize,
      requiresApproval: payload.requiresApproval,
    })

    clearVisibleExecutionRuntimeState()
    setSessionStatus('Preparando materializacion de modulo seguro')
    setCurrentStep(
      `El orquestador esta preparando la materializacion del modulo ${normalizeOptionalString(payload.moduleName) || normalizeOptionalString(payload.moduleId) || 'local'}`,
    )
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      `Se solicito la materializacion del modulo ${normalizeOptionalString(payload.moduleName) || normalizeOptionalString(payload.moduleId) || 'local'}`,
    ])

    await handleGenerateNextStep({
      goal: prompt.goal,
      context: prompt.context,
      sourceLabel: `Materializar ${normalizeOptionalString(payload.moduleName) || 'modulo'}`,
      sendContent: `Se envio una solicitud para materializar ${normalizeOptionalString(payload.moduleName) || 'un modulo seguro'} del proyecto existente.`,
      persistPreparedInputs: true,
    })
  }

  const handlePrepareContinuationAction = async (
    action: ContinuationActionContract,
  ) => {
    const normalizedPhaseId = normalizeOptionalString(action.phaseId)
    const normalizedModuleId = normalizeOptionalString(action.moduleId)

    if (normalizedPhaseId) {
      await handlePrepareProjectPhase(normalizedPhaseId)
      return
    }

    if (normalizedModuleId) {
      await handlePrepareModuleExpansion({
        moduleId: normalizedModuleId,
        moduleName: action.title,
        optionType: action.category,
        targetStrategy: action.targetStrategy,
        expectedFiles: action.targetFiles || null,
        safeToPrepare: action.safeToPrepare,
        safeToMaterialize: action.safeToMaterialize,
        requiresApproval: action.requiresApproval,
        reason: action.reason || action.blocker || action.description,
      })
      return
    }

    const prompt = buildContinuationActionPrompt(action)

    clearVisibleExecutionRuntimeState()
    setSessionStatus('Preparando continuidad revisable')
    setCurrentStep(
      `El orquestador esta preparando ${normalizeOptionalString(action.title) || 'la siguiente continuidad'} del proyecto local`,
    )
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      `Se preparo una continuidad revisable para ${normalizeOptionalString(action.title) || normalizeOptionalString(action.id) || 'la siguiente accion'}`,
    ])

    await handleGenerateNextStep({
      goal: prompt.goal,
      context: prompt.context,
      sourceLabel: `Preparar ${normalizeOptionalString(action.title) || 'continuidad'}`,
      sendContent: `Se envio una solicitud para preparar ${normalizeOptionalString(action.title) || 'la siguiente continuidad'} del proyecto existente.`,
      persistPreparedInputs: true,
    })
  }

  const handleMaterializeContinuationAction = async (
    action: ContinuationActionContract,
  ) => {
    if (action.safeToMaterialize !== true) {
      return
    }

    const normalizedPhaseId = normalizeOptionalString(action.phaseId)
    const normalizedModuleId = normalizeOptionalString(action.moduleId)

    if (normalizedPhaseId) {
      await handleMaterializeProjectPhase(normalizedPhaseId)
      return
    }

    if (normalizedModuleId) {
      await handleMaterializeModuleExpansion({
        moduleId: normalizedModuleId,
        moduleName: action.title,
        optionType: action.category,
        targetStrategy: action.targetStrategy,
        expectedFiles: action.targetFiles || null,
        safeToPrepare: action.safeToPrepare,
        safeToMaterialize: action.safeToMaterialize,
        requiresApproval: action.requiresApproval,
        reason: action.reason || action.description,
      })
    }
  }

  const handlePrepareSafeFirstDeliveryPlan = async () => {
    if (!plannerIsReviewOnly || !activeProductArchitecture) {
      return
    }

    const preparedPlanningPrompt = buildSafeFirstDeliveryPlanningPrompt({
      architecture: activeProductArchitecture,
      originalGoal: goalInput,
      originalContext: getCurrentExecutionContextValue(),
    })

    clearVisibleExecutionRuntimeState()
    setSessionStatus('Preparando primera entrega segura')
    setCurrentStep(
      'El orquestador esta preparando una planificacion acotada para la primera entrega segura',
    )
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      'Se preparo una nueva planificacion para la primera entrega segura',
    ])

    await handleGenerateNextStep({
      goal: preparedPlanningPrompt.goal,
      context: preparedPlanningPrompt.context,
      sourceLabel: 'Primera entrega segura preparada',
      sendContent:
        'Se envio al planificador una solicitud acotada para preparar la primera entrega segura sin ejecutar cambios todavia.',
      persistPreparedInputs: true,
    })
  }

  const handlePrepareSafeMaterializationPlan = async () => {
    if (!plannerIsReviewOnly || !activeSafeFirstDeliveryPlan) {
      resetPlannerMaterializationAttemptState({
        fallbackMetadata: EMPTY_PLANNER_EXECUTION_METADATA,
        fallbackSnapshot: null,
      })
      setSessionStatus('Error al generar el plan')
      setCurrentStep(
        'No hay una primera entrega segura activa y valida para preparar la materializacion',
      )
      addFlowMessage({
        source: 'orquestador',
        title: 'Decisión del orquestador',
        content:
          'No hay una primera entrega segura activa y válida para preparar la materialización.',
        status: 'error',
      })
      return
    }

    const activeSafeFirstDeliveryPlanFingerprint =
      buildSafeFirstDeliveryPlanFingerprint(activeSafeFirstDeliveryPlan)
    const snapshotMatchesActiveSafePlan =
      activeSafeFirstDeliveryPlanFingerprint !== '' &&
      plannerRequestSnapshot.safeFirstDeliveryPlanFingerprint !== '' &&
      plannerRequestSnapshot.safeFirstDeliveryPlanFingerprint ===
        activeSafeFirstDeliveryPlanFingerprint
    const stableOriginalGoal = snapshotMatchesActiveSafePlan
      ? plannerRequestSnapshot.goal
      : ''
    const stableOriginalContext = snapshotMatchesActiveSafePlan
      ? plannerRequestSnapshot.context
      : ''
    const safePlanReviewMetadata = buildSafeFirstDeliveryReviewMetadata({
      baseMetadata: effectivePlannerExecutionMetadata,
      plan: activeSafeFirstDeliveryPlan,
    })
    const safePlanReviewSnapshot: PlannerRequestSnapshot = {
      goal: stableOriginalGoal,
      context: stableOriginalContext,
      decisionKey: 'safe-first-delivery-plan',
      safeFirstDeliveryPlanFingerprint: activeSafeFirstDeliveryPlanFingerprint,
    }

    const preparedPlanningPrompt = buildSafeFirstDeliveryMaterializationPrompt({
      plan: activeSafeFirstDeliveryPlan,
      originalGoal: stableOriginalGoal,
      originalContext: stableOriginalContext,
    })

    clearVisibleExecutionRuntimeState()
    setSessionStatus('Preparando materialización segura')
    setCurrentStep(
      'El orquestador esta preparando un plan materializable y acotado para la primera entrega segura',
    )
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      'Se preparo una nueva planificacion para materializar la primera entrega segura',
    ])
    resetPlannerMaterializationAttemptState({
      fallbackMetadata: safePlanReviewMetadata,
      fallbackSnapshot: safePlanReviewSnapshot,
    })

    await handleGenerateNextStep({
      goal: preparedPlanningPrompt.goal,
      context: preparedPlanningPrompt.context,
      sourceLabel: 'Materialización segura preparada',
      sendContent:
        'Se envio al planificador una solicitud acotada para preparar la materializacion segura de la primera entrega sin ejecutar cambios todavia.',
      onPlanningFailure: () => {
        resetPlannerMaterializationAttemptState({
          fallbackMetadata: safePlanReviewMetadata,
          fallbackSnapshot: safePlanReviewSnapshot,
        })
      },
      validateResponse: (_response, metadata) =>
        buildMaterializationPlanCoherenceIssue({
          sourcePlan: activeSafeFirstDeliveryPlan,
          metadata,
        }),
    })
  }

  const handlePrepareFrontendProjectMaterializationPlan = async () => {
    if (!plannerIsReviewOnly || !activeScalableDeliveryPlan) {
      setSessionStatus('Error al generar el plan')
      setCurrentStep(
        'No hay un scalableDeliveryPlan activo y valido para preparar la materializacion frontend',
      )
      addFlowMessage({
        source: 'orquestador',
        title: 'Decisión del orquestador',
        content:
          'No hay un scalableDeliveryPlan activo y válido para preparar la materialización frontend.',
        status: 'error',
      })
      return
    }

    if (
      normalizeOptionalString(activeScalableDeliveryPlan.deliveryLevel).toLocaleLowerCase() !==
      'frontend-project'
    ) {
      setSessionStatus('Plan escalable todavía no materializable')
      setCurrentStep(
        'La materializacion frontend solo está disponible para deliveryLevel frontend-project',
      )
      addFlowMessage({
        source: 'orquestador',
        title: 'Decisión del orquestador',
        content:
          'La materialización frontend controlada solo está disponible para deliveryLevel frontend-project.',
        status: 'warning',
      })
      return
    }

    const preparedPlanningPrompt = buildFrontendProjectMaterializationPrompt({
      plan: activeScalableDeliveryPlan,
      originalGoal: goalInput,
      originalContext: getCurrentExecutionContextValue(),
    })

    clearVisibleExecutionRuntimeState()
    setSessionStatus('Preparando materialización frontend')
    setCurrentStep(
      'El orquestador esta preparando un scaffold frontend local, revisable y materializable por el executor deterministico',
    )
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      'Se preparo una nueva planificacion para materializar un frontend-project local',
    ])

    await handleGenerateNextStep({
      goal: preparedPlanningPrompt.goal,
      context: preparedPlanningPrompt.context,
      sourceLabel: 'Materialización frontend preparada',
      sendContent:
        'Se envió al planificador una solicitud controlada para preparar la materialización local de un frontend-project sin instalar dependencias ni ejecutar el proyecto.',
      validateResponse: (_response, metadata) =>
        buildFrontendProjectMaterializationCoherenceIssue({
          sourcePlan: activeScalableDeliveryPlan,
          metadata,
        }),
    })
  }

  const handlePrepareFullstackLocalMaterializationPlan = async () => {
    if (!plannerIsReviewOnly || !activeScalableDeliveryPlan) {
      setSessionStatus('Error al generar el plan')
      setCurrentStep(
        'No hay un scalableDeliveryPlan activo y valido para preparar la materializacion fullstack local',
      )
      addFlowMessage({
        source: 'orquestador',
        title: 'Decision del orquestador',
        content:
          'No hay un scalableDeliveryPlan activo y valido para preparar la materializacion fullstack local.',
        status: 'error',
      })
      return
    }

    if (
      normalizeOptionalString(activeScalableDeliveryPlan.deliveryLevel).toLocaleLowerCase() !==
      'fullstack-local'
    ) {
      setSessionStatus('Plan escalable todavia no materializable')
      setCurrentStep(
        'La materializacion fullstack local solo esta disponible para deliveryLevel fullstack-local',
      )
      addFlowMessage({
        source: 'orquestador',
        title: 'Decision del orquestador',
        content:
          'La materializacion fullstack local controlada solo esta disponible para deliveryLevel fullstack-local.',
        status: 'warning',
      })
      return
    }

    const preparedPlanningPrompt = buildFullstackLocalMaterializationPrompt({
      plan: activeScalableDeliveryPlan,
      originalGoal: goalInput,
      originalContext: getCurrentExecutionContextValue(),
    })

    clearVisibleExecutionRuntimeState()
    setSessionStatus('Preparando materializacion fullstack local')
    setCurrentStep(
      'El orquestador esta preparando un scaffold fullstack local, revisable y materializable por el executor deterministico',
    )
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      'Se preparo una nueva planificacion para materializar un fullstack-local local',
    ])

    await handleGenerateNextStep({
      goal: preparedPlanningPrompt.goal,
      context: preparedPlanningPrompt.context,
      sourceLabel: 'Materializacion fullstack local preparada',
      sendContent:
        'Se envio al planificador una solicitud controlada para preparar la materializacion local de un fullstack-local sin instalar dependencias ni ejecutar servicios.',
      validateResponse: (_response, metadata) =>
        buildFullstackLocalMaterializationCoherenceIssue({
          sourcePlan: activeScalableDeliveryPlan,
          metadata,
        }),
    })
  }

  const handleExecuteCurrentInstruction = async (
    overrideInstruction?: string,
    overridePlannerExecutionMetadata?: PlannerExecutionMetadata,
  ) => {
    let finalExecutionClosure: {
      requestId: string
      source: 'return' | 'event'
      instruction: string
      result: string
      approval: string
      finalStatus: string
      currentStepLabel: string
      sessionStatusLabel: string
    } | null = null
    const requestId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    activeExecutionRequestIdRef.current = requestId
    manualExecutionClosureRef.current = {
      requestId,
      settled: false,
    }
    const currentExecutionContext = getCurrentExecutionContextValue()
    const instructionToExecute =
      normalizeOptionalString(overrideInstruction) || plannerInstruction
    const executionMetadata =
      overridePlannerExecutionMetadata || plannerExecutionMetadata

    if (isReviewOnlyPlannerResponse(executionMetadata)) {
      clearVisibleExecutionRuntimeState()
      setSessionStatus('Plan listo para revisión')
      setCurrentStep('El plan actual requiere revisión manual antes de cualquier ejecución')
      updateLastRunSummary({
        objective: normalizedGoalInput,
        instruction: instructionToExecute,
        result: instructionToExecute,
        approval: 'No requerida',
        finalStatus: 'Plan listo para revisión',
      })
      addFlowMessage({
        source: 'orquestador',
        title: 'Decisión del orquestador',
        content:
          'La instrucción actual es solo de revisión y no se puede ejecutar materialmente todavía.',
        status: 'warning',
      })
      return
    }

    const executorPayload = {
      instruction: instructionToExecute,
      context: currentExecutionContext || undefined,
      workspacePath: workspacePath.trim() || undefined,
      requestId,
      ...(executionMetadata.decisionKey
        ? { decisionKey: executionMetadata.decisionKey }
        : {}),
      ...(executionMetadata.businessSector
        ? { businessSector: executionMetadata.businessSector }
        : {}),
      ...(executionMetadata.businessSectorLabel
        ? { businessSectorLabel: executionMetadata.businessSectorLabel }
        : {}),
      ...(executionMetadata.creativeDirection
        ? { creativeDirection: executionMetadata.creativeDirection }
        : {}),
      ...(executionMetadata.reusableArtifactLookup
        ? { reusableArtifactLookup: executionMetadata.reusableArtifactLookup }
        : {}),
      ...(executionMetadata.reusableArtifactsFound > 0
        ? { reusableArtifactsFound: executionMetadata.reusableArtifactsFound }
        : {}),
      ...(executionMetadata.reuseDecision
        ? { reuseDecision: executionMetadata.reuseDecision }
        : {}),
      ...(executionMetadata.reuseReason
        ? { reuseReason: executionMetadata.reuseReason }
        : {}),
      ...(executionMetadata.reusedArtifactIds.length > 0
        ? { reusedArtifactIds: executionMetadata.reusedArtifactIds }
        : {}),
      ...(executionMetadata.reuseMode && executionMetadata.reuseMode !== 'none'
        ? { reuseMode: executionMetadata.reuseMode }
        : {}),
      ...(executionMetadata.executionScope
        ? { executionScope: executionMetadata.executionScope }
        : {}),
      ...(executionMetadata.safeFirstDeliveryMaterialization
        ? {
            safeFirstDeliveryMaterialization:
              executionMetadata.safeFirstDeliveryMaterialization,
          }
        : {}),
      ...(executionMetadata.materializationPlan
        ? { materializationPlan: executionMetadata.materializationPlan }
        : {}),
    }
    startOrContinueExecutionRun({
      requestId,
      instruction: instructionToExecute,
      executionMetadata,
    })

    setFlowConsoleVisibility({ open: true, pinned: true })
    clearVisibleExecutionRuntimeState({ requestState: 'running' })
    setIsExecutingTask(true)
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      'Se envió una instrucción al ejecutor local',
    ])
    addFlowMessage({
      source: 'executor',
      title: 'Datos enviados al ejecutor',
      content: currentExecutionContext
        ? 'Se envió una instrucción manual al ejecutor con contexto y espacio de trabajo.'
        : 'Se envió una instrucción manual al ejecutor sin contexto adicional y con espacio de trabajo.',
      raw: formatStructuredContent(executorPayload),
      status: 'info',
    })

    try {
      addDiagnosticFlowMessage(
        'Diagnóstico de ejecución manual',
        'La UI está por invocar la ejecución con los datos preparados.',
        'info',
        formatStructuredContent({ requestId }),
      )
      debugRendererLog('handleExecuteCurrentInstruction:before-await', {
        requestId,
        executorPayload,
      })
      const response = await window.aiOrchestrator?.executeTask?.(executorPayload)
      addDiagnosticFlowMessage(
        'Diagnóstico de ejecución manual',
        'La ejecución devolvió una respuesta a la UI.',
        'info',
        formatStructuredContent({
          requestId,
          responseRequestId: response?.requestId,
          ok: response?.ok,
          error: response?.error,
          result: response?.result,
          approvalRequired: response?.approvalRequired,
          hasResult: typeof response?.result === 'string',
          hasTrace: Array.isArray(response?.trace),
          traceLength: Array.isArray(response?.trace) ? response.trace.length : 0,
        }),
      )

      debugRendererLog('handleExecuteCurrentInstruction:after-await', {
        requestId,
        responseRequestId: response?.requestId,
        ok: response?.ok,
        accepted: response?.accepted,
        error: response?.error,
        result: response?.result,
      })

      if (!response?.ok || response?.accepted === false) {
        const failureContext = extractExecutorFailureContext(response)
        updateLastExecutorSnapshot(failureContext)
        recordExecutionSnapshotOnActiveRun(failureContext)
        finalizeActiveExecutionRun({
          status: 'recovery-pending',
          failureType: response?.failureType,
          failureContext,
        })
        const executorErrorMessage =
          response?.error || 'El ejecutor no aceptó iniciar la ejecución manual.'
        addDiagnosticFlowMessage(
          'Diagnóstico de ejecución manual',
          'La UI recibió un rechazo o un acuse inválido al iniciar la ejecución manual.',
          'error',
          formatStructuredContent({
            requestId,
            responseRequestId: response?.requestId,
            accepted: response?.accepted,
            error: response?.error,
          }),
        )
        addFlowMessage({
          source: 'orquestador',
          title: 'Decisión del orquestador',
          content: 'La ejecución manual no pudo iniciarse correctamente.',
          raw: executorErrorMessage,
          status: 'error',
        })
        releaseManualExecutionTracking(requestId)
        setSessionEvents((currentEvents) => [
          ...currentEvents,
          'Falló el inicio de la ejecución de la instrucción',
        ])
        await replanManualFlow(
          buildPlannerFeedbackPayload({
            type: 'execution-error',
            source: 'executor',
            instruction: instructionToExecute,
            error: executorErrorMessage,
            executorFailureContext: failureContext || undefined,
          }),
        )
        return
      }

      if (response?.accepted === true) {
        addDiagnosticFlowMessage(
          'Diagnóstico de ejecución manual',
          'La UI recibió el acuse de inicio y espera el evento final dedicado para cerrar la ejecución.',
          'info',
          formatStructuredContent({
            requestId,
            responseRequestId: response?.requestId,
            accepted: response?.accepted,
          }),
        )
        addFlowMessage({
          source: 'orquestador',
          title: 'Decisión del orquestador',
          content: 'La ejecución manual fue aceptada y queda a la espera del resultado final por evento.',
          status: 'info',
        })
        setSessionEvents((currentEvents) => [
          ...currentEvents,
          'El ejecutor aceptó iniciar la ejecución',
        ])
        return
      }

      try {
        safelyAddExecutorTrace(response?.trace)
      } catch (traceProcessingError) {
        const traceProcessingMessage =
          traceProcessingError instanceof Error
            ? traceProcessingError.stack || traceProcessingError.message
            : String(traceProcessingError)
        addDiagnosticFlowMessage(
          'Error procesando trace',
          'Falló el procesamiento de la traza devuelta por el ejecutor.',
          'error',
          formatStructuredContent({
            requestId,
            traceProcessingMessage,
          }),
        )
      }

      if (!response?.ok) {
        updateLastExecutorSnapshot(extractExecutorFailureContext(response))
        const executorErrorMessage = formatExecutorError(response)
        addDiagnosticFlowMessage(
          'Diagnóstico de ejecución manual',
          'La UI entró en la rama de error de la ejecución manual.',
          'error',
          formatStructuredContent({
            requestId,
            responseRequestId: response?.requestId,
          }),
        )
        addFlowMessage({
          source: 'orquestador',
          title: 'Decisión del orquestador',
          content:
            response?.error === 'Timeout esperando respuesta del executor'
              ? 'La ejecución manual terminó por timeout esperando al ejecutor.'
              : 'La ejecución manual terminó con error.',
          raw: executorErrorMessage,
          status: 'error',
        })
        addDiagnosticFlowMessage(
          'Diagnóstico de cierre manual',
          'La UI va a cerrar manualmente la ejecución desde la rama de error.',
          'error',
          formatStructuredContent({
            requestId,
            responseRequestId: response?.requestId,
            source: 'return',
            requestState: 'error',
            result: executorErrorMessage,
          }),
        )
        const wasClosed = closeManualExecutionState({
          requestId,
          source: 'return',
          instruction: plannerInstruction,
          result: executorErrorMessage,
          approval: 'No requerida',
          finalStatus: 'Error al ejecutar la instrucción',
          currentStepLabel: 'La ejecución manual terminó con error',
          sessionStatusLabel: 'Error al ejecutar la instrucción',
          requestState: 'error',
        })
        addDiagnosticFlowMessage(
          'Diagnóstico de cierre manual',
          `El cierre manual devolvió ${wasClosed ? 'true' : 'false'} en la rama de error.`,
          wasClosed ? 'success' : 'warning',
          formatStructuredContent({
            requestId,
            responseRequestId: response?.requestId,
            wasClosed,
          }),
        )
        debugRendererLog('handleExecuteCurrentInstruction:error-close-result', {
          requestId,
          wasClosed,
        })
        setSessionEvents((currentEvents) => [
          ...currentEvents,
          'Falló la ejecución de la instrucción',
        ])
        return
      }

      if (response.approvalRequired) {
        addDiagnosticFlowMessage(
          'Diagnóstico de ejecución manual',
          'La UI entró en la rama de aprobación requerida del ejecutor.',
          'warning',
          formatStructuredContent({
            requestId,
            responseRequestId: response?.requestId,
          }),
        )
        if (
          matchesProjectApprovalPolicy({
            policy: projectApprovalPolicy,
            source: 'executor',
            payload: response,
          })
        ) {
          const autoApprovedResult =
            response.resultPreview ||
            'La ejecución sensible fue aprobada automáticamente por la regla del proyecto'
          finalExecutionClosure = {
            requestId,
            source: 'return',
            instruction: response.instruction || plannerInstruction,
            result: autoApprovedResult,
            approval: 'Autoaprobada por regla del proyecto',
            finalStatus: 'Ejecución autoaprobada por regla del proyecto',
            currentStepLabel: 'La instrucción sensible quedó aprobada para ejecutarse',
            sessionStatusLabel: 'Ejecución autoaprobada por regla del proyecto',
          }
          addDiagnosticFlowMessage(
            'Diagnóstico de cierre manual',
            'La UI va a cerrar manualmente la ejecución desde la rama de autoaprobación.',
            'info',
            formatStructuredContent(finalExecutionClosure),
          )
          const wasClosed = closeManualExecutionState(finalExecutionClosure)
          addDiagnosticFlowMessage(
            'Diagnóstico de cierre manual',
            `El cierre manual devolvió ${wasClosed ? 'true' : 'false'} en la rama de autoaprobación.`,
            wasClosed ? 'success' : 'warning',
            formatStructuredContent({
              requestId,
              responseRequestId: response?.requestId,
              wasClosed,
            }),
          )
          debugRendererLog('handleExecuteCurrentInstruction:auto-approved-close-result', {
            requestId,
            wasClosed,
          })
          setSessionEvents((currentEvents) => [
            ...currentEvents,
            'El ejecutor detectó una tarea sensible',
            'La regla del proyecto aprobó automáticamente la ejecución',
          ])
          addFlowMessage({
            source: 'orquestador',
            title: 'Decisión del orquestador',
            content: 'La respuesta del ejecutor quedó autoaprobada.',
            status: 'success',
          })
          return
        }

        openApprovalCheckpoint({
          source: 'executor',
          instruction: response.instruction || plannerInstruction,
          payload: response,
        })
        addDiagnosticFlowMessage(
          'Diagnóstico de cierre manual',
          'La UI va a cerrar manualmente la ejecución desde la rama de aprobación requerida.',
          'warning',
          formatStructuredContent({
            requestId,
            responseRequestId: response?.requestId,
            source: 'return',
            resetPendingState: false,
          }),
        )
        const wasClosed = closeManualExecutionState({
          requestId,
          source: 'return',
          instruction: response.instruction || plannerInstruction,
          result: 'Pendiente de aprobación',
          approval: 'Manual requerida',
          finalStatus: 'Esperando aprobación para ejecutar',
          currentStepLabel: currentStep,
          sessionStatusLabel: 'Esperando aprobación para ejecutar',
          resetPendingState: false,
        })
        addDiagnosticFlowMessage(
          'Diagnóstico de cierre manual',
          `El cierre manual devolvió ${wasClosed ? 'true' : 'false'} en la rama de aprobación requerida.`,
          wasClosed ? 'success' : 'warning',
          formatStructuredContent({
            requestId,
            responseRequestId: response?.requestId,
            wasClosed,
          }),
        )
        debugRendererLog('handleExecuteCurrentInstruction:approval-close-result', {
          requestId,
          wasClosed,
        })
        setSessionEvents((currentEvents) => [
          ...currentEvents,
          'El ejecutor pidió aprobación manual',
        ])
        addFlowMessage({
          source: 'orquestador',
          title: 'Decisión del orquestador',
          content: 'La respuesta del ejecutor quedó pendiente de aprobación manual.',
          status: 'warning',
        })
        return
      }

      if (!response.result) {
        const missingResultMessage =
          'El ejecutor no devolvió un resultado utilizable para cerrar la ejecución.'
        addDiagnosticFlowMessage(
          'Diagnóstico de ejecución manual',
          'La UI detectó una respuesta sin result utilizable.',
          'error',
          formatStructuredContent({
            requestId,
            response,
          }),
        )
        addFlowMessage({
          source: 'orquestador',
          title: 'Decisión del orquestador',
          content: 'La ejecución manual no devolvió un resultado utilizable.',
          status: 'error',
        })
        addDiagnosticFlowMessage(
          'Diagnóstico de cierre manual',
          'La UI va a cerrar manualmente la ejecución por una respuesta sin resultado utilizable.',
          'error',
          formatStructuredContent({
            requestId,
            responseRequestId: response?.requestId,
            source: 'return',
            requestState: 'error',
            result: missingResultMessage,
          }),
        )
        const wasClosed = closeManualExecutionState({
          requestId,
          source: 'return',
          instruction: response.instruction || plannerInstruction,
          result: missingResultMessage,
          approval: 'No requerida',
          finalStatus: 'Error al ejecutar la instrucción',
          currentStepLabel: 'La ejecución manual terminó con error',
          sessionStatusLabel: 'Error al ejecutar la instrucción',
          requestState: 'error',
        })
        debugRendererLog('handleExecuteCurrentInstruction:missing-result-close-result', {
          requestId,
          wasClosed,
        })
        addDiagnosticFlowMessage(
          'Diagnóstico de cierre manual',
          `El cierre manual devolvió ${wasClosed ? 'true' : 'false'} por una respuesta sin resultado utilizable.`,
          wasClosed ? 'success' : 'warning',
          formatStructuredContent({
            requestId,
            responseRequestId: response?.requestId,
            wasClosed,
          }),
        )
        setSessionEvents((currentEvents) => [
          ...currentEvents,
          'Falló la ejecución de la instrucción',
        ])
        return
      }

      addDiagnosticFlowMessage(
        'Diagnóstico de ejecución manual',
        'La UI entró en la rama de éxito de la ejecución manual.',
        'success',
        formatStructuredContent({
          requestId,
          responseRequestId: response.requestId,
          instruction: response.instruction || plannerInstruction,
          result: response.result,
        }),
      )
      const responseSnapshot = extractExecutorFailureContext(response)
      updateLastExecutorSnapshot(responseSnapshot)
      recordExecutionSnapshotOnActiveRun(responseSnapshot)
      const responseIndicatesFastRoute =
        (Array.isArray(response.trace) &&
          response.trace.some((entry) => isFastRouteExecutionTitle(entry?.title))) ||
        isLocalFastRouteExecution({
          strategy: response.details?.strategy,
          materializationPlanSource: response.details?.materializationPlanSource,
          materialState: response.details?.materialState,
          executionMode: inferExecutionModeFromSnapshot(responseSnapshot),
          decisionKey: response.details?.decisionKey,
        })
      setLastObservedExecutionMode(
        responseIndicatesFastRoute ? 'local-fast' : 'executor',
      )
      finalExecutionClosure = {
        requestId,
        source: 'return',
        instruction: response.instruction || plannerInstruction,
        result: response.result,
        approval: 'No requerida',
        finalStatus: 'Ejecución completada',
        currentStepLabel: 'La instrucción actual ya fue ejecutada',
        sessionStatusLabel: 'Ejecución completada',
      }
      addDiagnosticFlowMessage(
        'Diagnóstico de cierre manual',
        'La UI va a cerrar manualmente la ejecución desde la rama de éxito.',
        'success',
        formatStructuredContent(finalExecutionClosure),
      )
      const wasClosed = closeManualExecutionState(finalExecutionClosure)
      addDiagnosticFlowMessage(
        'Diagnóstico de cierre manual',
        `El cierre manual devolvió ${wasClosed ? 'true' : 'false'} en la rama de éxito.`,
        wasClosed ? 'success' : 'warning',
        formatStructuredContent({
          requestId,
          responseRequestId: response?.requestId,
          wasClosed,
        }),
      )
      debugRendererLog('handleExecuteCurrentInstruction:success-close-result', {
        requestId,
        wasClosed,
      })
      setSessionEvents((currentEvents) => [
        ...currentEvents,
        'El ejecutor completó la instrucción',
      ])
      addFlowMessage({
        source: 'orquestador',
        title: 'Decisión del orquestador',
        content: 'La ejecución manual terminó correctamente.',
        status: 'success',
      })
    } catch (processingError) {
      const processingErrorMessage =
        processingError instanceof Error
          ? processingError.stack || processingError.message
          : String(processingError)
      addDiagnosticFlowMessage(
        'Excepción procesando respuesta del ejecutor',
        'La UI encontró una excepción durante el procesamiento posterior a la respuesta de ejecución.',
        'error',
        formatStructuredContent({
          requestId,
          processingErrorMessage,
        }),
      )
      addFlowMessage({
        source: 'orquestador',
        title: 'Decisión del orquestador',
        content: 'La ejecución manual terminó con error.',
        status: 'error',
      })
      debugRendererLog('handleExecuteCurrentInstruction:catch-branch', {
        requestId,
        error:
          processingError instanceof Error
            ? processingError.message
            : String(processingError),
      })
      addDiagnosticFlowMessage(
        'Diagnóstico de cierre manual',
        'La UI va a cerrar manualmente la ejecución desde la rama de excepción.',
        'error',
        formatStructuredContent({
          requestId,
          source: 'return',
          requestState: 'error',
          error:
            processingError instanceof Error
              ? processingError.message
              : String(processingError),
        }),
      )
      closeManualExecutionState({
        requestId,
        source: 'return',
        instruction: plannerInstruction,
        result: `La UI encontró un error procesando la respuesta del ejecutor: ${processingError instanceof Error ? processingError.message : String(processingError)}`,
        approval: 'No requerida',
        finalStatus: 'Error al ejecutar la instrucción',
        currentStepLabel: 'La ejecución manual terminó con error',
        sessionStatusLabel: 'Error al ejecutar la instrucción',
        requestState: 'error',
      })
      setSessionEvents((currentEvents) => [
        ...currentEvents,
        'Falló la ejecución de la instrucción',
      ])
    } finally {
      setFlowConsoleVisibility({ open: true, pinned: true })
      if (finalExecutionClosure) {
        addDiagnosticFlowMessage(
          'Diagnóstico de cierre manual',
          'La UI volvió a intentar el cierre manual desde el bloque final.',
          'info',
          formatStructuredContent(finalExecutionClosure),
        )
        const wasClosed = closeManualExecutionState(finalExecutionClosure)
        addDiagnosticFlowMessage(
          'Diagnóstico de cierre manual',
          `El cierre manual devolvió ${wasClosed ? 'true' : 'false'} desde el bloque final.`,
          wasClosed ? 'success' : 'warning',
          formatStructuredContent({
            requestId,
            wasClosed,
          }),
        )
        debugRendererLog('handleExecuteCurrentInstruction:finally-close-result', {
          requestId,
          wasClosed,
        })
      }
      if (manualExecutionClosureRef.current.requestId === requestId) {
        setIsExecutingTask((currentValue) =>
          manualExecutionClosureRef.current.settled ? false : currentValue,
        )
      }
      debugRendererLog('handleExecuteCurrentInstruction:finally', {
        requestId,
        settled:
          manualExecutionClosureRef.current.requestId === requestId
            ? manualExecutionClosureRef.current.settled
            : undefined,
      })
    }
  }

  const handleAutoFlow = async () => {
    setFlowConsoleVisibility({ open: true, pinned: true })
    setIsAutoFlowRunning(true)
    setAutoFlowIteration(0)
    setSessionEvents((currentEvents) => [
      ...currentEvents,
      'Se inició el flujo automático',
    ])
    await runAutoFlowLoop(1)
  }

  const useLegacySingleScreenLayout = false

  return useLegacySingleScreenLayout ? (
    <main className="min-h-screen w-full bg-transparent text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-12">
        <header className="border-b border-white/10 pb-8">
          <div className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-sky-200">
            ORQUESTADOR DE IA LOCAL
          </div>
          <div className="mt-6 max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Centro de control
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Coordiná planificador, ejecutor y aprobaciones desde un único entorno
              local pensado para un control operativo claro y deliberado.
            </p>
          </div>
        </header>

        <section className="grid gap-4 py-8 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur">
            <div className="text-lg font-semibold text-white">Planificador</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Desarma el objetivo en pasos controlados, dependencias y puntos
              de aprobación antes de empezar a ejecutar.
            </p>
            <div className="mt-6 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              {plannerBadge}
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur">
            <div className="text-lg font-semibold text-white">Ejecutor</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Aplica los pasos aprobados en secuencia y mantiene la sesión
              alineada con el alcance actual de trabajo.
            </p>
            <div className="mt-6 inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
              {executorBadge}
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur">
            <div className="text-lg font-semibold text-white">
              Aprobaciones humanas
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Frena acciones sensibles para que los cambios importantes solo
              avancen con una decisión explícita del operador.
            </p>
            <div className="mt-6 inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
              {humanApprovalsBadge}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <div className="text-lg font-semibold text-white">
                  Sesión actual
                </div>
                <p className="text-sm text-slate-400">
                  Estado operativo en vivo del entorno local activo.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleRunMockCycle}
                  disabled={decisionPending || isRunning}
                  className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                >
                  {isRunning ? 'Ejecutando...' : 'Correr ciclo de prueba'}
                </button>
                <button
                  type="button"
                  onClick={handleTestLocalConnection}
                  disabled={isTestingConnection}
                  className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                >
                  {isTestingConnection ? 'Probando...' : 'Probar conexión local'}
                </button>
                <button
                  type="button"
                  onClick={handleAutoFlow}
                  disabled={
                    isAutoFlowRunning ||
                    isPlanning ||
                    isExecutingTask ||
                    decisionPending
                  }
                  className="rounded-xl border border-violet-300/20 bg-violet-300/10 px-4 py-3 text-sm font-medium text-violet-100 transition hover:bg-violet-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                >
                  {isAutoFlowRunning
                    ? 'Procesando flujo...'
                    : 'Iniciar flujo automático'}
                </button>
                <button
                  type="button"
                  onClick={handleResetSessionMemory}
                  disabled={isRunning}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                >
                  Reiniciar memoria de la sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFlowConsoleVisibility({ open: true, pinned: true })
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Reabrir eventos
                </button>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Objetivo
                </div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Esto es lo que queda frenado hasta que le devolvamos tu respuesta al Cerebro.
                    </p>
                  </div>
                </div>
                <div className="mt-3 max-h-40 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm leading-6 text-slate-100">
                  Preparar el entorno local del orquestador para flujos guiados
                  de ejecución
                </div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-white">
                      Resumen E2E de corridas
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      Lectura compacta para validar caso feliz, falla recuperable y bloqueo por repetición.
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    {visibleExecutionRunSummaries.length} corrida(s)
                  </div>
                </div>
                {latestExecutionRunSummary ? (
                  <>
                    <div className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-300/8 px-4 py-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getExecutionRunScenarioTone(
                                latestExecutionRunSummary.scenarioLabel,
                              )}`}
                            >
                              {latestExecutionRunSummary.scenarioLabel}
                            </span>
                            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                              {getExecutionRunStatusLabel(latestExecutionRunSummary.status)}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-white">
                            {latestExecutionRunSummary.objectiveSummary}
                          </div>
                          <div className="text-xs leading-5 text-slate-300">
                            Último requestId: {latestExecutionRunSummary.latestRequestId}
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
                          <div className="rounded-xl border border-white/8 bg-slate-950/50 px-3 py-3 text-sm text-slate-100">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                              Aprobaciones abiertas
                            </div>
                            <div className="mt-1 font-medium">
                              {latestExecutionRunSummary.approvalsOpened}
                            </div>
                          </div>
                          <div className="rounded-xl border border-white/8 bg-slate-950/50 px-3 py-3 text-sm text-slate-100">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                              Reintentos / recuperaciones
                            </div>
                            <div className="mt-1 font-medium">
                              {latestExecutionRunSummary.recoveries}
                            </div>
                          </div>
                          <div className="rounded-xl border border-white/8 bg-slate-950/50 px-3 py-3 text-sm text-slate-100">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                              Fallos repetidos
                            </div>
                            <div className="mt-1 font-medium">
                              {latestExecutionRunSummary.repeatedFailureCount || 0}
                            </div>
                          </div>
                          <div className="rounded-xl border border-white/8 bg-slate-950/50 px-3 py-3 text-sm text-slate-100">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                              Progreso material
                            </div>
                            <div className="mt-1 font-medium">
                              {latestExecutionRunSummary.hasMaterialProgress ? 'Sí' : 'No'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 xl:grid-cols-3">
                      {visibleExecutionRunSummaries.map((summary) => (
                        <article
                          key={summary.runId}
                          className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white">
                                {summary.objectiveSummary}
                              </div>
                              <div className="mt-1 text-xs leading-5 text-slate-400">
                                {summary.updatedAtLabel} · {summary.latestRequestId}
                              </div>
                            </div>
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getExecutionRunScenarioTone(
                                summary.scenarioLabel,
                              )}`}
                            >
                              {summary.scenarioLabel}
                            </span>
                          </div>
                          <div className="mt-4 space-y-2 text-sm leading-6 text-slate-200">
                            <div>
                              <span className="text-slate-500">Instrucción:</span>{' '}
                              {summary.instructionSummary}
                            </div>
                            <div>
                              <span className="text-slate-500">Aprobaciones abiertas:</span>{' '}
                              {summary.approvalsOpened}
                            </div>
                            <div>
                              <span className="text-slate-500">Reintentos / recuperaciones:</span>{' '}
                              {summary.recoveries}
                            </div>
                            <div>
                              <span className="text-slate-500">Tipo de fallo final:</span>{' '}
                              {getTechnicalDiagnosticLabel(
                                summary.finalFailureType,
                                'No falló al cierre',
                              )}
                            </div>
                            <div>
                              <span className="text-slate-500">Modo de recuperación:</span>{' '}
                              {getTechnicalDiagnosticLabel(
                                summary.latestRecoveryMode,
                                'No aplicado',
                              )}
                            </div>
                            <div>
                              <span className="text-slate-500">Alcance del intento / alcance de ejecución:</span>{' '}
                              {getTechnicalDiagnosticLabel(
                                summary.latestAttemptScope,
                                'No reportado',
                              )}{' '}
                              /{' '}
                              {getTechnicalDiagnosticLabel(
                                summary.latestExecutionScope,
                                'No definido',
                              )}
                            </div>
                            <div>
                              <span className="text-slate-500">Modos bloqueados:</span>{' '}
                              {summary.blockedRecoveryModes.length > 0
                                ? summary.blockedRecoveryModes
                                    .map((value) =>
                                      getTechnicalDiagnosticLabel(value, value),
                                    )
                                    .join(', ')
                                : 'Ninguno'}
                            </div>
                            <div>
                              <span className="text-slate-500">Punto de continuidad:</span>{' '}
                              {summary.continuationAnchor || 'No disponible'}
                            </div>
                            <div>
                              <span className="text-slate-500">Archivos creados / tocados:</span>{' '}
                              {mergeUniqueStringValues(
                                summary.createdPaths,
                                summary.touchedPaths,
                                12,
                              ).join(', ') || 'Ninguno'}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                    Todavía no hay corridas ejecutadas para resumir.
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                <label
                  htmlFor="goal-input"
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  Objetivo actual
                </label>
                <textarea
                  id="goal-input"
                  value={goalInput}
                  onChange={(event) => setGoalInput(event.target.value)}
                  rows={3}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    id="generate-next-step-button"
                    type="button"
                    onClick={handleGenerateNextStep}
                    disabled={isPlanning}
                    className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                  >
                    {isPlanning ? 'Generando...' : 'Generar siguiente paso'}
                  </button>
                  {plannerIsReviewOnly ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200">
                      {plannerReviewStatusLabel}
                    </div>
                  ) : (
                    <button
                      id="execute-current-instruction-button"
                      type="button"
                      onClick={handleExecuteCurrentInstruction}
                      disabled={!canExecuteInstruction || isExecutingTask}
                      className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                    >
                      {isExecutingTask
                        ? 'Ejecutando...'
                        : 'Ejecutar instrucción actual'}
                    </button>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Participación del usuario
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-100">
                      ¿Vas a aportar definiciones, recursos o contenidos durante este proceso, o querés que el Cerebro decida todo lo faltante?
                    </div>
                    <div className="mt-2 text-xs leading-5 text-slate-400">
                      Si no elegís nada todavía, el sistema mantiene el comportamiento actual.
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setUserParticipationMode('user-will-contribute')}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        userParticipationMode === 'user-will-contribute'
                          ? 'border-sky-300/40 bg-sky-300/15 text-sky-100'
                          : 'border-white/10 bg-slate-950/50 text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      Sí, voy a aportar
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserParticipationMode('brain-decides-missing')}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        userParticipationMode === 'brain-decides-missing'
                          ? 'border-emerald-300/40 bg-emerald-300/15 text-emerald-100'
                          : 'border-white/10 bg-slate-950/50 text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      No, decidí vos
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserParticipationMode(DEFAULT_USER_PARTICIPATION_MODE)}
                      className="rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10"
                    >
                      Sin definir
                    </button>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-300">
                    {userParticipationSummary}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Enrutamiento del Cerebro
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-100">
                      Elegí cuánto ahorro o calidad prioriza el orquestador al decidir entre OpenAI y reglas locales.
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {BRAIN_COST_MODE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setBrainCostMode(option.value)}
                        className={`rounded-xl border px-4 py-3 text-left transition ${
                          brainCostMode === option.value
                            ? 'border-sky-300/40 bg-sky-300/15 text-sky-100'
                            : 'border-white/10 bg-slate-950/50 text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-sm font-medium">{option.label}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-400">
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Modo / criterio
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {getBrainCostModeLabel(brainCostMode)} / {activeBrainRoutingMode}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">
                        Naturaleza: {activeBrainProblemNature}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Proveedor elegido / usado
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {`${activeBrainSelectedProvider} -> ${activeBrainResolvedProvider}`}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">
                        {activeBrainFallbackUsed
                          ? `Respaldo aplicado hacia ${activeBrainResolvedProvider}`
                          : 'Sin respaldo en la última decisión'} · Confianza: {activeBrainRoutingConfidence}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Respaldo declarado
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {activeBrainFallbackProvider}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">
                        {normalizeOptionalString(lastBrainRoutingDecision?.fallbackReason)
                          ? summarizeInlineText(lastBrainRoutingDecision?.fallbackReason, 140)
                          : 'No hubo motivo de respaldo registrado'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Complejidad / ambigüedad
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {getBrainRoutingSeverityLabel(lastBrainRoutingDecision?.complexity)} /{' '}
                        {getBrainRoutingSeverityLabel(lastBrainRoutingDecision?.ambiguity)}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">
                        Riesgo: {getBrainRoutingSeverityLabel(lastBrainRoutingDecision?.risk)} · Impacto:{' '}
                        {getBrainRoutingSeverityLabel(lastBrainRoutingDecision?.impact)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Ruta planificada / clave técnica
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {activeExecutionModeLabel} / {activeDecisionKeyLabel}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">
                        Estrategia: {activePlannerStrategyLabel}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 md:col-span-2 xl:col-span-1">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Motivo resumido
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {activeBrainRoutingReason}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 md:col-span-2 xl:col-span-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Memoria reutilizable
                      </div>
                      <div
                        id="planner-active-reuse-summary"
                        className="mt-2 text-sm leading-6 text-slate-100"
                      >
                        {activeReuseModeLabel} / {activeReuseFoundCount} coincidencia(s)
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">
                        {activeReuseDetailLabel}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">
                        Selección manual: {activeReuseManualSummary}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-500">
                        {activeReuseSuggestionIds.length > 0 || activeAppliedReuseArtifactIds.length > 0
                          ? activeReuseArtifactSummary
                          : 'Todavía no hay artefactos considerados en esta decisión.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Lectura operativa de la corrida
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-100">
                      Resume el camino real que siguió el sistema, la última decisión humana relevante y los artefactos detectados sin tener que abrir la consola técnica.
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Ruta / siguiente acción
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {activeExecutionModeLabel}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">
                        {getNextExpectedActionLabel(
                          plannerExecutionMetadata.nextExpectedAction,
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Aprobación / respuesta humana
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {activeApprovalStatusLabel}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">
                        {activeApprovalDetailLabel}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Resultado E2E
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {activeOperationalE2eScenarioLabel}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">
                        {activeOperationalE2eStatusLabel}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Archivos / carpetas tocados
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {latestTouchedArtifacts.length > 0
                          ? `${latestTouchedArtifacts.length} ruta(s) registradas`
                          : 'Sin rutas registradas'}
                      </div>
                      <div className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-400">
                        {latestTouchedArtifacts.join('\n') ||
                          'Todavía no hay rutas creadas o tocadas visibles.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {shouldShowVisibleFinalTextResponse ? (
                <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/8 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/90">
                    Respuesta final
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-200">
                    Esta corrida no dejó archivos ni carpetas. El resultado principal es textual.
                  </div>
                  <div className="mt-4 whitespace-pre-wrap break-words rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-white">
                    {visibleFinalTextResponse}
                  </div>
                </div>
              ) : null}
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                <label
                  htmlFor="execution-context-input"
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  Contexto adicional para el ejecutor
                </label>
                <textarea
                  id="execution-context-input"
                  ref={executionContextInputRef}
                  value={executionContextInput}
                  onChange={(event) => setExecutionContextInput(event.target.value)}
                  rows={3}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                />
              </div>
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                <div className="text-lg font-semibold text-white">
                  Espacio de trabajo de destino
                </div>
                <div className="mt-4 grid gap-3">
                  <div>
                    <label
                      htmlFor="workspace-path"
                      className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      Espacio de trabajo de destino
                    </label>
                    <textarea
                      id="workspace-path"
                      value={workspacePath}
                      onChange={(event) => setWorkspacePath(event.target.value)}
                      rows={2}
                      className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                    />
                  </div>
                  <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Estado
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-100">
                      {workspaceStatusLabel}
                    </div>
                  </div>
                </div>
              </div>
              <div
                id="reusable-memory-section"
                className="rounded-xl border border-white/8 bg-white/5 px-4 py-4"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-white">
                        Memoria reutilizable
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        Explorá artefactos reutilizables, filtrá por estilo o estructura y fijá una selección manual antes de planificar una web nueva.
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm text-slate-100 xl:max-w-md">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Selección actual
                      </div>
                      <div className="mt-2">{manualReuseModeLabel}</div>
                      <div
                        id="manual-reuse-selection-summary"
                        className="mt-2 text-xs leading-5 text-slate-400"
                      >
                        {selectedReusableArtifactSummary}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-500">
                        {selectedReusableArtifactTags || 'Sin etiquetas destacadas'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                      <div>
                        <label
                          htmlFor="reusable-filter-sector"
                          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          Rubro
                        </label>
                        <input
                          id="reusable-filter-sector"
                          value={reusableArtifactFilters.sector}
                          onChange={(event) =>
                            setReusableArtifactFilters((currentValue) => ({
                              ...currentValue,
                              sector: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                          placeholder="odontología, moda..."
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="reusable-filter-visual-style"
                          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          Estilo visual
                        </label>
                        <input
                          id="reusable-filter-visual-style"
                          value={reusableArtifactFilters.visualStyle}
                          onChange={(event) =>
                            setReusableArtifactFilters((currentValue) => ({
                              ...currentValue,
                              visualStyle: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                          placeholder="claridad, premium..."
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="reusable-filter-layout"
                          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          Estructura
                        </label>
                        <input
                          id="reusable-filter-layout"
                          value={reusableArtifactFilters.layoutVariant}
                          onChange={(event) =>
                            setReusableArtifactFilters((currentValue) => ({
                              ...currentValue,
                              layoutVariant: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                          placeholder="institucional, editorial..."
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="reusable-filter-hero"
                          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          Apertura principal
                        </label>
                        <input
                          id="reusable-filter-hero"
                          value={reusableArtifactFilters.heroStyle}
                          onChange={(event) =>
                            setReusableArtifactFilters((currentValue) => ({
                              ...currentValue,
                              heroStyle: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                          placeholder="informativo, inmersivo..."
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="reusable-filter-tags"
                          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          Tags
                        </label>
                        <input
                          id="reusable-filter-tags"
                          value={reusableArtifactFilters.tags}
                          onChange={(event) =>
                            setReusableArtifactFilters((currentValue) => ({
                              ...currentValue,
                              tags: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                          placeholder="premium, editorial..."
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <label
                        htmlFor="manual-reuse-mode"
                        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                      >
                        Reutilización manual
                      </label>
                      <select
                        id="manual-reuse-mode"
                        value={manualReuseMode}
                        onChange={(event) =>
                          setManualReuseMode(event.target.value as ManualReuseMode)
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-sky-300/40"
                      >
                        <option value="auto">Búsqueda automática</option>
                        <option value="none">No reutilizar</option>
                        <option value="inspiration-only">Usar solo inspiración</option>
                        <option value="reuse-style">Reutilizar estilo</option>
                        <option value="reuse-structure">Reutilizar estructura</option>
                        <option value="reuse-style-and-structure">
                          Reutilizar estilo y estructura
                        </option>
                      </select>
                      <div className="mt-3 text-xs leading-5 text-slate-400">
                        {manualReusablePreferencePayload
                          ? manualReusablePreferencePayload.artifactId
                            ? `El planificador va a priorizar ${manualReuseModeLabel.toLocaleLowerCase()} desde ${manualReusablePreferencePayload.artifactId}.`
                            : 'El planificador va a ignorar la memoria reutilizable por decisión manual.'
                          : 'Sin selección manual: se mantiene la búsqueda automática.'}
                      </div>
                      <button
                        id="clear-reusable-artifact-selection"
                        type="button"
                        onClick={() => {
                          setSelectedReusableArtifact(null)
                          setManualReuseMode('auto')
                        }}
                        className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                      >
                        Limpiar selección
                      </button>
                    </div>
                  </div>

                  <div
                    id="reusable-artifact-list"
                    className="grid gap-3 xl:grid-cols-2"
                  >
                    {isLoadingReusableArtifacts ? (
                      <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm text-slate-300 xl:col-span-2">
                        Cargando artefactos reutilizables...
                      </div>
                    ) : reusableArtifactError ? (
                      <div className="rounded-xl border border-red-300/20 bg-red-300/10 px-4 py-4 text-sm text-red-100 xl:col-span-2">
                        {reusableArtifactError}
                      </div>
                    ) : reusableArtifacts.length === 0 ? (
                      <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm text-slate-300 xl:col-span-2">
                        No hay artefactos que coincidan con esos filtros.
                      </div>
                    ) : (
                      reusableArtifacts.map((artifact) => {
                        const isSelected = selectedReusableArtifact?.id === artifact.id
                        const preview = buildReusableArtifactPreviewModel(artifact)
                        const visibleColors = Object.values(artifact.colors || {}).slice(0, 4)
                        const badgeValues = [
                          artifact.sectorLabel || artifact.sector,
                          getVisualStyleLabel(artifact.visualStyle),
                          getLayoutVariantLabel(artifact.layoutVariant),
                          getHeroStyleLabel(artifact.heroStyle),
                        ].filter(Boolean)
                        const realPreviewSrc =
                          artifact.preview?.status === 'generated'
                            ? buildLocalFileUrl(artifact.preview.imagePath)
                            : ''

                        return (
                          <article
                            key={artifact.id}
                            data-reusable-artifact-card={artifact.id}
                            className={`rounded-2xl border px-4 py-4 ${
                              isSelected
                                ? 'border-sky-300/30 bg-sky-300/10'
                                : 'border-white/8 bg-slate-950/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-white">
                                  {artifact.sectorLabel || artifact.sector || artifact.id}
                                </div>
                                <div className="mt-1 text-xs leading-5 text-slate-400">
                                  {artifact.id}
                                </div>
                              </div>
                              <button
                                type="button"
                                data-reusable-artifact-select={artifact.id}
                                onClick={() => {
                                  setSelectedReusableArtifact(artifact)
                                  setManualReuseMode((currentValue) =>
                                    currentValue === 'auto'
                                      ? 'reuse-style-and-structure'
                                      : currentValue,
                                  )
                                }}
                                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                  isSelected
                                    ? 'border-sky-300/40 bg-sky-300/15 text-sky-100'
                                    : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                                }`}
                              >
                                {isSelected ? 'Seleccionado' : 'Usar este artefacto'}
                              </button>
                            </div>

                            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                              <div
                                data-reusable-artifact-preview={artifact.id}
                                className="overflow-hidden rounded-2xl border border-white/10"
                                style={{
                                  background: preview.background,
                                  color: preview.text,
                                }}
                              >
                                {realPreviewSrc ? (
                                  <div className="relative">
                                    <img
                                      src={realPreviewSrc}
                                      alt={`Vista previa real de ${artifact.sectorLabel || artifact.sector || artifact.id}`}
                                      className="h-56 w-full object-cover"
                                    />
                                    <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
                                      <span className="rounded-full border border-emerald-300/30 bg-slate-950/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                                        Vista previa real
                                      </span>
                                      <span
                                        className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                                        style={{
                                          borderColor: `${preview.accent}66`,
                                          backgroundColor: 'rgba(2, 6, 23, 0.72)',
                                          color: preview.text,
                                        }}
                                      >
                                        {preview.heroLabel}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1.3fr)_120px]">
                                    <div className="min-w-0">
                                      <div
                                        className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                                        style={{ color: preview.muted }}
                                      >
                                        {preview.heroLabel}
                                      </div>
                                      <div
                                        className="mt-2 text-xl leading-tight"
                                        style={{ fontFamily: preview.headingFont }}
                                      >
                                        {preview.previewHeading}
                                      </div>
                                      <div
                                        className="mt-2 max-w-sm text-xs leading-5"
                                        style={{
                                          color: preview.muted,
                                          fontFamily: preview.bodyFont,
                                        }}
                                      >
                                        {preview.previewBody}
                                      </div>
                                      <div className="mt-4 flex flex-wrap gap-2">
                                        {badgeValues.slice(0, 4).map((badgeValue) => (
                                          <span
                                            key={`${artifact.id}-${badgeValue}`}
                                            className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                                            style={{
                                              borderColor: `${preview.accent}55`,
                                              backgroundColor: preview.surface,
                                              color: preview.text,
                                            }}
                                          >
                                            {badgeValue}
                                          </span>
                                        ))}
                                      </div>
                                      <div
                                        className="mt-4 inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
                                        style={{
                                          backgroundColor: preview.accent,
                                          color: '#020617',
                                          fontFamily: preview.bodyFont,
                                        }}
                                      >
                                        {preview.previewCta}
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <div
                                        className="rounded-2xl border p-3"
                                        style={{
                                          borderColor: `${preview.accentStrong}55`,
                                          backgroundColor: preview.surface,
                                        }}
                                      >
                                        <div
                                          className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                                          style={{ color: preview.muted }}
                                        >
                                          Estructura
                                        </div>
                                        <div
                                          className="mt-2 text-sm leading-5"
                                          style={{ fontFamily: preview.headingFont }}
                                        >
                                          {preview.layoutLabel}
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div
                                          className="rounded-xl border px-3 py-4"
                                          style={{
                                            borderColor: `${preview.accent}44`,
                                            backgroundColor: preview.surface,
                                          }}
                                        >
                                          <div
                                            className="h-2 rounded-full"
                                            style={{ backgroundColor: preview.accent }}
                                          />
                                          <div
                                            className="mt-3 h-2 rounded-full"
                                            style={{ backgroundColor: `${preview.text}33` }}
                                          />
                                          <div
                                            className="mt-2 h-2 w-4/5 rounded-full"
                                            style={{ backgroundColor: `${preview.text}22` }}
                                          />
                                        </div>
                                        <div
                                          className="rounded-xl border px-3 py-4"
                                          style={{
                                            borderColor: `${preview.accentStrong}44`,
                                            backgroundColor: preview.surface,
                                          }}
                                        >
                                          <div
                                            className="h-8 rounded-lg"
                                            style={{ backgroundColor: `${preview.accentStrong}33` }}
                                          />
                                          <div
                                            className="mt-2 h-2 rounded-full"
                                            style={{ backgroundColor: `${preview.text}33` }}
                                          />
                                          <div
                                            className="mt-2 h-2 w-3/4 rounded-full"
                                            style={{ backgroundColor: `${preview.text}22` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-3 text-sm text-slate-100">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                  Estilo / estructura
                                </div>
                                <div className="mt-2 leading-6">
                                  {getVisualStyleLabel(artifact.visualStyle) ||
                                    'Sin estilo visual'}{' '}
                                  ·{' '}
                                  {getLayoutVariantLabel(artifact.layoutVariant) ||
                                    'Sin estructura'}
                                </div>
                                <div className="mt-1 text-xs leading-5 text-slate-400">
                                  Apertura principal:{' '}
                                  {getHeroStyleLabel(artifact.heroStyle) ||
                                    'Sin apertura principal'}
                                </div>
                              </div>
                              <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-3 text-sm text-slate-100">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                  Llamados a la acción
                                </div>
                                <div className="mt-2 leading-6">
                                  {artifact.primaryCta || 'Sin acción principal'}
                                </div>
                                <div className="mt-1 text-xs leading-5 text-slate-400">
                                  {artifact.secondaryCta || 'Sin acción secundaria'}
                                </div>
                              </div>
                              <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-3 text-sm text-slate-100">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                  Tipografías
                                </div>
                                <div className="mt-2 leading-6">
                                  {artifact.typography?.headingFamily || 'Sin tipografía principal'}
                                </div>
                                <div className="mt-1 text-xs leading-5 text-slate-400">
                                  {artifact.typography?.bodyFamily || 'Sin tipografía secundaria'}
                                </div>
                              </div>
                              <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-3 text-sm text-slate-100">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                  Colores
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {visibleColors.length > 0 ? (
                                    visibleColors.map((colorValue) => (
                                      <span
                                        key={`${artifact.id}-${colorValue}`}
                                        title={colorValue}
                                        className="h-6 w-6 rounded-full border border-white/10"
                                        style={{ backgroundColor: colorValue }}
                                      />
                                    ))
                                  ) : (
                                    <span className="text-xs leading-5 text-slate-400">
                                      Sin paleta registrada
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 text-xs leading-5 text-slate-400">
                              {artifact.tags && artifact.tags.length > 0
                                ? `Etiquetas: ${artifact.tags.join(', ')}`
                                : 'Sin etiquetas registradas'}
                            </div>
                            <div className="mt-2 text-xs leading-5 text-slate-400">
                              {artifact.preview?.status === 'generated'
                                ? 'Vista previa real disponible'
                                : artifact.preview?.status === 'failed'
                                  ? `Vista previa real no disponible: ${artifact.preview.errorMessage || 'la captura falló'}`
                                  : artifact.preview?.status === 'unavailable'
                                    ? 'Vista previa real no disponible para este artefacto'
                                    : 'Vista previa sintética generada a partir de los datos del artefacto'}
                            </div>
                            <div className="mt-2 text-xs leading-5 text-slate-500">
                              {artifact.localPath || 'Sin ruta local asociada'}
                            </div>
                          </article>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Última instrucción del planificador
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-100">
                      {plannerInstruction}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Último resultado del ejecutor
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-100">
                  {executorResult}
                </div>
              </div>
              {hasLastExecutorSnapshot ? (
                <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Último estado útil del ejecutor
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Subtarea
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {lastExecutorSnapshot?.currentSubtask ||
                          lastExecutorSnapshot?.currentStep ||
                          'No disponible'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Accion
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {lastExecutorSnapshot?.currentAction || 'No disponible'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Comando
                      </div>
                      <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
                        {lastExecutorSnapshot?.currentCommand || 'No disponible'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Ruta objetivo
                      </div>
                      <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
                        {lastExecutorSnapshot?.currentTargetPath || 'No disponible'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Archivos creados o tocados
                      </div>
                      <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
                        {[
                          ...(lastExecutorSnapshot?.createdPaths || []),
                          ...(lastExecutorSnapshot?.touchedPaths || []),
                        ]
                          .filter((value, index, array) => array.indexOf(value) === index)
                          .slice(0, 10)
                          .join('\n') || 'No disponible'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Tipo de fallo
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {lastExecutorSnapshot?.failureType || 'Sin clasificar'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 md:col-span-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Salida parcial
                      </div>
                      <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
                        {lastExecutorSnapshot?.stderr ||
                          lastExecutorSnapshot?.stdout ||
                          'No disponible'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Estado del ejecutor
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-100">
                  {executorRequestStateLabel}
                </div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Paso actual
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-100">
                  {visibleCurrentStepLabel}
                </div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                <div className="text-lg font-semibold text-white">
                  Estado del flujo
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Modo
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-100">
                      {flowModeLabel}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Etapa actual
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-100">
                      {flowStageLabel}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Aprobación pendiente
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-100">
                      {flowApprovalPendingLabel}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Origen de aprobación
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-100">
                      {flowApprovalSourceLabel}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                <div className="text-lg font-semibold text-white">
                  Última corrida
                </div>
                <div className="mt-4 grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  <div className="min-w-0 rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Objetivo
                    </div>
                    <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
                      {lastRunSummary.objective}
                    </div>
                  </div>
                  <div className="min-w-0 rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Instrucción
                    </div>
                    <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
                      {lastRunSummary.instruction}
                    </div>
                  </div>
                  <div className="min-w-0 rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Resultado
                    </div>
                    <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
                      {lastRunSummary.result}
                    </div>
                  </div>
                  <div className="min-w-0 rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Contexto
                    </div>
                    <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
                      {lastRunSummary.context}
                    </div>
                  </div>
                  <div className="min-w-0 rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Espacio de trabajo
                    </div>
                    <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
                      {lastRunSummary.workspacePath}
                    </div>
                  </div>
                  <div className="min-w-0 rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Aprobación
                    </div>
                    <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
                      {lastRunSummary.approval}
                    </div>
                  </div>
                  <div className="min-w-0 rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Estado final
                    </div>
                    <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
                      {lastRunSummary.finalStatus}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Estado
                  </div>
                  <div className="mt-3">
                    <span className="inline-flex w-fit rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                      {sessionStatus}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Política del proyecto
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-100">
                    {projectPolicyAllowed
                      ? 'Permitido para este proyecto'
                      : 'Todavía no hay una aprobación persistente'}
                  </div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Plataforma
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-100">
                    {platform}
                  </div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Conexión local
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-100">
                    {runtimeStatus.connection}
                  </div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Plataforma
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-100">
                    {runtimeStatus.platform}
                  </div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Electron
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-100">
                    {runtimeStatus.electron}
                  </div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Node
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-100">
                    {runtimeStatus.node}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {isFlowConsoleOpen ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/72 px-4 py-4 backdrop-blur-sm sm:px-6">
            <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
                <div>
                  <div className="text-lg font-semibold text-white">
                    Consola del flujo
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    Seguimiento en vivo del planificador, el orquestador, el puente local y Codex.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFlowConsoleVisibility({ open: false, pinned: false })
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Cerrar
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-5 sm:p-6">
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-white">
                      Barra de ejecución
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {flowExecutionFinished
                        ? `Etapa actual: ${flowExecutionHeaderLabel}`
                        : `Etapa activa: ${flowExecutionHeaderLabel}`}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-5">
                    {flowExecutionStages.map((stage, index) => {
                      const stageState = flowExecutionStageStates[index]

                      return (
                        <div
                          key={stage}
                          className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                            stageState === 'active'
                              ? 'border-sky-300/40 bg-sky-300/15 text-sky-100'
                              : stageState === 'completed'
                                ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
                                : stageState === 'not-required'
                                  ? 'border-white/10 bg-white/[0.03] text-slate-300'
                                  : 'border-white/8 bg-slate-950/50 text-slate-300'
                          }`}
                        >
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                            {stage}
                          </div>
                          <div className="mt-2 text-xs leading-5">
                            {stageState === 'active'
                              ? 'Activa'
                              : stageState === 'completed'
                                ? 'Completada'
                                : stageState === 'not-required'
                                  ? 'No requerido'
                                  : 'En espera'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-white">
                      Resumen compacto de la corrida
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Prueba integral
                    </div>
                  </div>
                  {latestExecutionRunSummary ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          id de corrida / escenario
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-100">
                          {latestExecutionRunSummary.latestRequestId}
                        </div>
                        <div className="mt-2">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getExecutionRunScenarioTone(
                              latestExecutionRunSummary.scenarioLabel,
                            )}`}
                          >
                            {latestExecutionRunSummary.scenarioLabel}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          objetivo / estado
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-100">
                          {latestExecutionRunSummary.objectiveSummary}
                        </div>
                        <div className="mt-2 text-xs leading-5 text-slate-400">
                          {getExecutionRunStatusLabel(latestExecutionRunSummary.status)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Reintentos / fallos repetidos
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-100">
                          {latestExecutionRunSummary.recoveries} /{' '}
                          {latestExecutionRunSummary.repeatedFailureCount || 0}
                        </div>
                        <div className="mt-2 text-xs leading-5 text-slate-400">
                          {getTechnicalDiagnosticLabel(
                            latestExecutionRunSummary.latestRecoveryMode,
                            'Sin recuperación aplicada',
                          )}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          progreso / rutas
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-100">
                          {latestExecutionRunSummary.hasMaterialProgress
                            ? 'Material real detectado'
                            : 'Sin progreso material'}
                        </div>
                        <div className="mt-2 text-xs leading-5 text-slate-400">
                          {mergeUniqueStringValues(
                            latestExecutionRunSummary.createdPaths,
                            latestExecutionRunSummary.touchedPaths,
                            6,
                          ).join(', ') || 'Sin archivos registrados'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                      La consola todavía no tiene una corrida ejecutada para resumir.
                    </div>
                  )}
                </div>
                <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
                  <div
                    ref={flowActivityContainerRef}
                    className="min-h-0 overflow-auto rounded-2xl border border-white/8 bg-white/5 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-lg font-semibold text-white">
                        Actividad en vivo
                      </div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Últimos 6 eventos
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {liveActivityEvents.map((event, index) => (
                        <div
                          key={`modal-live-${sessionEvents.length - index}-${event}`}
                          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                            index === 0
                              ? 'border-sky-300/30 bg-sky-300/10 shadow-[0_0_0_1px_rgba(125,211,252,0.08)]'
                              : 'border-white/8 bg-slate-950/50'
                          }`}
                        >
                          <span className="inline-flex min-w-12 justify-center rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100">
                            {index === 0 ? 'Ahora' : `Hace ${index}`}
                          </span>
                          <span className="text-sm leading-6 text-slate-100">
                            {event}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    ref={flowConversationContainerRef}
                    className="min-h-0 overflow-auto rounded-2xl border border-white/8 bg-white/5 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-lg font-semibold text-white">
                        Conversación interna del sistema
                      </div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Flujo técnico completo
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {flowMessages.length === 0 ? (
                        <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                          Todavía no hay mensajes internos registrados en esta sesión.
                        </div>
                      ) : (
                        flowMessages.map((message, index) => (
                          <div
                            key={`modal-${message.id}-${index}`}
                            className={`rounded-xl border px-4 py-4 ${
                              message.id === latestFlowMessage?.id
                                ? 'border-sky-300/30 bg-sky-300/10 shadow-[0_0_0_1px_rgba(125,211,252,0.08)]'
                                : 'border-white/8 bg-slate-950/50'
                            }`}
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3">
                                <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100">
                                  {message.source}
                                </span>
                                <div className="text-sm font-medium text-white">
                                  {message.title}
                                </div>
                              </div>
                              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                {message.status || 'info'}
                              </span>
                            </div>
                            <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-100">
                              {message.content}
                            </div>
                            {message.raw ? (
                              <pre className="mt-3 max-h-56 overflow-auto rounded-xl border border-white/8 bg-slate-950/80 px-4 py-3 text-xs leading-5 text-slate-300">
                                {message.raw}
                              </pre>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div
                  ref={flowTimelineContainerRef}
                  className="mt-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-white">
                      Línea de tiempo de la sesión
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Historial completo
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {sessionEvents.map((event, index) => (
                      <div
                        key={`modal-timeline-${index + 1}-${event}`}
                        className={`flex items-start gap-4 rounded-xl border px-4 py-3 ${
                          index === sessionEvents.length - 1
                            ? 'border-sky-300/30 bg-sky-300/10 shadow-[0_0_0_1px_rgba(125,211,252,0.08)]'
                            : 'border-white/8 bg-slate-950/50'
                        }`}
                      >
                        <span className="mt-2 h-2.5 w-2.5 flex-none rounded-full bg-sky-300" />
                        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-sm text-slate-100">{event}</span>
                          <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                            {`Evento ${String(index + 1).padStart(2, '0')}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {decisionPending && visiblePendingInstruction ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 px-4 py-6 backdrop-blur-sm sm:px-6">
            <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-amber-400/20 bg-slate-950/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <div className="border-b border-white/10 px-5 py-5 sm:px-6">
                <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-amber-200">
                    Aprobación requerida
                </div>
                <h2 className="mt-4 text-xl font-semibold text-white sm:text-2xl">
                  Hace falta tu decisión para esta tarea
                </h2>
                <div className="mt-4 rounded-2xl border border-sky-300/15 bg-sky-300/8 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">
                    Pregunta del Cerebro
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-100">
                    {approvalMessage || DEFAULT_APPROVAL_MESSAGE}
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="space-y-5">
                  {visibleApprovalOptions.length > 0 ? (
                    <section className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Opciones sugeridas
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            Elegí la alternativa que mejor represente tu decisión.
                          </p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                          {visibleApprovalOptions.length} opciones
                        </div>
                      </div>
                      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                        {visibleApprovalOptions.map((option) => (
                          <label
                            key={option.key}
                            className={`flex cursor-pointer gap-3 rounded-2xl border px-4 py-3 transition ${
                              approvalSelectedOption === option.key
                                ? 'border-sky-300/40 bg-sky-300/10 shadow-[0_8px_24px_rgba(56,189,248,0.12)]'
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            }`}
                          >
                            <input
                              type="radio"
                              name="approval-option"
                              value={option.key}
                              checked={approvalSelectedOption === option.key}
                              onChange={(event) =>
                                setApprovalSelectedOption(event.target.value)
                              }
                              className="mt-1 h-4 w-4 flex-none border-white/20 bg-slate-950 text-sky-300"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-white">
                                {option.label}
                              </div>
                              {option.description ? (
                                <div className="mt-1 text-xs leading-5 text-slate-400">
                                  {option.description}
                                </div>
                              ) : null}
                            </div>
                          </label>
                        ))}
                      </div>
                    </section>
                  ) : null}
                  {activeApprovalRequest?.allowFreeAnswer ? (
                    <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Respuesta libre
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {approvalResponseRequiresOption &&
                            activeApprovalInteractionMode === 'mixed'
                              ? 'Podés complementar la opción elegida con contexto o escribir una respuesta propia.'
                              : approvalResponseRequiresOption
                                ? 'Si lo necesitás, agregá una aclaración breve además de la opción.'
                                : 'Respondé con el criterio o la definición que querés reenviar al Cerebro.'}
                          </p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                          Opcional
                        </div>
                      </div>
                      <textarea
                        value={approvalFreeAnswer}
                        onChange={(event) => setApprovalFreeAnswer(event.target.value)}
                        placeholder="Escribí acá la decisión, el criterio o la aclaración que querés reenviar al Cerebro."
                        className="min-h-[140px] w-full resize-y rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40 focus:bg-slate-900"
                      />
                    </section>
                  ) : null}
                  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {approvalSource === 'executor'
                            ? 'Ejecución pendiente'
                            : 'Instrucción pendiente'}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-100">
                          {visiblePendingInstruction}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
              <div className="border-t border-white/10 bg-slate-950/95 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={handleApproveOnce}
                    disabled={!canSendRichApprovalResponse}
                    className="rounded-xl border border-amber-200/20 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {activeApprovalInteractionMode === 'binary'
                      ? 'Aprobar una vez'
                      : 'Enviar respuesta al Cerebro'}
                  </button>
                  {activeApprovalInteractionMode === 'binary' ? (
                    <>
                      <button
                        type="button"
                        onClick={handleRejectApproval}
                        className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-medium text-rose-50 transition hover:bg-rose-300/15"
                      >
                        Rechazar
                      </button>
                      {canPersistCurrentApprovalRule ? (
                        <button
                          type="button"
                          onClick={handleAllowForProject}
                          className="rounded-xl border border-amber-300/30 bg-amber-200/10 px-4 py-3 text-sm font-medium text-amber-50 transition hover:bg-amber-200/15"
                        >
                          Permitir siempre para este proyecto
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRejectApproval}
                      className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-medium text-rose-50 transition hover:bg-rose-300/15"
                    >
                      Cancelar y devolver rechazo al Cerebro
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  ) : (
    <main
      ref={appRootRef}
      className={joinClasses(
        'w-full bg-transparent text-slate-100',
        experienceMode === 'guided'
          ? 'h-screen overflow-hidden'
          : 'min-h-screen',
      )}
    >
      <div
        className={joinClasses(
          'mx-auto flex w-full max-w-[1600px] flex-col px-4 py-6 sm:px-6 lg:px-8',
          experienceMode === 'guided'
            ? 'h-full overflow-hidden'
            : 'min-h-screen',
        )}
      >
        <div className="mb-3 rounded-3xl border border-white/10 bg-slate-950/50 px-4 py-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:px-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Experiencia principal
              </div>
              <div className="mt-1 text-base font-semibold text-white">
                {experienceMode === 'guided'
                  ? 'Flujo guiado paso a paso'
                  : 'Panel avanzado'}
              </div>
              <p className="mt-1 text-xs leading-4 text-slate-400">
                {experienceMode === 'guided'
                  ? 'La app te lleva por un recorrido compacto, con foco en completar un paso y seguir.'
                  : 'La vista avanzada conserva el tablero reorganizado para inspecci\u00f3n y diagn\u00f3stico.'}
              </p>
            </div>
            <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => setExperienceMode('guided')}
                className={joinClasses(
                  'rounded-xl px-4 py-2 text-sm font-medium transition',
                  experienceMode === 'guided'
                    ? 'bg-sky-300/15 text-sky-100'
                    : 'text-slate-300 hover:bg-white/5',
                )}
              >
                Flujo guiado
              </button>
              <button
                type="button"
                onClick={() => setExperienceMode('advanced')}
                className={joinClasses(
                  'rounded-xl px-4 py-2 text-sm font-medium transition',
                  experienceMode === 'advanced'
                    ? 'bg-sky-300/15 text-sky-100'
                    : 'text-slate-300 hover:bg-white/5',
                )}
              >
                Panel avanzado
              </button>
            </div>
          </div>
        </div>

        {experienceMode === 'guided' ? (
          <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_240px]">
            <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:p-4">
              <div className="flex flex-col gap-2 border-b border-white/8 pb-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/80">
                      Paso {activeWizardStepIndex + 1} de {GUIDED_WIZARD_STEPS.length}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white sm:text-xl">
                      {activeWizardStepConfig.label}
                    </div>
                    <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-400">
                      {activeWizardStepConfig.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-medium text-emerald-100">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/80">
                        Planificador
                      </span>
                      <span>{plannerBadge}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[11px] font-medium text-amber-100">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-amber-200/80">
                        Ejecutor
                      </span>
                      <span>{executorRequestStateLabel}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-200">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                        Reuse
                      </span>
                      <span>{activeReuseModeLabel}</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-7">
                  {GUIDED_WIZARD_STEPS.map((step, index) => {
                    const isActive = step.key === activeWizardStep
                    const isCompleted = index < activeWizardStepIndex

                    return (
                      <button
                        key={step.key}
                        type="button"
                        onClick={() => setActiveWizardStep(step.key)}
                        className={joinClasses(
                          'rounded-xl border px-2 py-1.5 text-left transition',
                          isActive
                            ? 'border-sky-300/35 bg-sky-300/12 text-white'
                            : isCompleted
                              ? 'border-emerald-300/25 bg-emerald-300/8 text-emerald-100'
                              : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]',
                        )}
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="mt-0.5 text-xs font-medium leading-4 sm:text-sm">
                          {step.label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-3 min-h-0 flex-1 overflow-auto pr-1">
                {activeWizardStep === 'goal' ? (
                  <div className="grid h-full gap-4">
                    <div className="flex h-full min-h-[360px] flex-col rounded-3xl border border-white/8 bg-white/[0.03] p-4 sm:p-5">
                      <label
                        htmlFor="guided-goal-input"
                        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                      >
                        Objetivo actual
                      </label>
                      <textarea
                        id="guided-goal-input"
                        value={goalInput}
                        onChange={(event) => setGoalInput(event.target.value)}
                        rows={8}
                        className="mt-3 min-h-[220px] w-full flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                        placeholder="Escribí qué querés que la app resuelva."
                      />
                      <div className="mt-3 text-sm leading-6 text-slate-400">
                        El objetivo es la entrada principal del flujo. Si está claro,
                        el resto del recorrido se vuelve mucho más corto.
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeWizardStep === 'context' ? (
                  <div className="grid h-full gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                      <label
                        htmlFor="guided-context-input"
                        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                      >
                        Contexto adicional
                      </label>
                      <textarea
                        id="guided-context-input"
                        ref={executionContextInputRef}
                        value={executionContextInput}
                        onChange={(event) => setExecutionContextInput(event.target.value)}
                        rows={10}
                        className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                        placeholder="Sumá restricciones, referencias, alcance o contexto operativo."
                      />
                    </article>
                    <div className="space-y-4">
                      <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Participación del usuario
                        </div>
                        <div className="mt-4 grid gap-2">
                          <button
                            type="button"
                            onClick={() => setUserParticipationMode('user-will-contribute')}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                              userParticipationMode === 'user-will-contribute'
                                ? 'border-sky-300/40 bg-sky-300/15 text-sky-100'
                                : 'border-white/10 bg-slate-950/50 text-slate-200 hover:bg-white/10'
                            }`}
                          >
                            Sí, voy a aportar
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserParticipationMode('brain-decides-missing')}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                              userParticipationMode === 'brain-decides-missing'
                                ? 'border-emerald-300/40 bg-emerald-300/15 text-emerald-100'
                                : 'border-white/10 bg-slate-950/50 text-slate-200 hover:bg-white/10'
                            }`}
                          >
                            No, decidí vos
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserParticipationMode(DEFAULT_USER_PARTICIPATION_MODE)}
                            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/10"
                          >
                            Sin definir
                          </button>
                        </div>
                        <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                          {userParticipationSummary}
                        </div>
                      </article>
                      <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Espacio de trabajo
                        </div>
                        <textarea
                          id="guided-workspace-path"
                          value={workspacePath}
                          onChange={(event) => setWorkspacePath(event.target.value)}
                          rows={3}
                          className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                        />
                        <div className="mt-3 text-sm text-slate-400">
                          {workspaceStatusLabel}
                        </div>
                      </article>
                    </div>
                  </div>
                ) : null}

                {activeWizardStep === 'brain' ? (
                  <div className="grid h-full gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Modo / criterio
                      </div>
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        {BRAIN_COST_MODE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setBrainCostMode(option.value)}
                            className={`rounded-2xl border px-4 py-4 text-left transition ${
                              brainCostMode === option.value
                                ? 'border-sky-300/40 bg-sky-300/15 text-sky-100'
                                : 'border-white/10 bg-slate-950/50 text-slate-200 hover:bg-white/10'
                            }`}
                          >
                            <div className="text-sm font-medium">{option.label}</div>
                            <div className="mt-1 text-xs leading-5 text-slate-400">
                              {option.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </article>
                    <div className="space-y-4">
                      <MetricCard
                        label="Modo activo"
                        value={getBrainCostModeLabel(brainCostMode)}
                        detail={activeBrainRoutingMode}
                        tone="sky"
                      />
                      <MetricCard
                        label="Proveedor"
                        value={`${activeBrainSelectedProvider} -> ${activeBrainResolvedProvider}`}
                        detail={`Confianza: ${activeBrainRoutingConfidence}`}
                      />
                      <MetricCard
                        label="Naturaleza"
                        value={activeBrainProblemNature}
                        detail={activeBrainRoutingReason}
                      />
                    </div>
                  </div>
                ) : null}

                {activeWizardStep === 'memory' ? (
                  <div className="grid h-full gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-4">
                      <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                        <label
                          htmlFor="guided-reuse-mode"
                          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          Modo reusable
                        </label>
                        <select
                          id="guided-reuse-mode"
                          value={manualReuseMode}
                          onChange={(event) =>
                            setManualReuseMode(event.target.value as ManualReuseMode)
                          }
                          className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-sky-300/40"
                        >
                          <option value="auto">Búsqueda automática</option>
                          <option value="none">No reutilizar</option>
                          <option value="inspiration-only">Usar solo inspiración</option>
                          <option value="reuse-style">Reutilizar estilo</option>
                          <option value="reuse-structure">Reutilizar estructura</option>
                          <option value="reuse-style-and-structure">
                            Reutilizar estilo y estructura
                          </option>
                        </select>
                        <div className="mt-4 text-sm leading-6 text-slate-300">
                          {manualReusablePreferencePayload
                            ? manualReusablePreferencePayload.artifactId
                              ? `El planificador va a priorizar ${manualReuseModeLabel.toLocaleLowerCase()} desde ${manualReusablePreferencePayload.artifactId}.`
                              : 'La corrida va a seguir sin reutilización por decisión manual.'
                            : 'Si no elegís nada, la app sigue con búsqueda automática.'}
                        </div>
                      </article>

                      <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Artefactos sugeridos
                            </div>
                            <div className="mt-2 text-sm text-slate-400">
                              Elegí uno si querés orientar el plan. Si no, seguí igual.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExperienceMode('advanced')}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                          >
                            Ver panel avanzado
                          </button>
                        </div>
                        <div className="mt-4 grid gap-3 lg:grid-cols-3">
                          {isLoadingReusableArtifacts ? (
                            <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm text-slate-300 lg:col-span-3">
                              Cargando artefactos reutilizables...
                            </div>
                          ) : reusableArtifactError ? (
                            <div className="rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-4 text-sm text-red-100 lg:col-span-3">
                              {reusableArtifactError}
                            </div>
                          ) : reusableWizardArtifacts.length === 0 ? (
                            <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm text-slate-300 lg:col-span-3">
                              No hay artefactos listos para sugerir en esta vista compacta.
                            </div>
                          ) : (
                            reusableWizardArtifacts.map((artifact) => {
                              const preview = buildReusableArtifactPreviewModel(artifact)
                              const isSelected = selectedReusableArtifact?.id === artifact.id

                              return (
                                <article
                                  key={artifact.id}
                                  data-reusable-artifact-card={artifact.id}
                                  className={joinClasses(
                                    'rounded-2xl border p-4',
                                    isSelected
                                      ? 'border-sky-300/30 bg-sky-300/10'
                                      : 'border-white/8 bg-slate-950/50',
                                  )}
                                >
                                  <div
                                    data-reusable-artifact-preview={artifact.id}
                                    className="rounded-2xl border border-white/10 p-4"
                                    style={{
                                      background: preview.background,
                                      color: preview.text,
                                    }}
                                  >
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.24em]">
                                      {preview.heroLabel}
                                    </div>
                                    <div className="mt-2 text-lg font-semibold">
                                      {artifact.sectorLabel || artifact.sector || artifact.id}
                                    </div>
                                    <div className="mt-2 text-xs leading-5">
                                      {preview.previewBody}
                                    </div>
                                  </div>
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      data-reusable-artifact-select={artifact.id}
                                      onClick={() => {
                                        setSelectedReusableArtifact(artifact)
                                        setManualReuseMode((currentValue) =>
                                          currentValue === 'auto'
                                            ? 'reuse-style-and-structure'
                                            : currentValue,
                                        )
                                      }}
                                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                                    >
                                      {isSelected ? 'Seleccionado' : 'Usar este artefacto'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDetailReusableArtifact(artifact)}
                                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                                    >
                                      Ver detalle
                                    </button>
                                  </div>
                                </article>
                              )
                            })
                          )}
                        </div>
                      </article>
                    </div>
                    <div className="space-y-4">
                      <MetricCard
                        label="Selección actual"
                        value={manualReuseModeLabel}
                        detail={selectedReusableArtifactSummary}
                        tone={manualReuseMode === 'auto' ? 'default' : 'sky'}
                      />
                      <MetricCard
                        label="Memoria reutilizable"
                        value={`${activeReuseModeLabel} / ${activeReuseFoundCount} coincidencia(s)`}
                        detail={activeReuseDetailLabel}
                      />
                    </div>
                  </div>
                ) : null}

                {activeWizardStep === 'plan' ? (
                  <div className="grid h-full gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-4">
                      <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {plannerIsReviewOnly
                                ? plannerReviewStatusLabel
                                : 'Plan generado'}
                            </div>
                            <div className="mt-2 text-sm text-slate-400">
                              {plannerReviewHelperText}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleWizardGeneratePlan}
                            disabled={isPlanning}
                            className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                          >
                            {isPlanning ? 'Generando...' : 'Generar plan'}
                          </button>
                        </div>
                        <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-slate-100">
                          {hasWizardPlan
                            ? plannerInstruction
                            : 'Todavía no generaste un plan en esta corrida.'}
                        </div>
                      </article>
                      <div className="grid gap-3 lg:grid-cols-2">
                        <MetricCard
                          label="Ruta planificada"
                          value={activeExecutionModeLabel}
                          detail={activePlannerStrategyLabel}
                          tone="sky"
                        />
                        <MetricCard
                          label="MEMORIA externa"
                          value={activeContextHubLabel}
                          detail={activeContextHubUiDetail}
                          tone={activeContextHubStatus?.available ? 'emerald' : 'amber'}
                        />
                        <MetricCard
                          label="Motivo resumido"
                          value={plannerExecutionMetadata.reason || 'No disponible'}
                        />
                        <MetricCard
                          label="Siguiente acción"
                          value={getNextExpectedActionLabel(
                            plannerExecutionMetadata.nextExpectedAction,
                          )}
                          detail={
                            plannerExecutionMetadata.nextExpectedAction || 'No disponible'
                          }
                        />
                        <MetricCard
                          label="Memoria reusable aplicada"
                          value={activeReuseModeLabel}
                          detail={activeReuseArtifactSummary}
                        />
                      </div>
                      {activeProductArchitecture ? (
                        <ProductArchitectureCard
                          architecture={activeProductArchitecture}
                          compact
                          reviewOnly={plannerIsReviewOnly}
                          onPrepareSafeFirstDelivery={
                            plannerIsReviewOnly
                              ? handlePrepareSafeFirstDeliveryPlan
                              : null
                          }
                        />
                      ) : null}
                      {shouldShowProjectContinuity ? (
                        <ProjectContinuityCenterCard
                          nextActionPlan={activeNextActionPlan}
                          implementationRoadmap={activeImplementationRoadmap}
                          phaseExpansionPlan={activePhaseExpansionPlan}
                          projectPhaseExecutionPlan={activeProjectPhaseExecutionPlan}
                          localProjectManifest={activeLocalProjectManifest}
                          expansionOptions={activeExpansionOptions}
                          moduleExpansionPlan={activeModuleExpansionPlan}
                          continuationActionPlan={activeContinuationActionPlan}
                          projectContinuationState={activeProjectContinuationState}
                          compact
                          busy={isPlanning || isExecutingTask}
                          onPreparePhase={handlePrepareProjectPhase}
                          onMaterializePhase={handleMaterializeProjectPhase}
                          onPrepareModuleExpansion={handlePrepareModuleExpansion}
                          onMaterializeModuleExpansion={handleMaterializeModuleExpansion}
                          onPrepareContinuationAction={handlePrepareContinuationAction}
                          onMaterializeContinuationAction={
                            handleMaterializeContinuationAction
                          }
                        />
                      ) : null}
                      {shouldShowProjectBlueprint && activeProjectBlueprint ? (
                        <ProjectBlueprintCard
                          blueprint={activeProjectBlueprint}
                          questionPolicy={activeQuestionPolicy}
                          compact
                        />
                      ) : null}
                      {shouldShowImplementationRoadmap &&
                      activeImplementationRoadmap ? (
                        <ImplementationRoadmapCard
                          roadmap={activeImplementationRoadmap}
                          compact
                        />
                      ) : null}
                      {shouldShowLocalProjectManifest && activeLocalProjectManifest ? (
                        <LocalProjectManifestCard
                          manifest={activeLocalProjectManifest}
                          compact
                          onPreparePhase={handlePrepareProjectPhase}
                        />
                      ) : null}
                      {shouldShowProjectPhaseExecutionPlan &&
                      activeProjectPhaseExecutionPlan ? (
                        <ProjectPhaseExecutionPlanCard
                          plan={activeProjectPhaseExecutionPlan}
                          compact
                          onMaterializePhase={handleMaterializeProjectPhase}
                        />
                      ) : null}
                      {shouldShowNextActionPlan && activeNextActionPlan ? (
                        <NextActionPlanCard plan={activeNextActionPlan} />
                      ) : null}
                      {shouldShowValidationPlan && activeValidationPlan ? (
                        <ValidationPlanCard
                          plan={activeValidationPlan}
                          compact
                        />
                      ) : null}
                      {shouldShowPhaseExpansionPlan && activePhaseExpansionPlan ? (
                        <PhaseExpansionPlanCard
                          plan={activePhaseExpansionPlan}
                          compact
                        />
                      ) : null}
                      {activeSafeFirstDeliveryPlan ? (
                        <SafeFirstDeliveryPlanCard
                          plan={activeSafeFirstDeliveryPlan}
                          compact
                          reviewOnly={plannerIsReviewOnly}
                          onPrepareMaterialization={
                            plannerIsReviewOnly
                              ? handlePrepareSafeMaterializationPlan
                              : null
                          }
                        />
                      ) : null}
                      {shouldShowScalableDeliveryPlan && activeScalableDeliveryPlan ? (
                        <ScalableDeliveryPlanCard
                          plan={activeScalableDeliveryPlan}
                          compact
                          reviewOnly={plannerIsReviewOnly}
                          nextExpectedAction={
                            plannerExecutionMetadata.nextExpectedAction
                          }
                          onPrepareMaterialization={
                            plannerIsReviewOnly
                              ? normalizeOptionalString(
                                    activeScalableDeliveryPlan.deliveryLevel,
                                  ).toLocaleLowerCase() === 'fullstack-local'
                                ? handlePrepareFullstackLocalMaterializationPlan
                                : handlePrepareFrontendProjectMaterializationPlan
                              : null
                          }
                        />
                      ) : null}
                    </div>
                    <div className="space-y-4">
                      <MetricCard
                        label="decisionKey"
                        value={activeDecisionKeyLabel}
                      />
                      <MetricCard
                        label="Tareas previstas"
                        value={
                          effectivePlannerExecutionMetadata.tasks.length > 0
                            ? `${effectivePlannerExecutionMetadata.tasks.length} paso(s)`
                            : 'Sin tareas estructuradas'
                        }
                        detail={
                          effectivePlannerExecutionMetadata.tasks[0]?.title ||
                          effectivePlannerExecutionMetadata.tasks[0]?.operation ||
                          'No disponible'
                        }
                      />
                    </div>
                  </div>
                ) : null}

                {activeWizardStep === 'execution' ? (
                  <div className="grid h-full gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-4">
                        <MetricCard
                          label="Estado"
                          value={executorRequestStateLabel}
                          detail={activeOperationalE2eStatusLabel}
                          tone="amber"
                        />
                        <MetricCard
                          label="Etapa"
                          value={flowStageLabel}
                          detail={flowModeLabel}
                        />
                        <MetricCard
                          label="Paso actual"
                          value={visibleCurrentStepLabel}
                        />
                        <MetricCard
                          label={contextualExecutorModeCardLabel}
                          value={contextualExecutorModeLabel}
                          detail={contextualExecutorModeDetail}
                        />
                      </div>

                      {decisionPending ? (
                        <article className="rounded-3xl border border-amber-300/25 bg-amber-300/10 p-5">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                            Bloqueo por aprobación
                          </div>
                          <div className="mt-3 text-sm leading-6 text-amber-50">
                            Hay una decisión humana pendiente. El modal de aprobación
                            ya quedó abierto para resolverla sin perder el flujo.
                          </div>
                        </article>
                      ) : null}

                      <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Resultado del ejecutor
                        </div>
                        <div className="mt-4 whitespace-pre-wrap break-words rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-slate-100">
                          {executorResult}
                        </div>
                      </article>
                    </div>
                    <div className="space-y-4">
                      <MetricCard
                        label="Conexión local"
                        value={contextualConnectionLabel}
                        detail={contextualConnectionDetail}
                        tone="emerald"
                      />
                      <MetricCard
                        label={contextualRuntimeCardLabel}
                        value={contextualRuntimeLabel}
                        detail={contextualRuntimeDetail}
                      />
                      {fastRouteDetected ? (
                        <>
                          <MetricCard
                            label="Codex"
                            value="No requerido"
                            detail="La resolución se cerró por ruta rápida local."
                          />
                          <MetricCard
                            label="Bridge"
                            value="No usado"
                            detail="No hizo falta puente para esta ejecución."
                          />
                        </>
                      ) : null}
                      <MetricCard
                        label="Resultado listo"
                        value={wizardCanShowResult ? 'Sí' : 'Todavía no'}
                        detail={
                          wizardCanShowResult
                            ? 'Ya podés pasar al resultado.'
                            : 'Esperá a que cierre la ejecución.'
                        }
                      />
                    </div>
                  </div>
                ) : null}

                {activeWizardStep === 'result' ? (
                  <div className="grid h-full gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-4">
                      {resultIsSafeFirstDeliveryMaterialization ? (
                        <ResultSectionCard
                          title="Primera entrega segura generada"
                          description="Resumen corto de la materialización segura para revisar rápido qué se creó, cómo abrirlo y cuáles son sus límites."
                        >
                          <ResultKeyValueGrid
                            items={[
                              {
                                label: 'Carpeta creada',
                                value: resultMaterializationFolderLabel,
                              },
                              {
                                label: 'Motor usado',
                                value: resultMaterializationEngineLabel,
                                detail: resultMaterializationBridgeDetail,
                              },
                              {
                                label: 'Codex / bridge',
                                value:
                                  latestMaterializationLayer === 'local-deterministic' ||
                                  fastRouteDetected
                                    ? 'No requeridos'
                                    : 'No disponible',
                              },
                              {
                                label: 'Operaciones',
                                value: resultMaterializationOperationsLabel,
                              },
                              {
                                label: 'Validaciones',
                                value: resultMaterializationValidationsLabel,
                              },
                              {
                                label: 'Cómo probar',
                                value:
                                  resultMaterializationIndexPathLabel !== 'No disponible'
                                    ? `Abrir ${resultMaterializationIndexPathLabel}`
                                    : 'Abrir el index.html generado',
                              },
                            ]}
                          />
                          <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div className="space-y-2">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Archivos generados
                              </div>
                              <div className="grid gap-2">
                                {resultMaterializationFileLabels.length > 0 ? (
                                  resultMaterializationFileLabels.map((fileLabel) => (
                                    <div
                                      key={`safe-delivery-file-${fileLabel}`}
                                      className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
                                    >
                                      {fileLabel}
                                    </div>
                                  ))
                                ) : (
                                  <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                                    No hay archivos reportados para resumir.
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Límites del mock
                              </div>
                              <div className="grid gap-2">
                                {resultMaterializationLimits.map((limitLabel) => (
                                  <div
                                    key={`safe-delivery-limit-${limitLabel}`}
                                    className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
                                  >
                                    {limitLabel}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 space-y-2">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Próximo paso sugerido
                            </div>
                            <div className="grid gap-2">
                              {resultMaterializationSuggestedNextSteps.map((stepLabel) => (
                                <div
                                  key={`safe-delivery-next-step-${stepLabel}`}
                                  className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
                                >
                                  {stepLabel}
                                </div>
                              ))}
                            </div>
                          </div>
                        </ResultSectionCard>
                      ) : null}
                      <ResultSectionCard
                        title={resultIsSafeFirstDeliveryMaterialization ? 'Cierre técnico' : 'Cierre'}
                        description={
                          resultIsSafeFirstDeliveryMaterialization
                            ? 'Detalle humano y técnico del cierre, por si necesitás inspeccionar la corrida completa.'
                            : 'Lectura humana del resultado y estado final de la corrida.'
                        }
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <ResultStatusBadge
                              label={resultStatusPresentation.label}
                              tone={resultStatusPresentation.tone}
                            />
                            <div className="text-sm leading-6 text-slate-300">
                              {resultStatusPresentation.detail}
                            </div>
                          </div>
                          {shouldShowVisibleFinalTextResponse ? (
                            <button
                              type="button"
                              onClick={() => setIsFinalResponseOpen(true)}
                              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                            >
                              Ver resultado completo
                            </button>
                          ) : null}
                        </div>
                        <div className="mt-4 whitespace-pre-wrap break-words rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-slate-100">
                          {resultHumanText}
                        </div>
                        <div className="mt-4">
                          <ResultKeyValueGrid
                            items={[
                              {
                                label: 'Resumen corto',
                                value: resultHumanSummary,
                              },
                              {
                                label: 'Último requestId',
                                value:
                                  latestExecutionRunSummary?.latestRequestId ||
                                  'Sin corrida registrada',
                              },
                              {
                                label: 'Escenario',
                                value:
                                  latestExecutionRunSummary?.scenarioLabel ||
                                  activeOperationalE2eScenarioLabel,
                              },
                              {
                                label: 'Workspace',
                                value: currentWorkspaceSummary,
                              },
                              {
                                label: 'Modo de ejecución',
                                value: fastRouteDetected
                                  ? 'Ruta rápida local'
                                  : activeExecutionModeLabel,
                                detail: fastRouteDetected
                                  ? 'Codex: No requerido · Bridge: No usado'
                                  : activePlannerStrategyLabel,
                              },
                              {
                                label: 'Materialización',
                                value: latestMaterializationLayer || 'No disponible',
                                detail:
                                  latestMaterializationPlanSource ||
                                  latestMaterializationStrategy ||
                                  'Sin fuente reportada',
                              },
                            ]}
                          />
                        </div>
                      </ResultSectionCard>

                      <ResultSectionCard
                        title="Archivos"
                        description="Resumen de carpeta principal, archivos creados, archivos tocados y alcance activo."
                      >
                        <ResultKeyValueGrid
                          items={[
                            {
                              label: 'Carpeta principal',
                              value: resultPrimaryAffectedPathLabel || 'No disponible',
                            },
                            {
                              label: 'Target actual',
                              value: resultCurrentTargetPathLabel || 'No disponible',
                            },
                            {
                              label: 'Paths creados',
                              value:
                                resultCreatedPaths.length > 0
                                  ? `${resultCreatedPaths.length} ruta(s)`
                                  : 'Sin paths creados',
                            },
                            {
                              label: 'Paths tocados',
                              value:
                                resultTouchedPaths.length > 0
                                  ? `${resultTouchedPaths.length} ruta(s)`
                                  : 'Sin paths tocados',
                            },
                          ]}
                        />
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              createdPaths
                            </div>
                            <div className="grid gap-2">
                              {resultCreatedPaths.length > 0 ? (
                                resultCreatedPaths.map((artifactPath) => (
                                  <div
                                    key={`created-${artifactPath}`}
                                    className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
                                  >
                                    {artifactPath}
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                                  No se reportaron rutas creadas.
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              touchedPaths
                            </div>
                            <div className="grid gap-2">
                              {resultTouchedPaths.length > 0 ? (
                                resultTouchedPaths.map((artifactPath) => (
                                  <div
                                    key={`touched-${artifactPath}`}
                                    className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
                                  >
                                    {artifactPath}
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                                  No se reportaron rutas tocadas.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </ResultSectionCard>

                      <ResultSectionCard
                        title="Validaciones"
                        description="Chequeos reportados por la ejecución para confirmar la salida material."
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <ResultStatusBadge
                            label={
                              latestValidationResults.length > 0
                                ? `${latestValidationOkCount}/${latestValidationResults.length} OK`
                                : 'Sin validaciones'
                            }
                            tone={
                              latestValidationResults.length > 0 &&
                              latestValidationOkCount === latestValidationResults.length
                                ? 'emerald'
                                : latestValidationResults.length > 0
                                  ? 'amber'
                                  : 'default'
                            }
                          />
                          <div className="text-sm leading-6 text-slate-300">
                            {resultValidationSummaryText}
                          </div>
                        </div>
                        <div className="mt-4 grid gap-2">
                          {resultValidationItems.length > 0 ? (
                            resultValidationItems.map((item) => (
                              <div
                                key={item.key}
                                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-medium leading-6 text-slate-100">
                                    {item.label}
                                  </div>
                                  <div className="text-xs leading-5 text-slate-400">
                                    {item.detail || 'Validación reportada'}
                                  </div>
                                </div>
                                <ResultStatusBadge
                                  label={item.ok ? 'OK' : 'Fallo'}
                                  tone={item.ok ? 'emerald' : 'rose'}
                                />
                              </div>
                            ))
                          ) : (
                            <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                              No hay validaciones disponibles para mostrar.
                            </div>
                          )}
                        </div>
                      </ResultSectionCard>

                      <ResultSectionCard
                        title="Reusable y scope"
                        description="Aplicación real de memoria reusable y restricciones respetadas por la corrida."
                      >
                        <ResultKeyValueGrid
                          items={[
                            {
                              label: 'Reusable',
                              value: latestAppliedReuseModeLabel,
                              detail:
                                !latestReuseApplied
                                  ? 'No se aplicó memoria reusable en esta corrida.'
                                  : resultReusableSummaryLabel,
                            },
                            {
                              label: resultReusableSupportLabel,
                              value: resultReusableSupportValue,
                            },
                            {
                              label: 'Scope',
                              value: resultScopeSummaryLabel,
                              detail:
                                latestContinuationAnchor || 'Sin continuation anchor reportado',
                            },
                            {
                              label: 'Archivos bloqueados respetados',
                              value:
                                resultBlockedPaths.length > 0
                                  ? resultScopeRespected
                                    ? 'Sí'
                                    : 'Revisar'
                                  : 'No aplica',
                              detail:
                                resultBlockedPaths.length > 0
                                  ? resultScopeRespected
                                    ? 'Los paths bloqueados no aparecen en touchedPaths ni createdPaths.'
                                    : 'Hay paths bloqueados que requieren revisión técnica.'
                                  : 'La corrida no definió archivos bloqueados.',
                            },
                          ]}
                        />
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              allowedTargetPaths
                            </div>
                            <div className="grid gap-2">
                              {resultAllowedPaths.length > 0 ? (
                                resultAllowedPaths.map((pathValue) => (
                                  <div
                                    key={`allowed-${pathValue}`}
                                    className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
                                  >
                                    {pathValue}
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                                  No se informaron archivos permitidos explícitamente.
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              blockedTargetPaths
                            </div>
                            <div className="grid gap-2">
                              {resultBlockedPaths.length > 0 ? (
                                resultBlockedPaths.map((pathValue) => (
                                  <div
                                    key={`blocked-${pathValue}`}
                                    className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
                                  >
                                    {pathValue}
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                                  No se informaron paths bloqueados.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {latestScopeSuccessCriteria.length > 0 ? (
                          <div className="mt-4 space-y-2">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              successCriteria
                            </div>
                            <div className="grid gap-2">
                              {latestScopeSuccessCriteria.map((criterion) => (
                                <div
                                  key={criterion}
                                  className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
                                >
                                  {criterion}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </ResultSectionCard>
                    </div>
                    <div className="space-y-4">
                      <MetricCard
                        label="Estado final"
                        value={resultStatusPresentation.label}
                        detail={resultStatusPresentation.detail}
                        tone={resultStatusPresentation.tone}
                      />
                      <MetricCard
                        label="Modo de ejecución"
                        value={fastRouteDetected ? 'Ruta rápida local' : activeExecutionModeLabel}
                        detail={
                          fastRouteDetected
                            ? 'Codex: No requerido · Bridge: No usado'
                            : activePlannerStrategyLabel
                        }
                      />
                      <MetricCard
                        label="Capas"
                        value={latestReasoningLayer || 'No disponible'}
                        detail={[
                          latestMaterializationLayer
                            ? `Materialización: ${latestMaterializationLayer}`
                            : '',
                          latestMaterializationPlanSource
                            ? `Fuente: ${latestMaterializationPlanSource}`
                            : '',
                          latestBrainStrategy ? `Plantilla: ${latestBrainStrategy}` : '',
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Sin capas reportadas'}
                      />
                      <MetricCard
                        label="Bridge"
                        value={resultBridgeLabel}
                        detail={
                          fastRouteDetected
                            ? 'La salida se resolvió completamente en local.'
                            : activeExecutorRuntimeDetail
                        }
                      />
                      <MetricCard
                        label="Codex"
                        value={resultCodexLabel}
                        detail={
                          fastRouteDetected
                            ? 'No participó en esta corrida.'
                            : latestBridgeModeValue.toLocaleLowerCase() === 'codex'
                              ? 'El bridge ejecutó la corrida real con Codex.'
                              : 'No hay evidencia de participación obligatoria de Codex.'
                        }
                      />
                      <MetricCard
                        label="Validaciones"
                        value={
                          latestValidationResults.length > 0
                            ? `${latestValidationOkCount}/${latestValidationResults.length} OK`
                            : 'Sin validaciones reportadas'
                        }
                        detail={
                          latestValidationResults.length > 0
                            ? resultValidationSummaryText
                            : 'No hubo validaciones estructuradas para resumir.'
                        }
                      />
                      <MetricCard
                        label="Reusable"
                        value={latestAppliedReuseModeLabel}
                        detail={resultReusableSummaryLabel}
                      />
                      <ResultSectionCard
                        title="Acciones sugeridas"
                        description="Siguientes pasos rápidos para revisar o iterar esta salida."
                      >
                        <div className="grid gap-2">
                          {resultSuggestedActions.map((action) => (
                            <div
                              key={action.title}
                              className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
                            >
                              <div className="text-sm font-medium leading-6 text-slate-100">
                                {action.title}
                              </div>
                              <div className="text-xs leading-5 text-slate-400">
                                {action.detail}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 grid gap-2">
                          <button
                            type="button"
                            onClick={handleWizardStartOver}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                          >
                            Volver al objetivo
                          </button>
                          <button
                            type="button"
                            onClick={() => setExperienceMode('advanced')}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                          >
                            Abrir panel avanzado
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsFlowConsoleOpen(true)}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                          >
                            Abrir consola técnica
                          </button>
                        </div>
                      </ResultSectionCard>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm leading-6 text-slate-400">
                  {activeWizardStep === 'plan'
                    ? plannerIsReviewOnly
                      ? 'Este plan quedó en revisión y no ejecuta cambios todavía.'
                      : 'Cuando el plan te cierre, ejecutalo desde acá.'
                    : activeWizardStep === 'execution'
                      ? 'Si aparece una aprobación, el flujo queda claramente bloqueado hasta resolverla.'
                      : activeWizardStep === 'result'
                        ? 'Podés volver al objetivo o abrir el panel avanzado para seguir mirando detalle.'
                        : 'Completá este paso y seguí al próximo.'}
                </div>
                <div className="flex flex-wrap gap-3">
                  {activeWizardStep !== 'goal' ? (
                    <button
                      type="button"
                      onClick={handleWizardBack}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                    >
                      Atrás
                    </button>
                  ) : null}

                  {activeWizardStep === 'goal' ||
                  activeWizardStep === 'context' ||
                  activeWizardStep === 'brain' ? (
                    <button
                      type="button"
                      onClick={handleWizardNext}
                      disabled={activeWizardStep === 'goal' && !goalInput.trim()}
                      className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                    >
                      Siguiente
                    </button>
                  ) : null}

                  {activeWizardStep === 'memory' ? (
                    <button
                      type="button"
                      onClick={handleWizardGeneratePlan}
                      disabled={isPlanning || !goalInput.trim()}
                      className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                    >
                      {isPlanning ? 'Generando...' : 'Generar plan'}
                    </button>
                  ) : null}

                  {activeWizardStep === 'plan' ? (
                    <>
                      <button
                        type="button"
                        onClick={handleWizardGeneratePlan}
                        disabled={isPlanning || !goalInput.trim()}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
                      >
                        {isPlanning ? 'Generando...' : 'Regenerar plan'}
                      </button>
                      {plannerIsReviewOnly ? (
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200">
                          {plannerReviewActionLabel}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleWizardExecute}
                          disabled={!canExecuteInstruction || isExecutingTask}
                          className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                        >
                          {isExecutingTask ? 'Ejecutando...' : 'Ejecutar'}
                        </button>
                      )}
                    </>
                  ) : null}

                  {activeWizardStep === 'execution' ? (
                    <button
                      type="button"
                      onClick={handleWizardNext}
                      disabled={!wizardCanShowResult}
                      className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                    >
                      Ver resultado
                    </button>
                  ) : null}
                </div>
              </div>
            </section>

            <aside className="min-h-0 space-y-3 overflow-auto pr-1">
              <article className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Resumen del flujo
                </div>
                <div className="mt-3 space-y-2">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Objetivo
                    </div>
                    <div className="mt-1 text-sm font-medium leading-5 text-slate-100">
                      {normalizedGoalInput}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Criterio
                    </div>
                    <div className="mt-1 text-sm font-medium leading-5 text-slate-100">
                      {getBrainCostModeLabel(brainCostMode)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Reuse
                    </div>
                    <div className="mt-1 text-sm font-medium leading-5 text-slate-100">
                      {manualReuseModeLabel}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-sky-300/20 bg-sky-300/8 px-3 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">
                      Estado
                    </div>
                    <div className="mt-1 text-sm font-medium leading-5 text-sky-50">
                      {sessionStatus}
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Herramientas aparte
                </div>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => setFlowConsoleVisibility({ open: true, pinned: true })}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    Abrir consola técnica
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRunSummary(latestExecutionRunSummary)}
                    disabled={!latestExecutionRunSummary}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
                  >
                    Ver última corrida
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSessionMemory}
                    disabled={isRunning}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
                  >
                    Reiniciar memoria de la sesión
                  </button>
                </div>
              </article>
            </aside>
          </div>
        ) : null}

        {experienceMode === 'advanced' ? (
          <>
        <header className="rounded-3xl border border-white/10 bg-slate-950/50 px-5 py-6 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-sky-200">
                ORQUESTADOR DE IA LOCAL
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Centro de control
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                La app ahora se recorre por secciones, con un dashboard inicial
                más limpio y detalles largos llevados a modales cuando realmente
                hacen falta.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Estado general"
                value={sessionStatus}
                detail={visibleCurrentStepLabel}
                tone="sky"
              />
              <MetricCard
                label="Planificador"
                value={plannerBadge}
                detail={`${activeExecutionModeLabel} / ${activePlannerStrategyLabel}`}
                tone="emerald"
              />
              <MetricCard
                label="Ejecutor"
                value={executorBadge}
                detail={executorRequestStateLabel}
                tone="amber"
              />
              <MetricCard
                label="Aprobaciones"
                value={humanApprovalsBadge}
                detail={activeApprovalStatusLabel}
              />
            </div>
          </div>
        </header>

        <div className="mt-6 grid flex-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside
            id="app-sidebar-nav"
            className="h-fit rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] xl:sticky xl:top-6"
          >
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Vista activa
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {activeSectionConfig.label}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {activeSectionConfig.description}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {APP_NAV_SECTIONS.map((section) => {
                const badge =
                  section.key === 'aprobaciones'
                    ? decisionPending
                      ? 'Pendiente'
                      : recentApprovalRecords.length > 0
                        ? String(recentApprovalRecords.length)
                        : undefined
                    : section.key === 'memoria'
                      ? manualReuseMode !== 'auto'
                        ? manualReuseModeLabel
                        : activeReuseFoundCount > 0
                          ? String(activeReuseFoundCount)
                          : undefined
                      : section.key === 'corridas'
                        ? executionRunSummaries.length > 0
                          ? String(executionRunSummaries.length)
                          : undefined
                        : section.key === 'consola'
                          ? String(liveActivityEvents.length)
                          : undefined

                return (
                  <div key={section.key} data-nav-section={section.key}>
                    <SidebarSectionButton
                      active={activeSection === section.key}
                      label={section.label}
                      description={section.description}
                      badge={badge}
                      onClick={() => setActiveSection(section.key)}
                    />
                  </div>
                )
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Acciones rápidas
              </div>
              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={handleGenerateNextStep}
                  disabled={isPlanning}
                  className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                >
                  {isPlanning ? 'Generando...' : 'Generar siguiente paso'}
                </button>
                {plannerIsReviewOnly ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200">
                    {plannerReviewStatusLabel}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={handleExecuteCurrentInstruction}
                  hidden={plannerIsReviewOnly}
                  disabled={!canExecuteInstruction || isExecutingTask}
                  className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                >
                  {isExecutingTask ? 'Ejecutando...' : 'Ejecutar instrucción'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFlowConsoleVisibility({ open: true, pinned: true })
                    setActiveSection('consola')
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Abrir consola técnica
                </button>
              </div>
            </div>
          </aside>

          <section
            id="main-section-panel"
            data-active-section={activeSection}
            className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:p-6"
          >
            {activeSection === 'inicio' ? (
              <div className="space-y-6">
                <SectionHeader
                  eyebrow="Inicio"
                  title="Resumen operativo"
                  description="Un punto de entrada corto para entender el estado general, la última corrida y las acciones que mueven el flujo."
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={handleRunMockCycle}
                        disabled={decisionPending || isRunning}
                        className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                      >
                        {isRunning ? 'Ejecutando...' : 'Correr ciclo de prueba'}
                      </button>
                      {plannerIsReviewOnly ? (
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200">
                          {plannerReviewActionLabel}
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleTestLocalConnection}
                        disabled={isTestingConnection}
                        className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                      >
                        {isTestingConnection ? 'Probando...' : 'Probar conexión local'}
                      </button>
                      <button
                        type="button"
                        onClick={handleAutoFlow}
                        disabled={
                          isAutoFlowRunning ||
                          isPlanning ||
                          isExecutingTask ||
                          decisionPending
                        }
                        className="rounded-xl border border-violet-300/20 bg-violet-300/10 px-4 py-3 text-sm font-medium text-violet-100 transition hover:bg-violet-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                      >
                        {isAutoFlowRunning
                          ? 'Procesando flujo...'
                          : 'Iniciar flujo automático'}
                      </button>
                    </>
                  }
                />

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Objetivo actual"
                    value={normalizedGoalInput}
                    detail={currentExecutionContextSummary}
                    tone="sky"
                  />
                  <MetricCard
                    label="Ruta activa"
                    value={`${activeExecutionModeLabel} / ${activePlannerStrategyLabel}`}
                    detail={activeDecisionKeyLabel}
                    tone="emerald"
                  />
                  <MetricCard
                    label="Memoria reutilizable"
                    value={`${activeReuseModeLabel} / ${activeReuseFoundCount} coincidencia(s)`}
                    detail={activeReuseDetailLabel}
                  />
                  <MetricCard
                    label="Flujo"
                    value={flowStageLabel}
                    detail={`${flowModeLabel} · ${flowApprovalPendingLabel}`}
                    tone={decisionPending ? 'amber' : 'default'}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                  <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-white">
                          Última corrida
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          Lectura compacta del último cierre operativo.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSection('corridas')}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                      >
                        Ver corridas
                      </button>
                    </div>
                    {latestExecutionRunSummary ? (
                      <div className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-300/8 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getExecutionRunScenarioTone(
                              latestExecutionRunSummary.scenarioLabel,
                            )}`}
                          >
                            {latestExecutionRunSummary.scenarioLabel}
                          </span>
                          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                            {getExecutionRunStatusLabel(latestExecutionRunSummary.status)}
                          </span>
                        </div>
                        <div className="mt-3 text-base font-medium text-white">
                          {latestExecutionRunSummary.objectiveSummary}
                        </div>
                        <div className="mt-3 text-sm leading-6 text-slate-200">
                          {latestExecutionRunSummary.instructionSummary}
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <MetricCard
                            label="Aprobaciones"
                            value={String(latestExecutionRunSummary.approvalsOpened)}
                          />
                          <MetricCard
                            label="Recuperaciones"
                            value={String(latestExecutionRunSummary.recoveries)}
                          />
                          <MetricCard
                            label="Progreso material"
                            value={
                              latestExecutionRunSummary.hasMaterialProgress ? 'Sí' : 'No'
                            }
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedRunSummary(latestExecutionRunSummary)}
                          className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                        >
                          Ver detalle de la corrida
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                        Todavía no hay corridas ejecutadas para resumir.
                      </div>
                    )}
                  </article>

                  <div className="space-y-4">
                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-lg font-semibold text-white">
                        Acciones rápidas
                      </div>
                      <div className="mt-4 grid gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveSection('objetivo')}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-white/10"
                        >
                          Revisar objetivo y contexto
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSection('planificacion')}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-white/10"
                        >
                          Inspeccionar la planificación
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSection('memoria')}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-white/10"
                        >
                          Revisar memoria reutilizable
                        </button>
                        <button
                          type="button"
                          onClick={handleResetSessionMemory}
                          disabled={isRunning}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
                        >
                          Reiniciar memoria de la sesión
                        </button>
                      </div>
                    </article>

                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-lg font-semibold text-white">
                        Respuesta final visible
                      </div>
                      <div className="mt-3 text-sm leading-6 text-slate-300">
                        {shouldShowVisibleFinalTextResponse
                          ? summarizeInlineText(visibleFinalTextResponse, 180)
                          : 'Todavía no hay una respuesta final visible para mostrar acá.'}
                      </div>
                      {shouldShowVisibleFinalTextResponse ? (
                        <button
                          type="button"
                          onClick={() => setIsFinalResponseOpen(true)}
                          className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                        >
                          Abrir respuesta completa
                        </button>
                      ) : null}
                    </article>
                  </div>
                </div>
              </div>
            ) : null}

            {activeSection === 'objetivo' ? (
              <div className="space-y-6">
                <SectionHeader
                  eyebrow="Objetivo y contexto"
                  title="Definición de trabajo"
                  description="Objetivo, contexto adicional, participación del usuario y criterio del Cerebro en una sola vista consistente."
                  actions={
                    <button
                      type="button"
                      onClick={handleGenerateNextStep}
                      disabled={isPlanning}
                      className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                    >
                      {isPlanning ? 'Generando...' : 'Actualizar planificación'}
                    </button>
                  }
                />

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                  <div className="space-y-4">
                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <label
                        htmlFor="goal-input"
                        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                      >
                        Objetivo actual
                      </label>
                      <textarea
                        id="goal-input"
                        value={goalInput}
                        onChange={(event) => setGoalInput(event.target.value)}
                        rows={5}
                        className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                      />
                    </article>

                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <label
                        htmlFor="execution-context-input"
                        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                      >
                        Contexto adicional
                      </label>
                      <textarea
                        id="execution-context-input"
                        ref={executionContextInputRef}
                        value={executionContextInput}
                        onChange={(event) => setExecutionContextInput(event.target.value)}
                        rows={8}
                        className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                        placeholder="Definiciones, restricciones, notas de alcance o material que el Cerebro deba tener presente."
                      />
                    </article>

                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <label
                        htmlFor="workspace-path"
                        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                      >
                        Espacio de trabajo de destino
                      </label>
                      <textarea
                        id="workspace-path"
                        value={workspacePath}
                        onChange={(event) => setWorkspacePath(event.target.value)}
                        rows={2}
                        className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                      />
                      <div className="mt-3 text-sm text-slate-400">
                        {workspaceStatusLabel}
                      </div>
                    </article>
                  </div>

                  <div className="space-y-4">
                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Participación del usuario
                      </div>
                      <div className="mt-3 grid gap-2">
                        <button
                          type="button"
                          onClick={() => setUserParticipationMode('user-will-contribute')}
                          className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                            userParticipationMode === 'user-will-contribute'
                              ? 'border-sky-300/40 bg-sky-300/15 text-sky-100'
                              : 'border-white/10 bg-slate-950/50 text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          Sí, voy a aportar
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserParticipationMode('brain-decides-missing')}
                          className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                            userParticipationMode === 'brain-decides-missing'
                              ? 'border-emerald-300/40 bg-emerald-300/15 text-emerald-100'
                              : 'border-white/10 bg-slate-950/50 text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          No, decidí vos
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserParticipationMode(DEFAULT_USER_PARTICIPATION_MODE)}
                          className="rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/10"
                        >
                          Sin definir
                        </button>
                      </div>
                      <div className="mt-3 rounded-xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-300">
                        {userParticipationSummary}
                      </div>
                    </article>

                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Modo / criterio del Cerebro
                      </div>
                      <div className="mt-3 grid gap-2">
                        {BRAIN_COST_MODE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setBrainCostMode(option.value)}
                            className={`rounded-xl border px-4 py-3 text-left transition ${
                              brainCostMode === option.value
                                ? 'border-sky-300/40 bg-sky-300/15 text-sky-100'
                                : 'border-white/10 bg-slate-950/50 text-slate-200 hover:bg-white/10'
                            }`}
                          >
                            <div className="text-sm font-medium">{option.label}</div>
                            <div className="mt-1 text-xs leading-5 text-slate-400">
                              {option.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </article>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <MetricCard
                        label="Modo activo"
                        value={getBrainCostModeLabel(brainCostMode)}
                        detail={activeBrainRoutingMode}
                      />
                      <MetricCard
                        label="Naturaleza"
                        value={activeBrainProblemNature}
                        detail={`Confianza: ${activeBrainRoutingConfidence}`}
                      />
                      <MetricCard
                        label="Proveedor"
                        value={`${activeBrainSelectedProvider} -> ${activeBrainResolvedProvider}`}
                        detail={
                          activeBrainFallbackUsed
                            ? `Respaldo hacia ${activeBrainResolvedProvider}`
                            : 'Sin respaldo en la Última decisión'
                        }
                      />
                      <MetricCard
                        label="Motivo resumido"
                        value={activeBrainRoutingReason}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activeSection === 'planificacion' ? (
              <div className="space-y-6">
                <SectionHeader
                  eyebrow="Planificación"
                  title="Ruta y decisión del planificador"
                  description="La instrucción visible, la estrategia y la reutilización se leen juntas para entender por qué la app quiere avanzar por este camino."
                  actions={
                    <>
                      <button
                        id="generate-next-step-button"
                        type="button"
                        onClick={handleGenerateNextStep}
                        disabled={isPlanning}
                        className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                      >
                        {isPlanning ? 'Generando...' : 'Generar siguiente paso'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSection('memoria')}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                      >
                        Revisar memoria reusable
                      </button>
                    </>
                  }
                />

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <MetricCard
                    label="Ruta planificada"
                    value={activeExecutionModeLabel}
                    detail={plannerExecutionMetadata.executionScope || 'Sin alcance definido'}
                    tone="sky"
                  />
                  <MetricCard
                    label="Estrategia"
                    value={activePlannerStrategyLabel}
                    detail={plannerExecutionMetadata.businessSectorLabel || 'Sin rubro declarado'}
                  />
                  <MetricCard
                    label="decisionKey"
                    value={activeDecisionKeyLabel}
                  />
                  <MetricCard
                    label="Memoria reutilizable"
                    value={activeReuseModeLabel}
                    detail={activeReuseDetailLabel}
                    tone={
                      hasAppliedReusableContext
                        ? 'emerald'
                        : activeReuseSuggestionIds.length > 0
                          ? 'sky'
                          : 'default'
                    }
                  />
                        <MetricCard
                          label="Siguiente acción"
                          value={getNextExpectedActionLabel(
                            plannerExecutionMetadata.nextExpectedAction,
                          )}
                          detail={
                            plannerExecutionMetadata.nextExpectedAction || 'No disponible'
                          }
                        />
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                  <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Última instrucción del planificador
                    </div>
                    <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-100">
                      {plannerInstruction}
                    </div>
                    {plannerIsReviewOnly ? (
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-200">
                        {plannerReviewHelperText}
                      </div>
                    ) : null}
                  </article>

                  <div className="space-y-4">
                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Motivo resumido
                      </div>
                      <div className="mt-3 text-sm leading-6 text-slate-100">
                        {plannerExecutionMetadata.reason || 'No disponible'}
                      </div>
                    </article>

                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {activeReuseArtifactsPanelLabel}
                      </div>
                      <div className="mt-3 text-sm leading-6 text-slate-100">
                        {activeReuseArtifactSummary}
                      </div>
                    </article>
                  </div>
                </div>

                {activeProductArchitecture ? (
                  <ProductArchitectureCard
                    architecture={activeProductArchitecture}
                    reviewOnly={plannerIsReviewOnly}
                    onPrepareSafeFirstDelivery={
                      plannerIsReviewOnly ? handlePrepareSafeFirstDeliveryPlan : null
                    }
                  />
                ) : null}
                {activeSafeFirstDeliveryPlan ? (
                  <SafeFirstDeliveryPlanCard
                    plan={activeSafeFirstDeliveryPlan}
                    reviewOnly={plannerIsReviewOnly}
                    onPrepareMaterialization={
                      plannerIsReviewOnly ? handlePrepareSafeMaterializationPlan : null
                    }
                  />
                ) : null}
                {shouldShowProjectContinuity ? (
                  <ProjectContinuityCenterCard
                    nextActionPlan={activeNextActionPlan}
                    implementationRoadmap={activeImplementationRoadmap}
                    phaseExpansionPlan={activePhaseExpansionPlan}
                    projectPhaseExecutionPlan={activeProjectPhaseExecutionPlan}
                    localProjectManifest={activeLocalProjectManifest}
                    expansionOptions={activeExpansionOptions}
                    moduleExpansionPlan={activeModuleExpansionPlan}
                    continuationActionPlan={activeContinuationActionPlan}
                    projectContinuationState={activeProjectContinuationState}
                    busy={isPlanning || isExecutingTask}
                    onPreparePhase={handlePrepareProjectPhase}
                    onMaterializePhase={handleMaterializeProjectPhase}
                    onPrepareModuleExpansion={handlePrepareModuleExpansion}
                    onMaterializeModuleExpansion={handleMaterializeModuleExpansion}
                    onPrepareContinuationAction={handlePrepareContinuationAction}
                    onMaterializeContinuationAction={
                      handleMaterializeContinuationAction
                    }
                  />
                ) : null}
                {shouldShowProjectBlueprint && activeProjectBlueprint ? (
                  <ProjectBlueprintCard
                    blueprint={activeProjectBlueprint}
                    questionPolicy={activeQuestionPolicy}
                  />
                ) : null}
                {shouldShowImplementationRoadmap &&
                activeImplementationRoadmap ? (
                  <ImplementationRoadmapCard roadmap={activeImplementationRoadmap} />
                ) : null}
                {shouldShowLocalProjectManifest && activeLocalProjectManifest ? (
                  <LocalProjectManifestCard
                    manifest={activeLocalProjectManifest}
                    onPreparePhase={handlePrepareProjectPhase}
                  />
                ) : null}
                {shouldShowProjectPhaseExecutionPlan &&
                activeProjectPhaseExecutionPlan ? (
                  <ProjectPhaseExecutionPlanCard
                    plan={activeProjectPhaseExecutionPlan}
                    onMaterializePhase={handleMaterializeProjectPhase}
                  />
                ) : null}
                {shouldShowNextActionPlan && activeNextActionPlan ? (
                  <NextActionPlanCard plan={activeNextActionPlan} />
                ) : null}
                {shouldShowValidationPlan && activeValidationPlan ? (
                  <ValidationPlanCard plan={activeValidationPlan} />
                ) : null}
                {shouldShowPhaseExpansionPlan && activePhaseExpansionPlan ? (
                  <PhaseExpansionPlanCard plan={activePhaseExpansionPlan} />
                ) : null}
                {shouldShowScalableDeliveryPlan && activeScalableDeliveryPlan ? (
                  <ScalableDeliveryPlanCard
                    plan={activeScalableDeliveryPlan}
                    reviewOnly={plannerIsReviewOnly}
                    nextExpectedAction={
                      plannerExecutionMetadata.nextExpectedAction
                    }
                    onPrepareMaterialization={
                      plannerIsReviewOnly
                        ? normalizeOptionalString(
                              activeScalableDeliveryPlan.deliveryLevel,
                            ).toLocaleLowerCase() === 'fullstack-local'
                          ? handlePrepareFullstackLocalMaterializationPlan
                          : handlePrepareFrontendProjectMaterializationPlan
                        : null
                    }
                  />
                ) : null}

                <div className="grid gap-4 xl:grid-cols-2">
                  <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="text-lg font-semibold text-white">
                      Tareas previstas
                    </div>
                    <div className="mt-4 space-y-3">
                      {effectivePlannerExecutionMetadata.tasks.length > 0 ? (
                        effectivePlannerExecutionMetadata.tasks.map((task, index) => (
                          <div
                            key={`planner-task-${task.step || index}-${task.title || task.operation || index}`}
                            className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-3"
                          >
                            <div className="text-sm font-medium text-white">
                              {task.step ? `Paso ${task.step}` : `Paso ${index + 1}`}{' '}
                              {task.title || task.operation || 'Acción sin título'}
                            </div>
                            <div className="mt-2 text-xs leading-5 text-slate-400">
                              {task.targetPath || 'Sin ruta objetivo declarada'}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                          El planner no dejó una lista estructurada de tareas en esta decisión.
                        </div>
                      )}
                    </div>
                  </article>

                  <div className="space-y-4">
                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-lg font-semibold text-white">
                        Dirección creativa
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <MetricCard
                          label="Rubro"
                          value={
                            plannerExecutionMetadata.businessSectorLabel ||
                            plannerExecutionMetadata.businessSector ||
                            'No definido'
                          }
                        />
                        <MetricCard
                          label="Visual"
                          value={
                            plannerExecutionMetadata.creativeDirection?.visualStyle ||
                            'No definido'
                          }
                        />
                        <MetricCard
                          label="Hero"
                          value={
                            plannerExecutionMetadata.creativeDirection?.heroStyle ||
                            'No definido'
                          }
                        />
                        <MetricCard
                          label="Estructura"
                          value={
                            plannerExecutionMetadata.creativeDirection?.layoutVariant ||
                            'No definido'
                          }
                        />
                      </div>
                    </article>

                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-lg font-semibold text-white">
                        Supuestos
                      </div>
                      <div className="mt-4 space-y-2">
                        {effectivePlannerExecutionMetadata.assumptions.length > 0 ? (
                          effectivePlannerExecutionMetadata.assumptions.map(
                            (assumption, index) => (
                              <div
                                key={`planner-assumption-${index + 1}`}
                                className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
                              >
                                {assumption}
                              </div>
                            ),
                          )
                        ) : (
                          <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                            No hay supuestos explícitos registrados.
                          </div>
                        )}
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            ) : null}

            {activeSection === 'ejecucion' ? (
              <div className="space-y-6">
                <SectionHeader
                  eyebrow="Ejecución"
                  title="Acción manual y resultado"
                  description="La instrucción aprobada, el estado del ejecutor y la salida visible quedan separados del resto para que ejecutar sea más simple."
                  actions={
                    <>
                      <button
                        id="execute-current-instruction-button"
                        type="button"
                        onClick={handleExecuteCurrentInstruction}
                        hidden={plannerIsReviewOnly}
                        disabled={!canExecuteInstruction || isExecutingTask}
                        className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                      >
                        {isExecutingTask ? 'Ejecutando...' : 'Ejecutar instrucción actual'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSection('planificacion')}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                      >
                        Volver a la planificación
                      </button>
                    </>
                  }
                />

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Estado del ejecutor"
                    value={executorRequestStateLabel}
                    detail={activeOperationalE2eStatusLabel}
                    tone="amber"
                  />
                  <MetricCard
                    label="Paso actual"
                    value={visibleCurrentStepLabel}
                    detail={flowStageLabel}
                  />
                  <MetricCard
                    label="Modo de ejecución"
                    value={contextualExecutorModeLabel}
                    detail={contextualExecutorModeDetail}
                  />
                  <MetricCard
                    label="Conexión local"
                    value={contextualConnectionLabel}
                    detail={contextualConnectionDetail}
                    tone="emerald"
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                  <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="text-lg font-semibold text-white">
                      Instrucción lista para ejecutar
                    </div>
                    <div className="mt-4 whitespace-pre-wrap break-words rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-slate-100">
                      {plannerInstruction}
                    </div>
                  </article>

                  <div className="space-y-4">
                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-lg font-semibold text-white">
                        Resultado visible
                      </div>
                      <div className="mt-3 text-sm leading-6 text-slate-300">
                        {shouldShowVisibleFinalTextResponse
                          ? summarizeInlineText(visibleFinalTextResponse, 220)
                          : executorResult}
                      </div>
                      {shouldShowVisibleFinalTextResponse ? (
                        <button
                          type="button"
                          onClick={() => setIsFinalResponseOpen(true)}
                          className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                        >
                          Abrir respuesta final
                        </button>
                      ) : null}
                    </article>

                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-lg font-semibold text-white">
                        Último resultado del ejecutor
                      </div>
                      <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                        {executorResult}
                      </div>
                    </article>
                  </div>
                </div>

                {hasLastExecutorSnapshot ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      label="Acción"
                      value={lastExecutorSnapshot?.currentAction || 'No disponible'}
                    />
                    <MetricCard
                      label="Comando"
                      value={lastExecutorSnapshot?.currentCommand || 'No disponible'}
                    />
                    <MetricCard
                      label="Ruta objetivo"
                      value={lastExecutorSnapshot?.currentTargetPath || 'No disponible'}
                    />
                    <MetricCard
                      label="Tipo de fallo"
                      value={lastExecutorSnapshot?.failureType || 'Sin clasificar'}
                    />
                  </div>
                ) : null}

                {latestTouchedArtifacts.length > 0 ? (
                  <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="text-lg font-semibold text-white">
                      Archivos creados o tocados
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {latestTouchedArtifacts.map((artifactPath) => (
                        <div
                          key={artifactPath}
                          className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
                        >
                          {artifactPath}
                        </div>
                      ))}
                    </div>
                  </article>
                ) : null}
              </div>
            ) : null}

            {activeSection === 'aprobaciones' ? (
              <div className="space-y-6">
                <SectionHeader
                  eyebrow="Aprobaciones"
                  title="Intervención humana"
                  description="La aprobación operativa vive en modal. Esta vista resume el estado, la última respuesta humana y el historial corto."
                />

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Estado"
                    value={activeApprovalStatusLabel}
                    detail={flowApprovalSourceLabel}
                    tone={decisionPending ? 'amber' : 'default'}
                  />
                  <MetricCard
                    label="Modalidad"
                    value={activeApprovalInteractionMode}
                    detail={`${visibleApprovalOptions.length} opcion(es) sugerida(s)`}
                  />
                  <MetricCard
                    label="Última respuesta humana"
                    value={latestHumanDecisionSummary}
                  />
                  <MetricCard
                    label="Política del proyecto"
                    value={
                      projectPolicyAllowed
                        ? 'Permitir siempre para este proyecto'
                        : 'Sin regla persistente'
                    }
                  />
                </div>

                <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-lg font-semibold text-white">
                    Approval pendiente
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-200">
                    {decisionPending
                      ? approvalMessage || visiblePendingInstruction || DEFAULT_APPROVAL_MESSAGE
                      : 'No hay una aprobación abierta ahora mismo. Cuando aparezca, se muestra en modal para no cargar la pantalla principal.'}
                  </div>
                </article>

                <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-lg font-semibold text-white">
                    Historial corto
                  </div>
                  <div className="mt-4 space-y-3">
                    {recentApprovalRecords.length > 0 ? (
                      recentApprovalRecords.map((record) => (
                        <div
                          key={`${record.key}-${record.updatedAt || record.status}`}
                          className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm font-medium text-white">
                              {record.key}
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {getResolvedDecisionStatusLabel(record)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm leading-6 text-slate-300">
                            {[
                              normalizeOptionalString(record.selectedOption),
                              normalizeOptionalString(record.freeAnswer),
                              normalizeOptionalString(record.summary),
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'Sin detalle adicional'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                        Todavía no hay approvals o rechazos para mostrar.
                      </div>
                    )}
                  </div>
                </article>
              </div>
            ) : null}

            {activeSection === 'memoria' ? (
              <div className="space-y-6" id="reusable-memory-section">
                <SectionHeader
                  eyebrow="Memoria reutilizable"
                  title="Catálogo, filtros y selección manual"
                  description="La memoria reusable queda ordenada en su propia vista, con preview, filtros y detalle expandido."
                  actions={
                    <button
                      type="button"
                      onClick={() => {
                        void loadReusableArtifacts()
                      }}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                    >
                      Recargar catálogo
                    </button>
                  }
                />

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Selección actual"
                    value={manualReuseModeLabel}
                    detail={selectedReusableArtifactSummary}
                    tone={manualReuseMode === 'auto' ? 'default' : 'sky'}
                  />
                  <MetricCard
                    label="Memoria reutilizable"
                    value={`${activeReuseModeLabel} / ${activeReuseFoundCount} coincidencia(s)`}
                    detail={activeReuseDetailLabel}
                  />
                  <MetricCard
                    label={activeReuseArtifactsPanelLabel}
                    value={activeReuseArtifactSummary}
                  />
                  <MetricCard
                    label="Modo manual"
                    value={activeReuseManualSummary}
                    detail={selectedReusableArtifactTags || 'Sin etiquetas destacadas'}
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                      <div>
                        <label
                          htmlFor="reusable-filter-sector"
                          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          Rubro
                        </label>
                        <input
                          id="reusable-filter-sector"
                          value={reusableArtifactFilters.sector}
                          onChange={(event) =>
                            setReusableArtifactFilters((currentValue) => ({
                              ...currentValue,
                              sector: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                          placeholder="odontología, moda..."
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="reusable-filter-visual-style"
                          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          Estilo visual
                        </label>
                        <input
                          id="reusable-filter-visual-style"
                          value={reusableArtifactFilters.visualStyle}
                          onChange={(event) =>
                            setReusableArtifactFilters((currentValue) => ({
                              ...currentValue,
                              visualStyle: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                          placeholder="claridad, premium..."
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="reusable-filter-layout"
                          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          Estructura
                        </label>
                        <input
                          id="reusable-filter-layout"
                          value={reusableArtifactFilters.layoutVariant}
                          onChange={(event) =>
                            setReusableArtifactFilters((currentValue) => ({
                              ...currentValue,
                              layoutVariant: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                          placeholder="institucional, editorial..."
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="reusable-filter-hero"
                          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          Apertura principal
                        </label>
                        <input
                          id="reusable-filter-hero"
                          value={reusableArtifactFilters.heroStyle}
                          onChange={(event) =>
                            setReusableArtifactFilters((currentValue) => ({
                              ...currentValue,
                              heroStyle: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                          placeholder="informativo, inmersivo..."
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="reusable-filter-tags"
                          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          Tags
                        </label>
                        <input
                          id="reusable-filter-tags"
                          value={reusableArtifactFilters.tags}
                          onChange={(event) =>
                            setReusableArtifactFilters((currentValue) => ({
                              ...currentValue,
                              tags: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                          placeholder="premium, editorial..."
                        />
                      </div>
                    </div>
                  </article>

                  <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <label
                      htmlFor="manual-reuse-mode"
                      className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      Reutilización manual
                    </label>
                    <select
                      id="manual-reuse-mode"
                      value={manualReuseMode}
                      onChange={(event) =>
                        setManualReuseMode(event.target.value as ManualReuseMode)
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-sky-300/40"
                    >
                      <option value="auto">Búsqueda automática</option>
                      <option value="none">No reutilizar</option>
                      <option value="inspiration-only">Usar solo inspiración</option>
                      <option value="reuse-style">Reutilizar estilo</option>
                      <option value="reuse-structure">Reutilizar estructura</option>
                      <option value="reuse-style-and-structure">
                        Reutilizar estilo y estructura
                      </option>
                    </select>
                    <div
                      id="manual-reuse-selection-summary"
                      className="mt-3 text-xs leading-5 text-slate-400"
                    >
                      {manualReusablePreferencePayload
                        ? manualReusablePreferencePayload.artifactId
                          ? `El planificador va a priorizar ${manualReuseModeLabel.toLocaleLowerCase()} desde ${manualReusablePreferencePayload.artifactId}.`
                          : 'El planificador va a ignorar la memoria reutilizable por decisión manual.'
                        : 'Sin selección manual: se mantiene la búsqueda automática.'}
                    </div>
                    <button
                      id="clear-reusable-artifact-selection"
                      type="button"
                      onClick={() => {
                        setSelectedReusableArtifact(null)
                        setManualReuseMode('auto')
                      }}
                      className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                    >
                      Limpiar selección
                    </button>
                  </article>
                </div>

                <div
                  id="reusable-artifact-list"
                  className="grid gap-3 xl:grid-cols-2"
                >
                  {isLoadingReusableArtifacts ? (
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm text-slate-300 xl:col-span-2">
                      Cargando artefactos reutilizables...
                    </div>
                  ) : reusableArtifactError ? (
                    <div className="rounded-xl border border-red-300/20 bg-red-300/10 px-4 py-4 text-sm text-red-100 xl:col-span-2">
                      {reusableArtifactError}
                    </div>
                  ) : reusableArtifacts.length === 0 ? (
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm text-slate-300 xl:col-span-2">
                      No hay artefactos que coincidan con esos filtros.
                    </div>
                  ) : (
                    reusableArtifacts.map((artifact) => {
                      const isSelected = selectedReusableArtifact?.id === artifact.id
                      const preview = buildReusableArtifactPreviewModel(artifact)
                      const realPreviewSrc =
                        artifact.preview?.status === 'generated'
                          ? buildLocalFileUrl(artifact.preview.imagePath)
                          : ''
                      const visibleColors = Object.values(artifact.colors || {}).slice(
                        0,
                        4,
                      )

                      return (
                        <article
                          key={artifact.id}
                          data-reusable-artifact-card={artifact.id}
                          className={`rounded-2xl border px-4 py-4 ${
                            isSelected
                              ? 'border-sky-300/30 bg-sky-300/10'
                              : 'border-white/8 bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white">
                                {artifact.sectorLabel || artifact.sector || artifact.id}
                              </div>
                              <div className="mt-1 text-xs leading-5 text-slate-400">
                                {artifact.id}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                data-reusable-artifact-select={artifact.id}
                                onClick={() => {
                                  setSelectedReusableArtifact(artifact)
                                  setManualReuseMode((currentValue) =>
                                    currentValue === 'auto'
                                      ? 'reuse-style-and-structure'
                                      : currentValue,
                                  )
                                }}
                                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                  isSelected
                                    ? 'border-sky-300/40 bg-sky-300/15 text-sky-100'
                                    : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                                }`}
                              >
                                {isSelected ? 'Seleccionado' : 'Usar este artefacto'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailReusableArtifact(artifact)}
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                              >
                                Ver detalle
                              </button>
                            </div>
                          </div>

                          <div
                            data-reusable-artifact-preview={artifact.id}
                            className="mt-4 overflow-hidden rounded-2xl border border-white/10"
                            style={{
                              background: preview.background,
                              color: preview.text,
                            }}
                          >
                            {realPreviewSrc ? (
                              <img
                                src={realPreviewSrc}
                                alt={`Vista previa real de ${artifact.sectorLabel || artifact.sector || artifact.id}`}
                                className="h-48 w-full object-cover"
                              />
                            ) : (
                              <div className="p-4">
                                <div
                                  className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                                  style={{ color: preview.muted }}
                                >
                                  {preview.heroLabel}
                                </div>
                                <div
                                  className="mt-2 text-xl leading-tight"
                                  style={{ fontFamily: preview.headingFont }}
                                >
                                  {preview.previewHeading}
                                </div>
                                <div
                                  className="mt-2 text-xs leading-5"
                                  style={{ color: preview.muted }}
                                >
                                  {preview.previewBody}
                                </div>
                                <div
                                  className="mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-medium"
                                  style={{
                                    borderColor: `${preview.accent}66`,
                                    color: preview.text,
                                    backgroundColor: preview.surface,
                                  }}
                                >
                                  {preview.previewCta}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {[
                              artifact.sectorLabel || artifact.sector,
                              getVisualStyleLabel(artifact.visualStyle),
                              getLayoutVariantLabel(artifact.layoutVariant),
                              getHeroStyleLabel(artifact.heroStyle),
                            ]
                              .filter(Boolean)
                              .map((badgeValue) => (
                                <span
                                  key={`${artifact.id}-${badgeValue}`}
                                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300"
                                >
                                  {badgeValue}
                                </span>
                              ))}
                          </div>

                          {visibleColors.length > 0 ? (
                            <div className="mt-4 flex items-center gap-2">
                              {visibleColors.map((colorValue, index) => (
                                <span
                                  key={`${artifact.id}-color-${index + 1}`}
                                  className="h-6 w-6 rounded-full border border-white/10"
                                  style={{ backgroundColor: colorValue }}
                                />
                              ))}
                            </div>
                          ) : null}
                        </article>
                      )
                    })
                  )}
                </div>
              </div>
            ) : null}

            {activeSection === 'corridas' ? (
              <div className="space-y-6">
                <SectionHeader
                  eyebrow="Corridas"
                  title="Resumen E2E e historial"
                  description="La lectura de corridas queda separada para comparar estados, errores, recuperaciones y archivos tocados sin pelearse con el resto de la app."
                />

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Corridas visibles"
                    value={String(visibleExecutionRunSummaries.length)}
                    tone="sky"
                  />
                  <MetricCard
                    label="Escenario activo"
                    value={activeOperationalE2eScenarioLabel}
                    detail={activeOperationalE2eStatusLabel}
                  />
                  <MetricCard
                    label="Archivos tocados"
                    value={String(latestTouchedArtifacts.length)}
                    detail={
                      latestTouchedArtifacts.slice(0, 2).join(', ') ||
                      'Sin archivos registrados'
                    }
                  />
                  <MetricCard
                    label="Último requestId"
                    value={
                      latestExecutionRunSummary?.latestRequestId || 'Sin corrida registrada'
                    }
                  />
                </div>

                <div className="grid gap-3 xl:grid-cols-3">
                  {visibleExecutionRunSummaries.length > 0 ? (
                    visibleExecutionRunSummaries.map((summary) => (
                      <article
                        key={summary.runId}
                        className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white">
                              {summary.objectiveSummary}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-slate-400">
                              {summary.updatedAtLabel} · {summary.latestRequestId}
                            </div>
                          </div>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getExecutionRunScenarioTone(
                              summary.scenarioLabel,
                            )}`}
                          >
                            {summary.scenarioLabel}
                          </span>
                        </div>
                        <div className="mt-4 space-y-2 text-sm leading-6 text-slate-200">
                          <div>
                            <span className="text-slate-500">Estado:</span>{' '}
                            {getExecutionRunStatusLabel(summary.status)}
                          </div>
                          <div>
                            <span className="text-slate-500">Recuperaciones:</span>{' '}
                            {summary.recoveries}
                          </div>
                          <div>
                            <span className="text-slate-500">Archivos:</span>{' '}
                            {mergeUniqueStringValues(
                              summary.createdPaths,
                              summary.touchedPaths,
                              6,
                            ).join(', ') || 'Ninguno'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedRunSummary(summary)}
                          className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                        >
                          Ver detalle
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300 xl:col-span-3">
                      Todavía no hay corridas ejecutadas para resumir.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {activeSection === 'consola' ? (
              <div className="space-y-6">
                <SectionHeader
                  eyebrow="Consola técnica"
                  title="Timeline, eventos y conversación interna"
                  description="La consola completa abre en modal. Esta vista deja una lectura resumida y navegable del lado técnico."
                  actions={
                    <button
                      type="button"
                      onClick={() => {
                        setFlowConsoleVisibility({ open: true, pinned: true })
                      }}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                    >
                      Abrir consola completa
                    </button>
                  }
                />

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="Modo" value={flowModeLabel} />
                  <MetricCard label="Etapa" value={flowStageLabel} />
                  <MetricCard label="Aprobación pendiente" value={flowApprovalPendingLabel} />
                  <MetricCard label="Origen" value={flowApprovalSourceLabel} />
                </div>

                <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
                  <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-lg font-semibold text-white">
                        Actividad en vivo
                      </div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Últimos 6 eventos
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {liveActivityEvents.map((event, index) => (
                        <div
                          key={`live-${sessionEvents.length - index}-${event}`}
                          className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
                            index === 0
                              ? 'border-sky-300/30 bg-sky-300/10 text-sky-50'
                              : 'border-white/8 bg-slate-950/50 text-slate-200'
                          }`}
                        >
                          {event}
                        </div>
                      ))}
                    </div>
                  </article>

                  <div className="space-y-4">
                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-lg font-semibold text-white">
                        Conversación interna
                      </div>
                      {latestFlowMessage ? (
                        <div className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-300/8 px-4 py-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100">
                                {latestFlowMessage.source}
                              </span>
                              <div className="text-sm font-medium text-white">
                                {latestFlowMessage.title}
                              </div>
                            </div>
                            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                              {latestFlowMessage.status || 'info'}
                            </span>
                          </div>
                          <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-100">
                            {latestFlowMessage.content}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                          Todavía no hay mensajes internos registrados.
                        </div>
                      )}
                    </article>

                    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-lg font-semibold text-white">
                        Timeline de la sesión
                      </div>
                      <div className="mt-4 space-y-3">
                        {sessionEvents.slice(-8).map((event, index, array) => (
                          <div
                            key={`timeline-${index + 1}-${event}`}
                            className={`flex items-start gap-4 rounded-xl border px-4 py-3 ${
                              index === array.length - 1
                                ? 'border-sky-300/30 bg-sky-300/10'
                                : 'border-white/8 bg-slate-950/50'
                            }`}
                          >
                            <span className="mt-2 h-2.5 w-2.5 flex-none rounded-full bg-sky-300" />
                            <span className="text-sm leading-6 text-slate-100">
                              {event}
                            </span>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>

          </>
        ) : null}

        <DetailDialog
          open={Boolean(selectedRunSummary)}
          title="Detalle de la corrida"
          description="Resumen operativo y técnico de una corrida puntual."
          onClose={() => setSelectedRunSummary(null)}
        >
          {selectedRunSummary ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Escenario"
                  value={selectedRunSummary.scenarioLabel}
                  detail={getExecutionRunStatusLabel(selectedRunSummary.status)}
                />
                <MetricCard
                  label="Aprobaciones"
                  value={String(selectedRunSummary.approvalsOpened)}
                />
                <MetricCard
                  label="Recuperaciones"
                  value={String(selectedRunSummary.recoveries)}
                />
                <MetricCard
                  label="Fallos repetidos"
                  value={String(selectedRunSummary.repeatedFailureCount || 0)}
                />
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <article className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Objetivo
                  </div>
                  <div className="mt-3 text-sm leading-6 text-slate-100">
                    {selectedRunSummary.objectiveSummary}
                  </div>
                </article>
                <article className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Instrucción
                  </div>
                  <div className="mt-3 text-sm leading-6 text-slate-100">
                    {selectedRunSummary.instructionSummary}
                  </div>
                </article>
                <article className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Tipos de fallo
                  </div>
                  <div className="mt-3 text-sm leading-6 text-slate-100">
                    {getTechnicalDiagnosticLabel(
                      selectedRunSummary.finalFailureType,
                      'No falló al cierre',
                    )}{' '}
                    /{' '}
                    {getTechnicalDiagnosticLabel(
                      selectedRunSummary.latestFailureType,
                      'Sin fallo registrado',
                    )}
                  </div>
                </article>
                <article className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Modos bloqueados
                  </div>
                  <div className="mt-3 text-sm leading-6 text-slate-100">
                    {selectedRunSummary.blockedRecoveryModes.length > 0
                      ? selectedRunSummary.blockedRecoveryModes.join(', ')
                      : 'Ninguno'}
                  </div>
                </article>
              </div>
              <article className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Archivos creados / tocados
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-100">
                  {mergeUniqueStringValues(
                    selectedRunSummary.createdPaths,
                    selectedRunSummary.touchedPaths,
                    20,
                  ).join('\n') || 'Ninguno'}
                </div>
              </article>
            </div>
          ) : null}
        </DetailDialog>

        <DetailDialog
          open={Boolean(detailReusableArtifact)}
          title={
            detailReusableArtifact?.sectorLabel ||
            detailReusableArtifact?.sector ||
            'Artefacto reusable'
          }
          description={detailReusableArtifact?.id}
          onClose={() => setDetailReusableArtifact(null)}
          maxWidthClassName="max-w-5xl"
        >
          {detailReusableArtifact ? (
            <div className="space-y-4">
              {(() => {
                const preview = buildReusableArtifactPreviewModel(detailReusableArtifact)
                const realPreviewSrc =
                  detailReusableArtifact.preview?.status === 'generated'
                    ? buildLocalFileUrl(detailReusableArtifact.preview.imagePath)
                    : ''
                const colorEntries = Object.entries(detailReusableArtifact.colors || {})

                return (
                  <>
                    <div
                      className="overflow-hidden rounded-3xl border border-white/10"
                      style={{
                        background: preview.background,
                        color: preview.text,
                      }}
                    >
                      {realPreviewSrc ? (
                        <img
                          src={realPreviewSrc}
                          alt={`Vista previa de ${detailReusableArtifact.sectorLabel || detailReusableArtifact.sector || detailReusableArtifact.id}`}
                          className="h-[360px] w-full object-cover"
                        />
                      ) : (
                        <div className="grid gap-4 p-6 lg:grid-cols-[minmax(0,1.1fr)_260px]">
                          <div className="min-w-0">
                            <div
                              className="text-[11px] font-semibold uppercase tracking-[0.24em]"
                              style={{ color: preview.muted }}
                            >
                              {preview.heroLabel}
                            </div>
                            <div
                              className="mt-3 text-3xl leading-tight"
                              style={{ fontFamily: preview.headingFont }}
                            >
                              {preview.previewHeading}
                            </div>
                            <div
                              className="mt-3 max-w-xl text-sm leading-7"
                              style={{ color: preview.muted }}
                            >
                              {preview.previewBody}
                            </div>
                            <div
                              className="mt-5 inline-flex rounded-full border px-4 py-2 text-sm font-medium"
                              style={{
                                borderColor: `${preview.accent}66`,
                                backgroundColor: preview.surface,
                                color: preview.text,
                              }}
                            >
                              {preview.previewCta}
                            </div>
                          </div>
                          <div
                            className="rounded-3xl border p-4"
                            style={{
                              borderColor: `${preview.accent}33`,
                              backgroundColor: preview.surface,
                            }}
                          >
                            <div className="text-sm font-medium text-white">
                              {preview.layoutLabel}
                            </div>
                            <div className="mt-3 space-y-2 text-sm leading-6">
                              {(detailReusableArtifact.tags || []).slice(0, 6).map((tag) => (
                                <div key={`${detailReusableArtifact.id}-${tag}`}>{tag}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <MetricCard
                            label="Estilo visual"
                            value={getVisualStyleLabel(detailReusableArtifact.visualStyle)}
                          />
                          <MetricCard
                            label="Estructura"
                            value={getLayoutVariantLabel(detailReusableArtifact.layoutVariant)}
                          />
                          <MetricCard
                            label="Hero"
                            value={getHeroStyleLabel(detailReusableArtifact.heroStyle)}
                          />
                          <MetricCard
                            label="CTA principal"
                            value={detailReusableArtifact.primaryCta || 'No definido'}
                          />
                        </div>
                        <article className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Tags
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(detailReusableArtifact.tags || []).length > 0 ? (
                              (detailReusableArtifact.tags || []).map((tag) => (
                                <span
                                  key={`${detailReusableArtifact.id}-tag-${tag}`}
                                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <div className="text-sm text-slate-400">
                                Sin tags registradas.
                              </div>
                            )}
                          </div>
                        </article>
                      </div>

                      <div className="space-y-4">
                        <article className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Paleta
                          </div>
                          <div className="mt-3 grid gap-2">
                            {colorEntries.length > 0 ? (
                              colorEntries.map(([colorKey, colorValue]) => (
                                <div
                                  key={`${detailReusableArtifact.id}-${colorKey}`}
                                  className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2"
                                >
                                  <div className="text-sm text-slate-200">{colorKey}</div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-5 w-5 rounded-full border border-white/10"
                                      style={{ backgroundColor: colorValue }}
                                    />
                                    <span className="text-xs text-slate-400">
                                      {colorValue}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-slate-400">
                                Sin paleta registrada.
                              </div>
                            )}
                          </div>
                        </article>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReusableArtifact(detailReusableArtifact)
                            setManualReuseMode((currentValue) =>
                              currentValue === 'auto'
                                ? 'reuse-style-and-structure'
                                : currentValue,
                            )
                            setDetailReusableArtifact(null)
                          }}
                          className="w-full rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15"
                        >
                          Usar este artefacto
                        </button>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          ) : null}
        </DetailDialog>

        <DetailDialog
          open={isFinalResponseOpen}
          title="Respuesta final visible"
          description="Detalle completo de la respuesta larga generada por la app."
          onClose={() => setIsFinalResponseOpen(false)}
          maxWidthClassName="max-w-3xl"
        >
          <div className="whitespace-pre-wrap break-words rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-slate-100">
            {visibleFinalTextResponse}
          </div>
        </DetailDialog>

        <DetailDialog
          open={isFlowConsoleOpen}
          title="Consola del flujo"
          description="Seguimiento en vivo del planificador, el orquestador, el puente local y Codex."
          onClose={() => {
            setFlowConsoleVisibility({ open: false, pinned: false })
          }}
          maxWidthClassName="max-w-7xl"
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-white">
                  Barra de ejecución
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {flowExecutionFinished
                    ? `Etapa actual: ${flowExecutionHeaderLabel}`
                    : `Etapa activa: ${flowExecutionHeaderLabel}`}
                </div>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-5">
                {flowExecutionStages.map((stage, index) => {
                  const stageState = flowExecutionStageStates[index]

                  return (
                    <div
                      key={stage}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        stageState === 'active'
                          ? 'border-sky-300/40 bg-sky-300/15 text-sky-100'
                          : stageState === 'completed'
                            ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
                            : stageState === 'not-required'
                              ? 'border-white/10 bg-white/[0.03] text-slate-300'
                              : 'border-white/8 bg-slate-950/50 text-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                        {stage}
                      </div>
                      <div className="mt-2 text-xs leading-5">
                        {stageState === 'active'
                          ? 'Activa'
                          : stageState === 'completed'
                            ? 'Completada'
                            : stageState === 'not-required'
                              ? 'No requerido'
                              : 'En espera'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
              <div
                ref={flowActivityContainerRef}
                className="min-h-0 overflow-auto rounded-2xl border border-white/8 bg-white/5 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-white">Actividad en vivo</div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Últimos 6 eventos
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {liveActivityEvents.map((event, index) => (
                    <div
                      key={`modal-live-${sessionEvents.length - index}-${event}`}
                      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                        index === 0
                          ? 'border-sky-300/30 bg-sky-300/10 shadow-[0_0_0_1px_rgba(125,211,252,0.08)]'
                          : 'border-white/8 bg-slate-950/50'
                      }`}
                    >
                      <span className="inline-flex min-w-12 justify-center rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100">
                        {index === 0 ? 'Ahora' : `Hace ${index}`}
                      </span>
                      <span className="text-sm leading-6 text-slate-100">{event}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div
                ref={flowConversationContainerRef}
                className="min-h-0 overflow-auto rounded-2xl border border-white/8 bg-white/5 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-white">
                    Conversación interna del sistema
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Flujo técnico completo
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {flowMessages.length === 0 ? (
                    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                      Todavía no hay mensajes internos registrados en esta sesión.
                    </div>
                  ) : (
                    flowMessages.map((message, index) => (
                      <div
                        key={`modal-${message.id}-${index}`}
                        className={`rounded-xl border px-4 py-4 ${
                          message.id === latestFlowMessage?.id
                            ? 'border-sky-300/30 bg-sky-300/10 shadow-[0_0_0_1px_rgba(125,211,252,0.08)]'
                            : 'border-white/8 bg-slate-950/50'
                        }`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100">
                              {message.source}
                            </span>
                            <div className="text-sm font-medium text-white">
                              {message.title}
                            </div>
                          </div>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            {message.status || 'info'}
                          </span>
                        </div>
                        <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-100">
                          {message.content}
                        </div>
                        {message.raw ? (
                          <pre className="mt-3 max-h-56 overflow-auto rounded-xl border border-white/8 bg-slate-950/80 px-4 py-3 text-xs leading-5 text-slate-300">
                            {message.raw}
                          </pre>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div
              ref={flowTimelineContainerRef}
              className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-white">
                  Línea de tiempo de la sesión
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Historial completo
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {sessionEvents.map((event, index) => (
                  <div
                    key={`modal-timeline-${index + 1}-${event}`}
                    className={`flex items-start gap-4 rounded-xl border px-4 py-3 ${
                      index === sessionEvents.length - 1
                        ? 'border-sky-300/30 bg-sky-300/10 shadow-[0_0_0_1px_rgba(125,211,252,0.08)]'
                        : 'border-white/8 bg-slate-950/50'
                    }`}
                  >
                    <span className="mt-2 h-2.5 w-2.5 flex-none rounded-full bg-sky-300" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-slate-100">{event}</span>
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {`Evento ${String(index + 1).padStart(2, '0')}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DetailDialog>

        <DetailDialog
          open={decisionPending && Boolean(visiblePendingInstruction)}
          title="Aprobación requerida"
          description="Hace falta tu decisión para esta tarea."
          onClose={() => {}}
          maxWidthClassName="max-w-3xl"
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-sky-300/15 bg-sky-300/8 px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">
                Pregunta del Cerebro
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-100">
                {approvalMessage || DEFAULT_APPROVAL_MESSAGE}
              </p>
            </div>
            {visibleApprovalOptions.length > 0 ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Opciones sugeridas
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Elegí la alternativa que mejor represente tu decisión.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                    {visibleApprovalOptions.length} opciones
                  </div>
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {visibleApprovalOptions.map((option) => (
                    <label
                      key={option.key}
                      className={`flex cursor-pointer gap-3 rounded-2xl border px-4 py-3 transition ${
                        approvalSelectedOption === option.key
                          ? 'border-sky-300/40 bg-sky-300/10 shadow-[0_8px_24px_rgba(56,189,248,0.12)]'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="approval-option"
                        value={option.key}
                        checked={approvalSelectedOption === option.key}
                        onChange={(event) =>
                          setApprovalSelectedOption(event.target.value)
                        }
                        className="mt-1 h-4 w-4 flex-none border-white/20 bg-slate-950 text-sky-300"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white">
                          {option.label}
                        </div>
                        {option.description ? (
                          <div className="mt-1 text-xs leading-5 text-slate-400">
                            {option.description}
                          </div>
                        ) : null}
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            ) : null}
            {activeApprovalRequest?.allowFreeAnswer ? (
              <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Respuesta libre
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {approvalResponseRequiresOption &&
                      activeApprovalInteractionMode === 'mixed'
                        ? 'Podés complementar la opción elegida con contexto o escribir una respuesta propia.'
                        : approvalResponseRequiresOption
                          ? 'Si lo necesitás, agregá una aclaración breve además de la opción.'
                          : 'Respondé con el criterio o la definición que querés reenviar al Cerebro.'}
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                    Opcional
                  </div>
                </div>
                <textarea
                  value={approvalFreeAnswer}
                  onChange={(event) => setApprovalFreeAnswer(event.target.value)}
                  placeholder="Escribí acá la decisión, el criterio o la aclaración que querés reenviar al Cerebro."
                  className="min-h-[140px] w-full resize-y rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40 focus:bg-slate-900"
                />
              </section>
            ) : null}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {approvalSource === 'executor'
                  ? 'Ejecución pendiente'
                  : 'Instrucción pendiente'}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-100">
                {visiblePendingInstruction}
              </div>
            </section>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={handleApproveOnce}
                disabled={!canSendRichApprovalResponse}
                className="rounded-xl border border-amber-200/20 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeApprovalInteractionMode === 'binary'
                  ? 'Aprobar una vez'
                  : 'Enviar respuesta al Cerebro'}
              </button>
              {activeApprovalInteractionMode === 'binary' ? (
                <>
                  <button
                    type="button"
                    onClick={handleRejectApproval}
                    className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-medium text-rose-50 transition hover:bg-rose-300/15"
                  >
                    Rechazar
                  </button>
                  {canPersistCurrentApprovalRule ? (
                    <button
                      type="button"
                      onClick={handleAllowForProject}
                      className="rounded-xl border border-amber-300/30 bg-amber-200/10 px-4 py-3 text-sm font-medium text-amber-50 transition hover:bg-amber-200/15"
                    >
                      Permitir siempre para este proyecto
                    </button>
                  ) : null}
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleRejectApproval}
                  className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-medium text-rose-50 transition hover:bg-rose-300/15"
                >
                  Cancelar y devolver rechazo al Cerebro
                </button>
              )}
            </div>
          </div>
        </DetailDialog>
      </div>
    </main>
  )
}

export default App




