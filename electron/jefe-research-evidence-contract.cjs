const crypto = require('crypto')
const { canonical } = require('./jefe-context-package-contract.cjs')
const { receipt: providerReceipt, safeResearchText } = require('./jefe-research-contract.cjs')
const { safeUrl } = require('./jefe-research-provider-policy.cjs')

const STATES = Object.freeze(['reference_only', 'retrieved_untrusted', 'candidate', 'needs_corroboration', 'accepted_for_context', 'rejected', 'contradicted', 'stale', 'requires_human'])

class ResearchEvidenceContractError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function fail(code, message) {
  throw new ResearchEvidenceContractError(code, message)
}

function digest(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex')
}

function verifiedReceipt(request, value) {
  if (!request || !value || typeof value !== 'object' || Array.isArray(value)) fail('INVALID_EVIDENCE_CORRELATION', 'Evidencia no correlacionada.')
  const raw = {}
  for (const [key, item] of Object.entries(value)) if (!['schemaVersion', 'receiptId', 'classification', 'receivedAt'].includes(key)) raw[key] = item
  let rebuilt
  try { rebuilt = providerReceipt(raw, request, value.receivedAt) } catch { fail('INVALID_EVIDENCE_CORRELATION', 'Evidencia no correlacionada.') }
  if (canonical(rebuilt) !== canonical(value)) fail('INVALID_EVIDENCE_CORRELATION', 'Evidencia no correlacionada.')
  return rebuilt
}

function candidate({ request, receipt, claim, actor = 'hermes', now }) {
  const safeReceipt = verifiedReceipt(request, receipt)
  if (safeReceipt.researchRequestId !== request.researchRequestId || safeReceipt.providerType !== request.providerType || !['received', 'partial'].includes(safeReceipt.status)) fail('INVALID_EVIDENCE_CORRELATION', 'Evidencia no correlacionada.')
  if (!['hermes', 'scout'].includes(actor)) fail('INVALID_EVIDENCE', 'Evidencia invalida.')
  let safeClaim
  try { safeClaim = safeResearchText(claim, { max: 500 }) } catch { fail('INVALID_EVIDENCE', 'Evidencia invalida.') }
  const record = {
    schemaVersion: 'jefe-research-evidence/v1',
    researchRequestId: request.researchRequestId,
    receiptId: safeReceipt.receiptId,
    claim: safeClaim,
    claimKind: 'claim',
    source: safeReceipt.url || 'controlled_provider_receipt',
    providerType: safeReceipt.providerType,
    contentHash: safeReceipt.contentHash,
    receiptStatus: safeReceipt.status,
    actor,
    authority: 'technical_result',
    provenance: 'supervised_research_evidence_candidate',
    timestamp: now,
    freshness: 'current_at_receipt',
    state: 'candidate',
    classification: safeReceipt.classification,
    corroborations: [],
    contradictions: [],
    limits: safeReceipt.consumed || {},
  }
  record.evidenceId = `evidence-${digest({ request: record.researchRequestId, receipt: record.receiptId, claim: record.claim }).slice(0, 32)}`
  return record
}

function reference({ request, url, claim, now }) {
  if (!request || typeof url !== 'string') fail('INVALID_EVIDENCE', 'Referencia invalida.')
  let safeClaim
  let safeSource
  try { safeClaim = safeResearchText(claim, { max: 500 }) } catch { fail('INVALID_EVIDENCE', 'Referencia invalida.') }
  try { safeSource = safeUrl(url) } catch { fail('INVALID_EVIDENCE', 'Referencia invalida.') }
  return {
    schemaVersion: 'jefe-research-evidence/v1',
    evidenceId: `evidence-${digest({ request: request.researchRequestId, url: safeSource, claim: safeClaim }).slice(0, 32)}`,
    researchRequestId: request.researchRequestId,
    claim: safeClaim,
    claimKind: 'reference',
    source: safeSource,
    actor: 'scout',
    authority: 'agent_inference',
    provenance: 'supervised_research_reference',
    timestamp: now,
    freshness: 'unknown',
    state: 'reference_only',
    classification: 'UNTRUSTED_EXTERNAL_CONTENT',
    corroborations: [],
    contradictions: [],
    limits: {},
  }
}

module.exports = { STATES, ResearchEvidenceContractError, candidate, reference }
