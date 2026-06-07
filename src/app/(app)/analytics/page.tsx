'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { SummaryStatCards } from '@/components/analytics/SummaryStatCards'
import { DebtByStageChart } from '@/components/analytics/DebtByStageChart'
import { RecoveryRateChart } from '@/components/analytics/RecoveryRateChart'
import { CostsVsRecoveredChart } from '@/components/analytics/CostsVsRecoveredChart'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { formatCurrency } from '@/lib/utils'
import type { AnalyticsData } from '@/types'

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

function defaultFrom(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  return toDateString(d)
}

function defaultTo(): string {
  return toDateString(new Date())
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(defaultTo)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && session.user.role !== 'SOLICITOR') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ from: fromDate, to: toDate })
      const res = await fetch(`/api/analytics?${params}`)
      if (!res.ok) throw new Error('Failed to load analytics')
      const json: AnalyticsData = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnalytics()
    }
  }, [fetchAnalytics, status])

  const stats = data
    ? [
        { label: 'Total Principal', value: formatCurrency(data.totalPrincipal) },
        { label: 'Interest Accrued', value: formatCurrency(data.totalInterestAccrued) },
        { label: 'Active Instructions', value: data.activeCount.toString() },
        {
          label: 'Recovery Rate',
          value: `${data.recoveryRate.toFixed(1)}%`,
          positive: data.recoveryRate >= 50,
        },
      ]
    : []

  const debtByStageData = data
    ? Object.entries(data.debtByStage).map(([stage, amount]) => ({ stage, amount }))
    : []

  // Build monthly recovery data from monthlyResolutions
  const recoveryChartData =
    data?.monthlyResolutions.map((m) => ({
      month: m.month,
      resolved: m.count,
      outstanding: data.activeCount,
    })) ?? []

  // Costs vs recovered: use a simple summary as we don't have monthly breakdown
  const costsChartData = data
    ? [
        {
          month: 'Total',
          totalCosts: data.totalLegalCosts,
          recovered: data.totalCostsRecovered,
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Firm-wide debt recovery analytics" />

      {/* Date range controls */}
      <div className="flex items-end gap-4 bg-white border border-gray-200 rounded-lg px-5 py-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            From
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            To
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Spinner size="lg" className="text-[#1e3a5f]" />
        </div>
      ) : (
        data && (
          <div className="space-y-6">
            <SummaryStatCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Debt by Stage">
                <DebtByStageChart data={debtByStageData} />
              </Card>

              <Card title="Monthly Resolutions">
                <RecoveryRateChart data={recoveryChartData} />
              </Card>
            </div>

            <Card title="Costs vs Recovered">
              <CostsVsRecoveredChart data={costsChartData} />
            </Card>

            {/* Debt by category */}
            <Card title="Debt by Category">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {Object.entries(data.debtByCategory).map(([cat, amt]) => (
                      <tr key={cat}>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                          {formatCurrency(amt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )
      )}
    </div>
  )
}
