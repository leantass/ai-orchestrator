import type { FactoryMemoryWriteApprovalResult, FactoryMemoryWriteApprovalSummary } from './memory-write-approval.types.ts'

export function serializeFactoryMemoryWriteApprovalResult(result: FactoryMemoryWriteApprovalResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryMemoryWriteApprovalResult(json: string): FactoryMemoryWriteApprovalResult { return JSON.parse(json) as FactoryMemoryWriteApprovalResult }
export function summarizeFactoryMemoryWriteApprovalResult(result: FactoryMemoryWriteApprovalResult): FactoryMemoryWriteApprovalSummary { return structuredClone(result.summary) }
