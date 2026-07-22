import { FACTORY_HERMES_RESEARCH_RESULT_INGESTION_KIND, FACTORY_HERMES_RESEARCH_RESULT_INGESTION_VERSION } from './hermes-research-result-ingestion.defaults.ts'
import type { FactoryHermesResearchResultIngestionInput, FactoryHermesResearchResultIngestionResult, FactoryHermesResearchResultIngestionValidationResult } from './hermes-research-result-ingestion.types.ts'

const secretish = /password|secret|token|api[_-]?key|bearer|BEGIN [A-Z ]*PRIVATE KEY/iu
export function validateFactoryHermesResearchResultIngestionInput(input: FactoryHermesResearchResultIngestionInput): FactoryHermesResearchResultIngestionValidationResult {
  const errors: string[] = []; const warnings: string[] = []
  if (!input.ingestedAt) errors.push('ingestedAt is required.')
  if (!input.ingestedBy) errors.push('ingestedBy is required.')
  if (!input.adapterResult) errors.push('adapterResult is required.')
  if (secretish.test(JSON.stringify({ ingestedBy: input.ingestedBy, ingestionNotes: input.ingestionNotes }))) errors.push('Input appears to contain a secret.')
  return { ok: errors.length === 0, errors, warnings }
}
export function validateFactoryHermesResearchResultIngestionResult(result: FactoryHermesResearchResultIngestionResult): FactoryHermesResearchResultIngestionValidationResult {
  const errors: string[] = []; const warnings: string[] = []
  if (result.ingestionKind !== FACTORY_HERMES_RESEARCH_RESULT_INGESTION_KIND) errors.push('Invalid kind.')
  if (result.ingestionVersion !== FACTORY_HERMES_RESEARCH_RESULT_INGESTION_VERSION) errors.push('Invalid version.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status === 'ingested') {
    if (!result.researchResultIngestionReceipt) errors.push('Receipt is required.')
    if (!result.hermesResearchResultIngestionRecord) errors.push('Record is required.')
    if (!['controlled_adapter_block', 'help_probe_result', 'controlled_failure', 'not_research_result'].includes(result.classification)) errors.push('Classification must be controlled.')
    if (result.researchResultIngestionReceipt?.approvedNextGate !== 'Factory Hermes Research JEFE Review Gate v1') errors.push('Next gate must be Research JEFE Review.')
    if (result.canProceedToResearchJefeReview !== true) errors.push('canProceedToResearchJefeReview must be true.')
  }
  if (result.canTreatAsResearchResult !== false || result.canUseFindings !== false || result.canExecuteHermes !== false || result.canRunHermesScripts !== false || result.canUseNetwork !== false || result.canUseCredentials !== false || result.canCallModels !== false || result.canMutateProjectFiles !== false || result.canDeploy !== false) errors.push('Unsafe capabilities must be false.')
  const actions = result.researchResultIngestionReceipt?.notAuthorizedActions || []
  for (const action of ['execute_hermes_now', 'retry_adapter_now', 'materialize_entrypoint_now', 'treat_as_research_result']) if (!actions.includes(action)) errors.push(`Missing notAuthorizedAction: ${action}`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  return { ok: errors.length === 0, errors, warnings }
}
