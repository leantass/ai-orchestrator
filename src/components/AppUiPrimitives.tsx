import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  ArrowUpRight,
  BookCopy,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Cable,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  Cog,
  FolderKanban,
  FolderOpen,
  Gauge,
  GitBranch,
  HardDrive,
  History,
  Home,
  LayoutDashboard,
  Layers3,
  ListChecks,
  MemoryStick,
  PanelRightOpen,
  PlayCircle,
  Radar,
  Rocket,
  ScrollText,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
} from 'lucide-react'

const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

export type MetricTone = 'default' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet'

export type AppIconName =
  | 'activity'
  | 'advanced'
  | 'approval'
  | 'brain'
  | 'build'
  | 'connectors'
  | 'context'
  | 'execution'
  | 'files'
  | 'flow'
  | 'folder'
  | 'git'
  | 'goal'
  | 'guided'
  | 'history'
  | 'home'
  | 'memory'
  | 'next'
  | 'plan'
  | 'projects'
  | 'reports'
  | 'result'
  | 'runs'
  | 'runtime'
  | 'services'
  | 'settings'
  | 'shield'
  | 'status'
  | 'workspace'

const iconMap: Record<AppIconName, LucideIcon> = {
  activity: Activity,
  advanced: LayoutDashboard,
  approval: ShieldCheck,
  brain: BrainCircuit,
  build: Rocket,
  connectors: Cable,
  context: FolderOpen,
  execution: PlayCircle,
  files: ScrollText,
  flow: Workflow,
  folder: FolderKanban,
  git: GitBranch,
  goal: Target,
  guided: Sparkles,
  history: History,
  home: Home,
  memory: MemoryStick,
  next: ArrowUpRight,
  plan: Radar,
  projects: BriefcaseBusiness,
  reports: ChartNoAxesCombined,
  result: CheckCircle2,
  runs: ListChecks,
  runtime: HardDrive,
  services: Gauge,
  settings: Settings2,
  shield: ShieldCheck,
  status: CircleDashed,
  workspace: Layers3,
}

const tonePanelClassName: Record<MetricTone, string> = {
  default:
    'border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))]',
  sky:
    'border-sky-300/18 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_40%),linear-gradient(180deg,rgba(56,189,248,0.1),rgba(8,15,28,0.68))]',
  emerald:
    'border-emerald-300/18 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.14),transparent_40%),linear-gradient(180deg,rgba(52,211,153,0.09),rgba(8,15,28,0.68))]',
  amber:
    'border-amber-300/18 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.14),transparent_40%),linear-gradient(180deg,rgba(251,191,36,0.09),rgba(8,15,28,0.68))]',
  rose:
    'border-rose-300/18 bg-[radial-gradient(circle_at_top_right,rgba(251,113,133,0.16),transparent_40%),linear-gradient(180deg,rgba(251,113,133,0.09),rgba(8,15,28,0.68))]',
  violet:
    'border-violet-300/18 bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,0.16),transparent_40%),linear-gradient(180deg,rgba(167,139,250,0.1),rgba(8,15,28,0.68))]',
}

const toneBadgeClassName: Record<MetricTone, string> = {
  default: 'border-white/10 bg-white/[0.06] text-slate-100',
  sky: 'border-sky-300/20 bg-sky-300/10 text-sky-100',
  emerald: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100',
  amber: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
  rose: 'border-rose-300/20 bg-rose-300/10 text-rose-100',
  violet: 'border-violet-300/20 bg-violet-300/10 text-violet-100',
}

const toneIconClassName: Record<MetricTone, string> = {
  default: 'border-white/10 bg-slate-950/70 text-slate-200',
  sky: 'border-sky-300/20 bg-sky-300/12 text-sky-100',
  emerald: 'border-emerald-300/20 bg-emerald-300/12 text-emerald-100',
  amber: 'border-amber-300/20 bg-amber-300/12 text-amber-100',
  rose: 'border-rose-300/20 bg-rose-300/12 text-rose-100',
  violet: 'border-violet-300/20 bg-violet-300/12 text-violet-100',
}

const toneProgressClassName: Record<MetricTone, string> = {
  default: 'from-slate-300/40 via-slate-200/50 to-white/55',
  sky: 'from-sky-400 via-cyan-200 to-cyan-50',
  emerald: 'from-emerald-400 via-emerald-200 to-emerald-50',
  amber: 'from-amber-400 via-amber-200 to-amber-50',
  rose: 'from-rose-400 via-rose-200 to-rose-50',
  violet: 'from-violet-400 via-violet-200 to-violet-50',
}

export function DashboardIcon({
  name,
  className,
}: {
  name: AppIconName
  className?: string
}) {
  const Icon = iconMap[name]
  return <Icon className={joinClasses('h-4 w-4', className)} strokeWidth={1.9} />
}

