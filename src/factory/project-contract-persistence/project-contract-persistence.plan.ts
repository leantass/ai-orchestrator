import { FACTORY_PROJECT_CONTRACT_PERSISTENCE_KIND, FACTORY_PROJECT_CONTRACT_PERSISTENCE_VERSION, createFactoryProjectContractPersistencePolicy } from './project-contract-persistence.defaults.ts'
import { canonicalizeFactoryProjectContractForPersistence, createFactoryProjectContractFingerprint, createFactoryProjectContractIdempotencyKey } from './project-contract-persistence.canonicalize.ts'
import type { FactoryProjectContractAtomicWritePlan, FactoryProjectContractPersistenceCheck, FactoryProjectContractPersistenceInput, FactoryProjectContractPersistenceResult, FactoryProjectContractPersistenceTarget, FactoryProjectContractRollbackPlan } from './project-contract-persistence.types.ts'

const safeSegment = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'factory-project'
const isAbsolute = (value: string) => /^(?:[a-z]:[\\/]|[\\/]{1,2})/iu.test(value)
const hasTraversal = (value: string) => value.split(/[\\/]+/u).includes('..')
const check = (checkId: string, category: FactoryProjectContractPersistenceCheck['category'], passed: boolean, message: string): FactoryProjectContractPersistenceCheck => ({ checkId, category, passed, message })
const atomicWriteSteps: FactoryProjectContractAtomicWritePlan['steps'] = ['ensure_parent_directory', 'write_temp_file', 'validate_temp_payload', 'atomic_rename_temp_to_target', 'write_metadata', 'verify_readback']
const rollbackSteps: FactoryProjectContractRollbackPlan['steps'] = ['remove_temp_file', 'preserve_failed_payload_for_review', 'restore_previous_contract_if_backup_exists', 'mark_persistence_failed', 'require_human_review']

export function createFactoryProjectContractPersistencePlan(input: FactoryProjectContractPersistenceInput): FactoryProjectContractPersistenceResult {
  const value = structuredClone(input); createFactoryProjectContractPersistencePolicy(value.policy); const approval = value.approvalResult; const envelope = approval.approvedContractEnvelope; const draft = envelope?.contractDraft
  const root = value.persistenceRootSuggestion?.trim() || 'factory-project-contracts'; const namespace = value.storageNamespace?.trim() || 'factory-project-contracts'; const projectSegment = safeSegment(draft?.project.slug || draft?.project.projectId || approval.candidateId || 'factory-project')
  const targetPath = `${root}/${projectSegment}/factory-project-contract.v1.json`; const metadataPath = `${root}/${projectSegment}/factory-project-contract.v1.meta.json`
  const targetSafe = !isAbsolute(targetPath) && !hasTraversal(targetPath) && !isAbsolute(metadataPath) && !hasTraversal(metadataPath)
  const checks = [
    check('approved-decision', 'approval', approval.status === 'approved_candidate' && approval.decision === 'approve_contract_for_persistence_candidate', 'Approval must authorize a persistence candidate.'),
    check('approval-receipt', 'approval', Boolean(approval.approvalReceipt), 'Approval receipt is required.'),
    check('approved-envelope', 'envelope', Boolean(envelope && draft), 'Approved contract envelope and draft are required.'),
    check('contract-validation', 'validation', envelope?.validation.ok === true, 'Contract validation must pass.'),
    check('not-persisted', 'envelope', envelope?.persistenceStatus === 'not_persisted', 'Envelope must not already be persisted.'),
    check('safe-runtime-statuses', 'execution', Boolean(envelope && envelope.runtimeStatus === 'not_executable' && envelope.codexStatus === 'not_allowed' && envelope.repositoryStatus === 'not_created' && envelope.deployStatus === 'not_allowed'), 'Runtime, Codex, repository and deploy must remain disabled.'),
    check('safe-relative-target', 'target', targetSafe, 'Persistence targets must be relative and must not contain path traversal.'),
  ]
  const blockers = checks.filter((item) => !item.passed).map((item) => ({ blockerId: item.checkId, category: item.category, message: item.message }))
  const ready = blockers.length === 0 && Boolean(draft); const persistenceId = `factory-contract-persistence-${approval.approvalId}-${value.createdAt.replace(/[^0-9]/g, '')}`
  let target: FactoryProjectContractPersistenceTarget | undefined; let canonicalPayload; let fingerprint; let idempotencyKey; let atomicWritePlan; let rollbackPlan
  if (ready && draft) {
    target = { storageNamespace: namespace, targetPath, metadataPath, relative: true }; canonicalPayload = canonicalizeFactoryProjectContractForPersistence(draft); fingerprint = createFactoryProjectContractFingerprint(canonicalPayload)
    idempotencyKey = createFactoryProjectContractIdempotencyKey({ contractKind: canonicalPayload.contractKind, contractVersion: canonicalPayload.contractVersion, projectId: canonicalPayload.projectId, approvalId: approval.approvalId, fingerprint: fingerprint.value, targetPath })
    const suffix = fingerprint.value
    atomicWritePlan = { planId: `atomic-${persistenceId}`, targetPath, tempPath: `${targetPath}.${suffix}.tmp`, backupPath: `${targetPath}.backup`, lockPath: `${targetPath}.lock`, steps: atomicWriteSteps, notExecuted: true as const, filesystemWritePerformed: false as const, futureRuntimeAdapterRequired: true as const, humanApprovalRequiredBeforeExecution: true as const }
    rollbackPlan = { rollbackId: `rollback-${persistenceId}`, triggerConditions: ['temporary write failure', 'payload validation failure', 'atomic rename failure', 'readback mismatch'], steps: rollbackSteps, notExecuted: true as const, rollbackExecuted: false as const }
  }
  return { persistenceId, persistenceKind: FACTORY_PROJECT_CONTRACT_PERSISTENCE_KIND, persistenceVersion: FACTORY_PROJECT_CONTRACT_PERSISTENCE_VERSION, createdAt: value.createdAt, plannedBy: value.plannedBy, approvalId: approval.approvalId, compatibilityId: approval.compatibilityId, candidateId: approval.candidateId, contractProjectId: draft?.project.projectId ?? '', status: ready ? 'ready_for_runtime_persistence' : 'blocked', canPersistContract: ready, canExecuteCodex: false, canCreateProject: false, canCreateRepository: false, canDeploy: false, filesystemWritePerformed: false, canonicalPayload, fingerprint, idempotencyKey, target, atomicWritePlan, rollbackPlan, checks, blockers, warnings: [{ warningId: 'non-cryptographic-fingerprint', message: 'FNV-1a is not a cryptographic hash or security signature.' }], recommendedNextStep: ready ? 'Submit this non-executed plan to a future approved runtime persistence adapter; do not execute Codex.' : 'Resolve persistence planning blockers and repeat the gate.' }
}
