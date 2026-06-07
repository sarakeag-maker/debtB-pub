import { Role } from '@prisma/client'
import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      firmId: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: Role
    firmId: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId: string
    role: Role
    firmId: string
  }
}
