import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const organization = await db.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            patients: true,
            appointments: true,
            services: true
          }
        }
      }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status, name, email, phone, address, plan, maxUsers, maxPatients } = body

    const organization = await db.organization.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(plan && { plan }),
        ...(maxUsers && { maxUsers: parseInt(maxUsers) }),
        ...(maxPatients && { maxPatients: parseInt(maxPatients) })
      }
    })

    return NextResponse.json(organization)
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      )
    }

    const { id } = await params
    // Check if organization exists
    const organization = await db.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            patients: true,
            appointments: true,
            services: true
          }
        }
      }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Delete in transaction to ensure data consistency
    await db.$transaction(async (tx) => {
      // Delete appointments first (they reference patients, dentists, services)
      await tx.appointment.deleteMany({
        where: { organizationId: id }
      })

      // Delete patients
      await tx.patient.deleteMany({
        where: { organizationId: id }
      })

      // Delete services
      await tx.service.deleteMany({
        where: { organizationId: id }
      })

      // Delete users (including admins and dentists)
      await tx.user.deleteMany({
        where: { organizationId: id }
      })

      // Finally delete the organization
      await tx.organization.delete({
        where: { id }
      })
    })

    return NextResponse.json({ 
      message: 'Organization and all related data deleted successfully',
      deletedCounts: organization._count
    })
  } catch (error) {
    console.error('Error deleting organization:', error)
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    )
  }
}