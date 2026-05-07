import type { ReactNode } from 'react'

const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

export type MetricTone = 'default' | 'sky' | 'emerald' | 'amber' | 'rose'

export function SidebarSectionButton({
  active,
  label,
  description,
  badge,
  onClick,
}: {
  active: boolean
  label: string
  description: string
  badge?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={joinClasses(
        'w-full rounded-2xl border px-4 py-4 text-left transition',
        active
          ? 'border-sky-300/35 bg-sky-300/12 text-white shadow-[0_14px_40px_rgba(56,189,248,0.16)]'
          : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.06]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{label}</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">{description}</div>
        </div>
        {badge ? (
          <span className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
            {badge}
          </span>
        ) : null}
      </div>
    </button>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/80">
            {eyebrow}
          </div>
        ) : null}
        <div className="text-2xl font-semibold text-white">{title}</div>
        <p className="max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string
  value: string
  detail?: string
  tone?: MetricTone
}) {
  const toneClassName =
    tone === 'sky'
      ? 'border-sky-300/20 bg-sky-300/8'
      : tone === 'emerald'
        ? 'border-emerald-300/20 bg-emerald-300/8'
        : tone === 'amber'
          ? 'border-amber-300/20 bg-amber-300/8'
          : tone === 'rose'
            ? 'border-rose-300/20 bg-rose-300/8'
            : 'border-white/8 bg-white/[0.03]'

  return (
    <article className={joinClasses('rounded-2xl border px-4 py-4', toneClassName)}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-sm font-medium leading-6 text-slate-100">{value}</div>
      {detail ? (
        <div className="mt-2 text-xs leading-5 text-slate-400">{detail}</div>
      ) : null}
    </article>
  )
}

export function ResultSectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {title}
        </div>
        {description ? (
          <div className="text-sm leading-6 text-slate-400">{description}</div>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </article>
  )
}

export function ResultStatusBadge({
  label,
  tone = 'default',
}: {
  label: string
  tone?: MetricTone
}) {
  const toneClassName =
    tone === 'sky'
      ? 'border-sky-300/20 bg-sky-300/10 text-sky-100'
      : tone === 'emerald'
        ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
        : tone === 'amber'
          ? 'border-amber-300/20 bg-amber-300/10 text-amber-100'
          : tone === 'rose'
            ? 'border-rose-300/20 bg-rose-300/10 text-rose-100'
            : 'border-white/10 bg-white/5 text-slate-100'

  return (
    <span
      className={joinClasses(
        'inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]',
        toneClassName,
      )}
    >
      {label}
    </span>
  )
}

export function ResultKeyValueGrid({
  items,
}: {
  items: Array<{
    label: string
    value: string
    detail?: string
  }>
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {item.label}
          </div>
          <div className="mt-2 text-sm font-medium leading-6 text-slate-100">
            {item.value}
          </div>
          {item.detail ? (
            <div className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
