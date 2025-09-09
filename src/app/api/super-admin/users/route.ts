import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  email: z.string().email('Email válido requerido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['CLINIC_ADMIN', 'DENTIST', 'RECEPTIONIST']),
  organizationId: z.string().uuid('ID de organización inválido'),
})

// GET /api/super-admin/users?organizationId=xxx - Obtener usuarios de una clínica
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId es requerido' }, { status: 400 })
    }

    // Verificar que la organización existe
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Clínica no encontrada' }, { status: 404 })
    }

    // Obtener todos los usuarios de la organización
    const users = await db.user.findMany({
      where: {
        organizationId: organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
      },
      users,
      total: users.length,
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST /api/super-admin/users - Crear nuevo usuario
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createUserSchema.parse(body)

    // Verificar que la organización existe
    const organization = await db.organization.findUnique({
      where: { id: validatedData.organizationId },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Clínica no encontrada' }, { status: 404 })
    }

    // Verificar que el email no esté en uso
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 })
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Crear usuario
    const newUser = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        username: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        organizationId: validatedData.organizationId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    })

    // No devolver la contraseña
    const { password, ...userWithoutPassword } = newUser

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Usuario creado exitosamente',
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}