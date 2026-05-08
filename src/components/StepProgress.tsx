const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

export type StepProgressItem = {
  key: string
  index: number
  label: string
  description: string
  status: 'current' | 'complete' | 'pending'
  onClick: () => void
}

export function StepProgress({ items }: { items: StepProgressItem[] }) {
  return (
    <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-7">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onClick}
          className={joinClasses(
            'rounded-2xl border px-4 py-3 text-left transition',
            item.status === 'current'
              ? 'border-cyan-300/30 bg-cyan-300/12 text-white shadow-[0_12px_32px_rgba(34,211,238,0.12)]'
              : item.status === 'complete'
                ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-50'
                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                {String(item.index + 1).padStart(2, '0')}
              </div>
              <div className="mt-2 text-sm font-semibold">{item.label}</div>
              <div className="mt-1 text-xs leading-5 text-slate-400">{item.description}</div>
            </div>
            <span
              className={joinClasses(
                'mt-0.5 inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                item.status === 'current'
                  ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100'
                  : item.status === 'complete'
                    ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
                    : 'border-white/10 bg-slate-950/60 text-slate-400',
              )}
            >
              {item.status === 'current'
                ? 'Actual'
                : item.status === 'complete'
                  ? 'Listo'
                  : 'Pendiente'}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
