import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').optional(),
  email: z.string().email('Email válido requerido').optional(),
  role: z.enum(['CLINIC_ADMIN', 'DENTIST', 'RECEPTIONIST']).optional(),
  organizationId: z.string().uuid('ID de organización inválido').optional(),
})

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
})

// GET /api/super-admin/users/[id] - Obtener usuario específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
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
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PATCH /api/super-admin/users/[id] - Actualizar usuario
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateUserSchema.parse(body)

    // Verificar que el usuario existe
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar que no es un SUPER_ADMIN (no se pueden editar entre ellos)
    if (existingUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No se pueden editar usuarios Super Admin' }, { status: 403 })
    }

    // Si se está cambiando el email, verificar que no esté en uso
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: validatedData.email },
      })

      if (emailExists) {
        return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 })
      }
    }

    // Si se está cambiando la organización, verificar que existe
    if (validatedData.organizationId) {
      const organization = await db.organization.findUnique({
        where: { id: validatedData.organizationId },
      })

      if (!organization) {
        return NextResponse.json({ error: 'Clínica no encontrada' }, { status: 404 })
      }
    }

    // Preparar datos de actualización
    const updateData: any = {}
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.role) updateData.role = validatedData.role
    if (validatedData.organizationId) updateData.organizationId = validatedData.organizationId
    
    if (validatedData.email) {
      updateData.email = validatedData.email
      updateData.username = validatedData.email // Mantener sincronizado
    }

    // Actualizar usuario
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: updateData,
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
    const { password, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Usuario actualizado exitosamente',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE /api/super-admin/users/[id] - Eliminar usuario
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario existe
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar que no es un SUPER_ADMIN
    if (existingUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No se pueden eliminar usuarios Super Admin' }, { status: 403 })
    }

    // Verificar que no sea el último CLINIC_ADMIN de la organización
    if (existingUser.role === 'CLINIC_ADMIN' && existingUser.organizationId) {
      const adminCount = await db.user.count({
        where: {
          organizationId: existingUser.organizationId,
          role: 'CLINIC_ADMIN',
        }
      })

      if (adminCount <= 1) {
        return NextResponse.json({ 
          error: 'No se puede eliminar el último administrador de la clínica' 
        }, { status: 400 })
      }
    }

    // Eliminar usuario
    await db.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Usuario eliminado exitosamente',
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}