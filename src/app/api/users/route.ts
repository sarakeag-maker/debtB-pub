import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertRole, handleApiError } from '@/lib/permissions'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'name is required'),
  password: z.string().min(8, 'password must be at least 8 characters'),
  role: z.nativeEnum(Role),
})

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR')

    const firmId = session!.user.firmId

    const users = await prisma.user.findMany({
      where: { firmId, active: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        firmId: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    })

    return Response.json({ data: users })
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
    const input = createUserSchema.parse(body)

    // Check for duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    })
    if (existing) {
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const passwordHash = await bcrypt.hash(input.password, 12)

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: input.role,
        firmId,
        active: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        firmId: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return new Response(JSON.stringify(user), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
