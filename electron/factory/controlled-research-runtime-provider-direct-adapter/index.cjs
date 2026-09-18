const contracts = require('../controlled-research-runtime-contracts/index.cjs');

function buildProviderDirectRequestBlocker(reason) { return { reason }; }
function validateProviderDirectRuntimeBoundary(input) { return contracts.validateProviderModelHostRefs(input?.providerModelHostRefs || input); }
function validateApprovedPromptArtifact(input) { return contracts.validateApprovedPromptArtifactRef(input?.promptArtifact || input); }
function validateOutputContract(input) { return contracts.validateResearchOutputContract(input?.outputContract || input); }
function validateProviderModelHostRefs(input) { return contracts.validateProviderModelHostRefs(input?.providerModelHostRefs || input); }
function validateCredentialRefOnly(input) { return contracts.validateCredentialRefOnly(input?.credentialRef || input); }
function enforceNoToolRequest(input) {
  const policy = contracts.validateNoToolPolicy(input?.noToolPolicy || input);
  const declarations = input?.tools || input?.functions || input?.tool_choice || input?.toolChoice;
  return { ok: policy.ok && !declarations, blockers: [...policy.blockers, ...(declarations ? [buildProviderDirectRequestBlocker('tool_declarations_forbidden')] : [])] };
}
function buildProviderDirectResearchRequest(input) {
  const validations = [validateApprovedPromptArtifact(input), validateOutputContract(input), validateProviderDirectRuntimeBoundary(input), validateCredentialRefOnly(input), enforceNoToolRequest(input)];
  const blockers = validations.flatMap((item) => item.blockers).map((item) => buildProviderDirectRequestBlocker(item.reason));
  const noToolEvidence = { toolsAllowed: false, toolRegistryAllowed: false, mcpAllowed: false, functionDeclarationsAllowed: false, toolChoiceAllowed: false, toolsDeclared: false };
  if (blockers.length > 0) return { ok: false, blockers, noToolEvidence };
  return { ok: true, blockers: [], noToolEvidence, envelope: { envelopeKind: 'provider_direct_non_executing_request_envelope', runnableNow: false, credentialValueIncluded: false, networkCallIncluded: false, modelCallIncluded: false, promptSentToProvider: false, toolsDeclared: false, findingsUseApprovedNow: false, providerRef: 'openai', modelRef: 'gpt-4o-mini', hostRef: 'api.openai.com' } };
}
function summarizeProviderDirectRequestForAudit(input) {
  const result = buildProviderDirectResearchRequest(input);
  return { ok: result.ok, blockerCount: result.blockers.length, containsSecrets: false, runtimeExecuted: false, networkUsed: false, modelCalled: false, promptSentToProvider: false };
}
module.exports = { buildProviderDirectResearchRequest, validateProviderDirectRuntimeBoundary, validateApprovedPromptArtifact, validateOutputContract, validateProviderModelHostRefs, validateCredentialRefOnly, enforceNoToolRequest, buildProviderDirectRequestBlocker, summarizeProviderDirectRequestForAudit, serializeProviderDirectAdapterResult: (x) => JSON.stringify(x, null, 2), parseProviderDirectAdapterResult: JSON.parse };
