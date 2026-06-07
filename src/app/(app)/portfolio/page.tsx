import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { SummaryStatCards } from '@/components/analytics/SummaryStatCards'
import { DebtByStageChart } from '@/components/analytics/DebtByStageChart'
import { formatCurrency } from '@/lib/utils'
import { calculateInterest } from '@/lib/interest'
import { InstructionStage } from '@prisma/client'

export default async function PortfolioPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const firmId = session.user.firmId

  const [instructions, properties] = await Promise.all([
    prisma.instruction.findMany({
      where: { firmId, deletedAt: null },
      select: {
        id: true,
        currentStage: true,
        principalAmount: true,
        dueFromDate: true,
        interestType: true,
        contractualRate: true,
        unit: {
          select: {
            propertyId: true,
            property: {
              select: {
                id: true,
                buildingName: true,
                addressLine1: true,
                city: true,
                postcode: true,
              },
            },
          },
        },
      },
    }),
    prisma.property.findMany({
      where: { firmId },
      include: {
        _count: { select: { units: true } },
      },
    }),
  ])

  let totalPrincipal = 0
  let totalInterest = 0
  const debtByStage: Record<string, number> = {}
  let resolvedCount = 0
  const propertyDebt: Record<string, number> = {}
  const propertyActive: Record<string, number> = {}

  for (const inst of instructions) {
    const principal = Number(inst.principalAmount)
    const result = calculateInterest({
      principalAmount: principal,
      dueFromDate: inst.dueFromDate,
      interestType: inst.interestType as 'STATUTORY' | 'CONTRACTUAL',
      contractualRate: inst.contractualRate ? Number(inst.contractualRate) : null,
    })

    totalPrincipal += principal
    totalInterest += result.interest

    const stage = inst.currentStage as string
    debtByStage[stage] = (debtByStage[stage] ?? 0) + principal

    if (inst.currentStage === InstructionStage.RESOLVED) {
      resolvedCount++
    }

    const propId = inst.unit.propertyId
    propertyDebt[propId] = (propertyDebt[propId] ?? 0) + principal
    if (inst.currentStage !== InstructionStage.RESOLVED) {
      propertyActive[propId] = (propertyActive[propId] ?? 0) + 1
    }
  }

  const recoveryRate = instructions.length > 0
    ? ((resolvedCount / instructions.length) * 100).toFixed(1)
    : '0.0'

  const stats = [
    { label: 'Total Outstanding', value: formatCurrency(totalPrincipal + totalInterest) },
    { label: 'Principal', value: formatCurrency(totalPrincipal) },
    { label: 'Interest Accrued', value: formatCurrency(totalInterest) },
    { label: 'Recovery Rate', value: `${recoveryRate}%` },
  ]

  const chartData = Object.entries(debtByStage).map(([stage, amount]) => ({ stage, amount }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio Overview"
        subtitle="Your debt recovery portfolio at a glance"
      />

      <SummaryStatCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Debt by Stage">
          <DebtByStageChart data={chartData} />
        </Card>

        <Card title="Properties">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Property', 'Units', 'Active', 'Total Debt'].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {properties.map((prop) => {
                  const name = prop.buildingName ?? prop.addressLine1
                  const debt = propertyDebt[prop.id] ?? 0
                  const active = propertyActive[prop.id] ?? 0
                  return (
                    <tr key={prop.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2">
                        <p className="text-sm font-medium text-gray-900">{name}</p>
                        <p className="text-xs text-gray-500">{prop.postcode}</p>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">{prop._count.units}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">{active}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-900">
                        {formatCurrency(debt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
