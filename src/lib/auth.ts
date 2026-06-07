import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            firmId: true,
            passwordHash: true,
            active: true,
          },
        })

        if (!user || !user.active) {
          return null
        }

        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!passwordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          firmId: user.firmId,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.role = user.role
        token.firmId = user.firmId
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId
        session.user.role = token.role
        session.user.firmId = token.firmId
      }
      return session
    },
  },
}
