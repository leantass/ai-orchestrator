import { validateApprovedPromptArtifactRef, validateNoToolPolicy, validateResearchOutputContract } from '../controlled-research-runtime-contracts/index.ts'

export type MockResearchRuntimeInput = Record<string, any>
export type MockResearchRuntimeResult = Record<string, any>
export type MockRuntimeOutput = Record<string, any>
export type MockRuntimeAudit = Record<string, any>
export type MockRuntimeBlocker = { reason: string }

export function buildMockRuntimeBlocker(reason: string): MockRuntimeBlocker {
  return { reason }
}

export function validateMockRuntimeInput(input: MockResearchRuntimeInput) {
  const validations = [validateApprovedPromptArtifactRef(input?.promptArtifact), validateResearchOutputContract(input?.outputContract), validateNoToolPolicy(input?.noToolPolicy)]
  const blockers = validations.flatMap((item) => item.blockers).map((item) => buildMockRuntimeBlocker(item.reason))
  return { ok: blockers.length === 0, blockers }
}

export function buildMockOutputFromContract(input: MockResearchRuntimeInput): MockRuntimeOutput {
  return { mock: true, schemaKeys: Object.keys(input?.outputContract?.schema || {}).sort(), content: 'deterministic_mock_output', mockOutputIsRealResearch: false, findingsUseApprovedNow: false, rawOutputPromotedToFindings: false }
}

export function buildMockRuntimeAudit(input: MockResearchRuntimeInput): MockRuntimeAudit {
  return { auditKind: 'mock_research_runtime_audit', validInput: validateMockRuntimeInput(input).ok, credentialsRead: false, networkUsed: false, modelCalled: false, processEnvRead: false, dotEnvRead: false }
}

export function buildMockResearchRuntimeResult(input: MockResearchRuntimeInput): MockResearchRuntimeResult {
  const validation = validateMockRuntimeInput(input)
  if (!validation.ok) return { ok: false, blockers: validation.blockers, mock: true, runtimeExecuted: false, researchExecuted: false, credentialsRead: false, networkUsed: false, modelCalled: false, findingsUseApprovedNow: false }
  return { ok: true, blockers: [], mock: true, output: buildMockOutputFromContract(input), audit: buildMockRuntimeAudit(input), runtimeExecuted: false, researchExecuted: false, credentialsRead: false, networkUsed: false, modelCalled: false, mockOutputIsRealResearch: false, findingsUseApprovedNow: false, rawOutputPromotedToFindings: false }
}

export function serializeMockResearchRuntimeResult(input: unknown): string { return JSON.stringify(input, null, 2) }
export function parseMockResearchRuntimeResult(text: string): unknown { return JSON.parse(text) }
