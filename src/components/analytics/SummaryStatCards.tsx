import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCard {
  label: string
  value: string
  delta?: string
  positive?: boolean
}

interface SummaryStatCardsProps {
  stats: StatCard[]
}

export function SummaryStatCards({ stats }: SummaryStatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-5"
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {stat.label}
          </p>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          {stat.delta && (
            <div
              className={cn(
                'flex items-center gap-1 mt-2 text-xs font-medium',
                stat.positive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {stat.positive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {stat.delta}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
