import { DEFAULT_FACTORY_HERMES_NETWORK_POLICY_PLANNING_POLICY, FACTORY_HERMES_NETWORK_POLICY_PLANNING_KIND, FACTORY_HERMES_NETWORK_POLICY_PLANNING_NEXT_STEP, FACTORY_HERMES_NETWORK_POLICY_PLANNING_VERSION, NETWORK_NOT_AUTHORIZED_ACTIONS, NETWORK_REQUIRED_NEXT_POLICIES } from './hermes-network-policy-planning.defaults.ts'
import type { FactoryHermesNetworkPolicyPlanningInput, FactoryHermesNetworkPolicyPlanningResult, FactoryHermesNetworkPolicyRule, FactoryHermesNetworkProviderCandidate, FactoryHermesNetworkSurfaceCandidate } from './hermes-network-policy-planning.types.ts'

function networkSurfaces(): FactoryHermesNetworkSurfaceCandidate[] {
  return [
    { surfaceId: 'model_provider_api_network', status: 'requires_future_network_approval', reason: 'Provider candidates openai, anthropic and gemini_google likely require outbound HTTPS, but no host is approved in this gate.', canUseNow: false, hostsApprovedNow: [], wildcardAllowed: false },
    { surfaceId: 'web_toolset_network', status: 'forbidden_until_toolsets_policy', reason: 'Web/search toolsets require separate Toolsets Policy and Network Policy.', canUseNow: false },
    { surfaceId: 'browser_toolset_network', status: 'forbidden_until_toolsets_policy', reason: 'Browser toolsets require separate Toolsets Policy and Network Policy.', canUseNow: false },
    { surfaceId: 'mcp_network_or_local_channels', status: 'forbidden_until_toolsets_policy', reason: 'MCP channels may be local or networked and require Toolsets Policy before use.', canUseNow: false },
    { surfaceId: 'terminal_toolset_network', status: 'forbidden_until_toolsets_policy', reason: 'Terminal toolsets could initiate network indirectly and remain disabled until Toolsets Policy.', canUseNow: false },
    { surfaceId: 'arbitrary_internet', status: 'forbidden', reason: 'No arbitrary internet or wildcard access is permitted.', canUseNow: false, hostsApprovedNow: [], wildcardAllowed: false },
    { surfaceId: 'offline_execution', status: 'not_available', reason: 'No contractual offline/mock provider was found in prior deep source review.', canUseNow: false },
  ]
}

function providerCandidates(inspection?: any): FactoryHermesNetworkProviderCandidate[] {
  const byProvider = inspection?.providerHostCandidates || {}
  return (['openai', 'anthropic', 'gemini_google'] as const).map((providerCandidate) => ({
    providerCandidate,
    hostCandidates: Array.isArray(byProvider[providerCandidate]) ? byProvider[providerCandidate] : [],
    hostSelectionRequired: true,
    allowedHostsNow: [],
    futureAllowedHostsRequireApproval: true,
    wildcardHostsAllowed: false,
  }))
}

function rules(): FactoryHermesNetworkPolicyRule[] {
  return [
    { ruleId: 'no_network_now', ruleName: 'No network now', requirements: ['Network is not allowed in this gate.', 'No DNS resolution.', 'No endpoint tests or HTTP requests.'] },
    { ruleId: 'explicit_future_scope', ruleName: 'Explicit future network scope', requirements: ['Future runtime must declare exact hosts.', 'No wildcards.', 'No arbitrary internet.'] },
    { ruleId: 'provider_network_dependency', ruleName: 'Provider network dependency', requirements: ['Provider and model must be selected before host approval.', 'Credentials approval remains separate.', 'Model calls remain separate.'] },
    { ruleId: 'toolsets_network_dependency', ruleName: 'Toolsets network dependency', requirements: ['Web, browser, search, MCP and terminal network remain disabled until Toolsets Policy.', 'No hidden default toolsets may use network.'] },
    { ruleId: 'endpoint_host_policy', ruleName: 'Endpoint / host policy', requirements: ['Future base URLs must be explicit.', 'No env-provided base URL without approval.', 'No redirects to unapproved hosts.'] },
    { ruleId: 'runtime_network_controls', ruleName: 'Runtime network controls', requirements: ['Timeout required.', 'Retry policy required.', 'No headers or secrets in logs.', 'networkStatus must be reported.'] },
    { ruleId: 'network_kill_switch', ruleName: 'Network kill switch', requirements: ['networkKillSwitchRequired true.', 'providerNetworkKillSwitchRequired true.'] },
    { ruleId: 'network_failure_policy', ruleName: 'Failure policy', requirements: ['If network is required but not approved, fail controlled.', 'No provider fallback.', 'No browser/web fallback.'] },
  ]
}

