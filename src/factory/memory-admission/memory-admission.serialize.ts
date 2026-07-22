import type { FactoryMemoryAdmissionResult, FactoryMemoryAdmissionSummary } from './memory-admission.types.ts'

export function serializeFactoryMemoryAdmissionResult(result: FactoryMemoryAdmissionResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryMemoryAdmissionResult(json: string): FactoryMemoryAdmissionResult { return JSON.parse(json) as FactoryMemoryAdmissionResult }
export function summarizeFactoryMemoryAdmissionResult(result: FactoryMemoryAdmissionResult): FactoryMemoryAdmissionSummary { return structuredClone(result.summary) }