function inferSidebarIcon(label: string): AppIconName {
  const normalizedLabel = label.toLowerCase()
  if (normalizedLabel.includes('inicio')) return 'home'
  if (normalizedLabel.includes('guiado')) return 'guided'
  if (normalizedLabel.includes('avanzado')) return 'advanced'
  if (normalizedLabel.includes('corrida')) return 'runs'
  if (normalizedLabel.includes('historial')) return 'history'
  if (normalizedLabel.includes('reporte')) return 'reports'
  if (normalizedLabel.includes('memoria')) return 'memory'
  if (normalizedLabel.includes('context')) return 'context'
  if (normalizedLabel.includes('proyecto')) return 'projects'
  if (normalizedLabel.includes('conector')) return 'connectors'
  if (normalizedLabel.includes('ajuste')) return 'settings'
  return 'flow'
}

export function SidebarSectionButton({
  active,
  label,
  description,
  badge,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  description: string
  badge?: string
  icon?: AppIconName
  onClick: () => void
}) {
  const resolvedIcon = icon || inferSidebarIcon(label)

  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      className={joinClasses(
        'group relative w-full overflow-hidden rounded-[24px] border px-4 py-4 text-left transition duration-200',
        active
          ? 'border-cyan-300/30 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_32%),linear-gradient(180deg,rgba(56,189,248,0.12),rgba(8,15,28,0.92))] text-white shadow-[0_18px_48px_rgba(56,189,248,0.13)]'
          : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] text-slate-200 hover:border-white/20 hover:bg-white/[0.06]',
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
      <div
        className={joinClasses(
          'absolute inset-y-3 left-0 w-1 rounded-r-full transition',
          active ? 'bg-cyan-300/80' : 'bg-transparent group-hover:bg-white/12',
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div
            className={joinClasses(
              'mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border',
              active
                ? 'border-cyan-300/22 bg-cyan-300/12 text-cyan-100'
                : 'border-white/10 bg-slate-950/60 text-slate-300',
            )}
          >
            <DashboardIcon name={resolvedIcon} className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{label}</div>
            <div className="mt-1 text-xs leading-5 text-slate-400">{description}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {badge ? (
            <span className="rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              {badge}
            </span>
          ) : null}
          <ChevronRight
            className={joinClasses(
              'h-4 w-4 transition',
              active ? 'text-cyan-100' : 'text-slate-500 group-hover:text-slate-300',
            )}
            strokeWidth={1.8}
          />
        </div>
      </div>
    </button>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  icon,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  icon?: AppIconName
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-start gap-4">
        {icon ? (
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-100 sm:inline-flex">
            <DashboardIcon name={icon} className="h-5 w-5" />
          </div>
        ) : null}
        <div className="space-y-2">
          {eyebrow ? (
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80">
              {eyebrow}
            </div>
          ) : null}
          <div className="text-2xl font-semibold tracking-tight text-white">{title}</div>
          <p className="max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
        </div>
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
  icon = 'status',
  emphasis = 'compact',
  badge,
  progress,
  className,
  footer,
}: {
  label: string
  value: string
  detail?: string
  tone?: MetricTone
  icon?: AppIconName
  emphasis?: 'compact' | 'hero'
  badge?: string
  progress?: number
  className?: string
  footer?: ReactNode
}) {
  const clampedProgress =
    typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : null

  return (
    <article
      className={joinClasses(
        'relative overflow-hidden rounded-[26px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        tonePanelClassName[tone],
        emphasis === 'hero' ? 'min-h-[180px] p-5' : 'min-h-[138px]',
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)] opacity-80" />
      <div className="relative flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {label}
              </div>
              {badge ? <SurfaceHeaderTag>{badge}</SurfaceHeaderTag> : null}
            </div>
            <div
              className={joinClasses(
                'mt-3 font-semibold leading-tight text-slate-50',
                emphasis === 'hero' ? 'text-[1.15rem] leading-8' : 'text-sm leading-6',
              )}
            >
              {value}
            </div>
          </div>
          <div
            className={joinClasses(
              'inline-flex shrink-0 items-center justify-center rounded-[18px] border',
              emphasis === 'hero' ? 'h-12 w-12' : 'h-10 w-10',
              toneIconClassName[tone],
            )}
          >
            <DashboardIcon name={icon} className={emphasis === 'hero' ? 'h-5 w-5' : 'h-4 w-4'} />
          </div>
        </div>

        <div className="space-y-3">
          {detail ? <div className="text-xs leading-5 text-slate-400">{detail}</div> : null}
          {clampedProgress !== null ? (
            <ProgressMeter value={clampedProgress} tone={tone} compact />
          ) : null}
          {footer ? <div>{footer}</div> : null}
        </div>
      </div>
    </article>
  )
}

export function ActionTile({
  label,
  detail,
  icon = 'next',
  tone = 'default',
  badge,
  onClick,
  disabled,
}: {
  label: string
  detail: string
  icon?: AppIconName
  tone?: MetricTone
  badge?: string
  onClick?: () => void
  disabled?: boolean
}) {
  const content = (
    <div
      className={joinClasses(
        'group relative overflow-hidden rounded-[24px] border px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition',
        tonePanelClassName[tone],
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-white/16 hover:bg-white/[0.06]',
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
      <div className="flex items-start gap-3">
        <div
          className={joinClasses(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border',
            toneIconClassName[tone],
          )}
        >
          <DashboardIcon name={icon} className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">{label}</div>
            {badge ? <SurfaceHeaderTag>{badge}</SurfaceHeaderTag> : null}
          </div>
          <div className="mt-2 text-xs leading-5 text-slate-400">{detail}</div>
        </div>
      </div>
    </div>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className="w-full">
        {content}
      </button>
    )
  }

  return content
}

export function ProgressMeter({
  value,
  tone = 'sky',
  compact = false,
  label,
}: {
  value: number
  tone?: MetricTone
  compact?: boolean
  label?: string
}) {
  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          <span>{label}</span>
          <span>{`${clampedValue}%`}</span>
        </div>
      ) : null}
      <div
        className={joinClasses(
          'rounded-full border border-white/8 bg-slate-950/70 p-1',
          compact ? 'p-[3px]' : 'p-1',
        )}
      >
        <div
          className={joinClasses(
            'rounded-full bg-gradient-to-r transition-all duration-500',
            compact ? 'h-1.5' : 'h-2.5',
            toneProgressClassName[tone],
          )}
          style={{ width: `${Math.max(clampedValue, 4)}%` }}
        />
      </div>
    </div>
  )
}