function base(input: FactoryHermesNetworkPolicyPlanningInput): FactoryHermesNetworkPolicyPlanningResult {
  return { planningId: `hermes-network-policy-planning:75b300f:${input.plannedAt}`, planningKind: FACTORY_HERMES_NETWORK_POLICY_PLANNING_KIND, planningVersion: FACTORY_HERMES_NETWORK_POLICY_PLANNING_VERSION, plannedAt: input.plannedAt, plannedBy: input.plannedBy, toolId: 'hermes_agent', commandShapeUnderConsideration: 'oneshot_real_with_provider_model', futureCommandShape: 'hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL>', networkSurfaceCandidates: [], providerNetworkCandidates: [], checks: [], blockers: [], warnings: [], status: 'blocked', decision: 'blocked_missing_credentials_policy_planning', canProceedToToolsetsPolicyPlanning: false, canProceedToResearchExecutionApproval: false, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canUseFindings: false, recommendedNextStep: FACTORY_HERMES_NETWORK_POLICY_PLANNING_NEXT_STEP }
}

export function evaluateFactoryHermesNetworkPolicyPlanning(input: FactoryHermesNetworkPolicyPlanningInput): FactoryHermesNetworkPolicyPlanningResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_NETWORK_POLICY_PLANNING_POLICY, ...(input.policy || {}) }
  const out = base(input)
  const credentials = input.credentialsPolicyPlanningResult
  const model = input.modelProviderPolicyPlanningResult
  const chain = input.policyChainPlanningResult
  const inspection = input.networkSourceInspection
  if (!credentials) return { ...out, blockers: [{ blockerId: 'blocked_missing_credentials_policy_planning', message: 'Credentials policy planning result is required.' }] }
  const injection = credentials.hermesCredentialsPolicyPlanCandidate?.credentialInjectionPlan
  if (credentials.status !== 'credentials_policy_plan_created' || credentials.decision !== 'hermes_credentials_policy_plan_created' || credentials.canProceedToNetworkPolicyPlanning !== true || credentials.canProceedToResearchExecutionApproval !== false || credentials.canRunResearchNow !== false || credentials.canExecuteHermesNow !== false || credentials.canPassPromptNow !== false || credentials.canUseNetworkNow !== false || credentials.canUseCredentialsNow !== false || credentials.canReadEnvSecretsNow !== false || credentials.canCallModelsNow !== false || injection?.credentialValuesReadHere !== false || injection?.credentialValuesDefinedHere !== false) return { ...out, decision: 'blocked_credentials_policy_not_ready_for_network_policy', blockers: [{ blockerId: 'blocked_credentials_policy_not_ready_for_network_policy', message: 'Credentials policy planning is not ready for network policy.' }] }
  const selection = model?.hermesModelProviderPolicyPlanCandidate?.providerSelection
  if (policy.requireModelProviderPolicyPlanning && (!model || selection?.selectedProvider !== null || selection?.selectedModel !== null || selection?.providerSelectionRequired !== true || selection?.noImplicitProviderFromEnv !== true || selection?.noImplicitModelFromEnv !== true || selection?.noDefaultFallbackProvider !== true)) return { ...out, decision: 'blocked_model_provider_policy_not_ready_for_network_policy', blockers: [{ blockerId: 'blocked_model_provider_policy_not_ready_for_network_policy', message: 'Model provider policy planning must keep provider/model unselected.' }] }
  if (chain && (!chain.requiredPolicies?.some?.((p: any) => String(p.policyName || p).includes('Network Policy')) || !JSON.stringify(chain.proposedGateSequence || []).includes('Factory Hermes Network Policy Planning Gate v1'))) return { ...out, decision: 'blocked_policy_chain_missing_network_policy', blockers: [{ blockerId: 'blocked_policy_chain_missing_network_policy', message: 'Policy chain does not include Network Policy Planning.' }] }
  if (policy.requireNetworkSourceInspection && !inspection) return { ...out, decision: 'blocked_missing_network_source_inspection', blockers: [{ blockerId: 'blocked_missing_network_source_inspection', message: 'Network source inspection is required.' }] }
  if (inspection?.networkUsed === true || inspection?.dnsResolved === true || inspection?.endpointsTested === true || inspection?.envValuesRead === true || inspection?.dotEnvRead === true) return { ...out, decision: 'blocked_network_was_used_during_planning', blockers: [{ blockerId: 'blocked_network_was_used_during_planning', message: 'Network inspection must be text-only and must not use network, DNS, endpoints, env values or dotenv.' }] }
  const networkSurfaceCandidates = networkSurfaces()
  const providerNetworkCandidates = providerCandidates(inspection)
  const plan = { planCandidateId: `${out.planningId}:network-policy-plan-candidate`, toolId: 'hermes_agent' as const, commandShapeUnderConsideration: 'oneshot_real_with_provider_model' as const, futureCommandShape: { executable: 'hermes.exe' as const, argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>'] as ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>'], shell: false as const }, networkAllowedNow: false as const, allowedHostsNow: [] as [], allowedSchemesNow: [] as [], futureHostSelectionRequired: true as const, futureAllowedHostsRequireApproval: true as const, wildcardHostsAllowed: false as const, arbitraryInternetAllowed: false as const, providerNetworkCandidates, networkSurfaceCandidates, networkRules: rules(), providerDependency: { selectedProviderRequiredBeforeNetworkApproval: true as const, selectedModelRequiredBeforeNetworkApproval: true as const }, credentialsDependency: { credentialsNotApprovedHere: true as const, credentialPolicyMustBeApprovedBeforeRuntime: true as const }, toolsetsDependency: { toolsetNetworkDisabledUntilToolsetsPolicy: true as const, webBrowserSearchDisabledUntilToolsetsPolicy: true as const }, runtimeRequirements: { shellFalse: true as const, timeoutRequired: true as const, retryPolicyRequired: true as const, networkStatusRequired: true as const, noHeadersOrSecretsInLogs: true as const }, killSwitchPolicy: { networkKillSwitchRequired: true as const, providerNetworkKillSwitchRequired: true as const }, requiredNextPolicies: NETWORK_REQUIRED_NEXT_POLICIES, canProceedToToolsetsPolicyPlanning: true as const, canProceedToResearchExecutionApproval: false as const, canUseNetworkNow: false as const, canCallModelsNow: false as const }
  const receipt = { receiptId: `${out.planningId}:receipt`, planningId: out.planningId, toolId: 'hermes_agent' as const, plannedBy: input.plannedBy, plannedAt: input.plannedAt, decision: 'hermes_network_policy_plan_created' as const, scope: 'hermes_network_policy_planning_only' as const, approvedNextGate: 'Factory Hermes Toolsets Policy Planning Gate v1' as const, limitations: ['No network is enabled by this gate.', 'Allowed hosts remain empty.', 'Toolset network remains blocked until Toolsets Policy.', 'Provider/model/credentials remain unselected.'], notAuthorizedActions: NETWORK_NOT_AUTHORIZED_ACTIONS }
  return { ...out, status: 'network_policy_plan_created', decision: 'hermes_network_policy_plan_created', networkSurfaceCandidates, providerNetworkCandidates, networkPolicyPlanningReceipt: receipt, hermesNetworkPolicyPlanCandidate: plan, canProceedToToolsetsPolicyPlanning: true }
}
