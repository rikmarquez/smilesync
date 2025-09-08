import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { db } from './db'
import CredentialsProvider from 'next-auth/providers/credentials'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      email: string
      name?: string
      organizationId: string | null
      role: UserRole
      image?: string
    }
  }
  
  interface User {
    id: string
    username: string
    email: string
    name?: string
    organizationId: string | null
    role: UserRole
    image?: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user by email
          const user = await db.user.findUnique({
            where: { email: credentials.email },
            include: { organization: true }
          })

          if (!user || !user.isActive) {
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          if (!isValidPassword) {
            return null
          }

          // Update last login
          await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          })

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            organizationId: user.organizationId,
            role: user.role,
            image: user.image
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username
        token.organizationId = user.organizationId
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.username = token.username as string
        session.user.organizationId = token.organizationId as string | null
        session.user.role = token.role as UserRole
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  }
}