import type { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ message: 'Token is required' })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as { id: number }

    // Get user by ID
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
    const user = stmt.get(decoded.id) as any

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Transform field names to match frontend types and exclude password
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      fullName: user.full_name, // Transform snake_case to camelCase
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      location: user.location,
      zone: user.zone,
      phoneNumber: user.phone_number,
      address: user.address,
      zipCode: user.zip_code,
      avatar: user.avatar,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }

    return res.status(200).json({
      userData: userWithoutPassword
    })
  } catch (error) {
    console.error('Token verification error:', error)

    return res.status(401).json({ message: 'Invalid token' })
  } finally {
    db.close()
  }
}
