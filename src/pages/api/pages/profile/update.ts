import { NextApiRequest, NextApiResponse } from 'next/types'
import jwt from 'jsonwebtoken'
import Database from 'better-sqlite3'

const db = new Database('agent360.db')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get the authenticated user from JWT token
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as {
      id: number
      email: string
      role: string
    }

    const { fullName, username, location, zone } = req.body

    // Validate input
    if (!fullName || !username) {
      return res.status(400).json({ message: 'Full name and username are required' })
    }

    // Check if username is already taken by another user
    const existingUserStmt = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?')
    const existingUser = existingUserStmt.get(username, decoded.id) as any

    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' })
    }

    // Update user profile
    const updateStmt = db.prepare(`
      UPDATE users
      SET full_name = ?, username = ?, location = ?, zone = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)

    const result = updateStmt.run(fullName, username, location || null, zone || null, decoded.id)

    if (result.changes === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Also update agent data if user is an agent
    if (decoded.role === 'agent' || decoded.role === 'super_agent' || decoded.role === 'franchise') {
      const agentUpdateStmt = db.prepare(`
        UPDATE agents
        SET name = ?, zone = ?, updated_at = CURRENT_TIMESTAMP
        WHERE account_number IN (SELECT account_number FROM agents WHERE name = ? OR account_number = ?)
      `)
      agentUpdateStmt.run(fullName, zone || null, fullName, username)
    }

    // Get updated user data
    const userStmt = db.prepare(`
      SELECT id, email, full_name, username, role, permissions, location, zone, is_active, created_at, updated_at
      FROM users
      WHERE id = ?
    `)
    const updatedUser = userStmt.get(decoded.id) as any

    // Remove sensitive data
    const { permissions: _permissions, ...userResponse } = updatedUser

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: userResponse
    })
  } catch (error) {
    console.error('Profile update error:', error)

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    return res.status(500).json({ message: 'Internal server error' })
  } finally {
    db.close()
  }
}
