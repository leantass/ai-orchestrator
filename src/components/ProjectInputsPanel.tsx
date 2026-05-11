import {
  ActionTile,
  DashboardIcon,
  DisclosurePanel,
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
    <article className="space-y-4 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.1),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.016))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              02. Insumos del proyecto
            </div>
            <SurfaceHeaderTag>Briefing</SurfaceHeaderTag>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-white">
            Centro de contexto e insumos
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            La vista principal prioriza lo que ayuda a decidir. El detalle fino queda disponible sin
            convertir el briefing en un formulario tecnico.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard
              label="Resumen"
              value={summary}
              detail="Lo cargado hasta ahora queda listo para orientar el plan."
              tone="sky"
              icon="files"
              emphasis="hero"
            />
            <MetricCard
              label="Archivos y carpetas"
              value={`${fileCount} archivo(s) / ${folderCount} carpeta(s)`}
              detail="Se leen como metadata segura."
              icon="folder"
            />
            <MetricCard
              label="Notas del operador"
              value={notedCount > 0 ? `${notedCount}` : '0'}
              detail="Aclaran rol, prioridad o expectativa de uso."
              tone={notedCount > 0 ? 'violet' : 'default'}
              icon="brain"
            />
          </div>
        </div>

        <div className="space-y-3">
          <ActionTile
            label="Adjuntar archivos"
            detail="Sumar referencias, contenido base o documentacion."
            icon="files"
            tone="default"
            onClick={onAttachFiles}
            disabled={busy}
          />
          <ActionTile
            label="Adjuntar carpeta"
            detail="Incorporar una base local completa como apoyo del briefing."
            icon="folder"
            tone="sky"
            onClick={onAttachFolder}
            disabled={busy}
          />
          {actionMessage ? (
            <div className="rounded-[22px] border border-cyan-300/15 bg-cyan-300/10 px-4 py-3 text-sm leading-6 text-cyan-50">
              {actionMessage}
            </div>
          ) : null}
        </div>
      </div>

      <DisclosurePanel
        title="Ver criterios de briefing"
        description="Separar obligatorio, opcional y tecnico mejora la claridad del plan."
        icon="brain"
        badge="Ayuda"
      >
        <div className="grid gap-2">
          <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
            Priorizá objetivo, alcance y uso esperado antes de sumar muchos adjuntos.
          </div>
          <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
            La nota del operador explica para qué sirve cada insumo dentro del flujo.
          </div>
        </div>
      </DisclosurePanel>

      {items.length === 0 ? (
        <EmptyStateBlock
          title="Todavia no hay insumos adjuntos"
          description="Podes sumar archivos, carpetas o referencias para que JEFE los use como briefing del proyecto."
          icon="files"
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <details
              key={item.id}
              className="rounded-[24px] border border-white/8 bg-slate-950/55 px-4 py-4"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-start justify-between gap-3">
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
                    <div className="mt-1 text-xs leading-5 text-slate-400">
                      {item.operatorNote.trim() || 'Sin nota del operador.'}
                    </div>
                  </div>
                  <ResultStatusBadge label={item.statusLabel} tone={getStatusTone(item.statusLabel)} />
                </div>
              </summary>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <MetricCard
                  label="Ruta"
                  value={item.originalPath}
                  detail="Se conserva como referencia del briefing."
                  icon="files"
                />
                <MetricCard
                  label="Tamano"
                  value={item.sizeLabel}
                  detail="Peso detectado al adjuntar."
                  icon="folder"
                />
              </div>

              <div className="mt-4">
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
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

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10"
                >
                  Quitar
                </button>
              </div>
            </details>
          ))}
        </div>
      )}
    </article>
  )
}
