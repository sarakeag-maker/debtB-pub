'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { CostTable } from '@/components/costs/CostTable'
import { AddCostForm } from '@/components/costs/AddCostForm'
import type { LegalCostEntry } from '@/types'

interface CostsClientViewProps {
  instructionId: string
  initialCosts: LegalCostEntry[]
  isSolicitor: boolean
}

export function CostsClientView({ instructionId, initialCosts, isSolicitor }: CostsClientViewProps) {
  const [costs, setCosts] = useState<LegalCostEntry[]>(initialCosts)
  const [refreshKey, setRefreshKey] = useState(0)

  async function handleToggleRecovered(id: string, val: boolean) {
    // Optimistic update
    setCosts((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, recovered: val, recoveredAt: val ? new Date() : null }
          : c
      )
    )

    try {
      const res = await fetch(`/api/instructions/${instructionId}/costs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recovered: val }),
      })

      if (!res.ok) {
        // Revert on failure
        setCosts((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, recovered: !val, recoveredAt: !val ? new Date() : null }
              : c
          )
        )
      } else {
        const updated = await res.json()
        setCosts((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, recovered: updated.recovered, recoveredAt: updated.recoveredAt }
              : c
          )
        )
      }
    } catch {
      // Revert
      setCosts((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, recovered: !val, recoveredAt: !val ? new Date() : null }
            : c
        )
      )
    }
  }

  async function handleAddSuccess() {
    // Re-fetch costs
    const res = await fetch(`/api/instructions/${instructionId}/costs`)
    if (res.ok) {
      const data = await res.json()
      setCosts(data.costs ?? data ?? [])
    }
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <Card title="All Legal Costs">
        <CostTable
          costs={costs}
          editable={isSolicitor}
          onToggleRecovered={isSolicitor ? handleToggleRecovered : undefined}
        />
      </Card>

      {isSolicitor && (
        <Card title="Add New Cost">
          <AddCostForm
            key={refreshKey}
            instructionId={instructionId}
            onSuccess={handleAddSuccess}
          />
        </Card>
      )}
    </div>
  )
}
