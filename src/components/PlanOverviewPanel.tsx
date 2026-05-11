import type { ReactNode } from 'react'

import {
  DisclosurePanel,
  MetricCard,
  ResultSectionCard,
  ResultStatusBadge,
  type AppIconName,
  type MetricTone,
} from './AppUiPrimitives'

const iconCycle: AppIconName[] = ['plan', 'projects', 'brain', 'workspace', 'next', 'memory', 'flow', 'goal']

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
  const leadMetrics = metrics.slice(0, 3)
  const supportMetrics = metrics.slice(3)

  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_24%),radial-gradient(circle_at_72%_15%,rgba(167,139,250,0.1),transparent_18%),linear-gradient(180deg,rgba(9,17,32,0.96),rgba(8,15,28,0.9))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <ResultStatusBadge label={title} tone="sky" />
              <ResultStatusBadge label="Plan ejecutivo" tone="violet" />
            </div>
            <div className="rounded-[28px] border border-white/8 bg-slate-950/55 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Decision principal
              </div>
              <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-100">
                {instruction}
              </div>
              <div className="mt-3 text-xs leading-5 text-slate-400">{helperText}</div>
            </div>
            <div className="grid gap-3 xl:grid-cols-3">
              {leadMetrics.map((metric, index) => (
                <MetricCard
                  key={`${metric.label}-${metric.value}`}
                  label={metric.label}
                  value={metric.value}
                  detail={metric.detail}
                  tone={metric.tone}
                  icon={metric.icon || iconCycle[index] || 'plan'}
                  emphasis={index === 0 ? 'hero' : 'compact'}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <ResultSectionCard
              title="Siguiente accion"
              description="El CTA principal domina. Todo lo demas acompana."
              icon="next"
              badge="Accion"
              tone="sky"
            >
              <div className="grid gap-2">
                {primaryAction}
                {secondaryActions}
              </div>
            </ResultSectionCard>

            {callout ? (
              <ResultSectionCard
                title="Riesgos y restricciones"
                description="Solo lo que importa para decidir antes de ejecutar."
                icon="approval"
                badge="Atencion"
                tone="amber"
              >
                {callout}
              </ResultSectionCard>
            ) : null}
          </div>
        </div>
      </article>

      {supportMetrics.length > 0 ? (
        <DisclosurePanel
          title="Ver contexto ampliado del plan"
          description="Ruta, memoria, alcance y otros datos de soporte."
          icon="plan"
          badge={`${supportMetrics.length} items`}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {supportMetrics.map((metric, index) => (
              <MetricCard
                key={`${metric.label}-${metric.value}`}
                label={metric.label}
                value={metric.value}
                detail={metric.detail}
                tone={metric.tone}
                icon={metric.icon || iconCycle[(index + leadMetrics.length) % iconCycle.length]}
              />
            ))}
          </div>
        </DisclosurePanel>
      ) : null}

      {technicalDetails ? (
        <details className="rounded-[28px] border border-white/10 bg-slate-950/58 p-5">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100">
            Ver detalle tecnico del plan
          </summary>
          <div className="mt-4 space-y-4">{technicalDetails}</div>
        </details>
      ) : null}
    </div>
  )
}
