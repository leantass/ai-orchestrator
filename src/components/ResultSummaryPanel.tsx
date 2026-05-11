import type { ReactNode } from 'react'

import {
  DisclosurePanel,
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
  const heroItems = summaryItems.slice(0, 1)
  const supportItems = summaryItems.slice(1)
  const visibleNextSteps = nextStepItems.slice(0, 1)
  const hiddenNextSteps = nextStepItems.slice(1)

  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_24%),radial-gradient(circle_at_72%_15%,rgba(167,139,250,0.12),transparent_18%),linear-gradient(180deg,rgba(9,17,32,0.96),rgba(8,15,28,0.9))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <ResultStatusBadge label={statusLabel} tone={statusTone} />
              <SurfaceHeaderTag>Cierre ejecutivo</SurfaceHeaderTag>
            </div>
            <div className="rounded-[28px] border border-white/8 bg-slate-950/55 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Resumen principal
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-300">{statusDetail}</div>
              <div className="mt-4 whitespace-pre-wrap break-words rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-slate-100">
                {summaryText}
              </div>
            </div>

            <div className="grid gap-3">
              {heroItems.map((item, index) => (
                <MetricCard
                  key={`${item.label}-${item.value}`}
                  label={item.label}
                  value={item.value}
                  detail={item.detail}
                  icon={summaryIcons[index] || 'status'}
                  tone={index === 0 ? statusTone : index === 1 ? 'sky' : 'default'}
                  emphasis={index === 0 ? 'hero' : 'compact'}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <ResultSectionCard
              title="Siguiente fase segura"
              description="Las acciones visibles quedan arriba; el detalle tecnico baja de prioridad."
              icon="next"
              badge="Accion"
              tone="sky"
            >
              <div className="grid gap-2">{actions}</div>
            </ResultSectionCard>

            <ResultSectionCard
              title="Proximos pasos"
              description="Solo las recomendaciones mas importantes quedan visibles."
              icon="result"
              badge={`${nextStepItems.length}`}
            >
              <div className="grid gap-3">
                {visibleNextSteps.map((item, index) => (
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
              {hiddenNextSteps.length > 0 ? (
                <div className="mt-4">
                  <DisclosurePanel
                    title="Ver mas recomendaciones"
                    description="Siguientes pasos complementarios."
                    icon="next"
                    badge={`${hiddenNextSteps.length}`}
                  >
                    <div className="grid gap-3">
                      {hiddenNextSteps.map((item, index) => (
                        <div
                          key={`${item.title}-${index + 1}`}
                          className="rounded-[22px] border border-white/8 bg-slate-950/50 px-4 py-4"
                        >
                          <div className="text-sm font-semibold leading-6 text-slate-100">
                            {item.title}
                          </div>
                          <div className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</div>
                        </div>
                      ))}
                    </div>
                  </DisclosurePanel>
                </div>
              ) : null}
            </ResultSectionCard>
          </div>
        </div>
      </article>

      {supportItems.length > 0 ? (
        <DisclosurePanel
          title="Ver lectura ejecutiva ampliada"
          description="Artefactos, readiness, archivos y apoyos complementarios."
          icon="status"
          badge={`${supportItems.length} items`}
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
        </DisclosurePanel>
      ) : null}

      {technicalSections ? (
        <details className="rounded-[28px] border border-white/10 bg-slate-950/58 p-5">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100">
            Ver detalle tecnico del resultado
          </summary>
          <div className="mt-4 space-y-4">{technicalSections}</div>
        </details>
      ) : null}
    </div>
  )
}
