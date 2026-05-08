import type { ReactNode } from 'react'

import { ResultStatusBadge, type MetricTone } from './AppUiPrimitives'

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
    }>
  }>
  actions?: ReactNode
}) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>

      <div className="mt-4 space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
              {section.title}
            </div>
            <div className="grid gap-2">
              {section.items.map((item) => (
                <div
                  key={`${section.title}-${item.label}`}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {item.label}
                    </div>
                    {item.tone ? <ResultStatusBadge label={item.value} tone={item.tone} /> : null}
                  </div>
                  {!item.tone ? (
                    <div className="mt-2 text-sm font-medium leading-6 text-slate-100">
                      {item.value}
                    </div>
                  ) : null}
                  {item.detail ? (
                    <div className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</div>
                  ) : null}
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
