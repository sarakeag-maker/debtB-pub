import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StageBadge } from '@/components/instructions/StageBadge'
import { StageTimeline } from '@/components/instructions/StageTimeline'
import { LetterGeneratorPanel } from '@/components/letters/LetterGeneratorPanel'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { calculateInterest } from '@/lib/interest'
import { ArrowRight, DollarSign, FileText, Clock } from 'lucide-react'
import type { StageHistoryEntry, LegalCostEntry, LetterEntry } from '@/types'

interface PageProps {
  params: { id: string }
}

const DEBT_CATEGORY_LABELS: Record<string, string> = {
  SERVICE_CHARGE: 'Service Charge',
  GROUND_RENT: 'Ground Rent',
  ADMINISTRATION_CHARGE: 'Administration Charge',
  INSURANCE_CONTRIBUTION: 'Insurance Contribution',
  OTHER: 'Other',
}

export default async function InstructionDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const instruction = await prisma.instruction.findUnique({
    where: { id: params.id, deletedAt: null },
    include: {
      stageHistories: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { changedAt: 'desc' },
      },
      legalCosts: {
        include: { addedBy: { select: { name: true } } },
        orderBy: { incurredAt: 'desc' },
      },
      letters: {
        orderBy: { generatedAt: 'desc' },
      },
    },
  })

  if (!instruction) notFound()

  const role = session.user.role
  const isSolicitor = role === 'SOLICITOR'

  const principal = Number(instruction.principalAmount)
  const interestResult = calculateInterest({
    principalAmount: principal,
    dueFromDate: instruction.dueFromDate,
    interestType: instruction.interestType as 'STATUTORY' | 'CONTRACTUAL',
    contractualRate: instruction.contractualRate ? Number(instruction.contractualRate) : null,
  })

  const stageHistory: StageHistoryEntry[] = instruction.stageHistories.map((h) => ({
    id: h.id,
    fromStage: h.fromStage,
    toStage: h.toStage,
    changedBy: { name: h.changedBy.name },
    notes: h.notes,
    changedAt: h.changedAt,
  }))

  const recentCosts: LegalCostEntry[] = instruction.legalCosts.slice(0, 3).map((c) => ({
    id: c.id,
    costType: c.costType,
    description: c.description,
    amount: Number(c.amount),
    recovered: c.recovered,
    recoveredAt: c.recoveredAt,
    incurredAt: c.incurredAt,
    addedBy: { name: c.addedBy.name },
  }))

  const totalCosts = instruction.legalCosts.reduce((s, c) => s + Number(c.amount), 0)
  const totalRecovered = instruction.legalCosts.filter((c) => c.recovered).reduce((s, c) => s + Number(c.amount), 0)

  const letters: LetterEntry[] = instruction.letters.map((l) => ({
    id: l.id,
    stage: l.stage,
    generatedAt: l.generatedAt,
    storageUrl: l.storageUrl,
  }))

  const advanceActions = isSolicitor && instruction.currentStage !== 'RESOLVED' ? (
    <Link href={`/instructions/${instruction.id}/advance`}>
      <Button variant="primary" size="sm">
        <ArrowRight className="w-4 h-4" />
        Advance Stage
      </Button>
    </Link>
  ) : null

  return (
    <div className="space-y-6">
      <PageHeader
        title={instruction.reference}
        subtitle={`${instruction.propertyAddress} — ${instruction.leaseholderName}`}
        actions={advanceActions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Instruction metadata */}
          <Card title="Instruction Details">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Property</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{instruction.propertyAddress}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Leaseholder</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{instruction.leaseholderName}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Principal Amount</dt>
                <dd className="text-sm font-semibold text-gray-900 mt-0.5">{formatCurrency(principal)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Debt Type</dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {instruction.debtType === 'UNDISPUTED' ? 'Undisputed' : 'Disputed'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Debt Category</dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {DEBT_CATEGORY_LABELS[instruction.debtCategory] ?? instruction.debtCategory}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Created</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{formatDate(instruction.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          {/* Interest summary */}
          <Card title="Interest Summary">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Principal</dt>
                <dd className="text-sm font-semibold text-gray-900 mt-0.5">{formatCurrency(principal)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Rate ({instruction.interestType === 'STATUTORY' ? 'Statutory' : 'Contractual'})
                </dt>
                <dd className="text-sm font-semibold text-gray-900 mt-0.5">
                  {(interestResult.rate * 100).toFixed(2)}% p.a.
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Days Elapsed</dt>
                <dd className="text-sm font-semibold text-gray-900 mt-0.5">{interestResult.days}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Interest to Date</dt>
                <dd className="text-sm font-semibold text-blue-700 mt-0.5">{formatCurrency(interestResult.interest)}</dd>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Total Outstanding</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(interestResult.total)}</span>
            </div>
          </Card>

          {/* Stage timeline */}
          <Card title="Stage History">
            <StageTimeline history={stageHistory} />
          </Card>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">
          {/* Current stage */}
          <Card title="Current Stage">
            <div className="flex flex-col gap-3">
              <StageBadge stage={instruction.currentStage} />
              {instruction.resolvedAt && (
                <p className="text-xs text-gray-500">
                  Resolved on {formatDate(instruction.resolvedAt)}
                  {instruction.resolvedAmount && (
                    <> — {formatCurrency(Number(instruction.resolvedAmount))}</>
                  )}
                </p>
              )}
            </div>
          </Card>

          {/* Costs summary */}
          <Card
            title="Legal Costs"
            actions={
              <Link
                href={`/instructions/${instruction.id}/costs`}
                className="text-xs text-[#1e3a5f] hover:underline"
              >
                View all
              </Link>
            }
          >
            {recentCosts.length === 0 ? (
              <p className="text-sm text-gray-500">No costs recorded.</p>
            ) : (
              <div className="space-y-2">
                {recentCosts.map((cost) => (
                  <div key={cost.id} className="flex justify-between items-start text-sm">
                    <span className="text-gray-600 truncate max-w-[140px]">{cost.description}</span>
                    <span className="font-medium text-gray-900 ml-2 flex-shrink-0">
                      {formatCurrency(cost.amount)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100 flex justify-between text-sm">
                  <span className="text-gray-500">Total costs</span>
                  <span className="font-semibold">{formatCurrency(totalCosts)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Recovered</span>
                  <span className="font-semibold text-green-700">{formatCurrency(totalRecovered)}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Letter generator */}
          <Card title="Letters">
            <LetterGeneratorPanel
              instructionId={instruction.id}
              currentStage={instruction.currentStage}
              letters={letters.map((l) => ({
                id: l.id,
                stage: l.stage as string,
                generatedAt: l.generatedAt instanceof Date
                  ? l.generatedAt.toISOString()
                  : String(l.generatedAt),
              }))}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
