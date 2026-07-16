import assert from 'node:assert/strict'

import {
  FACTORY_ARCHITECTURE_LAYER_ORDER,
  createDefaultFactoryArchitectureBlueprintV1,
  parseFactoryArchitectureBlueprintV1,
  serializeFactoryArchitectureBlueprintV1,
  summarizeFactoryArchitectureBlueprintV1,
  validateFactoryArchitectureBlueprintV1,
} from '../src/factory/architecture/index.ts'

const blueprint = createDefaultFactoryArchitectureBlueprintV1({
  createdAt: '2026-07-15T18:00:00.000Z',
  owner: 'Lean',
})

const validation = validateFactoryArchitectureBlueprintV1(blueprint)
assert.equal(validation.ok, true, validation.errors.join('\n'))

const serialized = serializeFactoryArchitectureBlueprintV1(blueprint)
assert.equal(typeof serialized, 'string')
const parsed = parseFactoryArchitectureBlueprintV1(serialized)
const parsedValidation = validateFactoryArchitectureBlueprintV1(parsed)
assert.equal(parsedValidation.ok, true, parsedValidation.errors.join('\n'))

assert.deepEqual(blueprint.layers.map((layer) => layer.layerId), [...FACTORY_ARCHITECTURE_LAYER_ORDER])

const tools = new Map(blueprint.tools.map((tool) => [tool.toolId, tool]))
const components = new Map(blueprint.components.map((component) => [component.componentId, component]))
for (const toolId of ['jefe', 'radar', 'hermes', 'memory', 'codex', 'vitest', 'msw', 'playwright-test', 'gitleaks', 'promptfoo']) {
  assert.ok(['approved', 'conditional'].includes(tools.get(toolId)?.status ?? ''), `${toolId} must be approved or conditional`)
}
assert.notEqual(tools.get('agent-zero')?.status, 'approved')
assert.notEqual(tools.get('kubernetes')?.status, 'approved')
assert.equal(blueprint.actorPolicy.codexCanSelfApprove, false)
assert.equal(blueprint.actorPolicy.hermesCanModifyCode, false)
assert.equal(blueprint.independence.generatedProjectsMustHaveOwnRepo, true)
assert.equal(blueprint.independence.generatedProjectsMustNotDependOnJefeRuntime, true)
assert.equal(blueprint.economics.freeFirst, true)

assert.ok(blueprint.layers.every((layer) => typeof layer.origin === 'string'))
assert.equal(tools.get('hermes')?.origin, 'external_tool')
assert.equal(tools.get('hermes')?.adapterRequired, true)
assert.equal(tools.get('hermes')?.adapterName, 'JefeHermesAdapter')
assert.equal(tools.get('hermes')?.mayModifyCode, false)
assert.equal(tools.get('hermes')?.mayModifyRepo, false)
assert.equal(tools.get('hermes')?.mayApprove, false)
assert.equal(tools.get('hermes')?.mayDeploy, false)
assert.equal(components.get('jefe-hermes-adapter')?.origin, 'adapter')
assert.equal(components.get('jefe-hermes-adapter')?.runtimeIntegrated, false)
assert.equal(tools.get('radar')?.origin, 'internal_module')
assert.equal(tools.get('jefe')?.origin, 'internal_module')
assert.equal(tools.get('memory')?.origin, 'internal_module')
assert.equal(tools.get('codex')?.origin, 'external_tool')
assert.equal(tools.get('playwright-test')?.origin, 'external_tool')
assert.equal(tools.get('vitest')?.origin, 'external_tool')
assert.equal(tools.get('msw')?.origin, 'external_tool')
assert.equal(tools.get('factory-project-contract')?.origin, 'contract')
assert.equal(tools.get('factory-architecture-blueprint')?.origin, 'contract')
assert.equal(components.get('generated-apps')?.origin, 'generated_project_component')

const correction = blueprint.correctionLoop
assert.equal(correction.policy.afterTestsReturnToJefe, true)
assert.equal(correction.policy.afterQaReturnToJefe, true)
assert.equal(correction.policy.afterSecurityReturnToJefe, true)
assert.equal(correction.policy.afterPromptEvalReturnToJefe, true)
assert.equal(correction.policy.codexSelfApprovalAllowed, false)
assert.equal(correction.jefeReviewGate.required, true)
assert.equal(correction.jefeReviewGate.stagingRequiresThisGate, true)
for (const layer of ['unit_integration_tests', 'browser_qa', 'security_quality_performance', 'ai_prompt_evaluation']) {
  assert.ok(correction.directToStagingForbiddenFrom.includes(layer), `${layer} must return to JEFE before staging`)
}
assert.ok(correction.policy.maxCorrectionRoundsDefault >= 1)
assert.equal(correction.policy.humanEscalationOnRepeatedFailure, true)
assert.equal(correction.policy.regressionDetectionRequired, true)
assert.equal(correction.policy.releaseReadinessRequiresJefeApproval, true)

const invalidPaidOnly = JSON.parse(serialized)
invalidPaidOnly.tools.find((tool) => tool.toolId === 'github').cost = 'paid_only'
assert.equal(validateFactoryArchitectureBlueprintV1(invalidPaidOnly).ok, false)

const summary = summarizeFactoryArchitectureBlueprintV1(blueprint)
assert.equal(JSON.stringify(summary).toLowerCase().includes('secret'), false)
assert.equal(summary.nextTopDownSteps[0], 'radar foundation')
assert.ok(summary.originCounts.internal_module > 0)
assert.ok(summary.originCounts.external_tool > 0)
assert.ok(summary.originCounts.adapter > 0)
assert.ok(summary.originCounts.contract > 0)
assert.ok(summary.originCounts.workflow_gate > 0)
assert.ok(summary.toolsRequiringAdapter.includes('Hermes Agent'))
assert.ok(summary.nextAdaptersToDefine.includes('JefeHermesAdapter'))
assert.equal(summary.correctionLoopEnabled, true)
assert.equal(summary.maxCorrectionRoundsDefault, 3)
assert.equal(summary.releaseRequiresJefeReview, true)

console.log(JSON.stringify({
  ok: true,
  checks: 54,
  blueprintVersion: blueprint.blueprintVersion,
  blueprintKind: blueprint.blueprintKind,
  layers: summary.layerCount,
  approvedTools: summary.approvedTools.length,
  conditionalTools: summary.conditionalTools.length,
  rejectedTools: summary.rejectedTools.length,
  originCounts: summary.originCounts,
  correctionLoopEnabled: summary.correctionLoopEnabled,
  maxCorrectionRoundsDefault: summary.maxCorrectionRoundsDefault,
  nextTopDownSteps: summary.nextTopDownSteps,
}, null, 2))
