import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanning } from '../electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-planning/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-planning-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-safe-command-shape-proof-planning-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const packageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const lockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const forbiddenTerms = ['hermes.exe --oneshot', 'api key value', 'OPENAI_API_KEY=', 'sk-', 'BEGIN PRIVATE KEY', 'prompt content', 'research findings']
const requiredCandidates = ['direct_cli_with_explicit_verified_config', 'wrapper_managed_command_with_fail_closed_preflight', 'internal_api_empty_tool_registry', 'non_network_dry_run_or_parse_only_probe', 'direct_cli_omit_toolsets', 'direct_cli_no_mcp_only', 'direct_cli_no_toolsets_text_only', 'modify_hermes_source_to_add_no_tool_mode', 'keep_execution_blocked']
const requiredRisks = ['proof_planning_confused_with_proof', 'proof_confused_with_execution', 'static_source_read_misses_runtime_defaults', 'parse_only_mode_actually_reads_credentials', 'dry_run_mode_actually_uses_network', 'command_shape_falls_back_to_defaults', 'wrapper_boundary_overtrusted', 'hidden_mcp_or_toolsets_enabled', 'prompt_passed_before_no_tool_proof', 'credential_read_before_no_tool_proof', 'network_model_started_before_no_tool_proof', 'proof_artifact_overclaims_runtime_safety', 'future_execution_retries_without_new_approval', 'findings_used_without_successful_review']
const checks = []

function record(name, value) {
  assert.equal(Boolean(value), true, name)
  checks.push(name)
}

async function readJson(file) {
  record(`${path.basename(file)} exists`, fsSync.existsSync(file))
  return JSON.parse(await fs.readFile(file, 'utf8'))
}

async function hash(file) {
  return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase()
}

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof-planning', 'index.ts')).href)
const review = await readJson(path.join(installRoot, 'controlled-research-runtime-execution-review-result.json'))
const execution = await readJson(path.join(installRoot, 'controlled-research-runtime-execution-result.json'))
const selection = await readJson(path.join(installRoot, 'runtime-selection-decision-result.json'))
record('review accepted blocked execution', review.status === 'controlled_research_runtime_execution_review_completed')
record('review allows proof planning', review.canProceedToSafeCommandShapeProofPlanning === true)
record('execution blocked before runtime', execution.status === 'controlled_research_runtime_execution_blocked')
record('execution did not prove command shape', execution.finalRuntimeGuardDecision?.safeCommandShapeProven === false)
record('execution safe command blocker present', execution.finalRuntimeGuardDecision?.blockReasons?.includes('safe_command_shape_not_proven'))
record('selection openai', (selection.selectedProvider?.providerId ?? selection.runtimeSelectionDecisionRecord?.provider?.providerId) === 'openai')
record('selection gpt-4o-mini', (selection.selectedModel?.modelId ?? selection.runtimeSelectionDecisionRecord?.model?.modelId) === 'gpt-4o-mini')
record('selection credential ref only', (selection.selectedCredentialRef?.credentialRefName ?? selection.runtimeSelectionDecisionRecord?.credential?.credentialRefName) === 'OPENAI_API_KEY')
record('selection host api.openai.com', (selection.selectedNetworkHosts?.selectedHosts?.[0] ?? selection.runtimeSelectionDecisionRecord?.network?.selectedHosts?.[0]) === 'api.openai.com')

