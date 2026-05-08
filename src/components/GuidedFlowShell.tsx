import type { ReactNode } from 'react'

import {
  InlineHint,
  MetricCard,
  ResultStatusBadge,
  SurfaceHeaderTag,
  type AppIconName,
  type MetricTone,
} from './AppUiPrimitives'
import { StepProgress, type StepProgressItem } from './StepProgress'

const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

export function GuidedFlowShell({
  stepIndex,
  totalSteps,
  title,
  description,
  statusBadges,
  actionSummaryLabel,
  actionSummaryDetail,
  progressItems,
  children,
  footerNote,
  footerActions,
  overviewMetrics = [],
}: {
  stepIndex: number
  totalSteps: number
  title: string
  description: string
  statusBadges: Array<{
    label: string
    value: string
    tone?: MetricTone
  }>
  actionSummaryLabel: string
  actionSummaryDetail: string
  progressItems: StepProgressItem[]
  children: ReactNode
  footerNote: string
  footerActions: ReactNode
  overviewMetrics?: Array<{
    label: string
    value: string
    detail?: string
    tone?: MetricTone
    icon?: AppIconName
  }>
}) {
  return (
    <section className="space-y-4">
      <article className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_26%),linear-gradient(180deg,rgba(6,11,22,0.96),rgba(8,15,28,0.9))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/78">
                {`Paso ${stepIndex + 1} de ${totalSteps}`}
              </div>
              <SurfaceHeaderTag>Flujo guiado</SurfaceHeaderTag>
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
              {title}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          </div>
          <div className="xl:max-w-[340px]">
            <InlineHint
              label={actionSummaryLabel}
              detail={actionSummaryDetail}
              tone="sky"
              icon="next"
            />
          </div>
        </div>

        {overviewMetrics.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {overviewMetrics.map((metric) => (
              <MetricCard
                key={`${metric.label}-${metric.value}`}
                label={metric.label}
                value={metric.value}
                detail={metric.detail}
                tone={metric.tone}
                icon={metric.icon}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[26px] border border-white/10 bg-slate-950/45 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Recorrido operativo
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  Siete pasos visibles, accionables y escaneables
                </div>
              </div>
              <SurfaceHeaderTag>{`${stepIndex + 1}/${totalSteps}`}</SurfaceHeaderTag>
            </div>
            <StepProgress items={progressItems} />
          </div>

          <div className="rounded-[26px] border border-white/10 bg-slate-950/45 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Estado del circuito
            </div>
            <div className="mt-3 grid gap-2">
              {statusBadges.map((badge) => (
                <div
                  key={`${badge.label}-${badge.value}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {badge.label}
                  </div>
                  <ResultStatusBadge label={badge.value} tone={badge.tone} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>

      <div className="rounded-[30px] border border-white/10 bg-slate-950/72 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur sm:p-6">
        {children}
      </div>

      <div className="rounded-[26px] border border-white/8 bg-slate-950/60 px-4 py-4 shadow-[0_16px_50px_rgba(0,0,0,0.28)] backdrop-blur sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <p className="text-sm leading-6 text-slate-400">{footerNote}</p>
          <div className={joinClasses('flex flex-wrap gap-3')}>{footerActions}</div>
        </div>
      </div>
    </section>
  )
}
