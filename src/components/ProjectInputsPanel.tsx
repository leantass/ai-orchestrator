import {
  ActionTile,
  DashboardIcon,
  EmptyStateBlock,
  MetricCard,
  ResultSectionCard,
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
    <article className="space-y-4 rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              02. Insumos del proyecto
            </div>
            <SurfaceHeaderTag>Briefing control center</SurfaceHeaderTag>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-white">
            Centro de contexto e insumos
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            Archivos, carpetas y notas del operador quedan ordenados como briefing
            modular. JEFE puede leer contexto, priorizar señales y preparar
            continuidad sin convertir esta vista en un formulario plano.
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Insumos"
              value={items.length > 0 ? `${items.length} registrados` : 'Sin insumos'}
              detail={summary}
              tone="sky"
              icon="files"
              emphasis="hero"
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
              detail="Aportan criterio para planner y reutilización"
              tone={notedCount > 0 ? 'violet' : 'default'}
              icon="brain"
            />
          </div>
        </div>

        <div className="space-y-3">
          <ActionTile
            label="Adjuntar archivos"
            detail="Sumá piezas puntuales para briefing, referencia, contenido o documentación."
            icon="files"
            tone="default"
            onClick={onAttachFiles}
            disabled={busy}
          />
          <ActionTile
            label="Adjuntar carpeta"
            detail="Incorporá una base estructural o un bloque completo de continuidad como metadata."
            icon="folder"
            tone="sky"
            onClick={onAttachFolder}
            disabled={busy}
          />
          <MetricCard
            label="Resumen de preparación"
            value={summary}
            detail="Todo queda como referencia segura hasta que exista una decisión explícita de copia o materialización."
            tone="default"
            icon="context"
            emphasis="hero"
          />
          {actionMessage ? (
            <div className="rounded-[24px] border border-cyan-300/15 bg-cyan-300/10 px-4 py-3 text-sm leading-6 text-cyan-50">
              {actionMessage}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
        <ResultSectionCard
          title="Disciplina de briefing"
          description="Separar obligatorio, opcional y técnico evita ruido y mejora la calidad del plan."
          icon="brain"
          badge="Operador"
          tone="default"
        >
          <div className="grid gap-2">
            <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
              Priorizá el objetivo, el alcance y el uso esperado antes de cargar muchos adjuntos.
            </div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
              La nota del operador explica rol, prioridad o expectativa de uso de cada insumo.
            </div>
          </div>
        </ResultSectionCard>

        <ResultSectionCard
          title="Modo de transferencia"
          description="Los insumos se leen como metadata segura hasta que el flujo pida otra cosa."
          icon="shield"
          badge="Safe"
          tone="violet"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <MetricCard
              label="Lectura"
              value="Read only"
              detail="JEFE usa los adjuntos para planificar, no para ejecutar acciones por sí solos."
              tone="violet"
              icon="shield"
            />
            <MetricCard
              label="Prioridad"
              value="Contexto primero"
              detail="Objetivo y alcance deberían dominar sobre los adjuntos accesorios."
              icon="goal"
            />
          </div>
        </ResultSectionCard>
      </div>

      {items.length === 0 ? (
        <EmptyStateBlock
          title="Todavía no hay insumos adjuntos"
          description="Podés sumar archivos, carpetas o referencias de base para que JEFE los use como briefing del proyecto."
          icon="files"
        />
      ) : (
        <ResultSectionCard
          title="Bitácora de insumos"
          description="Cada adjunto se presenta como módulo con tipo, ruta, rol, estado y nota del operador."
          icon="files"
          badge={`${items.length} activos`}
        >
          <div className="grid gap-3 2xl:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-[26px] border border-white/8 bg-slate-950/55 px-4 py-4"
              >
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
                    <div title={item.originalPath} className="mt-1 truncate text-xs leading-5 text-slate-400">
                      {item.originalPath}
                    </div>
                  </div>
                  <ResultStatusBadge label={item.statusLabel} tone={getStatusTone(item.statusLabel)} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <MetricCard
                    label="Tamaño"
                    value={item.sizeLabel}
                    detail="Peso detectado al adjuntar"
                    icon="files"
                  />
                  <MetricCard
                    label="Rol inferido"
                    value={item.roleLabel}
                    detail={item.kind === 'folder' ? 'Bloque estructural' : 'Pieza puntual'}
                    tone="violet"
                    icon="brain"
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
                    placeholder="Ejemplo: usar como referencia, logo, documentación o contenido base."
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
              </article>
            ))}
          </div>
        </ResultSectionCard>
      )}
    </article>
  )
}
