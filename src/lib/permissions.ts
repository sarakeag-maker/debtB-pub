import { Session } from 'next-auth'
import { Role } from '@prisma/client'
import { ZodError } from 'zod'

/**
 * Asserts that the current session is authenticated and that the user holds
 * at least one of the allowed roles.
 *
 * @throws Error('UNAUTHENTICATED') if there is no valid session.
 * @throws Error('FORBIDDEN')       if the user's role is not in the allowed list.
 */
export function assertRole(
  session: Session | null | undefined,
  ...allowed: Role[]
): void {
  if (!session?.user) {
    throw new Error('UNAUTHENTICATED')
  }

  if (!allowed.includes(session.user.role as Role)) {
    throw new Error('FORBIDDEN')
  }
}

/**
 * Returns true if the session user has the SOLICITOR role.
 */
export function isSolicitor(session: Session | null | undefined): boolean {
  return session?.user?.role === Role.SOLICITOR
}

/**
 * Returns true if the session user has the CLIENT role.
 */
export function isClient(session: Session | null | undefined): boolean {
  return session?.user?.role === Role.CLIENT
}

/**
 * Returns true if the session user has the MANAGING_AGENT role.
 */
export function isManagingAgent(session: Session | null | undefined): boolean {
  return session?.user?.role === Role.MANAGING_AGENT
}

/**
 * Maps a caught error to an appropriate HTTP Response.
 *
 * - UNAUTHENTICATED → 401
 * - FORBIDDEN       → 403
 * - ZodError        → 400 with validation message(s)
 * - Everything else → 500
 */
export function handleApiError(error: unknown): Response {
  if (error instanceof Error) {
    if (error.message === 'UNAUTHENTICATED') {
      return new Response(JSON.stringify({ error: 'Unauthenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (error.message === 'FORBIDDEN') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  if (error instanceof ZodError) {
    const message = error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ')

    return new Response(
      JSON.stringify({ error: 'Validation error', details: message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  console.error('[API Error]', error)

  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
