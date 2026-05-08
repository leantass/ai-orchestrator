type ExistingProjectScriptEntry = {
  name: string
  command: string
}

type ExistingProjectGitStatusSummary = {
  detected: boolean
  branch?: string
  dirty?: boolean
  summary?: string
}

type ExistingProjectManifestSummary = {
  detected?: boolean
  invalid?: boolean
  projectRoot?: string
  domain?: string
  projectType?: string
  deliveryLevel?: string
  nextRecommendedPhase?: string
  lastCompletedPhase?: string
}

type ExistingProjectAnalysis = {
  selectedPath: string
  projectName?: string
  framework?: string
  stack: string[]
  packageManager?: string
  scripts: ExistingProjectScriptEntry[]
  gitStatusSummary?: ExistingProjectGitStatusSummary | null
  importantFolders: string[]
  entrypoints: string[]
  warnings: string[]
  protectedFilesDetected: string[]
  runtimeTemporaryFilesDetected?: string[]
  packageJsonPath?: string
  jefeManifestSummary?: ExistingProjectManifestSummary | null
}

export function ExistingProjectPanel({
  summary,
  busy,
  project,
  onPick,
  onAnalyze,
  onClear,
}: {
  summary: string
  busy: boolean
  project: ExistingProjectAnalysis | null
  onPick: () => void
  onAnalyze: () => void
  onClear: () => void
}) {
  const runtimeTemporaryFilesDetected = project?.runtimeTemporaryFilesDetected || []

  return (
    <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            03. Proyecto existente
          </div>
          <div className="mt-2 text-xl font-semibold text-white">
            Continuidad read-only y ordenada
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            JEFE inspecciona sin ejecutar scripts y separa señales relevantes de runtime
            temporal o caché.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPick}
            disabled={busy}
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Seleccionar proyecto existente
          </button>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={busy || !project?.selectedPath}
            className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Analizar proyecto
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={busy || !project?.selectedPath}
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Limpiar selección
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4">
        <div className="text-sm font-medium text-slate-100">{summary}</div>
        <div className="mt-1 text-sm leading-6 text-slate-400">
          Seguridad: no se leen archivos sensibles, no se ejecutan scripts y no se
          modifica la carpeta seleccionada.
        </div>
      </div>

      {!project ? (
        <div className="mt-4 rounded-[24px] border border-dashed border-white/10 bg-slate-950/40 px-4 py-8 text-sm leading-6 text-slate-400">
          Seleccioná una carpeta para ver framework, package manager, git, scripts y
          entrypoints de forma resumida.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              label="Framework"
              value={project.framework || 'Desconocido'}
              detail={project.stack.join(' / ') || 'Sin stack resumido'}
            />
            <MetricTile
              label="Package manager"
              value={project.packageManager || 'Sin lockfile'}
              detail={project.packageJsonPath || 'Sin package.json visible'}
            />
            <MetricTile
              label="Git"
              value={
                project.gitStatusSummary?.branch ||
                (project.gitStatusSummary?.detected ? 'Detectado' : 'No detectado')
              }
              detail={project.gitStatusSummary?.summary || 'Sin resumen disponible'}
            />
            <MetricTile
              label="Manifest JEFE"
              value={
                project.jefeManifestSummary?.detected
                  ? project.jefeManifestSummary.projectType || 'Detectado'
                  : 'No detectado'
              }
              detail={
                project.jefeManifestSummary?.nextRecommendedPhase ||
                project.jefeManifestSummary?.domain ||
                'Sin manifest local'
              }
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ListBlock
              title="Carpetas importantes"
              items={project.importantFolders}
              emptyLabel="No se detectaron carpetas clave."
            />
            <ListBlock
              title="Entrypoints"
              items={project.entrypoints}
              emptyLabel="Sin entrypoints detectados."
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ScriptBlock scripts={project.scripts} />
            <WarningsBlock warnings={project.warnings} />
          </div>

          {project.protectedFilesDetected.length > 0 ? (
            <ListCallout
              title="Protegidos detectados"
              description="Se mantienen fuera del alcance y no se leen."
              tone="amber"
              items={project.protectedFilesDetected}
            />
          ) : null}

          {runtimeTemporaryFilesDetected.length > 0 ? (
            <ListCallout
              title="Runtime temporal detectado"
              description="Se clasificó como caché o artefacto temporal. No cuenta como credencial sensible."
              tone="slate"
              items={runtimeTemporaryFilesDetected}
            />
          ) : null}
        </div>
      )}
    </article>
  )
}

function MetricTile({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-100">{value}</div>
      <div className="mt-1 text-xs leading-5 text-slate-400">{detail}</div>
    </div>
  )
}

function ListBlock({
  title,
  items,
  emptyLabel,
}: {
  title: string
  items: string[]
  emptyLabel: string
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((entry) => (
            <span
              key={`${title}-${entry}`}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-200"
            >
              {entry}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-400">{emptyLabel}</span>
        )}
      </div>
    </div>
  )
}

function ScriptBlock({ scripts }: { scripts: ExistingProjectScriptEntry[] }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Scripts
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          {scripts.length}
        </span>
      </div>
      <div className="mt-3 grid gap-2">
        {scripts.length > 0 ? (
          scripts.slice(0, 6).map((entry) => (
            <div
              key={entry.name}
              className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3"
            >
              <div className="text-sm font-medium text-slate-100">{entry.name}</div>
              <div className="mt-1 break-all text-xs leading-5 text-slate-400">
                {entry.command}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-400">No se detectaron scripts declarados.</div>
        )}
      </div>
    </div>
  )
}

function WarningsBlock({ warnings }: { warnings: string[] }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Advertencias
      </div>
      <div className="mt-3 grid gap-2">
        {warnings.length > 0 ? (
          warnings.map((warning) => (
            <div
              key={warning}
              className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-slate-300"
            >
              {warning}
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-400">Sin advertencias relevantes.</div>
        )}
      </div>
    </div>
  )
}

function ListCallout({
  title,
  description,
  tone,
  items,
}: {
  title: string
  description: string
  tone: 'amber' | 'slate'
  items: string[]
}) {
  const toneClasses =
    tone === 'amber'
      ? 'border-amber-300/20 bg-amber-300/10 text-amber-50'
      : 'border-white/10 bg-white/[0.03] text-slate-100'

  return (
    <div className={`rounded-[24px] border px-4 py-4 ${toneClasses}`}>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs leading-5 opacity-80">{description}</div>
      <div className="mt-3 grid gap-2">
        {items.map((entry) => (
          <div
            key={`${title}-${entry}`}
            className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-3 text-xs leading-5"
          >
            {entry}
          </div>
        ))}
      </div>
    </div>
  )
}
