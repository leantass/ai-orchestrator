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
  default: 'jefe-surface',
  sky: 'jefe-surface jefe-tone-panel-sky',
  emerald: 'jefe-surface jefe-tone-panel-emerald',
  amber: 'jefe-surface jefe-tone-panel-amber',
  rose: 'jefe-surface jefe-tone-panel-rose',
  violet: 'jefe-surface jefe-tone-panel-violet',
}

const toneBadgeClassName: Record<MetricTone, string> = {
  default: 'jefe-status-pill jefe-tone-badge-default',
  sky: 'jefe-status-pill jefe-tone-badge-sky',
  emerald: 'jefe-status-pill jefe-tone-badge-emerald',
  amber: 'jefe-status-pill jefe-tone-badge-amber',
  rose: 'jefe-status-pill jefe-tone-badge-rose',
  violet: 'jefe-status-pill jefe-tone-badge-violet',
}

const toneIconClassName: Record<MetricTone, string> = {
  default: 'jefe-tone-icon-default',
  sky: 'jefe-tone-icon-sky',
  emerald: 'jefe-tone-icon-emerald',
  amber: 'jefe-tone-icon-amber',
  rose: 'jefe-tone-icon-rose',
  violet: 'jefe-tone-icon-violet',
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
  disabled = false,
  label,
  description,
  badge,
  icon,
  onClick,
}: {
  active: boolean
  disabled?: boolean
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
      disabled={disabled}
      aria-disabled={disabled}
      data-active={active}
      className={joinClasses(
        'group relative w-full overflow-hidden rounded-[22px] border px-4 py-3 text-left transition duration-200',
        active
          ? 'border-[color:var(--jefe-primary-line)] bg-[color:var(--jefe-primary-soft)] text-[color:var(--jefe-text-strong)] shadow-[var(--jefe-shadow-soft)]'
          : disabled
            ? 'cursor-not-allowed border-[color:var(--jefe-line)] bg-[color:var(--jefe-panel-soft)] text-[color:var(--jefe-subtle)] opacity-70'
            : 'border-[color:var(--jefe-line)] bg-[color:var(--jefe-elevated)] text-[color:var(--jefe-text)] hover:border-[color:var(--jefe-line-strong)] hover:bg-[color:var(--jefe-panel-soft)]',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={joinClasses(
              'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border',
              active
                ? 'border-[color:var(--jefe-primary-line)] bg-[color:var(--jefe-primary-soft)] text-[color:var(--jefe-primary)]'
                : disabled
                  ? 'border-[color:var(--jefe-line)] bg-[color:var(--jefe-panel-soft)] text-[color:var(--jefe-subtle)]'
                  : 'border-[color:var(--jefe-line)] bg-[color:var(--jefe-panel-muted)] text-[color:var(--jefe-muted)]',
            )}
          >
            <DashboardIcon name={resolvedIcon} className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{label}</div>
            {active && description ? (
              <div className="mt-1 text-xs leading-5 text-[color:var(--jefe-muted)]">{description}</div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge ? <SurfaceHeaderTag>{badge}</SurfaceHeaderTag> : null}
          <ChevronRight
            className={joinClasses(
              'h-4 w-4 transition',
              active
                ? 'text-[color:var(--jefe-primary)]'
                : disabled
                  ? 'text-[color:var(--jefe-subtle)]'
                  : 'text-[color:var(--jefe-subtle)] group-hover:text-[color:var(--jefe-text)]',
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
    <div className="flex flex-col gap-4 border-b border-[color:var(--jefe-line)] pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-start gap-4">
        {icon ? (
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border jefe-tone-icon-sky sm:inline-flex">
            <DashboardIcon name={icon} className="h-5 w-5" />
          </div>
        ) : null}
        <div className="space-y-2">
          {eyebrow ? (
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--jefe-primary)]">
              {eyebrow}
            </div>
          ) : null}
          <div className="text-2xl font-semibold tracking-tight text-[color:var(--jefe-text-strong)]">{title}</div>
          <p className="max-w-3xl text-sm leading-6 text-[color:var(--jefe-muted)]">{description}</p>
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
        'relative overflow-hidden rounded-[24px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        tonePanelClassName[tone],
        emphasis === 'hero' ? 'min-h-[150px] p-5' : 'min-h-[116px]',
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--jefe-line-strong)] to-transparent" />
      <div className="relative flex h-full flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--jefe-subtle)]">
                {label}
              </div>
              {badge ? <SurfaceHeaderTag>{badge}</SurfaceHeaderTag> : null}
            </div>
            <div
              className={joinClasses(
                'mt-3 font-semibold leading-tight text-[color:var(--jefe-text-strong)]',
                emphasis === 'hero' ? 'text-[1.05rem] leading-7' : 'text-sm leading-6',
              )}
            >
              {value}
            </div>
          </div>
          <div
            className={joinClasses(
              'inline-flex shrink-0 items-center justify-center rounded-[16px] border',
              emphasis === 'hero' ? 'h-11 w-11' : 'h-9 w-9',
              toneIconClassName[tone],
            )}
          >
            <DashboardIcon name={icon} className={emphasis === 'hero' ? 'h-5 w-5' : 'h-4 w-4'} />
          </div>
        </div>

        <div className="space-y-3">
          {detail ? <div className="text-xs leading-5 text-[color:var(--jefe-muted)]">{detail}</div> : null}
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
        'group relative overflow-hidden rounded-[20px] border px-3.5 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition',
        tonePanelClassName[tone],
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'hover:border-[color:var(--jefe-line-strong)] hover:bg-[color:var(--jefe-panel-soft)]',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={joinClasses(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border',
            toneIconClassName[tone],
          )}
        >
          <DashboardIcon name={icon} className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[color:var(--jefe-text-strong)]">{label}</div>
            {badge ? <SurfaceHeaderTag>{badge}</SurfaceHeaderTag> : null}
          </div>
          <div className="mt-1 text-xs leading-5 text-[color:var(--jefe-muted)]">{detail}</div>
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

export function PrimaryActionButton({
  children,
  onClick,
  disabled,
  tone = 'sky',
  className,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  tone?: MetricTone
  className?: string
}) {
  const toneClassName: Record<MetricTone, string> = {
    default:
      'border-[color:var(--jefe-primary-line)] bg-[color:var(--jefe-primary)] text-[color:var(--jefe-primary-text)] hover:brightness-105 shadow-[0_20px_44px_rgba(37,99,235,0.18)]',
    sky: 'border-[color:var(--jefe-primary-line)] bg-[color:var(--jefe-primary)] text-[color:var(--jefe-primary-text)] hover:brightness-105 shadow-[0_20px_44px_rgba(37,99,235,0.18)]',
    emerald:
      'border-transparent bg-[color:var(--jefe-success)] text-white hover:brightness-105 shadow-[0_20px_44px_rgba(22,163,74,0.18)]',
    amber:
      'border-transparent bg-[color:var(--jefe-warning)] text-white hover:brightness-105 shadow-[0_20px_44px_rgba(217,119,6,0.18)]',
    rose: 'border-transparent bg-[color:var(--jefe-danger)] text-white hover:brightness-105 shadow-[0_20px_44px_rgba(220,38,38,0.18)]',
    violet:
      'border-transparent bg-[color:var(--jefe-accent-violet)] text-white hover:brightness-105 shadow-[0_20px_44px_rgba(139,92,246,0.18)]',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={joinClasses(
        'w-full rounded-[20px] border px-4 py-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-[color:var(--jefe-line)] disabled:bg-[color:var(--jefe-panel-soft)] disabled:text-[color:var(--jefe-subtle)]',
        toneClassName[tone],
        className,
      )}
    >
      {children}
    </button>
  )
}

export function SecondaryActionButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={joinClasses(
        'jefe-secondary-button w-full rounded-[18px] px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:text-[color:var(--jefe-subtle)]',
        className,
      )}
    >
      {children}
    </button>
  )
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
        <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--jefe-subtle)]">
          <span>{label}</span>
          <span>{`${clampedValue}%`}</span>
        </div>
      ) : null}
      <div
        className={joinClasses(
          'rounded-full border border-[color:var(--jefe-line)] bg-[color:var(--jefe-panel-muted)] p-1',
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
        'overflow-hidden rounded-[28px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
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
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--jefe-subtle)]">
                {title}
              </div>
              {badge ? <SurfaceHeaderTag>{badge}</SurfaceHeaderTag> : null}
            </div>
            {description ? (
              <div className="text-sm leading-6 text-[color:var(--jefe-muted)]">{description}</div>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </article>
  )
}

