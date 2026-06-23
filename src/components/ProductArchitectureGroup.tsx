const normalizeOptionalStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string => typeof entry === 'string' && entry.trim() !== '',
      )
    : []

const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

function ProductArchitectureList({
  items,
  compact = false,
}: {
  items?: string[]
  compact?: boolean
}) {
  const normalizedItems = normalizeOptionalStringArray(items)
  const visibleItems = compact ? normalizedItems.slice(0, 4) : normalizedItems

  if (visibleItems.length === 0) {
    return <div className="text-xs leading-5 text-slate-500">Sin datos definidos</div>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visibleItems.map((item) => (
        <span
          key={item}
          className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs leading-5 text-slate-200"
        >
          {item}
        </span>
      ))}
      {compact && normalizedItems.length > visibleItems.length ? (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs leading-5 text-slate-400">
          +{normalizedItems.length - visibleItems.length} más
        </span>
      ) : null}
    </div>
  )
}

export function ProductArchitectureGroup({
  title,
  items,
  compact = false,
  tone = 'default',
}: {
  title: string
  items?: string[]
  compact?: boolean
  tone?: 'default' | 'amber' | 'rose' | 'emerald' | 'sky'
}) {
  const toneClassName =
    tone === 'rose'
      ? 'border-rose-300/20 bg-rose-300/8'
      : tone === 'amber'
        ? 'border-amber-300/20 bg-amber-300/8'
        : tone === 'emerald'
          ? 'border-emerald-300/20 bg-emerald-300/8'
          : tone === 'sky'
            ? 'border-sky-300/20 bg-sky-300/8'
            : 'border-white/8 bg-white/[0.03]'

  return (
    <article className={joinClasses('rounded-2xl border px-4 py-4', toneClassName)}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>
      <div className="mt-3">
        <ProductArchitectureList items={items} compact={compact} />
      </div>
    </article>
  )
}