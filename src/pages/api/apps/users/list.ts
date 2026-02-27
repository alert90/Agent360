import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    const { q, role, status, currentPlan } = req.query

    let query = `
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
      WHERE 1=1
    `
    const params: any[] = []

    if (q) {
      query += ` AND (full_name LIKE ? OR email LIKE ? OR username LIKE ?)`
      params.push(`%${q}%`, `%${q}%`, `%${q}%`)
    }

    if (role) {
      query += ` AND role = ?`
      params.push(role)
    }

    if (status) {
      query += ` AND is_active = ?`
      params.push(status === 'active' ? 1 : 0)
    }

    query += ` ORDER BY created_at DESC`

    const users = db.prepare(query).all(...params)

    // Transform data to match expected format
    const transformedUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName || 'Unknown User',
      role: user.role || 'user',
      avatar: '', // Could add avatar field later
      avatarColor: 'primary',
      currentPlan: 'basic', // Default since field doesn't exist yet
      billing: 'Active', // Default since field doesn't exist yet
      status: user.isActive ? 'active' : 'inactive',
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
      location: user.location || '',
      zone: user.zone || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }))

    return res.status(200).json({
      users: transformedUsers,
      allData: transformedUsers,
      total: transformedUsers.length,
      params: { q, role, status, currentPlan }
    })
  } catch (error) {
    console.error('Users list API error:', error)

    return res.status(500).json({
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
