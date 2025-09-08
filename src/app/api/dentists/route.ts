import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { z } from 'zod'

const createDentistSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  role: z.enum(['DENTIST', 'CLINIC_ADMIN', 'RECEPTIONIST']).default('DENTIST'),
  password: z.string().min(6).default('123456')
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Solo admins pueden ver la lista de dentistas
    if (session.user.role !== 'CLINIC_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const dentists = await db.user.findMany({
      where: {
        organizationId: session.user.organizationId,
        role: {
          in: ['DENTIST', 'CLINIC_ADMIN', 'RECEPTIONIST']
        }
      },
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(dentists)
  } catch (error) {
    console.error('Error fetching dentists:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Solo admins pueden crear dentistas
    if (session.user.role !== 'CLINIC_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createDentistSchema.parse(body)

    // Verificar que no exista un usuario con este email
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un usuario con este email ya existe' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(validatedData.password)
    
    const dentist = await db.user.create({
      data: {
        username: validatedData.email, // Use email as username
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        phone: validatedData.phone,
        role: validatedData.role,
        organizationId: session.user.organizationId,
        isActive: true
      }
    })

    return NextResponse.json(dentist, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating dentist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}