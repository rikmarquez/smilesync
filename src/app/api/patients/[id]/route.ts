import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updatePatientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(1).optional(),
  birthDate: z.string().datetime().optional().nullable(),
  address: z.string().optional().nullable()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const patient = await db.patient.findFirst({
      where: {
        id: id,
        organizationId: session.user.organizationId
      },
      include: {
        appointments: {
          include: {
            dentist: {
              select: { id: true, name: true, email: true }
            },
            service: true
          },
          orderBy: {
            startTime: 'desc'
          }
        }
      }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updatePatientSchema.parse(body)

    // Check if patient exists and belongs to user's organization
    const existingPatient = await db.patient.findFirst({
      where: {
        id: id,
        organizationId: session.user.organizationId
      }
    })

    if (!existingPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // If updating phone, check for conflicts
    if (validatedData.phone && validatedData.phone !== existingPatient.phone) {
      const conflictingPatient = await db.patient.findFirst({
        where: {
          phone: validatedData.phone,
          organizationId: session.user.organizationId,
          id: { not: id }
        }
      })

      if (conflictingPatient) {
        return NextResponse.json(
          { error: 'Another patient with this phone number already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.email !== undefined) updateData.email = validatedData.email
    if (validatedData.phone) updateData.phone = validatedData.phone
    if (validatedData.birthDate !== undefined) {
      updateData.birthDate = validatedData.birthDate ? new Date(validatedData.birthDate) : null
    }
    if (validatedData.address !== undefined) updateData.address = validatedData.address

    const patient = await db.patient.update({
      where: { id: id },
      data: updateData
    })

    return NextResponse.json(patient)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const patient = await db.patient.findFirst({
      where: {
        id: id,
        organizationId: session.user.organizationId
      }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    await db.patient.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}