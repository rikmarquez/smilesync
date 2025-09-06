import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { db } from './db'
import CredentialsProvider from 'next-auth/providers/credentials'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      organizationId: string
      role: UserRole
      image?: string
    }
  }
  
  interface User {
    id: string
    email: string
    name?: string
    organizationId: string
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
        password: { label: 'Password', type: 'password' },
        organizationCode: { label: 'Organization Code', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // For demo purposes, we'll create a simple auth
        // In production, you'd verify password against a hash
        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { organization: true }
        })

        if (!user) {
          // Create demo user for development
          const organization = await db.organization.findFirst({
            where: { name: { contains: 'Demo' } }
          })

          if (!organization) {
            const newOrg = await db.organization.create({
              data: {
                name: 'Demo Clinic',
                email: 'demo@smilecync.com'
              }
            })

            const newUser = await db.user.create({
              data: {
                email: credentials.email,
                name: 'Demo User',
                role: 'ADMIN',
                organizationId: newOrg.id
              }
            })

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              organizationId: newUser.organizationId,
              role: newUser.role,
              image: newUser.image
            }
          }
        }

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            organizationId: user.organizationId,
            role: user.role,
            image: user.image
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.organizationId = user.organizationId
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.organizationId = token.organizationId as string
        session.user.role = token.role as UserRole
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  }
}