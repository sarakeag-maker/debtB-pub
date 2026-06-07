import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertRole, handleApiError } from '@/lib/permissions'
import { createLegalCostSchema } from '@/lib/validations/instruction'

// Note: cost updates (PUT) go through /api/instructions/[id]/costs/[costId]

type Params = { params: { id: string } }

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR', 'CLIENT')

    const role = session!.user.role
    const firmId = session!.user.firmId

    // MANAGING_AGENT is not allowed
    if (role === 'MANAGING_AGENT') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const instruction = await prisma.instruction.findFirst({
      where: { id: params.id, deletedAt: null, firmId },
    })

    if (!instruction) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const costs = await prisma.legalCost.findMany({
      where: { instructionId: params.id },
      include: {
        addedBy: { select: { name: true } },
      },
      orderBy: { incurredAt: 'asc' },
    })

    const totalCosts = costs.reduce((sum, c) => sum + c.amount.toNumber(), 0)
    const totalRecovered = costs
      .filter((c) => c.recovered)
      .reduce((sum, c) => sum + c.amount.toNumber(), 0)

    // CLIENT only gets totals
    if (role === 'CLIENT') {
      return Response.json({ totalCosts, totalRecovered })
    }

    // SOLICITOR gets full list + totals
    return Response.json({
      costs: costs.map((c) => ({
        ...c,
        amount: c.amount.toNumber(),
      })),
      totalCosts,
      totalRecovered,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR')

    const firmId = session!.user.firmId
    const userId = session!.user.id

    const instruction = await prisma.instruction.findFirst({
      where: { id: params.id, deletedAt: null, firmId },
    })

    if (!instruction) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const input = createLegalCostSchema.parse(body)

    const cost = await prisma.legalCost.create({
      data: {
        instructionId: params.id,
        addedById: userId,
        costType: input.costType,
        description: input.description,
        amount: input.amount,
        incurredAt: input.incurredAt ? new Date(input.incurredAt) : new Date(),
      },
      include: {
        addedBy: { select: { name: true } },
      },
    })

    return new Response(
      JSON.stringify({
        ...cost,
        amount: cost.amount.toNumber(),
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
