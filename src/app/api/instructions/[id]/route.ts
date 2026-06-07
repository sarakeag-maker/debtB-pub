import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertRole, handleApiError } from '@/lib/permissions'
import { updateInstructionSchema } from '@/lib/validations/instruction'

type Params = { params: { id: string } }

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR', 'CLIENT', 'MANAGING_AGENT')

    const role = session!.user.role
    const firmId = session!.user.firmId
    const userId = session!.user.id

    const instruction = await prisma.instruction.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
        firmId,
      },
      include: {
        stageHistories: {
          orderBy: { changedAt: 'asc' },
          include: {
            changedBy: { select: { name: true } },
          },
        },
        legalCosts: {
          include: {
            addedBy: { select: { name: true } },
          },
          orderBy: { incurredAt: 'asc' },
        },
        letters: {
          select: {
            id: true,
            stage: true,
            generatedAt: true,
            storageUrl: true,
          },
          orderBy: { generatedAt: 'desc' },
        },
      },
    })

    if (!instruction) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // MANAGING_AGENT scope check: ensure this instruction's property has agent link
    if (role === 'MANAGING_AGENT') {
      const agentLink = await prisma.propertyAgent.findFirst({
        where: {
          userId,
          property: {
            units: {
              some: { id: instruction.unitId },
            },
          },
        },
      })
      if (!agentLink) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const serialized = {
      ...instruction,
      principalAmount: instruction.principalAmount.toNumber(),
      contractualRate: instruction.contractualRate
        ? instruction.contractualRate.toNumber()
        : null,
      resolvedAmount: instruction.resolvedAmount
        ? instruction.resolvedAmount.toNumber()
        : null,
      legalCosts: instruction.legalCosts.map((c) => ({
        ...c,
        amount: c.amount.toNumber(),
      })),
    }

    return Response.json(serialized)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR')

    const firmId = session!.user.firmId

    const existing = await prisma.instruction.findFirst({
      where: { id: params.id, deletedAt: null, firmId },
    })

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const input = updateInstructionSchema.parse(body)

    const updated = await prisma.instruction.update({
      where: { id: params.id },
      data: {
        ...(input.debtType !== undefined && { debtType: input.debtType }),
        ...(input.interestType !== undefined && { interestType: input.interestType }),
        ...(input.contractualRate !== undefined && {
          contractualRate: input.contractualRate,
        }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.resolvedAmount !== undefined && {
          resolvedAmount: input.resolvedAmount,
        }),
      },
    })

    return Response.json({
      ...updated,
      principalAmount: updated.principalAmount.toNumber(),
      contractualRate: updated.contractualRate
        ? updated.contractualRate.toNumber()
        : null,
      resolvedAmount: updated.resolvedAmount
        ? updated.resolvedAmount.toNumber()
        : null,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR')

    const firmId = session!.user.firmId

    const existing = await prisma.instruction.findFirst({
      where: { id: params.id, deletedAt: null, firmId },
    })

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await prisma.instruction.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
