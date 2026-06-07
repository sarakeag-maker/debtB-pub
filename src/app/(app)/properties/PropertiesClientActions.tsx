'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Plus } from 'lucide-react'

interface PropertiesClientActionsProps {
  firmId: string
}

export function PropertiesClientActions({ firmId }: PropertiesClientActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [buildingName, setBuildingName] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [postcode, setPostcode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    setOpen(false)
    setBuildingName('')
    setAddressLine1('')
    setAddressLine2('')
    setCity('')
    setPostcode('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingName: buildingName || undefined,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city: city || undefined,
          postcode,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to create property')
      }

      handleClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Add Property
      </Button>

      <Modal open={open} onClose={handleClose} title="Add Property">
        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} dismissible onDismiss={() => setError(null)} />
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Building Name"
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            placeholder="e.g. Park View Apartments"
          />
          <Input
            label="Address Line 1"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            required
            placeholder="e.g. 1–10 High Street"
          />
          <Input
            label="Address Line 2"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            placeholder="Optional"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. London"
            />
            <Input
              label="Postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              required
              placeholder="e.g. SW1A 1AA"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create Property
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
