import {
  DashboardIcon,
  EmptyStateBlock,
  MetricCard,
  ResultStatusBadge,
  SurfaceHeaderTag,
} from './AppUiPrimitives'

type ProjectInputEntry = {
  id: string
  kind: 'file' | 'folder'
  name: string
  originalPath: string
  sizeLabel: string
  roleLabel: string
  statusLabel: string
  operatorNote: string
}

function getStatusTone(statusLabel: string) {
  const normalizedStatusLabel = statusLabel.toLowerCase()
  if (normalizedStatusLabel.includes('copiado')) return 'emerald' as const
  if (normalizedStatusLabel.includes('pendiente')) return 'amber' as const
  return 'sky' as const
}

export function ProjectInputsPanel({
  summary,
  actionMessage,
  busy,
  items,
  onAttachFiles,
  onAttachFolder,
  onRemove,
  onNoteChange,
}: {
  summary: string
  actionMessage?: string
  busy: boolean
  items: ProjectInputEntry[]
  onAttachFiles: () => void
  onAttachFolder: () => void
  onRemove: (id: string) => void
  onNoteChange: (id: string, value: string) => void
}) {
  const fileCount = items.filter((item) => item.kind === 'file').length
  const folderCount = items.filter((item) => item.kind === 'folder').length
  const notedCount = items.filter((item) => item.operatorNote.trim() !== '').length

  return (
    <article className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              02. Insumos del proyecto
            </div>
            <SurfaceHeaderTag>Briefing</SurfaceHeaderTag>
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Centro de contexto e insumos
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Archivos y carpetas quedan ordenados como metadata segura. JEFE puede
            leer contexto, clasificar prioridades y preparar la continuidad sin
            convertir esta vista en una pila de texto.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAttachFiles}
            disabled={busy}
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Adjuntar archivos
          </button>
          <button
            type="button"
            onClick={onAttachFolder}
            disabled={busy}
            className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Adjuntar carpeta
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Insumos"
          value={items.length > 0 ? `${items.length} registrados` : 'Sin insumos'}
          detail={summary}
          tone="sky"
          icon="files"
        />
        <MetricCard
          label="Archivos"
          value={fileCount > 0 ? `${fileCount}` : '0'}
          detail="Piezas puntuales para briefing o referencia"
          icon="files"
        />
        <MetricCard
          label="Carpetas"
          value={folderCount > 0 ? `${folderCount}` : '0'}
          detail="Bloques de continuidad o base estructural"
          icon="folder"
        />
        <MetricCard
          label="Notas del operador"
          value={notedCount > 0 ? `${notedCount}` : '0'}
          detail="Aportan criterio para planner y reutilizacion"
          tone={notedCount > 0 ? 'violet' : 'default'}
          icon="brain"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="rounded-[26px] border border-white/8 bg-slate-950/50 p-4">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/12 text-cyan-100">
              <DashboardIcon name="context" className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Resumen de preparacion
              </div>
              <div className="mt-2 text-sm font-semibold leading-6 text-slate-100">
                {summary}
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-400">
                Todo queda como referencia segura hasta que exista una decision explicita
                de copia o materializacion.
              </div>
            </div>
          </div>
          {actionMessage ? (
            <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 px-4 py-3 text-sm leading-6 text-cyan-50">
              {actionMessage}
            </div>
          ) : null}
        </div>

        <div className="rounded-[26px] border border-white/8 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Prioridad de lectura
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-100">
                Primero objetivo y alcance, despues insumos, luego continuidad
              </div>
            </div>
            <SurfaceHeaderTag>Operador</SurfaceHeaderTag>
          </div>
          <div className="mt-4 grid gap-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-slate-300">
              Separar lo obligatorio de lo accesorio mejora el plan y la lectura del scope.
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-slate-300">
              La nota del operador sirve para explicar rol, prioridad o uso esperado.
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyStateBlock
          title="Todavia no hay insumos adjuntos"
          description="Podes sumar archivos, carpetas o referencias de base para que JEFE los use como briefing de proyecto."
          icon="files"
        />
      ) : (
        <div className="space-y-3">
          <div className="hidden grid-cols-[minmax(0,1.35fr)_140px_110px_140px_minmax(0,1fr)_100px] gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:grid">
            <div>Insumo</div>
            <div>Tipo y rol</div>
            <div>Tamano</div>
            <div>Estado</div>
            <div>Nota del operador</div>
            <div>Accion</div>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[26px] border border-white/8 bg-slate-950/50 px-4 py-4"
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_140px_110px_140px_minmax(0,1fr)_100px] xl:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                      <DashboardIcon
                        name={item.kind === 'folder' ? 'folder' : 'files'}
                        className="h-3.5 w-3.5"
                      />
                      {item.kind === 'folder' ? 'Carpeta' : 'Archivo'}
                    </span>
                    <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-100">
                      {item.roleLabel}
                    </span>
                  </div>
                  <div className="mt-3 truncate text-sm font-semibold text-slate-100">
                    {item.name}
                  </div>
                  <div title={item.originalPath} className="mt-1 truncate text-xs leading-5 text-slate-400">
                    {item.originalPath}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 xl:hidden">
                    Tipo y rol
                  </div>
                  <div className="text-sm font-semibold text-slate-100">
                    {item.kind === 'folder' ? 'Carpeta' : 'Archivo'}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">{item.roleLabel}</div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 xl:hidden">
                    Tamano
                  </div>
                  <div className="text-sm font-semibold text-slate-100">{item.sizeLabel}</div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 xl:hidden">
                    Estado
                  </div>
                  <ResultStatusBadge label={item.statusLabel} tone={getStatusTone(item.statusLabel)} />
                </div>

                <div className="min-w-0">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 xl:hidden">
                    Nota del operador
                  </label>
                  <input
                    type="text"
                    value={item.operatorNote}
                    onChange={(event) => onNoteChange(item.id, event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/30"
                    placeholder="Ejemplo: usar como referencia, logo, documentacion o contenido base."
                  />
                </div>

                <div className="flex items-start xl:justify-end">
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
