import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'

const db = new Database('agent360.db')

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

    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as { id: number }
    const userStmt = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1')
    const user = userStmt.get(decoded.id) as any

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const { limit = 10 } = req.query

    // Get top performing agents with transaction data
    const topAgentsQuery = `
      SELECT
        a.id,
        a.name,
        a.account_number,
        a.branch_name,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COALESCE(SUM(t.commission_amount), 0) as commission_amount
      FROM agents a
      LEFT JOIN transactions t ON a.id = t.agent_id
      WHERE a.is_active = 1
      GROUP BY a.id, a.name, a.account_number, a.branch_name
      ORDER BY total_amount DESC
      LIMIT ?
    `

    const topAgents = db.prepare(topAgentsQuery).all(Number(limit))

    res.status(200).json({
      success: true,
      data: topAgents
    })
  } catch (error) {
    console.error('Top agents API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top agents',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
