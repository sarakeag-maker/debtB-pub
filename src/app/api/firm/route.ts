import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertRole, handleApiError } from '@/lib/permissions'
import { z } from 'zod'

const updateFirmSchema = z.object({
  name: z.string().min(1, 'name is required').optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
})

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR', 'CLIENT', 'MANAGING_AGENT')

    const firmId = session!.user.firmId

    const firm = await prisma.firm.findUnique({
      where: { id: firmId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!firm) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return Response.json(firm)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR')

    const firmId = session!.user.firmId

    const body = await request.json()
    const input = updateFirmSchema.parse(body)

    const updated = await prisma.firm.update({
      where: { id: firmId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.email !== undefined && { email: input.email }),
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
