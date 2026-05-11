import {
  ActionTile,
  DashboardIcon,
  EmptyStateBlock,
  MetricCard,
  ResultSectionCard,
  SurfaceHeaderTag,
} from './AppUiPrimitives'

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
    <article className="space-y-4 rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              03. Proyecto existente
            </div>
            <SurfaceHeaderTag>Read only</SurfaceHeaderTag>
            <SurfaceHeaderTag>Continuidad segura</SurfaceHeaderTag>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-white">
            Continuidad read only y ordenada
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            JEFE inspecciona sin ejecutar scripts y separa señales útiles de runtime
            temporal o cache para que la continuidad sea clara, premium y segura.
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard
              label="Framework"
              value={project?.framework || 'Desconocido'}
              detail={project?.stack.join(' / ') || 'Sin stack resumido'}
              tone="sky"
              icon="build"
              emphasis="hero"
            />
            <MetricCard
              label="Package manager"
              value={project?.packageManager || 'Sin lockfile'}
              detail={project?.packageJsonPath || 'Sin package.json visible'}
              icon="files"
            />
            <MetricCard
              label="Git"
              value={
                project?.gitStatusSummary?.branch ||
                (project?.gitStatusSummary?.detected ? 'Detectado' : 'No detectado')
              }
              detail={project?.gitStatusSummary?.summary || 'Sin resumen disponible'}
              tone={project?.gitStatusSummary?.detected ? 'emerald' : 'default'}
              icon="git"
            />
            <MetricCard
              label="Manifest JEFE"
              value={
                project?.jefeManifestSummary?.detected
                  ? project.jefeManifestSummary.projectType || 'Detectado'
                  : 'No detectado'
              }
              detail={
                project?.jefeManifestSummary?.nextRecommendedPhase ||
                project?.jefeManifestSummary?.domain ||
                'Sin manifest local'
              }
              tone={project?.jefeManifestSummary?.detected ? 'violet' : 'default'}
              icon="flow"
            />
            <MetricCard
              label="Scripts"
              value={`${project?.scripts.length || 0}`}
              detail="Scripts declarados en package.json"
              icon="execution"
            />
            <MetricCard
              label="Alertas"
              value={`${(project?.warnings.length || 0) + (project?.protectedFilesDetected.length || 0)}`}
              detail="Advertencias y protegidos fuera de alcance"
              tone={
                (project?.protectedFilesDetected.length || 0) > 0 || (project?.warnings.length || 0) > 0
                  ? 'amber'
                  : 'default'
              }
              icon="approval"
            />
          </div>
        </div>

        <div className="space-y-3">
          <ActionTile
            label="Seleccionar proyecto existente"
            detail="Elegí una carpeta para preparar continuidad sin modificarla."
            icon="projects"
            tone="default"
            onClick={onPick}
            disabled={busy}
          />
          <ActionTile
            label="Analizar proyecto"
            detail="Detectá framework, package manager, git, scripts, entrypoints y artefactos protegidos."
            icon="brain"
            tone="sky"
            onClick={onAnalyze}
            disabled={busy || !project?.selectedPath}
          />
          <ActionTile
            label="Limpiar selección"
            detail="Descartá la continuidad elegida y volvé a solo texto + insumos."
            icon="settings"
            tone="default"
            onClick={onClear}
            disabled={busy || !project?.selectedPath}
          />
          <MetricCard
            label="Resumen de continuidad"
            value={summary}
            detail="Seguridad: no se leen archivos sensibles, no se ejecutan scripts y no se modifica la carpeta seleccionada."
            tone="default"
            icon="projects"
            emphasis="hero"
          />
        </div>
      </div>

      {!project ? (
        <EmptyStateBlock
          title="Todavía no hay proyecto existente seleccionado"
          description="Seleccioná una carpeta para ver framework, package manager, git, scripts, entrypoints y artefactos protegidos de forma resumida."
          icon="projects"
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
            <div className="space-y-4">
              <InfoChipBlock
                title="Carpetas importantes"
                icon="folder"
                items={project.importantFolders}
                emptyLabel="No se detectaron carpetas clave."
              />
              <InfoChipBlock
                title="Entrypoints"
                icon="execution"
                items={project.entrypoints}
                emptyLabel="Sin entrypoints detectados."
              />
            </div>

            <div className="space-y-4">
              <ScriptBlock scripts={project.scripts} />
              <WarningsBlock warnings={project.warnings} />
            </div>
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
              description="Se clasificó como cache o artefacto temporal. No cuenta como credencial sensible."
              tone="slate"
              items={runtimeTemporaryFilesDetected}
            />
          ) : null}
        </div>
      )}
    </article>
  )
}

function InfoChipBlock({
  title,
  icon,
  items,
  emptyLabel,
}: {
  title: string
  icon: Parameters<typeof DashboardIcon>[0]['name']
  items: string[]
  emptyLabel: string
}) {
  return (
    <ResultSectionCard
      title={title}
      description="Lectura rápida de carpetas y puntos de entrada para orientar continuidad."
      icon={icon}
      badge={`${items.length}`}
    >
      <div className="flex flex-wrap gap-2">
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
    </ResultSectionCard>
  )
}

function ScriptBlock({ scripts }: { scripts: ExistingProjectScriptEntry[] }) {
  return (
    <ResultSectionCard
      title="Scripts"
      description="Scripts declarados que ayudan a entender la forma de trabajo del proyecto."
      icon="execution"
      badge={`${scripts.length}`}
    >
      <div className="grid gap-2">
        {scripts.length > 0 ? (
          scripts.slice(0, 6).map((entry) => (
            <div
              key={entry.name}
              className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3"
            >
              <div className="text-sm font-semibold text-slate-100">{entry.name}</div>
              <div className="mt-1 break-all text-xs leading-5 text-slate-400">
                {entry.command}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-400">No se detectaron scripts declarados.</div>
        )}
      </div>
    </ResultSectionCard>
  )
}

function WarningsBlock({ warnings }: { warnings: string[] }) {
  return (
    <ResultSectionCard
      title="Advertencias"
      description="Señales útiles para continuidad, sin dramatizar artefactos de runtime temporal."
      icon="approval"
      badge={`${warnings.length}`}
      tone={warnings.length > 0 ? 'amber' : 'default'}
    >
      <div className="grid gap-2">
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
    </ResultSectionCard>
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
  const toneClassName =
    tone === 'amber'
      ? 'border-amber-300/20 bg-amber-300/10 text-amber-50'
      : 'border-white/10 bg-white/[0.03] text-slate-100'

  return (
    <div className={`rounded-[24px] border px-4 py-4 ${toneClassName}`}>
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 text-white">
          <DashboardIcon name={tone === 'amber' ? 'approval' : 'runtime'} className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs leading-5 opacity-80">{description}</div>
        </div>
      </div>
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
