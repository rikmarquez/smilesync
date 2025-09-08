import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      )
    }

    const organizations = await db.organization.findMany({
      include: {
        _count: {
          select: {
            users: true,
            patients: true,
            appointments: true,
            services: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(organizations)
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      )
    }

    const { 
      name, 
      email, 
      phone, 
      address, 
      plan = 'basic', 
      maxUsers = 10, 
      maxPatients = 1000,
      // Admin data
      adminName,
      adminEmail,
      adminPhone,
      adminPassword = '123456'
    } = await request.json()

    if (!name || !email || !adminName || !adminEmail) {
      return NextResponse.json(
        { error: 'Organization name, email, admin name, and admin email are required' },
        { status: 400 }
      )
    }

    // Check if organization with email already exists
    const existingOrg = await db.organization.findUnique({
      where: { email }
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization with this email already exists' },
        { status: 400 }
      )
    }

    // Check if admin email already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'A user with this admin email already exists' },
        { status: 400 }
      )
    }

    // Create organization and admin in a transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Create organization
      const organization = await tx.organization.create({
        data: {
          name,
          email,
          phone,
          address,
          plan,
          maxUsers,
          maxPatients,
          status: 'ACTIVE'
        }
      })

      // 2. Create admin user
      const hashedPassword = await hashPassword(adminPassword)
      const adminUser = await tx.user.create({
        data: {
          username: adminEmail, // Use email as username for consistency
          email: adminEmail,
          password: hashedPassword,
          name: adminName,
          phone: adminPhone,
          role: 'CLINIC_ADMIN',
          organizationId: organization.id,
          isActive: true
        }
      })

      return { organization, adminUser }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}