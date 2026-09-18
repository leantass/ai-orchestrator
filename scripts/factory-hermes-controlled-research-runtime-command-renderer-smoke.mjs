import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const repoRoot = process.cwd()
const modulePath = path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-command-renderer', 'index.ts')
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
record('module exists', fsSync.existsSync(modulePath))
const mod = await import(pathToFileURL(modulePath).href)
for (const fn of ['buildHermesControlledRuntimeCommandEnvelope', 'validateHermesCommandRendererInput', 'buildHermesSourceCliContract', 'validateNoToolProofDependency', 'buildRedactedCommandEnvelope', 'buildCommandRendererBlocker', 'summarizeCommandEnvelopeForAudit']) record(`exports ${fn}`, typeof mod[fn] === 'function')
record('input missing blocks', mod.buildHermesControlledRuntimeCommandEnvelope({}).status === 'blocked')
record('source CLI contract unknown blocks', mod.buildHermesControlledRuntimeCommandEnvelope({ sourceCliContract: { criticalUnknowns: ['x'] } }).status === 'blocked')
record('no-tool proof missing blocks', mod.buildHermesControlledRuntimeCommandEnvelope({ sourceCliContract: mod.buildHermesSourceCliContract({}) }).status === 'blocked')
record('hidden defaults unknown blocks', mod.buildHermesControlledRuntimeCommandEnvelope({ sourceCliContract: mod.buildHermesSourceCliContract({ hiddenDefaultsExcluded: false }) }).blockers.some((blocker) => blocker.reason === 'hidden_defaults_not_excluded'))
record('credential order unknown blocks', mod.buildHermesControlledRuntimeCommandEnvelope({ sourceCliContract: mod.buildHermesSourceCliContract({ credentialReadOrderKnown: false }) }).blockers.some((blocker) => blocker.reason === 'credential_order_unknown'))
record('order unknown blocks', mod.buildHermesControlledRuntimeCommandEnvelope({ sourceCliContract: mod.buildHermesSourceCliContract({}) }).blockers.some((blocker) => blocker.reason.includes('order_unknown')))
const proof = { passed: true, staticCommandShapeProofPassed: true, noDefaultsNoToolsetsProofPassed: true, wrapperBoundaryProofPassed: true, failClosedCommandConstructionProofPassed: true, sourceCliContractCriticalUnknownsEmpty: true }
const contract = mod.buildHermesSourceCliContract({ supportsExplicitConfigPath: true, supportsExplicitRunRoot: true, supportsPromptFileOrPromptRef: true, credentialReadOrderKnown: true, credentialReadAfterValidation: true, networkCallOrderKnown: true, networkAfterValidation: true, modelCallOrderKnown: true, modelAfterValidation: true, promptOrderKnown: true, promptAfterValidation: true, hiddenDefaultsExcluded: true, configAppliedBeforeDefaults: true, mcpDisableSupported: true, toolsetsDisableSupported: true, emptyToolRegistrySupported: true })
const pass = mod.buildHermesControlledRuntimeCommandEnvelope({ sourceCliContract: contract, noToolProof: proof, verifiedArtifacts: { configPathRef: 'config-ref', runRootRef: 'run-root-ref' }, promptArtifact: { promptRef: 'prompt-ref', promptBodyIncluded: false }, credentialRef: { credentialRef: 'credential-ref', credentialValueIncluded: false } })
record('no fallback defaults', pass.blockers.length === 0)
record('pass returns redacted envelope', pass.status === 'rendered_redacted_non_runnable' && pass.envelope)
record('envelope runnableNow false', pass.envelope.runnableNow === false)
record('credentialValueIncluded false', pass.envelope.credentialValueIncluded === false)
record('no raw env', !JSON.stringify(pass.envelope.envRedacted).includes('OPENAI_API_KEY='))
record('no prompt body completo', !JSON.stringify(pass).includes('prompt body'))
record('no command secret', !JSON.stringify(pass).includes('secret'))
const source = await fs.readFile(modulePath, 'utf8')
record('no child_process strings', !source.includes('child_process'))
record('no process.env strings', !source.includes('process.env'))
record('no network runtime strings', !source.includes('http:') && !source.includes('https:') && !source.includes('fetch(') && !source.includes('dns'))
const parsed = mod.parseHermesCommandRendererResult(mod.serializeHermesCommandRendererResult(pass))
record('serialize parse ok', parsed.status === pass.status)
console.log(JSON.stringify({ ok: true, checks: checks.length }, null, 2))
