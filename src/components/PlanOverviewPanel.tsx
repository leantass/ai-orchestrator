import type { ReactNode } from 'react'

import { MetricCard, ResultStatusBadge, type MetricTone } from './AppUiPrimitives'

export function PlanOverviewPanel({
  title,
  helperText,
  instruction,
  metrics,
  primaryAction,
  secondaryActions,
  callout,
  technicalDetails,
}: {
  title: string
  helperText: string
  instruction: string
  metrics: Array<{
    label: string
    value: string
    detail?: string
    tone?: MetricTone
  }>
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  callout?: ReactNode
  technicalDetails?: ReactNode
}) {
  return (
    <div className="space-y-4">
      <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <ResultStatusBadge label={title} tone="sky" />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{helperText}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {secondaryActions}
            {primaryAction}
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-slate-100">
          {instruction}
        </div>
      </article>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard
            key={`${metric.label}-${metric.value}`}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
            tone={metric.tone}
          />
        ))}
      </div>

      {callout}

      {technicalDetails ? (
        <details className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100">
            Ver detalle técnico del plan
          </summary>
          <div className="mt-4 space-y-4">{technicalDetails}</div>
        </details>
      ) : null}
    </div>
  )
}
