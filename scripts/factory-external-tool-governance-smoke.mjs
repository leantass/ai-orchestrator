import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { DEFAULT_FACTORY_EXTERNAL_TOOL_REGISTRY, parseFactoryExternalToolRegistry, serializeFactoryExternalToolRegistry, summarizeFactoryExternalToolRegistry, validateFactoryExternalToolRegistry } from '../src/factory/external-tool-governance/index.ts'

const registry = DEFAULT_FACTORY_EXTERNAL_TOOL_REGISTRY
const byId = (id) => registry.tools.find((tool) => tool.toolId === id)
assert.ok(byId('hermes-agent')) // 1
assert.ok(byId('codex')) // 2
assert.ok(byId('playwright')) // 3
assert.ok(byId('vitest')) // 4
assert.ok(byId('msw')) // 5
assert.ok(['gitleaks', 'semgrep', 'codeql', 'opengrep', 'trivy', 'openssf-scorecard'].every(byId)) // 6
assert.ok(['market_research', 'web_research'].includes(byId('hermes-agent').category)) // 7
assert.equal(byId('hermes-agent').origin, 'external_tool') // 8
assert.equal(byId('hermes-agent').integrationMode, 'source_checkout_audit') // 9
assert.equal(byId('hermes-agent').lifecycleStatus, 'source_checked_out') // 10
assert.equal(byId('hermes-agent').installAllowedNow, false) // 11
assert.equal(byId('hermes-agent').executionAllowedNow, false) // 12
assert.equal(byId('hermes-agent').credentialsAllowedNow, false) // 13
assert.equal(byId('codex').executionAllowedNow, false) // 14
assert.notEqual(byId('playwright').lifecycleStatus, 'installed') // 15
assert.notEqual(byId('vitest').lifecycleStatus, 'installed') // 16
assert.notEqual(byId('msw').lifecycleStatus, 'installed') // 17
assert.equal(byId('gitleaks').lifecycleStatus, 'planned') // 18
assert.ok(['planned', 'profiled'].includes(byId('semgrep').lifecycleStatus) && ['planned', 'profiled'].includes(byId('codeql').lifecycleStatus)) // 19
assert.equal(byId('trivy').lifecycleStatus, 'planned') // 20
assert.equal(byId('lighthouse-ci').lifecycleStatus, 'planned') // 21
assert.equal(byId('promptfoo').lifecycleStatus, 'planned') // 22
assert.equal(validateFactoryExternalToolRegistry(registry).ok, true) // 23
assert.equal(parseFactoryExternalToolRegistry(serializeFactoryExternalToolRegistry(registry)).tools.length, registry.tools.length) // 24
assert.equal(summarizeFactoryExternalToolRegistry(registry).credentialsEnabledCount, 0) // 25
assert.ok(summarizeFactoryExternalToolRegistry(registry).byLifecycle.source_checked_out >= 1) // 26
assert.ok(existsSync('docs/factory/FACTORY_TOTAL_FLOW_V1.md')) // 27
assert.ok(existsSync('docs/factory/EXTERNAL_TOOL_GOVERNANCE_V1.md')) // 28
assert.ok(existsSync('docs/factory/HERMES_AGENT_INTEGRATION_PLAN_V1.md')) // 29
assert.ok(existsSync('docs/factory/FACTORY_IMPLEMENTATION_STATUS_V1.md')) // 30
assert.equal(registry.tools.some((tool) => tool.executionAllowedNow), false) // 31
assert.equal(registry.tools.some((tool) => tool.installAllowedNow), false) // 32
assert.equal(byId('hermes-agent').integrationMode === 'runtime_adapter' || byId('hermes-agent').lifecycleStatus === 'adapter_ready', false) // 33
assert.ok(/Hermes Installation Plan Gate|Runtime Boundary/u.test(registry.recommendedNextStep) && !/execute Hermes directly/iu.test(registry.recommendedNextStep)) // 34
console.log(JSON.stringify({ ok: true, checks: 34, registryKind: registry.registryKind, tools: registry.tools.length, hermesLifecycle: byId('hermes-agent').lifecycleStatus, executionEnabled: summarizeFactoryExternalToolRegistry(registry).executionEnabledCount, installEnabled: summarizeFactoryExternalToolRegistry(registry).installEnabledCount }, null, 2))
