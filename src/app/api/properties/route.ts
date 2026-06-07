import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertRole, handleApiError } from '@/lib/permissions'
import { z } from 'zod'

const createPropertySchema = z.object({
  addressLine1: z.string().min(1, 'addressLine1 is required'),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postcode: z.string().min(1, 'postcode is required'),
  buildingName: z.string().optional().nullable(),
})

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR', 'CLIENT', 'MANAGING_AGENT')

    const role = session!.user.role
    const firmId = session!.user.firmId
    const userId = session!.user.id

    const where =
      role === 'MANAGING_AGENT'
        ? {
            firmId,
            agents: { some: { userId } },
          }
        : { firmId }

    const properties = await prisma.property.findMany({
      where,
      orderBy: { addressLine1: 'asc' },
      include: {
        units: {
          select: {
            id: true,
            instructions: {
              where: { deletedAt: null, currentStage: { not: 'RESOLVED' } },
              select: { id: true },
            },
          },
        },
      },
    })

    const data = properties.map((prop) => ({
      id: prop.id,
      firmId: prop.firmId,
      addressLine1: prop.addressLine1,
      addressLine2: prop.addressLine2,
      city: prop.city,
      postcode: prop.postcode,
      buildingName: prop.buildingName,
      createdAt: prop.createdAt,
      updatedAt: prop.updatedAt,
      unitCount: prop.units.length,
      activeInstructionCount: prop.units.reduce(
        (sum, u) => sum + u.instructions.length,
        0
      ),
    }))

    return Response.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR')

    const firmId = session!.user.firmId

    const body = await request.json()
    const input = createPropertySchema.parse(body)

    const property = await prisma.property.create({
      data: {
        firmId,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 ?? null,
        city: input.city ?? null,
        postcode: input.postcode,
        buildingName: input.buildingName ?? null,
      },
    })

    return new Response(JSON.stringify(property), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
