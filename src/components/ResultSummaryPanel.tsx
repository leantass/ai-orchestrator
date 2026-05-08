import type { ReactNode } from 'react'

import {
  ResultKeyValueGrid,
  ResultSectionCard,
  ResultStatusBadge,
  type MetricTone,
} from './AppUiPrimitives'

export function ResultSummaryPanel({
  statusLabel,
  statusTone,
  statusDetail,
  summaryItems,
  summaryText,
  nextStepItems,
  actions,
  technicalSections,
}: {
  statusLabel: string
  statusTone: MetricTone
  statusDetail: string
  summaryItems: Array<{
    label: string
    value: string
    detail?: string
  }>
  summaryText: string
  nextStepItems: Array<{
    title: string
    detail: string
  }>
  actions?: ReactNode
  technicalSections?: ReactNode
}) {
  return (
    <div className="space-y-4">
      <ResultSectionCard
        title="Resultado operativo"
        description="Lectura ejecutiva del cierre, con foco en estado, salida y siguiente fase segura."
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <ResultStatusBadge label={statusLabel} tone={statusTone} />
              <div className="text-sm leading-6 text-slate-300">{statusDetail}</div>
            </div>
            <div className="mt-4 whitespace-pre-wrap break-words rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-slate-100">
              {summaryText}
            </div>
          </div>
          {actions ? <div className="grid gap-2 xl:min-w-[240px]">{actions}</div> : null}
        </div>

        <div className="mt-4">
          <ResultKeyValueGrid items={summaryItems} />
        </div>
      </ResultSectionCard>

      <ResultSectionCard
        title="Próxima fase segura"
        description="Qué conviene revisar o preparar después del cierre actual."
      >
        <div className="grid gap-2">
          {nextStepItems.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
            >
              <div className="text-sm font-medium leading-6 text-slate-100">{item.title}</div>
              <div className="text-xs leading-5 text-slate-400">{item.detail}</div>
            </div>
          ))}
        </div>
      </ResultSectionCard>

      {technicalSections ? (
        <details className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100">
            Ver detalle técnico del resultado
          </summary>
          <div className="mt-4 space-y-4">{technicalSections}</div>
        </details>
      ) : null}
    </div>
  )
}
