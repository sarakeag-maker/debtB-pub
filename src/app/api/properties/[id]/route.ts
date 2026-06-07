import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertRole, handleApiError } from '@/lib/permissions'
import { z } from 'zod'

type Params = { params: { id: string } }

const updatePropertySchema = z.object({
  addressLine1: z.string().min(1).optional(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postcode: z.string().min(1).optional(),
  buildingName: z.string().optional().nullable(),
})

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR', 'CLIENT', 'MANAGING_AGENT')

    const role = session!.user.role
    const firmId = session!.user.firmId
    const userId = session!.user.id

    const property = await prisma.property.findFirst({
      where: { id: params.id, firmId },
      include: {
        units: {
          include: {
            instructions: {
              where: { deletedAt: null },
              select: {
                id: true,
                currentStage: true,
                principalAmount: true,
              },
            },
          },
          orderBy: { flatRef: 'asc' },
        },
        agents: {
          select: { userId: true },
        },
      },
    })

    if (!property) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // MANAGING_AGENT scope check
    if (role === 'MANAGING_AGENT') {
      const hasAccess = property.agents.some((a) => a.userId === userId)
      if (!hasAccess) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const data = {
      id: property.id,
      firmId: property.firmId,
      addressLine1: property.addressLine1,
      addressLine2: property.addressLine2,
      city: property.city,
      postcode: property.postcode,
      buildingName: property.buildingName,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      units: property.units.map((unit) => {
        const activeInstructions = unit.instructions.filter(
          (i) => i.currentStage !== 'RESOLVED'
        )
        const totalDebt = unit.instructions.reduce(
          (sum, i) => sum + i.principalAmount.toNumber(),
          0
        )
        return {
          id: unit.id,
          propertyId: unit.propertyId,
          flatRef: unit.flatRef,
          leaseholderName: unit.leaseholderName,
          leaseholderEmail: unit.leaseholderEmail,
          createdAt: unit.createdAt,
          updatedAt: unit.updatedAt,
          activeInstructionCount: activeInstructions.length,
          totalDebt,
        }
      }),
    }

    return Response.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR')

    const firmId = session!.user.firmId

    const existing = await prisma.property.findFirst({
      where: { id: params.id, firmId },
    })

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const input = updatePropertySchema.parse(body)

    const updated = await prisma.property.update({
      where: { id: params.id },
      data: {
        ...(input.addressLine1 !== undefined && { addressLine1: input.addressLine1 }),
        ...(input.addressLine2 !== undefined && { addressLine2: input.addressLine2 }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.postcode !== undefined && { postcode: input.postcode }),
        ...(input.buildingName !== undefined && { buildingName: input.buildingName }),
      },
    })

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
