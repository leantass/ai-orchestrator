import { SecondaryActionButton } from './AppUiPrimitives'

type GuidedModeSwitcherProps = {
  onOpenAdvanced: () => void
}

export function GuidedModeSwitcher({ onOpenAdvanced }: GuidedModeSwitcherProps) {
  return (
    <SecondaryActionButton onClick={onOpenAdvanced} className="w-auto">
      Panel avanzado
    </SecondaryActionButton>
  )
}