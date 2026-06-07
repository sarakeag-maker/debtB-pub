'use client'

import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { LegalCostEntry } from '@/types'

interface CostTableProps {
  costs: LegalCostEntry[]
  editable?: boolean
  onToggleRecovered?: (id: string, val: boolean) => void
}

const COST_TYPE_LABELS: Record<string, string> = {
  FIXED_FEE: 'Fixed Fee',
  HOURLY: 'Hourly',
  DISBURSEMENT: 'Disbursement',
  COURT_FEE: 'Court Fee',
}

export function CostTable({ costs, editable, onToggleRecovered }: CostTableProps) {
  if (costs.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No legal costs recorded yet.
      </div>
    )
  }

  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0)
  const totalRecovered = costs.filter((c) => c.recovered).reduce((sum, c) => sum + c.amount, 0)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['Date', 'Type', 'Description', 'Added By', 'Amount', 'Recovered'].map((h) => (
              <th
                key={h}
                scope="col"
                className={cn(
                  'px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider',
                  h === 'Amount' ? 'text-right' : 'text-left'
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {costs.map((cost) => (
            <tr key={cost.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {formatDate(cost.incurredAt)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {COST_TYPE_LABELS[cost.costType] ?? cost.costType}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                {cost.description}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {cost.addedBy.name}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                {formatCurrency(cost.amount)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center">
                {editable && onToggleRecovered ? (
                  <input
                    type="checkbox"
                    checked={cost.recovered}
                    onChange={(e) => onToggleRecovered(cost.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-blue-500 cursor-pointer"
                    aria-label={`Mark ${cost.description} as recovered`}
                  />
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      cost.recovered
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {cost.recovered ? 'Yes' : 'No'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-200 bg-gray-50">
            <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-900">
              Totals
            </td>
            <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
              {formatCurrency(totalCosts)}
            </td>
            <td className="px-4 py-3 text-sm font-semibold text-green-700 text-center">
              {formatCurrency(totalRecovered)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
