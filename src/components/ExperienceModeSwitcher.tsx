type ExperienceModeSwitcherProps = {
  experienceMode: 'simple' | 'advanced' | 'technical'
  onSelectMode: (mode: 'simple' | 'advanced' | 'technical') => void
}

const EXPERIENCE_MODE_OPTIONS: Array<{
  key: ExperienceModeSwitcherProps['experienceMode']
  label: string
}> = [
  { key: 'simple', label: 'Simple' },
  { key: 'advanced', label: 'Avanzado' },
  { key: 'technical', label: 'Técnico' },
]

export function ExperienceModeSwitcher({
  experienceMode,
  onSelectMode,
}: ExperienceModeSwitcherProps) {
  return (
    <div className="jefe-toggle-shell inline-flex w-full rounded-[18px] p-1">
      {EXPERIENCE_MODE_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          data-active={experienceMode === option.key}
          onClick={() => onSelectMode(option.key)}
          className="jefe-toggle-option min-w-0 flex-1 rounded-[14px] px-3 py-2 text-sm font-semibold transition"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}