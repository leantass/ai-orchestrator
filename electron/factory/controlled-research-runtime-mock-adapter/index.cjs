const contracts = require('../controlled-research-runtime-contracts/index.cjs');

function buildMockRuntimeBlocker(reason) { return { reason }; }
function validateMockRuntimeInput(input) {
  const validations = [contracts.validateApprovedPromptArtifactRef(input?.promptArtifact), contracts.validateResearchOutputContract(input?.outputContract), contracts.validateNoToolPolicy(input?.noToolPolicy)];
  const blockers = validations.flatMap((item) => item.blockers).map((item) => buildMockRuntimeBlocker(item.reason));
  return { ok: blockers.length === 0, blockers };
}
function buildMockOutputFromContract(input) { return { mock: true, schemaKeys: Object.keys(input?.outputContract?.schema || {}).sort(), content: 'deterministic_mock_output', mockOutputIsRealResearch: false, findingsUseApprovedNow: false, rawOutputPromotedToFindings: false }; }
function buildMockRuntimeAudit(input) { return { auditKind: 'mock_research_runtime_audit', validInput: validateMockRuntimeInput(input).ok, credentialsRead: false, networkUsed: false, modelCalled: false, processEnvRead: false, dotEnvRead: false }; }
function buildMockResearchRuntimeResult(input) {
  const validation = validateMockRuntimeInput(input);
  if (!validation.ok) return { ok: false, blockers: validation.blockers, mock: true, runtimeExecuted: false, researchExecuted: false, credentialsRead: false, networkUsed: false, modelCalled: false, findingsUseApprovedNow: false };
  return { ok: true, blockers: [], mock: true, output: buildMockOutputFromContract(input), audit: buildMockRuntimeAudit(input), runtimeExecuted: false, researchExecuted: false, credentialsRead: false, networkUsed: false, modelCalled: false, mockOutputIsRealResearch: false, findingsUseApprovedNow: false, rawOutputPromotedToFindings: false };
}
module.exports = { buildMockResearchRuntimeResult, validateMockRuntimeInput, buildMockOutputFromContract, buildMockRuntimeAudit, buildMockRuntimeBlocker, serializeMockResearchRuntimeResult: (x) => JSON.stringify(x, null, 2), parseMockResearchRuntimeResult: JSON.parse };
