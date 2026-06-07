import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertRole, handleApiError } from '@/lib/permissions'
import { calculateInterest } from '@/lib/interest'
import { generateLetterBuffer, LetterContext } from '@/lib/letterGenerator'
import { InstructionStage } from '@prisma/client'
import { z } from 'zod'

type Params = { params: { id: string } }

const letterRequestSchema = z.object({
  stage: z.nativeEnum(InstructionStage).optional(),
})

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR')

    const firmId = session!.user.firmId

    const body = await request.json()
    const input = letterRequestSchema.parse(body)

    // 1. Fetch full instruction with unit.property and firm
    const instruction = await prisma.instruction.findFirst({
      where: { id: params.id, deletedAt: null, firmId },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
        firm: true,
      },
    })

    if (!instruction) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const stage = input.stage ?? instruction.currentStage

    // 2. Fetch legal costs totals
    const costs = await prisma.legalCost.findMany({
      where: { instructionId: params.id },
      select: { amount: true },
    })
    const totalCosts = costs.reduce((sum, c) => sum + c.amount.toNumber(), 0)

    // 3. Calculate interest
    const principal = instruction.principalAmount.toNumber()
    const interestResult = calculateInterest({
      principalAmount: principal,
      dueFromDate: instruction.dueFromDate,
      interestType: instruction.interestType as 'STATUTORY' | 'CONTRACTUAL',
      contractualRate: instruction.contractualRate
        ? instruction.contractualRate.toNumber()
        : null,
    })

    // 4. Build LetterContext and generate letter buffer
    // LetterContext uses flat fields: principal, interest, total, totalCosts
    const ctx: LetterContext = {
      reference: instruction.reference,
      stage,
      leaseholderName: instruction.leaseholderName,
      propertyAddress: instruction.propertyAddress,
      flatRef: instruction.unit.flatRef,
      firmName: instruction.firm.name,
      firmAddress: instruction.firm.address ?? '',
      firmPhone: instruction.firm.phone ?? '',
      firmEmail: instruction.firm.email ?? '',
      principal,
      interest: interestResult.interest,
      total: interestResult.total,
      totalCosts,
      date: new Date(),
    }

    const buffer = await generateLetterBuffer(ctx)

    // 5. Create GeneratedLetter record
    await prisma.generatedLetter.create({
      data: {
        instructionId: params.id,
        stage,
        fileData: buffer,
      },
    })

    // 6. Return binary response
    const filename = `${instruction.reference}-${stage}.docx`

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
