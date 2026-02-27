import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    // Get users from database
    const users = db
      .prepare(
        `
      SELECT
        id,
        email,
        username,
        full_name as fullName,
        role,
        permissions,
        location,
        zone,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users
      ORDER BY created_at DESC
    `
      )
      .all()

    // Transform data to match expected format
    const transformedUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName || 'Unknown User',
      role: user.role || 'user',
      avatar: '', // Could add avatar field later
      avatarColor: 'primary',
      currentPlan: 'basic', // Could add plan field later
      billing: 'Active', // Could add billing field later
      status: user.isActive ? 'active' : 'inactive',
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
      location: user.location || '',
      zone: user.zone || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }))

    return res.status(200).json(transformedUsers)
  } catch (error) {
    console.error('Users API error:', error)

    return res.status(500).json({
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
