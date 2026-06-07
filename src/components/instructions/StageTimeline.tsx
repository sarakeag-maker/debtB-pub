import { cn, formatDate, stageColor, formatStageLabel } from '@/lib/utils'
import type { StageHistoryEntry } from '@/types'
import { StageBadge } from './StageBadge'

interface StageTimelineProps {
  history: StageHistoryEntry[]
}

export function StageTimeline({ history }: StageTimelineProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">No stage history recorded yet.</p>
    )
  }

  // Show most recent first
  const sorted = [...history].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  )

  return (
    <ol className="relative border-l border-gray-200 space-y-6 ml-2">
      {sorted.map((entry, idx) => {
        const colorClasses = stageColor(entry.toStage)
        // Extract the bg color for the dot
        const bgClass = colorClasses.split(' ')[0]

        return (
          <li key={entry.id} className="ml-4">
            {/* Dot */}
            <span
              className={cn(
                'absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full ring-2 ring-white',
                bgClass
              )}
              aria-hidden="true"
            />

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <StageBadge stage={entry.toStage} />
                {entry.fromStage && (
                  <span className="text-xs text-gray-400">
                    from {formatStageLabel(entry.fromStage)}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500">
                by{' '}
                <span className="font-medium text-gray-700">
                  {entry.changedBy.name}
                </span>{' '}
                &middot; {formatDate(entry.changedAt)}
              </p>

              {entry.notes && (
                <p className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 border border-gray-100 mt-1">
                  {entry.notes}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
