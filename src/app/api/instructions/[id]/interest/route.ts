import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertRole, handleApiError } from '@/lib/permissions'
import { calculateInterest } from '@/lib/interest'

type Params = { params: { id: string } }

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR', 'CLIENT')

    const firmId = session!.user.firmId

    const instruction = await prisma.instruction.findFirst({
      where: { id: params.id, deletedAt: null, firmId },
    })

    if (!instruction) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const interestResult = calculateInterest({
      principalAmount: instruction.principalAmount.toNumber(),
      dueFromDate: instruction.dueFromDate,
      interestType: instruction.interestType as 'STATUTORY' | 'CONTRACTUAL',
      contractualRate: instruction.contractualRate
        ? instruction.contractualRate.toNumber()
        : null,
    })

    return Response.json(interestResult)
  } catch (error) {
    return handleApiError(error)
  }
}
