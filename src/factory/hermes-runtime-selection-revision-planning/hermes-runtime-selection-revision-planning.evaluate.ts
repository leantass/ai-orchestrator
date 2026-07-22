import { DEFAULT_FACTORY_HERMES_RUNTIME_SELECTION_REVISION_PLANNING_POLICY, FACTORY_HERMES_RUNTIME_SELECTION_REVISION_PLANNING_KIND, FACTORY_HERMES_RUNTIME_SELECTION_REVISION_PLANNING_VERSION, RUNTIME_SELECTION_REVISION_NOT_AUTHORIZED_ACTIONS, RUNTIME_SELECTION_REVISION_PLANNING_NEXT_STEP } from './hermes-runtime-selection-revision-planning.defaults.ts'
import type { FactoryHermesBlockedRuntimeSelectionSummary, FactoryHermesRuntimeSelectionRevisionPlanningInput, FactoryHermesRuntimeSelectionRevisionPlanningResult } from './hermes-runtime-selection-revision-planning.types.ts'

function validToolsetApproval(r: any): boolean {
  return r?.status === 'toolset_disable_verification_approval_blocked' && r?.decision === 'hermes_toolset_disable_verification_approval_blocked_no_safe_probe_shape' && r?.approvalStatus === 'blocked' && r?.canProceedToRuntimeSelectionRevisionPlanning === true && r?.canProceedToResearchRuntimeAdapterApprovalRetry === false && r?.canProceedToResearchRuntimeAdapter === false && r?.canRunResearchNow === false
}

function validAdapterApproval(r: any): boolean {
  return r?.status === 'research_runtime_adapter_approval_blocked' && r?.decision === 'hermes_research_runtime_adapter_approval_blocked_toolset_mode_unverified' && r?.runtimeAdapterApprovalStatus === 'blocked' && r?.canProceedToResearchRuntimeAdapter === false
}

function validSelection(r: any): boolean {
  return r?.selectedProvider?.providerId === 'openai' && r?.selectedModel?.modelId === 'gpt-4o-mini' && r?.selectedCredentialRef?.credentialRefName === 'OPENAI_API_KEY' && r?.selectedNetworkHosts?.selectedHosts?.includes('api.openai.com') && r?.selectedToolsetMode?.selectedToolsetMode === 'no_toolsets_text_only' && r?.selectedRunRoot?.selectedRunRoot?.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/')
}

function blockedSummary(selection: any): FactoryHermesBlockedRuntimeSelectionSummary {
  return {
    previousProvider: 'openai',
    previousModel: 'gpt-4o-mini',
    previousCredentialRef: 'OPENAI_API_KEY',
    previousHost: 'api.openai.com',
    previousToolsetMode: 'no_toolsets_text_only',
    previousRunRoot: selection?.selectedRunRoot?.selectedRunRoot || '.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/hermes-first-controlled-run-001/',
    blockedReason: 'toolset_mode_not_supported',
    noToolModeProven: false,
    noSafeProbeShape: true,
    adapterApprovalBlocked: true,
    runtimeAdapterApproved: false,
    researchExecutionAllowed: false,
  }
}

