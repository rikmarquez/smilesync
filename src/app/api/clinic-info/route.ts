import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Super admins don't belong to any specific clinic
    if (session.user.role === 'SUPER_ADMIN' || !session.user.organizationId) {
      return NextResponse.json(null)
    }

    const organization = await db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        name: true,
        plan: true,
        status: true
      }
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error('Error fetching clinic info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}