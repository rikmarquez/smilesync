import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createPatientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  phone: z.string().min(1),
  birthDate: z.string().optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: any = {
      organizationId: session.user.organizationId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ]
    }

    const patients = await db.patient.findMany({
      where,
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    return NextResponse.json(patients)
  } catch (error) {
    console.error('Error fetching patients:', error)
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

    const body = await request.json()
    const validatedData = createPatientSchema.parse(body)

    // Check if patient with same phone already exists in organization
    const existingPatient = await db.patient.findFirst({
      where: {
        phone: validatedData.phone,
        organizationId: session.user.organizationId
      }
    })

    if (existingPatient) {
      return NextResponse.json(
        { error: 'Patient with this phone number already exists' },
        { status: 409 }
      )
    }

    const patient = await db.patient.create({
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone,
        birthDate: validatedData.birthDate && validatedData.birthDate !== '' ? new Date(validatedData.birthDate) : null,
        address: validatedData.address || null,
        organizationId: session.user.organizationId
      }
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}