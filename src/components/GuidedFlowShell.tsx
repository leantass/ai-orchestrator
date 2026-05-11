import type { ReactNode } from 'react'

import {
  DisclosurePanel,
  InlineHint,
  MetricCard,
  ProgressMeter,
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
  const completedSteps = progressItems.filter((item) => item.status === 'complete').length
  const progressPercent =
    progressItems.length > 0 ? Math.round((completedSteps / progressItems.length) * 100) : 0
  const visibleMetrics = overviewMetrics.slice(0, 2)
  const supportMetrics = overviewMetrics.slice(2)

  return (
    <section className="space-y-4">
      <article className="overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_24%),radial-gradient(circle_at_70%_18%,rgba(167,139,250,0.12),transparent_20%),linear-gradient(180deg,rgba(6,11,22,0.98),rgba(8,15,28,0.9))] p-5 shadow-[0_34px_100px_rgba(0,0,0,0.4)] backdrop-blur sm:p-6">
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/78">
                {`Paso ${stepIndex + 1} de ${totalSteps}`}
              </div>
              <SurfaceHeaderTag>Flujo guiado</SurfaceHeaderTag>
            </div>
            <div className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-[2.35rem]">
              {title}
            </div>
            <p className="max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
            <InlineHint
              label={actionSummaryLabel}
              detail={actionSummaryDetail}
              tone="sky"
              icon="next"
            />
            <div className="grid gap-3 lg:grid-cols-2">
              {visibleMetrics.map((metric, index) => (
                <MetricCard
                  key={`${metric.label}-${metric.value}`}
                  label={metric.label}
                  value={metric.value}
                  detail={metric.detail}
                  tone={metric.tone}
                  icon={metric.icon}
                  emphasis={index === 0 ? 'hero' : 'compact'}
                  progress={index === 0 ? progressPercent : undefined}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Progreso visible
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-100">
                    {completedSteps} de {totalSteps} pasos listos
                  </div>
                </div>
                <SurfaceHeaderTag>{`${stepIndex + 1}/${totalSteps}`}</SurfaceHeaderTag>
              </div>
              <div className="mt-4">
                <ProgressMeter
                  label="Circuito guiado"
                  value={progressPercent}
                  tone={progressPercent >= 50 ? 'emerald' : 'sky'}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {statusBadges.slice(0, 3).map((badge) => (
                  <ResultStatusBadge
                    key={`${badge.label}-${badge.value}`}
                    label={`${badge.label}: ${badge.value}`}
                    tone={badge.tone}
                  />
                ))}
              </div>
            </div>

            {(supportMetrics.length > 0 || statusBadges.length > 3) ? (
              <DisclosurePanel
                title="Ver contexto del circuito"
                description="Metricas y estados secundarios quedan a un clic."
                icon="services"
                badge={`${supportMetrics.length + Math.max(statusBadges.length - 3, 0)} items`}
              >
                <div className="space-y-4">
                  {supportMetrics.length > 0 ? (
                    <div className="grid gap-3">
                      {supportMetrics.map((metric) => (
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
                  {statusBadges.length > 3 ? (
                    <div className="grid gap-2">
                      {statusBadges.slice(3).map((badge) => (
                        <div
                          key={`${badge.label}-${badge.value}`}
                          className="flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-slate-950/55 px-3 py-3"
                        >
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {badge.label}
                          </div>
                          <ResultStatusBadge label={badge.value} tone={badge.tone} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </DisclosurePanel>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <DisclosurePanel
            title="Ver recorrido completo"
            description="El mapa 01 a 07 sigue disponible, pero ya no compite con el foco principal."
            icon="guided"
            badge={`${completedSteps}/${totalSteps}`}
          >
            <StepProgress items={progressItems} />
          </DisclosurePanel>
        </div>
      </article>

      <div className="rounded-[32px] border border-white/10 bg-slate-950/74 p-4 shadow-[0_26px_90px_rgba(0,0,0,0.36)] backdrop-blur sm:p-6">
        {children}
      </div>

      <div className="rounded-[26px] border border-white/8 bg-slate-950/64 px-4 py-4 shadow-[0_16px_50px_rgba(0,0,0,0.28)] backdrop-blur sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <p className="text-sm leading-6 text-slate-400">{footerNote}</p>
          <div className={joinClasses('flex flex-wrap gap-3')}>{footerActions}</div>
        </div>
      </div>
    </section>
  )
}
