const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

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
  return (
    <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            02. Insumos del proyecto
          </div>
          <div className="mt-2 text-xl font-semibold text-white">Centro de contexto e insumos</div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Archivos y carpetas se registran como metadata segura. El operador puede
            clasificar cada insumo sin perder legibilidad.
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

      <div className="mt-4 rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4">
        <div className="text-sm font-medium text-slate-100">{summary}</div>
        <div className="mt-1 text-sm leading-6 text-slate-400">
          Todo queda como referencia segura hasta que exista una decisión explícita de
          copia o materialización.
        </div>
        {actionMessage ? (
          <div className="mt-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 px-3 py-3 text-sm text-cyan-50">
            {actionMessage}
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-[24px] border border-dashed border-white/10 bg-slate-950/40 px-4 py-8 text-sm leading-6 text-slate-400">
          Todavía no hay insumos adjuntos. Podés sumar archivos, carpetas o referencias
          de base para que JEFE los considere como contexto.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="hidden grid-cols-[minmax(0,1.3fr)_120px_120px_140px_minmax(0,1fr)_92px] gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:grid">
            <div>Insumo</div>
            <div>Tipo</div>
            <div>Tamaño</div>
            <div>Estado</div>
            <div>Nota del operador</div>
            <div>Acción</div>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4"
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_120px_120px_140px_minmax(0,1fr)_92px] xl:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                      {item.kind === 'folder' ? 'Carpeta' : 'Archivo'}
                    </span>
                    <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-100">
                      {item.roleLabel}
                    </span>
                  </div>
                  <div className="mt-3 truncate text-sm font-semibold text-slate-100">
                    {item.name}
                  </div>
                  <div
                    title={item.originalPath}
                    className="mt-1 truncate text-xs leading-5 text-slate-400"
                  >
                    {item.originalPath}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 xl:hidden">
                    Tipo
                  </div>
                  <div className="text-sm font-medium text-slate-100">{item.roleLabel}</div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 xl:hidden">
                    Tamaño
                  </div>
                  <div className="text-sm font-medium text-slate-100">{item.sizeLabel}</div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 xl:hidden">
                    Estado
                  </div>
                  <div
                    className={joinClasses(
                      'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                      item.statusLabel.toLocaleLowerCase().includes('copiado')
                        ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
                        : item.statusLabel.toLocaleLowerCase().includes('pendiente')
                          ? 'border-amber-300/20 bg-amber-300/10 text-amber-100'
                          : 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100',
                    )}
                  >
                    {item.statusLabel}
                  </div>
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
                    placeholder="Ejemplo: usar como referencia, logo, documentación o contenido base."
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
