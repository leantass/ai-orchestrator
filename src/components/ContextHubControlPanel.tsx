import { MetricCard, type MetricTone } from './AppUiPrimitives'

export function ContextHubControlPanel({
  title = 'MEMORIA / Context Hub',
  description,
  stateLabel,
  stateTone,
  stateDetail,
  endpointLabel,
  appPathLabel,
  workspaceRootLabel,
  runtimeNotice,
  actionMessage,
  lastCheckLabel,
  canStart,
  canOpen,
  isBusy,
  isStarting,
  onRetry,
  onOpen,
  onStart,
}: {
  title?: string
  description: string
  stateLabel: string
  stateTone: MetricTone
  stateDetail: string
  endpointLabel: string
  appPathLabel: string
  workspaceRootLabel: string
  runtimeNotice: string
  actionMessage?: string
  lastCheckLabel?: string
  canStart: boolean
  canOpen: boolean
  isBusy: boolean
  isStarting: boolean
  onRetry: () => void
  onOpen: () => void
  onStart: () => void
}) {
  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">{description}</div>
        </div>
        {lastCheckLabel ? (
          <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-[11px] font-medium text-slate-300">
            {lastCheckLabel}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MetricCard
          label="Estado"
          value={stateLabel}
          detail={stateDetail}
          tone={stateTone}
        />
        <MetricCard
          label="Endpoint útil"
          value={endpointLabel}
          detail={canOpen ? 'Disponible para abrir desde JEFE.' : 'Se habilita cuando MEMORIA responde.'}
        />
        <MetricCard
          label="Ruta local"
          value={appPathLabel}
          detail={workspaceRootLabel}
        />
      </div>

      {actionMessage ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-200">
          {actionMessage}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
        {runtimeNotice}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          disabled={isBusy}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
        >
          {isBusy && !isStarting ? 'Consultando...' : 'Reintentar conexión'}
        </button>
        <button
          type="button"
          onClick={onOpen}
          disabled={!canOpen || isBusy}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
        >
          Abrir MEMORIA
        </button>
        <button
          type="button"
          onClick={onStart}
          disabled={!canStart || isBusy}
          className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
        >
          {isStarting ? 'Iniciando MEMORIA...' : 'Levantar MEMORIA local'}
        </button>
      </div>
    </article>
  )
}
