import type { ReactNode } from 'react'

import {
  MetricCard,
  ResultSectionCard,
  ResultStatusBadge,
  SurfaceHeaderTag,
  type AppIconName,
  type MetricTone,
} from './AppUiPrimitives'

const summaryIcons: AppIconName[] = [
  'result',
  'folder',
  'build',
  'runtime',
  'approval',
  'activity',
  'files',
  'next',
  'status',
]

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
  const heroItems = summaryItems.slice(0, 4)
  const supportItems = summaryItems.slice(4)

  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_24%),radial-gradient(circle_at_72%_15%,rgba(167,139,250,0.12),transparent_18%),linear-gradient(180deg,rgba(9,17,32,0.96),rgba(8,15,28,0.9))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <ResultStatusBadge label={statusLabel} tone={statusTone} />
              <SurfaceHeaderTag>Cierre ejecutivo</SurfaceHeaderTag>
            </div>
            <div className="rounded-[28px] border border-white/8 bg-slate-950/55 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Resumen operativo
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-300">{statusDetail}</div>
              <div className="mt-4 whitespace-pre-wrap break-words rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-slate-100">
                {summaryText}
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              {heroItems.map((item, index) => (
                <MetricCard
                  key={`${item.label}-${item.value}`}
                  label={item.label}
                  value={item.value}
                  detail={item.detail}
                  icon={summaryIcons[index] || 'status'}
                  tone={index === 0 ? statusTone : index === 1 ? 'sky' : 'default'}
                  emphasis={index < 2 ? 'hero' : 'compact'}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <ResultSectionCard
              title="Puesto de cierre"
              description="Siguiente fase segura, salida visible y detalle tecnico al alcance del operador."
              icon="next"
              badge="Accion"
              tone="sky"
            >
              <div className="grid gap-2">{actions}</div>
            </ResultSectionCard>

            <ResultSectionCard
              title="Proxima fase segura"
              description="Recomendaciones y pasos posteriores presentados como tablero de salida."
              icon="result"
              badge={`${nextStepItems.length}`}
            >
              <div className="grid gap-3">
                {nextStepItems.map((item, index) => (
                  <div
                    key={item.title}
                    className="rounded-[22px] border border-white/8 bg-slate-950/50 px-4 py-4"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="mt-2 text-sm font-semibold leading-6 text-slate-100">
                      {item.title}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</div>
                  </div>
                ))}
              </div>
            </ResultSectionCard>
          </div>
        </div>
      </article>

      {supportItems.length > 0 ? (
        <ResultSectionCard
          title="Lectura ejecutiva"
          description="Artefactos, validaciones, readiness y siguiente accion sin ruido tecnico."
          icon="status"
          badge={`${supportItems.length} senales`}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {supportItems.map((item, index) => (
              <MetricCard
                key={`${item.label}-${item.value}`}
                label={item.label}
                value={item.value}
                detail={item.detail}
                icon={summaryIcons[index + heroItems.length] || 'status'}
                tone={index === 0 ? 'sky' : index === 1 ? 'violet' : 'default'}
              />
            ))}
          </div>
        </ResultSectionCard>
      ) : null}

      {technicalSections ? (
        <details className="rounded-[30px] border border-white/10 bg-slate-950/58 p-5">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100">
            Ver detalle tecnico del resultado
          </summary>
          <div className="mt-4 space-y-4">{technicalSections}</div>
        </details>
      ) : null}
    </div>
  )
}
