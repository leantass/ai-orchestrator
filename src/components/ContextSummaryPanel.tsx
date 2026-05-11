import type { ReactNode } from 'react'

import {
  DashboardIcon,
  DisclosurePanel,
  ResultStatusBadge,
  type AppIconName,
  type MetricTone,
} from './AppUiPrimitives'

function inferContextIcon(label: string): AppIconName {
  const normalizedLabel = label.toLowerCase()
  if (normalizedLabel.includes('objetivo')) return 'goal'
  if (normalizedLabel.includes('proyecto')) return 'projects'
  if (normalizedLabel.includes('modo')) return 'workspace'
  if (normalizedLabel.includes('accion')) return 'next'
  if (normalizedLabel.includes('estado')) return 'status'
  if (normalizedLabel.includes('ruta')) return 'flow'
  if (normalizedLabel.includes('corrida')) return 'runs'
  return 'context'
}

export function ContextSummaryPanel({
  title,
  description,
  sections,
  actions,
}: {
  title: string
  description: string
  sections: Array<{
    title: string
    items: Array<{
      label: string
      value: string
      detail?: string
      tone?: MetricTone
      icon?: AppIconName
    }>
  }>
  actions?: ReactNode
}) {
  const primaryItem = sections[0]?.items[0]
  const secondaryItem = sections[1]?.items[0] || sections[0]?.items[1]
  const remainingItems = sections.flatMap((section) => section.items).slice(2)

  return (
    <article className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(6,11,22,0.97),rgba(8,15,28,0.9))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur">
      {title || description ? (
        <div className="flex items-start justify-between gap-3">
          <div>
            {title ? (
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {title}
              </div>
            ) : null}
            {description ? <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p> : null}
          </div>
        </div>
      ) : null}

      {primaryItem ? (
        <div className="mt-4 rounded-[22px] border border-sky-300/18 bg-[linear-gradient(180deg,rgba(56,189,248,0.08),rgba(8,15,28,0.72))] p-4">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-sky-300/20 bg-sky-300/14 text-sky-100">
              <DashboardIcon
                name={primaryItem.icon || inferContextIcon(primaryItem.label)}
                className="h-4 w-4"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/80">
                {primaryItem.label}
              </div>
              <div className="mt-2 text-sm font-semibold leading-6 text-white">{primaryItem.value}</div>
              {primaryItem.detail ? (
                <div className="mt-1 text-xs leading-5 text-slate-200/82">{primaryItem.detail}</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-3">
        {secondaryItem ? (
          <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {secondaryItem.label}
                </div>
                <div className="mt-1 text-sm font-semibold leading-6 text-slate-100">
                  {secondaryItem.value}
                </div>
                {secondaryItem.detail ? (
                  <div className="mt-1 text-xs leading-5 text-slate-400">{secondaryItem.detail}</div>
                ) : null}
              </div>
              {secondaryItem.tone ? (
                <ResultStatusBadge label={secondaryItem.value} tone={secondaryItem.tone} />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {actions ? <div className="mt-4 grid gap-2">{actions}</div> : null}

      {remainingItems.length > 0 ? (
        <div className="mt-4">
          <DisclosurePanel
            title="Ver ayuda y detalle"
            description="Contexto extendido, estado y acciones de apoyo a un clic."
            icon="context"
            badge={`${remainingItems.length} items`}
          >
            <div className="grid gap-2">
              {remainingItems.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="flex items-start justify-between gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex min-w-0 gap-3">
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-slate-200">
                      <DashboardIcon
                        name={item.icon || inferContextIcon(item.label)}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {item.label}
                      </div>
                      <div className="mt-1 text-sm font-semibold leading-6 text-slate-100">
                        {item.value}
                      </div>
                      {item.detail ? (
                        <div className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</div>
                      ) : null}
                    </div>
                  </div>
                  {item.tone ? <ResultStatusBadge label={item.value} tone={item.tone} /> : null}
                </div>
              ))}
            </div>
          </DisclosurePanel>
        </div>
      ) : null}
    </article>
  )
}