export function ResultSectionCard({
  title,
  description,
  children,
  icon = 'status',
  actions,
  tone = 'default',
  badge,
}: {
  title: string
  description?: string
  children: ReactNode
  icon?: AppIconName
  actions?: ReactNode
  tone?: MetricTone
  badge?: string
}) {
  return (
    <article
      className={joinClasses(
        'overflow-hidden rounded-[30px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        tonePanelClassName[tone],
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={joinClasses(
              'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
              toneIconClassName[tone],
            )}
          >
            <DashboardIcon name={icon} className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {title}
              </div>
              {badge ? <SurfaceHeaderTag>{badge}</SurfaceHeaderTag> : null}
            </div>
            {description ? (
              <div className="text-sm leading-6 text-slate-400">{description}</div>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
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
  return (
    <span
      className={joinClasses(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]',
        toneBadgeClassName[tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
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
    tone?: MetricTone
    icon?: AppIconName
  }>
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const tone = item.tone || 'default'
        return (
          <div
            key={`${item.label}-${item.value}`}
            className={joinClasses(
              'rounded-[22px] border px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
              tonePanelClassName[tone],
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </div>
                <div className="mt-2 text-sm font-semibold leading-6 text-slate-100">
                  {item.value}
                </div>
              </div>
              {item.icon ? (
                <div
                  className={joinClasses(
                    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border',
                    toneIconClassName[tone],
                  )}
                >
                  <DashboardIcon name={item.icon} className="h-4 w-4" />
                </div>
              ) : null}
            </div>
            {item.detail ? (
              <div className="mt-2 text-xs leading-5 text-slate-400">{item.detail}</div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function EmptyStateBlock({
  title,
  description,
  icon = 'status',
}: {
  title: string
  description: string
  icon?: AppIconName
}) {
  return (
    <div className="rounded-[26px] border border-dashed border-white/12 bg-slate-950/40 px-4 py-10 text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300">
        <DashboardIcon name={icon} className="h-5 w-5" />
      </div>
      <div className="mt-4 text-sm font-semibold text-slate-100">{title}</div>
      <div className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-400">
        {description}
      </div>
    </div>
  )
}

export function InlineHint({
  label,
  detail,
  tone = 'default',
  icon = 'next',
}: {
  label: string
  detail: string
  tone?: MetricTone
  icon?: AppIconName
}) {
  return (
    <div
      className={joinClasses(
        'rounded-[26px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
        tonePanelClassName[tone],
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={joinClasses(
            'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
            toneIconClassName[tone],
          )}
        >
          <DashboardIcon name={icon} className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-100">{label}</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">{detail}</div>
        </div>
      </div>
    </div>
  )
}

export function SurfaceHeaderTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
      {children}
    </span>
  )
}

export { BookCopy, Bot, Clock3, Cog, PanelRightOpen }
