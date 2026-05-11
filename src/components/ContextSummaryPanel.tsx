import type { ReactNode } from 'react'

import {
  DashboardIcon,
  MetricCard,
  ResultStatusBadge,
  SurfaceHeaderTag,
  type AppIconName,
  type MetricTone,
} from './AppUiPrimitives'

const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

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
  const leadingItems = sections.flatMap((section) => section.items).slice(0, 3)

  return (
    <article className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_28%),linear-gradient(180deg,rgba(6,11,22,0.97),rgba(8,15,28,0.9))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {title}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <SurfaceHeaderTag>Contexto</SurfaceHeaderTag>
      </div>

      {primaryItem ? (
        <div className="mt-4 rounded-[26px] border border-sky-300/18 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_38%),linear-gradient(180deg,rgba(56,189,248,0.1),rgba(8,15,28,0.7))] p-4">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-sky-300/20 bg-sky-300/14 text-sky-100">
              <DashboardIcon
                name={primaryItem.icon || inferContextIcon(primaryItem.label)}
                className="h-5 w-5"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/80">
                Decision en foco
              </div>
              <div className="mt-2 text-sm font-semibold leading-7 text-white">
                {primaryItem.value}
              </div>
              {primaryItem.detail ? (
                <div className="mt-1 text-xs leading-5 text-slate-200/82">{primaryItem.detail}</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {leadingItems.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {leadingItems.map((item, index) => (
            <MetricCard
              key={`${item.label}-${item.value}`}
              label={item.label}
              value={item.value}
              detail={item.detail}
              tone={item.tone || (index === 0 ? 'sky' : index === 1 ? 'default' : 'violet')}
              icon={item.icon || inferContextIcon(item.label)}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
                {section.title}
              </div>
              <SurfaceHeaderTag>{section.items.length}</SurfaceHeaderTag>
            </div>
            <div className="grid gap-2">
              {section.items.map((item) => (
                <div
                  key={`${section.title}-${item.label}`}
                  className={joinClasses(
                    'rounded-[22px] border px-4 py-3',
                    item.tone === 'sky'
                      ? 'border-sky-300/18 bg-sky-300/8'
                      : item.tone === 'emerald'
                        ? 'border-emerald-300/18 bg-emerald-300/8'
                        : item.tone === 'amber'
                          ? 'border-amber-300/18 bg-amber-300/8'
                          : item.tone === 'rose'
                            ? 'border-rose-300/18 bg-rose-300/8'
                            : item.tone === 'violet'
                              ? 'border-violet-300/18 bg-violet-300/8'
                              : 'border-white/8 bg-white/[0.03]',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-slate-200">
                        <DashboardIcon
                          name={item.icon || inferContextIcon(item.label)}
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {item.label}
                        </div>
                        <div className="mt-2 text-sm font-semibold leading-6 text-slate-100">
                          {item.value}
                        </div>
                        {item.detail ? (
                          <div className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</div>
                        ) : null}
                      </div>
                    </div>
                    {item.tone ? <ResultStatusBadge label={item.value} tone={item.tone} /> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {actions ? <div className="mt-4 grid gap-2">{actions}</div> : null}
    </article>
  )
}
