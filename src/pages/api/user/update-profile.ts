import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const db = new Database('agent360.db')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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

    const { type, data } = req.body

    if (type === 'profile') {
      // Update profile information
      const { firstName, lastName, email, organization, number, address, state, zipCode, country, language, timezone } =
        data

      // Combine first and last name for full_name
      const fullName = `${firstName} ${lastName}`.trim()

      const updateStmt = db.prepare(`
        UPDATE users
        SET full_name = ?, email = ?, location = ?, phone_number = ?, address = ?, zip_code = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)

      updateStmt.run(fullName, email, state || '', number || '', address || '', zipCode || '', decoded.id)

      return res.status(200).json({
        message: 'Profile updated successfully',
        user: { fullName, email, location: state, phoneNumber: number, address, zipCode }
      })
    } else if (type === 'password') {
      // Change password
      const { currentPassword, newPassword } = data

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' })
      }

      // Get current user
      const userStmt = db.prepare('SELECT password FROM users WHERE id = ?')
      const user = userStmt.get(decoded.id) as any

      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' })
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12)

      // Update password
      const updateStmt = db.prepare(`
        UPDATE users
        SET password = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)

      updateStmt.run(hashedPassword, decoded.id)

      return res.status(200).json({ message: 'Password changed successfully' })
    } else if (type === 'profilePicture') {
      // Handle profile picture upload
      const { avatar } = data

      const updateStmt = db.prepare(`
        UPDATE users
        SET avatar = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)

      updateStmt.run(avatar || '', decoded.id)

      return res.status(200).json({ message: 'Profile picture updated successfully' })
    }

    return res.status(400).json({ message: 'Invalid update type' })
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
