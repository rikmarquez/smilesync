import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if service exists and belongs to user's organization
    const service = await db.service.findFirst({
      where: {
        id: id,
        organizationId: session.user.organizationId
      },
      include: {
        _count: {
          select: { appointments: true }
        }
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      )
    }

    // Check if service has appointments
    if (service._count.appointments > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un servicio que tiene citas asociadas' },
        { status: 409 }
      )
    }

    await db.service.delete({
      where: {
        id: id
      }
    })

    return NextResponse.json({ message: 'Servicio eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}