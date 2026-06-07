'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

interface Property {
  id: string
  addressLine1: string
  addressLine2?: string
  city?: string
  postcode: string
  buildingName?: string
}

interface Unit {
  id: string
  flatRef: string
  leaseholderName: string
  leaseholderEmail?: string
}

const DEBT_TYPE_OPTIONS = [
  { value: 'UNDISPUTED', label: 'Undisputed' },
  { value: 'DISPUTED', label: 'Disputed' },
]

const DEBT_CATEGORY_OPTIONS = [
  { value: 'SERVICE_CHARGE', label: 'Service Charge' },
  { value: 'GROUND_RENT', label: 'Ground Rent' },
  { value: 'ADMINISTRATION_CHARGE', label: 'Administration Charge' },
  { value: 'INSURANCE_CONTRIBUTION', label: 'Insurance Contribution' },
  { value: 'OTHER', label: 'Other' },
]

const INTEREST_TYPE_OPTIONS = [
  { value: 'STATUTORY', label: 'Statutory (8% p.a.)' },
  { value: 'CONTRACTUAL', label: 'Contractual Rate' },
]

export default function NewInstructionPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [leaseholderName, setLeaseholderName] = useState('')
  const [principalAmount, setPrincipalAmount] = useState('')
  const [debtType, setDebtType] = useState('UNDISPUTED')
  const [debtCategory, setDebtCategory] = useState('SERVICE_CHARGE')
  const [dueFromDate, setDueFromDate] = useState('')
  const [interestType, setInterestType] = useState('STATUTORY')
  const [contractualRate, setContractualRate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [loadingUnits, setLoadingUnits] = useState(false)

  // Redirect non-solicitors
  useEffect(() => {
    if (session && session.user.role !== 'SOLICITOR') {
      router.push('/instructions')
    }
  }, [session, router])

  // Load properties
  useEffect(() => {
    fetch('/api/properties')
      .then((r) => r.json())
      .then((data) => setProperties(data.properties ?? data ?? []))
      .catch(() => setError('Failed to load properties'))
      .finally(() => setLoadingProperties(false))
  }, [])

  // Load units when property changes
  useEffect(() => {
    if (!selectedPropertyId) {
      setUnits([])
      setSelectedUnitId('')
      setLeaseholderName('')
      return
    }
    setLoadingUnits(true)
    fetch(`/api/properties/${selectedPropertyId}`)
      .then((r) => r.json())
      .then((data) => setUnits(data.units ?? []))
      .catch(() => setError('Failed to load units'))
      .finally(() => setLoadingUnits(false))
  }, [selectedPropertyId])

  // Auto-fill leaseholder name when unit selected
  useEffect(() => {
    const unit = units.find((u) => u.id === selectedUnitId)
    setLeaseholderName(unit?.leaseholderName ?? '')
  }, [selectedUnitId, units])

  function propertyLabel(p: Property): string {
    const parts = [p.buildingName, p.addressLine1, p.city, p.postcode].filter(Boolean)
    return parts.join(', ')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const body: Record<string, unknown> = {
        unitId: selectedUnitId,
        principalAmount: parseFloat(principalAmount),
        debtType,
        debtCategory,
        dueFromDate,
        interestType,
      }
      if (interestType === 'CONTRACTUAL' && contractualRate) {
        body.contractualRate = parseFloat(contractualRate) / 100
      }

      const res = await fetch('/api/instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to create instruction')
      }

      const created = await res.json()
      router.push(`/instructions/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Instruction" subtitle="Create a new debt recovery instruction" />

      <Card>
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} dismissible onDismiss={() => setError(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Property */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              required
              disabled={loadingProperties}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            >
              <option value="">{loadingProperties ? 'Loading…' : 'Select a property'}</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {propertyLabel(p)}
                </option>
              ))}
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit / Flat</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              required
              disabled={!selectedPropertyId || loadingUnits}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            >
              <option value="">
                {!selectedPropertyId
                  ? 'Select a property first'
                  : loadingUnits
                  ? 'Loading units…'
                  : 'Select a unit'}
              </option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.flatRef} — {u.leaseholderName}
                </option>
              ))}
            </select>
          </div>

          {/* Leaseholder (auto-filled, readonly) */}
          <Input
            label="Leaseholder Name"
            value={leaseholderName}
            readOnly
            className="bg-gray-50"
          />

          {/* Principal amount */}
          <Input
            label="Principal Amount (£)"
            type="number"
            min="0"
            step="0.01"
            value={principalAmount}
            onChange={(e) => setPrincipalAmount(e.target.value)}
            required
            placeholder="0.00"
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Debt type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Debt Type</label>
              <select
                value={debtType}
                onChange={(e) => setDebtType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {DEBT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Debt category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Debt Category</label>
              <select
                value={debtCategory}
                onChange={(e) => setDebtCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {DEBT_CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due from date */}
          <Input
            label="Debt Due From"
            type="date"
            value={dueFromDate}
            onChange={(e) => setDueFromDate(e.target.value)}
            required
          />

          {/* Interest type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Type</label>
            <select
              value={interestType}
              onChange={(e) => setInterestType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {INTEREST_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Contractual rate (conditional) */}
          {interestType === 'CONTRACTUAL' && (
            <Input
              label="Contractual Rate (% per annum)"
              type="number"
              min="0"
              step="0.01"
              value={contractualRate}
              onChange={(e) => setContractualRate(e.target.value)}
              required
              placeholder="e.g. 8"
            />
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
              Create Instruction
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