function revisionOptions() {
  return [
    { optionId: 'keep_hermes_research_blocked', status: 'safe_available_option', description: 'Mantener Hermes research bloqueado hasta tener estrategia segura.', risk: 'low' as const, enablesRuntimeAdapter: false, recommendedIfNoWrapper: true },
    { optionId: 'plan_wrapper_enforced_no_tool_mode', status: 'recommended_planning_option', description: 'Planificar un wrapper propio que fuerce ejecucion textual sin toolsets, si tecnicamente posible sin modificar Hermes source o con boundary propio.', risk: 'medium' as const, enablesRuntimeAdapter: 'not_now' as const, nextGate: 'Factory Hermes Wrapper No-Tool Mode Planning Gate v1' },
    { optionId: 'revise_to_known_valid_minimal_toolset', status: 'not_recommended_initially', description: 'Elegir un toolset real minimo si existe, pero solo con analisis de riesgos.', risk: 'high' as const, reason: 'Cualquier tool real aumenta superficie de red/filesystem/comandos.', enablesRuntimeAdapter: false },
    { optionId: 'allow_default_cli_toolsets', status: 'forbidden', description: 'Usar defaults CLI ocultos.', risk: 'unacceptable' as const, reason: 'Hidden defaults forbidden.', enablesRuntimeAdapter: false },
    { optionId: 'direct_hermes_runtime_with_no_toolsets_text_only', status: 'forbidden', description: 'Seguir usando no_toolsets_text_only.', risk: 'invalid_selection' as const, reason: 'No es sintaxis Hermes probada.', enablesRuntimeAdapter: false },
    { optionId: 'controlled_toolset_probe', status: 'blocked_no_safe_probe_shape', description: 'Intentar probe de toolsets.', risk: 'unsafe_without_proven_command_shape' as const, enablesRuntimeAdapter: false },
  ]
}

function decisionPack(id: string) {
  return { packId: `${id}:decision-pack`, pendingDecisions: [
    { decisionId: 'keep_hermes_research_blocked', label: 'Mantener Hermes research bloqueado.', status: 'pending_human_decision' as const, risk: 'low', impact: 'No runtime adapter proceeds.', recommended: false, blockedUntilChosen: true },
    { decisionId: 'plan_wrapper_enforced_no_tool_mode', label: 'Planificar wrapper propio no-tools.', status: 'pending_human_decision' as const, risk: 'medium', impact: 'Creates a governed wrapper planning path.', recommended: true, blockedUntilChosen: true },
    { decisionId: 'revise_to_known_valid_minimal_toolset', label: 'Revisar seleccion hacia un toolset real minimo.', status: 'pending_human_decision' as const, risk: 'high', impact: 'Increases tool surface and requires further gates.', recommended: false, blockedUntilChosen: true },
    { decisionId: 'abandon_hermes_for_research', label: 'Abandonar Hermes para research y usar otro proveedor controlado.', status: 'pending_human_decision' as const, risk: 'medium', impact: 'Changes runtime strategy.', recommended: false, blockedUntilChosen: true },
    { decisionId: 'deeper_source_analysis', label: 'Volver a source analysis profundo para buscar otra ruta.', status: 'pending_human_decision' as const, risk: 'low', impact: 'May find a safer path, but no execution yet.', recommended: false, blockedUntilChosen: true },
  ] }
}

