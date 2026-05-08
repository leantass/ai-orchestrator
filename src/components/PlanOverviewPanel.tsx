import type { ReactNode } from 'react'

import {
  DashboardIcon,
  MetricCard,
  ResultSectionCard,
  ResultStatusBadge,
  type AppIconName,
  type MetricTone,
} from './AppUiPrimitives'

const iconCycle: AppIconName[] = ['plan', 'projects', 'brain', 'workspace', 'next', 'memory']

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
    icon?: AppIconName
  }>
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  callout?: ReactNode
  technicalDetails?: ReactNode
}) {
  const heroMetrics = metrics.slice(0, 3)
  const supportMetrics = metrics.slice(3)

  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_25%),linear-gradient(180deg,rgba(9,17,32,0.94),rgba(8,15,28,0.88))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <ResultStatusBadge label={title} tone="sky" />
              <ResultStatusBadge label="Dashboard ejecutivo" tone="violet" />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{helperText}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {secondaryActions}
            {primaryAction}
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="rounded-[26px] border border-white/8 bg-slate-950/52 p-4">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/12 text-sky-100">
                <DashboardIcon name="plan" className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Instruccion activa
                </div>
                <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-100">
                  {instruction}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {heroMetrics.map((metric, index) => (
              <MetricCard
                key={`${metric.label}-${metric.value}`}
                label={metric.label}
                value={metric.value}
                detail={metric.detail}
                tone={metric.tone}
                icon={metric.icon || iconCycle[index] || 'plan'}
              />
            ))}
          </div>
        </div>
      </article>

      {supportMetrics.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {supportMetrics.map((metric, index) => (
            <MetricCard
              key={`${metric.label}-${metric.value}`}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
              tone={metric.tone}
              icon={metric.icon || iconCycle[(index + heroMetrics.length) % iconCycle.length]}
            />
          ))}
        </div>
      ) : null}

      {callout ? (
        <ResultSectionCard
          title="Riesgos, restricciones y contexto"
          description="Esta lectura pone el foco en alcance, advertencias y apoyos reales antes de ejecutar."
          icon="approval"
        >
          {callout}
        </ResultSectionCard>
      ) : null}

      {technicalDetails ? (
        <details className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100">
            Ver detalle tecnico del plan
          </summary>
          <div className="mt-4 space-y-4">{technicalDetails}</div>
        </details>
      ) : null}
    </div>
  )
}
