import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertRole, handleApiError } from '@/lib/permissions'
import { updateLegalCostSchema } from '@/lib/validations/instruction'

type Params = { params: { id: string; costId: string } }

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR')

    const firmId = session!.user.firmId

    // Verify the instruction exists and belongs to this firm
    const instruction = await prisma.instruction.findFirst({
      where: { id: params.id, deletedAt: null, firmId },
    })

    if (!instruction) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify the cost belongs to this instruction
    const existingCost = await prisma.legalCost.findFirst({
      where: { id: params.costId, instructionId: params.id },
    })

    if (!existingCost) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const input = updateLegalCostSchema.parse(body)

    // If recovered changes to true and recoveredAt not already set, use now
    let recoveredAt: Date | null | undefined = undefined
    if (input.recovered === true && !existingCost.recovered) {
      recoveredAt = input.recoveredAt ? new Date(input.recoveredAt) : new Date()
    } else if (input.recoveredAt !== undefined) {
      recoveredAt = input.recoveredAt ? new Date(input.recoveredAt) : null
    }

    const updated = await prisma.legalCost.update({
      where: { id: params.costId },
      data: {
        ...(input.description !== undefined && { description: input.description }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.recovered !== undefined && { recovered: input.recovered }),
        ...(recoveredAt !== undefined && { recoveredAt }),
      },
      include: {
        addedBy: { select: { name: true } },
      },
    })

    return Response.json({
      ...updated,
      amount: updated.amount.toNumber(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
