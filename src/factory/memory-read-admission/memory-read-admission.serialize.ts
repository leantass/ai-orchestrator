import type { FactoryMemoryReadAdmissionResult, FactoryMemoryReadAdmissionSummary } from './memory-read-admission.types.ts'
export function serializeFactoryMemoryReadAdmissionResult(result: FactoryMemoryReadAdmissionResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryMemoryReadAdmissionResult(json: string): FactoryMemoryReadAdmissionResult { return JSON.parse(json) as FactoryMemoryReadAdmissionResult }
export function summarizeFactoryMemoryReadAdmissionResult(result: FactoryMemoryReadAdmissionResult): FactoryMemoryReadAdmissionSummary { return structuredClone(result.summary) }
