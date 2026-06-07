import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertRole, handleApiError } from '@/lib/permissions'
import { calculateInterest } from '@/lib/interest'
import { generateReference } from '@/lib/referenceGenerator'
import { createInstructionSchema } from '@/lib/validations/instruction'
import { InstructionStage, Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR', 'CLIENT', 'MANAGING_AGENT')

    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage') as InstructionStage | null
    const debtType = searchParams.get('debtType')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10))
    const skip = (page - 1) * limit

    const role = session!.user.role
    const firmId = session!.user.firmId
    const userId = session!.user.id

    // Build base where clause
    const where: Prisma.InstructionWhereInput = {
      deletedAt: null,
      firmId,
    }

    if (stage) {
      where.currentStage = stage
    }

    if (debtType) {
      where.debtType = debtType as Prisma.EnumDebtTypeFilter
    }

    if (search) {
      where.OR = [
        { leaseholderName: { contains: search, mode: 'insensitive' } },
        { propertyAddress: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ]
    }

    // MANAGING_AGENT scope: only instructions where property has agent link
    if (role === 'MANAGING_AGENT') {
      where.unit = {
        property: {
          agents: {
            some: { userId },
          },
        },
      }
    }

    const [instructions, total] = await Promise.all([
      prisma.instruction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          legalCosts: {
            select: { amount: true, recovered: true },
          },
        },
      }),
      prisma.instruction.count({ where }),
    ])

    const data = instructions.map((instr) => {
      const principal = instr.principalAmount.toNumber()
      const interestResult = calculateInterest({
        principalAmount: principal,
        dueFromDate: instr.dueFromDate,
        interestType: instr.interestType as 'STATUTORY' | 'CONTRACTUAL',
        contractualRate: instr.contractualRate ? instr.contractualRate.toNumber() : null,
      })

      const totalCosts = instr.legalCosts.reduce(
        (sum, c) => sum + c.amount.toNumber(),
        0
      )
      const totalRecovered = instr.legalCosts
        .filter((c) => c.recovered)
        .reduce((sum, c) => sum + c.amount.toNumber(), 0)

      return {
        id: instr.id,
        reference: instr.reference,
        leaseholderName: instr.leaseholderName,
        propertyAddress: instr.propertyAddress,
        currentStage: instr.currentStage,
        debtType: instr.debtType,
        debtCategory: instr.debtCategory,
        principalAmount: principal,
        dueFromDate: instr.dueFromDate,
        interestType: instr.interestType,
        contractualRate: instr.contractualRate ? instr.contractualRate.toNumber() : null,
        notes: instr.notes,
        resolvedAt: instr.resolvedAt,
        resolvedAmount: instr.resolvedAmount ? instr.resolvedAmount.toNumber() : null,
        createdAt: instr.createdAt,
        updatedAt: instr.updatedAt,
        interest: interestResult,
        totalCosts,
        totalRecovered,
      }
    })

    return Response.json({
      data,
      total,
      page,
      pageCount: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR')

    const body = await request.json()
    const input = createInstructionSchema.parse(body)

    const firmId = session!.user.firmId
    const userId = session!.user.id

    // Fetch unit with property to get leaseholder name and build address
    const unit = await prisma.unit.findUnique({
      where: { id: input.unitId },
      include: {
        property: true,
      },
    })

    if (!unit) {
      return new Response(JSON.stringify({ error: 'Unit not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Ensure unit belongs to this firm
    if (unit.property.firmId !== firmId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const prop = unit.property
    const addressParts: string[] = [prop.addressLine1]
    if (prop.city) {
      addressParts[0] = `${prop.addressLine1}, ${prop.city}`
    }
    const propertyAddress = `${addressParts[0]}, ${prop.postcode}`

    const leaseholderName = unit.leaseholderName

    const instruction = await prisma.$transaction(async (tx) => {
      const reference = await generateReference(firmId, tx as never)

      const created = await tx.instruction.create({
        data: {
          firmId,
          reference,
          unitId: input.unitId,
          debtEntryId: input.debtEntryId ?? null,
          leaseholderName,
          propertyAddress,
          principalAmount: input.principalAmount,
          debtType: input.debtType,
          debtCategory: input.debtCategory,
          dueFromDate: new Date(input.dueFromDate),
          interestType: input.interestType,
          contractualRate: input.contractualRate ?? null,
          notes: input.notes ?? null,
          currentStage: 'DEMAND_LETTER',
        },
      })

      await tx.stageHistory.create({
        data: {
          instructionId: created.id,
          fromStage: null,
          toStage: 'DEMAND_LETTER',
          changedById: userId,
          notes: 'Instruction created',
        },
      })

      return created
    })

    return new Response(
      JSON.stringify({
        ...instruction,
        principalAmount: instruction.principalAmount.toNumber(),
        contractualRate: instruction.contractualRate
          ? instruction.contractualRate.toNumber()
          : null,
        resolvedAmount: instruction.resolvedAmount
          ? instruction.resolvedAmount.toNumber()
          : null,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
