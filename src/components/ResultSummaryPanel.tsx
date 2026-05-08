import type { ReactNode } from 'react'

import {
  ResultKeyValueGrid,
  ResultSectionCard,
  ResultStatusBadge,
  SurfaceHeaderTag,
  type AppIconName,
  type MetricTone,
} from './AppUiPrimitives'

const summaryIcons: AppIconName[] = ['result', 'folder', 'build', 'runtime', 'approval', 'activity', 'files', 'next', 'status']

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
      <ResultSectionCard
        title="Resultado operativo"
        description="Lectura ejecutiva del cierre, con foco en estado, salida y siguiente fase segura."
        icon="result"
        actions={actions}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="rounded-[26px] border border-white/8 bg-slate-950/52 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <ResultStatusBadge label={statusLabel} tone={statusTone} />
              <SurfaceHeaderTag>Cierre</SurfaceHeaderTag>
            </div>
            <div className="mt-3 text-sm leading-6 text-slate-300">{statusDetail}</div>
            <div className="mt-4 whitespace-pre-wrap break-words rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-slate-100">
              {summaryText}
            </div>
          </div>

          <div className="grid gap-3">
            <ResultKeyValueGrid
              items={heroItems.map((item, index) => ({
                ...item,
                icon: summaryIcons[index] || 'status',
              }))}
            />
          </div>
        </div>
      </ResultSectionCard>

      {supportItems.length > 0 ? (
        <ResultSectionCard
          title="Lectura ejecutiva"
          description="Artefactos, validaciones, readiness y proxima accion sin ruido tecnico."
          icon="status"
        >
          <ResultKeyValueGrid
            items={supportItems.map((item, index) => ({
              ...item,
              icon: summaryIcons[index + heroItems.length] || 'status',
            }))}
          />
        </ResultSectionCard>
      ) : null}

      <ResultSectionCard
        title="Proxima fase segura"
        description="Que conviene revisar o preparar despues del cierre actual."
        icon="next"
      >
        <div className="grid gap-3 md:grid-cols-2">
          {nextStepItems.map((item, index) => (
            <div
              key={item.title}
              className="rounded-[22px] border border-white/8 bg-slate-950/50 px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="mt-2 text-sm font-semibold leading-6 text-slate-100">
                    {item.title}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ResultSectionCard>

      {technicalSections ? (
        <details className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100">
            Ver detalle tecnico del resultado
          </summary>
          <div className="mt-4 space-y-4">{technicalSections}</div>
        </details>
      ) : null}
    </div>
  )
}
