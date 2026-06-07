'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FilterState } from '@/types'

const STAGE_OPTIONS = [
  { value: '', label: 'All Stages' },
  { value: 'DEMAND_LETTER', label: 'Demand Letter' },
  { value: 'LETTER_BEFORE_ACTION', label: 'Letter Before Action' },
  { value: 'CHASER', label: 'Chaser' },
  { value: 'DRAFT_CLAIM', label: 'Draft Claim' },
  { value: 'CLAIM_ISSUED', label: 'Claim Issued' },
  { value: 'ENFORCEMENT', label: 'Enforcement' },
  { value: 'RESOLVED', label: 'Resolved' },
]

const DEBT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'UNDISPUTED', label: 'Undisputed' },
  { value: 'DISPUTED', label: 'Disputed' },
]

interface InstructionFiltersProps {
  onChange: (f: FilterState) => void
}

export function InstructionFilters({ onChange }: InstructionFiltersProps) {
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('')
  const [debtType, setDebtType] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notifyChange = useCallback(
    (s: string, st: string, dt: string) => {
      onChange({ search: s || undefined, stage: st || undefined, debtType: dt || undefined, page: 1 })
    },
    [onChange]
  )

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      notifyChange(search, stage, debtType)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, stage, debtType, notifyChange])

  function handleClear() {
    setSearch('')
    setStage('')
    setDebtType('')
  }

  const hasFilters = search || stage || debtType

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Text search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reference, property, leaseholder…"
          className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-72 bg-white"
        />
      </div>

      {/* Stage filter */}
      <select
        value={stage}
        onChange={(e) => setStage(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {STAGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Debt type filter */}
      <select
        value={debtType}
        onChange={(e) => setDebtType(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {DEBT_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Clear button */}
      {hasFilters && (
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors bg-white"
        >
          <X className="w-3.5 h-3.5" />
          Clear filters
        </button>
      )}
    </div>
  )
}
