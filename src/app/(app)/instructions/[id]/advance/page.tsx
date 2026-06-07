'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { StageBadge } from '@/components/instructions/StageBadge'
import { ArrowRight } from 'lucide-react'
import { getNextStage, formatStageLabel } from '@/lib/interest'
import type { InstructionStage } from '@prisma/client'

interface InstructionData {
  id: string
  reference: string
  currentStage: InstructionStage
  principalAmount: number
}

export default function AdvanceStagePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [instruction, setInstruction] = useState<InstructionData | null>(null)
  const [notes, setNotes] = useState('')
  const [resolvedAmount, setResolvedAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session && session.user.role !== 'SOLICITOR') {
      router.push(`/instructions/${id}`)
      return
    }
    fetch(`/api/instructions/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setInstruction({
          id: data.id,
          reference: data.reference,
          currentStage: data.currentStage,
          principalAmount: data.principalAmount,
        })
      })
      .catch(() => setError('Failed to load instruction'))
      .finally(() => setLoading(false))
  }, [id, session, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const body: Record<string, unknown> = { notes: notes || undefined }
      if (nextStage === 'RESOLVED' && resolvedAmount) {
        body.resolvedAmount = parseFloat(resolvedAmount)
      }

      const res = await fetch(`/api/instructions/${id}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to advance stage')
      }

      router.push(`/instructions/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    )
  }

  if (!instruction) {
    return <Alert type="error" message="Instruction not found." />
  }

  const nextStage = getNextStage(instruction.currentStage)

  if (!nextStage) {
    return (
      <div className="max-w-lg">
        <PageHeader title="Advance Stage" subtitle={instruction.reference} />
        <Alert type="info" message="This instruction is already at the final stage (Resolved)." />
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="Advance Stage" subtitle={instruction.reference} />

      <Card>
        {error && (
          <div className="mb-5">
            <Alert type="error" message={error} dismissible onDismiss={() => setError(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Stage transition display */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <StageBadge stage={instruction.currentStage} />
            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <StageBadge stage={nextStage} />
          </div>

          <p className="text-sm text-gray-600">
            Advancing from{' '}
            <span className="font-medium">{formatStageLabel(instruction.currentStage)}</span> to{' '}
            <span className="font-medium">{formatStageLabel(nextStage)}</span>.
            This action will be recorded in the stage history.
          </p>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any notes about this stage change…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Resolved amount (only when advancing to RESOLVED) */}
          {nextStage === 'RESOLVED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resolved Amount (£)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={resolvedAmount}
                onChange={(e) => setResolvedAmount(e.target.value)}
                placeholder={String(instruction.principalAmount)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave blank to use the principal amount ({instruction.principalAmount})
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Confirm Advance
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
