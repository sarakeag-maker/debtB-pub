'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

const schema = z.object({
  costType: z.enum(['FIXED_FEE', 'HOURLY', 'DISBURSEMENT', 'COURT_FEE']),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  incurredAt: z.string().min(1, 'Date is required'),
  recovered: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface AddCostFormProps {
  instructionId: string
  onSuccess: () => void
}

const COST_TYPE_OPTIONS = [
  { value: 'FIXED_FEE', label: 'Fixed Fee' },
  { value: 'HOURLY', label: 'Hourly' },
  { value: 'DISBURSEMENT', label: 'Disbursement' },
  { value: 'COURT_FEE', label: 'Court Fee' },
]

export function AddCostForm({ instructionId, onSuccess }: AddCostFormProps) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      costType: 'FIXED_FEE',
      description: '',
      amount: undefined,
      incurredAt: new Date().toISOString().split('T')[0],
      recovered: false,
    },
  })

  async function onSubmit(data: FormValues) {
    setError(null)
    try {
      const res = await fetch(`/api/instructions/${instructionId}/costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to add cost')
      }

      reset()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert type="error" message={error} dismissible onDismiss={() => setError(null)} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Cost type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cost Type
          </label>
          <select
            {...register('costType')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {COST_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.costType && (
            <p className="mt-1 text-xs text-red-600">{errors.costType.message}</p>
          )}
        </div>

        {/* Amount */}
        <Input
          label="Amount (£)"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount')}
        />

        {/* Description */}
        <div className="sm:col-span-2">
          <Input
            label="Description"
            placeholder="e.g. Court filing fee, letter drafting…"
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        {/* Incurred at */}
        <Input
          label="Date Incurred"
          type="date"
          error={errors.incurredAt?.message}
          {...register('incurredAt')}
        />

        {/* Recovered */}
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('recovered')}
              className="w-4 h-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Already recovered</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isSubmitting} variant="primary">
          Add Cost
        </Button>
      </div>
    </form>
  )
}
