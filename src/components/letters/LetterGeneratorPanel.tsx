'use client'

import { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { formatDate, formatStageLabel } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'

const STAGE_OPTIONS = [
  { value: 'DEMAND_LETTER', label: 'Demand Letter' },
  { value: 'LETTER_BEFORE_ACTION', label: 'Letter Before Action' },
  { value: 'CHASER', label: 'Chaser' },
  { value: 'DRAFT_CLAIM', label: 'Draft Claim' },
  { value: 'CLAIM_ISSUED', label: 'Claim Issued' },
  { value: 'ENFORCEMENT', label: 'Enforcement' },
]

interface LetterEntry {
  id: string
  stage: string
  generatedAt: string
}

interface LetterGeneratorPanelProps {
  instructionId: string
  currentStage: string
  letters: LetterEntry[]
}

export function LetterGeneratorPanel({
  instructionId,
  currentStage,
  letters: initialLetters,
}: LetterGeneratorPanelProps) {
  const [selectedStage, setSelectedStage] = useState(currentStage)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [letters, setLetters] = useState<LetterEntry[]>(initialLetters)

  async function handleGenerate() {
    setError(null)
    setSuccess(null)
    setGenerating(true)

    try {
      const res = await fetch(`/api/instructions/${instructionId}/letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: selectedStage }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to generate letter')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `letter-${selectedStage.toLowerCase()}-${instructionId}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Add to local list
      setLetters((prev) => [
        {
          id: crypto.randomUUID(),
          stage: selectedStage,
          generatedAt: new Date().toISOString(),
        },
        ...prev,
      ])

      setSuccess(`Letter generated and downloading — ${formatStageLabel(selectedStage)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate letter')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert type="error" message={error} dismissible onDismiss={() => setError(null)} />
      )}
      {success && (
        <Alert type="success" message={success} dismissible onDismiss={() => setSuccess(null)} />
      )}

      {/* Generator controls */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Letter Stage
          </label>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            disabled={generating}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          >
            {STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="primary"
          onClick={handleGenerate}
          disabled={generating}
          loading={generating}
          className="flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          {generating ? 'Generating…' : 'Generate Letter'}
        </Button>
      </div>

      {/* Previously generated letters */}
      {letters.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Previously Generated
          </p>
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden">
            {letters.map((letter) => (
              <li
                key={letter.id}
                className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-700">
                    {formatStageLabel(letter.stage)}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {formatDate(letter.generatedAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
