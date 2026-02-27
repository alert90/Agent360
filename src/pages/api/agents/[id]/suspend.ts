import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = new Database('agent360.db')

  try {
    if (req.method === 'POST') {
      // Verify JWT token
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' })
      }

      const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as any
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id) as any

      if (!user) {
        return res.status(401).json({ message: 'User not found' })
      }

      const { id } = req.query
      if (!id) {
        return res.status(400).json({ message: 'Agent ID is required' })
      }

      const { reason } = req.body

      if (!reason || !reason.trim()) {
        return res.status(400).json({ message: 'Suspension reason is required' })
      }

      // Check if agent exists and user has permission (only admin and analyst can suspend)
      const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' })
      }

      // Apply role-based access control for suspension
      if (user.role === 'admin' || user.role === 'analyst') {
        // User can suspend any agent
      } else {
        return res.status(403).json({ message: 'Access denied. Only admin and analyst can suspend agents.' })
      }

      // Create suspension record
      const suspensionQuery = `
        INSERT INTO agent_suspensions (
          agent_id,
          suspended_by_user_id,
          reason,
          status,
          created_at,
          approved_at,
          approved_by_user_id
        ) VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, NULL, NULL)
      `

      db.prepare(suspensionQuery).run(
        id,
        decoded.id, // suspended_by_user_id
        reason,
        'pending' // status
      )

      res.status(200).json({
        success: true,
        message: 'Agent suspension request submitted successfully. Awaiting analyst approval.',
        data: {
          suspension_id: db.lastInsertRowid,
          agent_id: id,
          status: 'pending',
          reason: reason,
          created_at: new Date().toISOString()
        }
      })
    } else {
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Agent suspend API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process suspension request',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
