import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
})

// POST /api/super-admin/users/[id]/change-password - Cambiar contraseña de usuario
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { newPassword } = changePasswordSchema.parse(body)

    // Verificar que el usuario existe
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
      }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar que no es un SUPER_ADMIN (no se pueden cambiar contraseñas entre ellos)
    if (existingUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'No se pueden cambiar contraseñas de usuarios Super Admin' 
      }, { status: 403 })
    }

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Actualizar contraseña
    await db.user.update({
      where: { id: params.id },
      data: {
        password: hashedPassword,
      },
    })

    return NextResponse.json({
      message: `Contraseña de ${existingUser.name} actualizada exitosamente`,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}