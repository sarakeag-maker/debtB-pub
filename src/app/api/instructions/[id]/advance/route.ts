import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertRole, handleApiError } from '@/lib/permissions'
import { STAGE_ORDER } from '@/lib/interest'
import { z } from 'zod'

type Params = { params: { id: string } }

const advanceSchema = z.object({
  notes: z.string().optional().nullable(),
  resolvedAmount: z.number().nonnegative().optional().nullable(),
})

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

    const currentIdx = STAGE_ORDER.indexOf(instruction.currentStage)

    if (currentIdx === STAGE_ORDER.length - 1) {
      // Already at RESOLVED
      return new Response(
        JSON.stringify({ error: 'Instruction is already at the final stage (RESOLVED)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const nextStage = STAGE_ORDER[currentIdx + 1]

    const body = await request.json()
    const input = advanceSchema.parse(body)

    // If advancing to RESOLVED, resolvedAmount is required
    if (nextStage === 'RESOLVED') {
      if (input.resolvedAmount == null) {
        return new Response(
          JSON.stringify({ error: 'resolvedAmount is required when advancing to RESOLVED' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        currentStage: nextStage,
      }

      if (nextStage === 'RESOLVED') {
        updateData.resolvedAt = new Date()
        updateData.resolvedAmount = input.resolvedAmount
      }

      const updatedInstruction = await tx.instruction.update({
        where: { id: params.id },
        data: updateData,
      })

      await tx.stageHistory.create({
        data: {
          instructionId: params.id,
          fromStage: instruction.currentStage,
          toStage: nextStage,
          changedById: userId,
          notes: input.notes ?? null,
        },
      })

      return updatedInstruction
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
