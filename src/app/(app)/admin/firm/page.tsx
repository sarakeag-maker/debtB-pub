'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'

interface FirmData {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  email?: string | null
}

export default function AdminFirmPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [firm, setFirm] = useState<FirmData | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && session.user.role !== 'SOLICITOR') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/firm')
      .then((r) => r.json())
      .then((data: FirmData) => {
        setFirm(data)
        setName(data.name ?? '')
        setAddress(data.address ?? '')
        setPhone(data.phone ?? '')
        setEmail(data.email ?? '')
      })
      .catch(() => setError('Failed to load firm details'))
      .finally(() => setLoading(false))
  }, [status])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const res = await fetch('/api/firm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address: address || null,
          phone: phone || null,
          email: email || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to save changes')
      }

      setSuccess('Firm details saved successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Spinner size="lg" className="text-[#1e3a5f]" />
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Firm Settings" subtitle="Manage your firm's profile information" />

      <Card>
        {error && (
          <div className="mb-5">
            <Alert type="error" message={error} dismissible onDismiss={() => setError(null)} />
          </div>
        )}
        {success && (
          <div className="mb-5">
            <Alert type="success" message={success} dismissible onDismiss={() => setSuccess(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Firm Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Harrison & Partners"
          />
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address"
          />
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+44 20 1234 5678"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@firm.co.uk"
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
