import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertRole, handleApiError } from '@/lib/permissions'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

type Params = { params: { id: string } }

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
})

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  firmId: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR')

    const firmId = session!.user.firmId

    const user = await prisma.user.findFirst({
      where: { id: params.id, firmId },
      select: safeUserSelect,
    })

    if (!user) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return Response.json(user)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR')

    const firmId = session!.user.firmId

    const existing = await prisma.user.findFirst({
      where: { id: params.id, firmId },
    })

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const input = updateUserSchema.parse(body)

    // If email is being changed, check for conflicts
    if (input.email && input.email !== existing.email) {
      const conflict = await prisma.user.findUnique({
        where: { email: input.email },
      })
      if (conflict) {
        return new Response(
          JSON.stringify({ error: 'A user with this email already exists' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.email !== undefined) updateData.email = input.email
    if (input.role !== undefined) updateData.role = input.role
    if (input.active !== undefined) updateData.active = input.active
    if (input.password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(input.password, 12)
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: safeUserSelect,
    })

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR')

    const firmId = session!.user.firmId

    const existing = await prisma.user.findFirst({
      where: { id: params.id, firmId },
    })

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await prisma.user.update({
      where: { id: params.id },
      data: { active: false },
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
