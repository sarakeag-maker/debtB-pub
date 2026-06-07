import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { CostsClientView } from './CostsClientView'
import { formatCurrency } from '@/lib/utils'
import type { LegalCostEntry } from '@/types'

interface PageProps {
  params: { id: string }
}

export default async function CostsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const instruction = await prisma.instruction.findUnique({
    where: { id: params.id, deletedAt: null },
    select: {
      id: true,
      reference: true,
      firmId: true,
      legalCosts: {
        include: { addedBy: { select: { name: true } } },
        orderBy: { incurredAt: 'desc' },
      },
    },
  })

  if (!instruction) notFound()

  const role = session.user.role
  const isSolicitor = role === 'SOLICITOR'

  const costs: LegalCostEntry[] = instruction.legalCosts.map((c) => ({
    id: c.id,
    costType: c.costType,
    description: c.description,
    amount: Number(c.amount),
    recovered: c.recovered,
    recoveredAt: c.recoveredAt,
    incurredAt: c.incurredAt,
    addedBy: { name: c.addedBy.name },
  }))

  const totalCosts = costs.reduce((s, c) => s + c.amount, 0)
  const totalRecovered = costs.filter((c) => c.recovered).reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Legal Costs – ${instruction.reference}`}
        subtitle={`${costs.length} cost entr${costs.length !== 1 ? 'ies' : 'y'}`}
      />

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Costs</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalCosts)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recovered</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(totalRecovered)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Outstanding</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalCosts - totalRecovered)}</p>
        </div>
      </div>

      <CostsClientView
        instructionId={instruction.id}
        initialCosts={costs}
        isSolicitor={isSolicitor}
      />
    </div>
  )
}