const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningInput({ plannedAt: '2026-07-24T15:30:00.000Z', plannedBy: 'smoke', executionReviewResult: review })
record('input validation ok', inputValidation.ok)
const result = await executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanning()
const resultValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningResult(result)
record('result validation ok', resultValidation.ok)
record('result artifact exists', fsSync.existsSync(resultPath))
record('status created', result.status === 'safe_command_shape_proof_plan_created')
record('decision created', result.decision === 'hermes_safe_command_shape_proof_plan_created_for_approval')
record('proof planning candidate created', result.proofPlanningStatus === 'plan_candidate_created')
record('selected wrapper strategy', result.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets')

for (const key of ['sourceInspectionPlanned', 'commandShapeCandidateSetBuilt', 'staticProofPlanBuilt', 'noDefaultsProofPlanBuilt', 'wrapperBoundaryProofPlanBuilt', 'nonNetworkDryRunProofPlanBuilt', 'failClosedCommandConstructionPlanBuilt', 'safeCommandShapeProofApprovalEnvelopeBuilt']) record(`${key} true`, result[key] === true)
for (const key of ['safeCommandShapeProofAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseApprovedNow', 'canProceedToSafeCommandShapeProof', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
record('approval can proceed', result.canProceedToSafeCommandShapeProofApproval === true)
record('source plan present', result.safeCommandShapeSourceInspectionPlan?.sourceInspectionPlanned === true)
record('static proof plan present', result.staticCommandShapeProofPlan?.futureStaticProofRequiresApproval === true)
record('no defaults plan present', result.noDefaultsAndNoToolsetsProofPlan?.futureProofMustShowConfigWinsOverDefaults === true)
record('wrapper boundary plan present', result.wrapperBoundaryCommandProofPlan?.wrapperBoundaryRequired === true)
record('dry run plan present', result.nonNetworkDryRunProofPlan?.futureDryRunRequiresApproval === true)
record('fail closed plan present', result.failClosedCommandConstructionPlan?.failClosedRequired === true)
record('approval envelope present', result.safeCommandShapeProofApprovalEnvelope?.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets')

const candidateMap = new Map(result.safeCommandShapeCandidateSet.candidates.map((candidate) => [candidate.strategyId, candidate.status]))
for (const candidateId of requiredCandidates) record(`candidate ${candidateId}`, candidateMap.has(candidateId))
record('preferred candidate status', candidateMap.get('wrapper_managed_command_with_fail_closed_preflight') === 'preferred_planning_candidate')
record('omit toolsets forbidden', candidateMap.get('direct_cli_omit_toolsets') === 'forbidden')
record('no mcp only forbidden', candidateMap.get('direct_cli_no_mcp_only') === 'forbidden')
record('text only forbidden', candidateMap.get('direct_cli_no_toolsets_text_only') === 'forbidden')
record('source mutation forbidden initially', candidateMap.get('modify_hermes_source_to_add_no_tool_mode') === 'forbidden_initially')
record('blocked fallback present', candidateMap.get('keep_execution_blocked') === 'safe_fallback')
const riskIds = result.safeCommandShapeProofRiskRegister.risks.map((risk) => risk.riskId)
for (const riskId of requiredRisks) record(`risk ${riskId}`, riskIds.includes(riskId))
record('all risks block runtime', result.safeCommandShapeProofRiskRegister.risks.every((risk) => risk.blocksRuntimeExecution === true))
record('checks passed', result.checks.every((check) => check.passed))
record('no blockers', result.blockers.length === 0)
record('warnings populated', result.warnings.length >= requiredRisks.length)

const serialized = gate.serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningResult(result)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningResult(serialized)
const summary = gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningResult(parsed)
record('serialize parse stable', parsed.status === result.status && parsed.decision === result.decision)
record('summary safe', summary.canRunResearchNow === false && summary.canProceedToSafeCommandShapeProofApproval === true)
for (const term of forbiddenTerms) record(`summary excludes ${term}`, !JSON.stringify(summary).includes(term))
record('package hash intact', await hash('package.json') === packageHash)
record('lock hash intact', await hash('package-lock.json') === lockHash)
record('docs exist', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_PLANNING_GATE_V1.md')))
record('no hermes execution proof flag', result.safeCommandShapeProofPlanningReceipt.proofExecuted === false)
record('no credential approval flag', result.safeCommandShapeProofApprovalEnvelope.flags.credentialAccessAllowedNow === false)
record('no network approval flag', result.safeCommandShapeProofApprovalEnvelope.flags.networkAllowedNow === false)
record('no model approval flag', result.safeCommandShapeProofApprovalEnvelope.flags.modelCallsAllowedNow === false)
record('no toolset approval flag', result.safeCommandShapeProofApprovalEnvelope.flags.toolsetEnablementAllowedNow === false)
record('no findings approval flag', result.safeCommandShapeProofApprovalEnvelope.flags.findingsUseApprovedNow === false)

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Safe Command Shape Proof Planning Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Proof planning status: ${result.proofPlanningStatus}`,
  `Selected wrapper strategy: ${result.selectedWrapperStrategy}`,
  `Can proceed to safe command shape proof approval: ${result.canProceedToSafeCommandShapeProofApproval}`,
  `Can proceed to safe command shape proof: ${result.canProceedToSafeCommandShapeProof}`,
  `Can proceed to controlled research runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`,
  `Can run research now: ${result.canRunResearchNow}`,
  `Checks: ${checks.length}`,
  '',
  'No proof, Hermes execution, wrapper execution, adapter execution, prompt passing, model call, network use, DNS resolution, endpoint probing, credential access, .env read, toolset enablement, output ingestion, findings use, uv, pip, python, setup.py, package mutation, commit, or push was performed.',
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
