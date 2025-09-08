import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateDentistSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['DENTIST', 'ADMIN', 'RECEPTIONIST']).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Solo admins pueden ver dentistas
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const dentist = await db.user.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId
      }
    })

    if (!dentist) {
      return NextResponse.json({ error: 'Dentist not found' }, { status: 404 })
    }

    return NextResponse.json(dentist)
  } catch (error) {
    console.error('Error fetching dentist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Solo admins pueden editar dentistas
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateDentistSchema.parse(body)

    // Verificar que el dentista existe y pertenece a la organización
    const existingDentist = await db.user.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId
      }
    })

    if (!existingDentist) {
      return NextResponse.json({ error: 'Dentist not found' }, { status: 404 })
    }

    // Si se está cambiando el email, verificar que no exista otro usuario con ese email
    if (validatedData.email && validatedData.email !== existingDentist.email) {
      const emailExists = await db.user.findUnique({
        where: { email: validatedData.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Un usuario con este email ya existe' },
          { status: 409 }
        )
      }
    }

    const updatedDentist = await db.user.update({
      where: { id: params.id },
      data: validatedData
    })

    return NextResponse.json(updatedDentist)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating dentist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Solo admins pueden eliminar dentistas
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verificar que el dentista existe y pertenece a la organización
    const existingDentist = await db.user.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId
      },
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    if (!existingDentist) {
      return NextResponse.json({ error: 'Dentist not found' }, { status: 404 })
    }

    // Verificar si tiene citas asignadas
    if (existingDentist._count.appointments > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un dentista con citas asignadas' },
        { status: 400 }
      )
    }

    await db.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Dentist deleted successfully' })
  } catch (error) {
    console.error('Error deleting dentist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}