import type { ReactNode } from 'react'

import {
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
  const leadMetrics = metrics.slice(0, 4)
  const supportMetrics = metrics.slice(4)

  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_24%),radial-gradient(circle_at_72%_15%,rgba(167,139,250,0.12),transparent_18%),linear-gradient(180deg,rgba(9,17,32,0.96),rgba(8,15,28,0.9))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <ResultStatusBadge label={title} tone="sky" />
              <ResultStatusBadge label="Estacion de comando" tone="violet" />
            </div>
            <div className="rounded-[28px] border border-white/8 bg-slate-950/55 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Decisión clave
              </div>
              <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-100">
                {instruction}
              </div>
              <div className="mt-3 text-xs leading-5 text-slate-400">{helperText}</div>
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {leadMetrics.map((metric, index) => (
                <MetricCard
                  key={`${metric.label}-${metric.value}`}
                  label={metric.label}
                  value={metric.value}
                  detail={metric.detail}
                  tone={metric.tone}
                  icon={metric.icon || iconCycle[index] || 'plan'}
                  emphasis={index < 2 ? 'hero' : 'compact'}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <ResultSectionCard
              title="Puesto de mando"
              description="El CTA principal domina y el resto acompaña como decisión secundaria."
              icon="next"
              badge="Accion"
              tone="sky"
            >
              <div className="grid gap-2">
                {primaryAction}
                {secondaryActions}
              </div>
            </ResultSectionCard>

            {supportMetrics.length > 0 ? (
              <ResultSectionCard
                title="KPIs del plan"
                description="Alcance, ruta, memoria y restricciones resumidas en señales rápidas."
                icon="plan"
                badge={`${supportMetrics.length} items`}
              >
                <div className="grid gap-3">
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
              </ResultSectionCard>
            ) : null}
          </div>
        </div>
      </article>

      {callout ? (
        <ResultSectionCard
          title="Riesgos, restricciones y contexto"
          description="Esta lectura pone el foco en alcance, advertencias y apoyos reales antes de ejecutar."
          icon="approval"
          badge="Atencion"
          tone="amber"
        >
          {callout}
        </ResultSectionCard>
      ) : null}

      {technicalDetails ? (
        <details className="rounded-[30px] border border-white/10 bg-slate-950/58 p-5">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100">
            Ver detalle técnico del plan
          </summary>
          <div className="mt-4 space-y-4">{technicalDetails}</div>
        </details>
      ) : null}
    </div>
  )
}
