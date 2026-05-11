import {
  DisclosurePanel,
  DashboardIcon,
  MetricCard,
  ResultStatusBadge,
  type AppIconName,
  type MetricTone,
} from './AppUiPrimitives'

function inferStatusIcon(label: string): AppIconName {
  const normalizedLabel = label.toLowerCase()
  if (normalizedLabel.includes('plan')) return 'plan'
  if (normalizedLabel.includes('ejecutor')) return 'execution'
  if (normalizedLabel.includes('reuse')) return 'memory'
  if (normalizedLabel.includes('memoria')) return 'context'
  return 'services'
}

export function SystemStatusPanel({
  title = 'Estado del sistema',
  items,
}: {
  title?: string
  items: Array<{
    label: string
    value: string
    detail?: string
    tone?: MetricTone
    icon?: AppIconName
  }>
}) {
  const highlighted = items.slice(0, 1)
  const support = items.slice(1)

  return (
    <article className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/74 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {title}
        </div>
        <ResultStatusBadge label={highlighted[0]?.value || `${items.length} nodos`} tone={highlighted[0]?.tone || 'default'} />
      </div>

      {highlighted.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {highlighted.map((item, index) => (
            <MetricCard
              key={`${item.label}-${item.value}`}
              label={item.label}
              value={item.value}
              detail={item.detail}
              tone={item.tone}
              icon={item.icon || inferStatusIcon(item.label)}
              emphasis={index === 0 ? 'hero' : 'compact'}
            />
          ))}
        </div>
      ) : null}

      {support.length > 0 ? (
        <div className="mt-4">
          <DisclosurePanel
            title="Ver detalle del sistema"
            description="Runtime, reuse, memoria y soporte tecnico quedan en segundo nivel."
            icon="services"
            badge={`${support.length}`}
          >
            <div className="grid gap-2">
              {support.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start justify-between gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex min-w-0 gap-3">
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-slate-200">
                      <DashboardIcon
                        name={item.icon || inferStatusIcon(item.label)}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {item.label}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-100">{item.value}</div>
                      {item.detail ? (
                        <div className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</div>
                      ) : null}
                    </div>
                  </div>
                  <ResultStatusBadge label={item.value} tone={item.tone} />
                </div>
              ))}
            </div>
          </DisclosurePanel>
        </div>
      ) : null}
    </article>
  )
}
