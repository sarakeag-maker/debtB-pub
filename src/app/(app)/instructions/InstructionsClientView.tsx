'use client'

import { useState, useMemo } from 'react'
import { InstructionFilters } from '@/components/instructions/InstructionFilters'
import { InstructionTable } from '@/components/instructions/InstructionTable'
import type { InstructionSummary, FilterState } from '@/types'

interface InstructionsClientViewProps {
  instructions: InstructionSummary[]
  role: string
}

export function InstructionsClientView({ instructions, role }: InstructionsClientViewProps) {
  const [filters, setFilters] = useState<FilterState>({ page: 1 })

  const filtered = useMemo(() => {
    return instructions.filter((inst) => {
      if (filters.stage && inst.currentStage !== filters.stage) return false
      if (filters.debtType && inst.debtType !== filters.debtType) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const matchRef = inst.reference.toLowerCase().includes(q)
        const matchAddr = inst.propertyAddress.toLowerCase().includes(q)
        const matchName = inst.leaseholderName.toLowerCase().includes(q)
        if (!matchRef && !matchAddr && !matchName) return false
      }
      return true
    })
  }, [instructions, filters])

  return (
    <div className="space-y-4">
      <InstructionFilters onChange={setFilters} />
      <div className="text-xs text-gray-500">
        Showing {filtered.length} of {instructions.length} instructions
      </div>
      <InstructionTable instructions={filtered} role={role} />
    </div>
  )
}
