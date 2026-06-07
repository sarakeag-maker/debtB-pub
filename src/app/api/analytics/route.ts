import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertRole, handleApiError } from '@/lib/permissions'
import { calculateInterest } from '@/lib/interest'
import { InstructionStage } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR', 'CLIENT')

    const role = session!.user.role
    const firmId = session!.user.firmId

    const { searchParams } = new URL(request.url)

    const now = new Date()
    const oneYearAgo = new Date(now)
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const from = searchParams.get('from')
      ? new Date(searchParams.get('from')!)
      : oneYearAgo
    const to = searchParams.get('to')
      ? new Date(searchParams.get('to')!)
      : now

    // Fetch all non-deleted instructions for this firm within the date range
    const instructions = await prisma.instruction.findMany({
      where: {
        firmId,
        deletedAt: null,
        createdAt: { gte: from, lte: to },
      },
      include: {
        legalCosts: {
          select: { amount: true, recovered: true },
        },
      },
    })

    // --- debtByStage and instructionCountByStage ---
    const debtByStage: Record<string, number> = {}
    const instructionCountByStage: Record<string, number> = {}

    for (const stage of Object.values(InstructionStage)) {
      debtByStage[stage] = 0
      instructionCountByStage[stage] = 0
    }

    let totalPrincipal = 0
    let totalInterestAccrued = 0
    let resolvedCount = 0
    let activeCount = 0
    const debtByCategory: Record<string, number> = {}

    for (const instr of instructions) {
      const principal = instr.principalAmount.toNumber()
      const stage = instr.currentStage

      debtByStage[stage] = (debtByStage[stage] ?? 0) + principal
      instructionCountByStage[stage] = (instructionCountByStage[stage] ?? 0) + 1

      if (stage !== 'RESOLVED') {
        totalPrincipal += principal

        const interestResult = calculateInterest({
          principalAmount: principal,
          dueFromDate: instr.dueFromDate,
          interestType: instr.interestType as 'STATUTORY' | 'CONTRACTUAL',
          contractualRate: instr.contractualRate
            ? instr.contractualRate.toNumber()
            : null,
        })
        totalInterestAccrued += interestResult.interest

        activeCount++
      } else {
        resolvedCount++
      }

      // debtByCategory (all instructions)
      const cat = instr.debtCategory
      debtByCategory[cat] = (debtByCategory[cat] ?? 0) + principal
    }

    // --- Legal costs ---
    // Fetch all legal costs for the firm in the period (not limited to instruction date range)
    const allCosts = await prisma.legalCost.findMany({
      where: {
        instruction: {
          firmId,
          deletedAt: null,
        },
      },
      select: { amount: true, recovered: true },
    })

    const totalLegalCosts = allCosts.reduce(
      (sum, c) => sum + c.amount.toNumber(),
      0
    )
    const totalCostsRecovered = allCosts
      .filter((c) => c.recovered)
      .reduce((sum, c) => sum + c.amount.toNumber(), 0)

    const recoveryRate =
      totalLegalCosts > 0 ? totalCostsRecovered / totalLegalCosts : 0

    // --- monthlyResolutions ---
    const resolvedInstructions = await prisma.instruction.findMany({
      where: {
        firmId,
        deletedAt: null,
        currentStage: 'RESOLVED',
        resolvedAt: { not: null, gte: from, lte: to },
      },
      select: {
        resolvedAt: true,
        resolvedAmount: true,
      },
    })

    const monthlyMap: Record<string, { count: number; amountRecovered: number }> = {}

    for (const instr of resolvedInstructions) {
      if (!instr.resolvedAt) continue
      const month = instr.resolvedAt.toISOString().slice(0, 7) // YYYY-MM
      if (!monthlyMap[month]) {
        monthlyMap[month] = { count: 0, amountRecovered: 0 }
      }
      monthlyMap[month].count++
      monthlyMap[month].amountRecovered +=
        instr.resolvedAmount ? instr.resolvedAmount.toNumber() : 0
    }

    const monthlyResolutions = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, val]) => ({ month, ...val }))

    // Build response — CLIENT omits cost detail
    const response =
      role === 'CLIENT'
        ? {
            debtByStage,
            instructionCountByStage,
            totalPrincipal,
            totalInterestAccrued,
            totalLegalCosts: null,
            totalCostsRecovered: null,
            recoveryRate: null,
            resolvedCount,
            activeCount,
            debtByCategory,
            monthlyResolutions,
          }
        : {
            debtByStage,
            instructionCountByStage,
            totalPrincipal,
            totalInterestAccrued,
            totalLegalCosts,
            totalCostsRecovered,
            recoveryRate,
            resolvedCount,
            activeCount,
            debtByCategory,
            monthlyResolutions,
          }

    return Response.json(response)
  } catch (error) {
    return handleApiError(error)
  }
}
