import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'

const db = new Database('agent360.db')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get user from JWT token (same as auth/verify)
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '') || req.cookies?.token

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    // Verify token and get user ID
    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as { id: number }

    // Get authenticated user by ID
    const userStmt = db.prepare(`
      SELECT id, email, full_name, username, role, location, zone, phone_number, address, zip_code, avatar, is_active, created_at, updated_at
      FROM users
      WHERE id = ? AND is_active = 1
    `)

    const user = userStmt.get(decoded.id) as any

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get user's accounts (agents they manage)
    const accountsStmt = db.prepare(`
      SELECT id, account_number, name, type, branch_name, total_transaction_amount, transaction_count, commission_amount
      FROM agents
      WHERE is_active = 1
      ORDER BY created_at DESC
    `)

    const accounts = accountsStmt.all() as any[]

    // Get recent activity (limited to 10 items for performance)
    const activityStmt = db.prepare(`
      SELECT
        'transaction' as type,
        t.id,
        t.transaction_id as reference,
        'Transaction ' || t.type || ' of ' || printf('%.2f', t.amount) as description,
        t.timestamp as created_at,
        t.status
      FROM transactions t
      ORDER BY t.timestamp DESC
      LIMIT 5
    `)

    const transactions = activityStmt.all() as any[]

    // Get login activity (limited)
    const loginActivity = [
      {
        type: 'login',
        id: 1,
        reference: 'login_001',
        description: 'Successful login from Chrome on Windows',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'success'
      }
    ]

    // Combine limited activity
    const allActivity = [...transactions.map(t => ({ ...t, type: 'transaction' })), ...loginActivity].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Get user's notifications (mock data for now)
    const notifications = [
      {
        id: 1,
        title: 'Welcome to Agent360',
        message: 'Your account has been successfully set up. You can now access all features.',
        isRead: false,
        actionUrl: '/pages/user-profile',
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
      },
      {
        id: 2,
        title: 'Commission Report Available',
        message: 'Your monthly commission report for December 2025 is now available.',
        isRead: true,
        actionUrl: '/pages/commission',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        id: 3,
        title: 'Security Alert',
        message: 'New login detected from an unrecognized device.',
        isRead: false,
        actionUrl: '/pages/account-settings/security',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      }
    ]

    // Get user's login sessions (real device data)
    const sessionsStmt = db.prepare(`
      SELECT
        id,
        ip_address as ipAddress,
        location,
        browser,
        os,
        device_type as deviceType,
        device_name as deviceName,
        last_activity as lastActivity,
        is_active as isActive
      FROM user_login_sessions
      WHERE user_id = ?
      ORDER BY last_activity DESC
      LIMIT 10
    `)

    const deviceSessions = sessionsStmt.all(user.id) as any[]

    // Get security settings
    const securitySettings = {
      twoFactorEnabled: false,
      lastPasswordChange: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      loginAlerts: true,
      trustedDevices: deviceSessions.filter(s => s.isActive).length,
      recentDevices: deviceSessions
    }

    res.status(200).json({
      user,
      accounts: accounts.slice(0, 10), // Limit accounts
      activity: allActivity.slice(0, 10), // Limit to 10 most recent activities
      notifications: notifications.slice(0, 5), // Limit notifications
      securitySettings
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
