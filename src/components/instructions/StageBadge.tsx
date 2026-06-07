import { cn } from '@/lib/utils'
import { stageColor, formatStageLabel } from '@/lib/utils'

interface StageBadgeProps {
  stage: string
}

export function StageBadge({ stage }: StageBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        stageColor(stage)
      )}
    >
      {formatStageLabel(stage)}
    </span>
  )
}
