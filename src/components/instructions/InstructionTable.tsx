'use client'

import Link from 'next/link'
import { cn, formatCurrency, formatDate, debtTypeColor } from '@/lib/utils'
import { calculateInterest } from '@/lib/interest'
import { StageBadge } from './StageBadge'
import type { InstructionSummary } from '@/types'
import { differenceInDays } from 'date-fns'

interface InstructionTableProps {
  instructions: InstructionSummary[]
  role: string
  loading?: boolean
}

export function InstructionTable({ instructions, role, loading }: InstructionTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <TableHead />
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {Array.from({ length: 9 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (instructions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500 text-sm">No instructions found.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <TableHead />
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {instructions.map((instruction) => {
              const interestResult = calculateInterest({
                principalAmount: instruction.principalAmount,
                dueFromDate: instruction.dueFromDate,
                interestType: 'STATUTORY',
              })

              const ageDays = differenceInDays(new Date(), new Date(instruction.createdAt))

              return (
                <tr key={instruction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-mono font-medium text-gray-700">
                      {instruction.reference}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="min-w-[160px]">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {instruction.propertyAddress}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {instruction.leaseholderName}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StageBadge stage={instruction.currentStage} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        debtTypeColor(instruction.debtType)
                      )}
                    >
                      {instruction.debtType === 'UNDISPUTED' ? 'Undisputed' : 'Disputed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(instruction.principalAmount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                    {formatCurrency(interestResult.interest)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(interestResult.total)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                    {ageDays}d
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <Link
                      href={`/instructions/${instruction.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-[#1e3a5f] bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TableHead() {
  return (
    <tr>
      {[
        { label: 'Reference', align: 'left' },
        { label: 'Property & Leaseholder', align: 'left' },
        { label: 'Stage', align: 'left' },
        { label: 'Debt Type', align: 'left' },
        { label: 'Principal', align: 'right' },
        { label: 'Interest', align: 'right' },
        { label: 'Total', align: 'right' },
        { label: 'Age', align: 'right' },
        { label: 'Actions', align: 'right' },
      ].map(({ label, align }) => (
        <th
          key={label}
          scope="col"
          className={cn(
            'px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider',
            align === 'right' ? 'text-right' : 'text-left'
          )}
        >
          {label}
        </th>
      ))}
    </tr>
  )
}
