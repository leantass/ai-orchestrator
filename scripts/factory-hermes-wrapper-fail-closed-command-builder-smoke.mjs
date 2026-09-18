import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const repoRoot = process.cwd()
const modulePath = path.join(repoRoot, 'src', 'factory', 'hermes-wrapper-fail-closed-command-builder', 'index.ts')
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
record('module exists', fsSync.existsSync(modulePath))
const mod = await import(pathToFileURL(modulePath).href)
for (const fn of ['buildWrapperFailClosedHermesCommand', 'validateWrapperCommandBoundary', 'assertVerifiedConfigAndRunRoot', 'assertPromptManifestRefOnly', 'assertCredentialRefOnly', 'assertNoToolProofPresent', 'assertSourceCliContractPresent', 'denyWrapperCommandBuild', 'buildWrapperCommandAuditManifest']) record(`exports ${fn}`, typeof mod[fn] === 'function')
record('renderer blocked blocks builder', mod.buildWrapperFailClosedHermesCommand({ rendererResult: { status: 'blocked' }, boundary: {} }).status === 'blocked')
record('missing config run root blocks', mod.buildWrapperFailClosedHermesCommand({ rendererResult: { status: 'rendered_redacted_non_runnable' }, boundary: {} }).blockers.some((blocker) => blocker.reason === 'verified_config_or_run_root_missing'))
record('missing prompt ref blocks', mod.buildWrapperFailClosedHermesCommand({ rendererResult: { status: 'rendered_redacted_non_runnable' }, boundary: { configPathRef: 'c', runRootRef: 'r' } }).blockers.some((blocker) => blocker.reason === 'prompt_ref_missing'))
record('missing credential ref blocks', mod.buildWrapperFailClosedHermesCommand({ rendererResult: { status: 'rendered_redacted_non_runnable' }, boundary: { configPathRef: 'c', runRootRef: 'r', promptRef: 'p' } }).blockers.some((blocker) => blocker.reason === 'credential_ref_missing'))
record('missing no-tool proof blocks', mod.buildWrapperFailClosedHermesCommand({ rendererResult: { status: 'rendered_redacted_non_runnable' }, boundary: { configPathRef: 'c', runRootRef: 'r', promptRef: 'p', credentialRef: 'cred' } }).blockers.some((blocker) => blocker.reason === 'no_tool_proof_missing'))
record('missing source contract blocks', mod.buildWrapperFailClosedHermesCommand({ rendererResult: { status: 'rendered_redacted_non_runnable' }, boundary: { configPathRef: 'c', runRootRef: 'r', promptRef: 'p', credentialRef: 'cred', noToolProofRef: 'proof' } }).blockers.some((blocker) => blocker.reason === 'source_cli_contract_missing'))
const pass = mod.buildWrapperFailClosedHermesCommand({ rendererResult: { status: 'rendered_redacted_non_runnable' }, boundary: { configPathRef: 'c', runRootRef: 'r', promptRef: 'p', credentialRef: 'cred', noToolProofRef: 'proof', sourceCliContractRef: 'contract' } })
record('no fallback defaults', pass.auditManifest.noCliDefaults === true)
record('no MCP toolsets', pass.auditManifest.noMcpToolsets === true)
record('pass produces audit manifest', Boolean(pass.auditManifest))
record('result non-runnable', pass.runnableNow === false)
const source = await fs.readFile(modulePath, 'utf8')
record('no child_process strings', !source.includes('child_process'))
record('no process.env strings', !source.includes('process.env'))
record('no network runtime strings', !source.includes('http:') && !source.includes('https:') && !source.includes('fetch(') && !source.includes('dns'))
const parsed = mod.parseHermesWrapperCommandBuildResult(mod.serializeHermesWrapperCommandBuildResult(pass))
record('serialize parse ok', parsed.status === pass.status)
console.log(JSON.stringify({ ok: true, checks: checks.length }, null, 2))