export function DisclosurePanel({
  title,
  description,
  children,
  icon = 'status',
  badge,
  tone = 'default',
  defaultOpen = false,
}: {
  title: string
  description?: string
  children: ReactNode
  icon?: AppIconName
  badge?: string
  tone?: MetricTone
  defaultOpen?: boolean
}) {
  return (
    <details
      open={defaultOpen}
      className="group"
    >
      <div
        className={joinClasses(
          'rounded-[24px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
          tonePanelClassName[tone],
        )}
      >
        <summary className="cursor-pointer list-none">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={joinClasses(
                    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
                    toneIconClassName[tone],
                  )}
              >
                <DashboardIcon name={icon} className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--jefe-subtle)]">
                    {title}
                  </div>
                  {badge ? <SurfaceHeaderTag>{badge}</SurfaceHeaderTag> : null}
                </div>
                {description ? (
                  <div className="mt-1 text-sm leading-6 text-[color:var(--jefe-muted)]">{description}</div>
                ) : null}
              </div>
            </div>
            <ChevronRight
              className="mt-1 h-4 w-4 shrink-0 text-[color:var(--jefe-subtle)] transition group-open:rotate-90"
              strokeWidth={1.8}
            />
          </div>
        </summary>
        <div className="mt-4">{children}</div>
      </div>
    </details>
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
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--jefe-subtle)]">
                  {item.label}
                </div>
                <div className="mt-2 text-sm font-semibold leading-6 text-[color:var(--jefe-text-strong)]">
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
              <div className="mt-2 text-xs leading-5 text-[color:var(--jefe-muted)]">{item.detail}</div>
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
    <div className="jefe-surface-soft rounded-[24px] border-dashed px-4 py-8 text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border jefe-tone-icon-default">
        <DashboardIcon name={icon} className="h-5 w-5" />
      </div>
      <div className="mt-4 text-sm font-semibold text-[color:var(--jefe-text-strong)]">{title}</div>
      <div className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[color:var(--jefe-muted)]">
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
        'rounded-[24px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
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
          <div className="text-sm font-semibold text-[color:var(--jefe-text-strong)]">{label}</div>
          <div className="mt-1 text-xs leading-5 text-[color:var(--jefe-muted)]">{detail}</div>
        </div>
      </div>
    </div>
  )
}

export function SurfaceHeaderTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-[color:var(--jefe-line)] bg-[color:var(--jefe-panel-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--jefe-muted)]">
      {children}
    </span>
  )
}

export { BookCopy, Bot, Clock3, Cog, PanelRightOpen }
