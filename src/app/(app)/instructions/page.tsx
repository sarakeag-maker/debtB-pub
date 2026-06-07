import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { InstructionsClientView } from './InstructionsClientView'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import type { InstructionSummary } from '@/types'
import { InstructionStage, DebtType } from '@prisma/client'

export default async function InstructionsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const firmId = session.user.firmId
  const role = session.user.role

  const rows = await prisma.instruction.findMany({
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
      legalCosts: {
        select: { amount: true, recovered: true },
      },
    },
  })

  const instructions: InstructionSummary[] = rows.map((r) => {
    const totalCosts = r.legalCosts.reduce((s, c) => s + Number(c.amount), 0)
    const totalRecovered = r.legalCosts.filter((c) => c.recovered).reduce((s, c) => s + Number(c.amount), 0)
    return {
      id: r.id,
      reference: r.reference,
      leaseholderName: r.leaseholderName,
      propertyAddress: r.propertyAddress,
      currentStage: r.currentStage,
      debtType: r.debtType,
      principalAmount: Number(r.principalAmount),
      dueFromDate: r.dueFromDate,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      totalCosts,
      totalRecovered,
    }
  })

  const actions =
    role === 'SOLICITOR' ? (
      <Link href="/instructions/new">
        <Button variant="primary" size="sm">
          <Plus className="w-4 h-4" />
          New Instruction
        </Button>
      </Link>
    ) : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instructions"
        subtitle={`${instructions.length} instruction${instructions.length !== 1 ? 's' : ''} in portfolio`}
        actions={actions}
      />
      <InstructionsClientView instructions={instructions} role={role} />
    </div>
  )
}