export function evaluateFactoryHermesRuntimeSelectionRevisionPlanning(input: FactoryHermesRuntimeSelectionRevisionPlanningInput): FactoryHermesRuntimeSelectionRevisionPlanningResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_RUNTIME_SELECTION_REVISION_PLANNING_POLICY, ...(input.policy || {}) }
  const planningId = `hermes-runtime-selection-revision-planning:75b300f:${input.plannedAt}`
  const toolsetOk = !policy.requireToolsetDisableApprovalBlocked || validToolsetApproval(input.toolsetDisableVerificationApprovalResult)
  const adapterOk = !policy.requireAdapterApprovalBlocked || validAdapterApproval(input.researchRuntimeAdapterApprovalResult)
  const selectionOk = validSelection(input.runtimeSelectionDecisionResult)
  const summary = blockedSummary(input.runtimeSelectionDecisionResult)
  const options = revisionOptions()
  const pack = decisionPack(planningId)
  const recommendedRevisionPath = { pathId: 'plan_wrapper_enforced_no_tool_mode' as const, reason: 'direct Hermes no-tools no esta soportado; wrapper permite gobernar tools/output/env sin depender de defaults ocultos.', nextGate: 'Factory Hermes Wrapper No-Tool Mode Planning Gate v1' as const, executionAllowedNow: false as const }
  const ok = toolsetOk && adapterOk && selectionOk
  const decision = ok ? 'hermes_runtime_selection_revision_plan_created_toolset_mode_blocked' : (!toolsetOk ? 'blocked_invalid_toolset_disable_verification_approval' : (!adapterOk ? 'blocked_invalid_research_runtime_adapter_approval' : 'blocked_invalid_previous_runtime_selection'))
  const status = ok ? 'runtime_selection_revision_plan_created' : 'blocked'
  const revisionStatus = ok ? 'manual_revision_required' : 'blocked'
  const candidate = { planCandidateId: `${planningId}:candidate`, toolId: 'hermes_agent' as const, blockedRuntimeSelectionSummary: summary, revisionOptions: options, runtimeSelectionRevisionDecisionPack: pack, recommendedRevisionPath, currentRuntimeSelectionInvalidForAdapter: true as const, selectedToolsetModeInvalidForAdapter: true as const, directHermesRuntimeAdapterBlocked: true as const, wrapperPlanningRecommended: true as const, executionAllowedNow: false as const, runtimeAdapterAllowedNow: false as const, researchExecutionAllowedNow: false as const, canProceedToHermesWrapperNoToolModePlanning: true as const, canProceedToRuntimeSelectionRevisionDecision: true as const, canProceedToResearchRuntimeAdapterApprovalRetry: false as const, canProceedToResearchRuntimeAdapter: false as const, canRunResearchNow: false as const }
  return {
    planningId, planningKind: FACTORY_HERMES_RUNTIME_SELECTION_REVISION_PLANNING_KIND, planningVersion: FACTORY_HERMES_RUNTIME_SELECTION_REVISION_PLANNING_VERSION, plannedAt: input.plannedAt, plannedBy: input.plannedBy, toolId: 'hermes_agent', blockedAdapterApprovalRef: input.researchRuntimeAdapterApprovalResult?.adapterApprovalId, blockedToolsetApprovalRef: input.toolsetDisableVerificationApprovalResult?.approvalId, previousRuntimeSelectionRef: input.runtimeSelectionDecisionResult?.decisionId, blockedRuntimeSelectionSummary: summary, revisionOptions: options, runtimeSelectionRevisionDecisionPack: pack, recommendedRevisionPath, runtimeSelectionRevisionPlanningReceipt: { receiptId: `${planningId}:receipt`, planningId, toolId: 'hermes_agent', plannedBy: input.plannedBy, plannedAt: input.plannedAt, decision, scope: 'hermes_runtime_selection_revision_planning_only', approvedNextGate: 'Factory Hermes Wrapper No-Tool Mode Planning Gate v1', alternateNextGate: 'Factory Hermes Runtime Selection Revision Decision Gate v1', limitations: ['This gate plans revision only; it does not approve adapter creation or execution.', 'No Hermes, prompt, network, credentials, model calls, toolsets, run root, ingestion, findings, uv, Python, pip, or setup.py are authorized.'], notAuthorizedActions: RUNTIME_SELECTION_REVISION_NOT_AUTHORIZED_ACTIONS }, hermesRuntimeSelectionRevisionPlanCandidate: candidate, checks: [], blockers: ok ? [] : [{ blockerId: 'invalid_revision_inputs', message: 'Required blocked approval, adapter approval, or previous runtime selection input is invalid.' }], warnings: [{ warningId: 'previous_toolset_mode_invalid_for_adapter', message: 'Previous runtime selection uses no_toolsets_text_only, which is not proven Hermes syntax.' }], status, decision, revisionStatus, canProceedToHermesWrapperNoToolModePlanning: ok, canProceedToRuntimeSelectionRevisionDecision: ok, canProceedToResearchRuntimeAdapterApprovalRetry: false, canProceedToResearchRuntimeAdapter: false, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: RUNTIME_SELECTION_REVISION_PLANNING_NEXT_STEP,
  }
}
