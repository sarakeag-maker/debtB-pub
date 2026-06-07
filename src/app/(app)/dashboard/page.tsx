import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { SummaryStatCards } from '@/components/analytics/SummaryStatCards'
import { DebtByStageChart } from '@/components/analytics/DebtByStageChart'
import { InstructionTable } from '@/components/instructions/InstructionTable'
import { formatCurrency } from '@/lib/utils'
import { calculateInterest } from '@/lib/interest'
import { InstructionStage } from '@prisma/client'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const role = session.user.role

  if (role === 'CLIENT') redirect('/portfolio')
  if (role === 'MANAGING_AGENT') redirect('/import')

  // SOLICITOR dashboard
  const firmId = session.user.firmId

  const [instructions, costs] = await Promise.all([
    prisma.instruction.findMany({
      where: { firmId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reference: true,
        leaseholderName: true,
        propertyAddress: true,
        currentStage: true,
        debtType: true,
        principalAmount: true,
        dueFromDate: true,
        createdAt: true,
        updatedAt: true,
        interestType: true,
        contractualRate: true,
      },
    }),
    prisma.legalCost.findMany({
      where: { instruction: { firmId } },
      select: { amount: true, recovered: true },
    }),
  ])

  // Compute KPIs
  let totalPrincipal = 0
  let totalInterest = 0
  const debtByStageMap: Record<string, number> = {}
  let resolvedCount = 0
  let activeCount = 0

  for (const inst of instructions) {
    const principal = Number(inst.principalAmount)
    totalPrincipal += principal

    const interestResult = calculateInterest({
      principalAmount: principal,
      dueFromDate: inst.dueFromDate,
      interestType: inst.interestType as 'STATUTORY' | 'CONTRACTUAL',
      contractualRate: inst.contractualRate ? Number(inst.contractualRate) : null,
    })
    totalInterest += interestResult.interest

    const stageKey = inst.currentStage as string
    debtByStageMap[stageKey] = (debtByStageMap[stageKey] ?? 0) + principal

    if (inst.currentStage === InstructionStage.RESOLVED) {
      resolvedCount++
    } else {
      activeCount++
    }
  }

  const totalCosts = costs.reduce((s, c) => s + Number(c.amount), 0)
  const totalRecovered = costs.filter((c) => c.recovered).reduce((s, c) => s + Number(c.amount), 0)
  const recoveryRate = totalPrincipal > 0 ? (resolvedCount / instructions.length) * 100 : 0

  const stats = [
    { label: 'Total Outstanding', value: formatCurrency(totalPrincipal + totalInterest) },
    { label: 'Interest Accrued', value: formatCurrency(totalInterest) },
    { label: 'Active Instructions', value: activeCount.toString() },
    { label: 'Recovery Rate', value: `${recoveryRate.toFixed(1)}%` },
  ]

  const debtByStageData = Object.entries(debtByStageMap).map(([stage, amount]) => ({
    stage,
    amount,
  }))

  // Last 5 instructions serialised
  const recentInstructions = instructions.slice(0, 5).map((inst) => ({
    id: inst.id,
    reference: inst.reference,
    leaseholderName: inst.leaseholderName,
    propertyAddress: inst.propertyAddress,
    currentStage: inst.currentStage,
    debtType: inst.debtType,
    principalAmount: Number(inst.principalAmount),
    dueFromDate: inst.dueFromDate,
    createdAt: inst.createdAt,
    updatedAt: inst.updatedAt,
    totalCosts: 0,
    totalRecovered: 0,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Overview of your debt recovery portfolio" />

      <SummaryStatCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Debt by Stage">
          <DebtByStageChart data={debtByStageData} />
        </Card>

        <Card title="Cost Recovery">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Legal Costs</span>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(totalCosts)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Costs Recovered</span>
              <span className="text-sm font-semibold text-green-700">{formatCurrency(totalRecovered)}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-gray-600">Unrecovered</span>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(totalCosts - totalRecovered)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Recent Instructions">
        <InstructionTable instructions={recentInstructions} role={role} />
      </Card>
    </div>
  )
}
