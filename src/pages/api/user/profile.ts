import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get user from JWT token
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '') || req.cookies?.token

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    // Verify token and get user ID
    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as { id: number }

    // Get authenticated user by ID
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get user's accounts (agents they manage)
    const accounts = await prisma.agent.findMany({
      where: { isActive: 1 },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Get recent transactions (limited to 5)
    const transactions = await prisma.transaction.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5
    })

    // Get login activity
    const loginSessions = await prisma.userLoginSession.findMany({
      where: { userId: user.id },
      orderBy: { lastActivity: 'desc' },
      take: 5
    })

    const loginActivity = loginSessions.map(session => ({
      type: 'login',
      id: session.id,
      reference: session.sessionId,
      description: `Successful login from ${session.browser || 'Unknown'} on ${session.os || 'Unknown'}`,
      created_at: session.createdAt,
      status: 'success'
    }))

    // Combine activities
    const allActivity = [
      ...transactions.map(t => ({
        type: 'transaction',
        id: t.id,
        reference: t.transactionId,
        description: `Transaction ${t.type} of TZS ${t.amount.toLocaleString()}`,
        created_at: t.timestamp,
        status: t.status
      })),
      ...loginActivity
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)

    // Mock notifications for now
    const notifications = [
      {
        id: 1,
        title: 'Welcome to Agent360',
        message: 'Your account has been successfully set up. You can now access all features.',
        isRead: false,
        actionUrl: '/pages/user-profile',
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        title: 'Commission Report Available',
        message: 'Your monthly commission report for January 2026 is now available.',
        isRead: true,
        actionUrl: '/pages/commission',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    // Get device sessions
    const deviceSessions = await prisma.userLoginSession.findMany({
      where: { userId: user.id },
      orderBy: { lastActivity: 'desc' },
      take: 10
    })

    const securitySettings = {
      twoFactorEnabled: false,
      lastPasswordChange: user.updatedAt,
      loginAlerts: true,
      trustedDevices: deviceSessions.filter(s => s.isActive === 1).length,
      recentDevices: deviceSessions
    }

    // Transform user data
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      username: user.username,
      role: user.role,
      location: user.location,
      zone: user.zone,
      phone_number: user.phoneNumber,
      address: user.address,
      zip_code: user.zipCode,
      avatar: user.avatar,
      is_active: user.isActive,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    }

    res.status(200).json({
      user: userData,
      accounts,
      activity: allActivity,
      notifications,
      securitySettings
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
