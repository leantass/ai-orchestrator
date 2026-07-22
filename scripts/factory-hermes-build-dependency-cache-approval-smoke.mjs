import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-build-dependency-cache-approval/index.cjs'
import { evaluateFactoryHermesBuildDependencyCacheApproval, parseFactoryHermesBuildDependencyCacheApprovalResult, serializeFactoryHermesBuildDependencyCacheApprovalResult, summarizeFactoryHermesBuildDependencyCacheApprovalResult, validateFactoryHermesBuildDependencyCacheApprovalInput, validateFactoryHermesBuildDependencyCacheApprovalResult } from '../src/factory/hermes-build-dependency-cache-approval/index.ts'

const { resolveFactoryHermesBuildDependencyCacheApprovalPaths, executeFactoryHermesBuildDependencyCacheApproval } = runtime
const paths = resolveFactoryHermesBuildDependencyCacheApprovalPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.planningResult), true) // 1
const planning = JSON.parse(readFileSync(paths.planningResult, 'utf8'))
assert.ok(planning) // 2
assert.equal(planning.status, 'plan_candidate_created') // 3
assert.ok(planning.missingBuildDependency.includes('setuptools')) // 4
assert.equal(planning.selectedMethodCandidate, 'uv_controlled_build_dependency_cache_prefetch') // 5
const input = { approvedAt: '2026-07-22T01:00:00.000Z', approvedBy: 'factory-hermes-build-dependency-cache-approval-smoke', humanApprovalRef: 'human-review/hermes-build-dependency-cache-approval-v1', networkRiskAcceptanceNotes: 'Approve future network use only inside Build Dependency Cache Runtime Adapter for controlled cache prefetch of setuptools>=77,<83; no credentials, no models, no Hermes, no materialization retry in this gate.', packageIndexPolicyNotes: 'Future runtime must derive allowed hosts from locked package URL/package index policy and reject wildcards.', hashVerificationPolicyNotes: 'Future runtime must record package version, URL/source record and hashes; cache must be verified before materialization retry.', buildDependencyCachePlanningResult: planning }
const result = await executeFactoryHermesBuildDependencyCacheApproval(input)
assert.equal(result.status, 'approved_for_runtime_candidate') // 7
assert.equal(result.decision, 'hermes_build_dependency_cache_approved_for_runtime_candidate') // 8
assert.ok(result.approvalReceipt) // 9
assert.ok(result.approvedBuildDependencyCacheRuntimeEnvelope) // 10
const env = result.approvedBuildDependencyCacheRuntimeEnvelope
assert.ok(env.missingBuildDependency.includes('setuptools')) // 11
assert.equal(env.lockedPackageName, 'setuptools') // 12
assert.ok(env.lockedPackageVersion === '81.0.0' || env.versionConstraint.includes('setuptools')) // 13
assert.ok(env.uvCacheRootRef.startsWith('.codex-temp')) // 14
assert.ok(env.metadataRootRef.startsWith('.codex-temp')) // 15
assert.equal(env.selectedMethodCandidate, 'uv_controlled_build_dependency_cache_prefetch') // 16
assert.equal(env.futureRuntimeMayUseNetworkForCachePrefetch, true) // 17
assert.equal(env.futureRuntimeNetworkMustBeDisabledAfterCache, true) // 18
assert.equal(env.futureMaterializationRuntimeMustRemainOffline, true) // 19
assert.equal(env.cacheAllowedNow, false) // 20
assert.equal(env.networkAllowedNow, false) // 21
assert.equal(result.canCacheBuildDependenciesNow, false) // 22
assert.equal(result.canEnableNetworkNow, false) // 23
assert.equal(result.canUseNetworkNow, false) // 24
assert.equal(result.canUseNetworkInFutureRuntime, true) // 25
assert.equal(result.canProceedToBuildDependencyCacheRuntime, true) // 26
assert.equal(result.canRetryMaterializationNow, false) // 27
assert.equal(result.canExecuteHermes, false) // 28
assert.equal(result.canUseCredentials, false) // 29
assert.equal(result.canCallModels, false) // 30
for (const action of ['cache_build_dependency_now', 'enable_network_now', 'execute_uv_now', 'execute_uv_sync_now', 'execute_pip_now', 'execute_setup_py_now']) assert.ok(result.approvalReceipt.notAuthorizedActions.includes(action)) // 31-36
assert.equal(evaluateFactoryHermesBuildDependencyCacheApproval({ ...input, humanApprovalRef: undefined }).status, 'human_review_required') // 37
assert.equal(evaluateFactoryHermesBuildDependencyCacheApproval({ ...input, networkRiskAcceptanceNotes: undefined }).decision, 'blocked_missing_network_risk_acceptance') // 38
assert.equal(evaluateFactoryHermesBuildDependencyCacheApproval({ ...input, hashVerificationPolicyNotes: undefined }).decision, 'blocked_missing_hash_policy') // 39
assert.equal(evaluateFactoryHermesBuildDependencyCacheApproval({ ...input, buildDependencyCachePlanningResult: { ...planning, selectedMethodCandidate: 'pip_download_or_install_setuptools', hermesBuildDependencyCachePlanCandidate: { ...planning.hermesBuildDependencyCachePlanCandidate, selectedMethodCandidate: 'pip_download_or_install_setuptools' } } }).decision, 'blocked_unsafe_cache_method') // 40
assert.equal(validateFactoryHermesBuildDependencyCacheApprovalInput(input).ok, true) // 41
assert.equal(validateFactoryHermesBuildDependencyCacheApprovalResult(result).ok, true) // 42
assert.equal(parseFactoryHermesBuildDependencyCacheApprovalResult(serializeFactoryHermesBuildDependencyCacheApprovalResult(result)).approvalId, result.approvalId) // 43
assert.equal(/full pyproject|full uv\.lock|full setup\.py|cache listing|BEGIN|password|secret|api[_-]?key|bearer|process\.env/iu.test(JSON.stringify(summarizeFactoryHermesBuildDependencyCacheApprovalResult(result))), false) // 44
assert.equal(existsSync(paths.approvalResult), true) // 45
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 46
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 47
assert.ok(/Build Dependency Cache Runtime Adapter/iu.test(result.recommendedNextStep) && !/cache directo|cache now|enable network now/iu.test(result.recommendedNextStep)) // 48

console.log(JSON.stringify({ ok: true, checks: 48, status: result.status, decision: result.decision, missingBuildDependency: result.missingBuildDependency, lockedPackageVersion: result.lockedPackageVersion, selectedMethodCandidate: result.selectedMethodCandidate, canProceedToBuildDependencyCacheRuntime: result.canProceedToBuildDependencyCacheRuntime, canCacheBuildDependenciesNow: result.canCacheBuildDependenciesNow, canUseNetworkNow: result.canUseNetworkNow, canUseNetworkInFutureRuntime: result.canUseNetworkInFutureRuntime }, null, 2))
